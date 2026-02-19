const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { getPaginationParams } = require('../utils/helpers');

// Get all assessments (Admin only) - with pagination and filters
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    const { limit, offset } = getPaginationParams(req.query);
    const courseId = req.query.courseId;
    const status = req.query.status;

    let query = 'SELECT COUNT(*) as count FROM assessment WHERE 1=1';
    let countParams = [];

    let dataQuery = `SELECT a.*, u.username, u.email, c.title as course_title
                    FROM assessment a
                    JOIN user u ON a.user_id = u.id
                    JOIN course c ON a.course_id = c.id
                    WHERE 1=1`;
    let dataParams = [];

    // Apply course filter
    if (courseId && !isNaN(courseId)) {
      query += ' AND course_id = ?';
      dataQuery += ' AND a.course_id = ?';
      countParams.push(courseId);
      dataParams.push(courseId);
    }

    // Apply status filter
    if (status === 'PASSED') {
      query += ' AND passed = true';
      dataQuery += ' AND a.passed = true';
    } else if (status === 'FAILED') {
      query += ' AND passed = false';
      dataQuery += ' AND a.passed = false';
    }

    // Get total count
    const [countResult] = await db.query(query, countParams);
    const total = countResult[0].count;

    // Get paginated data
    dataQuery += ' ORDER BY a.completed_at DESC LIMIT ? OFFSET ?';
    dataParams.push(limit, offset);

    const [assessments] = await db.query(dataQuery, dataParams);

    res.json({
      assessments,
      pagination: {
        currentPage: Math.floor(offset / limit) + 1,
        limit,
        totalRecords: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: offset + limit < total,
        hasPrevPage: offset > 0
      }
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ message: 'Error fetching assessments', error: error.message });
  }
});

// Submit assessment
router.post('/submit', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const { courseId, score, totalQuestions } = req.body;
    const passed = (score / totalQuestions) >= 0.7; // 70% passing grade
    
    const [result] = await db.query(
      'INSERT INTO assessment (user_id, course_id, score, total_questions, passed) VALUES (?, ?, ?, ?, ?)',
      [req.userId, courseId, score, totalQuestions, passed]
    );

    // Update progress to 100% if passed
    if (passed) {
      await db.query(
        'UPDATE progress SET completion_percentage=100, completed=true WHERE user_id=? AND course_id=?',
        [req.userId, courseId]
      );
    }

    res.status(201).json({ 
      message: 'Assessment submitted successfully', 
      assessmentId: result.insertId,
      passed 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting assessment', error: error.message });
  }
});

// Submit assessment - frontend compatibility endpoint
router.post('/add/:userId/:courseId', verifyToken, async (req, res) => {
  try {
    const { marks } = req.body;
    const { userId, courseId } = req.params;
    
    // Verify the user is submitting their own assessment
    if (parseInt(userId) !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const passed = marks >= 70; // 70% passing grade
    
    const [result] = await db.query(
      'INSERT INTO assessment (user_id, course_id, score, total_questions, passed) VALUES (?, ?, ?, ?, ?)',
      [userId, courseId, marks, 100, passed]
    );

    // Update progress to 100% if passed
    if (passed) {
      await db.query(
        'UPDATE progress SET completion_percentage=100, completed=true WHERE user_id=? AND course_id=?',
        [userId, courseId]
      );
    }

    res.status(201).json({ 
      message: 'Assessment submitted successfully', 
      assessmentId: result.insertId,
      passed 
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ message: 'Error submitting assessment', error: error.message });
  }
});

// Get user assessments
router.get('/my-assessments', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const [assessments] = await db.query(
      `SELECT a.*, c.title as course_title 
       FROM assessment a 
       JOIN course c ON a.course_id = c.id 
       WHERE a.user_id = ? 
       ORDER BY a.completed_at DESC`,
      [req.userId]
    );
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assessments', error: error.message });
  }
});

// Get assessment for a course
router.get('/course/:courseId', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const [assessments] = await db.query(
      'SELECT * FROM assessment WHERE user_id = ? AND course_id = ? ORDER BY completed_at DESC LIMIT 1',
      [req.userId, req.params.courseId]
    );
    
    if (assessments.length === 0) {
      return res.json(null);
    }
    
    res.json(assessments[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assessment', error: error.message });
  }
});

// Get performance data for user
router.get('/performance/:userId', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    // Get all assessments with course details
    const [assessments] = await db.query(
      `SELECT a.*, c.title as course_title, c.category
       FROM assessment a 
       JOIN course c ON a.course_id = c.id 
       WHERE a.user_id = ? 
       ORDER BY a.completed_at DESC`,
      [req.params.userId]
    );
    
    // Get enrolled courses count
    const [enrolledCount] = await db.query(
      'SELECT COUNT(*) as count FROM learning WHERE user_id = ?',
      [req.params.userId]
    );
    
    // Get completed courses count
    const [completedCount] = await db.query(
      'SELECT COUNT(*) as count FROM progress WHERE user_id = ? AND completed = true',
      [req.params.userId]
    );
    
    // Calculate average score
    const totalScore = assessments.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0);
    const averageScore = assessments.length > 0 ? Math.round(totalScore / assessments.length) : 0;
    
    res.json({
      assessments,
      stats: {
        enrolledCourses: enrolledCount[0].count,
        completedCourses: completedCount[0].count,
        averageScore,
        totalAssessments: assessments.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching performance data', error: error.message });
  }
});

module.exports = router;
