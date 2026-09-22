from django.db import models
from django.conf import settings
from apps.jobs.models import Job
from apps.resumes.models import Resume

class Application(models.Model):
    STATUS_CHOICES = (
        ('APPLIED', 'Applied'),
        ('REVIEWING', 'Reviewing'),
        ('SHORTLISTED', 'Shortlisted'),
        ('INTERVIEW', 'Interview Scheduled'),
        ('OFFER', 'Offer Extended'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
    )

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    candidate = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    resume = models.ForeignKey(Resume, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPLIED')
    notes = models.TextField(blank=True, default='')
    interview_date = models.DateTimeField(null=True, blank=True)
    interview_link = models.URLField(blank=True, null=True, help_text="Zoom/Google Meet link for the interview")
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevent candidates from applying to the same job multiple times
        unique_together = ('job', 'candidate')

    def __str__(self):
        return f"{self.candidate.email} applied for {self.job.title}"