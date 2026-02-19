// Certificate Routes - Certificate generation and management

const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { HTTP_STATUS } = require('../utils/constants');

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
    
    res.json(certificates[0]);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch certificate'
    });
  }
});

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
    const finalUrl = certificateUrl || generateCertificateUrl(userId, courseId);
    
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

// Get all certificates (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const [total] = await db.query('SELECT COUNT(*) as count FROM certificate');
    const [certificates] = await db.query(
      `SELECT c.*, u.username, u.email, co.title as course_title
       FROM certificate c
       JOIN user u ON c.user_id = u.id
       JOIN course co ON c.course_id = co.id
       ORDER BY c.issued_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    res.json({
      certificates,
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
function generateCertificateUrl(userId, courseId) {
  const timestamp = Date.now();
  const hash = require('crypto').randomBytes(8).toString('hex');
  return `/certificates/${userId}-${courseId}-${hash}-${timestamp}.pdf`;
}

module.exports = router;
