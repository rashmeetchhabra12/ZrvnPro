/**
 * Validation Middleware
 *
 * Validates request data against Joi schemas
 */

/**
 * Validate request body, query params, or route params
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Source of data to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Collect all errors, not just the first one
      stripUnknown: true, // Remove unknown keys
    });

    if (error) {
      const errorDetails = error.details.map((detail) => detail.message);
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid input data',
        details: errorDetails,
      });
    }

    // Replace request data with validated and sanitized data
    req[source] = value;
    next();
  };
};

/**
 * Validate request body
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate query parameters
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate route parameters
 */
const validateParams = (schema) => validate(schema, 'params');

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
};
