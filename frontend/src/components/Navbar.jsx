import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  Briefcase,
  Sparkles,
  User as UserIcon,
  PlusCircle,
  Layers,
  LogOut,
  LogIn,
  UserPlus,
  Bell,
  Check,
  FileText,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (user) {
      api.get('auth/notifications/')
        .then(res => {
          const formatted = res.data.map(n => ({
            id: n.id,
            title: n.title,
            desc: n.message,
            time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: n.is_read
          }));
          setNotifications(formatted);
        })
        .catch(err => console.error("Error fetching notifications:", err));
    }
  }, [user]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navLinkClass = (path) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-sm transition-colors duration-150
     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400
     ${isActive(path) ? 'text-white bg-primary-500/15 border border-primary-500/30' : 'text-text-muted border border-transparent hover:text-white hover:bg-white/5'}`;

  const NavLinks = ({ onNavigate }) => (
    <>
      <Link to="/" className={navLinkClass('/')} onClick={onNavigate}>
        <Briefcase size={17} />
        <span>Job Board</span>
      </Link>

      {user && user.role === 'JOB_SEEKER' && (
        <>
          <Link to="/applications" className={navLinkClass('/applications')} onClick={onNavigate}>
            <Layers size={17} />
            <span>My Applications</span>
          </Link>
          <Link to="/profile" className={navLinkClass('/profile')} onClick={onNavigate}>
            <FileText size={17} />
            <span>AI Resume &amp; Profile</span>
          </Link>
        </>
      )}

      {user && user.role === 'RECRUITER' && (
        <>
          <Link to="/recruiter-dashboard" className={navLinkClass('/recruiter-dashboard')} onClick={onNavigate}>
            <Layers size={17} />
            <span>Recruiter Hub</span>
          </Link>
          <Link to="/post-job" className={navLinkClass('/post-job')} onClick={onNavigate}>
            <PlusCircle size={17} />
            <span>Post a Job</span>
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="bg-[rgba(20,22,35,0.7)] backdrop-blur-xl border-b border-white/8 sticky top-0 z-[900]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-primary-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Sparkles size={20} className="text-white" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            Talent<span className="bg-gradient-to-br from-primary-400 to-purple-400 bg-clip-text text-transparent">Match AI</span>
          </span>
          <span className="hidden sm:inline-flex text-[0.65rem] font-extrabold px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 uppercase tracking-wide">
            AI 2.0
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden lg:flex items-center gap-1.5">
          <NavLinks />
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800/60 border border-white/8 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                  aria-label="Notifications"
                >
                  <Bell size={18} className="text-text-muted" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent-rose text-white text-[0.65rem] font-extrabold w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-[#0b0f19]">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="animate-fade-in absolute top-12 right-0 w-80 max-w-[calc(100vw-2rem)] bg-slate-950 border border-white/12 rounded-xl shadow-2xl overflow-hidden z-[1000]">
                    <div className="px-4 py-3 border-b border-white/8 bg-slate-900/80 flex justify-between items-center">
                      <span className="font-bold text-sm text-white">AI Alerts &amp; Updates</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-primary-300 text-xs font-semibold flex items-center gap-1 cursor-pointer hover:text-primary-200">
                          <Check size={13} /> Mark read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-text-muted text-sm text-center py-8 px-4">No notifications yet.</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={`px-4 py-3 border-b border-white/5 ${n.read ? 'opacity-60' : ''}`}>
                            <div className="text-sm font-bold text-white mb-0.5">{n.title}</div>
                            <div className="text-xs text-text-muted leading-relaxed mb-1">{n.desc}</div>
                            <div className="text-[0.7rem] text-text-dim">{n.time}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden md:flex items-center gap-2.5 bg-slate-800/40 px-3 py-1.5 rounded-[10px] border border-white/6">
                <div className="w-7 h-7 rounded-full bg-primary-500/15 flex items-center justify-center shrink-0">
                  <UserIcon size={15} className="text-primary-300" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[0.82rem] font-semibold text-slate-100 max-w-[140px] truncate">{user.email || 'User'}</span>
                  <span className={`text-[0.65rem] font-bold px-1.5 py-0.5 rounded w-fit border uppercase tracking-wide
                    ${user.role === 'RECRUITER'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}
                  >
                    {user.role === 'RECRUITER' ? 'Recruiter' : 'Candidate'}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="hidden sm:flex items-center gap-1.5 bg-accent-rose/10 text-rose-400 border border-accent-rose/25 px-3.5 py-2 rounded-lg font-semibold text-sm cursor-pointer hover:bg-accent-rose/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-rose"
                title="Sign Out"
              >
                <LogOut size={17} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2.5">
              <Link to="/login" className="flex items-center gap-1.5 text-slate-100 font-semibold text-sm px-3.5 py-2 rounded-lg bg-slate-800/60 border border-white/10 hover:bg-slate-800 transition-colors">
                <LogIn size={16} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="flex items-center gap-1.5 text-white font-semibold text-sm px-3.5 py-2 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 shadow-[0_2px_10px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-transform">
                <UserPlus size={16} />
                <span>Get Started</span>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden w-9 h-9 rounded-lg bg-slate-800/60 border border-white/8 flex items-center justify-center text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/8 bg-[rgba(15,16,26,0.98)] px-4 py-4 flex flex-col gap-1.5 animate-fade-in">
          <NavLinks onNavigate={() => setMobileMenuOpen(false)} />

          <div className="h-px bg-white/8 my-2" />

          {user ? (
            <>
              <div className="flex items-center gap-2.5 px-1 py-1.5">
                <div className="w-8 h-8 rounded-full bg-primary-500/15 flex items-center justify-center shrink-0">
                  <UserIcon size={16} className="text-primary-300" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-slate-100 truncate">{user.email || 'User'}</span>
                  <span className={`text-[0.65rem] font-bold w-fit uppercase tracking-wide ${user.role === 'RECRUITER' ? 'text-purple-300' : 'text-emerald-400'}`}>
                    {user.role === 'RECRUITER' ? 'Recruiter' : 'Candidate'}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 bg-accent-rose/10 text-rose-400 border border-accent-rose/25 px-3.5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer hover:bg-accent-rose/20 transition-colors"
              >
                <LogOut size={17} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/login" className="flex items-center gap-2 text-slate-100 font-semibold text-sm px-3.5 py-2.5 rounded-lg bg-slate-800/60 border border-white/10">
                <LogIn size={16} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="flex items-center gap-2 text-white font-semibold text-sm px-3.5 py-2.5 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500">
                <UserPlus size={16} />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
