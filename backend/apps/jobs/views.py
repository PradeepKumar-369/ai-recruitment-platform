from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Job
from .serializers import JobSerializer, CompanySerializer
from apps.accounts.models import Company

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all().order_by('-created_at')
    serializer_class = JobSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'location', 'description', 'type']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        
        # Ensure company exists or grab existing/default company
        company = None
        company_val = self.request.data.get('company')
        if company_val:
            # Check if integer ID or string name
            try:
                company = Company.objects.get(id=int(company_val))
            except (ValueError, Company.DoesNotExist):
                company, _ = Company.objects.get_or_create(name=str(company_val))
        
        if not company:
            # Check if recruiter has a company profile
            if hasattr(user, 'recruiter_profile') and user.recruiter_profile.company:
                company = user.recruiter_profile.company
            else:
                company, _ = Company.objects.get_or_create(name=f"{user.first_name or user.username}'s Company")

        serializer.save(recruiter=user, company=company, status='ACTIVE')

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_jobs(self, request):
        """
        Return jobs posted by the current recruiter with full analytics.
        """
        if request.user.role != 'RECRUITER':
            return Response({"error": "Only recruiters can view their posted jobs."}, status=403)
        
        jobs = Job.objects.filter(recruiter=request.user).order_by('-created_at')
        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def toggle_status(self, request, pk=None):
        """
        Allows recruiter to toggle job status between ACTIVE, CLOSED, DRAFT.
        """
        job = self.get_object()
        if request.user.role != 'RECRUITER' or (job.recruiter != request.user and request.user.role != 'ADMIN'):
            return Response({"error": "You do not have permission to modify this job."}, status=403)

        new_status = request.data.get('status')
        if new_status in ['ACTIVE', 'CLOSED', 'DRAFT']:
            job.status = new_status
            job.save()
            return Response({"status": "success", "new_status": job.status, "job": self.get_serializer(job).data})
        
        return Response({"error": "Invalid status provided."}, status=400)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]