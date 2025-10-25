import { verifyToken } from '../utils/auth.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Non autorisé',
        message: 'Token d\'authentification manquant'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        error: 'Non autorisé',
        message: 'Token invalide ou expiré'
      });
    }

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Non autorisé',
      message: 'Erreur d\'authentification'
    });
  }
}

/**
 * Role-based authorization middleware factory
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Middleware function
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Non autorisé',
        message: 'Authentification requise'
      });
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Vous n\'avez pas la permission d\'accéder à cette ressource'
      });
    }

    next();
  };
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is present, but doesn't reject if not
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}

/**
 * Check if user owns the resource
 * Used for routes where users can only access their own data
 * @param {string} paramName - Name of the URL parameter containing the user ID
 */
export function checkOwnership(paramName = 'id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Non autorisé',
        message: 'Authentification requise'
      });
    }

    const resourceUserId = parseInt(req.params[paramName]);
    const currentUserId = req.user.id;

    // Managers can access all resources
    if (req.user.role === 'manager') {
      return next();
    }

    // Other users can only access their own resources
    if (resourceUserId !== currentUserId) {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Vous ne pouvez accéder qu\'à vos propres données'
      });
    }

    next();
  };
}
