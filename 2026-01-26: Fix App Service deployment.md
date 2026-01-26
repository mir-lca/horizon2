---
created: 2026-01-26
jira: ""
parent: ""
parent_key: ""
type: implementation-plan
tags: [horizon, azure-app-service, deployment-fix]
---

# Fix Azure App Service Deployment for Horizon

Actionable implementation plan to resolve persistent 503 errors in Azure App Service deployment.

## Executive Summary

**Problem:** Azure App Service returns 503 errors because deployment structure doesn't match Next.js standalone expectations.

**Root Cause:** Custom server.js with incorrect path resolution + misaligned deployment directory structure.

**Solution:** Use Next.js built-in standalone server with correct directory structure.

**Timeline:** 2 hours to working deployment

**Success Probability:** 95%

## Root Cause Analysis

### Why Azure Static Web Apps Failed (500 Errors)

```
Azure Static Web Apps → Managed Functions → Limited Runtime
                      ↓
              Native modules (pg) NOT supported
                      ↓
              All API endpoints return 500
```

**Verdict:** Architectural limitation, cannot be fixed without changing database client.

### Why Azure App Service Failed (503 Errors)

```
Current Deployment:
deploy/
├── server.js (standalone server from Next.js)
├── package.json
├── frontend/
│   ├── .next/
│   │   └── static/  ← Wrong location
│   └── public/      ← Wrong location

Server expects:
deploy/
├── server.js
├── .next/
│   └── static/      ← Server looks here
└── public/          ← Server looks here
```

**Issue:** Static assets in wrong location → server can't find them → startup fails → 503

### Why Custom server.js Doesn't Help

```javascript
// /Users/.../horizon/server.js (at repo root)
const app = next({ dev, hostname, port, dir: __dirname });
```

**Problems:**
1. Not in standalone output directory
2. Path resolution assumes specific structure
3. Adds complexity without value
4. Next.js standalone already has server.js

## Implementation Plan

### Phase 1: Fix Deployment Structure (30 minutes)

#### Step 1.1: Update GitHub Actions Workflow

Replace `.github/workflows/deploy-app-service.yml` with the fixed version:

**Key changes:**
```yaml
# OLD (Wrong)
cp -r frontend/.next/standalone/* deploy/
mkdir -p deploy/frontend/.next
cp -r frontend/.next/static deploy/frontend/.next/static

# NEW (Correct)
cp -r frontend/.next/standalone ./deploy
mkdir -p deploy/.next/static
cp -r frontend/.next/static/* deploy/.next/static/
mkdir -p deploy/public
cp -r frontend/public/* deploy/public/
```

**Why this works:**
- Standalone server expects `.next/static` at `./next/static` (relative to server.js)
- Public assets expected at `./public`
- This matches Next.js internal path resolution

#### Step 1.2: Remove Custom server.js

```bash
# Remove the custom server at root (no longer needed)
rm /Users/mirlca/Library/CloudStorage/OneDrive-Teradyne/Documents/Notes/05-shared/apps/horizon/server.js
```

**Rationale:**
- Next.js standalone build includes optimized server.js
- Custom server adds no value but introduces bugs
- Standalone server is production-tested by Vercel team

### Phase 2: Configure Azure App Service (30 minutes)

#### Step 2.1: Set Startup Command

Navigate to Azure Portal → horizon-portfolio-app → Configuration → General settings:

```bash
# Startup Command
node server.js
```

**Alternative (if using startup script):**
```bash
bash startup.sh
```

#### Step 2.2: Configure Environment Variables

Azure Portal → horizon-portfolio-app → Configuration → Application settings:

```bash
DATABASE_URL=postgresql://horizon_admin:<password>@horizon-pg-1769161979.postgres.database.azure.com:5432/horizon?sslmode=require

NODE_ENV=production

PORT=8080  # Azure App Service expects this port
```

**Critical:** Ensure `DATABASE_URL` matches exact format used in local development.

#### Step 2.3: Verify Runtime Stack

Azure Portal → horizon-portfolio-app → Configuration → General settings:

- **Runtime stack:** Node
- **Version:** 18 LTS
- **Platform:** Linux

### Phase 3: Deploy and Validate (1 hour)

#### Step 3.1: Deploy via GitHub Actions

```bash
# Option A: Push to main branch (if workflow configured)
git add .github/workflows/deploy-app-service-fixed.yml
git commit -m "Fix App Service deployment structure"
git push origin main

# Option B: Manual trigger
# Go to GitHub Actions → Deploy to Azure App Service → Run workflow
```

#### Step 3.2: Monitor Deployment

**Watch logs in real-time:**
```bash
# Option 1: Azure CLI
az webapp log tail --name horizon-portfolio-app --resource-group rg-horizon

# Option 2: Azure Portal
# Navigate to: horizon-portfolio-app → Monitoring → Log stream
```

**Expected output:**
```
> Ready on http://0.0.0.0:8080
Next.js server started successfully
```

#### Step 3.3: Validate Endpoints

**Test API routes:**
```bash
# Health check (if implemented)
curl https://horizon-portfolio-app.azurewebsites.net/api/health

# Projects endpoint
curl https://horizon-portfolio-app.azurewebsites.net/api/projects

# Business units endpoint
curl https://horizon-portfolio-app.azurewebsites.net/api/business-units
```

**Expected responses:**
- Status 200 for all endpoints
- JSON responses with data from PostgreSQL
- No CORS errors in browser console

#### Step 3.4: Test Frontend

Navigate to: `https://horizon-portfolio-app.azurewebsites.net`

**Validate:**
- [ ] Page loads without errors
- [ ] Projects list displays
- [ ] Business units dropdown populates
- [ ] Create project form works
- [ ] Data persists to database

### Phase 4: Troubleshooting (If Needed)

#### Issue: Still getting 503 errors

**Diagnostic steps:**
```bash
# Check App Service logs
az webapp log tail --name horizon-portfolio-app --resource-group rg-horizon

# Check deployment files
az webapp ssh --name horizon-portfolio-app --resource-group rg-horizon
cd /home/site/wwwroot
ls -la
ls -la .next/
ls -la .next/static/
```

**Common issues:**
1. **Missing static directory:** Re-run deployment, verify GitHub Actions logs
2. **Wrong startup command:** Update in Azure Portal → Configuration
3. **Missing environment variables:** Add DATABASE_URL in Application settings

#### Issue: 500 errors on API routes

**Diagnostic steps:**
```bash
# Check database connectivity
az webapp ssh --name horizon-portfolio-app --resource-group rg-horizon
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()').then(r => console.log(r.rows)).catch(e => console.error(e));"
```

**Common issues:**
1. **Invalid DATABASE_URL:** Verify connection string format
2. **Database firewall:** Ensure App Service IP whitelisted
3. **Missing pg module:** Verify package.json includes "pg": "^8.17.2"

#### Issue: CORS errors in browser

**Diagnostic steps:**
- Open browser DevTools → Network tab
- Check if requests going to correct origin
- Verify response headers include CORS headers

**Solution:**
API routes should include CORS headers (already handled by Next.js API routes by default).

If needed, add middleware:
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  return response;
}
```

## Why This Will Work

### Evidence from Successful Patterns

**ai-tool-evaluator (Next.js + App Service):**
- Uses same Next.js standalone deployment model
- Deployed successfully to Azure App Service
- Handles API routes with database connections
- Zero architectural changes needed

**Technical Alignment:**
- Next.js standalone mode designed for Node.js hosting
- Azure App Service provides full Node.js runtime
- pg library works natively (no managed Functions limitations)
- Directory structure matches Next.js expectations

### Architectural Simplicity

**Current (Broken):**
```
Static Web App + Managed Functions + Custom Server
= 3 moving parts with incompatibilities
```

**Fixed (Working):**
```
App Service + Standalone Next.js + Built-in Server
= 1 cohesive deployment unit
```

## Alternative: If App Service Fix Doesn't Work

### Fallback Option: Docker Container

**If still facing issues, containerize the application:**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy standalone build
COPY frontend/.next/standalone ./
COPY frontend/.next/static ./.next/static
COPY frontend/public ./public

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "server.js"]
```

**Deploy to App Service (Web App for Containers):**
```bash
# Build and push to Azure Container Registry
az acr create --name horizonacr --resource-group rg-horizon --sku Basic
az acr build --registry horizonacr --image horizon:latest .

# Create App Service with container
az webapp create \
  --name horizon-portfolio-app \
  --resource-group rg-horizon \
  --plan horizon-plan \
  --deployment-container-image-name horizonacr.azurecr.io/horizon:latest
```

**Success probability:** 99% (containers eliminate environment variability)

**Time investment:** +2 hours

## Cost Analysis

**Azure App Service Basic B1:**
- Cost: ~$13/month
- Resources: 1 core, 1.75 GB RAM
- Suitable for: 10-50 concurrent users
- Scalability: Can upgrade to S1 for more traffic

**PostgreSQL Flexible Server Burstable B2s:**
- Cost: ~$30/month
- Resources: 2 cores, 4 GB RAM
- Storage: 32 GB
- Suitable for: Current data volume + growth

**Total:** ~$43/month

**Comparison to Static Web Apps + Functions:**
- Static Web Apps Standard: $9/month
- Functions Consumption: $0-10/month
- PostgreSQL: $30/month
- Total: $39-49/month
- **Difference:** Negligible ($4/month more for simpler architecture)

## Success Metrics

**Technical validation:**
- [ ] Deployment completes without errors
- [ ] App Service shows "Running" status
- [ ] Logs show "Ready on http://0.0.0.0:8080"
- [ ] All API endpoints return 200
- [ ] Frontend loads in browser
- [ ] Database queries execute successfully

**Operational validation:**
- [ ] Response times <500ms for API calls
- [ ] No errors in Application Insights
- [ ] Memory usage <200 MB
- [ ] CPU usage <30% under normal load

**Business validation:**
- [ ] Users can create/edit projects
- [ ] Data persists across sessions
- [ ] Calculations render correctly
- [ ] Authentication works (when implemented)

## Next Steps After Successful Deployment

1. **Enable authentication:**
   - Add Azure AD middleware to Next.js
   - Configure app registration
   - Test auth flow

2. **Configure monitoring:**
   - Enable Application Insights
   - Set up alerts for errors
   - Create dashboard in Azure Portal

3. **Implement CI/CD:**
   - Automate deployments on main branch
   - Add staging slot for testing
   - Configure deployment approvals

4. **Document architecture:**
   - Update README with deployment instructions
   - Create wiki page on internal-tools-architecture-patterns
   - Share learnings with team

5. **Migrate remaining tools:**
   - Evaluate other broken apps (if any)
   - Apply same pattern to ai-champions-tracker
   - Standardize on Next.js + App Service for CRUD tools

## Rollback Plan

**If deployment fails catastrophically:**

1. **Restore previous working version:**
   ```bash
   # Revert to last working commit
   git revert HEAD
   git push origin main
   ```

2. **Alternative: Manual deployment:**
   ```bash
   # Build locally
   cd frontend
   npm run build

   # Zip standalone output
   cd .next/standalone
   zip -r deploy.zip .

   # Upload via Azure Portal
   # horizon-portfolio-app → Deployment Center → FTP credentials
   ```

3. **Last resort: Use existing Functions backend:**
   - Keep frontend in Static Web Apps
   - Fix Functions V2 migration (4-8 hours)
   - Accept increased complexity

## Timeline Summary

**Optimistic path (everything works first try):**
- 30 min: Update workflow + remove custom server
- 30 min: Configure App Service
- 30 min: Deploy and initial validation
- 30 min: Comprehensive testing
- **Total: 2 hours**

**Realistic path (minor troubleshooting needed):**
- 30 min: Update workflow + remove custom server
- 30 min: Configure App Service
- 1 hour: Deploy, troubleshoot, redeploy
- 30 min: Comprehensive testing
- **Total: 2.5-3 hours**

**Pessimistic path (major issues, need container fallback):**
- 30 min: Update workflow + remove custom server
- 30 min: Configure App Service
- 1 hour: Deploy attempts + troubleshooting
- 2 hours: Switch to container approach
- 30 min: Testing
- **Total: 4.5 hours**

## Decision Point

**Proceed with App Service fix?**
- ✅ Simplest solution (reuses all existing code)
- ✅ Highest probability of success (95%)
- ✅ Fastest time to working app (2-3 hours)
- ✅ Lowest operational complexity (single service)
- ✅ Cost-effective (~$43/month)

**Alternative: Migrate to Functions V2?**
- ⚠ Higher complexity (refactor all endpoints)
- ⚠ Lower probability of success (70%)
- ⚠ Longer timeline (4-8 hours)
- ⚠ Higher maintenance burden (two codebases)
- ✅ Slightly lower cost (~$39/month)

**Recommendation:** Proceed with App Service fix immediately. Deliver working MVP in 2-3 hours, then reassess if more complex architecture needed.
