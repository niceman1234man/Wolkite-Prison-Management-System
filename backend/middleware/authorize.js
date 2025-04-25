/**
 * Role-based authorization middleware
 * Checks if the authenticated user has one of the required roles
 */

/**
 * Creates middleware that checks if user has one of the allowed roles
 * @param {string[]} allowedRoles - Array of role names that are permitted
 * @returns {Function} Express middleware function
 */
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    // Skip if no roles are required
    if (allowedRoles.length === 0) {
      return next();
    }

    // Check if user exists on request (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User not authenticated'
      });
    }

    // Special case: Allow inspectors to restore prison archives
    if (req.method === 'POST' && 
        req.originalUrl.includes('/archive/') && 
        req.originalUrl.includes('/restore') && 
        req.user.role === 'inspector') {
      
      console.log('*** Special authorization: Inspector restoring archives');
      return next();
    }

    // Special case: Allow security staff to manage clearance archives
    if ((req.method === 'POST' || req.method === 'DELETE') && 
        req.originalUrl.includes('/archive/') && 
        req.user.role === 'security') {
      
      console.log('*** Special authorization: Security staff managing clearance archives');
      return next();
    }

    // Check if user has one of the required roles
    const hasRole = allowedRoles.some(role => req.user.role === role);
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden - Required roles: ${allowedRoles.join(', ')}`
      });
    }

    // User has required role, proceed to route handler
    next();
  };
}; 