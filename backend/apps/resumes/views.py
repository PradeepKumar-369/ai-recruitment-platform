from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Resume, MAX_RESUME_UPLOAD_SIZE
from .serializers import ResumeSerializer
from .utils import extract_text_from_file, optimize_resume_for_ats

ALLOWED_EXTRACT_EXTENSIONS = ('.pdf', '.docx', '.txt')

class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Candidates should only be able to view their own resumes
        return Resume.objects.filter(candidate=self.request.user)

    def perform_create(self, serializer):
        # 1. Save the initial application to get the file stored
        resume = serializer.save(candidate=self.request.user)

        # 2. Extract the text using the SkillMatch script
        if resume.file:
            try:
                parsed_text = extract_text_from_file(resume.file, resume.file.name)
            except ValueError:
                parsed_text = ""
            resume.extracted_text = parsed_text
            resume.save()

    @action(detail=False, methods=['post'])
    def optimize_ats(self, request):
        """
        AI Resume Optimizer: Targeted Skill Gap Analysis, Intelligent Coaching Insights,
        Automated Bullet Point Restructuring, and ATS-compliant Document Generation.
        """
        resume_text = request.data.get('resume_text', '')
        job_description = request.data.get('job_description', '')

        if not resume_text:
            return Response({"error": "Resume text is required."}, status=status.HTTP_400_BAD_REQUEST)

        result = optimize_resume_for_ats(resume_text, job_description)
        return Response(result)

    @action(detail=False, methods=['post'])
    def extract_document_text(self, request):
        """
        Accepts an uploaded PDF, DOCX, or TXT file from the candidate's device
        and extracts clean text stream on the fly.
        """
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        if not uploaded_file.name.lower().endswith(ALLOWED_EXTRACT_EXTENSIONS):
            return Response(
                {"error": f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTRACT_EXTENSIONS)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if uploaded_file.size > MAX_RESUME_UPLOAD_SIZE:
            return Response({"error": "File must be 5MB or smaller."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            extracted = extract_text_from_file(uploaded_file, uploaded_file.name)
            return Response({
                "filename": uploaded_file.name,
                "extracted_text": extracted.strip()
            })
        except Exception as e:
            return Response({"error": f"Failed to extract text: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)