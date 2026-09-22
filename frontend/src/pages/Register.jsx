import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserPlus, Sparkles, Mail, Lock, User, Briefcase } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Label } from '../components/ui/Field';

const fieldWrapClass = `flex items-center gap-2.5 bg-slate-900/80 border border-border-subtle rounded-lg px-3.5 py-2.5
  transition-all duration-200 ease-smooth
  focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/25`;

const fieldInputClass = 'bg-transparent border-none outline-none text-text-main text-sm w-full placeholder:text-text-dim';

const ROLE_OPTIONS = [
  { value: 'JOB_SEEKER', label: 'Job Seeker', icon: User, activeBorder: 'border-primary-400', activeBg: 'bg-primary-500/20', activeIcon: 'text-primary-300' },
  { value: 'RECRUITER', label: 'Recruiter', icon: Briefcase, activeBorder: 'border-purple-400', activeBg: 'bg-accent-purple/20', activeIcon: 'text-purple-300' },
];

export default function Register() {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'JOB_SEEKER'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const { addToast } = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      addToast("Account created successfully! Please sign in with your email or mobile.", "success");
    } catch (error) {
      const errMsg = error?.response?.data?.email || error?.response?.data?.phone_number || error?.response?.data?.non_field_errors || "Registration failed. Please check your details.";
      addToast(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4 py-6">
      <Card className="w-full max-w-[480px] p-6 sm:p-10 text-center shadow-lg">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple inline-flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] mb-4">
          <Sparkles size={24} className="text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white m-0 mb-1.5">Join TalentMatch AI</h2>
        <p className="text-text-muted text-sm m-0 mb-7">Register with your Email or Mobile Number</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <Label>First Name</Label>
              <div className={fieldWrapClass}>
                <User size={15} className="text-text-dim shrink-0" />
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  required
                  className={fieldInputClass}
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <Label>Last Name</Label>
              <div className={fieldWrapClass}>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                  className={fieldInputClass}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Email Address or Mobile Number *</Label>
            <div className={fieldWrapClass}>
              <Mail size={16} className="text-text-dim shrink-0" />
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="you@example.com or 9876543210"
                required
                className={fieldInputClass}
              />
            </div>
            <span className="text-[0.72rem] text-text-dim">
              You can log in later with both your email and mobile number.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Password (min 6 characters) *</Label>
            <div className={fieldWrapClass}>
              <Lock size={16} className="text-text-dim shrink-0" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className={fieldInputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>I am registering as a:</Label>
            <div className="flex gap-3">
              {ROLE_OPTIONS.map(({ value, label, icon: Icon, activeBorder, activeBg, activeIcon }) => {
                const isActive = formData.role === value;
                return (
                  <label
                    key={value}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg border cursor-pointer
                      transition-all duration-200 ease-smooth
                      focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-2 focus-within:ring-offset-[#0f1016]
                      ${isActive ? `${activeBorder} ${activeBg}` : 'border-border-subtle bg-slate-900/60 hover:border-white/20'}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={isActive}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <Icon size={16} className={isActive ? activeIcon : 'text-text-muted'} />
                    <span className={`font-bold ${isActive ? 'text-white' : 'text-text-muted'}`}>
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <Button type="submit" size="lg" disabled={loading} className="w-full mt-1">
            <UserPlus size={17} /> {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-300 no-underline font-bold hover:text-primary-200 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            Sign In
          </Link>
        </p>
      </Card>
    </div>
  );
}
