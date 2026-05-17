const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User     = require("./models/User");
const Goal     = require("./models/Goal");
const Session  = require("./models/Session");
const Feedback = require("./models/Feedback");
const Note     = require("./models/Note");

const app = express();

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://progress-record-backend.onrender.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
}));
app.use(express.json({ limit: '10mb' }));

/* ── DB ── */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

mongoose.connection.on('error', err => console.error('MongoDB runtime error:', err));

/* ── JWT MIDDLEWARE ── */
const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET || "progress_secret_key");
    next();
  } catch { res.status(401).json({ message: "Invalid token" }); }
};

/* ════════════════════════════════
   AUTH
════════════════════════════════ */
app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password, examType } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: "All fields required" });
    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), password: hashed, exam: examType || "Other" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || "progress_secret_key", { expiresIn: "30d" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, examType: user.exam } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || "progress_secret_key", { expiresIn: "30d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, examType: user.exam } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* ════════════════════════════════
   SUBJECTS  (JWT protected)
════════════════════════════════ */
app.get("/subjects", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ subjects: user.subjects || [] });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post("/subjects", auth, async (req, res) => {
  try {
    const { subjectName } = req.body;
    if (!subjectName?.trim()) return res.status(400).json({ message: "Name required" });
    const user = await User.findById(req.user.id);
    user.subjects.push({ name: subjectName.trim(), topics: [] });
    await user.save();
    res.json({ subjects: user.subjects });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.patch("/subjects/:subjectId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const sub = user.subjects.id(req.params.subjectId);
    if (!sub) return res.status(404).json({ message: "Subject not found" });
    sub.name = req.body.name.trim();
    await user.save();
    res.json({ subjects: user.subjects });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete("/subjects/:subjectId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.subjects = user.subjects.filter(s => s._id.toString() !== req.params.subjectId);
    await user.save();
    res.json({ subjects: user.subjects });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* ── TOPICS ── */
app.post("/subjects/:subjectId/topics", auth, async (req, res) => {
  try {
    const { topicName, deadline, notes } = req.body;
    if (!topicName?.trim()) return res.status(400).json({ message: "Name required" });
    const user = await User.findById(req.user.id);
    const sub = user.subjects.id(req.params.subjectId);
    if (!sub) return res.status(404).json({ message: "Subject not found" });
    sub.topics.push({
      name: topicName.trim(),
      deadline: deadline ? new Date(deadline) : undefined,
      notes: notes || '',
      subtopics: []
    });
    await user.save();
    res.json({ subjects: user.subjects });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.patch("/subjects/:subjectId/topics/:topicId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const topic = user.subjects.id(req.params.subjectId).topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ message: "Topic not found" });
    if (req.body.name !== undefined) topic.name = req.body.name.trim();
    if (req.body.notes !== undefined) topic.notes = req.body.notes;
    if (req.body.deadline !== undefined) topic.deadline = req.body.deadline ? new Date(req.body.deadline) : null;
    if (req.body.completed !== undefined) {
      topic.completed = req.body.completed;
      if (req.body.completed && !topic.completedAt) {
        topic.completedAt = new Date();
      } else if (!req.body.completed) {
        topic.completedAt = null;
      }
    }
    await user.save();
    res.json({ subjects: user.subjects });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete("/subjects/:subjectId/topics/:topicId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const sub = user.subjects.id(req.params.subjectId);
    sub.topics = sub.topics.filter(t => t._id.toString() !== req.params.topicId);
    await user.save();
    res.json({ subjects: user.subjects });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* ── SUBTOPICS ── */
app.post("/subjects/:subjectId/topics/:topicId/subtopics", auth, async (req, res) => {
  try {
    const { subtopicName } = req.body;
    if (!subtopicName?.trim()) return res.status(400).json({ message: "Name required" });
    const user = await User.findById(req.user.id);
    const topic = user.subjects.id(req.params.subjectId).topics.id(req.params.topicId);
    topic.subtopics.push({ name: subtopicName.trim(), tasks: [] });
    await user.save();
    res.json({ subjects: user.subjects });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* PATCH subtopic — now supports name, completed, deadline, comment */
app.patch("/subjects/:subjectId/topics/:topicId/subtopics/:subtopicId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const sub = user.subjects.id(req.params.subjectId)
                             .topics.id(req.params.topicId)
                             .subtopics.id(req.params.subtopicId);
    if (!sub) return res.status(404).json({ message: "Subtopic not found" });
    if (req.body.name      !== undefined) sub.name      = req.body.name.trim();
    if (req.body.completed !== undefined) sub.completed  = req.body.completed;
    if (req.body.deadline  !== undefined) sub.deadline   = req.body.deadline ? new Date(req.body.deadline) : null;
    if (req.body.comment   !== undefined) sub.comment    = req.body.comment;
    await user.save();
    res.json({ subjects: user.subjects });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete("/subjects/:subjectId/topics/:topicId/subtopics/:subtopicId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const topic = user.subjects.id(req.params.subjectId).topics.id(req.params.topicId);
    topic.subtopics = topic.subtopics.filter(s => s._id.toString() !== req.params.subtopicId);
    await user.save();
    res.json({ subjects: user.subjects });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* ── TASKS (Level 4) ── */
app.post("/subjects/:subjectId/topics/:topicId/subtopics/:subtopicId/tasks", auth, async (req, res) => {
  try {
    const { taskName } = req.body;
    if (!taskName?.trim()) return res.status(400).json({ message: "Name required" });
    const user = await User.findById(req.user.id);
    const subtopic = user.subjects.id(req.params.subjectId)
                                  .topics.id(req.params.topicId)
                                  .subtopics.id(req.params.subtopicId);
    subtopic.tasks.push({ name: taskName.trim() });
    await user.save();
    res.json({ subjects: user.subjects });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.patch("/subjects/:subjectId/topics/:topicId/subtopics/:subtopicId/tasks/:taskId/toggle", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { subjectId, topicId, subtopicId, taskId } = req.params;
    const subtopic = user.subjects.id(subjectId).topics.id(topicId).subtopics.id(subtopicId);
    const task = subtopic.tasks.id(taskId);
    task.completed = !task.completed;

    if (subtopic.tasks.length > 0) {
      subtopic.completed = subtopic.tasks.every(t => t.completed);
    }

    const topic = user.subjects.id(subjectId).topics.id(topicId);
    if (topic.subtopics.length > 0) {
      const allSubtopicsDone = topic.subtopics.every(s => s.completed);
      topic.completed = allSubtopicsDone;
      if (allSubtopicsDone && !topic.completedAt) {
        topic.completedAt = new Date();
      } else if (!allSubtopicsDone) {
        topic.completedAt = null;
      }
    }

    await user.save();
    res.json({ subjects: user.subjects });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete("/subjects/:subjectId/topics/:topicId/subtopics/:subtopicId/tasks/:taskId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const subtopic = user.subjects.id(req.params.subjectId)
                                  .topics.id(req.params.topicId)
                                  .subtopics.id(req.params.subtopicId);
    subtopic.tasks = subtopic.tasks.filter(t => t._id.toString() !== req.params.taskId);
    await user.save();
    res.json({ subjects: user.subjects });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* ════════════════════════════════
   GOALS
════════════════════════════════ */
app.get("/goals", auth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ goals });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post("/goals", auth, async (req, res) => {
  try {
    const { title, category, target, deadline } = req.body;
    if (!title?.trim() || !target) return res.status(400).json({ message: "Title and target required" });
    const goal = await Goal.create({
      userId: req.user.id,
      title: title.trim(),
      category,
      target: Math.max(1, Number(target)),
      deadline: deadline ? new Date(deadline) : undefined
    });
    res.status(201).json({ goal });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.patch("/goals/:id", auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const { title, category, target, deadline, delta, current, completed } = req.body;
    if (title     !== undefined) goal.title    = title.trim();
    if (category  !== undefined) goal.category = category;
    if (target    !== undefined) goal.target   = Math.max(1, Number(target));
    if (deadline  !== undefined) goal.deadline = deadline ? new Date(deadline) : null;
    if (delta     !== undefined) goal.current  = Math.max(0, Math.min(goal.target, goal.current + Number(delta)));
    if (current   !== undefined) goal.current  = Math.max(0, Math.min(goal.target, Number(current)));
    if (completed !== undefined) {
      goal.completed = completed;
      if (completed) { goal.current = goal.target; goal.completedAt = new Date(); }
    }

    if (goal.current >= goal.target && !goal.completed) {
      goal.completed = true;
      goal.completedAt = new Date();
    }

    await goal.save();
    res.json({ goal });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete("/goals/:id", auth, async (req, res) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* ════════════════════════════════
   SESSIONS (Pomodoro)
════════════════════════════════ */
app.post("/sessions", auth, async (req, res) => {
  try {
    const { type, durationMinutes } = req.body;
    const session = await Session.create({
      userId: req.user.id,
      type: type || 'focus',
      durationMinutes: Number(durationMinutes) || 25
    });
    res.status(201).json({ session });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get("/sessions/stats", auth, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id, type: 'focus' }).lean();
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todaySessions = sessions.filter(s => new Date(s.date) >= todayStart);
    res.json({
      totalSessions: sessions.length,
      todaySessions: todaySessions.length,
      totalMinutes: sessions.reduce((a, s) => a + s.durationMinutes, 0),
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* ════════════════════════════════
   NOTES VAULT (text-based, MongoDB)
════════════════════════════════ */
app.get("/notes", auth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ pinned: -1, updatedAt: -1 });
    res.json({ notes });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post("/notes", auth, async (req, res) => {
  try {
    const { title, body, tags, color } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: "Title required" });
    const note = await Note.create({
      userId: req.user.id,
      title: title.trim(),
      body: body || '',
      tags: tags || [],
      color: color || '#1e293b',
    });
    res.status(201).json({ note });
  } catch (e) {
    console.error("Notes create error:", e);
    res.status(500).json({ message: e.message });
  }
});

app.patch("/notes/:id", auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) return res.status(404).json({ message: "Note not found" });
    const { title, body, tags, color, pinned } = req.body;
    if (title  !== undefined) note.title  = title.trim();
    if (body   !== undefined) note.body   = body;
    if (tags   !== undefined) note.tags   = tags;
    if (color  !== undefined) note.color  = color;
    if (pinned !== undefined) note.pinned = pinned;
    await note.save();
    res.json({ note });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete("/notes/:id", auth, async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* ════════════════════════════════
   FEEDBACK
════════════════════════════════ */
/* Submit feedback (authenticated users) */
app.post("/feedback", auth, async (req, res) => {
  try {
    const { message, rating } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: "Message required" });
    const user = await User.findById(req.user.id).lean();
    
    // Safely create feedback even if user fields are missing
    const fb = await Feedback.create({
      userId:  req.user.id,
      name:    user?.name || 'Anonymous Operator',
      email:   user?.email || 'unknown@system.local',
      message: message.trim(),
      rating:  rating || 5,
    });
    res.status(201).json({ feedback: fb });
  } catch (e) { 
    console.error("Feedback error:", e);
    res.status(500).json({ message: e.message || "Failed to submit feedback" }); 
  }
});

/* View all feedback (admin) */
app.get("/feedback", async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'avee123@' && adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json({ feedbacks });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* Delete feedback (admin) */
app.delete("/feedback/:id", async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'avee123@' && adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* Admin Stats Route */
app.get("/admin/stats", async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'avee123@' && adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const totalUsers = await User.countDocuments();
    const totalFeedback = await Feedback.countDocuments();
    const sessions = await Session.find({ type: 'focus' }).lean();
    const totalFocusMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    
    // Get all users with activity details
    const users = await User.find().select('-password').lean();
    let totalTasksCompleted = 0;
    
    const userList = await Promise.all(users.map(async (user) => {
      let userTasks = 0, userCompleted = 0, userTopics = 0, userCompletedTopics = 0;
      (user.subjects || []).forEach(sub => {
        (sub.topics || []).forEach(t => {
          userTopics++;
          if (t.completed) userCompletedTopics++;
          (t.subtopics || []).forEach(st => {
            userTasks++;
            if (st.completed) userCompleted++;
            (st.tasks || []).forEach(task => {
              userTasks++;
              if (task.completed) { userCompleted++; totalTasksCompleted++; }
            });
          });
        });
      });
      
      const userSessions = sessions.filter(s => s.userId?.toString() === user._id.toString());
      const userFocusMinutes = userSessions.reduce((a, s) => a + s.durationMinutes, 0);
      const lastSession = userSessions.length > 0 
        ? userSessions.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date 
        : null;

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        examType: user.exam || 'Other',
        subjects: (user.subjects || []).length,
        topics: userTopics,
        completedTopics: userCompletedTopics,
        tasks: userTasks,
        completedTasks: userCompleted,
        focusSessions: userSessions.length,
        focusMinutes: userFocusMinutes,
        lastActive: lastSession || user.updatedAt || user.createdAt,
        joinedAt: user.createdAt,
      };
    }));

    res.json({ 
      totalUsers, 
      totalFeedback, 
      totalFocusSessions: sessions.length, 
      totalFocusMinutes, 
      totalTasksCompleted,
      userList,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* ════════════════════════════════
   ANALYTICS (Real Data)
════════════════════════════════ */
app.get("/analytics", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).lean();
    const totalActiveUsers = await User.countDocuments();

    let totalTopics = 0, completedTopics = 0, totalTasks = 0, completedTasks = 0;
    const subjectMastery = [];

    (user.subjects || []).forEach(sub => {
      let subCompletedWeight = 0, subTotalWeight = 0;
      (sub.topics || []).forEach(t => {
        totalTopics++;
        
        // Count topic itself as a task entity for execution metrics
        totalTasks++;
        if (t.completed) completedTasks++;

        const subtopics = t.subtopics || [];

        if (subtopics.length === 0) {
          subTotalWeight++;
          if (t.completed) { completedTopics++; subCompletedWeight++; }
        } else {
          let topicWeight = 0, topicDone = 0;
          subtopics.forEach(st => {
            // Count subtopic itself
            totalTasks++;
            if (st.completed) completedTasks++;

            const tasks = st.tasks || [];
            if (tasks.length === 0) {
              topicWeight++;
              if (st.completed) topicDone++;
            } else {
              tasks.forEach(task => {
                totalTasks++;
                if (task.completed) completedTasks++;
              });
              const tasksDone = tasks.filter(t => t.completed).length;
              topicWeight += tasks.length;
              topicDone += tasksDone;
            }
          });
          const topicMastery = topicWeight > 0 ? topicDone / topicWeight : (t.completed ? 1 : 0);
          if (topicMastery >= 1 || t.completed) completedTopics++;
          subTotalWeight++;
          subCompletedWeight += topicMastery;
        }
      });
      const mastery = subTotalWeight > 0 ? Math.round((subCompletedWeight / subTotalWeight) * 100) : 0;
      subjectMastery.push({ name: sub.name, mastery });
    });

    const goals = await Goal.find({ userId }).lean();
    const completedGoals = goals.filter(g => g.completed).length;
    const avgGoalPct = goals.length > 0
      ? Math.round(goals.reduce((acc, g) => acc + Math.min(100, (g.current / Math.max(1, g.target)) * 100), 0) / goals.length)
      : 0;

    const sessions = await Session.find({ userId }).lean();
    const focusSessions = sessions.filter(s => s.type === 'focus');
    const totalFocusMinutes = focusSessions.reduce((a, s) => a + s.durationMinutes, 0);

    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const mins = sessions
        .filter(s => s.type === 'focus' && new Date(s.date) >= dayStart && new Date(s.date) < dayEnd)
        .reduce((a, s) => a + s.durationMinutes, 0);
      last7.push({ day: dayStr, hours: Math.round((mins / 60) * 10) / 10 });
    }

    const completionTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      let count = 0;
      (user.subjects || []).forEach(sub => {
        (sub.topics || []).forEach(t => {
          if (t.completedAt && new Date(t.completedAt) >= dayStart && new Date(t.completedAt) < dayEnd) count++;
        });
      });
      completionTrend.push({ day: dayStr, topics: count });
    }

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayFocus = focusSessions.filter(s => new Date(s.date) >= todayStart);

    // Calculate Consistency (Daily Streak of focus sessions)
    let consistency = 0;
    if (focusSessions.length > 0) {
      // Get unique dates sorted descending
      const uniqueDates = [...new Set(focusSessions.map(s => {
        const d = new Date(s.date);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      }))].sort((a, b) => b - a);

      let currentCheckTime = new Date(todayStart).getTime();
      
      // If user hasn't studied today, check if they studied yesterday. 
      // If not yesterday either, streak is 0.
      if (!uniqueDates.includes(currentCheckTime)) {
        currentCheckTime -= 86400000; // yesterday
      }

      if (uniqueDates.includes(currentCheckTime)) {
        consistency = 1;
        let nextExpected = currentCheckTime - 86400000;
        for (let i = uniqueDates.indexOf(currentCheckTime) + 1; i < uniqueDates.length; i++) {
          if (uniqueDates[i] === nextExpected) {
            consistency++;
            nextExpected -= 86400000;
          } else {
            break;
          }
        }
      }
    }

    const overallMastery = subjectMastery.length > 0
      ? Math.round(subjectMastery.reduce((a, s) => a + s.mastery, 0) / subjectMastery.length)
      : 0;
    const productivityScore = Math.round(consistency * 0.4 + overallMastery * 0.4 + avgGoalPct * 0.2);

    res.json({
      overallMastery,
      totalTopics, completedTopics,
      totalTasks, completedTasks,
      totalFocusMinutes,
      totalFocusSessions: focusSessions.length,
      todayFocusSessions: todayFocus.length,
      totalActiveUsers,
      subjectMastery,
      weeklyData: last7,
      completionTrend,
      goals: { total: goals.length, completed: completedGoals, avgProgress: avgGoalPct },
      consistency,
      productivityScore,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* ── Settings (Theme) ── */
app.put("/settings", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.themeSettings = { ...user.themeSettings, ...req.body };
    await user.save();
    res.json({ themeSettings: user.themeSettings });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* ── AI Productivity Brain ── */
app.get("/ai/insights", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).lean();
    const sessions = await Session.find({ userId }).lean();
    const focusSessions = sessions.filter(s => s.type === 'focus');
    const goals = await Goal.find({ userId }).lean();

    const insights = [];
    const now = new Date();

    // 1. Best study hours analysis
    const hourBuckets = {};
    focusSessions.forEach(s => {
      const hr = new Date(s.date).getHours();
      hourBuckets[hr] = (hourBuckets[hr] || 0) + s.durationMinutes;
    });
    const bestHour = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1])[0];
    if (bestHour) {
      const hr = parseInt(bestHour[0]);
      const period = hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
      insights.push({
        type: 'best_time',
        icon: '⏰',
        title: 'Peak Performance Window',
        message: `You're most productive in the ${period} around ${hr > 12 ? hr - 12 : hr}${hr >= 12 ? 'PM' : 'AM'}. Schedule important study sessions during this time.`,
        priority: 'high'
      });
    }

    // 2. Weak subjects
    const subjectMastery = [];
    (user.subjects || []).forEach(sub => {
      let total = 0, done = 0;
      (sub.topics || []).forEach(t => {
        total++;
        if (t.completed) done++;
        (t.subtopics || []).forEach(st => {
          total++;
          if (st.completed) done++;
        });
      });
      if (total > 0) subjectMastery.push({ name: sub.name, pct: Math.round(done / total * 100), total, done });
    });
    const weakest = subjectMastery.filter(s => s.pct < 40).sort((a, b) => a.pct - b.pct);
    if (weakest.length > 0) {
      insights.push({
        type: 'weak_subject',
        icon: '📚',
        title: 'Needs Attention',
        message: `${weakest[0].name} is at ${weakest[0].pct}% completion. Spend extra time here to improve your overall mastery.`,
        priority: 'high'
      });
    }

    // 3. Burnout detection
    const last7Days = focusSessions.filter(s => (now - new Date(s.date)) < 7 * 86400000);
    const totalMinsLast7 = last7Days.reduce((a, s) => a + s.durationMinutes, 0);
    const avgDailyMins = Math.round(totalMinsLast7 / 7);
    if (avgDailyMins > 300) {
      insights.push({
        type: 'burnout',
        icon: '🔥',
        title: 'Burnout Risk Detected',
        message: `You've averaged ${avgDailyMins} min/day this week (${Math.round(totalMinsLast7 / 60)}h total). Take breaks to maintain long-term performance.`,
        priority: 'warning'
      });
    } else if (avgDailyMins > 0) {
      insights.push({
        type: 'pace',
        icon: '📊',
        title: 'Study Pace',
        message: `You're averaging ${avgDailyMins} min/day this week. ${avgDailyMins < 60 ? 'Try to increase to 1+ hour daily for better results.' : 'Great pace! Stay consistent.'}`,
        priority: 'info'
      });
    }

    // 4. Streak encouragement
    let streak = 0;
    const uniqueDates = [...new Set(focusSessions.map(s => {
      const d = new Date(s.date);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }))].sort((a, b) => b - a);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let check = uniqueDates.includes(todayStart) ? todayStart : todayStart - 86400000;
    if (uniqueDates.includes(check)) {
      streak = 1;
      let next = check - 86400000;
      for (const d of uniqueDates) {
        if (d === next) { streak++; next -= 86400000; }
      }
    }
    if (streak >= 3) {
      insights.push({
        type: 'streak',
        icon: '🔥',
        title: `${streak}-Day Streak!`,
        message: `You've been consistent for ${streak} days. Don't break the chain — keep the momentum going!`,
        priority: 'success'
      });
    } else if (streak === 0 && focusSessions.length > 0) {
      insights.push({
        type: 'streak_broken',
        icon: '⚡',
        title: 'Restart Your Streak',
        message: 'Your study streak has broken. Start a focus session today to get back on track.',
        priority: 'warning'
      });
    }

    // 5. Focus efficiency
    const totalFocusMinutes = focusSessions.reduce((a, s) => a + s.durationMinutes, 0);
    let totalCompleted = 0, totalItems = 0;
    (user.subjects || []).forEach(sub => {
      (sub.topics || []).forEach(t => {
        totalItems++;
        if (t.completed) totalCompleted++;
        (t.subtopics || []).forEach(st => {
          totalItems++;
          if (st.completed) totalCompleted++;
        });
      });
    });
    const efficiencyScore = totalFocusMinutes > 0 && totalItems > 0
      ? Math.min(100, Math.round((totalCompleted / totalItems) * 100 * (focusSessions.length / Math.max(1, totalItems)) * 2))
      : 0;
    insights.push({
      type: 'efficiency',
      icon: '⚙️',
      title: 'Focus Efficiency',
      message: `Your efficiency score is ${efficiencyScore}/100. ${efficiencyScore >= 70 ? 'Excellent output per session!' : 'Try working on fewer topics per session for better focus.'}`,
      priority: efficiencyScore >= 70 ? 'success' : 'info'
    });

    // 6. Goal progress
    const activeGoals = goals.filter(g => !g.completed);
    const behindGoals = activeGoals.filter(g => {
      const pct = g.target > 0 ? (g.current / g.target) * 100 : 0;
      return pct < 50;
    });
    if (behindGoals.length > 0) {
      insights.push({
        type: 'goals',
        icon: '🎯',
        title: 'Goals Behind Schedule',
        message: `${behindGoals.length} goal${behindGoals.length > 1 ? 's are' : ' is'} below 50% progress. Focus on these to stay on track.`,
        priority: 'warning'
      });
    }

    // 7. Daily tip
    const tips = [
      'Use the Pomodoro technique: 25 min focus, 5 min break.',
      'Review completed topics weekly to strengthen long-term memory.',
      'Start each day by reviewing what you learned yesterday.',
      'Break large topics into smaller subtasks for steady progress.',
      'Teach what you learn — it\'s the fastest way to master it.',
      'Track your weak areas and allocate extra time for them.',
      'Stay hydrated and take regular breaks for peak performance.',
    ];
    insights.push({
      type: 'tip',
      icon: '💡',
      title: 'Daily Tip',
      message: tips[now.getDate() % tips.length],
      priority: 'info'
    });

    res.json({
      insights: insights.slice(0, 6),
      stats: {
        efficiencyScore,
        avgDailyMinutes: avgDailyMins || 0,
        streak,
        totalFocusHours: Math.round(totalFocusMinutes / 60 * 10) / 10,
        bestHour: bestHour ? parseInt(bestHour[0]) : null,
        weakSubject: weakest[0]?.name || null,
      }
    });
  } catch (e) {
    console.error('AI insights error:', e);
    res.status(500).json({ message: e.message });
  }
});

/* ── Health check ── */
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.listen(process.env.PORT || 5000, () =>
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
);