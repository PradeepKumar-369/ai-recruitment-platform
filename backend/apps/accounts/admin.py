from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, CandidateProfile, Company, RecruiterProfile

# Register the custom User model
admin.site.register(User, UserAdmin)

# Register the other account models
admin.site.register(CandidateProfile)
admin.site.register(Company)
admin.site.register(RecruiterProfile)