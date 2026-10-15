# TESA Website Completion Plan

## Executive Summary

The codebase is **~90% complete**. All major components are built and functional. The remaining work is **integration and validation**: adding 3 missing sections to the homepage, running typecheck/build validation, and verifying end-to-end data flow.

---

## Current State Analysis

### ✅ Fully Implemented (13/16 major components)

| Component | Status | Location |
|-----------|--------|----------|
| Navbar (sticky pill, Google Auth) | ✅ Done | `components/Navbar.tsx` |
| ParallaxHero (3D text, 3 tilt cards) | ✅ Done | `components/ParallaxHero.tsx` |
| MouseTiltCard (cursor-tracked 3D tilt) | ✅ Done | `components/MouseTiltCard.tsx` |
| Textile3DCenterpiece (purple gradient, canvas) | ✅ Done | `components/Textile3DCenterpiece.tsx` |
| TextileCanvas (80×80 cloth sim, MeshPhysicalMaterial) | ✅ Done | `components/TextileCanvas.tsx` |
| DepartmentEventsGrid (masonry, spotlight hover) | ✅ Done | `components/DepartmentEventsGrid.tsx` |
| PastEventsSection (filterable, detail modals) | ✅ Done | `components/PastEventsSection.tsx` |
| DepartmentOverviewSection (faculty, staff, labs, curriculum) | ✅ Done | `components/DepartmentOverviewSection.tsx` |
| TesaTeamSection (3D scroll parallax, category filters) | ✅ Done | `components/TesaTeamSection.tsx` |
| EventRegistrationModal (Firestore + localStorage) | ✅ Done | `components/EventRegistrationModal.tsx` |
| Admin Layout (Auth guard, redirect) | ✅ Done | `app/admin/layout.tsx` |
| Admin Dashboard (3 tabs: events, content, registrations) | ✅ Done | `app/admin/page.tsx` |
| Firebase Client/Admin Config | ✅ Done | `lib/firebase.js`, `lib/firebase-admin.js` |

### ❌ Missing Integration (3 components exist but not rendered)

| Component | Required Location | Action |
|-----------|-------------------|--------|
| `TesaTeamSection` | Homepage (`app/page.tsx`) | Add import + render between Hero and Centerpiece |
| `DepartmentOverviewSection` | Homepage (`app/page.tsx`) | Add import + render after Centerpiece |
| `PastEventsSection` | Homepage (`app/page.tsx`) | Add import + render before Footer |

### 🔍 Validation Required

| Check | Command | Status |
|-------|---------|--------|
| TypeScript strict mode | `npx tsc --noEmit` | ⏳ Pending |
| Production build | `npm run build` | ⏳ Pending |
| End-to-end registration flow | Manual test | ⏳ Pending |

---

## Implementation Tasks

### Phase 1: Homepage Integration (30 min)

**File:** `app/page.tsx`

Add three missing sections in correct visual order:

1. **After ParallaxHero** → `TesaTeamSection` (Team with 3D scroll)
2. **After Textile3DCenterpiece** → `DepartmentOverviewSection` (Faculty, Staff, Labs, Curriculum)
3. **Before Footer** → `PastEventsSection` (Event archives with filters)

```tsx
// Add imports
import TesaTeamSection from "@/components/TesaTeamSection";
import DepartmentOverviewSection from "@/components/DepartmentOverviewSection";
import PastEventsSection from "@/components/PastEventsSection";

// In JSX, after <ParallaxHero />:
<TesaTeamSection />

// After <Textile3DCenterpiece />:
<DepartmentOverviewSection />

// Before Footer:
<PastEventsSection />
```

### Phase 2: TypeScript Validation (15 min)

Run strict typecheck and fix any errors:

```bash
npx tsc --noEmit
```

Expected issues to watch for:
- Framer Motion `useTransform` template literal types
- Firebase `serverTimestamp()` type narrowing
- Three.js `THREE.MeshPhysicalMaterial` props

### Phase 3: Production Build (15 min)

```bash
npm run build
```

Verify:
- `/` (homepage) prerenders statically
- `/admin` builds correctly (dynamic due to auth)
- No dynamic segment errors
- No missing module errors

### Phase 4: End-to-End Verification (15 min)

1. Start dev server: `npm run dev`
2. Open homepage → click "Register" → fill form → submit
3. Navigate to `/admin` → sign in with Google
4. Verify registration appears in **Registrations tab**
5. Test Approve/Reject actions
6. Test CSV export

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TypeScript errors from Framer Motion template strings | Medium | Blocks build | Cast `useMotionTemplate` returns or use `style` prop directly |
| Build fails on `/admin` due to Firebase Auth client-side only | Low | Blocks deploy | Already handled with `dynamic` import and `'use client'` |
| Registration not appearing in admin (Firestore not provisioned) | High | Feature gap | LocalStorage fallback already implemented; verify it works |

---

## Acceptance Criteria

- [ ] `npx tsc --noEmit` exits with code 0 (zero errors)
- [ ] `npm run build` completes successfully
- [ ] Homepage renders all 6 sections in order:
  1. Navbar
  2. ParallaxHero (3D cards)
  3. TesaTeamSection (3D scroll team)
  4. Textile3DCenterpiece (cloth sim)
  5. DepartmentOverviewSection (faculty/labs)
  6. PastEventsSection (archives)
  7. Footer
- [ ] Registration submitted on homepage → visible in `/admin` Registrations tab
- [ ] Admin can Approve/Reject/Delete registrations
- [ ] CSV export downloads valid file

---

## Files to Modify

1. **`app/page.tsx`** — Add 3 imports + 3 JSX elements (only file needing edits)
2. **Potential:** `components/*.tsx` — Only if TypeScript reveals type errors

---

## Out of Scope

- Visual design changes (theme, colors, spacing already match spec)
- New component creation (all components exist)
- Firebase Console setup (documented in admin banner)
- Content changes (sample data is comprehensive)