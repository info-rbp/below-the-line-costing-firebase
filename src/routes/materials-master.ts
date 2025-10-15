import { Hono } from 'hono'
import type { Env } from '../types'
import { authMiddleware, requireRole } from '../middleware/auth'

const materialsMaster = new Hono<{ Bindings: Env }>()

// All routes require authentication
materialsMaster.use('/*', authMiddleware)

// Types
interface MaterialMaster {
  id: number
  material_code: string
  material_name: string
  material_category?: string
  description?: string
  default_unit_cost: number
  unit_of_measure: string
  supplier_name?: string
  supplier_contact?: string
  supplier_email?: string
  default_cost_type: string
  default_frequency?: number
  lead_time_days?: number
  is_active: number
  created_at: string
  updated_at: string
  created_by?: number
}

// GET /api/materials-master - List all materials with optional filters
materialsMaster.get('/', async (c) => {
  try {
    const active = c.req.query('active')
    const category = c.req.query('category')
    const search = c.req.query('search')
    
    let query = 'SELECT * FROM materials_master WHERE 1=1'
    const params: any[] = []
    
    if (active === 'true') {
      query += ' AND is_active = 1'
    }
    
    if (category) {
      query += ' AND material_category = ?'
      params.push(category)
    }
    
    if (search) {
      query += ' AND (material_name LIKE ? OR material_code LIKE ? OR description LIKE ?)'
      const searchParam = `%${search}%`
      params.push(searchParam, searchParam, searchParam)
    }
    
    query += ' ORDER BY material_category, material_name ASC'
    
    const stmt = params.length > 0 
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query)
    
    const { results } = await stmt.all<MaterialMaster>()
    
    return c.json({ success: true, data: results })
  } catch (error: any) {
    console.error('Get materials error:', error)
    return c.json({ success: false, error: error.message || 'Failed to fetch materials' }, 500)
  }
})

// GET /api/materials-master/categories - Get distinct categories
materialsMaster.get('/categories', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT DISTINCT material_category 
       FROM materials_master 
       WHERE material_category IS NOT NULL 
       AND is_active = 1
       ORDER BY material_category`
    ).all<{ material_category: string }>()
    
    return c.json({ 
      success: true, 
      data: results.map(r => r.material_category) 
    })
  } catch (error: any) {
    console.error('Get categories error:', error)
    return c.json({ success: false, error: error.message || 'Failed to fetch categories' }, 500)
  }
})

// GET /api/materials-master/:id - Get single material
materialsMaster.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const material = await c.env.DB.prepare(
      'SELECT * FROM materials_master WHERE id = ?'
    ).bind(id).first<MaterialMaster>()
    
    if (!material) {
      return c.json({ success: false, error: 'Material not found' }, 404)
    }
    
    return c.json({ success: true, data: material })
  } catch (error: any) {
    console.error('Get material error:', error)
    return c.json({ success: false, error: error.message || 'Failed to fetch material' }, 500)
  }
})

// POST /api/materials-master - Create new material (Manager+)
materialsMaster.post('/', requireRole('admin', 'manager'), async (c) => {
  try {
    const body = await c.req.json()
    const user = c.get('user')
    
    // Required fields validation
    if (!body.material_code || !body.material_name || !body.default_unit_cost || !body.unit_of_measure) {
      return c.json({ 
        success: false, 
        error: 'material_code, material_name, default_unit_cost, and unit_of_measure are required' 
      }, 400)
    }
    
    // Check if material_code already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM materials_master WHERE material_code = ?'
    ).bind(body.material_code).first()
    
    if (existing) {
      return c.json({ success: false, error: 'Material code already exists' }, 409)
    }
    
    const result = await c.env.DB.prepare(
      `INSERT INTO materials_master (
        material_code, material_name, material_category, description,
        default_unit_cost, unit_of_measure, supplier_name, supplier_contact, supplier_email,
        default_cost_type, default_frequency, lead_time_days, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.material_code,
      body.material_name,
      body.material_category || null,
      body.description || null,
      body.default_unit_cost,
      body.unit_of_measure,
      body.supplier_name || null,
      body.supplier_contact || null,
      body.supplier_email || null,
      body.default_cost_type || 'one-time',
      body.default_frequency || null,
      body.lead_time_days || null,
      body.is_active !== undefined ? body.is_active : 1,
      user.id
    ).run()
    
    const newMaterial = await c.env.DB.prepare(
      'SELECT * FROM materials_master WHERE id = ?'
    ).bind(result.meta.last_row_id).first<MaterialMaster>()
    
    return c.json({ success: true, data: newMaterial }, 201)
  } catch (error: any) {
    console.error('Create material error:', error)
    return c.json({ success: false, error: error.message || 'Failed to create material' }, 500)
  }
})

// PUT /api/materials-master/:id - Update material (Manager+)
materialsMaster.put('/:id', requireRole('admin', 'manager'), async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    // Check if material exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM materials_master WHERE id = ?'
    ).bind(id).first()
    
    if (!existing) {
      return c.json({ success: false, error: 'Material not found' }, 404)
    }
    
    await c.env.DB.prepare(
      `UPDATE materials_master SET
        material_code = ?,
        material_name = ?,
        material_category = ?,
        description = ?,
        default_unit_cost = ?,
        unit_of_measure = ?,
        supplier_name = ?,
        supplier_contact = ?,
        supplier_email = ?,
        default_cost_type = ?,
        default_frequency = ?,
        lead_time_days = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    ).bind(
      body.material_code,
      body.material_name,
      body.material_category || null,
      body.description || null,
      body.default_unit_cost,
      body.unit_of_measure,
      body.supplier_name || null,
      body.supplier_contact || null,
      body.supplier_email || null,
      body.default_cost_type || 'one-time',
      body.default_frequency || null,
      body.lead_time_days || null,
      body.is_active !== undefined ? body.is_active : 1,
      id
    ).run()
    
    const updated = await c.env.DB.prepare(
      'SELECT * FROM materials_master WHERE id = ?'
    ).bind(id).first<MaterialMaster>()
    
    return c.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Update material error:', error)
    return c.json({ success: false, error: error.message || 'Failed to update material' }, 500)
  }
})

// DELETE /api/materials-master/:id - Delete material (Admin only)
materialsMaster.delete('/:id', requireRole('admin'), async (c) => {
  try {
    const id = c.req.param('id')
    
    // Check if material is used in any projects
    const { results: costs } = await c.env.DB.prepare(
      'SELECT id FROM material_costs WHERE material_master_id = ?'
    ).bind(id).all()
    
    if (costs.length > 0) {
      return c.json({ 
        success: false, 
        error: `Cannot delete material. It is used in ${costs.length} cost item(s).` 
      }, 400)
    }
    
    await c.env.DB.prepare(
      'DELETE FROM materials_master WHERE id = ?'
    ).bind(id).run()
    
    return c.json({ success: true, message: 'Material deleted successfully' })
  } catch (error: any) {
    console.error('Delete material error:', error)
    return c.json({ success: false, error: error.message || 'Failed to delete material' }, 500)
  }
})

export default materialsMaster
