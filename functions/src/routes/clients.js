/**
 * Clients routes for Express.js with Firestore
 */

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();
  router.use((req, res, next) => { req.app.locals.db = db; next(); });
  router.use(authMiddleware);

  router.get('/', async (req, res) => {
    try {
      const snapshot = await db.collection('clients').orderBy('client_name').get();
      const clients = [];
      snapshot.forEach(doc => clients.push({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, data: clients });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch clients' });
    }
  });

  router.post('/', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const data = { ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const ref = await db.collection('clients').add(data);
      return res.json({ success: true, data: { id: ref.id } });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to create client' });
    }
  });

  router.put('/:id', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const updates = { ...req.body, updated_at: new Date().toISOString() };
      delete updates.id; delete updates.created_at;
      await db.collection('clients').doc(req.params.id).update(updates);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to update client' });
    }
  });

  router.delete('/:id', requireRole('admin'), async (req, res) => {
    try {
      await db.collection('clients').doc(req.params.id).delete();
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to delete client' });
    }
  });

  return router;
};
