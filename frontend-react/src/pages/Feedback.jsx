import { motion } from 'framer-motion';
import { useState } from 'react';
import { Star, Send, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import API from '../api/axios';

export default function Feedback() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { toast.error('Please enter your feedback'); return; }
    setLoading(true);
    try {
      await API.post('/feedback', { message: message.trim(), rating });
      setSubmitted(true);
      toast.success('Feedback submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  if (submitted) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={28} className="text-[var(--success)]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Thank you</h2>
        <p className="text-caption mb-8">Your feedback has been received and will be reviewed.</p>
        <button onClick={() => { setSubmitted(false); setMessage(''); setRating(5); }}
          className="btn-secondary">
          Submit another <ArrowRight size={14} />
        </button>
      </motion.div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8 pb-10">
      
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight font-display">Feedback</h1>
        <p className="text-caption mt-1">Help us improve your experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="glass-card rounded-2xl p-6 space-y-6">
            {/* User */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)]">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] font-semibold text-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-white text-sm font-medium">{user?.name}</div>
                <div className="text-[var(--text-tertiary)] text-[10px]">{user?.email}</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="text-overline mb-3 block">Rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <motion.button key={n} type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setRating(n)}
                      className={`flex-1 py-3 rounded-xl border transition-all flex justify-center ${
                        n <= rating
                          ? 'border-white bg-white text-black'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-quaternary)] hover:border-[var(--border-hover)]'
                      }`}>
                      <Star size={16} fill={n <= rating ? 'currentColor' : 'none'} />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-overline mb-3 block">Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
                  placeholder="Share your thoughts, suggestions, or report issues..."
                  className="input-field resize-none leading-relaxed" />
                <div className="flex justify-end mt-1.5">
                  <span className="text-[var(--text-quaternary)] text-[10px]">{message.length} characters</span>
                </div>
              </div>

              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="btn-primary w-full py-3">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                ) : (
                  <><Send size={14} /> Submit Feedback</>
                )}
              </motion.button>
            </form>
          </div>
        </div>

        {/* Side */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Developer</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black font-bold text-sm">A</div>
              <div>
                <p className="text-white font-medium text-sm">Avee Ranjan</p>
                <p className="text-[var(--text-tertiary)] text-[10px]">Lead Engineer</p>
              </div>
            </div>
            <a href="mailto:aveenranjan984@gmail.com"
              className="btn-secondary w-full text-xs py-2.5">
              Contact
            </a>
          </div>
          
          <div className="glass-card rounded-2xl p-5">
            <p className="text-caption text-xs leading-relaxed">
              All feedback is reviewed personally and used to improve the platform. Thank you for your input.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
