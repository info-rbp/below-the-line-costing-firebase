// BTL Costing Application - Frontend
// Single Page Application using Vanilla JavaScript

// Global state
const state = {
  user: null,
  token: null,
  currentView: 'login',
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
    
    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }
    
    try {
      const response = await axios({
        url: `${this.baseURL}${endpoint}`,
        method: options.method || 'GET',
        headers,
        data: options.body
      });
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired, redirect to login
        state.token = null;
        state.user = null;
        localStorage.removeItem('token');
        showView('login');
      }
      throw error.response?.data || error;
    }
  },
  
  // Auth endpoints
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  },
  
  async getMe() {
    return this.request('/auth/me');
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
  // Login view
  loginView() {
    return `
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="card p-8 max-w-md w-full">
          <div class="text-center mb-8">
            <i class="fas fa-calculator text-5xl text-blue-600 mb-4"></i>
            <h1 class="text-3xl font-bold text-gray-800">BTL Costing</h1>
            <p class="text-gray-600 mt-2">Below the Line Cost Management</p>
          </div>
          
          <form id="loginForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@jl2group.com">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password">
            </div>
            
            <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
              <i class="fas fa-sign-in-alt mr-2"></i> Sign In
            </button>
          </form>
          
          <div id="loginError" class="mt-4 hidden">
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <i class="fas fa-exclamation-circle mr-2"></i>
              <span id="loginErrorText">Invalid credentials</span>
            </div>
          </div>
          
          <div class="mt-6 text-center text-sm text-gray-600">
            <p>Demo credentials:</p>
            <p><strong>Admin:</strong> admin@jl2group.com / admin123</p>
            <p><strong>Manager:</strong> manager@jl2group.com / admin123</p>
          </div>
        </div>
      </div>
    `;
  },
  
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
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${state.projects.map(project => `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">${project.project_code}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">${project.project_name}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${project.client_name}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${project.start_date} to ${project.end_date}</td>
                  <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 text-xs rounded-full ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' :
                      project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }">
                      ${project.status}
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
              `).join('')}
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
  }
};

// Event handlers
async function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const email = formData.get('email');
  const password = formData.get('password');
  
  try {
    const response = await api.login(email, password);
    
    if (response.success && response.token) {
      state.token = response.token;
      state.user = response.user;
      localStorage.setItem('token', response.token);
      
      // Load initial data
      await loadInitialData();
      
      showView('dashboard');
    }
  } catch (error) {
    document.getElementById('loginError').classList.remove('hidden');
    document.getElementById('loginErrorText').textContent = error.message || 'Login failed';
  }
}

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
  state.token = null;
  state.user = null;
  state.currentView = 'login';
  localStorage.removeItem('token');
  showView('login');
}

function showView(view) {
  state.currentView = view;
  const app = document.getElementById('app');
  
  if (view === 'login') {
    app.innerHTML = components.loginView();
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  } else {
    app.innerHTML = components.dashboardView();
    
    const mainContent = document.getElementById('mainContent');
    if (view === 'dashboard') {
      mainContent.innerHTML = components.overviewContent();
    } else if (view === 'projects') {
      mainContent.innerHTML = components.projectsView();
    } else if (view === 'personnel') {
      mainContent.innerHTML = components.personnelView();
    } else if (view === 'integrations') {
      mainContent.innerHTML = components.integrationsView();
    }
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

// Initialize app
(async function init() {
  // Check for existing token
  const savedToken = localStorage.getItem('token');
  if (savedToken) {
    state.token = savedToken;
    try {
      const response = await api.getMe();
      if (response.success) {
        state.user = response.data;
        await loadInitialData();
        showView('dashboard');
        return;
      }
    } catch (error) {
      localStorage.removeItem('token');
    }
  }
  
  showView('login');
})();
