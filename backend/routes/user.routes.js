const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const userService = require('../services/userService');


// Get all users (Admin only) with optional filtering/search
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    if (!db) return res.status(500).json({ message: 'Database connection not initialized' });
    const { role, search, isActive } = req.query;
    let sql = 'SELECT `id`, `username`, `email`, `role`, `isActive`, `mobileNumber`, `gender`, `dob`, `profession`, `location`, `linkedin_url`, `github_url`, `profile_image`, `created_at` FROM `user`';
    const params = [];
    const conditions = [];
    if (role) { conditions.push('`role` = ?'); params.push(role); }
    if (isActive !== undefined) {
      const val = isActive === 'true' || isActive === '1' ? 1 : 0;
      conditions.push('`isActive` = ?'); params.push(val);
    }
    if (search) { conditions.push('(`username` LIKE ? OR `email` LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY `created_at` DESC';
    const [users] = await db.query(sql, params);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get user details by email (compatibility for legacy frontend usage)
router.get('/details', verifyToken, async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter required' });
    }

    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const safeUser = user.toJSON ? user.toJSON() : { ...user };
    delete safeUser.password;
    return res.json(safeUser);
  } catch (error) {
    console.error('Get user details error:', error);
    return res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
});

// Normalize profile image URL whether value is data URI, absolute URL, or relative path
const normalizeProfileImage = (profileImage, req) => {
  if (!profileImage) return null;
  if (profileImage.startsWith('data:image/') || profileImage.startsWith('http://') || profileImage.startsWith('https://') || profileImage.startsWith('blob:')) {
    return profileImage;
  }
  // If profile image is stored as relative path, convert to absolute URL
  if (profileImage.startsWith('/')) {
    return `${req.protocol}://${req.get('host')}${profileImage}`;
  }
  return `${req.protocol}://${req.get('host')}/${profileImage}`;
};

// Get user profile (must come before /:id route)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Invalid token payload, user ID missing' });
    }

    const user = await userService.getUserById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Normalize response for both MongoDB and SQL user object types
    const safeUser = user.toJSON ? user.toJSON() : { ...user };
    delete safeUser.password;
    
    // Log raw profile_image before normalization
    console.log('DEBUG - Raw profile_image from DB:', safeUser.profile_image ? safeUser.profile_image.substring(0, 100) : 'NULL');
    
    safeUser.profile_image = normalizeProfileImage(safeUser.profile_image, req);
    
    // Log normalized profile_image
    console.log('DEBUG - Normalized profile_image:', safeUser.profile_image ? safeUser.profile_image.substring(0, 100) : 'NULL');

    return res.json(safeUser);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
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
    const db = getPool();
    if (!db) return res.status(500).json({ message: 'Database connection not initialized' });
    const [result] = await db.query(
      'INSERT INTO `user` (`username`, `email`, `password`, `role`, `isActive`) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, role, isActive]
    );
    res.status(201).json({ message: 'User created successfully', userId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already exists' });
    res.status(500).json({ message: 'Error creating user', error: error.message });
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
    
    const imageData = users[0].profile_image;

    if (imageData.startsWith('data:image/')) {
      const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ message: 'Invalid image format' });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      res.set('Content-Type', mimeType);
      return res.send(buffer);
    }

    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      return res.redirect(imageData);
    }

    const absoluteFSPath = path.isAbsolute(imageData)
      ? imageData
      : path.join(__dirname, '..', imageData.replace(/^\//, ''));

    if (fs.existsSync(absoluteFSPath)) {
      return res.sendFile(absoluteFSPath);
    }

    const normalized = normalizeProfileImage(imageData, req);
    return res.json({ profile_image: normalized });
  } catch (error) {
    console.error('Profile image fetch error:', error);
    res.status(500).json({ message: 'Error fetching profile image', error: error.message, code: error.code });
  }
});

// Get user by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const safeUser = user.toJSON ? user.toJSON() : { ...user };
    delete safeUser.password;
    safeUser.profile_image = normalizeProfileImage(safeUser.profile_image, req);
    res.json(safeUser);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message, code: error.code });
  }
});

// Upload profile image for current user (token-based)
router.post('/profile/upload-image', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    if (!db) {
      return res.status(500).json({ message: 'Database connection not initialized' });
    }

    let imageData = null;

    if (req.files && req.files.profileImage) {
      const file = req.files.profileImage;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: 'Invalid image type. Only JPEG, PNG, GIF, WEBP allowed' });
      }

      if (file.size > 7 * 1024 * 1024) {
        return res.status(400).json({ message: 'Image too large. Maximum size is 7MB' });
      }

      imageData = `data:${file.mimetype};base64,${file.data.toString('base64')}`;
    } else if (req.body.imageData) {
      imageData = req.body.imageData;
      if (typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
        return res.status(400).json({ message: 'Invalid image data format' });
      }
      if (imageData.length > 10 * 1024 * 1024) {
        return res.status(400).json({ message: 'Image too large. Maximum size is 7MB' });
      }
    } else {
      return res.status(400).json({ message: 'No image file or imageData provided' });
    }

    await db.query('UPDATE `user` SET `profile_image` = ? WHERE `id` = ?', [imageData, req.userId]);

    res.json({ success: true, message: 'Profile image uploaded successfully', profile_image: imageData });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading profile image', error: error.message, code: error.code });
  }
});

// Upload profile image by user id (self or admin)
router.post('/:id/upload-image', verifyToken, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (isNaN(targetId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    if (req.userId !== targetId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized to upload image for this user' });
    }

    const db = getPool();
    if (!db) {
      return res.status(500).json({ message: 'Database connection not initialized' });
    }

    let imageData = null;
    if (req.files && req.files.profileImage) {
      const file = req.files.profileImage;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: 'Invalid image type. Only JPEG, PNG, GIF, WEBP allowed' });
      }
      if (file.size > 7 * 1024 * 1024) {
        return res.status(400).json({ message: 'Image too large. Maximum size is 7MB' });
      }
      imageData = `data:${file.mimetype};base64,${file.data.toString('base64')}`;
    } else if (req.body.imageData) {
      imageData = req.body.imageData;
      if (typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
        return res.status(400).json({ message: 'Invalid image data format' });
      }
      if (imageData.length > 10 * 1024 * 1024) {
        return res.status(400).json({ message: 'Image too large. Maximum size is 7MB' });
      }
    } else {
      return res.status(400).json({ message: 'No image file or imageData provided' });
    }

    await db.query('UPDATE `user` SET `profile_image` = ? WHERE `id` = ?', [imageData, targetId]);
    res.json({ success: true, message: 'Profile image uploaded successfully', profile_image: imageData });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading profile image', error: error.message, code: error.code });
  }
});

// Update user by ID
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    if (!db) return res.status(500).json({ message: 'Database connection not initialized' });
    const { username, email, mobileNumber, gender, dob, profession, location, linkedin_url, github_url, role, isActive } = req.body;
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
    if (role !== undefined && req.userRole === 'ADMIN') { updates.push('`role`=?'); values.push(role); }
    if (isActive !== undefined && req.userRole === 'ADMIN') { updates.push('`isActive`=?'); values.push(isActive); }
    if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });
    values.push(req.params.id);
    await db.query(`UPDATE \`user\` SET ${updates.join(', ')} WHERE \`id\`=?`, values);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = getPool();
    if (!db) return res.status(500).json({ message: 'Database connection not initialized' });
    if (parseInt(req.params.id) === req.userId) return res.status(400).json({ message: 'Cannot delete your own account' });
    await db.query('DELETE FROM `user` WHERE `id` = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
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
