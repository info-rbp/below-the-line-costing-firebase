// Project management routes

import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import type { Env, User, Project, ApiResponse } from '../types';

const projects = new Hono<{ Bindings: Env }>();

// All routes require authentication
projects.use('*', authMiddleware);

/**
 * GET /api/projects
 * List all projects (with optional filters)
 */
projects.get('/', async (c) => {
  try {
    const user = c.get('user') as User;
    const status = c.req.query('status');
    const client = c.req.query('client');
    
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (client) {
      query += ' AND client_name LIKE ?';
      params.push(`%${client}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all<Project>();
    
    return c.json<ApiResponse<Project[]>>({ success: true, data: results });
  } catch (error) {
    console.error('Get projects error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch projects' }, 500);
  }
});

/**
 * GET /api/projects/:id
 * Get single project with full details
 */
projects.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const project = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(id).first<Project>();
    
    if (!project) {
      return c.json<ApiResponse>({ success: false, error: 'Project not found' }, 404);
    }
    
    // Get milestones
    const { results: milestones } = await c.env.DB.prepare(
      'SELECT * FROM milestones WHERE project_id = ? ORDER BY sequence_order'
    ).bind(id).all();
    
    // Get cost summary
    const costSummary = await c.env.DB.prepare(`
      SELECT 
        (SELECT COALESCE(SUM(total_cost), 0) FROM cost_line_items WHERE project_id = ?) as labour_cost,
        (SELECT COALESCE(SUM(total_cost), 0) FROM material_costs WHERE project_id = ?) as material_cost
    `).bind(id, id).first();
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: { ...project, milestones, costSummary } 
    });
  } catch (error) {
    console.error('Get project error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch project' }, 500);
  }
});

/**
 * POST /api/projects
 * Create new project
 */
projects.post('/', requireRole('admin', 'manager'), async (c) => {
  try {
    const user = c.get('user') as User;
    const data = await c.req.json();
    
    const { 
      project_code, project_name, client_name, start_date, end_date,
      tax_rate, ga_percentage, ga_application, total_revenue 
    } = data;
    
    if (!project_code || !project_name || !client_name || !start_date || !end_date) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Required fields: project_code, project_name, client_name, start_date, end_date' 
      }, 400);
    }
    
    // Check if project code already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM projects WHERE project_code = ?'
    ).bind(project_code).first();
    
    if (existing) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Project code already exists' 
      }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO projects (
        project_code, project_name, client_name, start_date, end_date,
        tax_rate, ga_percentage, ga_application, total_revenue, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      project_code, project_name, client_name, start_date, end_date,
      tax_rate || 0, ga_percentage || 0, ga_application || 'all', total_revenue || 0, user.id
    ).run();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'Project created successfully',
      data: { id: result.meta.last_row_id }
    }, 201);
  } catch (error) {
    console.error('Create project error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to create project' }, 500);
  }
});

/**
 * PUT /api/projects/:id
 * Update project
 */
projects.put('/:id', requireRole('admin', 'manager'), async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    // Check if project exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM projects WHERE id = ?'
    ).bind(id).first();
    
    if (!existing) {
      return c.json<ApiResponse>({ success: false, error: 'Project not found' }, 404);
    }
    
    const { 
      project_name, client_name, start_date, end_date, status,
      tax_rate, ga_percentage, ga_application, total_revenue 
    } = data;
    
    await c.env.DB.prepare(`
      UPDATE projects SET
        project_name = COALESCE(?, project_name),
        client_name = COALESCE(?, client_name),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        status = COALESCE(?, status),
        tax_rate = COALESCE(?, tax_rate),
        ga_percentage = COALESCE(?, ga_percentage),
        ga_application = COALESCE(?, ga_application),
        total_revenue = COALESCE(?, total_revenue),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      project_name, client_name, start_date, end_date, status,
      tax_rate, ga_percentage, ga_application, total_revenue, id
    ).run();
    
    return c.json<ApiResponse>({ success: true, message: 'Project updated successfully' });
  } catch (error) {
    console.error('Update project error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to update project' }, 500);
  }
});

/**
 * DELETE /api/projects/:id
 * Delete project
 */
projects.delete('/:id', requireRole('admin'), async (c) => {
  try {
    const id = c.req.param('id');
    
    const existing = await c.env.DB.prepare(
      'SELECT id FROM projects WHERE id = ?'
    ).bind(id).first();
    
    if (!existing) {
      return c.json<ApiResponse>({ success: false, error: 'Project not found' }, 404);
    }
    
    await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
    
    return c.json<ApiResponse>({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to delete project' }, 500);
  }
});

/**
 * POST /api/projects/:id/recalculate
 * Recalculate project totals and margin
 */
projects.post('/:id/recalculate', requireRole('admin', 'manager', 'user'), async (c) => {
  try {
    const id = c.req.param('id');
    
    const project = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(id).first<Project>();
    
    if (!project) {
      return c.json<ApiResponse>({ success: false, error: 'Project not found' }, 404);
    }
    
    // Calculate totals
    const totals = await c.env.DB.prepare(`
      SELECT 
        COALESCE(SUM(cli.total_cost), 0) as labour_cost,
        COALESCE(SUM(mc.total_cost), 0) as material_cost
      FROM projects p
      LEFT JOIN cost_line_items cli ON p.id = cli.project_id
      LEFT JOIN material_costs mc ON p.id = mc.project_id
      WHERE p.id = ?
      GROUP BY p.id
    `).bind(id).first<any>();
    
    const total_labour_cost = totals?.labour_cost || 0;
    const total_material_cost = totals?.material_cost || 0;
    const total_cost = total_labour_cost + total_material_cost;
    const margin = project.total_revenue - total_cost;
    const margin_percentage = project.total_revenue > 0 ? (margin / project.total_revenue) * 100 : 0;
    
    await c.env.DB.prepare(`
      UPDATE projects SET
        total_labour_cost = ?,
        total_material_cost = ?,
        total_cost = ?,
        margin_percentage = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(total_labour_cost, total_material_cost, total_cost, margin_percentage, id).run();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'Project recalculated successfully',
      data: { total_labour_cost, total_material_cost, total_cost, margin_percentage }
    });
  } catch (error) {
    console.error('Recalculate project error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to recalculate project' }, 500);
  }
});

/**
 * POST /api/projects/with-details
 * Create project with all related data in one transaction
 */
projects.post('/with-details', requireRole('admin', 'manager'), async (c) => {
  try {
    const user = c.get('user') as User;
    const data = await c.req.json();
    
    const { 
      project, 
      milestones = [], 
      labour_costs = [], 
      material_costs = [], 
      payment_schedule = [] 
    } = data;
    
    // Validate project data
    if (!project || !project.project_code || !project.project_name || !project.client_name) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Project data with code, name, and client required' 
      }, 400);
    }
    
    // Check if project code already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM projects WHERE project_code = ?'
    ).bind(project.project_code).first();
    
    if (existing) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Project code already exists' 
      }, 400);
    }
    
    // Step 1: Create project
    const projectResult = await c.env.DB.prepare(`
      INSERT INTO projects (
        project_code, project_name, client_name, start_date, end_date,
        tax_rate, ga_percentage, ga_application, total_revenue, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      project.project_code, 
      project.project_name, 
      project.client_name, 
      project.start_date, 
      project.end_date,
      project.tax_rate || 0, 
      project.ga_percentage || 0, 
      project.ga_application || 'all', 
      project.total_revenue || 0, 
      user.id
    ).run();
    
    const project_id = projectResult.meta.last_row_id as number;
    
    // Step 2: Create milestones and build milestone_code to ID mapping
    const milestoneMap: Record<string, number> = {};
    
    for (const milestone of milestones) {
      if (!milestone.milestone_code || !milestone.milestone_name) continue;
      
      const milestoneResult = await c.env.DB.prepare(`
        INSERT INTO milestones (project_id, milestone_code, milestone_name, milestone_date, description, sequence_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        project_id,
        milestone.milestone_code,
        milestone.milestone_name,
        milestone.milestone_date,
        milestone.description,
        milestone.sequence_order || 0
      ).run();
      
      milestoneMap[milestone.milestone_code] = milestoneResult.meta.last_row_id as number;
    }
    
    // Step 3: Create labour costs
    for (const item of labour_costs) {
      if (!item.task_description || !item.rate_type || !item.hours || !item.hourly_rate) continue;
      
      // Resolve milestone_id from milestone_code if provided
      const milestone_id = item.milestone_code ? milestoneMap[item.milestone_code] : item.milestone_id;
      
      // Calculate costs
      const base_cost = item.hours * item.hourly_rate;
      const apply_ga = item.apply_ga !== undefined ? item.apply_ga : 1;
      const ga_cost = apply_ga ? base_cost * (project.ga_percentage / 100) : 0;
      const total_cost = base_cost + ga_cost;
      
      await c.env.DB.prepare(`
        INSERT INTO cost_line_items (
          project_id, milestone_id, wbs_code, task_description, rate_type,
          personnel_id, rate_band_id, hours, hourly_rate, apply_ga,
          base_cost, ga_cost, total_cost, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        project_id,
        milestone_id,
        item.wbs_code,
        item.task_description,
        item.rate_type,
        item.personnel_id,
        item.rate_band_id,
        item.hours,
        item.hourly_rate,
        apply_ga,
        base_cost,
        ga_cost,
        total_cost,
        item.notes
      ).run();
    }
    
    // Step 4: Create material costs
    for (const item of material_costs) {
      if (!item.material_description || !item.cost_type || !item.quantity || !item.unit_cost) continue;
      
      const milestone_id = item.milestone_code ? milestoneMap[item.milestone_code] : item.milestone_id;
      
      // Calculate costs
      let base_cost = item.quantity * item.unit_cost;
      
      // For monthly costs, multiply by months
      let months_count = null;
      if (item.cost_type === 'monthly' && item.start_month !== undefined && item.end_month !== undefined) {
        months_count = item.end_month - item.start_month + 1;
        base_cost = item.quantity * item.unit_cost * months_count;
      }
      
      const apply_ga = item.apply_ga !== undefined ? item.apply_ga : 1;
      const ga_cost = apply_ga ? base_cost * (project.ga_percentage / 100) : 0;
      const total_cost = base_cost + ga_cost;
      
      await c.env.DB.prepare(`
        INSERT INTO material_costs (
          project_id, milestone_id, material_description, material_category, cost_type,
          quantity, unit_cost, start_month, end_month, months_count, apply_ga,
          base_cost, ga_cost, total_cost, supplier, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        project_id,
        milestone_id,
        item.material_description,
        item.material_category,
        item.cost_type,
        item.quantity,
        item.unit_cost,
        item.start_month,
        item.end_month,
        months_count,
        apply_ga,
        base_cost,
        ga_cost,
        total_cost,
        item.supplier,
        item.notes
      ).run();
    }
    
    // Step 5: Create payment schedule
    for (const payment of payment_schedule) {
      if (!payment.payment_description || !payment.invoice_amount) continue;
      
      const milestone_id = payment.milestone_code ? milestoneMap[payment.milestone_code] : payment.milestone_id;
      
      await c.env.DB.prepare(`
        INSERT INTO payment_schedule (
          project_id, milestone_id, payment_description, payment_date,
          invoice_amount, invoice_number, payment_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        project_id,
        milestone_id,
        payment.payment_description,
        payment.payment_date,
        payment.invoice_amount,
        payment.invoice_number,
        payment.payment_status || 'pending',
        payment.notes
      ).run();
    }
    
    // Step 6: Recalculate project totals
    const totals = await c.env.DB.prepare(`
      SELECT 
        COALESCE(SUM(cli.total_cost), 0) as labour_cost,
        COALESCE(SUM(mc.total_cost), 0) as material_cost
      FROM projects p
      LEFT JOIN cost_line_items cli ON p.id = cli.project_id
      LEFT JOIN material_costs mc ON p.id = mc.project_id
      WHERE p.id = ?
      GROUP BY p.id
    `).bind(project_id).first<any>();
    
    const total_labour_cost = totals?.labour_cost || 0;
    const total_material_cost = totals?.material_cost || 0;
    const total_cost = total_labour_cost + total_material_cost;
    const margin = project.total_revenue - total_cost;
    const margin_percentage = project.total_revenue > 0 ? (margin / project.total_revenue) * 100 : 0;
    
    await c.env.DB.prepare(`
      UPDATE projects SET
        total_labour_cost = ?,
        total_material_cost = ?,
        total_cost = ?,
        margin_percentage = ?
      WHERE id = ?
    `).bind(total_labour_cost, total_material_cost, total_cost, margin_percentage, project_id).run();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'Project created successfully with all details',
      data: { 
        project_id,
        milestones_created: Object.keys(milestoneMap).length,
        labour_items_created: labour_costs.length,
        material_items_created: material_costs.length,
        payments_created: payment_schedule.length,
        totals: {
          total_labour_cost,
          total_material_cost,
          total_cost,
          margin_percentage
        }
      }
    }, 201);
    
  } catch (error) {
    console.error('Create project with details error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to create project. Transaction rolled back.' 
    }, 500);
  }
});

/**
 * POST /api/projects/:id/submit-for-approval
 * Submit project for manager approval
 */
projects.post('/:id/submit-for-approval', requireRole('user', 'manager', 'admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user') as User;
    const { approver_id, comments } = await c.req.json();
    
    // Get project
    const project = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(id).first<Project>();
    
    if (!project) {
      return c.json<ApiResponse>({ success: false, error: 'Project not found' }, 404);
    }
    
    // Only draft projects can be submitted
    if (project.approval_status !== 'draft') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: `Project is already ${project.approval_status}. Only draft projects can be submitted.` 
      }, 400);
    }
    
    // Update project status
    await c.env.DB.prepare(`
      UPDATE projects 
      SET approval_status = 'pending_approval',
          submitted_at = CURRENT_TIMESTAMP,
          submitted_by = ?
      WHERE id = ?
    `).bind(user.id, id).run();
    
    // Log approval action
    await c.env.DB.prepare(`
      INSERT INTO project_approvals (project_id, approver_id, action, comments)
      VALUES (?, ?, 'submitted', ?)
    `).bind(id, approver_id || user.id, comments || 'Project submitted for approval').run();
    
    const updated = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(id).first<Project>();
    
    return c.json<ApiResponse>({ success: true, data: updated });
  } catch (error) {
    console.error('Submit for approval error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to submit project' }, 500);
  }
});

/**
 * POST /api/projects/:id/approve
 * Approve project (Manager/Admin only)
 */
projects.post('/:id/approve', requireRole('manager', 'admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user') as User;
    const { comments } = await c.req.json();
    
    // Get project
    const project = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(id).first<Project>();
    
    if (!project) {
      return c.json<ApiResponse>({ success: false, error: 'Project not found' }, 404);
    }
    
    // Only pending projects can be approved
    if (project.approval_status !== 'pending_approval') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: `Project is ${project.approval_status}. Only pending projects can be approved.` 
      }, 400);
    }
    
    // Update project status
    await c.env.DB.prepare(`
      UPDATE projects 
      SET approval_status = 'approved',
          approved_at = CURRENT_TIMESTAMP,
          approved_by = ?,
          status = 'active'
      WHERE id = ?
    `).bind(user.id, id).run();
    
    // Log approval action
    await c.env.DB.prepare(`
      INSERT INTO project_approvals (project_id, approver_id, action, comments)
      VALUES (?, ?, 'approved', ?)
    `).bind(id, user.id, comments || 'Project approved').run();
    
    const updated = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(id).first<Project>();
    
    return c.json<ApiResponse>({ success: true, data: updated });
  } catch (error) {
    console.error('Approve project error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to approve project' }, 500);
  }
});

/**
 * POST /api/projects/:id/reject
 * Reject project (Manager/Admin only)
 */
projects.post('/:id/reject', requireRole('manager', 'admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user') as User;
    const { comments, rejection_reason } = await c.req.json();
    
    // Get project
    const project = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(id).first<Project>();
    
    if (!project) {
      return c.json<ApiResponse>({ success: false, error: 'Project not found' }, 404);
    }
    
    // Only pending projects can be rejected
    if (project.approval_status !== 'pending_approval') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: `Project is ${project.approval_status}. Only pending projects can be rejected.` 
      }, 400);
    }
    
    // Update project status
    await c.env.DB.prepare(`
      UPDATE projects 
      SET approval_status = 'rejected',
          rejection_reason = ?
      WHERE id = ?
    `).bind(rejection_reason || 'No reason provided', id).run();
    
    // Log approval action
    await c.env.DB.prepare(`
      INSERT INTO project_approvals (project_id, approver_id, action, comments)
      VALUES (?, ?, 'rejected', ?)
    `).bind(id, user.id, comments || rejection_reason || 'Project rejected').run();
    
    const updated = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(id).first<Project>();
    
    return c.json<ApiResponse>({ success: true, data: updated });
  } catch (error) {
    console.error('Reject project error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to reject project' }, 500);
  }
});

/**
 * GET /api/projects/pending-approval
 * Get all projects pending approval (Manager/Admin only)
 */
projects.get('/pending-approval', requireRole('manager', 'admin'), async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT p.*, u.full_name as submitted_by_name, u.email as submitted_by_email
      FROM projects p
      LEFT JOIN users u ON p.submitted_by = u.id
      WHERE p.approval_status = 'pending_approval'
      ORDER BY p.submitted_at DESC
    `).all<Project>();
    
    return c.json<ApiResponse>({ success: true, data: results });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch pending approvals' }, 500);
  }
});

/**
 * GET /api/projects/my-submissions
 * Get current user's submitted projects
 */
projects.get('/my-submissions', async (c) => {
  try {
    const user = c.get('user') as User;
    
    const { results } = await c.env.DB.prepare(`
      SELECT p.*, u.full_name as approved_by_name
      FROM projects p
      LEFT JOIN users u ON p.approved_by = u.id
      WHERE p.submitted_by = ?
      ORDER BY p.submitted_at DESC
    `).bind(user.id).all<Project>();
    
    return c.json<ApiResponse>({ success: true, data: results });
  } catch (error) {
    console.error('Get my submissions error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch submissions' }, 500);
  }
});

export default projects;
