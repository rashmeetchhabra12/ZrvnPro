const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all users
 * GET /api/users
 * Access: Admin only
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;

  const result = await User.findAll({ page, limit, status });

  res.json({
    success: true,
    data: result.users,
    pagination: result.pagination,
  });
});

/**
 * Get user by ID
 * GET /api/users/:id
 * Access: Admin or self
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(parseInt(id));

  if (!user) {
    return res.status(404).json({
      error: 'Not found',
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    data: user,
  });
});

/**
 * Create new user
 * POST /api/users
 * Access: Admin only
 */
const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role, status } = req.body;

  // Check if username already exists
  const usernameExists = await User.usernameExists(username);
  if (usernameExists) {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'Username already exists',
    });
  }

  // Check if email already exists
  const emailExists = await User.emailExists(email);
  if (emailExists) {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'Email already exists',
    });
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    role,
    status,
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user,
  });
});

/**
 * Update user
 * PUT /api/users/:id
 * Access: Admin only
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if user exists
  const existingUser = await User.findById(parseInt(id));
  if (!existingUser) {
    return res.status(404).json({
      error: 'Not found',
      message: 'User not found',
    });
  }

  // Check for duplicate username if updating
  if (updateData.username && updateData.username !== existingUser.username) {
    const usernameExists = await User.usernameExists(updateData.username);
    if (usernameExists) {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'Username already exists',
      });
    }
  }

  // Check for duplicate email if updating
  if (updateData.email && updateData.email !== existingUser.email) {
    const emailExists = await User.emailExists(updateData.email);
    if (emailExists) {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'Email already exists',
      });
    }
  }

  // Update user
  const updatedUser = await User.update(parseInt(id), updateData);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser,
  });
});

/**
 * Update user status
 * PATCH /api/users/:id/status
 * Access: Admin only
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Check if user exists
  const existingUser = await User.findById(parseInt(id));
  if (!existingUser) {
    return res.status(404).json({
      error: 'Not found',
      message: 'User not found',
    });
  }

  // Prevent admin from deactivating themselves
  if (req.user.id === parseInt(id) && status === 'inactive') {
    return res.status(400).json({
      error: 'Invalid operation',
      message: 'You cannot deactivate your own account',
    });
  }

  // Update status
  const updatedUser = await User.updateStatus(parseInt(id), status);

  res.json({
    success: true,
    message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
    data: updatedUser,
  });
});

/**
 * Delete user
 * DELETE /api/users/:id
 * Access: Admin only
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user exists
  const existingUser = await User.findById(parseInt(id));
  if (!existingUser) {
    return res.status(404).json({
      error: 'Not found',
      message: 'User not found',
    });
  }

  // Prevent admin from deleting themselves
  if (req.user.id === parseInt(id)) {
    return res.status(400).json({
      error: 'Invalid operation',
      message: 'You cannot delete your own account',
    });
  }

  // Delete user
  await User.delete(parseInt(id));

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};
