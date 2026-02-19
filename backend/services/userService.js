// User Service - Database operations for users

const { getPool } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserService {
  /**
   * Create new user
   */
  static async createUser(userData) {
    try {
      const db = getPool();
      const { username, email, password, mobileNumber, dob, gender, location, profession, linkedin_url, github_url, role } = userData;
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [result] = await db.query(
        `INSERT INTO user (username, email, password, mobileNumber, dob, gender, location, profession, linkedin_url, github_url, role) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, email, hashedPassword, mobileNumber || null, dob || null, gender || null, location || null, profession || null, linkedin_url || null, github_url || null, role || 'USER']
      );
      
      return { id: result.insertId, ...userData, password: hashedPassword };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email) {
    const db = getPool();
    const [users] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Get user by ID
   */
  static async getUserById(id, includeSensitive = false) {
    const db = getPool();
    const [users] = await db.query('SELECT * FROM user WHERE id = ?', [id]);
    
    if (users.length === 0) return null;
    
    const user = users[0];
    if (!includeSensitive) {
      delete user.password;
    }
    return user;
  }

  /**
   * Get all users with pagination
   */
  static async getAllUsers(limit, offset) {
    const db = getPool();
    const [total] = await db.query('SELECT COUNT(*) as count FROM user');
    const [users] = await db.query(
      'SELECT id, username, email, role, created_at FROM user ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    return {
      users,
      total: total[0].count
    };
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, updates) {
    const db = getPool();
    const updateFields = [];
    const values = [];
    
    const allowedFields = ['username', 'email', 'mobileNumber', 'gender', 'dob', 'profession', 'location', 'linkedin_url', 'github_url', 'profile_image'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field}=?`);
        values.push(updates[field]);
      }
    }
    
    if (updateFields.length === 0) {
      return false;
    }
    
    values.push(userId);
    const query = `UPDATE user SET ${updateFields.join(', ')} WHERE id=?`;
    await db.query(query, values);
    
    return true;
  }

  /**
   * Change password
   */
  static async changePassword(userId, oldPassword, newPassword) {
    const db = getPool();
    const user = await this.getUserById(userId, true);
    
    if (!user) return false;
    
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) return false;
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE user SET password=? WHERE id=?', [hashedPassword, userId]);
    
    return true;
  }

  /**
   * Verify password
   */
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats() {
    const db = getPool();
    
    const [userCountResult] = await db.query('SELECT COUNT(*) as count FROM user WHERE role = ?', ['USER']);
    const [adminCountResult] = await db.query('SELECT COUNT(*) as count FROM user WHERE role = ?', ['ADMIN']);
    const [courseCountResult] = await db.query('SELECT COUNT(*) as count FROM course');
    const [enrollmentCountResult] = await db.query('SELECT COUNT(*) as count FROM learning WHERE status = ?', ['APPROVED']);
    const [pendingCountResult] = await db.query('SELECT COUNT(*) as count FROM learning WHERE status = ?', ['PENDING']);
    const [assessmentCountResult] = await db.query('SELECT COUNT(*) as count FROM assessment');
    const [recentEnrollmentsResult] = await db.query(
      'SELECT COUNT(*) as count FROM learning WHERE enrolled_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    const [completionStatsResult] = await db.query(
      'SELECT COUNT(*) as completed FROM progress WHERE completed = true'
    );
    
    return {
      users: userCountResult[0].count,
      admins: adminCountResult[0].count,
      courses: courseCountResult[0].count,
      enrollments: enrollmentCountResult[0].count,
      pendingEnrollments: pendingCountResult[0].count,
      assessments: assessmentCountResult[0].count,
      recentEnrollments: recentEnrollmentsResult[0].count,
      completedCourses: completionStatsResult[0].completed
    };
  }
}

module.exports = UserService;
