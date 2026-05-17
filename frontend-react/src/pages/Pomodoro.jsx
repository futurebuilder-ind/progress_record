import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, Music, Volume2, VolumeX } from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const MODES = [
  { label: 'Focus',       duration: 25 * 60, color: 'from-blue-500 to-purple-600',   type: 'focus' },
  { label: 'Short Break', duration:  5 * 60, color: 'from-emerald-500 to-teal-600',  type: 'break' },
  { label: 'Long Break',  duration: 15 * 60, color: 'from-orange-500 to-red-600',    type: 'break' },
  { label: 'Custom',      duration: 60 * 60, color: 'from-fuchsia-500 to-pink-600',  type: 'focus', isCustom: true },
];

const LS_KEY = 'pomodoro_state';

function loadSaved() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    // Adjust timeLeft by elapsed seconds since last save
    const elapsed = Math.floor((Date.now() - saved.savedAt) / 1000);
    const adjusted = saved.wasRunning ? Math.max(0, saved.timeLeft - elapsed) : saved.timeLeft;
    return { modeIdx: saved.modeIdx ?? 0, timeLeft: adjusted };
  } catch { return null; }
}

export default function Pomodoro() {
  const savedState = useRef(loadSaved());
  const [modeIdx, setModeIdx]   = useState(savedState.current?.modeIdx ?? 0);
  const [customMinutes, setCustomMinutes] = useState(60);
  const [timeLeft, setTimeLeft] = useState(savedState.current?.timeLeft ?? MODES[0].duration);
  const [running, setRunning]   = useState(false);
  const [muted, setMuted]       = useState(false);
  const [sessionStats, setSessionStats] = useState({ totalSessions: 0, todaySessions: 0, totalMinutes: 0 });
  const intervalRef = useRef(null);

  const mode = MODES[modeIdx];
  const progress   = 1 - timeLeft / mode.duration;
  const minutes    = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds    = String(timeLeft % 60).padStart(2, '0');
  const circumference = 2 * Math.PI * 110;

  /* Fetch real session stats */
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await API.get('/sessions/stats');
      setSessionStats(data);
    } catch { /* silent – don't block timer */ }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  /* Persist state to localStorage on every tick */
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({
      modeIdx,
      timeLeft,
      wasRunning: running,
      savedAt: Date.now(),
    }));
  }, [modeIdx, timeLeft, running]);

  /* Timer tick */
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            handleSessionComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, modeIdx]);

  const handleSessionComplete = async () => {
    if (!muted) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(); osc.stop(ctx.currentTime + 0.8);
      } catch { /* AudioContext may not be available */ }
    }

    if (MODES[modeIdx].type === 'focus') {
      toast.success('Focus session complete! 🎯');
      try {
        await API.post('/sessions', { type: 'focus', durationMinutes: Math.round(MODES[modeIdx].duration / 60) });
        fetchStats(); // refresh counts
      } catch { /* session save failed silently */ }
    } else {
      toast.success('Break over! Ready to focus? 💪');
    }
  };

  const switchMode = (idx) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setModeIdx(idx);
    setTimeLeft(MODES[idx].isCustom ? customMinutes * 60 : MODES[idx].duration);
  };

  const handleCustomChange = (e) => {
    const val = parseInt(e.target.value) || 1;
    const mins = Math.max(1, Math.min(val, 240));
    setCustomMinutes(mins);
    setTimeLeft(mins * 60);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setTimeLeft(mode.isCustom ? customMinutes * 60 : mode.duration);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-black text-white flex items-center justify-center gap-3">
          <Timer className="text-blue-400" /> Focus Mode
        </h1>
        <p className="text-slate-400 mt-2">Stay locked in. No distractions.</p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 glass-card rounded-2xl p-2 bg-[#050505]">
        {MODES.map((m, i) => (
          <button key={i} onClick={() => switchMode(i)}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${modeIdx === i ? 'bg-gradient-to-r ' + m.color + ' text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
            {m.label}
          </button>
        ))}
      </div>

      {mode.isCustom && !running && (
        <div className="flex items-center justify-center gap-4 mt-4 glass-card p-4 rounded-2xl">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Custom Time (Mins):</label>
          <input 
            type="number" min="1" max="240" value={customMinutes} onChange={handleCustomChange}
            className="w-20 bg-[#0a0a0a] border border-white/10 text-white rounded-lg px-3 py-2 text-center focus:outline-none focus:border-purple-500 font-mono"
          />
        </div>
      )}

      {/* Timer Circle */}
      <div className="flex flex-col items-center">
        <div className="relative w-64 h-64">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
            <motion.circle cx="120" cy="120" r="110" fill="none"
              stroke="url(#timerGrad)" strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              transition={{ duration: 1, ease: 'linear' }}
            />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6"/>
                <stop offset="100%" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-black text-white tabular-nums" style={{ fontFamily: 'Roboto Mono, monospace' }}>
              {minutes}:{seconds}
            </div>
            <div className="text-slate-400 text-sm mt-1">{mode.label}</div>
            {running && (
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <button onClick={reset} className="p-3 rounded-xl glass text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <RotateCcw size={20} />
          </button>
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => setRunning(!running)}
            className={`px-10 py-4 rounded-2xl font-black text-white text-lg flex items-center gap-3 bg-gradient-to-r ${mode.color} shadow-xl hover:shadow-2xl transition-all`}>
            {running ? <><Pause size={22} /> Pause</> : <><Play size={22} /> Start</>}
          </motion.button>
          <button onClick={() => setMuted(!muted)} className="p-3 rounded-xl glass text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>

      {/* Real Stats from DB */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Sessions Today',  value: sessionStats.todaySessions },
          { label: 'Total Sessions',  value: sessionStats.totalSessions },
          { label: 'Focus Minutes',   value: sessionStats.totalMinutes },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center cyber-card">
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-slate-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="glass rounded-2xl p-5 border border-blue-500/20">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Music size={16} className="text-blue-400" /> Focus Tips</h3>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>🎯 Keep your phone face-down during focus sessions</li>
          <li>💧 Stay hydrated — take a sip during every break</li>
          <li>🧠 After 4 sessions, take a 30-minute long break</li>
          <li>⚡ Your sessions are saved — check Analytics to see your progress!</li>
        </ul>
      </div>
    </div>
  );
}
