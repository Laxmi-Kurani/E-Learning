const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { User, DB_TYPE } = require('../models');

// Get all users (Admin only) with optional filtering/search
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const { role, search, isActive } = req.query;
      const filter = {};
      if (role) filter.role = role;
      if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === '1' || isActive === true;
      if (search) filter.$or = [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
      const users = await User.find(filter).sort({ created_at: -1 }).lean();
      return res.json(users);
    }

    const db = getPool();
    if (!db) {
      return res.status(500).json({ message: 'Database connection not initialized' });
    }
    
    const { role, search, isActive } = req.query;
    let sql = 'SELECT `id`, `username`, `email`, `role`, `isActive`, `mobileNumber`, `gender`, `dob`, `profession`, `location`, `linkedin_url`, `github_url`, `profile_image`, `created_at` FROM `user`';
    const params = [];
    const conditions = [];

    if (role) {
      conditions.push('`role` = ?');
      params.push(role);
    }
    if (isActive !== undefined) {
      // Convert string boolean values to 0 or 1
      const isActiveValue = isActive === 'true' || isActive === '1' || isActive === 1 ? 1 : 0;
      conditions.push('`isActive` = ?');
      params.push(isActiveValue);
    }
    if (search) {
      conditions.push('(`username` LIKE ? OR `email` LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY `created_at` DESC';

    const [users] = await db.query(sql, params);
    res.json(users);
  } catch (error) {
    console.error('User query error:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message, code: error.code });
  }
});

// Get user profile (must come before /:id route)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      // transform to SQL-like shape
      const {
        _id, username, email, role, isActive, mobileNumber, gender, dob,
        profession, location, linkedin_url, github_url, profile_image, created_at
      } = user;
      return res.json({
        id: _id, username, email, role, isActive, mobileNumber, gender, dob,
        profession, location, linkedin_url, github_url, profile_image, created_at
      });
    }

    const db = getPool();
    if (!db) {
      return res.status(500).json({ message: 'Database connection not initialized' });
    }

    const [users] = await db.query('SELECT `id`, `username`, `email`, `role`, `isActive`, `mobileNumber`, `gender`, `dob`, `profession`, `location`, `linkedin_url`, `github_url`, `profile_image`, `created_at` FROM `user` WHERE `id` = ?', [req.userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error('Profile query error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message, code: error.code });
  }
});

// Create new user (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, email, password, role = 'USER', isActive = true } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (DB_TYPE === 'mongodb') {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      const user = new User({
        username,
        email,
        password: hashedPassword,
        role,
        isActive
      });
      await user.save();
      return res.status(201).json({ message: 'User created successfully', userId: user._id });
    }
    
    const db = getPool();
    if (!db) {
      return res.status(500).json({ message: 'Database connection not initialized' });
    }
    
    const [result] = await db.query(
      'INSERT INTO `user` (`username`, `email`, `password`, `role`, `isActive`) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, role, isActive]
    );
    res.status(201).json({ message: 'User created successfully', userId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    console.error('User creation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error creating user', error: error.message, code: error.code });
  }
});
// Update user profile (must come before /:id route)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const db = getPool();
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
    // profile route should not allow altering isActive or role
    
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
    const db = getPool();
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
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Error changing password', error: error.message, code: error.code });
  }
});

// Get dashboard statistics (Admin only) - MUST come before /:id route
router.get('/stats/dashboard', verifyToken, isAdmin, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      const { User, Course, Learning, Assessment, Progress } = require('../models');
      
      const userCount = await User.countDocuments({ role: 'USER' });
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      const courseCount = await Course.countDocuments();
      const enrollmentCount = await Learning.countDocuments({ status: 'APPROVED' });
      const pendingCount = await Learning.countDocuments({ status: 'PENDING' });
      const assessmentCount = await Assessment.countDocuments();
      
      // Get recent enrollments (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentEnrollments = await Learning.countDocuments({ enrolled_at: { $gte: sevenDaysAgo } });
      
      // Get course completion rate
      const completionStats = await Progress.countDocuments({ completed: true });
      
      return res.json({
        users: userCount,
        admins: adminCount,
        courses: courseCount,
        enrollments: enrollmentCount,
        pendingEnrollments: pendingCount,
        assessments: assessmentCount,
        recentEnrollments: recentEnrollments,
        completedCourses: completionStats
      });
    }
    
    const db = getPool();
    if (!db) {
      return res.status(500).json({ message: 'Database connection not initialized' });
    }
    
    // Get total users
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM `user` WHERE `role` = ?', ['USER']);
    
    // Get total admins
    const [adminCount] = await db.query('SELECT COUNT(*) as count FROM `user` WHERE `role` = ?', ['ADMIN']);
    
    // Get total courses
    const [courseCount] = await db.query('SELECT COUNT(*) as count FROM `course`');
    
    // Get total enrollments
    const [enrollmentCount] = await db.query('SELECT COUNT(*) as count FROM `learning` WHERE `status` = ?', ['APPROVED']);
    
    // Get pending enrollments
    const [pendingCount] = await db.query('SELECT COUNT(*) as count FROM `learning` WHERE `status` = ?', ['PENDING']);
    
    // Get total assessments
    const [assessmentCount] = await db.query('SELECT COUNT(*) as count FROM `assessment`');
    
    // Get recent enrollments (last 7 days)
    const [recentEnrollments] = await db.query(
      'SELECT COUNT(*) as count FROM `learning` WHERE `enrolled_at` >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    
    // Get course completion rate
    const [completionStats] = await db.query(
      'SELECT COUNT(*) as completed FROM `progress` WHERE `completed` = true'
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
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message, code: error.code });
  }
});

// Get user by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    if (!db) {
      return res.status(500).json({ message: 'Database connection not initialized' });
    }
    
    const [users] = await db.query(
      'SELECT `id`, `username`, `email`, `role`, `isActive`, `mobileNumber`, `gender`, `dob`, `profession`, `location`, `linkedin_url`, `github_url`, `profile_image`, `created_at` FROM `user` WHERE `id` = ?', 
      [req.params.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message, code: error.code });
  }
});

// Get profile image (must come before /:id route)
router.get('/:id/profile-image', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    if (!db) {
      return res.status(500).json({ message: 'Database connection not initialized' });
    }
    
    const [users] = await db.query('SELECT `profile_image` FROM `user` WHERE `id` = ?', [req.params.id]);
    
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
    console.error('Profile image fetch error:', error);
    res.status(500).json({ message: 'Error fetching profile image', error: error.message, code: error.code });
  }
});

// Upload profile image (must come before /:id route)
router.post('/:id/upload-image', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    if (!db) {
      return res.status(500).json({ message: 'Database connection not initialized' });
    }
    
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
    await db.query('UPDATE `user` SET `profile_image` = ? WHERE `id` = ?', [imageData, req.params.id]);
    
    res.json({ message: 'Profile image uploaded successfully' });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ message: 'Error uploading profile image', error: error.message, code: error.code });
  }
});

// Update user by ID
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      username,
      email,
      mobileNumber,
      gender,
      dob,
      profession,
      location,
      linkedin_url,
      github_url,
      role,
      isActive
    } = req.body;
    
    if (DB_TYPE === 'mongodb') {
      const updates = {};
      if (username !== undefined) updates.username = username;
      if (email !== undefined) updates.email = email;
      if (mobileNumber !== undefined) updates.mobileNumber = mobileNumber;
      if (gender !== undefined) updates.gender = gender;
      if (dob !== undefined) updates.dob = dob;
      if (profession !== undefined) updates.profession = profession;
      if (location !== undefined) updates.location = location;
      if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url;
      if (github_url !== undefined) updates.github_url = github_url;
      
      // Allow admin to change role and status
      if (role !== undefined && req.userRole === 'ADMIN') updates.role = role;
      if (isActive !== undefined && req.userRole === 'ADMIN') updates.isActive = isActive;
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
      }
      
      const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ message: 'User updated successfully' });
    }
    
    const db = getPool();
    if (!db) {
      return res.status(500).json({ message: 'Database connection not initialized' });
    }
    
    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];
    
    if (username !== undefined) { updates.push('`username`=?'); values.push(username); }
    if (email !== undefined) { updates.push('`email`=?'); values.push(email); }
    if (mobileNumber !== undefined) { updates.push('`mobileNumber`=?'); values.push(mobileNumber); }
    if (gender !== undefined) { updates.push('`gender`=?'); values.push(gender); }
    if (dob !== undefined) { updates.push('`dob`=?'); values.push(dob); }
    if (profession !== undefined) { updates.push('`profession`=?'); values.push(profession); }
    if (location !== undefined) { updates.push('`location`=?'); values.push(location); }
    if (linkedin_url !== undefined) { updates.push('`linkedin_url`=?'); values.push(linkedin_url); }
    if (github_url !== undefined) { updates.push('`github_url`=?'); values.push(github_url); }
    // allow admin to change role
    if (role !== undefined && req.userRole === 'ADMIN') {
      updates.push('`role`=?');
      values.push(role);
    }
    // allow admin to toggle active status
    if (isActive !== undefined && req.userRole === 'ADMIN') {
      updates.push('`isActive`=?');
      values.push(isActive);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    values.push(req.params.id);
    await db.query(`UPDATE \`user\` SET ${updates.join(', ')} WHERE \`id\`=?`, values);
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('User update error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error updating user', error: error.message, code: error.code });
  }
});

// Delete user (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    if (DB_TYPE === 'mongodb') {
      // Prevent admin from deleting themselves
      if (String(req.params.id) === String(req.userId)) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
      
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ message: 'User deleted successfully' });
    }
    
    const db = getPool();
    if (!db) {
      return res.status(500).json({ message: 'Database connection not initialized' });
    }
    
    // Prevent admin from deleting themselves
    if (parseInt(req.params.id) === req.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await db.query('DELETE FROM `user` WHERE `id` = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User delete error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error deleting user', error: error.message, code: error.code });
  }
});

// Promote user to admin (Admin only)
router.put('/:id/promote', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    if (!db) {
      return res.status(500).json({ message: 'Database connection not initialized' });
    }
    
    await db.query('UPDATE `user` SET `role` = ? WHERE `id` = ?', ['ADMIN', req.params.id]);
    res.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    console.error('User promote error:', error);
    res.status(500).json({ message: 'Error promoting user', error: error.message, code: error.code });
  }
});

// Demote admin to user (Admin only)
router.put('/:id/demote', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    if (!db) {
      return res.status(500).json({ message: 'Database connection not initialized' });
    }
    
    // Prevent admin from demoting themselves
    if (parseInt(req.params.id) === req.userId) {
      return res.status(400).json({ message: 'Cannot demote yourself' });
    }

    await db.query('UPDATE `user` SET `role` = ? WHERE `id` = ?', ['USER', req.params.id]);
    res.json({ message: 'Admin demoted to user successfully' });
  } catch (error) {
    console.error('User demote error:', error);
    res.status(500).json({ message: 'Error demoting user', error: error.message, code: error.code });
  }
});

module.exports = router;
