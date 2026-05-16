import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { MessageSquare, Star, Clock, User, RefreshCw, AlertCircle, ShieldCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const ADMIN_KEY = 'avee_admin_2026';

export default function FeedbackDashboard() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const fetchFeedbacks = async (key) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.get('/feedback', {
        headers: { 'x-admin-key': key || adminKey }
      });
      setFeedbacks(data.feedbacks || []);
      setAuthenticated(true);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Invalid admin key');
        setAuthenticated(false);
      } else {
        setError(err.response?.data?.message || 'Failed to load feedback');
      }
    } finally { setLoading(false); }
  };

  const handleAuth = (e) => {
    e.preventDefault();
    if (!adminKey.trim()) { toast.error('Enter admin key'); return; }
    fetchFeedbacks(adminKey);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (!authenticated) return (
    <div className="max-w-md mx-auto mt-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 cyber-card text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-500/20">
          <ShieldCheck size={28} className="text-white" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Admin Access</h2>
        <p className="text-slate-400 text-sm mb-6">Enter the admin key to view submitted feedback</p>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)}
              placeholder="Admin Key" autoFocus
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 btn-neon rounded-xl text-white font-bold disabled:opacity-60">
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-white">Feedback Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">{feedbacks.length} submission{feedbacks.length !== 1 ? 's' : ''} received</p>
        </div>
        <button onClick={() => fetchFeedbacks()} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-slate-400 hover:text-white transition-all text-sm font-semibold disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {feedbacks.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-white/5">
          <MessageSquare size={48} className="text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">No feedback yet</h3>
          <p className="text-slate-500 text-sm">Submissions will appear here once users send feedback.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((fb, i) => (
            <motion.div key={fb._id || i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass rounded-2xl p-5 border border-white/5 cyber-card">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {fb.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{fb.name || 'Anonymous'}</p>
                    <p className="text-slate-500 text-xs truncate">{fb.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={14}
                        className={n <= (fb.rating || 5) ? 'text-yellow-400' : 'text-slate-700'}
                        fill={n <= (fb.rating || 5) ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <Clock size={11} /> {formatDate(fb.createdAt)}
                  </span>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pl-13">{fb.message}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
