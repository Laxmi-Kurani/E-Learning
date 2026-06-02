const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Get user progress for a course (by userId and courseId params)
router.get('/:userId/:courseId', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const [progress] = await db.query(
      'SELECT * FROM progress WHERE user_id = ? AND course_id = ?',
      [req.params.userId, req.params.courseId]
    );
    if (progress.length === 0) return res.json({ completion_percentage: 0, completed: false, last_accessed: null });
    res.json(progress[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
});

// Update video duration
router.put('/update-duration', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const { userId, courseId } = req.body;
    const [existing] = await db.query('SELECT id FROM progress WHERE user_id = ? AND course_id = ?', [userId, courseId]);
    if (existing.length === 0) {
      await db.query('INSERT INTO progress (user_id, course_id, completion_percentage, completed) VALUES (?, ?, 0, false)', [userId, courseId]);
    }
    res.json({ message: 'Duration updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating duration', error: error.message });
  }
});
router.post('/update-duration', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const { userId, courseId } = req.body;
    const [existing] = await db.query('SELECT id FROM progress WHERE user_id = ? AND course_id = ?', [userId, courseId]);
    if (existing.length === 0) {
      await db.query('INSERT INTO progress (user_id, course_id, completion_percentage, completed) VALUES (?, ?, 0, false)', [userId, courseId]);
    }
    res.json({ message: 'Duration updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating duration', error: error.message });
  }
});

// Update video progress
router.put('/update-progress', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const { userId, courseId, playedTime, duration } = req.body;
    if (!duration || duration === 0) return res.json({ message: 'Invalid duration' });

    const completionPercentage = Math.min(Math.ceil((playedTime / duration) * 100), 100);
    const completed = completionPercentage >= 100;

    const [existing] = await db.query('SELECT id FROM progress WHERE user_id = ? AND course_id = ?', [userId, courseId]);
    if (existing.length === 0) {
      await db.query('INSERT INTO progress (user_id, course_id, completion_percentage, completed) VALUES (?, ?, ?, ?)', [userId, courseId, completionPercentage, completed]);
    } else {
      await db.query('UPDATE progress SET completion_percentage=?, completed=? WHERE user_id=? AND course_id=?', [completionPercentage, completed, userId, courseId]);
    }
    res.json({ message: 'Progress updated successfully', completionPercentage });
  } catch (error) {
    res.status(500).json({ message: 'Error updating progress', error: error.message });
  }
});

// Update progress (generic)
router.post('/update', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const { courseId, completionPercentage } = req.body;
    const completed = completionPercentage >= 100;
    await db.query(
      'UPDATE progress SET completion_percentage=?, completed=? WHERE user_id=? AND course_id=?',
      [completionPercentage, completed, req.userId, courseId]
    );
    res.json({ message: 'Progress updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating progress', error: error.message });
  }
});

// Get user progress for a course (by courseId from token)
router.get('/:courseId', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const [progress] = await db.query(
      'SELECT * FROM progress WHERE user_id = ? AND course_id = ?',
      [req.userId, req.params.courseId]
    );
    if (progress.length === 0) return res.json({ completion_percentage: 0, completed: false });
    res.json(progress[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
});

// Get all user progress
router.get('/', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const [progress] = await db.query(
      `SELECT p.*, c.title as course_title FROM progress p JOIN course c ON p.course_id = c.id WHERE p.user_id = ?`,
      [req.userId]
    );
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
});

module.exports = router;
