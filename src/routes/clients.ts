import { Hono } from 'hono'
import type { Env } from '../types'
import { authMiddleware, requireRole } from '../middleware/auth'

const clients = new Hono<{ Bindings: Env }>()

// All routes require authentication
clients.use('/*', authMiddleware)

// Types
interface Client {
  id: number
  client_code: string
  client_name: string
  client_type?: string
  industry?: string
  primary_contact_name?: string
  primary_contact_email?: string
  primary_contact_phone?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  tax_id?: string
  payment_terms?: string
  credit_limit?: number
  website?: string
  notes?: string
  is_active: number
  created_at: string
  updated_at: string
  created_by?: number
}

// GET /api/clients - List all clients with optional filters
clients.get('/', async (c) => {
  try {
    const active = c.req.query('active')
    const clientType = c.req.query('type')
    const search = c.req.query('search')
    
    let query = 'SELECT * FROM clients WHERE 1=1'
    const params: any[] = []
    
    if (active === 'true') {
      query += ' AND is_active = 1'
    }
    
    if (clientType) {
      query += ' AND client_type = ?'
      params.push(clientType)
    }
    
    if (search) {
      query += ' AND (client_name LIKE ? OR client_code LIKE ? OR primary_contact_name LIKE ?)'
      const searchParam = `%${search}%`
      params.push(searchParam, searchParam, searchParam)
    }
    
    query += ' ORDER BY client_name ASC'
    
    const stmt = params.length > 0 
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query)
    
    const { results } = await stmt.all<Client>()
    
    return c.json({ success: true, data: results })
  } catch (error: any) {
    console.error('Get clients error:', error)
    return c.json({ success: false, error: error.message || 'Failed to fetch clients' }, 500)
  }
})

// GET /api/clients/:id - Get single client
clients.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const client = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(id).first<Client>()
    
    if (!client) {
      return c.json({ success: false, error: 'Client not found' }, 404)
    }
    
    return c.json({ success: true, data: client })
  } catch (error: any) {
    console.error('Get client error:', error)
    return c.json({ success: false, error: error.message || 'Failed to fetch client' }, 500)
  }
})

// GET /api/clients/:id/projects - Get all projects for a client
clients.get('/:id/projects', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Verify client exists
    const client = await c.env.DB.prepare(
      'SELECT id FROM clients WHERE id = ?'
    ).bind(id).first()
    
    if (!client) {
      return c.json({ success: false, error: 'Client not found' }, 404)
    }
    
    // Get all projects for this client
    const { results: projects } = await c.env.DB.prepare(
      `SELECT id, project_code, project_name, status, start_date, end_date, 
              total_cost, total_revenue, margin_percentage, approval_status
       FROM projects 
       WHERE client_id = ?
       ORDER BY created_at DESC`
    ).bind(id).all()
    
    // Calculate summary stats
    const totalRevenue = projects.reduce((sum: number, p: any) => sum + (p.total_revenue || 0), 0)
    const totalCost = projects.reduce((sum: number, p: any) => sum + (p.total_cost || 0), 0)
    const avgMargin = projects.length > 0 
      ? projects.reduce((sum: number, p: any) => sum + (p.margin_percentage || 0), 0) / projects.length
      : 0
    
    return c.json({ 
      success: true, 
      data: {
        projects,
        summary: {
          total_projects: projects.length,
          total_revenue: totalRevenue,
          total_cost: totalCost,
          average_margin: avgMargin
        }
      }
    })
  } catch (error: any) {
    console.error('Get client projects error:', error)
    return c.json({ success: false, error: error.message || 'Failed to fetch client projects' }, 500)
  }
})

// POST /api/clients - Create new client (Manager+)
clients.post('/', requireRole('admin', 'manager'), async (c) => {
  try {
    const body = await c.req.json()
    const user = c.get('user')
    
    // Required fields validation
    if (!body.client_code || !body.client_name) {
      return c.json({ success: false, error: 'client_code and client_name are required' }, 400)
    }
    
    // Check if client_code already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM clients WHERE client_code = ?'
    ).bind(body.client_code).first()
    
    if (existing) {
      return c.json({ success: false, error: 'Client code already exists' }, 409)
    }
    
    const result = await c.env.DB.prepare(
      `INSERT INTO clients (
        client_code, client_name, client_type, industry,
        primary_contact_name, primary_contact_email, primary_contact_phone,
        address_line1, address_line2, city, state, postal_code, country,
        tax_id, payment_terms, credit_limit, website, notes, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.client_code,
      body.client_name,
      body.client_type || null,
      body.industry || null,
      body.primary_contact_name || null,
      body.primary_contact_email || null,
      body.primary_contact_phone || null,
      body.address_line1 || null,
      body.address_line2 || null,
      body.city || null,
      body.state || null,
      body.postal_code || null,
      body.country || 'USA',
      body.tax_id || null,
      body.payment_terms || null,
      body.credit_limit || null,
      body.website || null,
      body.notes || null,
      body.is_active !== undefined ? body.is_active : 1,
      user.id
    ).run()
    
    const newClient = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(result.meta.last_row_id).first<Client>()
    
    return c.json({ success: true, data: newClient }, 201)
  } catch (error: any) {
    console.error('Create client error:', error)
    return c.json({ success: false, error: error.message || 'Failed to create client' }, 500)
  }
})

// PUT /api/clients/:id - Update client (Manager+)
clients.put('/:id', requireRole('admin', 'manager'), async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    // Check if client exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM clients WHERE id = ?'
    ).bind(id).first()
    
    if (!existing) {
      return c.json({ success: false, error: 'Client not found' }, 404)
    }
    
    await c.env.DB.prepare(
      `UPDATE clients SET
        client_code = ?,
        client_name = ?,
        client_type = ?,
        industry = ?,
        primary_contact_name = ?,
        primary_contact_email = ?,
        primary_contact_phone = ?,
        address_line1 = ?,
        address_line2 = ?,
        city = ?,
        state = ?,
        postal_code = ?,
        country = ?,
        tax_id = ?,
        payment_terms = ?,
        credit_limit = ?,
        website = ?,
        notes = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    ).bind(
      body.client_code,
      body.client_name,
      body.client_type || null,
      body.industry || null,
      body.primary_contact_name || null,
      body.primary_contact_email || null,
      body.primary_contact_phone || null,
      body.address_line1 || null,
      body.address_line2 || null,
      body.city || null,
      body.state || null,
      body.postal_code || null,
      body.country || 'USA',
      body.tax_id || null,
      body.payment_terms || null,
      body.credit_limit || null,
      body.website || null,
      body.notes || null,
      body.is_active !== undefined ? body.is_active : 1,
      id
    ).run()
    
    const updated = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(id).first<Client>()
    
    return c.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Update client error:', error)
    return c.json({ success: false, error: error.message || 'Failed to update client' }, 500)
  }
})

// DELETE /api/clients/:id - Delete client (Admin only)
clients.delete('/:id', requireRole('admin'), async (c) => {
  try {
    const id = c.req.param('id')
    
    // Check if client has projects
    const { results: projects } = await c.env.DB.prepare(
      'SELECT id FROM projects WHERE client_id = ?'
    ).bind(id).all()
    
    if (projects.length > 0) {
      return c.json({ 
        success: false, 
        error: `Cannot delete client. ${projects.length} project(s) are associated with this client.` 
      }, 400)
    }
    
    await c.env.DB.prepare(
      'DELETE FROM clients WHERE id = ?'
    ).bind(id).run()
    
    return c.json({ success: true, message: 'Client deleted successfully' })
  } catch (error: any) {
    console.error('Delete client error:', error)
    return c.json({ success: false, error: error.message || 'Failed to delete client' }, 500)
  }
})

export default clients
