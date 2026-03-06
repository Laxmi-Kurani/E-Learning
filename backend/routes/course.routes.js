const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { Course, DB_TYPE } = require('../models');

// Get all courses (supports optional search/filter)
router.get('/', async (req, res) => {
  try {
    const { search, category, instructor } = req.query;
    if (DB_TYPE === 'mongodb') {
      const query = {};
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { instructor: { $regex: search, $options: 'i' } }
        ];
      }
      if (category) query.category = category;
      if (instructor) query.instructor = instructor;
      const courses = await Course.find(query).sort({ created_at: -1 }).lean();
      // Normalize _id to id for frontend compatibility
      const normalized = courses.map(c => ({ ...c, id: c._id.toString() }));
      res.json(normalized);
    } else {
      const db = getPool();
      let sql = 'SELECT * FROM course';
      const params = [];
      const conditions = [];

      if (search) {
        conditions.push('(title LIKE ? OR description LIKE ? OR instructor LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (category) {
        conditions.push('category = ?');
        params.push(category);
      }
      if (instructor) {
        conditions.push('instructor = ?');
        params.push(instructor);
      }

      if (conditions.length) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY created_at DESC';

      const [courses] = await db.query(sql, params);
      res.json(courses);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const course = await Course.findById(req.params.id).lean();
      if (!course) return res.status(404).json({ message: 'Course not found' });
      // Normalize _id to id for frontend compatibility
      res.json({ ...course, id: course._id.toString() });
    } else {
      const db = getPool();
      const [courses] = await db.query('SELECT * FROM course WHERE id = ?', [req.params.id]);
      if (courses.length === 0) {
        return res.status(404).json({ message: 'Course not found' });
      }
      res.json(courses[0]);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course', error: error.message });
  }
});

// Create course (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, description, instructor, duration, level, category, image_url, video_url, price } = req.body;
    if (DB_TYPE === 'mongodb') {
      const course = new Course({ title, description, instructor, duration, level, category, image_url, video_url, price: price || 0 });
      const saved = await course.save();
      res.status(201).json({ message: 'Course created successfully', courseId: saved._id });
    } else {
      const db = getPool();
      const [result] = await db.query(
        'INSERT INTO course (title, description, instructor, duration, level, category, image_url, video_url, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, description, instructor, duration, level, category, image_url, video_url, price || 0]
      );
      res.status(201).json({ message: 'Course created successfully', courseId: result.insertId });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating course', error: error.message });
  }
});

// Update course (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, description, instructor, duration, level, category, image_url, video_url, price } = req.body;
    if (DB_TYPE === 'mongodb') {
      await Course.updateOne({ _id: req.params.id }, {
        title, description, instructor, duration, level, category, image_url, video_url, price
      });
    } else {
      const db = getPool();
      await db.query(
        'UPDATE course SET title=?, description=?, instructor=?, duration=?, level=?, category=?, image_url=?, video_url=?, price=? WHERE id=?',
        [title, description, instructor, duration, level, category, image_url, video_url, price, req.params.id]
      );
    }
    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating course', error: error.message });
  }
});

// Delete course (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      await Course.deleteOne({ _id: req.params.id });
    } else {
      const db = getPool();
      await db.query('DELETE FROM course WHERE id = ?', [req.params.id]);
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting course', error: error.message });
  }
});

module.exports = router;
