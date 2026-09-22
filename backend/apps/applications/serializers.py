from rest_framework import serializers
from .models import Application
from apps.jobs.serializers import JobSerializer

class ApplicationSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source='job', read_only=True)
    candidate_email = serializers.CharField(source='candidate.email', read_only=True)
    candidate_name = serializers.SerializerMethodField()
    candidate_phone = serializers.SerializerMethodField()
    candidate_location = serializers.SerializerMethodField()
    candidate_summary = serializers.SerializerMethodField()
    resume_url = serializers.SerializerMethodField()
    resume_text = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ('candidate', 'applied_at')

    def get_candidate_name(self, obj):
        full_name = f"{obj.candidate.first_name} {obj.candidate.last_name}".strip()
        return full_name if full_name else obj.candidate.username

    def get_candidate_phone(self, obj):
        if hasattr(obj.candidate, 'candidate_profile'):
            return obj.candidate.candidate_profile.phone
        return ""

    def get_candidate_location(self, obj):
        if hasattr(obj.candidate, 'candidate_profile'):
            return obj.candidate.candidate_profile.location
        return ""

    def get_candidate_summary(self, obj):
        if hasattr(obj.candidate, 'candidate_profile'):
            return obj.candidate.candidate_profile.summary
        return ""

    def get_resume_url(self, obj):
        if obj.resume and obj.resume.file:
            return obj.resume.file.url
        return None

    def get_resume_text(self, obj):
        if obj.resume and obj.resume.extracted_text:
            return obj.resume.extracted_text
        return ""