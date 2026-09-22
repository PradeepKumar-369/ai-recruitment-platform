from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db.models import Q
from .models import CandidateProfile, RecruiterProfile, Company, Notification

User = get_user_model()

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ('id', 'name', 'description', 'website', 'location', 'industry')

class CandidateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateProfile
        fields = ('phone', 'location', 'summary', 'experience')

class RecruiterProfileSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    company_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_website = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_location = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_description = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = RecruiterProfile
        fields = (
            'designation', 'company', 'company_id', 'company_name',
            'company_website', 'company_location', 'company_description'
        )

class UserProfileSerializer(serializers.ModelSerializer):
    candidate_profile = CandidateProfileSerializer(required=False)
    recruiter_profile = RecruiterProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ('id', 'email', 'phone_number', 'role', 'is_premium', 'first_name', 'last_name', 'candidate_profile', 'recruiter_profile')

class RegisterSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.JOB_SEEKER)
    first_name = serializers.CharField(required=False, allow_blank=True, default='')
    last_name = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        ident = attrs.get('identifier', '').strip()
        email_val = attrs.get('email', '').strip()
        phone_val = attrs.get('phone_number', '').strip()

        if not ident and not email_val and not phone_val:
            raise serializers.ValidationError("An email address or mobile number is required to register.")

        # Determine email vs phone
        final_email = email_val
        final_phone = phone_val

        if ident:
            if '@' in ident:
                final_email = ident
            else:
                final_phone = ident

        if final_email:
            if User.objects.filter(email__iexact=final_email).exists():
                raise serializers.ValidationError({"email": "A user with this email address already exists."})
        else:
            # Generate placeholder unique email if user registered with phone only
            clean_phone = final_phone.replace('+', '').replace(' ', '').replace('-', '')
            final_email = f"{clean_phone}@mobile.user"
            if User.objects.filter(email__iexact=final_email).exists():
                raise serializers.ValidationError({"phone_number": "A user with this mobile number already exists."})

        if final_phone:
            if User.objects.filter(phone_number=final_phone).exists():
                raise serializers.ValidationError({"phone_number": "A user with this mobile number already exists."})

        attrs['resolved_email'] = final_email
        attrs['resolved_phone'] = final_phone
        return attrs

    def create(self, validated_data):
        email = validated_data['resolved_email']
        phone = validated_data.get('resolved_phone', '')
        password = validated_data['password']
        role = validated_data.get('role', User.Role.JOB_SEEKER)
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')

        user = User.objects.create_user(
            email=email,
            username=email,
            phone_number=phone if phone else None,
            password=password,
            role=role,
            first_name=first_name,
            last_name=last_name
        )

        if role == User.Role.JOB_SEEKER:
            CandidateProfile.objects.create(user=user, phone=phone)
        elif role == User.Role.RECRUITER:
            default_comp, _ = Company.objects.get_or_create(
                name=f"{first_name or 'Recruiter'}'s Organization"
            )
            RecruiterProfile.objects.create(user=user, company=default_comp, designation="Recruiter")

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'identifier'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Allow 'identifier', 'email', or 'username'
        self.fields['identifier'] = serializers.CharField(required=False)
        self.fields['email'] = serializers.CharField(required=False)
        self.fields['username'] = serializers.CharField(required=False)

    def validate(self, attrs):
        # Extract identifier from identifier, email, or username
        ident = (
            attrs.get('identifier') or 
            attrs.get('email') or 
            attrs.get('username') or 
            ''
        ).strip()
        password = attrs.get('password')

        if not ident or not password:
            raise serializers.ValidationError("Must include both credentials (email/mobile and password).")

        # Search user by email, phone_number, username, or profile phone
        user = User.objects.filter(
            Q(email__iexact=ident) | 
            Q(phone_number=ident) | 
            Q(username__iexact=ident) | 
            Q(candidate_profile__phone__icontains=ident)
        ).first()

        if not user or not user.check_password(password):
            raise serializers.ValidationError("No active account found with the given credentials.")

        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")

        refresh = self.get_token(user)

        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'phone_number': user.phone_number,
                'role': user.role,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_premium': user.is_premium
            }
        }

        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        token['phone_number'] = user.phone_number or ''
        token['first_name'] = user.first_name or ''
        token['last_name'] = user.last_name or ''
        token['is_premium'] = user.is_premium
        return token


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'title', 'message', 'link', 'is_read', 'created_at')