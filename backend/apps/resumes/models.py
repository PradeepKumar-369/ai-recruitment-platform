from django.core.validators import FileExtensionValidator
from django.db import models
from django.conf import settings

MAX_RESUME_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_resume_file_size(file):
    if file.size > MAX_RESUME_UPLOAD_SIZE:
        from django.core.exceptions import ValidationError
        raise ValidationError("Resume file must be 5MB or smaller.")


class Resume(models.Model):
    candidate = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(
        upload_to='resumes/%Y/%m/%d/',
        validators=[
            FileExtensionValidator(allowed_extensions=['pdf', 'docx', 'txt']),
            validate_resume_file_size,
        ],
    )
    extracted_text = models.TextField(blank=True, help_text="Raw text extracted for AI processing")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Resume for {self.candidate.email}"