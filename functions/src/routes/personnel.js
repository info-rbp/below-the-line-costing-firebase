/**
 * Personnel routes for Express.js with Firestore
 */

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();
  router.use((req, res, next) => { req.app.locals.db = db; next(); });
  router.use(authMiddleware);

  // GET /api/personnel - List all personnel
  router.get('/', async (req, res) => {
    try {
      const snapshot = await db.collection('personnel').orderBy('employee_name').get();
      const personnel = [];
      snapshot.forEach(doc => {
        personnel.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ success: true, data: personnel });
    } catch (error) {
      console.error('Get personnel error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch personnel' });
    }
  });

  // GET /api/personnel/:id - Get single personnel
  router.get('/:id', async (req, res) => {
    try {
      const doc = await db.collection('personnel').doc(req.params.id).get();
      if (!doc.exists) {
        return res.status(404).json({ success: false, error: 'Personnel not found' });
      }
      return res.json({ success: true, data: { id: doc.id, ...doc.data() } });
    } catch (error) {
      console.error('Get personnel error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch personnel' });
    }
  });

  // POST /api/personnel - Create personnel
  router.post('/', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const data = { ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const ref = await db.collection('personnel').add(data);
      return res.json({ success: true, message: 'Personnel created', data: { id: ref.id } });
    } catch (error) {
      console.error('Create personnel error:', error);
      return res.status(500).json({ success: false, error: 'Failed to create personnel' });
    }
  });

  // PUT /api/personnel/:id - Update personnel
  router.put('/:id', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const updates = { ...req.body, updated_at: new Date().toISOString() };
      delete updates.id; delete updates.created_at;
      await db.collection('personnel').doc(req.params.id).update(updates);
      return res.json({ success: true, message: 'Personnel updated' });
    } catch (error) {
      console.error('Update personnel error:', error);
      return res.status(500).json({ success: false, error: 'Failed to update personnel' });
    }
  });

  // DELETE /api/personnel/:id - Delete personnel
  router.delete('/:id', requireRole('admin'), async (req, res) => {
    try {
      await db.collection('personnel').doc(req.params.id).delete();
      return res.json({ success: true, message: 'Personnel deleted' });
    } catch (error) {
      console.error('Delete personnel error:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete personnel' });
    }
  });

  return router;
};
