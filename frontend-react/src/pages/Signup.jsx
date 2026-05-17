import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

const EXAMS = ['UPSC', 'GATE', 'CAT', 'JEE', 'NEET', 'SSC', 'Banking', 'Other'];

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [examType, setExamType] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await signup(name.trim(), email.trim().toLowerCase(), password, examType || 'Other');
      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex relative overflow-hidden">
      <div className="ambient-bg"></div>
      <div className="noise-overlay"></div>

      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 p-16 flex-col justify-between relative z-10 border-r border-[var(--border)]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
              <span className="text-black font-bold text-sm font-display">P</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">Progress Record</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
          className="space-y-6">
          <h1 className="text-5xl font-bold text-white leading-[1.1] tracking-tight font-display">
            Start building<br />
            <span className="text-[var(--text-secondary)]">your future today.</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-base max-w-md leading-relaxed">
            Join thousands of students who are tracking their progress, building consistency, and achieving their goals.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-[var(--text-quaternary)] text-xs tracking-wider uppercase">
          Engineered by Avee Ranjan
        </motion.div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-black font-bold text-sm font-display">P</span>
            </div>
            <span className="text-white font-semibold">Progress Record</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Create account</h2>
            <p className="text-caption mt-1">Get started with Progress Record.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-overline ml-0.5">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name" required className="input-field" />
            </div>

            <div className="space-y-1.5">
              <label className="text-overline ml-0.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required className="input-field" />
            </div>

            <div className="space-y-1.5">
              <label className="text-overline ml-0.5">Exam Preparation</label>
              <div className="grid grid-cols-4 gap-2">
                {EXAMS.map(ex => (
                  <button key={ex} type="button" onClick={() => setExamType(ex)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all border ${
                      examType === ex
                        ? 'bg-white text-black border-white'
                        : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-hover)]'
                    }`}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-overline ml-0.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required className="input-field pr-11" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-white transition-colors p-1">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="btn-primary w-full py-3 mt-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>Create account <ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-caption text-xs">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:text-[var(--accent)] transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
