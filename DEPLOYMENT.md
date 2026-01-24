# Horizon Deployment Guide

Concise steps to deploy the Horizon Static Web App + Azure Functions + PostgreSQL stack,
plus a troubleshooting section covering the recurring issues we already solved.

## Prerequisites
- Azure CLI authenticated (`az login`)
- Active subscription set (`az account set -s <subscription-id>`)
- Azure Functions Core Tools installed
- Python 3.11 available locally (Functions runtime)
- PostgreSQL client tools (`psql`) if you need to apply schema manually

## Known Deployment Inputs (Current Environment)
Use these values if you are redeploying the existing Horizon environment.

- Subscription ID: `fbc14e76-650e-4485-b7a7-ed52038aee03`
- Resource group: `rg-horizon`
- Postgres server: `horizon-pg-1769161979`
- Database: `horizon`
- Storage account: `horizon1769161979`
- Function App: `horizon-func-1769161979`
- Static Web App: `horizon-web-1769161979`
- SWA hostname: `https://orange-bay-0af72c00f.2.azurestaticapps.net`
- Redirect URI: `https://orange-bay-0af72c00f.2.azurestaticapps.net/.auth/login/teradyne/callback`

## Deployment Overview
1. Create or confirm Azure resources (resource group, Postgres, storage, Function App, Static Web App)
2. Configure app settings (Postgres connection string, AAD client ID/secret)
3. Deploy Functions (Python)
4. Deploy frontend (Static Web App)
5. Validate endpoints

## Resource Setup (Azure CLI)
Replace values where appropriate.

### 1) Resource group
```bash
az group create --name rg-horizon --location eastus2
```

### 2) PostgreSQL flexible server + DB
```bash
az postgres flexible-server create \
  --resource-group rg-horizon \
  --name horizon-pg-<suffix> \
  --location eastus2 \
  --admin-user horizon_admin \
  --admin-password <SECURE_PASSWORD> \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 32 \
  --version 15 \
  --public-access 0.0.0.0

az postgres flexible-server db create \
  --resource-group rg-horizon \
  --server-name horizon-pg-<suffix> \
  --database-name horizon
```

### 3) Storage + Function App
```bash
az storage account create \
  --name horizon<suffix> \
  --resource-group rg-horizon \
  --location eastus2 \
  --sku Standard_LRS

az functionapp create \
  --resource-group rg-horizon \
  --name horizon-func-<suffix> \
  --storage-account horizon<suffix> \
  --consumption-plan-location eastus2 \
  --runtime python \
  --runtime-version 3.11 \
  --functions-version 4 \
  --os-type Linux
```

### 4) Static Web App
```bash
az staticwebapp create \
  --name horizon-web-<suffix> \
  --resource-group rg-horizon \
  --location eastus2 \
  --sku Standard
```

## Configuration

### Function App settings
```bash
az functionapp config appsettings set \
  --name horizon-func-1769161979 \
  --resource-group rg-horizon \
  --settings \
    POSTGRES_CONNECTION_STRING="postgresql://horizon_admin:<password>@horizon-pg-1769161979.postgres.database.azure.com:5432/horizon?sslmode=require"
```

### Database schema
Apply the schema on first deploy or when tables change.
```bash
psql -h horizon-pg-1769161979.postgres.database.azure.com \
  -U horizon_admin \
  -d horizon \
  -f infrastructure/schema.sql
```

### Static Web App auth settings
The frontend uses `staticwebapp.config.json` with custom OIDC (AAD) matching the
`ai-adoption-dashboard` approach.

Ensure the app registration has redirect URI:
```
https://orange-bay-0af72c00f.2.azurestaticapps.net/.auth/login/teradyne/callback
```

Set AAD app settings in the Static Web App:
- `AAD_CLIENT_ID`
- `AAD_CLIENT_SECRET`

## Deploy Functions
From `05-shared/apps/horizon/backend`:
```bash
func azure functionapp publish horizon-func-1769161979 --python
```

## Deploy Frontend
Frontend is now a Next.js app in `frontend/`.
```bash
cd frontend
npm install
npm run build
```

Make sure the frontend points to the Functions API correctly:
- Preferred: use `/api` so SWA proxies to the Function App
- If using direct Functions URL, ensure CORS allows the SWA hostname

## Validate Deployment
```bash
curl https://horizon-func-1769161979.azurewebsites.net/api/health
curl https://horizon-func-1769161979.azurewebsites.net/api/programs
```

Open the Static Web App URL and confirm:
- Programs/initiatives list loads
- Heatmaps render
- Business case summary populates
- Create initiative works without errors

## Troubleshooting (Known Issues)

### 1) 404 from Functions endpoints
**Symptom:** `/api/*` returns 404  
**Cause:** Functions app not published or triggers not synced.  
**Fix:** Re-run publish:
```bash
func azure functionapp publish horizon-func-1769161979 --python
```

### 2) 400 login not supported for provider `azureStaticWebApps`
**Symptom:** API calls return 400 with `Login not supported for provider azureStaticWebApps`  
**Cause:** App Service Auth (EasyAuth) enabled on Function App (should be disabled).  
**Fix:** Disable auth on the Function App or allow anonymous.  
Preferred: keep auth only at SWA and call Functions via `/api`.

### 3) CORS errors (Access-Control-Allow-Origin / Credentials)
**Symptom:** Browser console shows CORS errors against the Functions URL.  
**Cause:** Frontend using direct Functions URL without proper CORS headers.  
**Fix:** Use `/api` (SWA-managed) instead of direct Functions URL.

### 4) 500 when creating initiatives (`can't adapt type 'UUID'`)
**Symptom:** POST `/api/initiatives` returns 500; other endpoints may follow.  
**Cause:** Psycopg2 UUID adapter not registered.  
**Fix:** Ensure `register_uuid()` is called in `backend/shared/database.py`,
then republish the Function App.

### 5) Publish hangs / fails due to PIM
**Symptom:** Publish or resource ops hang or fail.  
**Cause:** PIM not enabled or subscription not set.  
**Fix:** Enable PIM and set subscription:
```bash
az account set -s fbc14e76-650e-4485-b7a7-ed52038aee03
func azure functionapp publish horizon-func-1769161979 --python
```

## Notes
- Keep the Functions runtime at Python 3.11 to match Azure.
- If you update auth config, redeploy the Static Web App.
- If you change schema, apply `infrastructure/schema.sql` and redeploy Functions.

## Permissions + Command Access
These steps require networked CLI access and permissions to the subscription:
- `az` commands (resource creation/config)
- `func` publish commands (deploy Functions)
- `npm` install/build (frontend)
