// Analytics and Leaderboard Routes

const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { HTTP_STATUS } = require('../utils/constants');
const { getPaginationParams } = require('../utils/helpers');

// Get course leaderboard (top performers)
router.get('/leaderboard/course/:courseId', async (req, res) => {
  try {
    const db = getPool();
    const limit = parseInt(req.query.limit) || 10;
    
    const [leaderboard] = await db.query(
      `SELECT u.id, u.username, u.email, a.score, a.total_questions, 
              ROUND((a.score / a.total_questions) * 100, 2) as percentage,
              a.completed_at as date_completed
       FROM assessment a
       JOIN user u ON a.user_id = u.id
       WHERE a.course_id = ? AND a.passed = true
       ORDER BY percentage DESC, a.completed_at ASC
       LIMIT ?`,
      [req.params.courseId, limit]
    );
    
    // Add rank
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
    
    res.json({
      courseId: req.params.courseId,
      leaderboard: rankedLeaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch leaderboard'
    });
  }
});

// Get global leaderboard (all courses)
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
       FROM user u
       LEFT JOIN assessment a ON u.id = a.user_id AND a.passed = true
       WHERE u.role = 'USER'
       GROUP BY u.id, u.username, u.email
       ORDER BY courses_completed DESC, average_percentage DESC
       LIMIT ?`,
      [limit]
    );
    
    // Add rank
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      courses_completed: entry.courses_completed || 0,
      total_score: entry.total_score || 0
    }));
    
    res.json({
      leaderboard: rankedLeaderboard
    });
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch leaderboard'
    });
  }
});

// Get user analytics
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const userId = req.params.userId;
    
    // Verify authorization
    if (parseInt(userId) !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: 'Unauthorized access'
      });
    }
    
    // Courses enrolled
    const [enrolledCourses] = await db.query(
      `SELECT COUNT(*) as count
       FROM learning WHERE user_id = ? AND status = 'APPROVED'`,
      [userId]
    );
    
    // Courses completed
    const [completedCourses] = await db.query(
      `SELECT COUNT(*) as count
       FROM progress WHERE user_id = ? AND completed = true`,
      [userId]
    );
    
    // Assessments taken
    const [assessmentStats] = await db.query(
      `SELECT COUNT(*) as total, SUM(CASE WHEN passed = true THEN 1 ELSE 0 END) as passed
       FROM assessment WHERE user_id = ?`,
      [userId]
    );
    
    // Average score
    const [averageScore] = await db.query(
      `SELECT ROUND(AVG((score / total_questions) * 100), 2) as average
       FROM assessment WHERE user_id = ? AND total_questions > 0`,
      [userId]
    );
    
    // Recent activity
    const [recentActivity] = await db.query(
      `SELECT 'assessment' as type, a.completed_at as date, c.title as course_title, 
              ROUND((a.score / a.total_questions) * 100, 2) as score
       FROM assessment a
       JOIN course c ON a.course_id = c.id
       WHERE a.user_id = ?
       ORDER BY a.completed_at DESC
       LIMIT 5`,
      [userId]
    );
    
    // Learning path
    const [learningPath] = await db.query(
      `SELECT c.id, c.title, c.level, p.completion_percentage, p.completed, l.status as enrollment_status
       FROM learning l
       JOIN course c ON l.course_id = c.id
       LEFT JOIN progress p ON l.user_id = p.user_id AND l.course_id = p.course_id
       WHERE l.user_id = ?
       ORDER BY c.level, c.title`,
      [userId]
    );
    
    res.json({
      userId,
      stats: {
        enrolledCourses: enrolledCourses[0].count,
        completedCourses: completedCourses[0].count,
        assessmentsTaken: assessmentStats[0].total,
        assessmentsPassed: assessmentStats[0].passed,
        averageScore: averageScore[0].average || 0
      },
      recentActivity,
      learningPath
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch analytics'
    });
  }
});

// Get course analytics (Admin only)
router.get('/course/analytics/:courseId', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    const { courseId } = req.params;
    
    // Total enrollments
    const [enrollments] = await db.query(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
              SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending
       FROM learning WHERE course_id = ?`,
      [courseId]
    );
    
    // Completion rate
    const [completion] = await db.query(
      `SELECT COUNT(*) as completed
       FROM progress WHERE course_id = ? AND completed = true`,
      [courseId]
    );
    
    // Average assessment score
    const [avgScore] = await db.query(
      `SELECT ROUND(AVG((score / total_questions) * 100), 2) as average,
              COUNT(*) as assessments_taken
       FROM assessment WHERE course_id = ? AND total_questions > 0`,
      [courseId]
    );
    
    // Passing rate
    const [passingRate] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN passed = true THEN 1 ELSE 0 END) as passed
       FROM assessment WHERE course_id = ?`,
      [courseId]
    );
    
    // Discussion activity
    const [discussions] = await db.query(
      `SELECT COUNT(*) as total FROM discussion WHERE course_id = ?`,
      [courseId]
    );
    
    // Feedback stats
    const [feedback] = await db.query(
      `SELECT ROUND(AVG(rating), 2) as average_rating, COUNT(*) as total_reviews
       FROM feedback WHERE course_id = ?`,
      [courseId]
    );
    
    res.json({
      courseId,
      enrollments: {
        total: enrollments[0].total,
        approved: enrollments[0].approved,
        pending: enrollments[0].pending
      },
      coursesCompleted: completion[0].completed,
      assessments: {
        taken: avgScore[0].assessments_taken,
        averageScore: avgScore[0].average || 0,
        passingRate: passingRate[0].total > 0 
          ? Math.round((passingRate[0].passed / passingRate[0].total) * 100) 
          : 0
      },
      engagement: {
        discussions: discussions[0].total,
        averageRating: feedback[0].average_rating || 0,
        totalReviews: feedback[0].total_reviews
      }
    });
  } catch (error) {
    console.error('Error fetching course analytics:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch analytics'
    });
  }
});

// Get platform analytics (Admin only)
router.get('/platform/overview', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    
    // User stats
    const [userStats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'USER' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_users_month
       FROM user`
    );
    
    // Course stats
    const [courseStats] = await db.query(
      `SELECT COUNT(*) as total FROM course`
    );
    
    // Enrollment stats
    const [enrollmentStats] = await db.query(
      `SELECT 
        COUNT(*) as total_enrollments,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as active_enrollments,
        SUM(CASE WHEN enrolled_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as enrollments_week
       FROM learning`
    );
    
    // Assessment stats
    const [assessmentStats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN passed = true THEN 1 ELSE 0 END) as passed,
        ROUND(AVG((score / total_questions) * 100), 2) as average_score
       FROM assessment WHERE total_questions > 0`
    );
    
    res.json({
      users: userStats[0],
      courses: courseStats[0],
      enrollments: enrollmentStats[0],
      assessments: assessmentStats[0]
    });
  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch analytics'
    });
  }
});

module.exports = router;
