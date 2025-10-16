-- BTL Costing Application - PostgreSQL Schema
-- Converted from SQLite to PostgreSQL
-- Version: 1.0

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'manager', 'user', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  project_code VARCHAR(100) UNIQUE NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK(status IN ('active', 'completed', 'on-hold', 'cancelled')),
  
  -- Financial settings
  tax_rate DECIMAL(5,2) DEFAULT 0.0,
  ga_percentage DECIMAL(5,2) DEFAULT 0.0,
  ga_application VARCHAR(50) DEFAULT 'all' CHECK(ga_application IN ('all', 'labour', 'material', 'none')),
  
  -- Margin and totals (calculated)
  total_labour_cost DECIMAL(12,2) DEFAULT 0.0,
  total_material_cost DECIMAL(12,2) DEFAULT 0.0,
  total_cost DECIMAL(12,2) DEFAULT 0.0,
  total_revenue DECIMAL(12,2) DEFAULT 0.0,
  margin_percentage DECIMAL(5,2) DEFAULT 0.0,
  
  -- Metadata
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personnel Register (Staff database with hourly costs)
CREATE TABLE IF NOT EXISTS personnel (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(100) UNIQUE NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  employee_role VARCHAR(100) NOT NULL,
  employee_level VARCHAR(100),
  hourly_cost DECIMAL(10,2) NOT NULL,
  banded_rate DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hourly Rate Bands
CREATE TABLE IF NOT EXISTS rate_bands (
  id SERIAL PRIMARY KEY,
  band_name VARCHAR(100) UNIQUE NOT NULL,
  band_level VARCHAR(100),
  role_description TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_code VARCHAR(100) NOT NULL,
  milestone_name VARCHAR(255) NOT NULL,
  milestone_date DATE,
  description TEXT,
  sequence_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, milestone_code)
);

-- Cost Line Items (Labour costs)
CREATE TABLE IF NOT EXISTS cost_line_items (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id INTEGER REFERENCES milestones(id) ON DELETE SET NULL,
  
  -- WBS and description
  wbs_code VARCHAR(100),
  task_description TEXT NOT NULL,
  
  -- Resource assignment
  rate_type VARCHAR(50) NOT NULL CHECK(rate_type IN ('actual', 'banded')),
  personnel_id INTEGER REFERENCES personnel(id),
  rate_band_id INTEGER REFERENCES rate_bands(id),
  
  -- Cost calculation
  hourly_rate DECIMAL(10,2) NOT NULL,
  hours DECIMAL(10,2) NOT NULL,
  days DECIMAL(10,2),
  total_cost DECIMAL(12,2) NOT NULL,
  apply_ga BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Material Costs (Non-labour expenses)
CREATE TABLE IF NOT EXISTS material_costs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id INTEGER REFERENCES milestones(id) ON DELETE SET NULL,
  
  material_description TEXT NOT NULL,
  material_category VARCHAR(100),
  material_code VARCHAR(100),
  cost_type VARCHAR(50) NOT NULL CHECK(cost_type IN ('one-time', 'daily', 'weekly', 'monthly')),
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  apply_ga BOOLEAN DEFAULT true,
  
  supplier VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Xero Integration Settings
CREATE TABLE IF NOT EXISTS xero_settings (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(255),
  client_secret VARCHAR(255),
  tenant_id VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT false,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_line_items_project_id ON cost_line_items(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_line_items_milestone_id ON cost_line_items(milestone_id);
CREATE INDEX IF NOT EXISTS idx_material_costs_project_id ON material_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_material_costs_milestone_id ON material_costs(milestone_id);
CREATE INDEX IF NOT EXISTS idx_personnel_employee_id ON personnel(employee_id);
CREATE INDEX IF NOT EXISTS idx_personnel_is_active ON personnel(is_active);
CREATE INDEX IF NOT EXISTS idx_rate_bands_is_active ON rate_bands(is_active);

-- Insert default admin user (password: admin123)
-- Password hash generated with Web Crypto API SHA-256
INSERT INTO users (email, password_hash, full_name, role, is_active) 
VALUES (
  'admin@btlcosting.com',
  'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
  'System Administrator',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;
