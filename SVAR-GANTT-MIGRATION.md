# SVAR Gantt Migration

**Date:** 2026-01-27
**Purpose:** Replace custom Gantt chart implementation with SVAR React Gantt library

## Summary

Replaced the custom-built `InteractiveGanttPanel` component (~587 lines of manual mouse event handling, drag state management, and positioning calculations) with the professional, open-source **SVAR React Gantt** library.

## Why SVAR React Gantt?

### Selection Criteria
After evaluating 5 leading React Gantt libraries, SVAR React Gantt was selected for:

1. **Cost-Effective:** MIT license (free for commercial use)
2. **Modern & Maintained:** Latest release v2.4 (December 2024)
3. **TypeScript Native:** Full TypeScript support with type safety
4. **React 19 Compatible:** Works with Next.js 15 setup
5. **Feature Complete:** All required features out-of-the-box:
   - Drag-and-drop movement
   - Resize tasks
   - Hierarchical structure (parent/child projects)
   - Dependencies support
   - Customizable columns
   - Quarterly timeline view
6. **Performance:** Optimized for large datasets with dynamic loading
7. **Customizable:** Flexible styling to match dark theme design system
8. **AI Development Support:** MCP server for Claude Code integration

### Alternatives Considered
- **DHTMLX Gantt:** $699/developer, better performance but commercial license
- **Bryntum Gantt:** $940/developer, best UI/UX but expensive
- **Syncfusion:** $395/month, AI-ready features but subscription model
- **DevExtreme:** $899.99/developer, complete package but overkill

## Implementation Details

### Package Installed
```bash
npm install @svar-ui/react-gantt
```

**Version:** 2.4.4
**License:** MIT
**Dependencies:** 26 packages added

### Files Created
1. **`src/components/features/svar-gantt-panel.tsx`** - New Gantt component using SVAR library

### Files Modified
1. **`src/app/page.tsx`** - Updated import and usage from `InteractiveGanttPanel` to `SvarGanttPanel`
2. **`src/components/features/index.ts`** - Added export for `SvarGanttPanel`

### Files Deprecated (Not Deleted)
1. **`src/components/features/interactive-gantt-panel.tsx`** - Original custom implementation (kept for reference)

## Data Mapping

### Project → ITask Conversion

| Project Property | SVAR ITask Property | Conversion |
|------------------|---------------------|------------|
| `id` | `id` | Direct mapping |
| `name` | `text` | Direct mapping |
| `startYear` + `startQuarter` | `start` (Date) | Convert to Date: `new Date(year, (quarter-1)*3, 1)` |
| `durationQuarters` | `duration` + `end` (Date) | Calculate end date from start + duration |
| `parentProjectId` | `parent` | Direct mapping (or "0" for root) |
| `status` | Custom field | Stored as custom property |
| `businessUnitName` | `businessUnit` | Custom column |
| Has children | `type` | "summary" if has children, "task" otherwise |

### Quarter Calculations
- **Q1** = Month 0 (January)
- **Q2** = Month 3 (April)
- **Q3** = Month 6 (July)
- **Q4** = Month 9 (October)

Duration in quarters = `Math.ceil(totalMonths / 3)`

## Features Implemented

### Timeline Configuration
- **Scales:** Year + Quarter view
- **Range:** Configurable start/end years from timeline prop
- **Cell Width:** 40px per quarter
- **Cell Height:** 40px per row

### Grid Columns
1. **Project Name** (250px, flex-grow)
2. **Business Unit** (150px)
3. **Status** (100px with color-coded badges)

### Event Handlers
- **`onupdatetask`:** Handles drag-and-drop and resize events
- **`onselecttask`:** Navigates to project detail page on click
- **`init`:** Stores API reference for programmatic control

### Styling Integration
Custom CSS overrides applied to match Horizon's dark theme:
- Uses CSS variables: `--foreground`, `--background`, `--card-bg`, `--border`, `--muted`, `--hover-bg`
- Custom scrollbar styling
- Hover effects on Gantt bars (brightness + transform + shadow)

## API Reference

### Component Props

```typescript
interface SvarGanttPanelProps {
  projects: Project[];
  onProjectChange: (
    updatedProjects: Project[],
    changes?: {
      projectTimelineChanged: boolean;
      projectId: string;
      oldStartYear?: number;
      oldStartQuarter?: number;
      newStartYear: number;
      newStartQuarter: number;
    }
  ) => void;
  selectedBusinessUnit?: string;
  timeline?: { startYear: number; endYear: number };
}
```

### Key SVAR Gantt Props Used

```typescript
<Gantt
  tasks={ITask[]}              // Project data converted to SVAR format
  scales={IScaleConfig[]}      // Timeline configuration (year + quarter)
  columns={IColumnConfig[]}    // Grid columns (name, business unit, status)
  start={Date}                 // Timeline start date
  end={Date}                   // Timeline end date
  lengthUnit="quarter"         // Duration unit
  cellWidth={40}               // Pixels per quarter
  cellHeight={40}              // Pixels per row
  zoom={false}                 // Disable zoom feature
  readonly={false}             // Enable editing
  init={(api) => void}         // API reference callback
  onupdatetask={(ev) => void}  // Task update handler
  onselecttask={(ev) => void}  // Task selection handler
/>
```

## Migration Benefits

### Code Reduction
- **Before:** ~587 lines of custom code
- **After:** ~290 lines (mostly data transformation)
- **Reduction:** ~50% less code to maintain

### Features Gained
- Professional UI/UX with smooth interactions
- Built-in zoom support (disabled for now, can enable later)
- Tooltip support
- Context menu support (can enable with `<ContextMenu>` component)
- Toolbar support (can add with `<Toolbar>` component)
- Task editor form (can enable with `<Editor>` component)
- Dependency links (ready to use when needed)
- Baselines, auto-scheduling, split tasks (PRO edition features)

### Maintenance Benefits
- No manual mouse event handling
- No custom drag state management
- No position calculations
- Bug fixes and updates from SVAR team
- Active community support

### Performance Benefits
- Optimized rendering engine
- Virtual scrolling for large datasets
- Dynamic loading
- Efficient state management

## PRO Edition Features (Optional Upgrade)

If advanced features are needed in the future, SVAR offers a PRO edition with:
- **Working-day calendars:** Non-linear time scales respecting weekends/holidays
- **Auto-scheduling:** Forward planning with automatic dependency calculations
- **Baselines:** Track original vs. current schedule
- **Split tasks:** Represent pauses or interruptions
- **Undo/redo:** History management

**Cost:** Commercial pricing (contact SVAR for quote)

## Testing Checklist

- [x] Package installed successfully
- [x] Component compiles without TypeScript errors
- [x] Dev server runs on port 3002
- [ ] Gantt chart renders with project data
- [ ] Drag-and-drop works and updates backend
- [ ] Resize works and updates backend
- [ ] Click navigates to project detail page
- [ ] Business unit filter works
- [ ] Timeline range respects props
- [ ] Dark theme styling matches design system
- [ ] Hierarchical structure displays correctly (parent/child)

## Known Issues / TODO

1. **CSS Import:** SVAR CSS is imported in component. May need global import in `globals.css` if styles don't load.
2. **Dependency Links:** Not yet implemented (data structure ready, just need to add links array)
3. **Progress Tracking:** Currently hardcoded to 0, needs mapping from project data
4. **Visibility Toggle:** Old implementation had eye icon to hide/show tasks - not yet migrated
5. **Expand/Collapse:** Old implementation had chevron icons - need to verify SVAR's built-in support

## Rollback Plan

If issues arise, can quickly revert by:
1. Change import in `src/app/page.tsx` back to `InteractiveGanttPanel`
2. Update component usage from `<SvarGanttPanel>` to `<InteractiveGanttPanel>`
3. Original implementation is still in codebase at `src/components/features/interactive-gantt-panel.tsx`

## Resources

- **SVAR Docs:** https://docs.svar.dev/react/gantt/
- **GitHub:** https://github.com/svar-widgets/react-gantt
- **npm:** https://www.npmjs.com/package/@svar-ui/react-gantt
- **Demos:** https://docs.svar.dev/react/gantt/samples/
- **MCP Server:** Built-in for AI coding assistants

## Next Steps

1. Test the Gantt chart in browser
2. Verify drag-and-drop updates backend correctly
3. Add dependency links if needed
4. Map progress percentage from project data
5. Migrate visibility toggle feature
6. Add context menu for right-click actions
7. Consider adding toolbar for common actions
8. Delete old `interactive-gantt-panel.tsx` file once confirmed working
