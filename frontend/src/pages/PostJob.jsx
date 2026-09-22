import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Briefcase,
  PlusCircle,
  Building,
  MapPin,
  DollarSign,
  Sparkles,
  Eye,
  Pencil,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Label, TextInput, TextArea, Select } from '../components/ui/Field';

export default function PostJob() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    salary: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddSkillTag = (skill) => {
    if (!formData.description.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        description: prev.description
          ? `${prev.description}\n- Required Skill: ${skill}`
          : `- Required Skill: ${skill}`
      }));
      addToast(`Added '${skill}' to job description requirements`, "info");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('jobs/', formData);
      addToast("Job listing published successfully!", "success");
      navigate('/recruiter-dashboard');
    } catch (err) {
      console.error("Error posting job:", err);
      setError("Failed to publish the job listing. Please check your fields.");
      addToast("Failed to post job", "error");
      setLoading(false);
    }
  };

  const popularSkills = ["React.js", "Python", "Django", "TypeScript", "Node.js", "AWS", "SQL", "Docker", "Machine Learning", "TailwindCSS"];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link
        to="/recruiter-dashboard"
        className="inline-flex items-center gap-1.5 text-primary-300 no-underline font-semibold text-sm mb-6 rounded
          hover:text-primary-200 transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
      >
        <ArrowLeft size={16} /> Back to Recruiter Dashboard
      </Link>

      <Card className="p-5 sm:p-8 lg:p-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white m-0 tracking-tight">Post a New Opportunity</h1>
            <p className="text-text-muted text-sm mt-1.5 m-0">Define role requirements to match against qualified candidate profiles.</p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="shrink-0 self-start"
          >
            {previewMode ? <Pencil size={16} /> : <Eye size={16} />}
            {previewMode ? 'Edit Mode' : 'Preview Listing'}
          </Button>
        </div>

        {previewMode ? (
          <Card className="p-5 sm:p-7">
            <Badge variant="indigo" className="uppercase tracking-wide">Listing Preview</Badge>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mt-3 mb-2 break-words">
              {formData.title || 'Untitled Job Title'}
            </h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-text-muted text-sm mb-6">
              <span className="inline-flex items-center gap-1.5"><Building size={14} /> {formData.company || 'Your Company'}</span>
              <span className="text-text-dim">•</span>
              <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {formData.location || 'Location'}</span>
              <span className="text-text-dim">•</span>
              <span className="inline-flex items-center gap-1.5"><Briefcase size={14} /> {formData.type}</span>
              {formData.salary && (
                <>
                  <span className="text-text-dim">•</span>
                  <span className="inline-flex items-center gap-1.5"><DollarSign size={14} /> {formData.salary}</span>
                </>
              )}
            </div>

            <div className="border-t border-white/8 pt-4">
              <h4 className="text-white font-bold text-sm mb-2">Description &amp; Requirements:</h4>
              <p className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed">
                {formData.description || 'No description provided yet.'}
              </p>
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
            <div>
              <Label>Job Title *</Label>
              <TextInput
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Senior Full Stack Engineer (React / Python)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label>Company Name *</Label>
                <TextInput
                  type="text"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. TechCorp AI"
                />
              </div>

              <div>
                <Label>Location *</Label>
                <TextInput
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. San Francisco, CA / Remote"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label>Employment Type</Label>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                  <option value="Internship">Internship</option>
                </Select>
              </div>

              <div>
                <Label>Salary Range (Optional)</Label>
                <TextInput
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="e.g. $120,000 - $160,000"
                />
              </div>
            </div>

            {/* Quick Skill Tag Adder */}
            <div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-text-muted mb-2">
                <Sparkles size={14} className="text-primary-400" /> Quick Add Key Requirements to Description:
              </span>
              <div className="flex flex-wrap gap-2">
                {popularSkills.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSkillTag(skill)}
                    className="bg-white/5 border border-white/8 text-primary-300 px-2.5 py-1.5 rounded-md text-xs font-semibold
                      cursor-pointer transition-colors hover:bg-white/10 hover:text-primary-200
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Job Description &amp; Technical Requirements *</Label>
              <TextArea
                name="description"
                required
                rows="7"
                value={formData.description}
                onChange={handleChange}
                className="resize-y"
                placeholder="Describe role responsibilities, key qualifications, and tech stack proficiencies..."
              />
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-center gap-2 bg-accent-rose/10 border border-accent-rose/25 text-rose-300 text-sm rounded-lg px-3.5 py-2.5 m-0"
              >
                <AlertCircle size={16} className="shrink-0" /> {error}
              </p>
            )}

            <Button type="submit" disabled={loading} size="lg" className="w-full mt-1">
              <PlusCircle size={18} /> {loading ? 'Publishing...' : 'Publish Job Listing'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
