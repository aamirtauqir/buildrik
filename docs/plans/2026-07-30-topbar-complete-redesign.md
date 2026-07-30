# Topbar Complete Redesign — Variant B "Daily Three Promoted"

Date: 2026-07-30 · Branch: `ds/fresh-token-system` · Status: DESIGN PLAN (pre-implementation)
Approved direction: Variant B (comparison board `~/.gstack/projects/aamirtauqir-buildrik/designs/topbar-complete-20260730/`)

## 1. Context & problem

The shipped topbar (`editor/ui/Topbar.tsx`, Figma 681:122) is behaviorally solid after
the F1–F9 fix arc, but its IA is incomplete:

- `SiteMenu.tsx` carries a fourth "More" group with **12 items the design never
  placed** — the code itself labels them "not in the design; kept because nothing
  else reaches them. Every one of them is a Figma to-do."
- The three daily-loop actions (Preview, Comments, Issues) are 2 clicks deep in an
  overflow menu. Issues — the thing that decides whether Publish reads "Publish
  anyway" — is invisible until the user opens the menu or hits Publish.
- "Publish anyway" (errors > 0) publishes in one click with no confirm; TODOS.md:96
  records the missing frame as a founder decision waiting on design.

This plan gives every reachable feature a decided home, specifies every interaction
state, and defines the hi-fi wireframe + clickable prototype set (Flowbite
components, shipped `--bk-*` token values).

## 2. Bar IA (left → right)

Layout: flex row, 56px (`--bk-size-topbar`), white (`--bk-bg-card`), bottom hairline
(`--bk-border` #E5E7EB), 13px Inter, ink #111827. Children in order:

| # | Child | Behavior | Notes |
|---|-------|----------|-------|
| 1 | `‹ Exit` back button (D15-R) | Plain ghost back button via `guardNavigation` → workspace (dashboard/projects) | **D15 REVERSED by user 2026-07-30**: no monogram — just the back door. Litmus-#1 brand fail accepted as deliberate calm-chrome |
| 2 | Site name | truncate at 200px, `title` tooltip | live via PROJECT_METADATA_CHANGED |
| 3 | SaveStatus | 6 states (§4) | click = save/retry where meaningful |
| 4 | Review pill | 5 states (§4), click → Review panel | hidden when `state: none` |
| 5 | Spacer | flex 1 | |
| 6 | **★ Tool cluster** (NEW) | Preview · Comments · Issues | hairline right divider; see below |
| 7 | Presence | avatar stack + connection state | collab flag-gated, unchanged |
| 8 | Bell | unread dot, opens NotificationPanel | unchanged |
| 9 | Publish (primary) | 4 states (§4) | `action` slot still replaces it in client view |
| 10 | `⋯` SiteMenu | redesigned groups (§3) | |

**Tool cluster (the one new bar child):**

- **Quick preview** — IconButton (eye). Opens the in-shell preview overlay
  (`onPreview` / shell state 7). Tooltip "Quick preview" (D9: named apart from
  the menu's "Open client view" — two different concepts, two names). Busy
  state: spinner-in-place while `previewLoading`, `aria-busy`, re-click ignored.
- **Comments** — IconButton (bubble), **toggle** (`aria-pressed`), accent-tint
  active state. Fires `ui:comment-mode` (shell state 6). Tooltip "Comments · C".
- **Issues chip** — **always visible** (D6): neutral at zero (gray shield-check
  icon, no count, tooltip "No issues on this site", click still opens the
  Issues panel), amber count when warnings only, red count when errors > 0 —
  the colour previews the publish outcome ("Publish" vs "Publish anyway").
  Bar geometry never shifts; the chip is the permanent anchor and the zero
  state is the "all clear" reassurance before publishing.
- Cluster contents are exactly: Quick preview IconButton + Comments IconButton
  + IssueChip — nothing else, ever. Hairline divider on the cluster's right
  edge. **No further children may join the bar outside this cluster** — preserves
  the "no extra slot" discipline from the Topbar component contract.
- **Per role / view mode:** client view renders **Comments only** (client view
  is itself a preview; Publish is already replaced by the `action` slot).
  Viewers get Quick preview + Comments; the Issues chip stays visible but
  read-only-labelled ("2 issues — ask an editor").

**Status grammar & reading order (D7 — binding for all states):**

1. **Publish is the only strong CTA** — the single filled accent surface.
2. **The Issues chip is the sole owner of warning/error colour** in the bar.
3. **The review pill is neutral-unless-blocking**: info/success states render
   on a gray tint; only "Changes requested" may use the warning tint.
   Surface token: **NEW — add in Figma** (suggested name `bg-pill-neutral`;
   eng-review D3: purpose-named token, added via Figma export →
   `scripts/tokens/generate.mjs`, NEVER hand-edited; text `--bk-ink-soft`).
   Note: `--bk-bg-sunken` does not exist — an earlier draft referenced it;
   verified against tokens.generated.css.
4. **SaveStatus is text-first**: plain muted text for saved/saving/unsaved;
   only `error` (and `offline`) may render as a tinted pill.
5. Reading order under pressure: **1. Publish · 2. Issues chip · 3. Save state
   · 4. Review pill.** Nothing else may carry a filled or tinted background.
6. **Max two simultaneous warning-tone signals.** When save-offline (amber) and
   issues-amber and review-warning would co-occur, the review pill drops to
   neutral — amber arbitration favours the two publish-relevant signals.

## 3. Site menu IA (⋯, Figma 642:3664 successor)

Five named groups (uppercase 11px labels, `--bk-ink-muted`), no "More" dump:

| Group | Items (kbd) | Conditions |
|-------|-------------|------------|
| **Site** | Site settings (⌘,) · Version history (⌃H / Ctrl H) · Publish history · Export code | — |
| **Build** | Templates · Components (⇧A) · Design system · Plugins | — |
| **Share** | Open client view · View live site · Copy live URL | live rows only when `publishedUrl` |
| **Workspace** | Invite teammates · Account settings · Start collaboration | collab row flag-gated + not connected |
| *(footer)* | Keyboard shortcuts (?) | — |

Moves out of the menu: Preview, Comments, Issues → bar cluster (§2).
Removed outright (D8): "Exit to dashboard" — the bar's ‹ Exit is always visible;
a second door in the overflow was dead weight (Figma 642:3664 delta).
Renamed (D9): "Preview as client" → "Open client view".
**Ask AI has no menu row** — the rail's ✨ AI tab is its single home; the legacy
`fourToolRail` mode keeps its existing menu row until that mode retires.
Client-view toggle stays a guarded full-page navigation (F1 path).

## 4. Interaction states (complete matrix)

**SaveStatus (5 + 1 future):** `saved` ("Saved · 2m ago", muted) · `saving`
(spinner) · `unsaved` (amber dot, "Unsaved — Save now", clickable) · `offline`
("Offline — queued", amber pill; outranks all others) · `error` ("Save failed —
Retry", red pill, clickable) · `conflict` ("Sync conflict", warning tone) —
**FUTURE, blocked on TODOS.md:109** (D11): shipped save derivation has no
persistent conflict source; conflict today surfaces only through the exit
dialog. Design is specified (wireframe carries it dashed-annotated) so the
pill lights up the day the save-honesty arc lands.

**Review pill (5):** In review (info) · Opened · no reply (info) · Changes
requested (warning) · Approved by {name} · {ago} (success) · Approved · edited
since (warning). All clickable → Review panel. `none` renders nothing.

**Publish (6, D10):** `ready` ("Publish", primary) · `anyway` ("Publish anyway"
— **opens the confirm modal, §5**) · `disabled` (focusable `aria-disabled`,
tooltip carries the reason: not-enabled / viewer / offline) · `busy`
("Publishing…", native disabled + spinner) ·
**`published` (success)**: toast "Published — site is live" with **[View live]
[Copy URL]** action buttons; the Publish button shows a transient "✓ Published"
(2s, success tint) then returns to `ready`; the Share menu rows appear
(conditioned on `publishedUrl`); announced via the bar's `aria-live` region ·
**`failed`**: error toast "Publish failed — {reason}" with **[Try again]**
action; button returns to `ready`; also announced. The victory moment lives at
the moment of victory — not two clicks deep in the overflow (F11).

**Cluster:** Comments pressed = accent tint + `aria-pressed="true"`. Issues chip
amber/red per severity; absent at 0.

**Bell:** unread dot (accent, 2px white ring); panel anchored bottom-end;
click-away + Esc dismiss. **Panel states (F9):** empty ("You're all caught up" +
muted bell glyph — warmth, not "No notifications."), loading (3 skeleton rows),
fetch-error ("Couldn't load notifications — Retry" row).

**Presence (F10, amended eng D14):** live (plain avatars) · reconnecting
(avatars kept + subdued connection hint — never hide mid-drop) · overflow:
the SHIPPED passive "+N" span (`Presence.tsx:60`, aria-label "{N} more") —
**no click-menu** (collab is flag-gated DEMO-ONLY; an interactive people menu
is unbudgeted YAGNI until multiplayer ships for real).

**Exit dialogs (F1, unchanged):** dirty (Stay / Leave anyway / Save & leave) ·
risky-offline (Stay / Leave anyway) · save-failed error row.

## 5. Publish-anyway confirm modal (the missing frame — TODOS.md:96)

**Gate precedence (eng D9 — one gate at a time, server truth first):**
1. `needs-approval` (server, `usePublishJob.ts:39`) → Publish renders `disabled`
   with reason tooltip "Needs an approved review first" — no modal, no override
   (there is nothing to override).
2. `stale-approval` → the SHIPPED acknowledge-and-ship flow stays exactly as-is.
3. Only when the site is otherwise publishable does `errorCount > 0` open THIS
   confirm modal. The two "publish anyway" meanings never co-exist on screen.

`ModalContent size="question"`, opened from Publish when `errorCount > 0`:

- Title: "Publish with {n} error{s}?"
- **Top-3 issue list, from real data (D12):** up to three rows rendered from
  the shipped `Issue` shape (`type` + message) — severity glyph + message text,
  e.g. "⛔ Broken link — Home / CTA". More than three: "+N more" row that opens
  the Issues panel. The generic fallback when messages are empty is explicit:
  "{n} errors will go live exactly as they look now." — never invented
  categories (the `Issue` type carries no category field; F19).
- Body: "You can review the issues first, or publish and fix later."
- **Open-review note (D13):** when a review round is open (pill state ≠ none),
  the modal adds one line: "A review round is open — {reviewer} will see the
  published site." Publish stays allowed (publish ≠ review approval);
  zero-error publishes remain direct with no confirm.
- Footer: ghost "Review issues first" (→ Issues panel) · primary "Publish anyway".
- Focus (F26): opens to "Review issues first"; on close focus returns to the
  Publish button.

### User journey — emotional arc (build → review → publish)

| Step | User does | User feels | Bar supports it with |
|------|-----------|-----------|----------------------|
| 1 | Edits mid-flow | Absorbed — chrome invisible | Text-first save state, calm grammar (D7) |
| 2 | Save hiccup / offline | A flicker of worry | Honest amber pill, "queued" not "failed" |
| 3 | Pre-publish check | "Am I ready?" | Issues chip: green-gray all-clear or amber/red count (D6) |
| 4 | Clicks Publish with errors | Caution, informed | Top-3 concrete issue list (D12), open-review note (D13) |
| 5 | Publish lands | **Victory** | Toast + [View live] [Copy URL], "✓ Published" on the button (D10) |
| 6 | Publish fails | Frustration, needs a door | Error toast + [Try again] (D10) |
- No red CTA (red = destructive only per DESIGN.md); the warning callout carries
  the caution.
- Warnings-only (`errorCount === 0`, `warnCount > 0`) does **not** confirm —
  publish proceeds directly; the chip already surfaced the signal.

## 6. Component deltas

| Component | Change | Where |
|-----------|--------|-------|
| `Topbar` (681:122) | +1 child: `tools` prop — **data props, not a ReactNode** (F21): `tools?: { onPreview?; previewBusy?; commentsPressed?; onToggleComments?; issues?: { errors; warnings; onClick; readOnlyReason?: string } }`, rendered internally by Topbar. A node slot would reopen the exact drift the deleted `extra` slot caused. **Role/view branching lives in the CONTAINER (eng D12):** StudioHeader — which already owns `isViewer`/`viewMode` — composes the fields per mode (client view passes only `onToggleComments`; viewer passes preview+comments and sets `issues.readOnlyReason`). Topbar renders exactly what it receives, learns no roles. | `editor/ui/Topbar.tsx` |
| `IssueChip` | NEW. Anatomy (F15): 28px height, 6px radius (`--bk-radius-md`), 4px gap icon↔count, 16px icon, count 12px semibold tabular; count caps at "99+". **Copy rule (D14): chip shows TOTAL count; tooltip + accessible name give the breakdown** — "3 issues · 1 error, 2 warnings — review before publish"; zero state "No issues on this site". Severity also in the icon, not colour alone (F25): shield-check (0), triangle (warnings), octagon (errors). Contract tests: 0 / warnings-only / errors / 99+. | `editor/ui/` + `ui.css` (Figma node first) |
| `SiteMenu` | Regroup to §3; delete "More" group; remove Exit row (D8); rename client-view row (D9) | `editor/shell/SiteMenu.tsx` |
| `StudioHeader` | Wire cluster handlers (already exist: `handlePreview`, comment-mode emit, `onOpenIssues`); publish-anyway modal at `onPublish` callsite; **replace `issueNoun` errors-noun logic with the D14 copy rule** | `editor/shell/StudioHeader.tsx` |
| Comment mode state (F20, eng D4) | The pressed state needs a READ path. **State owner is `CommentLayer`** (it holds mode state: subscribes at `CommentLayer.tsx:150`, emits `{on:false}` on exit at `:194`) — so CommentLayer emits `ui:comment-mode-changed { on }` on EVERY state change (enter, exit, Esc, tool switch); the bar subscribes. The existing `ui:comment-mode` command event stays as-is (mixed `{}`-toggle / `{on}`-set callers untouched) — command/state separation, one source of truth. | `editor/canvas/comments/CommentLayer.tsx` + `StudioHeader.tsx` |
| `Toast` | Supports exactly ONE `action` (shipped contract) — success toast carries **[View live]**; Copy live URL stays a menu row. Extending Toast to two actions is NOT in scope. | `editor/ui/Toast.tsx` (no change) |
| ⌘, hint (F22) | Handler exists (`useEditorShortcuts.ts:83`, ctrl OR meta) but macOS Chrome may eat ⌘, as the browser-preferences accelerator — same class as the F6 ⌘H lie. Live-verify at implementation; if eaten, hint shows ⌃, on Mac (pattern: `HISTORY_KBD`). | `SiteMenu.tsx` |
| Figma | 681:122 +cluster child; new IssueChip; 642:3664 regroup (−Exit, renamed client view); review-pill neutral variants (D7); publish success/failure toasts; confirm modal w/ top-3 list | Figma first, then tokens/code |

**Token names (F14 — no raw hex in spec):** warning text `--bk-warning-text`
(#723B13) on `--bk-warning-tint` · error text `--bk-error-text` (#C81E1E) on
`--bk-error-tint` · neutral chip `--bk-ink-muted` · active comment tint
`--bk-accent-subtle` · review neutral `--bk-ink-soft` on panel gray. Any value
without a generated token = "token TBD in Figma export", named explicitly.

No canvas-toolbar changes (Variant C's device-switcher migration explicitly out of
scope — recorded as a future option).

## 7. Width budget & responsive

Editor is desktop-only (DESIGN.md). **The honest worst case co-occurs by
definition (F23):** "Publish anyway" (+~40px) appears exactly when the red
Issues chip (+~70px) does, and "Save failed — Retry" can join both.

Rebuilt budget at that worst case: Exit 64 + name 200 + save pill 130 + review
pill (capped, see below) 140 + gaps ≈ 640px left · cluster ≈ 130px · presence
(3+N chip) 90 + bell 36 + "Publish anyway" 130 + menu 36 + gaps ≈ 310px right
→ **≈ 1080px total.** Fits 1280px with ~200px slack; at a 1152px floor it
still fits. 1024px is NOT claimed (F23 killed the old claim).

**Compact modes fire BEFORE the site name collapses (Codex#5):**
1. Review pill truncates at `max-width: 140px` + `title` (reviewer names are
   unbounded — cap them, F23);
2. SaveStatus drops its timestamp suffix ("Saved" not "Saved · 2m ago");
3. Presence caps at 2 avatars + "+N";
4. only THEN the site name shrinks 200 → 120px (`max-width: 200px;
   min-width: 120px; flex-shrink: 1` — flex, not `minmax`; F18).
The cluster and Publish never shrink.

## 8. Accessibility

- All cluster buttons: labelled IconButtons, tooltips are supplements not the
  only label; Issues accessible name carries count AND severity (D14/F25):
  "3 issues, 1 error, on this site" — never colour-only (WCAG 1.4.1; the icon
  shape also encodes severity, §6).
- **`aria-live` status region in the header (F24, eng D5 — CENTRALIZED):** the
  header region is the SINGLE announcement pipe — save transitions ("Save
  failed", "Saved", "Offline — changes queued") AND publish outcomes
  ("Published — site is live", "Publish failed"). `SaveStatus`'s own
  `aria-live` attribute (`SaveStatus.tsx:55`, assertive on error) is REMOVED
  in the same change — two live regions saying the same thing double-announce.
  Save-error keeps assertive urgency via the region (`role="alert"` swap on
  error), and the removal ships with a regression test (announcement fires
  exactly once per transition). Issue-count changes are NOT announced
  (recomputed live — would spam); the chip is reachable in the tab order.
- Comments toggle: `aria-pressed`, state read from `ui:comment-mode-changed`
  (F20) so canvas-side exits un-press it.
- Blocked publish stays **focusable** with `aria-disabled` + tooltip reason
  (shipped F-arc behavior — do not regress to native `disabled`).
- Menu: `role="menu"` compound (existing `Menu`/`MenuItem`), arrow-key nav,
  labelled groups.
- Confirm modal: focus-trapped `ModalRoot`, `aria-labelledby`, Esc = Stay.
- Focus rings: `--bk-shadow-focus` everywhere; no focus suppression.
- Contrast: amber chip text `#723B13` on warning tint, red `#C81E1E` on error
  tint — both ≥ 4.5:1 on their tints.

## 9. Deliverables (this arc)

1. Hi-fi Flowbite wireframes — 3 IA variants + comparison board ✅ (done, B approved)
2. Full clickable prototype — Variant B, all §4 states walkable, menu + modal +
   notification panel + exit dialogs wired (HTML, local Flowbite assets)
3. This plan doc, review-hardened (7 design passes + outside voices)
4. Figma follow-ups list (nodes to draw before implementation)

## 10. Out of scope

- Implementation (code) — separate arc after Figma nodes exist.
- Device-switcher/zoom migration into the bar (Variant C) — future option.
- PageTabBar / canvas toolbar / footer — separate surfaces.
- Save-honesty engine work (TODOS.md:109) and worker export (TODOS.md:103).

## 11. Decisions log (all resolved 2026-07-30, /plan-design-review)

| ID | Decision | Choice |
|----|----------|--------|
| D6 | Issues chip visibility | Always-visible anchor; neutral at 0 |
| D7 | Status grammar | Full grammar: Publish sole CTA, chip owns warning colour, review neutral-unless-blocking, reading order documented, amber cap 2 |
| D8 | Exit duplication | Menu "Exit to dashboard" removed |
| D9 | Preview naming | "Quick preview" (bar) / "Open client view" (menu) |
| D10 | Publish outcomes | Success toast + [View live] + "✓ Published" transient; failure toast + [Try again] |
| D11 | `conflict` save state | Specified, marked FUTURE — blocked on TODOS.md:109 |
| D12 | Confirm modal copy | Top-3 issue list from real `Issue` data + explicit fallback |
| D13 | Publish over open review | Allowed; one-line note in the confirm modal |
| D14 | Chip copy vocabulary | Total count on chip; breakdown in tooltip/aria; modal title errors-only |
| D15 | Brand in bar | ~~20px monogram fused with ‹ Exit~~ **REVERSED (user, 2026-07-30 post-eng): NO monogram — plain ‹ Exit back button to the workspace. Deliberate calm chrome; litmus-#1 accepted.** |
| D-open-1 | Chip+label redundancy at errors>0 | Accepted — right redundancy before an irreversible-feeling action |

**Eng review decisions (2026-07-30, /plan-eng-review — outside voice = Codex, 7 findings, 5 P1 all resolved):**

| ID | Decision | Choice |
|----|----------|--------|
| eng D2 | Complexity gate (~11 files) | Proceed as-is — count is DS structure, tasks P-tiered |
| eng D3 | Ghost token `--bk-bg-sunken` | NEW Figma token `bg-pill-neutral` (user override — Figma-first) |
| eng D4 | Comment-mode state event owner | CommentLayer emits `ui:comment-mode-changed {on}` |
| eng D5 | aria-live | CENTRALIZED in header region; SaveStatus's own removed (user override) |
| eng D6→D10 | Publish failure surface | Superseded: owner is useExportHandlers (Codex OV-2) |
| eng D7 | Issue copy DRY | `formatIssueSummary` exported from IssueChip.tsx |
| eng D8 | All-conditional Share group | Guard in SiteMenu — group renders only with ≥1 row |
| eng D9 | Publish gate precedence | Approval gate outranks; error-confirm only when otherwise publishable |
| eng D10 | Outcome toast owner | Enhance useExportHandlers (existing owner); no second source |
| eng D11 | Transient ✓ contract | `PublishState` += `"published"`; Topbar.tsx in T5 |
| eng D12 | tools role branching | Container composes fields; Topbar stays role-blind |
| eng D13 | Chip copy locus | "on this site" everywhere (Issue has no page id) |
| eng D14 | Presence +N menu | Dropped — shipped passive span stands (DEMO-ONLY collab) |
| eng D15 | Codex "overbuilt" challenge | Variant B STANDS — user's informed design call, no new facts |
| eng D16 | Comment-mode unmount | Ratified — cleanup emit + page-change reset in T6 |
| eng D17 | Issue page scoping | User pulled IN-ARC (option C over TODO) — new T10; locus copy goes qualifier-free at implementation |

## 12. NOT in scope (considered, deferred with rationale)

- **Device switcher / zoom in the bar (Variant C)** — cross-surface migration of
  the canvas toolbar; future option, needs toolbar-owner signoff.
- **Split Publish button (Variant C)** — post-publish actions now reachable via
  success toast + Share group; split button unnecessary at current menu size.
- **Toast with two actions** — shipped Toast contract is one action; Copy URL
  stays a menu row.
- **Issue categorization** ("broken link" vs "missing image") — engine change;
  see TODOS proposal.
- **Save-honesty engine work** — TODOS.md:109, own arc (D11 depends on it).
- **Undo/redo in the bar** — canvas/keyboard owns history; bar stays status+ship.
- **PageTabBar / footer / canvas toolbar** — separate surfaces, separate reviews.

## 13. What already exists (reuse, don't reinvent)

- `editor/ui`: Topbar, Button, IconButton, SaveStatus, Presence, Tooltip, Menu/
  MenuGroup/MenuItem/MenuLabel, Popover, ModalRoot/Content/Title/Footer, Toast
  (one action), CommandPalette, Badge — all Figma-mirrored, `--bk-*` tokens.
- `StudioHeader` handlers: `handlePreview`, comment-mode emit, `onOpenIssues`,
  `guardNavigation`/exit dialogs (F1), review pill fetch + focus refetch.
- Figma: component 681:122 (bar), 642:3664 (menu), foundation file
  `g4GzQFqzNYz5sosz1QtZXC` (Flowbite-rebased tokens).
- Verified by the independent review: the 5-group menu maps 1:1 onto existing
  `SiteMenu` props; the "More" dump drains to zero with no orphaned feature.

## 14. Approved mockups & prototype

| Artifact | Path | Direction |
|----------|------|-----------|
| Comparison board (3 IA variants) | `~/.gstack/projects/aamirtauqir-buildrik/designs/topbar-complete-20260730/board.html` | A conservative / B balanced / C ambitious |
| Approved wireframe | `…/variant-b.html` | **Variant B — Daily Three Promoted** (approved.json) |
| Clickable prototype (all states) | `…/prototype.html` | Variant B + all D6–D15 decisions; state controller walks every §4 state |

Hi-fi: Flowbite components (vendored assets, no CDN), shipped token values
(56px bar, #1A56DB, Inter, #E5E7EB hairlines).

## Implementation Tasks
Synthesized from this review's findings. Each task derives from a specific
finding above. Run with Claude Code or Codex; checkbox as you ship.

- [ ] **T1 (P1, human: ~1 day / Figma work)** — Figma — draw the missing nodes
  - Surfaced by: §6 component deltas — every code task below needs its node first
  - Nodes: IssueChip (0/warn/error/99+), 681:122 + cluster child (NO monogram — D15 reversed), 642:3664 regroup (−Exit, "Open client view"), review-pill neutral variants (D7), publish success/failure toasts, confirm modal with top-3 list
  - Variables: NEW `bg-pill-neutral` surface token (eng D3) — add in Figma, re-export `figma-tokens.json`, run `node scripts/tokens/generate.mjs`
  - Verify: node ids recorded in component headers per DS contract
- [x] **T2 (P1) — SHIPPED 2026-07-30 code-first** (IssueChip + formatIssueSummary SSOT copy + Topbar `tools` data slot + `published` state; Figma node ids pending T1 — as-built ledger pattern; contract tests 11+18 green) — editor/ui — `Topbar` `tools` data props + new `IssueChip`
  - Surfaced by: F21 (ReactNode slot reopens drift) + F15 (anatomy) + D6/D14
  - Files: `src/editor/ui/Topbar.tsx`, `src/editor/ui/IssueChip.tsx` (also exports `formatIssueSummary(errors, warnings)` — the ONE source for chip tooltip / aria / modal / announcement copy, eng D7), `ui.css`, contract tests
  - Verify: contract tests 0/warn/error/99+ + formatIssueSummary cases (0·0, warn-only, error-only, mixed, 99+); Gate 24 clean
- [x] **T3 (P1) — SHIPPED 2026-07-30** (5 named groups + labels, Exit row removed, "Open client view", ≥1-row group guard; regression asserts in StudioHeader.test) — shell — SiteMenu regroup to §3
  - Surfaced by: Pass 1 (12-orphan "More" dump) + D8 + D9 + eng D8 (all-conditional Share group)
  - Files: `src/editor/shell/SiteMenu.tsx` (+ guard: a group renders only when ≥1 row is present — the Share group is all-conditional and an empty `MenuGroup` div still draws its border-top)
  - Verify: existing menu tests + no "More" group renders + unpublished-site menu shows no empty group border
- [x] **T4 (P1) — SHIPPED 2026-07-30** (confirm at onPublish callsite; top-3 rows errors-first from real Issue messages + explicit fallback; +N more → panel; D13 open-review note; D9 precedence comment — server approval gate owns post-attempt rejects; F26 focus on safe door; 7 tests green) — shell — publish-anyway confirm modal
  - Surfaced by: TODOS.md:96 founder decision + D12 + D13 + D14 (title errors-only)
  - Files: `src/editor/shell/StudioHeader.tsx` (onPublish callsite)
  - Verify: errors>0 → modal with top-3 rows; warnings-only publishes direct; open-review note renders when pill ≠ none
- [x] **T5 (P2) — SHIPPED 2026-07-30** (useExportHandlers toasts gain [View live]/[Try again] doors + re-toast regression fixed via runPublish ref; PublishState "published" 2s flash via usePublishOutcomeFlash; header = single announcement pipe, SaveStatus presentation-only; exactly-once regression tests green) — shell+ui — publish outcome states + centralized announcements
  - Surfaced by: F4/F5/F11 (CRITICAL) + eng D5 (centralize) + eng D10 (owner = useExportHandlers, NOT a new header pipe) + eng D11 (Topbar contract)
  - Files: `useExportHandlers.ts` (the EXISTING outcome-toast owner at `:141` — enhance: success toast gains `action: {label:"View live"}`, failure toast gains `action: {label:"Try again"}` re-invoking publish; integrations-link failure branch untouched), `Topbar.tsx` (`PublishState` += `"published"` — transient "✓ Published" success tint, label in `PUBLISH_LABEL`), `AquibraStudio.tsx` (drive the transient from `publishJob.uiState === "published"` with a 2s timer back to ready), `StudioHeader.tsx` (header `aria-live` region announcing save + publish transitions), `SaveStatus.tsx` (REMOVE its own aria-live — the header region is the single pipe)
  - NOT here: a second toast source in StudioHeader (eng D10 killed it), a `publishError` prop for toasts (owner already has the error)
  - Verify: exactly ONE toast per outcome; "✓ Published" appears 2s then ready (Topbar contract test); each transition announces exactly ONCE (regression test for the SaveStatus removal)
- [x] **T6 (P2) — FULLY SHIPPED 2026-07-30** (layer broadcast + unmount cleanup + header mirror wired into the cluster's aria-pressed. NOTE — plan amendment at implementation: NO bar-side PAGE_CHANGED reset; CommentLayer survives page switches and re-scopes itself, so a bar reset would CREATE the desync the event prevents. The unmount emit covers real unmounts.) — canvas+shell — `ui:comment-mode-changed` read path
  - Surfaced by: F20 (one-way wiring) + eng D4 (state owner = CommentLayer, not engine)
  - Files: `editor/canvas/comments/CommentLayer.tsx` (emit `{on}` on every state change INCLUDING unmount cleanup — page switch mid-mode must emit `{on:false}` or the bar toggle sticks pressed, eng D16; also update its line-8 event-map header comment — stale diagrams mislead), `StudioHeader.tsx` (subscribe + reset pressed-state on PAGE/PROJECT change events as belt-and-braces)
  - Verify: Esc on canvas un-presses the bar button; page switch while comment mode ON un-presses; command event `ui:comment-mode` callers untouched
- [x] **T7 (P2) — SHIPPED 2026-07-30** (issueNoun/issueLabel deleted; IssueChip owns copy; mixed-count regression test green) — shell — D14 copy rule replaces `issueNoun`
  - Surfaced by: F16 (1 error + 2 warnings currently reads "3 errors")
  - Files: `StudioHeader.tsx:448-454`
  - Verify: mixed counts render total + breakdown in tooltip/aria
- [x] **T8 (P2) — SHIPPED 2026-07-30, one honest deferral** (review pill label capped 140px + truncate + title; site name min-width 120 + flex-shrink — shrinks LAST. Deferred: the save-timestamp-drop compact mode — no clean width signal without a viewport media query the DS bans outside a11y.css, and the rebuilt §7 budget fits the 1152px floor without it. D7 grammar tints land with T1's Figma variants.) — ui/shell — status grammar + compact modes
  - Surfaced by: D7 + F23 (review pill 140px cap, save timestamp drop) — presence overflow ALREADY SHIPPED as passive span (eng D14; only the visible-avatar cap may need tuning)
  - Files: `ui.css`, `SaveStatus.tsx` (timestamp-drop compact mode), `Presence.tsx` (cap tuning only)
  - Verify: worst-case bar (error save + red chip + "Publish anyway" + approved pill) fits 1152px
- [ ] **T9 (P3, human: ~30min / CC: ~5min)** — shell — verify ⌘, chord delivery
  - Surfaced by: F22 (browser-preferences accelerator may eat it — the F6 lesson)
  - Files: `SiteMenu.tsx` (hint), live check in Chrome/Safari macOS
  - Verify: hint shows a chord that actually fires
- [x] **T10 (P2) — SHIPPED 2026-07-30** (`Issue.pageId?` + `issueAppliesToPage` helper in useStudioState.ts; IssuesPanel "This page / All pages" scope — DATA-DRIVEN: chips render only when ≥1 issue carries a pageId, so no dead control while all producers are site-wide; AquibraStudio tracks activePageId reactively on PAGE_CHANGED/PROJECT_LOADED; 3 new tests, shell suite 422/422 green. Chip/modal copy goes qualifier-free at T2/T7 as specced.) — engine+shell — Issue page scoping (eng D17: user pulled IN-arc)
  - Surfaced by: Codex OV-5 (Issue has no page id) + eng D17 decision C (build now, not TODO)
  - Spec: `Issue` type += `pageId?: string` (undefined = genuinely site-wide, e.g. DS-lint); element-bound producers stamp it via element→page lookup; IssuesPanel gains "This page / All" filter; chip + modal count = current-page issues + site-wide issues; all locus copy drops the qualifier entirely ("3 issues · 1 error, 2 warnings — review before publish") so it is true under both scopes — supersedes the eng D13 "on this site" strings at implementation time
  - Files: `shared` Issue type home (`useStudioState.ts:63` interface), issue producers (grep `type: "error"` emitters), `IssuesPanel.tsx`, `IssueChip.tsx` copy, `StudioHeader.tsx`
  - Verify: page switch changes chip count; site-wide issues persist across pages; panel filter matches chip; type default keeps old producers compiling

## Test coverage matrix (eng review §3 — write these WITH the code, not after)

**REGRESSION-critical (mandatory, modify shipped behavior):**
1. `issueLabel` D14 change — mixed counts: 1 error + 2 warnings must render chip "3"
   with tooltip/aria "3 issues · 1 error, 2 warnings" (the old code said "3 errors" —
   assert the lie is gone). `StudioHeader.test.tsx`.
2. SaveStatus aria-live removal (eng D5) — each save/publish transition announces
   exactly ONCE via the header region; error transition is assertive. New assertions
   in `StudioHeader.test.tsx`; delete the per-button aria-live assertions.
3. SiteMenu Exit-row removal (D8) — menu contains NO "Exit to dashboard" row; the
   bar's ‹ Exit still routes through `guardNavigation`. Update any existing assert.

**New-path units (co-located contract tests):**
- `IssueChip.test.tsx`: 0/warn/error/99+ renders, icon shape per severity,
  `formatIssueSummary` 5 cases (0·0, warn-only, error-only, mixed, 99+).
- `Topbar.test.tsx` (tools slot): absent → no cluster; previewBusy →
  `aria-busy` + click no-op; commentsPressed ↔ `aria-pressed`; client-view →
  Comments only; viewer → read-only-labelled chip.
- `StudioHeader.test.tsx` (modal matrix): errors>0 opens confirm (no direct
  publish); warnings-only publishes direct with NO modal; top-3 rows from real
  `Issue` messages; empty messages → fallback copy; >3 → "+N more" opens Issues
  panel; open review round → D13 note present, `none` → absent; "Review issues
  first" focuses panel and modal close returns focus to Publish (F26).
- Publish outcomes: `publishedUrl` transition → success toast with View live
  action + transient "✓ Published" then `ready`; `publishError` → failure toast
  with Try again that re-invokes publish.
- Comment sync (D4): simulated `ui:comment-mode-changed {on:false}` un-presses
  the bar toggle (jsdom event through composer mock — but per memory
  `mocked-transaction-hides-async`, ALSO live-verify Esc-on-canvas once in the
  browser before calling T6 done).
- SiteMenu: unpublished + no client-view handler → Share group absent entirely
  (no empty border div).
- Compact modes (T8): assert class/longhand presence, not computed px — jsdom
  CSSOM expands shorthand (prior learning).

## Failure modes (eng review §4 outputs)

| New codepath | Realistic production failure | Test? | Handled? | User sees |
|---|---|---|---|---|
| IssueChip → panel | onOpenIssues undefined in a view mode | matrix | container gates render | clear (chip absent) |
| Confirm modal rows | Issue messages empty/garbage | matrix (fallback) | D12 fallback copy | clear |
| Publish success toast | prop transition while tab backgrounded → late toast | outcome test | effect on prop change | acceptable delay |
| Publish failure | job dies pre-jobId (usePublishJob:148 path) | outcome test | publishError prop (eng D6) | toast + Try again |
| **Comment mode stuck** | **CommentLayer unmounts mid-mode (page switch) → no exit event → bar stays pressed** | **was MISSING** | **was MISSING** | **silent wrong state** |
| aria-live region | region content set before SR attaches | n/a | polite region persists | minor |

**Critical gap (flagged + fixed in T6):** CommentLayer must emit
`ui:comment-mode-changed {on:false}` from its unmount cleanup, and the bar
resets pressed-state on PAGE/PROJECT change events — otherwise the toggle
lies after any page switch made while comment mode was on.

## Worktree parallelization (eng review §4 outputs)

| Step | Modules touched | Depends on |
|------|----------------|------------|
| T1 Figma nodes + token | Figma only | — |
| T2 Topbar tools + IssueChip | editor/ui/ | T1 |
| T8 grammar tints + compact | editor/ui/ | T1 |
| T3 SiteMenu regroup | editor/shell/ | T1 (menu node) |
| T4 confirm modal | editor/shell/ (StudioHeader) | T2 (IssueChip copy) |
| T5 outcomes + announcements | editor/shell/ (StudioHeader) + editor/ui/ (SaveStatus) | T4 |
| T7 D14 copy rule | editor/shell/ (StudioHeader) | T2 (formatIssueSummary) |
| T6 comment-mode event | editor/canvas/ + editor/shell/ (StudioHeader) | — |
| T9 chord verify | editor/shell/ | — |

Lanes: **A:** T2 → T8 (sequential, shared editor/ui/) · **B:** T3 (independent) ·
**C:** T4 → T5 → T7 (sequential, all StudioHeader) · **D:** T6 · **E:** T9.
Order: T1 first (everything visual depends on nodes). Then A ∥ B. Then C.
⚠ Conflict flag: C and D both edit `StudioHeader.tsx` — run D after C (or same
worktree). T9 anytime.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAN (PLAN) — THIS plan | 14 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAN (FULL) | score: 4/10 → 9/10, 11 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **CODEX:** two outside voices ran — design (6 findings, all fixed in passes 1–6) and eng plan-challenge (7 findings, 5 P1: gate sequencing, toast ownership at `useExportHandlers.ts:141`, Topbar contract gap, tools role-branching, false "on this page" copy — all resolved via eng D9–D14; the "overbuilt Variant B" challenge was presented and the user's design call stands, eng D15).
- **CROSS-MODEL:** design stage — Codex ≡ Claude subagent on chip stability, width math, modal concreteness (all fixed). Eng stage — Codex found the pre-existing outcome-toast owner and the approval-gate collision that BOTH earlier reviews missed; folded into T4/T5. One first-party critical gap (comment-mode stuck-pressed on unmount) ratified into T6.
- **VERDICT:** DESIGN + ENG CLEARED — plan hardened across 17 design decisions (D6–D16 + D-open-1) and 16 eng decisions (eng D2–D17), tasks T1–T10 sequenced with lanes (T1 → A∥B → C, D after C). Ready to implement.

NO UNRESOLVED DECISIONS
