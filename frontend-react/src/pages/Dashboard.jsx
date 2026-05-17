import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import API from '../api/axios';
import { Zap, TrendingUp, BookOpen, Target, Flame, Clock, Trophy, Brain, Sparkles, Activity, Users } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const QUOTES = [
  "Initialize sequence. Optimization running.",
  "System resources allocated for maximum output.",
  "Data synthesis complete. Awaiting operator input.",
  "Performance metrics indicate upward trajectory.",
  "Calibrating neural pathways for deep focus.",
];

function StatCard({ icon: Icon, label, value, delay, trend }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="glass-card rounded-2xl p-6 relative overflow-hidden group">
      {/* Subtle glow orb */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/5 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-[#050505] border border-white/10 shadow-lg shadow-black`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded-md border border-white/10 tracking-widest uppercase">
            <TrendingUp size={10} /> {trend}
          </div>
        )}
      </div>
      <div className="text-3xl md:text-4xl font-black text-white mb-2 font-orbitron tracking-wider">{value}</div>
      <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{label}</div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-xl px-4 py-3 border border-white/10 shadow-2xl">
      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2 border-b border-white/5 pb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white"></div>
          <p className="text-sm font-mono font-bold text-white">{p.value} <span className="text-slate-500 text-[10px] uppercase tracking-widest">{p.name}</span></p>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const { data } = await API.get('/analytics');
      setAnalytics(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const mastery = analytics?.overallMastery ?? 0;
  const subjectCount = analytics?.subjectMastery?.length ?? 0;
  const completedTasks = analytics?.completedTasks ?? 0;
  const totalTasks = analytics?.totalTasks ?? 0;
  const weeklyData = analytics?.weeklyData ?? [
    { day: 'Mon', hours: 0 }, { day: 'Tue', hours: 0 }, { day: 'Wed', hours: 0 },
    { day: 'Thu', hours: 0 }, { day: 'Fri', hours: 0 }, { day: 'Sat', hours: 0 }, { day: 'Sun', hours: 0 },
  ];
  const radarData = analytics?.subjectMastery?.slice(0, 6).map(s => ({ subject: s.name.substring(0, 8), mastery: s.mastery })) ?? [];
  const consistency = analytics?.consistency ?? 0;
  const focusSessions = analytics?.totalFocusSessions ?? 0;
  const activeUsers = analytics?.totalActiveUsers ?? 0;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center font-['Space_Grotesk']">
        <div className="shimmer-premium w-64 h-64 rounded-full opacity-5"></div>
        <div className="absolute flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-t-2 border-white rounded-full animate-spin"></div>
          <span className="text-white font-mono text-xs tracking-widest uppercase animate-pulse">Initializing Interface_</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 relative font-['Space_Grotesk']">
      {/* Header Section */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 relative z-10"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest mb-2">
            <Activity size={12} className="animate-pulse text-blue-400" /> System Online
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Welcome, {user?.name?.split(' ')[0]}.
          </h1>
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">{quote}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="glass-card rounded-2xl px-6 py-4 flex items-center gap-4 border-l-2 border-l-white">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <div className="text-white font-black text-2xl font-orbitron tracking-widest leading-none">{activeUsers}</div>
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Active Users</div>
            </div>
          </div>
          <div className="glass-card rounded-2xl px-6 py-4 flex items-center gap-4 border-l-2 border-l-white">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Flame size={24} className="text-white animate-pulse" />
            </div>
            <div>
              <div className="text-white font-black text-2xl font-orbitron tracking-widest leading-none">{focusSessions}</div>
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Focus Sessions</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Pure Black Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard icon={Brain} label="Neural Mastery" value={`${mastery}%`} delay={0.1} trend="Stable" />
        <StatCard icon={BookOpen} label="Active Subjects" value={subjectCount} delay={0.2} />
        <StatCard icon={Target} label="Tasks Executed" value={totalTasks === 0 ? '0' : `${completedTasks}/${totalTasks}`} delay={0.3} trend="Optimal" />
        <StatCard icon={Trophy} label="Daily Streak" value={`${consistency} D`} delay={0.4} trend={consistency > 0 ? "Active" : ""} />
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Weekly Focus Chart */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.5 }}
          className="lg:col-span-2 glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Clock size={18} className="text-slate-400" /> Activity Matrix
              </h3>
              <p className="text-slate-500 text-[10px] mt-1 font-mono tracking-widest uppercase">Weekly Focus Hours</p>
            </div>
            <div className="px-3 py-1 rounded-md bg-[#0a0a0a] border border-white/10 text-slate-300 text-[10px] font-bold font-mono tracking-widest uppercase">
              7D_VIEW
            </div>
          </div>
          
          <div className="h-[280px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" dataKey="hours" name="Hours"
                  stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" 
                  activeDot={{ r: 5, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Radar Chart */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 0.5 }}
          className="glass-card rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="mb-4 relative z-10">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <TrendingUp size={18} className="text-slate-400" /> Vector Analysis
            </h3>
            <p className="text-slate-500 text-[10px] mt-1 font-mono tracking-widest uppercase">Subject Mastery Overlay</p>
          </div>
          
          <div className="flex-1 min-h-[250px] relative z-10 flex items-center justify-center">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Radar name="Mastery" dataKey="mastery" stroke="#ffffff" strokeWidth={1} fill="#ffffff" fillOpacity={0.1} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] flex items-center justify-center mx-auto mb-3 border border-white/5">
                  <BookOpen size={20} className="text-slate-600" />
                </div>
                <p className="text-slate-500 text-[10px] font-mono tracking-widest uppercase">Insufficient Data</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Insight Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}
          className="lg:col-span-3 glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden border-t border-t-white/10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz4KPC9zdmc+')] opacity-20 pointer-events-none"></div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-4 lg:col-span-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg tracking-tight">Diagnostics</h3>
                  <div className="text-slate-500 text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    Engine Active
                  </div>
                </div>
              </div>
              
              <div className="p-5 rounded-2xl bg-[#050505] border border-white/5 shadow-inner">
                <p className="text-slate-400 text-sm leading-relaxed font-light">
                  {mastery === 0 && totalTasks === 0
                    ? 'Awaiting initial data injection. Configure parameters to begin analysis.'
                    : mastery >= 70
                    ? `Optimal output achieved. Mastery parameter at ${mastery}%. Maintain current trajectory.`
                    : `Anomaly detected: ${totalTasks - completedTasks} unresolved sequences. Recalibrate focus to elevate mastery.`}
                </p>
              </div>
            </div>

            {/* Micro Stats */}
            <div className="md:col-span-8 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Consistency', value: `${consistency} D` },
                { label: 'Task Ratio', value: totalTasks > 0 ? `${Math.round(completedTasks / totalTasks * 100)}%` : '0%' },
                { label: 'Goal Progress', value: analytics?.goals?.avgProgress != null ? `${analytics.goals.avgProgress}%` : '0%' },
              ].map((item, idx) => (
                <div key={item.label} className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-colors flex flex-col justify-center relative overflow-hidden group">
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent pointer-events-none`}></div>
                  <div className={`text-4xl font-black font-orbitron mb-2 text-white`}>{item.value}</div>
                  <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">{item.label}</div>
                  
                  {/* Decorative minimalist progress bar */}
                  <div className="w-full h-[2px] bg-[#000000] overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: item.value.replace(/[^0-9.]/g, '') + '%' }} 
                      transition={{ duration: 1, delay: 0.8 + (idx * 0.2) }}
                      className="h-full bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Footer Branding */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="pt-8 text-center text-slate-600 text-[10px] font-mono tracking-widest flex items-center justify-center gap-4 uppercase">
        <span>ENGINEERED BY AVEE RANJAN</span>
        <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
        <span>v3.0.0 Developer Build</span>
        <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
        <span>System Nominal</span>
      </motion.div>
    </div>
  );
}
