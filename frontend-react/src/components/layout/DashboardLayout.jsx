import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, BarChart3, Timer, FileText,
  Target, Trophy, Settings, LogOut, Menu, X, ChevronRight, MessageSquare, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { applyTheme } from '../../pages/Settings';

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/subjects',      icon: BookOpen,         label: 'Subjects' },
  { to: '/analytics',     icon: BarChart3,        label: 'Analytics' },
  { to: '/pomodoro',      icon: Timer,            label: 'Focus' },
  { to: '/notes',         icon: FileText,         label: 'Notes' },
  { to: '/goals',         icon: Target,           label: 'Goals' },
  { to: '/leaderboard',   icon: Trophy,           label: 'Leaderboard' },
  { to: '/feedback',      icon: MessageSquare,    label: 'Feedback' },
  { to: '/feedback-admin', icon: ShieldCheck,     label: 'Admin' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('selectedTheme');
      if (saved) applyTheme(JSON.parse(saved));
    } catch {}
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const SidebarContent = ({ isMobile }) => (
    <div className="flex flex-col h-full relative">
      {/* Brand */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm font-display">P</span>
          </div>
          <div>
            <div className="text-white font-semibold text-sm tracking-tight leading-none">Progress</div>
            <div className="text-[var(--text-tertiary)] text-[10px] font-medium tracking-wider uppercase mt-0.5">Record</div>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] font-semibold text-xs flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-white text-[13px] font-medium truncate">{user?.name}</div>
            <div className="text-[var(--text-tertiary)] text-[10px] truncate">{user?.examType || 'Student'}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar">
        <div className="text-overline px-3 mb-2 mt-2">Navigation</div>
        <div className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all relative ${
                  isActive
                    ? 'text-white bg-[var(--surface)]'
                    : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="nav-active-indicator" />}
                  <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-[var(--border)] space-y-0.5">
        <NavLink to="/settings" onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
              isActive ? 'text-white bg-[var(--surface)]' : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface)]'
            }`
          }
        >
          <Settings size={16} strokeWidth={1.5} />
          <span>Settings</span>
        </NavLink>
        
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-[13px] font-medium text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface)] transition-all">
          <LogOut size={16} strokeWidth={1.5} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Ambient Background */}
      <div className="ambient-bg"></div>
      <div className="noise-overlay"></div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col h-full w-[240px] border-r border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-xl flex-shrink-0 z-20 relative">
        <SidebarContent isMobile={false} />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-[260px] z-50 lg:hidden border-r border-[var(--border)] bg-[var(--bg-primary)] shadow-2xl">
              <div className="absolute top-4 right-4 z-50">
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <SidebarContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-xl sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
              <span className="text-black font-bold text-[10px] font-display">P</span>
            </div>
            <span className="text-white font-semibold text-sm">Progress Record</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] text-xs font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 lg:py-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
