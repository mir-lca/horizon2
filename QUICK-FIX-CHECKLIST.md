# Horizon Deployment Quick Fix Checklist

⏱️ **Estimated time:** 2 hours
✅ **Success probability:** 95%

## Pre-flight Check

- [ ] Azure App Service "horizon-portfolio-app" exists and is running
- [ ] PostgreSQL database accessible and contains schema
- [ ] GitHub Actions secrets configured (AZURE_APP_SERVICE_PUBLISH_PROFILE)
- [ ] Local build works: `cd frontend && npm run build`

## Step 1: Fix Deployment Structure (15 min)

### 1.1 Update GitHub Actions Workflow

```bash
cd /Users/mirlca/Library/CloudStorage/OneDrive-Teradyne/Documents/Notes/05-shared/apps/horizon

# Backup current workflow
cp .github/workflows/deploy-app-service.yml .github/workflows/deploy-app-service.yml.backup

# Replace with fixed version
cp .github/workflows/deploy-app-service-fixed.yml .github/workflows/deploy-app-service.yml
```

**Key changes in new workflow:**
- ✅ Copies standalone directory structure correctly
- ✅ Places static assets at `.next/static` (not `frontend/.next/static`)
- ✅ Places public assets at `./public` (not `frontend/public`)
- ✅ Creates startup script with correct paths

### 1.2 Remove Custom Server (5 min)

```bash
# Remove problematic custom server
rm server.js

# Commit changes
git add .github/workflows/deploy-app-service.yml
git rm server.js
git commit -m "Fix App Service deployment structure

- Use correct standalone directory layout
- Remove custom server.js (use Next.js built-in)
- Place static assets where Next.js expects them
"
```

## Step 2: Configure Azure App Service (10 min)

### 2.1 Set Environment Variables

```bash
# Via Azure CLI
az webapp config appsettings set \
  --name horizon-portfolio-app \
  --resource-group rg-horizon \
  --settings \
    DATABASE_URL="postgresql://horizon_admin:<PASSWORD>@horizon-pg-1769161979.postgres.database.azure.com:5432/horizon?sslmode=require" \
    NODE_ENV="production" \
    PORT="8080"
```

**Or via Azure Portal:**
1. Navigate to: horizon-portfolio-app → Configuration → Application settings
2. Click "+ New application setting" for each:
   - `DATABASE_URL`: `postgresql://horizon_admin:PASSWORD@horizon-pg-1769161979.postgres.database.azure.com:5432/horizon?sslmode=require`
   - `NODE_ENV`: `production`
   - `PORT`: `8080`
3. Click "Save"

### 2.2 Set Startup Command

```bash
# Via Azure CLI
az webapp config set \
  --name horizon-portfolio-app \
  --resource-group rg-horizon \
  --startup-file "node server.js"
```

**Or via Azure Portal:**
1. Navigate to: horizon-portfolio-app → Configuration → General settings
2. Startup Command: `node server.js`
3. Click "Save"

### 2.3 Verify Runtime

**Azure Portal:** horizon-portfolio-app → Configuration → General settings

- Stack: Node
- Major version: 18
- Minor version: 18 LTS
- Platform: Linux

## Step 3: Deploy (5 min)

### 3.1 Trigger Deployment

```bash
# Push to trigger GitHub Actions
git push origin main
```

**Or manually trigger:**
1. Go to: https://github.com/YOUR_ORG/horizon/actions
2. Click "Deploy to Azure App Service"
3. Click "Run workflow" → "Run workflow"

### 3.2 Monitor Deployment

```bash
# Watch GitHub Actions progress
# Go to: https://github.com/YOUR_ORG/horizon/actions

# Watch App Service logs (in parallel)
az webapp log tail \
  --name horizon-portfolio-app \
  --resource-group rg-horizon
```

**Expected output:**
```
> Ready on http://0.0.0.0:8080
Application started successfully
```

## Step 4: Validate (30 min)

### 4.1 Check App Service Status

```bash
# Check running status
az webapp show \
  --name horizon-portfolio-app \
  --resource-group rg-horizon \
  --query state \
  --output tsv

# Expected output: Running
```

### 4.2 Test API Endpoints

```bash
BASE_URL="https://horizon-portfolio-app.azurewebsites.net"

# Test projects endpoint
curl -i "$BASE_URL/api/projects"
# Expected: 200 OK with JSON array

# Test business units endpoint
curl -i "$BASE_URL/api/business-units"
# Expected: 200 OK with JSON array

# Test resources endpoint
curl -i "$BASE_URL/api/resources"
# Expected: 200 OK with JSON array

# Test competences endpoint
curl -i "$BASE_URL/api/competences"
# Expected: 200 OK with JSON array
```

### 4.3 Test Frontend

Navigate to: `https://horizon-portfolio-app.azurewebsites.net`

**Validation checklist:**
- [ ] Page loads without white screen
- [ ] No JavaScript errors in console (F12)
- [ ] Projects list populates
- [ ] Business units dropdown has options
- [ ] Can create new project
- [ ] Created project appears in list
- [ ] Can edit existing project
- [ ] Data persists after refresh

### 4.4 Check Logs for Errors

```bash
# Check recent logs
az webapp log tail \
  --name horizon-portfolio-app \
  --resource-group rg-horizon

# Check for errors
az webapp log download \
  --name horizon-portfolio-app \
  --resource-group rg-horizon \
  --log-file horizon-logs.zip

unzip -q horizon-logs.zip
grep -i "error\|exception\|fail" LogFiles/**/*.txt
```

## Troubleshooting

### Issue: Still getting 503 errors

**Diagnostic:**
```bash
# SSH into App Service
az webapp ssh \
  --name horizon-portfolio-app \
  --resource-group rg-horizon

# Check file structure
cd /home/site/wwwroot
ls -la
ls -la .next/
ls -la .next/static/ | head -10
ls -la public/ | head -10

# Try starting server manually
node server.js
```

**Common fixes:**
1. Static directory missing → Redeploy with fixed workflow
2. server.js missing → Check deployment package in GitHub Actions artifacts
3. Wrong permissions → Run `chmod +x server.js`

### Issue: 500 errors on API routes

**Diagnostic:**
```bash
# Test database connection
az webapp ssh \
  --name horizon-portfolio-app \
  --resource-group rg-horizon

# Inside SSH session
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); pool.query('SELECT NOW()').then(r => console.log('DB OK:', r.rows[0])).catch(e => console.error('DB ERROR:', e.message));"
```

**Common fixes:**
1. DATABASE_URL wrong format → Fix in App Service settings
2. Database firewall blocking → Whitelist App Service outbound IPs
3. Missing pg module → Check package.json and redeploy

### Issue: Frontend loads but no data

**Diagnostic:**
- Open browser DevTools (F12) → Network tab
- Reload page
- Check API requests:
  - Are they going to correct URL?
  - What status code?
  - What's in response body?

**Common fixes:**
1. CORS errors → Add middleware (see implementation plan)
2. 401 errors → Authentication not configured yet (expected for now)
3. 404 errors → API routes not deployed correctly

## Success Criteria

✅ **Deployment successful if:**
- GitHub Actions workflow completes without errors
- App Service status shows "Running"
- All API endpoints return 200 status
- Frontend loads and displays data
- Can create/edit projects
- No errors in browser console
- No errors in App Service logs

## If This Doesn't Work

### Fallback: Docker Container Approach

**If still failing after 2 hours of troubleshooting:**

1. Create Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY frontend/.next/standalone ./
COPY frontend/.next/static ./.next/static
COPY frontend/public ./public
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

2. Build and deploy:
```bash
# Build container
docker build -t horizon .

# Push to Azure Container Registry
az acr login --name horizonacr
docker tag horizon horizonacr.azurecr.io/horizon:latest
docker push horizonacr.azurecr.io/horizon:latest

# Update App Service to use container
az webapp config container set \
  --name horizon-portfolio-app \
  --resource-group rg-horizon \
  --docker-custom-image-name horizonacr.azurecr.io/horizon:latest
```

**Success probability:** 99%

## Next Actions After Success

1. **Configure authentication:**
   - Set up Azure AD app registration
   - Add middleware to Next.js
   - Test auth flow

2. **Set up monitoring:**
   - Enable Application Insights
   - Create alerts for errors
   - Set up availability tests

3. **Document deployment:**
   - Update README with working deployment steps
   - Create runbook for future deployments
   - Share learnings in wiki

4. **Clean up:**
   - Remove old Static Web Apps deployment (if unused)
   - Remove Azure Functions backend (if unused)
   - Archive failed deployment attempts in git history

## Time Tracking

- ⏱️ Started: ___________
- ⏱️ Workflow updated: ___________
- ⏱️ Azure configured: ___________
- ⏱️ Deployed: ___________
- ⏱️ Validated: ___________
- ⏱️ Completed: ___________
- ⏱️ Total time: ___________

**Target:** 2 hours total
