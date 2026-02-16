const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Submit assessment
router.post('/submit', verifyToken, async (req, res) => {
  try {
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

// Get user assessments
router.get('/my-assessments', verifyToken, async (req, res) => {
  try {
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
