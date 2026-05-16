import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { BarChart3, TrendingUp, Clock, Zap, Target, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-2.5 border border-white/10 shadow-xl">
      <p className="text-white font-bold text-sm mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

function KpiCard({ icon: Icon, label, value, color, bg, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`glass rounded-2xl p-5 border border-white/5 bg-gradient-to-br ${bg} cyber-card`}>
      <Icon size={20} className={`${color} mb-3`} />
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-slate-400 text-xs mt-1">{label}</div>
    </motion.div>
  );
}

export default function Analytics() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const { data: res } = await API.get('/analytics');
      setData(res);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to load analytics. Is the server running?';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchAnalytics(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="glass rounded-2xl p-12 text-center border border-red-500/20">
      <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
      <h3 className="text-white font-bold text-lg mb-2">Analytics Unavailable</h3>
      <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">{error}</p>
      <button onClick={() => fetchAnalytics()}
        className="btn-neon px-6 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 mx-auto">
        <RefreshCw size={16} /> Retry
      </button>
    </div>
  );

  const {
    overallMastery = 0, totalTopics = 0, completedTopics = 0,
    totalTasks = 0, completedTasks = 0, totalFocusMinutes = 0,
    totalFocusSessions = 0, todayFocusSessions = 0,
    subjectMastery = [], weeklyData = [], completionTrend = [],
    goals = {}, consistency = 0, productivityScore = 0,
  } = data;

  const kpis = [
    { icon: BarChart3, label: 'Overall Mastery',   value: `${overallMastery}%`, color: 'text-blue-400',   bg: 'from-blue-500/10 to-blue-600/5',   delay: 0.05 },
    { icon: Zap,       label: 'Productivity Score', value: `${productivityScore}%`, color: 'text-yellow-400', bg: 'from-yellow-500/10 to-yellow-600/5', delay: 0.08 },
    { icon: Clock,     label: 'Total Focus Hours',  value: `${Math.round(totalFocusMinutes / 60 * 10) / 10}h`, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-600/5', delay: 0.1 },
    { icon: Target,    label: 'Sessions Today',     value: todayFocusSessions, color: 'text-orange-400', bg: 'from-orange-500/10 to-orange-600/5', delay: 0.15 },
    { icon: BookOpen,  label: 'Topics Done',        value: `${completedTopics}/${totalTopics}`, color: 'text-cyan-400', bg: 'from-cyan-500/10 to-cyan-600/5', delay: 0.2 },
    { icon: TrendingUp, label: 'Consistency',       value: `${consistency}%`, color: 'text-pink-400', bg: 'from-pink-500/10 to-pink-600/5', delay: 0.25 },
  ];

  const hasSubjectData  = subjectMastery.length > 0;
  const hasWeeklyData   = weeklyData.some(d => d.hours > 0);
  const hasTrendData    = completionTrend.some(d => d.topics > 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time insights from your actual study activity</p>
        </div>
        <button onClick={() => fetchAnalytics(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-slate-400 hover:text-white transition-all text-sm font-semibold disabled:opacity-50">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Weekly Focus Hours */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-6 cyber-card">
        <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
          <Clock size={18} className="text-blue-400" /> Weekly Focus Hours
        </h3>
        {hasWeeklyData ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} barSize={32}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="hours" name="Hours" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex flex-col items-center justify-center text-slate-600">
            <Clock size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No focus sessions recorded yet.</p>
            <p className="text-xs mt-1 text-slate-700">Use the Pomodoro timer to track your sessions!</p>
          </div>
        )}
      </motion.div>

      {/* Completion Trend + Subject Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-6 cyber-card">
          <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" /> Topic Completion Trend (7d)
          </h3>
          {hasTrendData ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={completionTrend}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="topics" name="Topics" stroke="#22d3ee" strokeWidth={2} fill="url(#trendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-slate-600">
              <TrendingUp size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Complete topics to see the trend here.</p>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 cyber-card">
          <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
            <BarChart3 size={18} className="text-purple-400" /> Subject Mastery
          </h3>
          {hasSubjectData ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={subjectMastery} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mastery" name="Mastery %" fill="url(#barGrad)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-slate-600">
              <BookOpen size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No subjects with tasks yet.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Radar + Goals Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasSubjectData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="glass rounded-2xl p-6 cyber-card">
            <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" /> Radar Overview
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={subjectMastery}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Radar dataKey="mastery" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {goals.total > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-6 cyber-card">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Target size={18} className="text-purple-400" /> Goals Summary
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div className="glass-light rounded-xl p-4">
                <div className="text-2xl font-black text-white">{goals.total}</div>
                <div className="text-slate-400 text-xs mt-1">Total</div>
              </div>
              <div className="glass-light rounded-xl p-4">
                <div className="text-2xl font-black text-emerald-400">{goals.completed}</div>
                <div className="text-slate-400 text-xs mt-1">Completed</div>
              </div>
              <div className="glass-light rounded-xl p-4">
                <div className="text-2xl font-black text-blue-400">{goals.avgProgress}%</div>
                <div className="text-slate-400 text-xs mt-1">Avg Progress</div>
              </div>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                initial={{ width: 0 }} animate={{ width: `${goals.avgProgress}%` }} transition={{ duration: 1 }} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Strength Heatmap */}
      {hasSubjectData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="glass rounded-2xl p-6 cyber-card">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Zap size={18} className="text-yellow-400" /> Subject Strength Heatmap
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {subjectMastery.map(s => (
              <div key={s.name} className="text-center">
                <div className={`h-3 rounded-full mb-1.5 transition-all ${s.mastery >= 80 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : s.mastery >= 50 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]'}`}
                  style={{ width: `${Math.max(20, s.mastery)}%`, margin: '0 auto' }} />
                <div className="text-xs text-slate-500 truncate mt-1">{s.name}</div>
                <div className={`text-xs font-bold ${s.mastery >= 80 ? 'text-emerald-400' : s.mastery >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{s.mastery}%</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-5 mt-5 text-xs text-slate-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Strong (≥80%)</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Average (50–79%)</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /> Needs Work (&lt;50%)</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
