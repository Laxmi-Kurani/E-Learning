const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { HTTP_STATUS } = require('../utils/constants');

// Get course leaderboard
router.get('/leaderboard/course/:courseId', async (req, res) => {
  try {
    const db = getPool();
    const limit = parseInt(req.query.limit) || 10;
    const [leaderboard] = await db.query(
      `SELECT u.id, u.username, u.email, a.score, a.total_questions,
              ROUND((a.score / a.total_questions) * 100, 2) as percentage,
              a.completed_at as date_completed
       FROM assessment a JOIN user u ON a.user_id = u.id
       WHERE a.course_id = ? AND a.passed = true
       ORDER BY percentage DESC, a.completed_at ASC LIMIT ?`,
      [req.params.courseId, limit]
    );
    res.json({ courseId: req.params.courseId, leaderboard: leaderboard.map((e, i) => ({ ...e, rank: i + 1 })) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get global leaderboard
router.get('/leaderboard/global', async (req, res) => {
  try {
    const db = getPool();
    const limit = parseInt(req.query.limit) || 20;
    const [leaderboard] = await db.query(
      `SELECT u.id, u.username, u.email,
              COUNT(DISTINCT a.course_id) as courses_completed,
              SUM(a.score) as total_score,
              ROUND(AVG((a.score / a.total_questions) * 100), 2) as average_percentage,
              COUNT(a.id) as assessments_taken
       FROM user u LEFT JOIN assessment a ON u.id = a.user_id AND a.passed = true
       WHERE u.role = 'USER'
       GROUP BY u.id, u.username, u.email
       ORDER BY courses_completed DESC, average_percentage DESC LIMIT ?`,
      [limit]
    );
    res.json({ leaderboard: leaderboard.map((e, i) => ({ ...e, rank: i + 1, courses_completed: e.courses_completed || 0, total_score: e.total_score || 0 })) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get user analytics
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const userId = req.params.userId;
    if (userId !== String(req.userId) && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const [[enrolled]] = await db.query(`SELECT COUNT(*) as count FROM learning WHERE user_id = ? AND status = 'APPROVED'`, [userId]);
    const [[completed]] = await db.query(`SELECT COUNT(*) as count FROM progress WHERE user_id = ? AND completed = true`, [userId]);
    const [[aStats]] = await db.query(`SELECT COUNT(*) as total, SUM(CASE WHEN passed = true THEN 1 ELSE 0 END) as passed FROM assessment WHERE user_id = ?`, [userId]);
    const [[avgScore]] = await db.query(`SELECT ROUND(AVG((score / total_questions) * 100), 2) as average FROM assessment WHERE user_id = ? AND total_questions > 0`, [userId]);
    const [recentActivity] = await db.query(
      `SELECT 'assessment' as type, a.completed_at as date, c.title as course_title,
              ROUND((a.score / a.total_questions) * 100, 2) as score
       FROM assessment a JOIN course c ON a.course_id = c.id
       WHERE a.user_id = ? ORDER BY a.completed_at DESC LIMIT 5`,
      [userId]
    );
    const [learningPath] = await db.query(
      `SELECT c.id, c.title, c.level, p.completion_percentage, p.completed, l.status as enrollment_status
       FROM learning l JOIN course c ON l.course_id = c.id
       LEFT JOIN progress p ON l.user_id = p.user_id AND l.course_id = p.course_id
       WHERE l.user_id = ? ORDER BY c.level, c.title`,
      [userId]
    );
    res.json({
      userId,
      stats: {
        enrolledCourses: enrolled.count,
        completedCourses: completed.count,
        assessmentsTaken: aStats.total,
        assessmentsPassed: aStats.passed,
        averageScore: avgScore.average || 0
      },
      recentActivity,
      learningPath
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get course analytics (Admin only)
router.get('/course/analytics/:courseId', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    const { courseId } = req.params;
    const [[enr]] = await db.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
              SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending
       FROM learning WHERE course_id = ?`,
      [courseId]
    );
    const [[comp]] = await db.query(`SELECT COUNT(*) as completed FROM progress WHERE course_id = ? AND completed = true`, [courseId]);
    const [[avg]] = await db.query(`SELECT ROUND(AVG((score / total_questions) * 100), 2) as average, COUNT(*) as taken FROM assessment WHERE course_id = ? AND total_questions > 0`, [courseId]);
    const [[pass]] = await db.query(`SELECT COUNT(*) as total, SUM(CASE WHEN passed = true THEN 1 ELSE 0 END) as passed FROM assessment WHERE course_id = ?`, [courseId]);
    const [[disc]] = await db.query(`SELECT COUNT(*) as total FROM discussion WHERE course_id = ?`, [courseId]);
    const [[fb]] = await db.query(`SELECT ROUND(AVG(rating), 2) as average_rating, COUNT(*) as total_reviews FROM feedback WHERE course_id = ?`, [courseId]);
    res.json({
      courseId,
      enrollments: { total: enr.total, approved: enr.approved, pending: enr.pending },
      coursesCompleted: comp.completed,
      assessments: {
        taken: avg.taken,
        averageScore: avg.average || 0,
        passingRate: pass.total > 0 ? Math.round((pass.passed / pass.total) * 100) : 0
      },
      engagement: { discussions: disc.total, averageRating: fb.average_rating || 0, totalReviews: fb.total_reviews }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get platform analytics (Admin only)
router.get('/platform/overview', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    const [[users]] = await db.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN role = 'USER' THEN 1 ELSE 0 END) as students,
              SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admins,
              SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_users_month
       FROM user`
    );
    const [[courses]] = await db.query(`SELECT COUNT(*) as total FROM course`);
    const [[enrollments]] = await db.query(
      `SELECT COUNT(*) as total_enrollments,
              SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as active_enrollments,
              SUM(CASE WHEN enrolled_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as enrollments_week
       FROM learning`
    );
    const [[assessments]] = await db.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN passed = true THEN 1 ELSE 0 END) as passed,
              ROUND(AVG((score / total_questions) * 100), 2) as average_score
       FROM assessment WHERE total_questions > 0`
    );
    res.json({ users, courses, enrollments, assessments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
