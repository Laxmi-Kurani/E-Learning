# 🎯 Quick Reference: Dual Database Commands

## Database Switching

```bash
# Switch to MySQL
npm run switch:mysql

# Switch to MongoDB
npm run switch:mongodb

# Switch to PostgreSQL
npm run switch:postgres

# Switch to SQLite
npm run switch:sqlite
```

## Starting Server

```bash
# Default (uses current DB_TYPE from .env)
npm start

# With auto-reload (requires nodemon)
npm run dev
```

## Running Tests

```bash
# Test current database
npm run test:db

# Test MySQL specifically
npm run test:mysql

# Test MongoDB specifically
npm run test:mongodb
```

## Database Connection Verification

### MySQL
```bash
# Connect
mysql -u root -p

# Check database exists
SHOW DATABASES;
USE lms_db;
SHOW TABLES;

# Count users
SELECT COUNT(*) FROM user;

# Exit
EXIT;
```

### MongoDB
```bash
# Connect (local)
mongosh

# Use database
use lms

# Check collections
db.getCollectionNames()

# Count users
db.user.countDocuments()

# View sample
db.user.findOne()

# Exit
exit
```

## Starting/Stopping Services

### MySQL (Windows)
```bash
# Start
net start MySQL80

# Stop
net stop MySQL80

# Check status
sc query MySQL80
```

### MongoDB (Windows)
```bash
# Start (if installed as service)
net start MongoDB

# Stop
net stop MongoDB

# Or run manually
mongod
```

## .env Configuration

### MySQL Template
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_db
MONGO_URI=mongodb://localhost:27017/lms
PORT=5000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=3600
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=pass123
```

### MongoDB Template
```env
DB_TYPE=mongodb
MONGO_URI=mongodb://localhost:27017/lms
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_db
PORT=5000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=3600
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=pass123
```

## API Testing

### Login (Get Token)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "pass123"
  }'
```

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!",
    "mobileNumber": "9876543210"
  }'
```

### Create Category
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Web Development"}'
```

### Create Course
```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "React Basics",
    "description": "Learn React",
    "category": "Web Development",
    "instructor": "John Doe",
    "duration": "4 weeks",
    "level": "Beginner",
    "price": 49.99
  }'
```

### Get Courses
```bash
curl http://localhost:5000/api/courses
```

### Get Profile (authenticated)
```bash
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## File Locations

| File | Purpose |
|------|---------|
| `backend/.env` | Environment variables, database config |
| `backend/server.js` | Main server file |
| `backend/models/index.js` | Database models & connections |
| `backend/routes/` | API endpoints |
| `backend/config/tables.sql` | MySQL schema |
| `backend/test-dual-database.js` | Test suite |
| `backend/switch-database.js` | Database switcher utility |

## Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| `Cannot connect to MySQL` | `net start MySQL80` |
| `Cannot connect to MongoDB` | `mongod` |
| `Port 5000 in use` | Change PORT in `.env` |
| `Duplicate email error` | Clear test data or use unique email |
| `MONGO_URI not found` | Check `.env` file, must be valid URI |
| `Models not found` | Ensure all files in `backend/models/` exist |

## Test Workflow

```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Run Tests
cd backend
npm run test:db

# Terminal 3: Verify Database (optional)
mysql -u root -p lms_db        # For MySQL
# or
mongosh                         # For MongoDB
```

## Performance Tips

### MySQL
- Index frequently searched columns
- Use EXPLAIN to analyze queries
- Regular VACUUM and OPTIMIZE
- Monitor slow query log

### MongoDB
- Create indexes on frequently queried fields
- Use aggregation pipeline for complex queries
- Monitor with MongoDB Compass
- Set appropriate TTL for temp data

## Ports

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5000 | http://localhost:5000 |
| Frontend | 3000 | http://localhost:3000 |
| MySQL | 3306 | localhost:3306 |
| MongoDB | 27017 | localhost:27017 |

## Environment Variables Summary

| Variable | Purpose | Example |
|----------|---------|---------|
| `DB_TYPE` | Database type | mysql, mongodb, postgres, sqlite |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 3306 (MySQL), 5432 (PostgreSQL) |
| `DB_USER` | Database user | root |
| `DB_PASSWORD` | Database password | your_password |
| `DB_NAME` | Database name | lms_db |
| `MONGO_URI` | MongoDB connection | mongodb://localhost:27017/lms |
| `PORT` | API server port | 5000 |
| `JWT_SECRET` | JWT signing key | your_jwt_secret_key |
| `JWT_EXPIRATION` | Token expiry in seconds | 3600 (1 hour) |
| `ADMIN_EMAIL` | Default admin email | admin@example.com |
| `ADMIN_PASSWORD` | Default admin password | pass123 |

## Helpful Links

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Sequelize Documentation](https://sequelize.org/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Express.js Guide](https://expressjs.com/)

---

**Print or bookmark this page for quick reference while testing!**
