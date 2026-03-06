const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bcrypt = require('bcryptjs');

const { setupPool } = require('./config/database');

// ORM/setup exports various items
const { sequelize, User, DB_TYPE, mongoose } = require('./models');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database tables (via Sequelize) and default admin user
const initDatabase = async () => {
  try {
    // announce the selected database type
    console.log(`📌 DB_TYPE is set to '${DB_TYPE}'`);
    if (DB_TYPE !== 'mongodb') {
      // initialize legacy pool too (services/routes may still use it)
      await setupPool();

      await sequelize.authenticate();
      // synchronize all defined models to the DB (creates tables if they don't exist)
      await sequelize.sync({ alter: true }); // alter keeps existing data but updates schema
      console.log('✅ ORM models synced with database');
    } else {
      // ensure mongoose connection ready
      if (mongoose) {
        mongoose.connection.on('error', err => console.error('Mongo connection error:', err));
        mongoose.connection.once('open', () => console.log('✅ Connected to MongoDB'));
      }
    }

    // ensure default admin user across databases
    if (DB_TYPE === 'mongodb') {
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
        console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL}`);
        console.log(`🔑 Admin Password: ${process.env.ADMIN_PASSWORD}`);
      } else {
        console.log('ℹ️ Admin user already exists');
        // ensure password matches environment variable
        const passwordMatches = await bcrypt.compare(process.env.ADMIN_PASSWORD, admin.password);
        if (!passwordMatches) {
          admin.password = hashedEnvPassword;
          await admin.save();
          console.log('🔄 Admin password was out of sync and has been updated to match .env');
        }
      }
    } else {
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
        console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL}`);
        console.log(`🔑 Admin Password: ${process.env.ADMIN_PASSWORD}`);
      } else {
        console.log('ℹ️ Admin user already exists');
        // synchronize existing password if environment password changed
        const passwordMatches = await bcrypt.compare(process.env.ADMIN_PASSWORD, admin.password);
        if (!passwordMatches) {
          admin.password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
          await admin.save();
          console.log('🔄 Admin password was out of sync and has been updated to match .env');
        }
      }
    }
  } catch (error) {
    console.error('Error initializing ORM/database:', error);
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
const PORT = process.env.PORT || 8080;

(async () => {
  try {
    // initialize ORM and sync models
    await initDatabase();

    // Start listening after database is ready with error handling
    const server = app.listen(PORT, () => {
      console.log('🚀 Server is running on port ' + PORT);
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

