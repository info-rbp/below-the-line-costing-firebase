/**
 * Rate bands routes for Express.js with Firestore
 */

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();
  router.use((req, res, next) => { req.app.locals.db = db; next(); });
  router.use(authMiddleware);

  router.get('/', async (req, res) => {
    try {
      let query = db.collection('rateBands');
      if (req.query.active) query = query.where('is_active', '==', true);
      const snapshot = await query.get();
      const bands = [];
      snapshot.forEach(doc => bands.push({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, data: bands });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch rate bands' });
    }
  });

  router.post('/', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const data = { ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const ref = await db.collection('rateBands').add(data);
      return res.json({ success: true, data: { id: ref.id } });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to create rate band' });
    }
  });

  router.put('/:id', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const updates = { ...req.body, updated_at: new Date().toISOString() };
      delete updates.id; delete updates.created_at;
      await db.collection('rateBands').doc(req.params.id).update(updates);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to update rate band' });
    }
  });

  router.delete('/:id', requireRole('admin'), async (req, res) => {
    try {
      await db.collection('rateBands').doc(req.params.id).delete();
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to delete rate band' });
    }
  });

  return router;
};
