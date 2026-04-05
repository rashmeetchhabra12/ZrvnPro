/**
 * Utility helper functions
 */

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse date string safely
 */
const parseDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Format currency amount
 */
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Calculate percentage
 */
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(2);
};

/**
 * Paginate array
 */
const paginate = (array, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const paginatedItems = array.slice(offset, offset + limit);
  const totalPages = Math.ceil(array.length / limit);

  return {
    data: paginatedItems,
    pagination: {
      page,
      limit,
      total: array.length,
      totalPages,
    },
  };
};

/**
 * Remove sensitive fields from user object
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...sanitized } = user;
  return sanitized;
};

/**
 * Generate response with consistent structure
 */
const successResponse = (data, message = null) => {
  const response = { success: true };
  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  return response;
};

/**
 * Generate error response with consistent structure
 */
const errorResponse = (message, details = null) => {
  const response = {
    success: false,
    error: message,
  };
  if (details) response.details = details;
  return response;
};

/**
 * Sleep utility for testing
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if value is empty
 */
const isEmpty = (value) => {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim().length === 0) ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

module.exports = {
  formatDate,
  parseDate,
  formatCurrency,
  calculatePercentage,
  paginate,
  sanitizeUser,
  successResponse,
  errorResponse,
  sleep,
  isEmpty,
  deepClone,
};
