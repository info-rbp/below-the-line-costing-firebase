# BTL Costing Application - Firebase Version

## Project Overview

**Below the Line (BTL) Costing Application** is a modern web-based project costing and financial management system, now powered by Google Firebase for scalable cloud deployment.

### Technology Stack

- **Backend**: Express.js + Firebase Functions
- **Frontend**: Vanilla JavaScript with Tailwind CSS  
- **Database**: Cloud Firestore (NoSQL)
- **Hosting**: Firebase Hosting
- **Authentication**: JWT with bcrypt password hashing
- **Platform**: Google Cloud Platform / Firebase

### Key Features

- **Enhanced 6-Step Project Creation Wizard**
  - Project Basics with Client Dropdown (CRM integration)
  - Hierarchical Milestone Tree Builder (3-level structure)
  - Labour Costs with WBS builder
  - Material Costs with Materials Master Integration
  - Payment Schedule with revenue tracking
  - Review & Create with Approval Workflow

- **Manager Settings Dashboard** (Admin/Manager Only)
  - Clients CRM with full CRUD operations
  - Materials Master Catalog management
  - Employee Master database
  - System Settings configuration

- **Approval Workflow System** (Manager/Admin Only)
  - Pending Approvals view
  - Approve/Reject with comments
  - Complete audit trail
  - Status indicators

- **Enhanced Project Management**
  - Project status indicators
  - Approval status tracking
  - Client information management
  - Real-time margin warnings

- **Personnel Register**: Staff database with hourly costs and banded rates
- **Cost Tracking**: Labour and material cost management
- **G&A Calculations**: Automatic General & Administrative cost allocation
- **Multi-user Authentication**: Role-based access control (Admin, Manager, User, Viewer)
- **Real-time Dashboard**: Live project metrics and cost summaries

## Cloudflare Pages Direct Upload Deployment

This repository now includes a pre-built Cloudflare Pages bundle under `dist/` along with a helper script that packages it for the **Direct Upload** workflow.

1. Install dependencies (needed only once):
   ```bash
   npm install
   ```
2. Build or refresh the bundle if you have made source changes (this project ships with a compiled bundle already):
   ```bash
   npm run build
   ```
   > The current `npm run build` placeholder assumes the Worker bundle in `dist/` is already up to date. If you maintain the source, run the appropriate build process before packaging.
3. Create the upload artefacts:
   ```bash
   npm run package:direct-upload
   ```
   This command copies everything from `dist/` into `artifacts/pages-direct-upload/` and produces `artifacts/pages-direct-upload.zip`.
4. In the Cloudflare Pages dashboard, choose **Direct Upload → Upload assets** and provide the ZIP file created in step 3.
5. After the upload completes, re-configure any bindings (D1, KV, environment variables, secrets) through the Pages project settings because Direct Upload does not read the `wrangler` configuration automatically.

> **Note:** Direct Upload currently lacks feature parity with `wrangler pages deploy`. If your Worker requires bindings such as `env.DB`, make sure those bindings are defined in the Pages dashboard BEFORE testing the deployment. Missing bindings will cause runtime errors even though the upload succeeds.

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Firebase CLI installed: `npm install -g firebase-tools`
- Google account
- Firebase project created (Blaze plan)

### Installation

```bash
# Clone or download the project
cd /home/user/webapp

# Install root dependencies (if any)
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

### Firebase Setup

1. **Login to Firebase**
   ```bash
   firebase login
   ```

2. **Initialize Firebase**
   ```bash
   firebase init
   ```
   Select: Functions, Firestore, Hosting

3. **Update Project ID**
   Edit `.firebaserc` and set your Firebase project ID:
   ```json
   {
     "projects": {
       "default": "your-firebase-project-id"
     }
   }
   ```

4. **Set Environment Variables**
   ```bash
   firebase functions:config:set jwt.secret="your-secret-key"
   ```

5. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

### Initial Setup

**Three easy methods to initialize your admin account:**

#### Option 1: Web-Based Setup (Easiest) ⭐
1. Deploy the application: `firebase deploy`
2. Navigate to: `https://your-project.web.app/setup.html`
3. Complete the setup form (pre-filled with defaults)
4. Login with your credentials

#### Option 2: Command-Line Script
```bash
# Initialize admin user
npm run setup:init

# Seed default data (optional)
npm run setup:seed

# Or do both at once
npm run setup:all
```

#### Option 3: Manual Firestore Console
See detailed instructions in **SETUP_GUIDE.md**

**Default Admin Credentials:**
- Email: `admin@jl2group.com`
- Password: `admin123`

⚠️ **Change the password after first login!**

For complete setup instructions, see **[SETUP_GUIDE.md](SETUP_GUIDE.md)**

## Local Development

### Using Firebase Emulators

```bash
# Start all emulators
firebase emulators:start

# Access application at:
# - Hosting: http://localhost:5000
# - Functions: http://localhost:5001
# - Firestore: http://localhost:8080
# - Emulator UI: http://localhost:4000
```

### Testing

```bash
# Test API health
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jl2group.com","password":"admin123"}'
```

## Project Structure

```
webapp/
├── functions/                    # Firebase Functions (Express.js API)
│   ├── src/
│   │   ├── routes/              # API route handlers
│   │   │   ├── auth.js          # Authentication
│   │   │   ├── projects.js      # Project management
│   │   │   ├── personnel.js     # Personnel management
│   │   │   ├── costs.js         # Cost tracking
│   │   │   ├── milestones.js    # Milestones
│   │   │   ├── rateBands.js     # Rate bands
│   │   │   ├── clients.js       # CRM clients
│   │   │   └── materialsMaster.js # Materials catalog
│   │   ├── middleware/
│   │   │   └── auth.js          # Auth middleware
│   │   ├── lib/
│   │   │   └── auth.js          # Auth utilities
│   │   └── config/              # Configuration files
│   ├── index.js                 # Main Functions entry point
│   └── package.json             # Functions dependencies
├── public/                      # Static frontend files
│   ├── index.html              # Main HTML file
│   └── static/                 # JS, CSS, assets
│       ├── app.js              # Frontend application
│       ├── wizard.js           # Project wizard
│       └── wizard-helpers.js   # Wizard utilities
├── scripts/                     # Utility scripts
│   └── hash_password.js        # Password hash generator
├── firebase.json               # Firebase configuration
├── .firebaserc                 # Firebase project settings
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore indexes
├── .gitignore                 # Git ignore file
├── package.json               # Root package.json
├── FIREBASE_DEPLOYMENT_GUIDE.md # Deployment guide
└── README_FIREBASE.md         # This file
```

## API Documentation

### Authentication

**POST** `/api/auth/login` - User login
**POST** `/api/auth/register` - User registration (Admin only)
**GET** `/api/auth/me` - Get current user
**POST** `/api/auth/change-password` - Change password

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
- **GET** `/api/costs/labour?project_id=xxx`
- **POST** `/api/costs/labour`
- **PUT** `/api/costs/labour/:id`
- **DELETE** `/api/costs/labour/:id`

**Material Costs:**
- **GET** `/api/costs/material?project_id=xxx`
- **POST** `/api/costs/material`
- **PUT** `/api/costs/material/:id`
- **DELETE** `/api/costs/material/:id`

### Milestones

**GET** `/api/milestones?project_id=xxx` - List milestones
**POST** `/api/milestones` - Create milestone (Manager+)
**PUT** `/api/milestones/:id` - Update milestone (Manager+)
**DELETE** `/api/milestones/:id` - Delete milestone (Manager+)

### Rate Bands

**GET** `/api/rate-bands` - List rate bands
**POST** `/api/rate-bands` - Create rate band (Manager+)
**PUT** `/api/rate-bands/:id` - Update rate band (Manager+)
**DELETE** `/api/rate-bands/:id` - Delete rate band (Admin only)

### Clients

**GET** `/api/clients` - List all clients
**POST** `/api/clients` - Create client (Manager+)
**PUT** `/api/clients/:id` - Update client (Manager+)
**DELETE** `/api/clients/:id` - Delete client (Admin only)

### Materials Master

**GET** `/api/materials-master` - List all materials
**POST** `/api/materials-master` - Create material (Manager+)
**PUT** `/api/materials-master/:id` - Update material (Manager+)
**DELETE** `/api/materials-master/:id` - Delete material (Admin only)

## Firestore Collections

The application uses the following Firestore collections:

- `users` - User accounts and authentication
- `projects` - Project information
- `personnel` - Staff database
- `rateBands` - Role-based pricing
- `clients` - CRM client database
- `materialsMaster` - Pre-defined materials catalog
- `milestones` - Project milestones
- `costLineItems` - Labour costs
- `materialCosts` - Material costs
- `paymentSchedule` - Billing milestones
- `projectApprovals` - Approval audit trail

## Deployment

### Deploy Everything

```bash
firebase deploy
```

### Deploy Specific Components

```bash
# Deploy only Functions
firebase deploy --only functions

# Deploy only Hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Firestore indexes
firebase deploy --only firestore:indexes
```

### View Logs

```bash
# View function logs
firebase functions:log

# Tail logs in real-time
firebase functions:log --only api
```

## Monitoring and Costs

### Firebase Console

Access monitoring and usage:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to:
   - **Functions** → View invocations and execution time
   - **Firestore** → View database usage and reads/writes
   - **Hosting** → View bandwidth and requests

### Cost Monitoring

Set up budget alerts in Firebase Console:
1. Go to "Usage and billing"
2. Set budget alerts
3. Recommended: $25/month alert

**Expected Costs:**
- Low traffic (<10K requests/month): $0-5/month
- Medium traffic (<50K requests/month): $5-15/month
- High traffic (<200K requests/month): $15-40/month

## Security

### Firestore Security Rules

Security rules are defined in `firestore.rules`:
- Users can only read their own data
- Managers and Admins can write to most collections
- All operations require authentication

### Best Practices

1. Change default admin password immediately
2. Rotate JWT secret regularly
3. Review Firestore rules before production
4. Enable Firebase App Check
5. Set up Cloud Monitoring alerts
6. Use HTTPS only (enforced by Firebase)
7. Implement rate limiting for sensitive endpoints

## Troubleshooting

### Common Issues

**Issue**: "Billing account not configured"
- **Solution**: Upgrade to Blaze plan in Firebase Console

**Issue**: Permission denied in Firestore
- **Solution**: Deploy Firestore rules: `firebase deploy --only firestore:rules`

**Issue**: Functions deployment fails
- **Solution**: Check Node.js version (18+), reinstall dependencies

**Issue**: CORS errors
- **Solution**: Already configured in Express app, check browser console

**Issue**: Cannot connect to API
- **Solution**: Verify `firebase.json` rewrites configuration

## Documentation

- **Deployment Guide**: See `FIREBASE_DEPLOYMENT_GUIDE.md`
- **Firebase Docs**: https://firebase.google.com/docs
- **Cloud Functions**: https://firebase.google.com/docs/functions
- **Firestore**: https://firebase.google.com/docs/firestore

## Support

For issues or questions:
- **Email**: admin@jl2group.com
- **Firebase Support**: https://firebase.google.com/support

## Migration Notes

This application was migrated from Cloudflare Workers/Pages to Firebase on October 17, 2025.

**Key Changes:**
- Hono → Express.js
- Cloudflare D1 (SQLite) → Cloud Firestore (NoSQL)
- Cloudflare Workers → Firebase Functions
- Cloudflare Pages → Firebase Hosting
- Web Crypto API → bcryptjs + jsonwebtoken

**Backup**: Original Cloudflare version backed up as `webapp-cloudflare-backup-YYYYMMDD.tar.gz`

## Version History

- **v2.0** (October 2025) - Firebase migration
- **v1.0** (September 2025) - Initial Cloudflare version

## License

Proprietary - JL2 Group

## Credits

**Developer**: Gianpaulo Coletti - Remote Business Partner (Tiberius Holdings Group)
**Client**: JL2 Group
**Version**: 2.0 (Firebase)
**Last Updated**: October 17, 2025

---

For complete deployment instructions, see **FIREBASE_DEPLOYMENT_GUIDE.md**
