const Joi = require('joi');

/**
 * Validation schemas using Joi
 */

// User validation schemas
const userSchemas = {
  // Create user
  create: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.alphanum': 'Username must contain only alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 50 characters',
        'any.required': 'Username is required',
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required',
      }),
    role: Joi.string()
      .valid('viewer', 'analyst', 'admin')
      .required()
      .messages({
        'any.only': 'Role must be one of: viewer, analyst, admin',
        'any.required': 'Role is required',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status must be either active or inactive',
      }),
  }),

  // Update user
  update: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional(),
    role: Joi.string().valid('viewer', 'analyst', 'admin').optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),

  // Update status
  updateStatus: Joi.object({
    status: Joi.string()
      .valid('active', 'inactive')
      .required()
      .messages({
        'any.only': 'Status must be either active or inactive',
        'any.required': 'Status is required',
      }),
  }),

  // Login
  login: Joi.object({
    username: Joi.string().required().messages({
      'any.required': 'Username is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),
};

// Financial record validation schemas
const recordSchemas = {
  // Create record
  create: Joi.object({
    amount: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Amount must be a positive number',
        'any.required': 'Amount is required',
      }),
    type: Joi.string()
      .valid('income', 'expense')
      .required()
      .messages({
        'any.only': 'Type must be either income or expense',
        'any.required': 'Type is required',
      }),
    category: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Category must be at least 2 characters long',
        'string.max': 'Category cannot exceed 50 characters',
        'any.required': 'Category is required',
      }),
    transaction_date: Joi.date()
      .required()
      .messages({
        'date.base': 'Transaction date must be a valid date',
        'any.required': 'Transaction date is required',
      }),
    description: Joi.string()
      .max(500)
      .allow('', null)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters',
      }),
  }),

  // Update record
  update: Joi.object({
    amount: Joi.number().positive().precision(2).optional(),
    type: Joi.string().valid('income', 'expense').optional(),
    category: Joi.string().min(2).max(50).optional(),
    transaction_date: Joi.date().optional(),
    description: Joi.string().max(500).allow('', null).optional(),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),
};

// Query parameter validation schemas
const querySchemas = {
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),

  // Record filters
  recordFilters: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    type: Joi.string().valid('income', 'expense').optional(),
    category: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional().messages({
      'date.min': 'End date must be after start date',
    }),
    search: Joi.string().optional(),
  }),

  // User filters
  userFilters: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('active', 'inactive').optional(),
  }),

  // Dashboard filters
  dashboardFilters: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
    type: Joi.string().valid('income', 'expense').optional(),
  }),

  // Trends filters
  trendsFilters: Joi.object({
    period: Joi.string().valid('weekly', 'monthly').default('monthly'),
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
  }),
};

module.exports = {
  userSchemas,
  recordSchemas,
  querySchemas,
};
