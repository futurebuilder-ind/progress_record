import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import API from '../api/axios';
import { 
  Zap, TrendingUp, BookOpen, Target, Flame, Clock, Trophy, 
  Brain, Sparkles, Activity, Play, Pause, RotateCcw, ChevronRight, 
  HelpCircle, FileText, Send, Mic, Volume2, Calendar, CheckCircle, Clock3, X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MOCK_ANALYTICS = {
  overallMastery: 60,
  subjectMastery: [
    { name: 'Mathematics', mastery: 75, color: '#3b82f6', bg: 'bg-blue-500' },
    { name: 'Physics', mastery: 60, color: '#0d9488', bg: 'bg-teal-500' },
    { name: 'Chemistry', mastery: 50, color: '#8b5cf6', bg: 'bg-purple-500' },
    { name: 'Biology', mastery: 65, color: '#f97316', bg: 'bg-orange-500' },
    { name: 'English', mastery: 40, color: '#06b6d4', bg: 'bg-cyan-500' },
    { name: 'History', mastery: 30, color: '#ec4899', bg: 'bg-pink-500' },
  ],
  completedTasks: 48,
  totalTasks: 120,
  consistency: 5,
  totalFocusSessions: 36,
  totalActiveUsers: 1420
};

const WEEKLY_DATA = [
  { day: 'Mon', hours: 4.5 },
  { day: 'Tue', hours: 6.0 },
  { day: 'Wed', hours: 3.2 },
  { day: 'Thu', hours: 5.8 },
  { day: 'Fri', hours: 7.5 },
  { day: 'Sat', hours: 4.0 },
  { day: 'Sun', hours: 2.5 }
];

/* ─── precision subject mastery calculator matching Subjects.jsx ─── */
function calcSubjectMastery(subject) {
  if (!subject) return 0;
  const topics = subject.topics || [];
  if (topics.length === 0) return 0;
  let totalWeight = 0, doneWeight = 0;
  topics.forEach(t => {
    if (!t) return;
    const subtopics = t.subtopics || [];
    if (subtopics.length === 0) {
      totalWeight++;
      if (t.completed) doneWeight++;
    } else {
      let stTotal = 0, stDone = 0;
      subtopics.forEach(st => {
        if (!st) return;
        const tasks = st.tasks || [];
        if (tasks.length === 0) {
          stTotal++;
          if (st.completed) stDone++;
        } else {
          stTotal += tasks.length;
          stDone += tasks.filter(tk => tk && tk.completed).length;
        }
      });
      totalWeight++;
      doneWeight += stTotal > 0 ? stDone / stTotal : (t.completed ? 1 : 0);
    }
  });
  return totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(MOCK_ANALYTICS);
  const [subjects, setSubjects] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pomodoro timer states
  const [pomoTime, setPomoTime] = useState(25 * 60);
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoMode, setPomoMode] = useState('Focus'); // Focus, Break

  // AI Floating Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: `Hey ${user?.name?.split(' ')[0] || 'Aarav'}! I'm your AI Study Companion. How can I help you accelerate your revision session today?` }
  ]);
  const [aiTyping, setAiTyping] = useState(false);
  const chatScrollRef = useRef(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [analyticsRes, subjectsRes, goalsRes] = await Promise.all([
        API.get('/analytics').catch(() => ({ data: MOCK_ANALYTICS })),
        API.get('/subjects').catch(() => ({ data: { subjects: [] } })),
        API.get('/goals').catch(() => ({ data: [] }))
      ]);

      if (analyticsRes && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      } else {
        setAnalytics(MOCK_ANALYTICS);
      }

      if (subjectsRes && subjectsRes.data && subjectsRes.data.subjects) {
        setSubjects(subjectsRes.data.subjects);
      } else {
        setSubjects([]);
      }

      if (goalsRes && goalsRes.data) {
        setGoals(goalsRes.data);
      } else {
        setGoals([]);
      }
    } catch (e) {
      console.warn("Using default visualization specs due to API fetch issue.");
      setAnalytics(MOCK_ANALYTICS);
      setSubjects([]);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Pomodoro Interval ticker
  useEffect(() => {
    let interval = null;
    if (pomoActive && pomoTime > 0) {
      interval = setInterval(() => {
        setPomoTime(t => t - 1);
      }, 1000);
    } else if (pomoTime === 0) {
      setPomoActive(false);
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav');
      audio.play().catch(() => {});
      if (pomoMode === 'Focus') {
        toast.success("Focus session complete! Take a well-deserved break.");
        setPomoMode('Break');
        setPomoTime(5 * 60);
      } else {
        toast.success("Break complete! Ready to start grinding?");
        setPomoMode('Focus');
        setPomoTime(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [pomoActive, pomoTime, pomoMode]);

  // Scroll AI Chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, aiTyping]);

  const handlePomoToggle = () => setPomoActive(!pomoActive);
  const handlePomoReset = () => {
    setPomoActive(false);
    setPomoTime(pomoMode === 'Focus' ? 25 * 60 : 5 * 60);
  };

  const formatPomoTime = () => {
    const mins = Math.floor(pomoTime / 60);
    const secs = pomoTime % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // AI Floating Chat Send message
  const handleSendChat = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || aiTyping) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userText }]);
    setAiTyping(true);

    try {
      const { data } = await API.post('/ai/chat', {
        message: userText,
        history: chatMessages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      // Mock fallback response for offline backend state
      setTimeout(() => {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Understood! I've loaded your study nodes for **${userText}**. Here is a tailored plan: \n\n1. Review chapter summaries and complete the active mock test.\n2. Dedicate a 25-minute Pomodoro block to active recall practice.` 
        }]);
      }, 1000);
    } finally {
      setAiTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider animate-pulse">Syncing Workspace Telemetry...</span>
        </div>
      </div>
    );
  }

  // ─── Safe Telemetry Analytics Computations from Live MongoDB State ───
  
  // 1. Overall Mastery calculation
  const overallMasteryValue = (subjects && Array.isArray(subjects) && subjects.length > 0)
    ? Math.round(subjects.reduce((acc, sub) => acc + calcSubjectMastery(sub), 0) / subjects.length)
    : (analytics?.overallMastery ?? 60);

  // 2. Total Subjects Count
  const totalSubjectsCount = (subjects && Array.isArray(subjects) && subjects.length > 0) 
    ? subjects.length 
    : (analytics?.subjectMastery?.length ?? 6);

  // 3. Completed Topics count & task lists
  let completedTopicsCount = 0;
  let totalTopicsCount = 0;
  let upcomingTasksList = [];
  let recentActivityList = [];

  if (subjects && Array.isArray(subjects) && subjects.length > 0) {
    subjects.forEach(subject => {
      if (!subject) return;
      const topics = subject.topics || [];
      topics.forEach(t => {
        if (!t) return;
        totalTopicsCount++;
        if (t.completed) {
          completedTopicsCount++;
          recentActivityList.push({
            type: 'topic',
            title: `Completed topic "${t.name || 'Unnamed Topic'}"`,
            subtitle: subject.name || 'General',
            time: t.deadline ? new Date(t.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently',
            timestamp: t.deadline ? new Date(t.deadline).getTime() : Date.now() - 3600000 * 2,
          });
        } else {
          if (t.deadline) {
            upcomingTasksList.push({
              id: t._id || Math.random().toString(),
              title: t.name || 'Unnamed Topic',
              subtitle: subject.name || 'General',
              date: new Date(t.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              daysLeft: Math.ceil((new Date(t.deadline) - new Date()) / 86400000),
              completed: false,
              type: 'calendar'
            });
          }
        }

        // Subtopics checking
        const subtopics = t.subtopics || [];
        subtopics.forEach(st => {
          if (!st) return;
          if (st.completed) {
            recentActivityList.push({
              type: 'subtopic',
              title: `Mastered subtopic "${st.name || 'Unnamed Subtopic'}"`,
              subtitle: `${t.name || 'Topic'} (${subject.name || 'Subject'})`,
              time: st.deadline ? new Date(st.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently',
              timestamp: st.deadline ? new Date(st.deadline).getTime() : Date.now() - 3600000 * 8,
            });
          } else {
            if (st.deadline) {
              upcomingTasksList.push({
                id: st._id || Math.random().toString(),
                title: st.name || 'Unnamed Subtopic',
                subtitle: t.name || 'General',
                date: new Date(st.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                daysLeft: Math.ceil((new Date(st.deadline) - new Date()) / 86400000),
                completed: false,
                type: 'calendar'
              });
            }
          }

          // Inner tasks checking
          const tasks = st.tasks || [];
          tasks.forEach(tk => {
            if (tk && tk.completed) {
              recentActivityList.push({
                type: 'task',
                title: `Completed task "${tk.name || 'Unnamed Task'}"`,
                subtitle: `${st.name || 'Subtopic'}`,
                time: 'Recently',
                timestamp: Date.now() - 3600000,
              });
            }
          });
        });
      });
    });
  }

  // Fallback defaults if database has empty subjects list
  if (totalTopicsCount === 0) {
    completedTopicsCount = analytics?.completedTasks ?? MOCK_ANALYTICS.completedTasks;
    totalTopicsCount = analytics?.totalTasks ?? MOCK_ANALYTICS.totalTasks;
  }

  // Sort activities by timestamp
  recentActivityList.sort((a, b) => b.timestamp - a.timestamp);
  if (recentActivityList.length === 0) {
    recentActivityList = [
      { type: 'topic', title: 'Completed chapter "Quadratic Equations"', subtitle: 'Mathematics', time: '2h ago' },
      { type: 'subtopic', title: 'Submitted assignment "Photosynthesis"', subtitle: 'Biology', time: '1d ago' },
      { type: 'task', title: 'Completed study block', subtitle: 'Physics', time: '1d ago' }
    ];
  }

  // Sort upcoming tasks by deadline
  upcomingTasksList.sort((a, b) => a.daysLeft - b.daysLeft);
  if (upcomingTasksList.length === 0) {
    upcomingTasksList = [
      { id: 'u1', title: 'Physics Revision Mock', subtitle: 'Physics', date: 'May 22, 2024', daysLeft: 2, type: 'calendar' },
      { id: 'u2', title: 'Chemistry Stoichiometry', subtitle: 'Chemistry', date: 'May 25, 2024', daysLeft: 5, type: 'calendar' },
      { id: 'u3', title: 'Weekly Goal Sync', subtitle: 'General Study', date: 'May 26, 2024', daysLeft: 6, type: 'calendar' }
    ];
  }

  // 4. Study time calculation
  const weeklyData = (analytics?.weeklyData && Array.isArray(analytics.weeklyData)) ? analytics.weeklyData : WEEKLY_DATA;
  const totalHours = weeklyData.reduce((acc, curr) => acc + (curr?.hours || 0), 0);
  const studyTimeString = `${Math.floor(totalHours)}hr ${Math.round((totalHours % 1) * 60)}min`;

  // 5. Goals Achieved
  const completedGoalsCount = (goals && Array.isArray(goals)) ? goals.filter(g => g && (g.completed || g.progress === 100)).length : 0;
  const totalGoalsCount = (goals && Array.isArray(goals)) ? goals.length : 0;
  const goalsAchievedString = totalGoalsCount > 0 ? `${completedGoalsCount}/${totalGoalsCount}` : `${analytics?.completedGoals || 3}`;

  // 6. Focus Score calculation
  const consistency = analytics?.consistency ?? MOCK_ANALYTICS.consistency;
  const focusScore = consistency > 0 ? Math.min(100, 65 + consistency * 5) : 75;

  // 7. Productivity gain index
  const productivityGainString = consistency > 0 ? `+${Math.min(25, 5 + consistency * 2.5)}%` : `+12%`;

  // 8. Subject Progress bars
  const activeSubjectMasteries = (subjects && Array.isArray(subjects) && subjects.length > 0) 
    ? subjects.map((sub, i) => {
        const colors = ['#3b82f6', '#0d9488', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899'];
        const bgColors = ['bg-blue-500', 'bg-teal-500', 'bg-purple-500', 'bg-orange-500', 'bg-cyan-500', 'bg-pink-500'];
        return {
          name: sub?.name || 'Unnamed Subject',
          mastery: calcSubjectMastery(sub),
          color: colors[i % colors.length],
          bg: bgColors[i % bgColors.length]
        };
      })
    : (analytics?.subjectMastery || MOCK_ANALYTICS.subjectMastery || []);

  return (
    <div className="space-y-6 pb-20 relative font-['Outfit'] select-none">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Hello, {user?.name?.split(' ')[0] || 'Aarav'} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Track your study progress and achieve your goals.
          </p>
        </div>

        {/* Workspace Quick Actions Toggle */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setChatOpen(true)}
            className="saas-btn-primary py-2.5 px-4 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <Sparkles size={14} className="animate-pulse" />
            <span>Consult AI Companion</span>
          </button>
        </div>
      </div>

      {/* 6 Analytics Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Card 1: Total Subjects */}
        <div className="saas-card p-5 relative overflow-hidden group flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100/50 dark:border-blue-900/10">
              <BookOpen size={18} />
            </div>
            <div className="h-6 w-16 text-blue-400 dark:text-blue-500/50 flex items-end">
              <svg className="w-full h-full" viewBox="0 0 100 30" fill="none">
                <path d="M0 25 Q15 5, 30 20 T60 10 T90 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-4 leading-none">{totalSubjectsCount}</div>
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-1.5">Total Subjects</div>
          </div>
        </div>

        {/* Card 2: Completed Topics */}
        <div className="saas-card p-5 relative overflow-hidden group flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 shadow-sm border border-green-100/50 dark:border-green-900/10">
              <CheckCircle size={18} />
            </div>
            <div className="h-6 w-16 text-green-400 dark:text-green-500/50 flex items-end">
              <svg className="w-full h-full" viewBox="0 0 100 30" fill="none">
                <path d="M0 20 Q20 28, 40 10 T80 25 T100 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-4 leading-none">{completedTopicsCount}</div>
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-1.5">Completed Topics</div>
          </div>
        </div>

        {/* Card 3: Study Time */}
        <div className="saas-card p-5 relative overflow-hidden group flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shadow-sm border border-purple-100/50 dark:border-purple-900/10">
              <Clock size={18} />
            </div>
            <div className="h-6 w-16 text-purple-400 dark:text-purple-500/50 flex items-end">
              <svg className="w-full h-full" viewBox="0 0 100 30" fill="none">
                <path d="M0 15 Q25 2, 50 25 T90 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-4 leading-none">{studyTimeString}</div>
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-2.5">Study Time</div>
          </div>
        </div>

        {/* Card 4: Goals Achieved */}
        <div className="saas-card p-5 relative overflow-hidden group flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shadow-sm border border-orange-100/50 dark:border-orange-900/10">
              <Target size={18} />
            </div>
            <div className="h-6 w-16 text-orange-400 dark:text-orange-500/50 flex items-end">
              <svg className="w-full h-full" viewBox="0 0 100 30" fill="none">
                <path d="M0 28 Q30 5, 60 15 T100 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-4 leading-none">{goalsAchievedString}</div>
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-1.5">Goal Achieved</div>
          </div>
        </div>

        {/* Card 5: Daily Focus Score */}
        <div className="saas-card p-5 relative overflow-hidden group flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 shadow-sm border border-teal-100/50 dark:border-teal-900/10">
              <Brain size={18} />
            </div>
            <div className="h-6 w-16 text-teal-400 dark:text-teal-500/50 flex items-end">
              <svg className="w-full h-full" viewBox="0 0 100 30" fill="none">
                <path d="M0 10 Q25 25, 50 5 T100 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-4 leading-none">{focusScore}/100</div>
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-1.5">Daily Focus Score</div>
          </div>
        </div>

        {/* Card 6: Weekly Productivity */}
        <div className="saas-card p-5 relative overflow-hidden group flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shadow-sm border border-rose-100/50 dark:border-rose-900/10">
              <TrendingUp size={18} />
            </div>
            <div className="h-6 w-16 text-rose-400 dark:text-rose-500/50 flex items-end">
              <svg className="w-full h-full" viewBox="0 0 100 30" fill="none">
                <path d="M0 25 Q30 8, 60 12 T100 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-4 leading-none">{productivityGainString}</div>
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-1.5">Productivity Gain</div>
          </div>
        </div>

      </div>

      {/* Progress & Visual Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Card: Overall circular progress ring gauge */}
        <div className="saas-card flex flex-col justify-between h-[360px] relative overflow-hidden">
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight">Overall Progress</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Your aggregated mastery state</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
            <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0 select-none">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="42" 
                  stroke="var(--border-color)" strokeWidth="6" fill="transparent" 
                  className="transition-colors"
                />
                <circle 
                  cx="50" cy="50" r="42" 
                  stroke="url(#progressGrad)" strokeWidth="6.5" fill="transparent"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={(2 * Math.PI * 42) * (1 - overallMasteryValue / 100)}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">{overallMasteryValue}%</div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Mastery</div>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">You're doing great!</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mt-1">
                You have completed {overallMasteryValue}% of your active study targets. Keep accelerating!
              </p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/analytics')}
            className="saas-btn-primary py-2.5 text-xs font-bold uppercase tracking-wider w-full cursor-pointer"
          >
            <span>View Progress Dashboard</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Center Card: Subject progress vertical layout */}
        <div className="saas-card flex flex-col justify-between h-[360px]">
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight">Subject Progress</h3>
              <button 
                onClick={() => navigate('/subjects')}
                className="text-xs text-blue-500 hover:text-blue-600 font-bold tracking-tight uppercase cursor-pointer"
              >
                View All
              </button>
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Top performing curriculum topics</p>
          </div>

          <div className="space-y-4 my-2.5 overflow-y-auto max-h-[220px] pr-1.5 custom-scrollbar">
            {activeSubjectMasteries && activeSubjectMasteries.length > 0 ? (
              activeSubjectMasteries.map((s, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{s?.name || 'Unnamed Subject'}</span>
                    <span className="text-slate-900 dark:text-white">{s?.mastery || 0}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900/60 rounded-full overflow-hidden border border-slate-200/20">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${s?.mastery || 0}%` }}
                      transition={{ duration: 1, delay: 0.1 * idx }}
                      className="h-full rounded-full"
                      style={{ width: `${s?.mastery || 0}%`, backgroundColor: s?.color || '#3b82f6' }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 dark:text-slate-500 text-xs">No active subjects tracked yet.</p>
                <button onClick={() => navigate('/subjects')} className="mt-3 text-xs text-blue-500 font-bold hover:underline">
                  Create a Subject +
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Dynamic Weekly study analytics area chart */}
        <div className="saas-card h-[360px] flex flex-col justify-between relative overflow-hidden">
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight">Weekly Analysis</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Focus hours over the last 7 days</p>
          </div>

          <div className="h-[210px] w-full mt-4 select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.3} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '12px' }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '11px' }}
                  itemStyle={{ color: '#2563eb', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" dataKey="hours" name="Hours"
                  stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#areaHours)" 
                  activeDot={{ r: 5, fill: '#3b82f6', stroke: 'white', strokeWidth: 1.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Activity, Pomodoro, and Upcoming Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Activity list */}
        <div className="saas-card h-[380px] flex flex-col justify-between">
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight">Recent Activity</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Live platform ledger tracking</p>
          </div>

          <div className="flex-1 my-4 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
            {recentActivityList && recentActivityList.slice(0, 5).map((act, idx) => {
              const IconComponent = act.type === 'topic' ? CheckCircle : act.type === 'subtopic' ? Zap : Clock3;
              const bgClass = act.type === 'topic' 
                ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-100/50 dark:border-green-900/10'
                : act.type === 'subtopic'
                  ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100/50 dark:border-purple-900/10'
                  : 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100/50 dark:border-blue-900/10';
              
              return (
                <div key={idx} className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${bgClass}`}>
                    <IconComponent size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-slate-900 dark:text-white font-bold text-xs truncate">{act?.title || 'Study Session'}</div>
                    <div className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-bold uppercase tracking-wider">{act?.subtitle} • {act?.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Interactive Pomodoro timer widget */}
        <div className="saas-card h-[380px] flex flex-col justify-between relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/10">
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight flex items-center gap-2">
              <Flame size={16} className="text-amber-500 fill-amber-500 animate-pulse" />
              Focus Mode Timer
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Maximize peak study state blocks</p>
          </div>

          <div className="flex flex-col items-center justify-center my-2 relative z-10">
            <div className="text-5xl font-black text-slate-900 dark:text-white font-mono tracking-tight tabular-nums select-none bg-slate-100 dark:bg-slate-900 px-6 py-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] relative overflow-hidden">
              {formatPomoTime()}
              <div className="absolute top-0 right-0 left-0 h-0.5 bg-blue-500 opacity-60"></div>
            </div>
            
            <div className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest mt-2">{pomoMode} Session</div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={handlePomoToggle}
              className={`flex-1 saas-btn-primary py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer ${pomoActive ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' : ''}`}
            >
              {pomoActive ? <Pause size={14} /> : <Play size={14} />}
              <span>{pomoActive ? 'Hold Timer' : 'Initiate Session'}</span>
            </button>
            <button 
              onClick={handlePomoReset}
              className="p-2.5 saas-btn-secondary text-slate-500 dark:text-slate-400 cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Right Column: Upcoming Tasks */}
        <div className="saas-card h-[380px] flex flex-col justify-between">
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight">Upcoming Tasks</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Study roadmap & task vectors</p>
          </div>

          <div className="flex-1 my-4 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
            {upcomingTasksList && upcomingTasksList.slice(0, 5).map((task) => {
              const IconComponent = Calendar;
              const isOverdue = task.daysLeft !== undefined && task.daysLeft < 0;
              
              return (
                <div key={task.id} className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                    isOverdue 
                      ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/10'
                      : 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100/50 dark:border-blue-900/10'
                  }`}>
                    <IconComponent size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-slate-900 dark:text-white font-bold text-xs truncate">{task?.title || 'Upcoming Target'}</div>
                    <div className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-bold uppercase tracking-wider">
                      {task?.subtitle} • {task?.date}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Floating Collapsible AI Chatbot Panel */}
      <div className="fixed bottom-6 right-6 z-50">
        
        {/* Toggle Floating button */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xl cursor-pointer hover:shadow-2xl hover:shadow-blue-500/20 transition-all border border-blue-400/10"
        >
          {chatOpen ? <X size={20} /> : <Sparkles size={20} className="animate-pulse" />}
        </motion.button>

        {/* Collapsible Chat Window Panel */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[500px] saas-card p-0 flex flex-col overflow-hidden shadow-2xl z-50 border border-[var(--border-color)]"
            >
              
              {/* Chat Header */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-sm">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-slate-900 dark:text-white font-bold text-xs">AI Study Companion</h4>
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 leading-none uppercase font-bold tracking-wider">Knows {user?.name?.split(' ')[0] || 'Aarav'}'s study nodes</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                    <Volume2 size={13} />
                  </button>
                  <button onClick={() => setChatOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll bg-slate-50/20 dark:bg-slate-950/10">
                {chatMessages && chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2.5 ${msg?.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      msg?.role === 'user' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-900 border border-[var(--border-color)] text-slate-500 dark:text-slate-400'
                    }`}>
                      {msg?.role === 'user' ? <CheckCircle size={12} /> : <Sparkles size={12} />}
                    </div>
                    <div className={`max-w-[78%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg?.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-[var(--border-color)] rounded-tl-none'
                    }`}>
                      {msg?.content && msg.content.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          {i < msg.content.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {aiTyping && (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-900 border border-[var(--border-color)] flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <Sparkles size={12} />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-900 border border-[var(--border-color)] px-3 py-2 rounded-xl rounded-tl-none">
                      <div className="flex items-center gap-1 py-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions Chips Section */}
              <div className="p-3 border-t border-[var(--border-color)] bg-slate-50/50 dark:bg-slate-900/30 flex gap-1.5 overflow-x-auto whitespace-nowrap chat-scroll select-none">
                {[
                  { label: 'Generate Chemistry Notes', query: 'Can you generate quick notes for Chemistry stoichiometry?' },
                  { label: 'Formulate Study Plan', query: 'Formulate a 4-hour active revision study plan.' },
                  { label: 'Identify My Weak Areas', query: 'Analyze my analytics log and find my weak topics.' }
                ].map((chip, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setChatInput(chip.query);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-[10px] font-semibold border border-[var(--border-color)] transition-colors cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Chat Input form */}
              <div className="p-3 border-t border-[var(--border-color)]">
                <form onSubmit={handleSendChat} className="flex items-center gap-2">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask doubt, generate notes..."
                    disabled={aiTyping}
                    className="flex-1 bg-slate-50 dark:bg-slate-900/60 border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-500/40"
                  />
                  
                  <button type="button" className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                    <Mic size={14} />
                  </button>
                  
                  <button type="submit" disabled={!chatInput.trim() || aiTyping} className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow shadow-blue-500/10 hover:shadow-md transition-all cursor-pointer disabled:opacity-40">
                    <Send size={14} />
                  </button>
                </form>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
