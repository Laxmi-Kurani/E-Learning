# Dual Database Testing Guide

This guide will help you test the E-Learning application with both **MySQL** and **MongoDB** databases. The project now supports seamless switching between database types.

---

## 📋 Prerequisites

### For MySQL Testing:
- MySQL Server 5.7+ running locally or remotely
- Database credentials (host, user, password, database name)

### For MongoDB Testing:
- MongoDB Server 4.0+ running locally or via MongoDB Atlas
- MongoDB connection URI

### Node.js & npm
- Node.js 14+ installed
- npm dependencies installed in both backend and frontend

---

## 🚀 Quick Start: Testing Both Databases

### Step 1: Prepare the Backend Environment

Create or update `backend/.env`:

```env
# ============ Database Selection ============
# Set DB_TYPE to 'mysql' or 'mongodb'
DB_TYPE=mysql

# ============ MySQL Configuration ============
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_db

# ============ MongoDB Configuration ============
MONGO_URI=mongodb://localhost:27017/lms

# ============ Server & JWT Configuration ============
PORT=5000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=3600
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=pass123
```

---

## 📁 Test Scenario 1: MySQL Database

### 1.1 Setup MySQL Database

Open a terminal and run:

```bash
# Connect to MySQL
mysql -u root -p

# Create database (from backend/config/tables.sql)
CREATE DATABASE IF NOT EXISTS lms_db;
USE lms_db;
SOURCE backend/config/tables.sql;
```

Or use the MySQL script:

```bash
mysql -u root -p lms_db < backend/config/tables.sql
```

### 1.2 Update .env for MySQL

```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_db
MONGO_URI=mongodb://localhost:27017/lms
```

### 1.3 Start Backend Server

```bash
cd backend
npm install
node server.js
```

Expected output:
```
Server running on port 5000
Database (MySQL) synchronized successfully!
Admin user seeded!
```

### 1.4 Test Key Endpoints

**a) Register a User**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!",
    "mobileNumber": "9876543210",
    "gender": "M",
    "dob": "1995-01-15"
  }'
```

Expected response:
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

**b) Login**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "pass123"
  }'
```

Expected response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

**c) Create a Category**

```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Web Development"
  }'
```

**d) Create a Course**

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "React Basics",
    "description": "Learn React from scratch",
    "category": "Web Development",
    "instructor": "John Doe",
    "duration": "4 weeks",
    "level": "Beginner",
    "price": 49.99
  }'
```

**e) Get Courses**

```bash
curl -X GET http://localhost:5000/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 1.5 Verify MySQL Data

```bash
# Connect to MySQL
mysql -u root -p lms_db

# Run queries
SELECT COUNT(*) FROM user;
SELECT COUNT(*) FROM category;
SELECT COUNT(*) FROM course;
```

---

## 📁 Test Scenario 2: MongoDB Database

### 2.1 Setup MongoDB

**Option A: Local MongoDB**

Ensure MongoDB is running:

```bash
# On Windows (with MongoDB installed)
net start MongoDB

# Or if using WSL
sudo service mongod start
```

**Option B: MongoDB Atlas (Cloud)**

1. Create account at [mongodb.com/cloud](https://www.mongodb.com/cloud)
2. Create a cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/lms?retryWrites=true`

### 2.2 Update .env for MongoDB

```env
DB_TYPE=mongodb
MONGO_URI=mongodb://localhost:27017/lms

# MySQL config (optional, can keep same)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_db
```

### 2.3 Start Backend Server

```bash
cd backend
node server.js
```

Expected output:
```
Server running on port 5000
Connected to MongoDB at mongodb://localhost:27017/lms
Admin user seeded!
```

### 2.4 Test Same Endpoints as MySQL

Run the exact same curl commands from Step 1.4 (a-e). The backend will automatically:
- Store data in MongoDB collections instead of MySQL tables
- Use Mongoose models instead of Sequelize
- Return identical response formats

### 2.5 Verify MongoDB Data

```bash
# Connect to MongoDB
mongosh

# Use the lms database
use lms

# Check collections
db.getCollectionNames()

# Count documents
db.user.countDocuments()
db.category.countDocuments()
db.course.countDocuments()

# View sample documents
db.user.findOne()
db.course.findOne()
```

---

## 🧪 Comprehensive Test Suite

Create `backend/test-dual-db.js`:

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testDualDatabase() {
  console.log('\n🧪 Starting Dual Database Tests...\n');
  let token = '';

  try {
    // 1. Login
    console.log('📱 Test 1: Login');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'pass123'
    });
    token = loginRes.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...\n');

    // 2. Create Category
    console.log('📂 Test 2: Create Category');
    const categoryRes = await axios.post(
      `${BASE_URL}/categories`,
      { name: `Test Category ${Date.now()}` },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const categoryId = categoryRes.data.id || categoryRes.data._id;
    console.log('✅ Category created, ID:', categoryId, '\n');

    // 3. Create Course
    console.log('📚 Test 3: Create Course');
    const courseRes = await axios.post(
      `${BASE_URL}/courses`,
      {
        title: `Test Course ${Date.now()}`,
        description: 'Test course description',
        category: 'Web Development',
        instructor: 'Test Instructor',
        duration: '4 weeks',
        level: 'Beginner',
        price: 99.99
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const courseId = courseRes.data.id || courseRes.data._id;
    console.log('✅ Course created, ID:', courseId, '\n');

    // 4. Get Courses
    console.log('📋 Test 4: Get Courses');
    const coursesRes = await axios.get(`${BASE_URL}/courses`);
    console.log('✅ Retrieved', coursesRes.data.length || coursesRes.data.courses?.length, 'courses\n');

    // 5. Enroll User in Course
    console.log('👤 Test 5: Enroll User in Course');
    const enrollRes = await axios.post(
      `${BASE_URL}/learning/enroll`,
      { course_id: courseId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ User enrolled successfully\n');

    // 6. Get User Profile
    console.log('👥 Test 6: Get User Profile');
    const profileRes = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile retrieved:', profileRes.data.username, '\n');

    // 7. Get Analytics
    console.log('📊 Test 7: Get Analytics');
    const analyticsRes = await axios.get(`${BASE_URL}/analytics/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Analytics retrieved:', analyticsRes.data, '\n');

    console.log('✅✅✅ All tests passed! ✅✅✅\n');
  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

testDualDatabase();
```

Run the test:

```bash
cd backend
npm install axios
node test-dual-db.js
```

---

## 🔄 Database Switching Checklist

### To Switch from MySQL → MongoDB:

```bash
# 1. Stop backend server (Ctrl+C)

# 2. Update .env
DB_TYPE=mongodb
MONGO_URI=mongodb://localhost:27017/lms

# 3. Ensure MongoDB is running
# mongosh or mongo (check local MongoDB)

# 4. Restart backend
npm start

# 5. Run tests
node test-dual-db.js
```

### To Switch from MongoDB → MySQL:

```bash
# 1. Stop backend server (Ctrl+C)

# 2. Update .env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_db

# 3. Ensure MySQL is running
# mysql -u root -p

# 4. Restart backend
npm start

# 5. Run tests
node test-dual-db.js
```

---

## 📊 Comparison Matrix

| Feature | MySQL | MongoDB |
|---------|-------|---------|
| **ORM/ODM** | Sequelize | Mongoose |
| **Schema** | SQL (strict) | Flexible (JSON-like) |
| **Transactions** | ✅ ACID | ✅ Multi-doc ACID |
| **Performance** | ⚡ SQL queries | ⚡ Document queries |
| **Scalability** | Vertical | Horizontal |
| **Relationships** | Foreign keys | References |
| **Data Format** | Rows/Tables | Collections/Documents |

---

## 🐛 Debugging Tips

### MySQL Issues:
```bash
# Check if MySQL is running
mysql -u root -p -e "SELECT 1;"

# View error logs
tail -100 /var/log/mysql/error.log (Linux)
```

### MongoDB Issues:
```bash
# Check if MongoDB is running
mongosh

# View logs
tail -100 /var/log/mongodb/mongod.log
```

### Backend Debugging:
```bash
# Enable SQL logging (in .env)
NODE_ENV=development

# Check models are correctly loaded
node -e "const { DB_TYPE } = require('./models'); console.log('DB_TYPE:', DB_TYPE);"
```

---

## 📝 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED 127.0.0.1:3306` | MySQL not running | Start MySQL service |
| `MongooseError: Cannot connect` | MongoDB not running | Start MongoDB service |
| `ER_DUP_ENTRY` | Duplicate email in MySQL | Clear data or use unique email |
| `ValidationError` | Missing required fields | Check request body format |
| `404 Not Found` | Wrong endpoint | Verify API_ENDPOINTS.md |

---

## ✅ Final Verification

After testing both databases, verify:

- [ ] MySQL registration & login works
- [ ] MongoDB registration & login works
- [ ] Categories created in both databases
- [ ] Courses created and retrieved
- [ ] User enrollment works
- [ ] Analytics endpoint responds with data
- [ ] Switching between DB_TYPE doesn't break app
- [ ] All model exports are correct
- [ ] No data corruption during migration

---

## 📞 Support

If you encounter issues:

1. Check `.env` configuration
2. Verify database connectivity
3. Review backend logs (`npm start`)
4. Check `backend/server.js` initialization
5. Run individual test endpoints with curl
6. See [QUESTION_TESTING_GUIDE.js](./QUESTION_TESTING_GUIDE.js) for question endpoints

---

**Happy Testing! 🎉**
