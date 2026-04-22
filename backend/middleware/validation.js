// Validation middleware for input validation

const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');
const { validateEmail, validatePasswordStrength } = require('../utils/helpers');

/**
 * Validate registration input
 */
const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;
  
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Username is required and must be a non-empty string' 
    });
  }
  
  if (!email || !validateEmail(email)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Valid email is required' 
    });
  }
  
  if (!password) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Password is required' 
    });
  }
  
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Password does not meet requirements',
      details: passwordValidation.errors
    });
  }
  
  next();
};

/**
 * Validate login input
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !validateEmail(email)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Valid email is required' 
    });
  }
  
  if (!password) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Password is required' 
    });
  }
  
  next();
};

/**
 * Validate course creation/update input
 */
const validateCourse = (req, res, next) => {
  const { title, description } = req.body;
  
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Course title is required' 
    });
  }
  
  if (title.length > 255) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Course title must not exceed 255 characters' 
    });
  }
  
  if (description && description.length > 5000) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Course description must not exceed 5000 characters' 
    });
  }
  
  if (req.body.price && (isNaN(req.body.price) || req.body.price < 0)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Price must be a valid non-negative number' 
    });
  }
  
  next();
};

/**
 * Validate question input
 */
const validateQuestion = (req, res, next) => {
  const { courseId, questionText, optionA, optionB, optionC, optionD, correctAnswer } = req.body;

  // courseId is required only on POST (create), not PUT (update)
  if (req.method === 'POST' && (!courseId || isNaN(courseId))) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Valid course ID is required' 
    });
  }
  
  if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Question text is required' 
    });
  }
  
  if (!optionA || !optionB || !optionC || !optionD) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'All four options (A, B, C, D) are required' 
    });
  }
  
  if (!correctAnswer || !['A', 'B', 'C', 'D'].includes(correctAnswer.toUpperCase())) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Correct answer must be A, B, C, or D' 
    });
  }
  
  next();
};

/**
 * Validate assessment submission
 */
const validateAssessment = (req, res, next) => {
  const { courseId, score, totalQuestions } = req.body;
  
  if (!courseId || isNaN(courseId)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Valid course ID is required' 
    });
  }
  
  if (isNaN(score) || score < 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Score must be a non-negative number' 
    });
  }
  
  if (isNaN(totalQuestions) || totalQuestions <= 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Total questions must be a positive number' 
    });
  }
  
  if (score > totalQuestions) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Score cannot exceed total questions' 
    });
  }
  
  next();
};

/**
 * Validate feedback input
 */
const validateFeedback = (req, res, next) => {
  const { course_id, rating, comment } = req.body;
  const courseId = course_id || req.body.courseId;
  
  if (!courseId || isNaN(courseId)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Valid course ID is required' 
    });
  }
  
  if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Rating must be a number between 1 and 5' 
    });
  }
  
  if (comment && typeof comment !== 'string') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Comment must be a string' 
    });
  }
  
  if (comment && comment.length > 1000) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Comment must not exceed 1000 characters' 
    });
  }
  
  next();
};

/**
 * Validate discussion/message input
 */
const validateDiscussion = (req, res, next) => {
  const { courseId, message, course_id, content } = req.body;
  
  const cId = courseId || course_id;
  const msg = message || content;
  
  if (!cId || isNaN(cId)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Valid course ID is required' 
    });
  }
  
  if (!msg || typeof msg !== 'string' || msg.trim().length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Message content is required' 
    });
  }
  
  if (msg.length > 5000) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Message must not exceed 5000 characters' 
    });
  }
  
  next();
};

/**
 * Validate password change
 */
const validatePasswordChange = (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'Old password is required' 
    });
  }
  
  if (!newPassword) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'New password is required' 
    });
  }
  
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
      error: 'New password does not meet requirements',
      details: passwordValidation.errors
    });
  }
  
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateCourse,
  validateQuestion,
  validateAssessment,
  validateFeedback,
  validateDiscussion,
  validatePasswordChange
};
