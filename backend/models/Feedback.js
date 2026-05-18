const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  message:    { type: String, required: true },
  rating:     { type: Number, min: 1, max: 5, default: 5 },
  likedMost:  [{ type: String }],
  recommend:  { type: String, enum: ['Yes', 'No'], default: 'Yes' },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
