/**
 * Authentication routes for Express.js with Firestore
 */

const express = require('express');
const { hashPassword, verifyPassword, generateToken } = require('../lib/auth');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();
  
  // Store db reference
  router.use((req, res, next) => {
    req.app.locals.db = db;
    next();
  });

  /**
   * POST /api/auth/login
   * User login
   */
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email and password required' 
        });
      }
      
      // Fetch user from Firestore
      const usersSnapshot = await db.collection('users')
        .where('email', '==', email)
        .where('is_active', '==', true)
        .limit(1)
        .get();
      
      if (usersSnapshot.empty) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
      
      const userDoc = usersSnapshot.docs[0];
      const user = { id: userDoc.id, ...userDoc.data() };
      
      if (!user.password_hash) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
      
      // Verify password
      const isValid = await verifyPassword(password, user.password_hash);
      
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
      
      // Update last login
      await userDoc.ref.update({
        last_login: new Date().toISOString()
      });
      
      // Generate token
      const token = generateToken(user);
      
      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;
      
      return res.json({ 
        success: true, 
        token, 
        user: userWithoutPassword 
      });
      
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Login failed' 
      });
    }
  });

  /**
   * POST /api/auth/register
   * User registration (admin only)
   */
  router.post('/register', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
      const { email, password, full_name, role } = req.body;
      
      if (!email || !password || !full_name || !role) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email, password, full_name, and role are required' 
        });
      }
      
      // Check if user already exists
      const existingUser = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!existingUser.empty) {
        return res.status(400).json({ 
          success: false, 
          error: 'User with this email already exists' 
        });
      }
      
      // Hash password
      const password_hash = await hashPassword(password);
      
      // Create new user
      const userRef = await db.collection('users').add({
        email,
        password_hash,
        full_name,
        role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return res.json({ 
        success: true, 
        message: 'User registered successfully',
        data: { id: userRef.id }
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Registration failed' 
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user info
   */
  router.get('/me', authMiddleware, async (req, res) => {
    try {
      const { password_hash, ...userWithoutPassword } = req.user;
      return res.json({ success: true, data: userWithoutPassword });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to get user info' });
    }
  });

  /**
   * POST /api/auth/change-password
   * Change password for current user
   */
  router.post('/change-password', authMiddleware, async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      
      if (!current_password || !new_password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Current and new password required' 
        });
      }
      
      // Fetch user document
      const userDoc = await db.collection('users').doc(req.user.id).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }
      
      const userData = userDoc.data();
      
      // Verify current password
      const isValid = await verifyPassword(current_password, userData.password_hash);
      
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          error: 'Current password is incorrect' 
        });
      }
      
      // Hash new password
      const new_password_hash = await hashPassword(new_password);
      
      // Update password
      await userDoc.ref.update({
        password_hash: new_password_hash,
        updated_at: new Date().toISOString()
      });
      
      return res.json({ 
        success: true, 
        message: 'Password changed successfully' 
      });
      
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to change password' 
      });
    }
  });

  return router;
};
