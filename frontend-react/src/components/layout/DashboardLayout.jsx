import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, BarChart3, Timer, FileText,
  Target, Trophy, Settings, LogOut, Brain, Menu, X, ChevronRight, MessageSquare, ShieldCheck,
  Zap
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
  { to: '/feedback-admin', icon: ShieldCheck,    label: 'Admin Panel' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // For desktop

  useEffect(() => {
    try {
      const saved = localStorage.getItem('selectedTheme');
      if (saved) applyTheme(JSON.parse(saved));
    } catch {}
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Session terminated successfully');
    navigate('/login');
  };

  const SidebarContent = ({ isMobile }) => (
    <div className="flex flex-col h-full bg-[#000000] relative overflow-hidden">
      {/* Background flare inside sidebar */}
      <div className="absolute top-0 left-0 w-full h-32 bg-white/5 blur-[50px] pointer-events-none"></div>

      {/* Brand */}
      <div className={`p-6 border-b border-white/5 flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#050505] border border-white/10 flex items-center justify-center relative">
            <div className="absolute inset-0 cyber-scanline rounded-xl"></div>
            <Brain size={20} className="text-white relative z-10" />
          </div>
          {(!isCollapsed || isMobile) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-white font-black text-[15px] font-orbitron tracking-widest leading-tight">PROGRESS</div>
              <div className="text-slate-500 font-black text-[13px] font-orbitron tracking-widest leading-tight">RECORD</div>
            </motion.div>
          )}
        </div>
        {/* Desktop Collapse Toggle */}
        {!isMobile && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-600 hover:text-white transition-colors p-1"
          >
            {isCollapsed ? <Menu size={18} /> : <ChevronRight size={18} className="rotate-180" />}
          </button>
        )}
      </div>

      {/* User Info */}
      <div className={`p-4 border-b border-white/5 ${isCollapsed && !isMobile ? 'flex justify-center' : ''}`}>
        <div className={`flex items-center gap-3 p-3 rounded-2xl bg-[#050505] border border-white/5 ${isCollapsed && !isMobile ? 'w-fit' : 'w-full'} group hover:border-white/20 transition-all cursor-pointer`}>
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black font-black text-sm flex-shrink-0 relative overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <span className="relative z-10">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="overflow-hidden">
              <div className="text-white font-bold text-sm truncate tracking-tight">{user?.name}</div>
              <div className="text-slate-500 text-[10px] font-mono tracking-widest uppercase truncate flex items-center gap-1">
                <Zap size={10} className="text-blue-400" /> {user?.examType || 'OPERATOR'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className={`text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4 px-3 ${isCollapsed && !isMobile ? 'text-center' : ''}`}>
          {isCollapsed && !isMobile ? '---' : 'System Modules'}
        </div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden ${
                isActive
                  ? 'bg-white/5 text-white border border-white/10'
                  : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div layoutId="activeNav" className="absolute left-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                )}
                <Icon size={isCollapsed && !isMobile ? 22 : 18} className={`${isActive ? 'text-white' : 'text-slate-600 group-hover:text-white'} transition-colors relative z-10`} />
                {(!isCollapsed || isMobile) && (
                  <span className="relative z-10 font-['Space_Grotesk'] tracking-wide">{label}</span>
                )}
                {(!isCollapsed || isMobile) && isActive && <ChevronRight size={14} className="ml-auto text-slate-500 relative z-10" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <NavLink to="/settings" onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-medium transition-all group ${
              isActive ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <Settings size={isCollapsed && !isMobile ? 22 : 18} className="group-hover:rotate-90 transition-transform duration-500" />
          {(!isCollapsed || isMobile) && <span>System Settings</span>}
        </NavLink>
        
        <button onClick={handleLogout}
          className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3 px-4'} w-full py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-white/5 hover:text-white transition-all group`}>
          <LogOut size={isCollapsed && !isMobile ? 22 : 18} className="group-hover:-translate-x-1 transition-transform" /> 
          {(!isCollapsed || isMobile) && <span>Disconnect</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#000000] font-['Space_Grotesk']">
      {/* Desktop Sidebar */}
      <motion.aside 
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="hidden lg:flex flex-col h-full border-r border-white/5 flex-shrink-0 z-20"
      >
        <SidebarContent isMobile={false} />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#000000]/80 backdrop-blur-md z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-72 z-50 lg:hidden border-r border-white/5 shadow-2xl bg-[#000000]">
              <div className="absolute top-4 right-4 z-50">
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white border border-white/10">
                  <X size={18} />
                </button>
              </div>
              <SidebarContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 bg-[#000000]">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#000000]/80 backdrop-blur-md sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl bg-[#050505] border border-white/5 text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-white" />
            <span className="text-white font-black text-sm font-orbitron tracking-widest">PR<span className="text-slate-500">.</span></span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black text-xs font-black border border-white/10 shadow-lg">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname} 
              initial={{ opacity: 0, y: 15, scale: 0.99 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -15, scale: 0.99 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
