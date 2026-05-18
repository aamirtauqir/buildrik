# DS + Components Prototype — Gap Analysis Report (v2)

**Date:** 2026-05-16 (v2 after `/plan-design-review`)
**Subject:** `~/.gstack/projects/aamirtauqir-buildrik/designs/ds-components-prototype-20260507/index.html`
**Scope:** 15 screens (S00 legend → S15 detach+dark) + 7 newly injected (S16 → S22)
**Purpose:** Identify what prototype does NOT specify, draft inject-ready content, inject into prototype HTML.
**Status:** All 22 gaps resolved + injected into prototype as new screens + per-screen `.annotate` triggers tables + legend chip-glyph update.

**References (SSOT):**
- `DESIGN.md` (repo root) — cobalt `#2D6DFF`, light chrome, no purple, no default font stacks, 4px base, minimal motion
- `packages/editor/CLAUDE.md` — desktop-only, vibcoder primitives, chip vocab, `.bd-*` aliases
- Prototype primitives reused: `.annotate`, `.mock`, `.mock-bar .crumb`, `.chip-{green,blue,amber,red}`, `.section-head`, `.row`

---

## Overall observation

Prototype = **flow-correctness wireframes** (own annotation §15 says so). Strong on visual SSOT (cobalt + slate ink, chip color rules, mode toggle placement). Weak on **temporal mechanics** (triggers, transitions, persistence, race conditions), **accessibility** (chip semantics by hue only, no focus/aria contracts), and **system-level contracts** (keyboard, undo, validation, loading, telemetry, permissions, collab).

15 screens show *what UI exists*, not *when/how user gets there, what happens during, what happens on failure*. v2 injects 7 new screens + per-screen trigger tables to fill these gaps.

**Platform stance:** Desktop-only per `packages/editor/CLAUDE.md`. Mobile/tablet/print/RTL/i18n explicitly out of scope (declared in S22).

---

## Resolution method

22 gap categories (8 original + 14 added by outside-voice review). Each gap has:
- Severity: **P0** (blocks build) / **P1** (blocks ship) / **P2** (polish)
- Inject-ready snippet (HTML using existing prototype primitives)
- Injection location in prototype (screen number + position)

---

# P0 — Blocks build

## G01. Accessibility contracts (chip glyph + focus + aria + motion)

**Why P0:** Chip color taxonomy is the prototype's SSOT but encodes status in HUE ALONE. Deuteranopes cannot distinguish bound vs broken vs lint. A11y lawsuit risk on enterprise sale.

**Resolution (locked):**
- Every chip carries an icon glyph alongside color: `chip-green ✓`, `chip-blue →`, `chip-amber ⚠`, `chip-red ✕`, `chip-gray —`. Glyph is `aria-hidden="true"`; chip text already announces state.
- Modal focus contract: initial focus on first interactive control; trap inside dialog; Esc closes; close restores focus to invoker.
- ARIA live regions: lint banner = `aria-live="polite"`; migration progress = `aria-live="assertive"`; AI stream tokens = `aria-live="polite"` (announce final result only, not each token).
- Reduced motion: `@media (prefers-reduced-motion: reduce)` strips all transition durations to 0ms (already aligns with DESIGN.md "minimal motion").

**Injected as:** prototype S17 + legend §S00 chip palette updated with glyph column.

## G02. Global keyboard shortcuts

**Why P0:** Single `Cmd+Z` mention (S15 line 1226). No palette, no Cmd-S, no Esc contract. Power users will route around the missing surface.

**Resolution (locked):**

| Shortcut | Scope | Action | Conflict | Disabled when |
|---|---|---|---|---|
| `Cmd+K` | global | Open command palette | none | inside modal |
| `Cmd+S` | global | Save current selection / project | none | dirty=false |
| `Cmd+Z` / `Cmd+Shift+Z` | global | Undo / redo | none | empty stack |
| `Esc` | overlay-aware | Close topmost overlay; if no overlay, deselect | bubbles from form fields | typing in input + value unsaved |
| `Cmd+B` / `Cmd+I` / `Cmd+U` | text selection | bold/italic/underline | text-edit only | no text selected |
| `?` | global | Open keyboard cheat sheet | none | inside text input |
| `Cmd+/` | global | Toggle Beginner ↔ Pro mode | none | never |
| `Cmd+D` | global | Toggle Light ↔ Dark canvas | none | never |
| Drag-to-canvas | drag | Insert catalog item | drop on locked element = cancel | element locked |

**Discoverability:** every modal/menu surfaces shortcut as `<kbd>⌘K</kbd>` style hint. Hover tooltip on every button shows shortcut.

**Injected as:** prototype S16.

## G03. Modal focus management (init / trap / Esc / restore)

**Why P0:** 7 modals/drawers/popovers across S07/S08/S12/S13/S14/S15. Report previously asked "close via what" but never "where focus lands." Breaks keyboard users day one.

**Resolution (locked):**
- **Initial focus:** first focusable control (e.g., S12 Name input on Save dialog).
- **Trap:** Tab/Shift+Tab cycles inside modal; cannot leave via keyboard.
- **Esc:** closes topmost; if dirty (form changed), prompt "Discard changes?" first.
- **Click outside:** dismiss IFF non-destructive read-only popover (S07 alias tooltip); else require explicit Cancel.
- **Restore:** focus returns to invoker (e.g., S07 amber chip after popover close).
- **Announcement:** modal opens with `role="dialog"` + `aria-labelledby` pointing to title.

**Injected as:** prototype S17 + S16 (focus row in shortcut table).

## G04. Undo/redo command-stack boundaries

**Why P0:** Cmd+Z mentioned ONCE (S15). What's transactional? What's not? Mode swap undoable? Migration undoable? AI accept undoable?

**Resolution (locked):**

| Action | Undoable? | Reason |
|---|---|---|
| Token edit (value/name) | YES | individual transaction |
| Token delete | YES | restore-with-bindings transaction |
| Style preset edit | YES | per-binding transaction |
| AI-generated component accept | YES | single transaction; reverts catalog write |
| Catalog drag-to-canvas | YES | element insert transaction |
| Detach instance from master | YES (same session only) | command stack only; no cross-reload |
| Beginner ↔ Pro toggle | NO | display preference, not state mutation |
| Light ↔ Dark toggle | NO | display preference |
| Migration v6→v13 run | NO | use Restore snapshot button (S13) instead |
| Starter DS apply (S14) | YES (50ms grace) | full DS restore from snapshot |
| Export download | NO | side effect; no inverse |
| Import apply (S05) | YES | restore pre-import token registry |

**Injected as:** prototype S16 (undo/redo table).

## G05. Color-blind accessibility (chip semantic redundancy)

**Why P0:** Covered partially in G01. Explicit: red-green color-blindness affects ~8% of men. Chip color alone = WCAG fail.

**Resolution (locked):**
- Glyph mandatory (per G01).
- Chip text content uses unambiguous words: "bound" / "alias" / "lint" / "broken" / "off-DS". Status visible even with color stripped.
- Tested at 4.5:1 contrast minimum on bg-1 and bg-2.

**Injected as:** S17 (a11y screen) + S00 legend update.

## G06. Permission / role matrix

**Why P0:** Buildrik is multi-tenant. Nothing said about who can edit tokens / run migration / detach. Currently "Pro mode" gates detach — that's a feature flag, not a role.

**Resolution (locked):**

| Action | Owner | Editor | Viewer | Pro flag |
|---|---|---|---|---|
| View tokens / canvas | ✓ | ✓ | ✓ | — |
| Edit token value | ✓ | ✓ | — | — |
| Rename token ID | ✓ | ✓ | — | requires Pro |
| Delete token | ✓ | — | — | requires Pro + cascade dialog |
| Run migration (S13) | ✓ | — | — | — |
| Detach instance (S15) | ✓ | ✓ | — | requires Pro |
| AI generate (S08) | ✓ | ✓ | — | — |
| Export | ✓ | ✓ | ✓ | — |
| Import | ✓ | ✓ | — | — |
| Pick starter (S14) | ✓ | — | — | first-run only |
| Save component (S12) | ✓ | ✓ | — | — |

Viewer = read-only chips (greyed), no Inspector edits, no drag-to-canvas.

**Injected as:** prototype S19.

---

# P1 — Blocks ship

## G07. Surface invocation/dismissal contracts (merged from original #1 + #8)

**Why P1:** Per-screen trigger ambiguity. Codex flagged original categories #1 and #8 as the same problem.

**Resolution (locked):**

| Screen | Surface | Open via | Close via | Persists |
|---|---|---|---|---|
| S07 | Off-DS popover (amber chip) | Click chip | Esc · click-outside · Use button | no |
| S07 | Broken-token recovery (red chip) | Auto-show on select if any red chip | Esc · pick replacement · Pick token | no |
| S07 | Alias tooltip (blue chip) | Hover 600ms · focus | Mouse out · blur · Esc | no |
| S08 | AI-assist modal | Cmd+K → "Generate component" · Catalog "+ AI" btn · Components panel header "+ AI" btn | Esc · Cancel · click outside (if no draft) | drafts in IndexedDB until accept/dismiss |
| S12 | Save-as-component modal | Right-click selection → "Save as component" · Cmd+Shift+S · Inspector "Save" btn | Esc · Cancel | form values in sessionStorage until Save/Cancel |
| S13 | Migration runner | Auto-on-editor-load if `dsSchemaVersion < current` · BLOCKING (cannot Esc) | Auto on complete · Restore snapshot · Retry | `dsMigrationInProgress` marker until success |
| S14 | Starter gallery | First-run only · Design tab "Reset DS" btn (Pro mode) | Skip · Apply | one-time `firstRunComplete` flag |
| S15 | Detach confirm | Right-click instance → Detach (Pro mode) · Inspector "Detach" btn (Pro mode) | Esc · Cancel · Detach | no |
| S02 | Token detail right-pane | Click token row | Click another row · Esc (focus back to list) · click outside (if dirty: prompt) | scroll position |
| S09 | Lint "Review all" | Click banner btn | Filtered Tokens section auto-opens; banner replaced by inline filter chip; close via filter chip ✕ | filter persists until cleared |

**Injected as:** prototype S07/S08/S12/S13/S14/S15 per-screen `.annotate` trigger tables.

## G08. Multi-user collaboration (write conflicts + presence + locking)

**Why P1:** `src/editor/collaboration/` exists. Two users editing same token = whose write wins?

**Resolution (locked):**
- **Presence:** every token row + style preset + component master gets a presence dot (avatar bubble, max 3 stacked + overflow count) showing who's currently viewing/editing.
- **Write conflict:** last-write-wins on token value, BUT shows conflict toast: "Aamir saved this 2s ago. Your edit kept. Undo to revert."
- **Lock semantics during S13 migration:** owner running migration locks ALL collaborators out (read-only toast: "Aamir is migrating the DS — try again in ~12s").
- **Real-time fan-out:** edits broadcast via WebSocket; canvas updates <100ms remote.

**Injected as:** prototype S21.

## G09. Form validation system

**Why P1:** S08 mentions Zod (sync only). S02 token detail, S03 binding edit, S05 export filename: no required/async/error-display contract.

**Resolution (locked):**
- **Required marker:** `*` after label, color `var(--red)`.
- **Inline error:** message appears below field on blur + on submit; color `var(--red)`, glyph `✕`.
- **Async validation** (e.g., unique token ID): debounce 300ms; spinner inside input right edge; success = green check; error = red ✕.
- **Submit disabled:** while any field invalid OR any async-validate in flight.
- **Error copy tone:** specific, actionable. "Already exists — try `color.brand.primary.v2`" not "Invalid input."

**Injected as:** prototype S20 (Loading + Validation system).

## G10. Loading / skeleton system rule

**Why P1:** Per-screen loading mentioned (mode-swap, save, stream-cancel) but no system pattern.

**Resolution (locked):**

| Pattern | When | Example |
|---|---|---|
| Skeleton (gray block, no shimmer) | Initial read >200ms | Token list first load, Components catalog first fetch |
| Spinner in button | Write action in flight | Save token, Apply starter, Generate (AI) |
| Progress bar | Multi-step + deterministic | S13 migration only |
| Optimistic update | Local write, server confirms async | Token value edit (apply immediately, revert on server error w/ toast) |
| No indicator | <200ms operation | Mode toggle, dark toggle, chip click |

Shimmer animation **banned** (violates DESIGN.md "minimal motion").

**Injected as:** prototype S20.

## G11. Tooltip + keyboard-hint discoverability

**Why P1:** S07 alias chip is only tooltip example. No global rule.

**Resolution (locked):**
- **Tooltip delay:** 600ms hover OR immediate on keyboard focus.
- **Tooltip persistence:** until mouse-out + 200ms grace OR blur.
- **Inline shortcut hint:** `<kbd>⌘K</kbd>` style, monospace, `bg-2` background, `r-1` radius. Always shown next to action label inside menus and tooltips.
- **First-run coachmark:** ONE coachmark on first editor load pointing to mode toggle: "New here? Stay in Beginner. Switch to Pro when you're comfortable." Dismissed forever after Got it.
- **`?` shortcut:** opens full keyboard cheat sheet modal.

**Injected as:** prototype S16 (discoverability sub-section).

## G12. Telemetry / analytics events

**Why P1:** 15 screens, zero events spec. Product can't measure Pro mode adoption, AI usage, migration success rate.

**Resolution (locked):** every fire-able action emits a named event with payload.

| Event | Payload | Sampling |
|---|---|---|
| `ds.mode.toggle` | `{from, to, user_id}` | 100% |
| `ds.dark.toggle` | `{from, to, project_id}` | 100% |
| `ds.token.edit` | `{tokenId, kind, oldValue→newValue}` | 100% |
| `ds.token.delete` | `{tokenId, kind, consumerCount}` | 100% |
| `ds.preset.edit` | `{presetId, bindingChanged}` | 100% |
| `ds.starter.apply` | `{starterId, hadExistingCanvas}` | 100% |
| `ds.ai.prompt` | `{promptLength, quotaRemaining}` | 100% |
| `ds.ai.accept` | `{schemaSize, retries}` | 100% |
| `ds.ai.reject` | `{reason}` | 100% |
| `ds.migration.start` | `{fromVersion, toVersion}` | 100% |
| `ds.migration.complete` | `{durationMs, migrationsApplied}` | 100% |
| `ds.migration.fail` | `{atVersion, error}` | 100% |
| `ds.catalog.drag` | `{itemId}` | 1% (high frequency) |
| `ds.lint.autofix` | `{ruleId}` | 100% |
| `ds.export.download` | `{format, tokenCount}` | 100% |
| `ds.import.apply` | `{format, conflicts, errors}` | 100% |
| `ds.detach.confirm` | `{masterId, instanceCount}` | 100% |

**Injected as:** prototype S22.

## G13. State machine specs for stateful screens

**Why P1:** S08 has 3 states + 2 errors but no transitions diagram. S13 has 7 sequential migrations but no failure forks visualized.

**Resolution (locked):**

**S08 AI-assist state graph:**
```
[IDLE] --type-->[DRAFTING] --click Generate-->[STREAMING]
[STREAMING] --tokens flow-->[STREAMING] --done-->[PREVIEW]
[STREAMING] --Cancel-->[IDLE] --quota refund-->
[STREAMING] --network drop-->[ERROR_NETWORK] --Retry-->[STREAMING]
[STREAMING] --moderation flag-->[ERROR_MODERATION] --Edit prompt-->[IDLE]
[PREVIEW] --Save-->[SAVED_TO_CATALOG] --close modal-->
[PREVIEW] --Regenerate-->[STREAMING]
[PREVIEW] --Zod fail-->[ERROR_SCHEMA] --Retry-->[STREAMING]
[PREVIEW] --Esc-->[IDLE] (dirty: prompt)
```

**S13 migration sequence (7 steps + 3 failure forks):**
```
[SNAPSHOT] --create v6 snapshot-->[V7_RUNNING] --ok-->[V8_RUNNING] -->...
[V_n_RUNNING] --fail-->[ROLLBACK_OFFERED]
  --Restore snapshot-->[RESTORED_TO_V6]
  --Retry-->[V_n_RUNNING]
  --Email export-->[EXPORTED] (manual recovery)
[V13_RUNNING] --ok-->[COMPLETE] --clear marker-->
[*] --tab reload mid-run-->[RESUME_PROMPT] --Resume-->[V_n_RUNNING]
```

**Injected as:** prototype S08 + S13 inline state-graph mocks.

## G14. Cross-screen deep-link contract

**Why P1:** S07 amber chip → S01 token row jump. URL/state shape undefined.

**Resolution (locked):**
- URL pattern: `/editor?siteId=X&tab=design&section=color&token=color.brand.primary&highlight=true`
- On arrival: scroll target into view (smooth, 200ms), apply `data-just-arrived` attribute for 1.5s yellow halo (uses existing `bd-element-flash` keyframe), open parent accordion section.
- Browser back returns to S07 element selection (history state restores).

**Injected as:** prototype S07 (`.annotate` updated) + S22 (URL contract row).

## G15. Persistence matrix

**Why P1:** Mode/dark/AI-stream/migration/2-tab edit — all persistence ambiguous.

**Resolution (locked):**

| Setting | Scope | Storage | Cross-tab | Survives reload |
|---|---|---|---|---|
| Beginner ↔ Pro mode | per-user-global | `localStorage.ds.mode` | YES (storage event) | YES |
| Light ↔ Dark | per-project | project.dsMode | NO (per-tab override OK) | YES |
| AI stream session | per-tab | in-memory | NO | NO (navigate away = kill + refund quota) |
| AI draft prompt | per-modal-instance | sessionStorage | NO | until Save/Cancel |
| Save-as-component form | per-modal-instance | sessionStorage | NO | until Save/Cancel |
| dsMigrationInProgress marker | per-project | project state | YES | until migration done |
| Catalog filter (All/DS/Yours) | per-user-global | localStorage | YES | YES |
| Components search query | per-tab | in-memory | NO | NO |
| Lint suppressions | per-project | project.dsLintIgnored | YES | YES |
| Snooze (lint banner dismiss) | per-session | sessionStorage | NO | NO |
| Token detail scroll position | per-tab | in-memory | NO | NO |
| First-run flag | per-user-global | localStorage.firstRunComplete | YES | YES |

**Injected as:** prototype S18.

## G16. Race conditions

**Why P1:** AI stream + navigation, migration + reload, 2-tab token edit not specified.

**Resolution (locked):**

| Race | Resolution |
|---|---|
| AI stream + user navigates away | Kill stream immediately. Refund quota. Show toast "Generation cancelled" on return. |
| Migration mid-run + tab reload | On reload, check `dsMigrationInProgress` marker → show RESUME_PROMPT modal (S13 already has this hook on line 1126) |
| 2 tabs same project, token edit | Tab A writes → server confirms → tab B receives WebSocket fan-out → token row pulses + re-renders. If tab B was mid-edit on same token: show conflict toast (per G08). |
| User clicks Save while async-validate in flight | Submit blocked (per G09). Spinner stays. Save fires when validation resolves. |
| Cmd+Z during migration | Blocked. Toast: "Migration in progress — undo unavailable." |
| Drop on locked element | Drop ghost vanishes; element flashes red 200ms; no insert. |

**Injected as:** prototype S22 (race-condition table).

## G17. Per-screen missing states (idle/loading/empty/error/success)

**Why P1:** Each screen needs full state coverage.

**Resolution (locked):** Per-screen state mocks already in prototype but missing edges drafted:

| Screen | Missing state | Inject as |
|---|---|---|
| S01 | Empty DS (zero tokens after migration wipe) | "No tokens yet. Apply a starter →" CTA |
| S01 | Loading on first DS fetch | skeleton tok-rows (4 rows, gray blocks per G10) |
| S02 | Empty kind (0 spacing tokens) | "No spacing tokens — + Add" |
| S02 | Delete-with-consumers cascade | modal: "23 elements bind to this. Replace with → [picker]" |
| S03 | 0-uses preset | dimmed row, "0 uses · safe to delete" inline note |
| S05 | Export download in-progress | Spinner in button, btn label → "Preparing..." |
| S08 | Mid-stream Cancel cleanup | Toast: "Cancelled. Quota refunded (5 tokens)." |
| S08 | Quota exhausted | Disable Generate btn; message: "Quota exhausted. Resets 2026-06-01. [Upgrade →]" |
| S11 | Drop outside canvas | Drag ghost returns to source with bounce; no insert. |
| S11 | Drop on locked element | per G16. |

**Injected as:** prototype per-screen state mocks (compact `.mock` blocks under each existing screen).

## G18. Catalog (S06) search/filter mechanics

**Why P1:** Search box static. Live filter? Empty result? Recent?

**Resolution (locked):**
- **Live filter:** every keystroke (debounce 100ms) filters both DS catalog + user symbols.
- **Empty result:** "No components match 'foo'. [Clear search] · [+ AI generate from query]" (clicks open S08 with prompt prefilled).
- **Recent:** top 5 dragged-in-past-7-days at top under "Recent" section-head (above "From your DS").
- **All/DS/Yours seg:** per-user-global persistence per G15.
- **Filter affects drag source:** Yes — drag picks from filtered subset only.

**Injected as:** prototype S06 `.annotate` append.

## G19. Inspector (S07) selection model

**Why P1:** Multi-select, no-selection, locked-element states unspecified.

**Resolution (locked):**
- **Multi-select:** chip = "Mixed" (`chip-gray ~`) if any property differs across selection. Click "Mixed" chip = popover listing each value + count. Bulk-set via popover or via Inspector edit (applies to all).
- **No-selection:** illustration (DS icon, ink-400, 64px) + hint "Pick an element to bind tokens" + "Or press / to open command palette".
- **Locked element:** all Inspector chips greyed (`opacity: 0.5`), edit controls disabled, "Locked — unlock to edit" banner top of Inspector.

**Injected as:** prototype S07 `.annotate` append + sub-mock for Mixed state.

## G20. Lint (S09) aggregation rules

**Why P1:** Banner shows count but no refresh contract.

**Resolution (locked):**
- **Realtime recount:** auto-fix → count decrements immediately. Suppress → decrements + suppression noted in chip tooltip.
- **Suppression scopes:** per-token (Ignore button on chip-amber popover) · per-element (Inspector kebab → Ignore this element) · global (banner → "Suppress all 7" → confirmation).
- **Snooze:** session-only (banner dismissed for current tab/session, returns on reload). NOT persistent — encourages fixing.

**Injected as:** prototype S09 `.annotate` append.

---

# P2 — Polish

## G21. Cross-references to SSOT files

**Why P2:** Every gap should link DESIGN.md / CLAUDE.md / existing class to make implementer fast.

**Resolution (locked):** This report's References section (top) + per-gap inline references. Prototype legend updated with link to DESIGN.md + this report.

**Injected as:** prototype S00 legend + S22 footer.

## G22. Out-of-scope explicit declarations

**Why P2:** What's intentionally deferred?

**Resolution (locked):**

| Deferred concern | Status | Revisit when |
|---|---|---|
| Mobile / tablet responsive | OUT (desktop-only per CLAUDE.md) | mobile editor v2 |
| Print stylesheet | OUT (web-app, no print use case) | never |
| RTL / locale-aware UI | OUT (English-only v1) | i18n v2 |
| Error copy tone style guide | DEFERRED | content review (Q3 2026) |
| Animation easing curves | OUT (minimal motion per DESIGN.md) | never |
| Voice navigation | OUT | a11y v2 |

**Injected as:** prototype S22.

---

## Resolution summary

| Severity | Gaps | Resolved | Injected |
|---|---|---|---|
| P0 (blocks build) | 6 (G01-G06) | 6 | 6 |
| P1 (blocks ship) | 14 (G07-G20) | 14 | 14 |
| P2 (polish) | 2 (G21-G22) | 2 | 2 |
| **Total** | **22** | **22** | **22** |

**Defaults locked (8 product decisions):**
1. Mode toggle scope → **per-user-global** ← user confirmed 2026-05-16
2. Dark toggle scope → **per-project**
3. AI stream lifecycle on navigation → **kill + refund quota**
4. S13 migration blocking → **auto-block, cannot dismiss**
5. S15 detach reversibility → **Cmd+Z same-session only, no cross-reload**
6. Permission model → **owner/editor/viewer matrix per G06**
7. Chip non-color signal → **glyph (✓→⚠✕—) + word in chip text**
8. Loading taxonomy → **skeleton/spinner-in-button/progress-bar/optimistic per G10**

**Defaults can be changed by editing this report's "Resolution (locked)" block + re-running injection pass.**

---

## Bottom line

22 gaps identified, 22 resolutions drafted, 22 injected into prototype. Prototype HTML now answers "how does user get there, what happens during, what happens on failure" alongside "what does it look like." Implementer reads prototype + this report = full spec, no ambient questions.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | not run (not required for spec doc) |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | CLEAR | 14 P0/P1/P2 findings, all addressed in v2 |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | not run (spec doc, not code) |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR | initial 6/10 → 9/10 after fixes, 8 decisions locked, 22 gaps resolved + injected |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | n/a |

- **CODEX:** flagged severity-missing + a11y-missing + cross-cutting-rules-missing + overlap (#1≈#8). All 14 findings addressed in v2.
- **CROSS-MODEL:** Codex + Claude subagent converged on 8 same gaps (severity, a11y, keyboard, focus, validation, loading, desktop-stance, tooltip). Each model caught what the other missed (Codex: undo/redo + overlap; Claude: roles + collab + telemetry).
- **UNRESOLVED:** 0. All 22 gaps closed with locked defaults; 7 of 8 product decisions defaulted from DESIGN.md/CLAUDE.md/best-practice; 1 (mode scope) confirmed by user.
- **VERDICT:** DESIGN CLEARED — ready to implement. Eng review not required for spec doc (would apply once Phase A engineering kicks off).
