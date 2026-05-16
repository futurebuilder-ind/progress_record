const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User    = require("./models/User");
const Goal    = require("./models/Goal");
const Session = require("./models/Session");

const app = express();

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://progress-record-backend.onrender.com',
  // Add your Vercel URL here once deployed, e.g.:
  // 'https://progress-record.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    // Allow any *.vercel.app preview URL
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors()); // Pre-flight for all routes
app.use(express.json());

/* ── DB ── */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

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
    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.trim().toLowerCase(), password: hashed, exam: examType || "Other" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || "progress_secret_key", { expiresIn: "30d" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, examType: user.exam } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
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

// GET
app.get("/subjects", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ subjects: user.subjects || [] });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// CREATE subject
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

// RENAME subject
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

// DELETE subject
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
      // Track when a topic is first marked complete (for trend charts)
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

app.patch("/subjects/:subjectId/topics/:topicId/subtopics/:subtopicId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const sub = user.subjects.id(req.params.subjectId)
                             .topics.id(req.params.topicId)
                             .subtopics.id(req.params.subtopicId);
    if (req.body.name !== undefined) sub.name = req.body.name.trim();
    if (req.body.completed !== undefined) sub.completed = req.body.completed;
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

    // Auto-complete subtopic when all tasks done
    if (subtopic.tasks.length > 0) {
      subtopic.completed = subtopic.tasks.every(t => t.completed);
    }

    // Auto-complete topic when all subtopics done
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
    if (title !== undefined) goal.title = title.trim();
    if (category !== undefined) goal.category = category;
    if (target !== undefined) goal.target = Math.max(1, Number(target));
    if (deadline !== undefined) goal.deadline = deadline ? new Date(deadline) : null;
    if (delta !== undefined) goal.current = Math.max(0, Math.min(goal.target, goal.current + Number(delta)));
    if (current !== undefined) goal.current = Math.max(0, Math.min(goal.target, Number(current)));
    if (completed !== undefined) {
      goal.completed = completed;
      if (completed) { goal.current = goal.target; goal.completedAt = new Date(); }
    }

    // Auto-complete when target reached
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
   ANALYTICS (Real Data)
════════════════════════════════ */
app.get("/analytics", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).lean();

    // --- Subject stats ---
    let totalTopics = 0, completedTopics = 0, totalTasks = 0, completedTasks = 0;
    const subjectMastery = [];

    (user.subjects || []).forEach(sub => {
      let subCompletedWeight = 0, subTotalWeight = 0;
      (sub.topics || []).forEach(t => {
        totalTopics++;
        const subtopics = t.subtopics || [];

        if (subtopics.length === 0) {
          // Topic with no subtopics: use its completed flag directly
          subTotalWeight++;
          if (t.completed) { completedTopics++; subCompletedWeight++; }
        } else {
          // Topic has subtopics: aggregate from subtopics
          let topicWeight = 0, topicDone = 0;
          subtopics.forEach(st => {
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

    // --- Goals ---
    const goals = await Goal.find({ userId }).lean();
    const completedGoals = goals.filter(g => g.completed).length;
    const avgGoalPct = goals.length > 0
      ? Math.round(goals.reduce((acc, g) => acc + Math.min(100, (g.current / Math.max(1, g.target)) * 100), 0) / goals.length)
      : 0;

    // --- Sessions ---
    const sessions = await Session.find({ userId }).lean();
    const focusSessions = sessions.filter(s => s.type === 'focus');
    const totalFocusMinutes = focusSessions.reduce((a, s) => a + s.durationMinutes, 0);

    // Last 7 days focus hours
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

    // Topics completed per day (last 7 days) — completion trend
    const completionTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      let count = 0;
      (user.subjects || []).forEach(sub => {
        (sub.topics || []).forEach(t => {
          if (t.completedAt && new Date(t.completedAt) >= dayStart && new Date(t.completedAt) < dayEnd) {
            count++;
          }
        });
      });
      completionTrend.push({ day: dayStr, topics: count });
    }

    // Today's sessions
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayFocus = focusSessions.filter(s => new Date(s.date) >= todayStart);

    const overallMastery = subjectMastery.length > 0
      ? Math.round(subjectMastery.reduce((a, s) => a + s.mastery, 0) / subjectMastery.length)
      : 0;
    const consistency = focusSessions.length > 0 ? Math.min(100, Math.round((focusSessions.length / 14) * 100)) : 0;

    // Productivity score: weighted blend
    const productivityScore = Math.round(
      consistency * 0.4 + overallMastery * 0.4 + avgGoalPct * 0.2
    );

    res.json({
      overallMastery,
      totalTopics, completedTopics,
      totalTasks, completedTasks,
      totalFocusMinutes,
      totalFocusSessions: focusSessions.length,
      todayFocusSessions: todayFocus.length,
      subjectMastery,
      weeklyData: last7,
      completionTrend,
      goals: { total: goals.length, completed: completedGoals, avgProgress: avgGoalPct },
      consistency,
      productivityScore,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* ── Settings ── */
app.put("/settings", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.themeSettings = { ...user.themeSettings, ...req.body };
    await user.save();
    res.json({ themeSettings: user.themeSettings });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);