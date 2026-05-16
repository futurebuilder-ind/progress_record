import { motion } from 'framer-motion';
import { FileText, Upload, Search, Trash2, Eye, File, Image } from 'lucide-react';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const SAMPLE_NOTES = [
  { _id: '1', name: 'Thermodynamics Notes.pdf', type: 'pdf', size: '2.4 MB', date: '2026-05-10' },
  { _id: '2', name: 'Organic Chemistry Diagram.png', type: 'image', size: '1.1 MB', date: '2026-05-12' },
  { _id: '3', name: 'GATE Formulas Sheet.pdf', type: 'pdf', size: '800 KB', date: '2026-05-15' },
];

export default function Notes() {
  const [notes, setNotes] = useState(SAMPLE_NOTES);
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const handleFiles = (files) => {
    const newNotes = Array.from(files).map(f => ({
      _id: Date.now() + f.name,
      name: f.name,
      type: f.type.includes('image') ? 'image' : 'pdf',
      size: (f.size / 1024 / 1024).toFixed(1) + ' MB',
      date: new Date().toISOString().split('T')[0],
    }));
    setNotes(n => [...n, ...newNotes]);
    toast.success(`${files.length} file(s) uploaded!`);
  };

  const filtered = notes.filter(n => n.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Notes Vault</h1>
          <p className="text-slate-400 text-sm mt-1">Store and manage your study materials</p>
        </div>
        <button onClick={() => fileRef.current.click()} className="btn-neon px-5 py-2.5 rounded-xl text-white font-bold flex items-center gap-2">
          <Upload size={18}/> Upload File
        </button>
        <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx" className="hidden"
          onChange={e => handleFiles(e.target.files)}/>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${dragging ? 'border-blue-400 bg-blue-400/5' : 'border-white/10 hover:border-white/20'}`}
        onClick={() => fileRef.current.click()}>
        <Upload size={40} className="text-slate-600 mx-auto mb-3"/>
        <p className="text-white font-semibold">Drag & drop files here</p>
        <p className="text-slate-500 text-sm mt-1">Supports PDF, PNG, JPG, DOCX</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..."
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"/>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((note, i) => (
          <motion.div key={note._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition-all group cyber-card">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${note.type === 'pdf' ? 'bg-red-500/20 border border-red-500/30' : 'bg-blue-500/20 border border-blue-500/30'}`}>
                {note.type === 'pdf' ? <File size={22} className="text-red-400"/> : <Image size={22} className="text-blue-400"/>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all"><Eye size={14}/></button>
                <button onClick={() => { setNotes(n => n.filter(x => x._id !== note._id)); toast.success('Deleted'); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"><Trash2 size={14}/></button>
              </div>
            </div>
            <p className="text-white font-semibold text-sm mb-1 truncate">{note.name}</p>
            <p className="text-slate-500 text-xs">{note.size} · {note.date}</p>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <FileText size={40} className="mx-auto mb-3 opacity-30"/>
          <p>No notes found</p>
        </div>
      )}
    </div>
  );
}
