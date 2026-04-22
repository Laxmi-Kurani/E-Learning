const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { setupPool } = require('./config/database');
const { sequelize, User, DB_TYPE, mongoose } = require('./models');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(fileUpload({
  limits: { fileSize: 7 * 1024 * 1024 },
  abortOnLimit: true,
  createParentPath: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const initDatabase = async () => {
  try {
    console.log(`📌 DB_TYPE is set to '${DB_TYPE}'`);

    if (DB_TYPE === 'mongodb') {
      if (mongoose) {
        mongoose.connection.on('error', err => console.error('Mongo connection error:', err));
        mongoose.connection.once('open', () => console.log('✅ Connected to MongoDB'));
      }

      // Ensure default admin user
      let admin = await User.findOne({ email: process.env.ADMIN_EMAIL });
      const hashedEnvPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      if (!admin) {
        admin = new User({
          username: 'admin',
          email: process.env.ADMIN_EMAIL,
          password: hashedEnvPassword,
          role: 'ADMIN'
        });
        await admin.save();
        console.log('✅ Default admin user created');
      } else {
        console.log('ℹ️ Admin user already exists');
        const passwordMatches = await bcrypt.compare(process.env.ADMIN_PASSWORD, admin.password);
        if (!passwordMatches) {
          admin.password = hashedEnvPassword;
          await admin.save();
          console.log('🔄 Admin password updated to match .env');
        }
      }
    } else {
      await setupPool();
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      console.log('✅ ORM models synced with database');

      const [admin, created] = await User.findOrCreate({
        where: { email: process.env.ADMIN_EMAIL },
        defaults: {
          username: 'admin',
          password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
          role: 'ADMIN'
        }
      });
      if (created) {
        console.log('✅ Default admin user created');
      } else {
        console.log('ℹ️ Admin user already exists');
        const passwordMatches = await bcrypt.compare(process.env.ADMIN_PASSWORD, admin.password);
        if (!passwordMatches) {
          admin.password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
          await admin.save();
          console.log('🔄 Admin password updated to match .env');
        }
      }
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/auth/password', require('./routes/passwordReset.routes'));
app.use('/api/courses', require('./routes/course.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/learning', require('./routes/learning.routes'));
app.use('/api/progress', require('./routes/progress.routes'));
app.use('/api/questions', require('./routes/question.routes'));
app.use('/api/assessments', require('./routes/assessment.routes'));
app.use('/api/discussions', require('./routes/discussion.routes'));
app.use('/api/feedbacks', require('./routes/feedback.routes'));
app.use('/api/certificates', require('./routes/certificate.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LMS Backend API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5002;

(async () => {
  try {
    await initDatabase();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 API Health: http://localhost:${PORT}/api/health`);
    });

    server.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please stop the other process or set a different PORT in your .env`);
      } else {
        console.error('❌ Server error:', err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
})();
