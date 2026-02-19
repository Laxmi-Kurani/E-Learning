// Password Reset Routes - Forgot password and password reset functionality

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getPool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/auth');
const { validateEmail, validatePasswordStrength } = require('../utils/helpers');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

// In production, use email service like Nodemailer
// For now, we'll store reset tokens in database

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !validateEmail(email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Valid email is required'
      });
    }
    
    const db = getPool();
    
    // Check if user exists
    const [users] = await db.query('SELECT id FROM user WHERE email = ?', [email]);
    
    if (users.length === 0) {
      // For security, don't reveal if email exists
      return res.status(HTTP_STATUS.OK).json({
        message: 'If the email exists, you will receive a password reset link'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    
    // Store reset token in database
    await db.query(
      'UPDATE user SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [resetTokenHash, resetTokenExpiry, users[0].id]
    );
    
    // In production, send email with reset link
    // For now, log the token (development only)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    res.json({
      message: 'Password reset link sent to your email',
      // Development only - remove in production
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to process password reset request'
    });
  }
});

// Reset password with token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'New password is required'
      });
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
    }
    
    const db = getPool();
    
    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user with valid reset token
    const [users] = await db.query(
      'SELECT id FROM user WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [tokenHash]
    );
    
    if (users.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Invalid or expired reset token'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear reset token
    await db.query(
      'UPDATE user SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, users[0].id]
    );
    
    res.json({
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    console.error('Error in reset-password:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to reset password'
    });
  }
});

// Verify reset token
router.get('/verify-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const db = getPool();
    
    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Check if token is valid and not expired
    const [users] = await db.query(
      'SELECT id FROM user WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [tokenHash]
    );
    
    res.json({
      valid: users.length > 0,
      message: users.length > 0 ? 'Token is valid' : 'Token is invalid or expired'
    });
  } catch (error) {
    console.error('Error in verify-token:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to verify token'
    });
  }
});

module.exports = router;
