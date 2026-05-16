import { motion } from 'framer-motion';
import { useState } from 'react';
import { MessageSquare, Star, Send, CheckCircle, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import API from '../api/axios';

export default function Feedback() {
  const { user } = useAuth();
  const [message, setMessage]   = useState('');
  const [rating,  setRating]    = useState(5);
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { toast.error('Please write a message'); return; }
    setLoading(true);
    try {
      await API.post('/feedback', { message: message.trim(), rating });
      setSubmitted(true);
      toast.success('Feedback submitted! Thank you 🙏');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally { setLoading(false); }
  };

  if (submitted) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center glass rounded-3xl p-12 cyber-card max-w-md w-full">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
          <CheckCircle size={40} className="text-white"/>
        </motion.div>
        <h2 className="text-2xl font-black text-white mb-3">Feedback Received!</h2>
        <p className="text-slate-400 text-sm mb-6">
          Thank you for helping improve Progress Record. Your feedback has been saved and will be reviewed by the developer.
        </p>
        <button onClick={() => { setSubmitted(false); setMessage(''); setRating(5); }}
          className="btn-neon px-6 py-2.5 rounded-xl text-white font-bold">
          Submit Another
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Feedback</h1>
        <p className="text-slate-400 text-sm mt-1">Help improve Progress Record — share your thoughts</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 cyber-card">
        {/* User info pill */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{user?.name}</div>
            <div className="text-slate-400 text-xs">{user?.email}</div>
          </div>
          <div className="ml-auto text-xs text-blue-400 font-semibold px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            {user?.examType}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
              How would you rate Progress Record?
            </label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <motion.button key={n} type="button" whileTap={{ scale: 0.85 }}
                  onClick={() => setRating(n)}
                  className={`flex-1 py-3 rounded-xl border transition-all font-bold text-lg ${
                    n <= rating
                      ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                      : 'border-white/10 bg-white/5 text-slate-600 hover:border-white/20'
                  }`}>
                  <Star size={20} className="mx-auto" fill={n <= rating ? 'currentColor' : 'none'}/>
                </motion.button>
              ))}
            </div>
            <p className="text-center text-slate-500 text-xs mt-2">
              {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Great' : 'Excellent!'} — {rating}/5
            </p>
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Your Message <span className="normal-case text-slate-600">(required)</span>
            </label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
              placeholder="Share your experience, report a bug, or suggest a feature..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all resize-none text-sm leading-relaxed"/>
            <p className="text-slate-600 text-xs mt-1.5 text-right">{message.length} characters</p>
          </div>

          <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 btn-neon rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              : <><Send size={17}/> Submit Feedback</>
            }
          </motion.button>
        </form>
      </motion.div>

      {/* Developer Contact Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass rounded-2xl p-6 border border-white/5 cyber-card">
        <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
          <User size={16} className="text-purple-400" /> Developer Contact
        </h3>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/20">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
            <span className="text-white font-black text-lg">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Avee Ranjan</p>
            <p className="text-slate-500 text-xs mt-0.5">Lead Developer · Progress Record</p>
          </div>
          <a href="mailto:aveenranjan984@gmail.com"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-all flex-shrink-0">
            <Mail size={14} /> Email
          </a>
        </div>
        <p className="text-slate-500 text-xs mt-3 ml-1">
          📧 <a href="mailto:aveenranjan984@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">aveenranjan984@gmail.com</a>
        </p>
      </motion.div>

      {/* Info card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass rounded-2xl p-5 border border-white/5">
        <div className="flex items-start gap-3">
          <MessageSquare size={18} className="text-blue-400 mt-0.5 flex-shrink-0"/>
          <div>
            <p className="text-white font-semibold text-sm mb-1">Your feedback matters</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              All feedback is reviewed by the developer, <span className="text-blue-400 font-semibold">Avee Ranjan</span>, and stored securely. 
              Bug reports, feature requests, and general comments all help make this app better.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
