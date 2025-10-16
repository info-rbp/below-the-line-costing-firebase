# BTL Costing Application

## Project Overview

**Below the Line (BTL) Costing Application** is a modern, lightweight web-based project costing and financial management system designed to replace complex spreadsheets with a streamlined database-driven solution.

### Key Features

- **Enhanced 6-Step Project Creation Wizard**: Complete wizard for creating projects from scratch
  - Step 1: Project Basics with **Client Dropdown from CRM** (8 pre-loaded clients)
  - Step 2: **Hierarchical Milestone Tree Builder** (3-level deep parent-child structure)
  - Step 3: Labour Costs (WBS builder with actual vs banded rate toggle)
  - Step 4: Material Costs with **Materials Master Integration** (30 pre-loaded materials)
  - Step 5: Payment Schedule (billing milestones with revenue tracking)
  - Step 6: Review & Create with **Approval Workflow Options** (Draft/Active/Submit)
  
- **Manager Settings Dashboard** (Admin/Manager Only)
  - **Clients CRM**: Complete customer relationship management
    - Full CRUD with 8 pre-loaded clients
    - Search & filters (type, industry, status)
    - Project history tracking
    - Add/Edit modal forms
  - **Materials Master Catalog**: Pre-defined materials library
    - 30 materials across 5 categories (Equipment, Software, Services, Consumables, Hardware)
    - Search & filters (category, cost type, status)
    - Standard costs and suppliers
    - Add/Edit modal forms
  - **Employee Master**: Manage employee database
  - **System Settings**: Configure system defaults
  
- **Approval Workflow System** (Manager/Admin Only)
  - **Pending Approvals View**: Review project submissions
  - **Approval Modal**: Approve/Reject with comments
  - Badge notifications showing pending count
  - Complete audit trail (submitted/approved/rejected timestamps)
  - Status indicators throughout the system
  
- **Enhanced Project Management**
  - **Project Status Indicators**: Visual badges with icons (Active, Completed, On-Hold, Planning)
  - **Approval Status Column**: Draft, Pending, Approved, Rejected badges
  - Track projects with client information, dates, and financial settings
  - Real-time margin warnings
  
- **Personnel Register**: Manage staff database with hourly costs and banded rates
- **Cost Tracking**: Labour cost line items with actual vs banded rate options
- **Material Costs**: Non-labour costs with milestone, monthly, and one-time classifications
- **G&A Calculations**: Automatic General & Administrative cost allocation
- **Multi-user Authentication**: Role-based access control (Admin, Manager, User, Viewer)
- **Real-time Dashboard**: Live project metrics, margin tracking, and cost summaries
- **Third-party Integrations**: Ready for Xero and Microsoft Project API connections

## URLs

- **Development**: https://3000-itedfxbrbnbnmkdyi7ow9-2b54fc91.sandbox.novita.ai
- **API Health Check**: https://3000-itedfxbrbnbnmkdyi7ow9-2b54fc91.sandbox.novita.ai/api/health
- **GitHub**: (To be configured)
- **Production**: (To be deployed to Cloudflare Pages)

## Technology Stack

- **Backend**: Hono (lightweight web framework)
- **Frontend**: Vanilla JavaScript with Tailwind CSS
- **Database**: Cloudflare D1 (SQLite-based)
- **Runtime**: Cloudflare Workers/Pages
- **Process Manager**: PM2 (development)
- **API Design**: RESTful with JWT authentication

## Data Architecture

### Core Data Models

1. **Users**: Authentication and role-based access
   - Admin, Manager, User, Viewer roles
   - JWT token-based authentication

2. **Projects**: Central project entity
   - Project code, name, client reference (FK to clients)
   - Tax rate, G&A percentage, status
   - **Approval workflow fields**: approval_status, submitted_at, approved_at, approved_by, rejection_reason
   - Calculated totals and margin

3. **Clients (CRM)**: Customer relationship management
   - Client code, name, type, industry
   - Primary contact information (name, email, phone)
   - Financial terms (payment terms, credit limit)
   - Address, website, notes
   - Active/inactive status
   - **Pre-loaded**: 8 clients across various industries

4. **Materials Master**: Pre-defined materials catalog
   - Material code, name, category
   - Default unit cost, unit of measure
   - Supplier name, lead time
   - Cost type (one-time, monthly, annual)
   - Minimum order quantity, description
   - Active/inactive status
   - **Pre-loaded**: 30 materials across 5 categories

5. **Project Approvals**: Approval audit trail
   - Project reference, approver reference
   - Action (submitted, approved, rejected)
   - Comments, timestamps
   - Complete history of approval actions

6. **Personnel**: Staff database
   - Employee ID, name, role, level
   - Hourly cost and banded rates

7. **Rate Bands**: Role-based costing rates
   - Band name, level, description
   - Standard hourly rates

8. **Milestones**: Project milestones with hierarchy
   - Milestone code, name, date
   - **Hierarchical fields**: parent_milestone_id, milestone_level, milestone_path, is_parent
   - Supports 3-level tree structure (Root → Level 1 → Level 2)
   - Linked to cost items

9. **Cost Line Items**: Labour costs
   - WBS code, task description
   - Actual vs banded rate toggle
   - Hours, rates, G&A application
   - Calculated costs (base, G&A, total)

10. **Material Costs**: Non-labour expenses
    - Description, category, supplier
    - **Materials master reference**: material_master_id (optional FK)
    - Cost type: milestone, monthly, one-time
    - Quantity, unit cost, G&A application
    - Material code (from master or custom)

11. **Payment Schedule**: Billing and invoices
    - Payment milestones, dates, amounts
    - Invoice tracking and status

12. **Cash Flow**: Month-by-month tracking
    - Labour and material outflows
    - Revenue inflow, net cash flow

13. **Integration Data**: Xero and MS Project imports

### Database Schema

The application uses Cloudflare D1 (SQLite) with a normalized relational schema. See `migrations/0001_initial_schema.sql` for full details.

**Key relationships:**
- Projects → Milestones (1:many)
- Projects → Cost Line Items (1:many)
- Projects → Material Costs (1:many)
- Cost Line Items → Personnel (many:1, optional)
- Cost Line Items → Rate Bands (many:1, optional)
- Cost Items → Milestones (many:1, optional)

## User Guide

### Demo Credentials

```
Admin:    admin@jl2group.com / admin123
Manager:  manager@jl2group.com / admin123
User:     user@jl2group.com / admin123
```

### Features Overview

#### 1. Dashboard
- Active project count
- Personnel statistics
- Total revenue tracking
- Average margin percentage
- Recent projects table

#### 2. Projects Management

**Project Creation Wizard:**
- Click "New Project" button to launch 6-step wizard
- Step-by-step guided process for complete project setup
- Real-time cost calculations throughout wizard
- Validation at each step before proceeding
- Financial summary with margin analysis before creation
- Single atomic transaction creates all project data

**Project Operations:**
- Create/edit/delete projects
- Set project parameters (dates, tax, G&A)
- Track project status
- Calculate totals and margins
- View detailed cost breakdowns

#### 3. Personnel Register
- Maintain staff database
- Set hourly costs and banded rates
- Track employee roles and levels
- Active/inactive status management

#### 4. Cost Tracking

**Labour Costs:**
- Add cost line items with WBS codes
- Choose between actual personnel or banded rates
- Assign to milestones
- Toggle G&A application
- Automatic cost calculations

**Material Costs:**
- Track non-labour expenses
- Classify as milestone, monthly, or one-time
- Set quantities and unit costs
- Apply G&A where appropriate
- Track suppliers

#### 5. Integrations

**Xero Integration:**
- OAuth 2.0 connection flow
- Sync invoices from Xero
- Import invoice data for reconciliation
- Requires Xero API credentials

**Microsoft Project Integration:**
- Import MS Project XML files
- Map tasks to cost line items
- Import resource assignments
- Export project data for MS Project

## API Documentation

### Authentication

**POST** `/api/auth/login`
```json
Request: {
  "email": "admin@jl2group.com",
  "password": "admin123"
}

Response: {
  "success": true,
  "token": "eyJhbGc...",
  "user": { ... }
}
```

**GET** `/api/auth/me` (Requires Bearer token)

**POST** `/api/auth/register` (Admin only)

**POST** `/api/auth/change-password`

### Projects

**GET** `/api/projects` - List all projects

**GET** `/api/projects/:id` - Get project details

**POST** `/api/projects` - Create project (Manager+)

**PUT** `/api/projects/:id` - Update project (Manager+)

**DELETE** `/api/projects/:id` - Delete project (Admin only)

**POST** `/api/projects/:id/recalculate` - Recalculate totals

**POST** `/api/projects/with-details` - Create project with all related data (Manager+)
- Body: `{ project: {...}, milestones: [...], labour_costs: [...], material_costs: [...], payment_schedule: [...] }`
- Single atomic transaction creates project and all related entities
- Used by project creation wizard

### Milestones

**GET** `/api/milestones?project_id=1` - List milestones

**GET** `/api/milestones/:id` - Get milestone details

**POST** `/api/milestones` - Create milestone (Manager+)

**POST** `/api/milestones/bulk` - Create multiple milestones (Manager+)

**PUT** `/api/milestones/:id` - Update milestone (Manager+)

**DELETE** `/api/milestones/:id` - Delete milestone (Manager+)

### Rate Bands

**GET** `/api/rate-bands?active=true` - List rate bands

**GET** `/api/rate-bands/:id` - Get rate band details

**POST** `/api/rate-bands` - Create rate band (Manager+)

**PUT** `/api/rate-bands/:id` - Update rate band (Manager+)

**DELETE** `/api/rate-bands/:id` - Delete rate band (Admin only)

### Personnel

**GET** `/api/personnel` - List all personnel

**GET** `/api/personnel/:id` - Get personnel details

**POST** `/api/personnel` - Create personnel (Manager+)

**PUT** `/api/personnel/:id` - Update personnel (Manager+)

**DELETE** `/api/personnel/:id` - Delete personnel (Admin only)

### Costs

**Labour Costs:**
- **GET** `/api/costs/labour?project_id=1`
- **POST** `/api/costs/labour`
- **PUT** `/api/costs/labour/:id`
- **DELETE** `/api/costs/labour/:id`

**Material Costs:**
- **GET** `/api/costs/material?project_id=1`
- **POST** `/api/costs/material`
- **PUT** `/api/costs/material/:id`
- **DELETE** `/api/costs/material/:id`

### Integrations

**Xero:**
- **GET** `/api/integrations/xero/status`
- **GET** `/api/integrations/xero/auth-url` (Admin only)
- **POST** `/api/integrations/xero/sync-invoices` (Manager+)

**Microsoft Project:**
- **GET** `/api/integrations/msp/status`
- **POST** `/api/integrations/msp/upload` (Manager+)
- **POST** `/api/integrations/msp/export` (User+)

## Development Setup

### Prerequisites

- Node.js 18+ (for local development)
- npm or yarn
- Wrangler CLI (for Cloudflare)

### Local Development

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Apply database migrations (local)
npm run db:migrate:local

# Seed database with sample data
npm run db:seed

# Start development server (sandbox)
npm run dev:sandbox

# Or use PM2 for daemon process
pm2 start ecosystem.config.cjs
pm2 logs webapp --nostream
```

### Database Management

```bash
# Reset database (delete and recreate)
npm run db:reset

# Execute SQL command
npm run db:console:local

# Example queries
SELECT * FROM users;
SELECT * FROM projects;
SELECT * FROM cost_line_items WHERE project_id = 1;
```

## Deployment

### 🚀 Google Cloud Platform Deployment (Recommended)

**Your application is now ready for Google Cloud deployment!**

**Quick Start Guide**: See `QUICKSTART_GOOGLE_CLOUD.md` (15 minutes)  
**Detailed Guide**: See `DEPLOY_GOOGLE_CLOUD.md` (full documentation)

**What's Included:**
- ✅ Node.js server with PostgreSQL support
- ✅ Docker containerization (Dockerfile)
- ✅ PostgreSQL migration scripts (migrations-postgres/)
- ✅ Database helper utilities (src/db.js)
- ✅ Environment configuration (.env.example)
- ✅ Deployment automation scripts

**Deployment Summary:**
```bash
# 1. Set up Google Cloud
gcloud projects create btl-costing-prod
gcloud config set project btl-costing-prod

# 2. Create PostgreSQL database
gcloud sql instances create btl-db --database-version=POSTGRES_15

# 3. Deploy to Cloud Run
gcloud run deploy btl-costing --source . --region us-central1

# See QUICKSTART_GOOGLE_CLOUD.md for complete instructions
```

**Estimated Costs:**
- ~$15-30/month (includes $300 free credit for new users)
- Cloud Run: ~$5-10/month
- Cloud SQL: ~$10-20/month

**Backup:** Original Cloudflare version saved at:  
https://page.gensparksite.com/project_backups/btl-costing-cloudflare-version.tar.gz

---

### Alternative: Cloudflare Pages Deployment

**Note:** Cloudflare deployment had authentication issues. Google Cloud deployment is recommended.

#### 1. Create Production Database

```bash
# Create D1 database in Cloudflare
npx wrangler d1 create webapp-production

# Copy the database_id and update wrangler.jsonc
```

#### 2. Apply Migrations to Production

```bash
npm run db:migrate:prod
```

#### 3. Configure Environment Variables

```bash
# Set JWT secret (production)
npx wrangler pages secret put JWT_SECRET --project-name webapp

# Xero integration (optional)
npx wrangler pages secret put XERO_CLIENT_ID --project-name webapp
npx wrangler pages secret put XERO_CLIENT_SECRET --project-name webapp

# MS Project integration (optional)
npx wrangler pages secret put MSP_CLIENT_ID --project-name webapp
npx wrangler pages secret put MSP_CLIENT_SECRET --project-name webapp
```

#### 4. Deploy to Cloudflare Pages

```bash
# Build and deploy
npm run deploy:prod

# Or create project first
npx wrangler pages project create webapp --production-branch main
npm run build
npx wrangler pages deploy dist --project-name webapp
```

### Post-Deployment

1. **Seed Production Database** (first time only):
   ```bash
   # Create production seed data without sample project
   npx wrangler d1 execute webapp-production --command="
     INSERT INTO users (email, password_hash, full_name, role) 
     VALUES ('admin@yourdomain.com', 'HASH', 'Admin', 'admin')
   "
   ```

2. **Test Production API**:
   ```bash
   curl https://webapp.pages.dev/api/health
   ```

3. **Configure Custom Domain** (optional):
   ```bash
   npx wrangler pages domain add yourdomain.com --project-name webapp
   ```

## Project Structure

```
webapp/
├── src/
│   ├── index.tsx              # Main application entry
│   ├── types.ts               # TypeScript type definitions
│   ├── lib/
│   │   └── auth.ts            # Authentication utilities
│   ├── middleware/
│   │   └── auth.ts            # Auth middleware
│   └── routes/
│       ├── auth.ts            # Auth routes
│       ├── projects.ts        # Project management
│       ├── personnel.ts       # Personnel management
│       ├── costs.ts           # Cost tracking
│       └── integrations.ts    # Third-party integrations
├── public/
│   └── static/
│       └── app.js             # Frontend SPA
├── migrations/
│   └── 0001_initial_schema.sql
├── seed.sql                   # Sample data
├── ecosystem.config.cjs       # PM2 configuration
├── wrangler.jsonc            # Cloudflare configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Deployment Status

### Local Development
- ✅ **Cloudflare Workers Version**: Running and tested (backup available)
- ✅ **Google Cloud Version**: Converted and ready

### Production Deployment
- ✅ **Google Cloud Ready**: All files created, deployment guide complete
  - Node.js server: `src/server.js`
  - PostgreSQL migrations: `migrations-postgres/`
  - Docker container: `Dockerfile`
  - Deployment docs: `QUICKSTART_GOOGLE_CLOUD.md` & `DEPLOY_GOOGLE_CLOUD.md`
- ⏳ **Google Cloud Deployed**: Awaiting user deployment
- ⏳ **GitHub Repository**: Ready to push
- ⏳ **Custom Domain**: Not configured

### Integrations
- ⏳ **Xero Integration**: Infrastructure ready, credentials needed
- ⏳ **MS Project Integration**: Infrastructure ready

## Next Steps

### Immediate (High Priority)

1. **Deploy to Google Cloud** (15-30 minutes)
   - Follow `QUICKSTART_GOOGLE_CLOUD.md` for step-by-step guide
   - Create Google Cloud account (get $300 free credit)
   - Deploy to Cloud Run with PostgreSQL
   - Get live production URL

2. **Setup GitHub Repository**
   - Push code to GitHub
   - Configure CI/CD with Cloud Build (optional)

3. **Production Configuration**
   - Change default admin password
   - Configure database backups
   - Set up monitoring and alerts
   - Add team members

### Short-term (Medium Priority)

4. **Enhanced Features**
   - Milestone management UI
   - Payment schedule tracking
   - Cash flow visualization
   - Advanced reporting (PDF export)

5. **Integration Setup**
   - Xero OAuth flow completion
   - MS Project file parser
   - Real-time sync capabilities

6. **User Experience**
   - Project creation wizard
   - Bulk cost item import
   - Advanced filters and search
   - Mobile responsive improvements

### Long-term (Future Enhancements)

7. **Advanced Analytics**
   - Project profitability analysis
   - Resource utilization tracking
   - Predictive margin forecasting
   - Custom report builder

8. **Collaboration Features**
   - Comments and notes
   - Task assignments
   - Email notifications
   - Activity audit trail

9. **System Optimization**
   - Database query optimization
   - Caching layer (KV/R2)
   - Performance monitoring
   - Automated testing suite

## Support and Documentation

### Common Issues

**Login fails:**
- Check password hash generation
- Verify user exists in database
- Check JWT_SECRET configuration

**Database errors:**
- Ensure migrations applied
- Check D1 database binding
- Verify local vs production database

**Integration issues:**
- Confirm API credentials configured
- Check callback URLs
- Review access token expiration

### Troubleshooting

```bash
# Check PM2 logs
pm2 logs webapp --nostream

# Check database content
npm run db:console:local

# Rebuild and restart
npm run build && pm2 restart webapp

# Reset database
npm run db:reset
```

## License

Proprietary - JL2 Group

## Credits

**Developer**: Gianpaulo Coletti - Remote Business Partner (Tiberius Holdings Group)

**Client**: JL2 Group

**Version**: 1.0

**Last Updated**: October 16, 2025

**Note**: Application converted from Cloudflare Workers (D1) to Node.js + PostgreSQL for Google Cloud deployment on October 16, 2025. Original Cloudflare version backed up and available for download.

## Current Status

### ✅ Phase 1 Completed - Core Application (September 2025)

1. **Core Backend API** - All RESTful endpoints operational
2. **Database Schema** - Initial schema with 13 tables and relationships
3. **Authentication System** - JWT-based with role-based access control
4. **Project Creation Wizard** - Full 6-step wizard implemented and integrated
5. **Frontend Application** - SPA with dashboard, projects, personnel views
6. **Cost Calculations** - Automatic G&A allocation and totals
7. **Milestone Management** - CRUD operations with bulk creation
8. **Rate Bands** - Role-based costing system
9. **Personnel Register** - 30 employees pre-loaded from Excel

### ✅ Phase 2 Completed - Major Enhancements (October 2025)

**Database Enhancements:**
- **3 New Tables**: clients, materials_master, project_approvals
- **Schema Updates**: Added hierarchical milestone fields, approval workflow fields, materials master references
- **Seed Data**: 8 clients, 30 materials pre-loaded

**Backend API Enhancements:**
- **Clients API** (`/api/clients`): Full CRUD with filters, project history
- **Materials Master API** (`/api/materials-master`): Full CRUD with categories
- **Approval Workflow APIs**: 
  - `POST /projects/:id/submit-for-approval`
  - `POST /projects/:id/approve`
  - `POST /projects/:id/reject`
  - `GET /projects/pending-approval`
  - `GET /projects/my-submissions`
- **Milestone Tree API** (`GET /api/milestones/tree`): Hierarchical structure support

**Frontend UI Enhancements:**
1. **Manager Settings Dashboard** (Admin/Manager Only)
   - Clients CRM table with search/filters and Add/Edit modals
   - Materials Master table with search/filters and Add/Edit modals
   - Employees tab (placeholder for future)
   - System Settings tab

2. **Enhanced Project Creation Wizard**
   - Step 1: Client dropdown (8 clients from CRM, + Add New option)
   - Step 2: Hierarchical milestone tree builder (3 levels deep)
   - Step 4: Materials master integration (From Catalog or Custom Entry)
   - Step 6: Approval workflow options (Draft/Active/Submit)

3. **Approval Workflow UI** (Manager/Admin Only)
   - Pending Approvals view with badge notifications
   - Project cards with financial summaries
   - Approval Review modal with approve/reject actions
   - Status filtering (Pending/All/Approved/Rejected)

4. **Enhanced Projects Table**
   - Project Status column with icons (Active/Completed/On-Hold/Planning)
   - Approval Status column with badges (Draft/Pending/Approved/Rejected)
   - Visual indicators throughout

### ⏳ Pending Implementation

1. **Production Deployment** - Deploy to Google Cloud Platform
2. **Xero Integration** - API credentials needed for activation
3. **MS Project Integration** - XML parsing and import functionality
4. **Project Editing** - Full edit wizard for existing projects
5. **Cost Item Editing** - Direct editing of labour and material costs
6. **Reports** - PDF export and financial reporting
7. **Cash Flow Tracking** - Month-by-month cash flow management

### 🎯 Next Immediate Actions

1. **Deploy to Google Cloud** (See QUICKSTART_GOOGLE_CLOUD.md)
2. **Setup GitHub Repository** - Push code and configure CI/CD
3. **User Acceptance Testing** - Full end-to-end testing with real users
4. **Project Editing** - Add full edit capabilities for existing projects
5. **Configure Xero Integration** - Add API credentials when available
6. **Production Monitoring** - Setup error tracking and analytics (Google Cloud Monitoring)

---

For questions or support, contact: admin@jl2group.com
