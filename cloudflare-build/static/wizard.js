// BTL Costing Application - Project Creation Wizard
// Complete 6-step wizard for creating projects from scratch

const ProjectWizard = {
  currentStep: 1,
  totalSteps: 6,
  approvalAction: 'save_draft', // Default approval action
  
  // Wizard data state
  projectData: {
    project: {
      project_code: '',
      project_name: '',
      client_id: null,
      client_name: '',
      start_date: '',
      end_date: '',
      status: 'active',
      approval_status: 'draft',
      tax_rate: 0.10,
      ga_percentage: 0.15,
      ga_application: 'all',
      total_revenue: 0
    },
    milestones: [],
    labour_costs: [],
    material_costs: [],
    payment_schedule: []
  },
  
  // Step definitions
  steps: [
    { id: 1, name: 'Project Basics', icon: 'fa-folder', completed: false },
    { id: 2, name: 'Milestones', icon: 'fa-flag', completed: false },
    { id: 3, name: 'Labour Costs', icon: 'fa-users', completed: false },
    { id: 4, name: 'Material Costs', icon: 'fa-box', completed: false },
    { id: 5, name: 'Payment Schedule', icon: 'fa-money-bill', completed: false },
    { id: 6, name: 'Review & Create', icon: 'fa-check', completed: false }
  ],
  
  // Initialize wizard
  async init() {
    // Load reference data
    await this.loadReferenceData();
    
    // Render wizard
    this.render();
  },
  
  // Load personnel, rate bands, clients, and materials
  async loadReferenceData() {
    try {
      const [personnelRes, rateBandsRes, clientsRes, materialsRes] = await Promise.all([
        api.getPersonnel(),
        api.request('/rate-bands?active=true'),
        api.request('/clients?active=true'),
        api.request('/materials-master?active=true')
      ]);
      
      this.personnel = personnelRes.data || [];
      this.rateBands = rateBandsRes.data || [];
      this.clients = clientsRes.data || [];
      this.materials = materialsRes.data || [];
    } catch (error) {
      console.error('Failed to load reference data:', error);
      this.personnel = [];
      this.rateBands = [];
      this.clients = [];
      this.materials = [];
    }
  },
  
  // Main render function
  render() {
    const wizardContent = document.getElementById('wizardContent');
    if (!wizardContent) return;
    
    wizardContent.innerHTML = `
      <div class="bg-gray-50 py-8 max-h-screen overflow-y-auto">
        <div class="max-w-6xl mx-auto px-4">
          <!-- Wizard Header -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-magic mr-2 text-blue-600"></i>
                Create New Project
              </h1>
              <button onclick="ProjectWizard.close()" class="text-gray-500 hover:text-gray-700">
                <i class="fas fa-times text-2xl"></i>
              </button>
            </div>
            
            <!-- Progress Bar -->
            ${this.renderProgressBar()}
          </div>
          
          <!-- Step Content -->
          <div class="card p-8 mb-6">
            ${this.renderCurrentStep()}
          </div>
          
          <!-- Navigation -->
          ${this.renderNavigation()}
        </div>
      </div>
    `;
    
    // Attach event listeners
    this.attachEventListeners();
  },
  
  // Render progress bar
  renderProgressBar() {
    const progress = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
    
    return `
      <div class="relative">
        <div class="flex items-center justify-between mb-2">
          ${this.steps.map(step => `
            <div class="flex flex-col items-center" style="flex: 1">
              <div class="w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                step.id < this.currentStep ? 'bg-green-500 text-white' :
                step.id === this.currentStep ? 'bg-blue-600 text-white' :
                'bg-gray-300 text-gray-600'
              }">
                <i class="fas ${step.icon}"></i>
              </div>
              <div class="text-xs text-center font-medium ${
                step.id === this.currentStep ? 'text-blue-600' : 'text-gray-600'
              }">
                ${step.name}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="relative h-2 bg-gray-200 rounded-full">
          <div class="absolute h-2 bg-blue-600 rounded-full transition-all duration-300" 
               style="width: ${progress}%"></div>
        </div>
        <div class="text-sm text-gray-600 mt-2 text-center">
          Step ${this.currentStep} of ${this.totalSteps}
        </div>
      </div>
    `;
  },
  
  // Render current step content
  renderCurrentStep() {
    switch(this.currentStep) {
      case 1: return this.renderStep1();
      case 2: return this.renderStep2();
      case 3: return this.renderStep3();
      case 4: return this.renderStep4();
      case 5: return this.renderStep5();
      case 6: return this.renderStep6();
      default: return '';
    }
  },
  
  // Step 1: Project Basics
  renderStep1() {
    const p = this.projectData.project;
    return `
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        <i class="fas fa-folder text-blue-600 mr-2"></i>
        Project Information
      </h2>
      
      <form id="step1Form" class="space-y-6">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Project Code <span class="text-red-500">*</span>
            </label>
            <input type="text" name="project_code" required
              value="${p.project_code}"
              placeholder="PROJ-2025-001"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <p class="text-xs text-gray-500 mt-1">Format: PROJ-YYYY-NNN</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Project Name <span class="text-red-500">*</span>
            </label>
            <input type="text" name="project_name" required
              value="${p.project_name}"
              placeholder="Digital Transformation Initiative"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Select Client <span class="text-red-500">*</span>
            </label>
            <select name="client_id" id="clientSelect" required onchange="ProjectWizard.handleClientSelect()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">-- Select a client --</option>
              ${(this.clients || []).map(client => `
                <option value="${client.id}" ${p.client_id === client.id ? 'selected' : ''}>
                  ${client.client_code} - ${client.client_name}
                </option>
              `).join('')}
              <option value="new">+ Add New Client</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Select from CRM or add new</p>
          </div>
          
          <div id="clientNameInput" ${p.client_id !== 'new' ? 'style="display:none"' : ''}>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Client Name (New) <span class="text-red-500">*</span>
            </label>
            <input type="text" name="client_name"
              value="${p.client_name || ''}"
              placeholder="Enter new client name"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Project Status
            </label>
            <select name="status" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="active" ${p.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="on-hold" ${p.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Start Date <span class="text-red-500">*</span>
            </label>
            <input type="date" name="start_date" required
              value="${p.start_date}"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              End Date <span class="text-red-500">*</span>
            </label>
            <input type="date" name="end_date" required
              value="${p.end_date}"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tax Rate (%)
            </label>
            <input type="number" name="tax_rate" step="0.01" min="0" max="100"
              value="${p.tax_rate * 100}"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              G&A Percentage (%)
            </label>
            <input type="number" name="ga_percentage" step="0.01" min="0" max="100"
              value="${p.ga_percentage * 100}"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              G&A Application
            </label>
            <select name="ga_application" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all" ${p.ga_application === 'all' ? 'selected' : ''}>All Costs</option>
              <option value="labour" ${p.ga_application === 'labour' ? 'selected' : ''}>Labour Only</option>
              <option value="material" ${p.ga_application === 'material' ? 'selected' : ''}>Material Only</option>
              <option value="none" ${p.ga_application === 'none' ? 'selected' : ''}>None</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Total Revenue Estimate
            </label>
            <input type="number" name="total_revenue" step="0.01" min="0"
              value="${p.total_revenue}"
              placeholder="250000.00"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
        </div>
      </form>
    `;
  },
  
  // Step 2: Milestones
  renderStep2() {
    return `
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        <i class="fas fa-flag text-blue-600 mr-2"></i>
        Project Milestones - Hierarchical Structure
      </h2>
      <p class="text-gray-600 mb-6">Build a hierarchical milestone tree with parent milestones and sub-milestones</p>
      
      <div class="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
        <p class="text-sm text-blue-800">
          <i class="fas fa-info-circle mr-2"></i>
          <strong>Tip:</strong> Create parent milestones first, then add sub-milestones under them. You can nest up to 3 levels deep.
        </p>
      </div>
      
      <div id="milestones-list" class="space-y-3 mb-6">
        ${this.renderMilestoneTree()}
        ${this.projectData.milestones.length === 0 ? '<p class="text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">No milestones added yet. Click "Add Root Milestone" to get started.</p>' : ''}
      </div>
      
      <div class="flex gap-3">
        <button type="button" onclick="ProjectWizard.addMilestone(null)" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <i class="fas fa-plus mr-2"></i> Add Root Milestone
        </button>
        <button type="button" onclick="ProjectWizard.toggleAllMilestones()" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
          <i class="fas fa-expand-alt mr-2"></i> Expand/Collapse All
        </button>
      </div>
    `;
  },
  
  renderMilestoneTree() {
    // Get root milestones (no parent)
    const rootMilestones = this.projectData.milestones.filter(m => !m.parent_milestone_id);
    return rootMilestones.map(m => this.renderMilestoneItem(m, 0)).join('');
  },
  
  renderMilestoneItem(milestone, level) {
    const index = this.projectData.milestones.findIndex(m => m.milestone_code === milestone.milestone_code);
    const hasChildren = this.projectData.milestones.some(m => m.parent_milestone_id === milestone.milestone_code);
    const children = this.projectData.milestones.filter(m => m.parent_milestone_id === milestone.milestone_code);
    const isExpanded = milestone.expanded !== false; // Default to expanded
    
    const indentClass = level === 0 ? '' : level === 1 ? 'ml-8' : level === 2 ? 'ml-16' : 'ml-24';
    const bgColor = level === 0 ? 'bg-white' : level === 1 ? 'bg-blue-50' : level === 2 ? 'bg-green-50' : 'bg-yellow-50';
    const borderColor = level === 0 ? 'border-blue-500' : level === 1 ? 'border-green-500' : level === 2 ? 'border-yellow-500' : 'border-gray-500';
    
    return `
      <div class="${indentClass}">
        <div class="border-l-4 ${borderColor} rounded-lg p-4 ${bgColor} shadow-sm" data-milestone-index="${index}">
          <div class="flex items-start gap-3">
            ${hasChildren ? `
              <button type="button" onclick="ProjectWizard.toggleMilestone(${index})" 
                class="mt-2 text-gray-600 hover:text-gray-800 transition">
                <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'} text-sm"></i>
              </button>
            ` : '<div class="w-4"></div>'}
            
            <div class="flex-1">
              <div class="grid grid-cols-12 gap-3">
                <div class="col-span-2">
                  <label class="block text-xs font-medium text-gray-700 mb-1">Code</label>
                  <input type="text" value="${milestone.milestone_code}" 
                    onchange="ProjectWizard.updateMilestone(${index}, 'milestone_code', this.value)"
                    placeholder="M${level + 1}-${index + 1}"
                    class="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                </div>
                <div class="col-span-4">
                  <label class="block text-xs font-medium text-gray-700 mb-1">Milestone Name</label>
                  <input type="text" value="${milestone.milestone_name}"
                    onchange="ProjectWizard.updateMilestone(${index}, 'milestone_name', this.value)"
                    placeholder="${level === 0 ? 'Phase 1: Planning' : 'Task 1.1: Requirements'}"
                    class="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-medium text-gray-700 mb-1">Target Date</label>
                  <input type="date" value="${milestone.milestone_date || ''}"
                    onchange="ProjectWizard.updateMilestone(${index}, 'milestone_date', this.value)"
                    class="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                </div>
                <div class="col-span-3">
                  <label class="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value="${milestone.description || ''}"
                    onchange="ProjectWizard.updateMilestone(${index}, 'description', this.value)"
                    placeholder="Brief description"
                    class="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                </div>
                <div class="col-span-1 flex items-end gap-1">
                  ${level < 2 ? `
                    <button type="button" onclick="ProjectWizard.addMilestone('${milestone.milestone_code}')" 
                      title="Add sub-milestone"
                      class="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition text-xs">
                      <i class="fas fa-plus"></i>
                    </button>
                  ` : ''}
                  <button type="button" onclick="ProjectWizard.removeMilestone(${index})" 
                    title="Delete milestone"
                    class="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition text-xs">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              
              <div class="mt-2 flex items-center gap-4 text-xs text-gray-600">
                <span><i class="fas fa-layer-group mr-1"></i> Level: ${level + 1}</span>
                ${milestone.parent_milestone_id ? `<span><i class="fas fa-sitemap mr-1"></i> Parent: ${milestone.parent_milestone_id}</span>` : '<span><i class="fas fa-star mr-1"></i> Root Milestone</span>'}
                ${hasChildren ? `<span class="text-blue-600"><i class="fas fa-code-branch mr-1"></i> ${children.length} sub-milestone(s)</span>` : ''}
              </div>
            </div>
          </div>
        </div>
        
        ${hasChildren && isExpanded ? `
          <div class="mt-2">
            ${children.map(child => this.renderMilestoneItem(child, level + 1)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },
  
  // Step 3: Labour Costs
  renderStep3() {
    return `
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        <i class="fas fa-users text-blue-600 mr-2"></i>
        Labour Cost Build-Up
      </h2>
      <p class="text-gray-600 mb-6">Add tasks and assign resources (actual personnel or banded rates)</p>
      
      <div id="labour-costs-list" class="space-y-4 mb-6">
        ${this.projectData.labour_costs.map((item, idx) => this.renderLabourItem(item, idx)).join('')}
        ${this.projectData.labour_costs.length === 0 ? '<p class="text-gray-500 text-center py-8">No labour costs added yet. Click "Add Task" to get started.</p>' : ''}
      </div>
      
      <button type="button" onclick="ProjectWizard.addLabourCost()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
        <i class="fas fa-plus mr-2"></i> Add Task
      </button>
      
      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <div class="flex justify-between items-center">
          <span class="font-medium text-gray-700">Total Labour Cost (with G&A):</span>
          <span class="text-2xl font-bold text-blue-600" id="total-labour">$${this.calculateTotalLabour().toLocaleString()}</span>
        </div>
      </div>
    `;
  },
  
  renderLabourItem(item, index) {
    const milestoneOptions = this.projectData.milestones.map(m => 
      `<option value="${m.milestone_code}" ${item.milestone_code === m.milestone_code ? 'selected' : ''}>${m.milestone_code} - ${m.milestone_name}</option>`
    ).join('');
    
    const personnelOptions = this.personnel.map(p =>
      `<option value="${p.id}" data-rate="${p.hourly_cost}" ${item.personnel_id === p.id ? 'selected' : ''}>${p.employee_name} - $${p.hourly_cost}/hr</option>`
    ).join('');
    
    const rateBandOptions = this.rateBands.map(rb =>
      `<option value="${rb.id}" data-rate="${rb.hourly_rate}" ${item.rate_band_id === rb.id ? 'selected' : ''}>${rb.band_name} - $${rb.hourly_rate}/hr</option>`
    ).join('');
    
    return `
      <div class="border border-gray-300 rounded-lg p-4 bg-white" data-labour-index="${index}">
        <div class="grid grid-cols-6 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">WBS Code</label>
            <input type="text" value="${item.wbs_code || ''}"
              onchange="ProjectWizard.updateLabourCost(${index}, 'wbs_code', this.value)"
              placeholder="1.${index + 1}"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
            <input type="text" value="${item.task_description || ''}"
              onchange="ProjectWizard.updateLabourCost(${index}, 'task_description', this.value)"
              placeholder="Project Management"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Milestone</label>
            <select onchange="ProjectWizard.updateLabourCost(${index}, 'milestone_code', this.value)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">None</option>
              ${milestoneOptions}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rate Type</label>
            <select onchange="ProjectWizard.changeRateType(${index}, this.value)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="actual" ${item.rate_type === 'actual' ? 'selected' : ''}>Actual</option>
              <option value="banded" ${item.rate_type === 'banded' ? 'selected' : ''}>Banded</option>
            </select>
          </div>
          <div class="flex items-end">
            <button type="button" onclick="ProjectWizard.removeLabourCost(${index})"
              class="w-full bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition text-sm">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="grid grid-cols-6 gap-3 mt-3">
          <div class="col-span-2" id="resource-select-${index}">
            ${item.rate_type === 'actual' ? `
              <label class="block text-sm font-medium text-gray-700 mb-1">Personnel</label>
              <select onchange="ProjectWizard.selectResource(${index}, this)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Select person...</option>
                ${personnelOptions}
              </select>
            ` : `
              <label class="block text-sm font-medium text-gray-700 mb-1">Rate Band</label>
              <select onchange="ProjectWizard.selectRateBand(${index}, this)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Select band...</option>
                ${rateBandOptions}
              </select>
            `}
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Hours</label>
            <input type="number" value="${item.hours || 0}" step="0.5" min="0"
              onchange="ProjectWizard.updateLabourCost(${index}, 'hours', parseFloat(this.value))"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
            <input type="number" value="${item.hourly_rate || 0}" step="0.01" min="0" readonly
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Apply G&A</label>
            <select onchange="ProjectWizard.updateLabourCost(${index}, 'apply_ga', parseInt(this.value))"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="1" ${item.apply_ga === 1 ? 'selected' : ''}>Yes</option>
              <option value="0" ${item.apply_ga === 0 ? 'selected' : ''}>No</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
            <div class="px-3 py-2 bg-blue-50 rounded-lg text-sm font-bold text-blue-600">
              $${this.calculateItemCost(item).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  // Step 4: Material Costs
  renderStep4() {
    return `
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        <i class="fas fa-box text-blue-600 mr-2"></i>
        Material & Other Costs
      </h2>
      <p class="text-gray-600 mb-6">Add non-labour expenses from Materials Master catalog or enter custom items</p>
      
      <div class="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded">
        <p class="text-sm text-green-800">
          <i class="fas fa-info-circle mr-2"></i>
          <strong>Tip:</strong> Use "From Master Catalog" to select pre-defined materials with standard costs, or "Custom Entry" for one-off items.
        </p>
      </div>
      
      <div id="material-costs-list" class="space-y-4 mb-6">
        ${this.projectData.material_costs.map((item, idx) => this.renderMaterialItem(item, idx)).join('')}
        ${this.projectData.material_costs.length === 0 ? '<p class="text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">No material costs added yet. Click a button below to add materials.</p>' : ''}
      </div>
      
      <div class="flex gap-3">
        <button type="button" onclick="ProjectWizard.addMaterialCost('master')" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
          <i class="fas fa-database mr-2"></i> From Master Catalog
        </button>
        <button type="button" onclick="ProjectWizard.addMaterialCost('custom')" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <i class="fas fa-plus mr-2"></i> Custom Entry
        </button>
      </div>
      
      <div class="mt-6 p-4 bg-green-50 rounded-lg">
        <div class="flex justify-between items-center">
          <span class="font-medium text-gray-700">Total Material Cost (with G&A):</span>
          <span class="text-2xl font-bold text-green-600" id="total-material">$${this.calculateTotalMaterial().toLocaleString()}</span>
        </div>
      </div>
    `;
  },
  
  renderMaterialItem(item, index) {
    const milestoneOptions = this.projectData.milestones.map(m => 
      `<option value="${m.milestone_code}" ${item.milestone_code === m.milestone_code ? 'selected' : ''}>${m.milestone_code} - ${m.milestone_name}</option>`
    ).join('');
    
    const isFromMaster = !!item.material_master_id;
    const bgColor = isFromMaster ? 'bg-green-50' : 'bg-white';
    const borderColor = isFromMaster ? 'border-green-400' : 'border-gray-300';
    
    return `
      <div class="border-2 ${borderColor} rounded-lg p-4 ${bgColor}" data-material-index="${index}">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            ${isFromMaster ? `
              <span class="px-2 py-1 text-xs rounded-full bg-green-600 text-white">
                <i class="fas fa-database mr-1"></i> From Master Catalog
              </span>
              <span class="text-xs text-gray-600">Code: ${item.material_code || 'N/A'}</span>
            ` : `
              <span class="px-2 py-1 text-xs rounded-full bg-blue-600 text-white">
                <i class="fas fa-edit mr-1"></i> Custom Entry
              </span>
            `}
          </div>
          <button type="button" onclick="ProjectWizard.removeMaterialCost(${index})"
            class="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition text-sm">
            <i class="fas fa-trash"></i> Remove
          </button>
        </div>
        
        <div class="grid grid-cols-5 gap-3">
          ${isFromMaster ? `
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Material (from catalog)</label>
              <select onchange="ProjectWizard.selectMasterMaterial(${index}, this.value)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="">-- Select material --</option>
                ${(this.materials || []).map(mat => `
                  <option value="${mat.id}" 
                    data-code="${mat.material_code}"
                    data-name="${mat.material_name}"
                    data-category="${mat.material_category}"
                    data-cost="${mat.default_unit_cost}"
                    data-unit="${mat.unit_of_measure}"
                    data-cost-type="${mat.default_cost_type}"
                    ${item.material_master_id === mat.id ? 'selected' : ''}>
                    ${mat.material_code} - ${mat.material_name} ($${parseFloat(mat.default_unit_cost).toLocaleString()})
                  </option>
                `).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value="${item.material_description || ''}" readonly
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100">
            </div>
          ` : `
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value="${item.material_description || ''}"
                onchange="ProjectWizard.updateMaterialCost(${index}, 'material_description', this.value)"
                placeholder="Software Licenses"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input type="text" value="${item.material_category || ''}"
                onchange="ProjectWizard.updateMaterialCost(${index}, 'material_category', this.value)"
                placeholder="Software"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            </div>
          `}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Milestone</label>
            <select onchange="ProjectWizard.updateMaterialCost(${index}, 'milestone_code', this.value)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">None</option>
              ${milestoneOptions}
            </select>
          </div>
        </div>
        
        <div class="grid grid-cols-7 gap-3 mt-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cost Type</label>
            <select onchange="ProjectWizard.changeMaterialCostType(${index}, this.value)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="one-time" ${item.cost_type === 'one-time' ? 'selected' : ''}>One-time</option>
              <option value="milestone" ${item.cost_type === 'milestone' ? 'selected' : ''}>Milestone</option>
              <option value="monthly" ${item.cost_type === 'monthly' ? 'selected' : ''}>Monthly</option>
            </select>
          </div>
          ${item.cost_type === 'monthly' ? `
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Start Month</label>
              <input type="number" value="${item.start_month || 1}" min="1"
                onchange="ProjectWizard.updateMaterialCost(${index}, 'start_month', parseInt(this.value))"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">End Month</label>
              <input type="number" value="${item.end_month || 12}" min="1"
                onchange="ProjectWizard.updateMaterialCost(${index}, 'end_month', parseInt(this.value))"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            </div>
          ` : '<div class="col-span-2"></div>'}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input type="number" value="${item.quantity || 1}" step="0.01" min="0"
              onchange="ProjectWizard.updateMaterialCost(${index}, 'quantity', parseFloat(this.value))"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
            <input type="number" value="${item.unit_cost || 0}" step="0.01" min="0"
              onchange="ProjectWizard.updateMaterialCost(${index}, 'unit_cost', parseFloat(this.value))"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input type="text" value="${item.supplier || ''}"
              onchange="ProjectWizard.updateMaterialCost(${index}, 'supplier', this.value)"
              placeholder="Microsoft"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Apply G&A</label>
            <select onchange="ProjectWizard.updateMaterialCost(${index}, 'apply_ga', parseInt(this.value))"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="1" ${item.apply_ga === 1 ? 'selected' : ''}>Yes</option>
              <option value="0" ${item.apply_ga === 0 ? 'selected' : ''}>No</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
            <div class="px-3 py-2 bg-green-50 rounded-lg text-sm font-bold text-green-600">
              $${this.calculateMaterialItemCost(item).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  // Continue in next message due to length...
  // Will include Step 5, Step 6, and all helper functions
  
  // Navigation buttons
  renderNavigation() {
    return `
      <div class="flex justify-between items-center">
        <button type="button" 
          onclick="ProjectWizard.previousStep()" 
          ${this.currentStep === 1 ? 'disabled' : ''}
          class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed">
          <i class="fas fa-arrow-left mr-2"></i> Previous
        </button>
        
        <div class="text-sm text-gray-600">
          ${this.currentStep < 6 ? 'Complete this step to continue' : 'Review and create your project'}
        </div>
        
        <button type="button" 
          onclick="ProjectWizard.${this.currentStep === 6 ? 'submitProject' : 'nextStep'}()" 
          class="px-6 py-3 ${this.currentStep === 6 ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition">
          ${this.currentStep === 6 ? '<i class="fas fa-check mr-2"></i> Create Project' : 'Next <i class="fas fa-arrow-right ml-2"></i>'}
        </button>
      </div>
    `;
  },
  
  // Handle client selection in Step 1
  handleClientSelect() {
    const select = document.getElementById('clientSelect');
    const clientNameInput = document.getElementById('clientNameInput');
    const clientNameField = clientNameInput?.querySelector('input[name="client_name"]');
    
    if (select.value === 'new') {
      // Show custom client name input
      if (clientNameInput) {
        clientNameInput.style.display = 'block';
        if (clientNameField) {
          clientNameField.required = true;
        }
      }
      this.projectData.project.client_id = null;
      this.projectData.project.client_name = '';
    } else if (select.value === '') {
      // Nothing selected
      if (clientNameInput) {
        clientNameInput.style.display = 'none';
        if (clientNameField) {
          clientNameField.required = false;
        }
      }
      this.projectData.project.client_id = null;
      this.projectData.project.client_name = '';
    } else {
      // Existing client selected
      const clientId = parseInt(select.value);
      const client = this.clients.find(c => c.id === clientId);
      
      if (clientNameInput) {
        clientNameInput.style.display = 'none';
        if (clientNameField) {
          clientNameField.required = false;
        }
      }
      
      if (client) {
        this.projectData.project.client_id = client.id;
        this.projectData.project.client_name = client.client_name;
      }
    }
  }
};

// Helper functions will continue in the next file part...
