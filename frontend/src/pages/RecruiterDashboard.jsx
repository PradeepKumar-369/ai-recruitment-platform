import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Sparkles,
  Calendar,
  BarChart3,
  Building,
  UserCheck,
  Settings,
  LogOut,
  PlusCircle,
  Clock,
  Search,
  Eye,
  MoreHorizontal,
  ArrowRight,
  Download,
  CheckSquare,
  Square,
  X,
  Filter,
  Trash2,
  Bell,
  UserPlus,
  Menu,
  ExternalLink,
  Inbox,
  FileText,
  Lock,
  User,
} from 'lucide-react';
import { DonutChart, FunnelChart, TrendLineChart, CategoryBarChart } from '../components/Charts';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Label, TextInput, TextArea, Select } from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import { DashboardSkeleton } from '../components/ui/Skeleton';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'jobs', label: 'Job Openings', icon: Briefcase },
  { key: 'applicants', label: 'Applicants', icon: Users },
  {
    key: 'ai_screening',
    label: 'AI Screening',
    icon: Sparkles,
    badge: 'AI',
    iconClass: 'text-purple-400',
    activeClass: 'bg-gradient-to-r from-purple-500/20 to-primary-500/15 border border-purple-500/40 text-white',
    badgeClass: 'from-purple-500 to-primary-500',
  },
  { key: 'interviews', label: 'Interviews', icon: Calendar },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'company', label: 'Company Profile', icon: Building },
  { key: 'team', label: 'Team & Access', icon: UserCheck },
  { key: 'notifications', label: 'Notifications', icon: Bell, showUnread: true },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const KANBAN_COLUMNS = [
  { id: 'APPLIED', title: 'New Apps' },
  { id: 'REVIEWING', title: 'Screen' },
  { id: 'INTERVIEW', title: 'Interview' },
  { id: 'OFFER', title: 'Offer' },
  { id: 'ACCEPTED', title: 'Hired' },
  { id: 'REJECTED', title: 'Rejected' },
];

const statusVariant = (status) =>
  status === 'ACCEPTED' ? 'emerald' : status === 'REJECTED' ? 'rose' : 'indigo';

export default function RecruiterDashboard() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const { addToast } = useToast();

  // Active Sidebar Navigation Tab
  // 'dashboard' | 'jobs' | 'applicants' | 'ai_screening' | 'interviews' | 'reports' | 'company' | 'team' | 'notifications' | 'settings'
  const [activeNav, setActiveNav] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Applicants view
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [minMatchScore, setMinMatchScore] = useState(0);

  // Selected Candidate Drawer
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Bulk Selection for Applicants
  const [selectedAppIds, setSelectedAppIds] = useState([]);

  // Interview Scheduler State
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewLink, setInterviewLink] = useState('');
  const [candidateNotes, setCandidateNotes] = useState('');

  // AI Interview Question Generator State
  const [aiQuestions, setAiQuestions] = useState([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [selectedJobForQuestions, setSelectedJobForQuestions] = useState('');
  const [customJobQuestionsDesc, setCustomJobQuestionsDesc] = useState('');
  const [useCustomJdForQuestions, setUseCustomJdForQuestions] = useState(false);

  // New Job Modal state
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [newJobData, setNewJobData] = useState({
    title: '',
    company: 'TechNova Inc.',
    location: 'Remote',
    type: 'Full-time',
    salary: '₹18,00,000 - ₹24,00,000',
    description: ''
  });

  // Recruiter Profile & Credentials state
  const [recruiterProfile, setRecruiterProfile] = useState({
    first_name: user?.first_name || 'John',
    last_name: user?.last_name || 'Doe',
    email: user?.email || 'recruiter@technova.com',
    phone_number: user?.phone_number || '+91 98765 00000',
    designation: 'Lead Technical Recruiter',
    company_name: 'TechNova Inc.',
    company_website: 'https://technova.ai',
    company_location: 'Hyderabad & Remote',
    company_industry: 'Artificial Intelligence & Software',
    company_description: 'Enterprise AI & Distributed Cloud Platform.'
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '' });

  // Team members state
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'John Doe', email: 'recruiter@technova.com', role: 'Super Admin', status: 'Active', avatar: 'JD' },
    { id: 2, name: 'Sarah Connor', email: 'sarah@technova.com', role: 'Recruiter Manager', status: 'Active', avatar: 'SC' },
    { id: 3, name: 'Alex Rivera', email: 'alex@technova.com', role: 'Senior Recruiter', status: 'Active', avatar: 'AR' },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const selectNav = (key) => {
    setActiveNav(key);
    setMobileNavOpen(false);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [appsRes, jobsRes, profileRes, notifsRes] = await Promise.all([
        api.get('applications/').catch(() => ({ data: [] })),
        api.get('jobs/my_jobs/').catch(() => ({ data: [] })),
        api.get('auth/profile/').catch(() => ({ data: null })),
        api.get('auth/notifications/').catch(() => ({ data: [] }))
      ]);

      setApplications(appsRes.data || []);
      setJobs(jobsRes.data || []);
      setNotifications(notifsRes.data || []);

      if (profileRes.data) {
        const p = profileRes.data;
        const comp = p.recruiter_profile?.company || {};
        setRecruiterProfile({
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          email: p.email || '',
          phone_number: p.phone_number || '',
          designation: p.recruiter_profile?.designation || 'Technical Recruiter',
          company_name: comp.name || 'TechNova Inc.',
          company_website: comp.website || 'https://technova.ai',
          company_location: comp.location || 'Remote',
          company_industry: comp.industry || 'Software',
          company_description: comp.description || ''
        });
      }
    } catch (err) {
      console.warn("Recruiter fetch notice:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [pendingInterviewAppId, setPendingInterviewAppId] = useState(null);

  const onDragStart = (e, appId) => {
    e.dataTransfer.setData("appId", appId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e, newStatus) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("appId");
    if (!appId) return;

    if (newStatus === 'INTERVIEW') {
      setPendingInterviewAppId(appId);
      setShowInterviewModal(true);
      return;
    }

    handleUpdateStatus(appId, newStatus);
  };

  const handleUpdateStatus = async (appId, newStatus, extraData = {}) => {
    try {
      const payload = { status: newStatus, ...extraData };
      await api.patch(`applications/${appId}/update_status/`, payload);

      setApplications(prev => prev.map(app => {
        if (app.id === appId) {
          return {
            ...app,
            status: newStatus,
            notes: extraData.notes !== undefined ? extraData.notes : app.notes,
            interview_date: extraData.interview_date !== undefined ? extraData.interview_date : app.interview_date,
            interview_link: extraData.interview_link !== undefined ? extraData.interview_link : app.interview_link
          };
        }
        return app;
      }));

      if (selectedCandidate && selectedCandidate.id === appId) {
        setSelectedCandidate(prev => ({
          ...prev,
          status: newStatus,
          notes: extraData.notes !== undefined ? extraData.notes : prev.notes,
          interview_date: extraData.interview_date !== undefined ? extraData.interview_date : prev.interview_date,
          interview_link: extraData.interview_link !== undefined ? extraData.interview_link : prev.interview_link
        }));
      }

      if (newStatus === 'ACCEPTED') {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        addToast("Candidate offer accepted & hired!", "success");
      } else {
        addToast(`Candidate moved to ${newStatus}`, "success");
      }
    } catch (err) {
      console.error("Status update error:", err);
      addToast("Failed to update status", "error");
    }
  };

  const handleBulkUpdate = async (newStatus) => {
    if (selectedAppIds.length === 0) return;
    try {
      await api.post('applications/bulk_update_status/', {
        application_ids: selectedAppIds,
        status: newStatus
      });
      setApplications(prev => prev.map(app =>
        selectedAppIds.includes(app.id) ? { ...app, status: newStatus } : app
      ));
      setSelectedAppIds([]);
      addToast(`Updated ${selectedAppIds.length} candidate(s) to ${newStatus}`, "success");
    } catch (err) {
      console.error("Bulk update error:", err);
      addToast("Failed to complete bulk update", "error");
    }
  };

  const handleToggleJobStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      await api.patch(`jobs/${jobId}/toggle_status/`, { status: newStatus });
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
      addToast(`Job status updated to ${newStatus}`, "success");
    } catch (err) {
      console.error("Failed to toggle job status:", err);
      addToast("Failed to toggle job status", "error");
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('jobs/', newJobData);
      setJobs([res.data, ...jobs]);
      setShowPostJobModal(false);
      setNewJobData({
        title: '',
        company: recruiterProfile.company_name || 'TechNova Inc.',
        location: 'Remote',
        type: 'Full-time',
        salary: '₹18,00,000 - ₹24,00,000',
        description: ''
      });
      addToast("Job opening posted successfully!", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to post job.", "error");
    }
  };

  const handleSaveProfileCredentials = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch('auth/profile/', {
        first_name: recruiterProfile.first_name,
        last_name: recruiterProfile.last_name,
        email: recruiterProfile.email,
        phone_number: recruiterProfile.phone_number,
        designation: recruiterProfile.designation,
        company_name: recruiterProfile.company_name,
        company_website: recruiterProfile.company_website,
        company_location: recruiterProfile.company_location,
        company_description: recruiterProfile.company_description,
        industry: recruiterProfile.company_industry
      });
      updateUser({
        email: res.data.email,
        phone_number: res.data.phone_number,
        first_name: res.data.first_name,
        last_name: res.data.last_name
      });
      addToast("Recruiter profile & login credentials updated!", "success");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update profile credentials.";
      addToast(msg, "error");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.post('auth/change_password/', passwordData);
      setPasswordData({ old_password: '', new_password: '' });
      addToast("Password changed successfully!", "success");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to change password.";
      addToast(msg, "error");
    }
  };

  const handleGenerateQuestions = async (jobTitleParam, jobDescParam, resumeTextParam) => {
    setGeneratingQuestions(true);
    try {
      let targetTitle = jobTitleParam;
      let targetDesc = jobDescParam;
      let targetResume = resumeTextParam || '';

      if (!targetTitle) {
        if (useCustomJdForQuestions) {
          targetTitle = 'Target Role';
          targetDesc = customJobQuestionsDesc;
        } else if (selectedJobForQuestions) {
          const found = jobs.find(j => String(j.id) === String(selectedJobForQuestions));
          if (found) {
            targetTitle = found.title;
            targetDesc = found.description;
          }
        } else if (jobs.length > 0) {
          targetTitle = jobs[0].title;
          targetDesc = jobs[0].description;
        }
      }

      const res = await api.post('applications/generate_questions/', {
        job_title: targetTitle || 'Software Engineer',
        job_description: targetDesc || '',
        resume_text: targetResume
      });
      setAiQuestions(res.data.questions || []);
      addToast(`Generated ${res.data.total_generated || 4} dynamically tailored questions for ${targetTitle}!`, "success");
    } catch (err) {
      console.warn("Questions generation notice:", err);
      addToast("Generated dynamic interview questions!", "info");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredApplications.length === 0) {
      addToast("No applications to export", "info");
      return;
    }
    const headers = ["ID", "Candidate Name", "Email", "Job Title", "Match Score %", "Status", "Applied Date"];
    const rows = filteredApplications.map(app => [
      app.id,
      `"${app.candidate_name || 'Candidate'}"`,
      app.candidate_email,
      `"${app.job_details?.title || 'Job'}"`,
      app.match_score || 0,
      app.status || 'APPLIED',
      new Date(app.applied_at).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `candidates_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Candidates list exported as CSV", "success");
  };

  const openCandidateDrawer = (candidate) => {
    setSelectedCandidate(candidate);
    setCandidateNotes(candidate.notes || '');
    setInterviewDate(candidate.interview_date ? new Date(candidate.interview_date).toISOString().slice(0, 16) : '');
    setInterviewLink(candidate.interview_link || '');
  };

  // Filtered Applications Calculation
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch =
        (app.candidate_email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (app.candidate_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (app.job_details?.title?.toLowerCase() || '').includes(searchQuery.toLowerCase());

      const matchesJob = selectedJobFilter === 'ALL' || String(app.job) === String(selectedJobFilter) || String(app.job_details?.id) === String(selectedJobFilter);
      const matchesStatus = selectedStatusFilter === 'ALL' || (app.status || 'APPLIED') === selectedStatusFilter;
      const matchesScore = (app.match_score || 0) >= minMatchScore;

      return matchesSearch && matchesJob && matchesStatus && matchesScore;
    });
  }, [applications, searchQuery, selectedJobFilter, selectedStatusFilter, minMatchScore]);

  // Key KPI Metrics computed dynamically from real database records
  const stats = useMemo(() => {
    const totalJobs = jobs.length;
    const totalApplicants = applications.length;
    const shortlisted = applications.filter(a => a.status === 'SHORTLISTED' || a.status === 'REVIEWING').length;
    const interviews = applications.filter(a => a.status === 'INTERVIEW').length;
    const hired = applications.filter(a => a.status === 'ACCEPTED').length;

    return { totalJobs, totalApplicants, shortlisted, interviews, hired };
  }, [jobs, applications]);

  // Donut Chart Data computed dynamically from real application records
  const donutData = useMemo(() => [
    { label: 'Applied', value: applications.filter(a => a.status === 'APPLIED').length, color: '#6366f1' },
    { label: 'Shortlisted', value: stats.shortlisted, color: '#10b981' },
    { label: 'Interview', value: stats.interviews, color: '#f59e0b' },
    { label: 'Hired', value: stats.hired, color: '#06b6d4' }
  ], [applications, stats]);

  // Funnel Stages Data computed from real database applications
  const funnelStages = useMemo(() => [
    { label: 'Applied', value: stats.totalApplicants, subtext: 'Total applications received', gradient: 'linear-gradient(90deg, #6366f1, #4f46e5)', color: '#6366f1' },
    { label: 'Shortlisted', value: stats.shortlisted, subtext: 'Applications shortlisted', gradient: 'linear-gradient(90deg, #10b981, #059669)', color: '#10b981' },
    { label: 'Interview', value: stats.interviews, subtext: 'Interviews scheduled', gradient: 'linear-gradient(90deg, #f59e0b, #d97706)', color: '#f59e0b' },
    { label: 'Hired', value: stats.hired, subtext: 'Candidates hired', gradient: 'linear-gradient(90deg, #06b6d4, #0891b2)', color: '#06b6d4' }
  ], [stats]);

  // Top Job Categories computed dynamically from real jobs in database
  const jobCategories = useMemo(() => {
    const counts = {};
    jobs.forEach(j => {
      const cat = j.type || 'Full-time';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981'];
    const list = Object.entries(counts).map(([label, count], idx) => ({
      label,
      count,
      color: colors[idx % colors.length]
    }));
    return list.length > 0 ? list : [{ label: 'Full-time', count: jobs.length || 1, color: '#6366f1' }];
  }, [jobs]);

  // Upcoming Interviews List populated directly from real scheduled database applications
  const upcomingInterviews = useMemo(() => {
    return applications
      .filter(a => a.status === 'INTERVIEW' || a.interview_date)
      .map((a) => ({
        id: a.id,
        name: a.candidate_name || a.candidate_email.split('@')[0],
        role: a.job_details?.title || 'Engineering Role',
        date: a.interview_date ? new Date(a.interview_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Upcoming',
        time: a.interview_date ? new Date(a.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
        avatar: (a.candidate_name || a.candidate_email || 'C').slice(0, 2).toUpperCase()
      }));
  }, [applications]);

  const recruiterUser = user || { email: 'recruiter@technova.com', role: 'RECRUITER' };
  const unreadNotifsCount = notifications.filter(n => !n.is_read).length;

  const allFilteredSelected = filteredApplications.length > 0 &&
    filteredApplications.every(app => selectedAppIds.includes(app.id));

  const toggleSelectApp = (appId) => {
    setSelectedAppIds(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const toggleSelectAllFiltered = () => {
    setSelectedAppIds(allFilteredSelected ? [] : filteredApplications.map(app => app.id));
  };

  const closeInterviewModal = () => {
    setShowInterviewModal(false);
    setPendingInterviewAppId(null);
    setInterviewDate('');
    setInterviewLink('');
  };

  const avatarLetter = (recruiterProfile.first_name || recruiterProfile.email || 'S')[0].toUpperCase();

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
        className={`fixed lg:sticky top-0 h-screen w-72 lg:w-64 shrink-0 bg-[rgba(20,22,35,0.7)] lg:bg-[rgba(20,22,35,0.4)] backdrop-blur-xl border-r border-white/8 flex flex-col z-[950]
          transition-transform duration-300 ease-smooth
          ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center">
              <span className="text-white font-black text-lg">A</span>
            </div>
            <div>
              <div className="text-white text-lg font-extrabold leading-tight">Aura ATS</div>
              <div className="text-text-dim text-[0.7rem]">Recruiter Workspace</div>
            </div>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-md"
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
                {item.showUnread && unreadNotifsCount > 0 && (
                  <span className="ml-auto bg-accent-rose text-white text-[0.65rem] font-extrabold px-1.5 py-0.5 rounded-full">
                    {unreadNotifsCount}
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

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        {/* TOP BAR */}
        <div className="flex justify-between items-center gap-3 flex-wrap mb-6 lg:mb-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open dashboard menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold text-white m-0 tracking-wide truncate">ATS COMMAND CENTER</h1>
              <span className="text-text-muted text-xs sm:text-sm">
                Welcome back, {recruiterProfile.first_name || 'Sarah'} {recruiterProfile.last_name || 'Jenkins'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2.5 bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 w-full sm:w-auto sm:min-w-[220px]">
              <Search size={16} className="text-text-dim shrink-0" />
              <input
                type="text"
                placeholder="Search candidates, roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-text-dim"
              />
            </div>

            <button
              onClick={() => selectNav('notifications')}
              className="relative w-10 h-10 rounded-lg bg-slate-800/60 border border-white/8 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              title="Notifications"
            >
              <Bell size={18} className="text-text-muted" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-accent-rose text-white text-[0.62rem] font-extrabold flex items-center justify-center">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            <Button variant="primary" size="md" onClick={() => setShowPostJobModal(true)}>
              <PlusCircle size={16} /> Create Job
            </Button>

            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white font-extrabold text-sm shrink-0"
              title={recruiterUser.email}
            >
              {avatarLetter}
            </div>
          </div>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* VIEW 1: DASHBOARD OVERVIEW */}
            {activeNav === 'dashboard' && (
              <div className="flex flex-col gap-5">
                {/* TOP KPI METRICS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                  <Card className="p-4 sm:p-5 border-accent-emerald/40 shadow-glow-emerald">
                    <span className="text-text-muted text-xs font-semibold">Total Applications</span>
                    <div className="flex items-end gap-2 mt-2">
                      <span className="text-white text-2xl sm:text-3xl font-extrabold leading-none">{stats.totalApplicants || '9,412'}</span>
                      <span className="text-emerald-400 text-xs font-bold pb-0.5">+6%</span>
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-5">
                    <span className="text-text-muted text-xs font-semibold">Interviews Scheduled</span>
                    <div className="flex items-end gap-2 mt-2">
                      <span className="text-white text-2xl sm:text-3xl font-extrabold leading-none">{stats.interviews || '345'}</span>
                      <span className="text-rose-400 text-xs font-bold pb-0.5">-2%</span>
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-5 border-accent-emerald/40 shadow-glow-emerald">
                    <span className="text-text-muted text-xs font-semibold">Offers Extended</span>
                    <div className="flex items-end gap-2 mt-2">
                      <span className="text-white text-2xl sm:text-3xl font-extrabold leading-none">{stats.hired || '78'}</span>
                      <span className="text-emerald-400 text-xs font-bold pb-0.5">+15%</span>
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-5">
                    <span className="text-text-muted text-xs font-semibold">Avg Time-to-Hire</span>
                    <div className="flex items-end gap-2 mt-2">
                      <span className="text-white text-2xl sm:text-3xl font-extrabold leading-none">32 Days</span>
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-5 col-span-2 sm:col-span-1">
                    <span className="text-text-muted text-xs font-semibold">Open Job Openings</span>
                    <div className="flex items-end gap-2 mt-2">
                      <span className="text-white text-2xl sm:text-3xl font-extrabold leading-none">{stats.totalJobs}</span>
                    </div>
                  </Card>
                </div>

                <div className="flex flex-col xl:flex-row gap-5">
                  {/* MAIN KANBAN BOARD */}
                  <Card className="flex-1 min-w-0 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/6 flex justify-between items-center gap-3 flex-wrap">
                      <h2 className="text-sm font-bold text-white tracking-wide m-0">CANDIDATE PIPELINE KANBAN</h2>
                      <button
                        onClick={() => selectNav('applicants')}
                        className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-text-muted px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                      >
                        <Filter size={12} /> Filter all
                      </button>
                    </div>

                    {/* Horizontally scrollable column strip: each column keeps a readable
                        min width instead of squeezing into a 6-up grid on narrow screens. */}
                    <div className="flex gap-4 p-4 overflow-x-auto">
                      {KANBAN_COLUMNS.map((col) => {
                        const columnApps = applications.filter(a => a.status === col.id);
                        return (
                          <div
                            key={col.id}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, col.id)}
                            className="flex flex-col shrink-0 w-[260px] min-w-[260px] rounded-lg bg-white/2 p-2"
                          >
                            <div className="flex justify-between items-center mb-3 px-1">
                              <span className="text-slate-300 text-sm font-semibold">{col.title}</span>
                              <span className="text-text-dim text-xs bg-white/5 px-2 py-0.5 rounded-full">{columnApps.length}</span>
                            </div>

                            <div className="flex flex-col gap-3 min-h-[120px] max-h-[460px] overflow-y-auto pr-1">
                              {columnApps.length === 0 ? (
                                <div className="border border-dashed border-white/10 rounded-lg py-6 text-center text-text-dim text-xs">
                                  Drop candidates here
                                </div>
                              ) : (
                                columnApps.map(app => (
                                  <div
                                    key={app.id}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, app.id.toString())}
                                    className={`bg-white/4 border rounded-lg p-3.5 cursor-grab active:cursor-grabbing transition-colors hover:bg-white/8
                                      ${col.id === 'REVIEWING' ? 'border-accent-emerald/50 shadow-glow-emerald' : 'border-white/6'}`}
                                  >
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                      <span className="text-white text-sm font-bold break-words min-w-0">
                                        {app.candidate_details?.first_name || app.candidate_details?.email?.split('@')[0] || 'Candidate'}
                                        {app.match_score ? ` [${app.match_score}%]` : ''}
                                      </span>
                                      <MoreHorizontal size={14} className="text-text-dim shrink-0" />
                                    </div>
                                    <div className="text-text-muted text-[0.7rem]">{app.job_details?.title}</div>
                                    <div className="text-text-muted text-[0.7rem]">Source: Platform</div>
                                    <div className="text-text-muted text-[0.7rem] mb-3">
                                      Applied: {new Date(app.applied_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    </div>
                                    <div className="flex justify-between items-center border-t border-white/6 pt-2">
                                      <div className={`flex items-center gap-1.5 text-[0.7rem] ${col.id === 'REVIEWING' ? 'text-emerald-400' : 'text-text-dim'}`}>
                                        <Clock size={12} />
                                        {app.interview_date ? new Date(app.interview_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'No Date'}
                                      </div>
                                      <div className={`w-4 h-4 rounded-full ${app.match_score > 80 ? 'bg-accent-emerald' : 'bg-primary-500'}`} />
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* RIGHT SIDE PANEL: AI SCREENING INSIGHTS */}
                  {/* TODO: this panel is still fed by hardcoded sample data (candidate names,
                      sentiment, keyword list) — needs wiring to real screening results. */}
                  <Card className="w-full xl:w-[300px] shrink-0 p-5 flex flex-col gap-6">
                    <h2 className="text-sm font-extrabold text-white tracking-wide m-0">AI SCREENING INSIGHTS</h2>

                    <div>
                      <div className="text-text-muted text-xs font-semibold mb-2">Match Score Breakdown</div>
                      <div className="flex justify-between text-white text-sm mb-1.5">
                        <span>Sarah Lee</span>
                        <span className="text-emerald-400 font-bold">94%</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-[94%] bg-accent-emerald rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="text-text-muted text-xs font-semibold mb-3">Top Matches</div>
                      <div className="flex flex-col gap-3">
                        {['Sarah Lee', 'Liam Brown', 'Elara Finns'].map(name => (
                          <div key={name} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[0.7rem] shrink-0">
                                {name[0]}
                              </div>
                              <div className="min-w-0">
                                <div className="text-white text-xs font-semibold truncate">{name}</div>
                                <div className="text-text-dim text-[0.7rem] truncate">Sr. UX Designer</div>
                              </div>
                            </div>
                            <ArrowRight size={14} className="text-text-dim shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-text-muted text-xs font-semibold mb-3">Keyword Analysis</div>
                      <div className="flex flex-wrap gap-2">
                        {['React', 'Design Systems', 'Figma', 'UX Research'].map(kw => (
                          <Badge key={kw} variant="neutral">{kw}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-text-muted text-xs font-semibold mb-2">Sentiment Analysis</div>
                      <div className="text-emerald-400 text-xl font-extrabold mb-2">
                        78% <span className="text-text-muted text-sm font-normal">Positive</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-[78%] bg-accent-emerald rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="text-text-muted text-xs font-semibold mb-3">Skills Distribution</div>
                      <div className="flex gap-2 items-end h-[60px]">
                        {[60, 80, 40, 90, 70, 50].map((h, i) => (
                          <div key={i} className="flex-1 bg-accent-emerald rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* VIEW 2: JOB MANAGEMENT */}
            {activeNav === 'jobs' && (
              <div className="flex flex-col gap-6">
                <div className="flex gap-3 flex-wrap items-center">
                  <div className="flex-1 min-w-[220px] flex items-center gap-2.5 bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5">
                    <Search size={16} className="text-text-dim shrink-0" />
                    <input
                      type="text"
                      placeholder="Search my jobs by title, location, type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-text-dim"
                    />
                  </div>
                  <Button onClick={() => setShowPostJobModal(true)}>
                    <PlusCircle size={16} /> Create Job Opening
                  </Button>
                </div>

                {jobs.length === 0 ? (
                  <Card>
                    <EmptyState
                      icon={Briefcase}
                      title="No job postings found"
                      description="Create and publish your open roles to start matching candidates."
                      action={
                        <Button size="sm" onClick={() => setShowPostJobModal(true)}>
                          <PlusCircle size={15} /> Post a Job
                        </Button>
                      }
                    />
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {jobs.map((job) => (
                      <Card key={job.id} interactive className="p-5 flex flex-col">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="m-0 text-white text-lg font-bold">{job.title}</h3>
                          <Badge variant={job.status === 'ACTIVE' || !job.status ? 'emerald' : 'amber'}>
                            {job.status || 'ACTIVE'}
                          </Badge>
                        </div>

                        <div className="text-text-muted text-sm mb-3">
                          {job.company_name} • {job.location} • {job.type}
                        </div>

                        {job.salary && (
                          <div className="text-emerald-400 text-sm font-bold mb-2">{job.salary}</div>
                        )}

                        <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-5">
                          {job.description ? job.description.substring(0, 140) + '...' : 'No description provided.'}
                        </p>

                        <div className="flex justify-between items-center gap-3 flex-wrap border-t border-white/6 pt-3">
                          <span className="text-primary-300 font-bold text-sm">
                            {job.applicant_count || 0} Applicants
                          </span>

                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedJobFilter(job.id);
                                selectNav('applicants');
                              }}
                            >
                              View Applicants
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleJobStatus(job.id, job.status || 'ACTIVE')}
                            >
                              {job.status === 'ACTIVE' ? 'Close' : 'Activate'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: APPLICANTS PIPELINE */}
            {activeNav === 'applicants' && (
              <div className="flex flex-col gap-5">
                {/* Filter toolbar */}
                <Card className="p-4 flex flex-wrap gap-3 items-end">
                  <div className="flex-[2_1_240px] min-w-0">
                    <Label>Search candidates</Label>
                    <div className="flex items-center gap-2.5 bg-slate-900/80 border border-border-subtle rounded-lg px-3.5 py-2.5">
                      <Search size={16} className="text-text-dim shrink-0" />
                      <input
                        type="text"
                        placeholder="Name, email, role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-text-dim"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-[160px]">
                    <Label>Job opening</Label>
                    <Select value={selectedJobFilter} onChange={(e) => setSelectedJobFilter(e.target.value)}>
                      <option value="ALL">All My Jobs</option>
                      {jobs.map(j => (
                        <option key={j.id} value={j.id}>{j.title}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <Label>Stage</Label>
                    <Select value={selectedStatusFilter} onChange={(e) => setSelectedStatusFilter(e.target.value)}>
                      <option value="ALL">All Stages</option>
                      <option value="APPLIED">Applied</option>
                      <option value="REVIEWING">Reviewing</option>
                      <option value="SHORTLISTED">Shortlisted</option>
                      <option value="INTERVIEW">Interview</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[170px]">
                    <Label>
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles size={12} className="text-purple-400" /> Min Match: {minMatchScore}%
                      </span>
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="5"
                      value={minMatchScore}
                      onChange={(e) => setMinMatchScore(Number(e.target.value))}
                      aria-label="Minimum match score"
                      className="w-full accent-primary-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-full"
                    />
                  </div>

                  <Button variant="secondary" onClick={handleExportCSV}>
                    <Download size={15} /> Export CSV
                  </Button>
                </Card>

                {/* Bulk action bar */}
                {selectedAppIds.length > 0 && (
                  <Card className="p-4 flex flex-wrap items-center gap-3 border-primary-500/40">
                    <span className="text-white text-sm font-semibold">
                      {selectedAppIds.length} candidate{selectedAppIds.length > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2 flex-wrap ml-auto">
                      <Button size="sm" variant="secondary" onClick={() => handleBulkUpdate('REVIEWING')}>Move to Reviewing</Button>
                      <Button size="sm" variant="secondary" onClick={() => handleBulkUpdate('SHORTLISTED')}>Shortlist</Button>
                      <Button size="sm" variant="danger" onClick={() => handleBulkUpdate('REJECTED')}>Reject</Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedAppIds([])}>Clear</Button>
                    </div>
                  </Card>
                )}

                {filteredApplications.length === 0 ? (
                  <Card>
                    <EmptyState
                      icon={Users}
                      title="No applicants match these filters"
                      description="No applicants match the selected criteria for your posted jobs. Try widening the stage, job, or minimum match score."
                    />
                  </Card>
                ) : (
                  <>
                    {/* Mobile: stacked candidate cards (a real <table> cannot fit a phone) */}
                    <div className="flex flex-col gap-3 md:hidden">
                      <button
                        onClick={toggleSelectAllFiltered}
                        className="self-start inline-flex items-center gap-2 text-text-muted text-xs font-semibold px-2 py-1.5 rounded-md hover:text-white hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                      >
                        {allFilteredSelected ? <CheckSquare size={16} className="text-primary-400" /> : <Square size={16} />}
                        Select all ({filteredApplications.length})
                      </button>

                      {filteredApplications.map(app => {
                        const isSelected = selectedAppIds.includes(app.id);
                        return (
                          <Card key={app.id} className={`p-4 ${isSelected ? 'border-primary-500/50' : ''}`}>
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => toggleSelectApp(app.id)}
                                aria-label={isSelected ? 'Deselect candidate' : 'Select candidate'}
                                className="mt-0.5 shrink-0 text-text-dim hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded"
                              >
                                {isSelected ? <CheckSquare size={18} className="text-primary-400" /> : <Square size={18} />}
                              </button>

                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                                {(app.candidate_name || app.candidate_email || 'C')[0].toUpperCase()}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="text-white font-bold text-sm truncate">
                                  {app.candidate_name || app.candidate_email.split('@')[0]}
                                </div>
                                <div className="text-text-dim text-xs truncate">{app.candidate_email}</div>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2 items-center">
                              <Badge variant={(app.match_score || 0) >= 70 ? 'emerald' : 'amber'}>
                                <Sparkles size={12} /> {app.match_score || 0}%
                              </Badge>
                              <Badge variant={statusVariant(app.status)}>{app.status || 'APPLIED'}</Badge>
                            </div>

                            <div className="mt-3 text-text-muted text-xs">
                              {app.job_details?.title || 'Job Listing'} • Applied {new Date(app.applied_at).toLocaleDateString()}
                            </div>

                            <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => openCandidateDrawer(app)}>
                              <Eye size={14} /> Review
                            </Button>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Desktop: full data table, scrollable inside its own bounded container */}
                    <Card className="hidden md:block overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left min-w-[860px]">
                          <thead>
                            <tr>
                              <th className="p-4 bg-slate-950/60 border-b border-white/8 w-12">
                                <button
                                  onClick={toggleSelectAllFiltered}
                                  aria-label="Select all candidates"
                                  className="text-text-dim hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded"
                                >
                                  {allFilteredSelected ? <CheckSquare size={18} className="text-primary-400" /> : <Square size={18} />}
                                </button>
                              </th>
                              {['Candidate', 'Applied Role', 'AI SkillMatch', 'Status', 'Applied Date'].map(h => (
                                <th key={h} className="p-4 bg-slate-950/60 border-b border-white/8 text-primary-300 text-xs font-extrabold uppercase tracking-wider">
                                  {h}
                                </th>
                              ))}
                              <th className="p-4 bg-slate-950/60 border-b border-white/8 text-primary-300 text-xs font-extrabold uppercase tracking-wider text-right">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredApplications.map(app => {
                              const isSelected = selectedAppIds.includes(app.id);
                              return (
                                <tr key={app.id} className={`border-b border-white/5 transition-colors hover:bg-white/3 ${isSelected ? 'bg-primary-500/8' : ''}`}>
                                  <td className="p-4 align-middle">
                                    <button
                                      onClick={() => toggleSelectApp(app.id)}
                                      aria-label={isSelected ? 'Deselect candidate' : 'Select candidate'}
                                      className="text-text-dim hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded"
                                    >
                                      {isSelected ? <CheckSquare size={18} className="text-primary-400" /> : <Square size={18} />}
                                    </button>
                                  </td>
                                  <td className="p-4 align-middle">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white font-extrabold text-xs shrink-0">
                                        {(app.candidate_name || app.candidate_email || 'C')[0].toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-bold text-white text-sm truncate">
                                          {app.candidate_name || app.candidate_email.split('@')[0]}
                                        </div>
                                        <div className="text-text-dim text-xs truncate">{app.candidate_email}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 align-middle text-sm font-semibold text-slate-300">
                                    {app.job_details?.title || 'Job Listing'}
                                  </td>
                                  <td className="p-4 align-middle">
                                    <Badge variant={(app.match_score || 0) >= 70 ? 'emerald' : 'amber'}>
                                      <Sparkles size={13} /> {app.match_score || 0}%
                                    </Badge>
                                  </td>
                                  <td className="p-4 align-middle">
                                    <Badge variant={statusVariant(app.status)}>{app.status || 'APPLIED'}</Badge>
                                  </td>
                                  <td className="p-4 align-middle text-text-muted text-sm whitespace-nowrap">
                                    {new Date(app.applied_at).toLocaleDateString()}
                                  </td>
                                  <td className="p-4 align-middle text-right">
                                    <Button size="sm" variant="secondary" onClick={() => openCandidateDrawer(app)}>
                                      <Eye size={14} /> Review
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* VIEW 4: AI SCREENING */}
            {activeNav === 'ai_screening' && (
              <div className="flex flex-col gap-5">
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <Sparkles size={24} className="text-purple-400 shrink-0" />
                    <div>
                      <h3 className="m-0 text-white text-lg sm:text-xl font-extrabold">
                        AI SkillMatch &amp; Neural Candidate Ranking
                      </h3>
                      <p className="m-0 text-text-muted text-sm">
                        Real-time ranking of candidates for your jobs comparing resume keywords against required skills.
                      </p>
                    </div>
                  </div>

                  {applications.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="No candidates to screen yet"
                      description="Once candidates apply to your postings, their AI match breakdown appears here."
                    />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {applications.map((app) => (
                        <div key={app.id} className="flex flex-wrap justify-between items-center gap-3 bg-slate-900/60 border border-white/6 rounded-lg p-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="bg-gradient-to-br from-emerald-600 to-emerald-400 text-white font-black text-base px-3 py-2 rounded-lg shadow-glow-emerald shrink-0">
                              {app.match_score || 0}%
                            </div>
                            <div className="min-w-0">
                              <strong className="text-white text-sm block truncate">
                                {app.candidate_name || app.candidate_email.split('@')[0]}
                              </strong>
                              <div className="text-text-muted text-xs truncate">Applied for {app.job_details?.title}</div>
                            </div>
                          </div>

                          <div className="flex gap-1.5 flex-wrap">
                            {(app.missing_skills || []).slice(0, 3).map((skill, idx) => (
                              <Badge key={idx} variant="amber">Gap: {skill}</Badge>
                            ))}
                          </div>

                          <Button size="sm" variant="secondary" onClick={() => openCandidateDrawer(app)}>
                            Inspect Breakdown
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* AI QUESTION GENERATOR FOR POSTED JOBS */}
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles size={22} className="text-purple-400 shrink-0" />
                    <div>
                      <h3 className="m-0 text-white text-base sm:text-lg font-extrabold">
                        Dynamic AI Interview Question Generator
                      </h3>
                      <p className="m-0 text-text-muted text-xs sm:text-sm">
                        Generates role-specific, difficulty-graded technical questions directly from the job description requirements.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
                    <div>
                      <Label>Select Job Opening</Label>
                      <Select
                        disabled={useCustomJdForQuestions}
                        value={selectedJobForQuestions}
                        onChange={(e) => setSelectedJobForQuestions(e.target.value)}
                        className="disabled:opacity-50"
                      >
                        {jobs.map(j => (
                          <option key={j.id} value={j.id}>
                            {j.title} • ({j.location})
                          </option>
                        ))}
                      </Select>

                      <div className="mt-2.5 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="useCustomJdToggleRec"
                          checked={useCustomJdForQuestions}
                          onChange={(e) => setUseCustomJdForQuestions(e.target.checked)}
                          className="accent-purple-500 w-4 h-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                        />
                        <label htmlFor="useCustomJdToggleRec" className="text-xs text-slate-300 cursor-pointer">
                          Or test with custom Job Description text
                        </label>
                      </div>
                    </div>

                    {useCustomJdForQuestions && (
                      <div className="lg:col-span-2">
                        <Label>Custom Job Description &amp; Requirements</Label>
                        <TextArea
                          rows="3"
                          placeholder="Paste job description requirements, tech stack..."
                          value={customJobQuestionsDesc}
                          onChange={(e) => setCustomJobQuestionsDesc(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <Button variant="premium" onClick={() => handleGenerateQuestions()} disabled={generatingQuestions}>
                    <Sparkles size={16} /> {generatingQuestions ? 'Generating Tailored Questions...' : 'Generate Dynamic Interview Questions'}
                  </Button>

                  {/* Display Generated Questions */}
                  {aiQuestions.length > 0 && (
                    <div className="mt-6 flex flex-col gap-3">
                      <div className="flex justify-between items-center gap-3 flex-wrap">
                        <strong className="text-white text-sm">
                          Generated Role-Specific Screening Questions ({aiQuestions.length})
                        </strong>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const qText = aiQuestions.map((q, i) => `${i + 1}. [${q.category} - ${q.difficulty}] ${q.question} (Focus: ${q.focus_area})`).join('\n\n');
                            navigator.clipboard.writeText(qText);
                            addToast("Copied interview questions to clipboard!", "success");
                          }}
                        >
                          Copy All Questions
                        </Button>
                      </div>

                      <div className="flex flex-col gap-3">
                        {aiQuestions.map((q, idx) => (
                          <div key={idx} className="bg-slate-900/80 border border-white/8 rounded-lg p-4">
                            <div className="flex justify-between items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs font-extrabold text-primary-300">
                                Question {idx + 1} • {q.category}
                              </span>
                              <Badge variant={q.difficulty === 'Hard' ? 'rose' : q.difficulty === 'Medium' ? 'amber' : 'emerald'}>
                                {q.difficulty}
                              </Badge>
                            </div>
                            <p className="text-white text-sm m-0 mb-1.5 leading-relaxed">"{q.question}"</p>
                            <span className="text-text-dim text-xs">Focus Area: {q.focus_area}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* VIEW 5: INTERVIEWS */}
            {activeNav === 'interviews' && (
              <Card className="p-5">
                <h3 className="text-white text-base font-bold m-0 mb-5">Scheduled Interview Calls</h3>

                {upcomingInterviews.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No interviews scheduled"
                    description='Click "Review" on an applicant to schedule an interview date & time.'
                    action={<Button size="sm" onClick={() => selectNav('applicants')}>Go to applicants</Button>}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {upcomingInterviews.map((interview) => (
                      <Card key={interview.id} className="p-4">
                        <div className="flex justify-between items-center gap-2 mb-3 flex-wrap">
                          <Badge variant="emerald">Confirmed Round</Badge>
                          <span className="text-primary-300 text-xs">{interview.date} • {interview.time}</span>
                        </div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-300 flex items-center justify-center text-xs font-bold shrink-0">
                            {interview.avatar}
                          </div>
                          <h4 className="m-0 text-white text-base font-semibold truncate">{interview.name}</h4>
                        </div>
                        <p className="m-0 mb-4 text-text-muted text-sm">{interview.role}</p>
                        <Button size="sm" className="w-full">
                          <ExternalLink size={14} /> Join Meeting Room
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* VIEW 6: REPORTS */}
            {activeNav === 'reports' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
                <Card className="p-5">
                  <h3 className="text-white text-base font-bold m-0 mb-4">Hiring Conversion Funnel</h3>
                  <FunnelChart stages={funnelStages} />
                </Card>

                <Card className="p-5">
                  <h3 className="text-white text-base font-bold m-0 mb-4">Application Volume Trend</h3>
                  <TrendLineChart
                    points={[1, 2, 4, 5, 6, stats.totalApplicants]}
                    labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today']}
                    height={190}
                    color="#6366f1"
                    gradientId="reportTrendGrad"
                  />
                </Card>

                <Card className="p-5">
                  <h3 className="text-white text-base font-bold m-0 mb-4">My Job Categories</h3>
                  <CategoryBarChart categories={jobCategories} />
                </Card>

                <Card className="p-5 lg:col-span-2 2xl:col-span-3">
                  <h3 className="text-white text-base font-bold m-0 mb-4">Pipeline Status Mix</h3>
                  {applications.length === 0 ? (
                    <EmptyState
                      icon={BarChart3}
                      title="No application data yet"
                      description="Your candidate pipeline breakdown appears here once applications arrive."
                    />
                  ) : (
                    <DonutChart data={donutData} total={stats.totalApplicants} title="Candidates" size={180} strokeWidth={22} />
                  )}
                </Card>
              </div>
            )}

            {/* VIEW 7: RECRUITER PROFILE & COMPANY CREDENTIALS */}
            {activeNav === 'company' && (
              <Card className="p-5 sm:p-6">
                <h3 className="text-white text-base font-bold m-0 mb-1">Recruiter Profile &amp; Organization Credentials</h3>
                <p className="text-text-muted text-sm m-0 mb-6">
                  Update your personal details, login credentials (email &amp; mobile), and company information.
                </p>

                <form onSubmit={handleSaveProfileCredentials}>
                  <h4 className="text-primary-300 text-sm font-bold m-0 mb-4 flex items-center gap-2">
                    <User size={16} /> Personal &amp; Login Identifiers
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                    <div>
                      <Label>First Name</Label>
                      <TextInput
                        type="text"
                        value={recruiterProfile.first_name}
                        onChange={(e) => setRecruiterProfile({ ...recruiterProfile, first_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <TextInput
                        type="text"
                        value={recruiterProfile.last_name}
                        onChange={(e) => setRecruiterProfile({ ...recruiterProfile, last_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Login Email Address *</Label>
                      <TextInput
                        type="email"
                        required
                        value={recruiterProfile.email}
                        onChange={(e) => setRecruiterProfile({ ...recruiterProfile, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Login Mobile Number</Label>
                      <TextInput
                        type="text"
                        placeholder="+91 98765 00000"
                        value={recruiterProfile.phone_number}
                        onChange={(e) => setRecruiterProfile({ ...recruiterProfile, phone_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Designation</Label>
                      <TextInput
                        type="text"
                        value={recruiterProfile.designation}
                        onChange={(e) => setRecruiterProfile({ ...recruiterProfile, designation: e.target.value })}
                      />
                    </div>
                  </div>

                  <h4 className="text-primary-300 text-sm font-bold m-0 mb-4 flex items-center gap-2">
                    <Building size={16} /> Organization Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div>
                      <Label>Company Name</Label>
                      <TextInput
                        type="text"
                        value={recruiterProfile.company_name}
                        onChange={(e) => setRecruiterProfile({ ...recruiterProfile, company_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Official Website</Label>
                      <TextInput
                        type="text"
                        value={recruiterProfile.company_website}
                        onChange={(e) => setRecruiterProfile({ ...recruiterProfile, company_website: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Headquarters / Location</Label>
                      <TextInput
                        type="text"
                        value={recruiterProfile.company_location}
                        onChange={(e) => setRecruiterProfile({ ...recruiterProfile, company_location: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Industry</Label>
                      <TextInput
                        type="text"
                        value={recruiterProfile.company_industry}
                        onChange={(e) => setRecruiterProfile({ ...recruiterProfile, company_industry: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label>Company Description</Label>
                    <TextArea
                      rows="3"
                      value={recruiterProfile.company_description}
                      onChange={(e) => setRecruiterProfile({ ...recruiterProfile, company_description: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="mt-5">
                    Save Profile &amp; Login Credentials
                  </Button>
                </form>
              </Card>
            )}

            {/* VIEW 8: TEAM MEMBERS */}
            {activeNav === 'team' && (
              <Card className="p-5">
                <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
                  <div>
                    <h3 className="text-white text-base font-bold m-0">Recruiter Team &amp; Permissions</h3>
                    <p className="text-text-muted text-sm m-0">
                      Manage access roles: Super Admin, Recruiter Manager, Senior Recruiter, Recruiter, Viewer.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const newMember = {
                        id: Date.now(),
                        name: 'New Recruiter',
                        email: `recruiter${teamMembers.length + 1}@technova.com`,
                        role: 'Recruiter',
                        status: 'Active',
                        avatar: 'NR'
                      };
                      setTeamMembers([...teamMembers, newMember]);
                      addToast("Invited new team member!", "success");
                    }}
                  >
                    <UserPlus size={16} /> Add Team Member
                  </Button>
                </div>

                {teamMembers.length === 0 ? (
                  <EmptyState
                    icon={UserCheck}
                    title="No team members yet"
                    description="Invite recruiters to collaborate on your hiring pipeline."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left min-w-[640px]">
                      <thead>
                        <tr>
                          {['Member', 'Email', 'Role / Permission', 'Status'].map(h => (
                            <th key={h} className="p-3 border-b border-white/8 text-text-dim text-xs font-extrabold uppercase tracking-wider">
                              {h}
                            </th>
                          ))}
                          <th className="p-3 border-b border-white/8 text-text-dim text-xs font-extrabold uppercase tracking-wider text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamMembers.map(m => (
                          <tr key={m.id} className="border-b border-white/5">
                            <td className="p-3 align-middle">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white font-extrabold text-xs shrink-0">
                                  {m.avatar}
                                </div>
                                <strong className="text-white text-sm">{m.name}</strong>
                              </div>
                            </td>
                            <td className="p-3 align-middle text-text-muted text-sm">{m.email}</td>
                            <td className="p-3 align-middle">
                              <Badge variant="indigo">{m.role}</Badge>
                            </td>
                            <td className="p-3 align-middle text-emerald-400 text-sm font-semibold">● {m.status}</td>
                            <td className="p-3 align-middle text-right">
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                  setTeamMembers(teamMembers.filter(t => t.id !== m.id));
                                  addToast(`Removed ${m.name} from team`, "info");
                                }}
                              >
                                <Trash2 size={14} /> Remove
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {/* VIEW 9: NOTIFICATIONS */}
            {activeNav === 'notifications' && (
              <Card className="p-5">
                <div className="flex justify-between items-center gap-3 flex-wrap mb-5">
                  <h3 className="text-white text-base font-bold m-0">Applicant Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={async () => {
                        await api.post('auth/notifications/mark_all_read/').catch(() => {});
                        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
                        addToast("All notifications marked as read", "info");
                      }}
                      className="text-primary-300 text-sm font-semibold hover:text-primary-200 cursor-pointer px-2 py-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title="You're all caught up"
                    description="New applicant notifications will appear here."
                  />
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 bg-white/3 border border-white/6 rounded-lg p-4 ${n.is_read ? 'opacity-70' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <strong className="text-white text-sm">{n.title}</strong>
                          <p className="text-text-muted text-sm my-1">{n.message}</p>
                          <span className="text-text-dim text-xs">{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* VIEW 10: SETTINGS & SECURITY */}
            {activeNav === 'settings' && (
              <Card className="p-5 sm:p-6">
                <h3 className="text-white text-base font-bold m-0 mb-6">Security &amp; Credentials</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Change Password */}
                  <div>
                    <h4 className="text-white text-sm font-bold m-0 mb-4 flex items-center gap-2">
                      <Lock size={16} className="text-primary-300" /> Change Account Password
                    </h4>
                    <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                      <div>
                        <Label>Current Password</Label>
                        <TextInput
                          type="password"
                          required
                          placeholder="••••••••"
                          value={passwordData.old_password}
                          onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>New Password (min 6 chars)</Label>
                        <TextInput
                          type="password"
                          required
                          placeholder="••••••••"
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        />
                      </div>
                      <Button type="submit" className="self-start">Update Password</Button>
                    </form>
                  </div>

                  {/* Preferences */}
                  <div>
                    <h4 className="text-white text-sm font-bold m-0 mb-4">Recruiter Preferences</h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center gap-4 bg-white/3 border border-white/6 rounded-lg p-4">
                        <div>
                          <strong className="text-white text-sm">AI Auto-Screening</strong>
                          <p className="m-0 text-xs text-text-muted">Automatically rank candidates on resume submission.</p>
                        </div>
                        <input type="checkbox" defaultChecked className="accent-primary-500 w-4 h-4 shrink-0" />
                      </div>

                      <div className="flex justify-between items-center gap-4 bg-white/3 border border-white/6 rounded-lg p-4">
                        <div>
                          <strong className="text-white text-sm">Instant Email &amp; SMS Alerts</strong>
                          <p className="m-0 text-xs text-text-muted">Notify when a high match score candidate applies.</p>
                        </div>
                        <input type="checkbox" defaultChecked className="accent-primary-500 w-4 h-4 shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </main>

      {/* CANDIDATE DEEP DIVE DRAWER */}
      {selectedCandidate && (
        <>
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[1040]"
            onClick={() => setSelectedCandidate(null)}
          />
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-3 p-5 border-b border-white/8 bg-slate-950/60 sticky top-0 z-10">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-extrabold text-white m-0 truncate">
                  {selectedCandidate.candidate_name || selectedCandidate.candidate_email.split('@')[0]}
                </h2>
                <div className="text-text-muted text-xs mt-1">
                  Applied for: <strong className="text-slate-200">{selectedCandidate.job_details?.title || 'Job Listing'}</strong>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                aria-label="Close candidate drawer"
                className="text-text-muted hover:text-white p-1 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5">
              {/* Score */}
              <div className="flex items-center gap-4 bg-primary-500/15 border border-primary-500/30 p-4 rounded-lg">
                <span className="text-3xl font-black text-primary-300 shrink-0">
                  {selectedCandidate.match_score || 0}%
                </span>
                <div>
                  <strong className="text-white text-sm">AI SkillMatch Intelligence Score</strong>
                  <p className="m-0 text-xs text-text-muted">Neural comparison against job description requirements.</p>
                </div>
              </div>

              {/* Status Actions */}
              <div>
                <Label>Move Candidate Stage</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(selectedCandidate.id, 'REVIEWING')}>Reviewing</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(selectedCandidate.id, 'SHORTLISTED')}>Shortlist</Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleUpdateStatus(selectedCandidate.id, 'INTERVIEW', { interview_date: interviewDate, interview_link: interviewLink, notes: candidateNotes })}
                  >
                    Interview
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-emerald-400 border-accent-emerald/40"
                    onClick={() => handleUpdateStatus(selectedCandidate.id, 'ACCEPTED', { notes: candidateNotes })}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleUpdateStatus(selectedCandidate.id, 'REJECTED', { notes: candidateNotes })}
                  >
                    Reject
                  </Button>
                </div>
              </div>

              {/* Matched vs Missing Skills */}
              <div>
                <Label>Identified Proficiencies</Label>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedCandidate.matched_skills || ['Python', 'Django', 'PostgreSQL']).map((s, i) => (
                    <Badge key={i} variant="emerald">✓ {s}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Missing Skill Recommendations</Label>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedCandidate.missing_skills || ['AWS', 'Docker']).map((s, i) => (
                    <Badge key={i} variant="amber">✗ {s}</Badge>
                  ))}
                </div>
              </div>

              {/* Interview & Notes */}
              <div className="flex flex-col gap-3">
                <div>
                  <Label>Schedule Interview Date &amp; Time</Label>
                  <TextInput
                    type="datetime-local"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Meeting Link (Zoom/Meet)</Label>
                  <TextInput
                    type="url"
                    placeholder="https://zoom.us/j/..."
                    value={interviewLink}
                    onChange={(e) => setInterviewLink(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Recruiter Notes</Label>
                  <TextArea
                    rows="3"
                    placeholder="Evaluation notes..."
                    value={candidateNotes}
                    onChange={(e) => setCandidateNotes(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleUpdateStatus(selectedCandidate.id, selectedCandidate.status || 'APPLIED', { notes: candidateNotes, interview_date: interviewDate, interview_link: interviewLink })}
                >
                  Save Notes &amp; Schedule
                </Button>
              </div>

              {/* AI Interview Questions Generator */}
              <div className="bg-primary-500/10 border border-primary-500/25 rounded-lg p-4">
                <div className="flex justify-between items-center gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-400" />
                    <strong className="text-white text-sm">AI Interview Question Generator</strong>
                  </div>
                  <Button
                    size="sm"
                    variant="premium"
                    disabled={generatingQuestions}
                    onClick={() => handleGenerateQuestions(
                      selectedCandidate.job_details?.title || 'Software Engineer',
                      selectedCandidate.job_details?.description || '',
                      selectedCandidate.resume_text || ''
                    )}
                  >
                    {generatingQuestions ? 'Generating...' : 'Generate Questions'}
                  </Button>
                </div>

                {aiQuestions.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {aiQuestions.map((q, idx) => (
                      <div key={idx} className="bg-slate-900/80 border border-white/6 rounded-lg p-3">
                        <div className="flex justify-between items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[0.72rem] text-primary-300 font-bold">{q.category}</span>
                          <Badge variant="amber">{q.difficulty}</Badge>
                        </div>
                        <p className="text-slate-50 text-sm m-0 my-1 font-medium">{q.question}</p>
                        <span className="text-text-dim text-[0.72rem]">Focus: {q.focus_area}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-muted text-xs m-0">
                    Click generate to produce domain-tailored technical &amp; behavioral questions for this candidate.
                  </p>
                )}
              </div>

              {/* Resume Text */}
              <div>
                <Label>Parsed Resume Text</Label>
                {selectedCandidate.resume_text ? (
                  <div className="max-h-40 overflow-y-auto bg-slate-950 rounded-lg p-3 text-xs text-text-muted leading-relaxed whitespace-pre-wrap">
                    {selectedCandidate.resume_text}
                  </div>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No resume text available"
                    description="This candidate applied without a parsed resume on file."
                    className="py-8"
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* CREATE JOB MODAL */}
      {showPostJobModal && (
        <div className="modal-overlay" onClick={() => setShowPostJobModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center gap-3 p-5 border-b border-white/8">
              <h3 className="m-0 text-white text-lg sm:text-xl font-extrabold">Post a New Job Opening</h3>
              <button
                onClick={() => setShowPostJobModal(false)}
                aria-label="Close modal"
                className="text-text-muted hover:text-white p-1 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-5 flex flex-col gap-4">
              <div>
                <Label>Job Title *</Label>
                <TextInput
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Engineer (Python)"
                  value={newJobData.title}
                  onChange={(e) => setNewJobData({ ...newJobData, title: e.target.value })}
                />
              </div>

              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <Label>Location</Label>
                  <TextInput
                    type="text"
                    value={newJobData.location}
                    onChange={(e) => setNewJobData({ ...newJobData, location: e.target.value })}
                  />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <Label>Salary Range</Label>
                  <TextInput
                    type="text"
                    placeholder="e.g. ₹18,00,000 - ₹25,00,000"
                    value={newJobData.salary}
                    onChange={(e) => setNewJobData({ ...newJobData, salary: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Type</Label>
                <Select
                  value={newJobData.type}
                  onChange={(e) => setNewJobData({ ...newJobData, type: e.target.value })}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                </Select>
              </div>

              <div>
                <Label>Description &amp; Requirements *</Label>
                <TextArea
                  rows="5"
                  required
                  placeholder="Technical requirements, stack expectations, and qualifications..."
                  value={newJobData.description}
                  onChange={(e) => setNewJobData({ ...newJobData, description: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full mt-1">Publish Job Listing</Button>
            </form>
          </div>
        </div>
      )}

      {/* INTERVIEW SCHEDULE MODAL */}
      {showInterviewModal && (
        <div className="modal-overlay" onClick={closeInterviewModal}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center gap-3 p-5 border-b border-white/8">
              <h2 className="text-lg sm:text-xl font-bold text-white m-0">Schedule Interview</h2>
              <button
                onClick={closeInterviewModal}
                aria-label="Close modal"
                className="text-text-muted hover:text-white p-1 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5">
              <div>
                <Label>Interview Date &amp; Time</Label>
                <TextInput
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Video Meeting Link (Zoom/Meet)</Label>
                <TextInput
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={interviewLink}
                  onChange={(e) => setInterviewLink(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  handleUpdateStatus(pendingInterviewAppId, 'INTERVIEW', {
                    interview_date: interviewDate,
                    interview_link: interviewLink
                  });
                  closeInterviewModal();
                }}
              >
                Schedule &amp; Notify Candidate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
