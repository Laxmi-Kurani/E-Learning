# E-Learning LMS - Quick Start Guide

## Prerequisites
- Node.js (v14+)
- MySQL (v5.7+)
- npm or yarn

---

## Setup Instructions

### 1. Clone & Install
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install
```

### 2. Configure Environment
```bash
# Copy the example .env file
cp ../.env.example ../.env

# Edit the .env file with your configuration
# Minimum required:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lms
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@elearning.com
ADMIN_PASSWORD=Admin@123456
```

### 3. Database Setup
```bash
# Ensure MySQL is running
# The application will automatically:
# - Create the database if it doesn't exist
# - Create all tables from tables.sql
# - Create default admin user
```

### 4. Start Backend
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Backend will start on: `http://localhost:8080`

### 5. Start Frontend
```bash
cd ../frontend
npm install
npm start
```

Frontend will start on: `http://localhost:3000`

---

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Application | http://localhost:3000 | - |
| Admin Dashboard | http://localhost:3000/admin | admin@elearning.com / Admin@123456 |
| Backend API | http://localhost:8080/api | See API Docs |
| API Health | http://localhost:8080/api/health | - |
| Database | localhost:3306 | root / (no password) |
| phpMyAdmin | http://localhost:8081 | root / (no password) |

---

## API Testing

### Using cURL

#### 1. Register User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@12345",
    "mobileNumber": "1234567890",
    "gender": "Male",
    "profession": "Developer"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345"
  }'
```

#### 3. Get Courses
```bash
curl -X GET http://localhost:8080/api/courses
```

#### 4. Create Course (Admin)
```bash
curl -X POST http://localhost:8080/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "React Basics",
    "description": "Learn React fundamentals",
    "instructor": "John Doe",
    "duration": "4 weeks",
    "level": "Beginner",
    "category": "Web Development",
    "price": 49.99
  }'
```

---

## Using Postman

1. Import the API collection:
   - Create a new collection
   - Set base URL to: `http://localhost:8080/api`
   - Create requests for each endpoint

2. Authentication:
   - In Headers tab: `Authorization: Bearer <token_from_login>`

3. Common Headers:
```
Content-Type: application/json
Authorization: Bearer <token>
```

---

## Module Quick Reference

### Authentication
- **POST** `/auth/register` - Create account
- **POST** `/auth/login` - Get JWT token
- **POST** `/auth/password/forgot-password` - Request reset
- **POST** `/auth/password/reset-password/:token` - Reset password

### Users
- **GET** `/users/profile` - Get your profile
- **PUT** `/users/profile` - Update profile
- **PUT** `/users/change-password` - Change password

### Courses
- **GET** `/courses` - List courses
- **POST** `/courses` - Create course (admin)
- **PUT** `/courses/:id` - Update course (admin)
- **DELETE** `/courses/:id` - Delete course (admin)

### Enrollment
- **POST** `/learning/enroll` - Request enrollment
- **GET** `/learning/my-courses` - Get enrolled courses
- **PUT** `/learning/approve/:id` - Approve enrollment (admin)

### Progress
- **POST** `/progress/update` - Update progress
- **GET** `/progress/:courseId` - Get progress

### Assessments
- **POST** `/assessments/submit` - Submit answers
- **GET** `/assessments/my-assessments` - Get results

### Certificates
- **GET** `/certificates/my-certificates` - Get certificates
- **POST** `/certificates/issue` - Issue certificate (admin)

### Analytics
- **GET** `/analytics/leaderboard/course/:id` - Course rankings
- **GET** `/analytics/leaderboard/global` - Global rankings
- **GET** `/analytics/user/:id` - User stats
- **GET** `/analytics/platform/overview` - Platform stats (admin)

### Notifications
- **GET** `/notifications` - Get notifications
- **GET** `/notifications/unread/count` - Unread count
- **PUT** `/notifications/:id/read` - Mark as read

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Or use different port (edit server.js or .env)
```

### Database Connection Error
- Ensure MySQL is running
- Check DB credentials in .env
- Verify database exists or will be auto-created

### Password Requirements
- Must be at least 8 characters
- Include uppercase letter
- Include lowercase letter
- Include number
- Include special character (!@#$%^&*)

Example: `Test@12345`

### JWT Token Errors
- Token is valid for 24 hours (configurable)
- Include full token in Authorization header
- Format: `Bearer <token>` (with space)

---

## Development Tips

### Hot Reload
Development mode includes hot reload:
```bash
npm run dev
```

### Check API Health
```bash
curl http://localhost:8080/api/health
```

### View Database
Using phpMyAdmin:
1. Visit http://localhost:8081
2. Login with root / (no password)
3. Select 'lms' database

### Enable Detailed Logging
In `.env`:
```
LOG_LEVEL=debug
NODE_ENV=development
```

---

## Common Workflows

### Create a Complete Course
1. **Admin**: Create course
   ```bash
   POST /courses
   ```

2. **Admin**: Add questions to course
   ```bash
   POST /questions
   ```

3. **User**: Enroll in course
   ```bash
   POST /learning/enroll
   ```

4. **Admin**: Approve enrollment
   ```bash
   PUT /learning/approve/:id
   ```

5. **User**: Access course and submit assessment
   ```bash
   POST /assessments/submit
   ```

6. **Auto**: Certificate issued on passing (if enabled)

7. **User**: View certificate
   ```bash
   GET /certificates/my-certificates
   ```

### Check Progress
1. User takes courses
2. Progress automatically tracked:
   ```bash
   GET /progress/:courseId
   ```

3. View comprehensive analytics:
   ```bash
   GET /analytics/user/:userId
   ```

---

## Next Steps

1. **Create Test Data**
   - Create admin user (auto-created)
   - Create test courses
   - Create test questions
   - Test enrollment workflow

2. **Explore Features**
   - Test all endpoints
   - Create certificates
   - Check analytics/leaderboards
   - Verify notifications

3. **Customize**
   - Update UI components
   - Add additional modules
   - Integrate payment system
   - Add email notifications

4. **Deploy**
   - Configure production environment
   - Set up database backups
   - Enable HTTPS
   - Set up monitoring

---

## Documentation

- **API Documentation**: See `API_DOCUMENTATION.md`
- **Modules Guide**: See `MODULES_GUIDE.md`
- **Refactoring Summary**: See `REFACTORING_SUMMARY.md`
- **Admin Guide**: See `ADMIN_GUIDE.md`
- **README**: See `README.md`

---

## Support & Issues

For issues or questions:
1. Check the documentation files
2. Review API_DOCUMENTATION.md
3. Check MODULES_GUIDE.md
4. Review error messages in console

---

## Useful Commands

```bash
# Backend
cd backend
npm install          # Install dependencies
npm start            # Start production
npm run dev          # Start development with watch
npm test             # Run tests (if configured)

# Frontend
cd frontend
npm install
npm start
npm build

# Database
# Reset database - delete database and restart app
# Or run manual SQL from config/tables.sql
```

---

## Security Notes

1. **Change Admin Password**
   - Login with default admin credentials
   - Change password immediately

2. **Update JWT Secret**
   - Change JWT_SECRET in .env
   - Use strong random string

3. **Enable HTTPS**
   - Use SSL/TLS in production
   - Configure in reverse proxy

4. **Validate Input**
   - All inputs are validated
   - Additional validation on sensitive operations

---

Happy Learning! 🚀

