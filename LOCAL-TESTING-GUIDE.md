# Horizon Local Testing Guide

## Prerequisites

- Node.js 20+ installed
- PostgreSQL database access (Azure or local)
- Terminal/command line access

## Setup Instructions

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Verify Environment Variables

Check that `frontend/.env.local` exists with:

```
DATABASE_URL=postgresql://horizon_admin:Dm6N5nUecHaEJZKER5TRN6BtVs6HIMws@horizon-pg-1769161979.postgres.database.azure.com:5432/horizon?sslmode=require
```

### 3. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The app should start on `http://localhost:3000`

## Testing the Org Data Integration

### Test 1: Verify Org Data API Endpoint

Open your browser and test these URLs:

1. **Get all divisions:**
   ```
   http://localhost:3000/api/org-data/divisions
   ```
   Expected: JSON with divisions array

2. **Get all business units:**
   ```
   http://localhost:3000/api/org-data/business-units
   ```
   Expected: JSON with businessUnits array

3. **Get specific business unit:**
   ```
   http://localhost:3000/api/org-data/business-units/ur
   ```
   Expected: JSON with Universal Robots (UR) details

4. **Validate business unit:**
   ```
   http://localhost:3000/api/org-data/validate?business_unit_id=ur
   ```
   Expected: `{"valid": true, "businessUnit": {...}}`

5. **Search employees:**
   ```
   http://localhost:3000/api/org-data/employees?business_unit=ur&search=john
   ```
   Expected: JSON with employees array

### Test 2: Database Migration Verification

Open PostgreSQL client and run:

```sql
-- Check if business_units table was dropped
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'business_units'
);
-- Should return: false

-- Check projects table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name IN ('business_unit_id', 'business_unit_name');
-- Should show: business_unit_id (text)
-- Should NOT show: business_unit_name

-- Check resources table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'resources' AND column_name IN ('business_unit_id', 'business_unit_name', 'employee_references');
-- Should show: business_unit_id (text), employee_references (jsonb)
-- Should NOT show: business_unit_name
```

### Test 3: Project Creation with BU Selector

1. Navigate to `http://localhost:3000/projects`
2. Click "Create Project" button
3. **Expected:** Dialog opens with BusinessUnitSelector showing divisions → BUs
4. Fill in project details:
   - Name: "Test Project"
   - Select BU: "Universal Robots (UR)"
   - Set start year/quarter, duration, etc.
5. Click "Save"
6. **Expected:**
   - Project appears in list
   - BU badge displays "Universal Robots (UR)" with headcount
   - No errors in browser console

### Test 4: Verify Database State

After creating test project, check database:

```sql
-- View the newly created project
SELECT id, name, business_unit_id, business_unit_name
FROM projects
WHERE name = 'Test Project';

-- Expected:
-- business_unit_id = 'ur' (TEXT, not UUID)
-- business_unit_name = NULL (column should not exist)
```

### Test 5: Business Unit Filter

1. Create 3 test projects:
   - Project A: BU = "ur" (Universal Robots)
   - Project B: BU = "mir" (Mobile Industrial Robots)
   - Project C: BU = "robotics" (Robotics Division)

2. On projects page, click "Business Unit" filter button
3. **Expected:** Popover opens showing divisions → BUs with checkboxes
4. Select "Universal Robots (UR)"
5. **Expected:** Only Project A displays in table
6. Click "Clear" button
7. **Expected:** All 3 projects display

### Test 6: React Query Caching

1. Open browser DevTools → Console
2. Navigate to projects page
3. Watch network requests in Network tab
4. **Expected:** Single request to `/api/org-data/divisions`
5. Navigate away and back to projects page (within 5 minutes)
6. **Expected:** NO new network request (served from React Query cache)
7. Check console for: `[org-data] Returning fresh cache`

### Test 7: BU Badge Rendering

1. Create 10 projects all with BU = "ur"
2. Navigate to projects page
3. **Expected:**
   - All 10 projects show "Universal Robots (UR)" badge
   - Only 1 network request to `/api/org-data/business-units/ur`
   - Badges render instantly (< 50ms)

### Test 8: Invalid BU ID Handling

1. Manually insert project with invalid BU ID:
   ```sql
   INSERT INTO projects (id, name, business_unit_id, start_year, start_quarter, duration_quarters, total_cost, risk_level, status, created_at, updated_at, type)
   VALUES (
     gen_random_uuid(),
     'Invalid BU Project',
     'invalid-bu-id',
     2026,
     1,
     4,
     100000,
     'low',
     'active',
     now(),
     now(),
     'project'
   );
   ```

2. Navigate to projects page
3. **Expected:**
   - Project displays in list
   - BU badge shows "invalid-bu-id (not found)" in red
   - No errors in console

### Test 9: CDN Cache Behavior

1. Monitor console logs while using the app
2. First load: Should see `[org-data] Fetching from CDN`
3. Within 5 minutes: Should see `[org-data] Returning fresh cache`
4. Wait 5+ minutes, refresh page
5. Should see `[org-data] Fetching from CDN` again

## Common Issues & Solutions

### Issue: "Failed to fetch org data"

**Possible causes:**
1. CDN is down or inaccessible
2. Network connectivity issues
3. CORS issues (unlikely in this setup)

**Solution:**
- Check console for specific error message
- Verify CDN URL is accessible: `curl https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json`
- App should fall back to stale cache if available

### Issue: "Business unit not found"

**Possible causes:**
1. Invalid BU ID in project data
2. Org data hasn't loaded yet

**Solution:**
- Check network tab for `/api/org-data` requests
- Verify org data API returns divisions
- Check project's businessUnitId value in database

### Issue: BU selector is empty

**Possible causes:**
1. OrgDataProvider not wrapping app
2. Org data fetch failed
3. React Query not configured

**Solution:**
- Verify `OrgDataProvider` is in `app/layout.tsx`
- Check browser console for errors
- Open React Query DevTools (should see org-data queries)

### Issue: Database migration didn't run

**Possible causes:**
1. Using cached backend code
2. Migration already ran (idempotent)

**Solution:**
- Check database schema manually (see Test 2)
- Migration is idempotent, safe to run multiple times
- If needed, manually run migration SQL from database.py

### Issue: Projects page won't load

**Possible causes:**
1. Database connection issue
2. Missing `business_unit_name` column in SELECT query

**Solution:**
- Check frontend logs for database errors
- Verify `projects/route.ts` doesn't reference `business_unit_name`
- Check database connection string in `.env.local`

## Performance Benchmarks

### Expected Latencies (Local Development)

- **First org data fetch:** < 1000ms (CDN)
- **Cached org data fetch:** < 10ms (in-memory)
- **BU badge render:** < 50ms (React Query cache)
- **Project page load:** < 500ms (with 50 projects)
- **Filter application:** < 100ms (client-side)

### Memory Usage

- **Org data cache:** ~2 MB (8,440 employees)
- **React Query cache:** ~5 MB (divisions, BUs, badges)

## Debugging Tools

### Browser DevTools

1. **Console:** Check for `[org-data]` log messages
2. **Network:** Monitor `/api/org-data` requests
3. **React Query DevTools:** View cache state (install extension)

### PostgreSQL Queries

```sql
-- Count projects by BU
SELECT business_unit_id, COUNT(*) as project_count
FROM projects
WHERE business_unit_id IS NOT NULL
GROUP BY business_unit_id;

-- Check for projects with invalid BU IDs
SELECT id, name, business_unit_id
FROM projects
WHERE business_unit_id IS NOT NULL
  AND business_unit_id NOT IN ('ur', 'mir', 'robotics', 'semiconductor-test');

-- View org data cache age (Next.js API route logs)
-- Check terminal output for timestamp differences
```

## Next Steps After Local Testing

1. ✅ Verify all 9 test scenarios pass
2. ✅ Check database schema matches expectations
3. ✅ Confirm performance benchmarks met
4. 📝 Document any issues found
5. 🚀 Proceed to production deployment

## Production Deployment Checklist

- [ ] All local tests pass
- [ ] Database migration completed successfully
- [ ] No console errors in browser
- [ ] Performance benchmarks met
- [ ] BU badges render correctly
- [ ] Filters work as expected
- [ ] Invalid BU IDs handled gracefully

## Support

If you encounter issues during testing:

1. Check console logs for specific error messages
2. Review the implementation document: `ORG-DATA-INTEGRATION-IMPLEMENTATION.md`
3. Verify database schema changes in Test 2
4. Check that all files from the implementation are present

## Files Changed for Local Testing

- `frontend/src/app/api/org-data/[[...route]]/route.ts` - NEW (org data API)
- `frontend/src/app/api/projects/route.ts` - MODIFIED (removed business_unit_name)
- `backend/shared/database.py` - MODIFIED (migration logic)

All other files from the implementation are already in place and ready for testing.
