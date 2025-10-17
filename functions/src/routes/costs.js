/**
 * Cost tracking routes (labour and material costs)
 */

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();
  router.use((req, res, next) => { req.app.locals.db = db; next(); });
  router.use(authMiddleware);

  // Labour costs routes
  router.get('/labour', async (req, res) => {
    try {
      let query = db.collection('costLineItems');
      if (req.query.project_id) {
        query = query.where('project_id', '==', req.query.project_id);
      }
      const snapshot = await query.get();
      const costs = [];
      snapshot.forEach(doc => costs.push({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, data: costs });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch labour costs' });
    }
  });

  router.post('/labour', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const data = { ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const ref = await db.collection('costLineItems').add(data);
      return res.json({ success: true, data: { id: ref.id } });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to create labour cost' });
    }
  });

  router.put('/labour/:id', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const updates = { ...req.body, updated_at: new Date().toISOString() };
      delete updates.id; delete updates.created_at;
      await db.collection('costLineItems').doc(req.params.id).update(updates);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to update labour cost' });
    }
  });

  router.delete('/labour/:id', requireRole('admin', 'manager'), async (req, res) => {
    try {
      await db.collection('costLineItems').doc(req.params.id).delete();
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to delete labour cost' });
    }
  });

  // Material costs routes
  router.get('/material', async (req, res) => {
    try {
      let query = db.collection('materialCosts');
      if (req.query.project_id) {
        query = query.where('project_id', '==', req.query.project_id);
      }
      const snapshot = await query.get();
      const costs = [];
      snapshot.forEach(doc => costs.push({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, data: costs });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch material costs' });
    }
  });

  router.post('/material', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const data = { ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const ref = await db.collection('materialCosts').add(data);
      return res.json({ success: true, data: { id: ref.id } });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to create material cost' });
    }
  });

  router.put('/material/:id', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const updates = { ...req.body, updated_at: new Date().toISOString() };
      delete updates.id; delete updates.created_at;
      await db.collection('materialCosts').doc(req.params.id).update(updates);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to update material cost' });
    }
  });

  router.delete('/material/:id', requireRole('admin', 'manager'), async (req, res) => {
    try {
      await db.collection('materialCosts').doc(req.params.id).delete();
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to delete material cost' });
    }
  });

  return router;
};
