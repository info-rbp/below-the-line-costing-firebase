// Third-party integrations: Xero and Microsoft Project

import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import type { Env, ApiResponse } from '../types';

const integrations = new Hono<{ Bindings: Env }>();

integrations.use('*', authMiddleware);

// ===== XERO INTEGRATION =====

/**
 * GET /api/integrations/xero/status
 * Check Xero connection status
 */
integrations.get('/xero/status', async (c) => {
  try {
    // Check if Xero credentials are configured
    const hasClientId = !!c.env.XERO_CLIENT_ID;
    const hasClientSecret = !!c.env.XERO_CLIENT_SECRET;
    const hasAccessToken = !!c.env.XERO_ACCESS_TOKEN;
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: { 
        configured: hasClientId && hasClientSecret,
        connected: hasAccessToken,
        message: hasAccessToken 
          ? 'Xero is connected' 
          : (hasClientId && hasClientSecret) 
            ? 'Xero credentials configured. Please authorize to connect.' 
            : 'Xero credentials not configured. Please add XERO_CLIENT_ID and XERO_CLIENT_SECRET to Cloudflare secrets.'
      } 
    });
  } catch (error) {
    return c.json<ApiResponse>({ success: false, error: 'Failed to check Xero status' }, 500);
  }
});

/**
 * GET /api/integrations/xero/auth-url
 * Get Xero OAuth authorization URL
 */
integrations.get('/xero/auth-url', requireRole('admin'), async (c) => {
  try {
    const clientId = c.env.XERO_CLIENT_ID;
    const redirectUri = c.env.XERO_REDIRECT_URI || `${new URL(c.req.url).origin}/api/integrations/xero/callback`;
    
    if (!clientId) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Xero client ID not configured' 
      }, 400);
    }
    
    const authUrl = `https://login.xero.com/identity/connect/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=accounting.transactions.read accounting.contacts.read offline_access&` +
      `state=${crypto.randomUUID()}`;
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: { authUrl } 
    });
  } catch (error) {
    return c.json<ApiResponse>({ success: false, error: 'Failed to generate auth URL' }, 500);
  }
});

/**
 * GET /api/integrations/xero/callback
 * Xero OAuth callback handler
 */
integrations.get('/xero/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const state = c.req.query('state');
    
    if (!code) {
      return c.json<ApiResponse>({ success: false, error: 'Authorization code not received' }, 400);
    }
    
    // Exchange code for access token
    const clientId = c.env.XERO_CLIENT_ID;
    const clientSecret = c.env.XERO_CLIENT_SECRET;
    const redirectUri = c.env.XERO_REDIRECT_URI || `${new URL(c.req.url).origin}/api/integrations/xero/callback`;
    
    const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });
    
    if (!tokenResponse.ok) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Failed to exchange authorization code' 
      }, 500);
    }
    
    const tokens = await tokenResponse.json();
    
    // Store tokens (in production, use Cloudflare KV or D1)
    // For now, return them to be stored as secrets
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'Xero connected successfully. Please store the access token as XERO_ACCESS_TOKEN secret.',
      data: { 
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in
      } 
    });
  } catch (error) {
    console.error('Xero callback error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Xero authorization failed' }, 500);
  }
});

/**
 * POST /api/integrations/xero/sync-invoices
 * Sync invoices from Xero for a project
 */
integrations.post('/xero/sync-invoices', requireRole('admin', 'manager'), async (c) => {
  try {
    const { project_id } = await c.req.json();
    
    if (!project_id) {
      return c.json<ApiResponse>({ success: false, error: 'project_id required' }, 400);
    }
    
    const accessToken = c.env.XERO_ACCESS_TOKEN;
    
    if (!accessToken) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Xero not connected. Please authorize first.' 
      }, 400);
    }
    
    // Get Xero tenant ID (first tenant)
    const connectionsResponse = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!connectionsResponse.ok) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Failed to get Xero connections' 
      }, 500);
    }
    
    const connections = await connectionsResponse.json();
    if (!connections || connections.length === 0) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'No Xero organizations connected' 
      }, 400);
    }
    
    const tenantId = connections[0].tenantId;
    
    // Fetch invoices from Xero
    const invoicesResponse = await fetch('https://api.xero.com/api.xro/2.0/Invoices', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'xero-tenant-id': tenantId,
        'Accept': 'application/json'
      }
    });
    
    if (!invoicesResponse.ok) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Failed to fetch invoices from Xero' 
      }, 500);
    }
    
    const invoicesData = await invoicesResponse.json();
    const invoices = invoicesData.Invoices || [];
    
    // Store invoices in database
    let imported = 0;
    for (const invoice of invoices) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO xero_imports (
          project_id, xero_invoice_id, invoice_number, invoice_date, 
          due_date, total_amount, status, raw_data, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        project_id,
        invoice.InvoiceID,
        invoice.InvoiceNumber,
        invoice.Date,
        invoice.DueDate,
        invoice.Total,
        invoice.Status,
        JSON.stringify(invoice)
      ).run();
      imported++;
    }
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: `Successfully imported ${imported} invoices from Xero`,
      data: { imported }
    });
  } catch (error) {
    console.error('Xero sync error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to sync invoices from Xero' }, 500);
  }
});

// ===== MICROSOFT PROJECT INTEGRATION =====

/**
 * GET /api/integrations/msp/status
 * Check Microsoft Project connection status
 */
integrations.get('/msp/status', async (c) => {
  try {
    const hasClientId = !!c.env.MSP_CLIENT_ID;
    const hasClientSecret = !!c.env.MSP_CLIENT_SECRET;
    const hasAccessToken = !!c.env.MSP_ACCESS_TOKEN;
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: { 
        configured: hasClientId && hasClientSecret,
        connected: hasAccessToken,
        message: hasAccessToken 
          ? 'Microsoft Project is connected' 
          : (hasClientId && hasClientSecret) 
            ? 'Microsoft Project credentials configured. Please authorize to connect.' 
            : 'Microsoft Project credentials not configured.'
      } 
    });
  } catch (error) {
    return c.json<ApiResponse>({ success: false, error: 'Failed to check MSP status' }, 500);
  }
});

/**
 * POST /api/integrations/msp/upload
 * Upload and parse Microsoft Project file (XML format)
 */
integrations.post('/msp/upload', requireRole('admin', 'manager'), async (c) => {
  try {
    const { project_id, file_content } = await c.req.json();
    
    if (!project_id || !file_content) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'project_id and file_content required' 
      }, 400);
    }
    
    // Parse MS Project XML file
    // This is a simplified parser - full implementation would use XML parsing
    // For now, accept JSON data that was pre-parsed on client side
    
    const tasks = JSON.parse(file_content);
    let imported = 0;
    
    for (const task of tasks) {
      await c.env.DB.prepare(`
        INSERT INTO msp_imports (
          project_id, msp_task_id, task_name, resource_name,
          work_hours, start_date, finish_date, raw_data, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        project_id,
        task.TaskID || task.id,
        task.Name || task.name,
        task.ResourceName || task.resource,
        task.Work || task.hours || 0,
        task.Start || task.start_date,
        task.Finish || task.finish_date,
        JSON.stringify(task)
      ).run();
      imported++;
    }
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: `Successfully imported ${imported} tasks from Microsoft Project`,
      data: { imported }
    });
  } catch (error) {
    console.error('MSP upload error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to import Microsoft Project data' }, 500);
  }
});

/**
 * POST /api/integrations/msp/export
 * Export project data to Microsoft Project format
 */
integrations.post('/msp/export', requireRole('admin', 'manager', 'user'), async (c) => {
  try {
    const { project_id } = await c.req.json();
    
    if (!project_id) {
      return c.json<ApiResponse>({ success: false, error: 'project_id required' }, 400);
    }
    
    // Fetch project data
    const project = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(project_id).first();
    
    if (!project) {
      return c.json<ApiResponse>({ success: false, error: 'Project not found' }, 404);
    }
    
    // Fetch milestones
    const { results: milestones } = await c.env.DB.prepare(
      'SELECT * FROM milestones WHERE project_id = ? ORDER BY sequence_order'
    ).bind(project_id).all();
    
    // Fetch cost items
    const { results: costItems } = await c.env.DB.prepare(`
      SELECT cli.*, p.employee_name as resource_name
      FROM cost_line_items cli
      LEFT JOIN personnel p ON cli.personnel_id = p.id
      WHERE cli.project_id = ?
      ORDER BY cli.id
    `).bind(project_id).all();
    
    // Format for MS Project (simplified JSON format)
    const exportData = {
      ProjectName: project.project_name,
      StartDate: project.start_date,
      FinishDate: project.end_date,
      Tasks: [
        ...milestones.map((m: any, idx: number) => ({
          TaskID: `M${idx + 1}`,
          Name: m.milestone_name,
          Start: m.milestone_date,
          Finish: m.milestone_date,
          IsMilestone: true
        })),
        ...costItems.map((item: any, idx: number) => ({
          TaskID: `T${idx + 1}`,
          Name: item.task_description,
          ResourceName: item.resource_name || 'Unassigned',
          Work: item.hours,
          Cost: item.total_cost
        }))
      ]
    };
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: exportData 
    });
  } catch (error) {
    console.error('MSP export error:', error);
    return c.json<ApiResponse>({ success: false, error: 'Failed to export to Microsoft Project format' }, 500);
  }
});

export default integrations;
