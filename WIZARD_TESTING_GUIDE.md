# Project Creation Wizard - Testing Guide

## Overview

The 6-step project creation wizard has been fully implemented and integrated into the BTL Costing Application. This guide provides comprehensive testing instructions.

## Access Instructions

### Development Environment

**URL**: https://3000-itedfxbrbnbnmkdyi7ow9-2b54fc91.sandbox.novita.ai

**Demo Credentials**:
- **Admin**: admin@jl2group.com / admin123
- **Manager**: manager@jl2group.com / admin123
- **User**: user@jl2group.com / admin123

## Testing Workflow

### 1. Login

1. Navigate to the application URL
2. Enter credentials (Admin or Manager role required for project creation)
3. Click "Sign In"
4. Verify you're redirected to Dashboard

### 2. Launch Wizard

1. Click "Projects" in the sidebar navigation
2. Click the "New Project" button (blue button, top right)
3. Wizard should open in a modal overlay
4. Verify you see:
   - "Create New Project" header with close button (X)
   - Progress bar showing 6 steps
   - Step 1 highlighted in blue
   - "Project Basics" form visible

### 3. Step 1: Project Basics

**Test Fields:**

| Field | Test Value | Expected Behavior |
|-------|------------|-------------------|
| Project Code | `PROJ-2025-TEST-001` | Required field |
| Project Name | `Test Construction Project` | Required field |
| Client Name | `ABC Corporation` | Required field |
| Start Date | `2025-11-01` | Required, must be valid date |
| End Date | `2026-03-31` | Required, must be after start date |
| Tax Rate | `10` | Default 10%, can modify |
| G&A Percentage | `15` | Default 15%, can modify |
| G&A Application | `All Costs` | Dropdown: All Costs / Labour Only / Material Only |
| Total Revenue | `500000` | Expected project revenue |

**Validation Tests:**
- Try to proceed without filling required fields → Should show validation errors
- Try end date before start date → Should show error message
- Fill all fields correctly → "Next" button should work

**Action**: Click "Next" button

### 4. Step 2: Milestones

**Initial State:**
- Empty list (no milestones yet)
- "Add Milestone" button visible

**Test Actions:**

1. **Add First Milestone**
   - Click "Add Milestone"
   - Should see milestone form with fields:
     - Milestone Code (auto-filled: M01)
     - Milestone Name
     - Milestone Date
     - Description
   - Fill in:
     - Name: `Project Kickoff`
     - Date: `2025-11-15`
     - Description: `Initial project setup and planning`
   
2. **Add Second Milestone**
   - Click "Add Milestone" again
   - Should auto-increment to M02
   - Fill in:
     - Name: `Design Phase Complete`
     - Date: `2025-12-30`
   
3. **Add Third Milestone**
   - Name: `Construction Complete`
   - Date: `2026-02-28`
   
4. **Edit Milestone**
   - Try changing Milestone Name inline
   - Should update in real-time
   
5. **Remove Milestone**
   - Click remove button on one milestone
   - Should prompt for confirmation
   - Should remove from list after confirming

**Expected State:**
- At least 2-3 milestones defined
- Milestones shown in list format with all fields

**Action**: Click "Next" button

### 5. Step 3: Labour Costs

**Initial State:**
- Empty labour costs list
- "Add Task" button visible
- Total Labour Cost: $0.00

**Test Actions:**

1. **Add First Labour Item - Actual Rate**
   - Click "Add Task"
   - Fill in:
     - WBS Code: `1.1`
     - Task Description: `Project Management`
     - Rate Type: `Actual` (default)
     - Personnel: Select "Sarah Mitchell" (should show $185/hr)
     - Hours: `160`
     - Apply G&A: `Yes` (default)
   - **Expected Calculation**:
     - Base Cost: 160 × $185 = $29,600
     - G&A (15%): $4,440
     - Total: $34,040

2. **Add Second Labour Item - Banded Rate**
   - Click "Add Task"
   - Fill in:
     - WBS Code: `2.1`
     - Task Description: `Design Review`
     - Rate Type: Change to `Banded`
     - Rate Band: Select "C5 - Manager" ($165/hr)
     - Hours: `80`
     - Apply G&A: `Yes`
   - **Expected Calculation**:
     - Base Cost: 80 × $165 = $13,200
     - G&A (15%): $1,980
     - Total: $15,180

3. **Add Third Item - No G&A**
   - WBS: `3.1`
   - Description: `Site Survey`
   - Rate Type: `Actual`
   - Personnel: "James Thompson" ($165/hr)
   - Hours: `40`
   - Apply G&A: Change to `No`
   - **Expected Calculation**:
     - Base Cost: $6,600
     - G&A: $0
     - Total: $6,600

4. **Verify Total**
   - Total Labour Cost should show: $55,820

**Validation Tests:**
- Try changing rate type → Personnel/Rate Band dropdown should switch
- Try changing hours → Total should recalculate
- Try toggling G&A → Total should update

**Action**: Click "Next" button

### 6. Step 4: Material Costs

**Initial State:**
- Empty material costs list
- "Add Material Cost" button visible
- Total Material Cost: $0.00

**Test Actions:**

1. **Add One-time Material Cost**
   - Click "Add Material Cost"
   - Fill in:
     - Description: `Survey Equipment`
     - Cost Type: `One-time`
     - Quantity: `1`
     - Unit Cost: `5000`
     - Apply G&A: `Yes`
   - **Expected Calculation**:
     - Base: $5,000
     - G&A (15%): $750
     - Total: $5,750

2. **Add Monthly Material Cost**
   - Click "Add Material Cost"
   - Fill in:
     - Description: `Site Security`
     - Cost Type: `Monthly`
     - Start Month: `1`
     - End Month: `5`
     - Quantity: `1`
     - Unit Cost: `2000`
     - Apply G&A: `Yes`
   - **Expected Calculation**:
     - Months: 5
     - Base: 1 × $2,000 × 5 = $10,000
     - G&A (15%): $1,500
     - Total: $11,500

3. **Add Milestone Material Cost**
   - Description: `Final Inspection`
   - Cost Type: `Milestone`
   - Milestone: Select "Construction Complete"
   - Quantity: `1`
   - Unit Cost: `3000`
   - Apply G&A: `No`
   - **Expected**: $3,000

4. **Verify Total**
   - Total Material Cost: $20,250

**Action**: Click "Next" button

### 7. Step 5: Payment Schedule

**Initial State:**
- Empty payment schedule list
- "Add Payment" button visible
- Shows "Total Payments: $0"
- Shows "Expected Revenue: $500,000" (from Step 1)
- Shows "Balance: $500,000"

**Test Actions:**

1. **Add First Payment**
   - Click "Add Payment"
   - Fill in:
     - Description: `Initial Deposit`
     - Amount: `150000`
     - Due Date: `2025-11-15`
     - Milestone: Select "Project Kickoff"
     - Invoice Number: `INV-001`

2. **Add Second Payment**
   - Description: `Progress Payment 1`
   - Amount: `200000`
   - Due Date: `2025-12-30`
   - Milestone: "Design Phase Complete"
   - Invoice: `INV-002`

3. **Add Third Payment**
   - Description: `Final Payment`
   - Amount: `150000`
   - Due Date: `2026-02-28`
   - Milestone: "Construction Complete"
   - Invoice: `INV-003`

4. **Verify Totals**
   - Total Payments: $500,000
   - Expected Revenue: $500,000
   - Balance: $0 ✓

**Validation:**
- If balance is not zero, should show warning
- Payments should sum to expected revenue

**Action**: Click "Next" button

### 8. Step 6: Review & Create

**Expected Display:**

```
Project Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project Details:
  Code: PROJ-2025-TEST-001
  Name: Test Construction Project
  Client: ABC Corporation
  Duration: 2025-11-01 to 2026-03-31
  Tax Rate: 10%
  G&A Percentage: 15%

Financial Summary:
  Total Labour Cost: $55,820
  Total Material Cost: $20,250
  Total Project Cost: $76,070
  
  Expected Revenue: $500,000
  Profit Margin: $423,930
  Margin Percentage: 84.8% ✓
  
Status Indicators:
  ✓ Milestones: 3 defined
  ✓ Labour Items: 3 defined
  ✓ Material Items: 3 defined
  ✓ Payment Schedule: 3 payments totaling $500,000
  ✓ All validations passed
```

**Validation Display:**
- Green checkmarks for completed sections
- Red warnings if margin < 15%
- List of any validation errors

**Test Actions:**

1. **Review All Data**
   - Scroll through summary
   - Verify all numbers match your inputs
   - Check margin percentage calculation

2. **Create Project**
   - Click "Create Project" button
   - Should show loading indicator
   - Should disable button during submission

**Expected Result:**
- Success alert with project ID
- Wizard closes automatically
- Redirected to Projects view
- New project appears in projects table

### 9. Verify Created Project

**In Projects View:**

1. Find your new project in the table
2. Verify all fields are correct:
   - Project Code: PROJ-2025-TEST-001
   - Status: Active
   - Total Cost: $76,070
   - Revenue: $500,000
   - Margin: 84.8%

3. Click "View" button on the project
4. Verify project details modal shows:
   - All project information
   - Milestones count
   - Cost summary

**Database Verification:**

```bash
# Check project was created
cd /home/user/webapp
npm run db:console:local

# Query the data
SELECT * FROM projects WHERE project_code = 'PROJ-2025-TEST-001';
SELECT * FROM milestones WHERE project_id = (SELECT id FROM projects WHERE project_code = 'PROJ-2025-TEST-001');
SELECT * FROM cost_line_items WHERE project_id = (SELECT id FROM projects WHERE project_code = 'PROJ-2025-TEST-001');
SELECT * FROM material_costs WHERE project_id = (SELECT id FROM projects WHERE project_code = 'PROJ-2025-TEST-001');
SELECT * FROM payment_schedule WHERE project_id = (SELECT id FROM projects WHERE project_code = 'PROJ-2025-TEST-001');
```

## Edge Cases & Error Testing

### Test Wizard Close

1. Start wizard
2. Fill in some data (don't complete)
3. Click X button to close
4. Should prompt: "Close wizard? All unsaved changes will be lost."
5. Confirm → Wizard should close, data discarded
6. Re-open wizard → Should start fresh

### Test Validation Errors

1. **Step 1**: Try to proceed with end date before start date
2. **Step 2**: Try to proceed with no milestones (optional, but recommended)
3. **Step 3**: Create labour item with 0 hours
4. **Step 5**: Create payment schedule that doesn't match revenue

### Test Backend API Directly

```bash
# Get authentication token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jl2group.com","password":"admin123"}' \
  2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Test milestones endpoint
curl -X GET "http://localhost:3000/api/milestones?project_id=1" \
  -H "Authorization: Bearer $TOKEN" | jq

# Test rate-bands endpoint
curl -X GET "http://localhost:3000/api/rate-bands?active=true" \
  -H "Authorization: Bearer $TOKEN" | jq

# Test project with details endpoint
curl -X POST http://localhost:3000/api/projects/with-details \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project": {
      "project_code": "TEST-API-001",
      "project_name": "API Test Project",
      "client_name": "Test Client",
      "start_date": "2025-11-01",
      "end_date": "2026-03-31",
      "tax_rate": 0.10,
      "ga_percentage": 0.15,
      "total_revenue": 100000
    },
    "milestones": [
      {
        "milestone_code": "M01",
        "milestone_name": "Start",
        "milestone_date": "2025-11-01"
      }
    ],
    "labour_costs": [
      {
        "wbs_code": "1.1",
        "task_description": "Test Task",
        "rate_type": "actual",
        "personnel_id": 1,
        "hours": 100,
        "hourly_rate": 185,
        "apply_ga": 1
      }
    ],
    "material_costs": [],
    "payment_schedule": []
  }' | jq
```

## Known Issues & Limitations

### Current Limitations

1. **No Edit Mode**: Wizard only creates new projects, cannot edit existing
2. **No Draft Save**: Cannot save and resume wizard later
3. **Limited Validation**: Some validation only happens on backend
4. **No Undo**: Cannot go back after creating project (must delete and recreate)

### Browser Compatibility

Tested on:
- ✓ Chrome 120+
- ✓ Firefox 121+
- ✓ Safari 17+
- ✓ Edge 120+

### Performance

- Wizard loads reference data (personnel, rate bands) on init
- Large data sets (100+ personnel) may slow down dropdowns
- Real-time calculations are synchronous (no delay expected)

## Troubleshooting

### Wizard Doesn't Open

**Symptoms**: Clicking "New Project" does nothing

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify wizard.js and wizard-helpers.js are loaded
3. Check Network tab for failed script loads
4. Hard refresh (Ctrl+Shift+R) to clear cache

**Debug**:
```javascript
// In browser console
console.log(window.ProjectWizard); // Should show object, not undefined
```

### Wizard Opens But Shows Blank

**Symptoms**: Modal opens but content is empty

**Solutions**:
1. Check if API endpoints are accessible
2. Verify authentication token is valid
3. Check browser console for API errors

**Debug**:
```javascript
// Check reference data
api.getPersonnel().then(console.log);
api.request('/rate-bands?active=true').then(console.log);
```

### Calculations Don't Update

**Symptoms**: Changing values doesn't update totals

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify calculation functions are defined
3. Try refreshing the page

**Debug**:
```javascript
// Test calculation
ProjectWizard.calculateTotalLabour(); // Should return number
ProjectWizard.calculateTotalMaterial(); // Should return number
```

### Submit Fails

**Symptoms**: "Create Project" button doesn't work or shows error

**Solutions**:
1. Check validation messages in Step 6
2. Verify all required fields filled
3. Check browser console for API errors
4. Verify backend is running

**Debug**:
```bash
# Check backend logs
pm2 logs webapp --nostream

# Test API endpoint directly
curl -X POST http://localhost:3000/api/projects/with-details \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project":{...}}' 
```

## Success Criteria

✅ **Wizard Integration**: Opens from Projects view
✅ **Step Navigation**: Can move forward/backward through all 6 steps
✅ **Data Entry**: All forms accept input and validate
✅ **Calculations**: Real-time updates work correctly
✅ **Submit**: Creates project with all related data
✅ **Verification**: Project appears in database and UI

## Next Steps After Testing

1. **Document Issues**: Report any bugs or UX issues found
2. **UI Improvements**: Suggest enhancements to forms or layout
3. **Additional Features**: Recommend new functionality
4. **Production Deployment**: Deploy to Cloudflare Pages once stable

## Contact

For issues or questions during testing:
- Check PM2 logs: `pm2 logs webapp --nostream`
- Review browser console for errors
- Test API endpoints directly with curl
- Report findings to development team

---

**Last Updated**: October 15, 2025
**Version**: 1.0
**Status**: Ready for Testing
