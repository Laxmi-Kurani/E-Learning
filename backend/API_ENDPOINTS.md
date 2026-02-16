# API Endpoints Reference

Base URL: `http://localhost:8080/api`

## Authentication

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "username": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@gmail.com",
  "password": "admin123"
}

Response:
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@gmail.com",
    "role": "ADMIN"
  }
}
```

## Courses

### Get All Courses
```http
GET /courses
```

### Get Course by ID
```http
GET /courses/1
```

### Create Course (Admin Only)
```http
POST /courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Introduction to JavaScript",
  "description": "Learn JavaScript from scratch",
  "instructor": "John Smith",
  "duration": "10 hours",
  "level": "Beginner",
  "category": "Programming",
  "image_url": "https://example.com/image.jpg",
  "video_url": "https://example.com/video.mp4",
  "price": 49.99
}
```

### Update Course (Admin Only)
```http
PUT /courses/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  ...
}
```

### Delete Course (Admin Only)
```http
DELETE /courses/1
Authorization: Bearer <token>
```

## Users

### Get All Users (Admin Only)
```http
GET /users
Authorization: Bearer <token>
```

### Get User Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "New Name",
  "email": "newemail@example.com"
}
```

### Change Password
```http
PUT /users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

## Learning (Enrollments)

### Enroll in Course
```http
POST /learning/enroll
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": 1
}
```

### Get My Courses
```http
GET /learning/my-courses
Authorization: Bearer <token>
```

### Check Enrollment Status
```http
GET /learning/check/1
Authorization: Bearer <token>
```

## Progress

### Update Progress
```http
POST /progress/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": 1,
  "completionPercentage": 75
}
```

### Get Progress for Course
```http
GET /progress/1
Authorization: Bearer <token>
```

### Get All Progress
```http
GET /progress
Authorization: Bearer <token>
```

## Questions

### Get Questions for Course
```http
GET /questions/course/1
Authorization: Bearer <token>
```

### Create Question (Admin Only)
```http
POST /questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": 1,
  "questionText": "What is JavaScript?",
  "optionA": "A programming language",
  "optionB": "A database",
  "optionC": "An operating system",
  "optionD": "A web browser",
  "correctAnswer": "A"
}
```

### Update Question (Admin Only)
```http
PUT /questions/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "questionText": "Updated question?",
  "optionA": "Option A",
  "optionB": "Option B",
  "optionC": "Option C",
  "optionD": "Option D",
  "correctAnswer": "B"
}
```

### Delete Question (Admin Only)
```http
DELETE /questions/1
Authorization: Bearer <token>
```

## Assessments

### Submit Assessment
```http
POST /assessments/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": 1,
  "score": 8,
  "totalQuestions": 10
}

Response:
{
  "message": "Assessment submitted successfully",
  "assessmentId": 1,
  "passed": true
}
```

### Get My Assessments
```http
GET /assessments/my-assessments
Authorization: Bearer <token>
```

### Get Assessment for Course
```http
GET /assessments/course/1
Authorization: Bearer <token>
```

## Discussions

### Get Discussions for Course
```http
GET /discussions/course/1
```

### Create Discussion
```http
POST /discussions
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": 1,
  "message": "This is a great course!"
}
```

### Delete Discussion
```http
DELETE /discussions/1
Authorization: Bearer <token>
```

## Feedback

### Get Feedback for Course
```http
GET /feedback/course/1
```

### Submit Feedback
```http
POST /feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": 1,
  "rating": 5,
  "comment": "Excellent course!"
}
```

### Get Average Rating
```http
GET /feedback/rating/1

Response:
{
  "average_rating": 4.5,
  "total_reviews": 10
}
```

## Health Check

```http
GET /health

Response:
{
  "status": "OK",
  "message": "LMS Backend API is running"
}
```
