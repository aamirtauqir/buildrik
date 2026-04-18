# Plan: Sections Mode Icon Grid

## Context

Build Tab ka Sections mode currently chip-based navigation use karta hai (9 family chips) with vertical section card list. Elements mode mein icon-based card grid hai. User chahta hai ki Sections mode bhi Elements ki tarah icon grid use kare — same visual language, consistent UX.

## Problem Statement

Current SectionsMode:
- Jump chips: pill-style buttons (Hero, About, Features...)
- Section cards: vertical list with name + sub text

Target SectionsMode (per v4 prototype):
- Top-level icon grid for 9 section types
- Accordion per section family (open/closed)
- Template cards inside accordion body
- Bottom hint footer

## Design

See: `docs/superpowers/specs/build-tab-prototypes-v4.html` Screen 5 (Sections Mode)

## Implementation Steps

### Step 1: CSS — Add `.bld-sec-type-grid` and `.bld-sec-type-card` styles

**File:** `packages/editor/src/editor/sidebar/tabs/build/BuildTab.css`

Add after existing `.bld-sec-chips` (line ~413):

```css
/* ── Section type icon grid ── */
.bld-sec-type-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 12px;
}
.bld-sec-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 4px;
  background: var(--ls-bg-subtle, #F1F5F9);
  cursor: pointer;
  transition: all 0.12s;
  user-select: none;
}
.bld-sec-type-card:hover {
  background: var(--ls-accent-bg, #DBEAFE);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.bld-sec-type-card:focus-visible {
  outline: 2px solid var(--ls-accent, #1D4ED8);
  outline-offset: 2px;
}
.bld-sec-type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}
.bld-sec-type-icon svg {
  width: 20px;
  height: 20px;
  stroke: var(--ls-text-muted, #475569);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  transition: stroke 0.12s;
}
.bld-sec-type-card:hover .bld-sec-type-icon svg {
  stroke: var(--ls-accent, #1D4ED8);
}
.bld-sec-type-name {
  font-size: 10px;
  color: var(--ls-text-muted, #475569);
  font-weight: 400;
  text-align: center;
  line-height: 1.2;
  transition: color 0.12s;
}
.bld-sec-type-card:hover .bld-sec-type-name {
  color: var(--ls-accent, #1D4ED8);
}
.bld-sec-type-card--active {
  background: var(--ls-accent-bg, #DBEAFE);
  box-shadow: 0 0 0 1px var(--ls-accent, #1D4ED8);
}
.bld-sec-type-card--active .bld-sec-type-name {
  color: var(--ls-accent, #1D4ED8);
  font-weight: 600;
}
.bld-sec-type-card--active .bld-sec-type-icon svg {
  stroke: var(--ls-accent, #1D4ED8);
}
```

### Step 2: SectionsMode — Add icon grid + accordion

**File:** `packages/editor/src/editor/sidebar/tabs/build/components/SectionsMode.tsx`

**Changes:**
1. Add state for active section type (default: "hero")
2. Icon grid at top (before family sections)
3. Section families as accordion (only active family's accordion open)
4. Bottom hint footer
5. Update search mode to show flat filtered list (no icon grid)

**Icon map (inline SVGs by familyId):**
```tsx
const SECTION_TYPE_ICONS: Record<string, React.ReactNode> = {
  hero: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="14" rx="2"/><line x1="3" y1="20" x2="21" y2="20"/></svg>,
  about: <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>,
  features: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  testimonials: <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  pricing: <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  faq: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  cta: <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  contact: <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  footers: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
};
```

### Step 3: CSS — Bottom hint styles

Already exist as `.bld-sec-hint` in BuildTab.css (line ~482-497). No changes needed.

### Step 4: Test — Verify UI

- Open editor demo (`npm run dev`)
- Switch to Sections mode
- Verify icon grid displays correctly (5 columns, 2 rows)
- Click icon card → accordion expands with template cards
- Click another icon → that accordion opens, previous closes
- Bottom hint visible
- Search filters correctly

## Files to Modify

1. `packages/editor/src/editor/sidebar/tabs/build/BuildTab.css`
2. `packages/editor/src/editor/sidebar/tabs/build/components/SectionsMode.tsx`

## Verification

- [ ] Icon grid: 5 columns × 2 rows, 9 cards
- [ ] Hover: cobalt glow + lift
- [ ] Click icon → accordion opens with template cards
- [ ] Only one accordion open at a time
- [ ] Bottom hint visible
- [ ] Search mode: flat filtered list works
- [ ] No breaking changes to Elements mode