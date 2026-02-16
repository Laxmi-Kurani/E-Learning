const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get all users (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, email, role, created_at FROM user');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get user profile (must come before /:id route)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, email, role, mobileNumber, gender, dob, profession, location, linkedin_url, github_url, profile_image, created_at FROM user WHERE id = ?', [req.userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile (must come before /:id route)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { username, email, mobileNumber, gender, dob, profession, location, linkedin_url, github_url } = req.body;
    
    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];
    
    if (username !== undefined) { updates.push('username=?'); values.push(username); }
    if (email !== undefined) { updates.push('email=?'); values.push(email); }
    if (mobileNumber !== undefined) { updates.push('mobileNumber=?'); values.push(mobileNumber); }
    if (gender !== undefined) { updates.push('gender=?'); values.push(gender); }
    if (dob !== undefined) { updates.push('dob=?'); values.push(dob); }
    if (profession !== undefined) { updates.push('profession=?'); values.push(profession); }
    if (location !== undefined) { updates.push('location=?'); values.push(location); }
    if (linkedin_url !== undefined) { updates.push('linkedin_url=?'); values.push(linkedin_url); }
    if (github_url !== undefined) { updates.push('github_url=?'); values.push(github_url); }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    values.push(req.userId);
    await db.query(`UPDATE user SET ${updates.join(', ')} WHERE id=?`, values);
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Change password (must come before /:id route)
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    const [users] = await db.query('SELECT password FROM user WHERE id = ?', [req.userId]);
    const isValid = await bcrypt.compare(oldPassword, users[0].password);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid old password' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE user SET password=? WHERE id=?', [hashedPassword, req.userId]);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
});

// Get dashboard statistics (Admin only) - MUST come before /:id route
router.get('/stats/dashboard', verifyToken, isAdmin, async (req, res) => {
  try {
    // Get total users
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM user WHERE role = ?', ['USER']);
    
    // Get total admins
    const [adminCount] = await db.query('SELECT COUNT(*) as count FROM user WHERE role = ?', ['ADMIN']);
    
    // Get total courses
    const [courseCount] = await db.query('SELECT COUNT(*) as count FROM course');
    
    // Get total enrollments
    const [enrollmentCount] = await db.query('SELECT COUNT(*) as count FROM learning WHERE status = ?', ['APPROVED']);
    
    // Get pending enrollments
    const [pendingCount] = await db.query('SELECT COUNT(*) as count FROM learning WHERE status = ?', ['PENDING']);
    
    // Get total assessments
    const [assessmentCount] = await db.query('SELECT COUNT(*) as count FROM assessment');
    
    // Get recent enrollments (last 7 days)
    const [recentEnrollments] = await db.query(
      'SELECT COUNT(*) as count FROM learning WHERE enrolled_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    
    // Get course completion rate
    const [completionStats] = await db.query(
      'SELECT COUNT(*) as completed FROM progress WHERE completed = true'
    );
    
    res.json({
      users: userCount[0].count,
      admins: adminCount[0].count,
      courses: courseCount[0].count,
      enrollments: enrollmentCount[0].count,
      pendingEnrollments: pendingCount[0].count,
      assessments: assessmentCount[0].count,
      recentEnrollments: recentEnrollments[0].count,
      completedCourses: completionStats[0].completed
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
});

// Get user by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, role, mobileNumber, gender, dob, profession, location, linkedin_url, github_url, profile_image, created_at FROM user WHERE id = ?', 
      [req.params.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Get profile image (must come before /:id route)
router.get('/:id/profile-image', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT profile_image FROM user WHERE id = ?', [req.params.id]);
    
    if (users.length === 0 || !users[0].profile_image) {
      return res.status(404).json({ message: 'Profile image not found' });
    }
    
    // Return the base64 image data
    const imageData = users[0].profile_image;
    
    // Extract mime type and base64 data
    const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ message: 'Invalid image format' });
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    res.set('Content-Type', mimeType);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile image', error: error.message });
  }
});

// Upload profile image (must come before /:id route)
router.post('/:id/upload-image', verifyToken, async (req, res) => {
  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ message: 'No image data provided' });
    }
    
    // Validate base64 format
    if (!imageData.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid image format' });
    }
    
    // Check file size (limit to 5MB base64 string)
    if (imageData.length > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Image too large. Maximum size is 5MB' });
    }
    
    // Save to database
    await db.query('UPDATE user SET profile_image = ? WHERE id = ?', [imageData, req.params.id]);
    
    res.json({ message: 'Profile image uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading profile image', error: error.message });
  }
});

// Update user by ID
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { username, email, mobileNumber, gender, dob, profession, location, linkedin_url, github_url } = req.body;
    
    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];
    
    if (username !== undefined) { updates.push('username=?'); values.push(username); }
    if (email !== undefined) { updates.push('email=?'); values.push(email); }
    if (mobileNumber !== undefined) { updates.push('mobileNumber=?'); values.push(mobileNumber); }
    if (gender !== undefined) { updates.push('gender=?'); values.push(gender); }
    if (dob !== undefined) { updates.push('dob=?'); values.push(dob); }
    if (profession !== undefined) { updates.push('profession=?'); values.push(profession); }
    if (location !== undefined) { updates.push('location=?'); values.push(location); }
    if (linkedin_url !== undefined) { updates.push('linkedin_url=?'); values.push(linkedin_url); }
    if (github_url !== undefined) { updates.push('github_url=?'); values.push(github_url); }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    values.push(req.params.id);
    await db.query(`UPDATE user SET ${updates.join(', ')} WHERE id=?`, values);
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (parseInt(req.params.id) === req.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await db.query('DELETE FROM user WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Promote user to admin (Admin only)
router.put('/:id/promote', verifyToken, isAdmin, async (req, res) => {
  try {
    await db.query('UPDATE user SET role = ? WHERE id = ?', ['ADMIN', req.params.id]);
    res.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error promoting user', error: error.message });
  }
});

// Demote admin to user (Admin only)
router.put('/:id/demote', verifyToken, isAdmin, async (req, res) => {
  try {
    // Prevent admin from demoting themselves
    if (parseInt(req.params.id) === req.userId) {
      return res.status(400).json({ message: 'Cannot demote yourself' });
    }

    await db.query('UPDATE user SET role = ? WHERE id = ?', ['USER', req.params.id]);
    res.json({ message: 'Admin demoted to user successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error demoting user', error: error.message });
  }
});

module.exports = router;
