import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Brain, ArrowRight, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-[#000000] flex flex-col md:flex-row relative overflow-hidden font-['Space_Grotesk']">
      {/* Background Cinematic Effects */}
      <div className="absolute inset-0 bg-grid-cyber opacity-20 pointer-events-none"></div>
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-white/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen"
      ></motion.div>
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-white/5 rounded-full blur-[150px] pointer-events-none mix-blend-screen"
      ></motion.div>

      {/* Left Panel - Branding & Visuals */}
      <div className="hidden md:flex md:w-1/2 p-12 flex-col justify-between relative z-10 border-r border-white/5 bg-[#000000]/50 backdrop-blur-3xl">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#050505] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <div className="absolute inset-0 cyber-scanline"></div>
            <Brain size={24} className="text-white relative z-10" />
          </div>
          <span className="text-2xl font-black text-white tracking-widest uppercase font-orbitron">Progress<span className="text-slate-500">Record</span></span>
        </motion.div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-semibold uppercase tracking-wider"
          >
            <Sparkles size={14} /> System Online
          </motion.div>
          <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            Master your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-slate-500">future today.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md font-light h-8">
            {typedText}<motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 h-5 bg-white ml-1 translate-y-1"></motion.span>
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-slate-500 text-[10px] font-bold tracking-widest flex items-center gap-2 uppercase"
        >
          <div className="w-8 h-[1px] bg-slate-700"></div>
          ENGINEERED BY <span className="text-white">AVEE RANJAN</span>
        </motion.div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="md:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-[#050505] border border-white/10 flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <span className="text-xl font-black text-white font-orbitron tracking-widest">P<span className="text-slate-500">R</span></span>
          </div>

          <div className="glass-card rounded-3xl p-8 sm:p-10 relative overflow-hidden">
            {/* Top glowing line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Access Portal</h2>
              <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Verify your credentials to enter the workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Identification</label>
                <div className="input-glow-border rounded-xl">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="engineer@domain.com"
                    required
                    className="w-full px-5 py-4 bg-[#050505]/80 border border-white/5 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:bg-[#0a0a0a] transition-all font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Security Key</label>
                  <a href="#" className="text-[10px] text-white hover:text-slate-300 transition-colors uppercase tracking-widest">Forgot?</a>
                </div>
                <div className="input-glow-border rounded-xl relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-5 py-4 bg-[#050505]/80 border border-white/5 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:bg-[#0a0a0a] transition-all font-mono text-sm pr-12"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 btn-neon-solid rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 mt-4 group text-xs uppercase tracking-widest font-bold"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                ) : (
                  <>Authorize <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </motion.button>
            </form>

            <div className="mt-8 text-center border-t border-white/5 pt-6">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                No active clearance?{' '}
                <Link to="/signup" className="text-white hover:text-slate-300 transition-colors underline decoration-white/20 underline-offset-4 ml-1">
                  Request access
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
