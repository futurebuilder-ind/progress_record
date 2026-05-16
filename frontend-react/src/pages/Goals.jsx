import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Target, Plus, Check, Trash2, X, Edit2, Save, Zap } from 'lucide-react';

const CATEGORIES = ['Study', 'Practice', 'Revision', 'Mock Tests', 'Reading', 'General'];

function GoalModal({ onClose, onSave, existing = null }) {
  const [form, setForm] = useState({
    title: existing?.title || '',
    category: existing?.category || 'Study',
    target: existing?.target || '',
    current: existing?.current ?? '',
    deadline: existing?.deadline ? existing.deadline.split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim() || !form.target) return toast.error('Title and target required');
    const target = Math.max(1, Number(form.target));
    setSaving(true);
    try {
      await onSave({
        title: form.title,
        category: form.category,
        target,
        current: form.current !== '' ? Math.min(target, Math.max(0, Number(form.current))) : undefined,
        deadline: form.deadline || undefined,
      });
    } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()} className="glass rounded-2xl p-7 w-full max-w-md border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold text-xl">{existing ? 'Edit Goal' : 'New Goal'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Goal Title *</label>
            <input autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder="e.g. Complete 100 PYQs"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer">
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Target *</label>
              <input type="number" min="1" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}
                placeholder="e.g. 100"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all" />
            </div>
          </div>
          {existing && (
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Current Progress</label>
              <input type="number" min="0" max={form.target} value={form.current}
                onChange={e => setForm({ ...form, current: e.target.value })}
                placeholder={`0 – ${form.target}`}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all" />
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Deadline (optional)</label>
            <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all [color-scheme:dark]" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold hover:bg-white/10 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 btn-neon rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} /> {existing ? 'Update' : 'Create'}</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function GoalCard({ goal, onDelete, onUpdate, isConfirmingDelete }) {
  const target = Math.max(1, goal.target);
  const pct = Math.min(100, Math.round((goal.current / target) * 100));
  const done = pct >= 100 || goal.completed;
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000) : null;
  const debounceRef = useRef(null);

  const applyDelta = (delta) => {
    if (busy) return;
    // Optimistic update
    const newCurrent = Math.max(0, Math.min(target, goal.current + delta));
    const willComplete = newCurrent >= target && !goal.completed;
    onUpdate(goal._id, { current: newCurrent, completed: willComplete || goal.completed }, false);
    // Debounce server sync
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setBusy(true);
      try {
        const { data } = await API.patch(`/goals/${goal._id}`, { delta });
        onUpdate(goal._id, data.goal, true);
        if (data.goal.completed && !goal.completed) {
          setJustCompleted(true);
          setTimeout(() => setJustCompleted(false), 3000);
          toast.success('🎉 Goal completed!');
        }
      } catch { toast.error('Update failed'); }
      finally { setBusy(false); }
    }, 300);
  };

  const markDone = async () => {
    setBusy(true);
    onUpdate(goal._id, { current: target, completed: true }, false);
    try {
      const { data } = await API.patch(`/goals/${goal._id}`, { completed: true });
      onUpdate(goal._id, data.goal, true);
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 3000);
      toast.success('🎉 Goal completed!');
    } catch { toast.error('Failed'); }
    finally { setBusy(false); }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`glass rounded-2xl p-5 border transition-all cyber-card relative overflow-hidden ${done ? 'border-emerald-500/30' : 'border-white/5 hover:border-purple-500/30'}`}>

      {/* Completion flash */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-emerald-500/10 rounded-2xl pointer-events-none z-10 flex items-center justify-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}
              className="text-4xl">🎉</motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-bold text-base ${done ? 'text-emerald-400 line-through opacity-70' : 'text-white'}`}>{goal.title}</h3>
            {done && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
                className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Check size={11} className="text-white" strokeWidth={3} />
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {goal.category && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25">{goal.category}</span>}
            {daysLeft !== null && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${daysLeft < 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : daysLeft <= 7 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                {daysLeft < 0 ? '⚠️ Overdue' : `⏰ ${daysLeft}d left`}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0 ml-2">
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all"><Edit2 size={13} /></button>
          <button onClick={() => onDelete(goal._id)}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isConfirmingDelete
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-red-400 hover:bg-red-400/10'
            }`}>
            {isConfirmingDelete ? '⚠ Sure?' : <Trash2 size={13} />}
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-slate-400">{goal.current} / {target}</span>
          <span className={`font-bold ${done ? 'text-emerald-400' : 'text-blue-400'}`}>{pct}%</span>
        </div>
        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div className={`h-full rounded-full ${done ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
        </div>
      </div>

      {!done ? (
        <div className="flex gap-2">
          {[-10, -1].map(d => (
            <button key={d} onClick={() => applyDelta(d)} disabled={busy}
              className="flex-1 py-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all text-sm font-semibold disabled:opacity-40">
              {d}
            </button>
          ))}
          {[1, 10].map(d => (
            <button key={d} onClick={() => applyDelta(d)} disabled={busy}
              className="flex-1 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-semibold disabled:opacity-40">
              +{d}
            </button>
          ))}
          <button onClick={markDone} disabled={busy}
            className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-1">
            <Zap size={13} /> Done
          </button>
        </div>
      ) : (
        <div className="text-center py-1.5">
          <span className="text-emerald-400 text-sm font-semibold">🎉 Goal Achieved!</span>
          {goal.completedAt && <span className="text-slate-500 text-xs ml-2">{new Date(goal.completedAt).toLocaleDateString()}</span>}
        </div>
      )}

      <AnimatePresence>
        {editing && <GoalModal existing={goal} onClose={() => setEditing(false)}
          onSave={async (data) => {
            const { data: res } = await API.patch(`/goals/${goal._id}`, data);
            onUpdate(goal._id, res.goal, true);
            setEditing(false);
            toast.success('Goal updated!');
          }} />}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchGoals = useCallback(async () => {
    try {
      const { data } = await API.get('/goals');
      setGoals(data.goals || []);
    } catch { toast.error('Failed to load goals'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const createGoal = async (data) => {
    try {
      const { data: res } = await API.post('/goals', data);
      setGoals(prev => [res.goal, ...prev]);
      toast.success('Goal created! 🎯');
      setShowModal(false);
    } catch { toast.error('Failed to create goal'); }
  };

  /**
   * onUpdate is called by child either:
   *  - optimistically (fromServer=false): merge partial changes
   *  - from server (fromServer=true): replace with canonical server data
   */
  const updateGoal = (id, changes, fromServer) => {
    setGoals(prev => prev.map(g => {
      if (g._id !== id) return g;
      return fromServer ? changes : { ...g, ...changes };
    }));
  };

  const deleteGoal = async (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    setConfirmDeleteId(null);
    setGoals(prev => prev.filter(g => g._id !== id));
    try {
      await API.delete(`/goals/${id}`);
      toast.success('Goal removed');
    } catch {
      toast.error('Delete failed');
      fetchGoals();
    }
  };

  const filtered = goals.filter(g =>
    filter === 'active' ? !g.completed :
    filter === 'done'   ? g.completed  : true
  );

  const totalPct = goals.length > 0
    ? Math.round(goals.reduce((a, g) => a + Math.min(100, (g.current / Math.max(1, g.target)) * 100), 0) / goals.length)
    : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-white">Goals</h1>
          <p className="text-slate-400 text-sm mt-1">
            {goals.filter(g => g.completed).length}/{goals.length} completed · Avg:{' '}
            <span className="font-bold text-blue-400">{totalPct}%</span>
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-neon px-5 py-2.5 rounded-xl text-white font-bold flex items-center gap-2">
          <Plus size={18} /> Add Goal
        </button>
      </div>

      <div className="flex gap-2 glass rounded-xl p-1.5 w-fit">
        {[['all', 'All'], ['active', 'Active'], ['done', 'Completed']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === key ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-14 text-center border border-white/5">
          <Target size={48} className="text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">
            {filter === 'done' ? 'No completed goals yet' : 'No goals found'}
          </h3>
          {filter !== 'done' && (
            <button onClick={() => setShowModal(true)} className="btn-neon px-6 py-2.5 rounded-xl text-white font-bold mt-3">
              + Add First Goal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence>
            {filtered.map(goal => (
              <GoalCard key={goal._id} goal={goal} onDelete={deleteGoal} onUpdate={updateGoal} isConfirmingDelete={confirmDeleteId === goal._id} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && <GoalModal onClose={() => setShowModal(false)} onSave={createGoal} />}
      </AnimatePresence>
    </div>
  );
}
