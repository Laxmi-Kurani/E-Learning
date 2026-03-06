const express = require('express');
const router = express.Router();
const { Category, DB_TYPE } = require('../models');
const { Op } = require('sequelize');
const { verifyToken, isAdmin } = require('../middleware/auth');

// List categories (optional search)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    if (DB_TYPE === 'mongodb') {
      const query = {};
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }
      const cats = await Category.find(query).sort({ name: 1 }).lean();
      res.json(cats);
    } else {
      const where = {};
      if (search) {
        where.name = { [Op.like]: `%${search}%` };
      }
      const categories = await Category.findAll({ where, order: [['name', 'ASC']] });
      res.json(categories);
    }
  } catch (error) {
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

    if (DB_TYPE === 'mongodb') {
      const existing = await Category.findOne({ name });
      if (existing) {
        return res.status(400).json({ message: 'Category already exists' });
      }
      const cat = new Category({ name });
      await cat.save();
      res.status(201).json({ message: 'Category created successfully', categoryId: cat._id });
    } else {
      const [category, created] = await Category.findOrCreate({ where: { name } });
      if (!created) {
        return res.status(400).json({ message: 'Category already exists' });
      }
      res.status(201).json({ message: 'Category created successfully', categoryId: category.id });
    }
  } catch (error) {
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

    if (DB_TYPE === 'mongodb') {
      await Category.updateOne({ _id: req.params.id }, { name });
    } else {
      await Category.update({ name }, { where: { id: req.params.id } });
    }
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
});

// Delete category (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      await Category.deleteOne({ _id: req.params.id });
    } else {
      await Category.destroy({ where: { id: req.params.id } });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
});

module.exports = router;