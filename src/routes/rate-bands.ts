// Rate bands management routes

import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import type { Env, RateBand, ApiResponse } from '../types';

const rateBands = new Hono<{ Bindings: Env }>();

rateBands.use('*', authMiddleware);

/**
 * GET /api/rate-bands
 * List all rate bands
 */
rateBands.get('/', async (c) => {
  try {
    const active_only = c.req.query('active') === 'true';
    
    let query = 'SELECT * FROM rate_bands WHERE 1=1';
    const params: any[] = [];
    
    if (active_only) {
      query += ' AND is_active = 1';
    }
    
    query += ' ORDER BY hourly_rate DESC';
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all<RateBand>();
    
    return c.json<ApiResponse<RateBand[]>>({ success: true, data: results });
  } catch (error) {
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch rate bands' }, 500);
  }
});

/**
 * GET /api/rate-bands/:id
 * Get single rate band
 */
rateBands.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const rateBand = await c.env.DB.prepare(
      'SELECT * FROM rate_bands WHERE id = ?'
    ).bind(id).first<RateBand>();
    
    if (!rateBand) {
      return c.json<ApiResponse>({ success: false, error: 'Rate band not found' }, 404);
    }
    
    return c.json<ApiResponse<RateBand>>({ success: true, data: rateBand });
  } catch (error) {
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch rate band' }, 500);
  }
});

/**
 * POST /api/rate-bands
 * Create new rate band
 */
rateBands.post('/', requireRole('admin', 'manager'), async (c) => {
  try {
    const data = await c.req.json();
    const { band_name, band_level, role_description, hourly_rate } = data;
    
    if (!band_name || !hourly_rate) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Required fields: band_name, hourly_rate' 
      }, 400);
    }
    
    // Check if band name already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM rate_bands WHERE band_name = ?'
    ).bind(band_name).first();
    
    if (existing) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Rate band with this name already exists' 
      }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO rate_bands (band_name, band_level, role_description, hourly_rate)
      VALUES (?, ?, ?, ?)
    `).bind(band_name, band_level, role_description, hourly_rate).run();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'Rate band created successfully',
      data: { id: result.meta.last_row_id }
    }, 201);
  } catch (error) {
    console.error('Create rate band error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to create rate band' }, 500);
  }
});

/**
 * PUT /api/rate-bands/:id
 * Update rate band
 */
rateBands.put('/:id', requireRole('admin', 'manager'), async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const existing = await c.env.DB.prepare('SELECT id FROM rate_bands WHERE id = ?').bind(id).first();
    
    if (!existing) {
      return c.json<ApiResponse>({ success: false, error: 'Rate band not found' }, 404);
    }
    
    const { band_name, band_level, role_description, hourly_rate, is_active } = data;
    
    await c.env.DB.prepare(`
      UPDATE rate_bands SET
        band_name = COALESCE(?, band_name),
        band_level = COALESCE(?, band_level),
        role_description = COALESCE(?, role_description),
        hourly_rate = COALESCE(?, hourly_rate),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(band_name, band_level, role_description, hourly_rate, is_active, id).run();
    
    return c.json<ApiResponse>({ success: true, message: 'Rate band updated successfully' });
  } catch (error) {
    return c.json<ApiResponse>({ success: false, error: 'Failed to update rate band' }, 500);
  }
});

/**
 * DELETE /api/rate-bands/:id
 * Delete rate band
 */
rateBands.delete('/:id', requireRole('admin'), async (c) => {
  try {
    const id = c.req.param('id');
    
    // Check if rate band is being used
    const inUse = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM cost_line_items WHERE rate_band_id = ?'
    ).bind(id).first<{ count: number }>();
    
    if (inUse && inUse.count > 0) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Cannot delete rate band that is in use. Set to inactive instead.' 
      }, 400);
    }
    
    await c.env.DB.prepare('DELETE FROM rate_bands WHERE id = ?').bind(id).run();
    
    return c.json<ApiResponse>({ success: true, message: 'Rate band deleted successfully' });
  } catch (error) {
    return c.json<ApiResponse>({ success: false, error: 'Failed to delete rate band' }, 500);
  }
});

export default rateBands;
