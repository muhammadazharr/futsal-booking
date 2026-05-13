const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { pool } = require('../config/database');

/**
 * Verify JWT access token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Get user with roles and permissions
    const userResult = await pool.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.phone,
        COALESCE(
          json_agg(DISTINCT r.role_name) FILTER (WHERE r.role_name IS NOT NULL),
          '[]'
        ) as roles,
        COALESCE(
          json_agg(DISTINCT p.permission_name) FILTER (WHERE p.permission_name IS NOT NULL),
          '[]'
        ) as permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE u.user_id = $1
      GROUP BY u.user_id
    `, [decoded.userId]);

    if (userResult.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }

    req.user = userResult.rows[0];
    req.user.userId = req.user.user_id;
    
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    const userResult = await pool.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.phone,
        COALESCE(
          json_agg(DISTINCT r.role_name) FILTER (WHERE r.role_name IS NOT NULL),
          '[]'
        ) as roles,
        COALESCE(
          json_agg(DISTINCT p.permission_name) FILTER (WHERE p.permission_name IS NOT NULL),
          '[]'
        ) as permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE u.user_id = $1
      GROUP BY u.user_id
    `, [decoded.userId]);

    req.user = userResult.rows.length > 0 ? userResult.rows[0] : null;
    if (req.user) {
      req.user.userId = req.user.user_id;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Check if user has required role(s)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return next(new ForbiddenError(`Required role: ${roles.join(' or ')}`));
    }

    next();
  };
};

/**
 * Check if user has required permission(s)
 */
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some(perm => userPermissions.includes(perm));

    if (!hasPermission) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Check if user has ALL required permissions
 */
const requireAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userPermissions = req.user.permissions || [];
    const hasAllPermissions = permissions.every(perm => userPermissions.includes(perm));

    if (!hasAllPermissions) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  requirePermission,
  requireAllPermissions
};
