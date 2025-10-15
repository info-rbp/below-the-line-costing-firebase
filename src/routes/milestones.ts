// Milestone management routes

import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import type { Env, Milestone, ApiResponse } from '../types';

const milestones = new Hono<{ Bindings: Env }>();

milestones.use('*', authMiddleware);

/**
 * GET /api/milestones?project_id=1
 * List all milestones for a project
 */
milestones.get('/', async (c) => {
  try {
    const project_id = c.req.query('project_id');
    
    if (!project_id) {
      return c.json<ApiResponse>({ success: false, error: 'project_id required' }, 400);
    }
    
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM milestones WHERE project_id = ? ORDER BY sequence_order, milestone_date'
    ).bind(project_id).all<Milestone>();
    
    return c.json<ApiResponse<Milestone[]>>({ success: true, data: results });
  } catch (error) {
    console.error('Get milestones error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch milestones' }, 500);
  }
});

/**
 * GET /api/milestones/:id
 * Get single milestone
 */
milestones.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const milestone = await c.env.DB.prepare(
      'SELECT * FROM milestones WHERE id = ?'
    ).bind(id).first<Milestone>();
    
    if (!milestone) {
      return c.json<ApiResponse>({ success: false, error: 'Milestone not found' }, 404);
    }
    
    return c.json<ApiResponse<Milestone>>({ success: true, data: milestone });
  } catch (error) {
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch milestone' }, 500);
  }
});

/**
 * POST /api/milestones
 * Create single milestone
 */
milestones.post('/', requireRole('admin', 'manager', 'user'), async (c) => {
  try {
    const data = await c.req.json();
    const { project_id, milestone_code, milestone_name, milestone_date, description, sequence_order } = data;
    
    if (!project_id || !milestone_code || !milestone_name) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Required: project_id, milestone_code, milestone_name' 
      }, 400);
    }
    
    // Check if milestone code already exists for this project
    const existing = await c.env.DB.prepare(
      'SELECT id FROM milestones WHERE project_id = ? AND milestone_code = ?'
    ).bind(project_id, milestone_code).first();
    
    if (existing) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Milestone code already exists for this project' 
      }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO milestones (project_id, milestone_code, milestone_name, milestone_date, description, sequence_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(project_id, milestone_code, milestone_name, milestone_date, description, sequence_order || 0).run();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'Milestone created successfully',
      data: { id: result.meta.last_row_id }
    }, 201);
  } catch (error) {
    console.error('Create milestone error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to create milestone' }, 500);
  }
});

/**
 * POST /api/milestones/bulk
 * Create multiple milestones at once
 */
milestones.post('/bulk', requireRole('admin', 'manager', 'user'), async (c) => {
  try {
    const { project_id, milestones: milestonesData } = await c.req.json();
    
    if (!project_id || !Array.isArray(milestonesData) || milestonesData.length === 0) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'project_id and milestones array required' 
      }, 400);
    }
    
    const created: number[] = [];
    
    // Insert each milestone
    for (const milestone of milestonesData) {
      const { milestone_code, milestone_name, milestone_date, description, sequence_order } = milestone;
      
      if (!milestone_code || !milestone_name) {
        continue; // Skip invalid entries
      }
      
      try {
        const result = await c.env.DB.prepare(`
          INSERT INTO milestones (project_id, milestone_code, milestone_name, milestone_date, description, sequence_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(project_id, milestone_code, milestone_name, milestone_date, description, sequence_order || 0).run();
        
        created.push(result.meta.last_row_id as number);
      } catch (err) {
        console.error(`Failed to create milestone ${milestone_code}:`, err);
      }
    }
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: `Created ${created.length} milestones`,
      data: { created_ids: created, count: created.length }
    }, 201);
  } catch (error) {
    console.error('Bulk create milestones error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to create milestones' }, 500);
  }
});

/**
 * PUT /api/milestones/:id
 * Update milestone
 */
milestones.put('/:id', requireRole('admin', 'manager', 'user'), async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const existing = await c.env.DB.prepare('SELECT id FROM milestones WHERE id = ?').bind(id).first();
    
    if (!existing) {
      return c.json<ApiResponse>({ success: false, error: 'Milestone not found' }, 404);
    }
    
    const { milestone_code, milestone_name, milestone_date, description, sequence_order } = data;
    
    await c.env.DB.prepare(`
      UPDATE milestones SET
        milestone_code = COALESCE(?, milestone_code),
        milestone_name = COALESCE(?, milestone_name),
        milestone_date = COALESCE(?, milestone_date),
        description = COALESCE(?, description),
        sequence_order = COALESCE(?, sequence_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(milestone_code, milestone_name, milestone_date, description, sequence_order, id).run();
    
    return c.json<ApiResponse>({ success: true, message: 'Milestone updated successfully' });
  } catch (error) {
    console.error('Update milestone error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to update milestone' }, 500);
  }
});

/**
 * DELETE /api/milestones/:id
 * Delete milestone
 */
milestones.delete('/:id', requireRole('admin', 'manager'), async (c) => {
  try {
    const id = c.req.param('id');
    
    // Check if milestone has associated cost items
    const hasItems = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM cost_line_items WHERE milestone_id = ?
        UNION ALL
        SELECT id FROM material_costs WHERE milestone_id = ?
      )
    `).bind(id, id).first<{ count: number }>();
    
    if (hasItems && hasItems.count > 0) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Cannot delete milestone with associated cost items. Remove cost items first.' 
      }, 400);
    }
    
    await c.env.DB.prepare('DELETE FROM milestones WHERE id = ?').bind(id).run();
    
    return c.json<ApiResponse>({ success: true, message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Delete milestone error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to delete milestone' }, 500);
  }
});

export default milestones;
