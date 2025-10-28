// BTL Costing Application - Frontend
// Single Page Application using Vanilla JavaScript

// Global state
const state = {
  user: {
    id: 'demo-user',
    name: 'Demo User',
    full_name: 'Demo User',
    role: 'admin'
  },
  currentView: 'dashboard',
  projects: [],
  personnel: [],
  currentProject: null
};

// API client
const api = {
  baseURL: '/api',
  
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    try {
      const response = await axios({
        url: `${this.baseURL}${endpoint}`,
        method: options.method || 'GET',
        headers,
        data: options.body
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  // Projects endpoints
  async getProjects() {
    return this.request('/projects');
  },
  
  async getProject(id) {
    return this.request(`/projects/${id}`);
  },
  
  async createProject(data) {
    return this.request('/projects', {
      method: 'POST',
      body: data
    });
  },
  
  async updateProject(id, data) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: data
    });
  },
  
  async recalculateProject(id) {
    return this.request(`/projects/${id}/recalculate`, {
      method: 'POST'
    });
  },
  
  // Personnel endpoints
  async getPersonnel() {
    return this.request('/personnel');
  },
  
  async createPersonnel(data) {
    return this.request('/personnel', {
      method: 'POST',
      body: data
    });
  },
  
  // Cost endpoints
  async getLabourCosts(projectId) {
    return this.request(`/costs/labour?project_id=${projectId}`);
  },
  
  async createLabourCost(data) {
    return this.request('/costs/labour', {
      method: 'POST',
      body: data
    });
  },
  
  async getMaterialCosts(projectId) {
    return this.request(`/costs/material?project_id=${projectId}`);
  },
  
  async createMaterialCost(data) {
    return this.request('/costs/material', {
      method: 'POST',
      body: data
    });
  }
};

// UI Components
const components = {
  // Dashboard view
  dashboardView() {
    return `
      <div class="flex h-screen bg-gray-50">
        <!-- Sidebar -->
        <aside class="w-64 bg-white border-r border-gray-200 sidebar">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center">
              <i class="fas fa-calculator text-2xl text-blue-600 mr-3"></i>
              <div>
                <h2 class="font-bold text-gray-800">BTL Costing</h2>
                <p class="text-xs text-gray-500">v1.0</p>
              </div>
            </div>
          </div>
          
          <nav class="p-4">
            <a href="#" onclick="showView('dashboard')" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg mb-1">
              <i class="fas fa-home mr-3"></i> Dashboard
            </a>
            <a href="#" onclick="showView('projects')" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg mb-1">
              <i class="fas fa-folder mr-3"></i> Projects
            </a>
            <a href="#" onclick="showView('personnel')" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg mb-1">
              <i class="fas fa-users mr-3"></i> Personnel
            </a>
            ${['admin', 'manager'].includes(state.user?.role) ? `
              <a href="#" onclick="showView('pending-approvals')" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg mb-1">
                <i class="fas fa-clipboard-check mr-3"></i> Pending Approvals
                <span id="approvalBadge" class="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full" style="display:none;">0</span>
              </a>
              <a href="#" onclick="showView('manager-settings')" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg mb-1">
                <i class="fas fa-cog mr-3"></i> Manager Settings
              </a>
            ` : ''}
            <a href="#" onclick="showView('integrations')" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg mb-1">
              <i class="fas fa-plug mr-3"></i> Integrations
            </a>
          </nav>
          
          <div class="absolute bottom-0 w-64 p-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <i class="fas fa-user-circle text-2xl text-gray-400 mr-3"></i>
                <div>
                  <p class="text-sm font-medium text-gray-700">${state.user?.full_name || 'User'}</p>
                  <p class="text-xs text-gray-500">${state.user?.role || 'user'}</p>
                </div>
              </div>
              <button onclick="logout()" class="text-gray-400 hover:text-red-600">
                <i class="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </aside>
        
        <!-- Main content -->
        <main class="flex-1 overflow-y-auto">
          <div id="mainContent" class="p-8">
            ${this.overviewContent()}
          </div>
        </main>
      </div>
    `;
  },
  
  // Overview content
  overviewContent() {
    return `
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p class="text-gray-600">Overview of your projects and activities</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Active Projects</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">${state.projects.filter(p => p.status === 'active').length}</p>
            </div>
            <i class="fas fa-folder-open text-3xl text-blue-600"></i>
          </div>
        </div>
        
        <div class="card p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Personnel</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">${state.personnel.length}</p>
            </div>
            <i class="fas fa-users text-3xl text-green-600"></i>
          </div>
        </div>
        
        <div class="card p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Total Revenue</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">$${state.projects.reduce((sum, p) => sum + (p.total_revenue || 0), 0).toLocaleString()}</p>
            </div>
            <i class="fas fa-dollar-sign text-3xl text-purple-600"></i>
          </div>
        </div>
        
        <div class="card p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Avg Margin</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">${(state.projects.reduce((sum, p) => sum + (p.margin_percentage || 0), 0) / (state.projects.length || 1)).toFixed(1)}%</p>
            </div>
            <i class="fas fa-chart-line text-3xl text-yellow-600"></i>
          </div>
        </div>
      </div>
      
      <div class="card p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Recent Projects</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${state.projects.slice(0, 5).map(project => `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm text-gray-900">${project.project_name}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${project.client_name}</td>
                  <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 text-xs rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                      ${project.status}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900">$${(project.total_cost || 0).toLocaleString()}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">${(project.margin_percentage || 0).toFixed(1)}%</td>
                  <td class="px-4 py-3 text-sm">
                    <button onclick="viewProject(${project.id})" class="text-blue-600 hover:text-blue-800">
                      <i class="fas fa-eye"></i> View
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
  
  // Projects list view
  projectsView() {
    return `
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Projects</h1>
          <p class="text-gray-600">Manage your project portfolio</p>
        </div>
        <button onclick="showCreateProjectModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <i class="fas fa-plus mr-2"></i> New Project
        </button>
      </div>
      
      <div class="card p-6">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${state.projects.map(project => {
                const approvalStatus = project.approval_status || 'approved';
                const approvalColors = {
                  'draft': 'bg-gray-100 text-gray-700 border border-gray-300',
                  'pending_approval': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
                  'approved': 'bg-green-100 text-green-800 border border-green-300',
                  'rejected': 'bg-red-100 text-red-800 border border-red-300'
                };
                const approvalIcons = {
                  'draft': 'fa-file-alt',
                  'pending_approval': 'fa-clock',
                  'approved': 'fa-check-circle',
                  'rejected': 'fa-times-circle'
                };
                
                return `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">${project.project_code}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">${project.project_name}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${project.client_name}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    <div class="text-xs">${project.start_date}</div>
                    <div class="text-xs text-gray-500">to ${project.end_date}</div>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 text-xs rounded-full ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' :
                      project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'on-hold' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }">
                      <i class="fas ${
                        project.status === 'active' ? 'fa-play-circle' :
                        project.status === 'completed' ? 'fa-check-circle' :
                        project.status === 'on-hold' ? 'fa-pause-circle' :
                        'fa-circle'
                      } mr-1"></i>
                      ${project.status}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 text-xs rounded-full ${approvalColors[approvalStatus]}">
                      <i class="fas ${approvalIcons[approvalStatus]} mr-1"></i>
                      ${approvalStatus === 'pending_approval' ? 'Pending' : approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900">$${(project.total_cost || 0).toLocaleString()}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">$${(project.total_revenue || 0).toLocaleString()}</td>
                  <td class="px-4 py-3 text-sm ${project.margin_percentage > 20 ? 'text-green-600 font-medium' : project.margin_percentage < 10 ? 'text-red-600 font-medium' : 'text-gray-900'}">
                    ${(project.margin_percentage || 0).toFixed(1)}%
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <button onclick="viewProject(${project.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editProject(${project.id})" class="text-green-600 hover:text-green-800">
                      <i class="fas fa-edit"></i>
                    </button>
                  </td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
  
  // Personnel view
  personnelView() {
    return `
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Personnel Register</h1>
          <p class="text-gray-600">Manage staff and hourly rates</p>
        </div>
        <button onclick="showCreatePersonnelModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <i class="fas fa-plus mr-2"></i> Add Personnel
        </button>
      </div>
      
      <div class="card p-6">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hourly Cost</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Banded Rate</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${state.personnel.map(person => `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">${person.employee_id}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">${person.employee_name}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${person.employee_role}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${person.employee_level || '-'}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">$${person.hourly_cost}/hr</td>
                  <td class="px-4 py-3 text-sm text-gray-900">${person.banded_rate ? '$' + person.banded_rate + '/hr' : '-'}</td>
                  <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 text-xs rounded-full ${person.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                      ${person.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
  
  // Integrations view
  integrationsView() {
    return `
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Integrations</h1>
        <p class="text-gray-600">Connect with Xero and Microsoft Project</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Xero Integration -->
        <div class="card p-6">
          <div class="flex items-center mb-4">
            <i class="fas fa-file-invoice text-3xl text-blue-600 mr-4"></i>
            <div>
              <h3 class="text-xl font-bold text-gray-800">Xero</h3>
              <p class="text-sm text-gray-600">Invoice and accounting integration</p>
            </div>
          </div>
          
          <div class="mb-4">
            <div class="flex items-center">
              <span id="xeroStatus" class="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800">
                <i class="fas fa-circle text-gray-400 mr-2"></i> Not configured
              </span>
            </div>
          </div>
          
          <div class="space-y-2">
            <button onclick="checkXeroStatus()" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
              <i class="fas fa-sync mr-2"></i> Check Status
            </button>
            <button onclick="connectXero()" class="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition">
              <i class="fas fa-plug mr-2"></i> Connect Xero
            </button>
          </div>
          
          <div class="mt-4 text-xs text-gray-500">
            <p><i class="fas fa-info-circle mr-1"></i> Requires Xero API credentials configured in Cloudflare secrets</p>
          </div>
        </div>
        
        <!-- Microsoft Project Integration -->
        <div class="card p-6">
          <div class="flex items-center mb-4">
            <i class="fas fa-project-diagram text-3xl text-green-600 mr-4"></i>
            <div>
              <h3 class="text-xl font-bold text-gray-800">Microsoft Project</h3>
              <p class="text-sm text-gray-600">Project planning integration</p>
            </div>
          </div>
          
          <div class="mb-4">
            <div class="flex items-center">
              <span id="mspStatus" class="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800">
                <i class="fas fa-circle text-gray-400 mr-2"></i> Not configured
              </span>
            </div>
          </div>
          
          <div class="space-y-2">
            <button onclick="checkMSPStatus()" class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
              <i class="fas fa-sync mr-2"></i> Check Status
            </button>
            <button onclick="uploadMSPFile()" class="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition">
              <i class="fas fa-upload mr-2"></i> Upload MS Project File
            </button>
          </div>
          
          <div class="mt-4 text-xs text-gray-500">
            <p><i class="fas fa-info-circle mr-1"></i> Upload MS Project XML files to import tasks and resources</p>
          </div>
        </div>
      </div>
      
      <div class="card p-6 mt-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Configuration Instructions</h3>
        <div class="space-y-4 text-sm text-gray-600">
          <div>
            <h4 class="font-medium text-gray-800 mb-2"><i class="fas fa-cog mr-2"></i> Xero Setup</h4>
            <ol class="list-decimal list-inside space-y-1 ml-4">
              <li>Create a Xero app at <a href="https://developer.xero.com" target="_blank" class="text-blue-600 hover:underline">developer.xero.com</a></li>
              <li>Get your Client ID and Client Secret</li>
              <li>Add to Cloudflare secrets: <code class="bg-gray-100 px-2 py-1 rounded">XERO_CLIENT_ID</code> and <code class="bg-gray-100 px-2 py-1 rounded">XERO_CLIENT_SECRET</code></li>
              <li>Click "Connect Xero" to authorize</li>
            </ol>
          </div>
          
          <div>
            <h4 class="font-medium text-gray-800 mb-2"><i class="fas fa-cog mr-2"></i> Microsoft Project Setup</h4>
            <ol class="list-decimal list-inside space-y-1 ml-4">
              <li>Export your project as XML from Microsoft Project</li>
              <li>Use the "Upload MS Project File" button to import tasks</li>
              <li>Tasks will be automatically mapped to cost line items</li>
            </ol>
          </div>
        </div>
      </div>
    `;
  },
  
  // Manager Settings view
  managerSettingsView() {
    return `
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Manager Settings</h1>
        <p class="text-gray-600">Manage clients, materials, employees, and system settings</p>
      </div>
      
      <!-- Settings Tabs -->
      <div class="mb-6 border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <a href="#" onclick="showManagerTab('clients')" id="tab-clients" class="manager-tab border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600">
            <i class="fas fa-building mr-2"></i> Clients (CRM)
          </a>
          <a href="#" onclick="showManagerTab('materials')" id="tab-materials" class="manager-tab border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
            <i class="fas fa-boxes mr-2"></i> Materials Master
          </a>
          <a href="#" onclick="showManagerTab('employees')" id="tab-employees" class="manager-tab border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
            <i class="fas fa-user-tie mr-2"></i> Employees
          </a>
          <a href="#" onclick="showManagerTab('system')" id="tab-system" class="manager-tab border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
            <i class="fas fa-cogs mr-2"></i> System Settings
          </a>
        </nav>
      </div>
      
      <!-- Tab Content -->
      <div id="managerTabContent">
        ${this.clientsTabContent()}
      </div>
    `;
  },
  
  // Clients Tab Content
  clientsTabContent() {
    return `
      <div class="card p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-800">
            <i class="fas fa-building text-blue-600 mr-2"></i> Client Database (CRM)
          </h2>
          <button onclick="showAddClientModal()" class="btn-primary">
            <i class="fas fa-plus mr-2"></i> Add New Client
          </button>
        </div>
        
        <!-- Search and Filters -->
        <div class="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" id="clientSearch" placeholder="Search clients..." 
                 onkeyup="filterClients()"
                 class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <select id="clientTypeFilter" onchange="filterClients()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Types</option>
            <option value="Corporate">Corporate</option>
            <option value="Government">Government</option>
            <option value="NGO">NGO</option>
            <option value="Individual">Individual</option>
          </select>
          <select id="clientIndustryFilter" onchange="filterClients()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Industries</option>
            <option value="Construction">Construction</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Energy">Energy</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
          </select>
          <select id="clientStatusFilter" onchange="filterClients()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
        
        <!-- Clients Table -->
        <div class="overflow-x-auto">
          <table class="w-full" id="clientsTable">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client Code</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projects</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200" id="clientsTableBody">
              <tr>
                <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                  <p>Loading clients...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
  
  // Materials Tab Content
  materialsTabContent() {
    return `
      <div class="card p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-800">
            <i class="fas fa-boxes text-green-600 mr-2"></i> Materials Master Catalog
          </h2>
          <button onclick="showAddMaterialModal()" class="btn-primary">
            <i class="fas fa-plus mr-2"></i> Add New Material
          </button>
        </div>
        
        <!-- Search and Filters -->
        <div class="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" id="materialSearch" placeholder="Search materials..." 
                 onkeyup="filterMaterials()"
                 class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <select id="materialCategoryFilter" onchange="filterMaterials()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Categories</option>
            <option value="Equipment">Equipment</option>
            <option value="Software">Software</option>
            <option value="Services">Services</option>
            <option value="Consumables">Consumables</option>
            <option value="Hardware">Hardware</option>
          </select>
          <select id="materialCostTypeFilter" onchange="filterMaterials()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Cost Types</option>
            <option value="one-time">One-time</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
          <select id="materialStatusFilter" onchange="filterMaterials()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
        
        <!-- Materials Table -->
        <div class="overflow-x-auto">
          <table class="w-full" id="materialsTable">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material Code</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Type</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200" id="materialsTableBody">
              <tr>
                <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                  <p>Loading materials...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
  
  // Employees Tab Content
  employeesTabContent() {
    return `
      <div class="card p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-800">
            <i class="fas fa-user-tie text-purple-600 mr-2"></i> Employee Master List
          </h2>
          <button onclick="showAddEmployeeModal()" class="btn-primary">
            <i class="fas fa-plus mr-2"></i> Add New Employee
          </button>
        </div>
        
        <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <p class="text-sm text-blue-700">
            <i class="fas fa-info-circle mr-2"></i>
            This section manages the master employee list used for project assignments. This is different from system users.
          </p>
        </div>
        
        <!-- Employee filters will be added when personnel API is enhanced -->
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-users text-4xl mb-4"></i>
          <p>Employee management interface coming soon</p>
          <p class="text-sm mt-2">This will allow managing employee details, rates, and availability</p>
        </div>
      </div>
    `;
  },
  
  // System Settings Tab Content
  systemSettingsTabContent() {
    return `
      <div class="card p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-6">
          <i class="fas fa-cogs text-gray-600 mr-2"></i> System Configuration
        </h2>
        
        <div class="space-y-6">
          <!-- General Settings -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">General Settings</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                <select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Default Margin %</label>
                <input type="number" value="20" step="0.1" 
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
          </div>
          
          <!-- Approval Workflow -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Approval Workflow</h3>
            <div class="space-y-4">
              <div class="flex items-center">
                <input type="checkbox" id="requireApproval" checked 
                       class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="requireApproval" class="ml-2 text-sm text-gray-700">
                  Require manager approval for new projects
                </label>
              </div>
              <div class="flex items-center">
                <input type="checkbox" id="autoNotify" checked 
                       class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="autoNotify" class="ml-2 text-sm text-gray-700">
                  Auto-notify managers when projects are submitted
                </label>
              </div>
            </div>
          </div>
          
          <!-- Project Defaults -->
          <div class="pb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Project Defaults</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Default Project Status</label>
                <select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="planning">Planning</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Auto-generate Project Codes</label>
                <select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end">
            <button onclick="saveSystemSettings()" class="btn-primary">
              <i class="fas fa-save mr-2"></i> Save Settings
            </button>
          </div>
        </div>
      </div>
    `;
  },
  
  // Pending Approvals View
  pendingApprovalsView() {
    return `
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">
          <i class="fas fa-clipboard-check text-purple-600 mr-2"></i> Pending Approvals
        </h1>
        <p class="text-gray-600">Review and approve/reject project submissions</p>
      </div>
      
      <div class="mb-6 flex items-center justify-between">
        <div class="flex gap-3">
          <button onclick="loadPendingApprovals()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-sync mr-2"></i> Refresh
          </button>
          <select id="approvalStatusFilter" onchange="filterApprovals()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="pending_approval">Pending Approval</option>
            <option value="all">All Projects</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div class="text-sm text-gray-600">
          <i class="fas fa-info-circle mr-1"></i> 
          <span id="approvalCount">Loading...</span>
        </div>
      </div>
      
      <div id="pendingApprovalsList" class="space-y-4">
        <div class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500">Loading pending approvals...</p>
        </div>
      </div>
    `;
  }
};

async function loadInitialData() {
  try {
    const [projectsRes, personnelRes] = await Promise.all([
      api.getProjects(),
      api.getPersonnel()
    ]);
    
    state.projects = projectsRes.data || [];
    state.personnel = personnelRes.data || [];
  } catch (error) {
    console.error('Failed to load initial data:', error);
  }
}

function logout() {
  alert('Authentication is disabled for this preview build.');
}

function showView(view) {
  const targetView = view;
  state.currentView = targetView;
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = components.dashboardView();

  const mainContent = document.getElementById('mainContent');
  if (!mainContent) {
    return;
  }

  if (targetView === 'dashboard') {
    mainContent.innerHTML = components.overviewContent();
  } else if (targetView === 'projects') {
    mainContent.innerHTML = components.projectsView();
  } else if (targetView === 'personnel') {
    mainContent.innerHTML = components.personnelView();
  } else if (targetView === 'manager-settings') {
    mainContent.innerHTML = components.managerSettingsView();
    // Load clients data when entering manager settings
    loadClientsData();
  } else if (targetView === 'pending-approvals') {
    mainContent.innerHTML = components.pendingApprovalsView();
    // Load pending approvals when entering view
    loadPendingApprovals();
  } else if (targetView === 'integrations') {
    mainContent.innerHTML = components.integrationsView();
  }
}

async function viewProject(id) {
  try {
    const response = await api.getProject(id);
    if (response.success) {
      state.currentProject = response.data;
      alert(`Project: ${state.currentProject.project_name}\nClient: ${state.currentProject.client_name}\nTotal Cost: $${state.currentProject.total_cost}`);
    }
  } catch (error) {
    alert('Failed to load project details');
  }
}

function showCreateProjectModal() {
  // Initialize and show the project creation wizard
  const mainContent = document.getElementById('mainContent');
  
  // Create wizard container
  const wizardContainer = document.createElement('div');
  wizardContainer.id = 'wizardContainer';
  wizardContainer.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto';
  wizardContainer.innerHTML = '<div id="wizardContent" class="w-full max-w-6xl p-4"></div>';
  
  document.body.appendChild(wizardContainer);
  
  // Initialize wizard
  if (window.ProjectWizard) {
    ProjectWizard.init();
  } else {
    alert('Wizard not loaded. Please refresh the page.');
  }
}

function showCreatePersonnelModal() {
  alert('Create Personnel Modal - To be implemented with full form');
}

async function checkXeroStatus() {
  try {
    const response = await api.request('/integrations/xero/status');
    const statusEl = document.getElementById('xeroStatus');
    if (response.data.connected) {
      statusEl.innerHTML = '<i class="fas fa-circle text-green-400 mr-2"></i> Connected';
      statusEl.className = 'px-3 py-1 text-sm rounded-full bg-green-100 text-green-800';
    } else {
      statusEl.innerHTML = '<i class="fas fa-circle text-yellow-400 mr-2"></i> ' + response.data.message;
      statusEl.className = 'px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800';
    }
  } catch (error) {
    alert('Failed to check Xero status');
  }
}

function connectXero() {
  alert('Xero OAuth flow - To be implemented\n\nPlease configure XERO_CLIENT_ID and XERO_CLIENT_SECRET in Cloudflare secrets first.');
}

async function checkMSPStatus() {
  try {
    const response = await api.request('/integrations/msp/status');
    const statusEl = document.getElementById('mspStatus');
    statusEl.innerHTML = '<i class="fas fa-circle text-blue-400 mr-2"></i> ' + response.data.message;
    statusEl.className = 'px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800';
  } catch (error) {
    alert('Failed to check MS Project status');
  }
}

function uploadMSPFile() {
  alert('MS Project file upload - To be implemented\n\nExport your project as XML from Microsoft Project and upload here.');
}

// Manager Settings Functions
let managedData = {
  clients: [],
  materials: [],
  filteredClients: [],
  filteredMaterials: []
};

function showManagerTab(tab) {
  // Update tab styling
  document.querySelectorAll('.manager-tab').forEach(t => {
    t.classList.remove('border-blue-500', 'text-blue-600');
    t.classList.add('border-transparent', 'text-gray-500');
  });
  document.getElementById(`tab-${tab}`).classList.remove('border-transparent', 'text-gray-500');
  document.getElementById(`tab-${tab}`).classList.add('border-blue-500', 'text-blue-600');
  
  // Update content
  const contentDiv = document.getElementById('managerTabContent');
  if (tab === 'clients') {
    contentDiv.innerHTML = components.clientsTabContent();
    loadClientsData();
  } else if (tab === 'materials') {
    contentDiv.innerHTML = components.materialsTabContent();
    loadMaterialsData();
  } else if (tab === 'employees') {
    contentDiv.innerHTML = components.employeesTabContent();
  } else if (tab === 'system') {
    contentDiv.innerHTML = components.systemSettingsTabContent();
  }
}

async function loadClientsData() {
  try {
    const response = await api.request('/clients');
    if (response.success) {
      managedData.clients = response.data;
      managedData.filteredClients = response.data;
      renderClientsTable();
    }
  } catch (error) {
    console.error('Failed to load clients:', error);
    document.getElementById('clientsTableBody').innerHTML = `
      <tr>
        <td colspan="8" class="px-4 py-8 text-center text-red-500">
          <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
          <p>Failed to load clients</p>
        </td>
      </tr>
    `;
  }
}

function renderClientsTable() {
  const tbody = document.getElementById('clientsTableBody');
  if (!tbody) return;
  
  if (managedData.filteredClients.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-4 py-8 text-center text-gray-500">
          <i class="fas fa-inbox text-2xl mb-2"></i>
          <p>No clients found</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = managedData.filteredClients.map(client => `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-3 text-sm font-medium text-gray-900">${client.client_code}</td>
      <td class="px-4 py-3 text-sm text-gray-900">${client.client_name}</td>
      <td class="px-4 py-3 text-sm text-gray-600">${client.client_type || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-600">${client.industry || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-600">
        ${client.primary_contact_name ? `
          <div>${client.primary_contact_name}</div>
          <div class="text-xs text-gray-500">${client.primary_contact_email || ''}</div>
        ` : '-'}
      </td>
      <td class="px-4 py-3 text-sm text-center">
        <button onclick="viewClientProjects(${client.id})" class="text-blue-600 hover:text-blue-800">
          <i class="fas fa-folder mr-1"></i> View
        </button>
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="px-2 py-1 text-xs rounded-full ${client.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
          ${client.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td class="px-4 py-3 text-sm">
        <button onclick="editClient(${client.id})" class="text-blue-600 hover:text-blue-800 mr-3">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="deleteClient(${client.id})" class="text-red-600 hover:text-red-800">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function filterClients() {
  const search = document.getElementById('clientSearch')?.value.toLowerCase() || '';
  const typeFilter = document.getElementById('clientTypeFilter')?.value || '';
  const industryFilter = document.getElementById('clientIndustryFilter')?.value || '';
  const statusFilter = document.getElementById('clientStatusFilter')?.value || '';
  
  managedData.filteredClients = managedData.clients.filter(client => {
    const matchesSearch = !search || 
      client.client_name.toLowerCase().includes(search) || 
      client.client_code.toLowerCase().includes(search);
    const matchesType = !typeFilter || client.client_type === typeFilter;
    const matchesIndustry = !industryFilter || client.industry === industryFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && client.is_active) || 
      (statusFilter === 'inactive' && !client.is_active);
    
    return matchesSearch && matchesType && matchesIndustry && matchesStatus;
  });
  
  renderClientsTable();
}

async function loadMaterialsData() {
  try {
    const response = await api.request('/materials-master');
    if (response.success) {
      managedData.materials = response.data;
      managedData.filteredMaterials = response.data;
      renderMaterialsTable();
    }
  } catch (error) {
    console.error('Failed to load materials:', error);
    document.getElementById('materialsTableBody').innerHTML = `
      <tr>
        <td colspan="8" class="px-4 py-8 text-center text-red-500">
          <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
          <p>Failed to load materials</p>
        </td>
      </tr>
    `;
  }
}

function renderMaterialsTable() {
  const tbody = document.getElementById('materialsTableBody');
  if (!tbody) return;
  
  if (managedData.filteredMaterials.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-4 py-8 text-center text-gray-500">
          <i class="fas fa-inbox text-2xl mb-2"></i>
          <p>No materials found</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = managedData.filteredMaterials.map(material => `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-3 text-sm font-medium text-gray-900">${material.material_code}</td>
      <td class="px-4 py-3 text-sm text-gray-900">${material.material_name}</td>
      <td class="px-4 py-3 text-sm text-gray-600">${material.material_category || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-900 font-medium">$${parseFloat(material.default_unit_cost).toLocaleString()}</td>
      <td class="px-4 py-3 text-sm text-gray-600">${material.unit_of_measure}</td>
      <td class="px-4 py-3 text-sm">
        <span class="px-2 py-1 text-xs rounded-full ${
          material.default_cost_type === 'one-time' ? 'bg-blue-100 text-blue-800' : 
          material.default_cost_type === 'monthly' ? 'bg-purple-100 text-purple-800' : 
          'bg-orange-100 text-orange-800'
        }">
          ${material.default_cost_type}
        </span>
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="px-2 py-1 text-xs rounded-full ${material.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
          ${material.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td class="px-4 py-3 text-sm">
        <button onclick="editMaterial(${material.id})" class="text-blue-600 hover:text-blue-800 mr-3">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="deleteMaterial(${material.id})" class="text-red-600 hover:text-red-800">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function filterMaterials() {
  const search = document.getElementById('materialSearch')?.value.toLowerCase() || '';
  const categoryFilter = document.getElementById('materialCategoryFilter')?.value || '';
  const costTypeFilter = document.getElementById('materialCostTypeFilter')?.value || '';
  const statusFilter = document.getElementById('materialStatusFilter')?.value || '';
  
  managedData.filteredMaterials = managedData.materials.filter(material => {
    const matchesSearch = !search || 
      material.material_name.toLowerCase().includes(search) || 
      material.material_code.toLowerCase().includes(search);
    const matchesCategory = !categoryFilter || material.material_category === categoryFilter;
    const matchesCostType = !costTypeFilter || material.default_cost_type === costTypeFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && material.is_active) || 
      (statusFilter === 'inactive' && !material.is_active);
    
    return matchesSearch && matchesCategory && matchesCostType && matchesStatus;
  });
  
  renderMaterialsTable();
}

// Modal and CRUD Functions
function showAddClientModal() {
  showClientModal();
}

function editClient(id) {
  const client = managedData.clients.find(c => c.id === id);
  if (client) {
    showClientModal(client);
  }
}

function showClientModal(clientData = null) {
  const isEdit = !!clientData;
  const title = isEdit ? 'Edit Client' : 'Add New Client';
  
  const modalHTML = `
    <div id="clientModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-building text-blue-600 mr-2"></i>${title}
          </h2>
          <button onclick="closeClientModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <form id="clientForm" class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Basic Information -->
            <div class="md:col-span-2">
              <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Basic Information</h3>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Client Code <span class="text-red-500">*</span>
              </label>
              <input type="text" name="client_code" required
                     value="${clientData?.client_code || ''}"
                     ${isEdit ? 'readonly' : ''}
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isEdit ? 'bg-gray-100' : ''}">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Client Name <span class="text-red-500">*</span>
              </label>
              <input type="text" name="client_name" required
                     value="${clientData?.client_name || ''}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Client Type</label>
              <select name="client_type"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select Type</option>
                <option value="Corporate" ${clientData?.client_type === 'Corporate' ? 'selected' : ''}>Corporate</option>
                <option value="Government" ${clientData?.client_type === 'Government' ? 'selected' : ''}>Government</option>
                <option value="NGO" ${clientData?.client_type === 'NGO' ? 'selected' : ''}>NGO</option>
                <option value="Individual" ${clientData?.client_type === 'Individual' ? 'selected' : ''}>Individual</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Industry</label>
              <select name="industry"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select Industry</option>
                <option value="Construction" ${clientData?.industry === 'Construction' ? 'selected' : ''}>Construction</option>
                <option value="Infrastructure" ${clientData?.industry === 'Infrastructure' ? 'selected' : ''}>Infrastructure</option>
                <option value="Energy" ${clientData?.industry === 'Energy' ? 'selected' : ''}>Energy</option>
                <option value="Technology" ${clientData?.industry === 'Technology' ? 'selected' : ''}>Technology</option>
                <option value="Healthcare" ${clientData?.industry === 'Healthcare' ? 'selected' : ''}>Healthcare</option>
                <option value="Manufacturing" ${clientData?.industry === 'Manufacturing' ? 'selected' : ''}>Manufacturing</option>
              </select>
            </div>
            
            <!-- Contact Information -->
            <div class="md:col-span-2 mt-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Contact Information</h3>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Primary Contact Name</label>
              <input type="text" name="primary_contact_name"
                     value="${clientData?.primary_contact_name || ''}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Primary Contact Email</label>
              <input type="email" name="primary_contact_email"
                     value="${clientData?.primary_contact_email || ''}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Primary Contact Phone</label>
              <input type="tel" name="primary_contact_phone"
                     value="${clientData?.primary_contact_phone || ''}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input type="url" name="website"
                     value="${clientData?.website || ''}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            
            <!-- Address -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea name="address" rows="2"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">${clientData?.address || ''}</textarea>
            </div>
            
            <!-- Financial Information -->
            <div class="md:col-span-2 mt-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Financial Information</h3>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
              <input type="text" name="payment_terms"
                     value="${clientData?.payment_terms || ''}"
                     placeholder="e.g., Net 30, 50% upfront"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Credit Limit</label>
              <input type="number" name="credit_limit" step="0.01"
                     value="${clientData?.credit_limit || ''}"
                     placeholder="0.00"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            
            <!-- Status -->
            <div class="md:col-span-2">
              <div class="flex items-center">
                <input type="checkbox" name="is_active" id="client_is_active"
                       ${!clientData || clientData.is_active ? 'checked' : ''}
                       class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="client_is_active" class="ml-2 text-sm text-gray-700">
                  Active Client
                </label>
              </div>
            </div>
            
            <!-- Notes -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea name="notes" rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">${clientData?.notes || ''}</textarea>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button type="button" onclick="closeClientModal()"
                    class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit"
                    class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <i class="fas fa-save mr-2"></i>${isEdit ? 'Update' : 'Create'} Client
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add form submit handler
  document.getElementById('clientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const clientPayload = {
      client_code: formData.get('client_code'),
      client_name: formData.get('client_name'),
      client_type: formData.get('client_type') || null,
      industry: formData.get('industry') || null,
      primary_contact_name: formData.get('primary_contact_name') || null,
      primary_contact_email: formData.get('primary_contact_email') || null,
      primary_contact_phone: formData.get('primary_contact_phone') || null,
      website: formData.get('website') || null,
      address: formData.get('address') || null,
      payment_terms: formData.get('payment_terms') || null,
      credit_limit: formData.get('credit_limit') ? parseFloat(formData.get('credit_limit')) : null,
      is_active: formData.get('is_active') === 'on',
      notes: formData.get('notes') || null
    };
    
    try {
      const endpoint = isEdit ? `/clients/${clientData.id}` : '/clients';
      const method = isEdit ? 'PUT' : 'POST';
      const response = await api.request(endpoint, { 
        method, 
        body: clientPayload 
      });
      
      if (response.success) {
        alert(`Client ${isEdit ? 'updated' : 'created'} successfully!`);
        closeClientModal();
        await loadClientsData();
      }
    } catch (error) {
      alert(`Failed to ${isEdit ? 'update' : 'create'} client: ${error.error || 'Unknown error'}`);
    }
  });
}

function closeClientModal() {
  const modal = document.getElementById('clientModal');
  if (modal) {
    modal.remove();
  }
}

async function deleteClient(id) {
  if (!confirm('Are you sure you want to delete this client?')) return;
  
  try {
    const response = await api.request(`/clients/${id}`, { method: 'DELETE' });
    if (response.success) {
      alert('Client deleted successfully');
      await loadClientsData();
    }
  } catch (error) {
    alert('Failed to delete client');
  }
}

async function viewClientProjects(id) {
  try {
    const response = await api.request(`/clients/${id}/projects`);
    if (response.success) {
      const { projects, summary } = response.data;
      alert(`Client Projects:\n\nTotal: ${summary.total_projects}\nRevenue: $${summary.total_revenue.toLocaleString()}\nAvg Margin: ${summary.average_margin.toFixed(1)}%`);
    }
  } catch (error) {
    alert('Failed to load client projects');
  }
}

function showAddMaterialModal() {
  showMaterialModal();
}

function editMaterial(id) {
  const material = managedData.materials.find(m => m.id === id);
  if (material) {
    showMaterialModal(material);
  }
}

function showMaterialModal(materialData = null) {
  const isEdit = !!materialData;
  const title = isEdit ? 'Edit Material' : 'Add New Material';
  
  const modalHTML = `
    <div id="materialModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-boxes text-green-600 mr-2"></i>${title}
          </h2>
          <button onclick="closeMaterialModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <form id="materialForm" class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Basic Information -->
            <div class="md:col-span-2">
              <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Basic Information</h3>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Material Code <span class="text-red-500">*</span>
              </label>
              <input type="text" name="material_code" required
                     value="${materialData?.material_code || ''}"
                     ${isEdit ? 'readonly' : ''}
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${isEdit ? 'bg-gray-100' : ''}">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Material Name <span class="text-red-500">*</span>
              </label>
              <input type="text" name="material_name" required
                     value="${materialData?.material_name || ''}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select name="material_category"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option value="">Select Category</option>
                <option value="Equipment" ${materialData?.material_category === 'Equipment' ? 'selected' : ''}>Equipment</option>
                <option value="Software" ${materialData?.material_category === 'Software' ? 'selected' : ''}>Software</option>
                <option value="Services" ${materialData?.material_category === 'Services' ? 'selected' : ''}>Services</option>
                <option value="Consumables" ${materialData?.material_category === 'Consumables' ? 'selected' : ''}>Consumables</option>
                <option value="Hardware" ${materialData?.material_category === 'Hardware' ? 'selected' : ''}>Hardware</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
              <input type="text" name="supplier_name"
                     value="${materialData?.supplier_name || ''}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
            </div>
            
            <!-- Pricing Information -->
            <div class="md:col-span-2 mt-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Pricing Information</h3>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Default Unit Cost <span class="text-red-500">*</span>
              </label>
              <input type="number" name="default_unit_cost" required step="0.01"
                     value="${materialData?.default_unit_cost || ''}"
                     placeholder="0.00"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Unit of Measure <span class="text-red-500">*</span>
              </label>
              <input type="text" name="unit_of_measure" required
                     value="${materialData?.unit_of_measure || ''}"
                     placeholder="e.g., each, license, month, hour"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Cost Type</label>
              <select name="default_cost_type"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option value="one-time" ${!materialData || materialData.default_cost_type === 'one-time' ? 'selected' : ''}>One-time</option>
                <option value="monthly" ${materialData?.default_cost_type === 'monthly' ? 'selected' : ''}>Monthly</option>
                <option value="annual" ${materialData?.default_cost_type === 'annual' ? 'selected' : ''}>Annual</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Minimum Order Quantity</label>
              <input type="number" name="minimum_order_qty" step="1"
                     value="${materialData?.minimum_order_qty || ''}"
                     placeholder="1"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Lead Time (days)</label>
              <input type="number" name="lead_time_days" step="1"
                     value="${materialData?.lead_time_days || ''}"
                     placeholder="0"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
            </div>
            
            <!-- Status -->
            <div class="md:col-span-2 mt-4">
              <div class="flex items-center">
                <input type="checkbox" name="is_active" id="material_is_active"
                       ${!materialData || materialData.is_active ? 'checked' : ''}
                       class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                <label for="material_is_active" class="ml-2 text-sm text-gray-700">
                  Active Material
                </label>
              </div>
            </div>
            
            <!-- Description -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea name="description" rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">${materialData?.description || ''}</textarea>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button type="button" onclick="closeMaterialModal()"
                    class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit"
                    class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <i class="fas fa-save mr-2"></i>${isEdit ? 'Update' : 'Create'} Material
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add form submit handler
  document.getElementById('materialForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const materialPayload = {
      material_code: formData.get('material_code'),
      material_name: formData.get('material_name'),
      material_category: formData.get('material_category') || null,
      default_unit_cost: parseFloat(formData.get('default_unit_cost')),
      unit_of_measure: formData.get('unit_of_measure'),
      supplier_name: formData.get('supplier_name') || null,
      default_cost_type: formData.get('default_cost_type') || 'one-time',
      minimum_order_qty: formData.get('minimum_order_qty') ? parseInt(formData.get('minimum_order_qty')) : null,
      lead_time_days: formData.get('lead_time_days') ? parseInt(formData.get('lead_time_days')) : null,
      is_active: formData.get('is_active') === 'on',
      description: formData.get('description') || null
    };
    
    try {
      const endpoint = isEdit ? `/materials-master/${materialData.id}` : '/materials-master';
      const method = isEdit ? 'PUT' : 'POST';
      const response = await api.request(endpoint, { 
        method, 
        body: materialPayload 
      });
      
      if (response.success) {
        alert(`Material ${isEdit ? 'updated' : 'created'} successfully!`);
        closeMaterialModal();
        await loadMaterialsData();
      }
    } catch (error) {
      alert(`Failed to ${isEdit ? 'update' : 'create'} material: ${error.error || 'Unknown error'}`);
    }
  });
}

function closeMaterialModal() {
  const modal = document.getElementById('materialModal');
  if (modal) {
    modal.remove();
  }
}

async function deleteMaterial(id) {
  if (!confirm('Are you sure you want to delete this material?')) return;
  
  try {
    const response = await api.request(`/materials-master/${id}`, { method: 'DELETE' });
    if (response.success) {
      alert('Material deleted successfully');
      await loadMaterialsData();
    }
  } catch (error) {
    alert('Failed to delete material');
  }
}

function showAddEmployeeModal() {
  alert('Add Employee Modal - Coming soon');
}

function saveSystemSettings() {
  alert('System settings saved!\n\nNote: Full backend integration coming soon');
}

// Pending Approvals Functions
let pendingApprovalsData = {
  projects: [],
  filtered: []
};

async function loadPendingApprovals() {
  try {
    const statusFilter = document.getElementById('approvalStatusFilter')?.value || 'pending_approval';
    const endpoint = statusFilter === 'all' ? '/projects' : '/projects/pending-approval';
    
    const response = await api.request(endpoint);
    if (response.success) {
      pendingApprovalsData.projects = response.data;
      pendingApprovalsData.filtered = response.data;
      
      // Update badge count
      const pendingCount = response.data.filter(p => p.approval_status === 'pending_approval').length;
      const badge = document.getElementById('approvalBadge');
      if (badge) {
        badge.textContent = pendingCount;
        badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
      }
      
      renderPendingApprovals();
    }
  } catch (error) {
    console.error('Failed to load pending approvals:', error);
    document.getElementById('pendingApprovalsList').innerHTML = `
      <div class="card p-8 text-center">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-red-600 font-medium">Failed to load pending approvals</p>
        <p class="text-sm text-gray-600 mt-2">${error.message || 'Unknown error'}</p>
      </div>
    `;
  }
}

function renderPendingApprovals() {
  const container = document.getElementById('pendingApprovalsList');
  const countDisplay = document.getElementById('approvalCount');
  
  if (!container) return;
  
  if (countDisplay) {
    countDisplay.textContent = `${pendingApprovalsData.filtered.length} project(s)`;
  }
  
  if (pendingApprovalsData.filtered.length === 0) {
    container.innerHTML = `
      <div class="card p-12 text-center">
        <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
        <p class="text-xl font-medium text-gray-600 mb-2">No Projects Found</p>
        <p class="text-gray-500">There are no projects matching your filter criteria</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = pendingApprovalsData.filtered.map(project => {
    const statusColors = {
      'pending_approval': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'approved': 'bg-green-100 text-green-800 border-green-300',
      'rejected': 'bg-red-100 text-red-800 border-red-300',
      'draft': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    
    const statusIcons = {
      'pending_approval': 'fa-clock',
      'approved': 'fa-check-circle',
      'rejected': 'fa-times-circle',
      'draft': 'fa-file'
    };
    
    const statusClass = statusColors[project.approval_status] || 'bg-gray-100 text-gray-800';
    const statusIcon = statusIcons[project.approval_status] || 'fa-question';
    
    return `
      <div class="card p-6 hover:shadow-lg transition">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-xl font-bold text-gray-800">${project.project_name}</h3>
              <span class="px-3 py-1 text-xs rounded-full border ${statusClass}">
                <i class="fas ${statusIcon} mr-1"></i> ${project.approval_status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p class="text-sm text-gray-600">
              <i class="fas fa-hashtag mr-1"></i> ${project.project_code} 
              <span class="mx-2">|</span>
              <i class="fas fa-building mr-1"></i> ${project.client_name}
            </p>
          </div>
          ${project.approval_status === 'pending_approval' ? `
            <div class="flex gap-2">
              <button onclick="reviewProjectApproval(${project.id})" 
                      class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                <i class="fas fa-eye mr-2"></i> Review
              </button>
            </div>
          ` : ''}
        </div>
        
        <div class="grid grid-cols-4 gap-4 mb-4">
          <div>
            <p class="text-xs text-gray-500 mb-1">Total Cost</p>
            <p class="text-lg font-bold text-blue-600">$${(project.total_cost || 0).toLocaleString()}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Revenue</p>
            <p class="text-lg font-bold text-green-600">$${(project.total_revenue || 0).toLocaleString()}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Margin</p>
            <p class="text-lg font-bold ${(project.margin_percentage || 0) < 10 ? 'text-red-600' : 'text-green-600'}">
              ${(project.margin_percentage || 0).toFixed(1)}%
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Duration</p>
            <p class="text-sm font-medium text-gray-700">
              ${project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'} - 
              ${project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
        
        ${project.submitted_at ? `
          <div class="pt-4 border-t border-gray-200 text-sm text-gray-600">
            <i class="fas fa-clock mr-1"></i> Submitted: ${new Date(project.submitted_at).toLocaleString()}
            ${project.submitted_by_name ? ` by <strong>${project.submitted_by_name}</strong>` : ''}
          </div>
        ` : ''}
        
        ${project.approved_at ? `
          <div class="pt-4 border-t border-gray-200 text-sm text-green-600">
            <i class="fas fa-check mr-1"></i> Approved: ${new Date(project.approved_at).toLocaleString()}
          </div>
        ` : ''}
        
        ${project.rejected_at ? `
          <div class="pt-4 border-t border-gray-200 text-sm text-red-600">
            <i class="fas fa-times mr-1"></i> Rejected: ${new Date(project.rejected_at).toLocaleString()}
            ${project.rejection_reason ? `<br><span class="ml-5">"${project.rejection_reason}"</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function filterApprovals() {
  const statusFilter = document.getElementById('approvalStatusFilter')?.value;
  
  if (statusFilter === 'all') {
    pendingApprovalsData.filtered = pendingApprovalsData.projects;
  } else {
    pendingApprovalsData.filtered = pendingApprovalsData.projects.filter(p => 
      p.approval_status === statusFilter
    );
  }
  
  renderPendingApprovals();
}

async function reviewProjectApproval(projectId) {
  try {
    // Load full project details
    const response = await api.request(`/projects/${projectId}`);
    if (response.success) {
      showApprovalReviewModal(response.data);
    }
  } catch (error) {
    alert('Failed to load project details');
  }
}

function showApprovalReviewModal(project) {
  const modalHTML = `
    <div id="approvalReviewModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-clipboard-check text-purple-600 mr-2"></i>
            Review Project Approval
          </h2>
          <button onclick="closeApprovalReviewModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div class="p-6">
          <!-- Project Overview -->
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">${project.project_name}</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><span class="text-gray-600">Project Code:</span> <span class="font-medium ml-2">${project.project_code}</span></div>
              <div><span class="text-gray-600">Client:</span> <span class="font-medium ml-2">${project.client_name}</span></div>
              <div><span class="text-gray-600">Status:</span> <span class="font-medium ml-2">${project.status}</span></div>
              <div><span class="text-gray-600">Duration:</span> <span class="font-medium ml-2">${project.start_date} to ${project.end_date}</span></div>
            </div>
          </div>
          
          <!-- Financial Summary -->
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="text-xs text-gray-600 mb-1">Total Cost</p>
              <p class="text-2xl font-bold text-blue-600">$${(project.total_cost || 0).toLocaleString()}</p>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <p class="text-xs text-gray-600 mb-1">Expected Revenue</p>
              <p class="text-2xl font-bold text-green-600">$${(project.total_revenue || 0).toLocaleString()}</p>
            </div>
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p class="text-xs text-gray-600 mb-1">Margin</p>
              <p class="text-2xl font-bold ${(project.margin_percentage || 0) < 10 ? 'text-red-600' : 'text-purple-600'}">
                ${(project.margin_percentage || 0).toFixed(1)}%
              </p>
            </div>
          </div>
          
          ${(project.margin_percentage || 0) < 15 ? `
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div class="flex">
                <i class="fas fa-exclamation-triangle text-yellow-600 mr-3 mt-1"></i>
                <div>
                  <p class="font-medium text-yellow-800">Margin Warning</p>
                  <p class="text-sm text-yellow-700">Project margin is ${(project.margin_percentage || 0) < 5 ? 'critically low' : 'below 15%'}. Consider reviewing before approval.</p>
                </div>
              </div>
            </div>
          ` : ''}
          
          <!-- Approval Actions -->
          <div class="border-t border-gray-200 pt-6">
            <h4 class="font-semibold text-gray-800 mb-4">Approval Decision</h4>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Comments</label>
              <textarea id="approvalComments" rows="3" 
                        placeholder="Add your review comments..."
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"></textarea>
            </div>
            
            <div id="rejectionReason" style="display:none;" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Rejection Reason <span class="text-red-500">*</span></label>
              <textarea id="rejectionReasonText" rows="2" 
                        placeholder="Please provide a reason for rejection..."
                        class="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"></textarea>
            </div>
            
            <div class="flex justify-end gap-3">
              <button type="button" onclick="closeApprovalReviewModal()" 
                      class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button type="button" onclick="showRejectionReason()" 
                      class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                <i class="fas fa-times mr-2"></i> Reject Project
              </button>
              <button type="button" onclick="approveProject(${project.id})" 
                      class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                <i class="fas fa-check mr-2"></i> Approve Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeApprovalReviewModal() {
  const modal = document.getElementById('approvalReviewModal');
  if (modal) {
    modal.remove();
  }
}

function showRejectionReason() {
  const reasonDiv = document.getElementById('rejectionReason');
  if (reasonDiv) {
    reasonDiv.style.display = 'block';
    document.getElementById('rejectionReasonText')?.focus();
  }
  
  // Change button behavior
  const rejectBtn = event.target;
  rejectBtn.onclick = () => {
    const projectId = parseInt(rejectBtn.closest('.bg-white').querySelector('button[onclick^="approveProject"]').getAttribute('onclick').match(/\d+/)[0]);
    rejectProject(projectId);
  };
  rejectBtn.innerHTML = '<i class="fas fa-times mr-2"></i> Confirm Rejection';
}

async function approveProject(projectId) {
  const comments = document.getElementById('approvalComments')?.value || '';
  
  if (!confirm('Are you sure you want to APPROVE this project?')) {
    return;
  }
  
  try {
    const response = await api.request(`/projects/${projectId}/approve`, {
      method: 'POST',
      body: { comments }
    });
    
    if (response.success) {
      alert('Project approved successfully!');
      closeApprovalReviewModal();
      await loadPendingApprovals();
    }
  } catch (error) {
    alert(`Failed to approve project: ${error.error || 'Unknown error'}`);
  }
}

async function rejectProject(projectId) {
  const comments = document.getElementById('approvalComments')?.value || '';
  const rejectionReason = document.getElementById('rejectionReasonText')?.value;
  
  if (!rejectionReason || rejectionReason.trim() === '') {
    alert('Please provide a reason for rejection');
    return;
  }
  
  if (!confirm('Are you sure you want to REJECT this project?')) {
    return;
  }
  
  try {
    const response = await api.request(`/projects/${projectId}/reject`, {
      method: 'POST',
      body: { comments, rejection_reason: rejectionReason }
    });
    
    if (response.success) {
      alert('Project rejected');
      closeApprovalReviewModal();
      await loadPendingApprovals();
    }
  } catch (error) {
    alert(`Failed to reject project: ${error.error || 'Unknown error'}`);
  }
}

// Initialize app
(async function init() {
  await loadInitialData();
  showView('dashboard');
})();
