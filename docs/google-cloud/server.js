import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import dotenv from 'dotenv'
import pg from 'pg'

// Load environment variables
dotenv.config()

const { Pool } = pg

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to PostgreSQL database:', err.stack)
  } else {
    console.log('✅ Successfully connected to PostgreSQL database')
    release()
  }
})

// Create Hono app with database pool
const app = new Hono()

// Middleware to inject database pool into context
app.use('*', async (c, next) => {
  c.set('db', pool)
  await next()
})

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// Import and mount routes
// Note: Routes will need to be updated to use PostgreSQL instead of D1
import auth from './routes/auth.js'
import projects from './routes/projects.js'
import personnel from './routes/personnel.js'
import costs from './routes/costs.js'
import integrations from './routes/integrations.js'
import milestones from './routes/milestones.js'
import rateBands from './routes/rate-bands.js'
import clients from './routes/clients.js'
import materialsMaster from './routes/materials-master.js'

app.route('/api/auth', auth)
app.route('/api/projects', projects)
app.route('/api/personnel', personnel)
app.route('/api/costs', costs)
app.route('/api/integrations', integrations)
app.route('/api/milestones', milestones)
app.route('/api/rate-bands', rateBands)
app.route('/api/clients', clients)
app.route('/api/materials-master', materialsMaster)

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

// Start server
const port = process.env.PORT || 3000
console.log(`🚀 Starting BTL Costing Application on port ${port}...`)

serve({
  fetch: app.fetch,
  port: parseInt(port),
})

console.log(`✅ Server running at http://localhost:${port}`)
