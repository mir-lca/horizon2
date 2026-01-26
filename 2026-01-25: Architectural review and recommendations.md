---
created: 2026-01-25
jira: ""
parent: ""
parent_key: ""
type: analysis
tags: [horizon, architecture, azure-functions, strategic-review]
---

# Horizon Architectural Review and Recommendations

Comprehensive analysis of current architecture, root cause of deployment failures, and strategic recommendations for path forward.

## Executive Summary

**Recommendation: Pivot immediately to Next.js API Routes architecture**

The Azure Functions v2 Python model is fundamentally incompatible with the v1 programming model code currently deployed. After hours of troubleshooting, the root cause is clear: architectural mismatch, not operational issues. The fastest path to a working MVP is consolidating to a single Next.js deployment.

**Timeline Impact:**
- Continue with Azure Functions: 4-8 more hours of migration work, uncertain outcome
- Pivot to Next.js API Routes: 2-3 hours to working MVP

**Strategic Alignment:**
- Matches successful pattern from ai-tool-evaluator
- Reduces operational complexity (single deployment unit)
- Eliminates cross-origin issues inherent in split architecture
- Faster iteration cycles for future internal tools

## Root Cause Analysis

### The Azure Functions V2 Programming Model Mismatch

**What You Have:**
```python
# backend/programs/__init__.py (V1 Programming Model)
import azure.functions as func
from shared.api import programs

def main(req: func.HttpRequest) -> func.HttpResponse:
    return programs(req)
```

**What Azure Functions V2 Expects:**
```python
# function_app.py (V2 Programming Model - see ai-adoption-dashboard)
import azure.functions as func

app = func.FunctionApp()

@app.route(route="programs", methods=["GET", "POST"])
def programs(req: func.HttpRequest) -> func.HttpResponse:
    # Handler code here
    pass
```

**The Problem:**
- Your `host.json` declares Functions V2 runtime: `"version": "2.0"`
- Your code uses V1 programming model (individual `__init__.py` files per function)
- V2 runtime expects a single `function_app.py` with decorator-based registration
- V2 runtime ignores individual function folders entirely
- Python worker never initializes because it can't find valid V2 function definitions

**Why This Happens:**
Azure Functions V2 for Python introduced a completely new programming model in 2023. The migration path is non-trivial:
1. All functions must move to single `function_app.py`
2. Individual function folders become obsolete
3. Decorators replace `function.json` binding configuration
4. Shared code patterns change significantly

**Evidence:**
- Empty 500 responses indicate Python worker never starts
- No Application Insights logs suggests worker initialization failure
- Even minimal test functions fail (same root cause)
- Working locally but failing in Azure is classic V1/V2 mismatch symptom

### Why ai-adoption-dashboard Works

The ai-adoption-dashboard uses proper V2 programming model:

```python
# backend/function_app.py
app = func.FunctionApp()

@app.route(route="overview")
def api_overview(req: func.HttpRequest) -> func.HttpResponse:
    # Implementation
    pass

@app.schedule(schedule="0 0 6 * * 0")
def weekly_refresh(timer: func.TimerRequest) -> None:
    # Implementation
    pass
```

This is why it deploys successfully and runs reliably.

## Architectural Comparison: Your Ecosystem

### Current Successful Patterns

**Pattern 1: Next.js with API Routes (ai-tool-evaluator)**
```
Architecture:
- Frontend: Next.js 15 (App Router)
- Backend: Next.js API Routes (same codebase)
- Database: Azure Cosmos DB
- Deployment: Single Azure App Service
- Authentication: Azure AD via middleware

Benefits:
✓ Single deployment unit
✓ No CORS issues
✓ Fast iteration cycles
✓ TypeScript end-to-end
✓ Simplified debugging
✓ Cost-effective at scale
```

**Pattern 2: Static Site + Azure Functions V2 (ai-adoption-dashboard)**
```
Architecture:
- Frontend: React + Vite (static build)
- Backend: Azure Functions V2 Python (function_app.py)
- Database: PostgreSQL
- Deployment: Static Web App + Function App
- Authentication: Azure AD via SWA

Benefits:
✓ Separation of concerns
✓ Independent scaling
✓ Python for data processing
✓ Proven pattern for data pipelines
⚠ More complex deployment
⚠ CORS configuration required
⚠ Two codebases to maintain
```

**Pattern 3: Pure Static (wiki)**
```
Architecture:
- Frontend: Vanilla HTML/CSS/JS
- Backend: None (static content)
- Deployment: Azure Static Web Apps
- Authentication: Azure AD via SWA

Benefits:
✓ Maximum simplicity
✓ Zero operational overhead
✓ Fast performance
✓ Minimal cost
⚠ Limited to static content
```

### Horizon's Failed Pattern

**Pattern: Next.js + Azure Functions V1 (current)**
```
Architecture:
- Frontend: Next.js 15 (App Router)
- Backend: Azure Functions V1 Python (individual functions)
- Database: PostgreSQL
- Deployment: Static Web App + Function App
- Authentication: Azure AD via SWA (planned)

Issues:
✗ V1 code on V2 runtime
✗ No working deployment after multiple attempts
✗ Split architecture adds complexity
✗ CORS configuration challenges
✗ Two codebases to maintain
✗ Inconsistent with successful patterns
```

## Strategic Architecture Options

### Option 1: Next.js API Routes (RECOMMENDED)

**Architecture:**
```
horizon/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── programs/route.ts
│   │   │   ├── initiatives/route.ts
│   │   │   ├── resource-gaps/route.ts
│   │   │   └── financial-impact/route.ts
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── db.ts (PostgreSQL client)
│   │   └── auth.ts (Azure AD middleware)
│   └── components/
├── package.json
└── next.config.js

Deployment: Single Azure App Service (Web App for Containers)
```

**Advantages:**
- Matches proven ai-tool-evaluator pattern
- Single deployment artifact
- TypeScript end-to-end (type safety across frontend/backend)
- No CORS issues
- Simplified debugging (single process)
- Fast local development (single `npm run dev`)
- Built-in API route caching
- Server-side rendering available if needed
- Cost-effective at low scale

**Disadvantages:**
- Node.js instead of Python (migration required)
- PostgreSQL client in TypeScript (use `pg` or `prisma`)
- Less suitable for heavy data processing tasks
- Slightly higher memory footprint than static site

**Migration Effort:** 2-3 hours
1. Create `/src/app/api/programs/route.ts` (30 min)
2. Port database logic to TypeScript (60 min)
3. Test locally (30 min)
4. Deploy to Azure App Service (30 min)
5. Configure authentication (30 min)

**Best For:**
- CRUD applications
- Dashboard applications
- Internal tools with <100 concurrent users
- Rapid iteration requirements
- Single developer maintenance

**Cost Estimate:**
- Azure App Service Basic B1: ~$13/month
- PostgreSQL Flexible Server Burstable B2s: ~$30/month
- Total: ~$43/month

### Option 2: Azure Functions V2 Migration (NOT RECOMMENDED)

**Architecture:**
```
horizon/
├── frontend/ (Next.js)
├── backend/
│   ├── function_app.py (REQUIRED - new file)
│   ├── shared/
│   │   ├── database.py
│   │   └── api.py
│   ├── requirements.txt
│   └── host.json
├── .github/workflows/
└── infrastructure/

Deployment: Static Web App + Function App (current)
```

**Migration Required:**
1. Create `function_app.py` with decorator-based registration
2. Migrate all 18 functions to new model
3. Test each function individually
4. Update GitHub Actions workflow
5. Reconfigure Application Insights
6. Debug deployment issues

**Advantages:**
- Keeps Python for backend
- Independent frontend/backend scaling
- Familiar pattern from ai-adoption-dashboard

**Disadvantages:**
- Significant migration effort (4-8 hours)
- Uncertain outcome (V2 migration can reveal new issues)
- Two codebases to maintain
- CORS configuration complexity
- Slower iteration cycles
- Higher cognitive overhead

**Migration Effort:** 4-8 hours
1. Create function_app.py with all decorators (2 hours)
2. Test each endpoint migration (2 hours)
3. Debug deployment issues (2-4 hours)
4. Update CI/CD (1 hour)

**Best For:**
- Heavy Python data processing workload
- Existing large Python codebase
- Team with Python expertise
- Independent scaling requirements

**Cost Estimate:**
- Azure Functions Consumption: ~$0-10/month (low traffic)
- Static Web App Standard: ~$9/month
- PostgreSQL Flexible Server: ~$30/month
- Total: ~$39-49/month

### Option 3: Containerized App Service

**Architecture:**
```
horizon/
├── Dockerfile (Next.js standalone build)
├── src/ (Next.js with API routes)
├── package.json
└── azure-pipelines.yml

Deployment: Azure App Service (Web App for Containers)
```

**Advantages:**
- Full control over runtime environment
- Can include system dependencies
- Easy local development (Docker)
- Production parity
- Flexible scaling options

**Disadvantages:**
- Container registry required (~$5/month)
- More complex deployment pipeline
- Longer build times
- Container management overhead

**Best For:**
- Complex runtime requirements
- System-level dependencies
- Microservices architecture
- Teams comfortable with containers

**Cost Estimate:**
- Azure Container Registry Basic: ~$5/month
- Azure App Service Basic B1: ~$13/month
- PostgreSQL Flexible Server: ~$30/month
- Total: ~$48/month

### Option 4: Hybrid (Next.js + Background Jobs)

**Architecture:**
```
horizon-web/ (Next.js with API routes)
background-jobs/ (Azure Functions V2 for scheduled tasks)

Deployment: App Service + Function App
```

**Use Case:**
- Real-time CRUD via Next.js API Routes
- Scheduled data sync via Azure Functions
- Heavy processing offloaded to Functions

**When to Consider:**
- Need for async processing
- Scheduled data pipelines
- Long-running operations
- Graph API sync requirements (future)

**Best For:**
- Applications with mixed workloads
- Real-time UI + batch processing
- Future extensibility requirements

## Consistency Analysis: Pattern Establishment

### Current Ecosystem Patterns

**Internal Tools Inventory:**
1. **wiki** - Pure static (HTML/CSS/JS)
2. **ai-adoption-dashboard** - React + Azure Functions V2 Python
3. **ai-tool-evaluator** - Next.js with API Routes
4. **floorplan** - Pattern unknown (needs investigation)
5. **ai-champions-tracker** - Pattern unknown (needs investigation)
6. **horizon** - Currently broken (V1 Functions code on V2 runtime)

### Pattern Decision Framework

**Choose Pure Static When:**
- No backend logic required
- Content-focused application
- Read-only data
- Maximum simplicity needed
- Example: wiki, documentation sites

**Choose Next.js with API Routes When:**
- CRUD operations required
- Dashboard/admin interface
- <100 concurrent users
- Single developer maintenance
- Rapid iteration priority
- TypeScript preferred
- Example: ai-tool-evaluator, horizon (recommended)

**Choose React + Azure Functions V2 When:**
- Heavy Python data processing
- Scheduled background jobs
- Complex data pipelines
- Team Python expertise
- Independent scaling needs
- Example: ai-adoption-dashboard

### Recommended Standard Pattern

**For Future Internal Tools:**
1. **Default: Next.js with API Routes**
   - Single deployment unit
   - Fast development velocity
   - TypeScript end-to-end
   - Built-in auth middleware
   - Cost-effective

2. **Alternative: React + Functions V2 only if:**
   - Existing Python codebase
   - Heavy data processing workload
   - Scheduled jobs required
   - Team Python expertise

3. **Upgrade Path:**
   - Start with Next.js API Routes
   - Add background Functions later if needed
   - Proven migration path (Option 4)

## Trade-Off Analysis

### Development Velocity vs Operational Complexity

**Next.js API Routes (Option 1):**
```
Development Velocity: ★★★★★
- Single codebase
- Hot reload for frontend + backend
- Integrated debugging
- Fast iteration cycles

Operational Complexity: ★☆☆☆☆
- Single deployment
- One monitoring dashboard
- Unified logging
- Simple troubleshooting

Time to MVP: 2-3 hours
```

**Azure Functions V2 (Option 2):**
```
Development Velocity: ★★★☆☆
- Two codebases
- Separate deployments
- CORS configuration
- More moving parts

Operational Complexity: ★★★☆☆
- Two monitoring dashboards
- Function App + Static Web App
- CORS troubleshooting
- Split debugging

Time to MVP: 4-8 hours (uncertain)
```

### Cost vs Simplicity vs Scalability

**Option 1: Next.js API Routes**
- Cost: ~$43/month (App Service + PostgreSQL)
- Simplicity: ★★★★★ (single deployment)
- Scalability: Up to ~1000 concurrent users (B1/S1 tier)
- Best for: 10-50 users (current requirement)

**Option 2: Azure Functions V2**
- Cost: ~$39-49/month (Functions + Static Web App + PostgreSQL)
- Simplicity: ★★☆☆☆ (multiple services)
- Scalability: Elastic (consumption plan)
- Best for: Unpredictable traffic, background jobs

**Option 3: Containers**
- Cost: ~$48/month (Container Registry + App Service + PostgreSQL)
- Simplicity: ★★★☆☆ (container management)
- Scalability: Flexible (easy to upgrade tier)
- Best for: Complex dependencies, microservices

### Time-to-Market vs Long-Term Maintainability

**Next.js API Routes:**
```
Time to Working MVP: 2-3 hours ✓
Time to Production: 4-6 hours ✓
Maintenance Burden: Low
  - Single codebase
  - Familiar TypeScript
  - Standard Next.js patterns
  - Easy onboarding for new developers

Long-term Extensibility: Good
  - Can add background jobs later
  - Can migrate to microservices
  - Proven upgrade paths
```

**Azure Functions V2:**
```
Time to Working MVP: 4-8 hours ⚠
Time to Production: 8-12 hours ⚠
Maintenance Burden: Medium
  - Two codebases
  - CORS configuration
  - Functions expertise required
  - Split debugging

Long-term Extensibility: Excellent
  - Native background job support
  - Independent scaling
  - Microservices ready
```

### Flexibility vs Standardization

**High Flexibility (Option 2/3):**
- Pros: Can choose best language per component
- Cons: More cognitive overhead, harder to standardize
- Best for: Large teams with diverse expertise

**High Standardization (Option 1):**
- Pros: Consistent patterns, easy to replicate
- Cons: Less flexibility for specialized workloads
- Best for: Single developer, rapid tool development

## Detailed Recommendations

### Immediate Action: Pivot to Next.js API Routes

**Why Now:**
1. You've spent hours debugging Azure Functions V1/V2 mismatch
2. V2 migration is non-trivial and outcome uncertain
3. Next.js API Routes proven in ai-tool-evaluator
4. Horizon fits the Next.js pattern perfectly (CRUD dashboard)
5. Single deployment eliminates CORS and auth complexity

**Implementation Roadmap:**

**Phase 1: Core API Migration (2 hours)**
```typescript
// src/app/api/programs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (request: NextRequest) => {
  const db = getDatabase();
  const programs = await db.query('SELECT * FROM programs WHERE status = $1', ['active']);
  return NextResponse.json(programs);
});

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json();
  const db = getDatabase();
  // Insert logic
  return NextResponse.json({ success: true });
});
```

**Phase 2: Database Client (1 hour)**
```typescript
// src/lib/db.ts
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDatabase() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_CONNECTION_STRING,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}
```

**Phase 3: Authentication (1 hour)**
```typescript
// src/lib/auth.ts
import { NextRequest, NextResponse } from 'next/server';

export function withAuth(handler: Function) {
  return async (request: NextRequest) => {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(request, session);
  };
}
```

**Phase 4: Deployment (1 hour)**
```bash
# Build Next.js app
cd frontend
npm run build

# Deploy to Azure App Service
az webapp up \
  --name horizon-app \
  --resource-group rg-horizon \
  --runtime "NODE:18-lts" \
  --sku B1

# Configure environment
az webapp config appsettings set \
  --name horizon-app \
  --resource-group rg-horizon \
  --settings \
    POSTGRES_CONNECTION_STRING="..." \
    NEXTAUTH_SECRET="..." \
    AZURE_AD_CLIENT_ID="..." \
    AZURE_AD_CLIENT_SECRET="..."
```

**Phase 5: Validation (30 min)**
- Test CRUD operations
- Verify authentication flow
- Check dashboard rendering
- Validate calculations endpoints

**Total Time: 5-6 hours to production-ready application**

### Long-Term: Establish Standard Pattern

**Pattern Library for Internal Tools:**

**Template 1: Next.js Dashboard Template**
```
internal-tool-template/
├── src/
│   ├── app/
│   │   ├── api/ (API routes)
│   │   ├── (authenticated)/ (protected pages)
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   └── with-auth.ts
│   ├── components/
│   │   ├── ui/ (shadcn/ui)
│   │   └── shared/ (apps-nav-widget)
│   └── types/
├── package.json
├── .env.example
└── README.md
```

**When to Use:**
- CRUD operations
- Dashboard interfaces
- Admin panels
- Internal reporting tools
- Portfolio management tools

**Template 2: React + Functions Template**
```
data-pipeline-template/
├── frontend/ (React + Vite)
├── backend/ (Azure Functions V2 Python)
├── infrastructure/ (Terraform)
└── .github/workflows/
```

**When to Use:**
- Scheduled data sync
- Heavy Python processing
- Complex data transformations
- Integration with existing Python code

**Template 3: Hybrid Template**
```
hybrid-template/
├── web/ (Next.js with API routes)
├── jobs/ (Azure Functions V2 for background)
├── shared/ (types, schemas)
└── infrastructure/
```

**When to Use:**
- Real-time UI + batch processing
- Graph API sync + dashboard
- Mixed workload patterns

### Migration Path for Existing Tools

**ai-adoption-dashboard (keep as-is):**
- Already using Functions V2 correctly
- Proven stable pattern
- Heavy Python data processing
- Scheduled background jobs

**ai-tool-evaluator (keep as-is):**
- Already using Next.js API Routes
- Proven stable pattern
- Good reference implementation

**horizon (migrate to Next.js API Routes):**
- Current pattern broken
- Perfect fit for Next.js
- No background jobs needed
- Rapid development priority

**Future tools (default to Next.js API Routes):**
- Unless Python/background jobs required
- Faster development velocity
- Lower operational overhead
- Consistent with majority pattern

## Lessons Learned for Future Development

### 1. Architecture Selection Checklist

**Before starting a new internal tool, answer:**

- [ ] Is this primarily a dashboard/CRUD application?
  - Yes → Next.js API Routes
  - No → Continue assessment

- [ ] Do you need scheduled background jobs?
  - Yes → Azure Functions V2 (or add later)
  - No → Continue assessment

- [ ] Is the data processing workload heavy (>1 min per request)?
  - Yes → Azure Functions V2
  - No → Continue assessment

- [ ] Do you have existing Python code to integrate?
  - Yes → Azure Functions V2
  - No → Next.js API Routes

- [ ] Expected concurrent users?
  - <100 → Next.js API Routes (B1 tier)
  - 100-1000 → Next.js API Routes (S1 tier)
  - >1000 → Azure Functions (elastic scaling)

- [ ] Team expertise?
  - TypeScript → Next.js API Routes
  - Python → Azure Functions V2
  - Both → Next.js API Routes (default)

- [ ] Operational complexity tolerance?
  - Low → Next.js API Routes
  - Medium → Azure Functions V2
  - High → Microservices/Containers

### 2. Avoid These Anti-Patterns

**Don't:**
- Mix Azure Functions V1 and V2 programming models
- Deploy Functions without proper V2 structure validation
- Split architecture without clear scaling justification
- Create separate frontend/backend for simple CRUD
- Ignore proven patterns from existing tools
- Over-engineer for hypothetical future requirements

**Do:**
- Start simple (Next.js API Routes)
- Validate architecture against existing successful patterns
- Test deployment early and often
- Document deployment issues for knowledge sharing
- Follow established patterns unless strong justification
- Upgrade architecture when requirements demand it

### 3. Debugging Production Issues: Decision Tree

**When Azure Functions return 500:**
```
1. Check Application Insights logs
   - No logs? → Python worker not starting

2. Verify programming model
   - V1 functions with V2 runtime? → Migrate to V2
   - V2 function_app.py exists? → Check syntax

3. Test locally with Azure Functions Core Tools
   - Works locally? → Deployment/config issue
   - Fails locally? → Code issue

4. If debugging exceeds 2 hours:
   - Evaluate architecture alternatives
   - Consider pivot to simpler pattern
   - Document findings
```

**When to Pivot:**
- Debugging exceeds expected migration time
- Root cause unclear after exhaustive investigation
- Alternative architecture proven in similar context
- Time-to-market more important than ideal solution

### 4. Knowledge Extraction for Wiki

**Create wiki page:** `/05-shared/apps/wiki/content/internal-tools-architecture-patterns.md`

**Content:**
- Architecture decision framework
- Pattern templates (Next.js, Functions, Hybrid)
- When to use each pattern
- Cost comparison matrix
- Deployment checklists
- Common troubleshooting guides

**Update skills:**
- `/azure-solutions-architect` - Add architecture patterns
- Knowledge extraction from this document

## Conclusion

### Recommended Immediate Actions

1. **Stop** Azure Functions V2 migration efforts
2. **Create** new Next.js API routes structure in `horizon/src/app/api/`
3. **Migrate** core endpoints (programs, initiatives) to TypeScript
4. **Test** locally with `npm run dev`
5. **Deploy** to Azure App Service
6. **Validate** end-to-end functionality
7. **Document** migration in CHANGELOG

**Timeline:** 5-6 hours total to production-ready application

### Strategic Direction

**Short-term (Next 3 months):**
- Establish Next.js API Routes as default pattern
- Migrate horizon to proven architecture
- Document architecture decision framework
- Create internal tool templates

**Medium-term (3-6 months):**
- Evaluate existing tools for consistency
- Create migration guides for outlier patterns
- Build shared component library
- Establish deployment automation

**Long-term (6-12 months):**
- Consider platform engineering approach
- Investigate Azure Container Apps for unified platform
- Build internal developer portal
- Standardize observability across all tools

### Success Metrics

**Technical:**
- Time from project start to working MVP
- Number of deployment issues per tool
- Average debugging time for production issues
- Code reuse across tools

**Operational:**
- Developer satisfaction with tooling
- Time spent on infrastructure vs features
- Mean time to recovery from incidents
- Cost per application

**Strategic:**
- Consistency across internal tools
- Knowledge transfer effectiveness
- Onboarding time for new tools
- Architectural technical debt accumulation

## Appendix: Architecture Comparison Matrix

| Criteria | Next.js API Routes | Azure Functions V2 | Hybrid | Containers |
|----------|-------------------|-------------------|--------|------------|
| **Development Velocity** | ★★★★★ | ★★★☆☆ | ★★★☆☆ | ★★☆☆☆ |
| **Operational Simplicity** | ★★★★★ | ★★☆☆☆ | ★★☆☆☆ | ★★★☆☆ |
| **Scalability** | ★★★☆☆ | ★★★★★ | ★★★★☆ | ★★★★☆ |
| **Cost (10-50 users)** | $43/mo | $39-49/mo | $52/mo | $48/mo |
| **TypeScript Support** | Native | Via tooling | Mixed | Native |
| **Background Jobs** | Manual | Native | Native | Manual |
| **Learning Curve** | Low | Medium | High | High |
| **Maintenance Burden** | Low | Medium | High | Medium |
| **Debug Experience** | Excellent | Good | Fair | Good |
| **CORS Complexity** | None | Medium | Medium | None |
| **Deployment Speed** | 5-10 min | 10-20 min | 20-30 min | 15-25 min |
| **Local Dev Experience** | Excellent | Good | Fair | Good |

**Recommended by Use Case:**

- **CRUD Dashboard** → Next.js API Routes
- **Data Pipeline** → Azure Functions V2
- **Real-time + Batch** → Hybrid
- **Complex Dependencies** → Containers
- **Simple Static** → Pure Static

**Horizon Fits:** CRUD Dashboard → **Next.js API Routes**

## Next Steps

1. **Approve architecture decision** (Next.js API Routes)
2. **Schedule migration sprint** (1 day)
3. **Create migration branch** (`feat/migrate-to-nextjs-api-routes`)
4. **Follow implementation roadmap** (above)
5. **Test deployment** (Azure App Service)
6. **Document in wiki** (architecture patterns)
7. **Share learnings** (team knowledge base)

**Decision Point:** Do you want to proceed with Next.js API Routes migration, or would you prefer to attempt the Azure Functions V2 migration despite the higher risk and uncertainty?
