const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

// List categories (optional search)
router.get('/', async (req, res) => {
  try {
    const db = getPool();
    const { search } = req.query;
    let sql = 'SELECT * FROM category';
    const params = [];

    if (search) {
      sql += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY name';
    const [categories] = await db.query(sql, params);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Create category (admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const [result] = await db.query('INSERT INTO category (name) VALUES (?)', [name]);
    res.status(201).json({ message: 'Category created successfully', categoryId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
});

// Update category (admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    await db.query('UPDATE category SET name = ? WHERE id = ?', [name, req.params.id]);
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
});

// Delete category (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    await db.query('DELETE FROM category WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
});

module.exports = router;