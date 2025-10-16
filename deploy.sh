#!/bin/bash

# BTL Costing - Cloudflare Pages Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 BTL Costing - Cloudflare Pages Deployment"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found${NC}"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

echo -e "${GREEN}✅ Wrangler CLI found${NC}"

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Cloudflare${NC}"
    echo "Running: wrangler login"
    wrangler login
fi

echo -e "${GREEN}✅ Authenticated with Cloudflare${NC}"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 2: Build application
echo "🏗️  Step 2: Building application..."
npm run build
echo -e "${GREEN}✅ Application built${NC}"
echo ""

# Step 3: Check if database exists
echo "🗄️  Step 3: Checking database..."
DB_ID=$(grep -o '"database_id": "[^"]*"' wrangler.jsonc | cut -d'"' -f4)

if [ "$DB_ID" == "placeholder-will-be-updated-after-creation" ]; then
    echo -e "${YELLOW}⚠️  Database not configured${NC}"
    echo ""
    echo "Creating D1 database..."
    wrangler d1 create webapp-production
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Copy the database_id from above and update wrangler.jsonc${NC}"
    echo "Then run this script again."
    exit 1
fi

echo -e "${GREEN}✅ Database configured${NC}"
echo ""

# Step 4: Run migrations
echo "🔄 Step 4: Running database migrations..."
read -p "Apply migrations to production database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler d1 migrations apply webapp-production --remote
    echo -e "${GREEN}✅ Migrations applied${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped migrations${NC}"
fi
echo ""

# Step 5: Seed database (optional)
echo "🌱 Step 5: Seed database with sample data?"
read -p "Seed database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler d1 execute webapp-production --remote --file=./seed.sql
    echo -e "${GREEN}✅ Database seeded${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped seeding${NC}"
fi
echo ""

# Step 6: Deploy
echo "🚀 Step 6: Deploying to Cloudflare Pages..."
PROJECT_NAME=${1:-webapp}

# Check if project exists
if ! wrangler pages project list | grep -q "$PROJECT_NAME"; then
    echo "Creating Pages project: $PROJECT_NAME"
    wrangler pages project create "$PROJECT_NAME" --production-branch=main
fi

# Deploy
wrangler pages deploy dist --project-name="$PROJECT_NAME"

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""

# Step 7: Set JWT secret if not exists
echo "🔐 Step 7: Checking JWT secret..."
if ! wrangler pages secret list --project-name="$PROJECT_NAME" 2>/dev/null | grep -q "JWT_SECRET"; then
    echo "Generating and setting JWT_SECRET..."
    JWT_SECRET=$(openssl rand -base64 32)
    echo "$JWT_SECRET" | wrangler pages secret put JWT_SECRET --project-name="$PROJECT_NAME"
    echo -e "${GREEN}✅ JWT_SECRET set${NC}"
else
    echo -e "${GREEN}✅ JWT_SECRET already configured${NC}"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo ""
echo "Your application is live!"
echo ""
echo "Next steps:"
echo "  1. Visit your Pages dashboard: https://dash.cloudflare.com"
echo "  2. Find your URL (usually: https://$PROJECT_NAME.pages.dev)"
echo "  3. Login with: admin@btlcosting.com / admin123"
echo "  4. ⚠️  CHANGE THE ADMIN PASSWORD IMMEDIATELY!"
echo ""
echo "To update your app:"
echo "  git add ."
echo "  git commit -m 'Update description'"
echo "  git push origin main"
echo "  ./deploy.sh"
echo ""
echo "For more details, see CLOUDFLARE_DEPLOY.md"
echo "=============================================="
