/**
 * BTL Costing Application - Firebase Functions
 * Express.js API server with Firestore database
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Firestore
const db = admin.firestore();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import routes
const setupRoutes = require('./src/routes/setup');
const authRoutes = require('./src/routes/auth');
const projectsRoutes = require('./src/routes/projects');
const personnelRoutes = require('./src/routes/personnel');
const costsRoutes = require('./src/routes/costs');
const milestonesRoutes = require('./src/routes/milestones');
const rateBandsRoutes = require('./src/routes/rateBands');
const clientsRoutes = require('./src/routes/clients');
const materialsMasterRoutes = require('./src/routes/materialsMaster');

// Mount routes
app.use('/setup', setupRoutes(db));
app.use('/auth', authRoutes(db));
app.use('/projects', projectsRoutes(db));
app.use('/personnel', personnelRoutes(db));
app.use('/costs', costsRoutes(db));
app.use('/milestones', milestonesRoutes(db));
app.use('/rate-bands', rateBandsRoutes(db));
app.use('/clients', clientsRoutes(db));
app.use('/materials-master', materialsMasterRoutes(db));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Application error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Export Express app as Firebase Function
exports.api = functions.https.onRequest(app);
