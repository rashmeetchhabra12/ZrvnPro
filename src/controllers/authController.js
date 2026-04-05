const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Mock login
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Find user by username
  const user = await User.findByUsername(username);

  if (!user) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid username or password',
    });
  }

  // Check if user is active
  if (user.status !== 'active') {
    return res.status(401).json({
      error: 'Account inactive',
      message: 'Your account has been deactivated. Please contact support.',
    });
  }

  // Verify password
  const isValidPassword = await User.verifyPassword(password, user.password_hash);

  if (!isValidPassword) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid username or password',
    });
  }

  // Generate mock token
  const token = generateToken(user.id, user.role);

  // Return user info and token
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
      tokenType: 'Bearer',
    },
  });
});

/**
 * Mock logout
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // In a real JWT implementation, you might:
  // - Blacklist the token
  // - Clear session/cookie
  // - Invalidate refresh token

  // For mock auth, just return success
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * Get current user info
 * GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  // User info is attached by auth middleware
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: 'Your user account could not be found',
    });
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
    },
  });
});

module.exports = {
  login,
  logout,
  getCurrentUser,
};
