// Authentication middleware for Hono

import { Context, Next } from 'hono';
import { verifyToken, extractToken } from '../lib/auth';
import type { Env, User, UserRole } from '../types';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to context
 */
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      return c.json({ success: false, error: 'No token provided' }, 401);
    }
    
    const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
    const decoded = await verifyToken(token, jwtSecret);
    
    // Fetch user from database
    const user = await c.env.DB.prepare(
      'SELECT id, email, full_name, role, is_active FROM users WHERE id = ? AND is_active = 1'
    ).bind(decoded.id).first<User>();
    
    if (!user) {
      return c.json({ success: false, error: 'User not found or inactive' }, 401);
    }
    
    // Attach user to context
    c.set('user', user);
    
    await next();
  } catch (error) {
    return c.json({ success: false, error: 'Authentication failed' }, 401);
  }
}

/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
export function requireRole(...roles: UserRole[]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user') as User;
    
    if (!user) {
      return c.json({ success: false, error: 'User not authenticated' }, 401);
    }
    
    if (!roles.includes(user.role)) {
      return c.json({ success: false, error: 'Insufficient permissions' }, 403);
    }
    
    await next();
  };
}

/**
 * Optional authentication middleware
 * Doesn't fail if no token provided, but attaches user if valid token exists
 */
export async function optionalAuth(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    const token = extractToken(authHeader);
    
    if (token) {
      const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
      const decoded = await verifyToken(token, jwtSecret);
      
      const user = await c.env.DB.prepare(
        'SELECT id, email, full_name, role, is_active FROM users WHERE id = ? AND is_active = 1'
      ).bind(decoded.id).first<User>();
      
      if (user) {
        c.set('user', user);
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  await next();
}
