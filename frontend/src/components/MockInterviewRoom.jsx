import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Briefcase,
  ChevronRight,
  Zap,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Upload,
  Bookmark
} from 'lucide-react';
import { RadialProgressGauge } from './Charts';
import Button from './ui/Button';
import Card from './ui/Card';
import { Label, TextArea, Select } from './ui/Field';

// Small pill-style source switcher used by the setup step.
function SourceTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold
        cursor-pointer transition-colors duration-200 ease-smooth
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1016]
        ${active
          ? 'bg-primary-500/20 text-white border-primary-400'
          : 'bg-slate-800/60 text-text-muted border-white/10 hover:text-white hover:border-white/20'}`}
    >
      {children}
    </button>
  );
}

// Google AI Assistant Clean Speech Filter
export const cleanSpeechTranscript = (rawText) => {
  if (!rawText) return '';

  // 1. Remove filler words (aaa, um, uh, uhh, er, ah, you know)
  const fillerRegex = /\b(aaa+|um+|uh+|uhh+|er+|ah+|like\s+like|you\s+know)\b/gi;
  let cleaned = rawText.replace(fillerRegex, ' ');

  // 2. Remove stutter / immediate word repetitions (e.g. "elite elite" -> "elite", "django django" -> "django")
  cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');
  // Secondary pass for triple stutter
  cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');

  // 3. Clean multiple spaces and trim
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  // 4. Capitalize first letter of sentences
  cleaned = cleaned.replace(/(^\s*|\.\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());

  return cleaned;
};

export default function MockInterviewRoom({ jobs = [], savedJobIds = [], resumes = [], candidateProfile = {} }) {
  const { addToast } = useToast();

  // Saved Jobs List resolved from IDs
  const savedJobsList = jobs.filter(j => savedJobIds.includes(j.id));

  // Source selection states
  // jdSource: 'platform' | 'saved' | 'upload' | 'custom'
  const [jdSource, setJdSource] = useState('platform');
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || '');
  const [selectedSavedJobId, setSelectedSavedJobId] = useState(savedJobsList[0]?.id || '');
  const [customJobTitle, setCustomJobTitle] = useState('Senior Python Developer');
  const [customJobDesc, setCustomJobDesc] = useState('');
  const [uploadedJdFileName, setUploadedJdFileName] = useState('');

  // resumeSource: 'stored' | 'upload'
  const [resumeSource, setResumeSource] = useState('stored');
  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id || '');
  const [uploadedResumeText, setUploadedResumeText] = useState('');
  const [uploadedResumeFileName, setUploadedResumeFileName] = useState('');

  // Interview Engine State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isEarlyTerminated, setIsEarlyTerminated] = useState(false);

  // Questions & Navigation
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [evaluationHistory, setEvaluationHistory] = useState([]);

  // Voice & Pressure Timer State
  const [timeLeft, setTimeLeft] = useState(60);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const consecutiveFailsRef = useRef(0);
  const timerRef = useRef(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Timer countdown with Smart Pause (pauses while AI speaks or user is recording speech)
  useEffect(() => {
    if (isSessionActive && !isCompleted && !isEarlyTerminated && !timerPaused && !isAiSpeaking && !isRecording) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionActive, isCompleted, isEarlyTerminated, timerPaused, isAiSpeaking, isRecording, currentQIndex]);

  // Read question aloud with Web Speech Synthesis API
  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => {
        setIsAiSpeaking(true);
      };
      utterance.onend = () => {
        setIsAiSpeaking(false);
      };
      utterance.onerror = () => {
        setIsAiSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
    }
  };

  // Live hands-free speech recognition with Google AI Assistant clean filter
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast("Microphone speech recognition is not supported in this browser. Please type directly.", "info");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      stopSpeaking();
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let rawTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          rawTranscript += event.results[i][0].transcript + ' ';
        }
        // Apply Google AI Assistant speech cleaner (removes aaa, um, stutter repetitions like "elite elite")
        const clean = cleanSpeechTranscript(rawTranscript);
        setCandidateAnswer(clean);
      };

      recognition.onerror = (e) => {
        console.warn("STT notice:", e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        setIsRecording(false);
      }
    }
  };

  // Upload JD File from Device
  const handleUploadJdFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('resumes/extract_document_text/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCustomJobDesc(res.data.extracted_text || '');
      setUploadedJdFileName(file.name);
      setJdSource('upload');
      addToast(`Extracted Job Description from ${file.name}!`, "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to extract JD document.", "error");
    }
  };

  // Upload Resume File from Device
  const handleUploadResumeFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('resumes/extract_document_text/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedResumeText(res.data.extracted_text || '');
      setUploadedResumeFileName(file.name);
      setResumeSource('upload');
      addToast(`Extracted Resume text from ${file.name}!`, "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to extract resume text.", "error");
    }
  };

  // Resolve Active JD and Resume Text
  const getResolvedContext = () => {
    let targetTitle = customJobTitle;
    let targetDesc = customJobDesc;

    if (jdSource === 'platform' && selectedJobId) {
      const found = jobs.find(j => String(j.id) === String(selectedJobId));
      if (found) {
        targetTitle = found.title;
        targetDesc = found.description;
      }
    } else if (jdSource === 'saved' && selectedSavedJobId) {
      const found = jobs.find(j => String(j.id) === String(selectedSavedJobId));
      if (found) {
        targetTitle = found.title;
        targetDesc = found.description;
      }
    } else if (jdSource === 'upload') {
      targetDesc = customJobDesc;
    }

    let resumeText = candidateProfile.summary || '';
    if (resumeSource === 'stored' && selectedResumeId) {
      const foundR = resumes.find(r => String(r.id) === String(selectedResumeId));
      if (foundR?.extracted_text) resumeText = foundR.extracted_text;
    } else if (resumeSource === 'upload') {
      resumeText = uploadedResumeText;
    }

    return { targetTitle, targetDesc, resumeText };
  };

  // Launch the Adaptive Mock Interview Session
  const startInterviewSession = async () => {
    setIsGenerating(true);
    consecutiveFailsRef.current = 0;
    setEvaluationHistory([]);
    setCandidateAnswer('');
    setIsCompleted(false);
    setIsEarlyTerminated(false);

    try {
      const { targetTitle, targetDesc, resumeText } = getResolvedContext();

      const res = await api.post('applications/generate_questions/', {
        job_title: targetTitle,
        job_description: targetDesc,
        resume_text: resumeText
      });

      const qList = res.data.questions || [];
      if (qList.length === 0) {
        throw new Error("No questions generated.");
      }

      setQuestions([{ ...qList[0], id: 1 }]);
      setCurrentQIndex(0);
      setIsSessionActive(true);
      setTimeLeft(60);
      addToast("💎 Premium Mock Interview Session Initialized!", "success");

      setTimeout(() => {
        speakQuestion(qList[0].question);
      }, 500);

    } catch (err) {
      console.warn("Generating mock fallback questions:", err);
      const fallbackList = [
        {
          id: 1,
          category: "Core Architecture & Data Structures",
          difficulty: "Easy",
          difficulty_level: 1,
          question: "Can you explain how memory management and generator execution work in high-throughput backend services?",
          focus_area: "Memory & Core Principles",
          time_limit: 60
        },
        {
          id: 2,
          category: "Database Performance & Query Optimization",
          difficulty: "Medium",
          difficulty_level: 2,
          question: "How do you detect and optimize slow queries, eliminate N+1 latency, and structure database indexing for high concurrency?",
          focus_area: "Query Optimization & Scaling",
          time_limit: 60
        },
        {
          id: 3,
          category: "Distributed Systems & Reliability",
          difficulty: "Hard",
          difficulty_level: 3,
          question: "How would you design a fault-tolerant asynchronous processing pipeline with zero-downtime failover and idempotency?",
          focus_area: "Architecture & Scale",
          time_limit: 60
        },
        {
          id: 4,
          category: "Behavioral STAR & Decision Making",
          difficulty: "Medium",
          difficulty_level: 2,
          question: "Tell us about a high-stakes production incident you resolved under tight time constraints. How did you communicate tradeoffs?",
          focus_area: "Communication & STAR",
          time_limit: 60
        }
      ];
      setQuestions(fallbackList);
      setCurrentQIndex(0);
      setIsSessionActive(true);
      setTimeLeft(60);
      speakQuestion(fallbackList[0].question);
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit Answer & Run Adaptive AI Evaluation
  const submitAnswer = async (isTimeout = false) => {
    stopSpeaking();
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsEvaluating(true);
    const activeQ = questions[currentQIndex];

    try {
      const { targetDesc, resumeText } = getResolvedContext();
      
      const finalAnswer = isTimeout ? (candidateAnswer || "[Candidate exceeded 60-second time limit without finalizing answer]") : candidateAnswer;

      const historyPayload = evaluationHistory.flatMap(evalRecord => [
        { role: 'ai', content: evalRecord.questionText },
        { role: 'user', content: evalRecord.candidateAnswer }
      ]);
      historyPayload.push({ role: 'ai', content: activeQ.question });
      historyPayload.push({ role: 'user', content: finalAnswer });

      const res = await api.post('applications/evaluate_answer/', {
        job_description: targetDesc,
        resume_text: resumeText,
        history: historyPayload
      });

      const evalData = res.data.evaluation || res.data;
      const nextQData = res.data.next_question;

      const evalResult = {
        questionId: activeQ.id || currentQIndex + 1,
        questionText: activeQ.question,
        category: activeQ.category,
        difficulty: activeQ.difficulty,
        candidateAnswer: finalAnswer,
        evaluation: evalData
      };

      const updatedHistory = [...evaluationHistory, evalResult];
      setEvaluationHistory(updatedHistory);

      // Check for poor answer / timeout
      if (evalData.is_poor_answer || isTimeout) {
        consecutiveFailsRef.current += 1;
      } else {
        consecutiveFailsRef.current = 0;
      }

      // EARLY TERMINATION LOGIC: 2 consecutive poor/unresponsive answers
      if (consecutiveFailsRef.current >= 2) {
        setIsEarlyTerminated(true);
        setIsCompleted(true);
        addToast("⚠️ Interview concluded early due to consecutive unresponsive answers.", "error");
        return;
      }

      // STANDARD TERMINATION LOGIC: Finished 5 questions
      if (currentQIndex + 1 >= 5 || !nextQData) {
        setIsCompleted(true);
        confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
        addToast("🎉 Mock Interview Completed! Generating Hiring Manager Report...", "success");
      } else {
        const nextIdx = currentQIndex + 1;
        setQuestions(prev => [...prev, { ...nextQData, id: nextIdx + 1 }]);
        setCurrentQIndex(nextIdx);
        setCandidateAnswer('');
        setTimeLeft(60);

        setTimeout(() => {
          speakQuestion(nextQData.question);
        }, 600);
      }

    } catch (err) {
      console.warn("Evaluation fallback:", err);
      const fallbackEval = {
        questionId: activeQ.id || currentQIndex + 1,
        questionText: activeQ.question,
        category: activeQ.category,
        difficulty: activeQ.difficulty,
        candidateAnswer: candidateAnswer || 'No answer submitted.',
        evaluation: {
          overall_score: 0,
          readiness_score: 0,
          technical_depth: 0,
          communication_clarity: 0,
          problem_solving: 0,
          hiring_manager_recommendation: "No Hire",
          is_poor_answer: true,
          strengths: ["None due to timeout or system failure."],
          weaknesses: ["Answer could not be evaluated or was absent."],
          actionable_tips: ["Please ensure your microphone is working or answer before the timer expires."]
        }
      };

      setEvaluationHistory([...evaluationHistory, fallbackEval]);
      if (currentQIndex + 1 >= 5) {
        setIsCompleted(true);
      } else {
        const nextIdx = currentQIndex + 1;
        const fallbackNext = {
            id: nextIdx + 1,
            question: "Could you elaborate on how you handled the most difficult challenge in your previous role?",
            category: "Behavioral & Problem Solving",
            difficulty: "Medium"
        };
        setQuestions(prev => [...prev, fallbackNext]);
        setCurrentQIndex(nextIdx);
        setCandidateAnswer('');
        setTimeLeft(60);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleTimeout = () => {
    addToast("⏰ 60-Second Time Limit Expired! Submitting response...", "info");
    submitAnswer(true);
  };

  const resetSession = () => {
    stopSpeaking();
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    setIsSessionActive(false);
    setIsCompleted(false);
    setIsEarlyTerminated(false);
    setQuestions([]);
    setCurrentQIndex(0);
    setCandidateAnswer('');
    setEvaluationHistory([]);
    consecutiveFailsRef.current = 0;
    setTimeLeft(60);
  };

  // Compute Aggregate Evaluation Metrics
  const aggregateReport = () => {
    if (evaluationHistory.length === 0) return null;

    const count = evaluationHistory.length;
    const avgOverall = Math.round(evaluationHistory.reduce((acc, curr) => acc + (curr.evaluation?.overall_score || 0), 0) / count);
    const avgTech = Math.round(evaluationHistory.reduce((acc, curr) => acc + (curr.evaluation?.technical_depth || 0), 0) / count);
    const avgClarity = Math.round(evaluationHistory.reduce((acc, curr) => acc + (curr.evaluation?.communication_clarity || 0), 0) / count);
    const avgProblem = Math.round(evaluationHistory.reduce((acc, curr) => acc + (curr.evaluation?.problem_solving || 0), 0) / count);

    const allStrengths = Array.from(new Set(evaluationHistory.flatMap(e => e.evaluation?.strengths || [])));
    const allWeaknesses = Array.from(new Set(evaluationHistory.flatMap(e => e.evaluation?.weaknesses || [])));
    const allTips = Array.from(new Set(evaluationHistory.flatMap(e => e.evaluation?.actionable_tips || [])));

    const recommendation = (
      avgOverall >= 85 ? "Strong Hire"
      : avgOverall >= 72 ? "Hire"
      : avgOverall >= 55 ? "Borderline / Needs Practice"
      : "No Hire"
    );

    return {
      avgOverall,
      avgTech,
      avgClarity,
      avgProblem,
      allStrengths,
      allWeaknesses,
      allTips,
      recommendation,
      totalQuestions: count
    };
  };

  const report = aggregateReport();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* HEADER WITH PRO BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-purple-500 to-primary-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Sparkles size={22} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 text-white text-xl sm:text-2xl font-extrabold leading-tight">AI Mock Interview Simulator</h2>
              <span className="rounded-full bg-gradient-to-r from-purple-500 to-accent-pink px-2 py-0.5 text-[0.65rem] font-black tracking-wider text-white whitespace-nowrap">
                💎 PREMIUM PRO
              </span>
            </div>
            <p className="mt-1 mb-0 text-text-muted text-sm leading-relaxed">
              Real-time adaptive technical rounds with Google AI Assistant clean-speech recognition, 60s pressure timer, and hiring manager evaluation.
            </p>
          </div>
        </div>

        {isSessionActive && (
          <Button variant="danger" size="sm" onClick={resetSession} className="self-start sm:self-auto shrink-0">
            <RotateCcw size={15} /> Exit Session
          </Button>
        )}
      </div>

      {/* STAGE 1: SETUP & PERSONALIZATION */}
      {!isSessionActive && !isCompleted && (
        <Card interactive className="p-5 sm:p-8">
          <h3 className="m-0 mb-1.5 text-white text-lg sm:text-xl font-extrabold">🎯 Step 1: Target Job Description &amp; Resume Selection</h3>
          <p className="m-0 mb-6 text-text-muted text-sm leading-relaxed">
            Choose from active openings, extract from saved jobs, upload a JD document from device, or select/upload a resume.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Job Description Source Card */}
            <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-slate-950/50 p-4 sm:p-5">
              <Label className="text-sm">1. Select Job Description Source:</Label>

              <div className="flex flex-wrap gap-1.5">
                <SourceTab active={jdSource === 'platform'} onClick={() => setJdSource('platform')}>
                  <Briefcase size={14} /> Active Jobs
                </SourceTab>
                <SourceTab active={jdSource === 'saved'} onClick={() => setJdSource('saved')}>
                  <Bookmark size={14} /> Saved Jobs ({savedJobsList.length})
                </SourceTab>
                <SourceTab active={jdSource === 'upload'} onClick={() => setJdSource('upload')}>
                  <Upload size={14} /> Upload File
                </SourceTab>
                <SourceTab active={jdSource === 'custom'} onClick={() => setJdSource('custom')}>
                  <FileText size={14} /> Paste JD
                </SourceTab>
              </div>

              {jdSource === 'platform' && (
                <Select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.title} • {j.company_name || 'TechNova'} ({j.location})
                    </option>
                  ))}
                </Select>
              )}

              {jdSource === 'saved' && (
                savedJobsList.length === 0 ? (
                  <p className="my-1 text-xs text-amber-400 leading-relaxed">
                    No saved jobs in wishlist. Please select from Active Jobs or upload a document.
                  </p>
                ) : (
                  <Select value={selectedSavedJobId} onChange={(e) => setSelectedSavedJobId(e.target.value)}>
                    {savedJobsList.map(j => (
                      <option key={j.id} value={j.id}>
                        ★ {j.title} • {j.company_name || 'TechNova'}
                      </option>
                    ))}
                  </Select>
                )
              )}

              {jdSource === 'upload' && (
                <div className="flex flex-col items-start gap-1.5">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary-500/40 bg-primary-500/15 px-4 py-2.5 text-xs sm:text-sm font-bold text-primary-400 transition-colors hover:bg-primary-500/25 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-2 focus-within:ring-offset-[#0f1016]">
                    <Upload size={16} /> Choose JD File (.pdf, .txt, .docx)
                    <input type="file" accept=".pdf,.txt,.docx" onChange={handleUploadJdFile} className="sr-only" />
                  </label>
                  {uploadedJdFileName && (
                    <span className="block text-xs text-emerald-400 break-all">
                      ✓ Uploaded: {uploadedJdFileName}
                    </span>
                  )}
                </div>
              )}

              {(jdSource === 'custom' || jdSource === 'upload') && (
                <TextArea
                  rows="4"
                  placeholder="Paste or preview Job Description text here..."
                  value={customJobDesc}
                  onChange={(e) => setCustomJobDesc(e.target.value)}
                  className="resize-y"
                />
              )}
            </div>

            {/* Candidate Resume Source Card */}
            <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-slate-950/50 p-4 sm:p-5">
              <Label className="text-sm">2. Select Resume Source:</Label>

              <div className="flex flex-wrap gap-1.5">
                <SourceTab active={resumeSource === 'stored'} onClick={() => setResumeSource('stored')}>
                  <FileText size={14} /> My Stored Resumes
                </SourceTab>
                <SourceTab active={resumeSource === 'upload'} onClick={() => setResumeSource('upload')}>
                  <Upload size={14} /> Upload from Device
                </SourceTab>
              </div>

              {resumeSource === 'stored' && (
                <Select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)}>
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
              )}

              {resumeSource === 'upload' && (
                <div className="flex flex-col items-start gap-1.5">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary-500/40 bg-primary-500/15 px-4 py-2.5 text-xs sm:text-sm font-bold text-primary-400 transition-colors hover:bg-primary-500/25 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-2 focus-within:ring-offset-[#0f1016]">
                    <Upload size={16} /> Choose Resume PDF (.pdf)
                    <input type="file" accept=".pdf,.txt" onChange={handleUploadResumeFile} className="sr-only" />
                  </label>
                  {uploadedResumeFileName && (
                    <span className="block text-xs text-emerald-400 break-all">
                      ✓ Uploaded: {uploadedResumeFileName}
                    </span>
                  )}
                </div>
              )}

              <span className="mt-auto block text-xs text-text-dim leading-relaxed">
                AI analyzes your resume to craft targeted questions that test both your stated strengths and required skill gaps.
              </span>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
            {[
              { Icon: Mic, color: 'text-primary-400', title: 'Clean-Speech Voice Integration', desc: "Google AI Assistant filter automatically eliminates 'aaa', 'um', and duplicate stutters." },
              { Icon: Clock, color: 'text-accent-amber', title: '60s Smart Pressure Timer', desc: 'Smart countdown pauses automatically while you or the AI is speaking.' },
              { Icon: Zap, color: 'text-accent-emerald', title: 'Adaptive Difficulty AI', desc: 'Dynamically alters question difficulty (Easy → Hard) based on live responses.' },
              { Icon: Shield, color: 'text-purple-400', title: 'Hiring Manager Report', desc: 'Full competency breakdown, strengths, weaknesses & score.' },
            ].map(({ Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-3 rounded-xl border border-white/5 bg-slate-950/50 p-4">
                <Icon size={18} className={`${color} shrink-0 mt-0.5`} />
                <div className="min-w-0">
                  <strong className="block text-white text-sm">{title}</strong>
                  <p className="mt-1 mb-0 text-text-muted text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="premium"
            size="lg"
            onClick={startInterviewSession}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            <Play size={18} /> {isGenerating ? 'Generating Context-Altered Questions...' : '💎 Launch Premium AI Mock Interview'}
          </Button>
        </Card>
      )}

      {/* STAGE 2: LIVE INTERVIEW ROOM */}
      {isSessionActive && !isCompleted && (
        <Card className="flex flex-col gap-5 p-4 sm:p-7">
          {/* Top Status Bar: Question Progress, Category, Smart Timer */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-border-subtle pb-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="rounded-lg bg-primary-500/20 px-3 py-1 text-sm font-extrabold text-primary-200">
                Question {currentQIndex + 1} of {questions.length}
              </span>
              <span className={`rounded-md px-2.5 py-1 text-xs font-extrabold uppercase ${
                questions[currentQIndex]?.difficulty === 'Hard'
                  ? 'bg-accent-rose/20 text-rose-400'
                  : questions[currentQIndex]?.difficulty === 'Medium'
                    ? 'bg-accent-amber/20 text-amber-400'
                    : 'bg-accent-emerald/20 text-emerald-400'
              }`}>
                {questions[currentQIndex]?.difficulty || 'Medium'}
              </span>
              <span className="text-sm font-semibold text-primary-400">
                {questions[currentQIndex]?.category}
              </span>
            </div>

            {/* Smart 60-Second Pressure Timer */}
            <div className={`flex shrink-0 flex-wrap items-center gap-2 self-start md:self-auto rounded-lg border px-3 py-1.5 ${
              timeLeft <= 15
                ? 'border-accent-rose bg-accent-rose/15'
                : timeLeft <= 30
                  ? 'border-accent-amber bg-slate-900/90'
                  : 'border-primary-500/40 bg-slate-900/90'
            }`}>
              <Clock size={16} className={timeLeft <= 15 ? 'text-accent-rose' : 'text-primary-400'} />
              <span className={`text-lg font-black tabular-nums ${timeLeft <= 15 ? 'text-accent-rose' : 'text-white'}`}>
                {timeLeft}s
              </span>
              {(isAiSpeaking || isRecording) && (
                <span className="rounded bg-accent-amber/20 px-1.5 py-0.5 text-[0.65rem] font-extrabold text-amber-400">
                  PAUSED (SPEAKING)
                </span>
              )}
            </div>
          </div>

          {/* AI Interviewer Avatar & Voice Synthesis Waveform */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 rounded-xl border border-primary-500/25 bg-slate-950/80 p-4 sm:p-6">
            <div className="flex items-center justify-center shrink-0">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-primary-500 transition-all duration-300 ${
                isAiSpeaking ? 'pulse-animation shadow-[0_0_25px_#818cf8]' : 'shadow-[0_0_10px_rgba(99,102,241,0.3)]'
              }`}>
                <Sparkles size={24} className="text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0 w-full">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-text-muted">
                  AI Hiring Manager Prompt
                </span>
                <button
                  type="button"
                  onClick={() => isAiSpeaking ? stopSpeaking() : speakQuestion(questions[currentQIndex]?.question)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-primary-500/30 bg-primary-500/15 px-2.5 py-1 text-xs font-bold text-primary-200 transition-colors hover:bg-primary-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1016]"
                >
                  {isAiSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isAiSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
                </button>
              </div>

              <h3 className="mt-0 mb-1.5 text-base sm:text-xl font-bold leading-snug text-white break-words">
                "{questions[currentQIndex]?.question}"
              </h3>
              {questions[currentQIndex]?.focus_area && (
                <span className="text-xs text-text-dim">
                  Focus Area: {questions[currentQIndex].focus_area}
                </span>
              )}
            </div>
          </div>

          {/* Candidate Response Workspace with Google AI Clean Speech Filter */}
          <div className="rounded-xl border border-white/5 bg-slate-950/50 p-4 sm:p-5">
            <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <Label className="mb-0">Your Live Response (Clean-Speech Enabled)</Label>
              <div className="flex flex-wrap items-center gap-3">
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    aria-pressed={isRecording}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1016] ${
                      isRecording
                        ? 'border-accent-rose bg-accent-rose/20 text-rose-400'
                        : 'border-primary-500/30 bg-primary-500/15 text-primary-400 hover:bg-primary-500/25'
                    }`}
                  >
                    {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
                    <span className="text-left">{isRecording ? 'Stop Recording' : '🎤 Speak Answer (Live Transcription)'}</span>
                    {isRecording && <span className="pulse-animation h-2 w-2 shrink-0 rounded-full bg-accent-rose" />}
                  </button>
                )}
                <span className="text-xs text-text-dim tabular-nums">
                  {candidateAnswer.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>

            {isRecording && (
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-rose-400" role="status">
                <span className="flex items-end gap-0.5" aria-hidden="true">
                  <span className="h-2 w-0.5 animate-pulse rounded-full bg-accent-rose" />
                  <span className="h-3.5 w-0.5 animate-pulse rounded-full bg-accent-rose [animation-delay:120ms]" />
                  <span className="h-2.5 w-0.5 animate-pulse rounded-full bg-accent-rose [animation-delay:240ms]" />
                  <span className="h-4 w-0.5 animate-pulse rounded-full bg-accent-rose [animation-delay:360ms]" />
                  <span className="h-2 w-0.5 animate-pulse rounded-full bg-accent-rose [animation-delay:480ms]" />
                </span>
                Listening — timer paused while you speak
              </div>
            )}

            <textarea
              rows="6"
              placeholder={isRecording ? "Listening... Speak naturally. Google AI Assistant filter removes filler words ('aaa', 'um') and stutters automatically..." : "Type your answer or click 'Speak Answer' above to transcribe your response hands-free..."}
              value={candidateAnswer}
              onChange={(e) => setCandidateAnswer(e.target.value)}
              className={`w-full resize-y rounded-lg bg-[#0b0f19]/90 p-4 text-sm leading-relaxed text-white
                placeholder:text-text-dim transition-colors duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400
                ${isRecording ? 'border border-primary-400' : 'border border-white/10'}`}
            ></textarea>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-xs text-text-muted leading-relaxed">
                💡 Tip: Structure your response with concrete technical rationale, tradeoffs, and production examples.
              </span>

              <button
                type="button"
                onClick={() => submitAnswer(false)}
                disabled={isEvaluating}
                className="btn-emerald w-full sm:w-auto shrink-0 justify-center text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1016]"
              >
                {isEvaluating ? 'Evaluating with Neural NLP...' : '⚡ Submit Answer & Proceed'}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* STAGE 3: COMPREHENSIVE HIRING MANAGER PERFORMANCE REPORT */}
      {isCompleted && report && (
        <Card interactive className="p-5 sm:p-8">
          {/* Status Header */}
          <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-xl border p-4 sm:p-5 ${
            isEarlyTerminated
              ? 'border-accent-rose/30 bg-accent-rose/15'
              : 'border-accent-emerald/30 bg-accent-emerald/15'
          }`}>
            <div className="flex items-start gap-3 min-w-0">
              {isEarlyTerminated ? (
                <AlertTriangle size={28} className="text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 size={28} className="text-emerald-400 shrink-0" />
              )}
              <div className="min-w-0">
                <h3 className="m-0 text-white text-lg sm:text-xl font-bold">
                  {isEarlyTerminated ? 'Session Concluded Early' : 'Interview Session Complete'}
                </h3>
                <p className={`m-0 text-sm leading-relaxed ${isEarlyTerminated ? 'text-rose-400' : 'text-emerald-200'}`}>
                  {isEarlyTerminated
                    ? 'Protocol triggered due to multiple unresponsive/substandard answers under the 60s window.'
                    : 'All technical and behavioral competency rounds completed successfully.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 md:text-right">
              <span className="text-xs uppercase tracking-wide text-text-muted">Hiring Manager Verdict</span>
              <div className={`text-xl font-black ${
                report.recommendation === 'Strong Hire' || report.recommendation === 'Hire'
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}>
                {report.recommendation}
              </div>
            </div>
          </div>

          {/* Scores Overview Row */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 p-5 sm:p-6">
              <div className="flex flex-col items-center text-center">
                <RadialProgressGauge percent={report.avgOverall} size={130} strokeWidth={11} label="Score" />
                <strong className="mt-2 text-white text-sm sm:text-base">Overall Readiness Score</strong>
                <span className="text-xs text-text-muted">Out of 100 benchmark</span>
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-white/10 bg-slate-950/80 p-5 sm:p-6">
              <h4 className="m-0 mb-4 text-white text-sm sm:text-base font-bold">📊 Core Competency Breakdown</h4>

              {[
                { label: '🛠️ Technical Depth & Correctness', value: report.avgTech, text: 'text-primary-400', bar: 'bg-primary-400' },
                { label: '💬 Communication Clarity & Delivery', value: report.avgClarity, text: 'text-emerald-400', bar: 'bg-emerald-400' },
                { label: '🧠 Problem Solving & STAR Structure', value: report.avgProblem, text: 'text-amber-400', bar: 'bg-amber-400' },
              ].map(({ label, value, text, bar }) => (
                <div key={label} className="mb-3.5 last:mb-0">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm text-slate-300">{label}</span>
                    <strong className={`${text} tabular-nums`}>{value}%</strong>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full transition-[width] duration-500 ease-smooth ${bar}`} style={{ width: `${value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-border-subtle bg-slate-950/70 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <ThumbsUp size={18} className="text-emerald-400 shrink-0" />
                <h4 className="m-0 text-emerald-400 text-sm sm:text-base font-bold">Demonstrated Key Strengths</h4>
              </div>
              <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
                {report.allStrengths.map((s, idx) => (
                  <li key={idx} className="text-slate-200 text-sm leading-relaxed">{s}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border-subtle bg-slate-950/70 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <ThumbsDown size={18} className="text-rose-400 shrink-0" />
                <h4 className="m-0 text-rose-400 text-sm sm:text-base font-bold">Identified Weaknesses &amp; Gaps</h4>
              </div>
              <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
                {report.allWeaknesses.map((w, idx) => (
                  <li key={idx} className="text-slate-200 text-sm leading-relaxed">{w}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Hiring Manager Tips */}
          <div className="mt-5 rounded-xl border border-primary-500/25 bg-primary-500/10 p-4 sm:p-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400 shrink-0" />
              <h4 className="m-0 text-white text-sm sm:text-base font-bold">Actionable Hiring Manager Advice</h4>
            </div>
            <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
              {report.allTips.map((tip, idx) => (
                <li key={idx} className="text-slate-300 text-sm leading-relaxed">{tip}</li>
              ))}
            </ul>
          </div>

          {/* Individual Question Review Log */}
          <div className="mt-6">
            <h4 className="mb-3 text-white text-sm sm:text-base font-bold">📝 Detailed Question-by-Question Log</h4>
            <div className="flex flex-col gap-3">
              {evaluationHistory.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-white/5 bg-slate-950/60 px-4 py-3.5">
                  <div className="mb-1.5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                    <strong className="text-primary-400 text-sm leading-snug break-words">Q{idx + 1}: {item.questionText}</strong>
                    <span className={`shrink-0 text-xs font-extrabold tabular-nums ${
                      (item.evaluation?.overall_score || 0) >= 70 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {item.evaluation?.overall_score || 0}% Score
                    </span>
                  </div>
                  <p className="my-1 text-xs sm:text-sm italic text-text-muted leading-relaxed break-words">
                    Candidate: "{item.candidateAnswer}"
                  </p>
                  <span className="text-xs text-text-dim leading-relaxed">
                    {item.evaluation?.feedback}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex justify-end">
            <Button variant="premium" size="lg" onClick={resetSession} className="w-full sm:w-auto">
              <RotateCcw size={16} /> Retake / Select Another Role
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
