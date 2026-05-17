import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import API from '../api/axios';
import { TrendingUp, BookOpen, Target, Clock, Trophy, Sparkles, Activity, Users, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } } };

function StatCard({ icon: Icon, label, value, subtitle, accent }) {
  return (
    <motion.div variants={fadeUp}
      className="glass-card rounded-2xl p-5 group cursor-default">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? 'bg-[var(--accent-subtle)]' : 'bg-[var(--surface)]'} border border-[var(--border)]`}>
          <Icon size={16} className={accent ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'} strokeWidth={1.5} />
        </div>
        {subtitle && (
          <span className="text-overline flex items-center gap-1">
            <ArrowUpRight size={10} /> {subtitle}
          </span>
        )}
      </div>
      <div className="stat-number text-2xl text-white mb-1">{value}</div>
      <div className="text-caption">{label}</div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-elevated)] rounded-xl px-4 py-3 border border-[var(--border)] shadow-lg">
      <p className="text-overline mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold text-white">{p.value} <span className="text-caption">{p.name}</span></p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
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
  const goalProgress = analytics?.goals?.avgProgress ?? 0;

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="skeleton h-10 w-64 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="skeleton h-80 rounded-2xl lg:col-span-2"></div>
          <div className="skeleton h-80 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible"
      className="space-y-6 max-w-6xl mx-auto pb-8">
      
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="status-dot"></div>
            <span className="text-overline">System active</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight font-display">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-caption mt-1">Here's your progress overview for today.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
            <Users size={14} className="text-[var(--text-secondary)]" />
            <div>
              <div className="stat-number text-lg text-white leading-none">{activeUsers}</div>
              <div className="text-[10px] text-[var(--text-tertiary)]">Users</div>
            </div>
          </div>
          <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
            <Clock size={14} className="text-[var(--text-secondary)]" />
            <div>
              <div className="stat-number text-lg text-white leading-none">{focusSessions}</div>
              <div className="text-[10px] text-[var(--text-tertiary)]">Sessions</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard icon={TrendingUp} label="Overall Mastery" value={`${mastery}%`} subtitle="Avg" accent />
        <StatCard icon={BookOpen} label="Active Subjects" value={subjectCount} />
        <StatCard icon={Target} label="Tasks Executed" value={totalTasks === 0 ? '0' : `${completedTasks}/${totalTasks}`} subtitle="Progress" />
        <StatCard icon={Trophy} label="Daily Streak" value={`${consistency}d`} subtitle={consistency > 0 ? 'Active' : ''} accent />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Activity */}
        <motion.div variants={fadeUp} className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-white font-semibold text-sm">Weekly Activity</h3>
              <p className="text-caption text-xs mt-0.5">Focus hours per day</p>
            </div>
            <span className="text-overline bg-[var(--surface)] px-2.5 py-1 rounded-md border border-[var(--border)]">7 days</span>
          </div>
          
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHoursV4" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#4B4B55', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4B4B55', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.04)' }} />
                <Area type="monotone" dataKey="hours" name="Hours"
                  stroke="var(--accent)" strokeWidth={1.5} fillOpacity={1} fill="url(#colorHoursV4)"
                  activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--bg-primary)', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Subject Mastery Radar */}
        <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-white font-semibold text-sm">Subject Mastery</h3>
            <p className="text-caption text-xs mt-0.5">Performance overview</p>
          </div>
          
          <div className="flex-1 min-h-[200px] flex items-center justify-center">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.04)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#4B4B55', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Radar name="Mastery" dataKey="mastery" stroke="var(--accent)" strokeWidth={1.5} fill="var(--accent)" fillOpacity={0.08} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <BookOpen size={24} className="text-[var(--text-quaternary)] mx-auto mb-2" />
                <p className="text-caption text-xs">Add subjects to see data</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Consistency', value: `${consistency}d`, pct: Math.min(consistency * 10, 100) },
          { label: 'Task Ratio', value: totalTasks > 0 ? `${Math.round(completedTasks / totalTasks * 100)}%` : '0%', pct: totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0 },
          { label: 'Goal Progress', value: `${goalProgress}%`, pct: goalProgress },
        ].map((item, idx) => (
          <motion.div key={item.label} variants={fadeUp}
            className="glass-card rounded-2xl p-5 group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-caption text-xs">{item.label}</span>
              <Sparkles size={12} className="text-[var(--text-quaternary)] group-hover:text-[var(--accent)] transition-colors" />
            </div>
            <div className="stat-number text-2xl text-white mb-3">{item.value}</div>
            <div className="w-full h-1 bg-[var(--surface)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.pct}%` }}
                transition={{ duration: 1, delay: 0.5 + idx * 0.15, ease: [0.4, 0, 0.2, 1] }}
                className="h-full bg-[var(--accent)] rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.div variants={fadeUp}
        className="pt-6 flex items-center justify-center gap-4 text-[var(--text-quaternary)] text-[10px] tracking-wider uppercase">
        <span>Engineered by Avee Ranjan</span>
        <span className="w-1 h-1 rounded-full bg-[var(--text-quaternary)]"></span>
        <span>v4.0</span>
      </motion.div>
    </motion.div>
  );
}
