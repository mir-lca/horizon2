# Horizon App - Architecture Analysis

**Date:** 2026-01-26
**Purpose:** Document current architecture and prepare for design system alignment with ai-adoption-dashboard and ai-champions-tracker

## Current Architecture

### Technology Stack

**Frontend:**
- Next.js 15.2.4 (App Router)
- React 19.0.0
- TypeScript 5
- Tailwind CSS 4 (with CSS-in-JS approach)
- TanStack Query v5 (React Query)
- Zustand (state management)
- tr-workspace-components (custom component library)

**Key Libraries:**
- @radix-ui/* - Headless UI primitives
- @dnd-kit/core - Drag and drop
- Recharts - Data visualization
- TipTap - Rich text editor
- Lucide React - Icons

### File Structure

```
horizon/
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   │   ├── page.tsx       # Dashboard (main page)
│   │   │   ├── projects/      # Projects list and detail pages
│   │   │   ├── api/           # API routes
│   │   │   ├── layout.tsx     # Root layout
│   │   │   └── globals.css    # Global styles
│   │   ├── components/
│   │   │   ├── ui/            # Reusable UI components
│   │   │   ├── features/      # Feature-specific components
│   │   │   ├── forms/         # Form components
│   │   │   └── layout/        # Layout components (navbar)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities and helpers
│   │   └── store/             # Zustand store
│   ├── tailwind.config.js
│   └── package.json
└── backend/                   # Node.js API (separate)
```

### Current Styling Approach

#### CSS Architecture
1. **Tailwind CSS 4** with CSS-in-JS (@import directives)
2. **CSS Variables** for theming (HSL color space)
3. **Dark mode** via class-based switching
4. **Custom utility classes** for scrollbar hiding

#### Color System
```css
:root {
  --background: oklch(0.985 0.003 240);
  --foreground: oklch(0.18 0.024 265);
  --primary: oklch(0.38 0.077 256);
  --card: oklch(1 0 0);
  --border: oklch(0.9 0.015 250);
  /* ... more color variables */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0.003 240);
  /* ... dark theme overrides */
}
```

#### Component Patterns
- **MetricCard** - Statistical display cards
- **StatusBadge** - Project/resource status indicators
- **DraggableRow** - Drag-and-drop table rows
- **InteractiveGanttPanel** - Timeline visualization
- **FinancialChart** - Recharts-based visualizations

### External Dependencies

**tr-workspace-components** (v1.2.0):
- Custom component library used throughout
- Provides: Card, Button, Dialog, Dropdown, Progress, Tooltip, etc.
- Appears to be an internal Teradyne package

### State Management

**Zustand Store** (`app-store.ts`):
- Date range selection
- Business unit filtering
- Global app state

**React Query:**
- Server state management
- Data fetching and caching
- Optimistic updates

### Key Features

1. **Dashboard View** - Project portfolio overview with metrics and Gantt chart
2. **Projects List** - Hierarchical project table with drag-and-drop
3. **Project Details** - Individual project deep dive
4. **Resource Gap Analysis** - Capacity planning visualization
5. **Financial Forecasting** - Revenue/cost projections

## Reference Apps Design System

### ai-adoption-dashboard

**Visual Identity:**
- Dark theme (#0b0b0b background, #121212 cards)
- Colorful accent colors for status/intensity
- Minimal, clean layout
- Focus on data density

**Key Patterns:**
```css
--background: #0b0b0b;
--card-bg: #121212;
--border: #2a2a2a;
--hover-bg: #1a1a1a;

/* Status colors */
--success: #22c55e;
--warning: #fbbf24;
--danger: #ef4444;
--info: #3b82f6;
```

**Components:**
- Metric cards with hover effects
- Table-first design
- Loading skeletons
- Engagement badges (heavy/moderate/light)
- Tool avatar stacks (overlapping circular avatars)

### ai-champions-tracker

**Visual Identity:**
- Same dark theme base
- Hybrid approach: minimal layout + colorful visualizations
- Focus on hierarchical data
- Coverage indicators (gauge, heatmap)

**Key Patterns:**
```css
/* Status Colors */
--confirmed: #22c55e;
--pending: #fbbf24;
--proposed: #3b82f6;
--gap: #ef4444;
```

**Components:**
- Coverage gauge
- Smart heatmap with hierarchy
- Tabs navigation
- Status badges
- Detail views with breadcrumbs

## Alignment Opportunities

### Design System Similarities

1. **Dark Theme Foundation**
   - Both reference apps use `#0b0b0b` background
   - Horizon uses OKLCH color space but similar values
   - Can standardize on reference app color palette

2. **Component Patterns**
   - Metric cards exist in all apps
   - Status badges pattern matches
   - Table-driven interfaces common

3. **Typography**
   - System font stack consistent
   - 14px base font size
   - Similar heading hierarchy

### Current Gaps

1. **Color Variables**
   - Horizon: OKLCH with HSL fallbacks
   - Reference: Simple hex/RGB values
   - **Gap:** Different color spaces, harder to maintain consistency

2. **Component Library Dependency**
   - Horizon: tr-workspace-components (external)
   - Reference: Pure CSS + minimal JS
   - **Gap:** External dependency may conflict with design system

3. **Spacing System**
   - Horizon: Tailwind default spacing
   - Reference: Custom CSS variables (--space-xs, --space-sm, etc.)
   - **Gap:** Different naming conventions

4. **Animation Patterns**
   - Horizon: Tailwind utilities
   - Reference: Custom keyframe animations
   - **Gap:** Inconsistent animation timing/easing

## Recommendations for Architecture Guardian

### Critical Questions

1. **Component Library Strategy**
   - Should we replace tr-workspace-components with custom components?
   - Can we theme tr-workspace-components to match reference apps?
   - What's the migration path?

2. **Color System**
   - Convert from OKLCH to hex/RGB for consistency?
   - Keep CSS variables but standardize names?
   - How to handle light/dark mode transitions?

3. **Tailwind Configuration**
   - Extend Tailwind theme to match reference app tokens?
   - Create custom utilities for reference app patterns?
   - Maintain Tailwind v4 or align with reference CSS approach?

4. **Component Reuse**
   - Which components should be extracted to shared library?
   - How to handle component variations (horizon vs reference)?
   - What's the component ownership model?

### Proposed Approach

**Option A: Minimal Disruption**
- Keep tr-workspace-components
- Add CSS variables layer matching reference apps
- Theme external components via globals.css
- Extract reference app CSS patterns as Tailwind plugins

**Option B: Full Alignment**
- Replace tr-workspace-components with custom components
- Adopt reference app CSS structure completely
- Create shared component library for all apps
- Standardize on single color/spacing system

**Option C: Hybrid Approach**
- Keep tr-workspace-components for complex components (Dialog, Dropdown)
- Replace simple components (Card, Button, Badge) with custom ones
- Merge color systems (keep variables but align values)
- Create design tokens file shared across apps

## Next Steps

1. **Architecture Guardian Review**
   - Choose alignment strategy
   - Identify shared components
   - Define migration sequence
   - Set design token standards

2. **Implementation Plan**
   - Component inventory and mapping
   - Create shared design system package
   - Migrate components incrementally
   - Update documentation

3. **Validation**
   - Visual regression testing
   - Accessibility audit
   - Performance benchmarks
   - Dark mode consistency check

---

## Files to Review

**Current Horizon:**
- `/frontend/src/app/globals.css` - Global styles and theme
- `/frontend/tailwind.config.js` - Tailwind configuration
- `/frontend/src/components/ui/metric-card.tsx` - Key UI component
- `/frontend/src/components/ui/status-badge.tsx` - Status component
- `/frontend/src/app/page.tsx` - Main dashboard

**Reference Apps:**
- `/ai-adoption-dashboard/frontend/src/styles/main.css` - Complete design system
- `/ai-champions-tracker/frontend/src/styles/main.css` - Variant design system

**Shared Patterns:**
- Tool avatar stacks
- Engagement/coverage badges
- Metric cards with hover states
- Loading skeletons
- Manager/hierarchy cards
