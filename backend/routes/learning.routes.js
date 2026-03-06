const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { DB_TYPE, Learning, User, Course, Progress } = require('../models');

// Get all enrollments (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const enrollments = await Learning.find()
        .populate('user_id', 'username email')
        .populate('course_id', 'title')
        .sort({ enrolled_at: -1 })
        .lean();
      const mapped = enrollments.map(e => ({
        ...e,
        id: e._id.toString(),
        username: e.user_id?.username,
        email: e.user_id?.email,
        course_title: e.course_id?.title
      }));
      return res.json(mapped);
    }
    
    const db = getPool();
    const [enrollments] = await db.query(
      `SELECT l.*, u.username, u.email, c.title as course_title
       FROM learning l 
       JOIN user u ON l.user_id = u.id
       JOIN course c ON l.course_id = c.id
       ORDER BY l.enrolled_at DESC`
    );
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ message: 'Error fetching enrollments', error: error.message });
  }
});

// Enroll in course (creates pending request)
router.post('/enroll', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }
    
    if (DB_TYPE === 'mongodb') {
      // Validate that the course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Check for existing enrollment
      const existing = await Learning.findOne({ user_id: req.userId, course_id: courseId });
      if (existing) {
        return res.status(400).json({ message: 'Enrollment request already exists' });
      }
      
      // Create new enrollment
      const enrollment = new Learning({
        user_id: req.userId,
        course_id: courseId,
        status: 'PENDING'
      });
      await enrollment.save();
      return res.status(201).json({ message: 'Enrollment request submitted. Waiting for admin approval.' });
    }
    
    const db = getPool();
    await db.query('INSERT INTO learning (user_id, course_id, status) VALUES (?, ?, ?)', [req.userId, courseId, 'PENDING']);
    res.status(201).json({ message: 'Enrollment request submitted. Waiting for admin approval.' });
  } catch (error) {
    console.error('Enrollment error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Enrollment request already exists' });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }
    res.status(500).json({ message: 'Error enrolling', error: error.message });
  }
});

// Get user enrollments (only approved)
router.get('/my-courses', verifyToken, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const courses = await Learning.find({ user_id: req.userId, status: 'APPROVED' })
        .populate('course_id')
        .lean();
      
      // Filter out enrollments where course was deleted
      const validCourses = courses.filter(c => c.course_id);
      
      const enhanced = validCourses.map(c => ({
        ...c.course_id,
        id: c.course_id._id.toString(),
        course_id: c.course_id._id.toString(),
        enrolled_at: c.enrolled_at,
        status: c.status,
        approved_at: c.approved_at,
        completion_percentage: 0,
        completed: false
      }));
      return res.json(enhanced);
    }
    
    const db = getPool();
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
    console.error('Error fetching my-courses:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching enrollments', error: error.message });
  }
});

// Get pending enrollment requests (Admin only)
router.get('/pending', verifyToken, isAdmin, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const requests = await Learning.find({ status: 'PENDING' })
        .populate('user_id', 'username email')
        .populate('course_id', 'title')
        .sort({ enrolled_at: -1 })
        .lean();
      const mapped = requests.map(r => ({
        ...r,
        id: r._id.toString(),
        username: r.user_id?.username,
        email: r.user_id?.email,
        course_title: r.course_id?.title
      }));
      return res.json(mapped);
    }
    
    const db = getPool();
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
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ message: 'Error fetching pending requests', error: error.message });
  }
});

// Approve enrollment (Admin only)
router.put('/approve/:enrollmentId', verifyToken, isAdmin, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const enrollment = await Learning.findByIdAndUpdate(
        req.params.enrollmentId,
        { status: 'APPROVED', approved_at: new Date(), approved_by: req.userId },
        { new: true }
      );
      if (!enrollment) {
        return res.status(404).json({ message: 'Enrollment not found' });
      }
      await Progress.findOneAndUpdate(
        { user_id: enrollment.user_id, course_id: enrollment.course_id },
        { user_id: enrollment.user_id, course_id: enrollment.course_id, completion_percentage: 0 },
        { upsert: true }
      );
      return res.json({ message: 'Enrollment approved successfully' });
    }
    
    const db = getPool();
    await db.query(
      'UPDATE learning SET status=?, approved_at=NOW(), approved_by=? WHERE id=?',
      ['APPROVED', req.userId, req.params.enrollmentId]
    );
    
    const [enrollment] = await db.query('SELECT user_id, course_id FROM learning WHERE id=?', [req.params.enrollmentId]);
    
    if (enrollment.length > 0) {
      const { user_id, course_id } = enrollment[0];
      
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
    if (DB_TYPE === 'mongodb') {
      const enrollment = await Learning.findByIdAndUpdate(
        req.params.enrollmentId,
        { status: 'REJECTED', approved_at: new Date(), approved_by: req.userId },
        { new: true }
      );
      if (!enrollment) {
        return res.status(404).json({ message: 'Enrollment not found' });
      }
      return res.json({ message: 'Enrollment rejected' });
    }
    
    const db = getPool();
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
    if (DB_TYPE === 'mongodb') {
      const result = await Learning.findOne({ user_id: req.userId, course_id: req.params.courseId });
      return res.json({ enrolled: !!result });
    }
    
    const db = getPool();
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
