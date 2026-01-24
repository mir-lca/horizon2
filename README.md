# Horizon

Concise program and initiative dashboard focused on business case impact,
resource gaps, and quarterly heatmaps.

## Architecture

- Frontend: React + Vite + TypeScript
- Auth: Azure Static Web Apps auth via `/.auth/me`
- Backend: Azure Functions (Python)
- Data: PostgreSQL

## Use Cases

- Main dashboard with program/initiative toggles, IRR/cost time series, and headcount gaps
- Program/initiative CRUD with business case inputs
- Resource allocation heatmap by expertise (quarterly)
- Financial impact heatmap by initiative (quarterly)

## Status

Backend and frontend deployed with sample data.

## Deployment

- Static Web App: `https://orange-bay-0af72c00f.2.azurestaticapps.net`
- Functions API: `https://horizon-func-1769161979.azurewebsites.net/api`
- Redirect URI: `https://orange-bay-0af72c00f.2.azurestaticapps.net/.auth/login/teradyne/callback`

## Notes

- Static Web App tier: Standard (required for custom OIDC)
