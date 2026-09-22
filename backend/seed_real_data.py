import os
import django
from datetime import datetime, timedelta, timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.accounts.models import User, Company, CandidateProfile, RecruiterProfile
from apps.jobs.models import Job
from apps.applications.models import Application
from apps.resumes.models import Resume

def seed():
    print("Seeding production database with realistic data...")

    # 1. Create or retrieve Companies
    tech_nova, _ = Company.objects.get_or_create(
        name="TechNova Inc.",
        defaults={
            "description": "Leading enterprise artificial intelligence and cloud software platform.",
            "website": "https://technova.ai",
            "location": "San Francisco, CA & Hyderabad"
        }
    )
    innovate_x, _ = Company.objects.get_or_create(
        name="InnovateX Solutions",
        defaults={
            "description": "Next-gen fintech and high-frequency distributed systems architecture.",
            "website": "https://innovatex.io",
            "location": "Bangalore, India"
        }
    )
    cloud_scale, _ = Company.objects.get_or_create(
        name="CloudScale Systems",
        defaults={
            "description": "Cloud native infrastructure, Kubernetes orchestration, and DevOps tooling.",
            "website": "https://cloudscale.net",
            "location": "Hyderabad, India"
        }
    )
    data_wiz, _ = Company.objects.get_or_create(
        name="DataWiz Analytics",
        defaults={
            "description": "Big Data engineering, machine learning pipelines, and predictive intelligence.",
            "website": "https://datawiz.ai",
            "location": "Pune, India"
        }
    )

    # 2. Ensure Primary Recruiter User exists
    recruiter_user, created = User.objects.get_or_create(
        email="recruiter@technova.com",
        defaults={
            "username": "recruiter_john",
            "first_name": "John",
            "last_name": "Doe",
            "role": User.Role.RECRUITER
        }
    )
    if created:
        recruiter_user.set_password("password123")
        recruiter_user.save()
    
    RecruiterProfile.objects.get_or_create(
        user=recruiter_user,
        defaults={"company": tech_nova, "designation": "Principal Technical Recruiter"}
    )

    # Also link any existing recruiter
    for r in User.objects.filter(role=User.Role.RECRUITER):
        RecruiterProfile.objects.get_or_create(user=r, defaults={"company": tech_nova, "designation": "Technical Recruiter"})

    # 3. Create realistic Candidate Users with real Resumes
    candidates_data = [
        {
            "email": "rahul.sharma@example.com",
            "first_name": "Rahul",
            "last_name": "Sharma",
            "phone": "+91 98765 11111",
            "location": "Hyderabad, India",
            "summary": "Senior Python Backend Developer with 5 years experience building scalable REST APIs with Django, PostgreSQL, Docker, Redis, and Celery.",
            "skills": "Python, Django, Django REST Framework, PostgreSQL, Docker, Redis, Celery, AWS, REST API, Git, Microservices, Linux",
        },
        {
            "email": "priya.verma@example.com",
            "first_name": "Priya",
            "last_name": "Verma",
            "phone": "+91 98765 22222",
            "location": "Bangalore, India",
            "summary": "Machine Learning Engineer specialized in PyTorch, NLP, Computer Vision, Scikit-learn, TensorFlow, and deploying AI models via FastAPI.",
            "skills": "Python, Machine Learning, Deep Learning, PyTorch, TensorFlow, NLP, Computer Vision, FastAPI, Pandas, NumPy, Scikit-Learn, Docker",
        },
        {
            "email": "amit.kumar@example.com",
            "first_name": "Amit",
            "last_name": "Kumar",
            "phone": "+91 98765 33333",
            "location": "Pune, India",
            "summary": "DevOps & Cloud Engineer with expertise in Kubernetes, Docker, Terraform, CI/CD pipelines, AWS, Linux system administration, and Prometheus.",
            "skills": "DevOps, Kubernetes, Docker, AWS, Terraform, CI/CD, GitHub Actions, Linux, Bash, Prometheus, Grafana, Nginx",
        },
        {
            "email": "sneha.reddy@example.com",
            "first_name": "Sneha",
            "last_name": "Reddy",
            "phone": "+91 98765 44444",
            "location": "Hyderabad, India",
            "summary": "Frontend Engineer with 4 years experience creating responsive SPAs with React, TypeScript, Redux Toolkit, CSS Glassmorphism, and Vite.",
            "skills": "React, JavaScript, TypeScript, Redux Toolkit, HTML5, CSS3, TailwindCSS, Vite, REST APIs, WebSockets, Jest",
        },
        {
            "email": "aman.verma@example.com",
            "first_name": "Aman",
            "last_name": "Verma",
            "phone": "+91 98765 55555",
            "location": "Hyderabad, India",
            "summary": "Full Stack AI Engineer experienced across React frontend, Django REST backend, PostgreSQL, and deep learning model integration.",
            "skills": "Python, Django, React, JavaScript, PostgreSQL, REST API, Machine Learning, Docker, Git, CSS3, HTML5",
        }
    ]

    candidate_objs = []
    for c in candidates_data:
        user_obj, u_created = User.objects.get_or_create(
            email=c["email"],
            defaults={
                "username": c["email"].split("@")[0],
                "first_name": c["first_name"],
                "last_name": c["last_name"],
                "role": User.Role.JOB_SEEKER
            }
        )
        if u_created:
            user_obj.set_password("password123")
            user_obj.save()

        CandidateProfile.objects.update_or_create(
            user=user_obj,
            defaults={
                "phone": c["phone"],
                "location": c["location"],
                "summary": c["summary"],
                "experience": "3-5 years of industry engineering experience"
            }
        )

        # Create resume with extracted text
        Resume.objects.get_or_create(
            candidate=user_obj,
            defaults={
                "extracted_text": f"{c['first_name']} {c['last_name']} - {c['summary']}\nTechnical Skills: {c['skills']}\nEducation: B.Tech Computer Science\nWork History: Software Engineer at tech consulting."
            }
        )
        candidate_objs.append(user_obj)

    # 4. Create Real Jobs
    jobs_data = [
        {
            "title": "Senior Python Developer",
            "company": tech_nova,
            "location": "Hyderabad, India",
            "type": "Full-time",
            "salary": "₹18,00,000 - ₹26,00,000",
            "status": "ACTIVE",
            "description": "We are looking for a Senior Python Developer with strong backend experience in Python, Django, Django REST Framework, PostgreSQL, and asynchronous background tasks with Celery and Redis. You will lead the architecture of our core APIs and data pipelines."
        },
        {
            "title": "Machine Learning Engineer",
            "company": tech_nova,
            "location": "Bangalore, India",
            "type": "Full-time",
            "salary": "₹22,00,000 - ₹32,00,000",
            "status": "ACTIVE",
            "description": "Seeking a Machine Learning Engineer to design and deploy state-of-the-art NLP and Computer Vision models into production. Proficiency in PyTorch, TensorFlow, Scikit-learn, Python, Docker, and FastAPI is required."
        },
        {
            "title": "Frontend Developer (React)",
            "company": innovate_x,
            "location": "Bangalore, India",
            "type": "Full-time",
            "salary": "₹14,00,000 - ₹20,00,000",
            "status": "ACTIVE",
            "description": "Looking for a creative Frontend Engineer skilled in React.js, JavaScript, TypeScript, modern CSS glassmorphism, responsive UI layouts, and REST API integration to craft interactive dashboards."
        },
        {
            "title": "DevOps & Cloud Engineer",
            "company": cloud_scale,
            "location": "Hyderabad, India",
            "type": "Full-time",
            "salary": "₹16,00,000 - ₹24,00,000",
            "status": "ACTIVE",
            "description": "Responsible for managing scalable AWS infrastructure, Kubernetes clusters, Docker containerization, CI/CD automation pipelines with GitHub Actions, and Prometheus monitoring."
        },
        {
            "title": "Data Analyst & BI Engineer",
            "company": data_wiz,
            "location": "Pune, India",
            "type": "Full-time",
            "salary": "₹10,00,000 - ₹16,00,000",
            "status": "ACTIVE",
            "description": "Analyze large volumes of structured and unstructured business data. Strong proficiency in SQL, Python, Pandas, data visualization tools, and statistical analysis required."
        },
        {
            "title": "Full Stack AI Engineer",
            "company": tech_nova,
            "location": "Remote",
            "type": "Full-time",
            "salary": "₹20,00,000 - ₹28,00,000",
            "status": "ACTIVE",
            "description": "Full Stack Engineer to build web applications combining React frontends with Django backends, PostgreSQL databases, and deep learning NLP models."
        }
    ]

    job_objs = []
    for jd in jobs_data:
        job, _ = Job.objects.update_or_create(
            title=jd["title"],
            company=jd["company"],
            defaults={
                "recruiter": recruiter_user,
                "location": jd["location"],
                "type": jd["type"],
                "salary": jd["salary"],
                "status": jd["status"],
                "description": jd["description"]
            }
        )
        job_objs.append(job)

    # 5. Create Real Applications across Pipeline Stages
    now = datetime.now(timezone.utc)

    # Rahul Sharma -> Applied to Senior Python Developer (INTERVIEW stage)
    Application.objects.update_or_create(
        job=job_objs[0],
        candidate=candidate_objs[0],
        defaults={
            "status": "INTERVIEW",
            "interview_date": now + timedelta(days=2, hours=3),
            "notes": "Passed technical assessment with 95% score. Strong knowledge of Django ORM and PostgreSQL optimization."
        }
    )

    # Priya Verma -> Applied to ML Engineer (INTERVIEW stage)
    Application.objects.update_or_create(
        job=job_objs[1],
        candidate=candidate_objs[1],
        defaults={
            "status": "INTERVIEW",
            "interview_date": now + timedelta(days=3, hours=5),
            "notes": "Impressive portfolio in PyTorch and NLP transformers. Scheduled Round 2 System Design."
        }
    )

    # Sneha Reddy -> Applied to Frontend Developer (SHORTLISTED stage)
    Application.objects.update_or_create(
        job=job_objs[2],
        candidate=candidate_objs[3],
        defaults={
            "status": "SHORTLISTED",
            "notes": "Great React component architecture and glassmorphism UI experience."
        }
    )

    # Amit Kumar -> Applied to DevOps Engineer (ACCEPTED / HIRED stage)
    Application.objects.update_or_create(
        job=job_objs[3],
        candidate=candidate_objs[2],
        defaults={
            "status": "ACCEPTED",
            "notes": "Offer extended and accepted! Starting 1st of next month."
        }
    )

    # Aman Verma -> Applied to Full Stack AI Engineer & Senior Python Developer
    Application.objects.update_or_create(
        job=job_objs[5],
        candidate=candidate_objs[4],
        defaults={
            "status": "INTERVIEW",
            "interview_date": now + timedelta(days=1, hours=2),
            "notes": "Strong full-stack capabilities with React and Django."
        }
    )
    Application.objects.update_or_create(
        job=job_objs[0],
        candidate=candidate_objs[4],
        defaults={
            "status": "REVIEWING",
            "notes": "Resume under technical review."
        }
    )

    print(f"Successfully seeded database:")
    print(f"- Total Users: {User.objects.count()}")
    print(f"- Total Companies: {Company.objects.count()}")
    print(f"- Total Jobs: {Job.objects.count()}")
    print(f"- Total Applications: {Application.objects.count()}")
    print(f"- Total Resumes: {Resume.objects.count()}")

if __name__ == '__main__':
    seed()
