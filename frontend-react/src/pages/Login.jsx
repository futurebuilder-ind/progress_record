import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typedText, setTypedText] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const welcomeText = "Initialize your progress.";

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < welcomeText.length) {
        setTypedText(welcomeText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);
    return () => clearInterval(typingInterval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success('Authentication successful. Welcome back.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col md:flex-row relative overflow-hidden font-['Outfit'] select-none">
      
      {/* Background Soft Gradients (Organic SaaS style) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/5 dark:bg-blue-600/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-400/5 dark:bg-indigo-600/5 blur-[150px] pointer-events-none"></div>

      {/* Left Panel - Branding */}
      <div className="hidden md:flex md:w-1/2 p-16 flex-col justify-between relative z-10 border-r border-[var(--border-color)] bg-slate-50/50 dark:bg-slate-900/10">
        
        {/* Brand Logo & Tagline */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.2)] text-white flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" strokeOpacity="0.3" />
              <path d="M6 10h10" strokeOpacity="0.3" />
              <path d="M8 18l3-3 3 3 4-4" stroke="currentColor" strokeWidth="2.5" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[16px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">Progress Record</span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 leading-none">Built by Avee Ranjan</span>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-100/50 dark:border-blue-900/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider shadow-sm"
          >
            <ShieldCheck size={12} className="animate-pulse" /> Secure Clearance
          </motion.div>
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
            Master your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 dark:from-white dark:via-blue-200 dark:to-indigo-300">future today.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-sm leading-relaxed font-light">
            {typedText}<motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-1 h-4 bg-blue-500 ml-0.5 translate-y-0.5"></motion.span>
          </p>
        </div>

        {/* Verified badge */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.4 }}
          className="flex items-center"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-[var(--border-color)] text-[10px] tracking-widest font-extrabold text-slate-500 dark:text-slate-400 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
            ENGINEERED BY <span className="text-slate-900 dark:text-white font-black">AVEE RANJAN</span>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="md:hidden flex flex-col items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M8 18l3-3 3 3 4-4" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mt-1">Progress Record</span>
          </div>

          <div className="saas-card p-8 sm:p-10 relative overflow-hidden bg-[var(--bg-card)]">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Access Portal</h2>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Verify your credentials to enter the workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="engineer@domain.com"
                  required
                  className="saas-input"
                />
              </div>

              <div className="flex flex-col gap-1.5 relative">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Password</label>
                  <a href="#" className="text-[10px] text-blue-500 hover:text-blue-600 font-bold uppercase tracking-widest">Forgot?</a>
                </div>
                <div className="relative w-full">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="saas-input w-full pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full saas-btn-primary py-3 flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <><span>Authorize Workspace</span> <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center border-t border-[var(--border-color)] pt-5">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">
                No active clearance?{' '}
                <Link to="/signup" className="text-blue-500 hover:text-blue-600 transition-colors font-bold underline underline-offset-4 ml-1">
                  Request access
                </Link>
              </p>
            </div>
          </div>

          {/* Mobile Creator Badge */}
          <div className="md:hidden flex justify-center mt-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-[var(--border-color)] text-[9px] tracking-widest font-extrabold text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ENGINEERED BY <span className="text-slate-700 dark:text-white">AVEE RANJAN</span>
            </div>
          </div>

        </motion.div>
      </div>

    </div>
  );
}
