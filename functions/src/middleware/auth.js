/**
 * Authentication middleware for Express.js
 */

const { verifyToken, extractToken } = require('../lib/auth');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    const decoded = verifyToken(token);
    
    // Fetch user from Firestore
    const db = req.app.locals.db;
    const userDoc = await db.collection('users').doc(decoded.id).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    
    const user = { id: userDoc.id, ...userDoc.data() };
    
    if (!user.is_active) {
      return res.status(401).json({ success: false, error: 'User is inactive' });
    }
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    
    next();
  };
}

/**
 * Optional authentication middleware
 * Doesn't fail if no token provided, but attaches user if valid token exists
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    
    if (token) {
      const decoded = verifyToken(token);
      const db = req.app.locals.db;
      const userDoc = await db.collection('users').doc(decoded.id).get();
      
      if (userDoc.exists) {
        const user = { id: userDoc.id, ...userDoc.data() };
        if (user.is_active) {
          req.user = user;
        }
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
}

module.exports = {
  authMiddleware,
  requireRole,
  optionalAuth
};
