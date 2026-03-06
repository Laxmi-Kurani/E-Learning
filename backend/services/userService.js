// User Service - Database operations for users

const bcrypt = require('bcryptjs');
const { User, DB_TYPE } = require('../models');

class UserService {
  /**
   * Create new user
   */
  static async createUser(userData) {
    try {
      const { password, ...rest } = userData;
      const hashedPassword = await bcrypt.hash(password, 10);

      if (DB_TYPE === 'mongodb') {
        const u = new User({ ...rest, password: hashedPassword });
        const saved = await u.save();
        const obj = saved.toObject();
        delete obj.password;
        obj.id = obj._id;
        return obj;
      } else {
        const user = await User.create({ ...rest, password: hashedPassword });
        const data = user.toJSON();
        delete data.password;
        return data;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email) {
    if (DB_TYPE === 'mongodb') {
      return await User.findOne({ email }).lean();
    }
    return await User.findOne({ where: { email } });
  }

  /**
   * Get user by ID
   */
  static async getUserById(id, includeSensitive = false) {
    if (DB_TYPE === 'mongodb') {
      const query = { _id: id };
      const projection = includeSensitive ? {} : { password: 0 };
      const doc = await User.findOne(query, projection).lean();
      if (doc) doc.id = doc._id;
      return doc;
    }

    const options = {};
    if (!includeSensitive) {
      options.attributes = { exclude: ['password'] };
    }
    return await User.findByPk(id, options);
  }

  /**
   * Get all users with pagination
   */
  static async getAllUsers(limit = 10, offset = 0) {
    if (DB_TYPE === 'mongodb') {
      const query = {};
      const total = await User.countDocuments(query);
      const docs = await User.find(query, {
        password: 0,
        __v: 0,
      })
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limit)
        .lean();
      // map _id -> id
      const users = docs.map(d => ({ ...d, id: d._id }));
      return { users, total };
    }

    const { count, rows } = await User.findAndCountAll({
      attributes: [
        'id', 'username', 'email', 'role', 'isActive',
        'mobileNumber', 'gender', 'dob', 'profession', 'location',
        'linkedin_url', 'github_url', 'profile_image', 'created_at'
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return { users: rows, total: count };
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, updates) {
    const allowedFields = [
      'username', 'email', 'mobileNumber', 'gender', 'dob',
      'profession', 'location', 'linkedin_url', 'github_url', 'profile_image'
    ];
    const payload = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) payload[field] = updates[field];
    }
    if (Object.keys(payload).length === 0) return false;

    if (DB_TYPE === 'mongodb') {
      await User.updateOne({ _id: userId }, { $set: payload });
    } else {
      await User.update(payload, { where: { id: userId } });
    }
    return true;
  }

  /**
   * Change password
   */
  static async changePassword(userId, oldPassword, newPassword) {
    const user = await this.getUserById(userId, true);
    if (!user) return false;
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) return false;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (DB_TYPE === 'mongodb') {
      await User.updateOne({ _id: userId }, { password: hashedPassword });
    } else {
      await User.update({ password: hashedPassword }, { where: { id: userId } });
    }
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
    if (DB_TYPE === 'mongodb') {
      // run counts using mongoose
      const users = await User.countDocuments({ role: 'USER' });
      const admins = await User.countDocuments({ role: 'ADMIN' });
      // other collections still assumed to exist using mongoose models or raw queries
      const courses = await require('./courseService').countAllMongo?.() || 0;
      const enrollments = await require('./learningService').countByStatusMongo?.('APPROVED') || 0;
      const pendingEnrollments = await require('./learningService').countByStatusMongo?.('PENDING') || 0;
      const assessments = await require('./assessmentService').countAllMongo?.() || 0;
      const recentEnrollments = await require('./learningService').countSinceMongo?.(7) || 0;
      const completedCourses = await require('./progressService').countCompletedMongo?.() || 0;
      return { users, admins, courses, enrollments, pendingEnrollments, assessments, recentEnrollments, completedCourses };
    }

    // you can still run raw SQL using sequelize.query while transitioning
    const { sequelize } = require('../models');

    const [userCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM user WHERE role = ?',
      { replacements: ['USER'], type: sequelize.QueryTypes.SELECT }
    );
    const [adminCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM user WHERE role = ?',
      { replacements: ['ADMIN'], type: sequelize.QueryTypes.SELECT }
    );
    const [courseCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM course',
      { type: sequelize.QueryTypes.SELECT }
    );
    const [enrollmentCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM learning WHERE status = ?',
      { replacements: ['APPROVED'], type: sequelize.QueryTypes.SELECT }
    );
    const [pendingCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM learning WHERE status = ?',
      { replacements: ['PENDING'], type: sequelize.QueryTypes.SELECT }
    );
    const [assessmentCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM assessment',
      { type: sequelize.QueryTypes.SELECT }
    );
    const [recentEnrollments] = await sequelize.query(
      'SELECT COUNT(*) as count FROM learning WHERE enrolled_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
      { type: sequelize.QueryTypes.SELECT }
    );
    const [completionStats] = await sequelize.query(
      'SELECT COUNT(*) as completed FROM progress WHERE completed = true',
      { type: sequelize.QueryTypes.SELECT }
    );

    return {
      users: userCount.count,
      admins: adminCount.count,
      courses: courseCount.count,
      enrollments: enrollmentCount.count,
      pendingEnrollments: pendingCount.count,
      assessments: assessmentCount.count,
      recentEnrollments: recentEnrollments.count,
      completedCourses: completionStats.completed
    };
  }
}

module.exports = UserService;