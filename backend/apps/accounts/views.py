from rest_framework import generics, viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import CandidateProfile, RecruiterProfile, Company, Notification
from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
    NotificationSerializer,
    CompanySerializer
)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.request.user
        data = request.data

        # 1. Update basic User fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        
        # Email synchronization - allows logging in with this email later
        new_email = data.get('email', '').strip()
        if new_email and new_email != user.email:
            if User.objects.filter(email__iexact=new_email).exclude(id=user.id).exists():
                return Response({"error": "This email address is already in use by another account."}, status=status.HTTP_400_BAD_REQUEST)
            user.email = new_email
            user.username = new_email

        # Mobile number synchronization - allows logging in with this phone later
        new_phone = data.get('phone_number') or data.get('phone', '')
        if new_phone:
            new_phone = str(new_phone).strip()
            if User.objects.filter(phone_number=new_phone).exclude(id=user.id).exists():
                return Response({"error": "This mobile number is already in use by another account."}, status=status.HTTP_400_BAD_REQUEST)
            user.phone_number = new_phone

        user.save()

        # 2. Update CandidateProfile if JOB_SEEKER
        if user.role == User.Role.JOB_SEEKER:
            profile, _ = CandidateProfile.objects.get_or_create(user=user)
            if 'phone' in data or new_phone:
                profile.phone = new_phone or data.get('phone', '')
            if 'location' in data:
                profile.location = data['location']
            if 'summary' in data:
                profile.summary = data['summary']
            if 'experience' in data:
                profile.experience = data['experience']
            profile.save()

        # 3. Update RecruiterProfile & Company if RECRUITER
        elif user.role == User.Role.RECRUITER:
            profile, _ = RecruiterProfile.objects.get_or_create(user=user)
            if 'designation' in data:
                profile.designation = data['designation']

            # Company details
            company = profile.company
            comp_name = data.get('company_name') or data.get('company')
            if comp_name:
                if not company:
                    company = Company.objects.create(name=comp_name)
                    profile.company = company
                else:
                    company.name = comp_name

            if company:
                if 'company_website' in data or 'website' in data:
                    company.website = data.get('company_website') or data.get('website', '')
                if 'company_location' in data or 'location' in data:
                    company.location = data.get('company_location') or data.get('location', '')
                if 'company_description' in data or 'description' in data:
                    company.description = data.get('company_description') or data.get('description', '')
                if 'industry' in data:
                    company.industry = data['industry']
                company.save()
            profile.save()

        serializer = self.get_serializer(user)
        return Response(serializer.data)


class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({"error": "Old password and new password are required."}, status=400)

        if not user.check_password(old_password):
            return Response({"error": "Current password is incorrect."}, status=400)

        if len(new_password) < 6:
            return Response({"error": "New password must be at least 6 characters long."}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({"status": "Password changed successfully."})


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({"status": "success", "notification": NotificationSerializer(notif).data})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"status": "All notifications marked as read."})

class UpgradeToPremiumView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.is_premium:
            return Response({"status": "Already premium"}, status=200)
        
        user.is_premium = True
        user.save()
        return Response({"status": "Successfully upgraded to premium!", "is_premium": True})