import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Edit2, ChevronDown, ChevronRight,
  BookOpen, Check, Calendar, X, Save, FileText
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

/* Parse date string as local date (avoid timezone shift) */
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

/* ─── Modal ─── */
function Modal({ title, onClose, onSave, defaultValue = '', showDate = false, showNotes = false }) {
  const [val, setVal] = useState(defaultValue);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const submit = () => val.trim() && onSave(val.trim(), date || null, notes);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="glass rounded-2xl p-7 w-full max-w-md border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-bold text-xl">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"><X size={18} /></button>
        </div>
        <input autoFocus value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Enter name..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all mb-3" />
        {showDate && (
          <div className="mb-3">
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Target Deadline <span className="normal-case text-slate-600">(optional)</span></label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all [color-scheme:dark]" />
          </div>
        )}
        {showNotes && (
          <div className="mb-3">
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Notes <span className="normal-case text-slate-600">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Add notes..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all resize-none" />
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold hover:bg-white/10 transition-all">Cancel</button>
          <button onClick={submit} className="flex-1 py-2.5 btn-neon rounded-xl text-white font-semibold flex items-center justify-center gap-2">
            <Save size={15} /> Save
          </button>
        </div>
      </motion.div>
    </motion.div>
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
      <button onClick={toggle} disabled={loading} className="flex items-center gap-2.5 flex-1 text-left">
        <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all duration-300 ${task.completed ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'border-slate-600 hover:border-slate-400'}`}>
          {task.completed && <Check size={10} className="text-white" strokeWidth={3} />}
        </div>
        <span className={`text-sm transition-all ${task.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>{task.name}</span>
      </button>
      <button onClick={del} className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-red-400 transition-all">
        <Trash2 size={12} />
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
      toast.success('Task added!'); onUpdate(data.subjects);
    } catch { toast.error('Failed to add task'); } finally { setAdding(false); }
  };

  const del = async () => {
    try {
      const { data } = await API.delete(`/subjects/${subjectId}/topics/${topicId}/subtopics/${subtopic._id}`);
      toast.success('Subtopic deleted'); onUpdate(data.subjects);
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
      toast.success('Saved!'); onUpdate(data.subjects); setEditMeta(false);
    } catch { toast.error('Failed to save'); } finally { setSavingMeta(false); }
  };

  const daysLeft = deadline ? daysLeftFromDate(parseDateLocal(deadline)) : null;

  return (
    <div className="rounded-xl border border-white/5 bg-white/2 mb-2 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 group cursor-pointer" onClick={() => setOpen(!open)}>
        <button onClick={e => { e.stopPropagation(); toggleSelf(); }}
          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${subtopic.completed ? 'bg-purple-500 border-purple-500' : 'border-slate-600 hover:border-purple-400'}`}>
          {subtopic.completed && <Check size={10} className="text-white" strokeWidth={3} />}
        </button>
        {open ? <ChevronDown size={13} className="text-slate-500" /> : <ChevronRight size={13} className="text-slate-500" />}
        <span className={`text-sm font-semibold flex-1 ${subtopic.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{subtopic.name}</span>
        {daysLeft !== null && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${daysLeft < 0 ? 'bg-red-500/20 text-red-400' : daysLeft <= 3 ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {daysLeft < 0 ? 'Overdue' : `${daysLeft}d`}
          </span>
        )}
        {tasks.length > 0 && <span className="text-xs text-slate-500">{done}/{tasks.length}</span>}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); setEditMeta(v => !v); }} className="p-1 rounded text-slate-400 hover:text-purple-400" title="Date & Comment"><Calendar size={12} /></button>
          <button onClick={e => { e.stopPropagation(); setAdding(true); }} className="p-1 rounded text-slate-400 hover:text-blue-400"><Plus size={12} /></button>
          <button onClick={e => { e.stopPropagation(); del(); }} className="p-1 rounded text-slate-400 hover:text-red-400"><Trash2 size={12} /></button>
        </div>
      </div>

      {/* Date + Comment editor */}
      <AnimatePresence>
        {editMeta && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 pl-10 border-t border-purple-500/20 bg-purple-500/5 space-y-2">
              <div className="pt-2">
                <label className="text-xs text-slate-500 mb-1 block">Target Date</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 transition-all [color-scheme:dark]"/>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Comment / Notes</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 transition-all resize-none placeholder-slate-600"/>
              </div>
              <button onClick={saveMeta} disabled={savingMeta}
                className="px-3 py-1.5 rounded-lg btn-neon text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
                {savingMeta ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={11}/>} Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 pl-10 border-t border-white/5">
              {subtopic.comment && (
                <p className="text-xs text-slate-500 italic py-1.5 border-b border-white/5 mb-2">💬 {subtopic.comment}</p>
              )}
              {tasks.map(task => (
                <TaskRow key={task._id} task={task} subjectId={subjectId} topicId={topicId} subtopicId={subtopic._id} onUpdate={onUpdate} />
              ))}
              {tasks.length === 0 && <p className="text-slate-600 text-xs py-2 pl-1">No tasks. Add one →</p>}
              <button onClick={() => setAdding(true)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 pl-1">
                <Plus size={11} /> Add Task
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {adding && <Modal title={`Add Task in "${subtopic.name}"`} onClose={() => setAdding(false)} onSave={addTask} />}
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
      toast.success('Subtopic added!'); onUpdate(data.subjects);
    } catch { toast.error('Failed'); } finally { setAdding(false); }
  };

  const del = async () => {
    try {
      const { data } = await API.delete(`/subjects/${subjectId}/topics/${topic._id}`);
      toast.success('Topic deleted'); onUpdate(data.subjects);
    } catch { toast.error('Failed to delete'); }
  };

  const toggleComplete = async () => {
    try {
      const { data } = await API.patch(`/subjects/${subjectId}/topics/${topic._id}`, { completed: !topic.completed });
      onUpdate(data.subjects);
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="bg-black/20 rounded-xl border border-white/5 mb-3 overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3.5 group cursor-pointer" onClick={() => setOpen(!open)}>
        <button onClick={e => { e.stopPropagation(); toggleComplete(); }}
          className={`w-5 h-5 mt-0.5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${topic.completed ? 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'border-slate-600 hover:border-blue-400'}`}>
          {topic.completed && <Check size={12} className="text-white" strokeWidth={3} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold text-sm ${topic.completed ? 'line-through text-slate-500' : 'text-white'}`}>{topic.name}</span>
            {daysLeft !== null && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${daysLeft < 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : daysLeft <= 7 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                {daysLeft < 0 ? '⚠️ Overdue' : `⏰ ${daysLeft}d left`}
              </span>
            )}
            {topic.notes && (
              <span className="text-xs text-slate-600 flex items-center gap-1"><FileText size={10} /> Notes</span>
            )}
          </div>
          {progress && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
              </div>
              <span className="text-xs text-slate-500 flex-shrink-0">{progress.done}/{progress.total}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {open ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
          <button onClick={e => { e.stopPropagation(); setAdding(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10"><Plus size={13} /></button>
          <button onClick={e => { e.stopPropagation(); del(); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10"><Trash2 size={13} /></button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-white/5 pt-3 pl-12">
              {topic.notes && (
                <div className="mb-3 p-3 rounded-lg bg-white/3 border border-white/5">
                  <p className="text-slate-400 text-xs">{topic.notes}</p>
                </div>
              )}
              {subtopics.map(st => (
                <SubtopicCard key={st._id} subtopic={st} subjectId={subjectId} topicId={topic._id} onUpdate={onUpdate} />
              ))}
              {subtopics.length === 0 && <p className="text-slate-600 text-sm mb-2">No subtopics yet</p>}
              <button onClick={() => setAdding(true)}
                className="mt-1 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1.5 font-semibold">
                <Plus size={14} /> Add Subtopic
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {adding && <Modal title={`Add Subtopic in "${topic.name}"`} onClose={() => setAdding(false)} onSave={addSubtopic} />}
      </AnimatePresence>
    </div>
  );
}

/* ─── Subject Card ─── */
function SubjectCard({ subject, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mastery = calcSubjectMastery(subject);
  const topics = subject.topics || [];
  const completedTopics = topics.filter(t => t.completed).length;

  const addTopic = async (name, date, notes) => {
    try {
      const { data } = await API.post(`/subjects/${subject._id}/topics`, {
        topicName: name,
        deadline: date,
        notes: notes || ''
      });
      toast.success('Topic added!'); onUpdate(data.subjects);
    } catch { toast.error('Failed to add topic'); } finally { setAddingTopic(false); }
  };

  const renameSubject = async (name) => {
    try {
      const { data } = await API.patch(`/subjects/${subject._id}`, { name });
      toast.success('Renamed!'); onUpdate(data.subjects); setEditing(false);
    } catch { toast.error('Failed to rename'); }
  };

  const del = async (e) => {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); return; }
    setConfirmDelete(false);
    try {
      const { data } = await API.delete(`/subjects/${subject._id}`);
      toast.success('Subject deleted! 🗑️');
      onUpdate(data.subjects);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete subject');
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl border border-white/8 cyber-card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <BookOpen size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-lg leading-tight truncate">{subject.name}</h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-xs font-bold ${mastery >= 80 ? 'text-emerald-400' : mastery >= 50 ? 'text-blue-400' : 'text-slate-400'}`}>
                  {mastery}% Mastery
                </span>
                <span className="text-slate-600 text-xs">{completedTopics}/{topics.length} topics done</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0 items-center">
            <button onClick={e => { e.stopPropagation(); setEditing(true); }} className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all"><Edit2 size={14} /></button>
            <button onClick={del}
              className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all ${
                confirmDelete
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-slate-400 hover:text-red-400 hover:bg-red-400/10'
              }`}>
              {confirmDelete ? '⚠ Confirm?' : <Trash2 size={14} />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-4">
          <motion.div className={`h-full rounded-full ${mastery >= 80 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
            initial={{ width: 0 }} animate={{ width: `${mastery}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
        </div>

        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {topics.length} Topic{topics.length !== 1 ? 's' : ''}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 border-t border-white/5 pt-4">
              {topics.map(t => <TopicCard key={t._id} topic={t} subjectId={subject._id} onUpdate={onUpdate} />)}
              {topics.length === 0 && <p className="text-slate-500 text-sm mb-3">No topics yet. Add your first one!</p>}
              <button onClick={() => setAddingTopic(true)}
                className="w-full py-2.5 border border-dashed border-blue-500/40 rounded-xl text-blue-400 text-sm font-semibold hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2">
                <Plus size={14} /> Add Topic with Deadline
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {addingTopic && <Modal title={`Add Topic to "${subject.name}"`} showDate showNotes onClose={() => setAddingTopic(false)} onSave={addTopic} />}
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

  /* Single state updater used by all child mutations */
  const handleUpdate = (newSubjects) => setSubjects(newSubjects);

  const addSubject = async (name) => {
    try {
      const { data } = await API.post('/subjects', { subjectName: name });
      toast.success('Subject created! 🎉');
      setSubjects(data.subjects);
    } catch { toast.error('Failed to create subject'); }
    finally { setShowModal(false); }
  };

  const totalMastery = subjects.length > 0
    ? Math.round(subjects.reduce((a, s) => a + calcSubjectMastery(s), 0) / subjects.length)
    : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">My Subjects</h1>
          <p className="text-slate-400 text-sm mt-1">
            {subjects.length} subject{subjects.length !== 1 ? 's' : ''} · Overall mastery:
            <span className={`font-bold ml-1 ${totalMastery >= 80 ? 'text-emerald-400' : totalMastery >= 50 ? 'text-blue-400' : 'text-slate-300'}`}>{totalMastery}%</span>
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowModal(true)}
          className="btn-neon px-5 py-2.5 rounded-xl text-white font-bold flex items-center gap-2">
          <Plus size={18} /> Create Subject
        </motion.button>
      </div>

      {subjects.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-white/5">
          <BookOpen size={52} className="text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-bold text-xl mb-2">No subjects yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Create your first subject to start organizing your study plan with topics, subtopics, and tasks.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-neon px-6 py-3 rounded-xl text-white font-bold">
            + Create First Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {subjects.map(sub => (
            <SubjectCard key={sub._id} subject={sub} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && <Modal title="Create New Subject" onClose={() => setShowModal(false)} onSave={addSubject} />}
      </AnimatePresence>
    </div>
  );
}
