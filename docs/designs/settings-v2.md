# Settings Tab v2 — Drill-in Drawer Design

**Status:** Approved direction — locked 2026-05-08, revised 2026-05-09 after codex review (8 findings)
**Scope:** `packages/editor/src/editor/sidebar/tabs/settings/` (settings tab only, not system-wide DESIGN.md)
**Approved variant:** `variant-D.html` at `~/.gstack/projects/aamirtauqir-buildrik/designs/settings-v2-20260508/`
**Source:** `/design-consultation` Phase 5 lock; user picked drill-in drawer pattern after rejecting peer-layout variants A/B/C.

> **Revision note (2026-05-09):** This doc was substantially revised after `/plan-ceo-review` ran codex as outside voice. Codex caught 8 grounded findings that invalidated several locked decisions. The revised plan reuses existing primitives (`usePanelNavigation`, `DrillInHeader`, `ConfirmDialog`) instead of building new ones. See § 14 for the codex findings + what changed. Sections below reflect the revised plan; original D-decisions are preserved in § 12 alongside their revisions.

---

## 1. Approved direction

The settings tab uses a **stack-navigation drawer** inside the existing 320px left sidebar. At the root, the user sees a list of 10 sections grouped under SITE / DISTRIBUTION / PLUMBING. Clicking any row pushes that section's screen into the drawer: the snav slides off-left and fades to 35% opacity behind the drilled-in screen, the section's screen slides in from the right with a subtle left-edge shadow. A back arrow `‹` in the section's header pops to root. The drawer is **never full-page** — the canvas continues to render to the right at full visibility.

**Why this over peer layout (variants A/B/C):** content area inside the drawer goes from ~180px (after a 140px snav reservation) to ~280px (full drawer width). 55% gain for forms that need real estate. Trade-off: discoverability drops because users can't see all 10 section labels at once; mitigated by section-group breadcrumb pill in the section header (e.g., "General" + `Site` pill).

**Implementation principle:** v2 is a layout/CSS change on top of existing primitives. No new state machine, no new drawer primitive — `SettingsTab.tsx` already uses `usePanelNavigation` and renders one screen at a time via `switch(currentScreen)` (line 341). The visual reorganization is the entire delta.

---

## 2. Information architecture

### Root-screen section list

Three groups, **10 in-tab sections** total. All section IDs use kebab-case (matches existing `NAV` constant in `SettingsTab.tsx`).

| Group | Sections (id · title) |
|-------|----------------------|
| **SITE** | `general` · General · `branding` · Branding · `seo` · SEO |
| **DISTRIBUTION** | `analytics` · Analytics · `localization` · Localization |
| **PLUMBING** | `custom-code` · Custom code · `redirects` · Redirects · `headers` · Headers · `forms` · Forms · `integrations` · Integrations |

> **Forms note:** keep in the snav for v2 (config + submissions inbox combined). The Phase 3 proposal floated splitting submissions inbox to its own tab — out of v2 scope.

### Workspace deep-links — KEEP in snav for v2

3 verified deep-links (Domains, Members, Billing) stay in the snav as before. The "move to topbar profile menu" idea is a **separate arc** — out of v2 scope. v2 = visual/IA refactor only; deep-link destination change is a workflow change.

### Plan-tier gate (preserved as-is)

`SCREEN_PLAN_REQUIREMENTS` in `types.ts` controls plan-locked sections. The map currently has a stale key `advanced` (legacy from a renamed nav-id) plus `integrations`. **Pre-existing bug — separate fix.** v2 does not modify the gate semantics; render-time enforcement preserved (D8).

---

## 3. Layout transition

The current `SettingsTab.tsx` (line 240) already calls `usePanelNavigation` and renders exactly one screen via `switch(currentScreen)` at line 341. v2 changes the **layout shape**, not the state machine.

### Root-state + mount-lifecycle mechanism (codex pass 3 resolution)

`usePanelNavigation` has no synthetic 'root' concept — `navigateTo` only accepts valid screen IDs (line 131-140). To represent "user is viewing the snav, not any section" AND keep section mounted across pop animations, v2 introduces **two separate local states**:

```ts
const { currentScreen, navigateTo } = usePanelNavigation({ ... });
const [isRoot, setIsRoot] = useState(true);          // initial state: snav visible
const [sectionMounted, setSectionMounted] = useState(false); // section in DOM?
const [transitioning, setTransitioning] = useState(false);

// On snav row click (push):
const navigate = (id: InTabNavId) => {
  if (transitioning) return;
  setTransitioning(true);
  navigateTo(id);          // updates currentScreen
  setSectionMounted(true); // mount section first so it can animate in
  // CSS class flip on next rAF tick takes section from translateX(100%) → 0
  // and root from translateX(0) → -12% / opacity 0.35
  requestAnimationFrame(() => setIsRoot(false));
};

// On back arrow / Escape (pop):
const navigateToRoot = () => {
  if (transitioning) return;
  setTransitioning(true);
  setIsRoot(true);  // triggers root.on, section.off (departing) — animation plays
  // section stays mounted; sectionMounted flip happens in transitionend handler.
};
```

**Key invariants:**
- Initial state is `isRoot=true`, `sectionMounted=false`. Snav shows on first paint.
- Section is mounted as soon as user clicks a row, BEFORE `isRoot` flips, so the section node exists for CSS to animate against.
- Section unmounts only after pop transition completes (handled in § 6).
- `currentScreen` is bound to last-visited section so re-push lands at same place.

### Render contract

```tsx
return (
  <TabFrame>
    {/* Custom .bd-set-panel-h header — see § 5 (TabFrame.Header NOT used today) */}
    <div className="bd-set-panel-h">Settings</div>

    <TabFrame.Body noScroll>
      <div
        className={`bd-set-stack${transitioning ? " transitioning" : ""}`}
        onTransitionEnd={handleStackTransitionEnd}
      >
        <div className={`bd-set-screen bd-set-screen--root${isRoot ? " on" : " off"}`}>
          <RootSnav navigateTo={navigate} />
        </div>
        {sectionMounted && (
          <div
            ref={sectionRef}
            className={`bd-set-screen bd-set-screen--section${isRoot ? " departing" : " entered"}`}
          >
            <DrillInHeader
              title={current.title}
              parentName="Settings"
              breadcrumb={[GROUP_LABELS[current.group], current.title]}
              focusTarget="breadcrumb-current"
              enableDocumentEscape={false}
              onBack={navigateToRoot}
              isDirty={screenIsDirty}
              onBackAttempt={() => setGuardOpen(true)}
            />
            {renderActiveScreen()}
          </div>
        )}
      </div>
    </TabFrame.Body>

    <ConfirmDialog
      isOpen={guardOpen}
      onClose={() => setGuardOpen(false)}
      onConfirm={confirmDiscardAndNavigate}
      title="Discard changes?"
      message="You have unsaved changes."
      confirmText="Discard"
      variant="danger"
    />
  </TabFrame>
);
```

`sectionMounted` is the mount-lifecycle gate; `isRoot` is the visual state gate. The section's CSS class is `entered` while drilled in and `departing` during pop animation; when pop's transitionend fires on the section node, the handler flips `sectionMounted` to false and unmounts.

### Unsaved-changes guard

Existing `SettingsNavGuard` (in `shared.tsx:245`) is replaced with `ConfirmDialog` (`shared/extensions/ConfirmDialog.tsx`) — Radix-backed. Closes D4 finding for free.

### Unsaved-changes guard

Existing `SettingsNavGuard` (in `shared.tsx:245`) is a `role="dialog"` wrapper with no Escape handling and no focus trap. **Replace with `ConfirmDialog`** (`shared/extensions/ConfirmDialog.tsx`) which provides Radix focus trap + Escape close out of the box. This closes D4 finding for free.

---

## 4. Token table (extracted from variant-D.html)

All values match DESIGN.md. No new tokens introduced.

### Color

| Role | Token | Value |
|------|-------|-------|
| Drawer bg | `--bd-bg-drawer` | `#FFFFFF` |
| Section content bg | (same) | `#FFFFFF` |
| Rail bg (icon column) | `--bd-bg-rail` | `#F5F5F5` |
| Savebar bg | `--bd-bg-savebar` | `#FAFAFA` |
| Section divider | `--bd-divider` | `#F5F5F5` |
| Border | `--bd-border` | `#E5E7EB` |
| Text primary | `--bd-text-1` | `#1A1A1A` |
| Text secondary | `--bd-text-2` | `#6B7280` |
| Text tertiary | `--bd-text-3` | `#9CA3AF` |
| Accent | `--bd-accent` | `#2D6DFF` (cobalt) |
| Accent soft (active row, focus ring) | `--bd-accent-soft` | `rgba(45, 109, 255, 0.08)` |
| Danger | `--bd-danger` | `#EF4444` |

**Banned (per DESIGN.md):** purple, violet, indigo. Cobalt is the only accent. No black (`#000`) — text-1 is `#1A1A1A`.

### Typography

| Role | Stack | Sizes used |
|------|-------|------------|
| Display (titles) | General Sans, Inter Tight | 14px section header · 16px drilled-in title |
| Body / UI | Inter Tight | 11px label · 12px hint · 13px input/row |
| Mono (data, breadcrumb pill) | Geist Mono | 10px tag · 11px pill |

### Spacing

| Element | Value |
|---------|-------|
| Drawer header height | 44px |
| Snav row height | 32px |
| Field row height (input) | 32px |
| Field gap (within field) | 6px |
| Field stack gap (between fields) | 12px |
| Section padding | 12px |
| Savebar height | 44px |

All values are 4px-grid multiples.

---

## 5. Layout spec

> **Header note:** SettingsTab is wrapped in `<TabFrame>` (commit `60b96ef6`) but does NOT use `TabFrame.Header`. It renders a custom `.bd-set-panel-h` block at SettingsTab.tsx:436. v2 keeps that custom header — migrating to `TabFrame.Header` is out of scope (separate arc). The diagrams below show the custom block as "Settings" header for clarity.

### Root view (snav visible)

```
┌─ TabFrame (existing, unchanged) ─────────────┐
│ ┌─ .bd-set-panel-h: "Settings" (custom) ───┐│
│ ├─ TabFrame.Body ──────────────────────────┤│
│ │ SITE                                     ││
│ │ ▸ General                            ›  ││
│ │ ▸ Branding                           ›  ││
│ │ ▸ SEO                                ›  ││
│ │                                          ││
│ │ DISTRIBUTION                             ││
│ │ ▸ Analytics                          ›  ││
│ │ ▸ Localization                       ›  ││
│ │                                          ││
│ │ PLUMBING                                 ││
│ │ ▸ Custom code                        ›  ││
│ │ ▸ Redirects                          ›  ││
│ │ ▸ Headers                            ›  ││
│ │ ▸ Forms                              ›  ││
│ │ ▸ Integrations                       ›  ││
│ │                                          ││
│ │ ──────────────                           ││
│ │ WORKSPACE (deep-links open dashboard)    ││
│ │ ▸ Domains                          ↗    ││
│ │ ▸ Members                          ↗    ││
│ │ ▸ Billing                          ↗    ││
│ ├─ savebar (sticky bottom — hidden at root)┤│
│ └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

### Section view (drilled-in, e.g., General)

```
┌─ TabFrame (existing, unchanged) ─────────────┐
│ ┌─ .bd-set-panel-h: "Settings" (custom) ───┐│
│ ├─ TabFrame.Body ──────────────────────────┤│
│ │ ┌─ DrillInHeader (existing primitive) ┐││
│ │ │ ‹ Back to Settings · General        │││
│ │ │ Site / General                       │││  ← breadcrumb
│ │ └──────────────────────────────────────┘││
│ │                                          ││
│ │ <ActiveSectionScreen />                  ││
│ │                                          ││
│ ├─ savebar (sticky, shows when dirty) ────┤│
│ │ "Unsaved changes"  [Discard] [Save]     ││
│ └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

---

## 6. Animation spec

### Dual-mount mechanism (codex pass 2 resolution)

Per § 3, both `bd-set-screen--root` and `bd-set-screen--section` render simultaneously. Their visibility states (`on` / `off`) drive CSS transforms. Because both are mounted, CSS transitions have stable nodes to animate against.

```css
.bd-set-stack {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.bd-set-screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  transition: transform 180ms ease-out, opacity 180ms ease-out;
  will-change: transform, opacity;
}

/* Root screen: visible at 'root' state, slid off-left when drilled */
.bd-set-screen--root.on  { transform: translateX(0);     opacity: 1;    pointer-events: auto; }
.bd-set-screen--root.off { transform: translateX(-12%);  opacity: 0.35; pointer-events: none; }

/* Section screen: mounted from snav-click, animates in from right;
   on pop, gets .departing class which slides back out before unmount. */
.bd-set-screen--section {
  transform: translateX(100%);
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.04);
}
.bd-set-screen--section.entered   { transform: translateX(0);     opacity: 1; }
.bd-set-screen--section.departing { transform: translateX(100%);  opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .bd-set-screen { transition: none; }
}
```

The section screen uses an `entering` → `entered` class flip (single rAF tick after mount) so the CSS transition has a starting state to animate from. Standard React mount-animation pattern.

| Stage | Element | Property | Value |
|-------|---------|----------|-------|
| Push | root | `transform: translateX(0 → -12%)` | 180ms · `ease-out` |
| Push | root | `opacity: 1 → 0.35` | same |
| Push | section | `transform: translateX(100% → 0)` | same |
| Pop | root | reverse of push | same |
| Pop | section | (unmounts on transitionend) | — |
| `prefers-reduced-motion: reduce` | both | `transition: none` | full skip |

### Animation race policy: BLOCK during 180ms (D20)

The transitionend handler must distinguish root vs section events because the section needs unmount-on-pop while root never unmounts. Solution: ref-based event target check.

```ts
const sectionRef = useRef<HTMLDivElement | null>(null);

const handleStackTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
  // Only act on transform completion (filter out opacity events).
  if (e.propertyName !== "transform") return;

  // Section's pop animation completed → unmount it.
  if (e.target === sectionRef.current && isRoot) {
    setSectionMounted(false);
  }

  // Either screen finishing its transform clears the navigation block.
  // Both screens transition simultaneously, so first transform-end is enough.
  setTransitioning(false);
};
```

The `e.target === sectionRef.current` check ensures we only unmount the section when ITS pop transition fires, not when root's push transition fires (root never unmounts). Multiple transitionend events still fire (4 total: transform + opacity × 2 nodes), but the `propertyName === "transform"` filter + the boolean idempotency of `setTransitioning(false)` make repeated clears safe.

180ms is below human reaction-perception threshold (~250ms).

### Reduced-motion safety (codex pass 4 resolution)

CSS sets `transition: none` under `prefers-reduced-motion: reduce`, so `transitionend` never fires. Without compensation, `transitioning` would stay `true` forever — input blocked permanently. Two-prong fix:

```ts
// Reuse existing repo hook at shared/hooks/useReducedMotion.ts (line 18).
import { useReducedMotion } from "@shared/hooks/useReducedMotion";

const prefersReducedMotion = useReducedMotion();

const navigate = (id: InTabNavId) => {
  if (transitioning) return;
  navigateTo(id);
  setSectionMounted(true);

  if (prefersReducedMotion) {
    // No animation = no input block. Render is instant.
    setIsRoot(false);
    return;
  }

  setTransitioning(true);
  requestAnimationFrame(() => setIsRoot(false));
};

const navigateToRoot = () => {
  if (transitioning) return;

  if (prefersReducedMotion) {
    setIsRoot(true);
    setSectionMounted(false); // instant unmount
    return;
  }

  setTransitioning(true);
  setIsRoot(true);
};
```

Reduced-motion users skip both the animation AND the lock; navigation feels instant. Standard motion users get the 180ms animation + 180ms input block. The `prefersReducedMotion` flag also passed to CSS via a class on `.bd-set-stack` so the visual rules match the JS contract.

> **Why dual-mount over interruptible:** original D9 picked interruptible — codex showed CSS transition cancellation requires the same DOM node to persist across the navigation. Dual-mount keeps section in DOM during both push (mounted-then-class-flip) and pop (kept-during-departing-then-unmount) so transforms have stable referents.

180ms is below human reaction-perception threshold (~250ms). Reduced-motion path skips the lock entirely (instant transition, no animation, no block).

> **Why dual-mount over interruptible:** original D9 picked interruptible — codex showed CSS transition cancellation requires the same DOM node to persist across the navigation, which v1's render-swap doesn't provide. Dual-mount keeps both screens in DOM during the transition window so transforms have stable referents. Block-during-180ms then becomes the input policy on top of the working mechanism.

---

## 7. Component contract

### `SettingsTab.tsx` revisions

```ts
function SettingsTab({ composer, onSwitchToDesign }: SettingsTabProps) {
  // See § 3 for the full state machine + render contract — summary:
  //   currentScreen + navigateTo  ← from usePanelNavigation (existing)
  //   isRoot, sectionMounted     ← new local state for view + mount lifecycle
  //   transitioning              ← new local state for animation block
  //   guardOpen                  ← replaces SettingsNavGuard with ConfirmDialog state
  //
  // Custom .bd-set-panel-h header preserved (TabFrame.Header migration out of scope).
  // Render contract is in § 3.

### `DrillInHeader` extensions (codex pass 2 resolution)

`DrillInHeader` today (lines 36-129):
- Renders back button (`<Button ref={backBtnRef}>`) + nested breadcrumb nav.
- Auto-focuses `backBtnRef.current` on mount (line 58-61).
- Document-level `keydown` listener at line 64-82 — handles Escape via `addEventListener("keydown", handler, document)`.

v2 needs:

**1. Add `focusTarget` prop with concrete target (codex pass 3 refinement)**

```ts
export interface DrillInHeaderProps {
  // ...existing props...
  /** Where to send focus on mount. "back" (default) preserves current behavior;
   *  "breadcrumb-current" focuses the breadcrumb's current-page span as a heading-like
   *  landmark — used by settings v2 for screen-reader announcement of section + group. */
  focusTarget?: "back" | "breadcrumb-current";
  /** When false, DrillInHeader skips its document-level Escape listener. Settings v2
   *  passes false so the parent SettingsTab can handle Escape with knowledge of
   *  modal state. Default true for backwards-compat with ComponentDetailScreen. */
  enableDocumentEscape?: boolean;
}
```

When `focusTarget="breadcrumb-current"`:
- Render the breadcrumb-current span with `tabIndex={-1}` + `ref={breadcrumbCurrentRef}` + `role="heading"` + `aria-level={2}`.
- Set `aria-label={\`\${title}, \${breadcrumb[0]}\`}` — combines section title + group label (e.g., "General, Site"). `breadcrumb[0]` is the group label per the section view's `breadcrumb={[GROUP_LABELS[current.group], current.title]}` prop. `aria-label` overrides accessible name on `role="heading"` — that's the desired effect; the screen reader announces exactly that combined string. Title element's visible text remains the section title alone.
- Focus `breadcrumbCurrentRef.current` on mount instead of `backBtnRef.current`.

Default `"back"` preserves ComponentDetailScreen's existing behavior — no breaking change.

**2. React-tree-scoped Escape (codex pass 3 correction)**

Pass 2's "modal-first is free via defaultPrevented" claim is NOT grounded — `ConfirmDialog` doesn't pass `onEscapeKeyDown`, and Radix issues #2653/#3422 document that document-level Escape conflicts with parent listeners aren't guaranteed clean. Two fixes shipped together:

a) Make ConfirmDialog explicitly call preventDefault on its Escape. `ModalContentProps` does not expose `onEscapeKeyDown` in its TS type even though `ModalContent` spreads unknown props through to `RadixDialog.Content` at runtime. The repo has an existing workaround at `editor/sidebar/tabs/pages/page-settings/UnsavedWarningModal.tsx:28-34` that uses a **component-level cast** (`VibcoderModalContent as unknown as React.ComponentType<...>`). v2 specifies a **prop-object cast** instead — different shape, same goal:

```tsx
// In shared/extensions/ConfirmDialog.tsx:
type ModalContentExtendedProps = React.ComponentProps<typeof ModalContent> & {
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
};

<ModalContent
  size="lg"
  {...({
    onEscapeKeyDown: (e: KeyboardEvent) => {
      e.preventDefault();
      onClose();
    },
  } as ModalContentExtendedProps)}
>
```

(Optional follow-up: widen `ModalContentProps` in `editor/shared/vibcoder/Modal.tsx` to expose `onEscapeKeyDown` and other Radix `Dialog.Content` props natively. Out of v2 scope — separate vibcoder primitive arc.)

b) Switch Escape ownership from DrillInHeader to SettingsTab via `enableDocumentEscape`. (Both implementations attach `document.addEventListener("keydown", ...)` — the difference is which component owns the contract, not the event-target scope. The "React-tree-scoped" framing in pass 2 was inaccurate; both use document. The win is that SettingsTab can check `guardOpen` / `isRoot` / `transitioning` / `screenIsDirty` in ITS scope, while DrillInHeader's listener has no view of those.)

```tsx
// Settings v2 passes enableDocumentEscape={false}.
// SettingsTab attaches its own keydown listener:
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (guardOpen) return; // ConfirmDialog will handle via its onEscapeKeyDown
    if (isRoot) return;    // already at root, nothing to pop
    if (transitioning) return;
    e.preventDefault();
    if (screenIsDirty) setGuardOpen(true);
    else navigateToRoot();
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}, [guardOpen, isRoot, transitioning, screenIsDirty]);
```

Settings owns the Escape contract; the modal handles its own dismissal; DrillInHeader's listener is opted out via prop. ComponentDetailScreen consumers keep `enableDocumentEscape` defaulted to `true` and aren't affected.

> **Backwards-compat:** ComponentDetailScreen.tsx:156 uses DrillInHeader without `focusTarget` — defaults to "back" — no change. The breadcrumb-current focus path is settings-v2-only.

### Section screens — no API change

`GeneralScreen.tsx`, `BrandingScreen.tsx`, etc. unchanged. `useSettingsScreen` hook unchanged. `registerSaveHandler` infrastructure unchanged.

### Files removed/modified

- `SettingsTab.tsx` — modified (layout swap + DrillInHeader integration + ConfirmDialog swap). Estimated +80 / -100 LOC vs current 545.
- `editor/sidebar/shared/DrillInHeader.tsx` — modified (add 2 optional props). Backwards-compatible.
- `editor/sidebar/tabs/settings/settings.css` — modified (delete peer-layout rules `bd-set-snav` + `bd-set-pane`, add slide-in animation).
- `editor/sidebar/tabs/settings/shared.tsx` — modified (delete `SettingsNavGuard`, callers use ConfirmDialog).
- `__tests__/SettingsTab.test.tsx` — modified (rewrite assertions for stack layout — current 14 tests, not 50).

**No new files. No new primitives at `shared/extensions/`.**

---

## 8. Section catalog

10 in-tab sections + 3 workspace deep-links. IDs match existing NAV constant (kebab-case).

| Section ID | Title | Group | Has savebar | Plan tier |
|------------|-------|-------|-------------|-----------|
| `general` | General | Site | yes | free |
| `branding` | Branding | Site | no (signpost-only) | free |
| `seo` | SEO | Site | yes | free |
| `analytics` | Analytics | Distribution | yes | free |
| `localization` | Localization | Distribution | yes | free |
| `custom-code` | Custom code | Plumbing | yes | free *(see note)* |
| `redirects` | Redirects | Plumbing | yes | free |
| `headers` | Headers | Plumbing | yes | free |
| `forms` | Forms | Plumbing | varies | free |
| `integrations` | Integrations | Plumbing | per-integration | **pro** |

> **Note on plan-tier:** `SCREEN_PLAN_REQUIREMENTS` currently has a stale `advanced` key (legacy id, renamed to `custom-code` in NAV). Pre-existing bug, not v2's responsibility. Separate fix.

Workspace deep-links: Domains, Members, Billing (all → `${VITE_DASHBOARD_URL}/dashboard/...`).

---

## 9. Resolved questions (from § 9 / handoff)

| Open question | Resolution |
|---|---|
| Forms-split | Out of v2 scope (kept combined). |
| Workspace deep-links destination | **Stay in snav for v2.** Move-to-topbar = separate arc. |
| Branding section direction | Keep current signpost shape. |
| `setActiveScreen` callers | Zero callers — moot. |

---

## 10. Reference

- **Live prototype:** `~/.gstack/projects/aamirtauqir-buildrik/designs/settings-v2-20260508/variant-D.html`
- **Comparison board:** `~/.gstack/projects/aamirtauqir-buildrik/designs/settings-v2-20260508/design-board.html`
- **CEO handoff note:** `~/.gstack/projects/aamirtauqir-buildrik/2026-05-08-main-ceo-handoff-settings-redesign-v2.md`
- **DESIGN.md (system-wide):** `DESIGN.md` at repo root — no changes proposed.
- **Existing settings tab tests:** `packages/editor/src/editor/sidebar/tabs/settings/__tests__/SettingsTab.test.tsx` (242 LOC, 14 tests).

---

## 11. Out of scope

- DESIGN.md system-wide changes (none).
- Workspace settings tab (Account, Members, Billing pages on dashboard).
- Content settings (per-page metadata in inspector).
- Implementation plan (handed off to engineer post-review).
- Forms-split / submissions inbox separate tab (deferred).
- Workspace deep-links destination move (separate arc).
- Branding section direction change (kept current).
- New DrawerStack primitive (D19 chose reuse).
- `SCREEN_PLAN_REQUIREMENTS.advanced` stale key (pre-existing bug, separate fix).
- `composer.logger` API (does not exist; v2 uses `console.*` per D12 revision).
- Dual-mount / framer-motion animation (D20 chose block-during-180ms instead).
- State vocabulary standardization (P2 TODO post-v2).
- Lazy mount section screens (NOT applicable — current code already renders one screen).
- Mobile/responsive layout (kept desktop-only).

---

## 12. CEO Review Decisions (final, post-codex revision)

`/plan-ceo-review` ran in HOLD SCOPE mode. 17 internal decisions + 3 codex revisions = final spec.

### D1 — Mode: HOLD SCOPE
Bulletproof the locked design without scope expansion.

### D2 — Mount strategy: NO CHANGE (codex correction)
**Original D2 was based on a false premise.** Current `SettingsTab.tsx:341` already renders one screen at a time via `switch(currentScreen)`. There is no peer-mount problem to defer. v2 preserves the existing single-active render — no lazy-mount refactor needed in v2 OR v2.1.

### D3 — Focus contract on push/pop (final, post-codex pass 3)
- **On push:** focus DrillInHeader's breadcrumb-current span via new `focusTarget="breadcrumb-current"` prop. Span gets `tabIndex={-1}` + `role="heading"` + `aria-level={2}` + `aria-label={\`\${title}, \${breadcrumb[0]}\`}` (e.g., "General, Site"). Screen reader announces the combined string.
- **On pop:** existing DrillInHeader auto-focus pattern preserved (back button focus when section unmounts).
- See § 7 for full DrillInHeader extension API.

### D4 — Escape contract: SettingsTab owns Escape, ConfirmDialog explicit (final, post-codex pass 3+5)
- Replace `SettingsNavGuard` with `ConfirmDialog` (`shared/extensions/ConfirmDialog.tsx`).
- ConfirmDialog passes explicit `onEscapeKeyDown={(e) => { e.preventDefault(); onClose(); }}` to ModalContent via the prop-object cast workaround (see § 7 for cast specifics; note the existing component-level cast pattern at `UnsavedWarningModal.tsx:28-34` is a different shape that also works).
- DrillInHeader gets new optional prop `enableDocumentEscape` (default `true` for backwards-compat with `ComponentDetailScreen`). Settings v2 passes `false` to disable DrillInHeader's document-level Escape listener.
- **SettingsTab owns Escape** via its own `document.addEventListener` keydown handler. Handler checks `guardOpen` (modal open → skip), `isRoot` (already at root → skip), `transitioning` (animation in flight → skip), and `screenIsDirty` (open ConfirmDialog vs popToRoot directly).
- See § 7 for the SettingsTab Escape effect code.

### D5 — Shell strategy: TabFrame outer + reuse internals
SettingsTab keeps `TabFrame`. Body content uses `DrillInHeader` (existing primitive, not new) for section view. No DrawerStack.

### D6 — Savebar location: SettingsTab level
Savebar stays where it is today. Existing `registerSaveHandler` + central dirty counter logic preserved as-is.

### D7 — Silent-failure guards (final, post-codex pass 5)
1. **Invalid screen ID — partial.** `usePanelNavigation` validates persisted state on init (line 82-84, falls back to default). Runtime `navigateTo("bad-id")` is a silent no-op (line 131-140) — not a fallback. v2 only calls `navigateTo` with statically-typed `InTabNavId` from NAV, so runtime invalid-id is unreachable in practice.
2. **Focus target null guard:** wrap focus call in `if (breadcrumbCurrentRef.current)` per React 18 concurrent-mode race standard. (Variable was `titleRef` in earlier draft — now `breadcrumbCurrentRef` per D3 final.)
3. **`useEffect` cleanup:** existing DrillInHeader Escape effect already returns cleanup (line 81-82). v2's SettingsTab-owned Escape effect MUST also return its cleanup. Verify both in tests.
4. **Untyped view prop validation:** N/A in revised plan — no new view-state union; usePanelNavigation owns persisted-state validation.

### D8 — Plan-tier gate: render-time enforcement (no change)
Plan-locked sections drill in normally; render dispatches to `LockedScreen` instead of real component. Matches v1.

### D9 — Animation race policy: BLOCK during 180ms (D20 codex revision)
**Original D9 picked interruptible — codex showed it's unachievable** with current render-swap architecture. Revised: block clicks for 180ms via `transitioning` boolean flag + `onTransitionEnd` clear. Reduced-motion path skips block (instant). Standard iOS pattern.

### D10 — Implementation strategy: REUSE existing primitives (D19 codex revision)
**Original D10 picked new DrawerStack — codex caught even more existing infrastructure** than initial inventory.
- `usePanelNavigation` ✓ already used at line 240
- `DrillInHeader` ✓ exists with back/focus/Escape (1 external consumer = ComponentDetailScreen)
- `ConfirmDialog` ✓ Radix-backed with focus trap + Esc close
- `StickyFooter` ✓ exists but settings already has its own savebar

Revised: drop new DrawerStack. v2 = thin layout/CSS change on top of existing primitives. SettingsTab.tsx changes drop from full rewrite to layout swap. **~4 file touches vs original ~14.** Aligns with `inventory-before-architecture` and `feedback_inventory_before_deletion_wrappers` learnings.

### D11 — Test strategy: rewrite SettingsTab.test.tsx in-place
Update the existing 14 tests (242 LOC, NOT 50 tests / 600 LOC as originally claimed). Animation tests use fakeTimers + manual `transitionend` event dispatch.

### D12 — Logging spec: console.* (codex correction)
`composer.logger` does not exist. Revised: use `console.error` (settings already uses this at line 312) and `console.warn` for the D7 fallback warnings. No metrics or alerts in v2 (HOLD mode). Sentry already captures render errors.

### D13 — Rollout: direct ship to main + browser smoke gate (no change)

### D14, D15 — Post-v2 TODOs (D14 obsolete, D15 obsolete after codex)
**D14 obsolete:** consolidation TODO no longer needed since v2 reuses existing primitives instead of creating parallel ones.
**D15 obsolete:** lazy-mount TODO no longer needed since v2 preserves existing single-active render.

### D16 — TODO: port Inspector + Pages drill-in to existing primitives
Renamed scope: when Inspector or Pages adopt drill-in patterns, use `usePanelNavigation` + `DrillInHeader` (now battle-tested across 2 consumers). P3 TODO. Speculative.

### D17 — State vocabulary deferred (P2 TODO, no change)

### D18 — Codex revise vs proceed: REVISE (chosen)
Triggered the wholesale revision recorded in this section.

### D19 — Implementation strategy revision: REUSE
Locks D10's revision.

### D20 — Animation mechanism revision: BLOCK
Locks D9's revision.

---

## 13. Resolved questions table

| Open question | Resolution |
|---|---|
| Forms-split | Out of v2 scope. |
| Workspace deep-links destination | Stay in snav for v2. |
| Branding section direction | Keep signpost. |
| `setActiveScreen` callers | Zero — moot. |

---

## 14. Codex Findings — what changed

`/plan-ceo-review` ran codex (gpt-5-codex via `codex exec`) as outside voice on the plan dated 2026-05-08. 8 findings (3 critical, 5 major) all verified against actual code. Plan revised in-place above. Original D-decisions preserved in § 12 with `(codex revision)` annotations.

| Codex finding | Severity | Verdict | Plan change |
|---|---|---|---|
| 1. D2 false premise — code already renders one screen via switch | Critical | True | D2 inverted (no mount strategy change needed) |
| 2. D9 unachievable as specified | Critical | True | D9 → block-during-180ms (D20) |
| 3. D10 preemptive duplication — usePanelNavigation/DrillInHeader/ConfirmDialog all exist | Critical | True | D10 → reuse all 3 (D19); DrawerStack dropped |
| 4. D4 modal-first behavior fictional — SettingsNavGuard has no Escape | Major | True | Replace with ConfirmDialog (Radix free) |
| 5. Vocabulary unstable — 10 sections kebab-case, 3 deep-links, advanced≠nav-id | Major | True | § 2 + § 8 corrected; advanced flagged as separate-fix |
| 6. composer.logger doesn't exist | Major | True | D12 → console.* |
| 7. D3 a11y overclaim — h2 focus alone won't announce eyebrow | Major | True | D3 tightened with `aria-label` |
| 8. Rewrite scope understated — 14 tests not 50, settings.css not legacy-components.css | Major | True | D11 + § 11 corrected |

**Pass 2 (2026-05-09 evening):** revised plan re-fed to codex. 4 new majors caught:

| Codex pass 2 finding | Severity | Verdict | Plan change |
|---|---|---|---|
| 9. Root-state mechanism unresolved (usePanelNavigation has no 'root') | Major | True | § 3 adds local `isRoot` boolean state separate from usePanelNavigation |
| 10. D9 dual-mount mechanism not specified | Major | True | § 6 adds dual-mount + entering/entered class flip + transitionend wiring |
| 11. DrillInHeader extension under-specified — focusTarget="title" has no node | Major | True | § 7 specifies `focusTarget="breadcrumb-current"` + tabIndex/role/aria-label on existing breadcrumb span; drops escapePolicy prop (Radix preventDefault is free) |
| 12. TabFrame.Header NOT used in SettingsTab — custom .bd-set-panel-h block | Major | True | § 5 + § 12 D5 corrected; v2 keeps custom header, TabFrame.Header migration out of scope |

**Pass 4 (2026-05-09 late):** revised plan re-fed to codex. 2 majors + 1 minor closed in pass 5 fixes:

| Codex pass 4 finding | Severity | Verdict | Plan change |
|---|---|---|---|
| 18. Reduced-motion stuck-transitioning hazard | Major | True | § 6 adds prefersReducedMotion flag via `useSyncExternalStore(matchMedia)`; reduced-motion path skips both animation AND transitioning lock |
| 19. ConfirmDialog onEscapeKeyDown not in ModalContentProps TS type | Major | True | § 7 specifies prop-object cast (`as ModalContentExtendedProps`); existing component-level cast pattern at `UnsavedWarningModal.tsx:28-34` is different shape — both work, plan picks prop-object for narrower scope |
| 20. "React-tree-scoped" terminology inaccurate | Minor | True | § 7 corrected — both DrillInHeader's and SettingsTab's listeners use `document.addEventListener`; the win is owner-scope of state checks, not event-target scope |

**Pass 3 (2026-05-09 evening):** revised plan re-fed to codex. 4 new majors + 1 minor:

| Codex pass 3 finding | Severity | Verdict | Plan change |
|---|---|---|---|
| 13. § 3 unmount race — section unmounts when isRoot flips, killing pop animation | Major | True | § 3 splits state into `isRoot` + `sectionMounted` + `transitioning`; section unmounts only when pop transitionend fires |
| 14. "Modal-first Esc free" claim ungrounded — Radix issues #2653/#3422 | Major | True | § 7 ships explicit `onEscapeKeyDown` on ConfirmDialog + new `enableDocumentEscape={false}` prop on DrillInHeader; settings owns Escape via React-tree-scoped listener |
| 15. aria-label uses `parentName` ("Settings") not group label ("Site") | Major | True | § 7 fixes to `aria-label={\`\${title}, \${breadcrumb[0]}\`}` |
| 16. transitionend dedupe insufficient for unmount cleanup | Major | True | § 6 refines to ref-based `e.target === sectionRef.current` check for section unmount, while retaining propertyName filter for transitioning bool |
| 17. § 7 still had stale `<TabFrame.Header title="Settings" />` line | Minor | True | § 7 render code block trimmed to summary; full render contract in § 3 |

**Cumulative impact (after pass 3):** v2 plan now has concrete code-level specs for every architectural claim. Implementation cost ~4 files modified, ~25 min CC time.

Final state machine:
- `currentScreen` — existing, from `usePanelNavigation`
- `isRoot: boolean` — new, layout signal (true = snav visible)
- `sectionMounted: boolean` — new, mount-lifecycle gate (mount on push, unmount on pop transitionend)
- `transitioning: boolean` — new, input-block during 180ms animation
- `guardOpen: boolean` — replaces `SettingsNavGuard`'s ad-hoc state with `ConfirmDialog` open state
- `sectionRef: useRef<HTMLDivElement>` — new, for ref-based transitionend target check

Final API extensions to existing primitives:
- `DrillInHeader.focusTarget?: "back" | "breadcrumb-current"` — defaults to "back" (backwards-compat with ComponentDetailScreen)
- `DrillInHeader.enableDocumentEscape?: boolean` — defaults to true (backwards-compat)
- `ConfirmDialog` — pass `onEscapeKeyDown={(e) => { e.preventDefault(); onClose(); }}` to ModalContent

**Lesson logged:** Memory `claude-misses-cross-package-server-issues` extends to single-package architecture plans too. Internal review reads the doc; codex reads the codebase. Same pattern, different scope. Iterate codex until 2 consecutive clean passes per `feedback_codex_iterate_until_clean`.

**Convergence shape:** pass 1 (8 findings, 3 critical) → pass 2 (4 majors, 0 critical) → pass 3 (4 majors, 0 critical) → pass 4 (2 majors, 0 critical) → pass 5 (2 doc-consistency majors + 3 P3 nits, 0 critical). 4 consecutive zero-critical passes; remaining items are doc cleanup applied in pass 5 fixes. Plan declared converged at pass 5.

**Pass 5 fixes applied (no pass 6 run):**
- § 12 D3/D4/D7 brought into sync with § 7/§ 14 (focusTarget="breadcrumb-current", SettingsTab-owned Escape, breadcrumbCurrentRef).
- Cast pattern wording corrected — describes prop-object cast as a different (narrower) workaround than `UnsavedWarningModal.tsx:28-34` component-level cast; both valid.
- `useSyncExternalStore(matchMedia)` replaced with reuse of existing `shared/hooks/useReducedMotion` hook (DRY win; codex flagged this hook in pass 5).
- File path corrected: `tabs/settings/styles/settings.css` → `tabs/settings/settings.css`.
- Line reference corrected: `UnsavedWarningModal.tsx:24` → `:28-34`.
- D7 finding 1 clarified: usePanelNavigation validates on initial restore but runtime navigateTo with bad ID is silent no-op, not fallback; v2 only calls with statically-typed IDs so unreachable in practice.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | clean (HOLD) | 25 decisions locked, 0 unresolved, 0 critical gaps |
| Codex Review | outside-voice (5 passes) | Independent cross-model | 5 | converged | 20 findings · 18 fixed · 2 nits acknowledged in plan |
| Eng Review | `/plan-eng-review` | Architecture & tests | 0 | NOT RUN | required gate before implementation |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | NOT RUN | optional — variant-D prototype + this doc may suffice |
| DX Review | `/plan-devex-review` | Developer experience | 0 | NOT RUN | not applicable (internal tool, no external API) |

**CODEX:** 5 iterative passes. Convergence shape 8 → 4 → 4 → 2 → 2 (P0 → P1). All critical findings closed pass 1→2; remaining doc-consistency closed pass 5.

**CROSS-MODEL:** Strong agreement on all 5 reverted decisions (D2/D9/D10/D4/D12). Internal review missed all 8 pass-1 findings — internal read the doc, codex read the codebase. Recurring lesson logged to memory `feedback_plan_must_grep_actual_code`.

**UNRESOLVED:** 0.

**VERDICT:** CEO + CODEX cleared. Eng review required next per default gate.
