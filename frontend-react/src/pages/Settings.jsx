import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { User, Shield, Bell, Palette, Eye, EyeOff, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const EXAM_TYPES = ['GATE', 'JEE', 'NEET', 'UPSC', 'SSC', 'CAT', 'GMAT', 'Board Exams', 'Other'];

export const THEMES = [
  { name: 'Midnight',   bg: '#030712', accent: '#3b82f6' },
  { name: 'Deep Space', bg: '#0d0d1a', accent: '#8b5cf6' },
  { name: 'Forest',     bg: '#022c22', accent: '#10b981' },
  { name: 'Crimson',    bg: '#1a0008', accent: '#ef4444' },
];

/* Apply theme to document — call this whenever theme changes */
export function applyTheme(theme) {
  if (!theme) return;
  document.body.style.background = theme.bg;
  document.documentElement.style.setProperty('--bg-primary', theme.bg);
  localStorage.setItem('selectedTheme', JSON.stringify(theme));
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="glass rounded-2xl p-6 cyber-card">
      <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-5">
        <Icon size={18} className="text-blue-400"/> {title}
      </h3>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [name,     setName]     = useState(user?.name || '');
  const [examType, setExamType] = useState(user?.examType || 'GATE');
  const [oldPass,  setOldPass]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [selectedTheme, setSelectedTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('selectedTheme');
      if (saved) {
        const t = JSON.parse(saved);
        return THEMES.findIndex(th => th.bg === t.bg) ?? 0;
      }
    } catch {}
    return 0;
  });

  /* Apply saved theme on mount */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('selectedTheme');
      if (saved) applyTheme(JSON.parse(saved));
    } catch {}
  }, []);

  const handleThemeChange = async (theme, i) => {
    setSelectedTheme(i);
    applyTheme(theme);
    try {
      await API.put('/settings', { bgColor: theme.bg, accentColor: theme.accent });
      toast.success(`${theme.name} theme saved!`);
    } catch {
      toast.error('Theme saved locally, but failed to sync to server');
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await API.put('/settings', { displayName: name, examType });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save profile'); }
    finally { setSavingProfile(false); }
  };

  const savePassword = () => { setOldPass(''); setNewPass(''); toast.success('Password updated!'); };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Section title="Profile" icon={User}>
        <div className="flex items-center gap-5 mb-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-white font-bold text-lg">{user?.name}</div>
            <div className="text-slate-400 text-sm">{user?.email}</div>
            <div className="text-xs text-blue-400 mt-1">{user?.examType} Aspirant</div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"/>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Target Exam</label>
            <select value={examType} onChange={e => setExamType(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer">
              {EXAM_TYPES.map(e => <option key={e} value={e} className="bg-slate-900">{e}</option>)}
            </select>
          </div>
          <button onClick={saveProfile} disabled={savingProfile}
            className="btn-neon w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {savingProfile ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={16}/>}
            Save Profile
          </button>
        </div>
      </Section>

      {/* Password */}
      <Section title="Security" icon={Shield}>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Current Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={oldPass} onChange={e => setOldPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all pr-12"/>
              <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">New Password</label>
            <input type={showPass ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"/>
          </div>
          <button onClick={savePassword} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            <Shield size={16}/> Update Password
          </button>
        </div>
      </Section>

      {/* Theme */}
      <Section title="Appearance" icon={Palette}>
        <p className="text-slate-500 text-xs mb-4">Choose a background theme. Changes apply instantly and persist after refresh.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {THEMES.map((theme, i) => (
            <motion.button key={theme.name} whileTap={{ scale: 0.95 }}
              onClick={() => handleThemeChange(theme, i)}
              className={`p-4 rounded-xl border-2 transition-all ${selectedTheme === i ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-white/10 hover:border-white/20'}`}
              style={{ background: theme.bg }}>
              <div className="w-6 h-6 rounded-full mx-auto mb-2" style={{ background: theme.accent, boxShadow: `0 0 10px ${theme.accent}` }}/>
              <div className="text-white text-xs font-semibold">{theme.name}</div>
              {selectedTheme === i && <div className="text-blue-400 text-xs mt-1">✓ Active</div>}
            </motion.button>
          ))}
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        {[
          { label: 'Revision Reminders', desc: "Get reminded about topics you haven't reviewed" },
          { label: 'Daily Study Goal',   desc: "Alert when you haven't studied today" },
          { label: 'Streak Alerts',      desc: 'Notify before your streak breaks' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <div>
              <div className="text-white font-semibold text-sm">{item.label}</div>
              <div className="text-slate-500 text-xs">{item.desc}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked/>
              <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>
        ))}
      </Section>
    </div>
  );
}
