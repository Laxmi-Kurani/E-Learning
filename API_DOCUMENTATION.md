# E-Learning LMS API Documentation

## Overview
This is a comprehensive E-Learning Learning Management System API with complete module coverage for courses, users, assessments, analytics, and more.

## Base URL
```
http://localhost:8080/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Modules & Endpoints

### 1. Authentication (`/auth`)

#### Register User
- **POST** `/auth/register`
- **Body**: `{ username, email, password, mobileNumber?, dob?, gender?, location?, profession?, linkedin_url?, github_url? }`
- **Response**: `{ userId, message }`

#### Login
- **POST** `/auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ token, user: { id, username, email, role } }`

---

### 2. Password Management (`/auth/password`)

#### Forgot Password
- **POST** `/auth/password/forgot-password`
- **Body**: `{ email }`
- **Response**: `{ message, resetToken? }`

#### Reset Password
- **POST** `/auth/password/reset-password/:token`
- **Body**: `{ newPassword }`
- **Response**: `{ message }`

#### Verify Reset Token
- **GET** `/auth/password/verify-token/:token`
- **Response**: `{ valid: boolean, message }`

---

### 3. Users (`/users`)

#### Get All Users (Admin)
- **GET** `/users`
- **Auth**: Requires ADMIN role
- **Response**: `[{ id, username, email, role, created_at }]`

#### Get User Profile
- **GET** `/users/profile`
- **Auth**: Required
- **Response**: User profile object

#### Update Profile
- **PUT** `/users/profile`
- **Auth**: Required
- **Body**: `{ username?, email?, mobileNumber?, gender?, dob?, profession?, location?, linkedin_url?, github_url? }`
- **Response**: `{ message }`

#### Change Password
- **PUT** `/users/change-password`
- **Auth**: Required
- **Body**: `{ oldPassword, newPassword }`
- **Response**: `{ message }`

#### Get Dashboard Statistics (Admin)
- **GET** `/users/stats/dashboard`
- **Auth**: Requires ADMIN role
- **Response**: `{ users, admins, courses, enrollments, assessments, ... }`

#### Get User by ID
- **GET** `/users/:id`
- **Auth**: Required
- **Response**: User profile object

---

### 4. Courses (`/courses`)

#### Get All Courses
- **GET** `/courses`
- **Response**: `[{ id, title, description, instructor, level, category, price, ... }]`

#### Get Course by ID
- **GET** `/courses/:id`
- **Response**: Course object

#### Create Course (Admin)
- **POST** `/courses`
- **Auth**: Requires ADMIN role
- **Body**: `{ title, description, instructor, duration, level, category, image_url, video_url, price }`
- **Response**: `{ courseId, message }`

#### Update Course (Admin)
- **PUT** `/courses/:id`
- **Auth**: Requires ADMIN role
- **Body**: `{ title, description, instructor, duration, level, category, image_url, video_url, price }`
- **Response**: `{ message }`

#### Delete Course (Admin)
- **DELETE** `/courses/:id`
- **Auth**: Requires ADMIN role
- **Response**: `{ message }`

---

### 5. Learning/Enrollments (`/learning`)

#### Get All Enrollments (Admin)
- **GET** `/learning`
- **Auth**: Requires ADMIN role
- **Response**: `[{ enrollmentData with user and course info }]`

#### Enroll in Course
- **POST** `/learning/enroll`
- **Auth**: Required
- **Body**: `{ courseId }`
- **Response**: `{ message }`

#### Get My Courses
- **GET** `/learning/my-courses`
- **Auth**: Required
- **Response**: `[{ courseData with enrollment status }]`

#### Get Pending Requests (Admin)
- **GET** `/learning/pending`
- **Auth**: Requires ADMIN role
- **Response**: `[{ pendingEnrollmentData }]`

#### Approve Enrollment (Admin)
- **PUT** `/learning/approve/:enrollmentId`
- **Auth**: Requires ADMIN role
- **Response**: `{ message }`

---

### 6. Progress (`/progress`)

#### Update Progress
- **POST** `/progress/update`
- **Auth**: Required
- **Body**: `{ courseId, completionPercentage }`
- **Response**: `{ message }`

#### Get Progress
- **GET** `/progress/:courseId`
- **Auth**: Required
- **Response**: `{ completion_percentage, completed }`

#### Get All Progress
- **GET** `/progress`
- **Auth**: Required
- **Response**: `[{ progressData with courseInfo }]`

---

### 7. Questions (`/questions`)

#### Get Questions for Course
- **GET** `/questions/course/:courseId`
- **Auth**: Required
- **Response**: `[{ id, question, option1, option2, option3, option4, answer }]`

#### Create Question (Admin)
- **POST** `/questions`
- **Auth**: Requires ADMIN role
- **Body**: `{ courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer }`
- **Response**: `{ questionId, message }`

#### Update Question (Admin)
- **PUT** `/questions/:id`
- **Auth**: Requires ADMIN role
- **Body**: `{ questionText, optionA, optionB, optionC, optionD, correctAnswer }`
- **Response**: `{ message }`

#### Delete Question (Admin)
- **DELETE** `/questions/:id`
- **Auth**: Requires ADMIN role
- **Response**: `{ message }`

---

### 8. Assessments (`/assessments`)

#### Submit Assessment
- **POST** `/assessments/submit`
- **Auth**: Required
- **Body**: `{ courseId, score, totalQuestions }`
- **Response**: `{ assessmentId, message, passed }`

#### Get My Assessments
- **GET** `/assessments/my-assessments`
- **Auth**: Required
- **Response**: `[{ assessmentData with courseInfo }]`

#### Get Course Assessment
- **GET** `/assessments/course/:courseId`
- **Auth**: Required
- **Response**: Assessment object or empty

---

### 9. Discussions (`/discussions`)

#### Get Course Discussions
- **GET** `/discussions/:courseId`
- **Response**: `[{ id, content, time, userName }]`

#### Post Discussion
- **POST** `/discussions`
- **Auth**: Required
- **Body**: `{ courseId, message }`
- **Response**: `{ discussionId, message }`

#### Post Message (Alternative endpoint)
- **POST** `/discussions/addMessage`
- **Auth**: Required
- **Body**: `{ course_id, content, name }`
- **Response**: `{ id, content, time, userName }`

#### Delete Discussion
- **DELETE** `/discussions/:id`
- **Auth**: Required (owner or admin)
- **Response**: `{ message }`

---

### 10. Feedback (`/feedbacks`)

#### Get Course Feedback
- **GET** `/feedbacks/:courseId`
- **Response**: `[{ id, rating, comment, userName }]`

#### Submit Feedback
- **POST** `/feedbacks`
- **Auth**: Required
- **Body**: `{ course_id, rating, comment }`
- **Response**: `{ feedbackId, message }`

#### Get Course Rating
- **GET** `/feedbacks/rating/:courseId`
- **Response**: `{ average_rating, total_reviews }`

---

### 11. Certificates (`/certificates`)

#### Get My Certificates
- **GET** `/certificates/my-certificates`
- **Auth**: Required
- **Response**: `[{ certificateData }]`

#### Get Certificate Details
- **GET** `/certificates/:certificateId`
- **Auth**: Required
- **Response**: Certificate object

#### Issue Certificate (Admin)
- **POST** `/certificates/issue`
- **Auth**: Requires ADMIN role
- **Body**: `{ userId, courseId, certificateUrl? }`
- **Response**: `{ certificateId, message, certificateUrl }`

#### Revoke Certificate (Admin)
- **PUT** `/certificates/:certificateId/revoke`
- **Auth**: Requires ADMIN role
- **Response**: `{ message }`

---

### 12. Analytics (`/analytics`)

#### Get Course Leaderboard
- **GET** `/analytics/leaderboard/course/:courseId?limit=10`
- **Response**: `{ leaderboard: [{ rank, username, score, percentage, date_completed }] }`

#### Get Global Leaderboard
- **GET** `/analytics/leaderboard/global?limit=20`
- **Response**: `{ leaderboard: [{ rank, username, courses_completed, average_percentage }] }`

#### Get User Analytics
- **GET** `/analytics/user/:userId`
- **Auth**: Required (owner or admin)
- **Response**: `{ stats, recentActivity, learningPath }`

#### Get Course Analytics (Admin)
- **GET** `/analytics/course/analytics/:courseId`
- **Auth**: Requires ADMIN role
- **Response**: `{ enrollments, coursesCompleted, assessments, engagement }`

#### Get Platform Overview (Admin)
- **GET** `/analytics/platform/overview`
- **Auth**: Requires ADMIN role
- **Response**: `{ users, courses, enrollments, assessments }`

---

### 13. Notifications (`/notifications`)

#### Get Notifications
- **GET** `/notifications?page=1&limit=10&unreadOnly=false`
- **Auth**: Required
- **Response**: `{ notifications: [...], pagination: {...} }`

#### Get Unread Count
- **GET** `/notifications/unread/count`
- **Auth**: Required
- **Response**: `{ unreadCount }`

#### Mark as Read
- **PUT** `/notifications/:notificationId/read`
- **Auth**: Required
- **Response**: `{ message }`

#### Mark All as Read
- **PUT** `/notifications/read-all`
- **Auth**: Required
- **Response**: `{ message }`

#### Delete Notification
- **DELETE** `/notifications/:notificationId`
- **Auth**: Required
- **Response**: `{ message }`

#### Delete All Notifications
- **DELETE** `/notifications`
- **Auth**: Required
- **Response**: `{ message }`

---

## Status Codes

- **200**: OK - Request successful
- **201**: Created - Resource created successfully
- **400**: Bad Request - Invalid input
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Access denied
- **404**: Not Found - Resource not found
- **409**: Conflict - Duplicate entry
- **500**: Internal Server Error - Server error

---

## Error Responses

Standard error response format:
```json
{
  "error": "Error message",
  "details": ["Additional details if available"]
}
```

---

## Pagination

List endpoints support pagination with query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "limit": 10,
    "totalRecords": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Notes

- Passwords must meet strength requirements: min 8 chars, uppercase, lowercase, number, special char
- All timestamps are in UTC
- Enrollment status must be APPROVED before accessing course content
- Assessment passing grade is 70%
- Certificates are automatically issued when assessments are passed

