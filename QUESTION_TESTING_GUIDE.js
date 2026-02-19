// Question Management Testing Guide

// ============================================================
// TESTING THE QUESTION MANAGEMENT MODULE
// ============================================================

// Prerequisites:
// 1. Start the backend server: npm start
// 2. Have a valid JWT token (login first)
// 3. Have a valid course ID
// 4. Use Postman, cURL, or your frontend to make requests

// ============================================================
// 1. GET ALL QUESTIONS (Admin Only)
// ============================================================

// Endpoint: GET /api/questions
// Auth: Required (Admin role)
// Query Parameters:
//   - page: Page number (default: 1)
//   - limit: Items per page (default: 10)
//   - search: Search by question text
//   - courseId: Filter by course ID

// Example Request:
fetch('http://localhost:8080/api/questions?page=1&limit=10&search=tax&courseId=1', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN',
    'Content-Type': 'application/json'
  }
});

// Expected Response:
{
  "data": [
    {
      "id": 1,
      "course_id": 1,
      "question_text": "What is the capital of France?",
      "option_a": "London",
      "option_b": "Paris",
      "option_c": "Berlin",
      "option_d": "Madrid",
      "correct_answer": "B",
      "created_at": "2026-02-17T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "limit": 10,
    "totalRecords": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}

// ============================================================
// 2. GET QUESTIONS FOR A COURSE
// ============================================================

// Endpoint: GET /api/questions/course/:courseId
// Auth: Required
// Query Parameters:
//   - page: Page number (default: 1)
//   - limit: Items per page (default: 10)
//   - search: Search by question text

// Example Request:
fetch('http://localhost:8080/api/questions/course/1?page=1&limit=5&search=geography', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_USER_TOKEN',
    'Content-Type': 'application/json'
  }
});

// Expected Response:
{
  "data": [
    {
      "id": 1,
      "course_id": 1,
      "question": "What is the capital of France?",
      "option1": "London",
      "option2": "Paris",
      "option3": "Berlin",
      "option4": "Madrid",
      "answer": "B",
      "created_at": "2026-02-17T10:30:00.000Z"
    },
    {
      "id": 2,
      "course_id": 1,
      "question": "What is the largest ocean?",
      "option1": "Atlantic",
      "option2": "Indian",
      "option3": "Pacific",
      "option4": "Arctic",
      "answer": "C",
      "created_at": "2026-02-17T10:35:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "limit": 5,
    "totalRecords": 15,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}

// ============================================================
// 3. GET SINGLE QUESTION BY ID
// ============================================================

// Endpoint: GET /api/questions/:id
// Auth: Required
// Parameters:
//   - id: Question ID

// Example Request:
fetch('http://localhost:8080/api/questions/1', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_USER_TOKEN',
    'Content-Type': 'application/json'
  }
});

// Expected Response:
{
  "id": 1,
  "course_id": 1,
  "question": "What is the capital of France?",
  "option1": "London",
  "option2": "Paris",
  "option3": "Berlin",
  "option4": "Madrid",
  "answer": "B",
  "created_at": "2026-02-17T10:30:00.000Z"
}

// ============================================================
// 4. CREATE A QUESTION (Admin Only)
// ============================================================

// Endpoint: POST /api/questions
// Auth: Required (Admin role)
// Request Body:
//   - courseId: ID of the course (required)
//   - questionText: The question text (required)
//   - optionA: Option A text (required)
//   - optionB: Option B text (required)
//   - optionC: Option C text (required)
//   - optionD: Option D text (required)
//   - correctAnswer: Correct answer (A, B, C, or D) (required)

// Example Request:
const questionData = {
  courseId: 1,
  questionText: "What is the capital of Germany?",
  optionA: "Munich",
  optionB: "Hamburg",
  optionC: "Berlin",
  optionD: "Frankfurt",
  correctAnswer: "C"
};

fetch('http://localhost:8080/api/questions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(questionData)
});

// Expected Response:
{
  "message": "Question created successfully",
  "questionId": 15,
  "data": {
    "id": 15,
    "courseId": 1,
    "question": "What is the capital of Germany?",
    "option1": "Munich",
    "option2": "Hamburg",
    "option3": "Berlin",
    "option4": "Frankfurt",
    "answer": "C"
  }
}

// Error Response (Invalid course):
{
  "error": "Course not found"
}

// Error Response (Missing fields):
{
  "error": "All four options (A, B, C, D) are required"
}

// ============================================================
// 5. UPDATE A QUESTION (Admin Only)
// ============================================================

// Endpoint: PUT /api/questions/:id
// Auth: Required (Admin role)
// Parameters:
//   - id: Question ID
// Request Body:
//   - questionText: Updated question text (required)
//   - optionA: Updated Option A (required)
//   - optionB: Updated Option B (required)
//   - optionC: Updated Option C (required)
//   - optionD: Updated Option D (required)
//   - correctAnswer: Updated correct answer (A, B, C, or D) (required)

// Example Request:
const updatedQuestionData = {
  questionText: "What is the capital of Italy?",
  optionA: "Milan",
  optionB: "Rome",
  optionC: "Venice",
  optionD: "Florence",
  correctAnswer: "B"
};

fetch('http://localhost:8080/api/questions/1', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updatedQuestionData)
});

// Expected Response:
{
  "message": "Question updated successfully",
  "data": {
    "id": 1,
    "question": "What is the capital of Italy?",
    "option1": "Milan",
    "option2": "Rome",
    "option3": "Venice",
    "option4": "Florence",
    "answer": "B"
  }
}

// Error Response (Question not found):
{
  "error": "Question not found"
}

// ============================================================
// 6. DELETE A QUESTION (Admin Only)
// ============================================================

// Endpoint: DELETE /api/questions/:id
// Auth: Required (Admin role)
// Parameters:
//   - id: Question ID

// Example Request:
fetch('http://localhost:8080/api/questions/1', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN',
    'Content-Type': 'application/json'
  }
});

// Expected Response:
{
  "message": "Question deleted successfully",
  "deletedId": 1,
  "affectedRows": 1
}

// Error Response (Question not found):
{
  "error": "Question not found"
}

// ============================================================
// 7. BULK IMPORT QUESTIONS (Admin Only)
// ============================================================

// Endpoint: POST /api/questions/bulk/import
// Auth: Required (Admin role)
// Request Body:
//   - courseId: ID of the course (required)
//   - questions: Array of question objects (required)
//     Each object should have:
//       - questionText: The question text
//       - optionA: Option A
//       - optionB: Option B
//       - optionC: Option C
//       - optionD: Option D
//       - correctAnswer: Correct answer (A, B, C, D)

// Example Request:
const bulkQuestions = {
  courseId: 1,
  questions: [
    {
      questionText: "What is 2+2?",
      optionA: "3",
      optionB: "4",
      optionC: "5",
      optionD: "6",
      correctAnswer: "B"
    },
    {
      questionText: "What is 3+3?",
      optionA: "5",
      optionB: "6",
      optionC: "7",
      optionD: "8",
      correctAnswer: "B"
    },
    {
      questionText: "What is 4+4?",
      optionA: "7",
      optionB: "8",
      optionC: "9",
      optionD: "10",
      correctAnswer: "B"
    }
  ]
};

fetch('http://localhost:8080/api/questions/bulk/import', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(bulkQuestions)
});

// Expected Response:
{
  "message": "3 questions imported successfully",
  "insertedCount": 3,
  "courseId": 1
}

// ============================================================
// COMMON ERROR RESPONSES
// ============================================================

// 400 - Bad Request (Invalid input):
{
  "error": "Password must be at least 8 characters long"
}

// 401 - Unauthorized (No token):
{
  "message": "No token provided"
}

// 403 - Forbidden (Not admin, expired token, etc):
{
  "message": "Admin access required"
}

// 404 - Not Found:
{
  "error": "Question not found"
}

// 500 - Server Error:
{
  "error": "Database operation failed"
}

// ============================================================
// TESTING CHECKLIST
// ============================================================

// [ ] Create at least one course first
// [ ] Test GET all questions without filters
// [ ] Test GET all questions with pagination (page=2, limit=5)
// [ ] Test GET all questions with search filter
// [ ] Test GET all questions with courseId filter
// [ ] Test GET all questions with combined filters
// [ ] Test GET questions for specific course
// [ ] Test GET questions for specific course with search
// [ ] Test GET single question by ID
// [ ] Test GET non-existent question (should return 404)
// [ ] Test CREATE question with valid data
// [ ] Test CREATE question with missing fields (should fail)
// [ ] Test CREATE question with invalid courseId (should fail)
// [ ] Test UPDATE question with valid data
// [ ] Test UPDATE non-existent question (should return 404)
// [ ] Test UPDATE question with invalid data (should fail)
// [ ] Test DELETE question
// [ ] Test DELETE non-existent question (should return 404)
// [ ] Test BULK IMPORT with multiple questions
// [ ] Test BULK IMPORT with invalid data (should fail)
// [ ] Verify pagination works correctly (hasNextPage, etc)
// [ ] Verify search functionality
// [ ] Verify authorization (non-admin cannot create/update/delete)
// [ ] Verify authentication (no token returns 401)

// ============================================================
// NOTES
// ============================================================

/*
1. Replace:
   - YOUR_ADMIN_TOKEN with actual admin JWT token
   - YOUR_USER_TOKEN with actual user JWT token
   - Adjust localhost:8080 if your API runs on different port

2. Admin vs User Endpoints:
   - Admin can: list all, create, update, delete, bulk import
   - User can: get questions for their enrolled courses

3. Pagination:
   - Default page: 1
   - Default limit: 10
   - Max limit: 100

4. Search:
   - Case-insensitive
   - Searches question_text field

5. Correct Answer:
   - Must be single letter: A, B, C, or D
   - Automatically normalized to uppercase

6. Error Handling:
   - All errors follow standard format
   - Check error message for details
   - Use affectedRows to verify deletions

*/
