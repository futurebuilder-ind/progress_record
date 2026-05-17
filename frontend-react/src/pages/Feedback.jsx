import { motion } from 'framer-motion';
import { useState } from 'react';
import { MessageSquare, Star, Send, CheckCircle, Mail, User, Zap } from 'lucide-react';
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
    if (!message.trim()) { toast.error('Message is required'); return; }
    setLoading(true);
    try {
      await API.post('/feedback', { message: message.trim(), rating });
      setSubmitted(true);
      toast.success('Transmission successful.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transmission failed.');
    } finally { setLoading(false); }
  };

  if (submitted) return (
    <div className="flex items-center justify-center min-h-[70vh] font-['Space_Grotesk']">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center glass-card rounded-3xl p-12 max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none"></div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl relative z-10">
          <CheckCircle size={32} className="text-white"/>
        </motion.div>
        <h2 className="text-2xl font-black text-white mb-2 font-orbitron tracking-widest">TRANSMISSION SENT</h2>
        <p className="text-slate-500 text-xs mb-8 uppercase tracking-widest font-bold">Feedback Registered</p>
        <p className="text-slate-400 text-sm mb-8 font-light">
          Your data has been successfully relayed to the system administrator. We appreciate your contribution to the neural net.
        </p>
        <button onClick={() => { setSubmitted(false); setMessage(''); setRating(5); }}
          className="btn-neon-solid w-full py-4 rounded-xl text-black font-bold text-xs uppercase tracking-widest">
          Initiate New Sequence
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10 font-['Space_Grotesk']">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest mb-3">
          <Zap size={12} className="text-blue-400" /> Open Channel
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">System Feedback</h1>
        <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest font-bold">Relay intelligence to the architect</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none -z-10"></div>
            
            {/* User info pill */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#0a0a0a] border border-white/5 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black font-black text-sm relative overflow-hidden shadow-lg">
                <span className="relative z-10">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-none">{user?.name}</div>
                <div className="text-slate-500 text-[10px] mt-1 font-mono tracking-widest uppercase">{user?.email}</div>
              </div>
              <div className="ml-auto text-[10px] text-white font-bold px-3 py-1.5 rounded-lg bg-white/10 border border-white/5 uppercase tracking-widest">
                {user?.examType}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              {/* Rating */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">
                  Experience Rating //
                </label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <motion.button key={n} type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setRating(n)}
                      className={`flex-1 py-4 rounded-2xl border transition-all flex justify-center items-center ${
                        n <= rating
                          ? 'border-white bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                          : 'border-white/10 bg-[#0a0a0a] text-slate-600 hover:border-white/30'
                      }`}>
                      <Star size={18} fill={n <= rating ? 'currentColor' : 'none'}/>
                    </motion.button>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-slate-600 text-[10px] font-mono tracking-widest uppercase">Select Parameter</p>
                  <p className="text-white font-bold text-xs uppercase tracking-widest">
                    {rating === 1 ? 'Critical Failure' : rating === 2 ? 'Suboptimal' : rating === 3 ? 'Acceptable' : rating === 4 ? 'Optimal' : 'Flawless Execution'}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">
                  Transmission Log //
                </label>
                <div className="input-glow-border rounded-2xl">
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6}
                    placeholder="Log your experience, report anomalies, or suggest optimizations..."
                    className="w-full px-5 py-4 bg-[#0a0a0a] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:bg-[#0f0f0f] transition-all resize-none text-sm leading-relaxed font-light"/>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-slate-600 text-[10px] font-mono tracking-widest uppercase">{message.length} bytes</p>
                </div>
              </div>

              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-4 btn-neon-solid rounded-xl text-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50">
                {loading
                  ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"/>
                  : <><Send size={16}/> Initialize Upload</>
                }
              </motion.button>
            </form>
          </motion.div>
        </div>

        <div className="space-y-6">
          {/* Developer Contact Card */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="glass-card rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-colors"></div>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
              <User size={14} className="text-purple-400" /> Architect Profile
            </h3>
            
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center shadow-2xl relative mb-4">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')]"></div>
                <span className="text-white font-orbitron font-black text-2xl relative z-10">A</span>
              </div>
              <p className="text-white font-black text-lg tracking-tight">Avee Ranjan</p>
              <p className="text-slate-500 text-[10px] font-mono tracking-widest uppercase mt-1">Lead Developer</p>
            </div>

            <a href="mailto:aveenranjan984@gmail.com"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
              <Mail size={14} /> Contact Direct
            </a>
          </motion.div>

          {/* Info card */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            className="glass-card rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center flex-shrink-0">
                <MessageSquare size={16} className="text-slate-400"/>
              </div>
              <div>
                <p className="text-white font-bold text-sm mb-1 tracking-tight">Secure Line</p>
                <p className="text-slate-500 text-xs leading-relaxed font-light">
                  Transmissions are end-to-end encrypted and routed directly to the architect. System anomalies will be patched in forthcoming updates.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
