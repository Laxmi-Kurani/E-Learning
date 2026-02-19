# E-Learning LMS - Project Structure & Modules Guide

## Project Overview
Complete E-Learning Learning Management System with comprehensive modules for course management, user authentication, assessments, analytics, and more.

## Backend Directory Structure

```
backend/
├── config/
│   ├── database.js          # Database connection configuration
│   └── tables.sql           # Database schema
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── validation.js        # Input validation middleware (NEW)
│   └── errorHandler.js      # Error handling middleware
├── routes/
│   ├── auth.routes.js       # Authentication (login, register)
│   ├── passwordReset.routes.js  # Password reset (NEW)
│   ├── user.routes.js       # User management
│   ├── course.routes.js     # Course management
│   ├── learning.routes.js   # Enrollment management
│   ├── progress.routes.js   # Progress tracking
│   ├── question.routes.js   # Question management
│   ├── assessment.routes.js # Assessment handling
│   ├── discussion.routes.js # Discussion forum
│   ├── feedback.routes.js   # Course feedback & ratings
│   ├── certificate.routes.js    # Certificates (NEW)
│   ├── analytics.routes.js  # Analytics & leaderboards (NEW)
│   └── notification.routes.js   # Notifications (NEW)
├── services/
│   ├── userService.js       # User database operations (NEW)
│   └── [other services to be created]
├── utils/
│   ├── constants.js         # Application constants (NEW)
│   └── helpers.js           # Utility helper functions (NEW)
├── server.js                # Express server setup
└── package.json             # Dependencies

```

## Database Schema

### Tables
1. **user** - User accounts and profiles
2. **course** - Course information
3. **learning** - User-course enrollment
4. **progress** - Course progress tracking
5. **assessment** - User assessment results
6. **question** - Quiz questions
7. **discussion** - Forum discussions
8. **feedback** - Course ratings and feedback
9. **certificate** - Course certificates (NEW)
10. **notification** - User notifications (NEW)

## Core Modules

### 1. Authentication Module
**Routes:** `/api/auth`

Features:
- User registration with profile information
- Email-based login
- JWT token generation
- Password hashing with bcryptjs
- Password strength validation

**Key Endpoints:**
- `POST /register` - User registration
- `POST /login` - User login

---

### 2. Password Reset Module (NEW)
**Routes:** `/api/auth/password`

Features:
- Forgot password request
- Reset token generation
- Password reset with token verification
- Token expiration handling

**Key Endpoints:**
- `POST /forgot-password` - Request reset
- `POST /reset-password/:token` - Reset password
- `GET /verify-token/:token` - Verify token validity

---

### 3. User Management Module
**Routes:** `/api/users`

Features:
- User profile management
- Profile updates
- Password changes
- Dashboard statistics
- User listing (admin)

**Key Endpoints:**
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `PUT /change-password` - Change password
- `GET /stats/dashboard` - Admin dashboard stats

---

### 4. Course Management Module
**Routes:** `/api/courses`

Features:
- Create, read, update, delete courses
- Course categories and levels
- Course pricing
- Instructor information
- Media URLs

**Key Endpoints:**
- `GET /` - List all courses
- `POST /` - Create course (admin)
- `PUT /:id` - Update course (admin)
- `DELETE /:id` - Delete course (admin)

---

### 5. Enrollment/Learning Module
**Routes:** `/api/learning`

Features:
- Course enrollment requests
- Admin approval workflow
- Pending enrollment management
- User's enrolled courses tracking

**Key Endpoints:**
- `POST /enroll` - Request enrollment
- `GET /my-courses` - Get enrolled courses
- `GET /pending` - List pending (admin)
- `PUT /approve/:id` - Approve enrollment (admin)

---

### 6. Progress Tracking Module
**Routes:** `/api/progress`

Features:
- Track course completion percentage
- Mark courses as complete
- Get progress for specific course
- Get all user progress

**Key Endpoints:**
- `POST /update` - Update progress
- `GET /:courseId` - Get course progress
- `GET /` - Get all progress

---

### 7. Questions/Quiz Module
**Routes:** `/api/questions`

Features:
- Create multiple-choice questions
- Question management (CRUD)
- Course-specific questions
- Answer validation

**Key Endpoints:**
- `GET /course/:courseId` - Get course questions
- `POST /` - Create question (admin)
- `PUT /:id` - Update question (admin)
- `DELETE /:id` - Delete question (admin)

---

### 8. Assessment Module
**Routes:** `/api/assessments`

Features:
- Submit assessment results
- Passing grade calculation (70%)
- Assessment history
- Automatic course completion

**Key Endpoints:**
- `POST /submit` - Submit assessment
- `GET /my-assessments` - Get assessments
- `GET /course/:courseId` - Get assessment for course

---

### 9. Discussion/Forum Module
**Routes:** `/api/discussions`

Features:
- Course-specific discussions
- Post messages
- Discussion deletion
- User information display

**Key Endpoints:**
- `GET /:courseId` - Get discussions
- `POST /` - Post message
- `DELETE /:id` - Delete discussion

---

### 10. Feedback Module
**Routes:** `/api/feedbacks`

Features:
- Course ratings (1-5 stars)
- Written feedback/comments
- Average rating calculation
- User-identified reviews

**Key Endpoints:**
- `GET /:courseId` - Get feedback
- `POST /` - Submit feedback
- `GET /rating/:courseId` - Get average rating

---

### 11. Certificate Module (NEW)
**Routes:** `/api/certificates`

Features:
- Issue certificates upon assessment completion
- Certificate URL management
- Revoke certificates (admin)
- Certificate history
- Digital certificate generation

**Key Endpoints:**
- `GET /my-certificates` - Get user certificates
- `POST /issue` - Issue certificate (admin)
- `PUT /:id/revoke` - Revoke certificate (admin)
- `GET /` - List all certificates (admin)

---

### 12. Analytics Module (NEW)
**Routes:** `/api/analytics`

Features:
- Course leaderboards
- Global leaderboards
- User performance analytics
- Course-specific analytics
- Platform-wide statistics
- Completion rates
- Assessment metrics

**Key Endpoints:**
- `GET /leaderboard/course/:courseId` - Course leaderboard
- `GET /leaderboard/global` - Global leaderboard
- `GET /user/:userId` - User analytics
- `GET /course/analytics/:courseId` - Course analytics
- `GET /platform/overview` - Platform overview

---

### 13. Notifications Module (NEW)
**Routes:** `/api/notifications`

Features:
- User notifications
- Mark as read/unread
- Notification deletion
- Unread count
- Notification types
- Related entity tracking

**Key Endpoints:**
- `GET /` - Get notifications
- `GET /unread/count` - Get unread count
- `PUT /:id/read` - Mark as read
- `PUT /read-all` - Mark all as read
- `DELETE /:id` - Delete notification

---

## Utility Modules

### Constants (NEW)
**File:** `utils/constants.js`

Defines application-wide constants:
- HTTP status codes
- User roles
- Enrollment statuses
- Error messages
- Success messages
- Password requirements
- Pagination defaults

### Helpers (NEW)
**File:** `utils/helpers.js`

Utility functions:
- Response formatting
- Pagination handling
- Email validation
- Password strength validation
- Completion calculation
- Assessment passing logic
- User data formatting
- Error handling

### Validation Middleware (NEW)
**File:** `middleware/validation.js`

Input validation functions:
- Registration validation
- Login validation
- Course validation
- Question validation
- Assessment validation
- Feedback validation
- Discussion validation
- Password change validation

---

## Service Layer (NEW)
**Directory:** `services/`

Database operation abstraction:
- UserService: User-related DB operations
- Future: CourseService, ProgressService, etc.

Benefits:
- Centralized database logic
- Reusable methods
- Better testing
- Decoupled routes from DB

---

## Authentication & Authorization

### Roles
- **ADMIN** - Full system access
- **USER** - Limited access to own resources

### Protected Endpoints
Most endpoints require authentication via JWT token:
```
Authorization: Bearer <token>
```

Admin-only endpoints:
- Course CRUD operations
- User management
- Enrollment approvals
- Analytics & statistics
- Certificate management

---

## Error Handling

Standard error response format:
```json
{
  "error": "Error message",
  "details": ["Additional details if available"],
  "statusCode": 400
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Server Error

---

## Key Features

### Security
- Password hashing with bcryptjs
- JWT token authentication
- Input validation
- SQL injection prevention (parameterized queries)
- Role-based access control

### Scalability
- Service layer architecture
- Database connection pooling
- Pagination support
- Indexed database queries

### Functionality
- Comprehensive course management
- User progress tracking
- Assessment and grading
- Discussion forums
- Certificate generation
- Analytics and reporting
- Notification system

### Developer Experience
- Centralized validation
- Helper utilities
- Constants management
- Clear error messages
- Comprehensive API documentation

---

## Getting Started

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure `.env` file (use `.env.example` as template)
4. Start MySQL database
5. Run migrations (if applicable)
6. Start server: `npm start`

### Development
- Use `npm run dev` for development with nodemon
- Update routes in `routes/` directory
- Add new services in `services/` directory
- Add validation in `middleware/validation.js`
- Add helpers in `utils/helpers.js`

---

## API Documentation
See `API_DOCUMENTATION.md` for detailed endpoint documentation.

