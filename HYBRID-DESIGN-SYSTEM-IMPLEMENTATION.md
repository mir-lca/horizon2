# Horizon - Hybrid Design System Implementation Plan

**Date:** 2026-01-26
**Strategy:** Option C - Hybrid Approach
**Purpose:** Concrete implementation guidance for aligning Horizon with reference apps design language

---

## Executive Summary

This plan implements a **hybrid approach** that balances consistency with pragmatism:
- **Keep** tr-workspace-components for complex components (Dialog, Dropdown, Tooltip)
- **Replace** simple components with custom implementations matching reference apps
- **Merge** color systems (OKLCH → hex for consistency)
- **Create** shared design tokens across all apps
- **Extract** reusable patterns from reference apps

**Timeline:** 4 phases over 2-3 weeks
**Risk Level:** Low (incremental migration, no breaking changes)

---

## 1. Design Token Mapping

### 1.1 Color System Transformation

**Current State (Horizon):**
- OKLCH color space with HSL fallbacks
- 15+ semantic color tokens
- Complex dark mode overrides

**Target State (Reference Apps):**
- Simple hex values
- 6 core semantic tokens + status colors
- Direct color mapping

**Migration Map:**

```css
/* OKLCH (Horizon Current) → HEX (Reference Standard) */

/* Core Backgrounds */
--background: oklch(0.145 0 0)           → #0b0b0b
--card: oklch(0.145 0 0)                 → #121212
--hover-bg: [not defined]                → #1a1a1a

/* Foreground & Text */
--foreground: oklch(0.985 0.003 240)     → #f5f5f5
--muted-foreground: oklch(0.7 0.02 260)  → #a3a3a3
--subtle: [not defined]                  → #6b6b6b

/* Borders */
--border: oklch(0.2 0 0)                 → #2a2a2a
--input: oklch(0.2 0 0)                  → #2a2a2a

/* Status Colors (New) */
--success: [derived from chart-2]        → #22c55e
--warning: [derived from chart-4]        → #fbbf24
--danger: oklch(0.6 0.2 25)             → #ef4444
--info: [derived from primary]           → #3b82f6

/* Intensity Levels (for badges/charts) */
--intensity-heavy: [new]                 → #22c55e
--intensity-moderate: [new]              → #fbbf24
--intensity-light: [new]                 → #3b82f6
```

### 1.2 Spacing System

**Current State:** Tailwind defaults (0.25rem increments)
**Target State:** Explicit CSS variables

```css
/* Reference Apps Standard */
--space-xs: 4px    (0.25rem)
--space-sm: 8px    (0.5rem)
--space-md: 16px   (1rem)
--space-lg: 24px   (1.5rem)
--space-xl: 32px   (2rem)
```

**Implementation:** Extend Tailwind theme with custom spacing scale

### 1.3 Border Radius

**Current State:** `--radius: 0.625rem` (10px)
**Target State:** Explicit sizes

```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
```

### 1.4 Typography

**Current State:** Inter font, Tailwind defaults
**Target State:** System font stack + explicit sizes

```css
/* Font Family */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'SF Pro Text', system-ui, sans-serif;

/* Font Sizes */
--font-xs: 11px
--font-sm: 12px
--font-base: 14px
--font-lg: 16px
--font-xl: 18px
--font-2xl: 22px
--font-3xl: 28px
--font-4xl: 32px
```

---

## 2. Component Classification

### 2.1 Keep (tr-workspace-components)

**Complex Components - Continue Using:**

| Component | Reason | Usage in Horizon |
|-----------|--------|------------------|
| Dialog/Modal | Complex state management, focus trapping | Project creation, edit forms |
| Dropdown Menu | Keyboard navigation, positioning | User menu, context menus |
| Tooltip | Portal rendering, positioning logic | Metric card tooltips |
| Progress | Animated transitions | File upload, loading states |
| Tabs | Accessibility, keyboard support | Resource views |
| Toggle/Toggle Group | State management | View toggles |
| Scroll Area | Custom scrollbar styling | Gantt chart, long lists |

**Action:** Theme these components via CSS overrides in globals.css

### 2.2 Replace (Custom Implementation)

**Simple Components - Replace with Custom:**

| Component | Current (tr-workspace) | Replacement | Priority |
|-----------|----------------------|-------------|----------|
| Card | `<Card><CardContent>` | `.metric-card` CSS class | P0 |
| Badge | `<Badge variant>` | `.status-badge` CSS class | P0 |
| Button | `<Button variant>` | `.btn` CSS class | P1 |
| Checkbox | `<Checkbox>` | Custom React component | P2 |
| Loading Skeleton | Not in tr-workspace | `.skeleton-card` CSS | P1 |

**Why Replace:**
- Cards/Badges are styling-only (no complex behavior)
- Reference apps use pure CSS for these
- Eliminates external dependency for simple patterns
- Better performance (no React overhead)

### 2.3 New Components from Reference Apps

**Extract and Adapt:**

| Component | Source | Purpose | Files |
|-----------|--------|---------|-------|
| Tool Avatar Stack | ai-adoption-dashboard | Display overlapping tool icons | `.tool-avatar-stack` |
| Engagement Badges | ai-adoption-dashboard | Heavy/Moderate/Light indicators | `.engagement-badge` |
| Manager Cards | ai-adoption-dashboard | Hierarchical team display | `.manager-card` |
| Coverage Gauge | ai-champions-tracker | Circular progress indicator | `.gauge` |
| Smart Heatmap | ai-champions-tracker | Hierarchical data grid | `.smart-heatmap` |
| Loading Skeletons | Both apps | Placeholder during data load | `.skeleton-*` |

---

## 3. Migration Sequence (Phases)

### Phase 1: Foundation (Days 1-3)

**Goal:** Establish new design tokens without breaking existing UI

**Tasks:**
1. Create `design-tokens.css` file with hex color mappings
2. Add custom spacing/radius variables to Tailwind config
3. Import design tokens into `globals.css` (after existing styles)
4. Verify no visual regressions (colors still work via OKLCH fallbacks)

**Deliverables:**
- `/frontend/src/styles/design-tokens.css`
- Updated `/frontend/tailwind.config.js`
- Updated `/frontend/src/app/globals.css`

**Validation:**
- Dark mode works correctly
- All colors render as before
- No console errors

### Phase 2: Simple Components (Days 4-7)

**Goal:** Replace Card and Badge with CSS-only implementations

**Tasks:**
1. Create `.metric-card` CSS class matching reference apps
2. Create `.status-badge` CSS classes for different types
3. Add `.loading-skeleton` styles
4. Create migration guide for developers
5. Update 2-3 pages as proof of concept

**Component Replacement Order:**
1. **MetricCard** (`/components/ui/metric-card.tsx`)
   - Convert from `<Card><CardContent>` to `<div className="metric-card">`
   - Add hover effects matching reference apps
   - Keep existing props interface for backward compatibility

2. **StatusBadge** (`/components/ui/status-badge.tsx`)
   - Convert from `<Badge variant>` to `<span className="status-badge">`
   - Maintain same color mappings (green=success, yellow=warning, etc.)
   - Keep icon support

**Deliverables:**
- `/frontend/src/styles/components.css` (new file)
- Updated `metric-card.tsx` and `status-badge.tsx`
- Migration example on dashboard page

**Validation:**
- All metric cards render correctly
- Hover effects work
- Badge colors match semantic meanings

### Phase 3: Pattern Extraction (Days 8-12)

**Goal:** Extract and integrate reusable patterns from reference apps

**Tasks:**
1. Extract Tool Avatar Stack pattern
2. Extract Loading Skeleton pattern
3. Create component documentation
4. Apply patterns to relevant Horizon pages

**New Components:**

**A. Tool Avatar Stack**
```typescript
// /frontend/src/components/ui/tool-avatar-stack.tsx
interface ToolAvatarStackProps {
  tools: Array<{ name: string; icon: string }>;
  maxVisible?: number;
}
```

**B. Loading Skeleton**
```typescript
// /frontend/src/components/ui/loading-skeleton.tsx
interface LoadingSkeletonProps {
  variant: 'card' | 'table' | 'chart';
  count?: number;
}
```

**Integration Points:**
- Dashboard metrics → Use loading skeletons
- Project list → Use loading skeletons
- Resource allocation → Use avatar stacks (if tools shown)

**Deliverables:**
- `tool-avatar-stack.tsx` component
- `loading-skeleton.tsx` component
- Updated pages using new patterns

**Validation:**
- Patterns match reference app aesthetics
- Loading states feel polished
- Avatar stacking works with 1-5 items

### Phase 4: Cleanup & Documentation (Days 13-15)

**Goal:** Finalize migration, remove dead code, document system

**Tasks:**
1. Remove unused tr-workspace-components imports
2. Update package.json (keep only needed components)
3. Create design system documentation
4. Document theming guidelines for tr-workspace components
5. Add Storybook examples (optional)

**Cleanup Targets:**
- Remove unused Card/Badge imports
- Simplify globals.css (remove OKLCH variables after full migration)
- Update ESLint rules to prevent tr-workspace usage for replaced components

**Documentation:**
- `/frontend/docs/DESIGN-SYSTEM.md` - Component usage guide
- `/frontend/docs/THEMING.md` - How to theme tr-workspace components
- `/frontend/docs/MIGRATION.md` - Before/after examples

**Deliverables:**
- Updated `package.json`
- Design system documentation
- Migration complete checklist

**Validation:**
- No unused dependencies
- Documentation complete
- All pages use new system consistently

---

## 4. Shared Component Architecture

### 4.1 Where Shared Components Should Live

**Current State:** Each app has its own component library
**Proposed Architecture:**

```
05-shared/apps/
├── _shared/                          # NEW: Shared design system
│   ├── design-tokens.css            # Core CSS variables
│   ├── components/                  # Reusable components
│   │   ├── tool-avatar-stack/
│   │   ├── loading-skeleton/
│   │   ├── metric-card/
│   │   ├── status-badge/
│   │   └── coverage-gauge/
│   └── README.md                    # Usage documentation
│
├── horizon/
│   └── frontend/
│       └── src/
│           └── styles/
│               └── design-tokens.css  # Symlink to _shared/design-tokens.css
│
├── ai-adoption-dashboard/
│   └── frontend/
│       └── src/
│           └── styles/
│               └── design-tokens.css  # Symlink to _shared/design-tokens.css
│
└── ai-champions-tracker/
    └── frontend/
        └── src/
            └── styles/
                └── design-tokens.css  # Symlink to _shared/design-tokens.css
```

### 4.2 Component Ownership Model

**Principle:** Progressive extraction, not premature abstraction

**Decision Tree:**
```
Is component used in 2+ apps?
├─ No → Keep in individual app
└─ Yes → Is it stable (no recent changes)?
    ├─ No → Keep separate, sync manually
    └─ Yes → Extract to _shared/
```

**Phase 1-3:** Keep components in individual apps
**Phase 4:** Extract proven patterns to `_shared/` if used in 2+ apps

### 4.3 Sharing Strategy

**Option A: CSS-Only Sharing (Recommended for Phase 1-3)**
- Share only `design-tokens.css`
- Each app implements components independently
- Lower coupling, easier to customize

**Option B: Component Library (Future)**
- Create npm package: `@teradyne/shared-components`
- Publish internally
- Versioned releases

**Recommendation:** Start with Option A, evaluate Option B after Phase 4

---

## 5. Implementation Guidelines

### 5.1 Color Usage Rules

**Semantic Color Mapping:**

| Use Case | Token | Hex Value | When to Use |
|----------|-------|-----------|-------------|
| Success/Confirmed | `--success` | `#22c55e` | Completed status, positive metrics |
| Warning/Pending | `--warning` | `#fbbf24` | In-progress, needs attention |
| Danger/Gap | `--danger` | `#ef4444` | Errors, critical issues |
| Info/Proposed | `--info` | `#3b82f6` | Informational, future plans |

**Status Badge Colors:**
- Funded → Orange (`#fb923c`)
- Active → Green (`--success`)
- Completed → Blue (`--info`)
- Unfunded → Gray (`#737373`)

### 5.2 Component Theming (tr-workspace)

**How to Theme tr-workspace Components:**

```css
/* globals.css - Override tr-workspace defaults */

/* Dialog theming */
.tr-dialog {
  --dialog-bg: var(--card-bg);
  --dialog-border: var(--border);
}

/* Button theming */
.tr-button-primary {
  background-color: var(--info) !important;
}

/* Tooltip theming */
.tr-tooltip {
  background: var(--card-bg);
  border: 1px solid var(--border);
  color: var(--foreground);
}
```

### 5.3 Migration Pattern

**Before (tr-workspace):**
```tsx
import { Card, CardContent } from "tr-workspace-components";

<Card className="hover:shadow-lg">
  <CardContent className="p-3">
    <p className="text-xs text-muted-foreground">{title}</p>
    <div className="text-lg font-bold">{value}</div>
  </CardContent>
</Card>
```

**After (Custom CSS):**
```tsx
// No imports needed

<div className="metric-card">
  <p className="metric-label">{title}</p>
  <div className="metric-value">{value}</div>
</div>
```

**CSS Definition:**
```css
.metric-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.metric-card:hover {
  border-color: #3a3a3a;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
}
```

---

## 6. Testing & Validation

### 6.1 Visual Regression Testing

**Manual Checklist:**
- [ ] Dashboard renders correctly (light + dark mode)
- [ ] Project list cards match reference aesthetics
- [ ] Status badges use correct colors
- [ ] Hover effects work smoothly
- [ ] Loading skeletons animate properly
- [ ] No layout shifts during page load

**Screenshots to Compare:**
- Before: Current Horizon dashboard
- After: Updated dashboard with new design tokens
- Reference: ai-adoption-dashboard for comparison

### 6.2 Performance Benchmarks

**Metrics to Track:**
- Bundle size (should decrease after removing unused tr-workspace components)
- First Contentful Paint (should stay same or improve)
- Largest Contentful Paint (should stay same or improve)

**Target:** No performance regression, ideally 5-10% improvement

### 6.3 Accessibility Audit

**Verify:**
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text)
- [ ] Focus states visible on interactive elements
- [ ] Keyboard navigation works for all components
- [ ] Screen reader announces status badges correctly

---

## 7. Risk Mitigation

### 7.1 Identified Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Visual regressions | High | Medium | Manual testing after each phase |
| tr-workspace version conflicts | Medium | Low | Pin exact version, test updates carefully |
| Missing edge cases | Medium | Medium | Incremental rollout, keep old code for 1 sprint |
| Team confusion during transition | Low | High | Clear documentation, migration guide |
| Performance degradation | High | Low | Benchmark before/after |

### 7.2 Rollback Strategy

**Per-Phase Rollback:**
- Phase 1: Revert globals.css and tailwind.config.js
- Phase 2: Revert component files, restore tr-workspace imports
- Phase 3: Remove new pattern components
- Phase 4: Restore package.json

**Git Strategy:** One feature branch per phase, merge after validation

---

## 8. Success Metrics

### 8.1 Quantitative Goals

- **Design Consistency:** 90%+ of UI elements use shared design tokens
- **Bundle Size:** Reduce by 50KB (remove unused tr-workspace code)
- **Code Duplication:** Eliminate Card/Badge duplication across apps
- **Component Reuse:** 5+ patterns extracted and reused

### 8.2 Qualitative Goals

- **Developer Experience:** "It's obvious which component to use"
- **Visual Consistency:** "Horizon looks like it's part of the same product family"
- **Maintainability:** "Adding a new status color takes 30 seconds, not 30 minutes"

---

## 9. Next Steps

### For Architecture Guardian:
1. ✅ Review and approve this plan
2. Define shared component directory structure
3. Prioritize phases based on team capacity
4. Identify risks or concerns

### For Frontend Developer:
1. **Start Phase 1:** Create design-tokens.css
2. Set up feature branch: `feature/hybrid-design-system`
3. Implement token mapping
4. Run validation tests
5. Request code review before Phase 2

---

## 10. Reference Files

### Files to Create:
- `/frontend/src/styles/design-tokens.css`
- `/frontend/src/styles/components.css`
- `/frontend/src/components/ui/tool-avatar-stack.tsx`
- `/frontend/src/components/ui/loading-skeleton.tsx`
- `/frontend/docs/DESIGN-SYSTEM.md`

### Files to Modify:
- `/frontend/src/app/globals.css`
- `/frontend/tailwind.config.js`
- `/frontend/src/components/ui/metric-card.tsx`
- `/frontend/src/components/ui/status-badge.tsx`
- `/frontend/package.json`

### Files to Reference:
- `/05-shared/apps/ai-adoption-dashboard/frontend/src/styles/main.css`
- `/05-shared/apps/ai-champions-tracker/frontend/src/styles/main.css`

---

## Appendix A: Design Token File

**File:** `/frontend/src/styles/design-tokens.css`

```css
/**
 * Shared Design Tokens
 * Source: Reference apps (ai-adoption-dashboard, ai-champions-tracker)
 * Usage: Import in globals.css
 */

:root {
  /* ============================================
     COLORS - Dark Theme
     ============================================ */

  /* Core Backgrounds */
  --background: #0b0b0b;
  --card-bg: #121212;
  --hover-bg: #1a1a1a;

  /* Foreground & Text */
  --foreground: #f5f5f5;
  --muted: #a3a3a3;
  --subtle: #6b6b6b;

  /* Borders */
  --border: #2a2a2a;
  --input: #2a2a2a;

  /* Status Colors */
  --success: #22c55e;
  --warning: #fbbf24;
  --danger: #ef4444;
  --info: #3b82f6;

  /* Intensity Levels (for charts, badges) */
  --intensity-heavy: #22c55e;
  --intensity-moderate: #fbbf24;
  --intensity-light: #3b82f6;

  /* ============================================
     SPACING
     ============================================ */
  --space-xs: 0.25rem;  /* 4px */
  --space-sm: 0.5rem;   /* 8px */
  --space-md: 1rem;     /* 16px */
  --space-lg: 1.5rem;   /* 24px */
  --space-xl: 2rem;     /* 32px */

  /* ============================================
     BORDER RADIUS
     ============================================ */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* ============================================
     TYPOGRAPHY
     ============================================ */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter',
               'SF Pro Text', system-ui, sans-serif;
  --font-xs: 11px;
  --font-sm: 12px;
  --font-base: 14px;
  --font-lg: 16px;
  --font-xl: 18px;
  --font-2xl: 22px;
  --font-3xl: 28px;
  --font-4xl: 32px;
}
```

---

## Appendix B: Component CSS Examples

**File:** `/frontend/src/styles/components.css`

```css
/* ============================================
   METRIC CARD
   ============================================ */

.metric-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.metric-card:hover {
  border-color: #3a3a3a;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
}

.metric-label {
  font-size: var(--font-sm);
  text-transform: uppercase;
  color: var(--muted);
  letter-spacing: 0.5px;
  margin-bottom: var(--space-xs);
}

.metric-value {
  font-size: var(--font-4xl);
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: var(--space-xs);
}

.metric-subtitle {
  font-size: var(--font-base);
  color: var(--muted);
}

/* ============================================
   STATUS BADGES
   ============================================ */

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: var(--font-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.status-badge.success {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
}

.status-badge.warning {
  background: rgba(251, 191, 36, 0.1);
  color: var(--warning);
}

.status-badge.danger {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.status-badge.info {
  background: rgba(59, 130, 246, 0.1);
  color: var(--info);
}

/* ============================================
   LOADING SKELETON
   ============================================ */

.skeleton-card,
.skeleton-table,
.skeleton-chart {
  background: linear-gradient(90deg, #141414 25%, #1f1f1f 37%, #141414 63%);
  background-size: 400% 100%;
  border: 1px solid #242424;
  border-radius: var(--radius-md);
  animation: shimmer 1.4s ease infinite;
}

.skeleton-card {
  height: 78px;
}

.skeleton-table {
  height: 320px;
}

.skeleton-chart {
  height: 280px;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
```

---

**End of Implementation Plan**
