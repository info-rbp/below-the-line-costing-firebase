# 📦 Upload BTL Costing App to Google Cloud

## 📥 Step 1: Download Your Application

Your application is ready to download as a compressed file:

**Download Link:** *(Will be provided after this file is created)*

**File Name:** `btl-costing-google-cloud.tar.gz`
**File Size:** ~96 KB (excludes node_modules - will be installed on server)

**What's Included:**
- ✅ All source code (src/ directory)
- ✅ Frontend files (public/static/)
- ✅ Database migrations (migrations-postgres/)
- ✅ Configuration files (Dockerfile, package.json)
- ✅ Deployment guides (README.md, QUICKSTART, DEPLOY docs)
- ✅ Scripts (migration runner)

**What's Excluded (will install automatically):**
- ❌ node_modules (npm will install)
- ❌ .git directory (version control)
- ❌ Build artifacts (dist/)
- ❌ Log files

---

## 🚀 Step 2: Upload to Google Cloud

### **Method 1: Using Google Cloud Shell (Easiest)** ⭐ **RECOMMENDED**

**No installation required! Everything runs in your browser.**

#### **2.1 Open Google Cloud Console**

1. Go to: https://console.cloud.google.com
2. Sign in with your Google account
3. Click the **"Activate Cloud Shell"** button (top-right, terminal icon)
   - Wait for Cloud Shell to initialize (~30 seconds)

#### **2.2 Upload Your File**

In Cloud Shell, click the **"More"** menu (three dots) → **"Upload file"**

1. Select your downloaded file: `btl-costing-google-cloud.tar.gz`
2. Wait for upload to complete (should take 10-30 seconds)
3. Verify upload:
   ```bash
   ls -lh btl-costing-google-cloud.tar.gz
   ```

#### **2.3 Extract the Application**

```bash
# Extract the archive
tar -xzf btl-costing-google-cloud.tar.gz

# Navigate into the directory
cd webapp

# Verify files
ls -la
```

You should see:
- `src/` - Source code
- `public/` - Frontend files
- `migrations-postgres/` - Database setup
- `Dockerfile` - Container configuration
- `package.json` - Dependencies
- `README.md` - Documentation

---

### **Method 2: Using Local Computer (gcloud CLI)**

**Use this if you prefer working from your local machine.**

#### **2.1 Install Google Cloud CLI**

**Windows:**
- Download: https://cloud.google.com/sdk/docs/install#windows
- Run the installer
- Follow prompts (takes 5 minutes)

**macOS:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

#### **2.2 Login and Set Project**

```bash
# Login to Google Cloud
gcloud auth login

# Create or set your project
gcloud projects create btl-costing-prod --name="BTL Costing"
gcloud config set project btl-costing-prod
```

#### **2.3 Extract and Navigate**

```bash
# Extract the archive
tar -xzf btl-costing-google-cloud.tar.gz

# Navigate into directory
cd webapp
```

---

## 🗄️ Step 3: Set Up Database

**Run these commands in Cloud Shell (or your local terminal if using gcloud CLI):**

### **3.1 Enable Required APIs**

```bash
# Enable Cloud Run, Cloud SQL, and other services
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

This takes 1-2 minutes. Wait for completion.

### **3.2 Create PostgreSQL Database**

```bash
# Create Cloud SQL instance (takes 10-15 minutes!)
gcloud sql instances create btl-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=ChangeMeRoot123! \
  --storage-size=10GB \
  --backup-start-time=03:00
```

⚠️ **Important:** Save the root password! You'll need it later.

### **3.3 Create Database and User**

```bash
# Create the application database
gcloud sql databases create btl_costing --instance=btl-db

# Create application user
gcloud sql users create btl_user \
  --instance=btl-db \
  --password=ChangeMeApp123!
```

⚠️ **Important:** Save the app user password!

### **3.4 Get Connection Name**

```bash
# Get your instance connection name (save this!)
INSTANCE_CONNECTION=$(gcloud sql instances describe btl-db --format="value(connectionName)")
echo "Your connection name: $INSTANCE_CONNECTION"
```

Example output: `btl-costing-prod:us-central1:btl-db`

---

## 💾 Step 4: Run Database Migrations

### **4.1 Install Cloud SQL Proxy**

```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
```

### **4.2 Start Proxy and Run Migrations**

```bash
# Start Cloud SQL Proxy in background
./cloud-sql-proxy $INSTANCE_CONNECTION &
PROXY_PID=$!

# Wait for proxy to connect
sleep 5

# Install Node.js dependencies
npm install

# Set database connection
export DATABASE_URL="postgresql://btl_user:ChangeMeApp123!@localhost:5432/btl_costing"

# Run migrations
npm run db:migrate

# Stop proxy
kill $PROXY_PID
```

You should see:
```
✅ Connected successfully
⏳ Running migration: 001_initial_schema.sql
✅ Completed: 001_initial_schema.sql
⏳ Running migration: 002_enhancements.sql
✅ Completed: 002_enhancements.sql
🎉 All migrations completed successfully!
```

---

## 🚀 Step 5: Deploy to Cloud Run

### **5.1 Deploy the Application**

```bash
# Deploy to Cloud Run with database connection
gcloud run deploy btl-costing \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --add-cloudsql-instances $INSTANCE_CONNECTION \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "DATABASE_URL=postgresql://btl_user:ChangeMeApp123!@/btl_costing?host=/cloudsql/${INSTANCE_CONNECTION}" \
  --set-env-vars "JWT_SECRET=$(openssl rand -base64 32)" \
  --set-env-vars "PORT=3000"
```

This will:
1. Build a Docker container (5-10 minutes)
2. Push to Google Container Registry
3. Deploy to Cloud Run
4. Provide you with a live URL

### **5.2 Get Your Application URL**

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe btl-costing --region us-central1 --format="value(status.url)")
echo ""
echo "🎉 Your application is live at:"
echo "$SERVICE_URL"
echo ""
```

Example: `https://btl-costing-abc123xyz-uc.a.run.app`

---

## ✅ Step 6: Test Your Application

### **6.1 Test Health Check**

```bash
curl $SERVICE_URL/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-10-16T..."}
```

### **6.2 Test Login**

```bash
curl -X POST $SERVICE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@btlcosting.com","password":"admin123"}'
```

You should receive a JWT token.

### **6.3 Open in Browser**

```bash
# Open your application
echo "Open this URL in your browser: $SERVICE_URL"
```

**Default Login:**
- **Email:** admin@btlcosting.com
- **Password:** admin123

⚠️ **CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

---

## 🎯 Quick Command Summary

**For copy-paste deployment (after file upload):**

```bash
# 1. Extract
tar -xzf btl-costing-google-cloud.tar.gz
cd webapp

# 2. Enable APIs
gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com

# 3. Create database
gcloud sql instances create btl-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=us-central1 --root-password=YourPassword123!
gcloud sql databases create btl_costing --instance=btl-db
gcloud sql users create btl_user --instance=btl-db --password=AppPassword123!

# 4. Get connection name
INSTANCE_CONNECTION=$(gcloud sql instances describe btl-db --format="value(connectionName)")

# 5. Run migrations
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
./cloud-sql-proxy $INSTANCE_CONNECTION &
sleep 5
npm install
export DATABASE_URL="postgresql://btl_user:AppPassword123!@localhost:5432/btl_costing"
npm run db:migrate
pkill cloud-sql-proxy

# 6. Deploy
gcloud run deploy btl-costing \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --add-cloudsql-instances $INSTANCE_CONNECTION \
  --set-env-vars "DATABASE_URL=postgresql://btl_user:AppPassword123!@/btl_costing?host=/cloudsql/${INSTANCE_CONNECTION},JWT_SECRET=$(openssl rand -base64 32),NODE_ENV=production"

# 7. Get URL
gcloud run services describe btl-costing --region us-central1 --format="value(status.url)"
```

---

## 💰 Cost Summary

**While setting up (during deployment):**
- Free (within free tier limits)

**After deployment:**
- **Cloud Run:** $5-10/month (auto-scales to zero when not in use)
- **Cloud SQL:** $10-20/month (db-f1-micro always running)
- **Total:** ~$15-30/month

**Free Tier Benefits:**
- $300 free credit (new accounts)
- Covers 2-3 months of usage
- 2 million Cloud Run requests/month free

---

## 🛠️ Management & Updates

### **View Logs**

```bash
gcloud run services logs read btl-costing --region us-central1 --follow
```

### **Update Application**

After making code changes:

```bash
# Redeploy
gcloud run deploy btl-costing --source . --region us-central1
```

### **Scale Application**

```bash
# Set minimum instances
gcloud run services update btl-costing --region us-central1 --min-instances 1

# Set maximum instances
gcloud run services update btl-costing --region us-central1 --max-instances 20
```

### **Database Backup**

```bash
# Manual backup
gcloud sql backups create --instance=btl-db

# List backups
gcloud sql backups list --instance=btl-db
```

---

## 🆘 Troubleshooting

### **"Permission denied" or "Billing account required"**

1. Go to: https://console.cloud.google.com/billing
2. Link your project to a billing account
3. Even with free tier, you need a payment method on file

### **"Cloud SQL instance creation failed"**

- Check if you have quota limits
- Try a different region: `--region=us-east1`
- Make sure billing is enabled

### **"Build failed" during deployment**

```bash
# Check build logs
gcloud builds list
gcloud builds log [BUILD_ID]
```

### **Application returns 500 errors**

```bash
# Check application logs
gcloud run services logs read btl-costing --region us-central1 --limit 50

# Common issues:
# - DATABASE_URL incorrect
# - Database not migrated
# - Cloud SQL connection not configured
```

### **Can't connect to database**

```bash
# Test Cloud SQL connection
gcloud sql connect btl-db --user=btl_user

# Check instance is running
gcloud sql instances list
```

---

## 📚 Additional Resources

- **Full Deployment Guide:** See `DEPLOY_GOOGLE_CLOUD.md` in the archive
- **Quick Start Guide:** See `QUICKSTART_GOOGLE_CLOUD.md`
- **Application README:** See `README.md`

- **Google Cloud Console:** https://console.cloud.google.com
- **Cloud Run Documentation:** https://cloud.google.com/run/docs
- **Cloud SQL Documentation:** https://cloud.google.com/sql/docs
- **Pricing Calculator:** https://cloud.google.com/products/calculator

---

## ✨ What's Next?

After successful deployment:

1. ✅ **Change admin password** (first login)
2. ✅ **Add team members** (create user accounts)
3. ✅ **Set up monitoring** (enable Cloud Monitoring)
4. ✅ **Configure backups** (set retention policy)
5. ✅ **Custom domain** (optional - add your domain)
6. ✅ **Test all features** (create projects, add costs, etc.)

---

## 🎉 Success!

Your BTL Costing application is now live on Google Cloud!

**Access it at:** Your Cloud Run URL (from Step 5.2)

**Default credentials:**
- Email: admin@btlcosting.com
- Password: admin123

**Remember to change the password immediately!**

For help or questions, refer to the deployment guides included in the archive.

Good luck! 🚀
