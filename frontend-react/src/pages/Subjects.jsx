import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Edit2, ChevronDown, ChevronRight,
  BookOpen, Check, Calendar, X, Save, FileText,
  Hexagon, Layers, Code, ArrowRight, Sparkles
} from 'lucide-react';

/* ─── helpers ─── */
function calcSubjectMastery(subject) {
  const topics = subject.topics || [];
  if (topics.length === 0) return 0;
  let totalWeight = 0, doneWeight = 0;
  topics.forEach(t => {
    const subtopics = t.subtopics || [];
    if (subtopics.length === 0) {
      totalWeight++;
      if (t.completed) doneWeight++;
    } else {
      let stTotal = 0, stDone = 0;
      subtopics.forEach(st => {
        const tasks = st.tasks || [];
        if (tasks.length === 0) {
          stTotal++;
          if (st.completed) stDone++;
        } else {
          stTotal += tasks.length;
          stDone += tasks.filter(tk => tk.completed).length;
        }
      });
      totalWeight++;
      doneWeight += stTotal > 0 ? stDone / stTotal : (t.completed ? 1 : 0);
    }
  });
  return totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;
}

function calcTopicProgress(topic) {
  const subtopics = topic.subtopics || [];
  if (subtopics.length === 0) return null;
  let done = 0, total = 0;
  subtopics.forEach(st => {
    const tasks = st.tasks || [];
    if (tasks.length === 0) { total++; if (st.completed) done++; }
    else { total += tasks.length; done += tasks.filter(tk => tk.completed).length; }
  });
  return total > 0 ? { done, total } : null;
}

function parseDateLocal(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysLeftFromDate(dateVal) {
  if (!dateVal) return null;
  const target = new Date(dateVal);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((target - todayMidnight) / 86400000);
}

// Map subject index to specific visual styles
const subjectStyles = [
  { 
    bg: 'from-purple-500 to-indigo-600', 
    glow: 'shadow-purple-500/30',
    text: 'text-purple-400',
    bar: 'bg-purple-500',
    cardGlow: 'before:bg-purple-500/10',
    icon: Hexagon
  },
  { 
    bg: 'from-blue-500 to-cyan-500', 
    glow: 'shadow-blue-500/30',
    text: 'text-blue-400',
    bar: 'bg-blue-500',
    cardGlow: 'before:bg-blue-500/10',
    icon: Layers
  },
  { 
    bg: 'from-teal-400 to-emerald-500', 
    glow: 'shadow-teal-500/30',
    text: 'text-teal-400',
    bar: 'bg-teal-400',
    cardGlow: 'before:bg-teal-500/10',
    icon: Code
  }
];

function getStyle(index) {
  return subjectStyles[index % subjectStyles.length];
}

/* ─── Modal ─── */
function Modal({ title, onClose, onSave, defaultValue = '', showDate = false, showNotes = false }) {
  const [val, setVal] = useState(defaultValue);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const submit = () => val.trim() && onSave(val.trim(), date || null, notes);
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#111] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}>
        <div className="flex justify-between items-center p-6 pb-4 flex-shrink-0 border-b border-white/5">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"><X size={16} strokeWidth={1.5} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 0 }}>
          <input autoFocus value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Enter name..." className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all mb-4 text-sm" />
          {showDate && (
            <div className="mb-4">
              <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Target Deadline</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-all [color-scheme:dark]" />
            </div>
          )}
          {showNotes && (
            <div className="mb-2">
              <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Add notes..." className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all resize-none" />
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 pt-4 border-t border-white/5 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 font-medium text-sm hover:bg-white/10 transition-all">Cancel</button>
          <button onClick={submit} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2">
            <Save size={14} strokeWidth={1.5} /> Save
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/* ─── Task Row ─── */
function TaskRow({ task, subjectId, topicId, subtopicId, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const toggle = async () => {
    setLoading(true);
    try {
      const { data } = await API.patch(`/subjects/${subjectId}/topics/${topicId}/subtopics/${subtopicId}/tasks/${task._id}/toggle`);
      onUpdate(data.subjects);
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  const del = async () => {
    try {
      const { data } = await API.delete(`/subjects/${subjectId}/topics/${topicId}/subtopics/${subtopicId}/tasks/${task._id}`);
      onUpdate(data.subjects);
      toast.success('Task removed');
    } catch { toast.error('Failed to delete task'); }
  };
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 group transition-all">
      <button onClick={toggle} disabled={loading} className="flex items-center gap-3 flex-1 text-left">
        <div className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center transition-all duration-300 ${task.completed ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'border-slate-700 hover:border-slate-500'}`}>
          {task.completed && <Check size={10} strokeWidth={3} className="text-[#0a0a0a]" />}
        </div>
        <span className={`text-[13px] transition-all ${task.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>{task.name}</span>
      </button>
      <button onClick={del} className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-red-400 transition-all">
        <Trash2 size={12} strokeWidth={1.5} />
      </button>
    </div>
  );
}

/* ─── Subtopic ─── */
function SubtopicCard({ subtopic, subjectId, topicId, onUpdate }) {
  const [open,       setOpen]       = useState(false);
  const [adding,     setAdding]     = useState(false);
  const [editMeta,   setEditMeta]   = useState(false);
  const [deadline,   setDeadline]   = useState(subtopic.deadline ? subtopic.deadline.split('T')[0] : '');
  const [comment,    setComment]    = useState(subtopic.comment || '');
  const [savingMeta, setSavingMeta] = useState(false);
  const tasks = subtopic.tasks || [];
  const done  = tasks.filter(t => t.completed).length;

  const addTask = async (name) => {
    try {
      const { data } = await API.post(`/subjects/${subjectId}/topics/${topicId}/subtopics/${subtopic._id}/tasks`, { taskName: name });
      onUpdate(data.subjects);
    } catch { toast.error('Failed to add task'); } finally { setAdding(false); }
  };

  const del = async () => {
    try {
      const { data } = await API.delete(`/subjects/${subjectId}/topics/${topicId}/subtopics/${subtopic._id}`);
      onUpdate(data.subjects);
    } catch { toast.error('Failed to delete'); }
  };

  const toggleSelf = async () => {
    try {
      const { data } = await API.patch(`/subjects/${subjectId}/topics/${topicId}/subtopics/${subtopic._id}`, { completed: !subtopic.completed });
      onUpdate(data.subjects);
    } catch { toast.error('Failed'); }
  };

  const saveMeta = async () => {
    setSavingMeta(true);
    try {
      const { data } = await API.patch(`/subjects/${subjectId}/topics/${topicId}/subtopics/${subtopic._id}`, {
        deadline: deadline || null,
        comment:  comment,
      });
      onUpdate(data.subjects); setEditMeta(false);
    } catch { toast.error('Failed to save'); } finally { setSavingMeta(false); }
  };

  const daysLeft = deadline ? daysLeftFromDate(parseDateLocal(deadline)) : null;

  return (
    <div className="rounded-xl border border-white/5 bg-black/40 mb-2 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 group cursor-pointer hover:bg-white/[0.02]" onClick={() => setOpen(!open)}>
        <button onClick={e => { e.stopPropagation(); toggleSelf(); }}
          className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center transition-all ${subtopic.completed ? 'bg-purple-500 border-purple-500' : 'border-slate-600 hover:border-purple-500'}`}>
          {subtopic.completed && <Check size={10} strokeWidth={3} className="text-[#0a0a0a]" />}
        </button>
        {open ? <ChevronDown size={13} strokeWidth={1.5} className="text-slate-500" /> : <ChevronRight size={13} strokeWidth={1.5} className="text-slate-500" />}
        <span className={`text-[13px] font-medium flex-1 ${subtopic.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{subtopic.name}</span>
        
        {daysLeft !== null && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${daysLeft < 0 ? 'bg-red-500/10 text-red-400' : daysLeft <= 3 ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
            {daysLeft < 0 ? 'Overdue' : `${daysLeft}d`}
          </span>
        )}
        {tasks.length > 0 && <span className="text-[11px] text-slate-500 font-mono">{done}/{tasks.length}</span>}
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); setEditMeta(v => !v); }} className="p-1 rounded text-slate-500 hover:text-purple-400"><Calendar size={12} strokeWidth={1.5} /></button>
          <button onClick={e => { e.stopPropagation(); setAdding(true); }} className="p-1 rounded text-slate-500 hover:text-blue-400"><Plus size={12} strokeWidth={1.5} /></button>
          <button onClick={e => { e.stopPropagation(); del(); }} className="p-1 rounded text-slate-500 hover:text-red-400"><Trash2 size={12} strokeWidth={1.5} /></button>
        </div>
      </div>

      <AnimatePresence>
        {editMeta && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-3 pl-11 border-t border-purple-500/10 bg-purple-500/5 space-y-2 pt-2">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 block">Date</label>
                  <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                    className="w-full px-2 py-1.5 bg-black/50 border border-white/10 rounded-lg text-slate-300 text-[11px] focus:outline-none focus:border-purple-500 transition-all [color-scheme:dark]"/>
                </div>
                <div className="flex-2">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 block">Comment</label>
                  <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder="Notes..."
                    className="w-full px-2 py-1.5 bg-black/50 border border-white/10 rounded-lg text-slate-300 text-[11px] focus:outline-none focus:border-purple-500 transition-all"/>
                </div>
                <div className="flex items-end pb-0.5">
                  <button onClick={saveMeta} disabled={savingMeta} className="px-2 py-1.5 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/40 text-[11px] font-medium transition-colors">
                    {savingMeta ? '...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-3 pl-11 border-t border-white/5 pt-2">
              {subtopic.comment && (
                <p className="text-[11px] text-slate-500 italic py-1 border-b border-white/5 mb-2">"{subtopic.comment}"</p>
              )}
              {tasks.map(task => (
                <TaskRow key={task._id} task={task} subjectId={subjectId} topicId={topicId} subtopicId={subtopic._id} onUpdate={onUpdate} />
              ))}
              <button onClick={() => setAdding(true)} className="mt-2 text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors">
                <Plus size={10} strokeWidth={1.5} /> Add Task
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {adding && <Modal title={`New Task`} onClose={() => setAdding(false)} onSave={addTask} />}
      </AnimatePresence>
    </div>
  );
}

/* ─── Topic ─── */
function TopicCard({ topic, subjectId, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const progress = calcTopicProgress(topic);
  const subtopics = topic.subtopics || [];
  const daysLeft = daysLeftFromDate(topic.deadline);

  const addSubtopic = async (name) => {
    try {
      const { data } = await API.post(`/subjects/${subjectId}/topics/${topic._id}/subtopics`, { subtopicName: name });
      onUpdate(data.subjects);
    } catch { toast.error('Failed'); } finally { setAdding(false); }
  };

  const del = async () => {
    try {
      const { data } = await API.delete(`/subjects/${subjectId}/topics/${topic._id}`);
      onUpdate(data.subjects);
    } catch { toast.error('Failed to delete'); }
  };

  const toggleComplete = async () => {
    try {
      const { data } = await API.patch(`/subjects/${subjectId}/topics/${topic._id}`, { completed: !topic.completed });
      onUpdate(data.subjects);
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="bg-[#0a0a0a]/80 rounded-xl border border-white/5 mb-3 overflow-hidden shadow-sm">
      <div className="flex items-start gap-3 px-4 py-3.5 group cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => setOpen(!open)}>
        <button onClick={e => { e.stopPropagation(); toggleComplete(); }}
          className={`w-4 h-4 mt-0.5 rounded-sm border flex-shrink-0 flex items-center justify-center transition-all ${topic.completed ? 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-slate-600 hover:border-blue-500'}`}>
          {topic.completed && <Check size={10} strokeWidth={3} className="text-[#0a0a0a]" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`font-medium text-[14px] ${topic.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{topic.name}</span>
            {daysLeft !== null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${daysLeft < 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : daysLeft <= 7 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                {daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}
              </span>
            )}
            {topic.notes && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1 border border-white/10 px-1.5 py-0.5 rounded"><FileText size={9} strokeWidth={1.5} /> Note</span>
            )}
          </div>
          {progress && (
            <div className="mt-2 flex items-center gap-2.5">
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
              </div>
              <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">{progress.done}/{progress.total}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
          <button onClick={e => { e.stopPropagation(); setAdding(true); }} className="p-1 rounded text-slate-500 hover:text-blue-400"><Plus size={14} strokeWidth={1.5} /></button>
          <button onClick={e => { e.stopPropagation(); del(); }} className="p-1 rounded text-slate-500 hover:text-red-400"><Trash2 size={14} strokeWidth={1.5} /></button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-white/5 pt-3 pl-11">
              {topic.notes && (
                <div className="mb-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 text-slate-400 text-xs italic">
                  "{topic.notes}"
                </div>
              )}
              {subtopics.map(st => (
                <SubtopicCard key={st._id} subtopic={st} subjectId={subjectId} topicId={topic._id} onUpdate={onUpdate} />
              ))}
              {subtopics.length === 0 && <p className="text-slate-600 text-[11px] mb-2">No subtopics yet</p>}
              <button onClick={() => setAdding(true)}
                className="mt-1 text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1.5 font-medium transition-colors">
                <Plus size={12} strokeWidth={1.5} /> Add Subtopic
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {adding && <Modal title={`New Subtopic`} onClose={() => setAdding(false)} onSave={addSubtopic} />}
      </AnimatePresence>
    </div>
  );
}

/* ─── Subject Card ─── */
function SubjectCard({ subject, index, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const mastery = calcSubjectMastery(subject);
  const topics = subject.topics || [];
  const completedTopics = topics.filter(t => t.completed).length;
  const style = getStyle(index);
  const Icon = style.icon;

  const addTopic = async (name, date, notes) => {
    try {
      const { data } = await API.post(`/subjects/${subject._id}/topics`, {
        topicName: name, deadline: date, notes: notes || ''
      });
      onUpdate(data.subjects);
    } catch { toast.error('Failed to add topic'); } finally { setAddingTopic(false); }
  };

  const renameSubject = async (name) => {
    try {
      const { data } = await API.patch(`/subjects/${subject._id}`, { name });
      onUpdate(data.subjects); setEditing(false);
    } catch { toast.error('Failed to rename'); }
  };

  const del = async (e) => {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); return; }
    setConfirmDelete(false);
    try {
      const { data } = await API.delete(`/subjects/${subject._id}`);
      onUpdate(data.subjects);
    } catch (err) { toast.error('Failed to delete subject'); }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl bg-[#111]/80 backdrop-blur-xl border border-white/5 transition-all group ${style.cardGlow} before:absolute before:inset-0 before:opacity-0 before:transition-opacity hover:before:opacity-100 before:-z-10 before:blur-3xl`}>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.bg} flex items-center justify-center flex-shrink-0 shadow-lg ${style.glow}`}>
              <Icon size={24} strokeWidth={1.5} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg leading-tight truncate mb-1">{subject.name}</h3>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold tracking-wider uppercase ${style.text}`}>
                  {mastery}% Mastery
                </span>
                <span className="text-slate-500 text-[11px]">{completedTopics}/{topics.length} topics done</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={e => { e.stopPropagation(); setAddingTopic(false); setEditing(true); }} className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <Edit2 size={13} strokeWidth={1.5} />
            </button>
            <button onClick={del} className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${confirmDelete ? 'bg-red-500/20 border-red-500/30 text-red-400 animate-pulse' : 'bg-[#1a1a1a] border-white/5 text-slate-400 hover:text-red-400'}`}>
              <Trash2 size={13} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Ultra-thin Progress bar */}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-6">
          <motion.div className={`h-full rounded-full ${style.bar} shadow-[0_0_10px_currentColor]`}
            initial={{ width: 0 }} animate={{ width: `${mastery}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
        </div>

        {/* Footer / Toggle */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex items-center gap-1.5 text-slate-500 text-[12px] font-medium">
            <Layers size={14} strokeWidth={1.5} /> {topics.length} Topic{topics.length !== 1 ? 's' : ''}
          </div>
          <button onClick={() => setOpen(!open)} className="text-slate-400 hover:text-white text-[12px] font-medium flex items-center gap-1 transition-colors">
            {open ? 'Close Details' : 'View Details'} {open ? <ChevronDown size={14} strokeWidth={1.5} /> : <ArrowRight size={14} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-6 pb-6 pt-2 bg-[#050505]/50 border-t border-white/5">
              {topics.map(t => <TopicCard key={t._id} topic={t} subjectId={subject._id} onUpdate={onUpdate} />)}
              {topics.length === 0 && <p className="text-slate-500 text-sm mb-4 mt-2">No topics yet.</p>}
              <button onClick={() => { setEditing(false); setAddingTopic(true); }}
                className="w-full py-3 mt-2 border border-dashed border-white/10 rounded-xl text-slate-400 text-sm font-medium hover:text-white hover:border-white/20 hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2">
                <Plus size={14} strokeWidth={1.5} /> Add Topic
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {addingTopic && <Modal title={`New Topic`} showDate showNotes onClose={() => setAddingTopic(false)} onSave={addTopic} />}
        {editing && <Modal title="Rename Subject" onClose={() => setEditing(false)} onSave={renameSubject} defaultValue={subject.name} />}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Page ─── */
export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    API.get('/subjects')
      .then(({ data }) => { if (mountedRef.current) setSubjects(data.subjects || []); })
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => { if (mountedRef.current) setLoading(false); });
    return () => { mountedRef.current = false; };
  }, []);

  const handleUpdate = (newSubjects) => setSubjects(newSubjects);

  const addSubject = async (name) => {
    try {
      const { data } = await API.post('/subjects', { subjectName: name });
      setSubjects(data.subjects);
    } catch { toast.error('Failed to create subject'); }
    finally { setShowModal(false); }
  };

  const totalMastery = subjects.length > 0
    ? Math.round(subjects.reduce((a, s) => a + calcSubjectMastery(s), 0) / subjects.length)
    : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            My Subjects <Sparkles size={24} className="text-blue-500" />
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {subjects.length} subjects <span className="mx-2">•</span> Overall mastery: 
            <span className="font-semibold text-blue-400 ml-1">{totalMastery}%</span>
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-purple-500/20 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all w-full md:w-auto">
          <Plus size={16} strokeWidth={2} /> Create Subject
        </motion.button>
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-3xl p-16 text-center border border-white/5 bg-[#111]">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
            <BookOpen size={24} strokeWidth={1.5} className="text-slate-500" />
          </div>
          <h3 className="text-white font-medium text-lg mb-2">No subjects yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Create your first subject to start organizing your study plan.
          </p>
          <button onClick={() => setShowModal(true)} className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-all">
            + Create First Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {subjects.map((sub, idx) => (
            <SubjectCard key={sub._id} subject={sub} index={idx} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && <Modal title="Create New Subject" onClose={() => setShowModal(false)} onSave={addSubject} />}
      </AnimatePresence>
    </div>
  );
}
