from rest_framework import serializers
from .models import Job
from apps.accounts.models import Company

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class JobSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()
    recruiter_email = serializers.CharField(source='recruiter.email', read_only=True)
    applicant_count = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ('recruiter', 'created_at', 'updated_at')

    def get_company_name(self, obj):
        if obj.company:
            return obj.company.name
        return "Confidential Company"

    def get_applicant_count(self, obj):
        return obj.applications.count()