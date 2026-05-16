import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import API from '../api/axios';
import { Zap, TrendingUp, BookOpen, Target, Flame, Clock, Trophy, Brain } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const QUOTES = [
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Dream it. Wish it. Do it.",
];

function StatCard({ icon: Icon, label, value, gradient, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="glass rounded-2xl p-5 cyber-card hover:border-blue-500/30 transition-all hover:-translate-y-1">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${gradient}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-slate-400 text-sm font-medium">{label}</div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-2 border border-white/10">
      <p className="text-white font-bold text-sm">{label}</p>
      {payload.map(p => <p key={p.name} className="text-xs" style={{ color: p.color }}>{p.value}</p>)}
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{user?.name?.split(' ')[0]}</span>! 🚀
          </h1>
          <p className="text-slate-400 italic text-sm max-w-lg">"{quote}"</p>
        </div>
        <div className="flex items-center gap-3 glass rounded-2xl px-5 py-3 border border-orange-500/20 flex-shrink-0">
          <Flame size={24} className="text-orange-400 animate-pulse" />
          <div>
            <div className="text-white font-bold text-xl">{focusSessions}</div>
            <div className="text-slate-400 text-xs">Focus Sessions Total</div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Brain} label="Overall Mastery" value={`${mastery}%`} gradient="bg-gradient-to-br from-blue-500 to-blue-700" delay={0.1} />
        <StatCard icon={BookOpen} label="Total Subjects" value={subjectCount} gradient="bg-gradient-to-br from-purple-500 to-purple-700" delay={0.15} />
        <StatCard icon={Target} label="Tasks Done" value={`${completedTasks}/${totalTasks}`} gradient="bg-gradient-to-br from-emerald-500 to-emerald-700" delay={0.2} />
        <StatCard icon={Trophy} label="Consistency" value={`${consistency}%`} gradient="bg-gradient-to-br from-amber-500 to-orange-600" delay={0.25} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 cyber-card">
          <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
            <Clock size={18} className="text-cyan-400" /> Weekly Focus Hours
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} fill="url(#hoursGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-6 cyber-card">
          <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-400" /> Subject Mastery
          </h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Radar dataKey="mastery" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-slate-600">
              <BookOpen size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Add subjects & complete tasks to see the radar chart.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* AI Analysis */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6 cyber-card">
        <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
          <Zap size={18} className="text-yellow-400" /> AI Performance Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Study Consistency', value: `${consistency}%`, color: 'from-blue-500 to-cyan-500', desc: consistency > 70 ? 'Excellent! Keep it up!' : consistency > 40 ? 'Good – push a bit harder!' : 'Try to study more regularly.' },
            { label: 'Task Completion', value: totalTasks > 0 ? `${Math.round(completedTasks / totalTasks * 100)}%` : 'N/A', color: 'from-purple-500 to-pink-500', desc: 'Based on your subject tasks' },
            { label: 'Goal Progress', value: analytics?.goals?.avgProgress != null ? `${analytics.goals.avgProgress}%` : 'N/A', color: 'from-emerald-500 to-teal-500', desc: 'Average across all goals' },
          ].map(item => (
            <div key={item.label} className="glass-light rounded-xl p-4 border border-white/5">
              <div className={`text-2xl font-black bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-1`}>{item.value}</div>
              <div className="text-white font-semibold text-sm mb-1">{item.label}</div>
              <div className="text-slate-500 text-xs">{item.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-slate-300 text-sm">
            <span className="text-blue-400 font-bold">🤖 AI Insight:</span>{' '}
            {mastery === 0 && totalTasks === 0
              ? 'Start by adding subjects and tasks in the Subjects section. Your personalized insights will appear here!'
              : mastery >= 70
              ? `You're doing great! Overall mastery is at ${mastery}%. Keep completing tasks to reach 100%!`
              : `You have ${totalTasks - completedTasks} tasks remaining. Focus on your weakest subjects first to boost your overall mastery from ${mastery}%.`}
          </p>
        </div>
      </motion.div>
      {/* Developer Credit */}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="text-center text-slate-700 text-xs pt-4 border-t border-white/5">
        Developed by <span className="text-blue-600/60 font-semibold">Avee Ranjan</span>
      </motion.p>
    </div>
  );
}
