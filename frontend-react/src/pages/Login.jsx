import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import API from '../api/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typedText, setTypedText] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Reset Password states
  const [forgotMode, setForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState('request'); // 'request' or 'verify'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

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

  // OTP Resend Timer
  useEffect(() => {
    let timer = null;
    if (forgotMode && resetStep === 'verify' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [forgotMode, resetStep, resendTimer]);

  const handleOtpChange = (val, idx) => {
    if (val && isNaN(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);

    if (val !== '' && idx < 5) {
      const nextInput = document.getElementById(`otp-${idx + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && otp[idx] === '' && idx > 0) {
      const prevInput = document.getElementById(`otp-${idx - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleRequestReset = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) { toast.error('Gmail address required.'); return; }
    if (!email.trim().toLowerCase().endsWith('@gmail.com')) {
      toast.error('Password reset is only supported for legitimate Gmail (@gmail.com) addresses.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/forgot-request', { email: email.trim().toLowerCase() });
      setDevMode(data.devMode);
      setResetStep('verify');
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      toast.success('Verification code requested. Check your Gmail.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReset = async (e) => {
    e.preventDefault();
    const codeStr = otp.join('');
    if (codeStr.length < 6) { toast.error('Please enter the full 6-digit code.'); return; }
    if (!newPassword || newPassword.length < 6) { toast.error('New password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await API.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        code: codeStr,
        newPassword
      });
      toast.success('Password updated successfully. Logging in...');
      
      // Auto login direct UX
      await login(email.trim().toLowerCase(), newPassword);
      toast.success('Clearance granted. Welcome back.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Incorrect code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success('Authentication successful. Welcome back.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed. Access denied.';
      if (msg.toLowerCase().includes('password')) {
        toast((t) => (
          <div className="flex flex-col gap-1.5 text-xs select-none">
            <span className="font-bold text-red-500 flex items-center gap-1">❌ Authentication Failed</span>
            <span className="text-slate-400">Incorrect password. Would you like to reset it via Gmail OTP?</span>
            <button 
              onClick={() => {
                toast.dismiss(t.id);
                setForgotMode(true);
                setResetStep('request');
              }}
              className="text-left text-blue-500 font-bold hover:underline cursor-pointer uppercase tracking-wider text-[10px] mt-1 bg-transparent border-0"
            >
              Reset Credentials via Gmail OTP
            </button>
          </div>
        ), { duration: 7000 });
      } else {
        toast.error(msg);
      }
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
            
            {!forgotMode ? (
              <>
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
                      <button 
                        type="button" 
                        onClick={() => {
                          setForgotMode(true);
                          setResetStep('request');
                        }} 
                        className="text-[10px] text-blue-500 hover:text-blue-600 font-bold uppercase tracking-widest bg-transparent border-0 cursor-pointer"
                      >
                        Forgot?
                      </button>
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
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-0">
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
              </>
            ) : (
              <>
                {resetStep === 'request' ? (
                  <>
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <button 
                          onClick={() => setForgotMode(false)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-0"
                        >
                          <ArrowLeft size={16} />
                        </button>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Reset Mainframe Key</h2>
                      </div>
                      <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Provide your registered Gmail to request a temporary session override key.</p>
                    </div>

                    <form onSubmit={handleRequestReset} className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Gmail Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="operator@gmail.com"
                          required
                          className="saas-input"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full saas-btn-primary py-3 flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <><span>Request Verification Code</span> <ArrowRight size={15} /></>
                        )}
                      </button>
                    </form>

                    <button 
                      onClick={() => setForgotMode(false)}
                      className="w-full mt-4 text-center text-slate-400 dark:text-slate-500 text-xs hover:text-blue-500 dark:hover:text-blue-400 font-medium cursor-pointer transition-colors bg-transparent border-0"
                    >
                      Return to secure login
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <button 
                          onClick={() => setResetStep('request')}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-0"
                        >
                          <ArrowLeft size={16} />
                        </button>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Mainframe Clearance</h2>
                      </div>
                      <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                        Enter the 6-digit key dispatched to <span className="font-bold text-slate-700 dark:text-slate-300">{email}</span>.
                      </p>
                    </div>

                    <form onSubmit={handleVerifyReset} className="space-y-4">
                      {/* OTP Inputs */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-center mb-1">Clearance Key</label>
                        <div className="flex justify-center gap-2 sm:gap-2.5">
                          {otp.map((digit, idx) => (
                            <input
                              key={idx}
                              id={`otp-${idx}`}
                              type="text"
                              maxLength={1}
                              value={digit}
                              onChange={e => handleOtpChange(e.target.value, idx)}
                              onKeyDown={e => handleOtpKeyDown(e, idx)}
                              className="w-10 h-12 sm:w-11 sm:h-12 text-center text-lg font-extrabold rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm animate-pulse"
                            />
                          ))}
                        </div>
                      </div>

                      {/* New Password input */}
                      <div className="flex flex-col gap-1.5 relative">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                        <div className="relative w-full">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="••••••••••••"
                            required
                            className="saas-input w-full pr-10"
                          />
                          <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-0">
                            {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
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
                          <><ShieldCheck size={16} /> <span>Override Credentials</span></>
                        )}
                      </button>
                    </form>

                    <div className="mt-5 text-center flex flex-col items-center justify-center gap-2">
                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {resendTimer > 0 ? (
                          <span>Resend available in <strong className="text-blue-500">{resendTimer}s</strong></span>
                        ) : (
                          <button 
                            onClick={handleRequestReset}
                            className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors font-bold uppercase tracking-wider text-[10px] bg-transparent border-0 cursor-pointer"
                          >
                            <RefreshCw size={10} /> Request New Key
                          </button>
                        )}
                      </p>
                    </div>

                    {/* Developer Dev Mode Indicator */}
                    {devMode && (
                      <div className="mt-4 p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold text-center uppercase tracking-widest animate-pulse">
                        ⚡ Dev Mode: Key sent to server console logs
                      </div>
                    )}
                  </>
                )}
              </>
            )}

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
