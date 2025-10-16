# 🚀 Deploy BTL Costing to Cloudflare Pages

## 📋 Quick Overview

This guide will help you deploy your BTL Costing application to Cloudflare Pages in **15-30 minutes**.

**What you'll get:**
- ✅ Live URL: `https://your-project.pages.dev`
- ✅ Global CDN with edge computing
- ✅ D1 SQLite database
- ✅ Automatic HTTPS
- ✅ Free tier (generous limits)

---

## 🎯 Prerequisites

### Required:
1. **Cloudflare Account** - Free at https://dash.cloudflare.com/sign-up
2. **Credit Card** - Required for Workers/Pages (free tier available)
3. **This Repository** - Already on GitHub

### Installation (if not in Cloud Shell):
```bash
npm install -g wrangler
wrangler login
```

---

## 📦 Step 1: Initial Setup

### 1.1 Clone Repository (if needed)

```bash
git clone https://github.com/info-rbp/belowtheline-app.git
cd belowtheline-app
```

### 1.2 Install Dependencies

```bash
npm install
```

### 1.3 Login to Cloudflare

```bash
wrangler login
```

This opens a browser for authentication.

---

## 🗄️ Step 2: Create D1 Database

### 2.1 Create Production Database

```bash
wrangler d1 create webapp-production
```

**Output will look like:**
```
✅ Successfully created DB 'webapp-production'

[[d1_databases]]
binding = "DB"
database_name = "webapp-production"
database_id = "xxxx-xxxx-xxxx-xxxx"
```

### 2.2 Update wrangler.jsonc

Copy the `database_id` from the output and update `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "xxxx-xxxx-xxxx-xxxx"  // ← Paste your database_id here
    }
  ]
}
```

### 2.3 Run Migrations

```bash
# Apply database schema to production
wrangler d1 migrations apply webapp-production --remote
```

You should see:
```
✅ Applying migration 0001_initial_schema.sql
✅ Applying migration 0002_enhancements.sql
🎉 Migration completed successfully
```

### 2.4 Seed Database (Optional)

```bash
# Add sample data (8 clients, 30 materials)
wrangler d1 execute webapp-production --remote --file=./seed.sql
```

---

## 🏗️ Step 3: Build Application

### 3.1 Build for Production

```bash
npm run build
```

This creates the `dist/` folder with:
- `_worker.js` - Your compiled application
- `_routes.json` - Routing configuration
- `static/` - Frontend files

### 3.2 Verify Build

```bash
ls -la dist/
```

You should see:
- `_worker.js` (your backend)
- `_routes.json` (routing)
- `static/` folder (frontend assets)

---

## 🚀 Step 4: Deploy to Cloudflare Pages

### 4.1 Create Pages Project

```bash
wrangler pages project create webapp --production-branch=main
```

### 4.2 Deploy

```bash
wrangler pages deploy dist --project-name=webapp
```

**This will:**
1. Upload your application (~2-5 minutes)
2. Deploy to Cloudflare's global network
3. Give you a live URL

**Output:**
```
✨ Deployment complete! Take a deep breath, smile, and relax.
🌎 Your site is live at:
   https://webapp-xxx.pages.dev
```

### 4.3 Set Environment Variables

```bash
# Generate a secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Set it in production
echo $JWT_SECRET | wrangler pages secret put JWT_SECRET --project-name=webapp
```

---

## ✅ Step 5: Test Your Deployment

### 5.1 Test Health Check

```bash
curl https://webapp-xxx.pages.dev/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-10-16T..."}
```

### 5.2 Test Login

```bash
curl -X POST https://webapp-xxx.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@btlcosting.com","password":"admin123"}'
```

You should receive a JWT token.

### 5.3 Open in Browser

Visit: `https://webapp-xxx.pages.dev`

**Default login:**
- Email: `admin@btlcosting.com`
- Password: `admin123`

⚠️ **Change this password immediately after first login!**

---

## 🔄 Step 6: Setup Automatic Deployments

### 6.1 Connect to GitHub

1. Go to: https://dash.cloudflare.com
2. Navigate to: **Pages** → **webapp**
3. Click **Settings** → **Builds & deployments**
4. Click **Connect to Git**
5. Select your GitHub repository: `info-rbp/belowtheline-app`
6. Configure:
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`

### 6.2 Test Automatic Deployment

```bash
# Make a small change
echo "# Updated" >> README.md

# Commit and push
git add .
git commit -m "Test automatic deployment"
git push origin main
```

Cloudflare will automatically:
1. Detect the push
2. Build your application
3. Deploy to production

---

## 🛠️ Management Commands

### View Deployments

```bash
wrangler pages deployments list --project-name=webapp
```

### View Logs

```bash
wrangler pages deployment tail --project-name=webapp
```

### Database Operations

```bash
# Query database
wrangler d1 execute webapp-production --remote --command="SELECT * FROM users"

# Run migrations
wrangler d1 migrations apply webapp-production --remote

# Backup (export)
wrangler d1 export webapp-production --remote --output=backup.sql
```

### Rollback Deployment

```bash
# List deployments
wrangler pages deployments list --project-name=webapp

# Rollback to specific deployment
wrangler pages deployments rollback <DEPLOYMENT_ID> --project-name=webapp
```

---

## 🌐 Custom Domain (Optional)

### Add Your Domain

```bash
wrangler pages domain add yourdomain.com --project-name=webapp
```

### Configure DNS

Add these records to your domain:
- **Type:** CNAME
- **Name:** @ (or subdomain)
- **Target:** webapp.pages.dev

SSL certificate is automatically provisioned!

---

## 💰 Cost Breakdown

### Free Tier (Generous!)
- ✅ **500,000 requests/month** - FREE
- ✅ **5GB database storage** - FREE
- ✅ **Unlimited bandwidth** - FREE
- ✅ **100,000 D1 reads/day** - FREE
- ✅ **50,000 D1 writes/day** - FREE

### Paid Tier (if you exceed free tier)
- **Workers Paid:** $5/month
  - 10 million requests included
  - Additional: $0.50 per million
- **D1:** Free (currently in open beta)

**Most applications stay within free tier!**

---

## 🎯 Quick Command Reference

```bash
# Setup
wrangler login
npm install

# Database
wrangler d1 create webapp-production
wrangler d1 migrations apply webapp-production --remote
wrangler d1 execute webapp-production --remote --file=./seed.sql

# Build & Deploy
npm run build
wrangler pages deploy dist --project-name=webapp

# Management
wrangler pages deployments list --project-name=webapp
wrangler pages deployment tail --project-name=webapp
wrangler d1 execute webapp-production --remote --command="SELECT * FROM users"

# Secrets
wrangler pages secret put JWT_SECRET --project-name=webapp
wrangler pages secret list --project-name=webapp
```

---

## 🆘 Troubleshooting

### "Not logged in"

```bash
wrangler logout
wrangler login
```

### "Database not found"

Make sure you:
1. Created the database: `wrangler d1 create webapp-production`
2. Updated `database_id` in `wrangler.jsonc`
3. Ran migrations: `wrangler d1 migrations apply webapp-production --remote`

### "Build failed"

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### "Can't access database"

Check your binding in `wrangler.jsonc`:
```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",  // Must be "DB"
      "database_name": "webapp-production",
      "database_id": "your-actual-id"
    }
  ]
}
```

### "Login doesn't work"

1. Check JWT_SECRET is set:
   ```bash
   wrangler pages secret list --project-name=webapp
   ```

2. Verify database has users:
   ```bash
   wrangler d1 execute webapp-production --remote --command="SELECT * FROM users"
   ```

3. If no users, run seed:
   ```bash
   wrangler d1 execute webapp-production --remote --file=./seed.sql
   ```

---

## 📊 Deployment Checklist

- [ ] Cloudflare account created
- [ ] Wrangler installed and logged in
- [ ] Repository cloned and dependencies installed
- [ ] D1 database created
- [ ] `wrangler.jsonc` updated with database_id
- [ ] Migrations applied to production database
- [ ] Database seeded (optional but recommended)
- [ ] Application built successfully
- [ ] Pages project created
- [ ] Application deployed
- [ ] JWT_SECRET environment variable set
- [ ] Health check tested
- [ ] Login tested
- [ ] Browser access verified
- [ ] Admin password changed
- [ ] GitHub auto-deploy connected (optional)
- [ ] Custom domain added (optional)

---

## 🔐 Security Checklist

After deployment:

- [ ] Change default admin password immediately
- [ ] Generate strong JWT secret: `openssl rand -base64 32`
- [ ] Set JWT secret as environment variable
- [ ] Review user accounts and roles
- [ ] Enable Cloudflare security features (WAF, DDoS protection)
- [ ] Set up monitoring and alerts
- [ ] Configure database backups
- [ ] Review API rate limits

---

## 📚 Additional Resources

- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Cloudflare D1 Docs:** https://developers.cloudflare.com/d1/
- **Wrangler CLI Docs:** https://developers.cloudflare.com/workers/wrangler/
- **Hono Framework:** https://hono.dev/
- **Your Dashboard:** https://dash.cloudflare.com

---

## 🎉 Success!

Your BTL Costing application is now live on Cloudflare Pages!

**Access it at:** Your Pages URL from deployment

**Next steps:**
1. Change admin password
2. Test all features
3. Add team members
4. Configure custom domain (optional)
5. Set up monitoring

**For updates:**
```bash
# Make changes
git add .
git commit -m "Update description"
git push origin main

# Auto-deploys if GitHub integration is set up
# Or manually: npm run build && wrangler pages deploy dist --project-name=webapp
```

---

**Need help? Check the troubleshooting section or visit Cloudflare Discord!**
