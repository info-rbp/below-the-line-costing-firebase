# 🚀 Quick Start: Deploy to Google Cloud in 15 Minutes

This is a simplified guide to get your BTL Costing app running on Google Cloud quickly.

## ✅ What You'll Get

- Live application URL (https://your-app.run.app)
- PostgreSQL database
- Auto-scaling serverless deployment
- HTTPS by default
- ~$15-30/month cost (includes free tier)

## 📋 Before You Start

1. **Create Google Cloud Account**: https://cloud.google.com (get $300 free credit!)
2. **Install Google Cloud CLI**: https://cloud.google.com/sdk/docs/install
3. **Have your payment method ready** (required even with free tier)

---

## 🎯 Step-by-Step Deployment

### Step 1: Set Up Google Cloud (5 minutes)

```bash
# Login to Google Cloud
gcloud auth login

# Create project
gcloud projects create btl-costing-prod --name="BTL Costing"

# Set as active project
gcloud config set project btl-costing-prod

# Enable APIs (this takes 2-3 minutes)
gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
```

### Step 2: Create Database (5 minutes)

```bash
# Create PostgreSQL database (takes 5-10 minutes - be patient!)
gcloud sql instances create btl-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=ChangeMe123! \
  --storage-size=10GB

# Create database and user
gcloud sql databases create btl_costing --instance=btl-db
gcloud sql users create btl_user --instance=btl-db --password=AppUser123!
```

**⚠️ SAVE THESE PASSWORDS!** You'll need them later.

### Step 3: Run Database Migrations (3 minutes)

```bash
# Install Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Get your instance connection name
INSTANCE_CONNECTION=$(gcloud sql instances describe btl-db --format="value(connectionName)")
echo "Instance connection: $INSTANCE_CONNECTION"

# Start proxy in background
./cloud-sql-proxy $INSTANCE_CONNECTION &
PROXY_PID=$!

# Wait for proxy to start
sleep 5

# Run migrations from your project directory
cd /home/user/webapp
DATABASE_URL="postgresql://btl_user:AppUser123!@localhost:5432/btl_costing" node scripts/migrate.js

# Stop proxy
kill $PROXY_PID
```

### Step 4: Deploy Application (2 minutes)

```bash
# Build and deploy in one command
gcloud run deploy btl-costing \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --add-cloudsql-instances $INSTANCE_CONNECTION \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=postgresql://btl_user:AppUser123!@/btl_costing?host=/cloudsql/${INSTANCE_CONNECTION},JWT_SECRET=$(openssl rand -base64 32)"
```

This command will:
- Build your Docker container
- Deploy to Cloud Run
- Connect to your database
- Give you a live URL

### Step 5: Get Your URL and Test

```bash
# Get your application URL
SERVICE_URL=$(gcloud run services describe btl-costing --region us-central1 --format="value(status.url)")
echo "🎉 Your app is live at: $SERVICE_URL"

# Test it
curl $SERVICE_URL/api/health

# Open in browser
echo "Open this URL in your browser: $SERVICE_URL"
```

---

## 🎊 You're Done!

Your application is now live! Access it at the URL shown above.

**Default Login:**
- Email: `admin@btlcosting.com`
- Password: `admin123`

⚠️ **Change this password immediately after first login!**

---

## 🔄 Update Your Application

After making code changes:

```bash
cd /home/user/webapp

# Redeploy (Cloud Build rebuilds automatically)
gcloud run deploy btl-costing --source . --region us-central1
```

---

## 💰 Cost Breakdown

**Free Tier (First Time Users):**
- $300 free credit
- Covers 2-3 months of usage

**After Free Tier:**
- Cloud Run: ~$5-10/month (with traffic)
- Cloud SQL: ~$10-20/month (db-f1-micro)
- **Total: ~$15-30/month**

**Cost Optimization:**
- Use --min-instances=0 for development (no always-on cost)
- Upgrade to db-g1-small only if needed ($25/month)

---

## 🛠️ Common Issues

### "Permission denied" error
```bash
# Enable billing for your project
# Go to: https://console.cloud.google.com/billing
# Link your project to a billing account
```

### Database connection timeout
```bash
# Check if Cloud SQL instance is running
gcloud sql instances list

# If stopped, start it
gcloud sql instances patch btl-db --activation-policy=ALWAYS
```

### "Service not found" error
```bash
# Check if deployment succeeded
gcloud run services list

# View deployment logs
gcloud run services logs read btl-costing --region us-central1
```

---

## 📚 Next Steps

1. **Set up custom domain** (optional)
2. **Configure automatic backups**
3. **Add team members to the application**
4. **Set up monitoring and alerts**
5. **Review security settings**

For detailed instructions, see `DEPLOY_GOOGLE_CLOUD.md`

---

## 🆘 Need Help?

- **View logs**: `gcloud run services logs read btl-costing --region us-central1`
- **Check database**: `gcloud sql instances describe btl-db`
- **Full documentation**: See `DEPLOY_GOOGLE_CLOUD.md`
- **Google Cloud Console**: https://console.cloud.google.com

Happy deploying! 🚀
