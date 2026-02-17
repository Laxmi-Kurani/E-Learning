const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Get discussions for a course - support both endpoints
router.get('/course/:courseId', async (req, res) => {
  try {
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
    res.status(500).json({ message: 'Error fetching discussions', error: error.message });
  }
});

// Get discussions by courseId directly (frontend compatibility)
router.get('/:courseId', async (req, res) => {
  try {
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
    const db = getPool();
    const { courseId, message } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO discussion (user_id, course_id, message) VALUES (?, ?, ?)',
      [req.userId, courseId, message]
    );

    res.status(201).json({ message: 'Discussion posted successfully', discussionId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error posting discussion', error: error.message });
  }
});

// Create discussion - addMessage endpoint (frontend compatibility)
router.post('/addMessage', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const { course_id, content, name } = req.body;
    
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
    res.status(500).json({ message: 'Error deleting discussion', error: error.message });
  }
});

module.exports = router;
