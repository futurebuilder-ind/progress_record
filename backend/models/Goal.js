const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, default: 'General' },
  target: { type: Number, required: true },
  current: { type: Number, default: 0 },
  deadline: { type: Date },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
}, { timestamps: true });

GoalSchema.virtual('percentage').get(function () {
  return Math.min(100, Math.round((this.current / this.target) * 100));
});

GoalSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Goal', GoalSchema);
