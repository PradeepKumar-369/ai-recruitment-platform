# TalentMatch AI

An AI-powered job recruitment platform connecting job seekers and recruiters, with resume parsing, AI-driven job matching, ATS resume optimization, and Gemini-backed live mock interviews.

**Live stack:** Django REST Framework backend + React (Vite) frontend, styled with Tailwind CSS.

---

## Features

### For job seekers
- Browse and search open roles, with AI-driven match scoring against your resume
- One-click apply, with a full application pipeline tracker (Applied → Review → Interview → Decision)
- Resume upload (PDF / DOCX / TXT) with automatic text extraction
- **AI Resume Optimizer** — ATS gap analysis, coaching insights, and a rewritten ATS-ready document
- **AI Mock Interview** — a live, adaptive interview simulator (Gemini-backed, with a local fallback if no API key is configured) with speech-to-text answers, text-to-speech questions, a countdown timer, and a hiring-manager-style evaluation report
- Skill assessments, saved jobs, notifications, and messaging

### For recruiters
- ATS Command Center: job postings, a drag-and-drop candidate pipeline (Kanban board), bulk status updates, and CSV export
- AI-assisted candidate screening and interview-question generation
- Company/team management and interview scheduling

### Platform-wide
- Role-aware routing — job seekers and recruiters each get their own dashboard; anonymous visitors get a public job board
- JWT authentication with refresh-token rotation
- Fully responsive (mobile → desktop) dark UI built on Tailwind CSS + a small shared component kit

---

## Tech stack

| Layer | Stack |
|---|---|
| Backend | Django 6.1, Django REST Framework, SimpleJWT, PostgreSQL |
| AI | Google Gemini (`gemini-1.5-flash-latest`) for dynamic interviews, with a rule-based local fallback |
| Resume parsing | PyPDF2 (PDF), python-docx (DOCX) |
| Frontend | React 19, Vite, React Router, Tailwind CSS v4, Axios |
| Icons / charts | lucide-react, hand-rolled SVG charts (donut, funnel, trend, radial gauge) |

---

## Project structure

```
AI_Recruitmennt/
├── backend/
│   ├── apps/
│   │   ├── accounts/       # Users, auth, profiles, notifications
│   │   ├── jobs/           # Job postings & companies
│   │   ├── applications/   # Application pipeline, AI match scoring, interview endpoints
│   │   └── resumes/        # Resume upload/parsing, ATS optimizer, Gemini interview logic
│   ├── backend/            # Django project settings/urls
│   └── seed_real_data.py   # Sample companies/jobs/recruiter seed script
└── frontend/
    └── src/
        ├── pages/           # Route-level pages (dashboards, job board, auth, etc.)
        ├── components/      # Navbar, MockInterviewRoom, ResumeOptimizer, Charts, ...
        ├── components/ui/   # Shared UI kit (Button, Card, Badge, Field, EmptyState, Skeleton)
        ├── context/         # Auth & toast context providers
        └── services/api.js  # Axios client
```

---

## Getting started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (running locally or reachable)
- (Optional) A [Google Gemini API key](https://ai.google.dev/) — the mock interview feature falls back to local rule-based questions/evaluations without one

### 1. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DB_NAME=ai_recruitment_db
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
GEMINI_API_KEY=your_gemini_api_key      # optional — falls back to local logic if unset

SECRET_KEY=generate_a_real_secret_key   # see note below
DJANGO_DEBUG=True                       # False in production
ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Generate a real `SECRET_KEY`:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Then run migrations and start the server:

```bash
python manage.py migrate
python manage.py createsuperuser      # optional, for /admin access
python manage.py runserver 127.0.0.1:8000
```

**Seed sample data** (companies, jobs, and a recruiter account `recruiter@technova.com` / `password123`):
```bash
python seed_real_data.py
```

For a job-seeker account, just register one through the app's `/register` page.

### 2. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env` (safe to commit — not a secret):
```env
VITE_API_URL=http://127.0.0.1:8000/api/
```

Start the dev server:
```bash
npm run dev
```

The app will be available at **http://localhost:5173**, talking to the API at **http://127.0.0.1:8000**.

---

## Security notes for production

This repo ships with development-friendly defaults. Before deploying:
- Set `DJANGO_DEBUG=False` and a real, secret `SECRET_KEY`
- Set `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` to your real domains
- Never commit `backend/.env` (already gitignored)
- Review `SIMPLE_JWT` token lifetimes for your risk tolerance

---

## License

No license specified — all rights reserved by the repository owner unless otherwise stated.
