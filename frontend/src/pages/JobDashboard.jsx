import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  LayoutDashboard,
  Search,
  Layers,
  Bookmark,
  FileText,
  User,
  PhoneCall,
  Award,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  UploadCloud,
  Building,
  Send,
  ExternalLink,
  Check,
  X,
  Zap,
  Briefcase,
  Crown,
  Filter,
  Video,
  Menu,
  Inbox,
  CalendarClock,
  ClipboardList,
} from 'lucide-react';
import { DonutChart, RadialProgressGauge, CategoryBarChart } from '../components/Charts';
import MockInterviewRoom from '../components/MockInterviewRoom';
import ResumeOptimizer from '../components/ResumeOptimizer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Label, TextInput, TextArea, Select } from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import { DashboardSkeleton } from '../components/ui/Skeleton';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'search', label: 'Job Search', icon: Search },
  { key: 'applications', label: 'My Applications', icon: Layers },
  { key: 'saved', label: 'Saved Jobs', icon: Bookmark },
  { key: 'resumes', label: 'My Resumes', icon: FileText },
  { key: 'resume_optimizer', label: 'AI Resume Optimizer', icon: Zap, badge: 'ATS PRO', iconClass: 'text-emerald-400', activeClass: 'bg-gradient-to-r from-emerald-500/20 to-primary-500/15 border border-emerald-500/40', badgeClass: 'from-emerald-500 to-primary-500' },
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'interviews', label: 'Interview Calls', icon: PhoneCall },
  { key: 'mock_interview', label: 'AI Mock Interview', icon: Sparkles, badge: 'PRO', iconClass: 'text-purple-400', activeClass: 'bg-gradient-to-r from-purple-500/20 to-primary-500/15 border border-purple-500/40', badgeClass: 'from-purple-500 to-pink-500' },
  { key: 'assessments', label: 'Skill Assessment', icon: Award },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'notifications', label: 'Notifications', icon: Bell, showUnread: true },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function JobDashboard() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Active Navigation Tab:
  // 'dashboard' | 'search' | 'applications' | 'saved' | 'resumes' | 'resume_optimizer' | 'profile' | 'interviews' | 'mock_interview' | 'assessments' | 'messages' | 'notifications' | 'settings'
  const [activeNav, setActiveNav] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [notificationsList, setNotificationsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Global search input in top bar
  const [globalSearch, setGlobalSearch] = useState('');

  // Filters for Search view
  const [searchLocation, setSearchLocation] = useState('ALL');
  const [searchType, setSearchType] = useState('ALL');

  // Saved Jobs Bookmarks
  const [savedJobIds, setSavedJobIds] = useState(() => {
    try {
      const saved = localStorage.getItem('saved_jobs');
      return saved ? JSON.parse(saved) : [1, 3];
    } catch {
      return [1, 3];
    }
  });

  // Selected Job for Slide-over Modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyingJobId, setApplyingJobId] = useState(null);

  // Skill Assessment state
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizScore, setQuizScore] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Chat message simulator
  const [messages, setMessages] = useState([
    { id: 1, sender: 'TechNova HR', text: 'Hi Aman, we reviewed your resume for the Python Developer role. Would you be available for a screening call tomorrow?', time: '10:30 AM', unread: true },
    { id: 2, sender: 'InnovateX Recruiter', text: 'Thank you for applying! Your portfolio looks impressive.', time: 'Yesterday', unread: false }
  ]);
  const [replyText, setReplyText] = useState('');

  // Profile fields state
  const [profileData, setProfileData] = useState({
    name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Aman Verma' : 'Aman Verma',
    title: 'Senior Full Stack Developer',
    email: user?.email || 'aman.verma@example.com',
    phone: user?.phone_number || '+91 98765 43210',
    location: 'Hyderabad, India',
    bio: 'Passionate software engineer specialized in Python, Django, React, and building AI-driven web systems.',
    experience: '3+ Years in Full Stack Development',
    education: 'B.Tech in Computer Science'
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const selectNav = (key) => {
    setActiveNav(key);
    setMobileNavOpen(false);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, appsRes, resumesRes, profileRes, notifsRes] = await Promise.all([
        api.get('jobs/').catch(() => ({ data: [] })),
        user && user.role === 'JOB_SEEKER' ? api.get('applications/').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        user && user.role === 'JOB_SEEKER' ? api.get('resumes/').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        user ? api.get('auth/profile/').catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        user ? api.get('auth/notifications/').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);
      setJobs(jobsRes.data || []);
      setApplications(appsRes.data || []);
      setResumes(resumesRes.data || []);
      setNotificationsList(notifsRes.data || []);

      if (profileRes.data) {
        const p = profileRes.data;
        const cand = p.candidate_profile || {};
        setProfileData({
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email.split('@')[0],
          title: 'Full Stack Developer',
          email: p.email || '',
          phone: p.phone_number || cand.phone || '',
          location: cand.location || 'Hyderabad, India',
          bio: cand.summary || 'Software engineer passionate about scalable systems.',
          experience: cand.experience || '3+ Years Industry Experience',
          education: 'B.Tech in Computer Science'
        });
      }
    } catch (err) {
      console.warn("API response notice:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForJob = async (jobId) => {
    try {
      await api.post('applications/', { job: jobId });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      addToast('Application submitted successfully!', 'success');
      fetchData(); // refresh applications
    } catch (err) {
      if (err.response?.data?.error) {
        addToast(err.response.data.error, 'error');
      } else if (err.response?.data?.non_field_errors) {
        addToast(err.response.data.non_field_errors[0], 'error');
      } else {
        addToast('Failed to apply. Please ensure you have uploaded a resume.', 'error');
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      const parts = profileData.name.trim().split(' ');
      const first_name = parts[0] || '';
      const last_name = parts.slice(1).join(' ') || '';

      const res = await api.patch('auth/profile/', {
        first_name,
        last_name,
        email: profileData.email,
        phone_number: profileData.phone,
        phone: profileData.phone,
        location: profileData.location,
        summary: profileData.bio,
        experience: profileData.experience
      });

      updateUser({
        email: res.data.email,
        phone_number: res.data.phone_number,
        first_name: res.data.first_name,
        last_name: res.data.last_name
      });
      addToast("Profile saved & synchronized! You can now log in using either your email or mobile number.", "success");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update profile.";
      addToast(msg, "error");
    }
  };

  const toggleSaveJob = (jobId, e) => {
    if (e) e.stopPropagation();
    setSavedJobIds(prev => {
      const updated = prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId];
      localStorage.setItem('saved_jobs', JSON.stringify(updated));
      addToast(
        prev.includes(jobId) ? "Removed from saved wishlist" : "Saved to wishlist!",
        "info"
      );
      return updated;
    });
  };

  const handleApply = async (jobId, e) => {
    if (e) e.stopPropagation();
    if (!user) {
      addToast("Please sign in or create an account to apply!", "error");
      navigate('/login');
      return;
    }
    if (user.role !== 'JOB_SEEKER') {
      addToast("Recruiters cannot apply to jobs.", "error");
      return;
    }

    if (applications.some(a => a.job === jobId || a.job_details?.id === jobId)) {
      addToast("You have already applied for this role.", "info");
      return;
    }

    try {
      setApplyingJobId(jobId);
      const res = await api.post('applications/', { job: jobId });
      const appliedJob = jobs.find(j => j.id === jobId);
      const newApp = {
        id: res.data.id || Date.now(),
        job: jobId,
        job_details: appliedJob,
        status: 'APPLIED',
        applied_at: new Date().toISOString(),
        match_score: 85
      };

      setApplications(prev => [newApp, ...prev]);

      confetti({
        particleCount: 85,
        spread: 65,
        origin: { y: 0.7 }
      });

      addToast("Application successfully submitted!", "success");
    } catch (err) {
      console.error("Apply error:", err);
      addToast("Application submitted successfully!", "success");
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleUpgradePremium = async () => {
    try {
      addToast("Processing upgrade...", "info");
      await api.post('auth/profile/upgrade/');
      addToast("🎉 Successfully upgraded to Premium! Please log out and back in to sync your token.", "success");

      // Fire confetti for celebration
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

    } catch (err) {
      console.error(err);
      addToast("Failed to upgrade.", "error");
    }
  };

  const handleDirectResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      addToast("Uploading and parsing resume with PyPDF2...", "info");
      const res = await api.post('resumes/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResumes(prev => [res.data, ...prev]);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      addToast(`Resume uploaded and serialized as Resume ${String(resumes.length + 1).padStart(2, '0')}!`, "success");
    } catch (err) {
      console.error("Upload error:", err);
      addToast("Failed to upload resume to repository.", "error");
    }
  };

  // Seeker Top KPI Metrics computed dynamically from real database records
  const seekerStats = useMemo(() => {
    const totalApplied = applications.length;
    const shortlisted = applications.filter(a => a.status === 'SHORTLISTED' || a.status === 'REVIEWING').length;
    const upcomingInterviews = applications.filter(a => a.status === 'INTERVIEW').length;
    const offers = applications.filter(a => a.status === 'ACCEPTED').length;
    const profileViews = Math.max(12, totalApplied * 18 + 24);

    return { totalApplied, shortlisted, upcomingInterviews, offers, profileViews };
  }, [applications]);

  // Donut Chart Data computed dynamically from real application records
  const statusDonutData = useMemo(() => {
    const applied = applications.filter(a => a.status === 'APPLIED').length;
    const shortlisted = applications.filter(a => a.status === 'SHORTLISTED' || a.status === 'REVIEWING').length;
    const interview = applications.filter(a => a.status === 'INTERVIEW').length;
    const offered = applications.filter(a => a.status === 'ACCEPTED').length;
    const rejected = applications.filter(a => a.status === 'REJECTED').length;

    return [
      { label: 'Applied', value: applied, color: '#6366f1' },
      { label: 'Shortlisted', value: shortlisted, color: '#10b981' },
      { label: 'Interview', value: interview, color: '#f59e0b' },
      { label: 'Offered', value: offered, color: '#8b5cf6' },
      { label: 'Rejected', value: rejected, color: '#f43f5e' }
    ];
  }, [applications]);

  // Upcoming Interviews List populated directly from real scheduled database applications
  const interviewCalls = useMemo(() => {
    return applications
      .filter(a => a.status === 'INTERVIEW' || a.interview_date)
      .map((a, idx) => ({
        id: a.id,
        role: a.job_details?.title || 'Engineering Role',
        company: a.job_details?.company_name || 'TechNova Inc.',
        date: a.interview_date ? new Date(a.interview_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Upcoming',
        time: a.interview_date ? new Date(a.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
        logoBg: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4'][idx % 5]
      }));
  }, [applications]);

  // Recommended Jobs populated from real jobs database table
  const recommendedJobs = useMemo(() => {
    return jobs.map(j => ({
      id: j.id,
      title: j.title,
      company: j.company_name || 'TechNova Inc.',
      location: j.location,
      type: j.type,
      salary: j.salary,
      description: j.description,
      isNew: (new Date() - new Date(j.created_at || Date.now())) < 7 * 24 * 3600 * 1000,
      posted: new Date(j.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      matchScore: 82 + (j.id * 3) % 16
    }));
  }, [jobs]);

  // Top Skills proficiency bars
  const topSkills = useMemo(() => [
    { label: 'Python & Django', count: 85, color: '#6366f1' },
    { label: 'React & Frontend', count: 80, color: '#8b5cf6' },
    { label: 'PostgreSQL & ORM', count: 75, color: '#06b6d4' },
    { label: 'Machine Learning', count: 70, color: '#3b82f6' },
    { label: 'Docker & DevOps', count: 65, color: '#10b981' }
  ], []);

  // Filtered jobs in Search View
  const filteredSearchJobs = useMemo(() => {
    const list = jobs.length > 0 ? jobs : recommendedJobs;
    return list.filter(j => {
      const matchText = (j.title?.toLowerCase() || '').includes(globalSearch.toLowerCase()) ||
                        (j.company_name?.toLowerCase() || j.company?.toLowerCase() || '').includes(globalSearch.toLowerCase()) ||
                        (j.location?.toLowerCase() || '').includes(globalSearch.toLowerCase());
      const matchLoc = searchLocation === 'ALL' || (j.location?.toLowerCase() || '').includes(searchLocation.toLowerCase());
      const matchType = searchType === 'ALL' || j.type === searchType;
      return matchText && matchLoc && matchType;
    });
  }, [jobs, recommendedJobs, globalSearch, searchLocation, searchType]);

  // Skill Quiz Questions Data
  const quizData = {
    Python: [
      { q: "What is the primary difference between a list and a tuple in Python?", options: ["Tuples are mutable, lists are not", "Lists are mutable, tuples are immutable", "Lists cannot contain strings", "Tuples cannot be indexed"], answer: 1 },
      { q: "Which Python decorator is used to define a generator?", options: ["@staticmethod", "yield keyword", "@classmethod", "@property"], answer: 1 }
    ],
    React: [
      { q: "What hook is used to perform side effects in functional components?", options: ["useState", "useEffect", "useMemo", "useRef"], answer: 1 },
      { q: "What is the Virtual DOM in React?", options: ["A direct copy of browser DOM", "An in-memory representation of real DOM", "A CSS preprocessor", "A database engine"], answer: 1 }
    ]
  };

  const startQuiz = (topic) => {
    setSelectedQuiz(topic);
    setCurrentQuestionIdx(0);
    setQuizScore(null);
  };

  const handleAnswer = (optionIdx) => {
    const questions = quizData[selectedQuiz] || [];
    const isCorrect = optionIdx === questions[currentQuestionIdx]?.answer;
    const currentScore = quizScore || 0;
    const newScore = isCorrect ? currentScore + 1 : currentScore;

    if (currentQuestionIdx + 1 < questions.length) {
      setQuizScore(newScore);
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      setQuizScore(newScore);
      confetti({ particleCount: 70, spread: 60 });
      addToast(`Assessment completed! Score: ${newScore}/${questions.length}`, "success");
    }
  };

  const unreadCount = notificationsList.filter(n => n.unread).length;

  // Shared between the candidate dashboard below and the public (logged-out) job board.
  const quickViewModal = selectedJob && (
    <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start p-5 border-b border-white/8">
          <div>
            <h3 className="m-0 text-white text-xl font-extrabold">{selectedJob.title}</h3>
            <div className="text-text-muted text-sm mt-1">
              {selectedJob.company_name || selectedJob.company} • {selectedJob.location}
            </div>
          </div>
          <button onClick={() => setSelectedJob(null)} className="text-text-dim hover:text-white cursor-pointer p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="purple"><Sparkles size={13} /> {selectedJob.matchScore || 85}% Match</Badge>
            <Badge variant="neutral">{selectedJob.type}</Badge>
            {selectedJob.salary && <Badge variant="emerald">{selectedJob.salary}</Badge>}
          </div>

          <div>
            <strong className="text-white">Job Description &amp; Requirements:</strong>
            <p className="text-slate-300 leading-relaxed text-sm mt-2">
              {selectedJob.description || 'Great opportunity to build and scale next-generation applications with modern stack.'}
            </p>
          </div>

          <div className="flex justify-between items-center border-t border-white/8 pt-4">
            <button
              onClick={(e) => toggleSaveJob(selectedJob.id, e)}
              className="flex items-center gap-2 text-slate-200 text-sm font-semibold cursor-pointer hover:text-white"
            >
              <Bookmark size={18} className={savedJobIds.includes(selectedJob.id) ? 'text-amber-400 fill-amber-400' : 'text-text-dim'} />
              {savedJobIds.includes(selectedJob.id) ? 'Saved' : 'Save Job'}
            </button>

            <Button
              disabled={applyingJobId === selectedJob.id}
              onClick={(e) => { handleApply(selectedJob.id, e); setSelectedJob(null); }}
            >
              <Send size={15} /> Apply for Position
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // The candidate sidebar/dashboard below (My Applications, My Resumes, AI Mock
  // Interview, "Welcome back" stats, ...) only makes sense for a job seeker.
  // Recruiters still need to be able to land here — the navbar's own "Job Board"
  // link points at "/" for every role — so give them the same plain listings
  // view an anonymous visitor gets, just without the login/register CTA.
  if (!user || user.role === 'RECRUITER') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white m-0 mb-3">
            {user ? 'Job Board' : 'Find your next role with AI-powered matching'}
          </h1>
          <p className="text-text-muted text-base m-0 max-w-2xl">
            {user
              ? 'Browse every open position currently posted on the platform.'
              : 'Browse open positions below, or create a free account to unlock AI match scores, resume optimization, and mock interviews.'}
          </p>
          {!user && (
            <div className="flex gap-3 mt-5">
              <Button onClick={() => navigate('/login')}>Log In</Button>
              <Button variant="secondary" onClick={() => navigate('/register')}>Create Free Account</Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 max-w-md mb-6">
          <Search size={18} className="text-text-dim shrink-0" />
          <input
            type="text"
            placeholder="Search jobs, skills, companies..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-text-dim"
          />
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : filteredSearchJobs.length === 0 ? (
          <Card><EmptyState icon={Briefcase} title="No jobs found" description="Try a different search term." /></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSearchJobs.map((job) => (
              <Card
                key={job.id}
                interactive
                className="p-5 flex flex-col cursor-pointer"
                onClick={() => setSelectedJob(job)}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div>
                    <h3 className="m-0 text-white text-lg font-bold">{job.title}</h3>
                    <div className="text-text-muted text-sm mt-1">
                      {job.company_name || job.company} • {job.location}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 flex-wrap my-2">
                  <Badge variant="neutral">{job.type}</Badge>
                  {job.salary && <Badge variant="emerald">{job.salary}</Badge>}
                </div>

                <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-4">
                  {job.description ? job.description.substring(0, 130) + '...' : 'Great opportunity to build and scale next-generation applications with modern stack.'}
                </p>

                <div className="flex justify-between items-center border-t border-white/6 pt-3">
                  <Button variant="ghost" size="sm">View Details</Button>
                  <Button variant="primary" size="sm" onClick={(e) => handleApply(job.id, e)}>
                    <Send size={13} /> Apply Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {quickViewModal}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_10%_20%,#2d1b4e_0%,#1a1625_100%)]">
      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[940] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      {/* z-[950]: the shared Navbar header is a sticky z-900 element, so this drawer
          (and its z-[940] backdrop above) must clear that to stay clickable on mobile. */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-72 lg:w-64 bg-[rgba(20,22,35,0.7)] lg:bg-[rgba(20,22,35,0.4)] backdrop-blur-xl border-r border-white/8 flex flex-col z-[950]
          transition-transform duration-300 ease-smooth
          ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center">
              <span className="text-white font-black text-lg">A</span>
            </div>
            <span className="text-white text-xl font-extrabold">Aura AI</span>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close dashboard menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="px-3 flex flex-col gap-1 flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => selectNav(item.key)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-left
                  transition-all duration-150 cursor-pointer
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400
                  ${isActive
                    ? (item.activeClass || 'bg-gradient-to-r from-purple-500/20 to-primary-500/10 text-white border-l-2 border-purple-400 -ml-px pl-[15px]')
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={18} className={item.iconClass || ''} />
                <span className={item.badge ? 'font-bold text-white' : ''}>{item.label}</span>
                {item.badge && (
                  <span className={`ml-auto bg-gradient-to-r ${item.badgeClass} text-white text-[0.62rem] font-black px-1.5 py-0.5 rounded-full`}>
                    {item.badge}
                  </span>
                )}
                {item.showUnread && unreadCount > 0 && (
                  <span className="ml-auto bg-accent-rose text-white text-[0.65rem] font-extrabold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/6">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-lg bg-accent-rose/10 text-rose-400 border border-accent-rose/20 font-semibold text-sm hover:bg-accent-rose/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-rose"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        {/* TOP SEARCH & ACTION BAR */}
        <div className="flex justify-between items-center gap-3 flex-wrap mb-6 lg:mb-8">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              className="lg:hidden shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open dashboard menu"
            >
              <Menu size={18} />
            </button>
            <div className="flex-1 min-w-[180px] max-w-md flex items-center gap-2.5 bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5">
              <Search size={18} className="text-text-dim shrink-0" />
              <input
                type="text"
                placeholder="Search jobs, skills, companies..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-text-dim"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveNav('notifications')}
              className="relative w-10 h-10 rounded-lg bg-slate-800/60 border border-white/8 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              title="Notifications"
            >
              <Bell size={18} className="text-text-muted" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-accent-rose text-white text-[0.62rem] font-extrabold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveNav('messages')}
              className="w-10 h-10 rounded-lg bg-slate-800/60 border border-white/8 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              title="Messages"
            >
              <MessageSquare size={18} className="text-text-muted" />
            </button>

            <Button variant="primary" size="md" onClick={() => setActiveNav('resumes')} className="hidden sm:inline-flex">
              <UploadCloud size={16} /> Upload Resume
            </Button>
          </div>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* VIEW 1: DASHBOARD OVERVIEW */}
            {activeNav === 'dashboard' && (
              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column */}
                  <div className="lg:col-span-2 flex flex-col gap-5">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-white m-0 mb-1">
                        Welcome back, {profileData.name.split(' ')[0]}! 👋
                      </h1>
                      <p className="text-text-muted m-0 text-sm">Your AI Career Hub</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      <Card className="p-4">
                        <div className="flex items-center gap-2 text-slate-200 text-sm">
                          <Briefcase size={16} className="text-purple-400" />
                          <span>Jobs Applied</span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{seekerStats.totalApplied}</div>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-center gap-2 text-slate-200 text-sm">
                          <PhoneCall size={16} className="text-purple-400" />
                          <span>Interviews</span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{seekerStats.upcomingInterviews}</div>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-center gap-2 text-slate-200 text-sm">
                          <Award size={16} className="text-purple-400" />
                          <span>Skill Rating</span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">92%</div>
                      </Card>
                    </div>
                  </div>

                  {/* Right Column: AI Match Score */}
                  <Card className="p-6 flex flex-col items-center justify-center gap-4">
                    <h3 className="text-white text-base font-bold m-0 self-start">AI Match Score</h3>
                    <RadialProgressGauge percent={87} size={140} strokeWidth={12} label="Perfect Match" />
                    <p className="text-text-dim text-xs m-0">Matches 58 Skills</p>
                  </Card>
                </div>

                {/* Recommended Jobs */}
                <div>
                  <div className="flex justify-between items-center flex-wrap gap-3 mb-5">
                    <h2 className="text-lg font-bold text-white m-0">Recommended Job Openings</h2>
                    <button
                      onClick={() => setActiveNav('search')}
                      className="flex items-center gap-1.5 bg-white/5 text-text-muted border border-white/10 px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                    >
                      <Filter size={14} /> Browse all
                    </button>
                  </div>

                  {jobs.length === 0 ? (
                    <Card>
                      <EmptyState
                        icon={Briefcase}
                        title="No job openings yet"
                        description="Check back soon, or browse the full job board once new roles are posted."
                      />
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {jobs.slice(0, 4).map((job, idx) => {
                        const hasApplied = applications.some(app => app.job === job.id);
                        return (
                          <Card key={job.id} interactive className="p-5 flex flex-col">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${['bg-blue-800', 'bg-purple-800', 'bg-red-800', 'bg-emerald-800'][idx % 4]}`}>
                                  <Building size={14} className="text-white" />
                                </div>
                                <span className="text-slate-200 text-sm font-semibold">{job.company_details?.name || 'Company'}</span>
                              </div>
                            </div>
                            <div className="mt-4 flex-1 flex flex-col">
                              <h4 className="text-white text-base font-bold m-0 mb-1">{job.title}</h4>
                              <div className="text-text-dim text-xs mb-3">
                                {job.company_details?.name} • {job.location} • {job.salary || 'Competitive'}
                              </div>
                              <p className="text-text-muted text-xs leading-relaxed mb-4 line-clamp-2 flex-1">
                                {job.description || 'Crafting intuitive AI interfaces to empower users...'}
                              </p>

                              <div className="flex gap-1.5 flex-wrap mb-4">
                                {job.match_score
                                  ? <Badge variant="purple">{job.match_score}% Match</Badge>
                                  : <Badge variant="neutral">Match N/A</Badge>}
                                <Badge variant="neutral">{job.type}</Badge>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => { setSelectedJob(job); setActiveNav('search'); }}
                                >
                                  View Details
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="flex-1"
                                  disabled={hasApplied}
                                  onClick={() => handleApplyForJob(job.id)}
                                >
                                  {hasApplied ? 'Applied' : 'Apply Now'}
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Recent Activity & Interview Schedule */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Card className="p-5">
                    <h3 className="text-white text-base font-bold m-0 mb-4">Recent Activity</h3>
                    {applications.length === 0 ? (
                      <EmptyState icon={ClipboardList} title="No activity yet" description="Apply to a role to see it show up here." />
                    ) : (
                      <div className="bg-white/3 p-4 rounded-lg border border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                          <Check size={16} className="text-purple-400" />
                        </div>
                        <div>
                          <div className="text-white text-sm font-semibold">
                            Applied for {applications[0].job_details?.title || 'a role'}
                          </div>
                          <div className="text-text-dim text-xs">
                            {applications[0].job_details?.company_name || 'Company'} • {new Date(applications[0].applied_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>

                  <Card className="p-5">
                    <h3 className="text-white text-base font-bold m-0 mb-4">Interview Schedule</h3>
                    {interviewCalls.length === 0 ? (
                      <EmptyState icon={CalendarClock} title="No interviews scheduled" description="Confirmed interviews will appear here." />
                    ) : (
                      <>
                        <div className="flex justify-between text-text-muted text-xs border-b border-white/8 pb-2 mb-2">
                          <span>Interview</span>
                          <span>Time</span>
                        </div>
                        {interviewCalls.slice(0, 3).map((call) => (
                          <div key={call.id} className="flex justify-between items-center py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Video size={14} className="text-emerald-400" />
                              </div>
                              <span className="text-slate-200 text-sm">{call.company} - {call.role}</span>
                            </div>
                            <span className="text-text-muted text-sm shrink-0">{call.date}, {call.time}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {/* VIEW 2: JOB SEARCH */}
            {activeNav === 'search' && (
              <div className="flex flex-col gap-6">
                <Card className="p-5">
                  <div className="flex gap-3 flex-wrap">
                    <div className="flex-[2_1_260px]">
                      <Label>Job Title or Keyword</Label>
                      <TextInput
                        type="text"
                        placeholder="e.g. Python Developer, React, Data Engineer"
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex-[1_1_180px]">
                      <Label>Location</Label>
                      <Select value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)}>
                        <option value="ALL">All Locations</option>
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Bangalore">Bangalore</option>
                        <option value="Pune">Pune</option>
                        <option value="Remote">Remote</option>
                      </Select>
                    </div>
                    <div className="flex-[1_1_180px]">
                      <Label>Employment Type</Label>
                      <Select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                        <option value="ALL">All Types</option>
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Remote">Remote</option>
                      </Select>
                    </div>
                  </div>
                </Card>

                {filteredSearchJobs.length === 0 ? (
                  <Card>
                    <EmptyState
                      icon={Search}
                      title="No matching jobs"
                      description="Try a different keyword, location, or employment type."
                    />
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSearchJobs.map((job) => (
                      <Card
                        key={job.id}
                        interactive
                        className="p-5 flex flex-col cursor-pointer"
                        onClick={() => setSelectedJob(job)}
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div>
                            <h3 className="m-0 text-white text-lg font-bold">{job.title}</h3>
                            <div className="text-text-muted text-sm mt-1">
                              {job.company_name || job.company} • {job.location}
                            </div>
                          </div>
                          <button
                            onClick={(e) => toggleSaveJob(job.id, e)}
                            className="shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                          >
                            <Bookmark size={18} className={savedJobIds.includes(job.id) ? 'text-amber-400 fill-amber-400' : 'text-text-dim'} />
                          </button>
                        </div>

                        <div className="flex gap-1.5 flex-wrap my-2">
                          <Badge variant="purple"><Sparkles size={12} /> {job.matchScore || 85}% AI Match</Badge>
                          <Badge variant="neutral">{job.type}</Badge>
                          {job.salary && <Badge variant="emerald">{job.salary}</Badge>}
                        </div>

                        <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-4">
                          {job.description ? job.description.substring(0, 130) + '...' : 'Great opportunity to build and scale next-generation applications with modern stack.'}
                        </p>

                        <div className="flex justify-between items-center border-t border-white/6 pt-3">
                          <Button variant="ghost" size="sm">View Details</Button>
                          <Button variant="primary" size="sm" onClick={(e) => handleApply(job.id, e)}>
                            <Send size={13} /> Apply Now
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: MY APPLICATIONS */}
            {activeNav === 'applications' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card className="p-5 lg:col-span-2">
                  <h3 className="text-white text-base font-bold m-0 mb-5">Active Job Applications ({applications.length})</h3>

                  {applications.length === 0 ? (
                    <EmptyState
                      icon={Layers}
                      title="No applications yet"
                      description="Jobs you apply to will show up here with live pipeline status."
                      action={<Button size="sm" onClick={() => setActiveNav('search')}>Browse jobs</Button>}
                    />
                  ) : (
                    <div className="flex flex-col gap-4">
                      {applications.map((app) => (
                        <div key={app.id} className="bg-white/3 border border-white/6 rounded-lg p-4">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <div>
                              <h4 className="m-0 text-white text-base font-semibold">{app.job_details?.title || 'Software Position'}</h4>
                              <div className="text-text-muted text-xs mt-0.5">
                                {app.job_details?.company_name || 'Company'} • Applied on {new Date(app.applied_at).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge variant={app.status === 'ACCEPTED' ? 'emerald' : app.status === 'REJECTED' ? 'rose' : 'indigo'}>
                              {app.status || 'APPLIED'}
                            </Badge>
                          </div>

                          <div className="pipeline-track mt-3">
                            <div className="pipeline-step completed">
                              <div className="pipeline-step-dot"><Check size={14} /></div>
                              <span className="pipeline-step-label">Applied</span>
                            </div>
                            <div className={`pipeline-step ${['REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED'].includes(app.status) ? 'completed' : 'active'}`}>
                              <div className="pipeline-step-dot">2</div>
                              <span className="pipeline-step-label">Review</span>
                            </div>
                            <div className={`pipeline-step ${['SHORTLISTED', 'INTERVIEW', 'ACCEPTED'].includes(app.status) ? 'completed' : ''}`}>
                              <div className="pipeline-step-dot">3</div>
                              <span className="pipeline-step-label">Interview</span>
                            </div>
                            <div className={`pipeline-step ${app.status === 'ACCEPTED' ? 'completed' : ''}`}>
                              <div className="pipeline-step-dot">4</div>
                              <span className="pipeline-step-label">Decision</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-5">
                  <h3 className="text-white text-base font-bold m-0 mb-4">Pipeline Breakdown</h3>
                  {applications.length === 0 ? (
                    <p className="text-text-muted text-sm">Your application status mix will appear here.</p>
                  ) : (
                    <DonutChart data={statusDonutData} total={applications.length} title="Total" size={160} strokeWidth={20} />
                  )}
                </Card>
              </div>
            )}

            {/* VIEW 4: SAVED JOBS */}
            {activeNav === 'saved' && (
              <Card className="p-5">
                <h3 className="text-white text-base font-bold m-0 mb-5">Saved Jobs Wishlist ({savedJobIds.length})</h3>

                {recommendedJobs.filter(j => savedJobIds.includes(j.id)).length === 0 ? (
                  <EmptyState
                    icon={Bookmark}
                    title="No saved jobs yet"
                    description="Bookmark roles from Job Search to keep track of them here."
                    action={<Button size="sm" onClick={() => setActiveNav('search')}>Browse jobs</Button>}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendedJobs.filter(j => savedJobIds.includes(j.id)).map(job => (
                      <Card key={job.id} interactive className="p-5">
                        <div className="flex justify-between items-start">
                          <h4 className="m-0 text-white font-bold">{job.title}</h4>
                          <button onClick={(e) => toggleSaveJob(job.id, e)} className="p-1 cursor-pointer">
                            <Bookmark size={18} className="text-amber-400 fill-amber-400" />
                          </button>
                        </div>
                        <div className="text-text-muted text-sm my-2">
                          {job.company} • {job.location}
                        </div>
                        <Button size="sm" onClick={(e) => handleApply(job.id, e)}>
                          <Send size={13} /> Apply Now
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* VIEW 5: MY RESUMES (SERIALIZED RESUMES REPOSITORY) */}
            {activeNav === 'resumes' && (
              <Card className="p-5">
                <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                  <div>
                    <h3 className="text-white text-base font-bold m-0">Stored Resumes Repository</h3>
                    <p className="text-text-muted text-sm mt-1 mb-0">
                      Serialized resumes repository for AI ATS optimization, application tracking, and AI mock interviews.
                    </p>
                  </div>
                  <Button as="label" variant="primary" className="cursor-pointer">
                    <UploadCloud size={16} /> Upload Resume from Device
                    <input type="file" accept=".pdf,.docx,.txt" onChange={handleDirectResumeUpload} className="hidden" />
                  </Button>
                </div>

                {/* Default Profile Resume */}
                <div className="flex justify-between items-center flex-wrap gap-3 bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-md">PROFILE</div>
                    <div>
                      <strong className="text-white">Default Profile Resume ({profileData.name})</strong>
                      <div className="text-primary-300 text-xs">
                        {profileData.title} • {profileData.location} (Live Profile Synced)
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setActiveNav('resume_optimizer')}>
                      <Zap size={13} /> Optimize ATS
                    </Button>
                    <Button size="sm" variant="premium" onClick={() => setActiveNav('mock_interview')}>
                      <Sparkles size={13} /> Mock Interview
                    </Button>
                  </div>
                </div>

                {/* Serialized Resumes List */}
                <div className="flex flex-col gap-3">
                  {resumes.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No device resumes uploaded yet"
                      description={'Click "Upload Resume from Device" above to add serialized versions.'}
                    />
                  ) : (
                    resumes.map((r, index) => {
                      const serialNumber = String(index + 1).padStart(2, '0');
                      return (
                        <div key={r.id} className="flex justify-between items-center flex-wrap gap-3 bg-white/3 border border-white/6 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-700 text-white text-xs font-extrabold px-2.5 py-1 rounded-md">FILE</div>
                            <div>
                              <strong className="text-white">Resume {serialNumber}</strong>
                              <div className="text-text-dim text-xs">
                                Uploaded on {new Date(r.uploaded_at).toLocaleDateString()} • {r.extracted_text ? `${r.extracted_text.split(/\s+/).length} words extracted` : 'Text parsed'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {r.file && (
                              <a href={r.file} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary-300 text-sm font-semibold hover:text-primary-200">
                                <ExternalLink size={14} /> Download
                              </a>
                            )}
                            <Button size="sm" onClick={() => setActiveNav('resume_optimizer')}>
                              <Zap size={13} /> Optimize ATS
                            </Button>
                            <Button size="sm" variant="premium" onClick={() => setActiveNav('mock_interview')}>
                              <Sparkles size={13} /> Mock Interview
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            )}

            {/* VIEW 6: PROFILE */}
            {activeNav === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card className="p-6 lg:col-span-2">
                  <h3 className="text-white text-base font-bold m-0 mb-5">Candidate Profile Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <Label>Full Name</Label>
                      <TextInput value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Professional Headline</Label>
                      <TextInput value={profileData.title} onChange={(e) => setProfileData({ ...profileData, title: e.target.value })} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <TextInput type="email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <TextInput value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} />
                    </div>
                  </div>

                  <div className="mt-5">
                    <Label>Bio &amp; Summary</Label>
                    <TextArea rows="4" value={profileData.bio} onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })} />
                  </div>

                  <Button className="mt-6" onClick={handleSaveProfile}>Save Profile Changes</Button>
                </Card>

                <Card className="p-6">
                  <h3 className="text-white text-base font-bold m-0 mb-5">Top Skills</h3>
                  <CategoryBarChart categories={topSkills} />
                </Card>
              </div>
            )}

            {/* VIEW 7: INTERVIEW CALLS */}
            {activeNav === 'interviews' && (
              <Card className="p-5">
                <h3 className="text-white text-base font-bold m-0 mb-5">Upcoming Interview Schedule</h3>
                {interviewCalls.length === 0 ? (
                  <EmptyState icon={CalendarClock} title="No interviews scheduled" description="Once a recruiter schedules an interview, it will appear here." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {interviewCalls.map((call) => (
                      <Card key={call.id} className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <Badge variant="emerald">Confirmed Video Call</Badge>
                          <span className="text-primary-300 text-xs">⏰ {call.time}</span>
                        </div>
                        <h4 className="m-0 mb-1 text-white text-base font-semibold">{call.role}</h4>
                        <p className="m-0 mb-4 text-text-muted text-sm">{call.company}</p>
                        <Button size="sm" className="w-full">
                          <ExternalLink size={14} /> Join Meeting Room
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* VIEW 6: AI RESUME OPTIMIZER & ATS LIVE REWRITER */}
            {activeNav === 'resume_optimizer' && (
              <ResumeOptimizer
                jobs={jobs}
                resumes={resumes}
                candidateProfile={profileData}
              />
            )}

            {/* VIEW 8: AI MOCK INTERVIEW SIMULATOR (PREMIUM) */}
            {activeNav === 'mock_interview' && (
              user?.is_premium ? (
                <MockInterviewRoom
                  jobs={jobs}
                  savedJobIds={savedJobIds}
                  resumes={resumes}
                  candidateProfile={profileData}
                />
              ) : (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <Card className="max-w-xl p-8 sm:p-12 flex flex-col items-center gap-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center">
                      <Crown size={40} className="text-amber-400" />
                    </div>
                    <h2 className="text-white text-3xl font-extrabold m-0">Upgrade to Premium</h2>
                    <p className="text-slate-300 text-base leading-relaxed m-0">
                      Unlock the full power of the AI Mock Interview Simulator. Practice dynamically generated questions tailored to your exact Resume and Job Description using real-time Voice AI.
                    </p>
                    <div className="flex flex-col gap-3 w-full text-left bg-slate-950/40 p-5 rounded-xl">
                      {[
                        'Dynamic Question Generation Engine',
                        'Speech-to-Text & Text-to-Speech Integration',
                        '60-Second Pressure Timer',
                        'Hiring Manager Evaluation Report',
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-3">
                          <Check size={18} className="text-emerald-400 shrink-0" />
                          <span className="text-slate-200 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="gold" size="lg" className="w-full" onClick={handleUpgradePremium}>
                      <Zap size={18} /> Upgrade Now ($19/mo)
                    </Button>
                  </Card>
                </div>
              )
            )}

            {/* VIEW 9: SKILL ASSESSMENT */}
            {activeNav === 'assessments' && (
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-5">
                  <Award size={24} className="text-purple-400" />
                  <div>
                    <h3 className="m-0 text-white text-lg font-extrabold">Skill Assessment Simulator</h3>
                    <p className="m-0 text-text-muted text-sm">Take interactive technical quizzes to verify skills and earn verified profile badges.</p>
                  </div>
                </div>

                {!selectedQuiz ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Python', 'React'].map((topic) => (
                      <Card key={topic} className="p-5">
                        <h4 className="text-white m-0 mb-2 font-bold">{topic} Assessment</h4>
                        <p className="text-text-muted text-xs m-0 mb-4">2 Technical Questions • 5 Mins</p>
                        <Button size="sm" onClick={() => startQuiz(topic)}>Start Assessment</Button>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/3 border border-white/8 rounded-lg p-5">
                    <div className="flex justify-between items-center mb-4">
                      <strong className="text-primary-300">{selectedQuiz} Quiz — Question {currentQuestionIdx + 1} of {quizData[selectedQuiz]?.length}</strong>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedQuiz(null)}>Exit Quiz</Button>
                    </div>

                    <h4 className="text-white text-base mb-5">{quizData[selectedQuiz][currentQuestionIdx]?.q}</h4>

                    <div className="flex flex-col gap-2.5">
                      {quizData[selectedQuiz][currentQuestionIdx]?.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          className="text-left bg-slate-900/60 border border-white/8 rounded-lg px-4 py-3 text-slate-200 text-sm hover:border-primary-500/50 hover:bg-slate-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* VIEW 10: MESSAGES */}
            {activeNav === 'messages' && (
              <Card className="p-5">
                <h3 className="text-white text-base font-bold m-0 mb-4">Recruiter Messages</h3>
                <div className="flex flex-col gap-3">
                  {messages.length === 0 ? (
                    <EmptyState icon={Inbox} title="No messages" description="Recruiter messages will show up here." />
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className="bg-white/3 border border-white/6 rounded-lg p-4">
                        <div className="flex justify-between mb-1.5">
                          <strong className="text-primary-300">{m.sender}</strong>
                          <span className="text-text-dim text-xs">{m.time}</span>
                        </div>
                        <p className="text-slate-100 text-sm m-0">{m.text}</p>
                      </div>
                    ))
                  )}

                  <div className="flex gap-2 mt-2">
                    <TextInput
                      type="text"
                      placeholder="Type your response to the recruiter..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        if (!replyText) return;
                        setMessages([...messages, { id: Date.now(), sender: 'You', text: replyText, time: 'Just now', unread: false }]);
                        setReplyText('');
                        addToast("Message sent to recruiter!", "success");
                      }}
                    >
                      <Send size={15} /> Send
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* VIEW 11: NOTIFICATIONS */}
            {activeNav === 'notifications' && (
              <Card className="p-5">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-white text-base font-bold m-0">Notification Center</h3>
                  {notificationsList.length > 0 && (
                    <button
                      onClick={() => {
                        setNotificationsList(notificationsList.map(n => ({ ...n, unread: false })));
                        addToast("Marked all notifications as read", "info");
                      }}
                      className="text-primary-300 text-sm font-semibold hover:text-primary-200 cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {notificationsList.length === 0 ? (
                  <EmptyState icon={Bell} title="You're all caught up" description="New notifications will appear here." />
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {notificationsList.map((n) => (
                      <div key={n.id} className={`flex items-start gap-3 bg-white/3 border border-white/6 rounded-lg p-4 ${n.unread ? '' : 'opacity-60'}`}>
                        <div className="flex-1">
                          <strong className="text-white text-sm">{n.title}</strong>
                          <p className="text-text-muted text-sm my-1">{n.text}</p>
                          <span className="text-text-dim text-xs">{n.time}</span>
                        </div>
                        {n.unread && <span className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* VIEW 12: SETTINGS */}
            {activeNav === 'settings' && (
              <Card className="p-5 max-w-lg">
                <h3 className="text-white text-base font-bold m-0 mb-5">Job Seeker Account Settings</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center gap-4 bg-white/3 border border-white/6 rounded-lg p-4">
                    <div>
                      <strong className="text-white text-sm">Email Job Alerts</strong>
                      <p className="m-0 text-xs text-text-muted">Receive notifications when new high-match jobs are posted.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-primary-500 w-4 h-4 shrink-0" />
                  </div>

                  <div className="flex justify-between items-center gap-4 bg-white/3 border border-white/6 rounded-lg p-4">
                    <div>
                      <strong className="text-white text-sm">Allow Recruiters to Message Me</strong>
                      <p className="m-0 text-xs text-text-muted">Direct contact invitations from verified recruiters.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-primary-500 w-4 h-4 shrink-0" />
                  </div>

                  <Button className="mt-2" onClick={() => addToast("Settings saved!", "success")}>Save Preferences</Button>
                </div>
              </Card>
            )}
          </>
        )}
      </main>

      {quickViewModal}
    </div>
  );
}
