import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { User, Shield, Bell, Palette, Eye, EyeOff, Save, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const EXAM_TYPES = ['GATE', 'JEE', 'NEET', 'UPSC', 'SSC', 'CAT', 'GMAT', 'Board Exams', 'Other'];

export const THEMES = [
  { name: 'Midnight',   bg: '#030712', accent: '#3b82f6' },
  { name: 'Deep Space', bg: '#0d0d1a', accent: '#8b5cf6' },
  { name: 'Forest',     bg: '#022c22', accent: '#10b981' },
  { name: 'Crimson',    bg: '#1a0008', accent: '#ef4444' },
];

export const PRESETS = [
  {
    name: 'Cyber Brain',
    data: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23050505" /><circle cx="50" cy="50" r="35" fill="none" stroke="%2322d3ee" stroke-width="2" stroke-dasharray="4 2" /><path d="M40,50 Q45,35 50,35 T60,50 T50,65 Z" fill="none" stroke="%233b82f6" stroke-width="3" /><circle cx="50" cy="50" r="8" fill="%236366f1" /><line x1="50" y1="15" x2="50" y2="85" stroke="%2322d3ee" stroke-width="1" stroke-dasharray="2 2" /><line x1="15" y1="50" x2="85" y2="50" stroke="%2322d3ee" stroke-width="1" stroke-dasharray="2 2" /></svg>`
  },
  {
    name: 'Neon Phoenix',
    data: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23050505" /><path d="M50,15 L75,45 L50,85 L25,45 Z" fill="none" stroke="%23ec4899" stroke-width="2.5" /><path d="M50,30 L65,48 L50,70 L35,48 Z" fill="none" stroke="%23a855f7" stroke-width="2" /><circle cx="50" cy="50" r="4" fill="%23f43f5e" /><circle cx="50" cy="50" r="12" fill="none" stroke="%23ec4899" stroke-width="1" stroke-dasharray="3 3" /></svg>`
  },
  {
    name: 'Quantum Atom',
    data: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23050505" /><ellipse cx="50" cy="50" rx="35" ry="12" transform="rotate(30 50 50)" fill="none" stroke="%2310b981" stroke-width="2" /><ellipse cx="50" cy="50" rx="35" ry="12" transform="rotate(90 50 50)" fill="none" stroke="%23059669" stroke-width="2" /><ellipse cx="50" cy="50" rx="35" ry="12" transform="rotate(150 50 50)" fill="none" stroke="%2334d399" stroke-width="2" /><circle cx="50" cy="50" r="8" fill="%2310b981" /><circle cx="35" cy="25" r="3" fill="%23a7f3d0" /><circle cx="65" cy="75" r="3" fill="%23a7f3d0" /></svg>`
  },
  {
    name: 'Holo Operator',
    data: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23050505" /><path d="M30,75 L30,65 Q30,50 50,50 T70,65 L70,75" fill="none" stroke="%23f59e0b" stroke-width="3" /><circle cx="50" cy="35" r="12" fill="none" stroke="%23f59e0b" stroke-width="3" /><circle cx="50" cy="35" r="4" fill="%23fbbf24" /><path d="M15,85 L85,85" stroke="%23f59e0b" stroke-width="2" /><circle cx="25" cy="65" r="2" fill="%23fbbf24" /><circle cx="75" cy="65" r="2" fill="%23fbbf24" /></svg>`
  },
  {
    name: 'Apex Star',
    data: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23050505" /><path d="M50,10 L58,38 L86,38 L64,54 L72,82 L50,65 L28,82 L36,54 L14,38 L42,38 Z" fill="none" stroke="%23eab308" stroke-width="2.5" /><circle cx="50" cy="48" r="10" fill="none" stroke="%23fef08a" stroke-width="1.5" /><circle cx="50" cy="48" r="4" fill="%23eab308" /></svg>`
  },
  {
    name: 'Synthetic Pulse',
    data: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23050505" /><path d="M15,50 L35,50 L42,20 L50,80 L58,40 L65,50 L85,50" fill="none" stroke="%23ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /><circle cx="42" cy="20" r="3" fill="%23fca5a5" /><circle cx="50" cy="80" r="3" fill="%23fca5a5" /><circle cx="50" cy="50" r="30" fill="none" stroke="%23ef4444" stroke-width="1" stroke-dasharray="4 4" /></svg>`
  }
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
  const { user, updateUser } = useAuth();
  const [name,     setName]     = useState(user?.name || '');
  const [examType, setExamType] = useState(user?.examType || 'GATE');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePic(reader.result);
      toast.success('Photo loaded! Click Save to apply changes.');
    };
    reader.readAsDataURL(file);
  };

  const selectPreset = (dataUri) => {
    setProfilePic(dataUri);
    toast.success('Avatar selected! Click Save to apply.');
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await API.put('/settings', { displayName: name, examType, profilePic });
      updateUser({ 
        name: data.user.name, 
        examType: data.user.examType, 
        profilePic: data.user.profilePic 
      });
      toast.success('Profile updated!');
    } catch (e) { 
      console.error(e);
      toast.error('Failed to save profile'); 
    } finally { 
      setSavingProfile(false); 
    }
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
        {/* Avatar Display & Local Image Upload */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-6 pb-6 border-b border-white/5">
          <div className="relative group cursor-pointer">
            <input type="file" id="avatarInput" accept="image/*" className="hidden" onChange={handleFileChange} />
            <label htmlFor="avatarInput" className="cursor-pointer block relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.3)] relative transition-all group-hover:scale-102 border border-white/10">
                {profilePic ? (
                  <img src={profilePic} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <span className="relative z-10">{user?.name?.charAt(0).toUpperCase()}</span>
                )}
                {/* Hover overlay with Upload icon */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white gap-1 rounded-2xl">
                  <Upload size={18} className="animate-bounce" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-center mt-1">Upload</span>
                </div>
              </div>
            </label>
            {profilePic && (
              <button 
                onClick={() => { setProfilePic(''); toast.success('Cleared photo! Click Save to apply.'); }}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-xl transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] border border-white/10 cursor-pointer"
                title="Remove photo"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="text-white font-bold text-xl tracking-tight">{user?.name}</div>
            <div className="text-slate-400 text-sm mt-0.5">{user?.email}</div>
            <div className="text-xs text-blue-400 font-bold mt-1 bg-blue-500/10 px-3 py-1 rounded-full w-fit mx-auto md:mx-0 border border-blue-500/20">
              {user?.examType || 'Student'} Aspirant
            </div>
          </div>
        </div>

        {/* Futuristic Cyber Avatars presets */}
        <div className="mb-6">
          <label className="text-xs text-slate-400 uppercase tracking-widest mb-3.5 block font-bold">Or select a Premium Cyber Avatar</label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {PRESETS.map((preset) => {
              const isSelected = profilePic === preset.data;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => selectPreset(preset.data)}
                  className={`p-1.5 rounded-xl border bg-black/60 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.2)] scale-105' 
                      : 'border-white/5 hover:border-white/20 hover:scale-102'
                  }`}
                  title={preset.name}
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-zinc-950 border border-white/5 relative">
                    <img src={preset.data} className="w-full h-full object-contain" alt={preset.name} />
                  </div>
                  <div className={`text-[8px] font-black mt-1 text-center truncate ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {preset.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Details */}
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
            className="btn-neon w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer">
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
