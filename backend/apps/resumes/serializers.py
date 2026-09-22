from rest_framework import serializers
from .models import Resume

class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = '__all__'
        # The user won't submit the extracted text directly; our AI does that
        read_only_fields = ('candidate', 'uploaded_at', 'extracted_text')