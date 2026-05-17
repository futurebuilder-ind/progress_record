import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Trash2, X, Save, Search, Pin, PinOff, Tag, UploadCloud } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const NOTE_COLORS = [
  { label: 'Default', value: '#0A0A0A' },
  { label: 'Navy',    value: '#0C1527' },
  { label: 'Purple',  value: '#150C27' },
  { label: 'Teal',    value: '#0C1F1F' },
  { label: 'Warm',    value: '#1A1008' },
];

function NoteModal({ note, onClose, onSave }) {
  const [title, setTitle] = useState(note?.title || '');
  const [body, setBody] = useState(note?.body || '');
  const [tags, setTags] = useState((note?.tags || []).join(', '));
  const [color, setColor] = useState(note?.color || '#0A0A0A');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      await onSave({ title: title.trim(), body, tags: tags.split(',').map(t => t.trim()).filter(Boolean), color });
      onClose();
    } catch { toast.error('Save failed'); } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        onClick={e => e.stopPropagation()}
        className="rounded-2xl w-full max-w-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col"
        style={{ background: color, maxHeight: '85vh' }}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title..."
            className="flex-1 bg-transparent text-white font-semibold text-lg placeholder-[var(--text-quaternary)] focus:outline-none mr-4" />
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface)] transition-all">
            <X size={16} />
          </button>
        </div>
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your notes here..."
          className="flex-1 p-5 bg-transparent text-[var(--text-secondary)] placeholder-[var(--text-quaternary)] resize-none focus:outline-none text-sm leading-relaxed" style={{ minHeight: 200 }} />
        <div className="p-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Tag size={12} className="text-[var(--text-quaternary)]" />
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="tags, comma separated"
              className="bg-transparent text-[var(--text-secondary)] text-xs focus:outline-none flex-1 placeholder-[var(--text-quaternary)]" />
          </div>
          <div className="flex items-center gap-2">
            {NOTE_COLORS.map(c => (
              <button key={c.value} onClick={() => setColor(c.value)} title={c.label}
                className={`w-5 h-5 rounded-full border-2 transition-all ${color === c.value ? 'border-white scale-110' : 'border-transparent hover:border-[var(--border-hover)]'}`}
                style={{ background: c.value }} />
            ))}
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
              className="ml-2 btn-primary py-2 px-4 text-xs">
              {saving ? <div className="w-3 h-3 border border-black/20 border-t-black rounded-full animate-spin" /> : <><Save size={12} /> Save</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NoteCard({ note, onEdit, onDelete, onPin, deleting }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl p-5 border border-[var(--border)] hover:border-[var(--border-hover)] transition-all group relative overflow-hidden cursor-pointer"
      style={{ background: note.color || '#0A0A0A' }} onClick={() => onEdit(note)}>
      {note.pinned && <div className="absolute top-3 right-3 text-[var(--accent)] opacity-60"><Pin size={11} /></div>}
      <h3 className="text-white font-medium text-sm mb-2 pr-6 truncate">{note.title}</h3>
      <p className="text-[var(--text-secondary)] text-xs leading-relaxed line-clamp-4">
        {note.body || <span className="italic text-[var(--text-quaternary)]">No content</span>}
      </p>
      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] bg-[var(--surface)] text-[var(--text-secondary)] px-2 py-0.5 rounded-md">#{tag}</span>
          ))}
        </div>
      )}
      <p className="text-[var(--text-quaternary)] text-[10px] mt-3">
        {new Date(note.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
      <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={e => { e.stopPropagation(); onPin(note); }}
          className="p-1.5 rounded-md bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-all">
          {note.pinned ? <PinOff size={11} /> : <Pin size={11} />}
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(note._id); }}
          className={`p-1.5 rounded-md transition-all ${deleting === note._id ? 'bg-red-500/20 text-red-400' : 'bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-red-400'}`}>
          <Trash2 size={11} />
        </button>
      </div>
    </motion.div>
  );
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchNotes = useCallback(async () => {
    try {
      const { data } = await API.get('/notes');
      setNotes(data.notes || []);
    } catch { toast.error('Failed to load notes'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleSave = async (payload) => {
    if (editing && editing !== 'new') {
      const { data } = await API.patch(`/notes/${editing._id}`, payload);
      setNotes(n => n.map(x => x._id === data.note._id ? data.note : x));
      toast.success('Note updated');
    } else {
      const { data } = await API.post('/notes', payload);
      setNotes(n => [data.note, ...n]);
      toast.success('Note created');
    }
  };

  const handleDelete = async (id) => {
    if (deleting !== id) { setDeleting(id); setTimeout(() => setDeleting(null), 3000); return; }
    try {
      await API.delete(`/notes/${id}`);
      setNotes(n => n.filter(x => x._id !== id));
      toast.success('Note deleted');
    } catch { toast.error('Delete failed'); } finally { setDeleting(null); }
  };

  const handlePin = async (note) => {
    try {
      const { data } = await API.patch(`/notes/${note._id}`, { pinned: !note.pinned });
      setNotes(n => n.map(x => x._id === data.note._id ? data.note : x));
    } catch { toast.error('Failed'); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return; }
    const reader = new FileReader();
    reader.onload = async (event) => {
      let text = event.target.result;
      if (text.length > 500000) {
        text = text.substring(0, 500000) + '\n\n--- [Truncated] ---';
      }
      try {
        const { data } = await API.post('/notes', {
          title: file.name.replace(/\.[^/.]+$/, '') || 'Imported',
          body: text,
          tags: ['imported', file.name.split('.').pop()],
          color: '#0A0A0A'
        });
        setNotes(n => [data.note, ...n]);
        toast.success(`"${file.name}" imported`);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Import failed');
      }
    };
    reader.onerror = () => toast.error('Failed to read file');
    reader.readAsText(file);
    e.target.value = '';
  };

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.body || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );
  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  if (loading) return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="skeleton h-10 w-48"></div>
      <div className="skeleton h-11 w-full rounded-xl"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40 rounded-xl"></div>)}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-display">Notes</h1>
          <p className="text-caption mt-1">{notes.length} note{notes.length !== 1 ? 's' : ''} saved</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="btn-secondary text-xs cursor-pointer">
            <UploadCloud size={14} /> Import
            <input type="file" accept=".txt,.md,.csv,.json,.js,.py,.html,.css" className="hidden" onChange={handleFileUpload} />
          </label>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setEditing('new')} className="btn-primary text-xs">
            <Plus size={14} /> New Note
          </motion.button>
        </div>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-quaternary)]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..."
          className="input-field pl-10" />
      </div>

      {pinned.length > 0 && (
        <div>
          <p className="text-overline mb-3 flex items-center gap-1.5"><Pin size={10} /> Pinned</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinned.map(note => <NoteCard key={note._id} note={note} onEdit={setEditing} onDelete={handleDelete} onPin={handlePin} deleting={deleting} />)}
          </div>
        </div>
      )}

      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && <p className="text-overline mb-3">All Notes</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unpinned.map(note => <NoteCard key={note._id} note={note} onEdit={setEditing} onDelete={handleDelete} onPin={handlePin} deleting={deleting} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <FileText size={32} className="text-[var(--text-quaternary)] mx-auto mb-3" />
          <h3 className="text-white font-semibold text-base mb-1">{notes.length === 0 ? 'No notes yet' : 'No results'}</h3>
          <p className="text-caption text-xs mb-5">{notes.length === 0 ? 'Create your first note to get started.' : 'Try different keywords.'}</p>
          {notes.length === 0 && <button onClick={() => setEditing('new')} className="btn-primary text-xs">Create first note</button>}
        </div>
      )}

      <AnimatePresence>
        {editing && <NoteModal note={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={handleSave} />}
      </AnimatePresence>
    </motion.div>
  );
}
