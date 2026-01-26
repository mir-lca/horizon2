# Horizon Design System - Quick Start Guide

**For Frontend Developers**
**Last Updated:** 2026-01-26

---

## TL;DR

**What we're doing:** Aligning Horizon's design with ai-adoption-dashboard and ai-champions-tracker using a hybrid approach.

**What's changing:**
- ✅ Keep: tr-workspace-components for complex UI (Dialog, Dropdown, Tooltip)
- ❌ Replace: Simple components (Card, Badge) with custom CSS
- 🎨 Standardize: Colors from OKLCH → hex values
- 📦 Extract: Reusable patterns from reference apps

**Timeline:** 4 phases, 2-3 weeks

---

## Phase 1: Design Tokens (Start Here)

### Step 1: Create Design Tokens File

Create `/frontend/src/styles/design-tokens.css`:

```css
:root {
  /* Colors */
  --background: #0b0b0b;
  --card-bg: #121212;
  --hover-bg: #1a1a1a;
  --foreground: #f5f5f5;
  --muted: #a3a3a3;
  --border: #2a2a2a;

  /* Status */
  --success: #22c55e;
  --warning: #fbbf24;
  --danger: #ef4444;
  --info: #3b82f6;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### Step 2: Import in globals.css

Add to `/frontend/src/app/globals.css` (after existing imports):

```css
@import "../styles/design-tokens.css";
```

### Step 3: Update Tailwind Config

Extend `/frontend/tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      spacing: {
        'xs': 'var(--space-xs)',
        'sm': 'var(--space-sm)',
        'md': 'var(--space-md)',
        'lg': 'var(--space-lg)',
        'xl': 'var(--space-xl)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
      },
    },
  },
};
```

### Validation

```bash
npm run dev
# Check: Dashboard loads, colors look correct, no console errors
```

---

## Phase 2: Replace Simple Components

### MetricCard Migration

**Before:**
```tsx
import { Card, CardContent } from "tr-workspace-components";

<Card>
  <CardContent className="p-3 space-y-1">
    <p className="text-xs text-muted-foreground">{title}</p>
    <div className="text-lg font-bold">{value}</div>
  </CardContent>
</Card>
```

**After:**
```tsx
<div className="metric-card">
  <p className="metric-label">{title}</p>
  <div className="metric-value">{value}</div>
</div>
```

**CSS:** Add to `/frontend/src/styles/components.css`:

```css
.metric-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  transition: all 0.2s ease;
}

.metric-card:hover {
  border-color: #3a3a3a;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
}
```

### StatusBadge Migration

**Before:**
```tsx
import { Badge } from "tr-workspace-components";

<Badge variant="success">{status}</Badge>
```

**After:**
```tsx
<span className="status-badge success">{status}</span>
```

**CSS:**
```css
.status-badge {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.success {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
}

.status-badge.warning {
  background: rgba(251, 191, 36, 0.1);
  color: var(--warning);
}
```

---

## Phase 3: Add New Patterns

### Loading Skeleton

Create `/frontend/src/components/ui/loading-skeleton.tsx`:

```tsx
interface LoadingSkeletonProps {
  variant: 'card' | 'table' | 'chart';
  count?: number;
}

export function LoadingSkeleton({ variant, count = 1 }: LoadingSkeletonProps) {
  return (
    <div className="loading-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton-${variant}`} />
      ))}
    </div>
  );
}
```

**CSS:**
```css
.skeleton-card {
  height: 78px;
  background: linear-gradient(90deg, #141414 25%, #1f1f1f 37%, #141414 63%);
  background-size: 400% 100%;
  border-radius: var(--radius-md);
  animation: shimmer 1.4s ease infinite;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
```

---

## Quick Reference

### When to Use What

| Component | Use | Don't Use |
|-----------|-----|-----------|
| **tr-workspace** | Dialog, Dropdown, Tooltip, Progress | Card, Badge, Button |
| **Custom CSS** | Card, Badge, Button, Skeleton | Complex interactions |
| **Custom React** | Tool Avatar Stack, Coverage Gauge | Simple styling-only |

### Color Tokens

```css
/* Backgrounds */
--background: #0b0b0b;    /* Page background */
--card-bg: #121212;       /* Card/panel background */
--hover-bg: #1a1a1a;      /* Hover states */

/* Text */
--foreground: #f5f5f5;    /* Primary text */
--muted: #a3a3a3;         /* Secondary text */

/* Status */
--success: #22c55e;       /* Green - completed, confirmed */
--warning: #fbbf24;       /* Yellow - pending, in-progress */
--danger: #ef4444;        /* Red - error, critical */
--info: #3b82f6;          /* Blue - informational */
```

### Common Patterns

**Hover Effect (Cards):**
```css
transition: all 0.2s ease;
```
```css
:hover {
  border-color: #3a3a3a;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
}
```

**Status Badge Colors:**
```css
background: rgba(34, 197, 94, 0.1);  /* 10% opacity of status color */
color: var(--success);               /* Solid status color */
```

**Loading Animation:**
```css
animation: shimmer 1.4s ease infinite;
```

---

## Checklist

### Phase 1 Complete When:
- [ ] design-tokens.css created
- [ ] Imported in globals.css
- [ ] Tailwind config updated
- [ ] Dark mode works
- [ ] No console errors

### Phase 2 Complete When:
- [ ] components.css created
- [ ] MetricCard migrated (at least 1 example)
- [ ] StatusBadge migrated (at least 1 example)
- [ ] Old tr-workspace imports removed from migrated files
- [ ] Visual comparison matches reference apps

### Phase 3 Complete When:
- [ ] LoadingSkeleton component created
- [ ] Applied to 2+ loading states
- [ ] Tool Avatar Stack component created (if needed)
- [ ] Patterns documented

### Phase 4 Complete When:
- [ ] All simple components migrated
- [ ] package.json updated (unused deps removed)
- [ ] Documentation complete
- [ ] Code review approved

---

## Troubleshooting

**Colors not changing:**
- Check import order in globals.css (design-tokens should come after tailwind imports)
- Verify CSS variable syntax: `var(--token-name)`
- Check browser DevTools: Variables should appear in :root

**Hover effects not working:**
- Add `transition` property
- Check z-index (shadows may be hidden)
- Verify parent container doesn't have `overflow: hidden`

**tr-workspace components look wrong:**
- Theme them in globals.css with CSS overrides
- Use `!important` if needed (library styles are specific)

**Build errors after migration:**
- Remove unused imports
- Check for missing CSS files in imports
- Verify component props match new interface

---

## Need Help?

1. **Reference Apps:** Compare with `/05-shared/apps/ai-adoption-dashboard/` and `/ai-champions-tracker/`
2. **Full Guide:** See `HYBRID-DESIGN-SYSTEM-IMPLEMENTATION.md`
3. **Architecture Decisions:** See `ARCHITECTURE-ANALYSIS.md`

---

## Example Component: Full Migration

**File:** `/frontend/src/components/ui/metric-card.tsx`

**Before (tr-workspace):**
```tsx
import { Card, CardContent } from "tr-workspace-components";
import { cn } from "@/lib/utils";

export function MetricCard({ title, value, className }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-3 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <div className="text-lg font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
```

**After (Custom CSS):**
```tsx
import { cn } from "@/lib/utils";

export function MetricCard({ title, value, className }) {
  return (
    <div className={cn("metric-card", className)}>
      <p className="metric-label">{title}</p>
      <div className="metric-value">{value}</div>
    </div>
  );
}
```

**CSS (components.css):**
```css
.metric-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  transition: all 0.2s ease;
}

.metric-card:hover {
  border-color: #3a3a3a;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
}

.metric-label {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--muted);
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--foreground);
}
```

**Result:** 50% less code, better performance, easier to customize

---

**Ready to start? Begin with Phase 1!**
