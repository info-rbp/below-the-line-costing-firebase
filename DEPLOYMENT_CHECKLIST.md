# ✅ Google Cloud Deployment Checklist

Print this out or keep it open while deploying!

---

## 📋 Before You Start

- [ ] Google account created
- [ ] Credit card ready (required for Google Cloud, even with free tier)
- [ ] Downloaded `btl-costing-google-cloud.tar.gz` file
- [ ] 30-60 minutes available for setup

---

## 🔧 Part 1: Initial Setup (10 minutes)

### Google Cloud Console

- [ ] Go to https://console.cloud.google.com
- [ ] Sign in with Google account
- [ ] Accept terms of service
- [ ] Set up billing account
- [ ] Click "Activate Cloud Shell" (top-right)
- [ ] Wait for Cloud Shell to load

### Upload File

- [ ] Click "More" menu (three dots) → "Upload file"
- [ ] Select `btl-costing-google-cloud.tar.gz`
- [ ] Wait for upload complete
- [ ] Run: `ls -lh btl-costing-google-cloud.tar.gz`
- [ ] See file listed (~96K)

### Extract Files

- [ ] Run: `tar -xzf btl-costing-google-cloud.tar.gz`
- [ ] Run: `cd webapp`
- [ ] Run: `ls -la`
- [ ] See directories: src/, public/, migrations-postgres/

---

## 🎯 Part 2: Create Google Cloud Project (5 minutes)

### Enable Services

Copy and paste these commands:

```bash
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

- [ ] Run each command above
- [ ] Wait for "Operation finished successfully" messages
- [ ] No errors displayed

---

## 🗄️ Part 3: Create Database (15 minutes)

### Create Database Instance

⏰ **This step takes 10-15 minutes!** Be patient.

```bash
gcloud sql instances create btl-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=CHANGE_THIS_PASSWORD_123! \
  --storage-size=10GB \
  --backup-start-time=03:00
```

- [ ] Replace `CHANGE_THIS_PASSWORD_123!` with a strong password
- [ ] **WRITE DOWN THIS PASSWORD!** Password: ___________________
- [ ] Run the command
- [ ] Wait for completion (grab coffee! ☕)
- [ ] See "Created" message

### Create Database and User

```bash
gcloud sql databases create btl_costing --instance=btl-db

gcloud sql users create btl_user \
  --instance=btl-db \
  --password=CHANGE_APP_PASSWORD_123!
```

- [ ] Replace `CHANGE_APP_PASSWORD_123!` with a different password
- [ ] **WRITE DOWN THIS PASSWORD!** Password: ___________________
- [ ] Run both commands
- [ ] See success messages

### Save Connection Name

```bash
INSTANCE_CONNECTION=$(gcloud sql instances describe btl-db --format="value(connectionName)")
echo "Connection name: $INSTANCE_CONNECTION"
```

- [ ] Run command
- [ ] See output like: `project-name:us-central1:btl-db`
- [ ] **WRITE DOWN THIS CONNECTION NAME:** ___________________

---

## 💾 Part 4: Setup Database Tables (5 minutes)

### Install Cloud SQL Proxy

```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
```

- [ ] Run both commands
- [ ] See "cloud-sql-proxy" file created

### Start Proxy and Migrate

```bash
./cloud-sql-proxy $INSTANCE_CONNECTION &
sleep 5
```

- [ ] Run command
- [ ] See "Ready for new connections"

```bash
npm install
```

- [ ] Run command
- [ ] Wait for packages to install (2-3 minutes)
- [ ] See "added X packages"

```bash
export DATABASE_URL="postgresql://btl_user:YOUR_APP_PASSWORD@localhost:5432/btl_costing"
npm run db:migrate
```

- [ ] Replace `YOUR_APP_PASSWORD` with password from Part 3
- [ ] Run both commands
- [ ] See migration messages:
  - ✅ Connected successfully
  - ✅ Completed: 001_initial_schema.sql
  - ✅ Completed: 002_enhancements.sql
  - 🎉 All migrations completed successfully!

```bash
pkill cloud-sql-proxy
```

- [ ] Stop the proxy
- [ ] Ready for deployment

---

## 🚀 Part 5: Deploy Application (10 minutes)

### Deploy to Cloud Run

⏰ **This step takes 5-10 minutes** (building Docker container)

```bash
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
  --set-env-vars "DATABASE_URL=postgresql://btl_user:YOUR_APP_PASSWORD@/btl_costing?host=/cloudsql/${INSTANCE_CONNECTION}" \
  --set-env-vars "JWT_SECRET=$(openssl rand -base64 32)" \
  --set-env-vars "PORT=3000"
```

- [ ] Replace `YOUR_APP_PASSWORD` with your app user password
- [ ] Run the command
- [ ] Wait for build to complete
- [ ] See "Building using Dockerfile"
- [ ] See "Deploying container to Cloud Run"
- [ ] See "Service [btl-costing] revision [btl-costing-00001] has been deployed"

### Get Your URL

```bash
SERVICE_URL=$(gcloud run services describe btl-costing --region us-central1 --format="value(status.url)")
echo "🎉 Your app is live at: $SERVICE_URL"
```

- [ ] Run command
- [ ] See URL like: `https://btl-costing-xyz123-uc.a.run.app`
- [ ] **WRITE DOWN THIS URL:** ___________________

---

## ✅ Part 6: Test Your Application (5 minutes)

### Test Health Check

```bash
curl $SERVICE_URL/api/health
```

- [ ] Run command
- [ ] See: `{"status":"ok","timestamp":"..."}`
- [ ] No errors displayed

### Test Login API

```bash
curl -X POST $SERVICE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@btlcosting.com","password":"admin123"}'
```

- [ ] Run command
- [ ] See `{"success":true,"token":"...","user":{...}}`
- [ ] Token received

### Open in Browser

```bash
echo "Open: $SERVICE_URL"
```

- [ ] Copy the URL
- [ ] Paste into browser
- [ ] See BTL Costing Application loading screen
- [ ] See login page

### Login

- [ ] Enter email: `admin@btlcosting.com`
- [ ] Enter password: `admin123`
- [ ] Click "Login"
- [ ] See dashboard load
- [ ] No errors displayed

### Change Password

- [ ] Click user menu (top right)
- [ ] Click "Change Password"
- [ ] Enter old password: `admin123`
- [ ] Enter new strong password
- [ ] **WRITE DOWN NEW PASSWORD:** ___________________
- [ ] Save password change
- [ ] Logout and login with new password
- [ ] Confirm new password works

---

## 🎯 Part 7: Verify Features (10 minutes)

### Test Navigation

- [ ] Click "Dashboard" - loads without errors
- [ ] Click "Projects" - see empty projects table
- [ ] Click "Personnel" - see personnel list (if seeded)
- [ ] Click "Rate Bands" - see rate bands
- [ ] Click "Manager Settings" (if admin/manager)
- [ ] Click "Pending Approvals" (if admin/manager)

### Create Test Project

- [ ] Click "Create New Project"
- [ ] Fill in project details
- [ ] Select a client
- [ ] Add a milestone
- [ ] Add labour cost
- [ ] Add material cost
- [ ] Review summary
- [ ] Submit project
- [ ] See project in projects list

### Verify Database

- [ ] Project saved successfully
- [ ] Can view project details
- [ ] Can edit project (if feature available)
- [ ] All data persists after page refresh

---

## 📊 Final Status Check

### Costs

- [ ] Check current costs: https://console.cloud.google.com/billing
- [ ] Should be ~$0 (within free tier)
- [ ] Set up billing alert at $20/month (optional)

### Monitoring

- [ ] View logs: https://console.cloud.google.com/run/detail/us-central1/btl-costing/logs
- [ ] See application logs
- [ ] No error messages

### Backups

- [ ] Verify automatic backups enabled
- [ ] Go to: https://console.cloud.google.com/sql/instances/btl-db
- [ ] Click "Backups"
- [ ] See backup schedule configured

---

## 🎉 Deployment Complete!

### Your Application Details

**Application URL:** ___________________  
**Admin Email:** admin@btlcosting.com  
**Admin Password:** ___________________ (NEW PASSWORD)

**Database Instance:** btl-db  
**Database Name:** btl_costing  
**Database User:** btl_user  
**Database Password:** ___________________

**Connection Name:** ___________________

### Next Steps

- [ ] Add team members (create user accounts)
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring alerts
- [ ] Review security settings
- [ ] Train users on the system
- [ ] Create test projects
- [ ] Document business processes

### Important Links

- **Application:** Your URL from Part 5
- **Google Cloud Console:** https://console.cloud.google.com
- **Cloud Run Dashboard:** https://console.cloud.google.com/run
- **Cloud SQL Dashboard:** https://console.cloud.google.com/sql
- **Billing Dashboard:** https://console.cloud.google.com/billing

---

## 🆘 If Something Goes Wrong

### Deployment Failed?

- [ ] Check build logs: `gcloud builds list`
- [ ] View latest log: `gcloud builds log [BUILD_ID]`
- [ ] Check for error messages

### Application Won't Start?

- [ ] Check logs: `gcloud run services logs read btl-costing --region us-central1 --limit 50`
- [ ] Verify DATABASE_URL is correct
- [ ] Confirm migrations ran successfully

### Can't Login?

- [ ] Verify database has data: 
  ```bash
  gcloud sql connect btl-db --user=btl_user
  \c btl_costing
  SELECT * FROM users;
  ```
- [ ] Should see admin user

### Need to Start Over?

- [ ] Delete Cloud Run service: `gcloud run services delete btl-costing --region us-central1`
- [ ] Delete Cloud SQL instance: `gcloud sql instances delete btl-db`
- [ ] Start from Part 2

---

## 📞 Support Resources

- **Documentation:** See README.md, DEPLOY_GOOGLE_CLOUD.md in archive
- **Google Cloud Support:** https://cloud.google.com/support
- **Cloud Run Docs:** https://cloud.google.com/run/docs
- **Cloud SQL Docs:** https://cloud.google.com/sql/docs

---

**Congratulations on your deployment!** 🎊

Keep this checklist for future reference or when redeploying.
