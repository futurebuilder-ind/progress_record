import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { MessageSquare, Star, Clock, Users, Target, Activity, ShieldCheck, Lock, Trash2, BookOpen, Timer, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

export default function FeedbackDashboard() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  const fetchDashboardData = async (key) => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'x-admin-key': key || adminKey };
      const [fbRes, statsRes] = await Promise.all([
        API.get('/feedback', { headers }),
        API.get('/admin/stats', { headers })
      ]);
      setFeedbacks(fbRes.data.feedbacks || []);
      setStats(statsRes.data);
      setUserList(statsRes.data.userList || []);
      setAuthenticated(true);
      if (key) setAdminKey(key);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Invalid clearance code.');
        setAuthenticated(false);
      } else {
        setError(err.response?.data?.message || 'Connection failed.');
      }
    } finally { setLoading(false); }
  };

  const handleAuth = (e) => {
    e.preventDefault();
    if (!adminKey.trim()) { toast.error('Enter clearance code'); return; }
    fetchDashboardData(adminKey);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await API.delete(`/feedback/${id}`, { headers: { 'x-admin-key': adminKey } });
      setFeedbacks(prev => prev.filter(f => f._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const timeAgo = (d) => {
    if (!d) return 'Never';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (!authenticated) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 text-center max-w-sm w-full">
        <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-5">
          <ShieldCheck size={22} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Admin Access</h2>
        <p className="text-caption text-xs mb-6">Enter your clearance code to continue.</p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-quaternary)]" />
            <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)}
              placeholder="Clearance code" autoFocus className="input-field pl-10" />
          </div>
          {error && <p className="text-xs text-red-400 bg-red-400/5 py-2 px-3 rounded-lg border border-red-400/10">{error}</p>}
          <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
            className="btn-primary w-full py-3">
            {loading ? 'Verifying...' : 'Authenticate'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="space-y-6 max-w-6xl mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-display">Admin Panel</h1>
          <p className="text-caption mt-1">System overview and user management.</p>
        </div>
        <button onClick={() => fetchDashboardData()} disabled={loading}
          className="btn-secondary text-xs">
          <Activity size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: Users, label: 'Users', val: stats.totalUsers },
            { icon: MessageSquare, label: 'Feedback', val: stats.totalFeedback },
            { icon: Activity, label: 'Sessions', val: stats.totalFocusSessions },
            { icon: Target, label: 'Tasks Done', val: stats.totalTasksCompleted },
            { icon: Clock, label: 'Focus Mins', val: stats.totalFocusMinutes },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass-card rounded-xl p-4">
              <s.icon size={14} className="text-[var(--text-tertiary)] mb-2" />
              <div className="stat-number text-xl text-white">{s.val}</div>
              <div className="text-[var(--text-quaternary)] text-[9px] font-medium uppercase tracking-wider mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-xl p-1 border border-[var(--border)]">
        {[
          { key: 'users', label: 'Users', icon: Users },
          { key: 'feedback', label: 'Feedback', icon: MessageSquare },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key ? 'bg-white text-black' : 'text-[var(--text-secondary)] hover:text-white'
            }`}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          <div className="text-overline">{userList.length} registered users</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userList.map((u, i) => (
              <motion.div key={u._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] font-semibold text-xs flex-shrink-0">
                    {u.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{u.name}</p>
                    <p className="text-[var(--text-tertiary)] text-[10px] truncate">{u.email}</p>
                  </div>
                  <span className="text-[9px] font-medium px-2 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider flex-shrink-0">{u.examType}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { icon: BookOpen, val: u.subjects, label: 'Subjects' },
                    { icon: Target, val: `${u.completedTasks}/${u.tasks}`, label: 'Tasks' },
                    { icon: Timer, val: `${u.focusMinutes}m`, label: 'Focus' },
                  ].map(s => (
                    <div key={s.label} className="bg-[var(--bg-tertiary)] rounded-lg p-2.5 text-center border border-[var(--border)]">
                      <s.icon size={10} className="text-[var(--text-tertiary)] mx-auto mb-1" />
                      <div className="stat-number text-xs text-white">{s.val}</div>
                      <div className="text-[7px] text-[var(--text-quaternary)] uppercase tracking-wider mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[var(--text-quaternary)] text-[9px] tracking-wider pt-2 border-t border-[var(--border)]">
                  <span>{u.focusSessions} sessions</span>
                  <span>{timeAgo(u.lastActive)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="space-y-3">
          <div className="text-overline">{feedbacks.length} submissions</div>
          {feedbacks.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <MessageSquare size={24} className="text-[var(--text-quaternary)] mx-auto mb-3" />
              <p className="text-caption text-xs">No feedback received yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence>
                {feedbacks.map((fb, i) => (
                  <motion.div key={fb._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="glass-card rounded-xl p-5 flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-white text-[10px] font-medium">
                            {fb.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-white font-medium text-xs">{fb.name || 'Anonymous'}</p>
                            <p className="text-[var(--text-quaternary)] text-[9px]">{fb.email}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDelete(fb._id)}
                          className="text-[var(--text-quaternary)] hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="flex gap-0.5 mb-3">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={10} className={n <= (fb.rating || 5) ? 'text-white' : 'text-[var(--text-quaternary)]'} fill={n <= (fb.rating || 5) ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                      <p className="text-[var(--text-secondary)] text-xs leading-relaxed mb-4">"{fb.message}"</p>
                    </div>
                    <div className="text-[9px] text-[var(--text-quaternary)] tracking-wider pt-3 border-t border-[var(--border)]">
                      {formatDate(fb.createdAt)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
