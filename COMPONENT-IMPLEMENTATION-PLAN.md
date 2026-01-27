# Horizon Dashboard Component Implementation Plan

**Created:** 2026-01-27
**Purpose:** Replace problematic SVAR Gantt and enhance dashboard with proven Dribbble patterns
**Approach:** Leverage existing libraries, avoid reinventing the wheel

---

## 🎯 Overview

Implementing 10 powerful components identified from Dribbble analysis to modernize Horizon dashboard.

**Key Principle:** Use minimal, unified library stack for consistency and maintainability.

---

## 📚 Library Stack

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| **Recharts** | Latest | All charts (sparklines, stacked bars, ring charts, tooltips) | ⏳ To Install |
| **Radix UI** (via shadcn/ui) | Latest | Interactive components (tabs, dropdowns, buttons, alerts) | ⏳ To Install |
| **Framer Motion** | Latest | Animations and timeline progress | ⏳ To Install |
| **Sonner** | Latest | Toast notifications / alert banners | ⏳ To Install |

---

## 🏗️ Components to Implement

### Priority 1: Core Dashboard Components (Week 1)

| # | Component | Library | Status | Notes |
|---|-----------|---------|--------|-------|
| 2 | KPI Cards with Sparklines | Recharts | ⏳ Not Started | Replace existing metric cards |
| 6 | Status Indicator Dots | Custom CSS | ⏳ Not Started | 5 lines of code, semantic colors |
| 8 | Filter Chips | shadcn Button | ⏳ Not Started | Active filter display |
| 10 | Tab/Toggle Navigation | Radix Tabs | ⏳ Not Started | Multi-view switcher |

### Priority 2: Data Visualization (Week 2)

| # | Component | Library | Status | Notes |
|---|-----------|---------|--------|-------|
| 5 | Stacked Bar Charts | Recharts | ⏳ Not Started | Weekly activity visualization |
| 7 | Ring/Donut Charts | Recharts | ⏳ Not Started | Project completion overview |
| 13 | Chart Hover Tooltips | Recharts Tooltip | ⏳ Not Started | Built-in, customize renderContent |

### Priority 3: Timeline & Interactions (Week 3)

| # | Component | Library | Status | Notes |
|---|-----------|---------|--------|-------|
| 9 | Timeline Progress Bars | Framer Motion | ⏳ Not Started | Replace SVAR Gantt chart |
| 12 | Row Action Menus | Radix Dropdown | ⏳ Not Started | Project quick actions |
| 1 | Alert/Announcement Banner | Sonner/shadcn Alert | ⏳ Not Started | Contextual notifications |

---

## 📋 Implementation Phases

### Phase 1: Setup & Dependencies 🔄
**Goal:** Install all required libraries and shadcn components

**Tasks:**
- [x] Install Recharts (already installed: `^2.15.3`)
- [x] Install Framer Motion (`npm install framer-motion`) ✅
- [x] Install Sonner (already installed: `^2.0.3`)
- [ ] Create Button component (manual - shadcn not configured)
- [ ] Create Tabs component (manual)
- [ ] Create Dropdown Menu component (manual)
- [ ] Create Alert component (manual)
- [ ] Create Badge component (manual)

**Estimated Time:** 30 minutes
**Blockers:** None
**Status:** In Progress - Creating components manually based on Radix UI primitives

---

### Phase 2: KPI Cards with Sparklines ✅
**Goal:** Create reusable KPI card component with trend visualization

**Tasks:**
- [x] Create `KPICard.tsx` component ✅
- [x] Implement Recharts LineChart for sparkline ✅
- [x] Add trend indicator (↑/↓ percentage) ✅
- [x] Style card to match design tokens ✅
- [ ] Add to Storybook (if available)
- [ ] Replace existing MetricCard usage on dashboard

**Files Created:**
- `frontend/src/components/ui/kpi-card.tsx` ✅

**Files to Modify:**
- `frontend/src/app/page.tsx` (add KPI cards) - Next step

**Estimated Time:** 2 hours
**Actual Time:** 30 minutes
**Blockers:** None

---

### Phase 3: Status Indicator Dots ✅
**Goal:** Simple CSS-based status indicators for projects

**Tasks:**
- [x] Create `StatusDot.tsx` component ✅
- [x] Define semantic color mapping (active=blue, complete=green, etc.) ✅
- [x] Add to design tokens if needed ✅
- [ ] Use in project tables/lists - Next step

**Files Created:**
- `frontend/src/components/ui/status-dot.tsx` ✅

**Files to Modify:**
- Project list components - Next step

**Estimated Time:** 30 minutes
**Actual Time:** 15 minutes
**Blockers:** None

---

### Phase 4: Filter Chips ⏳
**Goal:** Active filter display with removal capability

**Tasks:**
- [ ] Create `FilterChips.tsx` component using shadcn Button
- [ ] Implement chip removal logic
- [ ] Add icons to chips
- [ ] Connect to existing filter state
- [ ] Style hover/active states

**Files to Create:**
- `frontend/src/components/ui/filter-chips.tsx`

**Files to Modify:**
- `frontend/src/components/features/filter-panel.tsx`

**Estimated Time:** 1.5 hours
**Blockers:** Phase 1 completion

---

### Phase 5: Tab/Toggle Navigation ⏳
**Goal:** Multi-view switcher for dashboard

**Tasks:**
- [ ] Implement Radix Tabs via shadcn
- [ ] Create view toggle component
- [ ] Add views: List, Timeline, Board (future)
- [ ] Persist view preference to localStorage
- [ ] Style active/inactive states

**Files to Create:**
- `frontend/src/components/features/view-switcher.tsx`

**Files to Modify:**
- `frontend/src/app/page.tsx` (add view switcher)

**Estimated Time:** 2 hours
**Blockers:** Phase 1 completion

---

### Phase 6: Stacked Bar Charts ✅
**Goal:** Weekly activity visualization

**Tasks:**
- [x] Create `StackedBarChart.tsx` wrapper component ✅
- [x] Implement Recharts BarChart with stackId ✅
- [x] Define color scheme for categories ✅
- [x] Add responsive sizing ✅
- [x] Implement tooltip customization ✅

**Files Created:**
- `frontend/src/components/charts/stacked-bar-chart.tsx` ✅
- `frontend/src/components/charts/index.ts` ✅

**Files to Modify:**
- Dashboard page (add activity chart section) - Next step

**Estimated Time:** 2 hours
**Actual Time:** 45 minutes
**Blockers:** None

---

### Phase 7: Ring/Donut Charts ✅
**Goal:** Project completion overview

**Tasks:**
- [x] Create `RingChart.tsx` component ✅
- [x] Implement Recharts PieChart with innerRadius ✅
- [x] Add center label (percentage) ✅
- [x] Create legend component ✅
- [x] Style colors to match status ✅

**Files Created:**
- `frontend/src/components/charts/ring-chart.tsx` ✅

**Files to Modify:**
- Dashboard page (add overview section) - Next step

**Estimated Time:** 1.5 hours
**Actual Time:** 30 minutes
**Blockers:** None

---

### Phase 8: Chart Hover Tooltips ✅
**Goal:** Consistent tooltip styling across all charts

**Tasks:**
- [x] Create custom Tooltip component for Recharts ✅
- [x] Style with dark background (#1a1a1a), white text ✅
- [x] Add multi-line data formatting ✅
- [x] Apply to all chart components ✅
- [x] Test hover behavior ✅

**Files Created:**
- `frontend/src/components/charts/custom-tooltip.tsx` ✅

**Files Modified:**
- All chart components (stacked bar includes custom tooltip)

**Estimated Time:** 1 hour
**Actual Time:** 30 minutes
**Blockers:** None

**Features Implemented:**
- ✅ Dark theme tooltip (#1a1a1a background)
- ✅ Multi-line data with color indicators
- ✅ Optional total calculation
- ✅ Custom value formatting
- ✅ SimpleTooltip variant for sparklines

---

### Phase 9: Timeline Progress Bars ✅
**Goal:** Replace problematic SVAR Gantt with simpler timeline view

**Tasks:**
- [x] Create `TimelineView.tsx` component ✅
- [x] Implement horizontal progress bars per project ✅
- [x] Add Framer Motion animations ✅
- [x] Implement striped pattern for remaining time ✅
- [x] Add "Today" marker ✅
- [ ] Add drag-to-reschedule (deferred - not in Dribbble pattern)
- [x] Connect to project data ✅
- [x] Replace SVAR Gantt usage ✅

**Files Created:**
- `frontend/src/components/features/timeline-view.tsx` ✅

**Files Modified:**
- `frontend/src/app/page.tsx` (replaced SvarGanttPanel with TimelineView) ✅
- `frontend/src/components/features/index.ts` (added export) ✅

**Estimated Time:** 4 hours
**Actual Time:** 1 hour
**Blockers:** None

**Features Implemented:**
- ✅ Horizontal progress bars with solid color for completed portion
- ✅ Diagonal stripe pattern for remaining time
- ✅ "Today" vertical marker with red line
- ✅ Quarterly timeline header (year + quarters)
- ✅ Status dots per project
- ✅ Project metadata (name, dates, business unit)
- ✅ Framer Motion stagger animations
- ✅ Hover effects and click handling
- ✅ Responsive design
- ✅ Auto-calculated bar positions based on start/end dates

---

### Phase 10: Row Action Menus ⏳
**Goal:** Quick actions for projects (Complete, Edit, Delete)

**Tasks:**
- [ ] Implement Radix Dropdown Menu via shadcn
- [ ] Create action menu component
- [ ] Add icons to menu items
- [ ] Connect to project operations
- [ ] Add confirmation for destructive actions

**Files to Create:**
- `frontend/src/components/ui/project-actions-menu.tsx`

**Files to Modify:**
- Project row components

**Estimated Time:** 2 hours
**Blockers:** Phase 1 completion

---

### Phase 11: Alert/Announcement Banner ⏳
**Goal:** Contextual notifications at top of dashboard

**Tasks:**
- [ ] Implement Sonner toast or shadcn Alert
- [ ] Create banner component with icon + message + CTA
- [ ] Add dismissible behavior
- [ ] Style for different alert types (info, warning, error, success)
- [ ] Connect to notification system

**Files to Create:**
- `frontend/src/components/ui/alert-banner.tsx`

**Files to Modify:**
- Layout or dashboard page (add banner slot)

**Estimated Time:** 1.5 hours
**Blockers:** Phase 1 completion

---

### Phase 12: Fix HTML Hydration Errors in Projects Table ✅
**Goal:** Fix invalid DOM nesting in drag-and-drop table implementation

**Root Cause:**
- `DropZone` component renders `<div>` inside `<tbody>`
- HTML spec: `<tbody>` can only contain `<tr>` elements
- Structure: `<tbody><div><tr></tr></div></tbody>` ← INVALID
- Causes: Hydration errors, React warnings, semantic HTML violations

**Tasks:**
- [x] Analyze HTML structure and identify root cause ✅
- [x] Remove DropZone wrapper from TableBody ✅
- [x] Make TableBody itself the droppable area ✅
- [x] Test drag-and-drop still works ✅
- [x] Verify no hydration errors ✅
- [x] Commit fix ✅

**Files Modified:**
- `frontend/src/app/projects/page.tsx` ✅

**Technical Solution:**
- Removed `<DropZone>` wrapper component from table
- Applied `useDroppable` hook directly to table structure
- Maintained drag-and-drop functionality with valid HTML
- Preserved "root" drop zone behavior

**Errors Fixed:**
- ✅ `<div>` cannot be a child of `<tbody>`
- ✅ `<tbody>` cannot contain a nested `<div>`
- ✅ `<tr>` cannot be a child of `<div>`
- ✅ `<div>` cannot contain a nested `<tr>`

**Estimated Time:** 30 minutes
**Actual Time:** 15 minutes
**Blockers:** None

---

### Phase 13: Fix UI/UX Issues 🔄
**Goal:** Fix multiple UI/UX issues in dashboard and dialogs

**Issues to Fix:**
1. **Dashboard width overflow** - Components stretch beyond available width
2. **Dialog positioning** - Project creation popup appears in top-left instead of centered
3. **Dropdown transparency** - Dropdowns have translucent backgrounds instead of opaque
4. **Project sort crash** - `TypeError: undefined is not an object (evaluating 'a.name.localeCompare')` when creating new project

**Root Causes:**
- Issue 1: Missing container width constraints on dashboard
- Issue 2: Dialog component missing centering styles
- Issue 3: Dropdown components missing opaque background
- Issue 4: Sort function doesn't handle undefined/empty names during project creation

**Tasks:**
- [x] Analyze dashboard layout and add width constraints ✅
- [x] Fix dialog centering styles ✅
- [x] Add opaque backgrounds to all dropdowns ✅
- [x] Add null checks to sort function ✅
- [x] Test all fixes ✅
- [x] Commit changes ✅

**Files Modified:**
- `frontend/src/app/globals.css` (dialog centering, dropdown opacity, width overflow) ✅
- `frontend/src/app/projects/page.tsx` (sort function null safety) ✅

**Solutions Implemented:**
1. **Sort Crash Fix:** Added null coalescing to `a.name` in sort function (`(a.name || "").localeCompare(b.name || "")`)
2. **Dialog Centering:** Added fixed positioning with transform translate(-50%, -50%) for all dialog elements
3. **Dropdown Opacity:** Set `background-color: hsl(var(--popover))` with `opacity: 1` for all dropdown/select components
4. **Width Overflow:** Added `overflow-x: hidden` and `max-width: 100vw` constraints to body, container, and resizable panels

**Estimated Time:** 1 hour
**Actual Time:** 20 minutes
**Status:** ✅ Complete

---

## 📊 Progress Tracking

### Summary
- **Total Components:** 10
- **Completed:** 6 (KPI Card, Status Dot, Stacked Bar, Ring Chart, Tooltips, Timeline View)
- **In Progress:** 0
- **Not Started:** 4 (Filter Chips, Tabs, Row Actions, Alert Banner)
- **Bug Fixes:** 2 (HTML Hydration Errors, UI/UX Issues)

### Status Legend
- ✅ Completed
- 🔄 In Progress
- ⏳ Not Started
- ⚠️ Blocked
- ❌ Cancelled

---

## 🗂️ File Structure

```
frontend/src/
├── components/
│   ├── ui/
│   │   ├── kpi-card.tsx                    [Phase 2]
│   │   ├── status-dot.tsx                  [Phase 3]
│   │   ├── filter-chips.tsx                [Phase 4]
│   │   ├── project-actions-menu.tsx        [Phase 10]
│   │   └── alert-banner.tsx                [Phase 11]
│   ├── charts/
│   │   ├── stacked-bar-chart.tsx           [Phase 6]
│   │   ├── ring-chart.tsx                  [Phase 7]
│   │   └── custom-tooltip.tsx              [Phase 8]
│   └── features/
│       ├── view-switcher.tsx               [Phase 5]
│       └── timeline-view.tsx               [Phase 9]
└── app/
    └── page.tsx                            [Modified throughout]
```

---

## 🚀 Getting Started

### Current Status: Phase 1 Setup

**Next Actions:**
1. Run dependency installation
2. Add shadcn components
3. Verify all libraries installed correctly
4. Begin Phase 2 implementation

---

## 📝 Notes & Decisions

### Why This Approach?
- **Unified stack:** Recharts + Radix + Framer Motion = consistent API
- **Minimal dependencies:** 4 libraries cover all 10 components
- **Ownership:** shadcn = copy-paste, full control
- **TypeScript-first:** All libraries have excellent TS support
- **Next.js 15 compatible:** Tested with latest React 19

### Alternative Approaches Rejected
- ❌ SVAR Gantt - too complex, forEach error persists
- ❌ Tremor - unnecessary abstraction over Recharts
- ❌ Visx - too low-level, requires building from scratch
- ❌ Separate libraries per component - bundle bloat

---

## 🔗 Resources

- [Recharts Documentation](https://recharts.github.io/)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Sonner Toast](https://sonner.emilkowal.ski/)
- [SVAR Gantt Troubleshooting](./SVAR-GANTT-TROUBLESHOOTING.md)

---

## ✅ Success Criteria

**Phase 1 Complete When:**
- [ ] All dependencies installed without errors
- [ ] shadcn components added to project
- [ ] Can import from all libraries

**Project Complete When:**
- [ ] All 10 components implemented
- [ ] SVAR Gantt removed and replaced
- [ ] Dashboard loads without errors
- [ ] All components responsive
- [ ] TypeScript errors resolved
- [ ] Committed and deployed

---

**Last Updated:** 2026-01-27 09:35 AM CET
