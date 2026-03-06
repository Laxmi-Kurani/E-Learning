# 🏗️ Dual Database Architecture

This document visualizes how your E-Learning application architecture supports multiple databases.

---

## Overall Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│                                                              │
│            • User Interface                                  │
│            • Login & Registration                            │
│            • Course Management                               │
│            • Progress Tracking                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ API Calls (Axios)
                     │ http://localhost:5000/api
                     │
┌────────────────────▼────────────────────────────────────────┐
│                 BACKEND (Express.js)                         │
│                                                              │
│  Routes Layer:                                               │
│  ├─ /auth        (Authentication)                           │
│  ├─ /courses     (Course Management)                        │
│  ├─ /categories  (Categories)                               │
│  ├─ /users       (User Profiles)                            │
│  ├─ /learning    (Enrollments)                              │
│  └─ /analytics   (Statistics)                               │
│                                                              │
│  Models/Services Layer (DB_TYPE Detection):                 │
│  ├─ User         ├─ Category      ├─ Course                 │
│  ├─ Learning     ├─ Progress      ├─ Assessment             │
│  └─ notification └─ Discussion    └─ Feedback               │
│                                                              │
└───────────────────┬────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼ DB_TYPE='mysql'     ▼ DB_TYPE='mongodb'
         │                     │
    ┌────┴──────┐         ┌────┴──────┐
    │ Sequelize │         │ Mongoose  │
    │    ORM    │         │    ODM    │
    └────┬──────┘         └────┬──────┘
         │                     │
    ┌────▼──────┐         ┌────▼──────┐
    │   MySQL   │         │ MongoDB   │
    │           │         │           │
    │ Tables:   │         │ Collections:
    │ • user    │         │ • user    │
    │ • course  │         │ • course  │
    │ • category│         │ • category│
    │ • progress│         │ • progress│
    │ • etc...  │         │ • etc...  │
    └───────────┘         └───────────┘
```

---

## Database Type Detection & Routing

```
1. Application Start
   │
   └─► Read .env: DB_TYPE=?
       │
       ├─► "mysql"    │
       ├─► "postgres" ├─► Load Sequelize Models
       ├─► "sqlite"   │
       │
       └─► "mongodb"  ──► Load Mongoose Models

2. API Request Arrives
   │
   └─► Route Handler
       │
       ├─► if DB_TYPE = 'mongodb'
       │   └─► Use Mongoose Model methods
       │       ├─ Model.findOne()
       │       ├─ Model.create()
       │       └─ Model.updateOne()
       │
       └─► else (MySQL/PostgreSQL/SQLite)
           └─► Use Sequelize Model methods
               ├─ Model.findOne()
               ├─ Model.create()
               └─ Model.update()

3. Return Response
   │
   └─► Same JSON format for both databases
       {
         "id": 1 (MySQL) or "_id": ObjectId (MongoDB),
         "name": "John",
         "email": "john@example.com"
       }
```

---

## Model Definition: SQL vs NoSQL

### MySQL/PostgreSQL/SQLite (Sequelize)

```
backend/models/user.js
├── Table Name: users
├── Columns:
│   ├── id (PRIMARY KEY)
│   ├── username (VARCHAR)
│   ├── email (VARCHAR, UNIQUE)
│   ├── password (VARCHAR)
│   ├── role (VARCHAR)
│   ├── isActive (BOOLEAN)
│   ├── created_at (TIMESTAMP)
│   └── updated_at (TIMESTAMP)
│
└── Example Data:
    ┌────┬──────────┬──────────────┐
    │ id │ username │ email        │
    ├────┼──────────┼──────────────┤
    │ 1  │ admin    │ admin@ex.com │
    │ 2  │ john     │ john@ex.com  │
    └────┴──────────┴──────────────┘
```

### MongoDB (Mongoose)

```
backend/models/index.js (userSchema)
├── Collection: user
├── Fields:
│   ├── username (String)
│   ├── email (String, unique)
│   ├── password (String)
│   ├── role (String)
│   ├── isActive (Boolean)
│   ├── createdAt (Date)
│   └── updatedAt (Date)
│
└── Example Document:
    {
      "_id": ObjectId("..."),
      "username": "admin",
      "email": "admin@example.com",
      "password": "hashed...",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": 2024-03-15T10:30:00Z
    }
```

---

## API Response Format: Same for Both DB Types

### Request
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "John123!"
}
```

### MySQL Response
```json
{
  "message": "User registered successfully",
  "userId": 42
}
```

### MongoDB Response
```json
{
  "message": "User registered successfully",
  "userId": "507f1f77bcf86cd799439011"
}
```

**Note:** Only difference is ID format
- MySQL: Numeric (42)
- MongoDB: ObjectId ("507f1f77bcf86cd799439011")

---

## Code Flow: Creating a User (Same Code, Different DBs)

### Step 1: Request arrives at route handler
```javascript
// backend/routes/auth.routes.js

router.post('/register', async (req, res) => {
  // Extract data from request
  const { username, email, password } = req.body;
  
  // Continue to Step 2...
});
```

### Step 2: Branch based on DB_TYPE
```javascript
// Check which database backend to use
if (DB_TYPE === 'mongodb') {
  // ===== MongoDB Path =====
  const user = new User({ username, email, password });
  await user.save(); // Mongoose method
  
} else {
  // ===== MySQL/PostgreSQL/SQLite Path =====
  const result = await User.create({ // Sequelize method
    username, email, password
  });
  userId = result.id;
}
```

### Step 3: Return same response format
```javascript
// Same response for both databases
res.status(201).json({
  message: 'User registered successfully',
  userId: id // Could be numeric or ObjectId
});
```

---

## File Structure: Models

### SQL Models (Sequelize)

```
backend/models/
├── index.js (exports all models for SQL branch)
├── user.js
├── course.js
├── category.js
├── learning.js
├── progress.js
├── assessment.js
├── question.js
├── discussion.js
├── feedback.js
├── certificate.js
└── notification.js

Each file exports a Sequelize model:
module.exports = (sequelize) => {
  const User = sequelize.define('User', { ... });
  return User;
};
```

### MongoDB Models (Mongoose)

```
backend/models/
└── index.js (defines all Mongoose schemas inside)
    ├── userSchema (new mongoose.Schema(...))
    ├── courseSchema
    ├── categorySchema
    ├── learningSchema
    ├── progressSchema
    ├── assessmentSchema
    ├── questionSchema
    ├── discussionSchema
    ├── feedbackSchema
    ├── certificateSchema
    └── notificationSchema
    
    // Create models from schemas
    const User = mongoose.model('User', userSchema);
    // ... repeat for all schemas
    
    module.exports = { User, Course, Category, ... };
```

---

## Testing Flow

```
┌────────────────────────────────────────┐
│  npm run test:db (or test:mysql)       │
└────────────────┬───────────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ test-dual-database.js      │
    │ starts running tests...    │
    └────────┬───────────────────┘
             │
             ├─► Test 1: Backend Connectivity
             │       └─► http://localhost:5000/api
             │
             ├─► Test 2: User Registration
             │       └─► POST /api/auth/register
             │
             ├─► Test 3: User Login
             │       └─► POST /api/auth/login
             │
             ├─► Test 4: Category Creation
             │       └─► POST /api/categories
             │
             ├─► Test 5: Category Retrieval
             │       └─► GET /api/categories
             │
             ├─► Test 6: Course Creation
             │       └─► POST /api/courses
             │
             ├─► Test 7: Course Retrieval
             │       └─► GET /api/courses
             │
             ├─► Test 8: Course Enrollment
             │       └─► POST /api/learning/enroll
             │
             └─► Test 9: Analytics
                     └─► GET /api/analytics/summary
                
                After all tests:
                ├─► Count Passed ✅
                ├─► Count Failed ❌
                └─► Calculate Pass Rate %
```

---

## Environment Configuration Flow

```
.env File
│
├─ DB_TYPE
│  │
│  ├─ "mysql" → Sequelize + mysql2 driver
│  ├─ "postgres" → Sequelize + pg driver
│  ├─ "sqlite" → Sequelize + sqlite3 driver
│  └─ "mongodb" → Mongoose + MongoDB driver
│
├─ DB_HOST (for SQL dialects)
├─ DB_PORT (for SQL dialects)
├─ DB_USER (for SQL dialects)
├─ DB_PASSWORD (for SQL dialects)
├─ DB_NAME (for SQL dialects)
├─ MONGO_URI (for MongoDB)
│
├─ PORT (Express server)
├─ JWT_SECRET (Authentication)
├─ JWT_EXPIRATION (Token lifetime)
├─ ADMIN_EMAIL (Default admin)
└─ ADMIN_PASSWORD (Default admin)

│
▼

backend/server.js loads .env
│
▼

backend/models/index.js
│
├─► if DB_TYPE === 'mongodb'
│   └─► Connect to MongoDB via mongoose.connect(MONGO_URI)
│       └─► Load all Mongoose schemas
│           └─► Create Mongoose models
│               └─► Export User, Course, Category, etc.
│
└─► else (mysql, postgres, sqlite)
    └─► Create Sequelize instance with appropriate dialect
        └─► Load all Sequelize model files
            └─► Import and define SQL models
                └─► Export User, Course, Category, etc.

│
▼

backend/routes/* and services/*
│
└─► Use exported models
    ├─► if DB_TYPE === 'mongodb'
    │   └─► Use Mongoose query methods
    │       └─► .findOne(), .create(), .updateOne()
    │
    └─► else
        └─► Use Sequelize query methods
            └─► .findOne(), .create(), .update()
```

---

## Database Switching Process

```
Current State: DB_TYPE=mysql
│
│ User runs: npm run switch:mongodb
│
▼
─────────────────────────────────────
1. switch-database.js script runs
   │
   ├─► Read current .env
   ├─► Parse existing config
   └─► Update/create new .env with:
       └─► DB_TYPE=mongodb
           MONGO_URI=mongodb://localhost:27017/lms
           (Keep other vars as-is)
   
2. Script outputs:
   ✅ Successfully switched to MONGODB
   📝 .env file updated
   📋 Next steps: 
      1. Ensure MongoDB is running
      2. npm start

3. User stops backend (Ctrl+C)

4. User starts backend again: npm start
   
   ▼
─────────────────────────────────────
5. backend/server.js loads new .env
   
6. models/index.js checks DB_TYPE
   └─► Sees "mongodb"
       └─► Connects to MongoDB
           └─► Loads Mongoose schemas
               └─► Exports Mongoose models
                   
7. Routes now use Mongoose instead of Sequelize

8. API calls work identically
   └─► Same endpoints
       └─► Same response formats
           └─► Different backend storage

Result:
─────────────────────────────────────
✅ Same Frontend
✅ Same Backend Code
✅ Different Database
✅ No frontend changes needed!
```

---

## Query Comparison: Same Operation, Different Syntax

### Find a User by Email

#### MySQL (Sequelize)
```javascript
const user = await User.findOne({
  where: { email: 'john@example.com' }
});
```

#### MongoDB (Mongoose)
```javascript
const user = await User.findOne({
  email: 'john@example.com'
});
```

#### Response (Same!)
```javascript
{
  id/\_id: 1,
  username: 'john',
  email: 'john@example.com',
  role: 'USER'
}
```

---

### Create a Course

#### MySQL (Sequelize)
```javascript
const course = await Course.create({
  title: 'React Basics',
  category: 'Web Dev',
  price: 49.99
});
```

#### MongoDB (Mongoose)
```javascript
const course = new Course({
  title: 'React Basics',
  category: 'Web Dev',
  price: 49.99
});
await course.save();
```

#### Response (Same!)
```javascript
{
  id/\_id: 42,
  title: 'React Basics',
  category: 'Web Dev',
  price: 49.99,
  created_at/createdAt: '2024-03-15T...'
}
```

---

## Summary

```
┌─────────────────────────────────────────┐
│ Your App Now Supports:                 │
├─────────────────────────────────────────┤
│ • MySQL         (Sequelize ORM)         │
│ • PostgreSQL    (Sequelize ORM)         │
│ • SQLite        (Sequelize ORM)         │
│ • MongoDB       (Mongoose ODM)          │
│                                         │
│ Key Benefits:                           │
│ ✅ One codebase, multiple databases     │
│ ✅ Switch with one env variable         │
│ ✅ No frontend code changes             │
│ ✅ Fully tested & documented            │
│ ✅ Production ready                     │
└─────────────────────────────────────────┘
```

---

**This architecture gives you maximum flexibility while maintaining a clean, maintainable codebase!**
