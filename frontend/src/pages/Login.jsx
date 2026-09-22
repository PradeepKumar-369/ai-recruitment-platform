import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogIn, Sparkles, User, Lock } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Label } from '../components/ui/Field';

const fieldWrapClass = `flex items-center gap-2.5 bg-slate-900/80 border border-border-subtle rounded-lg px-3.5 py-2.5
  transition-all duration-200 ease-smooth
  focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/25`;

const fieldInputClass = 'bg-transparent border-none outline-none text-text-main text-sm w-full placeholder:text-text-dim';

export default function Login() {
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { addToast } = useToast();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(credentials.identifier, credentials.password);
      addToast("Successfully logged in!", "success");
    } catch (error) {
      addToast("Failed to login. Please verify your email / mobile number and password.", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[75vh] px-4 py-4">
      <Card className="w-full max-w-[420px] p-6 sm:p-10 text-center shadow-lg">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple inline-flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] mb-4">
          <Sparkles size={24} className="text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white m-0 mb-1.5">Welcome Back</h2>
        <p className="text-text-muted text-sm m-0 mb-7">Sign in using your Email Address or Mobile Number</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
          <div className="flex flex-col gap-1.5">
            <Label>Email Address or Mobile Number</Label>
            <div className={fieldWrapClass}>
              <User size={16} className="text-text-dim shrink-0" />
              <input
                type="text"
                name="identifier"
                value={credentials.identifier}
                onChange={handleChange}
                placeholder="you@example.com or 9876543210"
                required
                className={fieldInputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Password</Label>
            <div className={fieldWrapClass}>
              <Lock size={16} className="text-text-dim shrink-0" />
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className={fieldInputClass}
              />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={loading} className="w-full mt-1">
            <LogIn size={17} /> {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-text-muted">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-primary-300 no-underline font-bold hover:text-primary-200 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            Create One
          </Link>
        </p>
      </Card>
    </div>
  );
}
