# Cloudflare Pages Deployment Troubleshooting

## Common Deployment Errors

### Error: "It looks like you've run a Workers-specific command in a Pages project"

**Full error message:**
```
✘ [ERROR] It looks like you've run a Workers-specific command in a Pages project.
For Pages, please run `wrangler pages deploy` instead.
```

**Cause:** Cloudflare Pages is trying to run `wrangler deploy` (Workers) instead of just building with `npm run build`.

**Solution:**

1. **In Cloudflare Dashboard:**
   - Go to your Pages project
   - Navigate to **Settings** → **Builds & deployments**
   - Under **Build configuration**, set:
     - **Build command:** `npm run build` (NOT `npx wrangler deploy`)
     - **Build output directory:** `dist`
   - Click **Save**

2. **Trigger a new deployment:**
   - Go to **Deployments** tab
   - Click **Retry deployment** or push a new commit

3. **Verify configuration files:**
   - Check `wrangler.jsonc` does NOT have `"main": "src/index.tsx"`
   - Check `.pages.yaml` has correct build command

---

### Error: "Database binding not found"

**Cause:** D1 database not bound to Pages project.

**Solution:**

1. Go to your Pages project in Cloudflare dashboard
2. Navigate to **Settings** → **Functions**
3. Scroll to **D1 database bindings**
4. Click **Add binding**
5. Set:
   - Variable name: `DB`
   - D1 database: `webapp-production`
6. Click **Save**
7. Redeploy

---

### Error: "Migration not applied"

**Cause:** Database schema not initialized.

**Solution:**

```bash
# Apply migrations to production
wrangler d1 migrations apply webapp-production --remote

# Verify
wrangler d1 execute webapp-production --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

---

### Error: "JWT_SECRET not found"

**Cause:** Environment variable not set.

**Solution:**

**Option 1 - Using wrangler CLI:**
```bash
openssl rand -base64 32 | wrangler pages secret put JWT_SECRET --project-name=webapp
```

**Option 2 - Using Cloudflare Dashboard:**
1. Go to Pages project → **Settings** → **Environment variables**
2. Click **Add variable**
3. Name: `JWT_SECRET`
4. Value: (generate with `openssl rand -base64 32`)
5. Click **Save**

---

### Error: "Build failed"

**Common causes and solutions:**

1. **Missing dependencies:**
   ```bash
   # Solution: Check package.json
   npm install
   npm run build  # Test locally first
   ```

2. **TypeScript errors:**
   ```bash
   # Solution: Check for compilation errors
   npm run build  # Shows TypeScript errors
   ```

3. **Vite build issues:**
   - Check `vite.config.ts` is correct
   - Ensure `@hono/vite-build` plugin is configured

---

### Error: "Cannot find module"

**Cause:** Incorrect import paths or missing files.

**Solution:**

1. Check all imports use correct paths
2. Verify files exist in repository
3. Check file extensions (.ts, .tsx, .js)

---

### Error: "Login not working"

**Causes:**

1. **Database not seeded:**
   ```bash
   wrangler d1 execute webapp-production --remote --file=./seed.sql
   ```

2. **JWT_SECRET not set:**
   ```bash
   wrangler pages secret put JWT_SECRET --project-name=webapp
   ```

3. **Migrations not applied:**
   ```bash
   wrangler d1 migrations apply webapp-production --remote
   ```

---

## Deployment Checklist

Use this to debug deployment issues:

- [ ] Build command is `npm run build` (not `npx wrangler deploy`)
- [ ] Build output directory is `dist`
- [ ] `wrangler.jsonc` does NOT have `"main"` field
- [ ] D1 database created: `wrangler d1 list`
- [ ] Database ID in `wrangler.jsonc` is correct
- [ ] Migrations applied: `wrangler d1 migrations apply webapp-production --remote`
- [ ] Database seeded (optional): `wrangler d1 execute webapp-production --remote --file=./seed.sql`
- [ ] D1 binding added in Cloudflare dashboard (variable: `DB`)
- [ ] JWT_SECRET environment variable set
- [ ] GitHub repository connected correctly
- [ ] Production branch set to `main`

---

## Testing Locally Before Deploy

Always test locally first:

```bash
# Install dependencies
npm install

# Build application
npm run build

# Check dist/ folder exists
ls -la dist/

# Test with local D1 database
npm run db:migrate:local
npm run db:seed
npm run dev:sandbox

# Visit http://localhost:3000
```

If local testing works but deployment fails, the issue is usually:
- Database binding configuration
- Environment variables
- Build command configuration

---

## Getting Help

1. **Check build logs:**
   - Go to Cloudflare dashboard → Pages → Deployments
   - Click on failed deployment
   - View full build log

2. **Check function logs:**
   - Go to Pages → Functions
   - View real-time logs

3. **Cloudflare Discord:**
   - https://discord.gg/cloudflaredev
   - #pages channel

4. **Cloudflare Community:**
   - https://community.cloudflare.com/c/developers/pages/

---

## Quick Fixes

### Reset and Redeploy

```bash
# 1. Clear Cloudflare build cache
# (Do this in dashboard: Settings → Builds → Clear cache)

# 2. Verify local build works
npm install
npm run build

# 3. Commit and push
git add .
git commit -m "Fix deployment"
git push origin main

# 4. Monitor deployment
# Watch in Cloudflare dashboard
```

### Manual Deploy from CLI

If GitHub integration has issues, deploy manually:

```bash
# Build locally
npm run build

# Deploy to Pages
wrangler pages deploy dist --project-name=webapp --branch=main
```

---

## Correct Configuration Files

### `.pages.yaml` (optional but recommended)

```yaml
build:
  command: npm run build
  output_dir: dist
```

### `wrangler.jsonc`

```jsonc
{
  "name": "webapp",
  "compatibility_date": "2025-10-15",
  "pages_build_output_dir": "./dist",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "your-database-id"
    }
  ]
}
```

**Note:** NO `"main"` field for Pages projects!

### `package.json` scripts

```json
{
  "scripts": {
    "build": "vite build",
    "deploy": "npm run build && wrangler pages deploy dist"
  }
}
```

---

## Success Indicators

When deployment succeeds, you'll see:

```
✨ Deployment complete! Take a deep breath, smile, and relax.
🌎 Your site is live at: https://webapp-xxx.pages.dev
```

Then test:
```bash
curl https://your-url.pages.dev/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

**Still having issues?** Check the full deployment guide in `CLOUDFLARE_DEPLOY.md` or create an issue on GitHub.
