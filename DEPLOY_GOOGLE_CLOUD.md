# 🚀 Deploy BTL Costing Application to Google Cloud

This guide will help you deploy your BTL Costing application to Google Cloud Platform using Cloud Run and Cloud SQL.

## 📋 Prerequisites

1. **Google Cloud Account** - Sign up at https://cloud.google.com
2. **Google Cloud CLI (gcloud)** - Install from https://cloud.google.com/sdk/docs/install
3. **Docker** (optional for local testing) - Install from https://docs.docker.com/get-docker/

## 🎯 Architecture Overview

- **Cloud Run**: Serverless container platform for your Hono application
- **Cloud SQL (PostgreSQL)**: Managed PostgreSQL database
- **Cloud Build**: Automated container builds and deployments
- **Secret Manager**: Secure storage for sensitive credentials

## 💰 Estimated Costs

- **Cloud Run**: ~$5-20/month (depending on traffic, includes generous free tier)
- **Cloud SQL**: ~$10-50/month (db-f1-micro instance)
- **Total**: **$15-70/month** (much less with free tier credits)

---

## 🏗️ Step 1: Set Up Google Cloud Project

### 1.1 Create a New Project

```bash
# Install gcloud CLI if you haven't already
# https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Create a new project
gcloud projects create btl-costing-prod --name="BTL Costing Production"

# Set as active project
gcloud config set project btl-costing-prod

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 1.2 Set Up Billing

- Go to https://console.cloud.google.com/billing
- Link your project to a billing account
- Google offers $300 free credit for new accounts!

---

## 🗄️ Step 2: Create Cloud SQL Database

### 2.1 Create PostgreSQL Instance

```bash
# Create Cloud SQL instance (this takes 5-10 minutes)
gcloud sql instances create btl-costing-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_ROOT_PASSWORD \
  --storage-size=10GB \
  --storage-type=SSD \
  --backup-start-time=03:00

# Note: Replace YOUR_SECURE_ROOT_PASSWORD with a strong password
# Save this password - you'll need it later!
```

### 2.2 Create Database and User

```bash
# Create the database
gcloud sql databases create btl_costing --instance=btl-costing-db

# Create a user for the application
gcloud sql users create btl_user \
  --instance=btl-costing-db \
  --password=YOUR_APP_USER_PASSWORD

# Note: Replace YOUR_APP_USER_PASSWORD with a strong password
```

### 2.3 Get Connection Details

```bash
# Get the connection name (you'll need this later)
gcloud sql instances describe btl-costing-db --format="value(connectionName)"

# Example output: btl-costing-prod:us-central1:btl-costing-db
# Save this connection name!
```

---

## 🔐 Step 3: Store Secrets

```bash
# Generate a random JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "Generated JWT Secret: $JWT_SECRET"

# Store JWT secret in Secret Manager
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-

# Store database password
echo -n "YOUR_APP_USER_PASSWORD" | gcloud secrets create db-password --data-file=-

# Grant Cloud Run access to secrets
PROJECT_NUMBER=$(gcloud projects describe btl-costing-prod --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding db-password \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 📦 Step 4: Build and Deploy Container

### 4.1 Build Container with Cloud Build

```bash
# From your project root directory
cd /home/user/webapp

# Submit build to Cloud Build
gcloud builds submit --tag gcr.io/btl-costing-prod/btl-costing:latest
```

### 4.2 Run Database Migrations

Before deploying the application, run migrations to set up the database:

```bash
# Create a temporary connection to Cloud SQL
gcloud sql connect btl-costing-db --user=btl_user --database=btl_costing

# In the PostgreSQL prompt, paste the contents of:
# migrations-postgres/001_initial_schema.sql
# migrations-postgres/002_enhancements.sql

# Or use Cloud SQL Proxy for local migration:

# Install Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Start proxy in background
./cloud-sql-proxy btl-costing-prod:us-central1:btl-costing-db &

# Run migrations
DATABASE_URL="postgresql://btl_user:YOUR_APP_USER_PASSWORD@localhost:5432/btl_costing" \
  node scripts/migrate.js

# Stop proxy
pkill cloud-sql-proxy
```

---

## 🚀 Step 5: Deploy to Cloud Run

### 5.1 Deploy the Service

```bash
# Get connection name
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe btl-costing-db --format="value(connectionName)")

# Get secret versions
JWT_SECRET_VERSION=$(gcloud secrets versions list jwt-secret --limit=1 --format="value(name)")
DB_PASSWORD_VERSION=$(gcloud secrets versions list db-password --limit=1 --format="value(name)")

# Deploy to Cloud Run
gcloud run deploy btl-costing \
  --image gcr.io/btl-costing-prod/btl-costing:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --add-cloudsql-instances $INSTANCE_CONNECTION_NAME \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "DATABASE_URL=postgresql://btl_user:YOUR_APP_USER_PASSWORD@/btl_costing?host=/cloudsql/${INSTANCE_CONNECTION_NAME}" \
  --set-secrets "JWT_SECRET=jwt-secret:${JWT_SECRET_VERSION}"

# Note: Replace YOUR_APP_USER_PASSWORD in the DATABASE_URL
```

### 5.2 Get Your Application URL

```bash
# Get the service URL
gcloud run services describe btl-costing \
  --region us-central1 \
  --format="value(status.url)"

# Example output: https://btl-costing-abc123-uc.a.run.app
```

---

## ✅ Step 6: Verify Deployment

### 6.1 Test the Application

```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe btl-costing --region us-central1 --format="value(status.url)")

# Test health check
curl $SERVICE_URL/api/health

# Expected response: {"status":"ok","timestamp":"2025-..."}

# Test login (default admin user)
curl -X POST $SERVICE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@btlcosting.com","password":"admin123"}'

# You should receive a JWT token
```

### 6.2 Access the Application

Open your browser and navigate to your Cloud Run service URL:
```
https://btl-costing-abc123-uc.a.run.app
```

**Default login credentials:**
- Email: `admin@btlcosting.com`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the admin password immediately after first login!

---

## 🔄 Step 7: Set Up Continuous Deployment (Optional)

### 7.1 Connect to GitHub

```bash
# Install GitHub integration
gcloud run services add-iam-policy-binding btl-costing \
  --region us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### 7.2 Create Build Trigger

1. Go to https://console.cloud.google.com/cloud-build/triggers
2. Click "Connect Repository"
3. Select GitHub and authorize
4. Choose your repository
5. Create trigger with these settings:
   - **Event**: Push to branch
   - **Branch**: `^main$`
   - **Build configuration**: Cloud Build configuration file
   - **Location**: `/cloudbuild.yaml`

### 7.3 Create cloudbuild.yaml

```yaml
# /home/user/webapp/cloudbuild.yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/btl-costing:$SHORT_SHA', '.']
  
  # Push the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/btl-costing:$SHORT_SHA']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'btl-costing'
      - '--image=gcr.io/$PROJECT_ID/btl-costing:$SHORT_SHA'
      - '--region=us-central1'
      - '--platform=managed'

images:
  - 'gcr.io/$PROJECT_ID/btl-costing:$SHORT_SHA'
```

Now every push to `main` branch will automatically deploy!

---

## 🛠️ Management & Maintenance

### View Logs

```bash
# Stream logs
gcloud run services logs read btl-costing --region us-central1 --follow

# View logs in Cloud Console
open "https://console.cloud.google.com/run/detail/us-central1/btl-costing/logs"
```

### Update Environment Variables

```bash
gcloud run services update btl-costing \
  --region us-central1 \
  --set-env-vars "NEW_VAR=value"
```

### Scale the Application

```bash
# Set min/max instances
gcloud run services update btl-costing \
  --region us-central1 \
  --min-instances 1 \
  --max-instances 20
```

### Create Database Backup

```bash
# Manual backup
gcloud sql backups create --instance=btl-costing-db

# List backups
gcloud sql backups list --instance=btl-costing-db

# Restore from backup
gcloud sql backups restore BACKUP_ID --backup-instance=btl-costing-db --backup-instance=btl-costing-db
```

---

## 🌐 Step 8: Custom Domain (Optional)

### 8.1 Map Custom Domain

```bash
# Add domain mapping
gcloud run domain-mappings create \
  --service btl-costing \
  --domain app.yourdomain.com \
  --region us-central1
```

### 8.2 Configure DNS

Add the DNS records shown in the output to your domain provider:
- **Type**: CNAME
- **Name**: app
- **Value**: ghs.googlehosted.com

SSL certificate will be provisioned automatically!

---

## 💡 Tips & Best Practices

### Performance

- Use **db-g1-small** or higher for production databases
- Enable **connection pooling** for better performance
- Set appropriate **min-instances** to avoid cold starts

### Security

- Change default admin password immediately
- Use **Secret Manager** for all sensitive data
- Enable **Cloud Armor** for DDoS protection
- Restrict database access with **VPC** networking

### Cost Optimization

- Use **min-instances=0** for development
- Enable **automatic backups** but limit retention
- Monitor costs with **billing alerts**
- Use **committed use discounts** for production

---

## 🆘 Troubleshooting

### Application won't start

```bash
# Check logs
gcloud run services logs read btl-costing --region us-central1 --limit 50

# Common issues:
# - Database connection error: Check DATABASE_URL and Cloud SQL connection
# - Port mismatch: Ensure container listens on PORT env var
# - Memory limit: Increase with --memory flag
```

### Database connection failed

```bash
# Test Cloud SQL connectivity
gcloud sql connect btl-costing-db --user=btl_user

# Check Cloud SQL Proxy permissions
gcloud projects get-iam-policy btl-costing-prod
```

### Slow response times

```bash
# Check database performance
gcloud sql operations list --instance=btl-costing-db

# Upgrade database tier
gcloud sql instances patch btl-costing-db --tier=db-g1-small
```

---

## 📚 Additional Resources

- **Cloud Run Documentation**: https://cloud.google.com/run/docs
- **Cloud SQL Documentation**: https://cloud.google.com/sql/docs
- **Pricing Calculator**: https://cloud.google.com/products/calculator
- **Support**: https://cloud.google.com/support

---

## 🎉 Success!

Your BTL Costing application is now running on Google Cloud Platform with:

✅ Serverless Cloud Run deployment  
✅ Managed PostgreSQL database  
✅ Automatic scaling  
✅ HTTPS by default  
✅ 99.95% uptime SLA  

**Next Steps:**
1. Change default admin password
2. Set up monitoring and alerts
3. Configure automatic backups
4. Add your team members
5. Start creating projects!

Need help? Check the troubleshooting section or open an issue on GitHub.
