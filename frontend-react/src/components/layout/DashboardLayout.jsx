import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, BarChart3, Timer, FileText,
  Target, Trophy, Settings, LogOut, Menu, X, ChevronRight,
  MessageSquare, ShieldCheck, Zap, Sparkles, Search, Bell,
  Calendar, Sun, Moon, Flame, ChevronDown, ClipboardList, LineChart
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/subjects',       icon: BookOpen,        label: 'Subjects'      },
  { to: '/pomodoro',       icon: Timer,           label: 'Study Plan'    },
  { to: '/analytics',      icon: BarChart3,       label: 'Progress'      },
  { to: '/goals',          icon: ClipboardList,   label: 'Assignments'   },
  { to: '/leaderboard',    icon: Trophy,          label: 'Tests'         },
  { to: '/notes',          icon: FileText,        label: 'Notes'         },
  { to: '/goals',          icon: Target,          label: 'Goals'         },
  { to: '/pomodoro',       icon: Calendar,        label: 'Calendar'      },
  { to: '/feedback',       icon: LineChart,       label: 'Reports'       },
  { to: '/ai-chat',        icon: Sparkles,        label: 'AI Assistant'  },
  { to: '/feedback-admin', icon: ShieldCheck,     label: 'Admin Portal'  },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Light / Dark Theme state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || !('theme' in localStorage);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  // Get current date string formatted nicely (e.g. May 20, 2024)
  const getFormattedDate = () => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const SidebarContent = ({ isMobile }) => (
    <div className="flex flex-col h-full bg-[var(--bg-sidebar)] overflow-y-auto">
      {/* Brand Logo & Tagline */}
      <div className={`p-6 border-b border-[var(--border-color)] flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3">
          {/* Custom vector Book + Growth Graph Logo */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.2)] text-white flex-shrink-0 relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" strokeOpacity="0.3" />
              <path d="M6 10h10" strokeOpacity="0.3" />
              <path d="M8 18l3-3 3 3 4-4" stroke="currentColor" strokeWidth="2.5" />
            </svg>
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="text-[16px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">Progress Record</span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 leading-none">Built by Avee Ranjan</span>
            </div>
          )}
        </div>
        {/* Desktop Collapse Toggle */}
        {!isMobile && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1 cursor-pointer"
          >
            {isCollapsed ? <Menu size={18} /> : <ChevronRight size={18} className="rotate-180" />}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          // Hide admin portal if not admin
          if (label === 'Admin Portal' && user?.role !== 'admin') return null;

          return (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-900/30 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={isCollapsed && !isMobile ? 22 : 18} className={`${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-500'} transition-colors relative z-10`} />
                  {(!isCollapsed || isMobile) && (
                    <span className="relative z-10 tracking-tight">{label}</span>
                  )}
                  {(!isCollapsed || isMobile) && isActive && <ChevronRight size={12} className="ml-auto text-blue-500/60 relative z-10" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions & Trophy Card */}
      <div className="p-3 border-t border-[var(--border-color)]">
        {(!isCollapsed || isMobile) && (
          <div className="p-4 mx-1 my-3 rounded-2xl bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/40 flex flex-col items-center text-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-2.5 text-blue-600 dark:text-blue-400">
              <Trophy size={18} />
            </div>
            <div className="text-slate-900 dark:text-white font-bold text-xs">Keep going!</div>
            <div className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">Every step counts.</div>
            <button 
              onClick={() => navigate('/goals')}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
            >
              View Goals
            </button>
          </div>
        )}

        <NavLink to="/settings" onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl text-sm font-medium transition-all group ${
              isActive ? 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-900/30'
            }`
          }
        >
          <Settings size={isCollapsed && !isMobile ? 22 : 18} className="text-slate-400 dark:text-slate-500 group-hover:rotate-90 transition-transform duration-500" />
          {(!isCollapsed || isMobile) && <span>Settings</span>}
        </NavLink>
        
        <button onClick={handleLogout}
          className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3 px-4'} w-full py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-900/30 hover:text-red-500 transition-all group cursor-pointer`}>
          <LogOut size={isCollapsed && !isMobile ? 22 : 18} className="text-slate-400 dark:text-slate-500 group-hover:-translate-x-0.5 transition-transform" /> 
          {(!isCollapsed || isMobile) && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)] font-['Outfit']">
      {/* Desktop Sidebar */}
      <motion.aside 
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex-shrink-0 z-20"
      >
        <SidebarContent isMobile={false} />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-72 z-50 lg:hidden border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] shadow-2xl">
              <div className="absolute top-5 right-5 z-50">
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-[var(--border-color)] cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <SidebarContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Global Top Navbar */}
        <header className="h-16 flex-shrink-0 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between px-4 lg:px-8 relative z-20">
          {/* Left Side: Mobile Menu Button + Search bar */}
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-[var(--border-color)] cursor-pointer">
              <Menu size={18} />
            </button>

            {/* Notion/Linear inspired minimalist Search bar */}
            <div className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-[var(--border-color)] w-72 transition-all focus-within:w-80 focus-within:border-blue-500/40">
              <Search size={16} className="text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                placeholder="Search workspace (⌘K)..." 
                className="bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 w-full"
              />
            </div>
          </div>

          {/* Right Side: Date Selector, XP counter, Toggle theme, Avatar */}
          <div className="flex items-center gap-3 lg:gap-4">
            
            {/* Date Selector Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[var(--border-color)] text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Calendar size={13} className="text-blue-500" />
              <span>{getFormattedDate()}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </div>

            {/* XP & Streak Capsule */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/20 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-sm select-none">
              <Flame size={13} className="text-amber-500 fill-amber-500 animate-pulse" />
              <span>320 XP</span>
              <span className="text-amber-300 dark:text-amber-700 font-normal">|</span>
              <span className="flex items-center gap-0.5">5d Streak</span>
            </div>

            {/* Dark Mode Switcher */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[var(--border-color)] text-slate-500 dark:text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all cursor-pointer"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Notification Bell */}
            <button className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[var(--border-color)] text-slate-500 dark:text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all relative cursor-pointer">
              <Bell size={15} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-950"></span>
            </button>

            {/* User Profile dropdown */}
            <div className="flex items-center gap-2 pl-1 border-l border-[var(--border-color)] cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-extrabold border border-blue-500/10 shadow-sm overflow-hidden flex-shrink-0">
                {user?.profilePic ? (
                  <img src={user.profilePic} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden lg:flex flex-col items-start leading-none select-none">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors truncate max-w-[100px]">{user?.name?.split(' ')[0]}</span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{user?.role || 'Student'}</span>
              </div>
              <ChevronDown size={12} className="text-slate-400 hidden lg:block" />
            </div>

          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar relative bg-[var(--bg-primary)]">
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
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
