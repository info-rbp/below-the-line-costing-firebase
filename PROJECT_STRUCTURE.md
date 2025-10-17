# Project Structure - BTL Costing Application (Firebase)

## Overview

This document explains the directory structure and purpose of each file in the Firebase version of the BTL Costing Application.

---

## Root Directory

```
webapp/
├── functions/                  # Firebase Functions (Backend API)
├── public/                     # Static frontend files (Firebase Hosting)
├── scripts/                    # Utility scripts
├── .firebaserc                 # Firebase project configuration
├── .gitignore                  # Git ignore rules
├── .env.template               # Environment variables template
├── firebase.json               # Firebase configuration
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore database indexes
├── package.json               # Root package.json
├── FIREBASE_DEPLOYMENT_GUIDE.md
├── MIGRATION_SUMMARY.md
├── QUICKSTART.md
├── PROJECT_STRUCTURE.md       # This file
└── README_FIREBASE.md         # Main README
```

---

## `/functions/` - Backend API

The `functions` directory contains the Express.js backend that runs on Firebase Functions.

```
functions/
├── index.js                    # Main entry point for Firebase Functions
├── package.json                # Functions dependencies
└── src/
    ├── lib/
    │   └── auth.js             # Authentication utilities (bcrypt, JWT)
    ├── middleware/
    │   └── auth.js             # Express authentication middleware
    └── routes/
        ├── auth.js             # Authentication routes (login, register, etc.)
        ├── projects.js         # Project CRUD operations
        ├── personnel.js        # Personnel management
        ├── costs.js            # Labour and material costs
        ├── milestones.js       # Project milestones
        ├── rateBands.js        # Role-based rate bands
        ├── clients.js          # CRM client management
        └── materialsMaster.js  # Materials catalog
```

### Key Files Explained

#### `functions/index.js`
Main Firebase Function export. Creates Express app, sets up routes, and exports the `api` function.

```javascript
// Simplified structure
const functions = require('firebase-functions');
const express = require('express');
const app = express();

// Mount routes
app.use('/auth', authRoutes(db));
app.use('/projects', projectsRoutes(db));
// ... other routes

exports.api = functions.https.onRequest(app);
```

#### `functions/src/lib/auth.js`
Authentication utilities using bcryptjs for password hashing and jsonwebtoken for JWT creation/verification.

**Key functions:**
- `hashPassword(password)` - Hash passwords with bcrypt
- `verifyPassword(password, hash)` - Verify password against hash
- `generateToken(user)` - Create JWT token
- `verifyToken(token)` - Verify and decode JWT

#### `functions/src/middleware/auth.js`
Express middleware for protecting routes.

**Key functions:**
- `authMiddleware` - Requires valid JWT token
- `requireRole(...roles)` - Requires specific user role(s)
- `optionalAuth` - Adds user to request if token present (doesn't fail)

#### `functions/src/routes/*.js`
Individual route modules for each API resource. Each module exports a function that takes `db` (Firestore instance) and returns an Express router.

**Standard pattern:**
```javascript
module.exports = (db) => {
  const router = express.Router();
  
  // GET /api/resource
  router.get('/', async (req, res) => { /* ... */ });
  
  // POST /api/resource
  router.post('/', requireRole('admin', 'manager'), async (req, res) => { /* ... */ });
  
  return router;
};
```

---

## `/public/` - Frontend Files

Static files served by Firebase Hosting.

```
public/
├── index.html                  # Main HTML file (entry point)
└── static/
    ├── app.js                  # Main frontend application
    ├── wizard.js               # Project creation wizard
    ├── wizard-helpers.js       # Wizard utility functions
    └── (other frontend files)
```

### Key Files Explained

#### `public/index.html`
Main HTML file that loads the SPA (Single Page Application).

**Features:**
- Tailwind CSS via CDN
- FontAwesome icons via CDN
- Axios for HTTP requests
- Configured to use `/api` base URL for backend calls

#### `public/static/app.js`
Main frontend application JavaScript (from original Cloudflare version, unchanged).

**Functionality:**
- Dashboard view
- Project management UI
- Personnel management UI
- Cost tracking UI
- Navigation and routing

#### `public/static/wizard.js`
6-step project creation wizard (from original Cloudflare version, unchanged).

**Steps:**
1. Project basics + client selection
2. Hierarchical milestone tree
3. Labour costs
4. Material costs
5. Payment schedule
6. Review and approval options

---

## `/scripts/` - Utility Scripts

Helper scripts for development and administration.

```
scripts/
└── hash_password.js            # Generate bcrypt password hashes
```

### Usage

```bash
# Generate password hash
node scripts/hash_password.js yourpassword

# Output: $2a$10$... (copy this to Firestore)
```

---

## Configuration Files

### `firebase.json`
Main Firebase configuration file.

**Configures:**
- **Hosting**: Public directory, rewrites, redirects
- **Functions**: Source directory, ignore patterns
- **Firestore**: Rules and indexes files
- **Emulators**: Local development ports

**Key rewrites:**
```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      }
    ]
  }
}
```

This rewrites all `/api/*` requests to the Firebase Function named `api`.

### `.firebaserc`
Firebase project configuration.

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

**Update this** with your actual Firebase project ID.

### `firestore.rules`
Firestore security rules that enforce access control at the database level.

**Key rules:**
- Users can only read their own user document
- All authenticated users can read projects, personnel, etc.
- Only Managers and Admins can create/update/delete

**Example rule:**
```javascript
match /projects/{projectId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && 
                   request.auth.token.role in ['admin', 'manager'];
  allow update, delete: if request.auth != null && 
                            request.auth.token.role in ['admin', 'manager'];
}
```

### `firestore.indexes.json`
Defines composite indexes for Firestore queries.

**Example:**
```json
{
  "indexes": [
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    }
  ]
}
```

This allows queries like:
```javascript
db.collection('projects')
  .where('status', '==', 'active')
  .orderBy('created_at', 'desc')
```

### `package.json` (root)
Root package.json with Firebase deployment scripts.

**Key scripts:**
- `npm run deploy` - Deploy to Firebase
- `npm run serve` - Start Firebase emulators
- `npm run logs` - View function logs

### `.gitignore`
Specifies files to ignore in version control.

**Ignores:**
- `node_modules/`
- `.env` files
- `.firebase/` directory
- Firebase debug logs
- Build artifacts

### `.env.template`
Template for environment variables (for reference only).

**Note**: Firebase Functions use `firebase functions:config:set` instead of `.env` files.

---

## Documentation Files

### `README_FIREBASE.md`
Main README for the Firebase version. Comprehensive guide covering:
- Project overview
- Technology stack
- Features
- API documentation
- Deployment instructions

### `FIREBASE_DEPLOYMENT_GUIDE.md`
Step-by-step deployment guide with:
- Prerequisites
- Firebase project setup
- Blaze plan upgrade
- Firestore setup
- Deployment commands
- Troubleshooting

### `MIGRATION_SUMMARY.md`
Detailed summary of the migration from Cloudflare to Firebase:
- What changed and why
- Files created/removed
- Code architecture changes
- Backup and rollback information

### `QUICKSTART.md`
Quick start guide for first-time users:
- 10 simple steps to deploy
- Estimated time: 30 minutes
- Troubleshooting tips
- Cost estimates

### `PROJECT_STRUCTURE.md`
This file - explains the directory structure and file purposes.

---

## Firestore Collections

The application uses the following Firestore collections (created automatically when first used):

```
Firestore Database
├── users                       # User accounts
│   └── [userId]
│       ├── email
│       ├── password_hash
│       ├── full_name
│       ├── role
│       └── is_active
├── projects                    # Projects
│   └── [projectId]
│       ├── project_code
│       ├── project_name
│       ├── client_name
│       └── ... (other fields)
├── personnel                   # Staff database
├── rateBands                   # Role-based rates
├── clients                     # CRM clients
├── materialsMaster             # Materials catalog
├── milestones                  # Project milestones
├── costLineItems               # Labour costs
├── materialCosts               # Material costs
└── paymentSchedule             # Payment tracking
```

---

## Development Workflow

### Local Development

```bash
# Start Firebase emulators
firebase emulators:start

# Access:
# - Application: http://localhost:5000
# - Functions: http://localhost:5001
# - Firestore: http://localhost:8080
# - Emulator UI: http://localhost:4000
```

### Making Changes

1. **Backend changes** (in `functions/`):
   ```bash
   # Edit files in functions/src/
   # Deploy only functions
   firebase deploy --only functions
   ```

2. **Frontend changes** (in `public/`):
   ```bash
   # Edit files in public/
   # Deploy only hosting
   firebase deploy --only hosting
   ```

3. **Database rules** (in `firestore.rules`):
   ```bash
   # Edit firestore.rules
   # Deploy only rules
   firebase deploy --only firestore:rules
   ```

---

## Important Notes

### Do NOT Edit

These files are auto-generated or managed by Firebase:
- `.firebase/` directory
- `firebase-debug.log`
- `functions/node_modules/`

### Must Edit

Before deployment, update these:
- `.firebaserc` - Your Firebase project ID
- Environment variables via `firebase functions:config:set`

### Can Edit

Customize these as needed:
- All files in `functions/src/`
- All files in `public/`
- `firestore.rules` (with caution)
- `firestore.indexes.json` (as needed)

---

## File Sizes

Typical sizes after setup:

- `functions/` - ~150MB (including node_modules)
- `public/` - ~500KB
- Configuration files - ~10KB
- Documentation - ~50KB

---

## Next Steps

1. **Explore the code** - Start with `functions/index.js`
2. **Read the README** - See `README_FIREBASE.md`
3. **Follow the Quick Start** - See `QUICKSTART.md`
4. **Deploy your app** - Follow `FIREBASE_DEPLOYMENT_GUIDE.md`

---

**Happy coding!** 🚀

**Version**: 2.0 (Firebase)  
**Last Updated**: October 17, 2025
