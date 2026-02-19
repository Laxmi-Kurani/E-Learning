const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { validateQuestion } = require('../middleware/validation');
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');
const { getPaginationParams, handleDatabaseError } = require('../utils/helpers');

// Get all questions (Admin only) - with pagination, search, filter
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    const { limit, offset } = getPaginationParams(req.query);
    const search = req.query.search || '';
    const courseId = req.query.courseId;
    
    let query = 'SELECT COUNT(*) as count FROM question WHERE 1=1';
    let countParams = [];
    
    let dataQuery = `SELECT id, course_id, question_text, 
                    option_a, option_b, option_c, option_d, correct_answer, created_at
                    FROM question WHERE 1=1`;
    let dataParams = [];
    
    // Apply search filter
    if (search) {
      query += ' AND question_text LIKE ?';
      dataQuery += ' AND question_text LIKE ?';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm);
      dataParams.push(searchTerm);
    }
    
    // Apply course filter
    if (courseId && !isNaN(courseId)) {
      query += ' AND course_id = ?';
      dataQuery += ' AND course_id = ?';
      countParams.push(courseId);
      dataParams.push(courseId);
    }
    
    // Get total count
    const [countResult] = await db.query(query, countParams);
    const total = countResult[0].count;
    
    // Get paginated data
    dataQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    dataParams.push(limit, offset);
    
    const [questions] = await db.query(dataQuery, dataParams);
    
    res.json({
      data: questions,
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
    console.error('Error fetching questions:', error);
    const dbError = handleDatabaseError(error);
    res.status(dbError.statusCode).json({ error: dbError.message });
  }
});

// Get questions for a course with pagination and search
router.get('/course/:courseId', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const { courseId } = req.params;
    const { limit, offset } = getPaginationParams(req.query);
    const search = req.query.search || '';
    
    // Validate course exists
    const [courses] = await db.query('SELECT id FROM course WHERE id = ?', [courseId]);
    if (courses.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'Course not found'
      });
    }
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM question WHERE course_id = ?';
    let countParams = [courseId];
    
    if (search) {
      countQuery += ' AND question_text LIKE ?';
      countParams.push(`%${search}%`);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].count;
    
    // Get paginated questions
    let dataQuery = `SELECT id, course_id, question_text as question, 
                   option_a as option1, option_b as option2, option_c as option3, 
                   option_d as option4, correct_answer as answer, created_at
                   FROM question WHERE course_id = ?`;
    let dataParams = [courseId];
    
    if (search) {
      dataQuery += ' AND question_text LIKE ?';
      dataParams.push(`%${search}%`);
    }
    
    dataQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    dataParams.push(limit, offset);
    
    const [questions] = await db.query(dataQuery, dataParams);
    
    res.json({
      data: questions,
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
    console.error('Error fetching questions:', error);
    const dbError = handleDatabaseError(error);
    res.status(dbError.statusCode).json({ error: dbError.message });
  }
});

// Get single question by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const { id } = req.params;
    
    if (isNaN(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Invalid question ID'
      });
    }
    
    const [questions] = await db.query(
      `SELECT id, course_id, question_text as question, 
       option_a as option1, option_b as option2, option_c as option3, 
       option_d as option4, correct_answer as answer, created_at
       FROM question WHERE id = ?`,
      [id]
    );
    
    if (questions.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'Question not found'
      });
    }
    
    res.json(questions[0]);
  } catch (error) {
    console.error('Error fetching question:', error);
    const dbError = handleDatabaseError(error);
    res.status(dbError.statusCode).json({ error: dbError.message });
  }
});

// Create question (Admin only)
router.post('/', verifyToken, isAdmin, validateQuestion, async (req, res) => {
  try {
    const db = getPool();
    const { courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer } = req.body;
    
    // Verify course exists
    const [courses] = await db.query('SELECT id FROM course WHERE id = ?', [courseId]);
    if (courses.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Course not found'
      });
    }
    
    // Normalize correct answer to uppercase single letter
    const normalizedAnswer = correctAnswer.toUpperCase().charAt(0);
    
    const [result] = await db.query(
      `INSERT INTO question (course_id, question_text, option_a, option_b, option_c, option_d, correct_answer) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [courseId, questionText, optionA, optionB, optionC, optionD, normalizedAnswer]
    );
    
    res.status(HTTP_STATUS.CREATED).json({
      message: SUCCESS_MESSAGES.QUESTION_CREATED || 'Question created successfully',
      questionId: result.insertId,
      data: {
        id: result.insertId,
        courseId,
        question: questionText,
        option1: optionA,
        option2: optionB,
        option3: optionC,
        option4: optionD,
        answer: normalizedAnswer
      }
    });
  } catch (error) {
    console.error('Error creating question:', error);
    const dbError = handleDatabaseError(error);
    res.status(dbError.statusCode).json({ error: dbError.message });
  }
});

// Update question (Admin only)
router.put('/:id', verifyToken, isAdmin, validateQuestion, async (req, res) => {
  try {
    const db = getPool();
    const { id } = req.params;
    const { questionText, optionA, optionB, optionC, optionD, correctAnswer } = req.body;
    
    if (isNaN(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Invalid question ID'
      });
    }
    
    // Check if question exists
    const [questions] = await db.query('SELECT id FROM question WHERE id = ?', [id]);
    if (questions.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'Question not found'
      });
    }
    
    // Normalize correct answer
    const normalizedAnswer = correctAnswer.toUpperCase().charAt(0);
    
    await db.query(
      `UPDATE question 
       SET question_text=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_answer=?
       WHERE id=?`,
      [questionText, optionA, optionB, optionC, optionD, normalizedAnswer, id]
    );
    
    res.json({
      message: 'Question updated successfully',
      data: {
        id: parseInt(id),
        question: questionText,
        option1: optionA,
        option2: optionB,
        option3: optionC,
        option4: optionD,
        answer: normalizedAnswer
      }
    });
  } catch (error) {
    console.error('Error updating question:', error);
    const dbError = handleDatabaseError(error);
    res.status(dbError.statusCode).json({ error: dbError.message });
  }
});

// Delete question (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    const { id } = req.params;
    
    if (isNaN(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Invalid question ID'
      });
    }
    
    // Check if question exists
    const [questions] = await db.query('SELECT id FROM question WHERE id = ?', [id]);
    if (questions.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'Question not found'
      });
    }
    
    const [result] = await db.query('DELETE FROM question WHERE id = ?', [id]);
    
    res.json({
      message: 'Question deleted successfully',
      deletedId: parseInt(id),
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    const dbError = handleDatabaseError(error);
    res.status(dbError.statusCode).json({ error: dbError.message });
  }
});

// Get questions by difficulty level for a course
router.get('/course/:courseId/by-difficulty', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    const { courseId } = req.params;
    
    // This is an example - you may need to add difficulty field to question table
    const [questions] = await db.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_answer
       FROM question WHERE course_id = ?
       ORDER BY id DESC`,
      [courseId]
    );
    
    res.json({
      courseId,
      totalQuestions: questions.length,
      questions
    });
  } catch (error) {
    console.error('Error fetching questions by difficulty:', error);
    const dbError = handleDatabaseError(error);
    res.status(dbError.statusCode).json({ error: dbError.message });
  }
});

// Bulk upload questions (Admin only) - for CSV/JSON import
router.post('/bulk/import', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    const { courseId, questions } = req.body;
    
    if (!courseId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Course ID and questions array required'
      });
    }
    
    // Verify course exists
    const [courses] = await db.query('SELECT id FROM course WHERE id = ?', [courseId]);
    if (courses.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Course not found'
      });
    }
    
    // Validate all questions first
    for (const q of questions) {
      if (!q.questionText || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.correctAnswer) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'All questions must have text and all four options with correct answer'
        });
      }
    }
    
    // Insert all questions
    let insertedCount = 0;
    for (const q of questions) {
      const normalizedAnswer = q.correctAnswer.toUpperCase().charAt(0);
      await db.query(
        `INSERT INTO question (course_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [courseId, q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, normalizedAnswer]
      );
      insertedCount++;
    }
    
    res.status(HTTP_STATUS.CREATED).json({
      message: `${insertedCount} questions imported successfully`,
      insertedCount,
      courseId
    });
  } catch (error) {
    console.error('Error bulk importing questions:', error);
    const dbError = handleDatabaseError(error);
    res.status(dbError.statusCode).json({ error: dbError.message });
  }
});

module.exports = router;
