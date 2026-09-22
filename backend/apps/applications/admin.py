from django.contrib import admin
from .models import Application

class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'job', 'status', 'applied_at')
    list_filter = ('status',)

admin.site.register(Application, ApplicationAdmin)