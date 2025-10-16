-- Phase 2 Enhancements - PostgreSQL Version
-- Hierarchical Milestones, Materials Master, Clients CRM, Approval Workflow

-- 1. Clients (CRM Database)
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  client_code VARCHAR(100) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_type VARCHAR(100),
  industry VARCHAR(100),
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),
  payment_terms VARCHAR(100),
  credit_limit DECIMAL(12,2),
  website VARCHAR(255),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Materials Master Catalog
CREATE TABLE IF NOT EXISTS materials_master (
  id SERIAL PRIMARY KEY,
  material_code VARCHAR(100) UNIQUE NOT NULL,
  material_name VARCHAR(255) NOT NULL,
  material_category VARCHAR(100),
  default_unit_cost DECIMAL(12,2) NOT NULL,
  unit_of_measure VARCHAR(50) NOT NULL,
  supplier_name VARCHAR(255),
  default_cost_type VARCHAR(50) DEFAULT 'one-time',
  minimum_order_qty INTEGER,
  lead_time_days INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Project Approvals (Audit Trail)
CREATE TABLE IF NOT EXISTS project_approvals (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  approver_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- submitted, approved, rejected
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enhance Projects table for client linkage and approval workflow
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS submitted_by INTEGER REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 5. Enhance Milestones for hierarchical structure
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS parent_milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS milestone_level INTEGER DEFAULT 0;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS milestone_path VARCHAR(255);
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS is_parent BOOLEAN DEFAULT false;

-- 6. Enhance Material Costs for master catalog linkage
ALTER TABLE material_costs ADD COLUMN IF NOT EXISTS material_master_id INTEGER REFERENCES materials_master(id);

-- Create indexes for new relationships
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_approval_status ON projects(approval_status);
CREATE INDEX IF NOT EXISTS idx_project_approvals_project_id ON project_approvals(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_parent_id ON milestones(parent_milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestones_path ON milestones(milestone_path);
CREATE INDEX IF NOT EXISTS idx_materials_master_category ON materials_master(material_category);
CREATE INDEX IF NOT EXISTS idx_materials_master_is_active ON materials_master(is_active);
CREATE INDEX IF NOT EXISTS idx_material_costs_master_id ON material_costs(material_master_id);

-- Seed sample clients
INSERT INTO clients (client_code, client_name, client_type, industry, primary_contact_name, primary_contact_email, primary_contact_phone, payment_terms, is_active) VALUES
('CL001', 'Acme Corporation', 'Enterprise', 'Manufacturing', 'John Smith', 'john.smith@acme.com', '+1-555-0101', 'Net 30', true),
('CL002', 'Global Enterprises', 'Enterprise', 'Retail', 'Sarah Johnson', 'sarah.j@globalent.com', '+1-555-0102', 'Net 45', true),
('CL003', 'TechStart Inc', 'SMB', 'Technology', 'Mike Chen', 'mchen@techstart.io', '+1-555-0103', 'Net 15', true),
('CL004', 'MediaPro Studios', 'Agency', 'Media & Entertainment', 'Lisa Anderson', 'lisa@mediapro.tv', '+1-555-0104', 'Net 30', true),
('CL005', 'Finance First', 'Enterprise', 'Financial Services', 'Robert Taylor', 'rtaylor@financefirst.com', '+1-555-0105', 'Net 60', true),
('CL006', 'HealthCare Plus', 'Enterprise', 'Healthcare', 'Emily White', 'ewhite@healthcareplus.org', '+1-555-0106', 'Net 30', true),
('CL007', 'EduTech Solutions', 'SMB', 'Education', 'David Brown', 'dbrown@edutech.edu', '+1-555-0107', 'Net 15', true),
('CL008', 'Retail Dynamics', 'Enterprise', 'Retail', 'Jennifer Garcia', 'jgarcia@retaildyn.com', '+1-555-0108', 'Net 45', true)
ON CONFLICT (client_code) DO NOTHING;

-- Seed materials master catalog
INSERT INTO materials_master (material_code, material_name, material_category, default_unit_cost, unit_of_measure, supplier_name, default_cost_type, is_active) VALUES
-- Equipment
('EQ001', 'Camera - RED Digital Cinema', 'Camera Equipment', 1500.00, 'day', 'Pro Camera Rentals', 'daily', true),
('EQ002', 'ARRI Alexa Mini', 'Camera Equipment', 1200.00, 'day', 'Pro Camera Rentals', 'daily', true),
('EQ003', 'Lighting Kit - 5K Package', 'Lighting', 800.00, 'day', 'Lights & Grip Co', 'daily', true),
('EQ004', 'Sound Recording Package', 'Audio', 400.00, 'day', 'Sound Solutions', 'daily', true),
('EQ005', 'Drone - DJI Inspire 3', 'Aerial', 600.00, 'day', 'SkyView Rentals', 'daily', true),

-- Production Materials
('MT001', 'Gaffer Tape Roll', 'Consumables', 12.00, 'roll', 'Production Supplies Inc', 'one-time', true),
('MT002', 'Sandbag Set (10 bags)', 'Grip', 150.00, 'set', 'Lights & Grip Co', 'one-time', true),
('MT003', 'C-Stand with Arm', 'Grip', 45.00, 'day', 'Lights & Grip Co', 'daily', true),
('MT004', 'Apple Box Set', 'Grip', 30.00, 'day', 'Production Supplies Inc', 'daily', true),

-- Post Production
('PP001', 'Video Editing Suite', 'Post Production', 500.00, 'day', 'Post House Media', 'daily', true),
('PP002', 'Color Grading Session', 'Post Production', 800.00, 'day', 'Color Masters', 'daily', true),
('PP003', 'Sound Mixing Studio', 'Post Production', 600.00, 'day', 'Audio Post Pro', 'daily', true),
('PP004', 'Motion Graphics Package', 'Post Production', 1200.00, 'project', 'VFX Studio', 'one-time', true),

-- Talent & Crew
('TL001', 'Principal Actor - Day Rate', 'Talent', 2500.00, 'day', 'Talent Agency', 'daily', true),
('TL002', 'Background Talent', 'Talent', 200.00, 'day', 'Extras Casting', 'daily', true),
('TL003', 'Makeup Artist', 'Crew', 500.00, 'day', 'Beauty Services', 'daily', true),
('TL004', 'Wardrobe Stylist', 'Crew', 450.00, 'day', 'Style Squad', 'daily', true),

-- Location & Transportation
('LC001', 'Location Fee - Studio Day', 'Location', 1500.00, 'day', 'Studio Spaces', 'daily', true),
('LC002', 'Location Fee - Outdoor', 'Location', 800.00, 'day', 'Location Services', 'daily', true),
('TR001', 'Equipment Truck Rental', 'Transportation', 350.00, 'day', 'Production Vehicles', 'daily', true),
('TR002', 'Passenger Van', 'Transportation', 150.00, 'day', 'Production Vehicles', 'daily', true),

-- Catering & Services
('CT001', 'Craft Services - Full Day', 'Catering', 400.00, 'day', 'Film Catering Co', 'daily', true),
('CT002', 'Hot Lunch for 30', 'Catering', 600.00, 'meal', 'Film Catering Co', 'one-time', true),
('CT003', 'Coffee & Snacks Station', 'Catering', 200.00, 'day', 'Film Catering Co', 'daily', true),

-- Insurance & Permits
('IN001', 'Production Insurance', 'Insurance', 2500.00, 'project', 'Media Insurance Group', 'one-time', true),
('PM001', 'Filming Permit - City', 'Permits', 500.00, 'permit', 'Local Film Office', 'one-time', true),
('PM002', 'Drone Permit', 'Permits', 250.00, 'permit', 'Aviation Authority', 'one-time', true),

-- Office & Admin
('OF001', 'Office Space Rental', 'Office', 800.00, 'month', 'Office Solutions', 'monthly', true),
('OF002', 'Production Software License', 'Software', 150.00, 'month', 'Software Vendor', 'monthly', true),
('OF003', 'Office Supplies Package', 'Office', 200.00, 'project', 'Office Depot', 'one-time', true)
ON CONFLICT (material_code) DO NOTHING;
