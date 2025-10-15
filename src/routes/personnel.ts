// Personnel management routes

import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import type { Env, Personnel, ApiResponse } from '../types';

const personnel = new Hono<{ Bindings: Env }>();

personnel.use('*', authMiddleware);

// GET /api/personnel - List all personnel
personnel.get('/', async (c) => {
  try {
    const active_only = c.req.query('active') === 'true';
    const role = c.req.query('role');
    
    let query = 'SELECT * FROM personnel WHERE 1=1';
    const params: any[] = [];
    
    if (active_only) {
      query += ' AND is_active = 1';
    }
    
    if (role) {
      query += ' AND employee_role LIKE ?';
      params.push(`%${role}%`);
    }
    
    query += ' ORDER BY employee_name';
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all<Personnel>();
    
    return c.json<ApiResponse<Personnel[]>>({ success: true, data: results });
  } catch (error) {
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch personnel' }, 500);
  }
});

// GET /api/personnel/:id - Get single personnel
personnel.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const person = await c.env.DB.prepare(
      'SELECT * FROM personnel WHERE id = ?'
    ).bind(id).first<Personnel>();
    
    if (!person) {
      return c.json<ApiResponse>({ success: false, error: 'Personnel not found' }, 404);
    }
    
    return c.json<ApiResponse<Personnel>>({ success: true, data: person });
  } catch (error) {
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch personnel' }, 500);
  }
});

// POST /api/personnel - Create new personnel
personnel.post('/', requireRole('admin', 'manager'), async (c) => {
  try {
    const data = await c.req.json();
    const { employee_id, employee_name, employee_role, employee_level, hourly_cost, banded_rate } = data;
    
    if (!employee_id || !employee_name || !employee_role || !hourly_cost) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Required fields: employee_id, employee_name, employee_role, hourly_cost' 
      }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO personnel (employee_id, employee_name, employee_role, employee_level, hourly_cost, banded_rate)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(employee_id, employee_name, employee_role, employee_level, hourly_cost, banded_rate).run();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'Personnel created successfully',
      data: { id: result.meta.last_row_id }
    }, 201);
  } catch (error) {
    return c.json<ApiResponse>({ success: false, error: 'Failed to create personnel' }, 500);
  }
});

// PUT /api/personnel/:id - Update personnel
personnel.put('/:id', requireRole('admin', 'manager'), async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const existing = await c.env.DB.prepare('SELECT id FROM personnel WHERE id = ?').bind(id).first();
    if (!existing) {
      return c.json<ApiResponse>({ success: false, error: 'Personnel not found' }, 404);
    }
    
    const { employee_name, employee_role, employee_level, hourly_cost, banded_rate, is_active, notes } = data;
    
    await c.env.DB.prepare(`
      UPDATE personnel SET
        employee_name = COALESCE(?, employee_name),
        employee_role = COALESCE(?, employee_role),
        employee_level = COALESCE(?, employee_level),
        hourly_cost = COALESCE(?, hourly_cost),
        banded_rate = COALESCE(?, banded_rate),
        is_active = COALESCE(?, is_active),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(employee_name, employee_role, employee_level, hourly_cost, banded_rate, is_active, notes, id).run();
    
    return c.json<ApiResponse>({ success: true, message: 'Personnel updated successfully' });
  } catch (error) {
    return c.json<ApiResponse>({ success: false, error: 'Failed to update personnel' }, 500);
  }
});

// DELETE /api/personnel/:id - Delete personnel
personnel.delete('/:id', requireRole('admin'), async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM personnel WHERE id = ?').bind(id).run();
    return c.json<ApiResponse>({ success: true, message: 'Personnel deleted successfully' });
  } catch (error) {
    return c.json<ApiResponse>({ success: false, error: 'Failed to delete personnel' }, 500);
  }
});

export default personnel;
