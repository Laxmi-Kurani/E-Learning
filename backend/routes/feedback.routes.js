const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Get feedback for a course (by course ID)
router.get('/:courseId', async (req, res) => {
  try {
    const [feedback] = await db.query(
      `SELECT f.*, u.username 
       FROM feedback f 
       JOIN user u ON f.user_id = u.id 
       WHERE f.course_id = ? 
       ORDER BY f.created_at DESC`,
      [req.params.courseId]
    );
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
});

// Get feedback for a course (alternative route)
router.get('/course/:courseId', async (req, res) => {
  try {
    const [feedback] = await db.query(
      `SELECT f.*, u.username 
       FROM feedback f 
       JOIN user u ON f.user_id = u.id 
       WHERE f.course_id = ? 
       ORDER BY f.created_at DESC`,
      [req.params.courseId]
    );
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
});

// Create feedback
router.post('/', verifyToken, async (req, res) => {
  try {
    const { course_id, rating, comment } = req.body;
    
    // Support both courseId and course_id
    const courseId = course_id || req.body.courseId;
    
    const [result] = await db.query(
      'INSERT INTO feedback (user_id, course_id, rating, comment) VALUES (?, ?, ?, ?)',
      [req.userId, courseId, rating || 5, comment]
    );

    res.status(201).json({ message: 'Feedback submitted successfully', feedbackId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting feedback', error: error.message });
  }
});

// Get average rating for a course
router.get('/rating/:courseId', async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews FROM feedback WHERE course_id = ?',
      [req.params.courseId]
    );
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rating', error: error.message });
  }
});

module.exports = router;
