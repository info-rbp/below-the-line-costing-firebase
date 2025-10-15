# BTL Costing App - Project Creation Expansion Summary

## 🎯 What's Missing vs What's Needed

### Current State ❌
```
User clicks "New Project" 
    ↓
Simple alert: "To be implemented"
    ↓
No way to create project from scratch
    ↓
Must use direct API calls or database
```

### Desired State ✅
```
User clicks "New Project"
    ↓
Multi-step wizard opens
    ↓
Step 1: Enter project basics (name, client, dates, G&A)
    ↓
Step 2: Define milestones (M01, M02, M03...)
    ↓
Step 3: Add labour costs (WBS, resources, hours)
    ↓
Step 4: Add material costs (licenses, travel, etc.)
    ↓
Step 5: Set payment schedule (invoices, dates)
    ↓
Step 6: Review summary with margin calculation
    ↓
Click "Create Project" → All data saved in one transaction
    ↓
Redirect to project detail page
```

---

## 📦 Required Components

### 1. Backend API Additions (6 new routes)

```
NEW: /api/milestones
├─ GET    /api/milestones?project_id=1
├─ POST   /api/milestones
├─ PUT    /api/milestones/:id
├─ DELETE /api/milestones/:id
└─ POST   /api/milestones/bulk

NEW: /api/projects/with-details
└─ POST   Create project with all related data

NEW: /api/rate-bands
├─ GET    List rate bands
├─ POST   Create rate band
└─ PUT    Update rate band

NEW: /api/bulk/cost-items
└─ POST   Bulk create labour costs

NEW: /api/bulk/materials
└─ POST   Bulk create material costs

NEW: /api/projects/:id/duplicate
└─ POST   Duplicate existing project
```

### 2. Frontend Wizard (6 steps)

```html
<div class="wizard">
  <div class="wizard-header">
    [Step 1] → [Step 2] → [Step 3] → [Step 4] → [Step 5] → [Step 6]
     Basics     Milestones   Labour    Material   Payments   Review
  </div>
  
  <div class="wizard-body">
    <!-- Current step content -->
  </div>
  
  <div class="wizard-footer">
    <button>Previous</button>
    <button>Next / Create</button>
  </div>
</div>
```

### 3. State Management

```javascript
ProjectWizard = {
  currentStep: 1,
  projectData: {
    project: {
      project_code: "PROJ-2025-002",
      project_name: "New Initiative",
      client_name: "Client ABC",
      start_date: "2025-02-01",
      end_date: "2025-12-31",
      tax_rate: 0.10,
      ga_percentage: 0.15,
      total_revenue: 500000
    },
    milestones: [
      { milestone_code: "M01", milestone_name: "Kickoff", ... },
      { milestone_code: "M02", milestone_name: "Phase 1", ... }
    ],
    labour_costs: [
      { wbs_code: "1.1", task_description: "PM", hours: 80, ... }
    ],
    material_costs: [
      { material_description: "Licenses", cost_type: "monthly", ... }
    ],
    payment_schedule: [
      { payment_description: "Initial", invoice_amount: 100000, ... }
    ]
  }
}
```

---

## 🔄 User Journey

### Scenario: Creating a 6-Month Consulting Project

```
1️⃣ STEP 1: Project Basics (2 minutes)
   Input:
   - Project Code: PROJ-2025-005
   - Name: Digital Transformation
   - Client: Government Dept
   - Dates: 2025-03-01 to 2025-08-31
   - G&A: 15%, Tax: 10%
   - Revenue: $500,000
   
   Click "Next" →

2️⃣ STEP 2: Milestones (3 minutes)
   Add 6 milestones:
   - M01: Kickoff (2025-03-01)
   - M02: Discovery (2025-03-15)
   - M03: Design (2025-04-15)
   - M04: Implementation (2025-06-01)
   - M05: Testing (2025-07-15)
   - M06: Go-Live (2025-08-31)
   
   See timeline visualization
   Click "Next" →

3️⃣ STEP 3: Labour Costs (5 minutes)
   Add tasks:
   - 1.1 Project Management → Sarah Mitchell (C6) → 160 hrs → $185/hr
   - 1.2 Business Analysis → C4 Band → 240 hrs → $145/hr
   - 2.1 Development → C3 Band → 800 hrs → $135/hr
   
   Real-time calculation:
   Labour Total: $189,800 (with G&A)
   
   Click "Next" →

4️⃣ STEP 4: Material Costs (3 minutes)
   Add materials:
   - Software Licenses → Monthly → 6 months → $500/month
   - Travel & Accommodation → One-time → $10,000
   - Training Materials → Milestone M06 → $2,500
   
   Material Total: $16,025 (with G&A)
   
   Click "Next" →

5️⃣ STEP 5: Payment Schedule (2 minutes)
   Add payments:
   - Initial Payment (M01) → $100,000 (20%)
   - Phase 1 (M03) → $150,000 (30%)
   - Phase 2 (M05) → $150,000 (30%)
   - Final (M06) → $100,000 (20%)
   
   Total Payments: $500,000 ✅
   
   Click "Next" →

6️⃣ STEP 6: Review & Create (1 minute)
   Summary:
   ┌─────────────────────────────────┐
   │ Project: PROJ-2025-005         │
   │ Client: Government Dept        │
   │ Duration: 6 months             │
   │                                │
   │ Labour:    $189,800           │
   │ Material:   $16,025           │
   │ ─────────────────────────     │
   │ Total Cost: $205,825          │
   │                                │
   │ Revenue:    $500,000          │
   │ Margin:     $294,175 (59%)    │
   └─────────────────────────────────┘
   
   ✅ All validations passed
   ✅ Margin above 15% threshold
   
   Click "Create Project" →
   
   ✅ Project created successfully!
   Redirect to project detail page
```

Total Time: **~15 minutes** to create complete project

---

## 💰 Cost Calculation Logic

### Real-time Calculation Example

```javascript
// Step 3: Adding labour cost item
Input:
- Task: Project Management
- Resource: Sarah Mitchell (C6 - $185/hr)
- Hours: 160
- Apply G&A: Yes
- Project G&A: 15%

Calculation:
1. Base Cost = Hours × Rate
   = 160 × $185 = $29,600

2. G&A Cost = Base Cost × G&A%
   = $29,600 × 0.15 = $4,440

3. Total Cost = Base Cost + G&A
   = $29,600 + $4,440 = $34,040

Display immediately: "$34,040"
Add to running total: Update "Total Labour: $34,040"
```

### Project-Level Calculation

```javascript
// Step 6: Review summary
Project Data:
- Total Labour Cost: $189,800
- Total Material Cost: $16,025
- Total Cost: $205,825
- Expected Revenue: $500,000

Margin Calculation:
Margin Amount = Revenue - Total Cost
              = $500,000 - $205,825
              = $294,175

Margin % = (Margin Amount / Revenue) × 100
         = ($294,175 / $500,000) × 100
         = 59%

Result: ✅ Healthy margin (above 15% threshold)
```

---

## 🎨 UI/UX Features

### Progress Indicator
```
[●━━━━━] Step 1/6: Project Basics
[●●━━━━] Step 2/6: Milestones
[●●●━━━] Step 3/6: Labour Costs
[●●●●━━] Step 4/6: Material Costs
[●●●●●━] Step 5/6: Payment Schedule
[●●●●●●] Step 6/6: Review & Create
```

### Real-time Validation
```
✅ Project code format valid (PROJ-2025-NNN)
❌ End date must be after start date
⚠️  No milestones defined yet
✅ Total payments match revenue
⚠️  Margin below 15% - review costs
```

### Smart Defaults
```
- G&A: 15% (from last project)
- Tax: 10% (from last project)
- Milestone naming: M01, M02, M03... (auto-increment)
- WBS codes: 1.1, 1.2, 2.1... (auto-suggest)
```

### Keyboard Navigation
```
Tab: Move to next field
Shift+Tab: Move to previous field
Ctrl+Enter: Next step
Ctrl+S: Save draft
Esc: Cancel wizard
```

---

## 📊 Data Flow Diagram

```
Frontend Wizard
      │
      │ User inputs data across 6 steps
      │ JavaScript validates and calculates
      │
      ▼
ProjectWizard.projectData = {
  project: {...},
  milestones: [...],
  labour_costs: [...],
  material_costs: [...],
  payment_schedule: [...]
}
      │
      │ User clicks "Create Project"
      │
      ▼
POST /api/projects/with-details
      │
      │ Single API call with all data
      │
      ▼
Backend (Hono)
      │
      ├─ 1. Validate all inputs
      │
      ├─ 2. Begin transaction
      │
      ├─ 3. Create project → Get project_id
      │
      ├─ 4. Create milestones → Get milestone_ids
      │
      ├─ 5. Create labour costs (link milestone_ids)
      │
      ├─ 6. Create material costs (link milestone_ids)
      │
      ├─ 7. Create payment schedule (link milestone_ids)
      │
      ├─ 8. Recalculate project totals
      │
      ├─ 9. Commit transaction
      │
      └─ 10. Return success + project_id
      │
      ▼
Frontend receives response
      │
      ├─ Show success message
      │
      └─ Redirect to /projects/{id}
```

---

## 🚀 Quick Start Templates

### Template: Standard Consulting Project
```json
{
  "name": "6-Month Consulting",
  "duration_months": 6,
  "ga_percentage": 15,
  "milestones": 6,
  "default_roles": [
    { "role": "Project Manager", "hours": 240, "level": "C6" },
    { "role": "Consultant", "hours": 600, "level": "C5" },
    { "role": "Analyst", "hours": 400, "level": "C4" }
  ],
  "estimated_revenue": "$500,000"
}
```

**Benefit:** User fills in 5 fields, gets 80% of project pre-configured

---

## ✅ Acceptance Criteria

| Criteria | Status |
|----------|--------|
| Create project with basic info | ⏳ To implement |
| Define multiple milestones | ⏳ To implement |
| Add labour costs with actual/banded rates | ⏳ To implement |
| Add material costs with classifications | ⏳ To implement |
| Set payment schedule | ⏳ To implement |
| Real-time cost calculations | ⏳ To implement |
| Margin validation and warnings | ⏳ To implement |
| Single transaction creates all data | ⏳ To implement |
| Validation prevents invalid data | ⏳ To implement |
| Mobile-responsive wizard | ⏳ To implement |

---

## 🎯 Development Timeline

### Week 1: Core Functionality
- ✅ Day 1-2: Backend API routes (milestones, with-details)
- ✅ Day 3-4: Wizard framework + Steps 1-3
- ✅ Day 5: Testing and refinement

### Week 2: Complete Features
- ✅ Day 6-7: Steps 4-6 + validation
- ✅ Day 8: Real-time calculations
- ✅ Day 9-10: Polish, testing, documentation

**Total:** 10 days (~80 hours)

---

## 📝 Implementation Checklist

### Phase 1: Backend (High Priority)
- [ ] Create `src/routes/milestones.ts`
- [ ] Add bulk operations to `src/routes/projects.ts`
- [ ] Implement `POST /api/projects/with-details`
- [ ] Add transaction support for atomic operations
- [ ] Create `src/routes/rate-bands.ts`
- [ ] Test all API endpoints

### Phase 2: Frontend Wizard (High Priority)
- [ ] Create wizard framework in `public/static/wizard.js`
- [ ] Implement Step 1: Project Basics form
- [ ] Implement Step 2: Milestones builder
- [ ] Implement Step 3: Labour costs builder
- [ ] Implement Step 4: Material costs builder
- [ ] Implement Step 5: Payment schedule builder
- [ ] Implement Step 6: Review & create summary
- [ ] Add real-time validation
- [ ] Add cost calculations
- [ ] Connect wizard to API endpoints

### Phase 3: Enhancements (Medium Priority)
- [ ] Add project templates system
- [ ] Implement CSV import
- [ ] Add project duplication
- [ ] Add timeline visualization
- [ ] Add save as draft functionality
- [ ] Add keyboard shortcuts

### Phase 4: Testing & Polish (High Priority)
- [ ] Test complete project creation flow
- [ ] Test validation rules
- [ ] Test calculation accuracy
- [ ] Mobile responsiveness testing
- [ ] Performance optimization
- [ ] User documentation

---

## 🎊 Expected Benefits

### Before Expansion
❌ Users cannot create projects in the UI  
❌ Must use API directly or database  
❌ No guided workflow  
❌ High error rate from manual entry  
❌ Steep learning curve  

### After Expansion
✅ Complete project creation in ~15 minutes  
✅ Guided step-by-step workflow  
✅ Real-time validation and calculations  
✅ Zero database knowledge needed  
✅ Intuitive and self-explanatory  
✅ Mobile-friendly interface  
✅ Templates for common projects  
✅ Duplicate existing projects  

---

## 📞 Support & Questions

For detailed implementation specs, see:
- `PROJECT_CREATION_EXPANSION.md` - Full technical specification
- `README.md` - General application documentation

Ready to implement! 🚀
