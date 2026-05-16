import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, BarChart3, Timer, FileText,
  Target, Trophy, Settings, LogOut, Brain, Menu, X, ChevronRight, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { applyTheme } from '../../pages/Settings';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/subjects',    icon: BookOpen,         label: 'Subjects'   },
  { to: '/analytics',   icon: BarChart3,        label: 'Analytics'  },
  { to: '/pomodoro',    icon: Timer,            label: 'Focus Mode' },
  { to: '/notes',       icon: FileText,         label: 'Notes Vault'},
  { to: '/goals',       icon: Target,           label: 'Goals'      },
  { to: '/leaderboard', icon: Trophy,           label: 'Leaderboard'},
  { to: '/feedback',    icon: MessageSquare,    label: 'Feedback'   },
  { to: '/settings',    icon: Settings,         label: 'Settings'   },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* Apply persisted theme on mount */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('selectedTheme');
      if (saved) applyTheme(JSON.parse(saved));
    } catch {}
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center neon-glow-blue flex-shrink-0">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <div className="text-white font-black text-sm" style={{fontFamily:'Orbitron, sans-serif'}}>Progress</div>
            <div className="text-blue-400 font-black text-sm" style={{fontFamily:'Orbitron, sans-serif'}}>Record</div>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-white font-semibold text-sm truncate">{user?.name}</div>
            <div className="text-slate-500 text-xs truncate">{user?.examType}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 neon-glow-blue'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white transition-colors'} />
                <span>{label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto text-blue-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Developer Credit */}
      <div className="px-4 py-2 text-center">
        <p className="text-slate-700 text-xs">Developed by <span className="text-blue-600/60 font-semibold">Avee Ranjan</span></p>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary, #030712)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 glass border-r border-white/5 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-64 glass z-50 lg:hidden border-r border-white/5">
              <div className="absolute top-4 right-4">
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 glass">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
            <Menu size={20} />
          </button>
          <span className="text-white font-bold text-sm" style={{fontFamily:'Orbitron, sans-serif'}}>Progress Record</span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
