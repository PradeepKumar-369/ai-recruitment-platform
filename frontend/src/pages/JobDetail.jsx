import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Sparkles,
  ArrowLeft,
  Bookmark,
  Send,
  Check,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

function JobDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10" aria-busy="true" aria-label="Loading job details">
      <Skeleton className="h-4 w-36 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 sm:p-8 lg:col-span-2 flex flex-col gap-5">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [aiMatch, setAiMatch] = useState(null);

  // Bookmark
  const [isSaved, setIsSaved] = useState(() => {
    try {
      const saved = localStorage.getItem('saved_jobs');
      return saved ? JSON.parse(saved).includes(Number(id)) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    fetchJobAndAiMatch();
  }, [id, user]);

  const fetchJobAndAiMatch = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`jobs/${id}/`);
      setJob(res.data);

      // Check if user already applied
      if (user && user.role === 'JOB_SEEKER') {
        const appsRes = await api.get('applications/').catch(() => ({ data: [] }));
        const hasApplied = (appsRes.data || []).some(a => String(a.job) === String(id) || String(a.job_details?.id) === String(id));
        setApplied(hasApplied);

        // Fetch AI match score
        const matchRes = await api.post('applications/match_preview/', {
          job_id: id,
          job_description: res.data.description
        }).catch(() => null);

        if (matchRes && matchRes.data) {
          setAiMatch(matchRes.data);
        }
      }
    } catch (err) {
      console.error("Error fetching job details:", err);
      setError("Failed to load job details.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = () => {
    try {
      const saved = localStorage.getItem('saved_jobs');
      let list = saved ? JSON.parse(saved) : [];
      const numId = Number(id);
      if (list.includes(numId)) {
        list = list.filter(i => i !== numId);
        setIsSaved(false);
        addToast("Job removed from saved wishlist", "info");
      } else {
        list.push(numId);
        setIsSaved(true);
        addToast("Job saved to wishlist!", "success");
      }
      localStorage.setItem('saved_jobs', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = async () => {
    if (!user) {
      addToast("Please login to apply for this job.", "error");
      navigate('/login');
      return;
    }
    if (user.role !== 'JOB_SEEKER') {
      addToast("Only Job Seekers can submit applications.", "error");
      return;
    }

    try {
      setApplying(true);
      await api.post('applications/', { job: id });
      setApplied(true);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      addToast("Application submitted successfully!", "success");
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.non_field_errors?.[0] ||
                           err.response?.data?.[0] ||
                           "Failed to apply. Please try again.";
      addToast(errorMessage, "error");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <JobDetailSkeleton />;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Card>
          <EmptyState
            icon={XCircle}
            title="Couldn't load this job"
            description={error}
            action={
              <div className="flex gap-3 justify-center flex-wrap">
                <Button size="sm" variant="secondary" onClick={fetchJobAndAiMatch}>Try again</Button>
                <Button size="sm" onClick={() => navigate('/')}>Back to Job Board</Button>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Card>
          <EmptyState
            icon={Briefcase}
            title="Job not found"
            description="This listing may have been removed or the link is incorrect."
            action={<Button size="sm" onClick={() => navigate('/')}>Back to Job Board</Button>}
          />
        </Card>
      </div>
    );
  }

  const matchScoreGood = aiMatch && aiMatch.match_score >= 70;
  const hasMissingSkills = aiMatch && (aiMatch.missing_skills || []).length > 0 && aiMatch.missing_skills[0] !== "No resume uploaded by candidate.";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-primary-400 no-underline font-semibold text-sm mb-6 rounded
          hover:text-primary-300 transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
      >
        <ArrowLeft size={16} /> Back to Job Board
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* MAIN COLUMN: Job info & description */}
        <Card className="p-6 sm:p-8 lg:col-span-2">
          {/* Header */}
          <div className="flex justify-between items-start gap-4 mb-5">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white m-0 tracking-tight break-words">
                {job.title}
              </h1>
              <div className="flex items-center gap-2 text-text-muted text-sm mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-white font-semibold">
                  <Building size={16} className="text-primary-400 shrink-0" /> {job.company_name}
                </span>
                <span aria-hidden="true">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={16} className="text-text-dim shrink-0" /> {job.location}
                </span>
                <span aria-hidden="true">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={16} className="text-text-dim shrink-0" /> Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              onClick={toggleSave}
              title={isSaved ? "Saved" : "Save Job"}
              aria-label={isSaved ? "Remove job from saved list" : "Save job"}
              aria-pressed={isSaved}
              className="shrink-0 bg-slate-800/70 border border-white/10 rounded-lg w-10 h-10 sm:w-[42px] sm:h-[42px]
                flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              <Bookmark size={20} className={isSaved ? 'text-amber-400 fill-amber-400' : 'text-text-dim'} />
            </button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-6 pb-5 border-b border-white/8">
            {aiMatch && aiMatch.match_score > 0 && (
              <Badge variant={matchScoreGood ? 'emerald' : 'amber'} className="text-[0.85rem] px-3.5 py-1.5">
                <Sparkles size={14} /> {aiMatch.match_score}% AI SkillMatch with Your Resume
              </Badge>
            )}
            <Badge variant="indigo" className="text-[0.85rem] px-3.5 py-1.5">
              <Briefcase size={13} /> {job.type}
            </Badge>
            {job.salary && (
              <Badge variant="emerald" className="text-[0.85rem] px-3.5 py-1.5">
                <DollarSign size={13} /> {job.salary}
              </Badge>
            )}
          </div>

          {/* AI SkillMatch Analysis Preview if available */}
          {aiMatch && (
            <div className="bg-gradient-to-br from-primary-500/10 to-accent-purple/10 border border-primary-500/30 rounded-lg p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-primary-400" />
                <h3 className="m-0 text-base font-bold text-white">AI Compatibility Breakdown</h3>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="block text-xs font-bold text-text-muted mb-1.5">Matched Skills Found in Your Resume:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(aiMatch.matched_skills || []).length > 0 ? (
                      aiMatch.matched_skills.map((skill, idx) => (
                        <Badge key={idx} variant="emerald">
                          <CheckCircle2 size={13} /> {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-text-muted text-[0.82rem]">No direct keyword overlaps detected.</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold text-text-muted mb-1.5">Missing Skills / Recommendations:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {hasMissingSkills ? (
                      aiMatch.missing_skills.map((skill, idx) => (
                        <Badge key={idx} variant="amber">
                          <XCircle size={13} /> {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-emerald-400 text-[0.82rem]">Profile perfectly matches requirements!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Full Job Description &amp; Requirements</h2>
            <div className="text-slate-300 leading-relaxed text-[0.98rem] whitespace-pre-wrap">
              {job.description}
            </div>
          </div>
        </Card>

        {/* SIDEBAR: Apply CTA */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-24">
          <Card className="p-6">
            {applied ? (
              <div className="flex items-center justify-center gap-2 bg-accent-emerald/15 border border-accent-emerald/30 rounded-lg p-4 text-emerald-400 text-center font-bold">
                <Check size={18} /> You have already applied for this role.
              </div>
            ) : user && user.role === 'RECRUITER' ? (
              <div className="bg-white/5 border border-white/8 rounded-lg p-4 text-text-muted text-center text-sm">
                <strong className="text-white">Recruiter Mode:</strong> You are viewing this listing as a recruiter.
              </div>
            ) : (
              <Button size="lg" className="w-full" disabled={applying} onClick={handleApply}>
                <Send size={18} /> {applying ? 'Submitting Application...' : 'Apply for this Job'}
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
