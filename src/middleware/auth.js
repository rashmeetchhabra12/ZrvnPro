/**
 * Mock Authentication Middleware
 *
 * For demonstration purposes, this uses a simple base64-encoded token
 * Format: base64(userId:role)
 * Example: "1:admin" -> "MTphZG1pbg=="
 *
 * In production, use proper JWT tokens with signing and expiration
 */

const User = require('../models/User');

/**
 * Authentication middleware
 * Validates token and attaches user info to request
 */
const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authorization token provided',
      });
    }

    // Extract Bearer token
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Invalid token format',
      });
    }

    try {
      // Decode mock token (base64 encoded "userId:role")
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId, role] = decoded.split(':');

      if (!userId || !role) {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'Token format is incorrect',
        });
      }

      // Verify user exists and is active
      const user = await User.findById(parseInt(userId));

      if (!user) {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'User not found',
        });
      }

      if (user.status !== 'active') {
        return res.status(401).json({
          error: 'Account inactive',
          message: 'Your account has been deactivated',
        });
      }

      // Verify role matches
      if (user.role !== role) {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'Token has been tampered with',
        });
      }

      // Attach user info to request
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (decodeError) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token could not be decoded',
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication',
    });
  }
};

/**
 * Generate mock token for a user
 * Used in login endpoint
 */
const generateToken = (userId, role) => {
  const payload = `${userId}:${role}`;
  return Buffer.from(payload).toString('base64');
};

module.exports = {
  auth,
  generateToken,
};
