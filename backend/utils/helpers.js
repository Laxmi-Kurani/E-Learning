// Utility helper functions

const { HTTP_STATUS, ERROR_MESSAGES, PAGINATION } = require('./constants');

/**
 * Format API response
 */
const formatResponse = (data, message = '', statusCode = HTTP_STATUS.OK) => {
  return {
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Return paginated response
 */
const paginationResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      currentPage: page,
      limit,
      totalRecords: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

/**
 * Validate pagination parameters
 */
const getPaginationParams = (query) => {
  let page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
  let limit = parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT;

  if (page < 1) page = 1;
  if (limit < 1) limit = PAGINATION.DEFAULT_LIMIT;
  if (limit > PAGINATION.MAX_LIMIT) limit = PAGINATION.MAX_LIMIT;

  return {
    page,
    limit,
    offset: (page - 1) * limit
  };
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const validatePasswordStrength = (password) => {
  const { MIN_LENGTH, HAS_UPPERCASE, HAS_LOWERCASE, HAS_NUMBERS, HAS_SPECIAL } = require('./constants').PASSWORD_REQUIREMENTS;
  
  const errors = [];
  
  if (password.length < MIN_LENGTH) {
    errors.push(`Password must be at least ${MIN_LENGTH} characters long`);
  }
  if (HAS_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (HAS_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (HAS_NUMBERS && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (HAS_SPECIAL && !/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate JWT token expiration time
 */
const getTokenExpiration = (hours = 24) => {
  return hours * 60 * 60;
};

/**
 * Calculate completion percentage
 */
const calculateCompletion = (completed, total) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Check if user has passed assessment
 */
const isPassed = (score, total, passingGrade = 70) => {
  return ((score / total) * 100) >= passingGrade;
};

/**
 * Format user data (remove sensitive fields)
 */
const formatUserData = (user, includeSensitive = false) => {
  const userData = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    mobileNumber: user.mobileNumber,
    gender: user.gender,
    dob: user.dob,
    profession: user.profession,
    location: user.location,
    linkedin_url: user.linkedin_url,
    github_url: user.github_url,
    profile_image: user.profile_image,
    created_at: user.created_at
  };
  
  if (includeSensitive) {
    userData.password = user.password;
  }
  
  return userData;
};

/**
 * Extract pagination and search params from query
 */
const getQueryParams = (query) => {
  const pagination = getPaginationParams(query);
  const search = query.search || '';
  const sortBy = query.sortBy || 'created_at';
  const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
  
  return { ...pagination, search, sortBy, sortOrder };
};

/**
 * Handle database errors
 */
const handleDatabaseError = (error) => {
  console.error('Database error:', error);
  
  if (error.code === 'ER_DUP_ENTRY') {
    return { statusCode: HTTP_STATUS.CONFLICT, message: 'Duplicate entry' };
  }
  if (error.code === 'ER_NO_REFERENCED_ROW') {
    return { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Invalid reference' };
  }
  
  return { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: ERROR_MESSAGES.DATABASE_ERROR };
};

module.exports = {
  formatResponse,
  paginationResponse,
  getPaginationParams,
  validateEmail,
  validatePasswordStrength,
  getTokenExpiration,
  calculateCompletion,
  isPassed,
  formatUserData,
  getQueryParams,
  handleDatabaseError
};
