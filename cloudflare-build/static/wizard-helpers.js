// BTL Costing Wizard - Helper Functions and Remaining Steps
// Part 2: Step 5, Step 6, and all utility functions

// Add to ProjectWizard object

Object.assign(ProjectWizard, {
  // Step 5: Payment Schedule
  renderStep5() {
    return `
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        <i class="fas fa-money-bill text-blue-600 mr-2"></i>
        Payment Schedule
      </h2>
      <p class="text-gray-600 mb-6">Define billing milestones and invoice schedule</p>
      
      <div id="payment-schedule-list" class="space-y-4 mb-6">
        ${this.projectData.payment_schedule.map((item, idx) => this.renderPaymentItem(item, idx)).join('')}
        ${this.projectData.payment_schedule.length === 0 ? '<p class="text-gray-500 text-center py-8">No payments added yet. Click "Add Payment" to get started.</p>' : ''}
      </div>
      
      <button type="button" onclick="ProjectWizard.addPayment()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
        <i class="fas fa-plus mr-2"></i> Add Payment
      </button>
      
      <div class="mt-6 p-4 bg-purple-50 rounded-lg">
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-700">Total Payments:</span>
            <span class="font-bold">$${this.calculateTotalPayments().toLocaleString()}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-700">Expected Revenue:</span>
            <span class="font-bold">$${parseFloat(this.projectData.project.total_revenue || 0).toLocaleString()}</span>
          </div>
          <div class="flex justify-between text-lg pt-2 border-t border-purple-200">
            <span class="font-medium">Balance:</span>
            <span class="font-bold ${this.getPaymentBalance() === 0 ? 'text-green-600' : 'text-red-600'}">
              $${Math.abs(this.getPaymentBalance()).toLocaleString()} ${this.getPaymentBalance() > 0 ? '(Remaining)' : this.getPaymentBalance() < 0 ? '(Over)' : ''}
            </span>
          </div>
        </div>
      </div>
    `;
  },
  
  renderPaymentItem(item, index) {
    const milestoneOptions = this.projectData.milestones.map(m => 
      `<option value="${m.milestone_code}" ${item.milestone_code === m.milestone_code ? 'selected' : ''}>${m.milestone_code} - ${m.milestone_name}</option>`
    ).join('');
    
    return `
      <div class="border border-gray-300 rounded-lg p-4 bg-white" data-payment-index="${index}">
        <div class="grid grid-cols-5 gap-3">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Payment Description</label>
            <input type="text" value="${item.payment_description || ''}"
              onchange="ProjectWizard.updatePayment(${index}, 'payment_description', this.value)"
              placeholder="Initial Payment - 20%"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Linked Milestone</label>
            <select onchange="ProjectWizard.updatePayment(${index}, 'milestone_code', this.value)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">None</option>
              ${milestoneOptions}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
            <input type="date" value="${item.payment_date || ''}"
              onchange="ProjectWizard.updatePayment(${index}, 'payment_date', this.value)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          </div>
          <div class="flex items-end">
            <button type="button" onclick="ProjectWizard.removePayment(${index})"
              class="w-full bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition text-sm">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3 mt-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Amount</label>
            <input type="number" value="${item.invoice_amount || 0}" step="0.01" min="0"
              onchange="ProjectWizard.updatePayment(${index}, 'invoice_amount', parseFloat(this.value))"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
            <input type="text" value="${item.invoice_number || ''}"
              onchange="ProjectWizard.updatePayment(${index}, 'invoice_number', this.value)"
              placeholder="INV-001"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select onchange="ProjectWizard.updatePayment(${index}, 'payment_status', this.value)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="pending" ${item.payment_status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="invoiced" ${item.payment_status === 'invoiced' ? 'selected' : ''}>Invoiced</option>
              <option value="paid" ${item.payment_status === 'paid' ? 'selected' : ''}>Paid</option>
            </select>
          </div>
        </div>
      </div>
    `;
  },
  
  // Step 6: Review & Create
  renderStep6() {
    const totalLabour = this.calculateTotalLabour();
    const totalMaterial = this.calculateTotalMaterial();
    const totalCost = totalLabour + totalMaterial;
    const revenue = parseFloat(this.projectData.project.total_revenue || 0);
    const margin = revenue - totalCost;
    const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;
    
    return `
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        <i class="fas fa-check text-blue-600 mr-2"></i>
        Review & Create Project
      </h2>
      <p class="text-gray-600 mb-6">Review all details before creating the project</p>
      
      <!-- Project Summary -->
      <div class="bg-white border border-gray-300 rounded-lg p-6 mb-4">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Project Overview</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><span class="text-gray-600">Project Code:</span> <span class="font-medium ml-2">${this.projectData.project.project_code}</span></div>
          <div><span class="text-gray-600">Project Name:</span> <span class="font-medium ml-2">${this.projectData.project.project_name}</span></div>
          <div><span class="text-gray-600">Client:</span> <span class="font-medium ml-2">${this.projectData.project.client_name}</span></div>
          <div><span class="text-gray-600">Duration:</span> <span class="font-medium ml-2">${this.projectData.project.start_date} to ${this.projectData.project.end_date}</span></div>
          <div><span class="text-gray-600">G&A Rate:</span> <span class="font-medium ml-2">${(this.projectData.project.ga_percentage * 100).toFixed(1)}%</span></div>
          <div><span class="text-gray-600">Tax Rate:</span> <span class="font-medium ml-2">${(this.projectData.project.tax_rate * 100).toFixed(1)}%</span></div>
        </div>
      </div>
      
      <!-- Cost Summary -->
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="text-sm text-gray-600 mb-1">Labour Costs</div>
          <div class="text-2xl font-bold text-blue-600">$${totalLabour.toLocaleString()}</div>
          <div class="text-xs text-gray-500 mt-1">${this.projectData.labour_costs.length} items</div>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="text-sm text-gray-600 mb-1">Material Costs</div>
          <div class="text-2xl font-bold text-green-600">$${totalMaterial.toLocaleString()}</div>
          <div class="text-xs text-gray-500 mt-1">${this.projectData.material_costs.length} items</div>
        </div>
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div class="text-sm text-gray-600 mb-1">Total Cost</div>
          <div class="text-2xl font-bold text-purple-600">$${totalCost.toLocaleString()}</div>
          <div class="text-xs text-gray-500 mt-1">${this.projectData.milestones.length} milestones</div>
        </div>
      </div>
      
      <!-- Financial Analysis -->
      <div class="bg-white border border-gray-300 rounded-lg p-6 mb-4">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Financial Analysis</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Expected Revenue:</span>
            <span class="text-xl font-bold">$${revenue.toLocaleString()}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Total Cost:</span>
            <span class="text-xl font-bold">$${totalCost.toLocaleString()}</span>
          </div>
          <div class="border-t pt-3 flex justify-between items-center">
            <span class="font-medium">Estimated Margin:</span>
            <div class="text-right">
              <div class="text-2xl font-bold ${marginPercent < 5 ? 'text-red-600' : marginPercent < 15 ? 'text-yellow-600' : 'text-green-600'}">
                $${margin.toLocaleString()}
              </div>
              <div class="text-sm ${marginPercent < 5 ? 'text-red-600' : marginPercent < 15 ? 'text-yellow-600' : 'text-green-600'}">
                ${marginPercent.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
        
        ${marginPercent < 15 ? `
          <div class="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div class="flex">
              <i class="fas fa-exclamation-triangle text-yellow-600 mr-3 mt-1"></i>
              <div>
                <p class="font-medium text-yellow-800">Margin Warning</p>
                <p class="text-sm text-yellow-700">Project margin is ${marginPercent < 5 ? 'critically low' : 'below 15%'}. Consider reviewing costs or increasing revenue.</p>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
      
      <!-- Validation Summary -->
      <div class="bg-white border border-gray-300 rounded-lg p-6 mb-4">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Validation Summary</h3>
        <div class="space-y-2 text-sm">
          ${this.validateProject().map(v => `
            <div class="flex items-center">
              <i class="fas ${v.valid ? 'fa-check-circle text-green-600' : 'fa-exclamation-circle text-red-600'} mr-2"></i>
              <span class="${v.valid ? 'text-green-700' : 'text-red-700'}">${v.message}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Approval Workflow Options -->
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-clipboard-check text-blue-600 mr-2"></i>
          Project Approval Options
        </h3>
        <p class="text-sm text-gray-600 mb-4">Choose how to handle this project after creation:</p>
        
        <div class="space-y-3">
          <label class="flex items-start p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 cursor-pointer transition">
            <input type="radio" name="approval_action" value="save_draft" checked
                   onchange="ProjectWizard.setApprovalAction('save_draft')"
                   class="mt-1 mr-3">
            <div class="flex-1">
              <div class="font-medium text-gray-800">
                <i class="fas fa-save text-gray-600 mr-2"></i> Save as Draft
              </div>
              <div class="text-sm text-gray-600 mt-1">
                Save the project in draft status. You can edit and submit for approval later.
              </div>
            </div>
          </label>
          
          <label class="flex items-start p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-green-400 cursor-pointer transition">
            <input type="radio" name="approval_action" value="create_active"
                   onchange="ProjectWizard.setApprovalAction('create_active')"
                   class="mt-1 mr-3">
            <div class="flex-1">
              <div class="font-medium text-gray-800">
                <i class="fas fa-check-circle text-green-600 mr-2"></i> Create as Active (Self-Approve)
              </div>
              <div class="text-sm text-gray-600 mt-1">
                Create the project with active status immediately. No approval workflow required.
              </div>
              ${state.user?.role !== 'admin' && state.user?.role !== 'manager' ? `
                <div class="text-xs text-orange-600 mt-1">
                  <i class="fas fa-info-circle mr-1"></i> Note: Typically requires Manager or Admin privileges
                </div>
              ` : ''}
            </div>
          </label>
          
          <label class="flex items-start p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-400 cursor-pointer transition">
            <input type="radio" name="approval_action" value="submit_approval"
                   onchange="ProjectWizard.setApprovalAction('submit_approval')"
                   class="mt-1 mr-3">
            <div class="flex-1">
              <div class="font-medium text-gray-800">
                <i class="fas fa-paper-plane text-purple-600 mr-2"></i> Submit for Manager Approval
              </div>
              <div class="text-sm text-gray-600 mt-1">
                Submit the project to a manager for review and approval.
              </div>
            </div>
          </label>
        </div>
        
        <!-- Comments field (shown for all options) -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Comments / Notes (Optional)
          </label>
          <textarea id="approval_comments" rows="3"
                    placeholder="Add any comments or notes about this project..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
        </div>
      </div>
    `;
  },
  
  setApprovalAction(action) {
    this.approvalAction = action;
  },
  
  // Navigation methods
  nextStep() {
    if (!this.validateCurrentStep()) {
      return;
    }
    
    // Save current step data
    this.saveCurrentStep();
    
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.render();
      window.scrollTo(0, 0);
    }
  },
  
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.render();
      window.scrollTo(0, 0);
    }
  },
  
  // Save current step data
  saveCurrentStep() {
    if (this.currentStep === 1) {
      const form = document.getElementById('step1Form');
      if (form) {
        const formData = new FormData(form);
        const clientId = formData.get('client_id');
        
        this.projectData.project = {
          project_code: formData.get('project_code'),
          project_name: formData.get('project_name'),
          client_id: clientId && clientId !== 'new' && clientId !== '' ? parseInt(clientId) : null,
          client_name: clientId === 'new' || clientId === '' ? formData.get('client_name') : this.projectData.project.client_name,
          start_date: formData.get('start_date'),
          end_date: formData.get('end_date'),
          status: formData.get('status'),
          approval_status: 'draft',
          tax_rate: parseFloat(formData.get('tax_rate')) / 100,
          ga_percentage: parseFloat(formData.get('ga_percentage')) / 100,
          ga_application: formData.get('ga_application'),
          total_revenue: parseFloat(formData.get('total_revenue')) || 0
        };
      }
    }
  },
  
  // Validation
  validateCurrentStep() {
    if (this.currentStep === 1) {
      const form = document.getElementById('step1Form');
      if (!form || !form.checkValidity()) {
        form?.reportValidity();
        return false;
      }
      
      const formData = new FormData(form);
      const startDate = new Date(formData.get('start_date'));
      const endDate = new Date(formData.get('end_date'));
      
      if (endDate <= startDate) {
        alert('End date must be after start date');
        return false;
      }
    }
    
    if (this.currentStep === 2 && this.projectData.milestones.length === 0) {
      if (!confirm('No milestones added. Continue without milestones?')) {
        return false;
      }
    }
    
    if (this.currentStep === 3 && this.projectData.labour_costs.length === 0) {
      if (!confirm('No labour costs added. Continue without labour costs?')) {
        return false;
      }
    }
    
    return true;
  },
  
  validateProject() {
    const validations = [];
    
    // Basic project info
    validations.push({
      valid: !!this.projectData.project.project_code,
      message: 'Project code is set'
    });
    
    validations.push({
      valid: !!this.projectData.project.project_name,
      message: 'Project name is set'
    });
    
    validations.push({
      valid: !!this.projectData.project.client_name,
      message: 'Client name is set'
    });
    
    // Dates
    const startDate = new Date(this.projectData.project.start_date);
    const endDate = new Date(this.projectData.project.end_date);
    validations.push({
      valid: endDate > startDate,
      message: 'End date is after start date'
    });
    
    // Milestones
    validations.push({
      valid: this.projectData.milestones.length > 0,
      message: `${this.projectData.milestones.length} milestone(s) defined`
    });
    
    // Costs
    validations.push({
      valid: this.projectData.labour_costs.length > 0 || this.projectData.material_costs.length > 0,
      message: 'At least one cost item defined'
    });
    
    // Payments
    const totalPayments = this.calculateTotalPayments();
    const revenue = parseFloat(this.projectData.project.total_revenue || 0);
    validations.push({
      valid: totalPayments === revenue || this.projectData.payment_schedule.length === 0,
      message: totalPayments === revenue ? 'Payments match revenue' : 'Payments do not match revenue (optional)'
    });
    
    return validations;
  },
  
  // Milestone methods
  addMilestone(parentMilestoneCode = null) {
    let milestone_code;
    let milestone_level = 0;
    let milestone_path = '';
    
    if (parentMilestoneCode) {
      // Adding a sub-milestone
      const parent = this.projectData.milestones.find(m => m.milestone_code === parentMilestoneCode);
      if (parent) {
        milestone_level = (parent.milestone_level || 0) + 1;
        const childCount = this.projectData.milestones.filter(m => m.parent_milestone_id === parentMilestoneCode).length;
        milestone_code = `${parentMilestoneCode}.${childCount + 1}`;
        milestone_path = parent.milestone_path ? `${parent.milestone_path}.${milestone_code}` : milestone_code;
        
        // Mark parent as having children
        parent.is_parent = true;
      }
    } else {
      // Adding a root milestone
      const rootCount = this.projectData.milestones.filter(m => !m.parent_milestone_id).length;
      milestone_code = `M${String(rootCount + 1).padStart(2, '0')}`;
      milestone_path = milestone_code;
    }
    
    const newMilestone = {
      milestone_code: milestone_code,
      milestone_name: '',
      milestone_date: '',
      description: '',
      parent_milestone_id: parentMilestoneCode,
      milestone_level: milestone_level,
      milestone_path: milestone_path,
      is_parent: false,
      expanded: true,
      sequence_order: this.projectData.milestones.length
    };
    
    this.projectData.milestones.push(newMilestone);
    this.render();
  },
  
  updateMilestone(index, field, value) {
    if (this.projectData.milestones[index]) {
      this.projectData.milestones[index][field] = value;
      
      // If changing milestone_code and it's a parent, update all children
      if (field === 'milestone_code') {
        const oldCode = this.projectData.milestones[index].milestone_code;
        this.updateChildMilestoneCodes(oldCode, value);
      }
    }
  },
  
  updateChildMilestoneCodes(oldParentCode, newParentCode) {
    this.projectData.milestones.forEach(m => {
      if (m.parent_milestone_id === oldParentCode) {
        m.parent_milestone_id = newParentCode;
        // Update child's code to reflect new parent
        const parts = m.milestone_code.split('.');
        parts[parts.length - 2] = newParentCode.split('.').pop();
        m.milestone_code = parts.join('.');
        m.milestone_path = m.milestone_path.replace(oldParentCode, newParentCode);
      }
    });
  },
  
  removeMilestone(index) {
    const milestone = this.projectData.milestones[index];
    
    // Check if it has children
    const hasChildren = this.projectData.milestones.some(m => m.parent_milestone_id === milestone.milestone_code);
    
    if (hasChildren) {
      if (!confirm('This milestone has sub-milestones. Deleting it will also delete all sub-milestones. Continue?')) {
        return;
      }
      // Remove all children recursively
      this.removeChildMilestones(milestone.milestone_code);
    } else {
      if (!confirm('Remove this milestone?')) {
        return;
      }
    }
    
    this.projectData.milestones.splice(index, 1);
    this.render();
  },
  
  removeChildMilestones(parentCode) {
    const children = this.projectData.milestones.filter(m => m.parent_milestone_id === parentCode);
    children.forEach(child => {
      this.removeChildMilestones(child.milestone_code); // Recursive
      const childIndex = this.projectData.milestones.findIndex(m => m.milestone_code === child.milestone_code);
      if (childIndex >= 0) {
        this.projectData.milestones.splice(childIndex, 1);
      }
    });
  },
  
  toggleMilestone(index) {
    if (this.projectData.milestones[index]) {
      this.projectData.milestones[index].expanded = !this.projectData.milestones[index].expanded;
      this.render();
    }
  },
  
  toggleAllMilestones() {
    const allExpanded = this.projectData.milestones.every(m => m.expanded !== false);
    this.projectData.milestones.forEach(m => {
      m.expanded = !allExpanded;
    });
    this.render();
  },
  
  // Labour cost methods
  addLabourCost() {
    const newItem = {
      wbs_code: '',
      task_description: '',
      rate_type: 'actual',
      personnel_id: null,
      rate_band_id: null,
      milestone_code: '',
      hours: 0,
      hourly_rate: 0,
      apply_ga: 1,
      notes: ''
    };
    
    this.projectData.labour_costs.push(newItem);
    this.render();
  },
  
  updateLabourCost(index, field, value) {
    if (this.projectData.labour_costs[index]) {
      this.projectData.labour_costs[index][field] = value;
      
      // Recalculate if hours or rate changed
      if (field === 'hours' || field === 'hourly_rate' || field === 'apply_ga') {
        this.render();
      }
    }
  },
  
  removeLabourCost(index) {
    if (confirm('Remove this labour cost item?')) {
      this.projectData.labour_costs.splice(index, 1);
      this.render();
    }
  },
  
  changeRateType(index, rateType) {
    if (this.projectData.labour_costs[index]) {
      this.projectData.labour_costs[index].rate_type = rateType;
      this.projectData.labour_costs[index].personnel_id = null;
      this.projectData.labour_costs[index].rate_band_id = null;
      this.projectData.labour_costs[index].hourly_rate = 0;
      this.render();
    }
  },
  
  selectResource(index, select) {
    const personnelId = parseInt(select.value);
    const rate = parseFloat(select.selectedOptions[0]?.dataset.rate || 0);
    
    if (this.projectData.labour_costs[index]) {
      this.projectData.labour_costs[index].personnel_id = personnelId;
      this.projectData.labour_costs[index].hourly_rate = rate;
      this.render();
    }
  },
  
  selectRateBand(index, select) {
    const rateBandId = parseInt(select.value);
    const rate = parseFloat(select.selectedOptions[0]?.dataset.rate || 0);
    
    if (this.projectData.labour_costs[index]) {
      this.projectData.labour_costs[index].rate_band_id = rateBandId;
      this.projectData.labour_costs[index].hourly_rate = rate;
      this.render();
    }
  },
  
  // Material cost methods
  addMaterialCost(source = 'custom') {
    const newItem = {
      material_description: '',
      material_category: '',
      material_code: '',
      material_master_id: source === 'master' ? null : undefined, // null = from master but not selected yet
      cost_type: 'one-time',
      milestone_code: '',
      quantity: 1,
      unit_cost: 0,
      start_month: 1,
      end_month: 12,
      apply_ga: 1,
      supplier: '',
      notes: ''
    };
    
    this.projectData.material_costs.push(newItem);
    this.render();
  },
  
  selectMasterMaterial(index, materialId) {
    if (!this.projectData.material_costs[index]) return;
    
    const material = this.materials.find(m => m.id === parseInt(materialId));
    if (material) {
      this.projectData.material_costs[index].material_master_id = material.id;
      this.projectData.material_costs[index].material_code = material.material_code;
      this.projectData.material_costs[index].material_description = material.material_name;
      this.projectData.material_costs[index].material_category = material.material_category;
      this.projectData.material_costs[index].unit_cost = parseFloat(material.default_unit_cost);
      this.projectData.material_costs[index].supplier = material.supplier_name || '';
      this.projectData.material_costs[index].cost_type = material.default_cost_type || 'one-time';
      this.render();
    }
  },
  
  updateMaterialCost(index, field, value) {
    if (this.projectData.material_costs[index]) {
      this.projectData.material_costs[index][field] = value;
      
      if (field === 'quantity' || field === 'unit_cost' || field === 'apply_ga' || 
          field === 'start_month' || field === 'end_month') {
        this.render();
      }
    }
  },
  
  removeMaterialCost(index) {
    if (confirm('Remove this material cost item?')) {
      this.projectData.material_costs.splice(index, 1);
      this.render();
    }
  },
  
  changeMaterialCostType(index, costType) {
    if (this.projectData.material_costs[index]) {
      this.projectData.material_costs[index].cost_type = costType;
      this.render();
    }
  },
  
  // Payment methods
  addPayment() {
    const newPayment = {
      payment_description: '',
      milestone_code: '',
      payment_date: '',
      invoice_amount: 0,
      invoice_number: '',
      payment_status: 'pending',
      notes: ''
    };
    
    this.projectData.payment_schedule.push(newPayment);
    this.render();
  },
  
  updatePayment(index, field, value) {
    if (this.projectData.payment_schedule[index]) {
      this.projectData.payment_schedule[index][field] = value;
      
      if (field === 'invoice_amount') {
        this.render();
      }
    }
  },
  
  removePayment(index) {
    if (confirm('Remove this payment?')) {
      this.projectData.payment_schedule.splice(index, 1);
      this.render();
    }
  },
  
  // Calculation methods
  calculateItemCost(item) {
    const baseCost = item.hours * item.hourly_rate;
    const gaRate = this.projectData.project.ga_percentage || 0;
    const gaCost = item.apply_ga ? baseCost * gaRate : 0;
    return baseCost + gaCost;
  },
  
  calculateTotalLabour() {
    return this.projectData.labour_costs.reduce((sum, item) => sum + this.calculateItemCost(item), 0);
  },
  
  calculateMaterialItemCost(item) {
    let baseCost = item.quantity * item.unit_cost;
    
    // For monthly costs
    if (item.cost_type === 'monthly' && item.start_month && item.end_month) {
      const months = item.end_month - item.start_month + 1;
      baseCost = item.quantity * item.unit_cost * months;
    }
    
    const gaRate = this.projectData.project.ga_percentage || 0;
    const gaCost = item.apply_ga ? baseCost * gaRate : 0;
    return baseCost + gaCost;
  },
  
  calculateTotalMaterial() {
    return this.projectData.material_costs.reduce((sum, item) => sum + this.calculateMaterialItemCost(item), 0);
  },
  
  calculateTotalPayments() {
    return this.projectData.payment_schedule.reduce((sum, p) => sum + (p.invoice_amount || 0), 0);
  },
  
  getPaymentBalance() {
    const revenue = parseFloat(this.projectData.project.total_revenue || 0);
    const payments = this.calculateTotalPayments();
    return revenue - payments;
  },
  
  // Submit project
  async submitProject() {
    if (!this.validateCurrentStep()) {
      return;
    }
    
    const validations = this.validateProject();
    const hasErrors = validations.some(v => !v.valid && v.message.includes('is set'));
    
    if (hasErrors) {
      alert('Please fix validation errors before creating the project');
      return;
    }
    
    // Get approval action and comments
    const approvalAction = this.approvalAction || 'save_draft';
    const comments = document.getElementById('approval_comments')?.value || '';
    
    // Set approval status based on action
    let approval_status = 'draft';
    let projectStatus = 'planning';
    let confirmMessage = 'Create this project as draft?';
    
    if (approvalAction === 'create_active') {
      approval_status = 'approved';
      projectStatus = 'active';
      confirmMessage = 'Create this project as ACTIVE (self-approved)?';
    } else if (approvalAction === 'submit_approval') {
      approval_status = 'pending_approval';
      projectStatus = 'planning';
      confirmMessage = 'Create and submit this project for manager approval?';
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      // Show loading
      const button = event.target;
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating Project...';
      
      // Update project data with approval settings
      this.projectData.project.approval_status = approval_status;
      this.projectData.project.status = projectStatus;
      
      // Submit to API
      const response = await api.request('/projects/with-details', {
        method: 'POST',
        body: this.projectData
      });
      
      if (response.success) {
        const projectId = response.data.project_id;
        
        // If submitting for approval, record the submission
        if (approvalAction === 'submit_approval') {
          try {
            await api.request(`/projects/${projectId}/submit-for-approval`, {
              method: 'POST',
              body: { comments }
            });
          } catch (err) {
            console.warn('Could not record approval submission:', err);
          }
        }
        
        let statusMessage = '';
        if (approvalAction === 'save_draft') {
          statusMessage = 'Status: Draft (you can edit and submit later)';
        } else if (approvalAction === 'create_active') {
          statusMessage = 'Status: Active (self-approved)';
        } else if (approvalAction === 'submit_approval') {
          statusMessage = 'Status: Pending Manager Approval';
        }
        
        alert(`Project created successfully!\n\n` +
              `Project ID: ${projectId}\n` +
              `${statusMessage}\n\n` +
              `Details:\n` +
              `- Milestones: ${response.data.milestones_created}\n` +
              `- Labour Items: ${response.data.labour_items_created}\n` +
              `- Material Items: ${response.data.material_items_created}`);
        
        // Close wizard and refresh projects
        this.close();
        await loadInitialData();
        showView('projects');
      } else {
        throw new Error(response.error || 'Failed to create project');
      }
      
    } catch (error) {
      console.error('Submit project error:', error);
      alert(`Failed to create project: ${error.message || 'Unknown error'}`);
      
      // Re-enable button
      const button = event.target;
      button.disabled = false;
      button.innerHTML = '<i class="fas fa-check mr-2"></i> Create Project';
    }
  },
  
  // Close wizard
  close() {
    if (confirm('Close wizard? All unsaved changes will be lost.')) {
      const wizardContainer = document.getElementById('wizardContainer');
      if (wizardContainer) {
        wizardContainer.remove();
      }
      // Reset wizard state
      this.currentStep = 1;
      this.projectData = {
        project: {
          project_code: '', project_name: '', client_name: '', start_date: '', end_date: '',
          status: 'active', tax_rate: 0.10, ga_percentage: 0.15, ga_application: 'all', total_revenue: 0
        },
        milestones: [], labour_costs: [], material_costs: [], payment_schedule: []
      };
    }
  },
  
  // Attach event listeners
  attachEventListeners() {
    // Any dynamic event listeners can be added here
  }
});

// Make wizard available globally
window.ProjectWizard = ProjectWizard;
