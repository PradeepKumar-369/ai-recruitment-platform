from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from .models import Application
from .serializers import ApplicationSerializer
from apps.resumes.models import Resume
from apps.jobs.models import Job
from apps.resumes.utils import analyze_resume_match
from rest_framework.decorators import action


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        job_id = self.request.query_params.get('job', None)
        status_filter = self.request.query_params.get('status', None)

        if user.role == 'JOB_SEEKER':
            qs = Application.objects.filter(candidate=user).order_by('-applied_at')
        elif user.role == 'RECRUITER':
            qs = Application.objects.filter(job__recruiter=user).order_by('-applied_at')
        elif user.role == 'ADMIN':
            qs = Application.objects.all().order_by('-applied_at')
        else:
            return Application.objects.none()

        if job_id:
            qs = qs.filter(job_id=job_id)
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'JOB_SEEKER':
            raise ValidationError("Only job seekers can apply for jobs.")
        
        job = serializer.validated_data['job']
        if Application.objects.filter(job=job, candidate=user).exists():
            raise ValidationError("You have already applied for this job.")
        
        # Attach the user's latest resume if available
        latest_resume = Resume.objects.filter(candidate=user).order_by('-uploaded_at').first()
        app_obj = serializer.save(candidate=user, resume=latest_resume)

        # Notify the recruiter who posted the job
        if job.recruiter:
            from apps.accounts.models import Notification
            Notification.objects.create(
                recipient=job.recruiter,
                title=f"New Applicant: {job.title}",
                message=f"{user.first_name or user.email} just applied for '{job.title}'.",
                link="/recruiter-dashboard"
            )

    def list(self, request, *args, **kwargs):
        """
        Override default list view to inject SkillMatch AI metrics
        for both recruiters and job seekers.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        for app in data:
            candidate_id = app.get('candidate')
            job_desc = app.get('job_details', {}).get('description', '')
            
            # Fetch candidate's resume
            latest_resume = Resume.objects.filter(candidate_id=candidate_id).order_by('-uploaded_at').first()
            
            if latest_resume and latest_resume.extracted_text:
                match_data = analyze_resume_match(latest_resume.extracted_text, job_desc)
                app['match_score'] = match_data['match_score']
                app['matched_skills'] = match_data.get('matched_skills', [])
                app['missing_skills'] = match_data.get('missing_skills', [])
                app['total_matched'] = match_data.get('total_matched', 0)
                app['total_required'] = match_data.get('total_required', 0)
            else:
                app['match_score'] = 0
                app['matched_skills'] = []
                app['missing_skills'] = ["No resume uploaded by candidate."]
                app['total_matched'] = 0
                app['total_required'] = 0

        if request.user.role == 'RECRUITER':
            data = sorted(data, key=lambda x: x.get('match_score', 0), reverse=True)

        return Response(data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Endpoint for recruiters to update candidate status, notes, or interview schedules.
        """
        if request.user.role != 'RECRUITER':
            return Response({"error": "Only recruiters can update candidate status."}, status=403)
        
        application = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes')
        interview_date = request.data.get('interview_date')
        interview_link = request.data.get('interview_link')

        valid_statuses = [choice[0] for choice in Application.STATUS_CHOICES]
        
        if new_status:
            if new_status not in valid_statuses:
                return Response({"error": f"Invalid status. Must be one of: {valid_statuses}"}, status=400)
            application.status = new_status

        if notes is not None:
            application.notes = notes
            
        if interview_date is not None:
            application.interview_date = interview_date if interview_date else None
            
        if interview_link is not None:
            application.interview_link = interview_link if interview_link else None

        application.save()

        # Notify candidate of the update
        if new_status and application.candidate:
            from apps.accounts.models import Notification
            title = f"Application Update: {new_status}"
            message = f"Your application for '{application.job.title}' is now in stage '{new_status}'."
            
            if new_status == 'INTERVIEW' and application.interview_date:
                message = f"You have been invited to an interview for '{application.job.title}' on {application.interview_date}."
                if application.interview_link:
                    message += f" Meeting Link: {application.interview_link}"
            
            Notification.objects.create(
                recipient=application.candidate,
                title=title,
                message=message,
                link="/"
            )

        serializer = self.get_serializer(application)
        return Response({"status": "success", "application": serializer.data})

    @action(detail=False, methods=['post'])
    def bulk_update_status(self, request):
        """
        Bulk update multiple applications at once (e.g. Bulk Shortlist, Bulk Reject).
        """
        if request.user.role != 'RECRUITER':
            return Response({"error": "Only recruiters can perform bulk updates."}, status=403)

        app_ids = request.data.get('application_ids', [])
        new_status = request.data.get('status')

        valid_statuses = [choice[0] for choice in Application.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({"error": "Invalid status provided."}, status=400)

        updated_count = Application.objects.filter(
            id__in=app_ids, 
            job__recruiter=request.user
        ).update(status=new_status)

        return Response({
            "status": "success", 
            "updated_count": updated_count,
            "new_status": new_status
        })

    @action(detail=False, methods=['post'])
    def match_preview(self, request):
        """
        AI helper endpoint for job seekers or recruiters to calculate match percentage
        against their latest resume in real-time for any job description.
        """
        user = request.user
        job_id = request.data.get('job_id')
        job_description = request.data.get('job_description', '')

        if job_id:
            try:
                job = Job.objects.get(id=job_id)
                job_description = job.description
            except Job.DoesNotExist:
                return Response({"error": "Job not found."}, status=404)

        latest_resume = Resume.objects.filter(candidate=user).order_by('-uploaded_at').first()
        if not latest_resume or not latest_resume.extracted_text:
            return Response({
                "match_score": 0,
                "matched_skills": [],
                "missing_skills": ["No resume found. Please upload a PDF resume in your Profile to unlock AI Matching."],
                "has_resume": False
            })

        match_data = analyze_resume_match(latest_resume.extracted_text, job_description)
        match_data["has_resume"] = True
        return Response(match_data)

    @action(detail=False, methods=['post'])
    def generate_questions(self, request):
        """
        AI Feature: Generates the first dynamic mock interview question based on JD and Resume.
        """
        from apps.resumes.gemini_interview import start_dynamic_interview
        job_title = request.data.get('job_title', 'Software Engineer')
        job_description = request.data.get('job_description', '')
        resume_text = request.data.get('resume_text', '')
        
        result = start_dynamic_interview(job_title, job_description, resume_text)
        # Wrap it in a list so the frontend can receive it similar to the old format if needed,
        # but frontend will be refactored to handle the single object.
        return Response({"questions": [result]})

    @action(detail=False, methods=['post'])
    def evaluate_answer(self, request):
        """
        AI Premium Feature: Evaluates candidate's live answer and returns the NEXT dynamic question.
        Requires 'history' in the request payload.
        """
        from apps.resumes.gemini_interview import next_dynamic_question
        
        job_description = request.data.get('job_description', '')
        resume_text = request.data.get('resume_text', '')
        history = request.data.get('history', [])

        result = next_dynamic_question(job_description, resume_text, history)
        return Response(result)