const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, async (req, res) => {
  const { message } = req.body;
  const userId = req.userId;
  if (!message) return res.status(400).json({ reply: 'Please send a message.' });

  const msg = message.toLowerCase().trim();
  const db = getPool();

  try {
    // My enrolled courses
    if (msg.includes('enrolled') || msg.includes('my course') || msg.includes('my learning')) {
      const [rows] = await db.query(
        `SELECT c.title, c.instructor, l.status, l.enrolled_at,
                COALESCE(p.completion_percentage, 0) AS completion_percentage
         FROM learning l
         JOIN course c ON l.course_id = c.id
         LEFT JOIN progress p ON p.user_id = l.user_id AND p.course_id = l.course_id
         WHERE l.user_id = ?
         ORDER BY l.enrolled_at DESC`,
        [userId]
      );
      if (!rows.length) return res.json({ reply: "You haven't enrolled in any courses yet. Visit /courses to explore!" });
      const list = rows.map((r, i) =>
        `${i + 1}. ${r.title}\n   Instructor: ${r.instructor || 'N/A'} | Status: ${r.status} | Progress: ${r.completion_percentage}%`
      ).join('\n\n');
      return res.json({ reply: `Here are your enrolled courses:\n\n${list}` });
    }

    // Progress
    if (msg.includes('progress') || msg.includes('completion') || msg.includes('how far')) {
      const [rows] = await db.query(
        `SELECT c.title, p.completion_percentage, p.completed
         FROM progress p
         JOIN course c ON p.course_id = c.id
         WHERE p.user_id = ?
         ORDER BY p.completion_percentage DESC`,
        [userId]
      );
      if (!rows.length) return res.json({ reply: "No progress data yet. Start a course to track your progress!" });
      const list = rows.map((r, i) =>
        `${i + 1}. ${r.title}: ${r.completion_percentage}%${r.completed ? ' ✅ Completed' : ''}`
      ).join('\n');
      return res.json({ reply: `Your course progress:\n\n${list}` });
    }

    // Certificates
    if (msg.includes('certificate') || msg.includes('cert')) {
      const [rows] = await db.query(
        `SELECT c.title, cert.issued_at, cert.status
         FROM certificate cert
         JOIN course c ON cert.course_id = c.id
         WHERE cert.user_id = ? AND cert.status = 'ISSUED'
         ORDER BY cert.issued_at DESC`,
        [userId]
      );
      if (!rows.length) return res.json({ reply: "You haven't earned any certificates yet. Complete a course assessment to earn one!" });
      const list = rows.map((r, i) =>
        `${i + 1}. ${r.title} — issued on ${new Date(r.issued_at).toLocaleDateString()}`
      ).join('\n');
      return res.json({ reply: `Your certificates:\n\n${list}` });
    }

    // Available courses
    if (msg.includes('available') || msg.includes('all course') || msg.includes('browse') || msg.includes('explore')) {
      const [rows] = await db.query(
        `SELECT title, instructor, category, level FROM course ORDER BY created_at DESC LIMIT 10`
      );
      if (!rows.length) return res.json({ reply: 'No courses available at the moment.' });
      const list = rows.map((r, i) =>
        `${i + 1}. ${r.title} — ${r.instructor || 'N/A'} | ${r.category || 'General'} | ${r.level || 'All levels'}`
      ).join('\n');
      return res.json({ reply: `Available courses (latest 10):\n\n${list}\n\nVisit /courses to see all.` });
    }

    // Profile / user info
    if (msg.includes('profile') || msg.includes('my info') || msg.includes('who am i') || msg.includes('my name')) {
      const [rows] = await db.query(
        `SELECT username, email, role, profession, location FROM user WHERE id = ?`, [userId]
      );
      if (!rows.length) return res.json({ reply: 'Could not find your profile.' });
      const u = rows[0];
      let reply = `Your profile:\n\nName: ${u.username}\nEmail: ${u.email}\nRole: ${u.role}`;
      if (u.profession) reply += `\nProfession: ${u.profession}`;
      if (u.location) reply += `\nLocation: ${u.location}`;
      return res.json({ reply });
    }

    // Assessments / scores
    if (msg.includes('assessment') || msg.includes('score') || msg.includes('test') || msg.includes('quiz')) {
      const [rows] = await db.query(
        `SELECT c.title, a.score, a.total_questions, a.passed, a.completed_at
         FROM assessment a
         JOIN course c ON a.course_id = c.id
         WHERE a.user_id = ?
         ORDER BY a.completed_at DESC LIMIT 10`,
        [userId]
      );
      if (!rows.length) return res.json({ reply: "You haven't taken any assessments yet." });
      const list = rows.map((r, i) =>
        `${i + 1}. ${r.title}: ${r.score}/${r.total_questions} — ${r.passed ? '✅ Passed' : '❌ Failed'}`
      ).join('\n');
      return res.json({ reply: `Your assessment results:\n\n${list}` });
    }

    // Help
    if (msg.includes('help') || msg.includes('what can you') || msg.includes('commands')) {
      return res.json({
        reply: `I can help you with:\n\n• My enrolled courses\n• My progress\n• My certificates\n• My assessments / scores\n• Available courses\n• My profile info\n\nJust type your question naturally!`,
      });
    }

    // Greeting
    if (msg.match(/^(hi|hello|hey|good morning|good evening|howdy)/)) {
      const [rows] = await db.query(`SELECT username FROM user WHERE id = ?`, [userId]);
      const name = rows[0]?.username || 'there';
      return res.json({ reply: `Hello, ${name}! 👋 How can I help you today? Type "help" to see what I can do.` });
    }

    // Default fallback
    return res.json({
      reply: `I'm not sure about that. Try asking:\n• "My enrolled courses"\n• "My progress"\n• "My certificates"\n• "Available courses"\n\nOr type "help" for more options.`,
    });

  } catch (err) {
    console.error('Chatbot error:', err.message);
    res.status(500).json({ reply: 'Something went wrong on the server. Please try again.' });
  }
});

module.exports = router;
