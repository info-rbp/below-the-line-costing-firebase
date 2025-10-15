# BTL Costing Application

## Project Overview

**Below the Line (BTL) Costing Application** is a modern, lightweight web-based project costing and financial management system designed to replace complex spreadsheets with a streamlined database-driven solution.

### Key Features

- **Project Management**: Track projects with client information, dates, and financial settings
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
   - Project code, name, client, dates
   - Tax rate, G&A percentage, status
   - Calculated totals and margin

3. **Personnel**: Staff database
   - Employee ID, name, role, level
   - Hourly cost and banded rates

4. **Rate Bands**: Role-based costing rates
   - Band name, level, description
   - Standard hourly rates

5. **Milestones**: Project milestones
   - Milestone code, name, date
   - Linked to cost items

6. **Cost Line Items**: Labour costs
   - WBS code, task description
   - Actual vs banded rate toggle
   - Hours, rates, G&A application
   - Calculated costs (base, G&A, total)

7. **Material Costs**: Non-labour expenses
   - Description, category, supplier
   - Cost type: milestone, monthly, one-time
   - Quantity, unit cost, G&A application

8. **Payment Schedule**: Billing and invoices
   - Payment milestones, dates, amounts
   - Invoice tracking and status

9. **Cash Flow**: Month-by-month tracking
   - Labour and material outflows
   - Revenue inflow, net cash flow

10. **Integration Data**: Xero and MS Project imports

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

### Cloudflare Pages Deployment

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

- ✅ **Local Development**: Running and tested
- ⏳ **Production Deployment**: Ready for deployment
- ⏳ **GitHub Repository**: Ready to push
- ⏳ **Custom Domain**: Not configured
- ⏳ **Xero Integration**: Infrastructure ready, credentials needed
- ⏳ **MS Project Integration**: Infrastructure ready

## Next Steps

### Immediate (High Priority)

1. **Deploy to Cloudflare Pages**
   - Create production D1 database
   - Apply migrations
   - Deploy application
   - Configure custom domain

2. **Setup GitHub Repository**
   - Push code to GitHub
   - Configure CI/CD (optional)

3. **Production Configuration**
   - Generate strong JWT secret
   - Create production admin user
   - Configure backup strategy

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

**Last Updated**: October 15, 2025

---

For questions or support, contact: admin@jl2group.com
