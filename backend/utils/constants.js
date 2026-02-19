// Constants for the E-Learning Application

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER'
};

const ENROLLMENT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const ASSESSMENT_PASSING_GRADE = 70;

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  HAS_UPPERCASE: true,
  HAS_LOWERCASE: true,
  HAS_NUMBERS: true,
  HAS_SPECIAL: true
};

const CERTIFICATE_STATUS = {
  NOT_ISSUED: 'NOT_ISSUED',
  ISSUED: 'ISSUED',
  REVOKED: 'REVOKED'
};

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already exists',
  WEAK_PASSWORD: 'Password does not meet requirements',
  INVALID_INPUT: 'Invalid input provided',
  SERVER_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
  ENROLLMENT_EXISTS: 'Enrollment request already exists',
  INVALID_ENROLLMENT: 'Enrollment not found or invalid'
};

const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  COURSE_CREATED: 'Course created successfully',
  COURSE_UPDATED: 'Course updated successfully',
  COURSE_DELETED: 'Course deleted successfully',
  ENROLLMENT_SUBMITTED: 'Enrollment request submitted successfully',
  ENROLLMENT_APPROVED: 'Enrollment approved successfully',
  ASSESSMENT_SUBMITTED: 'Assessment submitted successfully',
  QUESTION_CREATED: 'Question created successfully',
  QUESTION_UPDATED: 'Question updated successfully',
  QUESTION_DELETED: 'Question deleted successfully'
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  ENROLLMENT_STATUS,
  ASSESSMENT_PASSING_GRADE,
  PAGINATION,
  PASSWORD_REQUIREMENTS,
  CERTIFICATE_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
