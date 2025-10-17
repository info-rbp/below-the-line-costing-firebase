# Firebase Deployment Guide for BTL Costing Application

## Overview

This application has been converted from Cloudflare Workers/Pages to Google Firebase. It now uses:
- **Firebase Hosting** for static frontend files
- **Firebase Functions** for the Express.js API backend
- **Cloud Firestore** for NoSQL database storage
- **Firebase Authentication** (optional, currently using JWT)

## Prerequisites

1. **Google Account** - You need a Google account to use Firebase
2. **Node.js 18+** - Required for Firebase Functions
3. **Firebase CLI** - Install globally: `npm install -g firebase-tools`
4. **Credit Card** (for Firebase Blaze plan) - Required for Cloud Functions

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `btl-costing-app` (or your preferred name)
4. Disable Google Analytics (optional, but recommended for simplicity)
5. Click "Create project" and wait for setup to complete

## Step 2: Upgrade to Blaze Plan

Firebase Functions require the Blaze (pay-as-you-go) plan:

1. In Firebase Console, click "Upgrade" button
2. Select "Blaze plan"
3. Add your credit card information
4. Set budget alerts (recommended: $25/month)

**Note**: The Blaze plan includes generous free tier:
- 2M function invocations/month FREE
- 400,000 GB-seconds compute time FREE
- 200,000 CPU-seconds compute time FREE

## Step 3: Enable Firestore Database

1. In Firebase Console, go to "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode"
4. Select your preferred location (e.g., `us-central1`)
5. Click "Enable"

## Step 4: Firebase CLI Setup

Login to Firebase CLI:

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project directory
cd /home/user/webapp
firebase init
```

When prompted, select:
- **Functions**: Configure Firebase Functions
- **Firestore**: Configure Firestore rules and indexes
- **Hosting**: Configure Firebase Hosting

Configuration answers:
- Use existing project: Select your `btl-costing-app` project
- Functions language: **JavaScript**
- Use ESLint: **No** (optional)
- Install dependencies: **Yes**
- Firestore rules file: **firestore.rules** (already created)
- Firestore indexes file: **firestore.indexes.json** (already created)
- Public directory: **public**
- Configure as SPA: **Yes**
- Set up automatic builds: **No**
- Overwrite index.html: **No**

## Step 5: Update Firebase Configuration

### 5.1 Update .firebaserc

```bash
# Edit .firebaserc and replace with your project ID
{
  "projects": {
    "default": "btl-costing-app"
  }
}
```

### 5.2 Install Functions Dependencies

```bash
cd functions
npm install
cd ..
```

## Step 6: Set Environment Variables

Firebase Functions need environment variables for JWT secret:

```bash
# Set JWT secret (generate a strong random string)
firebase functions:config:set jwt.secret="your-super-secret-jwt-key-change-this"

# View configuration
firebase functions:config:get
```

**Update functions/src/lib/auth.js** to use Firebase config:

```javascript
const JWT_SECRET = functions.config().jwt?.secret || process.env.JWT_SECRET || 'default-secret';
```

## Step 7: Initialize Database with Sample Data

You need to manually add initial users to Firestore:

1. Go to Firebase Console → Firestore Database
2. Click "Start collection"
3. Collection ID: `users`
4. Add first document:
   - Document ID: (auto-generate)
   - Fields:
     - `email` (string): "admin@jl2group.com"
     - `password_hash` (string): Use hash_password.js to generate
     - `full_name` (string): "Admin User"
     - `role` (string): "admin"
     - `is_active` (boolean): true
     - `created_at` (string): "2025-10-17T00:00:00Z"
     - `updated_at` (string): "2025-10-17T00:00:00Z"

**Generate password hash:**

```bash
node hash_password.js admin123
```

Copy the hash and paste it into the `password_hash` field.

## Step 8: Deploy to Firebase

### 8.1 Deploy Everything

```bash
# Deploy functions and hosting together
firebase deploy
```

### 8.2 Or Deploy Separately

```bash
# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

## Step 9: Access Your Application

After deployment, Firebase will provide URLs:

- **Hosting URL**: `https://btl-costing-app.web.app`
- **Functions URL**: `https://us-central1-btl-costing-app.cloudfunctions.net/api`

**Note**: The hosting automatically proxies `/api/*` requests to your Cloud Function.

## Step 10: Test Your Deployment

### 10.1 Test API Health

```bash
curl https://btl-costing-app.web.app/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-10-17T12:00:00.000Z"}
```

### 10.2 Test Login

```bash
curl -X POST https://btl-costing-app.web.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jl2group.com","password":"admin123"}'
```

Expected response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

### 10.3 Test Web Application

Open in browser: `https://btl-costing-app.web.app`

Login with:
- Email: `admin@jl2group.com`
- Password: `admin123`

## Local Development with Firebase Emulators

For local testing without deploying:

```bash
# Start Firebase emulators
firebase emulators:start
```

This starts:
- **Functions**: http://localhost:5001
- **Firestore**: http://localhost:8080
- **Hosting**: http://localhost:5000
- **Emulator UI**: http://localhost:4000

Access your app locally at: `http://localhost:5000`

## Monitoring and Logs

### View Function Logs

```bash
# View recent logs
firebase functions:log

# Tail logs in real-time
firebase functions:log --only api
```

### View Logs in Console

1. Go to Firebase Console
2. Navigate to "Functions" → "Logs"
3. View detailed execution logs and errors

## Cost Estimation

**Free Tier (included with Blaze plan):**
- 2M function invocations/month
- 400,000 GB-seconds
- 200,000 CPU-seconds
- 1GB Firestore storage
- 10GB bandwidth/month

**Expected costs for low-medium traffic:**
- Small business (~100 users, ~10K requests/month): **$0-5/month**
- Medium business (~500 users, ~50K requests/month): **$5-15/month**
- Large business (~2000 users, ~200K requests/month): **$15-40/month**

**Cost comparison:**
- Cloudflare Workers: Free (500K requests/month)
- Firebase: ~$10-20/month average
- Traditional VPS (DigitalOcean): $12-24/month
- AWS Lambda: Similar to Firebase

## Troubleshooting

### Issue: "Billing account not configured"

**Solution**: Upgrade to Blaze plan in Firebase Console

### Issue: "Permission denied" errors in Firestore

**Solution**: Check `firestore.rules` and deploy:
```bash
firebase deploy --only firestore:rules
```

### Issue: Functions deployment fails

**Solutions**:
1. Check Node.js version: `node --version` (should be 18+)
2. Reinstall dependencies: `cd functions && rm -rf node_modules && npm install`
3. Check functions logs: `firebase functions:log`

### Issue: CORS errors in browser

**Solution**: The Express app already has CORS enabled. Check browser console for specific errors.

### Issue: Frontend can't connect to API

**Solutions**:
1. Verify `firebase.json` has correct rewrites
2. Check that axios baseURL is set to `/api`
3. Test API directly: `curl https://your-app.web.app/api/health`

## Security Best Practices

1. **Change default passwords** immediately after first login
2. **Rotate JWT secret** regularly
3. **Enable Firebase App Check** for production
4. **Review Firestore security rules** before going live
5. **Set up Cloud Monitoring** alerts
6. **Enable Firebase Authentication** (optional, more secure than JWT)
7. **Use environment secrets** for sensitive data

## Backup and Disaster Recovery

### Export Firestore Data

```bash
# Using gcloud CLI
gcloud firestore export gs://your-bucket-name
```

### Automate Backups

Set up Cloud Scheduler to run daily Firestore exports.

## Next Steps

1. **Custom Domain**: Add your domain in Firebase Hosting settings
2. **SSL Certificate**: Automatically provided by Firebase
3. **CI/CD**: Set up GitHub Actions for automatic deployment
4. **Monitoring**: Enable Firebase Performance Monitoring
5. **Analytics**: Add Firebase Analytics or Google Analytics
6. **Error Tracking**: Integrate Sentry or Firebase Crashlytics

## Additional Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Cloud Functions**: https://firebase.google.com/docs/functions
- **Firestore Guide**: https://firebase.google.com/docs/firestore
- **Pricing Calculator**: https://firebase.google.com/pricing

## Support

For issues or questions:
- **Email**: admin@jl2group.com
- **Firebase Support**: https://firebase.google.com/support
- **Stack Overflow**: Tag questions with `firebase` and `google-cloud-firestore`

---

**Last Updated**: October 17, 2025
**Version**: 2.0 (Firebase Migration)
