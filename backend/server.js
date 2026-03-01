const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { setupPool, getPool } = require('./config/database');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database tables and admin user
const initTables = async () => {
  try {
    const db = getPool();
    
    const sqlFile = fs.readFileSync(path.join(__dirname, 'config', 'tables.sql'), 'utf8');
    const statements = sqlFile.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.query(statement);
        } catch (error) {
          // Ignore "table already exists" errors
          if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
            console.error('Error executing SQL:', error.message);
          }
        }
      }
    }
    
    console.log('Database tables initialized');
    
    // Create default admin user
    const [users] = await db.query('SELECT * FROM user WHERE email = ?', [process.env.ADMIN_EMAIL]);
    
    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await db.query(
        'INSERT INTO user (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['admin', process.env.ADMIN_EMAIL, hashedPassword, 'ADMIN']
      );
      console.log('✅ Default admin user created');
      console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL}`);
      console.log(`🔑 Admin Password: ${process.env.ADMIN_PASSWORD}`);
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing tables:', error);
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
    // Setup database pool first
    const db = await setupPool();
    console.log('✅ Database connection established');
    
    // Initialize tables and admin user
    await initTables();
    
    // Start listening after everything is ready
    app.listen(PORT, () => {
      console.log('🚀 Server is running on port ' + PORT);
      console.log(`📍 API Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
})();
