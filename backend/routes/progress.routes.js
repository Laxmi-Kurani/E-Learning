const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { DB_TYPE, Progress } = require('../models');

// Get user progress for a course
router.get('/:userId/:courseId', verifyToken, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const progress = await Progress.findOne({
        user_id: req.params.userId,
        course_id: req.params.courseId
      }).lean();
      
      if (!progress) {
        return res.json({ completion_percentage: 0, completed: false, last_accessed: null });
      }
      
      return res.json(progress);
    }
    
    const db = getPool();
    const [progress] = await db.query(
      'SELECT * FROM progress WHERE user_id = ? AND course_id = ?',
      [req.params.userId, req.params.courseId]
    );
    
    if (progress.length === 0) {
      return res.json({ completion_percentage: 0, completed: false, last_accessed: null });
    }
    
    res.json(progress[0]);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
});

// Update video duration
router.post('/update-duration', verifyToken, async (req, res) => {
  try {
    const { userId, courseId, duration } = req.body;
    
    if (DB_TYPE === 'mongodb') {
      await Progress.findOneAndUpdate(
        { user_id: userId, course_id: courseId },
        { user_id: userId, course_id: courseId, completion_percentage: 0, completed: false },
        { upsert: true, new: true }
      );
      return res.json({ message: 'Duration updated successfully' });
    }
    
    const db = getPool();
    // Check if progress record exists
    const [existing] = await db.query(
      'SELECT * FROM progress WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    if (existing.length === 0) {
      // Create new progress record
      await db.query(
        'INSERT INTO progress (user_id, course_id, completion_percentage, completed) VALUES (?, ?, 0, false)',
        [userId, courseId]
      );
    }
    
    res.json({ message: 'Duration updated successfully' });
  } catch (error) {
    console.error('Error updating duration:', error);
    res.status(500).json({ message: 'Error updating duration', error: error.message });
  }
});

// Update video progress
router.post('/update-progress', verifyToken, async (req, res) => {
  try {
    const { userId, courseId, playedTime, duration } = req.body;
    
    if (!duration || duration === 0) {
      return res.json({ message: 'Invalid duration' });
    }
    
    const completionPercentage = Math.min(Math.ceil((playedTime / duration) * 100), 100);
    const completed = completionPercentage >= 100;
    
    if (DB_TYPE === 'mongodb') {
      await Progress.findOneAndUpdate(
        { user_id: userId, course_id: courseId },
        { 
          user_id: userId, 
          course_id: courseId, 
          completion_percentage: completionPercentage, 
          completed,
          last_accessed: new Date()
        },
        { upsert: true, new: true }
      );
      return res.json({ message: 'Progress updated successfully', completionPercentage });
    }
    
    const db = getPool();
    // Check if progress record exists
    const [existing] = await db.query(
      'SELECT * FROM progress WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    if (existing.length === 0) {
      // Create new progress record
      await db.query(
        'INSERT INTO progress (user_id, course_id, completion_percentage, completed) VALUES (?, ?, ?, ?)',
        [userId, courseId, completionPercentage, completed]
      );
    } else {
      // Update existing progress
      await db.query(
        'UPDATE progress SET completion_percentage=?, completed=? WHERE user_id=? AND course_id=?',
        [completionPercentage, completed, userId, courseId]
      );
    }
    
    res.json({ message: 'Progress updated successfully', completionPercentage });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Error updating progress', error: error.message });
  }
});

// Update progress
router.post('/update', verifyToken, async (req, res) => {
  try {
    const { courseId, completionPercentage } = req.body;
    const completed = completionPercentage >= 100;
    
    if (DB_TYPE === 'mongodb') {
      await Progress.findOneAndUpdate(
        { user_id: req.userId, course_id: courseId },
        { completion_percentage: completionPercentage, completed, last_accessed: new Date() },
        { upsert: true, new: true }
      );
      return res.json({ message: 'Progress updated successfully' });
    }
    
    const db = getPool();
    await db.query(
      'UPDATE progress SET completion_percentage=?, completed=? WHERE user_id=? AND course_id=?',
      [completionPercentage, completed, req.userId, courseId]
    );
    
    res.json({ message: 'Progress updated successfully' });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Error updating progress', error: error.message });
  }
});

// Get user progress for a course (alternative route using token)
router.get('/:courseId', verifyToken, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const progress = await Progress.findOne({
        user_id: req.userId,
        course_id: req.params.courseId
      }).lean();
      
      if (!progress) {
        return res.json({ completion_percentage: 0, completed: false });
      }
      
      return res.json(progress);
    }
    
    const db = getPool();
    const [progress] = await db.query(
      'SELECT * FROM progress WHERE user_id = ? AND course_id = ?',
      [req.userId, req.params.courseId]
    );
    
    if (progress.length === 0) {
      return res.json({ completion_percentage: 0, completed: false });
    }
    
    res.json(progress[0]);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
});

// Get all user progress
router.get('/', verifyToken, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const progress = await Progress.find({ user_id: req.userId })
        .populate('course_id', 'title')
        .lean();
      
      const normalized = progress.map(p => ({
        ...p,
        course_title: p.course_id?.title
      }));
      
      return res.json(normalized);
    }
    
    const db = getPool();
    const [progress] = await db.query(
      `SELECT p.*, c.title as course_title 
       FROM progress p 
       JOIN course c ON p.course_id = c.id 
       WHERE p.user_id = ?`,
      [req.userId]
    );
    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
});

module.exports = router;
