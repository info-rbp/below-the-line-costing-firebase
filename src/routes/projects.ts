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

export default projects;
