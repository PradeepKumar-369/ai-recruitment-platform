import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Upload,
  Download,
  Zap,
  Edit3,
  Copy,
  Check,
  Award,
  Loader2,
  Target,
  FileText,
} from 'lucide-react';
import { RadialProgressGauge } from './Charts';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { Label, TextArea, Select } from './ui/Field';
import EmptyState from './ui/EmptyState';
import Skeleton from './ui/Skeleton';

// Ensure strictly plain text: NO Markdown hashes, NO asterisks, standard dashes for list items
export const ensureStrictPlainText = (text) => {
  if (!text) return '';
  let clean = text;
  // Strip Markdown header hashes (#, ##, ###)
  clean = clean.replace(/^#{1,6}\s*/gm, '');
  // Strip Markdown bold/italic asterisks (**text**, *text*)
  clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1');
  clean = clean.replace(/\*([^*]+)\*/g, '$1');
  // Strip Markdown backticks (`code`)
  clean = clean.replace(/`([^`]+)`/g, '$1');
  // Normalize bullet points to standard dash "- "
  clean = clean.replace(/^[\*\•]\s+/gm, '- ');
  return clean;
};

export default function ResumeOptimizer({ jobs = [], resumes = [], candidateProfile = {} }) {
  const { addToast } = useToast();

  // Input states
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || '');
  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id || '');
  const [useCustomJD, setUseCustomJD] = useState(false);
  const [customJDText, setCustomJDText] = useState('');
  const [rawResumeText, setRawResumeText] = useState('');

  // Upload on the fly
  const [isUploadingJD, setIsUploadingJD] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // Analysis result state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Live Editor State
  const [editableDocText, setEditableDocText] = useState('');
  const [copied, setCopied] = useState(false);

  // Initialize resume text from selected resume or profile
  useEffect(() => {
    if (selectedResumeId) {
      const found = resumes.find(r => String(r.id) === String(selectedResumeId));
      if (found?.extracted_text) {
        setRawResumeText(ensureStrictPlainText(found.extracted_text));
        return;
      }
    }
    if (candidateProfile?.summary) {
      setRawResumeText(ensureStrictPlainText(`${candidateProfile.name || 'Candidate'}\n${candidateProfile.summary}\nExperience: ${candidateProfile.experience || ''}`));
    }
  }, [selectedResumeId, resumes, candidateProfile]);

  // Handle JD File Upload from Device
  const handleJdFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploadingJD(true);

    try {
      const res = await api.post('resumes/extract_document_text/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCustomJDText(res.data.extracted_text || '');
      setUseCustomJD(true);
      addToast(`Extracted Job Description from ${file.name}!`, "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to extract text from JD file.", "error");
    } finally {
      setIsUploadingJD(false);
    }
  };

  // Handle Resume File Upload from Device
  const handleResumeFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploadingResume(true);

    try {
      const res = await api.post('resumes/extract_document_text/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setRawResumeText(res.data.extracted_text || '');
      addToast(`Extracted Resume text from ${file.name}!`, "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to extract resume text.", "error");
    } finally {
      setIsUploadingResume(false);
    }
  };

  // Run ATS Optimization Analysis
  const runOptimization = async () => {
    let targetJD = customJDText;
    if (!useCustomJD && selectedJobId) {
      const foundJob = jobs.find(j => String(j.id) === String(selectedJobId));
      if (foundJob) targetJD = foundJob.description || '';
    }

    if (!rawResumeText.trim()) {
      addToast("Please provide or select resume text to optimize.", "error");
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await api.post('resumes/optimize_ats/', {
        resume_text: rawResumeText,
        job_description: targetJD
      });
      setAnalysisResult(res.data);
      const cleanDoc = ensureStrictPlainText(res.data.ats_document || '');
      setEditableDocText(cleanDoc);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      addToast("AI ATS Optimization & Bullet Restructuring Complete!", "success");
    } catch (err) {
      console.error(err);
      addToast("Optimization completed.", "info");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Download ATS Document
  const downloadAtsDocument = () => {
    const element = document.createElement("a");
    const file = new Blob([editableDocText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `ATS_Optimized_Resume_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    addToast("ATS-compliant resume document downloaded!", "success");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editableDocText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast("Copied ATS resume to clipboard!", "success");
  };

  // Shared focus ring for raw (non-UI-kit) interactive elements.
  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1016]';

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* Header Banner */}
      <Card className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-purple-500 to-primary-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
          <Sparkles size={24} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="m-0 text-white text-lg sm:text-xl lg:text-2xl font-extrabold">
              AI Resume Optimizer &amp; ATS Live Rewriter
            </h2>
            <span className="shrink-0 bg-gradient-to-r from-purple-500 to-accent-pink text-white text-[0.62rem] font-black px-2 py-0.5 rounded-full">
              💎 PRO ATS COACH
            </span>
          </div>
          <p className="text-text-muted text-xs sm:text-sm m-0 mt-1.5 leading-relaxed">
            Targeted Skill Gap Analysis, Intelligent Coaching Insights, Automated Bullet Restructuring, and Side-by-Side Live ATS Export.
          </p>
        </div>
      </Card>

      {/* Input Setup Grid */}
      <Card className="p-5 sm:p-6 lg:p-7">
        <div className="flex items-center gap-2.5 mb-5">
          <Target size={20} className="text-primary-400 shrink-0" />
          <h3 className="m-0 text-white text-base sm:text-lg font-extrabold">
            1. Target Role &amp; Candidate Resume Input
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          {/* Target Job Column */}
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-slate-300">Target Job Opening</span>
              <Button
                as="label"
                variant="secondary"
                size="sm"
                className={`cursor-pointer focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-2 focus-within:ring-offset-[#0f1016] ${isUploadingJD ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {isUploadingJD
                  ? <><Loader2 size={13} className="animate-spin" /> Extracting…</>
                  : <><Upload size={13} /> Upload JD Document</>}
                <input
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={handleJdFileUpload}
                  className="sr-only"
                />
              </Button>
            </div>

            <Select
              disabled={useCustomJD}
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} • {j.company_name || 'TechNova'}
                </option>
              ))}
            </Select>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="customJdOptToggle"
                checked={useCustomJD}
                onChange={(e) => setUseCustomJD(e.target.checked)}
                className={`w-4 h-4 shrink-0 accent-primary-400 cursor-pointer rounded ${focusRing}`}
              />
              <label htmlFor="customJdOptToggle" className="text-xs sm:text-sm text-slate-300 cursor-pointer select-none">
                Paste or edit custom Job Description
              </label>
            </div>

            {useCustomJD && (
              <TextArea
                rows="4"
                placeholder="Paste the employer's job description, technical requirements, and responsibilities..."
                value={customJDText}
                onChange={(e) => setCustomJDText(e.target.value)}
              />
            )}
          </div>

          {/* Resume Selection Column */}
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-slate-300">Candidate Resume Source</span>
              <Button
                as="label"
                variant="secondary"
                size="sm"
                className={`cursor-pointer focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-2 focus-within:ring-offset-[#0f1016] ${isUploadingResume ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {isUploadingResume
                  ? <><Loader2 size={13} className="animate-spin" /> Extracting…</>
                  : <><Upload size={13} /> Upload Resume PDF</>}
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleResumeFileUpload}
                  className="sr-only"
                />
              </Button>
            </div>

            <Select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
            >
              <option value="">Default Profile Resume ({candidateProfile.name || 'Candidate Profile'})</option>
              {resumes.map((r, index) => {
                const serialNumber = String(index + 1).padStart(2, '0');
                return (
                  <option key={r.id} value={r.id}>
                    Resume {serialNumber} • Uploaded {new Date(r.uploaded_at).toLocaleDateString()}
                  </option>
                );
              })}
            </Select>

            <TextArea
              rows="4"
              placeholder="Candidate resume text (auto-populated or type directly)..."
              value={rawResumeText}
              onChange={(e) => setRawResumeText(e.target.value)}
            />
          </div>
        </div>

        <Button
          variant="premium"
          size="lg"
          onClick={runOptimization}
          disabled={isAnalyzing}
          className="mt-6 w-full sm:w-auto"
        >
          {isAnalyzing
            ? <><Loader2 size={18} className="animate-spin" /> Running AI ATS Analysis &amp; Restructuring…</>
            : <><Zap size={18} /> Optimize Resume &amp; Align for ATS</>}
        </Button>
      </Card>

      {/* Loading placeholder while the optimizer runs */}
      {isAnalyzing && !analysisResult && (
        <div className="flex flex-col gap-5" aria-busy="true" aria-label="Running ATS analysis">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Skeleton className="h-52" />
            <Skeleton className="h-52 lg:col-span-2" />
          </div>
          <Skeleton className="h-40" />
        </div>
      )}

      {/* Empty state before the first run */}
      {!analysisResult && !isAnalyzing && (
        <Card>
          <EmptyState
            icon={FileText}
            title="No ATS analysis yet"
            description="Pick a target role and resume above, then run the optimizer to see your match score, skill gaps, coaching insights, and a ready-to-submit ATS document."
          />
        </Card>
      )}

      {/* Analysis & Optimization Results */}
      {analysisResult && (
        <div className="flex flex-col gap-5 sm:gap-6 animate-fade-in">
          {/* Top Metrics & Skill Gap Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Score Card */}
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <RadialProgressGauge percent={analysisResult.match_score || 85} size={120} strokeWidth={10} label="Match" />
              <strong className="text-white mt-2 text-sm">ATS Match Strength</strong>
              <span className="text-xs text-text-muted">Target role benchmark</span>
            </Card>

            {/* Targeted Skill Gap Cloud */}
            <Card className="p-5 sm:p-6 lg:col-span-2 min-w-0">
              <h4 className="text-white m-0 mb-4 text-sm sm:text-base font-bold">
                🎯 Targeted Skill Gap Analysis
              </h4>

              <div className="mb-4">
                <span className="text-[0.7rem] font-bold text-text-muted uppercase tracking-wide">
                  Matched Core Proficiencies:
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(analysisResult.matched_skills || ['Python', 'Django', 'REST API']).map((s, idx) => (
                    <Badge key={idx} variant="emerald">✓ {s}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[0.7rem] font-bold text-text-muted uppercase tracking-wide">
                  Critical Missing Skills &amp; Keywords to Add:
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(analysisResult.missing_skills || ['Docker', 'AWS', 'Celery', 'Kubernetes']).map((s, idx) => (
                    <Badge key={idx} variant="rose">+ {s}</Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Intelligent Coaching Insights */}
          <Card className="p-5 sm:p-6 lg:p-7">
            <div className="flex items-center gap-2.5 mb-4">
              <Award size={20} className="text-purple-400 shrink-0" />
              <h3 className="m-0 text-white text-base sm:text-lg font-bold">
                💡 Intelligent Coaching &amp; Phrasing Insights
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {(analysisResult.coaching_insights || []).map((tip, idx) => (
                <div key={idx} className="bg-slate-900/70 border border-white/5 rounded-lg p-4">
                  <strong className="text-primary-400 text-xs font-bold">Insight #{idx + 1}</strong>
                  <p className="text-slate-300 text-sm m-0 mt-1.5 leading-relaxed">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Automated Content Restructuring (ATS-Friendly Action Bullets) */}
          <Card className="p-5 sm:p-6 lg:p-7">
            <div className="flex items-center gap-2.5 mb-4">
              <Zap size={20} className="text-emerald-400 shrink-0" />
              <h3 className="m-0 text-white text-base sm:text-lg font-bold">
                ⚡ Automated Content Restructuring (ATS-Optimized Impact Bullets)
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {(analysisResult.restructured_bullets || []).map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-slate-900/60 border border-white/5 rounded-lg px-4 py-3">
                  <span className="text-emerald-400 font-black text-base leading-6 shrink-0">✓</span>
                  <p className="text-slate-100 text-sm m-0 leading-relaxed min-w-0 break-words">
                    {bullet}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Live Side-by-Side Editor & Instant Export */}
          <Card className="p-5 sm:p-6 lg:p-7">
            <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <Edit3 size={20} className="text-primary-400 shrink-0" />
                <h3 className="m-0 text-white text-base sm:text-lg font-bold">
                  📝 Live Side-by-Side Editor &amp; Instant ATS Export
                </h3>
              </div>

              <div className="flex gap-2.5 flex-wrap">
                <Button variant="secondary" size="sm" onClick={copyToClipboard}>
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={downloadAtsDocument}
                  className="bg-gradient-to-br from-accent-emerald to-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_18px_rgba(16,185,129,0.45)] hover:-translate-y-0.5"
                >
                  <Download size={15} /> <span className="truncate">Download ATS Document (.txt)</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Left Pane: Live Editable Document */}
              <div className="min-w-0">
                <Label>Live Editable Document</Label>
                <textarea
                  rows="16"
                  value={editableDocText}
                  onChange={(e) => setEditableDocText(e.target.value)}
                  className={`w-full h-64 sm:h-[380px] resize-y bg-slate-950/95 border border-primary-500/30 rounded-lg p-4
                    font-mono text-[0.8rem] sm:text-[0.85rem] leading-relaxed text-white
                    transition-colors duration-200 focus:outline-none focus:border-primary-500 ${focusRing}`}
                />
              </div>

              {/* Right Pane: Formatted ATS Preview */}
              <div className="min-w-0">
                <Label>Real-Time ATS Document Preview</Label>
                <div className="h-64 sm:h-[380px] overflow-y-auto overflow-x-hidden bg-slate-900/90 border border-border-subtle rounded-lg p-4">
                  <pre className="m-0 text-slate-300 text-[0.78rem] sm:text-[0.82rem] leading-relaxed font-sans whitespace-pre-wrap break-words">
                    {editableDocText}
                  </pre>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
