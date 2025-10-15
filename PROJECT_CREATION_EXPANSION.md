# Project Creation Wizard - Implementation Specification

## Overview

This document outlines the expansion needed to enable **complete project creation from scratch** with a guided multi-step wizard interface.

---

## 1. Backend API Expansions

### A. Milestone Management Routes (NEW)

**File:** `src/routes/milestones.ts`

```typescript
// GET /api/milestones?project_id=1
// List all milestones for a project

// POST /api/milestones
// Create single milestone
{
  "project_id": 1,
  "milestone_code": "M01",
  "milestone_name": "Project Kickoff",
  "milestone_date": "2025-01-15",
  "description": "Initial setup",
  "sequence_order": 1
}

// POST /api/milestones/bulk
// Create multiple milestones at once
{
  "project_id": 1,
  "milestones": [
    { "milestone_code": "M01", "milestone_name": "Kickoff", ... },
    { "milestone_code": "M02", "milestone_name": "Design", ... }
  ]
}

// PUT /api/milestones/:id
// Update milestone

// DELETE /api/milestones/:id
// Delete milestone
```

### B. Enhanced Project Creation (EXPAND)

**File:** `src/routes/projects.ts`

```typescript
// POST /api/projects/with-details
// Create project with all related data in one transaction
{
  "project": {
    "project_code": "PROJ-2025-002",
    "project_name": "New Initiative",
    "client_name": "Client ABC",
    "start_date": "2025-02-01",
    "end_date": "2025-12-31",
    "tax_rate": 0.10,
    "ga_percentage": 0.15,
    "total_revenue": 500000
  },
  "milestones": [
    {
      "milestone_code": "M01",
      "milestone_name": "Phase 1",
      "milestone_date": "2025-03-01",
      "sequence_order": 1
    }
  ],
  "labour_costs": [
    {
      "milestone_code": "M01",  // Will be linked after milestone creation
      "wbs_code": "1.1",
      "task_description": "Project Management",
      "rate_type": "actual",
      "personnel_id": 1,
      "hours": 80,
      "apply_ga": 1
    }
  ],
  "material_costs": [
    {
      "milestone_code": "M01",
      "material_description": "Software Licenses",
      "cost_type": "monthly",
      "quantity": 12,
      "unit_cost": 500,
      "apply_ga": 1
    }
  ],
  "payment_schedule": [
    {
      "milestone_code": "M01",
      "payment_description": "Initial Payment",
      "payment_date": "2025-03-15",
      "invoice_amount": 100000
    }
  ]
}

// POST /api/projects/:id/duplicate
// Duplicate existing project
{
  "new_project_code": "PROJ-2025-003",
  "new_project_name": "Copy of Original",
  "include_costs": true,
  "include_milestones": true,
  "include_payment_schedule": false
}
```

### C. Project Templates (NEW)

**File:** `src/routes/templates.ts`

```typescript
// Templates allow saving common project structures for reuse

// GET /api/templates
// List all saved templates

// POST /api/templates
// Create template from existing project
{
  "name": "Standard Consulting Project",
  "description": "6-month consulting engagement template",
  "source_project_id": 1,  // Optional: copy from existing project
  "template_data": {
    "default_duration_months": 6,
    "default_ga_percentage": 0.15,
    "milestone_structure": [
      { "name": "Kickoff", "offset_days": 0 },
      { "name": "Phase 1", "offset_days": 30 },
      { "name": "Phase 2", "offset_days": 90 }
    ],
    "default_roles": [
      { "role": "Project Manager", "hours": 160 },
      { "role": "Consultant", "hours": 400 }
    ]
  }
}

// POST /api/projects/from-template/:template_id
// Create new project from template
{
  "project_code": "PROJ-2025-004",
  "project_name": "Client XYZ Engagement",
  "client_name": "Client XYZ",
  "start_date": "2025-03-01",
  "total_revenue": 300000
}
```

### D. Bulk Operations (NEW)

**File:** `src/routes/bulk.ts`

```typescript
// POST /api/bulk/cost-items
// Bulk create labour cost items
{
  "project_id": 1,
  "items": [
    { "wbs_code": "1.1", "task_description": "Task 1", ... },
    { "wbs_code": "1.2", "task_description": "Task 2", ... }
  ]
}

// POST /api/bulk/materials
// Bulk create material costs

// POST /api/bulk/import-csv
// Import from CSV file
{
  "project_id": 1,
  "import_type": "labour_costs",
  "csv_data": "wbs_code,task_description,hours,hourly_rate\n1.1,Task 1,40,185"
}
```

### E. Rate Bands Management (NEW)

**File:** `src/routes/rate-bands.ts`

```typescript
// GET /api/rate-bands
// List all rate bands

// POST /api/rate-bands
// Create rate band

// PUT /api/rate-bands/:id
// Update rate band
```

---

## 2. Database Schema Updates

### A. Add Project Templates Table

```sql
-- migrations/0002_project_templates.sql

CREATE TABLE IF NOT EXISTS project_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  template_data TEXT NOT NULL,  -- JSON structure
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_templates_name ON project_templates(name);
```

### B. Add WBS Structure Table (Optional - for complex WBS)

```sql
CREATE TABLE IF NOT EXISTS wbs_structure (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  parent_id INTEGER,  -- Self-referencing for hierarchy
  wbs_code TEXT NOT NULL,
  wbs_name TEXT NOT NULL,
  level INTEGER NOT NULL,
  sequence_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES wbs_structure(id) ON DELETE CASCADE,
  UNIQUE(project_id, wbs_code)
);
```

---

## 3. Frontend UI Components

### A. Project Creation Wizard Component

**File:** `public/static/wizard.js`

```javascript
const ProjectWizard = {
  currentStep: 1,
  totalSteps: 6,
  projectData: {
    project: {},
    milestones: [],
    labour_costs: [],
    material_costs: [],
    payment_schedule: []
  },
  
  steps: [
    { id: 1, name: 'Project Basics', icon: 'fa-folder' },
    { id: 2, name: 'Milestones', icon: 'fa-flag' },
    { id: 3, name: 'Labour Costs', icon: 'fa-users' },
    { id: 4, name: 'Material Costs', icon: 'fa-box' },
    { id: 5, name: 'Payment Schedule', icon: 'fa-money-bill' },
    { id: 6, name: 'Review & Create', icon: 'fa-check' }
  ],
  
  render() {
    // Render wizard UI
  },
  
  nextStep() {
    if (this.validateCurrentStep()) {
      this.currentStep++;
      this.render();
    }
  },
  
  previousStep() {
    this.currentStep--;
    this.render();
  },
  
  validateCurrentStep() {
    // Validation logic per step
    return true;
  },
  
  async submitProject() {
    // POST to /api/projects/with-details
  }
};
```

### B. Step 1: Project Basics Form

```html
<div class="wizard-step" id="step-1">
  <h3>Project Information</h3>
  
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label>Project Code *</label>
      <input type="text" name="project_code" required 
        placeholder="PROJ-2025-001"
        class="w-full px-4 py-2 border rounded">
    </div>
    
    <div>
      <label>Project Name *</label>
      <input type="text" name="project_name" required
        placeholder="Digital Transformation"
        class="w-full px-4 py-2 border rounded">
    </div>
    
    <div>
      <label>Client Name *</label>
      <input type="text" name="client_name" required
        class="w-full px-4 py-2 border rounded">
    </div>
    
    <div>
      <label>Project Status</label>
      <select name="status" class="w-full px-4 py-2 border rounded">
        <option value="active">Active</option>
        <option value="on-hold">On Hold</option>
      </select>
    </div>
    
    <div>
      <label>Start Date *</label>
      <input type="date" name="start_date" required
        class="w-full px-4 py-2 border rounded">
    </div>
    
    <div>
      <label>End Date *</label>
      <input type="date" name="end_date" required
        class="w-full px-4 py-2 border rounded">
    </div>
    
    <div>
      <label>Tax Rate (%)</label>
      <input type="number" name="tax_rate" step="0.01" value="10.00"
        class="w-full px-4 py-2 border rounded">
    </div>
    
    <div>
      <label>G&A Percentage (%)</label>
      <input type="number" name="ga_percentage" step="0.01" value="15.00"
        class="w-full px-4 py-2 border rounded">
    </div>
    
    <div>
      <label>G&A Application</label>
      <select name="ga_application" class="w-full px-4 py-2 border rounded">
        <option value="all">All Costs</option>
        <option value="labour">Labour Only</option>
        <option value="material">Material Only</option>
        <option value="none">None</option>
      </select>
    </div>
    
    <div>
      <label>Total Revenue Estimate</label>
      <input type="number" name="total_revenue" step="0.01"
        placeholder="250000.00"
        class="w-full px-4 py-2 border rounded">
    </div>
  </div>
  
  <div class="mt-4">
    <label>Project Description</label>
    <textarea name="description" rows="4" 
      class="w-full px-4 py-2 border rounded"></textarea>
  </div>
  
  <div class="mt-6 flex justify-between">
    <button type="button" disabled class="btn-secondary">
      <i class="fas fa-arrow-left mr-2"></i> Previous
    </button>
    <button type="button" onclick="ProjectWizard.nextStep()" class="btn-primary">
      Next <i class="fas fa-arrow-right ml-2"></i>
    </button>
  </div>
</div>
```

### C. Step 2: Milestones Builder

```html
<div class="wizard-step" id="step-2">
  <h3>Project Milestones</h3>
  <p class="text-gray-600 mb-4">Define key milestones and deliverables</p>
  
  <div id="milestones-list" class="space-y-3">
    <!-- Dynamic milestone items -->
    <div class="milestone-item border rounded p-4">
      <div class="grid grid-cols-4 gap-4">
        <div>
          <label>Milestone Code</label>
          <input type="text" placeholder="M01" class="w-full px-3 py-2 border rounded">
        </div>
        <div>
          <label>Milestone Name</label>
          <input type="text" placeholder="Project Kickoff" class="w-full px-3 py-2 border rounded">
        </div>
        <div>
          <label>Target Date</label>
          <input type="date" class="w-full px-3 py-2 border rounded">
        </div>
        <div class="flex items-end">
          <button type="button" class="btn-danger w-full">
            <i class="fas fa-trash"></i> Remove
          </button>
        </div>
      </div>
      <div class="mt-2">
        <label>Description</label>
        <input type="text" placeholder="Initial setup and team onboarding" 
          class="w-full px-3 py-2 border rounded">
      </div>
    </div>
  </div>
  
  <button type="button" onclick="addMilestone()" class="btn-secondary mt-4">
    <i class="fas fa-plus mr-2"></i> Add Milestone
  </button>
  
  <!-- Timeline Preview -->
  <div class="mt-6 p-4 bg-gray-50 rounded">
    <h4 class="font-medium mb-3">Timeline Preview</h4>
    <div id="timeline-preview" class="relative h-24">
      <!-- Visual timeline with milestones -->
    </div>
  </div>
  
  <div class="mt-6 flex justify-between">
    <button type="button" onclick="ProjectWizard.previousStep()" class="btn-secondary">
      <i class="fas fa-arrow-left mr-2"></i> Previous
    </button>
    <button type="button" onclick="ProjectWizard.nextStep()" class="btn-primary">
      Next <i class="fas fa-arrow-right ml-2"></i>
    </button>
  </div>
</div>
```

### D. Step 3: Labour Costs / WBS Builder

```html
<div class="wizard-step" id="step-3">
  <h3>Labour Cost Build-Up</h3>
  <p class="text-gray-600 mb-4">Add tasks and assign resources</p>
  
  <div class="mb-4 flex justify-between items-center">
    <div>
      <label class="inline-flex items-center mr-4">
        <input type="radio" name="wbs_mode" value="simple" checked>
        <span class="ml-2">Simple List</span>
      </label>
      <label class="inline-flex items-center">
        <input type="radio" name="wbs_mode" value="hierarchical">
        <span class="ml-2">Hierarchical WBS</span>
      </label>
    </div>
    <button type="button" class="btn-secondary" onclick="bulkImportLabour()">
      <i class="fas fa-file-import mr-2"></i> Import CSV
    </button>
  </div>
  
  <div id="labour-costs-list" class="space-y-3">
    <div class="labour-item border rounded p-4">
      <div class="grid grid-cols-6 gap-3">
        <div>
          <label>WBS Code</label>
          <input type="text" placeholder="1.1" class="w-full px-3 py-2 border rounded">
        </div>
        <div class="col-span-2">
          <label>Task Description</label>
          <input type="text" placeholder="Project Management" class="w-full px-3 py-2 border rounded">
        </div>
        <div>
          <label>Milestone</label>
          <select class="w-full px-3 py-2 border rounded">
            <option value="">None</option>
            <!-- Populated from Step 2 milestones -->
          </select>
        </div>
        <div>
          <label>Rate Type</label>
          <select class="w-full px-3 py-2 border rounded" onchange="toggleResourceSelect(this)">
            <option value="actual">Actual</option>
            <option value="banded">Banded</option>
          </select>
        </div>
        <div class="flex items-end">
          <button type="button" class="btn-danger w-full">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-6 gap-3 mt-3">
        <div class="col-span-2 resource-select-actual">
          <label>Personnel</label>
          <select class="w-full px-3 py-2 border rounded" onchange="updateRate(this)">
            <option value="">Select person...</option>
            <!-- Populated from personnel API -->
          </select>
        </div>
        <div class="col-span-2 resource-select-banded hidden">
          <label>Rate Band</label>
          <select class="w-full px-3 py-2 border rounded" onchange="updateRate(this)">
            <option value="">Select band...</option>
            <!-- Populated from rate_bands API -->
          </select>
        </div>
        <div>
          <label>Hours</label>
          <input type="number" placeholder="40" class="w-full px-3 py-2 border rounded" 
            onchange="calculateCost(this)">
        </div>
        <div>
          <label>Hourly Rate</label>
          <input type="number" placeholder="185.00" class="w-full px-3 py-2 border rounded" 
            readonly>
        </div>
        <div>
          <label>Apply G&A</label>
          <select class="w-full px-3 py-2 border rounded">
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>
        <div class="flex items-end">
          <div class="text-right w-full">
            <span class="text-xs text-gray-500">Total Cost</span>
            <div class="font-bold text-lg total-cost">$0.00</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <button type="button" onclick="addLabourCost()" class="btn-secondary mt-4">
    <i class="fas fa-plus mr-2"></i> Add Task
  </button>
  
  <!-- Summary -->
  <div class="mt-6 p-4 bg-blue-50 rounded">
    <div class="flex justify-between items-center">
      <span class="font-medium">Total Labour Cost:</span>
      <span class="text-2xl font-bold text-blue-600" id="total-labour">$0.00</span>
    </div>
  </div>
  
  <div class="mt-6 flex justify-between">
    <button type="button" onclick="ProjectWizard.previousStep()" class="btn-secondary">
      <i class="fas fa-arrow-left mr-2"></i> Previous
    </button>
    <button type="button" onclick="ProjectWizard.nextStep()" class="btn-primary">
      Next <i class="fas fa-arrow-right ml-2"></i>
    </button>
  </div>
</div>
```

### E. Step 4: Material Costs

```html
<div class="wizard-step" id="step-4">
  <h3>Material & Other Costs</h3>
  <p class="text-gray-600 mb-4">Add non-labour expenses</p>
  
  <div id="material-costs-list" class="space-y-3">
    <div class="material-item border rounded p-4">
      <div class="grid grid-cols-5 gap-3">
        <div class="col-span-2">
          <label>Description</label>
          <input type="text" placeholder="Software Licenses" class="w-full px-3 py-2 border rounded">
        </div>
        <div>
          <label>Category</label>
          <input type="text" placeholder="Software" class="w-full px-3 py-2 border rounded">
        </div>
        <div>
          <label>Milestone</label>
          <select class="w-full px-3 py-2 border rounded">
            <option value="">None</option>
            <!-- From Step 2 -->
          </select>
        </div>
        <div class="flex items-end">
          <button type="button" class="btn-danger w-full">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-6 gap-3 mt-3">
        <div>
          <label>Cost Type</label>
          <select class="w-full px-3 py-2 border rounded" onchange="toggleMonthlyFields(this)">
            <option value="one-time">One-time</option>
            <option value="milestone">Milestone</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div class="monthly-fields hidden">
          <label>Start Month</label>
          <input type="number" min="1" placeholder="1" class="w-full px-3 py-2 border rounded">
        </div>
        <div class="monthly-fields hidden">
          <label>End Month</label>
          <input type="number" min="1" placeholder="12" class="w-full px-3 py-2 border rounded">
        </div>
        <div>
          <label>Quantity</label>
          <input type="number" placeholder="1" class="w-full px-3 py-2 border rounded" 
            onchange="calculateMaterialCost(this)">
        </div>
        <div>
          <label>Unit Cost</label>
          <input type="number" placeholder="500.00" class="w-full px-3 py-2 border rounded" 
            onchange="calculateMaterialCost(this)">
        </div>
        <div>
          <label>Supplier</label>
          <input type="text" placeholder="Microsoft" class="w-full px-3 py-2 border rounded">
        </div>
        <div>
          <label>Apply G&A</label>
          <select class="w-full px-3 py-2 border rounded">
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>
        <div class="flex items-end">
          <div class="text-right w-full">
            <span class="text-xs text-gray-500">Total Cost</span>
            <div class="font-bold text-lg total-cost">$0.00</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <button type="button" onclick="addMaterialCost()" class="btn-secondary mt-4">
    <i class="fas fa-plus mr-2"></i> Add Material Cost
  </button>
  
  <!-- Summary -->
  <div class="mt-6 p-4 bg-green-50 rounded">
    <div class="flex justify-between items-center">
      <span class="font-medium">Total Material Cost:</span>
      <span class="text-2xl font-bold text-green-600" id="total-material">$0.00</span>
    </div>
  </div>
  
  <div class="mt-6 flex justify-between">
    <button type="button" onclick="ProjectWizard.previousStep()" class="btn-secondary">
      <i class="fas fa-arrow-left mr-2"></i> Previous
    </button>
    <button type="button" onclick="ProjectWizard.nextStep()" class="btn-primary">
      Next <i class="fas fa-arrow-right ml-2"></i>
    </button>
  </div>
</div>
```

### F. Step 5: Payment Schedule

```html
<div class="wizard-step" id="step-5">
  <h3>Payment Schedule</h3>
  <p class="text-gray-600 mb-4">Define billing milestones and invoice schedule</p>
  
  <div id="payment-schedule-list" class="space-y-3">
    <div class="payment-item border rounded p-4">
      <div class="grid grid-cols-5 gap-3">
        <div class="col-span-2">
          <label>Payment Description</label>
          <input type="text" placeholder="Initial Payment - 20%" class="w-full px-3 py-2 border rounded">
        </div>
        <div>
          <label>Linked Milestone</label>
          <select class="w-full px-3 py-2 border rounded">
            <option value="">None</option>
            <!-- From Step 2 -->
          </select>
        </div>
        <div>
          <label>Payment Date</label>
          <input type="date" class="w-full px-3 py-2 border rounded">
        </div>
        <div class="flex items-end">
          <button type="button" class="btn-danger w-full">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-3 mt-3">
        <div>
          <label>Invoice Amount</label>
          <input type="number" placeholder="50000.00" class="w-full px-3 py-2 border rounded" 
            onchange="calculatePaymentTotal()">
        </div>
        <div>
          <label>Invoice Number</label>
          <input type="text" placeholder="INV-001" class="w-full px-3 py-2 border rounded">
        </div>
        <div>
          <label>Status</label>
          <select class="w-full px-3 py-2 border rounded">
            <option value="pending">Pending</option>
            <option value="invoiced">Invoiced</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>
    </div>
  </div>
  
  <button type="button" onclick="addPayment()" class="btn-secondary mt-4">
    <i class="fas fa-plus mr-2"></i> Add Payment
  </button>
  
  <!-- Summary -->
  <div class="mt-6 p-4 bg-purple-50 rounded">
    <div class="space-y-2">
      <div class="flex justify-between">
        <span>Total Payments:</span>
        <span class="font-bold" id="total-payments">$0.00</span>
      </div>
      <div class="flex justify-between">
        <span>Expected Revenue:</span>
        <span class="font-bold" id="expected-revenue">$250,000.00</span>
      </div>
      <div class="flex justify-between text-lg">
        <span class="font-medium">Balance:</span>
        <span class="font-bold text-purple-600" id="payment-balance">$250,000.00</span>
      </div>
    </div>
  </div>
  
  <div class="mt-6 flex justify-between">
    <button type="button" onclick="ProjectWizard.previousStep()" class="btn-secondary">
      <i class="fas fa-arrow-left mr-2"></i> Previous
    </button>
    <button type="button" onclick="ProjectWizard.nextStep()" class="btn-primary">
      Next <i class="fas fa-arrow-right ml-2"></i>
    </button>
  </div>
</div>
```

### G. Step 6: Review & Create

```html
<div class="wizard-step" id="step-6">
  <h3>Review & Create Project</h3>
  <p class="text-gray-600 mb-4">Review all details before creating the project</p>
  
  <!-- Project Summary Card -->
  <div class="card p-6 mb-4">
    <h4 class="text-lg font-bold mb-3">Project Overview</h4>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <span class="text-gray-600">Project Code:</span>
        <span class="font-medium ml-2" id="review-code">-</span>
      </div>
      <div>
        <span class="text-gray-600">Project Name:</span>
        <span class="font-medium ml-2" id="review-name">-</span>
      </div>
      <div>
        <span class="text-gray-600">Client:</span>
        <span class="font-medium ml-2" id="review-client">-</span>
      </div>
      <div>
        <span class="text-gray-600">Duration:</span>
        <span class="font-medium ml-2" id="review-duration">-</span>
      </div>
      <div>
        <span class="text-gray-600">G&A Rate:</span>
        <span class="font-medium ml-2" id="review-ga">-</span>
      </div>
      <div>
        <span class="text-gray-600">Tax Rate:</span>
        <span class="font-medium ml-2" id="review-tax">-</span>
      </div>
    </div>
  </div>
  
  <!-- Cost Summary -->
  <div class="grid grid-cols-3 gap-4 mb-4">
    <div class="card p-4 bg-blue-50">
      <div class="text-sm text-gray-600 mb-1">Labour Costs</div>
      <div class="text-2xl font-bold text-blue-600" id="review-labour">$0</div>
      <div class="text-xs text-gray-500 mt-1" id="review-labour-items">0 items</div>
    </div>
    <div class="card p-4 bg-green-50">
      <div class="text-sm text-gray-600 mb-1">Material Costs</div>
      <div class="text-2xl font-bold text-green-600" id="review-material">$0</div>
      <div class="text-xs text-gray-500 mt-1" id="review-material-items">0 items</div>
    </div>
    <div class="card p-4 bg-purple-50">
      <div class="text-sm text-gray-600 mb-1">Total Cost</div>
      <div class="text-2xl font-bold text-purple-600" id="review-total">$0</div>
      <div class="text-xs text-gray-500 mt-1" id="review-milestones">0 milestones</div>
    </div>
  </div>
  
  <!-- Margin Analysis -->
  <div class="card p-6 mb-4">
    <h4 class="text-lg font-bold mb-3">Financial Analysis</h4>
    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <span class="text-gray-600">Expected Revenue:</span>
        <span class="text-xl font-bold" id="review-revenue">$0</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-gray-600">Total Cost:</span>
        <span class="text-xl font-bold" id="review-cost-total">$0</span>
      </div>
      <div class="border-t pt-3 flex justify-between items-center">
        <span class="font-medium">Estimated Margin:</span>
        <div class="text-right">
          <div class="text-2xl font-bold" id="review-margin-amount">$0</div>
          <div class="text-sm" id="review-margin-percent">0%</div>
        </div>
      </div>
    </div>
    
    <!-- Margin Alert -->
    <div id="margin-alert" class="mt-4 hidden">
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div class="flex">
          <i class="fas fa-exclamation-triangle text-yellow-400 mr-3"></i>
          <div>
            <p class="font-medium text-yellow-800">Margin Warning</p>
            <p class="text-sm text-yellow-700">Project margin is below 15%. Consider reviewing costs or increasing revenue.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Validation Messages -->
  <div id="validation-messages" class="mb-4">
    <!-- Dynamic validation alerts -->
  </div>
  
  <!-- Action Buttons -->
  <div class="mt-6 flex justify-between">
    <button type="button" onclick="ProjectWizard.previousStep()" class="btn-secondary">
      <i class="fas fa-arrow-left mr-2"></i> Previous
    </button>
    <div class="space-x-3">
      <button type="button" onclick="saveAsDraft()" class="btn-secondary">
        <i class="fas fa-save mr-2"></i> Save as Draft
      </button>
      <button type="button" onclick="ProjectWizard.submitProject()" class="btn-success">
        <i class="fas fa-check mr-2"></i> Create Project
      </button>
    </div>
  </div>
</div>
```

---

## 4. Additional Features

### A. Quick Project Templates

Pre-defined templates for common project types:

```javascript
const QuickTemplates = {
  'consulting-6m': {
    name: '6-Month Consulting Project',
    duration_months: 6,
    ga_percentage: 15,
    milestones: [
      { code: 'M01', name: 'Kickoff & Discovery', offset_days: 0 },
      { code: 'M02', name: 'Analysis & Planning', offset_days: 30 },
      { code: 'M03', name: 'Implementation Phase 1', offset_days: 90 },
      { code: 'M04', name: 'Implementation Phase 2', offset_days: 120 },
      { code: 'M05', name: 'Testing & QA', offset_days: 150 },
      { code: 'M06', name: 'Go-Live & Handover', offset_days: 180 }
    ],
    default_roles: [
      { role: 'Project Manager', hours: 240, level: 'C6' },
      { role: 'Consultant', hours: 600, level: 'C5' },
      { role: 'Business Analyst', hours: 400, level: 'C4' }
    ]
  },
  'software-dev-12m': {
    name: '12-Month Software Development',
    duration_months: 12,
    // ... similar structure
  }
};
```

### B. CSV/Excel Import

Allow bulk import of cost items:

```csv
WBS Code,Task Description,Rate Type,Personnel/Band,Hours,Apply G&A,Milestone
1.1,Project Management,actual,Sarah Mitchell,160,1,M01
1.2,Business Analysis,banded,C4,240,1,M01
2.1,Development,banded,C3,800,1,M02
```

### C. Validation Rules

```javascript
const ValidationRules = {
  projectBasics: {
    project_code: {
      required: true,
      pattern: /^PROJ-\d{4}-\d{3}$/,
      message: 'Format: PROJ-YYYY-NNN'
    },
    start_date: {
      required: true,
      validate: (val, data) => {
        return new Date(val) <= new Date(data.end_date);
      },
      message: 'Start date must be before end date'
    }
  },
  milestones: {
    minCount: 1,
    message: 'At least one milestone is required'
  },
  labourCosts: {
    minCount: 1,
    message: 'At least one labour cost item is required'
  },
  margin: {
    warningThreshold: 15,
    criticalThreshold: 5
  }
};
```

### D. Duplicate Project Feature

```javascript
async function duplicateProject(projectId) {
  const response = await api.request(`/projects/${projectId}/duplicate`, {
    method: 'POST',
    body: {
      new_project_code: 'PROJ-2025-NEW',
      new_project_name: 'Copy of Original Project',
      include_costs: true,
      include_milestones: true,
      include_payment_schedule: false,
      adjust_dates: {
        new_start_date: '2025-03-01',
        maintain_duration: true
      }
    }
  });
}
```

---

## 5. Implementation Priority

### Phase 1 (High Priority - Week 1)
1. ✅ Milestone management routes
2. ✅ Enhanced project creation with details
3. ✅ Basic wizard UI (Steps 1-3)
4. ✅ Personnel and rate bands pre-loading

### Phase 2 (Medium Priority - Week 2)
5. ✅ Complete wizard (Steps 4-6)
6. ✅ Validation and error handling
7. ✅ Cost calculations in real-time
8. ✅ Review and summary page

### Phase 3 (Nice to Have - Week 3)
9. ⏳ Project templates
10. ⏳ CSV/Excel import
11. ⏳ Project duplication
12. ⏳ Timeline visualization

---

## 6. Estimated Development Time

| Component | Time | Priority |
|-----------|------|----------|
| Backend API routes (milestones, bulk) | 4 hours | High |
| Enhanced project creation endpoint | 3 hours | High |
| Wizard UI framework | 6 hours | High |
| Steps 1-3 implementation | 8 hours | High |
| Steps 4-6 implementation | 6 hours | Medium |
| Validation & calculations | 4 hours | High |
| Templates system | 6 hours | Low |
| CSV import | 4 hours | Low |
| Testing & refinement | 6 hours | High |
| **Total** | **47 hours** | **~1 week** |

---

## 7. Success Criteria

✅ User can create a complete project from scratch  
✅ All milestones, costs, and payments are linked  
✅ Real-time cost calculations work  
✅ Validation prevents invalid data  
✅ Review page shows accurate summary  
✅ Project is created with all related data  
✅ No manual SQL or spreadsheet needed  
✅ Mobile-responsive interface  

---

This expansion will transform the application from a "data viewer" into a **complete project creation and management system**.
