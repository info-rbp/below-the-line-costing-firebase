# BTL Costing - Quick Start

## 🚀 Get Started in 3 Steps

### Step 1: Deploy
```bash
firebase deploy
```

### Step 2: Initialize Admin Account

**Easiest Method - Web Setup:**
1. Go to: `https://your-project.web.app/setup.html`
2. Click "Create Admin Account"
3. Done! ✅

**Command-Line Method:**
```bash
npm run setup:all
```

### Step 3: Login
- URL: `https://your-project.web.app/`
- Email: `admin@jl2group.com`
- Password: `admin123`

---

## 📋 Default Credentials

**Admin Account:**
- 📧 Email: `admin@jl2group.com`
- 🔑 Password: `admin123`

⚠️ **Change password after first login!**

---

## 🛠️ Useful Commands

```bash
# Setup
npm run setup:init          # Create admin user
npm run setup:seed          # Seed default data
npm run setup:all           # Do both

# Development
firebase emulators:start    # Local testing
firebase serve              # Test hosting locally

# Deployment
firebase deploy             # Deploy everything
firebase deploy --only functions    # Functions only
firebase deploy --only hosting      # Hosting only

# Utilities
npm run hash-password admin123      # Generate password hash
firebase functions:log              # View logs
```

---

## 📚 Documentation

- **Full Setup Guide:** [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Complete README:** [README.md](README.md)
- **Deployment Guide:** [FIREBASE_DEPLOYMENT_GUIDE.md](FIREBASE_DEPLOYMENT_GUIDE.md)

---

## 🔍 Verify Setup

### Check Status:
```bash
curl https://your-project.web.app/api/setup/status
```

### Test Login:
```bash
curl -X POST https://your-project.web.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jl2group.com","password":"admin123"}'
```

---

## ❓ Troubleshooting

**Can't login?**
1. Run: `npm run setup:init`
2. Try again

**Setup page shows "Already Setup"?**
- Users already exist
- Try logging in with existing credentials
- Or reset via: `npm run setup:init` (waits 5 seconds)

**Firebase errors?**
```bash
firebase login
gcloud auth application-default login
```

---

**Need More Help?** See [SETUP_GUIDE.md](SETUP_GUIDE.md)
