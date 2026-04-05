/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Enforces role-based permissions for API endpoints
 */

/**
 * Role hierarchy levels (higher number = more permissions)
 */
const ROLE_HIERARCHY = {
  viewer: 1,
  analyst: 2,
  admin: 3,
};

/**
 * Middleware factory to require specific roles
 * @param {Array<string>} allowedRoles - Array of roles that can access the endpoint
 * @returns {Function} Express middleware function
 *
 * @example
 * router.post('/records', auth, requireRole(['admin']), recordController.create);
 * router.get('/analytics', auth, requireRole(['analyst', 'admin']), analyticsController.get);
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated (should be set by auth middleware)
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource',
      });
    }

    const userRole = req.user.role;

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`,
      });
    }

    // User has required role, proceed
    next();
  };
};

/**
 * Middleware to require minimum role level
 * Allows role and all higher roles in hierarchy
 * @param {string} minimumRole - Minimum required role
 * @returns {Function} Express middleware function
 *
 * @example
 * // Allows analyst and admin, but not viewer
 * router.get('/reports', auth, requireMinimumRole('analyst'), reportsController.get);
 */
const requireMinimumRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource',
      });
    }

    const userRole = req.user.role;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This action requires at least ${minimumRole} role. Your role: ${userRole}`,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is accessing their own resource
 * Used for endpoints where users can only access/modify their own data
 * @param {string} paramName - Name of the route parameter containing user ID (default: 'id')
 * @returns {Function} Express middleware function
 */
const requireSelfOrAdmin = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource',
      });
    }

    const targetUserId = parseInt(req.params[paramName]);
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Allow if user is admin or accessing their own resource
    if (isAdmin || currentUserId === targetUserId) {
      next();
    } else {
      res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources',
      });
    }
  };
};

/**
 * Check if user has a specific role
 * Utility function for use in controllers
 */
const hasRole = (user, role) => {
  return user && user.role === role;
};

/**
 * Check if user has any of the specified roles
 */
const hasAnyRole = (user, roles) => {
  return user && roles.includes(user.role);
};

/**
 * Get all available roles
 */
const getAllRoles = () => {
  return Object.keys(ROLE_HIERARCHY);
};

module.exports = {
  requireRole,
  requireMinimumRole,
  requireSelfOrAdmin,
  hasRole,
  hasAnyRole,
  getAllRoles,
  ROLE_HIERARCHY,
};
