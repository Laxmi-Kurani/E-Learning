# 🚀 Step-by-Step: Test Both Databases

This guide walks you through testing your E-Learning application on both **MySQL** and **MongoDB**.

---

## Part 1: Test MySQL Database

### Step 1.1: Prepare MySQL

```bash
# Open a terminal/PowerShell

# Start MySQL (Windows)
net start MySQL80

# Or verify it's running
mysql -u root -p -e "SELECT 1;"
```

Expected output: ✅ Connection successful

### Step 1.2: Create Database Schema

```bash
# Create the database and tables
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS lms_db;"
mysql -u root -p lms_db < backend/config/tables.sql

# Verify tables were created
mysql -u root -p lms_db -e "SHOW TABLES;"
```

Expected output:
```
+---------------------------+
| Tables_in_lms_db          |
+---------------------------+
| assessment                |
| category                  |
| certificate               |
| course                    |
| discussion                |
| feedback                  |
| learning                  |
| notification              |
| progress                  |
| question                  |
| user                      |
+---------------------------+
```

### Step 1.3: Configure .env for MySQL

Update `backend/.env`:

```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_db
MONGO_URI=mongodb://localhost:27017/lms
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=3600
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=pass123
```

Or use the switcher:
```bash
cd backend
npm run switch:mysql
```

### Step 1.4: Start Backend Server

```bash
cd backend
npm install
npm start
```

Wait for output:
```
Server running on port 5000
Database (MySQL) synchronized successfully!
Admin user seeded!
```

✅ **MySQL Backend is running!**

### Step 1.5: Run Tests in New Terminal

```bash
# Open a new terminal/PowerShell
cd backend
npm run test:mysql
```

You should see output like:
```
✅ Backend is reachable at http://localhost:5000/api
✅ User registered with ID: 1
✅ Login successful, token obtained
✅ Category created with ID: 1
✅ Retrieved 5 categories
✅ Course created with ID: 1
✅ Retrieved 3 courses
✅ Profile retrieved
✅ Successfully enrolled in course
✅ Retrieved 1 enrollments
✅ Analytics retrieved

✅✅✅ All tests passed! Your MySQL configuration is working correctly.
```

### Step 1.6: Verify Data in MySQL

```bash
# In a third terminal, check the data
mysql -u root -p lms_db

# Inside MySQL prompt
SELECT COUNT(*) AS 'Total Users' FROM user;
SELECT COUNT(*) AS 'Total Categories' FROM category;
SELECT COUNT(*) AS 'Total Courses' FROM course;

# Exit MySQL
EXIT;
```

✅ **MySQL Testing Complete!**

---

## Part 2: Switch to MongoDB & Test

### Step 2.1: Stop MySQL Backend

In the backend terminal where `npm start` is running:
```
Ctrl+C
```

### Step 2.2: Prepare MongoDB

**Option A: Local MongoDB**

```bash
# Windows (if MongoDB installed)
net start MongoDB

# Or start MongoDB manually
mongod
```

**Option B: MongoDB Atlas (Cloud)**

1. Go to [mongodb.com/cloud](https://www.mongodb.com/cloud)
2. Create a free account
3. Create a cluster
4. Copy the connection string
5. Use it as `MONGO_URI` in `.env`

### Step 2.3: Configure .env for MongoDB

Update `backend/.env`:

```env
DB_TYPE=mongodb
MONGO_URI=mongodb://localhost:27017/lms
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_db
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=3600
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=pass123
```

Or use the switcher:
```bash
cd backend
npm run switch:mongodb
```

### Step 2.4: Start Backend Server (MongoDB Mode)

```bash
# In the same backend terminal
npm start
```

Wait for output:
```
Server running on port 5000
Connected to MongoDB at mongodb://localhost:27017/lms
Admin user seeded!
```

✅ **MongoDB Backend is running!**

### Step 2.5: Run Tests in Another Terminal

```bash
# In another terminal
cd backend
npm run test:mongodb
```

You should see the same results as MySQL:
```
✅ Backend is reachable at http://localhost:5000/api
✅ User registered with ID: ObjectId(...)
✅ Login successful, token obtained
✅ Category created with ID: ObjectId(...)
✅ Retrieved 5 categories
✅ Course created with ID: ObjectId(...)
✅ Retrieved 3 courses
✅ Profile retrieved
✅ Successfully enrolled in course
✅ Retrieved 1 enrollments
✅ Analytics retrieved

✅✅✅ All tests passed! Your MongoDB configuration is working correctly.
```

### Step 2.6: Verify Data in MongoDB

```bash
# Open MongoDB shell
mongosh

# Use the database
use lms

# Count documents
db.user.countDocuments()
db.category.countDocuments()
db.course.countDocuments()

# View a sample user
db.user.findOne()

# Exit
exit
```

✅ **MongoDB Testing Complete!**

---

## Part 3: Compare Results

| Aspect | MySQL | MongoDB |
|--------|-------|---------|
| **Database Type** | Relational | Document |
| **Storage** | Tables/Rows | Collections/Documents |
| **Schema** | Strict/Fixed | Flexible/JSON-like |
| **IDs** | Numeric (1, 2, 3) | ObjectId (long strings) |
| **Speed** | ⚡ Excellent for relational queries | ⚡ Excellent for document retrieval |
| **Scalability** | Vertical (add more RAM/CPU) | Horizontal (add more servers) |

---

## Part 4: Switch Back to MySQL (Optional)

If you want to test switching again:

```bash
# Stop backend (Ctrl+C)

# Switch back to MySQL
cd backend
npm run switch:mysql

# Restart backend
npm start

# Test
npm run test:mysql
```

---

## 📋 Final Checklist

### MySQL Setup ✅
- [ ] MySQL installed and running
- [ ] Database `lms_db` created
- [ ] Tables imported from `tables.sql`
- [ ] `.env` set to `DB_TYPE=mysql`
- [ ] Backend starts without errors
- [ ] All tests pass
- [ ] Data verified in MySQL

### MongoDB Setup ✅
- [ ] MongoDB installed/Atlas account created
- [ ] `.env` set to `DB_TYPE=mongodb`
- [ ] ``MONGO_URI`` configured correctly
- [ ] Backend starts without errors
- [ ] All tests pass
- [ ] Data verified in MongoDB

### Comparison Complete ✅
- [ ] Both databases work identically from API perspective
- [ ] Switching is simple (just change `.env`)
- [ ] Same endpoints return same data (different formats)
- [ ] All 9 test cases pass on both databases
- [ ] Ready to choose which database to use for production

---

## 🔧 Troubleshooting

### MySQL Won't Start
```bash
# Check if port 3306 is in use
netstat -ano | findstr :3306

# Start MySQL service
net start MySQL80
```

### MongoDB Won't Connect
```bash
# Verify MongoDB is running
mongosh

# If it fails, start MongoDB
mongod
```

### Tests Fail
```bash
# Ensure backend is running
npm start

# In another terminal, run tests
npm run test:db

# Check output for specific error message
```

### Database Already Has Data
```bash
# Clear MySQL
mysql -u root -p lms_db -e "TRUNCATE TABLE user;"

# Clear MongoDB
mongosh
use lms
db.user.deleteMany({})
exit
```

---

## 🎯 Success Criteria

You've successfully tested both databases when:

1. ✅ Backend starts with "Database synchronized" message
2. ✅ All 9 tests pass (100%)
3. ✅ Data is visible when you query the database directly
4. ✅ You can switch between MySQL and MongoDB
5. ✅ Same API calls work on both databases
6. ✅ Response formats are correct (MySQL has `id`, MongoDB has `_id`)

---

## 📞 Next Steps

Once testing is complete:

1. **Choose Your Database**: Decide which one to use for production
2. **Data Migration**: If switching, migrate existing data
3. **Backup Strategy**: Plan database backups
4. **Monitoring**: Set up monitoring and alerts
5. **Performance Tuning**: Optimize queries for your chosen database

---

**Estimated Time:** 30-45 minutes total
**Difficulty:** Easy ⭐☆☆☆☆

**Happy Testing! 🎉**
