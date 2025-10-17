# Quick Start Guide - BTL Costing Application (Firebase)

## For First-Time Users

This guide will get you up and running with the BTL Costing Application on Firebase in under 30 minutes.

---

## Prerequisites

Before you start, make sure you have:

1. **Google Account** - Free Gmail account
2. **Credit Card** - Required for Firebase Blaze plan (don't worry, it's pay-as-you-go with generous free tier)
3. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
4. **Basic terminal knowledge** - Ability to run commands in terminal/command prompt

---

## Step 1: Install Firebase CLI (5 minutes)

Open your terminal and run:

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Verify installation
firebase --version
```

You should see a version number like `13.0.0` or higher.

---

## Step 2: Create Firebase Project (5 minutes)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Click "Add project"**
3. **Enter project name**: `btl-costing-app` (or your preferred name)
4. **Disable Google Analytics** (optional, but recommended for simplicity)
5. **Click "Create project"** and wait for setup to complete

---

## Step 3: Upgrade to Blaze Plan (2 minutes)

Firebase Functions require the Blaze (pay-as-you-go) plan:

1. In Firebase Console, **click "Upgrade"** button in the bottom-left
2. Select **"Blaze plan"**
3. Add your **credit card** information
4. Set a **budget alert** (recommended: $25/month)
5. Click **"Continue"**

**Don't worry about costs!** The Blaze plan includes:
- **2M function invocations/month FREE**
- **1GB Firestore storage FREE**
- Most small businesses stay under $10/month

---

## Step 4: Enable Firestore Database (3 minutes)

1. In Firebase Console, go to **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select your **preferred location** (e.g., `us-central1` for USA)
5. Click **"Enable"**

---

## Step 5: Setup Your Project (5 minutes)

Open terminal and navigate to the project directory:

```bash
cd /home/user/webapp

# Login to Firebase
firebase login

# This will open a browser window - login with your Google account
```

After successful login:

```bash
# Initialize Firebase
firebase init

# When prompted, select (use spacebar to select):
# - Functions
# - Firestore
# - Hosting

# Answer the prompts:
# - Use existing project: YES → Select "btl-costing-app"
# - Functions language: JavaScript
# - Use ESLint: No
# - Install dependencies: Yes
# - Firestore rules file: firestore.rules (press Enter)
# - Firestore indexes: firestore.indexes.json (press Enter)
# - Public directory: public (press Enter)
# - Configure as SPA: Yes
# - Set up automatic builds: No
# - Overwrite index.html: No
```

---

## Step 6: Update Firebase Project ID (1 minute)

Edit `.firebaserc` file and update the project ID:

```json
{
  "projects": {
    "default": "btl-costing-app"
  }
}
```

Replace `btl-costing-app` with your actual Firebase project ID.

---

## Step 7: Set Environment Variables (2 minutes)

```bash
# Set JWT secret for authentication
firebase functions:config:set jwt.secret="change-this-to-a-random-string-32-characters-long"

# Verify it was set
firebase functions:config:get
```

---

## Step 8: Deploy to Firebase (3 minutes)

```bash
# Deploy everything
firebase deploy

# This will deploy:
# - Firebase Functions (Express.js API)
# - Firebase Hosting (frontend)
# - Firestore rules and indexes
```

Wait for deployment to complete. You'll see URLs like:
- **Hosting**: `https://btl-costing-app.web.app`
- **Functions**: `https://us-central1-btl-costing-app.cloudfunctions.net/api`

---

## Step 9: Create Admin User (5 minutes)

You need to manually create the first admin user in Firestore:

### 9.1 Generate Password Hash

```bash
cd /home/user/webapp
node scripts/hash_password.js admin123
```

Copy the generated hash (it looks like `$2a$10$...`).

### 9.2 Add User to Firestore

1. Go to **Firebase Console** → **Firestore Database**
2. Click **"Start collection"**
3. Collection ID: `users`
4. Click **"Next"**
5. **Document ID**: Click "Auto-ID"
6. **Add fields**:

| Field | Type | Value |
|-------|------|-------|
| email | string | `admin@jl2group.com` |
| password_hash | string | (paste the hash from step 9.1) |
| full_name | string | `Admin User` |
| role | string | `admin` |
| is_active | boolean | `true` |
| created_at | string | `2025-10-17T00:00:00Z` |
| updated_at | string | `2025-10-17T00:00:00Z` |

7. Click **"Save"**

---

## Step 10: Test Your Application (3 minutes)

### 10.1 Test API

```bash
# Test health endpoint
curl https://btl-costing-app.web.app/api/health

# Expected: {"status":"ok","timestamp":"..."}
```

### 10.2 Test Login

```bash
curl -X POST https://btl-costing-app.web.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jl2group.com","password":"admin123"}'

# Expected: {"success":true,"token":"...","user":{...}}
```

### 10.3 Test Web Application

1. Open browser: `https://btl-costing-app.web.app`
2. Login with:
   - **Email**: `admin@jl2group.com`
   - **Password**: `admin123`
3. You should see the dashboard!

---

## 🎉 Congratulations!

Your BTL Costing Application is now live on Firebase!

---

## What's Next?

### Immediate Actions

1. **Change Admin Password**
   - Login to the application
   - Go to Settings → Change Password
   - Set a strong password

2. **Add More Users**
   - Login as admin
   - Go to Settings → User Management
   - Add team members

3. **Explore Features**
   - Create a test project
   - Try the project wizard
   - Add personnel and costs

### Optional (But Recommended)

1. **Custom Domain**
   - Go to Firebase Console → Hosting
   - Click "Add custom domain"
   - Follow the DNS configuration steps

2. **Set Up Monitoring**
   - Go to Firebase Console → Functions → Logs
   - Set up email alerts for errors

3. **Backup Strategy**
   - Set up automated Firestore exports
   - Schedule weekly backups to Cloud Storage

---

## Need Help?

### Quick Troubleshooting

**Problem**: "Billing account not configured"
- **Solution**: Make sure you upgraded to Blaze plan (Step 3)

**Problem**: "Permission denied" in Firestore
- **Solution**: Run `firebase deploy --only firestore:rules`

**Problem**: Functions not working
- **Solution**: Check logs: `firebase functions:log`

**Problem**: Cannot login
- **Solution**: Verify admin user was created correctly in Firestore

### Get Support

- **Detailed Guide**: See `FIREBASE_DEPLOYMENT_GUIDE.md`
- **Migration Info**: See `MIGRATION_SUMMARY.md`
- **Email Support**: admin@jl2group.com
- **Firebase Docs**: https://firebase.google.com/docs

---

## Cost Estimate

For a small business with ~100 users and ~10K API requests per month:

- **Functions**: $0-2/month (under free tier)
- **Firestore**: $0-3/month (under free tier)
- **Hosting**: $0/month (free)
- **Total**: **$0-5/month**

---

## Commands Cheat Sheet

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# View logs
firebase functions:log

# Start local emulators
firebase emulators:start

# Check Firebase CLI version
firebase --version

# Login to different account
firebase logout
firebase login
```

---

**You're all set!** Enjoy your BTL Costing Application on Firebase! 🚀

**Version**: 2.0 (Firebase)  
**Last Updated**: October 17, 2025
