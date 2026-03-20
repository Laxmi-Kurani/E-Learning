const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get user certificates
router.get('/my-certificates', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    
    const [certificates] = await db.query(
      `SELECT c.*, u.username, u.email, co.title as course_title
       FROM certificate c
       JOIN user u ON c.user_id = u.id
       JOIN course co ON c.course_id = co.id
       WHERE c.user_id = ? AND c.status = 'ISSUED'
       ORDER BY c.issued_at DESC`,
      [req.userId]
    );
    
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates', message: error.message });
  }
});

// Get all certificates (Admin) with pagination
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const db = getPool();
    
    const [certificates] = await db.query(
      `SELECT c.*, u.username, u.email, co.title as course_title
       FROM certificate c
       JOIN user u ON c.user_id = u.id
       JOIN course co ON c.course_id = co.id
       ORDER BY c.issued_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM certificate');
    
    res.json({
      certificates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates', message: error.message });
  }
});

// Generate certificate for a course completion
router.post('/generate/:courseId', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const { courseId } = req.params;
    
    // Check if user completed the course
    const [[progress]] = await db.query(
      'SELECT * FROM progress WHERE user_id = ? AND course_id = ? AND completed = true',
      [req.userId, courseId]
    );
    
    if (!progress) {
      return res.status(400).json({ error: 'Course not completed yet' });
    }
    
    // Check if certificate already exists
    const [[existing]] = await db.query(
      'SELECT * FROM certificate WHERE user_id = ? AND course_id = ?',
      [req.userId, courseId]
    );
    
    if (existing) {
      return res.json({ message: 'Certificate already exists', certificate: existing });
    }
    
    // Create certificate
    const [result] = await db.query(
      'INSERT INTO certificate (user_id, course_id, status) VALUES (?, ?, ?)',
      [req.userId, courseId, 'ISSUED']
    );
    
    res.status(201).json({ 
      message: 'Certificate generated successfully', 
      certificateId: result.insertId 
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ error: 'Failed to generate certificate', message: error.message });
  }
});

module.exports = router;
