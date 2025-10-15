-- Migration 0002: Major Enhancements
-- Date: 2025-10-15
-- Description: Add hierarchical milestones, materials master, CRM, and approval workflow

-- ============================================================================
-- 1. CLIENTS (CRM) TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_code TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_type TEXT, -- Corporate, Government, Individual, etc.
  industry TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',
  tax_id TEXT,
  payment_terms TEXT, -- Net 30, Net 60, etc.
  credit_limit REAL,
  website TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(client_code);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(client_name);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(client_type);

-- ============================================================================
-- 2. MATERIALS MASTER TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS materials_master (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_code TEXT UNIQUE NOT NULL,
  material_name TEXT NOT NULL,
  material_category TEXT, -- Equipment, Software, Supplies, Services, etc.
  description TEXT,
  default_unit_cost REAL NOT NULL,
  unit_of_measure TEXT NOT NULL, -- each, hour, day, month, kg, etc.
  supplier_name TEXT,
  supplier_contact TEXT,
  supplier_email TEXT,
  default_cost_type TEXT DEFAULT 'one-time', -- one-time, monthly, milestone
  default_frequency INTEGER, -- For monthly: default months
  lead_time_days INTEGER, -- Procurement lead time
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_materials_master_code ON materials_master(material_code);
CREATE INDEX IF NOT EXISTS idx_materials_master_category ON materials_master(material_category);
CREATE INDEX IF NOT EXISTS idx_materials_master_active ON materials_master(is_active);
CREATE INDEX IF NOT EXISTS idx_materials_master_name ON materials_master(material_name);

-- ============================================================================
-- 3. PROJECT APPROVALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  approver_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, -- submitted, approved, rejected, revision_requested
  comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_project_approvals_project ON project_approvals(project_id);
CREATE INDEX IF NOT EXISTS idx_project_approvals_approver ON project_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_project_approvals_action ON project_approvals(action);

-- ============================================================================
-- 4. UPDATE PROJECTS TABLE
-- ============================================================================

-- Add new columns to projects table
ALTER TABLE projects ADD COLUMN client_id INTEGER REFERENCES clients(id);
ALTER TABLE projects ADD COLUMN approval_status TEXT DEFAULT 'draft'; 
-- Values: draft, pending_approval, approved, rejected
ALTER TABLE projects ADD COLUMN submitted_at DATETIME;
ALTER TABLE projects ADD COLUMN submitted_by INTEGER REFERENCES users(id);
ALTER TABLE projects ADD COLUMN approved_at DATETIME;
ALTER TABLE projects ADD COLUMN approved_by INTEGER REFERENCES users(id);
ALTER TABLE projects ADD COLUMN rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_approval_status ON projects(approval_status);
CREATE INDEX IF NOT EXISTS idx_projects_submitted_by ON projects(submitted_by);
CREATE INDEX IF NOT EXISTS idx_projects_approved_by ON projects(approved_by);

-- ============================================================================
-- 5. UPDATE MILESTONES TABLE
-- ============================================================================

-- Add columns for hierarchical structure
ALTER TABLE milestones ADD COLUMN parent_milestone_id INTEGER REFERENCES milestones(id);
ALTER TABLE milestones ADD COLUMN milestone_level INTEGER DEFAULT 0; -- 0=parent, 1=sub, 2=sub-sub
ALTER TABLE milestones ADD COLUMN milestone_path TEXT; -- e.g., "M01.M01-01.M01-01-01"
ALTER TABLE milestones ADD COLUMN is_parent BOOLEAN DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_milestones_parent ON milestones(parent_milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestones_level ON milestones(milestone_level);
CREATE INDEX IF NOT EXISTS idx_milestones_path ON milestones(milestone_path);

-- ============================================================================
-- 6. UPDATE MATERIAL COSTS TABLE
-- ============================================================================

-- Link to materials master
ALTER TABLE material_costs ADD COLUMN material_master_id INTEGER REFERENCES materials_master(id);

CREATE INDEX IF NOT EXISTS idx_material_costs_master ON material_costs(material_master_id);

-- ============================================================================
-- 7. SEED DATA - CLIENTS
-- ============================================================================

INSERT OR IGNORE INTO clients (client_code, client_name, client_type, industry, primary_contact_name, primary_contact_email, primary_contact_phone, payment_terms, credit_limit, notes, is_active) VALUES
  ('CL001', 'ABC Corporation', 'Corporate', 'Construction', 'John Doe', 'john@abc.com', '(555) 123-4567', 'Net 30', 500000.00, 'Key client - preferred partner for government contracts. Excellent payment history.', 1),
  ('CL002', 'XYZ Industries', 'Government', 'Infrastructure', 'Jane Smith', 'jane@xyz.gov', '(555) 987-6543', 'Net 60', 1000000.00, 'Government agency - requires additional documentation and compliance.', 1),
  ('CL003', 'Global Tech Solutions', 'Corporate', 'Technology', 'Mike Johnson', 'mike@globaltech.com', '(555) 456-7890', 'Net 30', 300000.00, 'Fast-growing tech company. Focus on innovative solutions.', 1),
  ('CL004', 'City of Springfield', 'Government', 'Municipal', 'Sarah Wilson', 'sarah@springfield.gov', '(555) 321-0987', 'Net 90', 2000000.00, 'Municipal government - long approval cycles but large projects.', 1),
  ('CL005', 'BuildRight Construction', 'Corporate', 'Construction', 'Tom Brown', 'tom@buildright.com', '(555) 654-3210', 'Net 30', 750000.00, 'Established construction firm. Reliable partner.', 1),
  ('CL006', 'Metro Transit Authority', 'Government', 'Transportation', 'Lisa Garcia', 'lisa@metrotransit.gov', '(555) 789-0123', 'Net 60', 1500000.00, 'Transportation infrastructure projects.', 1),
  ('CL007', 'Innovate Systems Inc', 'Corporate', 'Technology', 'David Lee', 'david@innovatesystems.com', '(555) 234-5678', 'Net 30', 400000.00, 'Software and system integration specialist.', 1),
  ('CL008', 'GreenEnergy Solutions', 'Corporate', 'Energy', 'Maria Rodriguez', 'maria@greenenergy.com', '(555) 876-5432', 'Net 45', 600000.00, 'Renewable energy projects and consulting.', 1);

-- ============================================================================
-- 8. SEED DATA - MATERIALS MASTER
-- ============================================================================

INSERT OR IGNORE INTO materials_master (material_code, material_name, material_category, description, default_unit_cost, unit_of_measure, supplier_name, default_cost_type, is_active) VALUES
  -- Equipment
  ('MAT-001', 'Laptop Computer - Standard', 'Equipment', 'Dell Latitude business laptop with Windows 11 Pro', 2500.00, 'each', 'Dell Technologies', 'one-time', 1),
  ('MAT-002', 'Laptop Computer - High-End', 'Equipment', 'Dell Precision workstation laptop for CAD/design work', 3500.00, 'each', 'Dell Technologies', 'one-time', 1),
  ('MAT-003', 'Desktop Workstation', 'Equipment', 'HP Z-series workstation for heavy computational tasks', 4000.00, 'each', 'HP Inc', 'one-time', 1),
  ('MAT-004', 'Tablet Device', 'Equipment', 'iPad Pro 12.9" for field work and presentations', 1200.00, 'each', 'Apple Inc', 'one-time', 1),
  ('MAT-005', 'Survey Equipment', 'Equipment', 'Trimble total station for site surveying', 15000.00, 'each', 'Trimble Inc', 'one-time', 1),
  ('MAT-006', 'Survey Equipment Rental', 'Equipment', 'Daily rental of survey equipment', 800.00, 'day', 'Equipment Rentals Co', 'milestone', 1),
  ('MAT-007', 'Safety Equipment Set', 'Equipment', 'Complete safety gear (helmet, vest, boots, gloves)', 150.00, 'set', 'SafetyFirst Supplies', 'one-time', 1),
  
  -- Software
  ('MAT-008', 'Microsoft Project License', 'Software', 'MS Project Professional subscription', 600.00, 'license', 'Microsoft Corp', 'one-time', 1),
  ('MAT-009', 'Microsoft Office 365', 'Software', 'Office 365 Business Premium subscription', 22.00, 'month', 'Microsoft Corp', 'monthly', 1),
  ('MAT-010', 'AutoCAD License', 'Software', 'AutoCAD professional license', 1800.00, 'license', 'Autodesk Inc', 'one-time', 1),
  ('MAT-011', 'AutoCAD Subscription', 'Software', 'AutoCAD monthly subscription', 300.00, 'month', 'Autodesk Inc', 'monthly', 1),
  ('MAT-012', 'Adobe Creative Cloud', 'Software', 'Adobe CC All Apps subscription', 80.00, 'month', 'Adobe Inc', 'monthly', 1),
  ('MAT-013', 'Project Management Software', 'Software', 'Monday.com or similar PM tool subscription', 50.00, 'month', 'Monday.com', 'monthly', 1),
  
  -- Services
  ('MAT-014', 'Site Security Service', 'Services', '24/7 on-site security guard service', 2000.00, 'month', 'SecureGuard Services', 'monthly', 1),
  ('MAT-015', 'Cloud Hosting - Basic', 'Services', 'AWS or Azure basic hosting package', 500.00, 'month', 'Amazon Web Services', 'monthly', 1),
  ('MAT-016', 'Cloud Hosting - Premium', 'Services', 'AWS or Azure premium hosting with redundancy', 1500.00, 'month', 'Amazon Web Services', 'monthly', 1),
  ('MAT-017', 'Internet Connectivity', 'Services', 'High-speed fiber internet for project office', 300.00, 'month', 'Telecom Provider', 'monthly', 1),
  ('MAT-018', 'Legal Consulting', 'Services', 'Legal review and contract consultation', 350.00, 'hour', 'Legal Partners LLP', 'milestone', 1),
  ('MAT-019', 'Environmental Assessment', 'Services', 'Environmental impact assessment and reporting', 5000.00, 'assessment', 'EnviroConsult Inc', 'milestone', 1),
  
  -- Supplies
  ('MAT-020', 'Office Supplies - Monthly', 'Supplies', 'General office supplies (paper, pens, folders, etc.)', 200.00, 'month', 'Office Depot', 'monthly', 1),
  ('MAT-021', 'Printer - Multifunction', 'Supplies', 'Color laser multifunction printer', 800.00, 'each', 'HP Inc', 'one-time', 1),
  ('MAT-022', 'Mobile Phone - Standard', 'Supplies', 'Business smartphone with data plan', 800.00, 'each', 'Verizon Wireless', 'one-time', 1),
  ('MAT-023', 'Mobile Phone Plan', 'Supplies', 'Monthly mobile phone service', 80.00, 'month', 'Verizon Wireless', 'monthly', 1),
  ('MAT-024', 'Construction Materials - Bulk', 'Supplies', 'Bulk construction materials (concrete, steel, lumber)', 50000.00, 'lot', 'Construction Supply Co', 'milestone', 1),
  ('MAT-025', 'Testing Equipment', 'Supplies', 'Quality assurance and testing equipment', 3000.00, 'set', 'TestEquip Inc', 'one-time', 1),
  
  -- Training & Development
  ('MAT-026', 'Safety Training', 'Services', 'OSHA safety training for team members', 250.00, 'person', 'SafetyFirst Training', 'milestone', 1),
  ('MAT-027', 'Technical Training', 'Services', 'Software or technical skills training', 500.00, 'person', 'TechTraining Academy', 'milestone', 1),
  
  -- Travel & Accommodation
  ('MAT-028', 'Travel - Domestic Flight', 'Services', 'Average domestic flight cost', 450.00, 'trip', 'Various Airlines', 'milestone', 1),
  ('MAT-029', 'Hotel Accommodation', 'Services', 'Business hotel per night', 200.00, 'night', 'Various Hotels', 'milestone', 1),
  ('MAT-030', 'Vehicle Rental', 'Services', 'Car rental for project work', 80.00, 'day', 'Enterprise Rent-A-Car', 'milestone', 1);

-- ============================================================================
-- 9. UPDATE EXISTING PROJECT DATA
-- ============================================================================

-- Link existing projects to clients (if any exist)
UPDATE projects SET client_id = (SELECT id FROM clients WHERE client_name = projects.client_name LIMIT 1)
WHERE client_id IS NULL AND client_name IN (SELECT client_name FROM clients);

-- Set default approval status for existing projects
UPDATE projects SET approval_status = 'approved' WHERE approval_status IS NULL;

-- ============================================================================
-- 10. VERIFICATION QUERIES (for testing)
-- ============================================================================

-- SELECT COUNT(*) as client_count FROM clients;
-- SELECT COUNT(*) as materials_count FROM materials_master;
-- SELECT COUNT(*) as projects_with_clients FROM projects WHERE client_id IS NOT NULL;
-- SELECT approval_status, COUNT(*) FROM projects GROUP BY approval_status;
