// Certificate Routes - Certificate generation and management

const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { HTTP_STATUS } = require('../utils/constants');
const { DB_TYPE, Certificate } = require('../models');

// Add certificate table setup (to be run during init)
// CREATE TABLE IF NOT EXISTS certificate (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   user_id INT NOT NULL,
//   course_id INT NOT NULL,
//   certificate_url TEXT,
//   issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   status ENUM('NOT_ISSUED', 'ISSUED', 'REVOKED') DEFAULT 'NOT_ISSUED',
//   FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
//   FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
//   UNIQUE KEY unique_certificate (user_id, course_id)
// );

// Get user certificates
router.get('/my-certificates', verifyToken, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const certificates = await Certificate.find({ user_id: req.userId, status: 'ISSUED' })
        .populate('user_id', 'username email')
        .populate('course_id', 'title')
        .sort({ issued_at: -1 })
        .lean();
      const enhanced = certificates.map(c => {
        if (!c.certificate_url) {
          c.certificate_url = generateCertificateUrl(c.user_id._id, c.course_id._id, req);
        }
        return c;
      });
      return res.json(enhanced);
    }
    
    const db = getPool();
    if (!db) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Database not initialized' });
    }
    
    const [certificates] = await db.query(
      `SELECT c.*, u.username, u.email, co.title as course_title
       FROM certificate c
       JOIN user u ON c.user_id = u.id
       JOIN course co ON c.course_id = co.id
       WHERE c.user_id = ? AND c.status = 'ISSUED'
       ORDER BY c.issued_at DESC`,
      [req.userId]
    );
    const enhanced = certificates.map((c) => {
      if (!c.certificate_url) {
        c.certificate_url = generateCertificateUrl(c.user_id, c.course_id, req);
      }
      return c;
    });
    res.json(enhanced);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch certificates'
    });
  }
});

// Get certificate details
router.get('/:certificateId', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const [certificates] = await db.query(
      `SELECT c.*, u.username, co.title as course_title
       FROM certificate c
       JOIN user u ON c.user_id = u.id
       JOIN course co ON c.course_id = co.id
       WHERE c.id = ? AND (c.user_id = ? OR ? = 'ADMIN')`,
      [req.params.certificateId, req.userId, req.userRole]
    );
    
    if (certificates.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Certificate not found' });
    }
    
    const cert = certificates[0];
    if (cert && !cert.certificate_url) {
      cert.certificate_url = generateCertificateUrl(cert.user_id, cert.course_id, req);
    }
    res.json(cert);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch certificate'
    });
  }
});

// Download certificate PDF (redirects to stored URL)
router.get('/:certificateId/download', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query('SELECT certificate_url, user_id, course_id FROM certificate WHERE id = ?', [req.params.certificateId]);
    if (rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Certificate not found' });
    }
    const url = rows[0].certificate_url || generateCertificateUrl(rows[0].user_id, rows[0].course_id, req);
    // if the URL is relative, build full path using origin
    if (url.startsWith('/')) {
      const origin = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
      return res.redirect(origin.replace(/\/$/, '') + url);
    }
    return res.redirect(url);
  } catch (err) {
    console.error('Error downloading certificate:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to download' });
  }
});

// Issue certificate (Admin only) - called when assessment is passed
// Issue certificate (Admin only) - called when assessment is passed
router.post('/issue', verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId, courseId, certificateUrl } = req.body;
    
    if (!userId || !courseId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'User ID and Course ID are required'
      });
    }
    
    const db = getPool();
    
    // Check if user completed the course
    const [assessments] = await db.query(
      'SELECT * FROM assessment WHERE user_id = ? AND course_id = ? AND passed = true',
      [userId, courseId]
    );
    
    if (assessments.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'User has not passed this course assessment'
      });
    }
    
    // Generate certificate or use provided URL
    // the generated URL now points to the frontend viewer (including
    // a userId query parameter) so that a PDF can be produced on the
    // client. pass the request object so the helper can build an
    // absolute link based on the request origin or a FRONTEND_URL env var.
    const finalUrl = certificateUrl || generateCertificateUrl(userId, courseId, req);
    
    // Insert or update certificate
    const [result] = await db.query(
      `INSERT INTO certificate (user_id, course_id, certificate_url, status)
       VALUES (?, ?, ?, 'ISSUED')
       ON DUPLICATE KEY UPDATE certificate_url = ?, status = 'ISSUED', issued_at = NOW()`,
      [userId, courseId, finalUrl, finalUrl]
    );
    
    res.status(HTTP_STATUS.CREATED).json({
      message: 'Certificate issued successfully',
      certificateId: result.insertId || result.affectedRows,
      certificateUrl: finalUrl
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to issue certificate'
    });
  }
});

// Revoke certificate (Admin only)
router.put('/:certificateId/revoke', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    
    await db.query(
      'UPDATE certificate SET status = ? WHERE id = ?',
      ['REVOKED', req.params.certificateId]
    );
    
    res.json({ message: 'Certificate revoked successfully' });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to revoke certificate'
    });
  }
});

// Get all certificates (Admin only) with search and filters
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const userId = req.query.userId;
      const courseId = req.query.courseId;
      const status = req.query.status;
      const search = req.query.search;
      
      const filter = {};
      if (userId) filter.user_id = userId;
      if (courseId) filter.course_id = courseId;
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { 'user_id.username': { $regex: search, $options: 'i' } },
          { 'user_id.email': { $regex: search, $options: 'i' } }
        ];
      }
      
      const total = await Certificate.countDocuments(filter);
      const certificates = await Certificate.find(filter)
        .populate('user_id', 'username email')
        .populate('course_id', 'title')
        .sort({ issued_at: -1 })
        .limit(limit)
        .skip(offset)
        .lean();
        
      const enhanced = certificates.map(c => ({
        ...c,
        id: c._id.toString(),
        username: c.user_id?.username,
        email: c.user_id?.email,
        course_title: c.course_id?.title,
        certificate_url: c.certificate_url || generateCertificateUrl(c.user_id._id, c.course_id._id, req)
      }));
      
      return res.json({
        certificates: enhanced,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      });
    }
    
    const db = getPool();
    if (!db) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Database not initialized' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const userId = req.query.userId;
    const courseId = req.query.courseId;
    const status = req.query.status;
    const search = req.query.search;

    let countSql = 'SELECT COUNT(*) as count FROM certificate c JOIN user u ON c.user_id = u.id WHERE 1=1';
    const countParams = [];

    let dataSql = `SELECT c.*, u.username, u.email, co.title as course_title
       FROM certificate c
       JOIN user u ON c.user_id = u.id
       JOIN course co ON c.course_id = co.id
       WHERE 1=1`;
    const dataParams = [];

    if (userId && !isNaN(userId)) {
      countSql += ' AND c.user_id = ?';
      dataSql += ' AND c.user_id = ?';
      countParams.push(userId);
      dataParams.push(userId);
    }
    if (courseId && !isNaN(courseId)) {
      countSql += ' AND c.course_id = ?';
      dataSql += ' AND c.course_id = ?';
      countParams.push(courseId);
      dataParams.push(courseId);
    }
    if (status) {
      countSql += ' AND c.status = ?';
      dataSql += ' AND c.status = ?';
      countParams.push(status);
      dataParams.push(status);
    }
    if (search) {
      countSql += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      dataSql += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      const term = `%${search}%`;
      countParams.push(term, term);
      dataParams.push(term, term);
    }

    const [total] = await db.query(countSql, countParams);
    dataSql += ' ORDER BY c.issued_at DESC LIMIT ? OFFSET ?';
    dataParams.push(limit, offset);

    const [certificates] = await db.query(dataSql, dataParams);

    const enhanced = certificates.map((c) => {
      if (!c.certificate_url) {
        c.certificate_url = generateCertificateUrl(c.user_id, c.course_id, req);
      }
      return c;
    });
    res.json({
      certificates: enhanced,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total[0].count / limit),
        totalRecords: total[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch certificates'
    });
  }
});

/**
 * Generate certificate URL
 * In production, this would generate actual PDF certificates or use a service
 */
// ---------------------------------------------------------------------------
// Admin CRUD operations for certificates
// ---------------------------------------------------------------------------

// Create a certificate record (admin) - does not require passing check
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId, courseId, certificateUrl, status } = req.body;
    
    console.log('Creating certificate with data:', { userId, courseId, certificateUrl, status });
    
    if (!userId || !courseId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'userId and courseId are required' });
    }
    
    const certStatus = status || 'ISSUED';
    
    if (DB_TYPE === 'mongodb') {
      const mongoose = require('mongoose');
      
      // Validate ObjectIds
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID format' });
      }
      
      // Mongoose will automatically convert string IDs to ObjectIds
      const url = certificateUrl || generateCertificateUrl(userId, courseId, req);
      const certificate = new Certificate({
        user_id: userId,
        course_id: courseId,
        certificate_url: url,
        status: certStatus
      });
      await certificate.save();
      return res.status(201).json({ message: 'Certificate created', certificateId: certificate._id });
    }
    
    const db = getPool();
    const url = certificateUrl || generateCertificateUrl(userId, courseId, req);
    const [result] = await db.query(
      'INSERT INTO certificate (user_id, course_id, certificate_url, status) VALUES (?, ?, ?, ?)',
      [userId, courseId, url, certStatus]
    );
    res.status(201).json({ message: 'Certificate created', certificateId: result.insertId });
  } catch (error) {
    console.error('Error creating certificate:', error);
    console.error('Error stack:', error.stack);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create certificate', message: error.message });
  }
});

// Update certificate (admin)
router.put('/:certificateId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { certificateUrl, status } = req.body;
    
    if (DB_TYPE === 'mongodb') {
      const updates = {};
      if (certificateUrl) updates.certificate_url = certificateUrl;
      if (status) updates.status = status;
      
      if (Object.keys(updates).length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Nothing to update' });
      }
      
      const certificate = await Certificate.findByIdAndUpdate(req.params.certificateId, updates, { new: true });
      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' });
      }
      return res.json({ message: 'Certificate updated' });
    }
    
    const fields = [];
    const params = [];
    if (certificateUrl) {
      fields.push('certificate_url = ?');
      params.push(certificateUrl);
    }
    if (status) {
      fields.push('status = ?');
      params.push(status);
    }
    if (fields.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Nothing to update' });
    }
    params.push(req.params.certificateId);
    await getPool().query(`UPDATE certificate SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Certificate updated' });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update certificate', message: error.message });
  }
});

// Delete certificate (admin)
router.delete('/:certificateId', verifyToken, isAdmin, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const certificate = await Certificate.findByIdAndDelete(req.params.certificateId);
      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' });
      }
      return res.json({ message: 'Certificate deleted' });
    }
    
    await getPool().query('DELETE FROM certificate WHERE id = ?', [req.params.certificateId]);
    res.json({ message: 'Certificate deleted' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete certificate', message: error.message });
  }
});

// build a URL that clients can visit to view/download the certificate.
// we default to the request origin (which in production will usually be
// the same host serving the frontend) but allow override via
// FRONTEND_URL environment variable so the backend can live on a
// different domain than the UI.
function generateCertificateUrl(userId, courseId, req) {
  const origin =
    process.env.FRONTEND_URL ||
    (req && `${req.protocol}://${req.get('host')}`) ||
    '';

  // include userId so that the certificate page can render any user
  // (not just the currently logged in one) and optionally trigger an
  // automatic download via query param.
  return `${origin.replace(/\/$/, '')}/certificate/${courseId}?userId=${userId}`;
}

module.exports = router;
