const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { DB_TYPE, Feedback } = require('../models');

// Get feedback for a course (by course ID)
router.get('/:courseId', async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const feedback = await Feedback.find({ course_id: req.params.courseId })
        .populate('user_id', 'username')
        .sort({ created_at: -1 })
        .lean();
      
      const normalized = feedback.map(f => ({
        ...f,
        username: f.user_id?.username
      }));
      
      return res.json(normalized);
    }
    
    const db = getPool();
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
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
});

// Get feedback for a course (alternative route)
router.get('/course/:courseId', async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const feedback = await Feedback.find({ course_id: req.params.courseId })
        .populate('user_id', 'username')
        .sort({ created_at: -1 })
        .lean();
      
      const normalized = feedback.map(f => ({
        ...f,
        username: f.user_id?.username
      }));
      
      return res.json(normalized);
    }
    
    const db = getPool();
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
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
});

// Create feedback
router.post('/', verifyToken, async (req, res) => {
  try {
    const { course_id, rating, comment } = req.body;
    
    // Support both courseId and course_id
    const courseId = course_id || req.body.courseId;
    
    if (DB_TYPE === 'mongodb') {
      const feedback = new Feedback({
        user_id: req.userId,
        course_id: courseId,
        rating: rating || 5,
        comment
      });
      await feedback.save();
      return res.status(201).json({ message: 'Feedback submitted successfully', feedbackId: feedback._id });
    }
    
    const db = getPool();
    const [result] = await db.query(
      'INSERT INTO feedback (user_id, course_id, rating, comment) VALUES (?, ?, ?, ?)',
      [req.userId, courseId, rating || 5, comment]
    );

    res.status(201).json({ message: 'Feedback submitted successfully', feedbackId: result.insertId });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Error submitting feedback', error: error.message });
  }
});

// Get average rating for a course
router.get('/rating/:courseId', async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const result = await Feedback.aggregate([
        { $match: { course_id: req.params.courseId } },
        { $group: {
          _id: null,
          average_rating: { $avg: '$rating' },
          total_reviews: { $sum: 1 }
        }}
      ]);
      
      if (result.length === 0) {
        return res.json({ average_rating: 0, total_reviews: 0 });
      }
      
      return res.json(result[0]);
    }
    
    const db = getPool();
    const [result] = await db.query(
      'SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews FROM feedback WHERE course_id = ?',
      [req.params.courseId]
    );
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching rating:', error);
    res.status(500).json({ message: 'Error fetching rating', error: error.message });
  }
});

module.exports = router;
