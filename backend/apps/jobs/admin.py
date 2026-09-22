from django.contrib import admin
from .models import Job

class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'status', 'created_at')
    list_filter = ('status', 'type')
    search_fields = ('title', 'description', 'location')

admin.site.register(Job, JobAdmin)