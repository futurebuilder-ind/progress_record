import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import {
  LayoutDashboard, BookOpen, BarChart3, Timer, FileText,
  Target, Trophy, Settings, LogOut, Menu, X, ChevronRight,
  MessageSquare, ShieldCheck, Zap, Sparkles, Search, Bell,
  Calendar, Sun, Moon, Flame, ChevronDown, User, Hash
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/subjects',       icon: BookOpen,        label: 'Subjects'      },
  { to: '/pomodoro',       icon: Timer,           label: 'Focus Mode'    },
  { to: '/analytics',      icon: BarChart3,       label: 'Progress'      },
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
  
  // UI States
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data States
  const [userStats, setUserStats] = useState({ xp: 120, streak: 0 });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  // Handle Cmd+K / Ctrl+K
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

  // Fetch live stats & notifications
  useEffect(() => {
    if (user) {
      // Fetch Stats
      API.get('/analytics').then(({ data }) => {
        if (data) {
          setUserStats({
            xp: (data.completedTasks * 20) + 120,
            streak: data.consistency || 0
          });
        }
      }).catch(() => {});

      // Fetch Notifications (Admin Replies)
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount((data.notifications || []).filter(n => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
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

  // Search Results Filtering
  const searchResults = navItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SidebarContent = ({ isMobile }) => (
    <div className="flex flex-col h-full bg-[var(--bg-sidebar)] overflow-y-auto">
      {/* Brand Logo & Tagline */}
      <div className={`p-6 border-b border-[var(--border-color)] flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.2)] text-white flex-shrink-0 relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" strokeOpacity="0.3" />
              <path d="M6 10h10" strokeOpacity="0.3" />
              <path d="M8 18l3-3 3 3 4-4" />
            </svg>
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="text-[16px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">Progress Record</span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 leading-none">Built by Avee Ranjan</span>
            </div>
          )}
        </div>
        {!isMobile && (
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1 cursor-pointer">
            {isCollapsed ? <Menu size={18} /> : <ChevronRight size={18} className="rotate-180" />}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => {
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
                  {(!isCollapsed || isMobile) && <span className="relative z-10 tracking-tight">{label}</span>}
                  {(!isCollapsed || isMobile) && isActive && <ChevronRight size={12} className="ml-auto text-blue-500/60 relative z-10" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-[var(--border-color)]">
        {(!isCollapsed || isMobile) && (
          <div className="p-4 mx-1 my-3 rounded-2xl bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/40 flex flex-col items-center text-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-2.5 text-blue-600 dark:text-blue-400">
              <Trophy size={18} />
            </div>
            <div className="text-slate-900 dark:text-white font-bold text-xs">Keep going!</div>
            <div className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">Every step counts.</div>
            <button onClick={() => navigate('/goals')} className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer">
              View Goals
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)] font-['Outfit']">
      
      {/* Search Modal Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSearchOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <Search size={20} className="text-slate-400 mr-3" />
                <input type="text" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search workspace, subjects, goals..." className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder-slate-400 text-lg" />
                <div className="flex gap-1 ml-2">
                  <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">ESC</span>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto p-2">
                {searchResults.length > 0 ? (
                  searchResults.map(item => {
                    return (
                      <button key={item.to} onClick={() => { navigate(item.to); setSearchOpen(false); }} className="w-full flex items-center px-4 py-3 gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center"><item.icon size={16} /></div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
                          <p className="text-xs text-slate-500">Navigate to {item.label.toLowerCase()}</p>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="py-12 text-center text-slate-500">
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.aside animate={{ width: isCollapsed ? 80 : 280 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} className="hidden lg:flex flex-col h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex-shrink-0 z-20">
        <SidebarContent isMobile={false} />
      </motion.aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed left-0 top-0 h-full w-72 z-50 lg:hidden border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] shadow-2xl">
              <div className="absolute top-5 right-5 z-50">
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-[var(--border-color)] cursor-pointer"><X size={16} /></button>
              </div>
              <SidebarContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="h-16 flex-shrink-0 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between px-4 lg:px-8 relative z-20">
          
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-[var(--border-color)] cursor-pointer"><Menu size={18} /></button>

            {/* Search Trigger */}
            <div onClick={() => setSearchOpen(true)} className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-[var(--border-color)] w-72 hover:border-blue-500/40 cursor-pointer transition-all">
              <Search size={16} className="text-slate-400 dark:text-slate-500" />
              <span className="text-xs text-slate-400 flex-1">Search workspace...</span>
              <span className="text-[10px] font-bold text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">⌘K</span>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4 relative">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[var(--border-color)] text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer">
              <Calendar size={13} className="text-blue-500" />
              <span>{getFormattedDate()}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/20 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-sm">
              <Flame size={13} className="text-amber-500 fill-amber-500 animate-pulse" />
              <span>{userStats.xp} XP</span>
              <span className="text-amber-300 dark:text-amber-700 font-normal">|</span>
              <span>{userStats.streak}d Streak</span>
            </div>

            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[var(--border-color)] text-slate-500 hover:text-blue-500 transition-all cursor-pointer">
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button onClick={handleOpenNotifications} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[var(--border-color)] text-slate-500 hover:text-blue-500 transition-all cursor-pointer">
                <Bell size={15} />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950"></span>}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-4 z-40 custom-scrollbar">
                      <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)] mb-3">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Alert Center</span>
                      </div>
                      <div className="space-y-2.5">
                        
                        {/* Static Safe Alert */}
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-[var(--border-color)]">
                          <Flame size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Daily Streak Safe!</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">Your study streak is officially secured.</div>
                          </div>
                        </div>

                        {/* Dynamic Feedback Replies */}
                        {notifications.length === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-500">No recent feedback replies.</div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif._id} className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40">
                              <ShieldCheck size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs font-bold text-blue-900 dark:text-blue-300">Admin replied to your feedback:</div>
                                <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 italic border-l-2 border-blue-500/30 pl-2">"{notif.adminReply}"</div>
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

            {/* User Profile dropdown */}
            <div className="relative">
              <div onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }} className="flex items-center gap-2 pl-1 border-l border-[var(--border-color)] cursor-pointer group p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-extrabold shadow-sm overflow-hidden flex-shrink-0">
                  {user?.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" alt="Avatar" /> : user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:flex flex-col items-start leading-none select-none">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors truncate max-w-[100px]">{user?.name?.split(' ')[0]}</span>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{user?.role || 'Student'}</span>
                </div>
                <ChevronDown size={12} className="text-slate-400 hidden lg:block" />
              </div>

              {/* Profile Menu Dropdown */}
              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-12 w-56 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-2 z-40">
                      <div className="p-3 border-b border-[var(--border-color)] mb-2">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                      
                      <button onClick={() => { navigate('/settings'); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left">
                        <Settings size={16} /> Settings
                      </button>
                      
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left mt-1">
                        <LogOut size={16} /> Sign out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar relative bg-[var(--bg-primary)]">
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
