/**
 * Milestones routes for Express.js with Firestore
 */

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();
  router.use((req, res, next) => { req.app.locals.db = db; next(); });
  router.use(authMiddleware);

  router.get('/', async (req, res) => {
    try {
      let query = db.collection('milestones');
      if (req.query.project_id) {
        query = query.where('project_id', '==', req.query.project_id);
      }
      const snapshot = await query.orderBy('sequence_order').get();
      const milestones = [];
      snapshot.forEach(doc => milestones.push({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, data: milestones });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch milestones' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const doc = await db.collection('milestones').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ success: false, error: 'Milestone not found' });
      return res.json({ success: true, data: { id: doc.id, ...doc.data() } });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch milestone' });
    }
  });

  router.post('/', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const data = { ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const ref = await db.collection('milestones').add(data);
      return res.json({ success: true, data: { id: ref.id } });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to create milestone' });
    }
  });

  router.put('/:id', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const updates = { ...req.body, updated_at: new Date().toISOString() };
      delete updates.id; delete updates.created_at;
      await db.collection('milestones').doc(req.params.id).update(updates);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to update milestone' });
    }
  });

  router.delete('/:id', requireRole('admin', 'manager'), async (req, res) => {
    try {
      await db.collection('milestones').doc(req.params.id).delete();
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to delete milestone' });
    }
  });

  return router;
};
