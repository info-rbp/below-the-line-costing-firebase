import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Env } from './types'

// Import routes
import auth from './routes/auth'
import projects from './routes/projects'
import personnel from './routes/personnel'
import costs from './routes/costs'
import integrations from './routes/integrations'
import milestones from './routes/milestones'
import rateBands from './routes/rate-bands'

const app = new Hono<{ Bindings: Env }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// API routes
app.route('/api/auth', auth)
app.route('/api/projects', projects)
app.route('/api/personnel', personnel)
app.route('/api/costs', costs)
app.route('/api/integrations', integrations)
app.route('/api/milestones', milestones)
app.route('/api/rate-bands', rateBands)

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Main application HTML
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BTL Costing Application</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
          .sidebar { min-height: 100vh; }
          .card { background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        </style>
    </head>
    <body class="bg-gray-50">
        <div id="app">
            <!-- React-like SPA will be loaded here -->
            <div class="flex items-center justify-center min-h-screen">
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                    <p class="text-gray-600">Loading BTL Costing Application...</p>
                </div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/wizard.js"></script>
        <script src="/static/wizard-helpers.js"></script>
    </body>
    </html>
  `)
})

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Application error:', err)
  return c.json({ success: false, error: 'Internal server error' }, 500)
})

export default app
