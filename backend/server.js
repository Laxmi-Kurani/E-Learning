const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const { setupPool, getPool } = require('./config/database');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(fileUpload({
  limits: { fileSize: 7 * 1024 * 1024 }, // 7MB limit
  abortOnLimit: true,
  createParentPath: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize database tables
const initTables = async () => {
  try {
    const DB_TYPE = process.env.DB_TYPE || 'mysql';
    console.log('DB_TYPE:', DB_TYPE);
    
    if (DB_TYPE === 'sqlite') {
      // For SQLite, use Sequelize sync
      const { sequelize, User } = require('./models');
      await sequelize.sync({ force: false });
      console.log('Database tables initialized with Sequelize');
      
      // Create default admin user using Sequelize
      const bcrypt = require('bcryptjs');
      
      const existingAdmin = await User.findOne({ where: { email: process.env.ADMIN_EMAIL } });
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
        await User.create({
          username: 'admin',
          email: process.env.ADMIN_EMAIL,
          password: hashedPassword,
          role: 'ADMIN'
        });
        console.log('Default admin user created');
        console.log(`Admin Email: ${process.env.ADMIN_EMAIL}`);
        console.log(`Admin Password: ${process.env.ADMIN_PASSWORD}`);
      }
    } else {
      // For MySQL, use the existing pool method
      await setupPool();
      const db = getPool();
      
      const sqlFile = fs.readFileSync(path.join(__dirname, 'config', 'tables.sql'), 'utf8');
      const statements = sqlFile.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await db.query(statement);
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
        console.log('Default admin user created');
        console.log(`Admin Email: ${process.env.ADMIN_EMAIL}`);
        console.log(`Admin Password: ${process.env.ADMIN_PASSWORD}`);
      }
    }
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
};

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/courses', require('./routes/course.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/learning', require('./routes/learning.routes'));
app.use('/api/progress', require('./routes/progress.routes'));
app.use('/api/questions', require('./routes/question.routes'));
app.use('/api/assessments', require('./routes/assessment.routes'));
app.use('/api/discussions', require('./routes/discussion.routes'));
app.use('/api/feedbacks', require('./routes/feedback.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/certificates', require('./routes/certificate.routes'));
app.use('/api/chatbot', require('./routes/chatbot.routes'));

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
    console.log('Starting server...');
    
    // Start server first
    const server = app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`📍 API Health: http://localhost:${PORT}/api/health`);
      console.log(`📍 Test in browser: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.error('Try: netstat -ano | findstr :8080');
        console.error('Or change PORT in .env file');
      } else {
        console.error('❌ Server error:', err);
      }
      process.exit(1);
    });

    // Initialize database after server starts
    console.log('Initializing database...');
    await initTables();
    console.log('✅ Database initialization complete');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();