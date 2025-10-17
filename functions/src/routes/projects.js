/**
 * Project management routes for Express.js with Firestore
 */

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();
  
  // Store db reference
  router.use((req, res, next) => {
    req.app.locals.db = db;
    next();
  });

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/projects
   * List all projects (with optional filters)
   */
  router.get('/', async (req, res) => {
    try {
      const { status, client } = req.query;
      
      let query = db.collection('projects');
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      if (client) {
        query = query.where('client_name', '==', client);
      }
      
      const snapshot = await query.orderBy('created_at', 'desc').get();
      
      const projects = [];
      snapshot.forEach(doc => {
        projects.push({ id: doc.id, ...doc.data() });
      });
      
      return res.json({ success: true, data: projects });
    } catch (error) {
      console.error('Get projects error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch projects' });
    }
  });

  /**
   * GET /api/projects/:id
   * Get single project with full details
   */
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const projectDoc = await db.collection('projects').doc(id).get();
      
      if (!projectDoc.exists) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }
      
      const project = { id: projectDoc.id, ...projectDoc.data() };
      
      // Get milestones
      const milestonesSnapshot = await db.collection('milestones')
        .where('project_id', '==', id)
        .orderBy('sequence_order')
        .get();
      
      const milestones = [];
      milestonesSnapshot.forEach(doc => {
        milestones.push({ id: doc.id, ...doc.data() });
      });
      
      // Get cost summary
      const labourSnapshot = await db.collection('costLineItems')
        .where('project_id', '==', id)
        .get();
      
      const materialSnapshot = await db.collection('materialCosts')
        .where('project_id', '==', id)
        .get();
      
      let labourCost = 0;
      labourSnapshot.forEach(doc => {
        labourCost += doc.data().total_cost || 0;
      });
      
      let materialCost = 0;
      materialSnapshot.forEach(doc => {
        materialCost += doc.data().total_cost || 0;
      });
      
      return res.json({ 
        success: true, 
        data: { 
          ...project, 
          milestones, 
          costSummary: { labourCost, materialCost } 
        } 
      });
    } catch (error) {
      console.error('Get project error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch project' });
    }
  });

  /**
   * POST /api/projects
   * Create new project
   */
  router.post('/', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const { 
        project_code, project_name, client_name, start_date, end_date,
        tax_rate, ga_percentage, ga_application, total_revenue, status
      } = req.body;
      
      if (!project_code || !project_name || !client_name || !start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }
      
      // Check if project code already exists
      const existing = await db.collection('projects')
        .where('project_code', '==', project_code)
        .limit(1)
        .get();
      
      if (!existing.empty) {
        return res.status(400).json({ 
          success: false, 
          error: 'Project code already exists' 
        });
      }
      
      // Create project
      const projectRef = await db.collection('projects').add({
        project_code,
        project_name,
        client_name,
        start_date,
        end_date,
        status: status || 'active',
        tax_rate: tax_rate || 0,
        ga_percentage: ga_percentage || 0,
        ga_application: ga_application || 'all',
        total_labour_cost: 0,
        total_material_cost: 0,
        total_cost: 0,
        total_revenue: total_revenue || 0,
        margin_percentage: 0,
        created_by: req.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return res.json({ 
        success: true, 
        message: 'Project created successfully',
        data: { id: projectRef.id }
      });
      
    } catch (error) {
      console.error('Create project error:', error);
      return res.status(500).json({ success: false, error: 'Failed to create project' });
    }
  });

  /**
   * PUT /api/projects/:id
   * Update project
   */
  router.put('/:id', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Remove fields that shouldn't be updated directly
      delete updates.id;
      delete updates.created_by;
      delete updates.created_at;
      
      updates.updated_at = new Date().toISOString();
      
      await db.collection('projects').doc(id).update(updates);
      
      return res.json({ 
        success: true, 
        message: 'Project updated successfully' 
      });
      
    } catch (error) {
      console.error('Update project error:', error);
      return res.status(500).json({ success: false, error: 'Failed to update project' });
    }
  });

  /**
   * DELETE /api/projects/:id
   * Delete project (admin only)
   */
  router.delete('/:id', requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete project and all related data
      await db.collection('projects').doc(id).delete();
      
      // Delete related milestones
      const milestonesSnapshot = await db.collection('milestones')
        .where('project_id', '==', id)
        .get();
      
      const batch = db.batch();
      milestonesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete related cost items
      const costsSnapshot = await db.collection('costLineItems')
        .where('project_id', '==', id)
        .get();
      
      costsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete related material costs
      const materialsSnapshot = await db.collection('materialCosts')
        .where('project_id', '==', id)
        .get();
      
      materialsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      return res.json({ 
        success: true, 
        message: 'Project deleted successfully' 
      });
      
    } catch (error) {
      console.error('Delete project error:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete project' });
    }
  });

  /**
   * POST /api/projects/:id/recalculate
   * Recalculate project totals
   */
  router.post('/:id/recalculate', requireRole('admin', 'manager'), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get all cost items
      const labourSnapshot = await db.collection('costLineItems')
        .where('project_id', '==', id)
        .get();
      
      const materialSnapshot = await db.collection('materialCosts')
        .where('project_id', '==', id)
        .get();
      
      let totalLabourCost = 0;
      labourSnapshot.forEach(doc => {
        totalLabourCost += doc.data().total_cost || 0;
      });
      
      let totalMaterialCost = 0;
      materialSnapshot.forEach(doc => {
        totalMaterialCost += doc.data().total_cost || 0;
      });
      
      const totalCost = totalLabourCost + totalMaterialCost;
      
      // Get project to calculate margin
      const projectDoc = await db.collection('projects').doc(id).get();
      const project = projectDoc.data();
      
      const marginPercentage = project.total_revenue > 0
        ? ((project.total_revenue - totalCost) / project.total_revenue) * 100
        : 0;
      
      // Update project
      await projectDoc.ref.update({
        total_labour_cost: totalLabourCost,
        total_material_cost: totalMaterialCost,
        total_cost: totalCost,
        margin_percentage: marginPercentage,
        updated_at: new Date().toISOString()
      });
      
      return res.json({ 
        success: true, 
        message: 'Project totals recalculated',
        data: {
          total_labour_cost: totalLabourCost,
          total_material_cost: totalMaterialCost,
          total_cost: totalCost,
          margin_percentage: marginPercentage
        }
      });
      
    } catch (error) {
      console.error('Recalculate project error:', error);
      return res.status(500).json({ success: false, error: 'Failed to recalculate project' });
    }
  });

  return router;
};
