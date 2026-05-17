import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Trash2, X, Save, Search, Pin, PinOff, Tag, UploadCloud } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const NOTE_COLORS = [
  { label: 'Slate',  value: '#1e293b' },
  { label: 'Navy',   value: '#0f172a' },
  { label: 'Purple', value: '#2e1065' },
  { label: 'Teal',   value: '#042f2e' },
  { label: 'Red',    value: '#2d0f0f' },
];

function NoteModal({ note, onClose, onSave }) {
  const [title,  setTitle]  = useState(note?.title || '');
  const [body,   setBody]   = useState(note?.body  || '');
  const [tags,   setTags]   = useState((note?.tags || []).join(', '));
  const [color,  setColor]  = useState(note?.color || '#1e293b');
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
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
        onClick={e => e.stopPropagation()}
        className="rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        style={{ background: color, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title..."
            className="flex-1 bg-transparent text-white font-bold text-xl placeholder-slate-500 focus:outline-none mr-4"/>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"><X size={18}/></button>
        </div>
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your notes here..."
          className="flex-1 p-5 bg-transparent text-slate-200 placeholder-slate-600 resize-none focus:outline-none text-sm leading-relaxed" style={{ minHeight: 240 }}/>
        <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Tag size={13} className="text-slate-500"/>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="tags, comma separated"
              className="bg-transparent text-slate-400 text-xs focus:outline-none flex-1 placeholder-slate-600"/>
          </div>
          <div className="flex items-center gap-2">
            {NOTE_COLORS.map(c => (
              <button key={c.value} onClick={() => setColor(c.value)} title={c.label}
                className={`w-5 h-5 rounded-full border-2 transition-all ${color === c.value ? 'border-white scale-125' : 'border-transparent'}`}
                style={{ background: c.value }}/>
            ))}
            <button onClick={handleSave} disabled={saving}
              className="ml-2 px-4 py-1.5 btn-neon rounded-lg text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-60">
              {saving ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={13}/>} Save
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NoteCard({ note, onEdit, onDelete, onPin, deleting }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-5 border border-white/8 hover:border-white/20 transition-all group relative overflow-hidden cursor-pointer"
      style={{ background: note.color || '#1e293b' }} onClick={() => onEdit(note)}>
      {note.pinned && <div className="absolute top-3 right-3 text-yellow-400 opacity-70"><Pin size={13}/></div>}
      <h3 className="text-white font-bold text-sm mb-2 pr-6 truncate">{note.title}</h3>
      <p className="text-slate-400 text-xs leading-relaxed line-clamp-4">
        {note.body || <span className="italic text-slate-600">No content yet</span>}
      </p>
      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">#{tag}</span>
          ))}
        </div>
      )}
      <p className="text-slate-600 text-xs mt-3">
        {new Date(note.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
      <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={e => { e.stopPropagation(); onPin(note); }}
          className="p-1.5 rounded-lg bg-white/10 text-slate-400 hover:text-yellow-400 transition-all">
          {note.pinned ? <PinOff size={12}/> : <Pin size={12}/>}
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(note._id); }}
          className={`p-1.5 rounded-lg transition-all ${deleting === note._id ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-slate-400 hover:text-red-400'}`}>
          <Trash2 size={12}/>
        </button>
      </div>
    </motion.div>
  );
}

export default function Notes() {
  const [notes,    setNotes]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [editing,  setEditing]  = useState(null);
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
      toast.success('Note updated!');
    } else {
      const { data } = await API.post('/notes', payload);
      setNotes(n => [data.note, ...n]);
      toast.success('Note created! 📝');
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

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      try {
        const payload = {
          title: file.name.split('.')[0] || 'Uploaded Note',
          body: text,
          tags: ['imported'],
          color: '#1e293b'
        };
        const { data } = await API.post('/notes', payload);
        setNotes(n => [data.note, ...n]);
        toast.success(`File "${file.name}" uploaded successfully! 🚀`);
      } catch {
        toast.error('Failed to save uploaded file as note.');
      }
    };
    reader.onerror = () => toast.error('Failed to read file from system.');
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.body || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );
  const pinned   = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Notes Vault</h1>
          <p className="text-slate-400 text-sm mt-1">{notes.length} note{notes.length !== 1 ? 's' : ''} saved</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold flex items-center gap-2 hover:bg-white/10 transition-all text-sm">
            <UploadCloud size={16} /> Import File
            <input type="file" accept=".txt,.md,.csv,.json,.js,.py,.html,.css" className="hidden" onChange={handleFileUpload} />
          </label>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setEditing('new')}
            className="btn-neon px-5 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 text-sm">
            <Plus size={16}/> New Note
          </motion.button>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes, tags..."
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"/>
      </div>

      {pinned.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Pin size={11}/> Pinned</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinned.map(note => <NoteCard key={note._id} note={note} onEdit={setEditing} onDelete={handleDelete} onPin={handlePin} deleting={deleting}/>)}
          </div>
        </div>
      )}

      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">All Notes</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpinned.map(note => <NoteCard key={note._id} note={note} onEdit={setEditing} onDelete={handleDelete} onPin={handlePin} deleting={deleting}/>)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <FileText size={48} className="text-slate-700 mx-auto mb-4"/>
          <h3 className="text-white font-bold text-lg mb-2">{notes.length === 0 ? 'No notes yet' : 'No results found'}</h3>
          <p className="text-slate-500 text-sm mb-5">{notes.length === 0 ? 'Create your first note to get started' : 'Try different keywords'}</p>
          {notes.length === 0 && <button onClick={() => setEditing('new')} className="btn-neon px-6 py-2.5 rounded-xl text-white font-bold">+ Create First Note</button>}
        </div>
      )}

      <AnimatePresence>
        {editing && <NoteModal note={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={handleSave}/>}
      </AnimatePresence>
    </div>
  );
}
