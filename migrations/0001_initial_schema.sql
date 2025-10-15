-- Below the Line Costing Application - Initial Database Schema
-- Version: 1.0
-- Created: 2025-10-15

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'user', 'viewer')),
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_code TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'on-hold', 'cancelled')),
  
  -- Financial settings
  tax_rate REAL DEFAULT 0.0,
  ga_percentage REAL DEFAULT 0.0,
  ga_application TEXT DEFAULT 'all' CHECK(ga_application IN ('all', 'labour', 'material', 'none')),
  
  -- Margin and totals (calculated)
  total_labour_cost REAL DEFAULT 0.0,
  total_material_cost REAL DEFAULT 0.0,
  total_cost REAL DEFAULT 0.0,
  total_revenue REAL DEFAULT 0.0,
  margin_percentage REAL DEFAULT 0.0,
  
  -- Metadata
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Personnel Register (Staff database with hourly costs)
CREATE TABLE IF NOT EXISTS personnel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT UNIQUE NOT NULL,
  employee_name TEXT NOT NULL,
  employee_role TEXT NOT NULL,
  employee_level TEXT,
  hourly_cost REAL NOT NULL,
  banded_rate REAL,
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Hourly Rate Bands (Role-based rates when personnel not assigned)
CREATE TABLE IF NOT EXISTS rate_bands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  band_name TEXT UNIQUE NOT NULL,
  band_level TEXT,
  role_description TEXT,
  hourly_rate REAL NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  milestone_code TEXT NOT NULL,
  milestone_name TEXT NOT NULL,
  milestone_date DATE,
  description TEXT,
  sequence_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, milestone_code)
);

-- Cost Line Items (Labour costs from Cost Build Up sheet)
CREATE TABLE IF NOT EXISTS cost_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  milestone_id INTEGER,
  
  -- WBS and description
  wbs_code TEXT,
  task_description TEXT NOT NULL,
  
  -- Resource assignment
  rate_type TEXT NOT NULL CHECK(rate_type IN ('actual', 'banded')),
  personnel_id INTEGER,
  rate_band_id INTEGER,
  
  -- Hours and rates
  hours REAL NOT NULL DEFAULT 0.0,
  hourly_rate REAL NOT NULL,
  
  -- G&A application
  apply_ga INTEGER DEFAULT 1,
  
  -- Calculated costs
  base_cost REAL NOT NULL DEFAULT 0.0,
  ga_cost REAL DEFAULT 0.0,
  total_cost REAL NOT NULL DEFAULT 0.0,
  
  -- Metadata
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE SET NULL,
  FOREIGN KEY (personnel_id) REFERENCES personnel(id),
  FOREIGN KEY (rate_band_id) REFERENCES rate_bands(id)
);

-- Material Costs (Non-labour costs)
CREATE TABLE IF NOT EXISTS material_costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  milestone_id INTEGER,
  
  -- Description
  material_description TEXT NOT NULL,
  material_category TEXT,
  
  -- Cost classification
  cost_type TEXT NOT NULL CHECK(cost_type IN ('milestone', 'monthly', 'one-time')),
  
  -- Quantity and unit cost
  quantity REAL DEFAULT 1.0,
  unit_cost REAL NOT NULL,
  
  -- For monthly recurring costs
  start_month INTEGER,
  end_month INTEGER,
  months_count INTEGER,
  
  -- G&A application
  apply_ga INTEGER DEFAULT 1,
  
  -- Calculated costs
  base_cost REAL NOT NULL DEFAULT 0.0,
  ga_cost REAL DEFAULT 0.0,
  total_cost REAL NOT NULL DEFAULT 0.0,
  
  -- Metadata
  supplier TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE SET NULL
);

-- Payment Schedule (Billing milestones and invoices)
CREATE TABLE IF NOT EXISTS payment_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  milestone_id INTEGER,
  
  payment_description TEXT NOT NULL,
  payment_date DATE,
  invoice_amount REAL NOT NULL,
  invoice_number TEXT,
  
  payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'invoiced', 'paid', 'overdue')),
  paid_date DATE,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE SET NULL
);

-- Cash Flow (Month-by-month tracking)
CREATE TABLE IF NOT EXISTS cash_flow (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  
  month_year TEXT NOT NULL,
  month_number INTEGER NOT NULL,
  
  labour_outflow REAL DEFAULT 0.0,
  material_outflow REAL DEFAULT 0.0,
  total_outflow REAL DEFAULT 0.0,
  
  revenue_inflow REAL DEFAULT 0.0,
  net_cash_flow REAL DEFAULT 0.0,
  cumulative_cash_flow REAL DEFAULT 0.0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, month_year)
);

-- Xero Integration Data (for invoice syncing)
CREATE TABLE IF NOT EXISTS xero_imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  
  xero_invoice_id TEXT UNIQUE,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  total_amount REAL,
  status TEXT,
  
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME,
  
  raw_data TEXT,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Microsoft Project Integration Data
CREATE TABLE IF NOT EXISTS msp_imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  
  msp_task_id TEXT,
  task_name TEXT,
  resource_name TEXT,
  work_hours REAL,
  start_date DATE,
  finish_date DATE,
  
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME,
  
  raw_data TEXT,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Activity Logs (Audit trail)
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  description TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_name);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_personnel_active ON personnel(is_active);
CREATE INDEX IF NOT EXISTS idx_personnel_role ON personnel(employee_role);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON milestones(milestone_date);

CREATE INDEX IF NOT EXISTS idx_cost_items_project ON cost_line_items(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_milestone ON cost_line_items(milestone_id);

CREATE INDEX IF NOT EXISTS idx_material_costs_project ON material_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_material_costs_milestone ON material_costs(milestone_id);

CREATE INDEX IF NOT EXISTS idx_payment_schedule_project ON payment_schedule(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedule_status ON payment_schedule(payment_status);

CREATE INDEX IF NOT EXISTS idx_cash_flow_project ON cash_flow(project_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_month ON cash_flow(month_year);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
