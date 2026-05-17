import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import API from '../api/axios';
import { Zap, TrendingUp, BookOpen, Target, Flame, Clock, Trophy, Brain, Sparkles, Activity } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';

const QUOTES = [
  "Initialize sequence. Optimization running.",
  "System resources allocated for maximum output.",
  "Data synthesis complete. Awaiting operator input.",
  "Performance metrics indicate upward trajectory.",
  "Calibrating neural pathways for deep focus.",
];

function StatCard({ icon: Icon, label, value, gradient, delay, trend }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="glass-card rounded-2xl p-6 relative overflow-hidden group">
      {/* Glow orb */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${gradient} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient} shadow-lg shadow-black/20`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20">
            <TrendingUp size={12} /> {trend}
          </div>
        )}
      </div>
      <div className="text-3xl md:text-4xl font-black text-white mb-1 font-orbitron tracking-wider">{value}</div>
      <div className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">{label}</div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-xl px-4 py-3 border border-white/10 shadow-2xl">
      <p className="text-white font-bold text-xs uppercase tracking-widest mb-2 border-b border-white/10 pb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }}></div>
          <p className="text-sm font-mono font-bold" style={{ color: '#fff' }}>{p.value} <span className="text-slate-400 text-xs">{p.name}</span></p>
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

  // Fake heatmap data for cinematic effect
  const activityData = Array.from({ length: 7 }, (_, i) => ({
    name: `D${i+1}`, val: Math.floor(Math.random() * 100)
  }));

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="shimmer-premium w-64 h-64 rounded-full opacity-10"></div>
        <div className="absolute flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          <span className="text-blue-500 font-mono text-xs tracking-widest animate-pulse">LOADING DASHBOARD_</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 relative">
      {/* Header Section */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 relative z-10"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            <Activity size={12} className="animate-pulse" /> Workspace Active
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">{user?.name?.split(' ')[0]}</span>.
          </h1>
          <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">{quote}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="glass-card rounded-2xl px-6 py-4 flex items-center gap-4 border-l-4 border-l-orange-500">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center neon-glow-purple">
              <Flame size={24} className="text-orange-400 animate-pulse" />
            </div>
            <div>
              <div className="text-white font-black text-2xl font-orbitron tracking-widest">{focusSessions}</div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Focus Sessions</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Bento Box Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard icon={Brain} label="Neural Mastery" value={`${mastery}%`} gradient="bg-gradient-to-br from-blue-500 to-cyan-500" delay={0.1} trend="+5%" />
        <StatCard icon={BookOpen} label="Active Subjects" value={subjectCount} gradient="bg-gradient-to-br from-purple-500 to-pink-500" delay={0.2} />
        <StatCard icon={Target} label="Tasks Executed" value={`${completedTasks}/${totalTasks}`} gradient="bg-gradient-to-br from-emerald-500 to-teal-500" delay={0.3} trend="Optimal" />
        <StatCard icon={Trophy} label="System Consistency" value={`${consistency}%`} gradient="bg-gradient-to-br from-amber-500 to-orange-500" delay={0.4} />
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Weekly Focus Chart */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.5 }}
          className="lg:col-span-2 glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]"></div>
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Clock size={18} className="text-blue-400" /> Activity Metrics
              </h3>
              <p className="text-slate-500 text-xs mt-1 font-mono tracking-wider uppercase">Weekly Focus Hours</p>
            </div>
            <div className="px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold font-mono">
              7D_VIEW
            </div>
          </div>
          
          <div className="h-[280px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" dataKey="hours" name="Hours"
                  stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" 
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2, className: 'neon-glow-blue' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Radar Chart */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 0.5 }}
          className="glass-card rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px]"></div>
          <div className="mb-4 relative z-10">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-400" /> Vector Analysis
            </h3>
            <p className="text-slate-500 text-xs mt-1 font-mono tracking-wider uppercase">Subject Mastery</p>
          </div>
          
          <div className="flex-1 min-h-[250px] relative z-10 flex items-center justify-center">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Radar name="Mastery" dataKey="mastery" stroke="#a855f7" strokeWidth={2} fill="#a855f7" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 border border-white/10">
                  <BookOpen size={24} className="text-slate-500" />
                </div>
                <p className="text-slate-500 text-xs font-mono tracking-widest uppercase">No Data Available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Insight Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}
          className="lg:col-span-3 glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden border-t-2 border-t-blue-500/50">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz4KPC9zdmc+')] opacity-50"></div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-4 lg:col-span-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center neon-glow-blue">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">AI Diagnostics</h3>
                  <div className="text-blue-400 text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                    System Online
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-[#0a0f25]/80 border border-white/5 shadow-inner">
                <p className="text-slate-300 text-sm leading-relaxed font-light">
                  {mastery === 0 && totalTasks === 0
                    ? 'Awaiting initial data input. Configure subjects to generate insights.'
                    : mastery >= 70
                    ? `Optimal performance detected. Mastery level ${mastery}% indicates readiness for advanced scenarios.`
                    : `Anomaly detected: ${totalTasks - completedTasks} unresolved tasks. Prioritize weak sectors to elevate mastery from ${mastery}%.`}
                </p>
              </div>
            </div>

            {/* Micro Stats */}
            <div className="md:col-span-8 lg:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Consistency Index', value: `${consistency}%`, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                { label: 'Task Completion', value: totalTasks > 0 ? `${Math.round(completedTasks / totalTasks * 100)}%` : '0%', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                { label: 'Goal Progression', value: analytics?.goals?.avgProgress != null ? `${analytics.goals.avgProgress}%` : '0%', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              ].map((item, idx) => (
                <div key={item.label} className="p-5 rounded-2xl bg-[#0a0f25]/50 border border-white/5 hover:border-white/20 transition-colors flex flex-col justify-center relative overflow-hidden group">
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent`}></div>
                  <div className={`text-3xl font-black font-orbitron mb-2 ${item.color}`}>{item.value}</div>
                  <div className="text-white text-xs font-bold uppercase tracking-widest mb-3">{item.label}</div>
                  
                  {/* Decorative progress bar */}
                  <div className="w-full h-1.5 bg-[#050816] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: item.value }} 
                      transition={{ duration: 1, delay: 0.8 + (idx * 0.2) }}
                      className={`h-full ${item.bg.replace('/10', '')} shadow-[0_0_10px_currentColor]`}
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
        className="mt-8 text-center text-slate-600 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-4">
        <span>v2.4.0</span>
        <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
        <span>Engineered by Avee Ranjan</span>
        <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
        <span>System Nominal</span>
      </motion.div>
    </div>
  );
}
