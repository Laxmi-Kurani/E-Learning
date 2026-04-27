const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { DB_TYPE, Category } = require('../models');
const { Op } = require('sequelize');
const { verifyToken, isAdmin } = require('../middleware/auth');

// List categories (optional search)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    
    if (DB_TYPE === 'sqlite') {
      const whereClause = search ? { name: { [Op.like]: `%${search}%` } } : {};
      const categories = await Category.findAll({
        where: whereClause,
        order: [['name', 'ASC']]
      });
      return res.json(categories);
    }
    
    const db = getPool();
    
    let query = 'SELECT * FROM category';
    let params = [];
    
    if (search) {
      query += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY name ASC';
    
    const [categories] = await db.query(query, params);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Create category (admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    if (DB_TYPE === 'sqlite') {
      // Check if category already exists
      const existing = await Category.findOne({ where: { name } });
      if (existing) {
        return res.status(400).json({ message: 'Category already exists' });
      }
      
      const newCategory = await Category.create({ name });
      return res.status(201).json({ message: 'Category created successfully', categoryId: newCategory.id });
    }

    const db = getPool();
    
    // Check if category already exists
    const [existing] = await db.query('SELECT * FROM category WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    const [result] = await db.query('INSERT INTO category (name) VALUES (?)', [name]);
    res.status(201).json({ message: 'Category created successfully', categoryId: result.insertId });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
});

// Update category (admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const db = getPool();
    await db.query('UPDATE category SET name = ? WHERE id = ?', [name, req.params.id]);
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
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
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
});

module.exports = router;