# Phase 4-5 Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 5 remaining UX audit fixes: click feedback animation (P-36), page naming defaults (P-24), rail tooltip improvements (P-25), input label verification (P-27), and onboarding tour update (P-22).

**Architecture:** CSS-only changes where possible; pure utility functions for shared logic; update existing TourOverlay.tsx (already wired in AquibraStudio.tsx) rather than creating new component.

**Tech Stack:** React 18 + TypeScript, CSS custom properties (no Emotion in new files), plain inline styles.

---

## Task 1 (P-36): Click Feedback CSS

**Files:**
- Modify: `src/themes/default.css`

**Step 1: Add flash animation and active states**

Find the end of `default.css` (before or after the existing `prefers-reduced-motion` block) and append:

```css
/* ─── P-36: Click feedback ──────────────────────────────────────────────── */
@keyframes aqb-flash {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.04); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: no-preference) {
  .aqb-element-flash {
    animation: aqb-flash 0.3s ease-out;
  }
}

.aqb-btn:active {
  transform: scale(0.97);
}

.aqb-icon-btn:active {
  transform: scale(0.95);
}
```

**Step 2: Verify existing classes are used**

Run: `grep -r "aqb-element-flash\|aqb-btn\|aqb-icon-btn" src/`

Expected: Should find `aqb-element-flash` in `useElementFlash.ts`, and `aqb-btn`/`aqb-icon-btn` in Button.tsx/IconButton.tsx (already added in Wave 1).

**Step 3: Commit**

```bash
git add src/themes/default.css
git commit -m "feat(css): add click feedback animation and active scale states (P-36)"
```

---

## Task 2 (P-24): Smart Page Naming

**Files:**
- Create: `src/shared/utils/pageUtils.ts`
- Modify: `src/editor/sidebar/tabs/pages/usePages.ts` (line ~136)
- Modify: `src/editor/shell/PageTabBar.tsx` (line ~128)
- Modify: `src/editor/shell/AquibraStudio.tsx` (line ~408)

**Step 1: Create pageUtils.ts**

```ts
/**
 * Page naming utilities.
 * @license BSD-3-Clause
 */

export interface PageLike {
  name: string;
}

/**
 * Returns a smart default name for a new page based on existing pages.
 * - 0 existing → "Home"
 * - 1 existing → "About"
 * - 2+ existing → "Page N" where N = count + 1
 */
export function getDefaultPageName(existingPages: PageLike[]): string {
  const count = existingPages.length;
  if (count === 0) return "Home";
  if (count === 1) return "About";
  return `Page ${count + 1}`;
}
```

**Step 2: Update usePages.ts**

Find: `const name = \`Page ${pages.length + 1}\`;`
Replace with:
```ts
import { getDefaultPageName } from "@shared/utils/pageUtils";
// ...
const name = getDefaultPageName(pages);
```

**Step 3: Update PageTabBar.tsx**

Find: `composer.elements.createPage(\`Page ${pageCount}\`)`
Replace with:
```ts
import { getDefaultPageName } from "@shared/utils/pageUtils";
// ...
composer.elements.createPage(getDefaultPageName(pages));
```
Note: ensure `pages` is available in scope (it should be via the hook or props).

**Step 4: Update AquibraStudio.tsx hardcoded string**

Find: `composer.elements.createPage("Untitled Page")`
Replace with: `composer.elements.createPage("Home")`
(This is the initial page creation, always the first → "Home")

**Step 5: Verify**

Run: `grep -n "Untitled Page\|Page \${" src/editor/`

Expected: 0 results.

**Step 6: Commit**

```bash
git add src/shared/utils/pageUtils.ts src/editor/sidebar/tabs/pages/usePages.ts src/editor/shell/PageTabBar.tsx src/editor/shell/AquibraStudio.tsx
git commit -m "feat(pages): smart default page names — Home/About/Page N (P-24)"
```

---

## Task 3 (P-25): Rail Tooltip Improvements

**Files:**
- Modify: `src/editor/rail/tabsConfig.ts`
- Modify: `src/editor/rail/LeftRail.tsx`
- Modify: `src/editor/rail/LeftRail.css`

**Step 1: Add subtitle to RailSlot interface in tabsConfig.ts**

Find the `RailSlot` interface and add `subtitle?: string` field:
```ts
export interface RailSlot {
  tabId: GroupedTabId;
  label: string;
  iconName: string;
  ariaLabel: string;
  zone: RailZone;
  variant: RailVariant;
  toggleMode?: boolean;
  subtitle?: string;  // ← ADD THIS
}
```

**Step 2: Add subtitle values to RAIL_SLOTS array in tabsConfig.ts**

For each slot in RAIL_SLOTS, add the `subtitle` property:
- `tabId: "templates"` → `subtitle: "Browse page templates"`
- `tabId: "pages"` → `subtitle: "Manage site pages"`
- `tabId: "add"` (Build) → `subtitle: "Add elements and components"`
- `tabId: "assets"` (Media) → `subtitle: "Images, videos, and files"`
- `tabId: "design"` → `subtitle: "Colors, typography, and spacing"`
- `tabId: "settings"` → `subtitle: "Site settings and SEO"`

**Step 3: Update tooltip render in LeftRail.tsx**

Find the tooltip span block (the one rendering `left-rail__tooltip-name`):
```tsx
<span className="left-rail__tooltip" role="tooltip">
  <span className="left-rail__tooltip-name">{slot.ariaLabel}</span>
  {TAB_SHORTCUTS[slot.tabId] && (
    <span className="left-rail__tooltip-kbd">{TAB_SHORTCUTS[slot.tabId]}</span>
  )}
</span>
```

Update to add subtitle and change layout to column for multi-line:
```tsx
<span className="left-rail__tooltip" role="tooltip">
  <span className="left-rail__tooltip-name">
    {slot.ariaLabel}
    {TAB_SHORTCUTS[slot.tabId] && (
      <span className="left-rail__tooltip-kbd">{TAB_SHORTCUTS[slot.tabId]}</span>
    )}
  </span>
  {slot.subtitle && (
    <span className="left-rail__tooltip-sub">{slot.subtitle}</span>
  )}
</span>
```

**Step 4: Update CSS in LeftRail.css**

a) Add `transition-delay: 0.2s` to the hover/focus-visible rule:
Find:
```css
.left-rail__item:hover .left-rail__tooltip,
.left-rail__item:focus-visible .left-rail__tooltip {
  opacity: 1;
```
Add `transition-delay: 0.2s;` inside that rule block.

b) Make tooltip flex-direction column for subtitle:
Find `.left-rail__tooltip {` and add:
```css
flex-direction: column;
align-items: flex-start;
gap: 2px;
```

c) Add subtitle style at end of tooltip section:
```css
.left-rail__tooltip-sub {
  font-size: 11px;
  color: var(--aqb-text-muted);
  margin-top: 2px;
  font-weight: 400;
}
```

**Step 5: Commit**

```bash
git add src/editor/rail/tabsConfig.ts src/editor/rail/LeftRail.tsx src/editor/rail/LeftRail.css
git commit -m "feat(rail): add tooltip subtitles and 200ms show delay (P-25)"
```

---

## Task 4 (P-27): Input Label Verification

**Files:**
- Verify: `src/editor/sidebar/tabs/settings/` screens
- Fix if needed: any file with bare `<input placeholder=` without a label

**Step 1: Grep for potentially unlabeled inputs**

```bash
grep -rn "<input" src/editor/sidebar/tabs/settings/ | grep -v "label\|htmlFor\|aria-label\|aria-labelledby"
```

**Step 2: Check Field component wraps labels**

Read `src/editor/sidebar/tabs/settings/shared.tsx` (or wherever Field is defined) to confirm it wraps inputs with visible labels.

**Step 3: Fix any bare inputs found**

If any `<input placeholder="..."` found without associated label, add above:
```tsx
<label style={{ fontSize: 12, fontWeight: 500, color: "var(--aqb-text-muted)", marginBottom: 4, display: "block" }}>
  [Label text]
</label>
```

**Step 4: Commit (only if changes made)**

```bash
git add src/editor/sidebar/tabs/settings/
git commit -m "a11y: ensure all settings inputs have visible labels (P-27)"
```

If no changes needed: note "P-27: PASS — all inputs already have labels via Field component"

---

## Task 5 (P-22): Update Onboarding Tour

**Files:**
- Modify: `src/shared/ui/TourOverlay.tsx`

**Step 1: Update TOUR_STEPS to match P-22 spec**

Replace the existing TOUR_STEPS array:

```ts
const TOUR_STEPS: TourStep[] = [
  {
    target: "rail-tab-templates",
    title: "Choose a template",
    description: "Start with a professionally designed template or build from scratch.",
    position: "right",
  },
  {
    target: "",  // canvas center — no specific anchor
    title: "Edit your page",
    description: "Click any element to edit. Drag to rearrange.",
    position: "center",
  },
  {
    target: "pillPublish",
    title: "Publish when ready",
    description: "Hit Publish to make your site live.",
    position: "bottom",
  },
];
```

Note: `rail-tab-templates` is the button `id` set by `id=\`rail-tab-${slot.tabId}\`` in LeftRail.tsx. Target by `id` not `data-tour-target`. Update the querySelector in the position calculation:

```ts
// Change from:
const target = document.querySelector<HTMLElement>(`[data-tour-target="${currentStep.target}"]`);
// Change to:
const target = currentStep.target
  ? document.getElementById(currentStep.target)
  : null;
```

**Step 2: Add spotlight effect**

In the return JSX, add a spotlight div BEFORE the card div. The spotlight uses `box-shadow` with a very large inset to darken everything except the target area:

```tsx
{/* Spotlight overlay */}
{spotlightRect && (
  <div
    aria-hidden="true"
    style={{
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      borderRadius: spotlightRect.borderRadius ?? 8,
      boxShadow: `0 0 0 9999px rgba(0,0,0,0.55)`,
      top: spotlightRect.top - 8,
      left: spotlightRect.left - 8,
      width: spotlightRect.width + 16,
      height: spotlightRect.height + 16,
    }}
  />
)}
```

Add `spotlightRect` state:
```ts
const [spotlightRect, setSpotlightRect] = React.useState<DOMRect | null>(null);
```

Update the position calculation effect to also set `spotlightRect` when target is found:
```ts
if (target) {
  const rect = target.getBoundingClientRect();
  setSpotlightRect(rect);
  // ... rest of position calculation
} else {
  setSpotlightRect(null);
}
```

**Step 3: Update localStorage key to match P-22 spec**

Change: `localStorage.getItem("aquibra_tour_seen")`
To: `localStorage.getItem("buildrik_onboarding_tour_v1")`

Change: `localStorage.setItem("aquibra_tour_seen", "true")`
To: `localStorage.setItem("buildrik_onboarding_tour_v1", "true")`

**Step 4: Add Escape key handler**

Add inside the component:
```ts
React.useEffect(() => {
  if (!isVisible) return;
  const handler = (e: KeyboardEvent) => {
    if (e.key === "Escape") handleFinish();
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [isVisible]);
```

**Step 5: Commit**

```bash
git add src/shared/ui/TourOverlay.tsx
git commit -m "feat(tour): update onboarding tour to P-22 spec — templates/canvas/publish steps + spotlight (P-22)"
```

---

## Verification

```bash
npx tsc --noEmit   # No new type errors
npm run dev        # Check in browser at port 5050
```

Manual checks:
1. Click canvas element → flash animation plays (300ms scale pulse)
2. Press Tab to Button → purple focus ring; press Enter → ring stays; click → no ring (wave 1 work)
3. Click + to add new page → first page "Home", second "About", third "Page 3"
4. Hover rail icon → tooltip appears after ~200ms with subtitle below name
5. Hover Templates rail icon → shows "Browse page templates" subtitle
6. Clear localStorage key `buildrik_onboarding_tour_v1` → reload → tour shows with spotlight on Templates tab
7. Tour step 3 targets Publish button in topbar
8. ESC key during tour → skips/closes tour
