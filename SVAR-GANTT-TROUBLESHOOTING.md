# SVAR Gantt Troubleshooting Log

**Date Started:** 2026-01-27
**Issue:** SVAR Gantt not rendering, throwing `TypeError: null is not an object (evaluating 't.forEach')`

## Symptoms

1. **Error:** `TypeError: null is not an object (evaluating 't.forEach')` in SVAR Gantt internal code
2. **Visual:** Years show as "yyyy" instead of actual year
3. **Data:** No projects render in Gantt chart
4. **Performance:** Excessive re-renders (10+ times on mount)
5. **Console:** Only 1 task in converted tasks array

## Observations

### Data Flow
- **filteredProjects:** 1 project successfully filtered
- **convertedTasks:** 1 task successfully converted to ITask format
- **config:** Valid configuration object with proper date range
- **Error Location:** Inside SVAR Gantt library during React layout phase

### Console Patterns
- Component renders repeatedly with same data
- Each render: Filter → Convert → Config → Render cycle
- Error occurs AFTER all data preparation is complete
- Error caught by ErrorBoundary but re-occurs due to React StrictMode

## Attempted Fixes

### Attempt 1: Fix Year Format (Commit: 6437aae)
**Date:** 2026-01-27 08:59 AM
**Hypothesis:** Year scale format string `"yyyy"` not parsed correctly by SVAR
**Changes:**
- Changed year format from string `"yyyy"` to function: `(date: Date) => date.getFullYear().toString()`
- Fixed parent assignment for root projects (only set parent for child tasks)

**Result:** ❌ FAILED
- Years now display correctly instead of "yyyy" ✓
- But forEach error persists
- Projects still don't render

**Conclusion:** Format string was an issue, but not the main issue

---

### Attempt 2: Remove Custom Columns (Commit: 9c59399)
**Date:** 2026-01-27 09:04 AM
**Hypothesis:** Custom columns configuration doesn't match SVAR's `IGanttColumn` interface
**Changes:**
- Removed custom columns configuration (set to `undefined`)
- Stopped spreading config object
- Passed props individually with explicit values
- Removed scales and columns from config dependencies

**Result:** ❌ FAILED
- forEach error STILL occurs
- Exact same error pattern
- Removing columns made no difference

**Conclusion:** The error is NOT related to columns configuration

---

## Current Status

**The forEach error persists despite:**
1. ✓ Fixing year format function
2. ✓ Fixing parent assignment
3. ✓ Removing custom columns
4. ✓ Passing props individually
5. ✓ Valid task data structure
6. ✓ Valid config object

**This indicates the problem is elsewhere:**
- Possibly scales configuration format
- Possibly missing links array
- Possibly task structure issue SVAR doesn't explicitly validate
- Possibly incompatibility with Next.js/React 19

## Next Steps to Try

### Option 1: Minimal Example Test
Strip down to absolute minimum required props:
- Remove scales (use defaults)
- Add empty links array
- Simplify task structure to only required fields
- Remove all custom styling
- Test if SVAR renders at all

### Option 2: Add Missing Required Props
Based on SVAR documentation:
- Add `links={[]}` (empty array)
- Remove custom scales, let SVAR auto-generate
- Ensure all ITask required fields are present

### Option 3: Revert to Old Gantt
If SVAR proves incompatible:
- Revert to InteractiveGanttPanel
- Document SVAR incompatibility issues
- Consider alternative library (DHTMLX trial)

## Data Reference

### Sample Converted Task
```typescript
{
  id: "project-id",
  text: "Project Name",
  start: Date,  // new Date(2024, 0, 1)
  end: Date,    // new Date(2024, 3, 1)
  duration: 4,  // quarters
  progress: 0,
  type: "task" | "summary",
  open: true,
  // Custom fields
  status: "active",
  businessUnit: "Unit Name",
  visible: true,
  // parent: "parent-id" (only if has parent)
}
```

### Sample Config
```typescript
{
  start: new Date(2020, 0, 1),
  end: new Date(2030, 11, 31),
  lengthUnit: "quarter",
  cellWidth: 40,
  cellHeight: 40,
  zoom: false,
  readonly: false
}
```

### Sample Scales
```typescript
[
  {
    unit: "year",
    step: 1,
    format: (date: Date) => date.getFullYear().toString()
  },
  {
    unit: "quarter",
    step: 1,
    format: (date: Date) => `Q${Math.floor(date.getMonth() / 3) + 1}`
  }
]
```

## Questions for Investigation

1. Does SVAR work with React 19?
2. Does SVAR work with Next.js 15 App Router?
3. Does SVAR require links array even if empty?
4. Are there hidden required props not in TypeScript types?
5. Is there a working example we can reference?

## Resolution

**Status:** 🔴 UNRESOLVED
**Next Action:** Try Option 1 (Minimal Example Test)
