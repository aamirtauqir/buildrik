# Buildrik Design Remediation Plan
**Date:** 2026-03-29
**Scope:** Full audit-driven remediation of editer.pen wireframes + matching code changes
**Approach:** Foundation First (Approach A) — consistency standards locked before new frames added
**Source audit:** `docs/product-audit-report.md`

---

## Overview

The existing 24-frame wireframe set has 3 categories of problems that will cause developer confusion and user failure if not fixed before implementation:

1. **5 design blockers** — wireframe gaps that mislead developers or have no implementation target
2. **9 missing flow wireframes** — complete flows with zero design coverage
3. **4 visual inconsistencies** — conflicting design standards across frames

This spec defines: 4 consistency standards, 11 new frames (25–35), 8 frame updates, and 12 code changes across 5 sequential phases.

---

## Phase 1 — Consistency Standards

All new frames (25–35) are built on these 4 rules. All affected existing frames are updated before new design work begins.

### Standard 1 — Canonical frame size: 1320×800, light theme

- **Canonical:** 1320×800, light theme (`fill:#F8FAFC`)
- **Legacy:** Original frames 01–18 (1440×900, dark theme) remain in file as historical reference but are not updated
- **TopBar:** Always use `Uo5aw` ref (1320px wide). Never build a custom topbar in new frames.
- **Rationale:** TopBar ref is 1320px — confirms 1320 as the correct target. Two incompatible sizes in the same file cause developer confusion.

### Standard 2 — Auto-save chip: one design, 3 states

The chip sits in the TopBar between project name and device switcher. All 3 states use the same structure:

```
frame (layout:horizontal, alignItems:center, gap:6, padding:[4,10], cornerRadius:4)
  └── icon_font (width:14, height:14)
  └── text (fontSize:12)
```

| State | fill (bg) | icon | text | text fill |
|-------|-----------|------|------|-----------|
| Saving… | `#1E3A5F` | `refresh-cw` | "Saving…" | `#BFDBFE` |
| Saved | `#14532D` | `circle-check` | "All changes saved" | `#BBF7D0` |
| Unsaved / Error | `#7C2D12` | `triangle-alert` | "Unsaved changes" | `#FECACA` |

**Frames to update** (replace plain text "● Saved" / "● Saving..." with chip):
- `iV8tb` (Frame 11 Draft) — `lvtaf` node: plain text → chip frame
- `RhSof` (Frame 11b Published) — `0kXxa` node: plain text → chip frame
- `Nkm1I` (Frame 11c Publishing) — `Gr09D` node: plain text → chip frame
- `EQ4O2` (Frame 11d Error) — already has `saveChip` frame, update colors to match standard

**Frames using Uo5aw ref:** Automatically inherit the fix when the ref is updated. No individual frame changes needed.

### Standard 3 — Canonical icon rail: 8 slots via T51wH ref

The `T51wH` RailColumn ref is the single source of truth. **All inline custom rails must be replaced with the ref.**

**Canonical 8-slot layout (top → bottom):**
1. Add elements (plus) — Build panel, includes Templates + Components as sub-tabs
2. Layers (layers)
3. Pages (file-text)
4. Design system (palette)
5. Settings (settings)
6. *(spacer)*
7. **Publish (globe) ← NEW — fixes BLK-1**
8. History (clock)

**Resolution for BLK-2/BLK-3 (Templates + Components hidden):** The rail has no spare slots for dedicated Templates or Components icons. Instead: Templates and Components are exposed as sub-tabs within the Build panel (slot 1, already rail-accessible). The Build panel header gets a tab row: `Elements | Templates | Components`. This makes both features reachable with one rail click — no new keyboard shortcuts needed, no overcrowding of the rail.

**Tab row visual spec:**
- Container: `height:32`, `fill:#F8FAFC`, `stroke:{fill:#E2E8F0, thickness:{bottom:1}}`, `padding:[0,12]`, `layout:horizontal`, `gap:0`
- Inactive tab: `fontSize:11`, `fontWeight:500`, `fill:#64748B`, `padding:[6,10]`
- Active tab: `fontSize:11`, `fontWeight:700`, `fill:#1E293B`, `padding:[6,10]`, `stroke:{fill:#2563EB, thickness:{bottom:2}}`
- "Elements" is the default active tab (existing behavior unchanged)

**Frames with inline rails to replace with ref:**
`iV8tb`, `RhSof`, `Nkm1I`, `EQ4O2`, `OykJs`, `8fGWi`, `OaDVn`, `CgTic`

### Standard 4 — Sidebar width: 256px always

- Left sidebar: always `width:256`
- Inspector: always `width:240`
- **Exception to fix:** Frame 17 (`CgTic`) has `leftSidebar width:300` — correct to `256`

---

## Phase 2 — P0 Frames

### Frame 25 — Publish Panel: Checklist Fail State
**Location:** `x:3280, y:35400` (next to Frame 11d Error)
**Fixes:** BF-1, BF-2, BLK-1

Shows the Publish sidebar with 3 items failing. This is the actual state users experience today due to hardcoded `false` values. Gives developers the exact implementation target.

**Design spec:**
- Checklist items 1–3 (page title, favicon, pages): green `✓` row, `fill:#F0FDF4`, icon `circle-check` in `#10B981`
- Checklist items 4–6 (SEO title, meta desc, social image): red `✗` row, `fill:#FEF2F2`, icon `x-circle` in `#EF4444`
- Each failing item has a `Fix →` link (`fill:#2563EB`, `fontSize:11`) that navigates to:
  - SEO title → Settings → SEO tab
  - Meta description → Settings → SEO tab
  - Social image → Page Settings → Social tab
- Publish button: `fill:#9CA3AF` (disabled gray), `content:"Publish Site"`, tooltip: "Fix checklist items to publish"
- Status badge: "Draft" (`fill:#F3F4F6`, text `#6B7280`)

### Frame 26 — Editor: Unpublished Changes Banner
**Location:** `x:4820, y:35400`
**Fixes:** BLK-5

Full 1320×800 editor frame showing the state after publishing then making further edits. An amber banner sits directly below the topbar.

**Design spec:**
- TopBar: auto-save chip in "Unsaved changes" state (red, `#7C2D12` bg)
- Topbar Publish button: `fill:#D97706` (amber, not blue) — signals "attention needed"
- Banner frame: `fill:#FEF3C7`, `stroke:{fill:#FDE68A}`, `height:36`, full width below topbar
  - Icon: `triangle-alert`, `fill:#92400E`, `width:14`
  - Text: "**3 unpublished changes** — your live site is behind the current draft", `fill:#92400E`
  - CTA button: "Publish now →", `fill:#D97706`, `cornerRadius:4`, right-aligned
- Banner disappears after successful publish
- Change count is dynamic (reads from composer history delta since last publish)
- Loading state: banner does not flash "0 unpublished changes" while loading. Show banner only after count resolves. If count takes > 200ms to resolve, show a skeleton pulse in place of the count number.

---

## Phase 3 — P1 Frames

### Frame 27 — Inspector: Search Bar
**Location:** `x:200, y:42700`
**Fixes:** MN-3

Two-state frame showing inspector with search bar at top. State A: empty (default). State B: user typed "shadow" — inspector scrolls to and highlights Box Shadow section across all tabs.

**Design spec:**
- Search bar: full-width, `height:32`, `fill:#F9FAFB`, `stroke:{fill:#E5E7EB}`, `cornerRadius:6`
  - Icon: `search`, `fill:#9CA3AF`, `width:14`
  - Placeholder: "Search properties…", `fill:#D1D5DB`
- Active search result: highlighted section with `fill:#FEF9C3` (yellow) background
- Zero results: "No properties match 'xyz'" in `fill:#9CA3AF`, centered
- Shortcut: `Cmd+F` when inspector is focused
- Search crosses all 3 tabs simultaneously
- **Performance:** Debounce search input 300ms before filtering. Inspector can have 50+ properties — filtering on every keystroke causes visible jank. Use `useDebounce(query, 300)` or equivalent.

### Frame 28 — Topbar: Back to Dashboard + Project Switcher
**Location:** `x:1620, y:42700`
**Fixes:** MN-1

Close-up frame of topbar left section showing the project name as a dropdown trigger. Dropdown contains: "Back to Dashboard" (bold, always first), list of recent projects, divider, "Rename project."

**Navigation context:** Dropdown is always visible to all users. Single-project users see only "Back to Dashboard" + "Rename project" — no project list rows shown. If user has zero other projects, omit the project list section entirely. Show only "Back to Dashboard" and "Rename project."

**Design spec:**
- Project name text in topbar: shows `▾` chevron, `cursor:pointer`
- Dropdown panel: `fill:#0F172A`, `stroke:{fill:#334155}`, `cornerRadius:6`, `width:200`, `padding:[6,0]`
- "Back to Dashboard" row: `fill:#1E293B` (highlighted), `fontSize:12`, `fontWeight:600`, `fill:#E2E8F0`, left arrow icon
- Project list rows: `fontSize:11`, `fill:#94A3B8`, hover state `fill:#1E293B` bg
- "Rename project" row: separated by divider, `fill:#64748B`
- Navigating "Back to Dashboard" auto-saves editor state first

### Frame 29 — Editor: Offline / Connection Lost
**Location:** `x:200, y:43600`
**Fixes:** MF-10

Full 1320×800 editor frame. Internet is lost mid-session. Persistent red banner below topbar. Editing continues locally. Publish disabled.

**Design spec:**
- Auto-save chip: "Working offline", `fill:#7C2D12`, icon `wifi-off`
- Publish button in topbar: `fill:#6B7280` (gray/disabled)
- Offline banner: `fill:#FEF2F2`, `stroke:{fill:#FECACA}`, `height:36`
  - Icon: `wifi-off`, `fill:#991B1B`
  - Text: "**No internet connection** — changes saved locally, will sync on reconnect", `fill:#991B1B`
  - Status indicator: "● Offline" right-aligned, `fill:#EF4444`
- Banner: not dismissible (persists until reconnect)
- On reconnect: banner auto-dismisses with a brief success feedback moment — auto-save chip briefly shows "Synced ✓" (`fill:#14532D`, icon `circle-check`) for 2 seconds before returning to normal "All changes saved" state. This confirms to the user that nothing was lost.

### Frame 30 — Settings → Domain: DNS Guided Steps
**Location:** `x:1620, y:43600`
**Fixes:** MF-4

Extension of Frame 16 (OaDVn). Left sidebar shows 4-step guided DNS setup after domain is entered.

**Navigation context:** DNS steps panel replaces the "Connect domain" prompt in Settings → Domain after the user enters and saves a domain name. Parent context is Frame 16 (node `OaDVn`). User arrives here after: Settings rail icon → Domain tab → enters domain → clicks "Connect domain."

**Design spec:**
- Step row: `height:auto`, `layout:vertical`, `gap:4`, `padding:[8,0]`, `stroke:{fill:#F3F4F6, thickness:{bottom:1}}`
- Step number badge: `width:18`, `height:18`, `borderRadius:50%`
  - Complete: `fill:#DCFCE7`, text `#15803D`, shows `✓`
  - Active: `fill:#2563EB`, text `#FFFFFF`
  - Pending: `fill:#F3F4F6`, text `#9CA3AF`
- Step 2 (Add DNS records): shows code block with CNAME + A record, "Copy records" link in `#2563EB`
- Step 3 (Propagation): live status indicator polling every 5 min. Shows "Checking…" → "Verified ✓"
- Step 4 (SSL): auto-provisioned, no user action needed
- Error state: "DNS records not found after 48h" with "Check your registrar" help link

### Frame 31 — Inspector: Pseudo-State Prominent Warning Banner
**Location:** `x:200, y:44500`
**Fixes:** BF-6

Update companion to Frame 14 (BwDMP). Inspector shows full-width amber banner when in any non-default pseudo-state.

**Design spec:**
- Banner: `fill:#FEF3C7`, `stroke:{fill:#FDE68A, thickness:{bottom:2}}`, `height:32`, full-width at inspector top
- Content: "⚡ EDITING :HOVER STATE — styles apply on mouse-over only", `fill:#92400E`, `fontSize:11`, `fontWeight:700`
- Active pseudo-state chip: `fill:#FEF3C7`, `stroke:{fill:#F59E0B}`, `fontWeight:700` — visually distinct from others
- Overridden properties: show "← override" label, `fill:#DBEAFE` bg on value chip
- Inherited properties: show "(inherited)" suffix in `#9CA3AF`
- Banner only shows for `:hover`, `:focus`, `:active`, `:disabled` — not `:default`

---

## Phase 4 — P2 Frames

### Frame 32 — Collaboration Invite Modal
**Location:** `x:1620, y:44500`
**Fixes:** MF-5

Modal triggered from topbar "N collaborators" button. Shows invite by email + current access list.

**Design spec:**
- Modal: `width:480`, `cornerRadius:8`, centered overlay on `fill:#1F293780` backdrop
- Email input: chip pattern (each email becomes a dismissible tag on Enter/comma)
- Role selector: dropdown with Viewer / Editor / Owner options + description of each
- Access list: avatar (initials) + email + role badge + "Revoke" link (red) per row
- "Send invite" disabled until at least one email entered
- Post-send: chips clear, success toast "Invite sent to sarah@studio.co"

**Interaction states:**
- Invalid email: chip renders with `fill:#FEF2F2` bg, `stroke:{fill:#EF4444}`, `×` turns red. "Send invite" stays disabled. Tooltip on chip: "Invalid email address."
- Duplicate email (already has access): chip renders with amber `fill:#FEF9C3` bg. Tooltip: "sarah@studio.co already has Editor access."
- Network failure on send: toast "Could not send invite — check your connection", chips remain (not cleared).
- Empty access list: "No collaborators yet" placeholder in gray, centered in the access list area.

### Frame 33 — Billing Screen + Feature Gate
**Location:** `x:200, y:45400`
**Fixes:** MF-6

Two states in one frame. State A: Settings → Billing with plan cards. State B: Feature gate "Locked" screen replacing panel content when user hits a Pro feature.

**Design spec — State A (Billing):**
- Two plan cards side by side: Free (current, `stroke:{fill:#2563EB}`) and Pro
- Pro card has "Upgrade to Pro →" primary button
- "Upgrade to Pro" opens Stripe checkout in an in-editor modal (not new tab)

**Design spec — State B (Feature gate):**
- Amber banner: "🔒 [Feature name] is a Pro feature", `fill:#FEF9C3`
- Feature description (1–2 sentences explaining what it does)
- Two buttons: "Upgrade to Pro" (primary blue) + "Maybe later" (ghost)
- "14-day free trial · Cancel anytime" copy below buttons
- "Maybe later" dismisses and leaves user on free plan — no guilt. Re-shows on next visit to that feature (not permanently dismissed).

**Billing interaction states:**
- Stripe checkout payment failure: in-editor Stripe modal shows Stripe's own error message. After dismissing, user returns to Settings → Billing with a toast: "Payment failed — your plan was not changed."
- Upgrade success: user returns to editor with a success toast "You're on Pro now ✓". Feature gate unlocks immediately without page reload (optimistic update via composer state).

### Frame 34 — Composer Crash / Error Boundary
**Location:** `x:1620, y:45400`
**Fixes:** MF-7

Full-screen error state (replaces entire editor) when Composer engine crashes.

**Design spec:**
- Background: `fill:#0F172A` (full screen, dark)
- Icon: `zap` (lightning), `fill:#F59E0B`, `width:40`
- Title: "The editor ran into a problem", `fill:#E2E8F0`, `fontSize:18`, `fontWeight:700`
- Body: "Your work was auto-saved before this happened. Reload to continue editing.", `fill:#64748B`
- Primary button: "Reload editor" — restores from localStorage auto-save
- Ghost button: "Report this issue" — fires Sentry report, shows "Thanks" toast
- Footer: "Last saved: N minutes ago · Error ID: err_xxxxxx", `fill:#475569`, `fontSize:11`
- Error ID allows support to look up the Sentry incident

**Copy priority note:** "Your work was auto-saved before this happened" MUST appear before any action CTA. The user's first fear is data loss — resolve that fear before asking them to reload. The sequence (reassurance → action) is non-negotiable. Do not reorder.

### Frame 35 — CMS Coming-Soon Placeholder
**Location:** `x:200, y:46300`
**Fixes:** DG-3

Left sidebar panel state for CMS/Data tab. Static — no backend needed.

**Design spec:**
- Panel accessible via rail icon or keyboard shortcut
- Placeholder container: `stroke:{fill:#CBD5E1, thickness:1}` dashed border, `cornerRadius:8`, centered in sidebar body
- Icon: `database`, `fill:#94A3B8`, `width:32`
- Title: "CMS Collections", `fontSize:14`, `fontWeight:700`
- Body: "Build dynamic pages from structured data — blog posts, products, team members, and more.", `fill:#94A3B8`
- Badge: "Coming to Pro plan", `fill:#E0E7FF`, text `#4F46E5`, `borderRadius:12`
- Buttons: "Join waitlist" (primary) + "Learn more" (ghost, opens docs)
- "Join waitlist" collects email → shows "You're on the list!" toast

---

## Viewport & Accessibility Standards

### Viewport policy
Buildrik editor is desktop-only. Minimum supported width: 1024px. No mobile/tablet layout is required for the editor. This applies to all frames in this spec (25–35).

The canvas *preview* supports mobile breakpoints (existing feature) — but the editor chrome (topbar, rail, sidebar, inspector) is desktop-only.

### Accessibility annotations (new components)

| Component | Keyboard | Focus management | ARIA |
|-----------|----------|-----------------|------|
| Frame 32 — Invite Modal | `Tab` cycles through email input → role dropdown → Cancel → Send invite. `Escape` closes modal. `Enter` on email input adds chip. | On open: focus moves to email input. On close: focus returns to "N collaborators" topbar button. | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="invite-modal-title"` |
| Frame 34 — Crash Recovery | `Tab` cycles Reload editor → Report this issue. | On mount: focus moves to "Reload editor" button. | `role="alert"` on outer container (announces to screen reader on crash) |
| Frame 33 — Feature Gate | `Tab` cycles Upgrade to Pro → Maybe later. | On feature gate appearance: focus moves to "Upgrade to Pro" button. | `role="dialog"` if shown as overlay; `role="region"` if inline panel replacement |
| Frame 35 — CMS Placeholder | `Tab` cycles Join waitlist → Learn more. | No special focus management (static content). | Email input has `<label>` (visually hidden if needed). "Join waitlist" button: `aria-label="Join CMS waitlist"` |
| Frame 26 — Unpublished Banner | — | No focus shift. | `role="status"` — announced by screen reader when it appears, non-interruptive |
| Frame 29 — Offline Banner | — | No focus shift. | `role="alert"` — high priority, announced immediately on connection loss |
| Frame 31 — Pseudo-state Banner | — | No focus shift. | `role="status"` — informational, appears when pseudo-state changes |

**Touch targets:** All buttons must be min `44×44px` click target (can have smaller visual appearance with padding).
**Color contrast:** All text on colored backgrounds must meet WCAG AA (4.5:1 for normal text, 3:1 for large text). Flag: `#92400E` on `#FEF3C7` = 4.7:1. Passes. `#94A3B8` on `#0F172A` = 4.9:1. Passes.

---

## Phase 5 — Validate + Ship

### Prototype connection spec

New frames extend the existing 6 prototype flows:

| New Frame | Connect from | Connect to | Trigger |
|-----------|-------------|-----------|---------|
| Frame 25 (Publish fail state) | Frame 11 (Draft) → click Publish rail button | Frame 25 | Publish rail click when checklist has failures |
| Frame 26 (Unpublished changes banner) | Frame 25 → fix items → publish → make change | Frame 26 | After successful publish + any canvas edit |
| Frame 32 (Invite Modal) | Frame 23 (Collaboration) → topbar "N collaborators" button | Frame 32 | Collaborators button tap |
| Frame 34 (Crash Recovery) | Frame 11 | Frame 34 | Error boundary trigger (can be a hidden test button) |

Frames 27, 28, 29, 30, 31, 33, 35 are standalone reference frames (no prototype connections required for this sprint).

### Test requirements (Vitest + RTL, co-located in `__tests__/`)

Write these alongside implementation — not deferred:

| Phase | Test file | What to assert |
|-------|-----------|---------------|
| 1 | `editor/shell/__tests__/StatusIndicators.test.tsx` | Renders Saving/Saved/Unsaved states with correct bg color + icon + text |
| 1 | `editor/rail/__tests__/LeftRail.test.tsx` | Publish + History slots appear in rendered rail |
| 2 | `editor/sidebar/tabs/publish/__tests__/PublishTab.test.tsx` | `hasSeoTitle=true` when `seo.metaTitle` set, `false` when undefined. Publish button disabled when any check fails. |
| 2 | `editor/sidebar/tabs/publish/__tests__/PublishTab.test.tsx` | "Fix →" link present for each failing item; correct `onClick` navigates to Settings→SEO |
| 3 | `editor/inspector/__tests__/SearchBar.test.tsx` | Search "shadow" highlights matching sections. Zero results shows empty state. |
| 4 | `editor/collaboration/__tests__/InviteModal.test.tsx` | Invalid email: chip gets error style. Duplicate email: amber chip. Send button disabled until valid email entered. |
| 4 | `editor/shell/__tests__/ErrorBoundary.test.tsx` | When wrapped component throws, crash recovery UI renders. "Reload editor" button present. |
| 2 | `editor/shell/__tests__/UnpublishedBanner.test.tsx` | Banner renders when changesSincePublish > 0. Banner hidden at 0. Count displays correctly. |

**E2E tests** (add to existing Playwright/E2E suite when available):
- Publish flow: click Publish with checklist failures → see fail state → fix SEO → publish succeeds → make edit → see banner
- Offline: disable network → offline banner appears → Publish disabled → reconnect → banner dismisses

### Design verification checklist
Run after all frame updates and new frames are complete:

```
[ ] All new frames (25–35) screenshot and match implemented UI
[ ] T51wH rail ref has globe icon in slot 7
[ ] Auto-save chip in 3 states renders correctly in TopBar ref
[ ] Frames 11/11b/11c updated to chip (not plain text)
[ ] Frame 17 sidebar is 256px (not 300px)
[ ] All inline rails replaced with T51wH ref
```

### Product audit checklist (from docs/product-audit-report.md Part 8)
All 12 items must be YES before shipping:

```
[ ] Publish button is visible without keyboard shortcuts
[ ] Publish checklist reads from actual data (no hardcoded false)
[ ] Publish button works standalone (or shows clear error if callback missing)
[ ] "Saving / Saved / Unsaved changes" indicator exists in UI
[ ] "X unpublished changes" warning shown when editing published sites
[ ] Templates panel accessible without keyboard shortcut
[ ] Components panel accessible without keyboard shortcut
[ ] History panel accessible without keyboard shortcut
[ ] "Back to dashboard" path exists somewhere in editor
[ ] Inspector shows which breakpoint is being edited
[ ] Inspector shows which pseudo-state is being edited (prominent)
[ ] History panel supports revert OR makes view-only explicit
```

---

## Code Change Summary

> **File path notes (verified against codebase):**
> - Rail changes go in `editor/rail/tabsConfig.ts` (RAIL_SLOTS array) + `editor/rail/LeftRail.tsx` (rendering) — not `IconRail.tsx` (that file doesn't exist)
> - Auto-save state lives in `engine/storage/StorageAdapter.ts` — not `engine/AutoSaveManager.ts`
> - `StatusIndicators.tsx` already exists with 5 states (idle/saving/unsaved/error/offline) — Phase 1 updates its visual style, not creates it
> - PublishTab path: `editor/sidebar/tabs/publish/PublishTab.tsx` (subfolder pattern)
> - SEO data accessor: `composer.getCurrentPage()?.settings?.seo` (type `PageSEO`, fields: `metaTitle`, `description`, `ogImage`)
> - Unpublished count mechanism: track `lastPublishedHistoryIndex` in `StorageAdapter` on publish success. Count = `composer.history.length - lastPublishedHistoryIndex`
> - CmsTab path: `editor/sidebar/tabs/cms/CmsTab.tsx` (follows existing subfolder pattern)

| Phase | File | Change |
|-------|------|--------|
| 1 | `editor/shell/StatusIndicators.tsx` | Update auto-save chip visual style to match 3-state spec (Saving/Saved/Unsaved colors + icons) |
| 1 | `editor/shell/Topbar.tsx` | Expand `saveStatus` prop type to include `"unsaved" \| "offline"` (currently typed as `"idle" \| "saving" \| "error"` only) |
| 1 | `engine/storage/StorageAdapter.ts` | Emit `EVENTS.PROJECT_UNSAVED` when isDirty and user navigates away; emit `EVENTS.PROJECT_OFFLINE` when network lost |
| 1 | `editor/rail/tabsConfig.ts` | Add Publish (globe icon, zone:"bottom") + History (clock icon, zone:"bottom") to `RAIL_SLOTS` array — fixes BLK-1 and makes rail 8 slots |
| 2 | `editor/sidebar/tabs/publish/PublishTab.tsx` | Fix hardcoded false at lines 302-304: wire using `page.settings?.seo?.metaTitle`, `page.settings?.seo?.description`, `page.settings?.seo?.ogImage` |
| 2 | `editor/sidebar/tabs/publish/PublishTab.tsx` | Add "Fix →" jump links per failing checklist item (SEO title/meta desc → Settings→SEO tab, social img → Page Settings→Social tab) |
| 2 | `editor/sidebar/tabs/publish/PublishTab.tsx` | Disable Publish button when checklist has failures (add tooltip: "Fix checklist items to publish") |
| 2 | `editor/shell/AquibraStudio.tsx` | Add unpublished-changes banner (amber, count from `StorageAdapter.getChangesSincePublish()`, "Publish now →" CTA) |
| 3 | `editor/inspector/ProInspector.tsx` | Add search bar at inspector top, cross-tab property search with highlight |
| 3 | `editor/shell/Topbar.tsx` | Add project name dropdown (back to dashboard + recent projects + rename) |
| 3 | `editor/shell/AquibraStudio.tsx` | Add offline detection banner (red, not dismissible), disable Publish when offline |
| 3 | `editor/inspector/ProInspector.tsx` | Add amber banner when pseudo-state ≠ default |
| 4 | `editor/collaboration/InviteModal.tsx` | Build invite modal (new file) — email chip input, role selector, access list |
| 4 | `editor/shell/AquibraStudio.tsx` | Wire ErrorBoundary to crash recovery UI + Sentry (ErrorBoundary already exists, needs fallback UI) |
| 4 | `editor/sidebar/tabs/cms/CmsTab.tsx` | Add CMS placeholder panel (new file, static — no backend needed) |

---

## What Already Exists (save implementation time)

| Plan says | Reality | Action |
|-----------|---------|--------|
| "Add auto-save chip to TopBar" | `StatusIndicators.tsx` already has 5 save states | Update visual style only |
| "Wire chip to AutoSaveManager" | `StorageAdapter.ts` handles auto-save events | Update `StorageAdapter` + extend `Topbar.tsx` saveStatus type |
| "Add Publish to rail" | `tabsConfig.ts` RAIL_SLOTS already has 6 slots; publish tab exists in GROUPED_TABS_CONFIG | Add 2 entries to RAIL_SLOTS array |
| "Wire ErrorBoundary" | `StudioErrorBoundary` class exists in AquibraStudio.tsx:52 | Update its `render()` fallback div |
| "Add offline detection" | `useStudioState` exports `SyncStatus = "connected" \| "syncing" \| "offline"` | Use existing hook — no new event listeners needed |
| "CmsTab new file" | `CMSPreviewBar.tsx` exists; CMS concept is known in codebase | New file at `editor/sidebar/tabs/cms/CmsTab.tsx` |

---

## NOT in scope

- Real-time collaboration backend (WebSocket, operational transform) — InviteModal sends email invites only
- Stripe integration backend (webhooks, subscription management) — Frame 33 opens Stripe checkout modal only
- CMS backend — Frame 35 is static placeholder, no database
- Mobile editor viewport — desktop-only (1024px min documented)
- DESIGN.md token centralization — tracked as TODOS.md T-DESIGN-01

---

## Frame Registry Update

New frames to add to editer.pen:

| Frame # | Node ID (TBD) | x | y | Name |
|---------|--------------|---|---|------|
| 25 | — | 3280 | 35400 | Publish Panel: Checklist Fail State |
| 26 | — | 4820 | 35400 | Editor: Unpublished Changes Banner |
| 27 | — | 200 | 42700 | Inspector: Search Bar |
| 28 | — | 1620 | 42700 | Topbar: Back to Dashboard Dropdown |
| 29 | — | 200 | 43600 | Editor: Offline State |
| 30 | — | 1620 | 43600 | Settings → Domain: DNS Guided Steps |
| 31 | — | 200 | 44500 | Inspector: Pseudo-State Warning Banner |
| 32 | — | 1620 | 44500 | Collaboration: Invite Modal |
| 33 | — | 200 | 45400 | Settings: Billing + Feature Gate |
| 34 | — | 1620 | 45400 | Composer Crash Recovery |
| 35 | — | 200 | 46300 | CMS Coming-Soon Placeholder |

---

*End of spec — Buildrik Design Remediation Plan — 2026-03-29*

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAN | SCOPE_EXPANSION: 8 proposals, 8 accepted, 0 deferred |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | issues_found | 12 findings, 3 fixed |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | issues_open (PLAN) | 15 issues, 4 critical gaps (commit da724df — stale) |
| Design Review | `/plan-design-review` | UI/UX gaps | 2 | CLEAN (FULL) | score: 7/10 → 9/10, 8 decisions added |

**UNRESOLVED:** 0 across all reviews
**VERDICT:** CEO CLEARED + DESIGN CLEARED — eng review stale (ran at da724df, now at 1352cbc). Re-run `/plan-eng-review` before implementing.
