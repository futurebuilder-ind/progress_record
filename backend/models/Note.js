const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:  { type: String, required: true },
  body:   { type: String, default: '' },
  tags:   [{ type: String }],
  color:  { type: String, default: '#1e293b' },
  pinned: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);
