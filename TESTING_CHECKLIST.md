# ✓ Dual Database Testing Checklist

**Project:** E-Learning LMS  
**Date Started:** ___________  
**Tester:** ___________  
**Database Tested:** ☐ MySQL ☐ MongoDB ☐ Both

---

## Pre-Testing Checklist

### Environment Setup
- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm installed and updated (`npm --version`)
- [ ] Project dependencies installed (`npm install` in backend)
- [ ] `.env` file exists in `backend/` folder
- [ ] `DB_TYPE` environment variable set correctly

### Database Prerequisites

#### For MySQL:
- [ ] MySQL Server running (`net start MySQL80`)
- [ ] MySQL credentials ready (host, user, password)
- [ ] Database `lms_db` created
- [ ] Tables imported from `backend/config/tables.sql`
- [ ] Can connect: `mysql -u root -p -e "SELECT 1;"`

#### For MongoDB:
- [ ] MongoDB running (`mongod` or `net start MongoDB`)
- [ ] Connection URI ready (local or Atlas)
- [ ] `MONGO_URI` set in `.env`
- [ ] Can connect: `mongosh` (local) or test connection

---

## Database Setup Phase

### MySQL Setup (if testing)

#### Step 1: Database Creation
- [ ] Command run: `mysql -u root -p -e "CREATE DATABASE lms_db;"`
- [ ] Database created successfully
- [ ] Verified: `SHOW DATABASES;` contains `lms_db`

#### Step 2: Schema Import
- [ ] Command run: `mysql -u root -p lms_db < backend/config/tables.sql`
- [ ] Import completed without errors
- [ ] Verified tables: `SHOW TABLES;` in `lms_db`

#### Step 3: Environment Configuration
- [ ] `.env` contains:
  - [ ] `DB_TYPE=mysql`
  - [ ] `DB_HOST=localhost`
  - [ ] `DB_PORT=3306`
  - [ ] `DB_USER=root`
  - [ ] `DB_PASSWORD=***`
  - [ ] `DB_NAME=lms_db`

#### Step 4: Start Backend
- [ ] Command run: `npm start`
- [ ] Output shows:
  - [ ] "Server running on port 5000"
  - [ ] "Database (MySQL) synchronized successfully!"
  - [ ] "Admin user seeded!"
- [ ] No errors in console

#### Step 5: Test Connection
- [ ] Backend running and accessible
- [ ] Can access: `http://localhost:5000/api/health`

### MongoDB Setup (if testing)

#### Step 1: Database Connection
- [ ] MongoDB service started
- [ ] Connection URI valid and accessible
- [ ] Can connect: `mongosh` or test via driver

#### Step 2: Environment Configuration
- [ ] `.env` contains:
  - [ ] `DB_TYPE=mongodb`
  - [ ] `MONGO_URI=mongodb://localhost:27017/lms`
  - [ ] (Other fields optional but present)

#### Step 3: Start Backend
- [ ] Command run: `npm start`
- [ ] Output shows:
  - [ ] "Server running on port 5000"
  - [ ] "Connected to MongoDB at..."
  - [ ] "Admin user seeded!"
- [ ] No errors in console

#### Step 4: Test Connection
- [ ] Backend running and accessible
- [ ] Can access: `http://localhost:5000/api/health`

---

## Automated Testing Phase

### Run Test Suite

#### For MySQL:
- [ ] Command run: `npm run test:mysql`
- [ ] Test script started
- [ ] All tests completed (should not hang)

#### For MongoDB:
- [ ] Command run: `npm run test:mongodb`
- [ ] Test script started
- [ ] All tests completed (should not hang)

### Test Results Analysis

#### Overall Results:
- [ ] Total tests run: ____ (should be 9)
- [ ] Tests passed: ____ (should be 8-9)
- [ ] Tests failed: ____ (should be 0)
- [ ] Pass rate: ____%  (should be 100%)

#### Individual Test Results - MySQL/MongoDB (circle one):

1. **Backend Connectivity**
   - [ ] ✅ PASSED - [ ] ❌ FAILED
   - Error (if failed): ________________________

2. **User Registration**
   - [ ] ✅ PASSED - [ ] ❌ FAILED
   - User ID created: _______________
   - Error (if failed): ________________________

3. **User Login**
   - [ ] ✅ PASSED - [ ] ❌ FAILED
   - Token obtained: _______________
   - Error (if failed): ________________________

4. **Category Creation**
   - [ ] ✅ PASSED - [ ] ❌ FAILED
   - Category ID: _______________
   - Error (if failed): ________________________

5. **Get Categories**
   - [ ] ✅ PASSED - [ ] ❌ FAILED
   - Count retriev: _______________
   - Error (if failed): ________________________

6. **Course Creation**
   - [ ] ✅ PASSED - [ ] ❌ FAILED
   - Course ID: _______________
   - Error (if failed): ________________________

7. **Get Courses**
   - [ ] ✅ PASSED - [ ] ❌ FAILED
   - Count retrieved: _______________
   - Error (if failed): ________________________

8. **Course Enrollment**
   - [ ] ✅ PASSED - [ ] ❌ FAILED
   - Error (if failed): ________________________

9. **Analytics**
   - [ ] ✅ PASSED - [ ] ❌ FAILED
   - Error (if failed): ________________________

---

## Data Verification Phase

### MySQL Data Verification:

```bash
mysql -u root -p lms_db
```

Run these commands and record results:

1. **Count Users**
   ```sql
   SELECT COUNT(*) FROM user;
   ```
   Result: _________ users

2. **Count Categories**
   ```sql
   SELECT COUNT(*) FROM category;
   ```
   Result: _________ categories

3. **Count Courses**
   ```sql
   SELECT COUNT(*) FROM course;
   ```
   Result: _________ courses

4. **View Sample User**
   ```sql
   SELECT * FROM user LIMIT 1;
   ```
   - [ ] Data displayed correctly
   - [ ] All fields present
   - [ ] Email verified

5. **Verify Relationships**
   ```sql
   SELECT * FROM learning LIMIT 1;
   ```
   - [ ] user_id points to valid user
   - [ ] course_id points to valid course

- [ ] All queries executed successfully
- [ ] Data integrity confirmed

### MongoDB Data Verification:

```bash
mongosh
use lms
```

Run these commands and record results:

1. **Count Users**
   ```
   db.user.countDocuments()
   ```
   Result: _________ users

2. **Count Categories**
   ```
   db.category.countDocuments()
   ```
   Result: _________ categories

3. **Count Courses**
   ```
   db.course.countDocuments()
   ```
   Result: _________ courses

4. **View Sample User**
   ```
   db.user.findOne()
   ```
   - [ ] Document displayed correctly
   - [ ] ObjectId present
   - [ ] All fields present
   - [ ] Email verified

5. **Verify References**
   ```
   db.learning.findOne()
   ```
   - [ ] user_id is ObjectId
   - [ ] course_id is ObjectId
   - [ ] Documents reference valid data

- [ ] All queries executed successfully
- [ ] Data integrity confirmed

---

## API Endpoint Testing (Manual)

### Test Login Endpoint

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"pass123"}'
```

- [ ] Response code: _____ (should be 200)
- [ ] Token received: ____________
- [ ] User info in response

### Test Category Creation

```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{"name":"Test_Category"}'
```

- [ ] Response code: _____ (should be 201)
- [ ] Category ID received
- [ ] Verified in database

### Test Course Creation

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "title":"Test Course",
    "description":"Test",
    "category":"Web",
    "price":99.99
  }'
```

- [ ] Response code: _____ (should be 201)
- [ ] Course ID received
- [ ] Verified in database

### Test Course Retrieval

```bash
curl http://localhost:5000/api/courses
```

- [ ] Response code: _____ (should be 200)
- [ ] Courses array returned
- [ ] Can iterate through courses

---

## Database Switching Test

### Switch Process

1. **Stop Current Backend**
   - [ ] Ctrl+C pressed
   - [ ] Backend stopped cleanly
   - [ ] No hanging processes

2. **Run Switcher Script**
   - [ ] Command: `npm run switch:mongodb` (or switch:mysql)
   - [ ] Script ran successfully
   - [ ] `.env` file updated

3. **Verify .env Updated**
   - [ ] `DB_TYPE` changed
   - [ ] relevant credentials present
   - [ ] No syntax errors

4. **Start Backend with New DB**
   - [ ] `npm start` command executed
   - [ ] Backend started without errors
   - [ ] Correct database message shown

5. **Run Tests on New Database**
   - [ ] Tests passed: ☐ YES ☐ NO
   - [ ] Pass rate: ____%
   - [ ] Data accessible in new database

---

## Performance Testing (Optional)

### Response Times

| Endpoint | Expected | Actual | Status |
|----------|----------|--------|--------|
| GET /courses | <200ms | _____ms | ☐ OK ☐ SLOW |
| POST /courses | <500ms | _____ms | ☐ OK ☐ SLOW |
| GET /categories | <200ms | _____ms | ☐ OK ☐ SLOW |
| POST /users/profile | <500ms | _____ms | ☐ OK ☐ SLOW |

### Database Query Performance

#### MySQL:
- [ ] Indexes present on key columns
- [ ] No slow queries in log
- [ ] Response times acceptable

#### MongoDB:
- [ ] Indexes created on frequently queried fields
- [ ] Document retrieval fast
- [ ] Aggregation queries optimized

---

## Stress Testing (Optional)

### Multiple Concurrent Requests

- [ ] Send 10 simultaneous requests
  - [ ] All succeeded
  - [ ] No connection errors
  - [ ] Response time acceptable

- [ ] Send 100 simultaneous requests
  - [ ] Most/all succeeded
  - [ ] Note any failures: ___________
  - [ ] Response degradation acceptable: ☐ YES ☐ NO

---

## Security Testing (Optional)

### SQL Injection Test (MySQL only)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com OR 1=1","password":"pass123"}'
```

- [ ] Request properly escaped/parameterized
- [ ] Injection attack blocked
- [ ] Normal login still works

### Authentication Test

```bash
curl http://localhost:5000/api/users/profile
```
(Without token)

- [ ] Request denied with 401/403
- [ ] No unauthorized data exposed
- [ ] Error message appropriate

---

## Cleanup & Teardown

### Data Cleanup (if needed)

#### MySQL:
```sql
TRUNCATE TABLE user;
TRUNCATE TABLE course;
TRUNCATE TABLE category;
TRUNCATE TABLE learning;
```
- [ ] Test data removed
- [ ] No referential integrity errors

#### MongoDB:
```
use lms
db.user.deleteMany({})
db.course.deleteMany({})
db.category.deleteMany({})
db.learning.deleteMany({})
```
- [ ] Test data removed
- [ ] Collections confirmed empty

### Stop Services
- [ ] Backend stopped (`Ctrl+C`)
- [ ] MySQL running (keep for later use)
- [ ] MongoDB running (keep for later use)

---

## Final Summary

### Overall Status

**MySQL Testing:** ☐ PASS ☐ FAIL ☐ PARTIAL  
**MongoDB Testing:** ☐ PASS ☐ FAIL ☐ PARTIAL  

### Test Statistics

| Metric | Value |
|--------|-------|
| Total Tests Run | _____ |
| Total Tests Passed | _____ |
| Total Tests Failed | _____ |
| Pass Rate (MySQL) | ____% |
| Pass Rate (MongoDB) | ____% |
| Test Duration | _____ min |

### Issues Encountered

1. ___________________________________
   Resolution: ________________________

2. ___________________________________
   Resolution: ________________________

3. ___________________________________
   Resolution: ________________________

### Recommendations

- [ ] Use MySQL for production
- [ ] Use MongoDB for production
- [ ] Hybrid approach (multiple DBs)
- [ ] Further investigation needed

### Additional Notes

_________________________________________________

_________________________________________________

_________________________________________________

---

## Sign-Off

**Tested By:** _______________________  
**Date:** _______________________  
**Time:** _______________________  
**Overall Status:** ☐ PASS ☐ FAIL  

---

**Thank you for thoroughly testing the Dual Database setup!**

*This checklist ensures comprehensive testing of both database configurations.*
