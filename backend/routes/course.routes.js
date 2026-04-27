const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { DB_TYPE, Course } = require('../models');
const { Op } = require('sequelize');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get all courses
router.get('/', async (req, res) => {
  try {
    const { search, category, instructor } = req.query;
    
    if (DB_TYPE === 'sqlite') {
      const whereClause = {};
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { instructor: { [Op.like]: `%${search}%` } }
        ];
      }
      if (category) whereClause.category = category;
      if (instructor) whereClause.instructor = instructor;
      
      const courses = await Course.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });
      return res.json(courses);
    }
    
    const db = getPool();
    let sql = 'SELECT * FROM course';
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ? OR instructor LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) { conditions.push('category = ?'); params.push(category); }
    if (instructor) { conditions.push('instructor = ?'); params.push(instructor); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY created_at DESC';

    const [courses] = await db.query(sql, params);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    if (DB_TYPE === 'sqlite') {
      const course = await Course.findByPk(req.params.id);
      if (!course) return res.status(404).json({ message: 'Course not found' });
      return res.json(course);
    }
    
    const db = getPool();
    const [courses] = await db.query('SELECT * FROM course WHERE id = ?', [req.params.id]);
    if (courses.length === 0) return res.status(404).json({ message: 'Course not found' });
    res.json(courses[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course', error: error.message });
  }
});

// Create course (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, description, instructor, duration, level, category, image_url, video_url, price } = req.body;
    
    if (DB_TYPE === 'sqlite') {
      const course = await Course.create({
        title,
        description,
        instructor,
        duration,
        level,
        category,
        image_url,
        video_url,
        price: price || 0,
        created_at: new Date(),
        updated_at: new Date()
      });
      return res.status(201).json({ message: 'Course created successfully', courseId: course.id });
    }
    
    const db = getPool();
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
    
    if (DB_TYPE === 'sqlite') {
      const course = await Course.findByPk(req.params.id);
      if (!course) return res.status(404).json({ message: 'Course not found' });
      
      await course.update({
        title,
        description,
        instructor,
        duration,
        level,
        category,
        image_url,
        video_url,
        price,
        updated_at: new Date()
      });
      return res.json({ message: 'Course updated successfully' });
    }
    
    const db = getPool();
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
    if (DB_TYPE === 'sqlite') {
      const course = await Course.findByPk(req.params.id);
      if (!course) return res.status(404).json({ message: 'Course not found' });
      
      await course.destroy();
      return res.json({ message: 'Course deleted successfully' });
    }
    
    const db = getPool();
    await db.query('DELETE FROM course WHERE id = ?', [req.params.id]);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting course', error: error.message });
  }
});

module.exports = router;
