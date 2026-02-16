const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Update progress
router.post('/update', verifyToken, async (req, res) => {
  try {
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

// Get user progress for a course
router.get('/:userId/:courseId', verifyToken, async (req, res) => {
  try {
    const [progress] = await db.query(
      'SELECT * FROM progress WHERE user_id = ? AND course_id = ?',
      [req.params.userId, req.params.courseId]
    );
    
    if (progress.length === 0) {
      return res.json({ completion_percentage: 0, completed: false });
    }
    
    res.json(progress[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
});

// Get user progress for a course (alternative route using token)
router.get('/:courseId', verifyToken, async (req, res) => {
  try {
    const [progress] = await db.query(
      'SELECT * FROM progress WHERE user_id = ? AND course_id = ?',
      [req.userId, req.params.courseId]
    );
    
    if (progress.length === 0) {
      return res.json({ completion_percentage: 0, completed: false });
    }
    
    res.json(progress[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
});

// Get all user progress
router.get('/', verifyToken, async (req, res) => {
  try {
    const [progress] = await db.query(
      `SELECT p.*, c.title as course_title 
       FROM progress p 
       JOIN course c ON p.course_id = c.id 
       WHERE p.user_id = ?`,
      [req.userId]
    );
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
});

module.exports = router;
