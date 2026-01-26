# Architecture Decision Record: Hybrid Design System Approach

**Date:** 2026-01-26
**Status:** Approved
**Decision Makers:** Architecture Guardian, Frontend Team
**Context:** Aligning Horizon app with reference apps (ai-adoption-dashboard, ai-champions-tracker)

---

## Decision

We will implement a **hybrid design system approach** that:
1. Retains tr-workspace-components for complex UI patterns
2. Replaces simple components with custom CSS implementations
3. Standardizes on hex-based color tokens (migrating from OKLCH)
4. Extracts reusable patterns from reference apps
5. Establishes shared design tokens across all apps

---

## Context

### Problem Statement

Horizon was built with a different design language than our reference apps:
- **Color System:** OKLCH color space vs. simple hex values
- **Component Library:** Heavy use of tr-workspace-components vs. minimal CSS
- **Visual Language:** Different card styles, spacing, and status colors
- **Consistency Gap:** Apps don't look like part of same product family

### Goals

1. **Visual Consistency:** All apps should share recognizable design language
2. **Development Velocity:** Easy to create new apps matching existing style
3. **Maintainability:** Changes to design tokens propagate across apps
4. **Component Reuse:** Extract proven patterns into shared library
5. **Low Risk:** Avoid breaking existing functionality

### Constraints

- Cannot break existing Horizon functionality
- Must maintain dark mode support
- Must preserve accessibility standards
- Limited time for full rewrite (2-3 weeks max)
- tr-workspace-components cannot be fully removed (Dialog, Dropdown still needed)

---

## Options Considered

### Option A: Minimal Disruption

**Approach:**
- Keep tr-workspace-components entirely
- Add CSS layer matching reference apps
- Theme external components via globals.css

**Pros:**
- ✅ Lowest risk (no component replacement)
- ✅ Fastest implementation (1 week)
- ✅ No breaking changes

**Cons:**
- ❌ External dependency for simple patterns
- ❌ Limited customization (fighting library defaults)
- ❌ Larger bundle size
- ❌ Doesn't match reference app architecture

**Verdict:** ❌ Rejected - Doesn't achieve consistency goals

### Option B: Full Alignment

**Approach:**
- Replace tr-workspace-components entirely
- Adopt reference app CSS structure completely
- Create shared component library for all apps

**Pros:**
- ✅ Perfect consistency with reference apps
- ✅ Full control over component behavior
- ✅ Smallest bundle size
- ✅ Best long-term maintainability

**Cons:**
- ❌ Highest risk (full rewrite)
- ❌ Longest timeline (4-6 weeks)
- ❌ Complex components (Dialog, Dropdown) require significant work
- ❌ Potential bugs in reimplemented components

**Verdict:** ❌ Rejected - Too risky, timeline too long

### Option C: Hybrid Approach ✅ **SELECTED**

**Approach:**
- Keep tr-workspace-components for complex UI (Dialog, Dropdown, Tooltip)
- Replace simple components (Card, Badge) with custom CSS
- Merge color systems (OKLCH → hex)
- Create shared design tokens
- Extract proven patterns incrementally

**Pros:**
- ✅ Balances consistency with pragmatism
- ✅ Reasonable timeline (2-3 weeks)
- ✅ Controlled risk (incremental migration)
- ✅ Achieves visual consistency
- ✅ Reduces bundle size (removes simple components)
- ✅ Easier to customize simple patterns

**Cons:**
- ⚠️ Mixed component approach (need clear guidelines)
- ⚠️ Still depends on tr-workspace for some components
- ⚠️ Requires theming tr-workspace components

**Verdict:** ✅ **Selected** - Best balance of benefits vs. risk

---

## Decision Details

### What We Keep (tr-workspace-components)

**Complex Components:**
- Dialog/Modal (focus trapping, portal rendering)
- Dropdown Menu (keyboard navigation, positioning)
- Tooltip (portal rendering, smart positioning)
- Progress (animated transitions)
- Tabs (accessibility, keyboard support)
- Toggle/Toggle Group (state management)
- Scroll Area (custom scrollbar styling)

**Rationale:**
- These components have complex behavior beyond styling
- Reimplementing would introduce bugs
- Library handles accessibility well
- Time investment not justified for consistency gains

### What We Replace

**Simple Components:**
- Card → CSS class `.metric-card`
- Badge → CSS class `.status-badge`
- Button → CSS class `.btn` (future phase)
- Checkbox → Custom React component (future phase)

**Rationale:**
- These are primarily styling concerns
- No complex state management or interactions
- Reference apps use pure CSS for these
- Better performance (no React overhead for styling)
- Easier to customize and maintain

### What We Extract

**New Patterns from Reference Apps:**
- Tool Avatar Stack (overlapping circular avatars)
- Loading Skeletons (shimmer effect placeholders)
- Engagement Badges (heavy/moderate/light)
- Manager Cards (hierarchical team display)
- Coverage Gauge (circular progress)
- Smart Heatmap (hierarchical data grid)

**Rationale:**
- Proven patterns used in production
- Reusable across multiple apps
- High visual impact (polished feel)
- Not available in tr-workspace-components

### Color System Migration

**From:** OKLCH color space with HSL fallbacks
**To:** Simple hex values

**Rationale:**

1. **Simplicity:** Hex values are universally understood
   - OKLCH: `oklch(0.145 0 0)` → obscure to most developers
   - Hex: `#0b0b0b` → immediately recognizable

2. **Reference App Alignment:** Both reference apps use hex
   - Consistency across codebase
   - Easier to copy-paste patterns

3. **Tool Support:** Better support in design tools
   - Figma, Sketch use hex by default
   - Color pickers output hex
   - Browser DevTools show hex

4. **Performance:** No color space conversion at runtime
   - Direct CSS application
   - Simpler for browser rendering

5. **Maintainability:** Easier to audit and update
   - Search/replace works reliably
   - No need to understand OKLCH math

**Migration Strategy:**
- Map OKLCH values to hex equivalents
- Keep both systems during transition
- Gradually remove OKLCH after full migration

---

## Consequences

### Positive

1. **Visual Consistency Achieved**
   - All apps share same color palette
   - Cards, badges, buttons look identical
   - Users recognize product family

2. **Developer Experience Improved**
   - Clear guidelines: "Use tr-workspace for X, custom CSS for Y"
   - Copy-paste patterns from reference apps work
   - Less decision fatigue

3. **Bundle Size Reduced**
   - Remove unused tr-workspace components (Card, Badge)
   - Estimated savings: 50KB gzipped

4. **Maintainability Enhanced**
   - Design token changes propagate via CSS variables
   - Status color update: 1 line change vs. 10+ files
   - Shared patterns reduce code duplication

5. **Performance Improved**
   - CSS-only components render faster
   - No React reconciliation for static styles
   - Smaller JavaScript bundle

### Negative

1. **Mixed Component Approach**
   - Developers must know when to use tr-workspace vs. custom
   - Risk of choosing wrong approach
   - **Mitigation:** Clear documentation, code review guidelines

2. **Continued External Dependency**
   - Still depend on tr-workspace-components
   - Library updates may break theming
   - **Mitigation:** Pin exact version, test updates carefully

3. **Theming Complexity**
   - Must override tr-workspace defaults via CSS
   - May need `!important` for specificity
   - **Mitigation:** Document theming patterns, provide examples

4. **Initial Migration Effort**
   - 2-3 weeks of focused development
   - Risk of visual regressions
   - **Mitigation:** Incremental phases, manual testing after each

5. **Training Required**
   - Team must learn new component patterns
   - Transition period confusion
   - **Mitigation:** Quick-start guide, pair programming

### Neutral

1. **Shared Component Library (Future)**
   - Opportunity to extract to npm package later
   - Decision deferred until after Phase 4
   - Re-evaluate based on actual reuse across apps

2. **Tailwind vs. CSS Debate**
   - Hybrid approach uses both
   - Some utility classes, some custom CSS
   - Pragmatic rather than purist

---

## Implementation Risks

### Risk 1: Visual Regressions

**Probability:** Medium
**Impact:** High

**Scenarios:**
- Colors don't match exactly (off by few shades)
- Hover effects broken
- Dark mode inconsistencies
- Layout shifts during migration

**Mitigation:**
- Manual visual testing after each phase
- Side-by-side comparison with reference apps
- Screenshot diffing (manual, since no automated tool)
- Incremental rollout (easy to rollback per-phase)

### Risk 2: tr-workspace Version Conflicts

**Probability:** Low
**Impact:** Medium

**Scenarios:**
- Library update changes component structure
- Theming overrides stop working
- New version breaks dark mode

**Mitigation:**
- Pin exact version in package.json
- Test updates in separate branch before merging
- Document which library features we depend on
- Monitor library changelog for breaking changes

### Risk 3: Developer Confusion

**Probability:** High (during transition)
**Impact:** Low

**Scenarios:**
- Mix old and new patterns in same file
- Use tr-workspace when should use custom
- Forget to remove old imports

**Mitigation:**
- Clear quick-start guide
- Code review checklist
- Pair programming during early migration
- ESLint rules to prevent wrong component usage (future)

### Risk 4: Performance Regression

**Probability:** Low
**Impact:** High

**Scenarios:**
- CSS animations cause jank
- Bundle size increases unexpectedly
- Loading skeletons impact metrics

**Mitigation:**
- Benchmark before/after each phase
- Monitor FCP, LCP metrics
- Use Chrome DevTools Performance panel
- Rollback if metrics degrade >10%

---

## Success Criteria

### Quantitative (Must Achieve)

- [ ] **Visual Consistency:** 90%+ of UI elements use shared design tokens
- [ ] **Bundle Size:** Reduce by ≥50KB (remove unused components)
- [ ] **Performance:** No regression in FCP/LCP (within 5% tolerance)
- [ ] **Accessibility:** Maintain WCAG AA compliance (4.5:1 contrast)

### Qualitative (Aspirational)

- [ ] **Developer Feedback:** "It's obvious which component to use"
- [ ] **Design Feedback:** "Apps look like same product family"
- [ ] **Code Quality:** "Adding new status color takes <1 minute"
- [ ] **Maintainability:** "Design changes propagate automatically"

---

## Alternatives Rejected

### Why Not Shadcn/UI?

**Considered:** Replace tr-workspace with shadcn/ui component library

**Rejected Because:**
- Still external dependency (just different one)
- Requires significant migration effort (same as Option B)
- Reference apps don't use it (creates new inconsistency)
- Adds another styling approach to learn
- Not obviously better than our hybrid approach

### Why Not Full CSS-in-JS?

**Considered:** Use styled-components or emotion for all styling

**Rejected Because:**
- Reference apps use CSS files (would create new inconsistency)
- Adds runtime overhead for style injection
- Larger JavaScript bundle
- Team already knows CSS + Tailwind
- Doesn't solve consistency problem (just moves it)

### Why Not Keep Everything as-is?

**Considered:** Accept visual inconsistency, focus on features

**Rejected Because:**
- User confusion (apps don't look related)
- Lost efficiency (can't reuse patterns)
- Design drift over time (gets worse, not better)
- Professional perception (looks unpolished)
- Strategic direction is toward unified product suite

---

## Lessons Learned (Post-Implementation)

**Note:** This section will be updated after Phase 4 completion.

### What Went Well
- TBD

### What Could Be Improved
- TBD

### Would We Make Same Decision Again?
- TBD

---

## Related Documents

- **Implementation Plan:** `HYBRID-DESIGN-SYSTEM-IMPLEMENTATION.md`
- **Quick Start Guide:** `DESIGN-SYSTEM-QUICK-START.md`
- **Architecture Analysis:** `ARCHITECTURE-ANALYSIS.md`
- **Reference Apps:**
  - `/05-shared/apps/ai-adoption-dashboard/frontend/src/styles/main.css`
  - `/05-shared/apps/ai-champions-tracker/frontend/src/styles/main.css`

---

## Approval

**Decision Approved By:** Architecture Guardian
**Date:** 2026-01-26
**Review Date:** After Phase 4 completion (estimate: 2026-02-15)

**Signatures:**
- Architecture Guardian: [Pending]
- Frontend Lead: [Pending]
- Product Owner: [Pending]

---

## Change Log

| Date | Author | Change | Reason |
|------|--------|--------|--------|
| 2026-01-26 | Architecture Guardian | Initial decision | Document hybrid approach selection |

---

**Status:** ✅ Ready for Implementation (Phase 1)
