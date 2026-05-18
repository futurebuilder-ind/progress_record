import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import {
  LayoutDashboard, BookOpen, LineChart, Crosshair, FileText,
  Target, Trophy, Settings, LogOut, Menu, X, ChevronRight,
  MessageSquare, ShieldCheck, Sparkles, Search, Bell,
  Calendar, Sun, Moon, Flame, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/subjects',       icon: BookOpen,        label: 'Subjects'      },
  { to: '/pomodoro',       icon: Crosshair,       label: 'Focus Mode'    },
  { to: '/analytics',      icon: LineChart,       label: 'Progress'      },
  { to: '/goals',          icon: Target,          label: 'Goals & Tasks' },
  { to: '/leaderboard',    icon: Trophy,          label: 'Leaderboard'   },
  { to: '/notes',          icon: FileText,        label: 'Notes Vault'   },
  { to: '/feedback',       icon: MessageSquare,   label: 'Feedback'      },
  { to: '/ai-chat',        icon: Sparkles,        label: 'AI Assistant'  },
  { to: '/feedback-admin', icon: ShieldCheck,     label: 'Admin Portal'  },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [userStats, setUserStats] = useState({ xp: 140, streak: 2 });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setProfileOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (user) {
      API.get('/analytics').then(({ data }) => {
        if (data) {
          setUserStats({
            xp: (data.completedTasks * 20) + 120,
            streak: data.consistency || 0
          });
        }
      }).catch(() => {});
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount((data.notifications || []).filter(n => !n.read).length);
    } catch (err) {}
  };

  const handleOpenNotifications = async () => {
    setNotifOpen(!notifOpen);
    setProfileOpen(false);
    if (!notifOpen && unreadCount > 0) {
      try {
        await API.patch('/notifications/read');
        setUnreadCount(0);
      } catch (err) {}
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const getFormattedDate = () => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const searchResults = navItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SidebarContent = ({ isMobile }) => (
    <div className="flex flex-col h-full bg-white dark:bg-[#050505] overflow-y-auto">
      {/* Brand Logo & Tagline */}
      <div className={`p-6 border-b border-slate-100 dark:border-white/5 flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-10 flex items-center justify-center flex-shrink-0 relative">
            {/* Custom PR Logo SVG */}
            <svg viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M12 2L32 12V32L12 42V2Z" fill="url(#paint0_linear)"/>
              <path d="M12 22L22 17V27L12 32V22Z" fill="black" fillOpacity="0.3"/>
              <path d="M12 2L22 7V17L12 12V2Z" fill="white" fillOpacity="0.8"/>
              <path d="M22 17L32 12V22L22 27V17Z" fill="white" fillOpacity="0.4"/>
              <defs>
                <linearGradient id="paint0_linear" x1="12" y1="2" x2="32" y2="42" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8B5CF6" />
                  <stop offset="1" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">Progress Record</span>
              <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">Built by Avee Ranjan</span>
            </div>
          )}
        </div>
        {!isMobile && (
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white transition-colors p-1 cursor-pointer">
            {isCollapsed ? <Menu size={16} strokeWidth={1.5} /> : <ChevronRight size={16} strokeWidth={1.5} className="rotate-180" />}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          return (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl text-[13px] font-medium transition-all group relative overflow-hidden ${
                  isActive
                    ? 'bg-blue-50 dark:bg-gradient-to-r dark:from-blue-600/10 dark:to-purple-600/5 text-blue-700 dark:text-white border border-blue-100 dark:border-blue-500/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={isCollapsed && !isMobile ? 20 : 18} strokeWidth={1.5} className={`${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-slate-300'} transition-colors relative z-10`} />
                  {(!isCollapsed || isMobile) && <span className="relative z-10 tracking-wide">{label}</span>}
                  {(!isCollapsed || isMobile) && isActive && <ChevronRight size={14} strokeWidth={2} className="ml-auto text-blue-500 dark:text-purple-500 relative z-10" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions - Premium Motivation Card */}
      <div className="p-4 border-t border-slate-100 dark:border-white/5">
        {(!isCollapsed || isMobile) && (
          <div className="relative overflow-hidden rounded-2xl p-5 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-transparent" 
               style={darkMode ? { background: 'linear-gradient(135deg, rgba(20,20,30,1) 0%, rgba(30,20,40,1) 100%)' } : {}}>
            {/* Sparkles bg (dark mode only) */}
            {darkMode && <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />}
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-10 h-10 rounded-full border border-blue-100 dark:border-white/20 bg-blue-50 dark:bg-white/5 flex items-center justify-center mb-3 shadow-sm dark:shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <Trophy size={18} strokeWidth={1.5} className="text-blue-600 dark:text-white" />
              </div>
              <div className="text-slate-800 dark:text-white font-semibold text-xs mb-1">Keep going, {user?.name?.split(' ')[0]}! 🚀</div>
              <div className="text-slate-500 dark:text-slate-400 text-[10px] mb-4">Every step counts.</div>
              <button onClick={() => navigate('/goals')} className="w-full bg-blue-600 dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600 hover:bg-blue-700 dark:hover:from-blue-500 dark:hover:to-purple-500 text-white text-[11px] font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-md dark:shadow-lg dark:shadow-purple-500/20 transition-all cursor-pointer">
                View Goals
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0a0a0a] font-['Inter',sans-serif]">
      
      {/* Search Modal Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSearchOpen(false)} className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} className="relative w-full max-w-2xl bg-white dark:bg-[#111] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10">
              <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-white/5">
                <Search size={18} strokeWidth={1.5} className="text-slate-400 mr-3" />
                <input type="text" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search workspace..." className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm" />
                <div className="flex gap-1 ml-2">
                  <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">ESC</span>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto p-2">
                {searchResults.length > 0 ? (
                  searchResults.map(item => {
                    return (
                      <button key={item.to} onClick={() => { navigate(item.to); setSearchOpen(false); }} className="w-full flex items-center px-4 py-3 gap-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 text-blue-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-white flex items-center justify-center transition-colors"><item.icon size={16} strokeWidth={1.5} /></div>
                        <div>
                          <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-white">{item.label}</p>
                          <p className="text-[11px] text-slate-500">Navigate to {item.label.toLowerCase()}</p>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.aside animate={{ width: isCollapsed ? 80 : 280 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} className="hidden lg:flex flex-col h-full bg-white dark:bg-[#050505] border-r border-slate-200 dark:border-white/5 flex-shrink-0 z-20">
        <SidebarContent isMobile={false} />
      </motion.aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed left-0 top-0 h-full w-72 z-50 lg:hidden border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#050505] shadow-2xl">
              <div className="absolute top-5 right-5 z-50">
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-white/5"><X size={16} /></button>
              </div>
              <SidebarContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="h-16 flex-shrink-0 bg-white dark:bg-[#0a0a0a] flex items-center justify-between px-4 lg:px-8 relative z-20 border-b border-slate-100 dark:border-transparent">
          
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5"><Menu size={16} strokeWidth={1.5} /></button>

            {/* Premium Search Trigger */}
            <div onClick={() => setSearchOpen(true)} className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/5 w-64 hover:border-slate-300 dark:hover:border-white/20 cursor-pointer transition-all dark:shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]">
              <Search size={14} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500" />
              <span className="text-[13px] text-slate-500 flex-1 font-medium">Search workspace...</span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 bg-white dark:bg-black/50">⌘K</span>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4 relative">
            {/* Pill Badges */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 text-xs font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
              <Calendar size={13} strokeWidth={2} className="text-blue-500" />
              <span>{getFormattedDate()}</span>
              <ChevronDown size={12} className="text-slate-400 dark:text-slate-500 ml-1" />
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-[#111] border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-500 text-xs font-medium shadow-sm dark:shadow-[0_0_10px_rgba(245,158,11,0.05)] cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors">
              <Flame size={13} strokeWidth={2} className="text-amber-500" />
              <span>{userStats.xp} XP</span>
              <span className="text-amber-300 dark:text-amber-500/30">|</span>
              <span className="text-amber-600 dark:text-amber-400">{userStats.streak}d Streak</span>
            </div>

            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer">
              {darkMode ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button onClick={handleOpenNotifications} className="p-2 rounded-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer">
                <Bell size={15} strokeWidth={1.5} />
                {unreadCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[#0a0a0a]"></span>}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 z-40 custom-scrollbar">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5 mb-3">
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-300">Alert Center</span>
                      </div>
                      <div className="space-y-2.5">
                        {notifications.length === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-500">No new notifications.</div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif._id} className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                              <ShieldCheck size={14} strokeWidth={1.5} className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs font-medium text-slate-800 dark:text-slate-200">Admin replied to feedback:</div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic border-l-2 border-blue-200 dark:border-blue-500/30 pl-2">"{notif.adminReply}"</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile */}
            <div className="relative pl-2 ml-2 border-l border-slate-200 dark:border-white/10">
              <div onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }} className="flex items-center gap-2 cursor-pointer group hover:bg-slate-50 dark:hover:bg-white/5 p-1 pr-2 rounded-full transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#111] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold overflow-hidden flex-shrink-0 relative">
                  {user?.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" alt="Avatar" /> : user?.name?.charAt(0).toUpperCase()}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#111]" />
                </div>
                <div className="hidden lg:flex flex-col items-start leading-none select-none">
                  <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-white transition-colors truncate max-w-[100px]">{user?.name?.split(' ')[0]}</span>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mt-1">{user?.role || 'Student'}</span>
                </div>
                <ChevronDown size={12} strokeWidth={2} className="text-slate-400 dark:text-slate-600 hidden lg:block ml-1" />
              </div>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-12 w-56 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-40">
                      <div className="p-3 border-b border-slate-100 dark:border-white/5 mb-2">
                        <p className="text-[13px] font-medium text-slate-800 dark:text-white truncate">{user?.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      </div>
                      <button onClick={() => { navigate('/settings'); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:text-blue-600 dark:hover:text-white dark:hover:bg-white/5 transition-colors text-left">
                        <Settings size={14} strokeWidth={1.5} /> Settings
                      </button>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left mt-1">
                        <LogOut size={14} strokeWidth={1.5} /> Sign out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar relative bg-slate-50 dark:bg-[#0a0a0a]">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="h-full">
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
