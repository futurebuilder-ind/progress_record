import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Brain, ArrowRight, UserPlus, Zap } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typedText, setTypedText] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const welcomeText = "Begin your evolution.";

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
      await signup(name, email.trim().toLowerCase(), password);
      toast.success('Clearance granted. Welcome.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] flex flex-col md:flex-row-reverse relative overflow-hidden font-['Space_Grotesk']">
      {/* Background Cinematic Effects */}
      <div className="absolute inset-0 bg-grid-cyber opacity-20 pointer-events-none"></div>
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"
      ></motion.div>
      <motion.div 
        animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"
      ></motion.div>

      {/* Right Panel (now visually on left due to flex-row-reverse) - Branding & Visuals */}
      <div className="hidden md:flex md:w-1/2 p-12 flex-col justify-between relative z-10 border-l border-white/5 bg-[#050816]/50 backdrop-blur-3xl">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center gap-4 self-end"
        >
          <span className="text-2xl font-black text-white tracking-widest uppercase font-orbitron">Progress<span className="text-purple-500">Record</span></span>
          <div className="w-12 h-12 rounded-2xl bg-[#0a0f25] border border-purple-500/30 flex items-center justify-center neon-glow-purple relative overflow-hidden">
            <div className="absolute inset-0 cyber-scanline"></div>
            <Brain size={24} className="text-purple-400 relative z-10" />
          </div>
        </motion.div>

        <div className="space-y-6 text-right">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider ml-auto"
          >
            <Zap size={14} /> New Operator
          </motion.div>
          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            Accelerate <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-purple-400 via-pink-400 to-cyan-400">your potential.</span>
          </h1>
          <p className="text-slate-400 text-lg font-light h-8 ml-auto flex justify-end">
            {typedText}<motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 h-5 bg-purple-500 ml-1 translate-y-1"></motion.span>
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-slate-500 text-sm font-medium tracking-wide flex items-center gap-2 justify-end"
        >
          ENGINEERED BY <span className="text-purple-400/80">AVEE RANJAN</span>
          <div className="w-8 h-[1px] bg-slate-700"></div>
        </motion.div>
      </div>

      {/* Left Panel (now visually on right) - Signup Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="md:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-[#0a0f25] border border-purple-500/30 flex items-center justify-center neon-glow-purple">
              <Brain size={20} className="text-purple-400" />
            </div>
            <span className="text-xl font-black text-white font-orbitron tracking-widest">P<span className="text-purple-500">R</span></span>
          </div>

          <div className="glass-card rounded-3xl p-8 sm:p-10 relative overflow-hidden">
            {/* Top glowing line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Request Access</h2>
              <p className="text-slate-400 text-sm">Register your profile to enter the system.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Operator Alias</label>
                <div className="input-glow-border rounded-xl">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full px-5 py-3.5 bg-[#0a0f25]/50 border border-white/5 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:bg-[#0f1730]/80 transition-all font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Identification</label>
                <div className="input-glow-border rounded-xl">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="engineer@domain.com"
                    required
                    className="w-full px-5 py-3.5 bg-[#0a0f25]/50 border border-white/5 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:bg-[#0f1730]/80 transition-all font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
                <div className="input-glow-border rounded-xl relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-5 py-3.5 bg-[#0a0f25]/50 border border-white/5 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:bg-[#0f1730]/80 transition-all font-mono text-sm pr-12"
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
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-3 disabled:opacity-50 mt-6 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>Initialize <UserPlus size={18} className="group-hover:scale-110 transition-transform" /></>
                )}
              </motion.button>
            </form>

            <div className="mt-8 text-center border-t border-white/5 pt-6">
              <p className="text-slate-500 text-sm">
                Already have clearance?{' '}
                <Link to="/login" className="text-white hover:text-purple-400 font-bold transition-colors underline decoration-white/20 underline-offset-4">
                  Access Portal
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
