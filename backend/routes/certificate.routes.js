const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get user certificates
router.get('/my-certificates', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    
    const [certificates] = await db.query(
      `SELECT c.*, u.username, u.email, co.title as course_title
       FROM certificate c
       JOIN user u ON c.user_id = u.id
       JOIN course co ON c.course_id = co.id
       WHERE c.user_id = ? AND c.status = 'ISSUED'
       ORDER BY c.issued_at DESC`,
      [req.userId]
    );
    
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates', message: error.message });
  }
});

// Get all certificates (Admin) with pagination
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const db = getPool();
    
    const [certificates] = await db.query(
      `SELECT c.*, u.username, u.email, co.title as course_title
       FROM certificate c
       JOIN user u ON c.user_id = u.id
       JOIN course co ON c.course_id = co.id
       ORDER BY c.issued_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM certificate');
    
    res.json({
      certificates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates', message: error.message });
  }
});

// Generate certificate for a course completion
router.post('/generate/:courseId', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const { courseId } = req.params;
    
    // Check if user completed the course
    const [[progress]] = await db.query(
      'SELECT * FROM progress WHERE user_id = ? AND course_id = ? AND completed = true',
      [req.userId, courseId]
    );
    
    if (!progress) {
      return res.status(400).json({ error: 'Course not completed yet' });
    }
    
    // Check if certificate already exists
    const [[existing]] = await db.query(
      'SELECT * FROM certificate WHERE user_id = ? AND course_id = ?',
      [req.userId, courseId]
    );
    
    if (existing) {
      return res.json({ message: 'Certificate already exists', certificate: existing });
    }
    
    // Create certificate
    const [result] = await db.query(
      'INSERT INTO certificate (user_id, course_id, status) VALUES (?, ?, ?)',
      [req.userId, courseId, 'ISSUED']
    );
    
    res.status(201).json({ 
      message: 'Certificate generated successfully', 
      certificateId: result.insertId 
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ error: 'Failed to generate certificate', message: error.message });
  }
});

// Get single certificate by ID (Admin)
router.get('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query(
      `SELECT c.*, u.username, u.email, co.title as course_title
       FROM certificate c
       JOIN user u ON c.user_id = u.id
       JOIN course co ON c.course_id = co.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Certificate not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ error: 'Failed to fetch certificate', message: error.message });
  }
});

// Create certificate (Admin)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    const { userId, courseId, certificateUrl, status } = req.body;
    if (!userId || !courseId) {
      return res.status(400).json({ error: 'userId and courseId are required' });
    }
    const [result] = await db.query(
      'INSERT INTO certificate (user_id, course_id, certificate_url, status) VALUES (?, ?, ?, ?)',
      [userId, courseId, certificateUrl || null, status || 'ISSUED']
    );
    res.status(201).json({ message: 'Certificate created', certificateId: result.insertId });
  } catch (error) {
    console.error('Error creating certificate:', error);
    res.status(500).json({ error: 'Failed to create certificate', message: error.message });
  }
});

// Update certificate (Admin)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    const { userId, courseId, certificateUrl, status } = req.body;
    const fields = [];
    const params = [];
    if (userId != null)        { fields.push('user_id = ?');        params.push(userId); }
    if (courseId != null)      { fields.push('course_id = ?');      params.push(courseId); }
    if (certificateUrl !== undefined) { fields.push('certificate_url = ?'); params.push(certificateUrl); }
    if (status != null)        { fields.push('status = ?');         params.push(status); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    await db.query(`UPDATE certificate SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Certificate updated' });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ error: 'Failed to update certificate', message: error.message });
  }
});

// Delete certificate (Admin)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    await db.query('DELETE FROM certificate WHERE id = ?', [req.params.id]);
    res.json({ message: 'Certificate deleted' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ error: 'Failed to delete certificate', message: error.message });
  }
});

// Revoke certificate (Admin)
router.put('/:id/revoke', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    await db.query('UPDATE certificate SET status = ? WHERE id = ?', ['REVOKED', req.params.id]);
    res.json({ message: 'Certificate revoked' });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    res.status(500).json({ error: 'Failed to revoke certificate', message: error.message });
  }
});

module.exports = router;
