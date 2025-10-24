# BTL Costing Application - Complete Setup Guide

## 🚀 Quick Start Guide

This guide covers three methods to initialize your BTL Costing application with the admin account.

**Default Admin Credentials:**
- **Email:** admin@jl2group.com
- **Password:** admin123

⚠️ **IMPORTANT:** Change the password immediately after first login!

---

## Method 1: Web-Based First-Run Setup (Recommended)

The easiest way to set up your application is through the built-in web interface.

### Steps:

1. **Deploy the Application**
   ```bash
   firebase deploy
   ```

2. **Access the Setup Page**
   - Navigate to: `https://your-app.web.app/setup.html`
   - The form will be pre-filled with default credentials

3. **Complete Setup**
   - Verify/modify the email, name, and password
   - Click "Create Admin Account & Initialize System"
   - You'll be redirected to the login page

4. **Login**
   - Use the credentials you just created
   - Navigate to: `https://your-app.web.app/`

**Security Features:**
- ✅ Auto-disables after first admin is created
- ✅ Shows "Already Setup" message if users exist
- ✅ Cannot be re-run for security

---

## Method 2: Command-Line Initialization Script

For automated or scripted deployments, use the Node.js initialization script.

### Prerequisites:

```bash
# Ensure you have Firebase Admin credentials
# Option A: Application Default Credentials (recommended)
firebase login
gcloud auth application-default login

# Option B: Service Account Key
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### Run the Script:

```bash
# From project root
npm run setup:init

# Or directly
node scripts/init-admin-user.js
```

### What it does:
- ✅ Creates admin user with email: admin@jl2group.com
- ✅ Sets password: admin123
- ✅ Checks for existing users (won't duplicate)
- ✅ Can reset password if user already exists (after 5-second warning)

### Output:
```
🚀 BTL Costing Application - Admin User Initialization
============================================================

📋 Checking for existing admin user...
📝 Creating new admin user...

✅ Admin user created successfully!
============================================================

📧 Login Credentials:
   Email:    admin@jl2group.com
   Password: admin123
   User ID:  abc123xyz456

⚠️  IMPORTANT: Change the password after first login!
============================================================

🎉 Initialization complete!
```

---

## Method 3: Manual Firestore Console Setup

If you prefer manual setup through Firebase Console:

### Steps:

1. **Generate Password Hash**
   ```bash
   npm run hash-password admin123
   ```
   Copy the hash output.

2. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select your project
   - Navigate to Firestore Database

3. **Create User Document**
   - Collection: `users`
   - Click "Add Document"
   - Auto-generate Document ID
   - Add fields:

   | Field | Type | Value |
   |-------|------|-------|
   | email | string | admin@jl2group.com |
   | password_hash | string | [paste hash from step 1] |
   | full_name | string | Admin User |
   | role | string | admin |
   | is_active | boolean | true |
   | created_at | string | [current ISO timestamp] |
   | updated_at | string | [current ISO timestamp] |

4. **Save and Login**
   - Navigate to your application
   - Login with admin@jl2group.com / admin123

---

## Seeding Default Data (Optional)

After creating the admin user, you can seed the database with default data:

### Using Command-Line Script:

```bash
npm run setup:seed
```

This will create:
- ✅ 4 Rate Bands (Junior, Mid-Level, Senior, Principal)
- ✅ 4 Sample Materials (Brochures, T-Shirts, Banners, Pens)
- ✅ 2 Sample Clients (Acme Corp, Global Marketing)

### Using Web API:

You can also seed via API endpoint (after logging in):

```bash
curl -X POST https://your-app.web.app/api/setup/seed-defaults \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Complete Setup (All-in-One)

To initialize admin user AND seed default data in one command:

```bash
npm run setup:all
```

This runs both `setup:init` and `setup:seed` sequentially.

---

## Verification Steps

### 1. Check Setup Status via API:

```bash
curl https://your-app.web.app/api/setup/status
```

**Response if NOT set up:**
```json
{
  "success": true,
  "setup_complete": false,
  "message": "Setup required - no users found"
}
```

**Response if already set up:**
```json
{
  "success": true,
  "setup_complete": true,
  "message": "Setup already completed"
}
```

### 2. Test Login:

```bash
curl -X POST https://your-app.web.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jl2group.com",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc123",
    "email": "admin@jl2group.com",
    "full_name": "Admin User",
    "role": "admin",
    "is_active": true
  }
}
```

### 3. Check User in Firestore:

```bash
firebase firestore:get users/DOCUMENT_ID
```

---

## Troubleshooting

### Issue: "Firebase Admin initialization failed"

**Solution:**
```bash
# Set up Application Default Credentials
firebase login
gcloud auth application-default login

# Or use service account key
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
```

### Issue: "Setup already completed" on first run

**Cause:** A user already exists in Firestore.

**Solution:**
- Delete existing user from Firestore Console, OR
- Use password reset feature in the script (waits 5 seconds)

### Issue: "Invalid credentials" on login

**Possible causes:**
1. User doesn't exist - run setup script
2. Wrong password - verify with hash_password.js
3. User is inactive - check `is_active` field in Firestore
4. JWT_SECRET mismatch - check Firebase Functions config

**Debug steps:**
```bash
# Check if user exists
firebase firestore:get users --where email==admin@jl2group.com

# Verify password hash
npm run hash-password admin123

# Check Firebase Functions config
firebase functions:config:get
```

### Issue: Setup page shows "Already Setup" but can't login

**Solution:**
1. Verify user exists in Firestore
2. Check user's `is_active` field is `true`
3. Verify password hash matches
4. Reset password using script: `npm run setup:init`

---

## Security Best Practices

### 1. Change Default Password Immediately

After first login:
- Navigate to Profile/Settings
- Use "Change Password" feature
- Choose a strong, unique password

### 2. Configure JWT Secret

For production, set a secure JWT secret:

```bash
firebase functions:config:set jwt.secret="your-long-random-secure-secret-key"
firebase deploy --only functions
```

### 3. Disable Setup Endpoints (Production)

After initialization, consider disabling the setup endpoints:

Edit `functions/src/routes/setup.js` and add authentication checks.

### 4. Enable Two-Factor Authentication

(Feature to be implemented in future versions)

---

## API Endpoints Reference

### Setup Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/setup/status` | GET | Check setup completion status |
| `/api/setup/initialize` | POST | Create first admin user |
| `/api/setup/seed-defaults` | POST | Seed default data |

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/me` | GET | Get current user info |
| `/api/auth/change-password` | POST | Change password |
| `/api/auth/register` | POST | Register new user (admin only) |

---

## Next Steps After Setup

1. ✅ **Login** with admin credentials
2. ✅ **Change password** in Settings
3. ✅ **Create additional users** via Admin Panel
4. ✅ **Configure rate bands** in Manager Settings
5. ✅ **Add clients** to CRM
6. ✅ **Set up materials master** catalog
7. ✅ **Create your first project**

---

## Support

For issues or questions:
- **Email:** admin@jl2group.com
- **Documentation:** See README.md and other docs/
- **Firebase Docs:** https://firebase.google.com/docs

---

**BTL Costing Application v2.0**  
*Below the Line Cost Management System*  
© 2025 JL2 Group. All rights reserved.
