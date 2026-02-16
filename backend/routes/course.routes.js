const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get all courses
router.get('/', async (req, res) => {
  try {
    const [courses] = await db.query('SELECT * FROM course ORDER BY created_at DESC');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const [courses] = await db.query('SELECT * FROM course WHERE id = ?', [req.params.id]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(courses[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course', error: error.message });
  }
});

// Create course (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, description, instructor, duration, level, category, image_url, video_url, price } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO course (title, description, instructor, duration, level, category, image_url, video_url, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, instructor, duration, level, category, image_url, video_url, price || 0]
    );

    res.status(201).json({ message: 'Course created successfully', courseId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating course', error: error.message });
  }
});

// Update course (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, description, instructor, duration, level, category, image_url, video_url, price } = req.body;
    
    await db.query(
      'UPDATE course SET title=?, description=?, instructor=?, duration=?, level=?, category=?, image_url=?, video_url=?, price=? WHERE id=?',
      [title, description, instructor, duration, level, category, image_url, video_url, price, req.params.id]
    );

    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating course', error: error.message });
  }
});

// Delete course (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM course WHERE id = ?', [req.params.id]);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting course', error: error.message });
  }
});

module.exports = router;
