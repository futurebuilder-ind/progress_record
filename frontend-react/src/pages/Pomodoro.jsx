import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Timer, Play, Pause, RotateCcw, Check, Coffee } from 'lucide-react';

export default function Pomodoro() {
  const [mode, setMode] = useState('focus');
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const startTimer = () => {
    if (timeLeft <= 0) return;
    setRunning(true);
  };

  const pauseTimer = () => setRunning(false);

  const resetTimer = () => {
    setRunning(false);
    setTimeLeft(duration * 60);
  };

  const setCustom = () => {
    const val = parseInt(customDuration);
    if (!val || val < 1 || val > 240) { toast.error('Enter 1–240 minutes'); return; }
    setDuration(val);
    setTimeLeft(val * 60);
    setRunning(false);
    setCustomDuration('');
    toast.success(`Timer set to ${val} minutes`);
  };

  const selectMode = (m, d) => {
    setMode(m);
    setDuration(d);
    setTimeLeft(d * 60);
    setRunning(false);
  };

  const saveSession = useCallback(async () => {
    try {
      await API.post('/sessions', { type: mode, durationMinutes: duration });
      toast.success('Session completed');
    } catch { toast.error('Failed to save'); }
  }, [mode, duration]);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => {
    if (timeLeft <= 0 && running) {
      setRunning(false);
      saveSession();
    }
  }, [timeLeft, running, saveSession]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const pct = duration > 0 ? ((duration * 60 - timeLeft) / (duration * 60)) * 100 : 0;

  const MODES = [
    { key: 'focus', label: 'Focus', dur: 25, icon: Timer },
    { key: 'short', label: 'Short Break', dur: 5, icon: Coffee },
    { key: 'long',  label: 'Long Break',  dur: 15, icon: Coffee },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="max-w-lg mx-auto space-y-8 py-8">
      
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight font-display">Focus Mode</h1>
        <p className="text-caption mt-1">Stay concentrated. Build momentum.</p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-xl p-1 border border-[var(--border)]">
        {MODES.map(m => (
          <button key={m.key} onClick={() => selectMode(m.key, m.dur)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
              mode === m.key ? 'bg-white text-black' : 'text-[var(--text-secondary)] hover:text-white'
            }`}>
            <m.icon size={13} /> {m.label}
          </button>
        ))}
      </div>

      {/* Timer */}
      <div className="glass-card rounded-3xl p-10 text-center">
        {/* Progress ring */}
        <div className="relative w-52 h-52 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
            <circle cx="100" cy="100" r="88" fill="none" stroke="var(--accent)" strokeWidth="4"
              strokeLinecap="round" strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - pct / 100)}
              style={{ transition: 'stroke-dashoffset 0.5s ease', opacity: pct > 0 ? 1 : 0.1 }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="stat-number text-5xl text-white tracking-tight">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <div className="text-overline mt-2">{mode === 'focus' ? 'Focus' : 'Break'}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={resetTimer}
            className="btn-ghost p-3 rounded-xl">
            <RotateCcw size={18} />
          </button>
          
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={running ? pauseTimer : startTimer}
            className="btn-primary px-10 py-3.5 rounded-xl text-sm">
            {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> {timeLeft < duration * 60 ? 'Resume' : 'Start'}</>}
          </motion.button>

          {timeLeft <= 0 && (
            <button onClick={resetTimer} className="btn-ghost p-3 rounded-xl text-[var(--success)]">
              <Check size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Custom Timer */}
      <div className="glass-card rounded-2xl p-5">
        <div className="text-overline mb-3">Custom Duration</div>
        <div className="flex gap-2">
          <input type="number" min="1" max="240" value={customDuration} onChange={e => setCustomDuration(e.target.value)}
            placeholder="Minutes (1–240)" className="input-field flex-1" 
            onKeyDown={e => e.key === 'Enter' && setCustom()} />
          <motion.button whileTap={{ scale: 0.97 }} onClick={setCustom}
            className="btn-secondary px-5 whitespace-nowrap">
            Set Timer
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
