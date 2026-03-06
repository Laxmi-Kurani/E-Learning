// Analytics and Leaderboard Routes

const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { HTTP_STATUS } = require('../utils/constants');
const { getPaginationParams } = require('../utils/helpers');
const { DB_TYPE, Assessment, User, Learning, Progress, Course, Feedback } = require('../models');
const mongoose = require('mongoose');

// Get course leaderboard (top performers)
router.get('/leaderboard/course/:courseId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    if (DB_TYPE === 'mongodb') {
      const courseId = mongoose.Types.ObjectId(req.params.courseId);
      const docs = await Assessment.aggregate([
        { $match: { course_id: courseId, passed: true } },
        {
          $lookup: {
            from: 'user',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            user_id: '$user._id',
            username: '$user.username',
            email: '$user.email',
            score: 1,
            total_questions: 1,
            percentage: {
              $round: [
                { $multiply: [{ $cond: [{ $gt: ['$total_questions', 0] }, { $divide: ['$score', '$total_questions'] }, 0] }, 100] },
                2
              ]
            },
            date_completed: '$completed_at'
          }
        },
        { $sort: { percentage: -1, completed_at: 1 } },
        { $limit: limit }
      ]).exec();
      const ranked = docs.map((e, i) => ({ ...e, rank: i + 1 }));
      return res.json({ courseId: req.params.courseId, leaderboard: ranked });
    }

    const db = getPool();
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
    const limit = parseInt(req.query.limit) || 20;
    if (DB_TYPE === 'mongodb') {
      // aggregate assessments to produce leaderboard
      const pipeline = [
        { $match: { passed: true } },
        { $group: {
            _id: '$user_id',
            coursesCompleted: { $addToSet: '$course_id' },
            totalScore: { $sum: '$score' },
            assessmentsTaken: { $sum: 1 },
            averagePercentage: { $avg: { $cond: [{ $gt: ['$total_questions', 0] }, { $multiply: [{ $divide: ['$score', '$total_questions'] }, 100] }, 0] } }
        }},
        { $project: {
            user_id: '$_id',
            courses_completed: { $size: '$coursesCompleted' },
            total_score: '$totalScore',
            average_percentage: '$averagePercentage',
            assessments_taken: '$assessmentsTaken'
        }},
        { $lookup: { from: 'user', localField: 'user_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $match: { 'user.role': 'USER' } },
        { $project: {
            user_id: 1,
            courses_completed: 1,
            total_score: 1,
            average_percentage: 1,
            assessments_taken: 1,
            username: '$user.username',
            email: '$user.email'
        }},
        { $sort: { courses_completed: -1, average_percentage: -1 } },
        { $limit: limit }
      ];
      const docs = await Assessment.aggregate(pipeline).exec();
      const rankedLeaderboard = docs.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
      return res.json({ leaderboard: rankedLeaderboard });
    }

    const db = getPool();
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
    const userId = req.params.userId;
    
    // Verify authorization
    if (userId !== String(req.userId) && req.userRole !== 'ADMIN') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: 'Unauthorized access'
      });
    }

    if (DB_TYPE === 'mongodb') {
      const objId = mongoose.Types.ObjectId(userId);
      const enrolledCourses = await Learning.countDocuments({ user_id: objId, status: 'APPROVED' });
      const completedCourses = await Progress.countDocuments({ user_id: objId, completed: true });
      const assessAgg = await Assessment.aggregate([
        { $match: { user_id: objId } },
        { $group: { _id: null, total: { $sum: 1 }, passed: { $sum: { $cond: ['$passed', 1, 0] } } } }
      ]);
      const assessmentStats = assessAgg[0] || { total: 0, passed: 0 };
      const avgAgg = await Assessment.aggregate([
        { $match: { user_id: objId, total_questions: { $gt: 0 } } },
        { $group: { _id: null, average: { $avg: { $cond: [{ $gt: ['$total_questions', 0] }, { $multiply: [{ $divide: ['$score', '$total_questions'] }, 100] }, 0] } } } }
      ]);
      const averageScore = (avgAgg[0] && avgAgg[0].average) || 0;

      const recentActivity = await Assessment.aggregate([
        { $match: { user_id: objId } },
        { $lookup: { from: 'course', localField: 'course_id', foreignField: '_id', as: 'course' } },
        { $unwind: '$course' },
        { $project: {
            type: { $literal: 'assessment' },
            date: '$completed_at',
            course_title: '$course.title',
            score: {
              $round: [{ $multiply: [{ $cond: [{ $gt: ['$total_questions', 0] }, { $divide: ['$score', '$total_questions'] }, 0] }, 100] }, 2]
            }
        } },
        { $sort: { date: -1 } },
        { $limit: 5 }
      ]).exec();

      const learningPath = await Learning.aggregate([
        { $match: { user_id: objId } },
        { $lookup: { from: 'course', localField: 'course_id', foreignField: '_id', as: 'course' } },
        { $unwind: '$course' },
        { $lookup: { from: 'progress', localField: 'course_id', foreignField: 'course_id', as: 'progress', pipeline: [{ $match: { user_id: objId } }] } },
        { $unwind: { path: '$progress', preserveNullAndEmptyArrays: true } },
        { $project: {
            id: '$course._id',
            title: '$course.title',
            level: '$course.level',
            completion_percentage: '$progress.completion_percentage',
            completed: '$progress.completed',
            enrollment_status: '$status'
        } },
        { $sort: { level: 1, title: 1 } }
      ]).exec();

      return res.json({
        userId,
        stats: {
          enrolledCourses,
          completedCourses,
          assessmentsTaken: assessmentStats.total,
          assessmentsPassed: assessmentStats.passed,
          averageScore
        },
        recentActivity,
        learningPath
      });
    }

    const db = getPool();
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
    const { courseId } = req.params;
    if (DB_TYPE === 'mongodb') {
      const cid = mongoose.Types.ObjectId(courseId);
      const enrollmentsAgg = await Learning.aggregate([
        { $match: { course_id: cid } },
        { $group: {
            _id: null,
            total: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } }
        }}
      ]);
      const enrollments = enrollmentsAgg[0] || { total:0, approved:0, pending:0 };

      const completionAgg = await Progress.aggregate([
        { $match: { course_id: cid, completed: true } },
        { $group: { _id: null, completed: { $sum: 1 } } }
      ]);
      const completion = completionAgg[0] || { completed:0 };

      const avgScoreAgg = await Assessment.aggregate([
        { $match: { course_id: cid, total_questions: { $gt: 0 } } },
        { $group: {
            _id: null,
            average: { $avg: { $multiply: [{ $divide: ['$score', '$total_questions'] }, 100] } },
            assessments_taken: { $sum: 1 }
        }}
      ]);
      const avgScore = avgScoreAgg[0] || { average:0, assessments_taken:0 };

      const passAgg = await Assessment.aggregate([
        { $match: { course_id: cid } },
        { $group: {
            _id: null,
            total: { $sum: 1 },
            passed: { $sum: { $cond: ['$passed', 1, 0] } }
        }}
      ]);
      const passingRate = passAgg[0] || { total:0, passed:0 };

      const discussionsAgg = await mongoose.model('Discussion').aggregate([
        { $match: { course_id: cid } },
        { $count: 'total' }
      ]);
      const discussions = discussionsAgg[0] || { total:0 };

      const feedbackAgg = await Feedback.aggregate([
        { $match: { course_id: cid } },
        { $group: {
            _id: null,
            average_rating: { $avg: '$rating' },
            total_reviews: { $sum: 1 }
        }}
      ]);
      const feedbackStats = feedbackAgg[0] || { average_rating:0, total_reviews:0 };

      return res.json({
        courseId,
        enrollments: {
          total: enrollments.total,
          approved: enrollments.approved,
          pending: enrollments.pending
        },
        coursesCompleted: completion.completed,
        assessments: {
          taken: avgScore.assessments_taken,
          averageScore: avgScore.average || 0,
          passingRate: passingRate.total > 0 ? Math.round((passingRate.passed / passingRate.total) * 100) : 0
        },
        engagement: {
          discussions: discussions.total,
          averageRating: feedbackStats.average_rating || 0,
          totalReviews: feedbackStats.total_reviews
        }
      });
    }

    const db = getPool();
    // ... existing SQL code remains unchanged
    const enrollments = await db.query(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
              SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending
       FROM learning WHERE course_id = ?`,
      [courseId]
    );
    const completion = await db.query(
      `SELECT COUNT(*) as completed
       FROM progress WHERE course_id = ? AND completed = true`,
      [courseId]
    );
    const avgScore = await db.query(
      `SELECT ROUND(AVG((score / total_questions) * 100), 2) as average,
              COUNT(*) as assessments_taken
       FROM assessment WHERE course_id = ? AND total_questions > 0`,
      [courseId]
    );
    const passingRate = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN passed = true THEN 1 ELSE 0 END) as passed
       FROM assessment WHERE course_id = ?`,
      [courseId]
    );
    const discussions = await db.query(
      `SELECT COUNT(*) as total FROM discussion WHERE course_id = ?`,
      [courseId]
    );
    const feedback = await db.query(
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
    if (DB_TYPE === 'mongodb') {
      const userStats = await User.aggregate([
        { $group: {
            _id: null,
            total: { $sum: 1 },
            students: { $sum: { $cond: [{ $eq: ['$role', 'USER'] }, 1, 0] } },
            admins: { $sum: { $cond: [{ $eq: ['$role', 'ADMIN'] }, 1, 0] } },
            new_users_month: { $sum: { $cond: [{ $gte: ['$created_at', new Date(Date.now() - 30*24*60*60*1000)] }, 1, 0] } }
        }}
      ]);
      const us = userStats[0] || { total:0, students:0, admins:0, new_users_month:0 };

      const courseStatsAgg = await Course.aggregate([{ $group: { _id: null, total: { $sum: 1 } } }]);
      const courseStats = courseStatsAgg[0] || { total:0 };

      const enrollmentStatsAgg = await Learning.aggregate([
        { $group: {
            _id: null,
            total_enrollments: { $sum: 1 },
            active_enrollments: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
            enrollments_week: { $sum: { $cond: [{ $gte: ['$enrolled_at', new Date(Date.now() - 7*24*60*60*1000)] }, 1, 0] } }
        }}
      ]);
      const enrollmentStats = enrollmentStatsAgg[0] || { total_enrollments:0, active_enrollments:0, enrollments_week:0 };

      const assessmentStatsAgg = await Assessment.aggregate([
        { $match: { total_questions: { $gt: 0 } } },
        { $group: {
            _id: null,
            total: { $sum: 1 },
            passed: { $sum: { $cond: ['$passed', 1, 0] } },
            average_score: { $avg: { $multiply: [{ $divide: ['$score', '$total_questions'] }, 100] } }
        }}
      ]);
      const assessmentStats = assessmentStatsAgg[0] || { total:0, passed:0, average_score:0 };

      return res.json({
        users: us,
        courses: courseStats,
        enrollments: enrollmentStats,
        assessments: assessmentStats
      });
    }

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
