import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  UploadCloud,
  Sparkles,
  Calendar,
  ExternalLink,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

export default function Profile() {
  const { addToast } = useToast();
  const [resumes, setResumes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await api.get('resumes/');
      setResumes(response.data);
    } catch (err) {
      console.error("Error fetching resumes:", err);
      setError("Failed to load your resumes.");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
      } else {
        addToast("Please upload a PDF document.", "error");
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      addToast("Please select a PDF file first.", "error");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    setError(null);

    try {
      await api.post('resumes/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      addToast("Resume uploaded and neural parsing completed!", "success");
      setSelectedFile(null);
      fetchResumes();
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload resume. Please ensure it is a valid PDF.");
      addToast("Failed to upload resume.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight m-0">
          AI Candidate Profile &amp; Resume
        </h1>
        <p className="text-text-muted text-sm sm:text-base mt-1">
          Upload and manage your PDF resumes to empower SkillMatch AI rankings.
        </p>
      </div>

      {/* Upload Box */}
      <Card interactive className="p-5 sm:p-7 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 mb-5">
          <UploadCloud size={20} className="text-primary-400" /> Upload Resume for AI SkillMatch
        </h2>

        <form onSubmit={handleUpload}>
          <div
            className={`flex flex-col items-center gap-3 sm:gap-4 text-center rounded-xl border-2 border-dashed px-4 sm:px-6 py-8 sm:py-10 transition-colors duration-200
              ${dragOver ? 'border-primary-400 bg-primary-500/10' : 'border-white/15 bg-slate-900/60'}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <FileText size={42} className={selectedFile ? 'text-emerald-400' : 'text-text-dim'} />
            <div>
              <div className="text-sm sm:text-base font-bold text-slate-50 break-all">
                {selectedFile ? selectedFile.name : 'Drag & drop your PDF resume here'}
              </div>
              <div className="text-xs text-text-dim mt-1">Supported format: PDF up to 10MB</div>
            </div>

            <Button as="label" variant="secondary" size="sm" className="cursor-pointer">
              Browse Files
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </Button>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-rose-400 text-sm mt-3">
              <AlertCircle size={15} /> {error}
            </p>
          )}

          <div className="flex justify-end mt-5">
            <Button type="submit" disabled={uploading || !selectedFile}>
              <Sparkles size={16} /> {uploading ? 'Extracting AI Proficiencies...' : 'Upload & Parse PDF'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Resume History */}
      <Card interactive className="p-5 sm:p-7">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 mb-5">
          <FileCheck size={20} className="text-emerald-400" /> Parsed Resume Repository ({resumes.length})
        </h2>

        {resumes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No resumes uploaded yet"
            description="Upload one above to activate AI match scores for your job applications."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {resumes.map((resume, idx) => (
              <div key={resume.id} className="bg-slate-900/70 border border-white/6 rounded-lg p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-md px-2 py-1 text-xs font-extrabold">
                      PDF
                    </div>
                    <div>
                      <strong className="text-white text-sm inline-flex flex-wrap items-center gap-2">
                        Resume Record #{resume.id}
                        {idx === 0 && (
                          <Badge variant="emerald" className="px-2 py-0.5 text-[0.65rem]">
                            Latest / Primary
                          </Badge>
                        )}
                      </strong>
                      <div className="flex items-center gap-1.5 text-text-dim text-xs mt-1">
                        <Calendar size={13} /> Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {resume.file && (
                    <a
                      href={resume.file}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 self-start text-primary-400 text-sm font-semibold no-underline rounded-sm hover:text-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                    >
                      <ExternalLink size={14} /> View File
                    </a>
                  )}
                </div>

                <div className="bg-slate-950/60 border border-white/4 rounded-lg p-3.5">
                  <div className="flex items-center gap-1.5 text-text-muted text-xs font-bold mb-1.5">
                    <Sparkles size={14} className="text-primary-400" /> Extracted Skill &amp; Text Preview:
                  </div>
                  <p className="text-slate-300 text-[0.82rem] leading-relaxed m-0">
                    {resume.extracted_text
                      ? resume.extracted_text.substring(0, 220) + '...'
                      : 'No text extracted.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
