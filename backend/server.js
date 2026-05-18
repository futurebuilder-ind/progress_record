const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const nodemailer = require("nodemailer");

const User     = require("./models/User");
const Goal     = require("./models/Goal");
const Session  = require("./models/Session");
const Feedback = require("./models/Feedback");
const Note     = require("./models/Note");
const Otp      = require("./models/Otp");

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
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, examType: user.exam, profilePic: user.profilePic || '' } });
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
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, examType: user.exam, profilePic: user.profilePic || '' } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Verification email sender helper
const sendVerificationEmail = async (email, code) => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  console.log(`\x1b[36m[OTP SERVICE] Generated Reset OTP for ${email}: ${code}\x1b[0m`);

  if (!smtpUser || !smtpPass) {
    console.warn(`\x1b[33m[OTP SERVICE] SMTP_USER or SMTP_PASS not set. Falling back to local console logs.\x1b[0m`);
    return { success: true, devMode: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `"Progress Record" <${smtpUser}>`,
      to: email,
      subject: "🔒 Reset Your Progress Record Mainframe Password",
      html: `
        <div style="font-family: 'Inter', sans-serif; background-color: #0a0a0a; color: #f3f4f6; padding: 40px; border-radius: 16px; max-width: 500px; margin: auto; border: 1px solid rgba(255,255,255,0.08);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-size: 22px; font-weight: 800; margin-top: 15px; color: white; letter-spacing: -0.5px;">Mainframe Password Reset</h2>
          </div>
          <p style="font-size: 14px; color: #9ca3af; line-height: 1.6; text-align: center;">Use the secure verification code below to reset your mainframe password. This code will expire in 10 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #3b82f6; background: rgba(59,130,246,0.1); padding: 12px 24px; border-radius: 12px; border: 1px dashed rgba(59,130,246,0.3); display: inline-block; font-family: monospace;">${code}</span>
          </div>
          <p style="font-size: 11px; color: #6b7280; text-align: center;">If you did not request this password reset, you can safely ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true, devMode: false };
  } catch (error) {
    console.error(`\x1b[31m[OTP SERVICE] Failed to send email via SMTP: ${error.message}\x1b[0m`);
    return { success: true, devMode: true };
  }
};

/* FORGOT PASSWORD REQUEST */
app.post("/auth/forgot-request", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ message: "Gmail address required" });
    const emailStr = email.trim().toLowerCase();
    
    // Check if user exists
    const user = await User.findOne({ email: emailStr });
    if (!user) return res.status(404).json({ message: "No registered operator found with this Gmail address" });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to Otp model
    await Otp.findOneAndUpdate(
      { email: emailStr },
      { code, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send email
    const emailStatus = await sendVerificationEmail(emailStr, code);
    res.json({ message: "Verification code sent successfully", devMode: emailStatus.devMode });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* RESET PASSWORD APPLY */
app.post("/auth/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email?.trim() || !code || !newPassword) {
      return res.status(400).json({ message: "Gmail, verification code and new password are required" });
    }
    const emailStr = email.trim().toLowerCase();

    // Verify OTP
    const otpRecord = await Otp.findOne({ email: emailStr, code });
    if (!otpRecord) return res.status(400).json({ message: "Invalid or expired verification code" });

    // Find User
    const user = await User.findOne({ email: emailStr });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update Password
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    // Delete OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({ success: true, message: "Mainframe credentials updated successfully" });
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
   LEADERBOARD
════════════════════════════════ */
app.get("/leaderboard", auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // 1. Fetch all real registered users
    const users = await User.find({}, 'name exam profilePic subjects').lean();

    // 2. Fetch all focus sessions
    const sessions = await Session.find({ type: 'focus' }).lean();

    // 3. Fetch all goals
    const goals = await Goal.find().lean();

    const realUsersData = users.map(user => {
      // Filter sessions for this user
      const userSessions = sessions.filter(s => s.userId?.toString() === user._id.toString());
      
      // Calculate total study hours (rounded to nearest integer)
      const totalMinutes = userSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      const hours = Math.round(totalMinutes / 60);

      // Calculate streak
      let streak = 0;
      if (userSessions.length > 0) {
        const uniqueDates = [...new Set(userSessions.map(s => {
          const d = new Date(s.date);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        }))].sort((a, b) => b - a);

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        let checkTime = todayStart;
        if (!uniqueDates.includes(checkTime)) {
          checkTime -= 86400000; // yesterday
        }

        if (uniqueDates.includes(checkTime)) {
          streak = 1;
          let expected = checkTime - 86400000;
          for (let i = uniqueDates.indexOf(checkTime) + 1; i < uniqueDates.length; i++) {
            if (uniqueDates[i] === expected) {
              streak++;
              expected -= 86400000;
            } else {
              break;
            }
          }
        }
      }

      // Calculate score based on subject mastery and streak
      let totalTopics = 0, completedTopics = 0;
      (user.subjects || []).forEach(sub => {
        (sub.topics || []).forEach(t => {
          totalTopics++;
          if (t.completed) {
            completedTopics++;
          } else {
            const subtopics = t.subtopics || [];
            if (subtopics.length > 0 && subtopics.every(st => st.completed)) {
              completedTopics++;
            }
          }
        });
      });
      const overallMastery = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      // Goal progress
      const userGoals = goals.filter(g => g.userId?.toString() === user._id.toString());
      const avgGoalPct = userGoals.length > 0
        ? Math.round(userGoals.reduce((acc, g) => acc + Math.min(100, (g.current / Math.max(1, g.target)) * 100), 0) / userGoals.length)
        : 0;

      // Composite score out of 100: 50% mastery, 30% streak, 20% goals
      const score = Math.round(overallMastery * 0.5 + Math.min(30, streak * 6) + avgGoalPct * 0.2);

      // Generate Avatar Initials
      const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

      return {
        _id: user._id.toString(),
        name: user.name,
        exam: user.exam || 'Other',
        hours: hours,
        streak: streak,
        score: Math.min(100, Math.max(0, score)) || 0,
        avatar: initials,
        isMe: user._id.toString() === currentUserId.toString(),
        profilePic: user.profilePic || '',
      };
    });

    // Sort by hours (primary) and score (secondary) descending
    realUsersData.sort((a, b) => {
      if (b.hours !== a.hours) return b.hours - a.hours;
      return b.score - a.score;
    });

    // Map rank to sorted list
    const finalLeaderboard = realUsersData.map((user, idx) => ({
      ...user,
      rank: idx + 1
    }));

    res.json({ leaderboard: finalLeaderboard });
  } catch (e) {
    console.error("Leaderboard error:", e);
    res.status(500).json({ message: e.message });
  }
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

/* Reply to feedback (admin) */
app.post("/feedback/:id/reply", async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'avee123@' && adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { reply } = req.body;
    if (!reply?.trim()) return res.status(400).json({ message: "Reply message required" });
    
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    
    feedback.adminReply = reply.trim();
    feedback.repliedAt = new Date();
    feedback.read = false; // Mark as unread for the user
    await feedback.save();
    
    res.json({ feedback });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* ════════════════════════════════
   NOTIFICATIONS
════════════════════════════════ */
app.get("/notifications", auth, async (req, res) => {
  try {
    const notifications = await Feedback.find({ 
      userId: req.user.id, 
      adminReply: { $exists: true, $ne: null } 
    }).sort({ repliedAt: -1 }).lean();
    res.json({ notifications });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.patch("/notifications/read", auth, async (req, res) => {
  try {
    await Feedback.updateMany(
      { userId: req.user.id, adminReply: { $exists: true }, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
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

/* ── Settings (Profile & Theme) ── */
app.put("/settings", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Handle profile updates
    if (req.body.displayName !== undefined) {
      user.name = req.body.displayName.trim();
    }
    if (req.body.examType !== undefined) {
      user.exam = req.body.examType;
    }
    if (req.body.profilePic !== undefined) {
      user.profilePic = req.body.profilePic;
    }

    // Handle theme/appearance updates
    if (req.body.bgColor !== undefined) {
      user.themeSettings.bgColor = req.body.bgColor;
    }
    if (req.body.fontFamily !== undefined) {
      user.themeSettings.fontFamily = req.body.fontFamily;
    }
    if (req.body.chartType !== undefined) {
      user.themeSettings.chartType = req.body.chartType;
    }

    await user.save();
    res.json({
      message: "Settings updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        examType: user.exam,
        profilePic: user.profilePic || '',
        themeSettings: user.themeSettings
      }
    });
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

/* ── AI Chat (Gemini) ── */
const geminiAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

app.post("/ai/chat", auth, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message required' });

    const userId = req.user.id;
    const user = await User.findById(userId).lean();
    const sessions = await Session.find({ userId }).sort({ date: -1 }).limit(50).lean();
    const goals = await Goal.find({ userId }).lean();
    const focusSessions = sessions.filter(s => s.type === 'focus');
    const totalFocusMin = focusSessions.reduce((a, s) => a + s.durationMinutes, 0);

    // Build user context
    const subjectList = (user.subjects || []).map(s => {
      const topics = (s.topics || []);
      const total = topics.length;
      const done = topics.filter(t => t.completed).length;
      return { name: s.name, done, total, pct: total > 0 ? Math.round(done/total*100) : 0 };
    });

    const activeGoals = goals.filter(g => !g.completed).map(g => {
      const pct = g.target > 0 ? Math.round(g.current / g.target * 100) : 0;
      return `${g.title} (${pct}%)`;
    });

    const name = user.name ? user.name.split(' ')[0] : 'Student';
    const exam = user.exam || 'General Studies';

    // Check if Gemini is configured. If yes, use real Gemini
    if (geminiAI) {
      try {
        const subjectsStr = subjectList.map(s => `${s.name}: ${s.done}/${s.total} done (${s.pct}%)`).join('; ');
        const goalsStr = activeGoals.join('; ');
        const systemPrompt = `You are an intelligent AI study assistant inside "Progress Record" — a productivity app for students. You speak naturally, are encouraging but honest, and give actionable advice.

USER CONTEXT:
- Name: ${name}
- Exam: ${exam}
- Subjects: ${subjectsStr || 'None added yet'}
- Focus Sessions: ${focusSessions.length} total (${Math.round(totalFocusMin / 60 * 10) / 10} hours)
- Active Goals: ${goalsStr || 'None set'}

RULES:
- Keep responses concise (2-4 sentences max unless asked for detail)
- Reference the user's actual data when relevant
- Give specific, personalized study advice
- Be motivational but practical
- Use the user's name sometimes
- If asked about something outside study/productivity, politely redirect`;

        const model = geminiAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const chatHistory = (history || []).slice(-10).map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        }));

        const chat = model.startChat({
          history: chatHistory,
          systemInstruction: systemPrompt,
        });

        const result = await chat.sendMessage(message);
        return res.json({ reply: result.response.text() });
      } catch (geminiError) {
        console.error("⚠️ Gemini API Error (Falling back to local engine):", geminiError.message);
        // Do not crash; fall through to the local smart engine below!
      }
    }

    // --- SMART LOCAL AI FALLBACK ENGINE (Runs instantly without API Key) ---
    const msgLower = message.toLowerCase();
    let reply = "";

    // 1. Weakest Subject analysis
    const weakest = [...subjectList].sort((a, b) => a.pct - b.pct)[0];

    if (msgLower.includes('weak') || msgLower.includes('analyze') || msgLower.includes('subject') || msgLower.includes('attention')) {
      if (subjectList.length === 0) {
        reply = `Hey ${name}, you haven't added any subjects to your Progress Record yet! Once you add subjects and topics, I'll be able to pinpoint exactly which areas need your attention. Go ahead and set them up in the Subjects panel!`;
      } else if (weakest && weakest.pct < 50) {
        reply = `I've analyzed your progress, ${name}. **${weakest.name}** is currently at only **${weakest.pct}% completion**, making it your weakest link. I recommend scheduling a 45-minute Deep Focus session today focusing solely on completing 1 topic in ${weakest.name} to build momentum.`;
      } else {
        reply = `Your subjects are in great shape, ${name}! All of them have over 50% completion. Keep maintaining this balanced study routine and review your highest priority topics daily.`;
      }
    }
    // 2. Study Plan / Today's Routine
    else if (msgLower.includes('plan') || msgLower.includes('today') || msgLower.includes('schedule') || msgLower.includes('routine')) {
      if (subjectList.length === 0) {
        reply = `Let's build a foundation first! Add your active subjects in the panel, then I can generate a tailored daily routine for your ${exam} preparation.`;
      } else {
        const topSub = subjectList[0].name;
        const secondSub = subjectList[1] ? subjectList[1].name : 'your notes review';
        reply = `Here is your customized focus blueprint for today, ${name}:
- **09:00 AM - 10:30 AM**: High-intensity study block for **${topSub}** (Goal: Complete 1 full topic).
- **11:00 AM - 12:00 PM**: Active recall & flashcard session on **${secondSub}**.
- **04:00 PM**: Review any pending goals or update your Notes Vault. Keep sessions limited to 45 mins with 5-min breaks!`;
      }
    }
    // 3. Motivation
    else if (msgLower.includes('motivate') || msgLower.includes('motivation') || msgLower.includes('lazy') || msgLower.includes('bored') || msgLower.includes('tired')) {
      const motivationalQuotes = [
        `Hey ${name}, remember why you started this journey. Success isn't about being perfect; it's about being consistent. Push through the inertia and start just a 15-minute timer right now. Once you begin, momentum will take over!`,
        `Don't limit your challenges, ${name}; challenge your limits! Every focus session you complete is a vote for the person you want to become. You have already completed ${focusSessions.length} sessions, showing you have the discipline. Let's add one more today!`,
        `Discipline is choosing between what you want now and what you want most. Your ${exam} goals are waiting for you. Get up, clear your desk, put your phone in another room, and let's get 25 minutes of deep focus. You've got this!`
      ];
      reply = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    }
    // 4. Focus Tips
    else if (msgLower.includes('focus') || msgLower.includes('pomodoro') || msgLower.includes('distract') || msgLower.includes('attention span')) {
      reply = `To achieve peak cognitive performance, ${name}, try this:
1. **The 2-Minute Rule**: If starting feels hard, commit to studying for just 2 minutes. Usually, you'll want to continue.
2. **Environment Design**: Put your phone out of sight. Visual distraction drains active willpower.
3. Use our built-in **Focus Mode** for structured intervals (45 mins work, 5 mins break) to prevent cognitive fatigue.`;
    }
    // 5. App features / general guide
    else if (msgLower.includes('hello') || msgLower.includes('hi ') || msgLower.includes('hey') || msgLower.includes('help') || msgLower.includes('who are you')) {
      reply = `Hello ${name}! I am your AI Productivity Companion. I track your focus trends (${Math.round(totalFocusMin / 60 * 10) / 10} hours logged so far) and subject completion levels. Ask me to 'analyze my weak areas', 'make a study plan for today', or for some 'motivation'!`;
    }
    // 6. Generic Fallback
    else {
      if (subjectList.length > 0) {
        reply = `That is an interesting question, ${name}. Looking at your current status in **${exam}** prep, you have already made progress on **${subjectList.length} subjects** with **${focusSessions.length} deep focus sessions**. Let's stay focused on finishing your remaining topics! Try asking me for a 'study plan' or 'weak subject analysis'.`;
      } else {
        reply = `I am here to help you conquer your goals, ${name}! Try adding a few subjects in the sidebar menu first. Once you log some study sessions, I can give you precise feedback and tailored recommendations.`;
      }
    }

    res.json({ reply });
  } catch (e) {
    console.error('AI chat fallback error:', e);
    res.status(500).json({ message: 'AI is temporarily offline.' });
  }
});

/* ── Health check ── */
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.listen(process.env.PORT || 5000, () =>
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
);