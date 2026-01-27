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

### Phase 6: Stacked Bar Charts ⏳
**Goal:** Weekly activity visualization

**Tasks:**
- [ ] Create `StackedBarChart.tsx` wrapper component
- [ ] Implement Recharts BarChart with stackId
- [ ] Define color scheme for categories
- [ ] Add responsive sizing
- [ ] Implement tooltip customization

**Files to Create:**
- `frontend/src/components/charts/stacked-bar-chart.tsx`

**Files to Modify:**
- Dashboard page (add activity chart section)

**Estimated Time:** 2 hours
**Blockers:** Phase 2 completion (Recharts familiarity)

---

### Phase 7: Ring/Donut Charts ⏳
**Goal:** Project completion overview

**Tasks:**
- [ ] Create `RingChart.tsx` component
- [ ] Implement Recharts PieChart with innerRadius
- [ ] Add center label (percentage)
- [ ] Create legend component
- [ ] Style colors to match status

**Files to Create:**
- `frontend/src/components/charts/ring-chart.tsx`

**Files to Modify:**
- Dashboard page (add overview section)

**Estimated Time:** 1.5 hours
**Blockers:** Phase 2 completion

---

### Phase 8: Chart Hover Tooltips ⏳
**Goal:** Consistent tooltip styling across all charts

**Tasks:**
- [ ] Create custom Tooltip component for Recharts
- [ ] Style with dark background, white text
- [ ] Add multi-line data formatting
- [ ] Apply to all chart components
- [ ] Test hover behavior

**Files to Create:**
- `frontend/src/components/charts/custom-tooltip.tsx`

**Files to Modify:**
- All chart components (sparkline, stacked bar, ring chart)

**Estimated Time:** 1 hour
**Blockers:** Phase 6 or 7 completion

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

## 📊 Progress Tracking

### Summary
- **Total Components:** 10
- **Completed:** 3 (KPI Card, Status Dot, Timeline View)
- **In Progress:** 0
- **Not Started:** 7

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
