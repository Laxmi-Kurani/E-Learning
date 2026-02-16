const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get all enrollments (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const [enrollments] = await db.query(
      `SELECT l.*, u.username, u.email, c.title as course_title
       FROM learning l 
       JOIN user u ON l.user_id = u.id
       JOIN course c ON l.course_id = c.id
       ORDER BY l.enrolled_at DESC`
    );
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching enrollments', error: error.message });
  }
});

// Enroll in course (creates pending request)
router.post('/enroll', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    
    // Create enrollment with PENDING status
    await db.query('INSERT INTO learning (user_id, course_id, status) VALUES (?, ?, ?)', [req.userId, courseId, 'PENDING']);
    
    res.status(201).json({ message: 'Enrollment request submitted. Waiting for admin approval.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Enrollment request already exists' });
    }
    res.status(500).json({ message: 'Error enrolling', error: error.message });
  }
});

// Get user enrollments (only approved)
router.get('/my-courses', verifyToken, async (req, res) => {
  try {
    const [courses] = await db.query(
      `SELECT c.*, l.enrolled_at, l.status, l.approved_at, p.completion_percentage, p.completed 
       FROM learning l 
       JOIN course c ON l.course_id = c.id 
       LEFT JOIN progress p ON l.user_id = p.user_id AND l.course_id = p.course_id
       WHERE l.user_id = ? AND l.status = 'APPROVED'`,
      [req.userId]
    );
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching enrollments', error: error.message });
  }
});

// Get pending enrollment requests (Admin only)
router.get('/pending', verifyToken, isAdmin, async (req, res) => {
  try {
    const [requests] = await db.query(
      `SELECT l.*, u.username, u.email, c.title as course_title
       FROM learning l 
       JOIN user u ON l.user_id = u.id
       JOIN course c ON l.course_id = c.id
       WHERE l.status = 'PENDING'
       ORDER BY l.enrolled_at DESC`
    );
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending requests', error: error.message });
  }
});

// Approve enrollment (Admin only)
router.put('/approve/:enrollmentId', verifyToken, isAdmin, async (req, res) => {
  try {
    // Update enrollment status to APPROVED
    await db.query(
      'UPDATE learning SET status=?, approved_at=NOW(), approved_by=? WHERE id=?',
      ['APPROVED', req.userId, req.params.enrollmentId]
    );
    
    // Get enrollment details to create progress record
    const [enrollment] = await db.query('SELECT user_id, course_id FROM learning WHERE id=?', [req.params.enrollmentId]);
    
    if (enrollment.length > 0) {
      const { user_id, course_id } = enrollment[0];
      
      // Create progress record
      await db.query(
        'INSERT INTO progress (user_id, course_id, completion_percentage) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE completion_percentage=completion_percentage',
        [user_id, course_id]
      );
    }
    
    res.json({ message: 'Enrollment approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error approving enrollment', error: error.message });
  }
});

// Reject enrollment (Admin only)
router.put('/reject/:enrollmentId', verifyToken, isAdmin, async (req, res) => {
  try {
    await db.query(
      'UPDATE learning SET status=?, approved_at=NOW(), approved_by=? WHERE id=?',
      ['REJECTED', req.userId, req.params.enrollmentId]
    );
    
    res.json({ message: 'Enrollment rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting enrollment', error: error.message });
  }
});

// Check enrollment status
router.get('/check/:courseId', verifyToken, async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT * FROM learning WHERE user_id = ? AND course_id = ?',
      [req.userId, req.params.courseId]
    );
    res.json({ enrolled: result.length > 0 });
  } catch (error) {
    res.status(500).json({ message: 'Error checking enrollment', error: error.message });
  }
});

module.exports = router;
