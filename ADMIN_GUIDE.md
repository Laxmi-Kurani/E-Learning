# Admin Guide - E-Learning Platform

## Overview
This guide covers all administrative functionalities available in the E-Learning platform.

## Admin Access

### Default Admin Credentials
- Email: Set in `.env` file as `ADMIN_EMAIL`
- Password: Set in `.env` file as `ADMIN_PASSWORD`

### Accessing Admin Panel
1. Login with admin credentials at `/login`
2. Navigate to `/admin` to access the admin dashboard

## Admin Features

### 1. Dashboard Statistics
The admin dashboard displays:
- Total Users (excluding admins)
- Total Admins
- Total Courses
- Total Approved Enrollments
- Pending Enrollment Requests
- Total Assessments Completed
- Recent Enrollments (last 7 days)
- Completed Courses Count

**API Endpoint:** `GET /api/users/stats/dashboard`

### 2. User Management

#### View All Users
- View list of all registered users
- Filter and sort by username, email, role
- See user status (Active/Inactive)

**API Endpoint:** `GET /api/users`

#### View User Details
- View complete user profile
- See enrollment history
- Check user activity

**API Endpoint:** `GET /api/users/:id`

#### Edit User
- Update user information
- Change user role
- Modify profile details

**API Endpoint:** `PUT /api/users/:id`

#### Delete User
- Remove users from the system
- Cannot delete your own admin account
- All user data (enrollments, progress, assessments) will be deleted

**API Endpoint:** `DELETE /api/users/:id`

#### Promote User to Admin
- Grant admin privileges to regular users
- Promoted users get full admin access

**API Endpoint:** `PUT /api/users/:id/promote`

#### Demote Admin to User
- Remove admin privileges
- Cannot demote yourself
- User retains all their data

**API Endpoint:** `PUT /api/users/:id/demote`

### 3. Course Management

#### View All Courses
- See all available courses
- View course details and statistics

**API Endpoint:** `GET /api/courses`

#### Create Course
- Add new courses to the platform
- Set title, description, instructor, duration, level, category
- Upload course image and video
- Set course price

**API Endpoint:** `POST /api/courses`

**Required Fields:**
```json
{
  "title": "Course Title",
  "description": "Course Description",
  "instructor": "Instructor Name",
  "duration": "10 hours",
  "level": "Beginner/Intermediate/Advanced",
  "category": "Programming/Design/Business",
  "image_url": "https://...",
  "video_url": "https://...",
  "price": 0
}
```

#### Update Course
- Modify existing course details
- Update content and pricing

**API Endpoint:** `PUT /api/courses/:id`

#### Delete Course
- Remove courses from the platform
- All related enrollments and progress will be deleted

**API Endpoint:** `DELETE /api/courses/:id`

### 4. Enrollment Management

#### View All Enrollments
- See all approved enrollments
- Track student progress

**API Endpoint:** `GET /api/learning`

#### View Pending Enrollments
- Review enrollment requests
- See student and course details

**API Endpoint:** `GET /api/learning/pending`

#### Approve Enrollment
- Grant access to courses
- Creates progress tracking record
- Student can start learning immediately

**API Endpoint:** `PUT /api/learning/approve/:enrollmentId`

#### Reject Enrollment
- Deny course access
- Student will be notified

**API Endpoint:** `PUT /api/learning/reject/:enrollmentId`

### 5. Question Management

#### Add Questions
- Create assessment questions for courses
- Set multiple choice options (A, B, C, D)
- Define correct answer

**API Endpoint:** `POST /api/questions`

**Required Fields:**
```json
{
  "courseId": 1,
  "questionText": "What is...?",
  "optionA": "Option A",
  "optionB": "Option B",
  "optionC": "Option C",
  "optionD": "Option D",
  "correctAnswer": "A"
}
```

#### Update Questions
- Modify existing questions
- Update options and correct answers

**API Endpoint:** `PUT /api/questions/:id`

#### Delete Questions
- Remove questions from assessments

**API Endpoint:** `DELETE /api/questions/:id`

## Security Features

### Role-Based Access Control
- All admin routes are protected with `isAdmin` middleware
- JWT token verification required
- Role checked on every request

### Self-Protection
- Admins cannot delete their own account
- Admins cannot demote themselves
- Prevents accidental lockout

### Data Validation
- Email uniqueness checks
- Required field validation
- Type checking on all inputs

## Best Practices

### User Management
1. Regularly review user accounts
2. Remove inactive or suspicious accounts
3. Promote trusted users to admin carefully
4. Keep admin count minimal

### Course Management
1. Ensure course content is complete before publishing
2. Set appropriate difficulty levels
3. Add clear descriptions and learning objectives
4. Keep course prices consistent

### Enrollment Management
1. Review pending enrollments promptly
2. Verify student eligibility before approval
3. Monitor enrollment patterns
4. Track course popularity

### Question Management
1. Create diverse question types
2. Ensure correct answers are accurate
3. Review questions for clarity
4. Maintain question bank quality

## Troubleshooting

### Cannot Access Admin Panel
- Verify admin role in database
- Check JWT token validity
- Ensure proper authentication

### Stats Not Loading
- Check database connection
- Verify all tables exist
- Review server logs

### Cannot Delete User
- Check if trying to delete self
- Verify admin permissions
- Check for database constraints

## API Authentication

All admin endpoints require:
1. Valid JWT token in Authorization header
2. Admin role in token payload

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

## Database Schema

### User Table
- `role` ENUM('ADMIN', 'USER')
- Default role is 'USER'
- Admin role grants full access

### Learning Table
- `status` ENUM('PENDING', 'APPROVED', 'REJECTED')
- Tracks enrollment approval workflow

## Support

For technical issues or questions:
1. Check server logs
2. Review API responses
3. Verify database state
4. Contact system administrator
