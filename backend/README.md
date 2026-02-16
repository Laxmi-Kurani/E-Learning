# LMS Backend API

Node.js/Express backend with MySQL database for Learning Management System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure MySQL:
   - Make sure MySQL is running on localhost:3306
   - Update `.env` file with your database credentials

3. Run the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

## Database Setup

The application will automatically:
- Create the database if it doesn't exist
- Create all required tables
- Create a default admin user

## Default Admin Credentials
- Email: admin@gmail.com
- Password: admin123

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Courses
- GET `/api/courses` - Get all courses
- GET `/api/courses/:id` - Get course by ID
- POST `/api/courses` - Create course (Admin)
- PUT `/api/courses/:id` - Update course (Admin)
- DELETE `/api/courses/:id` - Delete course (Admin)

### Users
- GET `/api/users` - Get all users (Admin)
- GET `/api/users/profile` - Get user profile
- PUT `/api/users/profile` - Update profile
- PUT `/api/users/change-password` - Change password

### Learning (Enrollments)
- POST `/api/learning/enroll` - Enroll in course
- GET `/api/learning/my-courses` - Get user enrollments
- GET `/api/learning/check/:courseId` - Check enrollment status

### Progress
- POST `/api/progress/update` - Update progress
- GET `/api/progress/:courseId` - Get progress for course
- GET `/api/progress` - Get all user progress

### Questions
- GET `/api/questions/course/:courseId` - Get questions for course
- POST `/api/questions` - Create question (Admin)
- PUT `/api/questions/:id` - Update question (Admin)
- DELETE `/api/questions/:id` - Delete question (Admin)

### Assessments
- POST `/api/assessments/submit` - Submit assessment
- GET `/api/assessments/my-assessments` - Get user assessments
- GET `/api/assessments/course/:courseId` - Get assessment for course

### Discussions
- GET `/api/discussions/course/:courseId` - Get discussions for course
- POST `/api/discussions` - Create discussion
- DELETE `/api/discussions/:id` - Delete discussion

### Feedback
- GET `/api/feedback/course/:courseId` - Get feedback for course
- POST `/api/feedback` - Submit feedback
- GET `/api/feedback/rating/:courseId` - Get average rating

## Database Access

Access your database using MySQL CLI:
```bash
mysql -u root -p
USE lms;
SHOW TABLES;
```

Database name: `lms`

## Environment Variables

See `.env` file for configuration options.
