import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Layers,
  Building,
  Calendar,
  Clock,
  Sparkles,
  PlusCircle,
  Check,
  Award,
  X,
} from 'lucide-react';
import { DonutChart } from '../components/Charts';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

const FILTERS = [
  { key: 'ALL', label: 'All Applications' },
  { key: 'APPLIED', label: 'Applied / Pending' },
  { key: 'REVIEWING', label: 'In Review' },
  { key: 'INTERVIEW', label: 'Interviews' },
  { key: 'ACCEPTED', label: 'Offers Accepted' },
];

const STATUS_BADGE_VARIANT = {
  ACCEPTED: 'emerald',
  REJECTED: 'rose',
  INTERVIEW: 'indigo',
  SHORTLISTED: 'cyan',
  REVIEWING: 'amber',
};

function getStatusBadgeVariant(status) {
  return STATUS_BADGE_VARIANT[status] || 'neutral';
}

function ApplicationsSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading your applications">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-bg-card border border-border-subtle rounded-lg p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex flex-col gap-2 min-w-[200px]">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function MyApplications() {
  const { addToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get('applications/');
      setApplications(response.data);
    } catch (err) {
      console.error("Error fetching applications:", err);
      addToast("Failed to load applications", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter(app => {
    if (filterStatus === 'ALL') return true;
    return (app.status || 'APPLIED') === filterStatus;
  });

  // Pipeline Breakdown donut data, computed from the full (unfiltered) application list.
  const statusDonutData = useMemo(() => {
    const applied = applications.filter(a => (a.status || 'APPLIED') === 'APPLIED').length;
    const reviewing = applications.filter(a => a.status === 'REVIEWING' || a.status === 'SHORTLISTED').length;
    const interview = applications.filter(a => a.status === 'INTERVIEW').length;
    const accepted = applications.filter(a => a.status === 'ACCEPTED').length;
    const rejected = applications.filter(a => a.status === 'REJECTED').length;

    return [
      { label: 'Applied', value: applied, color: '#6366f1' },
      { label: 'In Review', value: reviewing, color: '#f59e0b' },
      { label: 'Interview', value: interview, color: '#a5b4fc' },
      { label: 'Accepted', value: accepted, color: '#10b981' },
      { label: 'Rejected', value: rejected, color: '#f43f5e' },
    ];
  }, [applications]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4 mb-7">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white m-0 tracking-tight">My Applications</h1>
          <p className="text-text-muted text-base mt-1 m-0">Track your submitted applications and interview pipeline stages.</p>
        </div>
        <Button as={Link} to="/" variant="primary">
          <PlusCircle size={17} /> Explore More Jobs
        </Button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map((f) => {
          const isActive = filterStatus === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`rounded-md px-3.5 py-2 text-sm font-semibold border cursor-pointer transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400
                ${isActive
                  ? 'bg-primary-500/25 text-white border-primary-500/50'
                  : 'bg-white/5 text-text-muted border-border-subtle hover:bg-white/10 hover:text-white'}`}
            >
              {f.label}{f.key === 'ALL' ? ` (${applications.length})` : ''}
            </button>
          );
        })}
      </div>

      {loading ? (
        <ApplicationsSkeleton />
      ) : applications.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title="No applications yet"
            description="Explore active job openings and submit applications with 1-click Quick Apply."
            action={<Button as={Link} to="/" variant="secondary">Browse Job Board</Button>}
          />
        </Card>
      ) : filteredApps.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title="No applications found in this category"
            description="Try a different filter to see your other applications."
            action={<Button variant="secondary" onClick={() => setFilterStatus('ALL')}>Show All Applications</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 flex flex-col gap-5">
            {filteredApps.map((app) => {
              const currentStatus = app.status || 'APPLIED';
              const isAccepted = currentStatus === 'ACCEPTED';
              const isRejected = currentStatus === 'REJECTED';

              return (
                <Card key={app.id} className="p-6">
                  <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white m-0">{app.job_details?.title || 'Position'}</h2>
                      <div className="flex items-center flex-wrap gap-2 text-text-muted text-sm mt-1.5">
                        <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                          <Building size={14} className="text-primary-400" /> {app.job_details?.company_name || 'Company'}
                        </span>
                        <span className="hidden sm:inline">&bull;</span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-text-dim" /> Applied on {new Date(app.applied_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      {app.match_score > 0 && (
                        <Badge variant="purple">
                          <Sparkles size={13} /> {app.match_score}% Match
                        </Badge>
                      )}
                      <Badge variant={getStatusBadgeVariant(currentStatus)} className="uppercase tracking-wide">
                        {currentStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Steps Track (reuses App.css .pipeline-track / .pipeline-step classes) */}
                  <div className="pipeline-track">
                    <div className="pipeline-step completed">
                      <div className="pipeline-step-dot"><Check size={16} /></div>
                      <span className="pipeline-step-label">Applied</span>
                    </div>

                    <div className={`pipeline-step ${['REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED'].includes(currentStatus) ? 'completed' : currentStatus === 'APPLIED' ? 'active' : ''}`}>
                      <div className="pipeline-step-dot">
                        {['REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED'].includes(currentStatus) ? <Check size={16} /> : '2'}
                      </div>
                      <span className="pipeline-step-label">Screening</span>
                    </div>

                    <div className={`pipeline-step ${['SHORTLISTED', 'INTERVIEW', 'ACCEPTED'].includes(currentStatus) ? 'completed' : currentStatus === 'REVIEWING' ? 'active' : ''}`}>
                      <div className="pipeline-step-dot">
                        {['SHORTLISTED', 'INTERVIEW', 'ACCEPTED'].includes(currentStatus) ? <Check size={16} /> : '3'}
                      </div>
                      <span className="pipeline-step-label">Interview</span>
                    </div>

                    <div className={`pipeline-step ${isAccepted ? 'completed' : isRejected ? 'rejected' : ['SHORTLISTED', 'INTERVIEW'].includes(currentStatus) ? 'active' : ''}`}>
                      <div className="pipeline-step-dot">
                        {isAccepted ? <Award size={16} /> : isRejected ? <X size={16} /> : '4'}
                      </div>
                      <span className="pipeline-step-label">
                        {isAccepted ? 'Hired / Offer' : isRejected ? 'Archived' : 'Decision'}
                      </span>
                    </div>
                  </div>

                  {/* Interview notice */}
                  {app.interview_date && (
                    <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg px-4 py-3 flex items-center flex-wrap gap-2.5 text-primary-100 text-sm mt-4">
                      <Clock size={16} className="text-primary-400 shrink-0" />
                      <span><strong>Scheduled Interview:</strong> {new Date(app.interview_date).toLocaleString()}</span>
                      {app.interview_link && (
                        <a
                          href={app.interview_link}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto bg-primary-500 text-white px-2.5 py-1.5 rounded text-xs font-bold no-underline hover:bg-primary-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                        >
                          Join Meeting
                        </a>
                      )}
                    </div>
                  )}

                  {/* Offer notice */}
                  {isAccepted && (
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/25 border border-emerald-500/40 rounded-lg px-5 py-3.5 flex items-center gap-3.5 text-white mt-4">
                      <Award size={20} className="text-emerald-400 shrink-0" />
                      <div>
                        <strong>Congratulations! Offer Extended &amp; Accepted</strong>
                        <p className="m-0 text-sm text-emerald-200">The hiring team has approved your application.</p>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Pipeline Breakdown */}
          <Card className="p-5 h-fit">
            <h3 className="text-white text-base font-bold m-0 mb-4">Pipeline Breakdown</h3>
            <DonutChart data={statusDonutData} total={applications.length} title="Total" size={160} strokeWidth={20} />
          </Card>
        </div>
      )}
    </div>
  );
}
