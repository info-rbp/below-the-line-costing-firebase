# BTL Costing Application - Enhancement Plan

## Overview

Based on user feedback, this document outlines significant enhancements to transform the application from a basic costing tool into a comprehensive project management, CRM, and approval system.

**Date**: October 15, 2025
**Status**: Planning Phase
**Priority**: High

---

## Enhancement Requests

### 1. Hierarchical Milestone System
**Current State**: Flat milestone list
**Required**: Parent-child milestone hierarchy with task assignment

### 2. Materials Master Database
**Current State**: Free-text material entry
**Required**: Pre-defined materials catalog with costs and frequencies

### 3. Manager Settings Section
**Current State**: No centralized management UI
**Required**: Admin/Manager interface for master data management

### 4. Client CRM System
**Current State**: Free-text client names
**Required**: Client database with contact info, history, and project tracking

### 5. Project Approval Workflow
**Current State**: Projects created immediately
**Required**: Draft → Submit for Approval → Manager Review → Approved/Rejected

---

## Detailed Requirements

## 1. Hierarchical Milestone System

### Database Changes

**Update `milestones` table**:
```sql
ALTER TABLE milestones ADD COLUMN parent_milestone_id INTEGER REFERENCES milestones(id);
ALTER TABLE milestones ADD COLUMN milestone_level INTEGER DEFAULT 0; -- 0=parent, 1=sub, 2=sub-sub
ALTER TABLE milestones ADD COLUMN milestone_path TEXT; -- e.g., "M01.M01-01.M01-01-01"
ALTER TABLE milestones ADD COLUMN is_parent BOOLEAN DEFAULT 0;
```

### API Enhancements

**GET /api/milestones?project_id=1**
- Return hierarchical tree structure
- Include children milestones nested

**POST /api/milestones**
- Accept `parent_milestone_id` parameter
- Auto-generate `milestone_path` and `milestone_level`

### UI Changes

**Wizard Step 2: Milestones**
```
Current:
[Milestone List - Flat]
- M01: Project Kickoff
- M02: Design Phase
- M03: Construction

Enhanced:
[Milestone Tree with Indentation]
├─ M01: Project Kickoff
│  ├─ M01-01: Team Setup
│  └─ M01-02: Requirements Gathering
├─ M02: Design Phase
│  ├─ M02-01: Conceptual Design
│  └─ M02-02: Detailed Design
└─ M03: Construction
   ├─ M03-01: Foundation
   ├─ M03-02: Structure
   └─ M03-03: Finishing

[Add Parent Milestone] [Add Sub-milestone]
```

**Wizard Step 3: Labour Costs**
- Milestone dropdown shows tree structure with indentation
- Can assign task to any level (parent or sub-milestone)
- Visual indicator shows milestone hierarchy

### Implementation Details

**Milestone Tree Component**:
```javascript
renderMilestoneTree(milestones) {
  const buildTree = (items, parentId = null, level = 0) => {
    return items
      .filter(m => m.parent_milestone_id === parentId)
      .map(milestone => {
        const children = buildTree(items, milestone.id, level + 1);
        return {
          ...milestone,
          level,
          children,
          hasChildren: children.length > 0
        };
      });
  };
  
  const tree = buildTree(milestones);
  return this.renderTreeNodes(tree);
}

renderTreeNode(node, index) {
  const indent = '&nbsp;&nbsp;&nbsp;&nbsp;'.repeat(node.level);
  const icon = node.hasChildren ? 
    '<i class="fas fa-folder"></i>' : 
    '<i class="fas fa-file"></i>';
  
  return `
    <div class="milestone-node" data-level="${node.level}">
      ${indent}${icon} ${node.milestone_code}: ${node.milestone_name}
      <button onclick="addSubMilestone(${node.id})">Add Sub</button>
      <button onclick="editMilestone(${index})">Edit</button>
      <button onclick="removeMilestone(${index})">Remove</button>
    </div>
    ${node.children.map((child, idx) => this.renderTreeNode(child, idx)).join('')}
  `;
}
```

---

## 2. Materials Master Database

### New Database Table

**Create `materials_master` table**:
```sql
CREATE TABLE materials_master (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_code TEXT UNIQUE NOT NULL,
  material_name TEXT NOT NULL,
  material_category TEXT, -- Equipment, Software, Supplies, etc.
  description TEXT,
  default_unit_cost REAL NOT NULL,
  unit_of_measure TEXT NOT NULL, -- each, hour, day, month, kg, etc.
  supplier_name TEXT,
  supplier_contact TEXT,
  default_cost_type TEXT DEFAULT 'one-time', -- one-time, monthly, milestone
  default_frequency INTEGER, -- For monthly: default months
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_materials_master_code ON materials_master(material_code);
CREATE INDEX idx_materials_master_category ON materials_master(material_category);
CREATE INDEX idx_materials_master_active ON materials_master(is_active);
```

**Update `material_costs` table**:
```sql
ALTER TABLE material_costs ADD COLUMN material_master_id INTEGER REFERENCES materials_master(id);
-- Keep material_description for override capability
```

### API Routes

**New routes**: `/api/materials-master`

```typescript
// GET /api/materials-master?category=Equipment&active=true
// GET /api/materials-master/:id
// POST /api/materials-master (Manager+)
// PUT /api/materials-master/:id (Manager+)
// DELETE /api/materials-master/:id (Admin only)
```

### UI Changes

**New View: Manager → Materials Master**
```
┌─────────────────────────────────────────────────────────────────┐
│ Materials Master                              [+ Add Material]  │
├─────────────────────────────────────────────────────────────────┤
│ Filter: [All Categories ▼] [Active Only ✓]  Search: [______]  │
├─────┬──────────────┬──────────┬────────┬──────────┬───────────┤
│ Code│ Name         │ Category │ Cost   │ UOM      │ Actions   │
├─────┼──────────────┼──────────┼────────┼──────────┼───────────┤
│ MAT-│ Laptop       │ Equipment│ $2,500 │ each     │ [Edit][x] │
│ 001 │ Computer     │          │        │          │           │
├─────┼──────────────┼──────────┼────────┼──────────┼───────────┤
│ MAT-│ MS Project   │ Software │ $600   │ license  │ [Edit][x] │
│ 002 │ License      │          │        │          │           │
├─────┼──────────────┼──────────┼────────┼──────────┼───────────┤
│ MAT-│ Site Security│ Services │ $2,000 │ month    │ [Edit][x] │
│ 003 │              │          │        │          │           │
└─────┴──────────────┴──────────┴────────┴──────────┴───────────┘
```

**Wizard Step 4: Enhanced Material Selection**
```javascript
renderStep4() {
  return `
    <h2>Step 4: Material Costs</h2>
    
    <!-- Option 1: Select from Master -->
    <div class="material-source-toggle">
      <input type="radio" name="materialSource" value="master" checked>
      <label>Select from Materials Master</label>
      
      <input type="radio" name="materialSource" value="custom">
      <label>Custom Material (Free Text)</label>
    </div>
    
    <!-- Master Material Selection -->
    <div id="masterMaterialSelection">
      <select onchange="selectMasterMaterial(this)">
        <option value="">-- Select Material --</option>
        ${this.materialsMaster.map(m => `
          <option value="${m.id}" 
                  data-cost="${m.default_unit_cost}"
                  data-type="${m.default_cost_type}"
                  data-uom="${m.unit_of_measure}">
            ${m.material_code} - ${m.material_name} ($${m.default_unit_cost}/${m.unit_of_measure})
          </option>
        `).join('')}
      </select>
      
      <!-- Auto-populated from master -->
      <input type="number" placeholder="Quantity" value="1">
      <input type="number" placeholder="Unit Cost" value="" readonly> <!-- From master -->
      <select name="costType">
        <option value="one-time">One-time</option>
        <option value="monthly">Monthly</option>
        <option value="milestone">Milestone</option>
      </select>
    </div>
    
    <!-- Custom Material Entry (fallback) -->
    <div id="customMaterialEntry" style="display:none">
      <input type="text" placeholder="Material Description">
      <input type="number" placeholder="Quantity">
      <input type="number" placeholder="Unit Cost">
      <!-- ... rest of form -->
    </div>
  `;
}
```

### Seed Data Example

```sql
INSERT INTO materials_master (material_code, material_name, material_category, default_unit_cost, unit_of_measure, default_cost_type) VALUES
  ('MAT-001', 'Laptop Computer', 'Equipment', 2500.00, 'each', 'one-time'),
  ('MAT-002', 'Microsoft Project License', 'Software', 600.00, 'license', 'one-time'),
  ('MAT-003', 'Site Security Service', 'Services', 2000.00, 'month', 'monthly'),
  ('MAT-004', 'Safety Equipment', 'Supplies', 150.00, 'set', 'one-time'),
  ('MAT-005', 'Cloud Hosting', 'Services', 500.00, 'month', 'monthly'),
  ('MAT-006', 'Survey Equipment Rental', 'Equipment', 800.00, 'day', 'milestone'),
  ('MAT-007', 'CAD Software Subscription', 'Software', 300.00, 'month', 'monthly'),
  ('MAT-008', 'Construction Materials', 'Supplies', 50000.00, 'lot', 'milestone');
```

---

## 3. Manager Settings Section

### New UI Navigation

**Add to Sidebar**:
```
Dashboard
Projects
Personnel
⚙️ Manager Settings  ← NEW
  ├─ Materials Master
  ├─ Clients (CRM)
  ├─ Employees
  ├─ Rate Bands
  └─ System Settings
Integrations
```

### Manager Settings Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Manager Settings                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│ │ 📦 Materials    │  │ 👥 Clients      │  │ 👤 Employees    │ │
│ │ Master          │  │ (CRM)           │  │                 │ │
│ │                 │  │                 │  │                 │ │
│ │ 47 materials    │  │ 23 clients      │  │ 30 employees    │ │
│ │ [Manage →]      │  │ [Manage →]      │  │ [Manage →]      │ │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│ │ 💰 Rate Bands   │  │ ⚙️ System       │  │ 📊 Reports      │ │
│ │                 │  │ Settings        │  │                 │ │
│ │                 │  │                 │  │                 │ │
│ │ 5 bands         │  │ Tax, G&A, etc.  │  │ Export data     │ │
│ │ [Manage →]      │  │ [Configure →]   │  │ [View →]        │ │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation

**New component**: `components.managerSettingsView()`

```javascript
managerSettingsView() {
  // Only accessible to Admin and Manager roles
  if (!['admin', 'manager'].includes(state.user?.role)) {
    return '<div class="alert">Access denied. Manager role required.</div>';
  }
  
  return `
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Manager Settings</h1>
      <p class="text-gray-600">Manage master data and system configuration</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      ${this.renderSettingCard('Materials Master', 'box', 'materials-master', state.materialsMaster?.length || 0)}
      ${this.renderSettingCard('Clients (CRM)', 'building', 'clients', state.clients?.length || 0)}
      ${this.renderSettingCard('Employees', 'user-tie', 'employees', state.personnel?.length || 0)}
      ${this.renderSettingCard('Rate Bands', 'dollar-sign', 'rate-bands', state.rateBands?.length || 0)}
    </div>
  `;
}

renderSettingCard(title, icon, route, count) {
  return `
    <div class="card p-6 hover:shadow-lg transition cursor-pointer" onclick="showView('${route}')">
      <div class="flex items-center mb-4">
        <i class="fas fa-${icon} text-3xl text-blue-600 mr-4"></i>
        <div>
          <h3 class="text-xl font-bold text-gray-800">${title}</h3>
          <p class="text-sm text-gray-600">${count} items</p>
        </div>
      </div>
      <button class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
        Manage →
      </button>
    </div>
  `;
}
```

---

## 4. Client CRM System

### New Database Table

**Create `clients` table**:
```sql
CREATE TABLE clients (
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

-- Indexes
CREATE INDEX idx_clients_code ON clients(client_code);
CREATE INDEX idx_clients_name ON clients(client_name);
CREATE INDEX idx_clients_active ON clients(is_active);
```

**Update `projects` table**:
```sql
ALTER TABLE projects ADD COLUMN client_id INTEGER REFERENCES clients(id);
-- Keep client_name for display/override
```

### API Routes

**New routes**: `/api/clients`

```typescript
// GET /api/clients?active=true&type=Corporate
// GET /api/clients/:id
// GET /api/clients/:id/projects - Get all projects for client
// POST /api/clients (Manager+)
// PUT /api/clients/:id (Manager+)
// DELETE /api/clients/:id (Admin only)
```

### UI Changes

**New View: Manager Settings → Clients (CRM)**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Clients (CRM)                                           [+ Add Client]      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filter: [All Types ▼] [Active Only ✓]  Search: [_____________]            │
├──────┬──────────────────┬──────────────┬─────────────────┬────────┬────────┤
│ Code │ Name             │ Type         │ Contact         │ Projects│ Actions│
├──────┼──────────────────┼──────────────┼─────────────────┼────────┼────────┤
│ CL001│ ABC Corporation  │ Corporate    │ John Doe        │ 12     │[View]  │
│      │                  │              │ john@abc.com    │        │[Edit]  │
├──────┼──────────────────┼──────────────┼─────────────────┼────────┼────────┤
│ CL002│ XYZ Industries   │ Government   │ Jane Smith      │ 8      │[View]  │
│      │                  │              │ jane@xyz.gov    │        │[Edit]  │
└──────┴──────────────────┴──────────────┴─────────────────┴────────┴────────┘
```

**Client Detail View**:
```
┌─────────────────────────────────────────────────────────────────┐
│ ABC Corporation (CL001)                          [Edit] [Delete]│
├─────────────────────────────────────────────────────────────────┤
│ Contact Information                                             │
│   Primary Contact: John Doe                                     │
│   Email: john@abc.com                                          │
│   Phone: (555) 123-4567                                        │
│                                                                 │
│ Business Details                                                │
│   Type: Corporate                                               │
│   Industry: Construction                                        │
│   Payment Terms: Net 30                                         │
│   Credit Limit: $500,000                                        │
│                                                                 │
│ Projects (12 total)                                             │
│   ├─ PROJ-2025-001 (Active) - $250K                           │
│   ├─ PROJ-2024-089 (Completed) - $180K                        │
│   └─ PROJ-2024-045 (Completed) - $320K                        │
│                                                                 │
│ Notes:                                                          │
│   Preferred vendor for government contracts...                  │
└─────────────────────────────────────────────────────────────────┘
```

**Wizard Step 1: Enhanced Client Selection**
```javascript
renderStep1() {
  return `
    <h2>Step 1: Project Basics</h2>
    
    <!-- Client Selection from CRM -->
    <div class="form-group">
      <label>Client</label>
      <div class="client-selection">
        <select id="clientSelect" onchange="selectClient(this)">
          <option value="">-- Select Client --</option>
          ${this.clients.map(c => `
            <option value="${c.id}" 
                    data-name="${c.client_name}"
                    data-payment-terms="${c.payment_terms}"
                    data-contact="${c.primary_contact_name}">
              ${c.client_code} - ${c.client_name}
            </option>
          `).join('')}
        </select>
        <button onclick="showAddClientModal()" class="btn-sm">+ New Client</button>
      </div>
      
      <!-- Auto-populated from CRM -->
      <input type="text" id="clientName" placeholder="Client Name" readonly>
      <input type="text" id="clientContact" placeholder="Primary Contact" readonly>
      <input type="text" id="paymentTerms" placeholder="Payment Terms" readonly>
    </div>
    
    <!-- Rest of project form -->
  `;
}

selectClient(select) {
  const option = select.selectedOptions[0];
  if (!option || !option.value) return;
  
  const clientId = option.value;
  const clientName = option.dataset.name;
  const contact = option.dataset.contact;
  const paymentTerms = option.dataset.paymentTerms;
  
  document.getElementById('clientName').value = clientName;
  document.getElementById('clientContact').value = contact;
  document.getElementById('paymentTerms').value = paymentTerms;
  
  this.projectData.project.client_id = parseInt(clientId);
  this.projectData.project.client_name = clientName;
}
```

### Seed Data Example

```sql
INSERT INTO clients (client_code, client_name, client_type, industry, primary_contact_name, primary_contact_email, primary_contact_phone, payment_terms, credit_limit) VALUES
  ('CL001', 'ABC Corporation', 'Corporate', 'Construction', 'John Doe', 'john@abc.com', '(555) 123-4567', 'Net 30', 500000),
  ('CL002', 'XYZ Industries', 'Government', 'Infrastructure', 'Jane Smith', 'jane@xyz.gov', '(555) 987-6543', 'Net 60', 1000000),
  ('CL003', 'Global Tech Solutions', 'Corporate', 'Technology', 'Mike Johnson', 'mike@globaltech.com', '(555) 456-7890', 'Net 30', 300000),
  ('CL004', 'City of Springfield', 'Government', 'Municipal', 'Sarah Wilson', 'sarah@springfield.gov', '(555) 321-0987', 'Net 90', 2000000);
```

---

## 5. Project Approval Workflow

### Database Changes

**Update `projects` table**:
```sql
ALTER TABLE projects ADD COLUMN approval_status TEXT DEFAULT 'draft'; 
-- Values: draft, pending_approval, approved, rejected
ALTER TABLE projects ADD COLUMN submitted_at DATETIME;
ALTER TABLE projects ADD COLUMN submitted_by INTEGER REFERENCES users(id);
ALTER TABLE projects ADD COLUMN approved_at DATETIME;
ALTER TABLE projects ADD COLUMN approved_by INTEGER REFERENCES users(id);
ALTER TABLE projects ADD COLUMN rejection_reason TEXT;
```

**New `project_approvals` table**:
```sql
CREATE TABLE project_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  approver_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, -- submitted, approved, rejected, revision_requested
  comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_approvals_project ON project_approvals(project_id);
CREATE INDEX idx_project_approvals_approver ON project_approvals(approver_id);
```

### API Routes

**Enhanced `/api/projects` routes**:
```typescript
// POST /api/projects/:id/submit-for-approval (User+)
// POST /api/projects/:id/approve (Manager+)
// POST /api/projects/:id/reject (Manager+)
// GET /api/projects/pending-approval (Manager+)
// GET /api/projects/my-submissions (User+)
```

### Workflow States

```
┌──────────┐   Submit    ┌──────────────────┐   Approve   ┌──────────┐
│  Draft   │ ─────────> │ Pending Approval │ ─────────>  │ Approved │
│          │             │                  │             │          │
└──────────┘             └──────────────────┘             └──────────┘
                                │                              │
                                │ Reject                       │
                                ▼                              ▼
                         ┌──────────┐                   ┌──────────┐
                         │ Rejected │                   │  Active  │
                         └──────────┘                   │ Project  │
                                                        └──────────┘
```

### UI Changes

**Wizard Final Step: Submit Options**
```javascript
renderStep6Enhanced() {
  return `
    <h2>Step 6: Review & Create</h2>
    
    <!-- Financial Summary (existing) -->
    <div class="financial-summary">
      <!-- ... existing summary ... -->
    </div>
    
    <!-- New: Submission Options -->
    <div class="submission-options">
      <h3>Project Submission</h3>
      
      <div class="radio-group">
        <input type="radio" name="submissionType" value="draft" checked>
        <label>Save as Draft (can edit later)</label>
        
        <input type="radio" name="submissionType" value="submit">
        <label>Submit for Manager Approval</label>
        
        ${state.user.role === 'admin' || state.user.role === 'manager' ? `
          <input type="radio" name="submissionType" value="approve">
          <label>Create and Approve (Manager/Admin only)</label>
        ` : ''}
      </div>
      
      <!-- Conditional: If submitting for approval -->
      <div id="approvalNotes" style="display:none">
        <label>Notes for Approver (optional)</label>
        <textarea placeholder="Add any notes for the approving manager..."></textarea>
        
        <label>Select Approver</label>
        <select id="approverSelect">
          ${state.managers.map(m => `
            <option value="${m.id}">${m.full_name} (${m.email})</option>
          `).join('')}
        </select>
      </div>
    </div>
    
    <!-- Submit Button (dynamic text) -->
    <button onclick="ProjectWizard.submitProject()" class="btn-primary">
      <span id="submitButtonText">Create Project</span>
    </button>
  `;
}

// Update button text based on selection
document.querySelectorAll('input[name="submissionType"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const button = document.getElementById('submitButtonText');
    const notes = document.getElementById('approvalNotes');
    
    switch(e.target.value) {
      case 'draft':
        button.textContent = 'Save as Draft';
        notes.style.display = 'none';
        break;
      case 'submit':
        button.textContent = 'Submit for Approval';
        notes.style.display = 'block';
        break;
      case 'approve':
        button.textContent = 'Create and Approve';
        notes.style.display = 'none';
        break;
    }
  });
});
```

**New View: Manager → Pending Approvals**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Pending Approvals                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filter: [All Users ▼] [This Month ▼]                                       │
├──────────────┬─────────────┬──────────────┬────────────┬──────────┬────────┤
│ Project      │ Submitted By│ Date         │ Total Cost │ Margin   │ Actions│
├──────────────┼─────────────┼──────────────┼────────────┼──────────┼────────┤
│ PROJ-2025-   │ John Smith  │ Oct 15, 2025 │ $125,000   │ 22.5%    │[Review]│
│ TEST-001     │             │              │            │          │        │
├──────────────┼─────────────┼──────────────┼────────────┼──────────┼────────┤
│ PROJ-2025-   │ Jane Doe    │ Oct 14, 2025 │ $89,500    │ 18.3%    │[Review]│
│ TEST-002     │             │              │            │          │        │
└──────────────┴─────────────┴──────────────┴────────────┴──────────┴────────┘
```

**Approval Review Modal**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Review Project: PROJ-2025-TEST-001                    [✓][✗][←] │
├─────────────────────────────────────────────────────────────────┤
│ Submitted by: John Smith (user@jl2group.com)                   │
│ Date: October 15, 2025 at 3:45 PM                              │
│                                                                 │
│ Project Summary:                                                │
│   Client: ABC Corporation                                       │
│   Duration: Nov 1, 2025 - Mar 31, 2026 (5 months)             │
│   Revenue: $500,000                                             │
│   Total Cost: $125,000                                          │
│   Margin: $375,000 (75.0%) ✓                                   │
│                                                                 │
│ Cost Breakdown:                                                 │
│   Labour: $85,000 (12 tasks, 580 hours)                        │
│   Materials: $40,000 (8 items)                                 │
│                                                                 │
│ Milestones: 5 defined                                           │
│ Payment Schedule: 3 payments totaling $500,000 ✓               │
│                                                                 │
│ Submitter Notes:                                                │
│   "Urgent project for key client. Competitive pricing          │
│    required. Please review and approve ASAP."                   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Approval Decision                                           ││
│ │                                                             ││
│ │ ○ Approve Project                                           ││
│ │ ○ Reject Project                                            ││
│ │ ○ Request Revisions                                         ││
│ │                                                             ││
│ │ Comments:                                                   ││
│ │ [____________________________________________]              ││
│ │                                                             ││
│ │ [Submit Decision]                                           ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Project List Status Indicators**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Projects                                      [+ New Project]    │
├──────────────┬──────────────┬─────────────┬────────────┬────────┤
│ Project      │ Client       │ Status      │ Cost       │ Actions│
├──────────────┼──────────────┼─────────────┼────────────┼────────┤
│ PROJ-2025-01 │ ABC Corp     │ 📝 Draft    │ $125K      │[Edit]  │
├──────────────┼──────────────┼─────────────┼────────────┼────────┤
│ PROJ-2025-02 │ XYZ Inc      │ ⏳ Pending  │ $89K       │[View]  │
│              │              │ Approval    │            │[Recall]│
├──────────────┼──────────────┼─────────────┼────────────┼────────┤
│ PROJ-2025-03 │ Global Tech  │ ✅ Approved │ $250K      │[View]  │
├──────────────┼──────────────┼─────────────┼────────────┼────────┤
│ PROJ-2024-99 │ City Hall    │ ❌ Rejected │ $180K      │[Revise]│
└──────────────┴──────────────┴─────────────┴────────────┴────────┘
```

---

## Implementation Priority

### Phase 1: Foundation (High Priority)
1. ✅ Create `clients` table and API
2. ✅ Create `materials_master` table and API
3. ✅ Update `projects` table for approval workflow
4. ✅ Create `project_approvals` table
5. ✅ Update `milestones` table for hierarchy

### Phase 2: Manager Settings UI (High Priority)
6. ✅ Create Manager Settings dashboard
7. ✅ Build Clients (CRM) management interface
8. ✅ Build Materials Master management interface
9. ✅ Enhance Employees management interface

### Phase 3: Wizard Enhancements (Medium Priority)
10. ✅ Update wizard Step 1 with client dropdown
11. ✅ Update wizard Step 2 with hierarchical milestones
12. ✅ Update wizard Step 3 with milestone tree selection
13. ✅ Update wizard Step 4 with materials master
14. ✅ Update wizard Step 6 with approval options

### Phase 4: Approval Workflow (Medium Priority)
15. ✅ Create pending approvals view
16. ✅ Build approval review interface
17. ✅ Add approval notification system
18. ✅ Add project status indicators

### Phase 5: Testing & Refinement (Low Priority)
19. ⏳ End-to-end testing of all workflows
20. ⏳ UI/UX refinements
21. ⏳ Performance optimization
22. ⏳ Documentation updates

---

## Database Migration Plan

### Migration File: `0002_enhancements.sql`

```sql
-- 1. Clients (CRM) Table
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_code TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_type TEXT,
  industry TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',
  payment_terms TEXT,
  credit_limit REAL,
  notes TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Materials Master Table
CREATE TABLE materials_master (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_code TEXT UNIQUE NOT NULL,
  material_name TEXT NOT NULL,
  material_category TEXT,
  description TEXT,
  default_unit_cost REAL NOT NULL,
  unit_of_measure TEXT NOT NULL,
  supplier_name TEXT,
  default_cost_type TEXT DEFAULT 'one-time',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Project Approvals Table
CREATE TABLE project_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  approver_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Update Projects Table
ALTER TABLE projects ADD COLUMN client_id INTEGER REFERENCES clients(id);
ALTER TABLE projects ADD COLUMN approval_status TEXT DEFAULT 'draft';
ALTER TABLE projects ADD COLUMN submitted_at DATETIME;
ALTER TABLE projects ADD COLUMN submitted_by INTEGER REFERENCES users(id);
ALTER TABLE projects ADD COLUMN approved_at DATETIME;
ALTER TABLE projects ADD COLUMN approved_by INTEGER REFERENCES users(id);

-- 5. Update Milestones Table
ALTER TABLE milestones ADD COLUMN parent_milestone_id INTEGER REFERENCES milestones(id);
ALTER TABLE milestones ADD COLUMN milestone_level INTEGER DEFAULT 0;
ALTER TABLE milestones ADD COLUMN is_parent BOOLEAN DEFAULT 0;

-- 6. Update Material Costs Table
ALTER TABLE material_costs ADD COLUMN material_master_id INTEGER REFERENCES materials_master(id);

-- Indexes
CREATE INDEX idx_clients_code ON clients(client_code);
CREATE INDEX idx_materials_master_code ON materials_master(material_code);
CREATE INDEX idx_project_approvals_project ON project_approvals(project_id);
CREATE INDEX idx_milestones_parent ON milestones(parent_milestone_id);
```

---

## Estimated Implementation Timeline

| Phase | Tasks | Estimated Time | Priority |
|-------|-------|----------------|----------|
| Phase 1: Database | 5 tasks | 2-3 hours | High |
| Phase 2: Manager UI | 4 tasks | 4-5 hours | High |
| Phase 3: Wizard Updates | 5 tasks | 5-6 hours | Medium |
| Phase 4: Approval Workflow | 4 tasks | 4-5 hours | Medium |
| Phase 5: Testing | 4 tasks | 3-4 hours | Low |
| **TOTAL** | **22 tasks** | **18-23 hours** | |

---

## Benefits

### 1. Hierarchical Milestones
- Better project organization
- Clear parent-child relationships
- More accurate task assignment
- Improved reporting capabilities

### 2. Materials Master
- Consistent pricing across projects
- Reduced data entry errors
- Supplier tracking
- Cost history and trends

### 3. Manager Settings
- Centralized data management
- Easy maintenance of master data
- Role-based access control
- Audit trail for changes

### 4. Client CRM
- Customer relationship tracking
- Project history per client
- Better client insights
- Payment terms management

### 5. Approval Workflow
- Quality control gate
- Manager oversight
- Audit trail for decisions
- Risk management

---

## Next Steps

1. **Review and approve** this enhancement plan
2. **Prioritize** specific features if time/budget constrained
3. **Begin implementation** with Phase 1 (database foundation)
4. **Iterative development** with testing after each phase
5. **User feedback** after each major feature

---

**Status**: Awaiting User Approval to Proceed
**Date**: October 15, 2025
**Estimated Completion**: 18-23 hours of development
