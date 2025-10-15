// Authentication routes

import { Hono } from 'hono';
import { hashPassword, verifyPassword, generateToken } from '../lib/auth';
import { authMiddleware } from '../middleware/auth';
import type { Env, User, LoginRequest, LoginResponse, ApiResponse } from '../types';

const auth = new Hono<{ Bindings: Env }>();

/**
 * POST /api/auth/login
 * User login
 */
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json<LoginRequest>();
    
    if (!email || !password) {
      return c.json<LoginResponse>({ 
        success: false, 
        message: 'Email and password required' 
      }, 400);
    }
    
    // Fetch user from database
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND is_active = 1'
    ).bind(email).first<User>();
    
    if (!user || !user.password_hash) {
      return c.json<LoginResponse>({ 
        success: false, 
        message: 'Invalid credentials' 
      }, 401);
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return c.json<LoginResponse>({ 
        success: false, 
        message: 'Invalid credentials' 
      }, 401);
    }
    
    // Update last login
    await c.env.DB.prepare(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();
    
    // Generate token
    const jwtSecret = c.env.JWT_SECRET || 'default-secret-change-in-production';
    const token = await generateToken(user, jwtSecret);
    
    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;
    
    return c.json<LoginResponse>({ 
      success: true, 
      token, 
      user: userWithoutPassword 
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return c.json<LoginResponse>({ 
      success: false, 
      message: 'Login failed' 
    }, 500);
  }
});

/**
 * POST /api/auth/register
 * User registration (admin only)
 */
auth.post('/register', authMiddleware, async (c) => {
  try {
    const currentUser = c.get('user') as User;
    
    // Only admins can register new users
    if (currentUser.role !== 'admin') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Only admins can register new users' 
      }, 403);
    }
    
    const { email, password, full_name, role } = await c.req.json();
    
    if (!email || !password || !full_name || !role) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Email, password, full_name, and role are required' 
      }, 400);
    }
    
    // Check if user already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existing) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'User with this email already exists' 
      }, 400);
    }
    
    // Hash password
    const password_hash = await hashPassword(password);
    
    // Insert new user
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
    ).bind(email, password_hash, full_name, role).run();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'User registered successfully',
      data: { id: result.meta.last_row_id }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Registration failed' 
    }, 500);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
auth.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    return c.json<ApiResponse<User>>({ success: true, data: user });
  } catch (error) {
    return c.json<ApiResponse>({ success: false, error: 'Failed to get user info' }, 500);
  }
});

/**
 * POST /api/auth/change-password
 * Change password for current user
 */
auth.post('/change-password', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const { current_password, new_password } = await c.req.json();
    
    if (!current_password || !new_password) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Current and new password required' 
      }, 400);
    }
    
    // Fetch user with password hash
    const userWithPassword = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    ).bind(user.id).first<{ password_hash: string }>();
    
    if (!userWithPassword || !userWithPassword.password_hash) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'User not found' 
      }, 404);
    }
    
    // Verify current password
    const isValid = await verifyPassword(current_password, userWithPassword.password_hash);
    
    if (!isValid) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Current password is incorrect' 
      }, 401);
    }
    
    // Hash new password
    const new_password_hash = await hashPassword(new_password);
    
    // Update password
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(new_password_hash, user.id).run();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'Password changed successfully' 
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to change password' 
    }, 500);
  }
});

export default auth;
