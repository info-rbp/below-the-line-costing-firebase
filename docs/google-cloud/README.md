# Google Cloud Deployment Files

This directory contains files needed for deploying to Google Cloud Platform (Cloud Run + Cloud SQL PostgreSQL).

## Files in This Directory

- **`Dockerfile`** - Container configuration for Cloud Run
- **`.dockerignore`** - Files to exclude from Docker build
- **`.env.example`** - Environment variable template
- **`server.js`** - Node.js HTTP server (replaces Cloudflare Workers)
- **`db.js`** - PostgreSQL database helpers
- **`migrate.js`** - Database migration runner
- **`migrations-postgres/`** - PostgreSQL schema migrations

## Documentation

- **`QUICKSTART_GOOGLE_CLOUD.md`** - 15-minute quick deployment guide
- **`DEPLOY_GOOGLE_CLOUD.md`** - Comprehensive deployment guide
- **`GOOGLE_CLOUD_SUMMARY.md`** - Overview and FAQ
- **`UPLOAD_TO_GOOGLE_CLOUD.md`** - Step-by-step upload instructions
- **`DEPLOYMENT_CHECKLIST.md`** - Printable deployment checklist

## When to Use Google Cloud

Use Google Cloud deployment if you need:
- ✅ PostgreSQL database (instead of SQLite)
- ✅ More than 5GB database storage
- ✅ Server-side Node.js capabilities
- ✅ Docker containerization
- ✅ Enterprise-grade infrastructure

## When to Use Cloudflare (Default)

Use Cloudflare Pages deployment if you want:
- ✅ Free tier (500K requests/month)
- ✅ Global edge network
- ✅ Simpler deployment
- ✅ D1 SQLite database (sufficient for most use cases)
- ✅ Lower cost ($0-5/month vs $15-30/month)

## Quick Start (Google Cloud)

1. **Read the quick start:**
   ```bash
   cat QUICKSTART_GOOGLE_CLOUD.md
   ```

2. **Follow the guide to:**
   - Create Google Cloud account ($300 free credit)
   - Deploy to Cloud Run
   - Set up Cloud SQL PostgreSQL
   - Get live URL

3. **Estimated time:** 30-45 minutes
4. **Estimated cost:** ~$15-30/month (free for first 2-3 months with credit)

## Default Deployment

By default, this application is configured for **Cloudflare Pages**. See the main `CLOUDFLARE_DEPLOY.md` in the root directory.

To switch to Google Cloud, copy the files from this directory to the project root and follow the Google Cloud guides.
