-- Seed Data for BTL Costing Application
-- Extracted from JL2G BTL Costing Sheet V.29

-- Insert default admin user (password: admin123 - SHA256 hashed with salt)
-- Note: In production, users will set their own passwords
INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role, is_active) VALUES 
  (1, 'admin@jl2group.com', 'c113ac70-08a7-42f1-ba5f-1ebd08306c39:7aeeef07c847ad8e42627418f9a301cf619b763a87adfc78c9b8a9f6e76b4f6e', 'Admin User', 'admin', 1),
  (2, 'manager@jl2group.com', '62c8da87-f6d4-469e-b693-19c32082a16c:6906bf62080bd93bcb5772e21be6c06a72b2cc94c663ddcd7ee24c03dcb1a5fc', 'Project Manager', 'manager', 1),
  (3, 'user@jl2group.com', '59cc1062-7e63-458c-833a-0f1132f707fa:3c474fd4c8434fc5d74a67c68b3e9a1d4a800db89d0f17cb1a9b3a600a7d1c7b', 'Standard User', 'user', 1);

-- Insert Personnel from Excel "Drop Downs & Settings" sheet
INSERT OR IGNORE INTO personnel (employee_id, employee_name, employee_role, employee_level, hourly_cost, banded_rate) VALUES
  ('EMP001', 'Sarah Mitchell', 'Project Manager', 'C6', 185.00, 185.00),
  ('EMP002', 'James Thompson', 'Consultant', 'C5', 165.00, 165.00),
  ('EMP003', 'Olivia Harris', 'Business Analyst', 'C4', 145.00, 145.00),
  ('EMP004', 'Ethan Ward', 'Technical Specialist', 'C4', 150.00, 150.00),
  ('EMP005', 'Chloe Bennett', 'Systems Administrator', 'C3', 140.00, 140.00),
  ('EMP006', 'Liam Fraser', 'Commercial Specialist', 'C5', 160.00, 160.00),
  ('EMP007', 'Grace Edwards', 'Cyber Security Specialist', 'C5', 170.00, 170.00),
  ('EMP008', 'Noah Campbell', 'Consultant', 'C3', 135.00, 135.00),
  ('EMP009', 'Emily Carter', 'Business Analyst', 'C2', 125.00, 125.00),
  ('EMP010', 'Jack Robinson', 'Technical Specialist', 'C4', 150.00, 150.00),
  ('EMP011', 'Mia Reynolds', 'Project Manager', 'C6', 190.00, 190.00),
  ('EMP012', 'Henry Wilson', 'Consultant', 'C4', 150.00, 150.00),
  ('EMP013', 'Ava Hughes', 'Business Analyst', 'C3', 135.00, 135.00),
  ('EMP014', 'Lucas Wright', 'Technical Specialist', 'C2', 120.00, 120.00),
  ('EMP015', 'Sophie Adams', 'Systems Administrator', 'C3', 130.00, 130.00),
  ('EMP016', 'Daniel Matthews', 'Commercial Specialist', 'C4', 150.00, 150.00),
  ('EMP017', 'Isabella Turner', 'Cyber Security Specialist', 'C6', 185.00, 185.00),
  ('EMP018', 'William Scott', 'Consultant', 'C5', 165.00, 165.00),
  ('EMP019', 'Ella Phillips', 'Business Analyst', 'C3', 135.00, 135.00),
  ('EMP020', 'Benjamin Clarke', 'Technical Specialist', 'C4', 150.00, 150.00),
  ('EMP021', 'Charlotte Evans', 'Systems Administrator', 'C2', 120.00, 120.00),
  ('EMP022', 'Mason Stewart', 'Commercial Specialist', 'C5', 160.00, 160.00),
  ('EMP023', 'Amelia Foster', 'Cyber Security Specialist', 'C4', 150.00, 150.00),
  ('EMP024', 'Leo Hughes', 'Consultant', 'C3', 135.00, 135.00),
  ('EMP025', 'Zoe Peterson', 'Business Analyst', 'C2', 125.00, 125.00),
  ('EMP026', 'Alexander Young', 'Technical Specialist', 'C5', 165.00, 165.00),
  ('EMP027', 'Lily Brooks', 'Systems Administrator', 'C3', 130.00, 130.00),
  ('EMP028', 'Oscar James', 'Commercial Specialist', 'C4', 150.00, 150.00),
  ('EMP029', 'Harper Morris', 'Cyber Security Specialist', 'C6', 185.00, 185.00),
  ('EMP030', 'Jacob Cooper', 'Project Manager', 'C6', 190.00, 190.00);

-- Insert Rate Bands for role-based costing
INSERT OR IGNORE INTO rate_bands (band_name, band_level, role_description, hourly_rate) VALUES
  ('C6 - Senior Manager', 'C6', 'Project Manager / Senior Specialist', 185.00),
  ('C5 - Manager', 'C5', 'Consultant / Specialist', 165.00),
  ('C4 - Senior Analyst', 'C4', 'Business Analyst / Technical Specialist', 150.00),
  ('C3 - Analyst', 'C3', 'Systems Administrator / Analyst', 135.00),
  ('C2 - Junior', 'C2', 'Junior Analyst / Administrator', 125.00);

-- Insert Sample Project
INSERT OR IGNORE INTO projects (id, project_code, project_name, client_name, start_date, end_date, status, tax_rate, ga_percentage, ga_application, created_by) VALUES
  (1, 'PROJ-2025-001', 'Digital Transformation Initiative', 'Government Department XYZ', '2025-01-15', '2025-12-31', 'active', 0.10, 0.15, 'all', 1);

-- Insert Sample Milestones
INSERT OR IGNORE INTO milestones (project_id, milestone_code, milestone_name, milestone_date, description, sequence_order) VALUES
  (1, 'M01', 'Project Kickoff', '2025-01-15', 'Initial project setup and team onboarding', 1),
  (1, 'M02', 'Requirements Analysis', '2025-03-01', 'Complete requirements gathering and documentation', 2),
  (1, 'M03', 'Design Phase', '2025-05-01', 'System design and architecture', 3),
  (1, 'M04', 'Development Phase 1', '2025-07-01', 'Core system development', 4),
  (1, 'M05', 'Testing & QA', '2025-09-01', 'Quality assurance and testing', 5),
  (1, 'M06', 'UAT & Go-Live', '2025-11-01', 'User acceptance testing and deployment', 6),
  (1, 'M07', 'Project Closure', '2025-12-31', 'Project handover and closure', 7);

-- Insert Sample Cost Line Items (Labour)
INSERT OR IGNORE INTO cost_line_items (project_id, milestone_id, wbs_code, task_description, rate_type, personnel_id, rate_band_id, hours, hourly_rate, apply_ga, base_cost, ga_cost, total_cost) VALUES
  (1, 1, '1.1', 'Project Management - Kickoff', 'actual', 1, NULL, 40, 185.00, 1, 7400.00, 1110.00, 8510.00),
  (1, 1, '1.2', 'Business Analysis - Requirements', 'actual', 3, NULL, 80, 145.00, 1, 11600.00, 1740.00, 13340.00),
  (1, 2, '2.1', 'Technical Analysis', 'banded', NULL, 4, 120, 150.00, 1, 18000.00, 2700.00, 20700.00),
  (1, 2, '2.2', 'Systems Design', 'actual', 4, NULL, 160, 150.00, 1, 24000.00, 3600.00, 27600.00),
  (1, 3, '3.1', 'Architecture Design', 'actual', 2, NULL, 100, 165.00, 1, 16500.00, 2475.00, 18975.00),
  (1, 4, '4.1', 'Software Development', 'banded', NULL, 3, 400, 135.00, 1, 54000.00, 8100.00, 62100.00),
  (1, 4, '4.2', 'Database Development', 'actual', 5, NULL, 200, 140.00, 1, 28000.00, 4200.00, 32200.00),
  (1, 5, '5.1', 'Testing & QA', 'banded', NULL, 3, 160, 135.00, 1, 21600.00, 3240.00, 24840.00),
  (1, 6, '6.1', 'UAT Support', 'actual', 3, NULL, 80, 145.00, 1, 11600.00, 1740.00, 13340.00),
  (1, 7, '7.1', 'Project Closure Activities', 'actual', 1, NULL, 40, 185.00, 1, 7400.00, 1110.00, 8510.00);

-- Insert Sample Material Costs
INSERT OR IGNORE INTO material_costs (project_id, milestone_id, material_description, material_category, cost_type, quantity, unit_cost, apply_ga, base_cost, ga_cost, total_cost, supplier) VALUES
  (1, 1, 'Project Management Software Licenses', 'Software', 'monthly', 12, 500.00, 1, 6000.00, 900.00, 6900.00, 'Microsoft'),
  (1, 2, 'Requirements Workshop Venue', 'Facilities', 'one-time', 1, 2500.00, 1, 2500.00, 375.00, 2875.00, 'Conference Center'),
  (1, 3, 'Design Tools & Software', 'Software', 'one-time', 1, 5000.00, 1, 5000.00, 750.00, 5750.00, 'Adobe'),
  (1, 4, 'Development Environment Setup', 'Infrastructure', 'one-time', 1, 8000.00, 1, 8000.00, 1200.00, 9200.00, 'AWS'),
  (1, 4, 'Cloud Hosting', 'Infrastructure', 'monthly', 9, 1200.00, 1, 10800.00, 1620.00, 12420.00, 'AWS'),
  (1, 5, 'Testing Tools', 'Software', 'one-time', 1, 3000.00, 1, 3000.00, 450.00, 3450.00, 'Selenium'),
  (1, 6, 'Training Materials', 'Documentation', 'one-time', 1, 1500.00, 1, 1500.00, 225.00, 1725.00, 'Internal'),
  (1, NULL, 'Travel & Accommodation', 'Travel', 'monthly', 11, 2000.00, 0, 22000.00, 0.00, 22000.00, 'Various');

-- Insert Sample Payment Schedule
INSERT OR IGNORE INTO payment_schedule (project_id, milestone_id, payment_description, payment_date, invoice_amount, payment_status) VALUES
  (1, 1, 'Initial Payment - 20%', '2025-02-01', 50000.00, 'paid'),
  (1, 2, 'Milestone 2 Payment - 15%', '2025-03-15', 37500.00, 'invoiced'),
  (1, 3, 'Milestone 3 Payment - 15%', '2025-05-15', 37500.00, 'pending'),
  (1, 4, 'Milestone 4 Payment - 20%', '2025-07-15', 50000.00, 'pending'),
  (1, 5, 'Milestone 5 Payment - 15%', '2025-09-15', 37500.00, 'pending'),
  (1, 6, 'Final Payment - 15%', '2025-11-30', 37500.00, 'pending');

-- Update project totals (this would normally be calculated by triggers or application logic)
UPDATE projects 
SET 
  total_labour_cost = (SELECT COALESCE(SUM(total_cost), 0) FROM cost_line_items WHERE project_id = 1),
  total_material_cost = (SELECT COALESCE(SUM(total_cost), 0) FROM material_costs WHERE project_id = 1),
  total_cost = (
    (SELECT COALESCE(SUM(total_cost), 0) FROM cost_line_items WHERE project_id = 1) +
    (SELECT COALESCE(SUM(total_cost), 0) FROM material_costs WHERE project_id = 1)
  ),
  total_revenue = 250000.00,
  margin_percentage = (
    (250000.00 - (
      (SELECT COALESCE(SUM(total_cost), 0) FROM cost_line_items WHERE project_id = 1) +
      (SELECT COALESCE(SUM(total_cost), 0) FROM material_costs WHERE project_id = 1)
    )) / 250000.00 * 100
  )
WHERE id = 1;
