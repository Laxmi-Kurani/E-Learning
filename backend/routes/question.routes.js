const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get questions for a course
router.get('/course/:courseId', verifyToken, async (req, res) => {
  try {
    const [questions] = await db.query('SELECT * FROM question WHERE course_id = ?', [req.params.courseId]);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// Create question (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO question (course_id, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer]
    );

    res.status(201).json({ message: 'Question created successfully', questionId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating question', error: error.message });
  }
});

// Update question (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { questionText, optionA, optionB, optionC, optionD, correctAnswer } = req.body;
    
    await db.query(
      'UPDATE question SET question_text=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_answer=? WHERE id=?',
      [questionText, optionA, optionB, optionC, optionD, correctAnswer, req.params.id]
    );

    res.json({ message: 'Question updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating question', error: error.message });
  }
});

// Delete question (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM question WHERE id = ?', [req.params.id]);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  }
});

module.exports = router;
