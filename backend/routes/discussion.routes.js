const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { DB_TYPE, Discussion } = require('../models');

// Get discussions for a course - support both endpoints
router.get('/course/:courseId', async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const discussions = await Discussion.find({ course_id: req.params.courseId })
        .populate('user_id', 'username email')
        .sort({ created_at: -1 })
        .lean();
      
      const normalized = discussions.map(d => ({
        ...d,
        username: d.user_id?.username,
        email: d.user_id?.email
      }));
      
      return res.json(normalized);
    }
    
    const db = getPool();
    const [discussions] = await db.query(
      `SELECT d.*, u.username, u.email 
       FROM discussion d 
       JOIN user u ON d.user_id = u.id 
       WHERE d.course_id = ? 
       ORDER BY d.created_at DESC`,
      [req.params.courseId]
    );
    res.json(discussions);
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ message: 'Error fetching discussions', error: error.message });
  }
});

// Get discussions by courseId directly (frontend compatibility)
router.get('/:courseId', async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const discussions = await Discussion.find({ course_id: req.params.courseId })
        .populate('user_id', 'username email')
        .sort({ created_at: -1 })
        .lean();
      
      const normalized = discussions.map(d => ({
        id: d._id.toString(),
        content: d.message,
        time: d.created_at,
        userName: d.user_id?.username,
        email: d.user_id?.email
      }));
      
      return res.json(normalized);
    }
    
    const db = getPool();
    const [discussions] = await db.query(
      `SELECT d.id, d.message as content, d.created_at as time, u.username as userName, u.email 
       FROM discussion d 
       JOIN user u ON d.user_id = u.id 
       WHERE d.course_id = ? 
       ORDER BY d.created_at DESC`,
      [req.params.courseId]
    );
    res.json(discussions);
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ message: 'Error fetching discussions', error: error.message });
  }
});

// Create discussion - support both endpoints
router.post('/', verifyToken, async (req, res) => {
  try {
    const { courseId, message } = req.body;
    
    if (DB_TYPE === 'mongodb') {
      const discussion = new Discussion({
        user_id: req.userId,
        course_id: courseId,
        message
      });
      await discussion.save();
      return res.status(201).json({ message: 'Discussion posted successfully', discussionId: discussion._id });
    }
    
    const db = getPool();
    const [result] = await db.query(
      'INSERT INTO discussion (user_id, course_id, message) VALUES (?, ?, ?)',
      [req.userId, courseId, message]
    );

    res.status(201).json({ message: 'Discussion posted successfully', discussionId: result.insertId });
  } catch (error) {
    console.error('Error posting discussion:', error);
    res.status(500).json({ message: 'Error posting discussion', error: error.message });
  }
});

// Create discussion - addMessage endpoint (frontend compatibility)
router.post('/addMessage', verifyToken, async (req, res) => {
  try {
    const { course_id, content, name } = req.body;
    
    if (DB_TYPE === 'mongodb') {
      const discussion = new Discussion({
        user_id: req.userId,
        course_id,
        message: content
      });
      await discussion.save();
      
      const newMessage = {
        id: discussion._id.toString(),
        userName: name,
        content: content,
        time: discussion.created_at
      };
      
      return res.status(201).json(newMessage);
    }
    
    const db = getPool();
    const [result] = await db.query(
      'INSERT INTO discussion (user_id, course_id, message) VALUES (?, ?, ?)',
      [req.userId, course_id, content]
    );

    // Return the newly created message in the format the frontend expects
    const newMessage = {
      id: result.insertId,
      userName: name,
      content: content,
      time: new Date().toISOString()
    };

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error posting discussion:', error);
    res.status(500).json({ message: 'Error posting discussion', error: error.message });
  }
});

// Delete discussion
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const discussion = await Discussion.findById(req.params.id);
      
      if (!discussion) {
        return res.status(404).json({ message: 'Discussion not found' });
      }
      
      if (String(discussion.user_id) !== String(req.userId) && req.userRole !== 'ADMIN') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      await Discussion.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Discussion deleted successfully' });
    }
    
    const db = getPool();
    const [discussions] = await db.query('SELECT user_id FROM discussion WHERE id = ?', [req.params.id]);
    
    if (discussions.length === 0) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    if (discussions[0].user_id !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await db.query('DELETE FROM discussion WHERE id = ?', [req.params.id]);
    res.json({ message: 'Discussion deleted successfully' });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    res.status(500).json({ message: 'Error deleting discussion', error: error.message });
  }
});

module.exports = router;
