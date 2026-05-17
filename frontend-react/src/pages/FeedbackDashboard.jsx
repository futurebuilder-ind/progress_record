import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { MessageSquare, Star, Clock, Users, Target, Activity, ShieldCheck, Lock, Trash2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

export default function FeedbackDashboard() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

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
      setAuthenticated(true);
      if (key) setAdminKey(key);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Invalid admin clearance code.');
        setAuthenticated(false);
      } else {
        setError(err.response?.data?.message || 'Failed to initialize system data.');
      }
    } finally { setLoading(false); }
  };

  const handleAuth = (e) => {
    e.preventDefault();
    if (!adminKey.trim()) { toast.error('Enter clearance code'); return; }
    fetchDashboardData(adminKey);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eradicate this feedback entry?')) return;
    try {
      await API.delete(`/feedback/${id}`, { headers: { 'x-admin-key': adminKey } });
      setFeedbacks(prev => prev.filter(f => f._id !== id));
      toast.success('Entry eradicated.');
    } catch (err) {
      toast.error('Failed to eradicate entry.');
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  };

  if (!authenticated) return (
    <div className="min-h-[80vh] flex items-center justify-center font-['Space_Grotesk']">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-10 text-center max-w-md w-full relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/20 rounded-full blur-[60px]"></div>
        
        <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-xl relative z-10">
          <ShieldCheck size={28} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Admin Override</h2>
        <p className="text-slate-500 text-xs mb-8 uppercase tracking-widest font-bold">Authentication Required</p>
        
        <form onSubmit={handleAuth} className="space-y-6 relative z-10">
          <div className="input-glow-border rounded-xl">
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)}
                placeholder="Access Code (e.g. avee123@)" autoFocus
                className="w-full pl-11 pr-4 py-4 bg-[#050505]/80 border border-white/5 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:bg-[#0a0a0a] transition-all font-mono text-sm" />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs font-bold bg-red-400/10 py-2 rounded-lg border border-red-400/20">{error}</p>}
          <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-4 btn-neon-solid rounded-xl text-black font-bold text-sm tracking-widest uppercase disabled:opacity-50">
            {loading ? 'Verifying...' : 'Initialize'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 font-['Space_Grotesk']">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest mb-3">
            <Zap size={12} className="text-purple-400" /> Superuser Access Granted
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">System Control</h1>
        </div>
        <button onClick={() => fetchDashboardData()} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50">
          <Activity size={14} className={loading ? 'animate-spin' : ''} />
          Sync Data
        </button>
      </div>

      {/* Global Stats - Bento Box */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total Operators', val: stats.totalUsers },
            { icon: Activity, label: 'Focus Sessions', val: stats.totalFocusSessions },
            { icon: Target, label: 'Tasks Executed', val: stats.totalTasksCompleted },
            { icon: Clock, label: 'Focus Minutes', val: stats.totalFocusMinutes },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
              <s.icon size={20} className="text-slate-400 mb-4" />
              <div className="text-3xl font-black text-white mb-1 font-orbitron">{s.val}</div>
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Feedback Feed */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-4">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-4">
          <MessageSquare size={18} /> User Transmissions ({feedbacks.length})
        </h2>

        {feedbacks.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center border border-white/5 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <MessageSquare size={24} className="text-slate-600" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Silence.</h3>
            <p className="text-slate-600 text-xs font-mono uppercase tracking-widest">No transmissions detected.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {feedbacks.map((fb, i) => (
                <motion.div key={fb._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-2xl p-6 flex flex-col justify-between group">
                  
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center text-white font-bold text-xs">
                          {fb.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm leading-none">{fb.name || 'Anonymous'}</p>
                          <p className="text-slate-500 text-[10px] mt-1 font-mono tracking-widest">{fb.email}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(fb._id)} className="text-slate-600 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex gap-1 mb-4 bg-white/5 w-fit px-2 py-1 rounded-md border border-white/5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={12} className={n <= (fb.rating || 5) ? 'text-white' : 'text-slate-700'} fill={n <= (fb.rating || 5) ? 'currentColor' : 'none'} />
                      ))}
                    </div>

                    <p className="text-slate-300 text-sm leading-relaxed mb-6 font-light">"{fb.message}"</p>
                  </div>

                  <div className="text-[10px] text-slate-600 font-mono tracking-widest uppercase border-t border-white/5 pt-4">
                    {formatDate(fb.createdAt)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
