---
created: 2026-01-23
jira: ""
parent: ""
parent_key: ""
type: implementation-plan
tags: [horizon, plan]
---

# Horizon implementation plan

## Scope

Concise program and initiative dashboard with:
- Main dashboard (toggles, IRR/cost time series, resource gaps)
- Program/initiative management
- Resource allocation heatmap (quarterly by expertise)
- Financial impact heatmap (quarterly by initiative)

## Accomplished

### Use cases and stack
- Captured core user flows and required calculations
- Confirmed stack: React + Vite + TypeScript, Azure Static Web Apps auth, Azure Functions (Python), PostgreSQL
- Set weekly refresh cadence (Graph sync deferred)

### App scaffold
- Created `05-shared/apps/horizon/` with frontend and backend scaffolding
- Implemented static UI shell with tabs and forms
- Added SWA auth config (`/.auth/me`) consistent with `ai-adoption-dashboard`

### Backend wiring
- Implemented Functions endpoints:
  - `GET/POST /api/programs`
  - `PUT/DELETE /api/programs/{id}`
  - `GET/POST /api/initiatives`
  - `PUT/DELETE /api/initiatives/{id}`
  - `GET /api/resource-gaps`
  - `GET /api/financial-impact`
- Added PostgreSQL helper and schema file

### Azure provisioning
- Resource group `rg-horizon` (eastus2)
- PostgreSQL server `horizon-pg-1769161979` with database `horizon`
- Storage account `horizon1769161979`
- Function App `horizon-func-1769161979` with `POSTGRES_CONNECTION_STRING` set
- Firewall rule added for current IP (DB access)

### Database initialization
- Applied `infrastructure/schema.sql` to the `horizon` database
- Validated Function App connectivity (health + programs endpoint)
- Seeded sample program + initiative + quarterly resource/financial data

### Deployment
- Published Functions code via Core Tools to `horizon-func-1769161979`
- Deployed frontend to Static Web App `horizon-web-1769161979`
- Wired frontend API base to Functions endpoint
- Redeployed frontend with charts, heatmaps, and edit/delete actions
- Upgraded Static Web App to Standard tier for custom OIDC
- Applied AAD client ID/secret app settings
- Confirmed SWA hostname `orange-bay-0af72c00f.2.azurestaticapps.net`
- Documented deployment URLs in README
- Republished Functions after PIM enablement; verified `/api/*` endpoints return 200

## Remaining work

### Database initialization
- Seed data in place

### Backend polish
- Added input validation for initiatives/programs
- Added calculations endpoint (timeline, cash flow, IRR, cost distribution)
- Added query filters for toggled initiatives (`initiativeIds`)
- Added audit logging for program/initiative changes

### Frontend integration
- Replaced placeholder summaries with live aggregation
- Wired IRR/cost/cash flow table to API
- Implemented heatmap rendering with metric selector
- Added edit/delete flows in Programs view
- Added filtered API refresh on toggle and create/update
- Added business case summary (timeline + cost distribution) via calculations endpoint
- Added audit headers for writes
- Reused shared user menu widget and wiki theme toggle (styles + behavior)

### Deployment
- Custom domain not required

### Future
- Define and implement Graph sync cache strategy
- Add audit logging and admin controls
