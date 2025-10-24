/**
 * First-run setup routes for Express.js with Firestore
 */

const express = require('express');
const { hashPassword } = require('../lib/auth');

module.exports = (db) => {
  const router = express.Router();
  
  // Store db reference
  router.use((req, res, next) => {
    req.app.locals.db = db;
    next();
  });

  /**
   * GET /api/setup/status
   * Check if setup has been completed (any admin user exists)
   */
  router.get('/status', async (req, res) => {
    try {
      // Check if any users exist in the database
      const usersSnapshot = await db.collection('users').limit(1).get();
      
      return res.json({ 
        success: true,
        setup_complete: !usersSnapshot.empty,
        message: usersSnapshot.empty 
          ? 'Setup required - no users found' 
          : 'Setup already completed'
      });
      
    } catch (error) {
      console.error('Setup status check error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to check setup status' 
      });
    }
  });

  /**
   * POST /api/setup/initialize
   * Initialize system with first admin user
   */
  router.post('/initialize', async (req, res) => {
    try {
      const { email, full_name, password } = req.body;
      
      // Validate required fields
      if (!email || !full_name || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email, full name, and password are required' 
        });
      }
      
      // Check if any users already exist (prevent re-initialization)
      const existingUsers = await db.collection('users').limit(1).get();
      
      if (!existingUsers.empty) {
        return res.status(403).json({ 
          success: false, 
          error: 'Setup already completed. This endpoint has been disabled for security.' 
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid email format' 
        });
      }
      
      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          error: 'Password must be at least 6 characters long' 
        });
      }
      
      // Hash password
      const password_hash = await hashPassword(password);
      
      // Create admin user
      const adminUser = {
        email: email.toLowerCase().trim(),
        password_hash,
        full_name: full_name.trim(),
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const userRef = await db.collection('users').add(adminUser);
      
      console.log('✅ First admin user created:', {
        id: userRef.id,
        email: adminUser.email,
        full_name: adminUser.full_name
      });
      
      return res.json({ 
        success: true, 
        message: 'Admin account created successfully',
        data: { 
          user_id: userRef.id,
          email: adminUser.email,
          full_name: adminUser.full_name
        }
      });
      
    } catch (error) {
      console.error('Setup initialization error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to initialize system' 
      });
    }
  });

  /**
   * POST /api/setup/seed-defaults
   * Seed default data (rate bands, materials, etc.)
   * This is separate from user creation for flexibility
   */
  router.post('/seed-defaults', async (req, res) => {
    try {
      // Check if user is authenticated and is admin
      // This endpoint should ideally be protected, but for initial setup it's open
      
      const seedData = {
        rateBands: 0,
        materials: 0,
        clients: 0
      };
      
      // Seed default rate bands
      const rateBands = [
        { band_name: 'Junior', hourly_rate: 50.00, description: 'Entry-level staff' },
        { band_name: 'Mid-Level', hourly_rate: 85.00, description: 'Experienced professionals' },
        { band_name: 'Senior', hourly_rate: 125.00, description: 'Senior consultants' },
        { band_name: 'Principal', hourly_rate: 175.00, description: 'Principal consultants' }
      ];
      
      for (const band of rateBands) {
        const existing = await db.collection('rateBands')
          .where('band_name', '==', band.band_name)
          .limit(1)
          .get();
        
        if (existing.empty) {
          await db.collection('rateBands').add({
            ...band,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          seedData.rateBands++;
        }
      }
      
      // Seed sample materials
      const materials = [
        { material_code: 'MAT-001', material_name: 'Marketing Brochures', category: 'Marketing', unit_cost: 2.50 },
        { material_code: 'MAT-002', material_name: 'Promotional T-Shirts', category: 'Promotional', unit_cost: 8.00 }
      ];
      
      for (const material of materials) {
        const existing = await db.collection('materialsMaster')
          .where('material_code', '==', material.material_code)
          .limit(1)
          .get();
        
        if (existing.empty) {
          await db.collection('materialsMaster').add({
            ...material,
            unit_of_measure: 'piece',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          seedData.materials++;
        }
      }
      
      return res.json({ 
        success: true, 
        message: 'Default data seeded successfully',
        data: seedData
      });
      
    } catch (error) {
      console.error('Seed defaults error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to seed default data' 
      });
    }
  });

  return router;
};
