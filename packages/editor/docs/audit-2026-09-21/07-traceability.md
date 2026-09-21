# 07 — Traceability (Phase 19) · generated 2026-09-21 by `dump/build-07.mjs`

Code side: every `01-code-inventory.md` row → its owning `03-gap-matrix.md` row → one of the seven Phase-19 statuses, with the 05 build outcome applied. Figma side: every live board of `02-figma-inventory.md` (1,098) plus the 42 built boards (40 + C-01/C-03 after the owner closed the decisions) → one of the four Phase-19 statuses, derived from the gap type(s) of the rows that cite the board.

## Totals

| Code rows (1020) | Count |
|---|---|
| ✓ Represented | 672 |
| ✓ Combined | 152 |
| ✓ Internal | 81 |
| ✓ Planned for later | 61 |
| ✓ Deprecated | 32 |
| ✓ Hidden | 22 |

| Figma boards (1140 = 1,098 live + 42 new) | Count |
|---|---|
| △ Partial | 612 |
| ✓ Code | 406 |
| ✗ Dummy | 114 |
| ○ Planned | 8 |

## Remaining gaps

None — the two owner-gated rows (G1-013 CTA verbs, G1-066 client pins) were built on 2026-09-21 after the owner closed all open decisions (C-01 7593:193270, C-03 7593:193511).

## Code → Figma (1020 rows)

| Code row | Feature | Code status | Matrix row | Phase-19 status | Note |
|---|---|---|---|---|---|
| SH-01 | Five-region frame (topbar · rail · drawer · canvas · inspect | SHIPPED | G1-001 | ✓ Represented |  |
| SH-02 | Full-page mode (Settings; Asset library) | SHIPPED | G1-002 | ✓ Represented |  |
| SH-03 | View mode (`?view=readonly`) shell | SHIPPED | G1-021 | ✓ Represented | B2-06 + EP-2a |
| SH-04 | Accessibility furniture (Skip to Canvas, region landmarks) | SHIPPED | G1-091 | ✓ Represented | EP-6 |
| SH-05 | Dev-only alternate rails (`?rail=e3`, `?rail=legacy`) | UNREACHABLE | G1-095 | ✓ Deprecated |  |
| SH-06 | Inspector show/hide remembered per browser | SHIPPED | G1-090 | ✓ Represented |  |
| SH-07 | Minimum-width warning (<1024px) | STUB | G1-095 | ✓ Deprecated |  |
| SH-08 | Boot skeleton | SHIPPED | G1-001 | ✓ Represented |  |
| SH-09 | "Loading…" state + load toasts | SHIPPED | G1-078 | ✓ Represented | B1-05, B1-06 |
| SH-10 | Restore-unsaved-edits prompt after a failed save + reload | SHIPPED | G1-076 | ✓ Represented | B1-03 |
| SH-11 | Crash screen (shell error boundary) | SHIPPED | G1-001 | ✓ Represented |  |
| SH-12 | Panel loading skeleton / panel crash fallback | SHIPPED | G1-001 | ✓ Represented |  |
| SH-13 | Exit button ("‹ Exit" / "‹ Back to editing") | SHIPPED | G1-003 | ✓ Represented | B1-08 |
| SH-14 | Site name (200px, live-updating) | SHIPPED | G1-004 | ✓ Represented |  |
| SH-15 | Save status pill (6 states; click saves/retries) | SHIPPED | G1-005 | ✓ Represented | B1-07 |
| SH-16 | Live chip (green dot + domain) | SHIPPED | G1-006 | ✓ Combined |  |
| SH-17 | Review pill (5 states) | SHIPPED | G1-007 | ✓ Represented | B3-01 |
| SH-18 | Review-closed transition toasts | SHIPPED | G1-007 | ✓ Represented | B3-01 |
| SH-19 | Quick preview button | SHIPPED | G1-008 | ✓ Represented |  |
| SH-20 | Comments toggle | SHIPPED | G1-009 | ✓ Represented | B2-01 + EP-1 (503 boards) |
| SH-21 | Issues chip (count + severity icon) | SHIPPED | G1-010 | ✓ Planned for later |  |
| SH-22 | Presence avatars + connection pill | FLAGGED-VIABLE | G1-011 | ✓ Represented | B3-06, B3-07 (PLANNED) |
| SH-23 | Notifications bell (+ unread dot) | SHIPPED | G1-012 | ✓ Represented |  |
| SH-24 | Primary CTA (state-dependent verb: Send for review / Publish | FLAGGED-VIABLE | G1-013 | ✓ Represented | C-01 7593:193270 (owner decision 2) |
| SH-25 | Screen-reader live regions (save + publish announcements) | SHIPPED | G1-005 | ✓ Represented | B1-07 |
| SH-26 | Compact topbar (<1200px drops save timestamp) | SHIPPED | G1-005 | ✓ Represented | B1-07 |
| SH-27 | ⋯ Site menu (popover container, grouped rows) | SHIPPED | G1-014 | ✓ Represented |  |
| SH-28 | Site menu › Site settings (⌃,) | SHIPPED | G1-015 | ✓ Represented |  |
| SH-29 | Site menu › Version history (⌃H) | SHIPPED | G1-016 | ✓ Combined |  |
| SH-30 | Site menu › Review | SHIPPED | G1-016 | ✓ Combined |  |
| SH-31 | Site menu › Publish panel | SHIPPED | G1-016 | ✓ Combined |  |
| SH-32 | Site menu › Publish history | SHIPPED | G1-016 | ✓ Combined |  |
| SH-33 | Site menu › Unpublish site… | SHIPPED | G1-017 | ✓ Represented |  |
| SH-34 | Site menu › Export code | SHIPPED | G1-018 | ✓ Represented |  |
| SH-35 | Site menu › Site health / Activity log (dashboard deep-links | SHIPPED | G1-019 | ✓ Combined |  |
| SH-36 | Site menu › Templates | SHIPPED | G1-016 | ✓ Combined |  |
| SH-37 | Site menu › Components (⇧A) | SHIPPED | G1-016 | ✓ Combined |  |
| SH-38 | Site menu › Brand | SHIPPED | G1-016 | ✓ Combined |  |
| SH-39 | Site menu › Plugins | LIMITED | G1-020 | ✓ Deprecated |  |
| SH-40 | Site menu › Enter / Exit view mode | SHIPPED | G1-021 | ✓ Represented | B2-06 + EP-2a |
| SH-41 | Site menu › View live site | SHIPPED | G1-006 | ✓ Combined |  |
| SH-42 | Site menu › Copy live URL | SHIPPED | G1-006 | ✓ Combined |  |
| SH-43 | Site menu › Share preview link | SHIPPED | G1-022 | ✓ Represented |  |
| SH-44 | Site menu › Invite teammates / Account settings | SHIPPED | G1-023 | ✓ Represented |  |
| SH-45 | Site menu › Start collaboration | FLAGGED-VIABLE | G1-024 | ✓ Represented | EP-2b (PLANNED row) + B3-11 toasts |
| SH-46 | Site menu › Ask AI (E3 rail only) | UNREACHABLE | G1-025 | ✓ Deprecated |  |
| SH-47 | Site menu › Getting started (replay onboarding) | SHIPPED | G1-027 | ✓ Planned for later |  |
| SH-48 | Site menu › Keyboard shortcuts (⌘/) | SHIPPED | G1-026 | ✓ Represented | EP-6 (copy) — annotation not placed |
| SH-49 | "Publish with N open errors?" dialog | FLAGGED-VIABLE | G1-046 | ✓ Represented | B1-11 |
| SH-50 | Exit guard dialogs (Dirty / Risky / Stranded) | SHIPPED | G1-003 | ✓ Represented | B1-08 |
| SH-51 | Browser `beforeunload` guard | SHIPPED | G1-003 | ✓ Represented | B1-08 |
| SH-52 | Review bar (44px strip, status sentence) | SHIPPED | G1-029 | ✓ Combined | folded into chip + panel (OD-7, owner-confirmed 2026-09-21) |
| SH-53 | Review bar › Next › (step through open comments) | SHIPPED | G1-030 | ✓ Represented |  |
| SH-54 | Review bar › Compare | SHIPPED | G1-061 | ✓ Combined |  |
| SH-55 | Review bar › Re-send | SHIPPED | G1-058 | ✓ Represented |  |
| SH-56 | Send-for-review popover (email · what changed · note) | SHIPPED | G1-031 | ✓ Represented | B3-02, B3-03, B3-04 + 4418:121372 Re-send |
| SH-57 | Review-sent outcome dialog (Sending / Sent / Email failed) | SHIPPED | G1-031 | ✓ Represented | B3-02, B3-03, B3-04 + 4418:121372 Re-send |
| SH-58 | Notification panel (loading / error / empty / ready; day ban | SHIPPED | G1-033 | ✓ Represented | B3-09 + EP-3 |
| SH-59 | Notification › Mark all read | SHIPPED | G1-033 | ✓ Represented | B3-09 + EP-3 |
| SH-60 | Notification › row click (mark read + jump) / deleted-target | SHIPPED | G1-033 | ✓ Represented | B3-09 + EP-3 |
| SH-61 | Notification › See all notifications | SHIPPED | G1-033 | ✓ Represented | B3-09 + EP-3 |
| SH-62 | Issues panel (list, This page / All pages, severity filter c | SHIPPED | G1-088 | ✓ Represented |  |
| SH-63 | Issues › row click → jump to element | STUB | G1-088 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| SH-64 | Issues › "Fix ›" auto-fix (fixing band, fix-failed band, Ope | UNREACHABLE | G1-088 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| SH-65 | Left rail (Add · Layers · Pages · Assets · CMS · Brand) | SHIPPED | G1-089 | ✓ Represented |  |
| SH-66 | Rail unsaved dot (amber, top-right) | UNREACHABLE | G1-095 | ✓ Deprecated |  |
| SH-67 | Rail click / toggle + arrow-key navigation | SHIPPED | G1-089 | ✓ Represented |  |
| SH-68 | Off-rail panel doors (AI I/⌘J · Templates T · Components ⇧A  | SHIPPED | G1-089 | ✓ Represented |  |
| SH-69 | Drawer container (280px, closed = 0 + inert, fresh mount per | SHIPPED | G1-090 | ✓ Represented |  |
| SH-70 | Drawer width overrides (expand 280↔700; Assets 560; Template | SHIPPED | G1-090 | ✓ Represented |  |
| SH-71 | Dev-only E3 sub-tab row in the drawer | UNREACHABLE | G1-095 | ✓ Deprecated |  |
| SH-72 | Settings dirty guard ("Unsaved Changes" → Discard & Switch) | SHIPPED | G1-090 | ✓ Represented |  |
| SH-73 | Cross-panel hand-offs (From template new-page mode; unpublis | SHIPPED | G1-090 | ✓ Represented |  |
| SH-74 | Full-page close returns (Settings → Add; Asset library → Ass | SHIPPED | G1-002 | ✓ Represented |  |
| SH-75 | Page tab bar (scrolling tabs, active/resting, ⌂ home glyph,  | SHIPPED | G1-097 | ✓ Represented |  |
| SH-76 | Page tab › "+" Add page | SHIPPED | G1-097 | ✓ Represented |  |
| SH-77 | Page tab › context menu (Rename · Duplicate · Set as home ·  | SHIPPED | G1-097 | ✓ Represented |  |
| SH-78 | Page tab › inline rename + validation popover (required / sh | SHIPPED | G1-097 | ✓ Represented |  |
| SH-79 | Page tab › Duplicate | SHIPPED | G1-097 | ✓ Represented |  |
| SH-80 | Page tab › Set as home | SHIPPED | G1-097 | ✓ Represented |  |
| SH-81 | Page tab › Delete (homepage refusal, confirm, undo toast 8s) | SHIPPED | G1-097 | ✓ Represented |  |
| SH-82 | Footer selection readout ("Nothing selected" / "3 elements s | SHIPPED | G1-096 | ✓ Represented |  |
| SH-83 | Footer Device · Zoom button + zoom flyout (fit / selection / | SHIPPED | G1-096 | ✓ Represented |  |
| SH-84 | Footer "Structure" button + Structure popover (Layers tree) | UNREACHABLE | G1-095 | ✓ Deprecated |  |
| SH-85 | Onboarding chip slot in the footer | SHIPPED | G1-027 | ✓ Planned for later |  |
| SH-86 | Preview overlay (Desktop · Tablet · Mobile strip, bezel stag | SHIPPED | G1-086 | ✓ Represented |  |
| SH-87 | Preview overlay › "Share preview" button | DUPLICATE | G1-022 | ✓ Combined | DUPLICATE (Q3) — same job traced through its twin |
| SH-88 | Command palette (⌘K) container (search row, list, footer hin | SHIPPED | G1-093 | ✓ Represented | 4418:141188 → Ask AI (decision 10) |
| SH-89 | Palette › GO TO band ("Open <panel> panel" ×13) | SHIPPED | G1-093 | ✓ Represented | 4418:141188 → Ask AI (decision 10) |
| SH-90 | Palette › shell ACTIONS (Undo · Redo · Preview · Zoom in/out | SHIPPED | G1-093 | ✓ Represented | 4418:141188 → Ask AI (decision 10) |
| SH-91 | Palette › engine registry commands (Save · Delete · Group ·  | DUPLICATE | G1-092 | ✓ Combined |  |
| SH-92 | Palette › RECENT / SUGGESTED bands (last 5 commands, remembe | SHIPPED | G1-093 | ✓ Represented | 4418:141188 → Ask AI (decision 10) |
| SH-93 | Palette › no-results → Ask AI (one-word / multi-word / engin | SHIPPED | G1-093 | ✓ Represented | 4418:141188 → Ask AI (decision 10) |
| SH-94 | Palette › disabled-with-reason rows ("nothing to undo", "not | SHIPPED | G1-093 | ✓ Represented | 4418:141188 → Ask AI (decision 10) |
| SH-95 | Keyboard Shortcuts sheet (⌘/; search; Panels · Edit · View g | SHIPPED | G1-026 | ✓ Represented | EP-6 (copy) — annotation not placed |
| SH-96 | Global shortcuts owned by the shell (⌘K · ⌘S · ⌘Z · ⌘⇧Z/⌘Y · | SHIPPED | G1-091 | ✓ Represented | EP-6 |
| SH-97 | F6 / ⇧F6 region cycling (7 regions, skips hidden) | SHIPPED | G1-091 | ✓ Represented | EP-6 |
| SH-98 | Publish confirm dialog (Target · Pages · Client approval · R | FLAGGED-VIABLE | G1-043 | ✓ Represented | B3-10 + 4418:97118 Panel footer |
| SH-99 | Publish gate dialogs (No review sent · Waiting on approval · | FLAGGED-VIABLE | G1-045 | ✓ Represented | B1-09 + 4th gate route on 523 shells + reviewChangesRequested (decision 1) |
| SH-100 | Stale-approval dialog (CHANGED SINCE APPROVAL list; Request  | FLAGGED-VIABLE | G1-045 | ✓ Represented | B1-09 + 4th gate route on 523 shells + reviewChangesRequested (decision 1) |
| SH-101 | Publish outcome toasts (Published — site is live · Vercel no | FLAGGED-VIABLE | G1-048 | ✓ Represented |  |
| SH-102 | Silent home-page thumbnail capture at publish | FLAGGED-VIABLE | G1-048 | ✓ Represented |  |
| SH-103 | Publish history list (History › Published: loading/error/emp | SHIPPED | G1-052 | ✓ Represented | 4418:73440 gate dropped (decision 8) |
| SH-104 | Rollback flow (picker modal → confirm → progress → success / | SHIPPED | G1-052 | ✓ Represented | 4418:73440 gate dropped (decision 8) |
| SH-105 | Publish diff view ("Compare": ‹ Versions, summary, per-page  | SHIPPED | G1-052 | ✓ Represented | 4418:73440 gate dropped (decision 8) |
| SH-106 | Recovered-work banner (Discard & reload / Keep changes) | SHIPPED | G1-077 | ✓ Represented | B1-04 |
| SH-107 | Load-error banner (Session expired · Network · Site not foun | SHIPPED | G1-078 | ✓ Represented | B1-05, B1-06 |
| SH-108 | Session-expired dialog (changes at risk; Keep editing / Try  | SHIPPED | G1-079 | ✓ Represented |  |
| SH-109 | Conflict dialog (Reload latest / Save a backup / Overwrite…) | SHIPPED | G1-080 | ✓ Represented | B1-01, B1-02 |
| SH-110 | Save toasts (Saved · settings didn't · Offline · Couldn't re | SHIPPED | G1-084 | ✓ Represented |  |
| SH-111 | Sync-failure toasts (CMS · component · saved version · templ | SHIPPED | G1-082 | ✓ Represented | B1-03 |
| SH-112 | Create Component modal (Name · Description · Category · Tags | SHIPPED | G1-098 | ✓ Represented |  |
| SH-113 | Create Collection modal (2 steps: Name & Type → Fields; Gene | SHIPPED | G1-099 | ✓ Represented |  |
| SH-114 | Records modal (collection select, table, Publish/Unpublish/e | SHIPPED | G1-099 | ✓ Represented |  |
| SH-115 | Records modal › Import JSON | STUB | G1-099 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| SH-116 | Set Up Products Collection modal (Include sample products; S | SHIPPED | G1-100 | ✓ Represented |  |
| SH-117 | Save page as template modal | SHIPPED | G1-101 | ✓ Represented |  |
| SH-118 | Upgrade Your Plan modal (PRO badge; 4 checks; Maybe Later /  | SHIPPED | G1-102 | ✓ Represented |  |
| SH-119 | Rail coach mark ("Everything you build lives behind these si | SHIPPED | G1-027 | ✓ Planned for later |  |
| SH-120 | Getting-started chip + checklist (7 steps, accordion, progre | SHIPPED | G1-027 | ✓ Planned for later |  |
| SH-121 | Step-complete prompt (4s countdown; NEXT UP; Continue → / Do | SHIPPED | G1-027 | ✓ Planned for later |  |
| SH-122 | Step credit rules (brand applied · page created · section in | SHIPPED | G1-027 | ✓ Planned for later |  |
| SH-123 | Toast system (bottom-right, 360px, 5s default, ✕, action; to | SHIPPED | G1-081 | ✓ Represented | B3-11 |
| SH-124 | Undo / redo dark toasts ("Undo: <what>" + Redo; "Nothing to  | SHIPPED | G1-069 | ✓ Represented |  |
| SH-125 | Editing feedback toasts (delete · clipboard · block insert · | SHIPPED | G1-081 | ✓ Represented | B3-11 |
| SH-126 | View mode summary (what changes under `?view=readonly`) | DUPLICATE | G1-021 | ✓ Combined | B2-06 + EP-2a |
| EN-01 | Responsive breakpoints (Desktop ≥1024 · Tablet 768–1023 · Mo | SHIPPED | G1-104 | ✓ Represented |  |
| EN-02 | Desktop-first cascade (Tablet over Desktop; Mobile over both | SHIPPED | G1-104 | ✓ Represented |  |
| EN-03 | Forced breakpoint overrides on the canvas (+ inspector overr | SHIPPED | G1-104 | ✓ Represented |  |
| EN-04 | Legacy device-rule thresholds (991px / 575px) | LIMITED | G1-104 | ✓ Represented |  |
| EN-05 | Device previews (canvas frame sizes; three disagreeing table | LIMITED | G1-104 | ✓ Represented |  |
| EN-06 | "Watch" device (196×230) | LIMITED | G1-104 | ✓ Represented |  |
| EN-07 | Element pseudo-states (Base · :hover · :focus · :active · :d | SHIPPED | G1-105 | ✓ Represented |  |
| EN-08 | Locked flag (not selectable; "Unlock it in the Layers panel" | SHIPPED | G1-105 | ✓ Represented |  |
| EN-09 | Hidden flag (layer visibility; undoable) | SHIPPED | G1-105 | ✓ Represented |  |
| EN-10 | Component-instance protections (no wrap; skipped in multi-de | SHIPPED | G1-105 | ✓ Represented |  |
| EN-11 | Draggable / droppable / resizable per-element flags | SHIPPED | G1-105 | ✓ Represented |  |
| EN-12 | Page-root protection (never deleted; excluded from Select Al | SHIPPED | G1-105 | ✓ Represented |  |
| EN-13 | Brand colour mode toggle Light / Dark (system = stored defau | SHIPPED | G1-106 | ✓ Represented |  |
| EN-14 | "Dark value missing" warning chip | UNREACHABLE | G1-106 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| EN-15 | Published-site theme setting (light / dark / auto) | UNREACHABLE | G1-106 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| EN-16 | Master app-wide shortcut table | DUPLICATE | G1-026 | ✓ Combined | EP-6 (copy) — annotation not placed |
| EN-17 | Rail letter shortcuts (A I T M L P ⇧A B S U H R D) | DUPLICATE | G1-089 | ✓ Combined | DUPLICATE (Q3) — same job traced through its twin |
| EN-18 | Engine edit commands (Delete/Backspace · ⌘C ⌘X ⌘V ⌘D · ⌘G ⌘⇧ | SHIPPED | G1-092 | ✓ Combined |  |
| EN-19 | Text-field / widget guard for bare keys (inputs, contentEdit | SHIPPED | G1-091 | ✓ Represented | EP-6 |
| EN-20 | Canvas selection & navigation keys (click/double/triple, ⌘/⇧ | SHIPPED | G1-091 | ✓ Represented | EP-6 |
| EN-21 | Nudge 1px (⌘+arrow) / 10px (⇧+arrow); palette nudge commands | SHIPPED | G1-091 | ✓ Represented | EP-6 |
| EN-22 | Style clipboard (⌘⌥C copy styles / ⌘⌥V paste styles; "N styl | SHIPPED | G1-091 | ✓ Represented | EP-6 |
| EN-23 | Zoom & overlay chords (⌘0 ⌘1 ⌘2 ⌘= ⌘- ⌘' ⌘; ⌘⇧; ⌘B ⌘R ⌘⇧X) | SHIPPED | G1-096 | ✓ Represented |  |
| EN-24 | Documented-but-unbound chords (⌘⇧S · ⌘E · ⌘I · ⌘N · ⌘O · ⌘L  | UNREACHABLE | G1-094 | ✓ Deprecated |  |
| EN-25 | Keyboard-drag list reordering (↑↓ ⇧×10 Home End Esc Enter) | UNREACHABLE | G1-094 | ✓ Deprecated |  |
| EN-26 | Commands table (everything ⌘K can run) | DUPLICATE | G1-092 | ✓ Combined |  |
| EN-27 | Read-only refusal at the command gateway (`?view=readonly`) | SHIPPED | G1-021 | ✓ Represented | B2-06 + EP-2a |
| EN-28 | Command fires once; failures surface as error events | SHIPPED | G1-091 | ✓ Represented | EP-6 |
| EN-29 | Undo depth 100 + checkpoint every 10 steps | SHIPPED | G1-069 | ✓ Represented |  |
| EN-30 | Coalescing (~500ms burst = one step; transactions = one step | SHIPPED | G1-069 | ✓ Represented |  |
| EN-31 | Load baseline / selection re-point after undo / redo invalid | SHIPPED | G1-069 | ✓ Represented |  |
| EN-32 | Cannot-undo cases (binding a field · unbinding · deleting a  | SHIPPED | G1-069 | ✓ Represented |  |
| EN-33 | Excluded from history (device, zoom, selection, panel state, | SHIPPED | G1-069 | ✓ Represented |  |
| EN-34 | Undo/redo toast copy + past-tense label table | DUPLICATE | G1-069 | ✓ Combined | DUPLICATE (Q3) — same job traced through its twin |
| EN-35 | History panel row labels ("Changed background color", "N cha | SHIPPED | G1-069 | ✓ Represented |  |
| EN-36 | Autosave 1s after settle (5s standalone) · ⌘S · "dirty" = re | SHIPPED | G1-005 | ✓ Represented | B1-07 |
| EN-37 | Per-page unsaved dot | DUPLICATE | G1-097 | ✓ Combined | DUPLICATE (Q3) — same job traced through its twin |
| EN-38 | Browser-storage secret stripping (email API key, site passwo | SHIPPED | G1-116 | ✓ Internal |  |
| EN-39 | Save failure toasts table | DUPLICATE | G1-084 | ✓ Combined | DUPLICATE (Q3) — same job traced through its twin |
| EN-40 | Unsaved-work recovery on reload | DUPLICATE | G1-076 | ✓ Combined | B1-03 |
| EN-41 | Loading placeholders rule (never show "Start building" while | SHIPPED | G1-078 | ✓ Represented | B1-05, B1-06 |
| EN-42 | Versions cap 50; auto-saves prune oldest; named never prune; | SHIPPED | G1-068 | ✓ Represented |  |
| EN-43 | Named version (name + description + canvas JPEG thumbnail) | SHIPPED | G1-070 | ✓ Represented |  |
| EN-44 | Auto-checkpoint on template apply ("Auto-save", skipped if e | SHIPPED | G1-070 | ✓ Represented |  |
| EN-45 | Restore with safety save (`Before restoring "<name>"`; abort | SHIPPED | G1-071 | ✓ Represented |  |
| EN-46 | Version list failed-to-load state ("Only this list failed to | SHIPPED | G1-071 | ✓ Represented |  |
| EN-47 | Storage-full: prune 10 oldest and retry once | SHIPPED | G1-070 | ✓ Represented |  |
| EN-48 | Version export / import (`versions-<project>-<timestamp>.jso | UNREACHABLE | G1-072 | ✓ Deprecated |  |
| EN-49 | Version compare ("Version Comparison (A → B)": style/text/la | SHIPPED | G1-061 | ✓ Combined |  |
| EN-50 | Auto-milestone suggestion (AI name; ≤1 per 30s; accept/edit/ | SHIPPED | G1-073 | ✓ Planned for later |  |
| EN-51 | Team attribution on versions and history entries | SHIPPED | G1-070 | ✓ Represented |  |
| EN-52 | Crash recovery (silent resync on visibility/uncaught error;  | LIMITED | G1-077 | ✓ Represented | B1-04 |
| EN-53 | Zero-page project gets a page automatically | SHIPPED | G1-116 | ✓ Internal |  |
| EN-54 | Interaction limits (zoom 10–400 · grid 1–100 default 10 · sn | SHIPPED | G1-096 | ✓ Represented |  |
| EN-55 | Structural limits (element 10–10 000px · text 20×16 · canvas | LIMITED | G1-107 | ✓ Represented |  |
| EN-56 | Plan caps (pages Free 10 / Pro 30 / Business 50; sites 3/15/ | LIMITED | G1-102 | ✓ Represented |  |
| EN-57 | Content caps (components 100 · applied-template records 25 · | SHIPPED | G1-108 | ✓ Represented |  |
| EN-58 | Upload limits (image 10MB/4096px · SVG 1MB · video 100MB · a | SHIPPED | G1-108 | ✓ Represented |  |
| EN-59 | Storage quota bar (1GB constant; warn 80% / critical 95%; "O | LIMITED | G1-108 | ✓ Represented |  |
| EN-60 | AI rate limit (30 requests per window, client-side) | SHIPPED | G1-108 | ✓ Represented |  |
| EN-61 | Plugin host allow-list (HTTPS; jsdelivr/unpkg/esm.sh) | UNREACHABLE | G1-108 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| EN-62 | Head-code survivors (`<meta> <link> <script src> <noscript>  | SHIPPED | G1-109 | ✓ Represented |  |
| EN-63 | Panel width limits (200–600, default 280) | LIMITED | G1-108 | ✓ Represented |  |
| EN-64 | Live structure validation on drop / paste / move (itself · o | SHIPPED | G1-107 | ✓ Represented |  |
| EN-65 | Tree audit + page audit (Maximum nesting depth (30) exceeded | UNREACHABLE | G1-088 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| EN-66 | Nesting rules matrix (void types; gallery/product-grid child | SHIPPED | G1-107 | ✓ Represented |  |
| EN-67 | Media upload validation messages (unsupported type; format h | SHIPPED | G1-108 | ✓ Represented |  |
| EN-68 | Custom-code validation (forbidden/unclosed/stray tags; inlin | SHIPPED | G1-109 | ✓ Represented |  |
| EN-69 | CMS field validation (required · number · min/max · length · | SHIPPED | G1-110 | ✓ Represented |  |
| EN-70 | Plan messages ("<Feature> requires the Pro plan." · "<Featur | SHIPPED | G1-102 | ✓ Represented |  |
| EN-71 | Other engine messages (Operation timed out · Remote endpoint | UNREACHABLE | G1-111 | ✓ Internal |  |
| EN-72 | Naming defaults — project "Untitled Project"; pages Home → A | SHIPPED | G1-097 | ✓ Represented |  |
| EN-73 | Slug derivation ("About Us!" → `about-us`), auto until user  | SHIPPED | G1-111 | ✓ Internal |  |
| EN-74 | Route matching (case-insensitive, leading `/`, trailing slas | SHIPPED | G1-111 | ✓ Internal |  |
| EN-75 | Exactly one Home page | SHIPPED | G1-097 | ✓ Represented |  |
| EN-76 | Element display names (Heading 1–6, Paragraph, Container, …  | SHIPPED | G1-111 | ✓ Internal |  |
| EN-77 | Other naming (template sections by landmark; "Section 2 of 3 | SHIPPED | G1-111 | ✓ Internal |  |
| EN-78 | Plan ladder & limits table (Free / Pro $29 / Business $79; s | LIMITED | G1-102 | ✓ Represented |  |
| EN-79 | Pro-locked Settings screens (Custom code · Integrations → lo | SHIPPED | G1-102 | ✓ Represented |  |
| EN-80 | Premium templates PRO badge → upgrade modal on Free | SHIPPED | G1-102 | ✓ Represented |  |
| EN-81 | Upgrade modal (global) | DUPLICATE | G1-102 | ✓ Combined | DUPLICATE (Q3) — same job traced through its twin |
| EN-82 | Media storage bar reflects plan allowance | DUPLICATE | G1-108 | ✓ Combined | DUPLICATE (Q3) — same job traced through its twin |
| EN-83 | Onboarding "Get started" checklist (7 steps, credit rules, r | DUPLICATE | G1-027 | ✓ Planned for later |  |
| EN-84 | Element clipboard paste placement (inside if legal → after s | SHIPPED | G1-107 | ✓ Represented |  |
| EN-85 | HTML import sanitisation (handlers, `javascript:`, inline sc | SHIPPED | G1-112 | ✓ Internal |  |
| EN-86 | Tag → element type mapping (p→Paragraph, h1–h6→Heading, div→ | SHIPPED | G1-112 | ✓ Internal |  |
| EN-87 | Template apply = one undo step ("Applied template") with per | SHIPPED | G1-112 | ✓ Internal |  |
| EN-88 | Insert HTML into a specific element ("Inserted HTML", one st | SHIPPED | G1-112 | ✓ Internal |  |
| EN-89 | External drops (files → image elements; text/HTML/URL parsed | LIMITED | G1-107 | ✓ Represented |  |
| EN-90 | Media insert rules (empty container → inside; non-empty → af | SHIPPED | G1-107 | ✓ Represented |  |
| EN-91 | Element model (type, tag, attributes, classes, base styles,  | SHIPPED | G1-113 | ✓ Internal |  |
| EN-92 | Form-control auto-typing (Email/Password/Number/Date/Time/Co | SHIPPED | G1-113 | ✓ Internal |  |
| EN-93 | Default styles of new elements (accent #1A56DB, Inter, per-t | SHIPPED | G1-113 | ✓ Internal |  |
| EN-94 | Built-in "global styles" presets (purple #667eea) | UNREACHABLE | G1-113 | ✓ Internal |  |
| EN-95 | Selection rules (primary + multi set; Select All excludes ro | SHIPPED | G1-113 | ✓ Internal |  |
| EN-96 | Read-only view mode rules | DUPLICATE | G1-021 | ✓ Combined | B2-06 + EP-2a |
| EN-97 | `?density=fewer` inspector trim | LIMITED | G1-114 | ✓ Internal |  |
| EN-98 | Feature flags (`FEATURE_PUBLISH` · `FEATURE_DS_AI` · `FEATUR | FLAGGED-VIABLE | G1-103 | ✓ Represented |  |
| EN-99 | Internal `FEATURES` constants (COLLABORATION / PLUGINS / VER | LIMITED | G1-103 | ✓ Represented |  |
| EN-100 | Error tracking (Sentry, prod-only when DSN set; no user-visi | SHIPPED | G1-114 | ✓ Internal |  |
| EN-101 | Dev console tracing per domain; sidebar analytics no-ops | UNREACHABLE | G1-114 | ✓ Internal |  |
| EN-102 | Browser storage keys (`buildrick-…`; silent migration from t | SHIPPED | G1-114 | ✓ Internal |  |
| EN-103 | Toast tones & durations catalogue | DUPLICATE | G1-081 | ✓ Combined | B3-11 |
| EN-104 | Fonts offered (26 Google families: 10 sans, 5 serif, 4 mono, | SHIPPED | G1-115 | ✓ Represented |  |
| EN-105 | Icon library (369 Lucide icons, 17 categories, search, recen | SHIPPED | G1-115 | ✓ Represented |  |
| EN-106 | Animation presets (45 + custom), defaults, triggers, easings | SHIPPED | G1-115 | ✓ Represented |  |
| EN-107 | Interactions run on the canvas only in Preview mode (always  | SHIPPED | G1-086 | ✓ Represented |  |
| EN-108 | Data-binding transforms (text/number/date/attribute/utility) | LIMITED | G1-110 | ✓ Represented |  |
| EN-109 | CMS field types (15), validation options, content status, bu | SHIPPED | G1-110 | ✓ Represented |  |
| EN-110 | Components (master + instances, per-instance overrides, vari | SHIPPED | G1-110 | ✓ Represented |  |
| EN-111 | Settings enumerations (visibility, per-page SEO + structured | SHIPPED | G1-115 | ✓ Represented |  |
| EN-112 | Image editor enumerations (9 crop presets, rotation/flip, 5  | SHIPPED | G1-115 | ✓ Represented |  |
| EN-113 | Colour tooling (parsers, contrast AA/AAA + "Fix contrast", c | LIMITED | G1-115 | ✓ Represented |  |
| EN-114 | Standalone demo app (port 5050, licence "DEMO", Agentation o | UNREACHABLE | G1-114 | ✓ Internal |  |
| EN-115 | Public API surface (shell default export + engine classes) | UNREACHABLE | G1-114 | ✓ Internal |  |
| CV-01 | Canvas surface & page sheet | SHIPPED | G2-001 | ✓ Represented |  |
| CV-02 | Element decoration: hover move cursor · selected outline · d | SHIPPED | G2-002 | ✓ Represented |  |
| CV-03 | Locked element look + click guard | SHIPPED | G2-006 | ✓ Represented |  |
| CV-04 | Hidden element (Layers) at 25 % opacity | SHIPPED | G2-007 | ✓ Represented |  |
| CV-05 | Per-breakpoint hidden element | LIMITED | G2-008 | ✓ Represented |  |
| CV-06 | Empty container / column placeholders | SHIPPED | G2-009 | ✓ Represented |  |
| CV-07 | Image-without-source placeholder | SHIPPED | G2-009 | ✓ Represented |  |
| CV-08 | New / dropped element flash + settle | SHIPPED | G2-010 | ✓ Represented |  |
| CV-09 | Layers-row hover → canvas highlight | SHIPPED | G2-011 | ✓ Represented |  |
| CV-10 | Canvas hover → Layers row highlight | SHIPPED | G2-011 | ✓ Represented |  |
| CV-11 | Global custom CSS applied live | SHIPPED | G2-012 | ✓ Internal |  |
| CV-12 | Inspector animations play on canvas | SHIPPED | G2-012 | ✓ Internal |  |
| CV-13 | Breakpoint switcher W / D / T / M + sheet sizes | SHIPPED | G2-013 | ✓ Combined |  |
| CV-14 | Wide stores styles as Desktop | LIMITED | G2-013 | ✓ Combined |  |
| CV-15 | Watch breakpoint (196×230) | LIMITED | G2-015 | ✓ Deprecated |  |
| CV-16 | Zoom scale (10–400 %, presets) | SHIPPED | G2-016 | ✓ Represented |  |
| CV-17 | Zoom to fit | SHIPPED | G2-016 | ✓ Represented |  |
| CV-18 | Zoom to selection | SHIPPED | G2-016 | ✓ Represented |  |
| CV-19 | Zoom in / out / 100 % | SHIPPED | G2-016 | ✓ Represented |  |
| CV-20 | Device frame mockup (phone / tablet bezel) | SHIPPED | G2-017 | ✓ Planned for later |  |
| CV-21 | Device frame toggle button | SHIPPED | G2-017 | ✓ Planned for later |  |
| CV-22 | Empty page CTA — state A | SHIPPED | G2-018 | ✓ Planned for later |  |
| CV-23 | Empty page CTA — state B (after Start blank) | SHIPPED | G2-018 | ✓ Planned for later |  |
| CV-24 | Loading skeleton | SHIPPED | G2-001 | ✓ Represented |  |
| CV-25 | Project unavailable (empty sheet, CTA suppressed) | SHIPPED | G2-001 | ✓ Represented |  |
| CV-26 | Hover L1 — dashed outline + name pill + drag grip | SHIPPED | G2-002 | ✓ Represented |  |
| CV-27 | Hover clone badge (⌘/Ctrl held) | SHIPPED | G2-003 | ✓ Planned for later |  |
| CV-28 | Hover L2 — Alt hierarchy pill + full grip | SHIPPED | G2-003 | ✓ Planned for later |  |
| CV-29 | Hover L3 — Alt+Shift box model + info badge | SHIPPED | G2-003 | ✓ Planned for later |  |
| CV-30 | Hover L3 CMS glyph 📊 | STUB | G2-004 | ✓ Deprecated |  |
| CV-31 | Hover L3 "Double-click to edit" hint | SHIPPED | G2-003 | ✓ Planned for later |  |
| CV-32 | Inspector mode (persistent L3 hover, "I" key, eye button) | UNREACHABLE | G2-005 | ✓ Deprecated |  |
| CV-33 | Single-selection box (border + glow) | SHIPPED | G2-019 | ✓ Planned for later |  |
| CV-34 | Resize handles ×8 (corners always; edges >50px) | SHIPPED | G2-019 | ✓ Planned for later |  |
| CV-35 | Resize behaviour (Shift ratio · Alt centre · Ctrl grid · Esc | SHIPPED | G2-019 | ✓ Planned for later |  |
| CV-36 | Rotation handle (stem + circle, Shift 15° snap) | SHIPPED | G2-019 | ✓ Planned for later |  |
| CV-37 | Size label while resizing ("W × H") | SHIPPED | G2-019 | ✓ Planned for later |  |
| CV-38 | CMS-bound badge on selection box | SHIPPED | G2-020 | ✓ Combined |  |
| CV-39 | Locked badge (padlock) on selection box | SHIPPED | G2-006 | ✓ Represented |  |
| CV-40 | Multi-selection box (dashed combined + member outlines) | SHIPPED | G2-021 | ✓ Planned for later |  |
| CV-41 | Multi-select alignment toolbar (canvas-anchored, 48px above  | DUPLICATE | G2-023 | ✓ Combined |  |
| CV-42 | Floating selection toolbar (pill above element, flips below) | SHIPPED | G2-024 | ✓ Combined |  |
| CV-43 | Toolbar › Select parent (chevron-up) | SHIPPED | G2-024 | ✓ Combined |  |
| CV-44 | Toolbar › name chip + ancestor dropdown | SHIPPED | G2-024 | ✓ Combined |  |
| CV-45 | Toolbar › Add (+) → "Add Child Element" picker | SHIPPED | G2-116 | ✓ Combined |  |
| CV-46 | Toolbar › Duplicate | SHIPPED | G2-024 | ✓ Combined |  |
| CV-47 | Toolbar › More ⋯ › Copy | SHIPPED | G2-024 | ✓ Combined |  |
| CV-48 | Toolbar › More ⋯ › Wrap in Container | SHIPPED | G2-024 | ✓ Combined |  |
| CV-49 | Toolbar › More ⋯ › Bring Forward / Send Backward | SHIPPED | G2-024 | ✓ Combined |  |
| CV-50 | Toolbar › Delete (isolated, far right) | SHIPPED | G2-024 | ✓ Combined |  |
| CV-51 | Toolbar › Edit with AI (sparkles) + popover | SHIPPED | G2-025 | ✓ Represented |  |
| CV-52 | AI popover › Diff rows + Apply / Discard | SHIPPED | G2-025 | ✓ Represented |  |
| CV-53 | Compact selection label (resize / multi-select only) | SHIPPED | G2-026 | ✓ Combined |  |
| CV-54 | Compact label › ancestor dropdown (root → current, glyphs) | SHIPPED | G2-026 | ✓ Combined |  |
| CV-55 | Bottom breadcrumb bar ("Canvas › … › current", ← Parent / →  | SHIPPED | G2-026 | ✓ Combined |  |
| CV-56 | Marquee (lasso) selection | SHIPPED | G2-021 | ✓ Planned for later |  |
| CV-57 | Second marquee implementation (Shift-add, Esc-cancel) | UNREACHABLE | G2-022 | ✓ Deprecated |  |
| CV-58 | Inline text editing (double-click, commit, Esc, sanitise) | SHIPPED | G2-027 | ✓ Represented | W-1 + 4418:107674 |
| CV-59 | Inline rich-text toolbar (style, size, B/I/U/S, lists, align | SHIPPED | G2-027 | ✓ Represented | W-1 + 4418:107674 |
| CV-60 | Inline toolbar › Text colour / Highlight colour popovers | SHIPPED | G2-027 | ✓ Represented | W-1 + 4418:107674 |
| CV-61 | Inline toolbar › Insert link popover (Apply / Remove) | LIMITED | G2-027 | ✓ Represented | W-1 + 4418:107674 |
| CV-62 | DnD feedback › target highlight (valid dashed accent / inval | SHIPPED | G2-028 | ✓ Represented |  |
| CV-63 | DnD feedback › destination label ("Insert inside/before/afte | SHIPPED | G2-028 | ✓ Represented |  |
| CV-64 | DnD feedback › invalid badge (10 reasons) + assertive SR ann | SHIPPED | G2-028 | ✓ Represented |  |
| CV-65 | DnD feedback › drop-path pill ("Drop inside: A › B › **C**") | SHIPPED | G2-028 | ✓ Represented |  |
| CV-66 | Post-drop feedback (SR "Inserted: X", upload toast, error to | SHIPPED | G2-010 | ✓ Represented |  |
| CV-67 | Section reorder handles (24px accent square at each boundary | SHIPPED | G2-031 | ✓ Represented |  |
| CV-68 | Snap / smart alignment guides (magenta) | SHIPPED | G2-032 | ✓ Represented | W-2 |
| CV-69 | Spacing indicators (red, "equal gap" / "parent padding" with | SHIPPED | G2-032 | ✓ Represented | W-2 |
| CV-70 | Rulers (top/left, ticks every 10/100px, hover line) | SHIPPED | G2-033 | ✓ Represented | W-4 |
| CV-71 | User-placed guides (click ruler to add, drag, double-click r | LIMITED | G2-033 | ✓ Represented | W-4 |
| CV-72 | Engine guide list rendered pale blue (centre guides off) | SHIPPED | G2-032 | ✓ Represented | W-2 |
| CV-73 | Grid overlay (10px cells) | SHIPPED | G2-034 | ✓ Represented | W-5 |
| CV-74 | Spacing spots (margin/padding boxes with value chips) | SHIPPED | G2-035 | ✓ Represented | W-6 |
| CV-75 | Spacing spots › click to edit value inline | SHIPPED | G2-035 | ✓ Represented | W-6 |
| CV-76 | Spacing auto-on at first selection | SHIPPED | G2-035 | ✓ Represented | W-6 |
| CV-77 | X-Ray wireframe mode | SHIPPED | G2-036 | ✓ Combined |  |
| CV-78 | Badges mode (hover type chip) | SHIPPED | G2-036 | ✓ Combined |  |
| CV-79 | Component view (dashed outline + type chip on every element) | SHIPPED | G2-036 | ✓ Combined |  |
| CV-80 | Outlines overlay (dashed on all, solid on containers) | UNREACHABLE | G2-036 | ✓ Combined |  |
| CV-81 | Dev mode overlay (master toggle) | UNREACHABLE | G2-036 | ✓ Combined |  |
| CV-82 | Canvas footer toolbar (floating bar, pinned, wraps) | SHIPPED | G2-037 | ✓ Combined |  |
| CV-83 | Footer › Undo / Redo | SHIPPED | G2-037 | ✓ Combined |  |
| CV-84 | Footer › overlay toggles ×6 (Snap Guides, Spacing, Grid, Rul | SHIPPED | G2-037 | ✓ Combined |  |
| CV-85 | Footer › keyboard chords for overlays (⌘; ⌘⇧; ⌘' ⌘R ⌘B ⌘⇧X) | SHIPPED | G2-037 | ✓ Combined |  |
| CV-86 | Footer › Inspector toggle | SHIPPED | G2-037 | ✓ Combined |  |
| CV-87 | Footer › Help (?) → cheat sheet | SHIPPED | G2-037 | ✓ Combined |  |
| CV-88 | ⌘⇧P canvas command palette (surface, search, groups, keys) | SHIPPED | G2-038 | ✓ Combined |  |
| CV-89 | ⌘⇧P › Recent chips + "(Select an element first)" dimming | SHIPPED | G2-038 | ✓ Combined |  |
| CV-90 | ⌘⇧P › Edit group (Undo, Redo, Duplicate, Delete, Select all, | SHIPPED | G2-038 | ✓ Combined |  |
| CV-91 | ⌘⇧P › View group (Zoom in/out/fit, Toggle layers panel, Prev | SHIPPED | G2-038 | ✓ Combined |  |
| CV-92 | ⌘⇧P › Insert group (Add text / image / button / container) | SHIPPED | G2-038 | ✓ Combined |  |
| CV-93 | ⌘⇧P › Tools group (CMS records, Save page as template, Brows | LIMITED | G2-038 | ✓ Combined |  |
| CV-94 | ⌘⇧P › "Start collaboration session" | FLAGGED-VIABLE | G2-038 | ✓ Combined |  |
| CV-95 | ⌘⇧P › Tools › Manage CMS records | SHIPPED | G2-038 | ✓ Combined |  |
| CV-96 | Keyboard cheat sheet modal ("?", footer Help, ⌘K "Keyboard s | SHIPPED | G2-039 | ✓ Represented | W-3 + legend link + menu row |
| CV-97 | Cheat sheet › search ("Search shortcuts…", empty state) | SHIPPED | G2-039 | ✓ Represented | W-3 + legend link + menu row |
| CV-98 | Pick-element mode (crosshair; next click hands element to as | SHIPPED | G2-040 | ✓ Planned for later |  |
| CV-99 | Remote collaborator cursors on canvas | FLAGGED-VIABLE | G2-041 | ✓ Planned for later |  |
| CV-100 | Friendly element names (type → label table, custom name wins | SHIPPED | G2-042 | ✓ Represented |  |
| CV-101 | Read-only / view mode canvas | SHIPPED | G2-001 | ✓ Represented |  |
| CV-102 | Accessibility: polite live region + assertive drop-invalid + | SHIPPED | G2-043 | ✓ Internal |  |
| CV-103 | Legacy 3-button device selector (🖥️ 📱 📲) | UNREACHABLE | G2-044 | ✓ Deprecated |  |
| CV-104 | Legacy styled pieces (multi-select count badge + ✕, dark ful | UNREACHABLE | G2-044 | ✓ Deprecated |  |
| CI-01 | Element context menu — surface (right-click opens, 4 group r | SHIPPED | G2-050 | ✓ Represented |  |
| CI-02 | Context menu via Shift+F10 (a11y route, centred on element) | SHIPPED | G2-050 | ✓ Represented |  |
| CI-03 | Right-click on empty canvas → browser native menu | SHIPPED | G2-050 | ✓ Represented |  |
| CI-04 | Context menu close rules + frozen-at-open | LIMITED | G2-050 | ✓ Represented |  |
| CI-05 | Submenu behaviour (150ms hover open/close, flips left, shift | SHIPPED | G2-050 | ✓ Represented |  |
| CI-06 | Keyboard navigation inside the menu (↑↓ wrap, → open, ← clos | SHIPPED | G2-050 | ✓ Represented |  |
| CI-07 | Shortcut hint rendering (Mac glyphs; Win/Linux "CtrlAltC") | LIMITED | G2-050 | ✓ Represented |  |
| CI-08 | Menu icons (line, 14px; unknown name = empty slot) | SHIPPED | G2-050 | ✓ Represented |  |
| CI-09 | Edit › Copy (internal + OS clipboard, toast) | SHIPPED | G2-051 | ✓ Represented |  |
| CI-10 | Edit › Cut (removes, undo toast) | SHIPPED | G2-051 | ✓ Represented |  |
| CI-11 | Edit › Paste (internal clipboard; "Nothing to paste" toast) | SHIPPED | G2-051 | ✓ Represented |  |
| CI-12 | Edit › Duplicate | SHIPPED | G2-051 | ✓ Represented |  |
| CI-13 | Edit › Delete (no confirm, Undo toast) | LIMITED | G2-051 | ✓ Represented |  |
| CI-14 | Insert › Insert before / Insert after | LIMITED | G2-052 | ✓ Combined |  |
| CI-15 | Insert › Insert inside (First / Last) | LIMITED | G2-052 | ✓ Combined |  |
| CI-16 | Insert › Wrap in section | SHIPPED | G2-052 | ✓ Combined |  |
| CI-17 | Insert › Unwrap element (shown disabled when not applicable) | SHIPPED | G2-052 | ✓ Combined |  |
| CI-18 | Layout › Make flex row / flex column / grid (2 cols) / Cente | SHIPPED | G2-053 | ✓ Combined |  |
| CI-19 | Layout › Bring to front / Bring forward / Send backward / Se | SHIPPED | G2-053 | ✓ Combined |  |
| CI-20 | Quick Style › Add padding (16px) / margin (16px) / border /  | SHIPPED | G2-054 | ✓ Combined |  |
| CI-21 | Quick Style › Copy styles / Paste styles (disabled until sty | SHIPPED | G2-054 | ✓ Combined |  |
| CI-22 | Quick Style › Reset all styles (no confirm) | LIMITED | G2-054 | ✓ Combined |  |
| CI-23 | Replace with block… (v3) | LIMITED | G2-055 | ✓ Represented | EP-5 |
| CI-24 | Improve with AI (v3) | SHIPPED | G2-055 | ✓ Represented | EP-5 |
| CI-25 | Bind to CMS field… (v3) | LIMITED | G2-055 | ✓ Represented | EP-5 |
| CI-26 | Add interaction (v3) | SHIPPED | G2-055 | ✓ Represented | EP-5 |
| CI-27 | Save as component (v3) | SHIPPED | G2-055 | ✓ Represented | EP-5 |
| CI-28 | Reveal in layers | SHIPPED | G2-056 | ✓ Represented | EP-5 |
| CI-29 | Select parent (←) | SHIPPED | G2-056 | ✓ Represented | EP-5 |
| CI-30 | Group (⌘G) from the menu | LIMITED | G2-056 | ✓ Represented | EP-5 |
| CI-31 | Ungroup (⌘⇧G) | SHIPPED | G2-056 | ✓ Represented | EP-5 |
| CI-32 | Lock / Unlock | SHIPPED | G2-006 | ✓ Represented |  |
| CI-33 | "Select from stack" (element stack captured at open, no row  | UNREACHABLE | G2-057 | ✓ Deprecated |  |
| CI-34 | Side-panel drag sources (Add card ghost · component · catalo | SHIPPED | G2-029 | ✓ Represented |  |
| CI-35 | Drop target resolution (25 % before / 50 % inside / 25 % aft | SHIPPED | G2-028 | ✓ Represented |  |
| CI-36 | Auto-scroll near viewport edge during drag (50px band, up to | SHIPPED | G2-028 | ✓ Represented |  |
| CI-37 | Drop: Add-panel element/block (walks up to a legal parent; f | SHIPPED | G2-010 | ✓ Represented |  |
| CI-38 | Drop: saved component instance | SHIPPED | G2-029 | ✓ Represented |  |
| CI-39 | Drop: catalog component (placeholder carrying id/variant) | LIMITED | G2-029 | ✓ Represented |  |
| CI-40 | Drop: template HTML (before/after target or appended) | SHIPPED | G2-029 | ✓ Represented |  |
| CI-41 | Drop: media asset (insert or apply to target; stock auto-sav | LIMITED | G2-029 | ✓ Represented |  |
| CI-42 | Drop: OS image file (upload then set as target's image) | LIMITED | G2-029 | ✓ Represented |  |
| CI-43 | Drop refused while inline editing ("Cannot drop while editin | SHIPPED | G2-010 | ✓ Represented |  |
| CI-44 | Move existing element by drag (40 % opacity, custom ghost wi | SHIPPED | G2-029 | ✓ Represented |  |
| CI-45 | Clone mode (⌘/Ctrl held at drag start) | SHIPPED | G2-029 | ✓ Represented |  |
| CI-46 | Shift during drag → crosshair ("sibling mode" hint) | STUB | G2-030 | ✓ Deprecated |  |
| CI-47 | Multi-selection drag (all members move; relative order kept) | SHIPPED | G2-029 | ✓ Represented |  |
| CI-48 | Live move validation (self / descendant / depth / void / tex | SHIPPED | G2-028 | ✓ Represented |  |
| CI-49 | Drag cancel (drop outside / over nothing) | SHIPPED | G2-029 | ✓ Represented |  |
| CI-50 | Touch drag (500ms hold, 40 % opacity, drop AFTER touched ele | LIMITED | G2-029 | ✓ Represented |  |
| CI-51 | Section reorder via side handle (§2.3 — pointer) | SHIPPED | G2-031 | ✓ Represented |  |
| CI-52 | Marquee selection (§2.4 — pointer) | SHIPPED | G2-021 | ✓ Planned for later |  |
| CI-53 | Nesting rules table (51 types; category-derived) | SHIPPED | G2-028 | ✓ Represented |  |
| CI-54 | Extra move rules (no self/descendant; ≤30 deep; no Button/Li | SHIPPED | G2-028 | ✓ Represented |  |
| CI-55 | Click to select (expanded hit area for small elements) | SHIPPED | G2-021 | ✓ Planned for later |  |
| CI-56 | Shift+click additive selection | SHIPPED | G2-021 | ✓ Planned for later |  |
| CI-57 | ⌘/Ctrl+click click-through cycling (innermost first, then be | SHIPPED | G2-021 | ✓ Planned for later |  |
| CI-58 | Double-click → child under pointer / first child; Triple-cli | SHIPPED | G2-021 | ✓ Planned for later |  |
| CI-59 | Click empty canvas clears selection (+ resets click-through) | SHIPPED | G2-021 | ✓ Planned for later |  |
| CI-60 | Cursor language (default · pointer/move · text · zoom-in wit | SHIPPED | G2-005 | ✓ Deprecated |  |
| CI-61 | Keyboard › selection & navigation (Tab/⇧Tab, ↑↓ siblings, ←  | SHIPPED | G2-047 | ✓ Represented | W-3 |
| CI-62 | Keyboard › move & re-order (⌘+arrow 1px, ⇧+arrow 10px, ⌥↑/↓  | LIMITED | G2-047 | ✓ Represented | W-3 |
| CI-63 | Keyboard › ⌘C / ⌘X / ⌘V / ⌘D / Delete (app-wide, toasts on c | SHIPPED | G2-047 | ✓ Represented | W-3 |
| CI-64 | Keyboard › ⌘Z / ⌘⇧Z / ⌘Y | SHIPPED | G2-046 | ✓ Represented |  |
| CI-65 | Keyboard › ⌘G Group / ⌘⇧G Ungroup | SHIPPED | G2-047 | ✓ Represented | W-3 |
| CI-66 | Keyboard › ⌘] ⌘[ ⌘⇧] ⌘⇧[ ordering | SHIPPED | G2-047 | ✓ Represented | W-3 |
| CI-67 | Keyboard › ⌘⌥C copy styles / ⌘⌥V paste styles (canvas; toast | SHIPPED | G2-047 | ✓ Represented | W-3 |
| CI-68 | Keyboard › ⌘S save | SHIPPED | G2-047 | ✓ Represented | W-3 |
| CI-69 | Keyboard › view/panels/tools (⌘K, ⌘/, ⌘P, C, ⌘J, ⌘⇧A, ⌘⇧E, ⌘ | SHIPPED | G2-047 | ✓ Represented | W-3 |
| CI-70 | Keys listed in a constants table but never bound (V/H/T/R/F, | UNREACHABLE | G2-048 | ✓ Deprecated |  |
| CI-71 | ⌘⇧P canvas palette (§4.6 — pointer) | SHIPPED | G2-038 | ✓ Combined |  |
| CI-72 | Keyboard cheat sheet (§4.7 — pointer) | SHIPPED | G2-039 | ✓ Represented | W-3 + legend link + menu row |
| CI-73 | Comment mode toggle (Topbar "Comments" button · C key · Esc  | SHIPPED | G1-009 | ✓ Represented | B2-01 + EP-1 (503 boards) |
| CI-74 | Comment pins (numbered accent discs, tooltip "Ana: first 80  | SHIPPED | G1-034 | ✓ Represented | B2-01 |
| CI-75 | Place pin + draft popover ("New comment", "Leave a comment…" | SHIPPED | G1-035 | ✓ Represented | B2-02, B2-03 |
| CI-76 | Post comment — success / failure toasts | SHIPPED | G1-035 | ✓ Represented | B2-02, B2-03 |
| CI-77 | Pin click → Review panel | SHIPPED | G1-030 | ✓ Represented |  |
| CI-78 | Re-pin a detached comment (banner "Click an element to re-pi | SHIPPED | G1-037 | ✓ Represented | B2-04 + 4418:116906 Reattach |
| CI-79 | Orphan-comments modal ("A comment lost its element" / "N com | SHIPPED | G1-036 | ✓ Represented | B2-05 |
| CI-80 | Comments gating (saved site only; standalone demo = mode on  | LIMITED | G1-034 | ✓ Represented | B2-01 |
| CI-81 | Comment features NOT on the canvas (threads, replies, resolv | UNREACHABLE | G1-038 | ✓ Deprecated |  |
| CI-82 | Collab › Start session (Site menu "Start collaboration"; "Sa | FLAGGED-VIABLE | G1-024 | ✓ Represented | EP-2b (PLANNED row) + B3-11 toasts |
| CI-83 | Collab › Presence avatar stack (24px, overlap, initials on 5 | FLAGGED-VIABLE | G1-011 | ✓ Represented | B3-06, B3-07 (PLANNED) |
| CI-84 | Collab › Connection pill ("2 editing" green · "Reconnecting… | FLAGGED-VIABLE | G1-011 | ✓ Represented | B3-06, B3-07 (PLANNED) |
| CI-85 | Collab › Remote cursors (§6 — pointer) | FLAGGED-VIABLE | G1-039 | ✓ Represented | B3-08 (PLANNED) |
| CI-86 | Collab › tracked but never shown (remote selections, "editin | UNREACHABLE | G1-040 | ✓ Internal |  |
| CI-87 | Collab › conflict behaviour (remote-wins merge, dropped edit | FLAGGED-VIABLE | G1-041 | ✓ Planned for later |  |
| CI-88 | Interactions › trigger list (Mouse ×5 · Focus ×2 · Page ×3 · | SHIPPED | G2-157 | ✓ Combined |  |
| CI-89 | Interactions › defaults (Hover · Fade In · 300ms · 0 delay · | SHIPPED | G2-157 | ✓ Combined |  |
| CI-90 | Interactions › 42 animation presets + Custom | SHIPPED | G2-157 | ✓ Combined |  |
| CI-91 | Interactions › runtime (page-load queue; scroll-into-view on | SHIPPED | G2-157 | ✓ Combined |  |
| CI-92 | Interactions › reverse on leave / blur / release | STUB | G2-157 | ✓ Combined |  |
| CI-93 | Interactions › toggle on/off, duplicate (" (copy)"), reorder | SHIPPED | G2-157 | ✓ Combined |  |
| CI-94 | Toolbar action copy reference (§8 — pointer) | SHIPPED | G2-024 | ✓ Combined |  |
| PG-01 | Pages panel frame + header (title, ⌘K keycap, expand/collaps | SHIPPED | G2-070 | ✓ Represented |  |
| PG-02 | Page tree (folders first, then ungrouped; 32px rows; live sy | SHIPPED | G2-071 | ✓ Represented |  |
| PG-03 | Search pages (bare 28px box; `/` focuses; Esc clears; result | SHIPPED | G2-072 | ✓ Represented |  |
| PG-04 | Loading skeleton (6 rows, "Loading pages") | SHIPPED | G2-073 | ✓ Represented |  |
| PG-05 | Empty state ("No pages yet" → Create blank page / From templ | SHIPPED | G2-073 | ✓ Represented |  |
| PG-06 | Load-error block ("Couldn't load your pages." + Try again) | SHIPPED | G2-073 | ✓ Represented |  |
| PG-07 | No-search-matches ("Nothing matches 'q'." + Clear search) | SHIPPED | G2-072 | ✓ Represented |  |
| PG-08 | One-page note ("This site has one page." + "+ Add page") | SHIPPED | G2-073 | ✓ Represented |  |
| PG-09 | Select page (click / Enter → active on canvas) | SHIPPED | G2-071 | ✓ Represented |  |
| PG-10 | Page row anatomy (checkbox slot, drag grip, home/external gl | SHIPPED | G2-071 | ✓ Represented |  |
| PG-11 | Add page (footer "+ Add page", empty-state, one-page note; d | SHIPPED | G2-074 | ✓ Represented |  |
| PG-12 | Inline rename (double-click / F2 / menu "Rename…"; Enter com | SHIPPED | G2-075 | ✓ Represented |  |
| PG-13 | Duplicate page (menu, ⌘D hint; deep copy " Copy") | SHIPPED | G2-077 | ✓ Represented | 4418:96273 hidden (decision 27) |
| PG-14 | Set as homepage (hidden when already home; external-link gua | SHIPPED | G2-077 | ✓ Represented | 4418:96273 hidden (decision 27) |
| PG-15 | Copy page link (`https://{domain}/{slug}`; "No address yet"  | SHIPPED | G2-077 | ✓ Represented | 4418:96273 hidden (decision 27) |
| PG-16 | Page context menu (Rename… F2 · Duplicate ⌘D · Set as homepa | SHIPPED | G2-078 | ✓ Represented |  |
| PG-17 | Delete a page (guards: only page / home page → amber toasts; | SHIPPED | G2-079 | ✓ Represented |  |
| PG-18 | Reorder pages by drag (drop on a page row → placed after it; | SHIPPED | G2-080 | ✓ Represented |  |
| PG-19 | Multi-select (⌘/Ctrl click toggles, Shift range, checkbox sl | SHIPPED | G2-081 | ✓ Represented |  |
| PG-20 | Bulk toolbar frame ("N selected" · Duplicate · Move to… · De | SHIPPED | G2-081 | ✓ Represented |  |
| PG-21 | Bulk Duplicate | SHIPPED | G2-081 | ✓ Represented |  |
| PG-22 | Bulk Move to… (per-folder menu, "No folders yet", Remove fro | LIMITED | G2-081 | ✓ Represented |  |
| PG-23 | Bulk Delete (confirm "Delete N pages?" listing names; succes | SHIPPED | G2-081 | ✓ Represented |  |
| PG-24 | Folders: create ("⋯ › New folder"), expand/collapse, inline  | LIMITED | G2-082 | ✓ Represented |  |
| PG-25 | Folders: drag page into folder / "×" Remove from folder / dr | LIMITED | G2-082 | ✓ Represented |  |
| PG-26 | Go-to-page palette (⌘K / Ctrl+K toggles; ⌘K keycap; fuzzy fi | SHIPPED | G2-083 | ✓ Combined |  |
| PG-27 | Listings view (SEO at a glance: PAGE · TITLE · DESC · SCORE; | SHIPPED | G2-084 | ✓ Represented | EP-11 |
| PG-28 | Structure view (site as route tree; "N pages, by route."; "( | SHIPPED | G2-085 | ✓ Represented |  |
| PG-29 | Page settings dialog frame (580×520; tabs SEO / Social / Adv | SHIPPED | G2-086 | ✓ Represented |  |
| PG-30 | Autosave (500ms after typing; ⌘S immediate; "Page settings s | SHIPPED | G2-086 | ✓ Represented |  |
| PG-31 | Discard-unsaved dialog ("Discard unsaved {tab} changes?" · K | SHIPPED | G2-086 | ✓ Represented |  |
| PG-32 | Settings error boundary ("Settings error" · error text · Try | SHIPPED | G2-086 | ✓ Represented |  |
| PG-33 | SEO tab: Google preview card + score card (checklist, "Looks | SHIPPED | G2-087 | ✓ Planned for later |  |
| PG-34 | SEO tab: Meta title (N/60 counter with Too short / Ideal / T | SHIPPED | G2-087 | ✓ Planned for later |  |
| PG-35 | SEO tab: Meta description (tooltip, N/160 counter, textarea, | SHIPPED | G2-087 | ✓ Planned for later |  |
| PG-36 | SEO tab: URL slug (mono prefix; auto-format lowercase/hyphen | SHIPPED | G2-087 | ✓ Planned for later |  |
| PG-37 | Redirect offer card after a saved slug change ("URL changed  | SHIPPED | G2-087 | ✓ Planned for later |  |
| PG-38 | Social tab: share-card preview (1200:630) + OG title (N/60)  | SHIPPED | G2-088 | ✓ Represented |  |
| PG-39 | Advanced: Visibility segmented control Live / Hidden / Passw | LIMITED | G2-089 | ✓ Represented |  |
| PG-40 | Advanced: Password box (masked input, Show/Hide, Copy disabl | LIMITED | G2-089 | ✓ Represented |  |
| PG-41 | Advanced: "Allow indexing" / "Follow links" toggles | SHIPPED | G2-089 | ✓ Represented |  |
| PG-42 | Advanced: Custom `<head>` code (6-row mono textarea; unclose | SHIPPED | G2-089 | ✓ Represented |  |
| PG-43 | Routing rules a user can see (lower-case; leading "/"; no tr | SHIPPED | G2-085 | ✓ Represented |  |
| PG-44 | Template catalogue (10 built-in single-page HTML templates;  | SHIPPED | G2-093 | ✓ Represented |  |
| PG-45 | Templates tab doors (shortcut T; ⌘K "Browse templates"; Page | SHIPPED | G2-090 | ✓ Represented | ⌘K Replace layout → 4428:149355 (decision 27) |
| PG-46 | Compact drawer gallery (280): always-visible search, "PAGE T | SHIPPED | G2-094 | ✓ Combined |  |
| PG-47 | "SECTION TEMPLATES" group (drawer) and "Sections" filter pil | STUB | G2-094 | ✓ Combined |  |
| PG-48 | Saved-templates sync-failed block ("Couldn't load templates. | SHIPPED | G2-094 | ✓ Combined |  |
| PG-49 | Drawer empty states ("Nothing matches 'q'." + Clear search;  | SHIPPED | G2-094 | ✓ Combined |  |
| PG-50 | Apply modal from a drawer card (name, "N sections · Free/Pro | SHIPPED | G2-094 | ✓ Combined |  |
| PG-51 | Full gallery (700 / detail / new-page): header variants, mag | SHIPPED | G2-095 | ✓ Hidden |  |
| PG-52 | Pagination bar ("‹ 1 2 3 … ›", 6 per page; hidden with one p | SHIPPED | G2-095 | ✓ Hidden |  |
| PG-53 | Gallery empty states (`No templates found for "q"` + Clear s | SHIPPED | G2-095 | ✓ Hidden |  |
| PG-54 | Gallery keyboard (← → move detail selection; Esc closes prev | SHIPPED | G2-095 | ✓ Hidden |  |
| PG-55 | Template detail panel (380px; preview + "APPLIED HERE"; name | SHIPPED | G2-096 | ✓ Combined |  |
| PG-56 | "Where this template is used" dialog (tabs Preview / Used in | SHIPPED | G2-097 | ✓ Hidden |  |
| PG-57 | Full-screen preview (≤1100×780; Desktop / Tablet / Mobile se | SHIPPED | G2-096 | ✓ Combined |  |
| PG-58 | Replace confirm ("Replace this page with '{T}'?"; ☑ Save cur | SHIPPED | G2-098 | ✓ Planned for later |  |
| PG-59 | Applying progress card ("Applying {T}…" · "Do not close the  | SHIPPED | G2-099 | ✓ Represented |  |
| PG-60 | Apply outcome (green `"{T}" applied successfully`; APPLIED b | SHIPPED | G2-099 | ✓ Represented |  |
| PG-61 | New page from template (Pages › From template → new-page hea | SHIPPED | G2-101 | ✓ Represented |  |
| PG-62 | Role gate: applying / adding a template needs Admin or Owner | SHIPPED | G2-102 | ✓ Planned for later |  |
| PG-63 | Pro-template gate (E-Commerce, Restaurant, SaaS Pro → Upgrad | SHIPPED | G2-102 | ✓ Planned for later |  |
| PG-64 | Save page as template (modal: Template Name, Description; "T | SHIPPED | G2-103 | ✓ Represented |  |
| PG-65 | "My Templates" pill lists the user's saved templates (📄 ico | LIMITED | G2-103 | ✓ Represented |  |
| PG-66 | Apply / open a saved (My) template | STUB | G2-103 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| PG-67 | Legacy "My Templates" list (Search my templates…, "N saved t | UNREACHABLE | G2-103 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| PG-68 | Legacy template preview modal (🖥️/📱/📲 device buttons, "Us | UNREACHABLE | G2-103 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| PG-69 | Engine TemplateManager (categories landing-page … other) | UNREACHABLE | G2-103 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| PG-70 | Layers panel frame + toolbar (search box; ⊞ Expand all; ⊟ Co | SHIPPED | G2-058 | ✓ Represented |  |
| PG-71 | Layer search (matches custom name / label; results shown fla | SHIPPED | G2-059 | ✓ Represented |  |
| PG-72 | Display settings popover ("DISPLAY SETTINGS" · Show HTML tag | SHIPPED | G2-060 | ✓ Represented |  |
| PG-73 | Breadcrumb slot (Section / Container / **Heading** when one  | SHIPPED | G2-062 | ✓ Represented |  |
| PG-74 | Purpose line ("Every element on this page. Drag a row to reo | SHIPPED | G2-062 | ✓ Represented |  |
| PG-75 | Layers states: loading skeleton ("Loading layers"), load err | SHIPPED | G2-063 | ✓ Represented |  |
| PG-76 | Layer row anatomy (28px compact; chevron; type icon; name ru | SHIPPED | G2-061 | ✓ Represented |  |
| PG-77 | Select from the tree (click; ⌘/Ctrl click add/remove; Shift  | SHIPPED | G2-064 | ✓ Represented |  |
| PG-78 | Hover sync (row hover highlights the canvas element; canvas  | SHIPPED | G2-011 | ✓ Represented |  |
| PG-79 | Eye: "Dim in editor — the element still publishes" (25% + no | LIMITED | G2-007 | ✓ Represented |  |
| PG-80 | Lock / Unlock element (tree drag + rename blocked; canvas tr | LIMITED | G2-065 | ✓ Represented |  |
| PG-81 | Inline rename (double-click / F2 / menu "Rename"; Enter or b | LIMITED | G2-061 | ✓ Represented |  |
| PG-82 | Drag to reorder / nest (top 30% before, bottom 30% after, mi | SHIPPED | G2-066 | ✓ Represented |  |
| PG-83 | Layer context menu (Cut · Copy · Paste (disabled until clipb | SHIPPED | G2-067 | ✓ Represented |  |
| PG-84 | Older icon-style layer context menu (Rename / Group / Lock–U | UNREACHABLE | G2-067 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| PG-85 | Selection banner (2+ selected: "N selected" · Group · Dim in | SHIPPED | G2-068 | ✓ Combined |  |
| PG-86 | Version History panel frame + view switcher ("Saves / Named  | SHIPPED | G2-169 | ✓ Represented |  |
| PG-87 | Saves filter row ("Saved versions" / "This session" chips) + | SHIPPED | G2-170 | ✓ Represented |  |
| PG-88 | Saves search bar ("Search saves…" / "Search changes…"; × cle | SHIPPED | G2-170 | ✓ Represented |  |
| PG-89 | Approval band ("⚑ APPROVED" · reviewer · stamp · "Compare wi | SHIPPED | G2-171 | ✓ Represented |  |
| PG-90 | Retention note ("50 versions kept…" / "This session only — t | SHIPPED | G2-170 | ✓ Represented |  |
| PG-91 | Saved versions list (date groups Today / Yesterday / date; 6 | LIMITED | G2-172 | ✓ Represented |  |
| PG-92 | Version hover thumbnail (300ms, 160px floating snapshot) | LIMITED | G2-172 | ✓ Represented |  |
| PG-93 | Save a version (footer "+ Save a version" → inline form "Ver | LIMITED | G2-172 | ✓ Represented |  |
| PG-94 | Restore a version (accent confirm block "Restore '{name}'?"  | SHIPPED | G2-172 | ✓ Represented |  |
| PG-95 | Delete a version (row turns red, "Delete" / × cancel; toast  | SHIPPED | G2-172 | ✓ Represented |  |
| PG-96 | Compare (inline: "Visual / Semantic" pill; side-by-side "Cur | SHIPPED | G2-173 | ✓ Represented |  |
| PG-97 | "Get AI Summary" (in Compare; "Generating…"; 60s per-version | SHIPPED | G2-173 | ✓ Represented |  |
| PG-98 | Milestone suggestion banner (AI-proposed checkpoint after pa | SHIPPED | G2-174 | ✓ Planned for later |  |
| PG-99 | Pruning notice ("Older auto-saves were removed" / "Past 50.  | SHIPPED | G2-172 | ✓ Represented |  |
| PG-100 | This session — undo trail (44px rows grouped by day; labels  | SHIPPED | G2-175 | ✓ Represented |  |
| PG-101 | Restore from a step (time link → destructive confirm "Restor | SHIPPED | G2-175 | ✓ Represented |  |
| PG-102 | Clear undo history ("Clear" → red "Clear all" + Cancel; disa | SHIPPED | G2-175 | ✓ Represented |  |
| PG-103 | Time-Travel scrubber (drawer over the canvas bottom; "Previe | SHIPPED | G2-176 | ✓ Represented |  |
| PG-104 | Published view ("LIVE · vN" banner; version rows with Live c | SHIPPED | G2-177 | ✓ Represented |  |
| PG-105 | Engine facts (undo keeps 100 steps; template apply / bulk pa | SHIPPED | G2-046 | ✓ Represented |  |
| PG-106 | Shared panel header (48px; title; expand/collapse "Expand {P | SHIPPED | G2-091 | ✓ Represented |  |
| PG-107 | Drill-in header ("‹ Back to {Parent}" auto-focused; breadcru | SHIPPED | G2-091 | ✓ Represented |  |
| PG-108 | Shared search bar (28px; 300ms debounce; optional mono kbd h | SHIPPED | G2-091 | ✓ Represented |  |
| PG-109 | Panel load-error block (red headline · "what was not lost" l | SHIPPED | G2-091 | ✓ Represented |  |
| PG-110 | "View: {value}" dropdown switcher (listbox with check mark) | UNREACHABLE | G2-092 | ✓ Deprecated |  |
| PG-111 | 60px feature card (icon box, title, subtitle, count / Pro /  | UNREACHABLE | G2-092 | ✓ Deprecated |  |
| PG-112 | Horizontal scrolling filter-chip row (arrow keys move select | UNREACHABLE | G2-092 | ✓ Deprecated |  |
| PG-113 | Sticky footer ("Unsaved changes" dot + primary/secondary but | UNREACHABLE | G2-092 | ✓ Deprecated |  |
| AD-01 | Add panel frame + header ("Add"; Expand / Close; no Help; 28 | SHIPPED | G2-104 | ✓ Represented |  |
| AD-02 | Other doors into Add (canvas right-click "Replace with block | SHIPPED | G2-104 | ✓ Represented |  |
| AD-03 | Search ("Search elements"; bare "⌘F" hint; 150ms; `/` when n | SHIPPED | G2-105 | ✓ Represented |  |
| AD-04 | Purpose line (selection-aware: "Click a row to add it at the | SHIPPED | G2-106 | ✓ Represented |  |
| AD-05 | Group headers (ELEMENTS 53 · BLOCKS 50 · COMPONENTS 14 · MIN | SHIPPED | G2-107 | ✓ Combined |  |
| AD-06 | ELEMENTS rows — click to insert (53 atomic elements; 28px ro | SHIPPED | G2-108 | ✓ Represented |  |
| AD-07 | ELEMENTS rows — drag to canvas (only ELEMENTS rows are dragg | SHIPPED | G2-108 | ✓ Represented |  |
| AD-08 | Disabled row state ("Soon" tag; not clickable / draggable; r | UNREACHABLE | G2-109 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| AD-09 | BLOCKS card grid (50; 136×80 thumb + 11px label; click / Ent | LIMITED | G2-110 | ✓ Planned for later |  |
| AD-10 | COMPONENTS rows (14 registry "Components" folder entries; so | SHIPPED | G2-107 | ✓ Combined |  |
| AD-11 | MINE rows (user's saved components, newest first; click → in | LIMITED | G2-111 | ✓ Represented |  |
| AD-12 | Search results (flat cross-source list; 32px rows with sourc | SHIPPED | G2-105 | ✓ Represented |  |
| AD-13 | "⌥  Paste HTML…" pinned row (clipboard → sanitised block "Pa | SHIPPED | G2-112 | ✓ Represented |  |
| AD-14 | Tips strip ("💡 Tip n/4"; ‹ › cycle; body only as hover tool | SHIPPED | G2-113 | ✓ Combined |  |
| AD-15 | "Bring tips back from Help" (promised in the ✕ hover title) | STUB | G2-113 | ✓ Combined |  |
| AD-16 | One-time "Quick Picks removed." callout (returning users wit | SHIPPED | G2-113 | ✓ Combined |  |
| AD-17 | Add panel loading skeleton ("Loading element library") and l | UNREACHABLE | G2-114 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| AD-18 | Insert click path (150ms spam guard; smart placement inside  | SHIPPED | G2-108 | ✓ Represented |  |
| AD-19 | Media elements inserted empty (Image / Video / Audio / Icon  | SHIPPED | G2-108 | ✓ Represented |  |
| AD-20 | Add panel keyboard map (A open tab · / focus search · ⌘F foc | SHIPPED | G2-104 | ✓ Represented |  |
| AD-21 | Element Picker modal frame (380px, ≤80vh; "Add Child Element | SHIPPED | G2-116 | ✓ Combined |  |
| AD-22 | Picker "Add Element Before" / "Add Element After" modes | UNREACHABLE | G2-116 | ✓ Combined |  |
| AD-23 | Picker nesting refused → modal closes with no message | LIMITED | G2-116 | ✓ Combined |  |
| AD-24 | Recents pill + overlay ("Recent Elements"; up to 8; "No rece | SHIPPED | G2-115 | ✓ Planned for later |  |
| AD-25 | Favorites pill + overlay ("Favorite Elements"; star on every | SHIPPED | G2-115 | ✓ Planned for later |  |
| AD-26 | Tip pill ("Drag onto canvas" with lightbulb; ✕ dismisses per | SHIPPED | G2-113 | ✓ Combined |  |
| AD-27 | Category accordions (Most Used · Layout · Basic · Typography | SHIPPED | G2-116 | ✓ Combined |  |
| AD-28 | Element cards (bordered tile; star; 18px icon; label; descri | SHIPPED | G2-116 | ✓ Combined |  |
| AD-29 | Picker search (filters by label / id inside each category; e | SHIPPED | G2-116 | ✓ Combined |  |
| AD-30 | Component model (master saved from an element; instances wit | LIMITED | G2-118 | ✓ Represented |  |
| AD-31 | Export / import components to a JSON file ("aquibra-componen | UNREACHABLE | G2-119 | ✓ Deprecated |  |
| AD-32 | Components panel doors (shortcut ⇧A; Brand panel summary row | SHIPPED | G2-120 | ✓ Represented |  |
| AD-33 | Components list view ("YOUR COMPONENTS"; 32px rows name · "{ | LIMITED | G2-121 | ✓ Represented |  |
| AD-34 | Component filters (All / UI / Sections / Saved / Favorites)  | UNREACHABLE | G2-121 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| AD-35 | Components panel states (empty "No components yet." + "Creat | SHIPPED | G2-121 | ✓ Represented |  |
| AD-36 | Component detail screen (drill-in "‹ Back to Components" + b | LIMITED | G2-122 | ✓ Represented |  |
| AD-37 | Insert Component (from detail; inside selection or page root | SHIPPED | G2-122 | ✓ Represented |  |
| AD-38 | Duplicate component ("{name} Copy", no dialog) | SHIPPED | G2-122 | ✓ Represented |  |
| AD-39 | Update component from the canvas selection (disabled until a | SHIPPED | G2-122 | ✓ Represented |  |
| AD-40 | Delete component (confirm "Delete Component" with / without  | SHIPPED | G2-122 | ✓ Represented |  |
| AD-41 | "INSTANCE ACTIONS › Detach instance" in detail (only when th | SHIPPED | G2-122 | ✓ Represented |  |
| AD-42 | "VARIANTS" chips in detail (Size S/M/L etc.; selected chip f | STUB | G2-122 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| AD-43 | Create Component modal (Name* / Description / Category / Tag | SHIPPED | G2-123 | ✓ Represented |  |
| AD-44 | Configure variant values after creation ("You can configure  | STUB | G2-123 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| AD-45 | Instances on the canvas — Layers ◇ badge + Inspector band (" | SHIPPED | G2-125 | ✓ Represented | EP-11 |
| AD-46 | Inspector "Detach instance" (amber outlined, Pro mode only;  | SHIPPED | G2-125 | ✓ Represented | EP-11 |
| AD-47 | Rename Component modal ("Rename Component" · "Component name | UNREACHABLE | G2-124 | ✓ Deprecated |  |
| AD-48 | "Select Variant — {name}" modal (variant buttons, "(current) | UNREACHABLE | G2-124 | ✓ Deprecated |  |
| AD-49 | Legacy component row (36px; four-squares icon; "{n}x" pill;  | UNREACHABLE | G2-124 | ✓ Deprecated |  |
| AD-50 | Buildrik DS catalogue read-only list in Brand (27 canonical  | SHIPPED | G2-126 | ✓ Represented |  |
| AD-51 | "✨ Generate with AI" row in Brand › Components (blocked with | FLAGGED-VIABLE | G2-126 | ✓ Represented |  |
| AD-52 | Draggable DS catalogue card grid ("From your Design System · | UNREACHABLE | G2-124 | ✓ Deprecated |  |
| AD-53 | AI panel entry points (⌘J / Ctrl+J; shortcut I; Inspector "✦ | SHIPPED | G2-127 | ✓ Combined |  |
| AD-54 | AI panel layout ("‹ Inspector" back row; "AI" title; scope b | SHIPPED | G2-128 | ✓ Represented |  |
| AD-55 | Idle state ("TRY" + three prompt links run immediately; note | SHIPPED | G2-129 | ✓ Represented |  |
| AD-56 | Chat thread with streaming ("You" / "Assistant" bubbles; 56p | SHIPPED | G2-130 | ✓ Combined |  |
| AD-57 | Multi-select guard ("AI editing supports one element at a ti | SHIPPED | G2-131 | ✓ Represented |  |
| AD-58 | Proposed-change card ("{n} change(s) proposed"; diff rows pr | SHIPPED | G2-130 | ✓ Combined |  |
| AD-59 | "↻ Regenerate" on a plain assistant reply (re-sends the prec | SHIPPED | G2-130 | ✓ Combined |  |
| AD-60 | Scope-aware server context (element scope → style/content co | SHIPPED | G2-128 | ✓ Represented |  |
| AD-61 | Draft mode — multi-step agent run ("Auto-apply steps" checkb | SHIPPED | G2-132 | ✓ Represented |  |
| AD-62 | Full-panel states ("AI drafting isn't configured yet." + Ope | SHIPPED | G2-133 | ✓ Represented |  |
| AD-63 | Privileged-action confirm (AI proposes publish → confirm dia | FLAGGED-VIABLE | G2-134 | ✓ Represented |  |
| AD-64 | AI command set (Set style; Set style variant (hover/focus/ac | SHIPPED | G2-135 | ✓ Internal |  |
| AD-65 | In-canvas "Edit with AI" popover (sparkles toolbar button, p | SHIPPED | G2-025 | ✓ Represented |  |
| AD-66 | AI content helpers outside the panel (SEO "Write with AI"; A | SHIPPED | G2-136 | ✓ Represented |  |
| AD-67 | Element type reference (engine types → Layers label, glyph,  | SHIPPED | G2-042 | ✓ Represented |  |
| AD-68 | Add panel lists the same thing twice (ELEMENTS vs BLOCKS / C | DUPLICATE | G2-107 | ✓ Combined |  |
| AD-69 | Legacy purple defaults in inserted content (Submit button, C | LIMITED | G2-108 | ✓ Represented |  |
| AD-70 | Known-gaps checklist (inventory Part G) | DUPLICATE | G2-107 | ✓ Combined |  |
| AS-01 | Assets drawer — open | SHIPPED | G3-001 | ✓ Represented |  |
| AS-02 | Manage assets ↗ / expand brackets → full library | SHIPPED | G3-002 | ✓ Combined |  |
| AS-03 | Drawer search (local + server ≥ 2 chars) | SHIPPED | G3-003 | ✓ Represented |  |
| AS-04 | Folder scope dropdown | SHIPPED | G3-004 | ✓ Represented |  |
| AS-05 | Type chips filter (image · video · svg · icon) | SHIPPED | G3-005 | ✓ Represented |  |
| AS-06 | Asset card (thumb, name, usage pips, STOCK badge) | SHIPPED | G3-006 | ✓ Represented |  |
| AS-07 | APPLIED badge · lock overlay · AI badge on cards | STUB | G3-006 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| AS-08 | Click card → insert on page / replace selected media element | SHIPPED | G3-007 | ✓ Represented |  |
| AS-09 | Selection-context replace ("Selecting image for: …") | SHIPPED | G3-008 | ✓ Represented |  |
| AS-10 | Drag card → canvas drop | SHIPPED | G3-009 | ✓ Combined |  |
| AS-11 | Double-click card → asset detail drill-in | SHIPPED | G3-010 | ✓ Represented |  |
| AS-12 | Select mode (☑ Select / right-click) + bulk bar | SHIPPED | G3-011 | ✓ Represented |  |
| AS-13 | Bulk move to folder ("Move to…" menu) | SHIPPED | G3-012 | ✓ Planned for later |  |
| AS-14 | Bulk delete → confirm → toast with Undo (8 s) | SHIPPED | G3-013 | ✓ Represented | EP-7 |
| AS-15 | Load more (server paging) | SHIPPED | G3-014 | ✓ Represented |  |
| AS-16 | Upload (footer link / drop strip / accept list) | SHIPPED | G3-015 | ✓ Represented |  |
| AS-17 | Upload progress rows · failed rows · Retry | SHIPPED | G3-015 | ✓ Represented |  |
| AS-18 | Oversized-file replacement ("Choose a smaller file…" → modal | SHIPPED | G3-016 | ✓ Represented |  |
| AS-19 | Storage quota band (near limit / full) + upload lock | SHIPPED | G3-017 | ✓ Represented |  |
| AS-20 | Local-only assets (server mirror failed) | LIMITED | G3-018 | ✓ Represented |  |
| AS-21 | Status pill ("Image editor — …" / "Optimizing → WebP…") | SHIPPED | G3-019 | ✓ Hidden |  |
| AS-22 | Footer links row (Upload · Stock · Icons · Fonts) | SHIPPED | G3-020 | ✓ Represented |  |
| AS-23 | Drawer states (no project · loading · load error · empty · n | SHIPPED | G3-001 | ✓ Represented |  |
| AS-24 | Asset detail hub (preview, dims/size, five rows) | SHIPPED | G3-021 | ✓ Represented |  |
| AS-25 | Alt text edit (drawer) | SHIPPED | G3-022 | ✓ Represented |  |
| AS-26 | ✨ Generate alt text (drawer) | LIMITED | G3-022 | ✓ Represented |  |
| AS-27 | Used-in view + "Go ›" | SHIPPED | G3-023 | ✓ Represented |  |
| AS-28 | Versions view + restore point restore | SHIPPED | G3-024 | ✓ Represented |  |
| AS-29 | Edit image from the drawer (→ image editor → hidden version) | SHIPPED | G3-025 | ✓ Represented |  |
| AS-30 | Optimise panel (drawer) | SHIPPED | G3-026 | ✓ Combined |  |
| AS-31 | Replace across site (drawer: picker → upload → dialog) | SHIPPED | G3-027 | ✓ Represented |  |
| AS-32 | Icon browser drill-in (370 Lucide icons, categories, Recent) | SHIPPED | G3-028 | ✓ Represented |  |
| AS-33 | Stock browser drill-in (Unsplash/Pexels; orientation/colour/ | SHIPPED | G3-029 | ✓ Represented |  |
| AS-34 | Save stock result to library ("STOCK" badge) | SHIPPED | G3-029 | ✓ Represented |  |
| AS-35 | Confirm-delete modal (single · multi · > 20 type DELETE · Re | SHIPPED | G3-030 | ✓ Represented |  |
| AS-36 | Replace-result card (Replacing → complete / partial → Retry  | SHIPPED | G3-027 | ✓ Represented |  |
| AS-37 | Asset library shell (full page; Esc closes; ⌘/Ctrl+K focuses | SHIPPED | G3-032 | ✓ Represented |  |
| AS-38 | Library search + tag token ("Tag: menu · Clear filter ×") | SHIPPED | G3-033 | ✓ Represented |  |
| AS-39 | Import image from URL (+ Image imported / could not be impor | SHIPPED | G3-034 | ✓ Represented |  |
| AS-40 | Upload files modal → Upload complete | SHIPPED | G3-035 | ✓ Represented |  |
| AS-41 | Stock assets modal (Photos / Videos / Icons; Save to library | SHIPPED | G3-036 | ✓ Represented |  |
| AS-42 | Stock modal "Icons" tab (four demo icons) | STUB | G3-036 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| AS-43 | "Browse full icon library ↗" (Stock → Select Icon modal) | SHIPPED | G3-036 | ✓ Represented |  |
| AS-44 | Smart folders (Recent · In use · Unused) | SHIPPED | G3-037 | ✓ Represented |  |
| AS-45 | Folder tree + "＋ New folder" modal (duplicate → "Use Product | SHIPPED | G3-038 | ✓ Represented |  |
| AS-46 | Delete folder (row trash icon) | LIMITED | G3-039 | ✓ Represented | B1-12, B1-13 |
| AS-47 | Tag filter chips (rail) | SHIPPED | G3-040 | ✓ Represented |  |
| AS-48 | Trash row | STUB | G3-041 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| AS-49 | Drag asset/row onto a folder (move) | SHIPPED | G3-042 | ✓ Represented |  |
| AS-50 | Grid toolbar (count line · format chips · carried "img + vid | SHIPPED | G3-043 | ✓ Represented |  |
| AS-51 | Grid / List view + 2·3·4 columns | SHIPPED | G3-044 | ✓ Represented |  |
| AS-52 | Sort menu (Date added / Name / Size / Type; asc/desc) | SHIPPED | G3-045 | ✓ Represented |  |
| AS-53 | "Select files" mode + bulk bar (Move to folder… · Download · | SHIPPED | G3-046 | ✓ Represented |  |
| AS-54 | Bulk download → "Download prepared" | SHIPPED | G3-047 | ✓ Represented |  |
| AS-55 | File drag-over drop zone ("Drop files to upload" + accepted  | SHIPPED | G3-035 | ✓ Represented |  |
| AS-56 | Details rail (preview · meta line · Used in · multi-select / | SHIPPED | G3-048 | ✓ Represented |  |
| AS-57 | Details-rail alt text + ✨ Generate / Regenerate (server AI) | SHIPPED | G3-048 | ✓ Represented |  |
| AS-58 | Tags editor (rail) | SHIPPED | G3-049 | ✓ Planned for later |  |
| AS-59 | Versions (rail rows) → Asset versions modal | SHIPPED | G3-050 | ✓ Represented |  |
| AS-60 | Apply saved version across site (+ Applying → Saved version  | SHIPPED | G3-050 | ✓ Represented |  |
| AS-61 | Insert to canvas (rail primary) | SHIPPED | G3-051 | ✓ Represented |  |
| AS-62 | Rename modal (+ "A file with that name exists") | SHIPPED | G3-052 | ✓ Represented |  |
| AS-63 | Replace across site… (rail → replace picker of same-type can | SHIPPED | G3-053 | ✓ Represented |  |
| AS-64 | Optimize (rail → image editor on Optimise tab) | SHIPPED | G3-053 | ✓ Represented |  |
| AS-65 | Delete (rail; Replace instead) | SHIPPED | G3-053 | ✓ Represented |  |
| AS-66 | Manage font (rail, fonts) → Site fonts | SHIPPED | G3-054 | ✓ Represented |  |
| AS-67 | Status bar (count · quota · "⚠ N not on the server") | SHIPPED | G3-055 | ✓ Represented |  |
| AS-68 | Asset context menu (Insert · Select · Rename… · Edit image…  | SHIPPED | G3-056 | ✓ Represented |  |
| AS-69 | "Replace across pages…" context-menu item | UNREACHABLE | G3-057 | ✓ Hidden |  |
| AS-70 | Move assets modal (+ "Files could not be moved" → Retry) | SHIPPED | G3-058 | ✓ Represented |  |
| AS-71 | Site fonts modal (Add font / Added + Remove · Font added · N | SHIPPED | G3-054 | ✓ Represented |  |
| AS-72 | Image editor modal (Crop · Adjust · Resize · Optimise; Save  | SHIPPED | G3-059 | ✓ Represented |  |
| AS-73 | Image editor saved state (edits list · ‹ Back to editor · Do | SHIPPED | G3-050 | ✓ Represented |  |
| AS-74 | Image editor dialogs (Discard unsaved changes? · Version cou | SHIPPED | G3-059 | ✓ Represented |  |
| AS-75 | "Select Icon" modal (search · 17 categories · Recently used  | SHIPPED | G3-060 | ✓ Combined |  |
| AS-76 | "Choose an image" picker (Library · Upload · From URL; Use s | SHIPPED | G3-061 | ✓ Represented | EP-9 |
| AS-77 | Upload rules (accepted types · size limits · WebP conversion | SHIPPED | G3-062 | ✓ Internal |  |
| AS-78 | Audio upload (MP3/WAV/OGG/AAC ≤ 50 MB) | UNREACHABLE | G3-063 | ✓ Hidden |  |
| AS-79 | Demo font discovery list (Inter · Playfair Display · Fira Co | UNREACHABLE | G3-063 | ✓ Hidden |  |
| AS-80 | CMS drawer root (Collections band · Data band; loading / err | SHIPPED | G3-066 | ✓ Represented |  |
| AS-81 | "Create Collection" wizard (2 steps: name & type → fields) | SHIPPED | G3-067 | ✓ Represented |  |
| AS-82 | Wizard "Content type" select (Articles / Products / Team Mem | STUB | G3-067 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| AS-83 | Wizard "Generate a page per entry" (slug pattern · template  | SHIPPED | G3-067 | ✓ Represented |  |
| AS-84 | Collection view (records list · + Add · Fields › · Dynamic p | SHIPPED | G3-068 | ✓ Represented |  |
| AS-85 | Record add / edit (field controls · Published toggle · save  | SHIPPED | G3-069 | ✓ Represented |  |
| AS-86 | Delete record (confirm) | SHIPPED | G3-070 | ✓ Represented |  |
| AS-87 | Fields view (list · + Add field inline form · ⋯ Delete field | SHIPPED | G3-071 | ✓ Represented |  |
| AS-88 | Dynamic pages view (URL pattern · status/warning lines · sav | LIMITED | G3-072 | ✓ Represented |  |
| AS-89 | Sources view (list · "+ Connect a source" JSON paste · ⋯ Rem | LIMITED | G3-074 | ✓ Represented |  |
| AS-90 | Variables view (list · Edit value · Delete · + New variable) | LIMITED | G3-075 | ✓ Represented |  |
| AS-91 | Conditions view (list · + New condition → pick element → exp | SHIPPED | G3-076 | ✓ Represented |  |
| AS-92 | "Records" table modal (collection select · table · Publish/U | SHIPPED | G3-068 | ✓ Represented |  |
| AS-93 | Records-modal delete (trash button) | LIMITED | G3-069 | ✓ Represented |  |
| AS-94 | "Import JSON" (records foot) | STUB | G3-077 | ✓ Internal | EP-9 · STUB — no user door today (Q3 report-only) |
| AS-95 | Binding popover (Collections → Fields → Record) + "🔗 Bound" | LIMITED | G3-078 | ✓ Represented |  |
| AS-96 | CMS server sync (local-first mirror · hydration · retry queu | SHIPPED | G3-080 | ✓ Combined |  |
| AS-97 | Form block (Name · Email · Submit) | SHIPPED | G3-082 | ✓ Combined |  |
| AS-98 | Form settings section (ACTION store/webhook/email · WEBHOOK  | UNREACHABLE | G3-083 | ✓ Hidden |  |
| AS-99 | Forms inbox (Settings → Forms: form select · filter tabs · r | LIMITED | G3-084 | ✓ Represented |  |
| AS-100 | Submission actions (Mark spam / Not spam · Archive · Delete  | LIMITED | G3-085 | ✓ Represented |  |
| AS-101 | Form engine (validation messages · store / webhook / email r | UNREACHABLE | G3-086 | ✓ Combined |  |
| ST-01 | Settings shell (256px sidebar nav · pane header · footer sta | SHIPPED | G3-087 | ✓ Represented |  |
| ST-02 | Leave Settings (‹ Back to canvas · Cancel · Done · Esc) | SHIPPED | G3-088 | ✓ Represented |  |
| ST-03 | Save changes / Retry save (+ red save banner) | SHIPPED | G3-089 | ✓ Represented |  |
| ST-04 | Unsaved settings dialog (Keep editing · Discard and return t | SHIPPED | G3-090 | ✓ Represented |  |
| ST-05 | Settings saved dialog (Return to settings) | SHIPPED | G3-091 | ✓ Represented |  |
| ST-06 | Remembered last screen per site | SHIPPED | G3-092 | ✓ Internal |  |
| ST-07 | Plan lock (Pro pill on rows · Locked screen · Upgrade → Bill | SHIPPED | G3-093 | ✓ Planned for later |  |
| ST-08 | Doors that leave Settings (Fonts & colours → Brand panel · E | SHIPPED | G3-094 | ✓ Represented |  |
| ST-09 | Members / Billing external rows (new tab to dashboard) | SHIPPED | G3-095 | ✓ Represented | Members/Billing → URL exit (decision 32) |
| ST-10 | Overview screen (five group cards with live summaries) | SHIPPED | G3-096 | ✓ Represented |  |
| ST-11 | "Needs attention" block (items with Open ›) | SHIPPED | G3-096 | ✓ Represented |  |
| ST-12 | Search settings modal (sections + fields; jump & focus) | SHIPPED | G3-097 | ✓ Represented |  |
| ST-13 | General screen (Site identity · Social links · Canvas grid) | SHIPPED | G3-098 | ✓ Represented |  |
| ST-14 | Localization screen (Default locale · Auto-redirect · Locale | SHIPPED | G3-099 | ✓ Represented |  |
| ST-15 | Add locale dialog (language select · read-only code · set as | SHIPPED | G3-099 | ✓ Represented |  |
| ST-16 | Translation checklist dialog | SHIPPED | G3-099 | ✓ Represented |  |
| ST-17 | SEO defaults screen (Site SEO fields · Allow search indexing | SHIPPED | G3-101 | ✓ Represented |  |
| ST-18 | Domains screen (per-domain cards · status pill · Force HTTPS | SHIPPED | G3-102 | ✓ Represented |  |
| ST-19 | Add a domain dialog (availability check · type · DNS provide | SHIPPED | G3-102 | ✓ Represented |  |
| ST-20 | Remove domain dialog | SHIPPED | G3-102 | ✓ Represented |  |
| ST-21 | Redirects screen (rules table · Edit) | SHIPPED | G3-103 | ✓ Represented |  |
| ST-22 | Add / Edit redirect dialog (paths · 301/302 · match query ·  | SHIPPED | G3-103 | ✓ Represented |  |
| ST-23 | 404 suggester (toggle saved by footer · suggestion rows · Ac | SHIPPED | G3-104 | ✓ Planned for later |  |
| ST-24 | URL repair draft (arrive from Pages after a slug change → Sa | SHIPPED | G3-105 | ✓ Represented |  |
| ST-25 | Analytics screen (GA4 · GTM · Meta Pixel · Clarity ids + tog | SHIPPED | G3-106 | ✓ Represented |  |
| ST-26 | GA "Verify" → Connection verified dialog | SHIPPED | G3-107 | ✓ Planned for later |  |
| ST-27 | Cookie Consent toggle | LIMITED | G3-108 | ✓ Hidden |  |
| ST-28 | Forms screen ("Visitors / Forms") | DUPLICATE | G3-084 | ✓ Combined | DUPLICATE (Q3) — same job traced through its twin |
| ST-29 | Custom code screen (Head scripts · Body scripts · Global CSS | SHIPPED | G3-109 | ✓ Represented |  |
| ST-30 | Headers screen (CSP · X-Frame-Options · Referrer-Policy · HS | SHIPPED | G3-110 | ✓ Represented |  |
| ST-31 | Integrations screen (six link-out rows · COMING SOON badge · | STUB | G3-111 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| ST-32 | Webhooks screen (Connect endpoint · events · signing secret  | SHIPPED | G3-112 | ✓ Represented |  |
| ST-33 | Settings deep links (site menu Site settings · "Plugins" → I | SHIPPED | G3-087 | ✓ Represented |  |
| ST-34 | Publish panel (ENVIRONMENT · SINCE LAST DEPLOY · LAST DEPLOY | FLAGGED-VIABLE | G1-042 | ✓ Represented | copy edit 4418:99386 (decision 7) |
| ST-35 | "Publish to production" CTA (flag-gated; opens wizard) | FLAGGED-VIABLE | G1-043 | ✓ Represented | B3-10 + 4418:97118 Panel footer |
| ST-36 | Flag-off state ("Connect Vercel to publish." + "Connect Verc | LIMITED | G1-042 | ✓ Represented | copy edit 4418:99386 (decision 7) |
| ST-37 | Publish wizard step 1 — Pre-Publish Checklist (six server ch | FLAGGED-VIABLE | G1-044 | ✓ Represented | Favicon check hidden (decision 13) |
| ST-38 | Check-row fixes ("Fix ›" → Pages / Settings tab · "Connect"  | FLAGGED-VIABLE | G1-044 | ✓ Represented | Favicon check hidden (decision 13) |
| ST-39 | Publish wizard step 2 — Confirm (Target · Pages · Client app | FLAGGED-VIABLE | G1-043 | ✓ Represented | B3-10 + 4418:97118 Panel footer |
| ST-40 | Wizard "Options" step (environment · note · scheduler) | STUB | G1-050 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| ST-41 | Publishing progress block (step name · step N of 4 · started | FLAGGED-VIABLE | G1-047 | ✓ Represented |  |
| ST-42 | Just-published state (Published to production · vN · live ·  | FLAGGED-VIABLE | G1-048 | ✓ Represented |  |
| ST-43 | Publish-failed state (Publish failed · message · Try again · | FLAGGED-VIABLE | G1-049 | ✓ Represented |  |
| ST-44 | Deploy service unreachable state (Couldn't reach the deploy  | FLAGGED-VIABLE | G1-042 | ✓ Represented | copy edit 4418:99386 (decision 7) |
| ST-45 | Unpublish site (red button · confirm · toasts) | SHIPPED | G1-051 | ✓ Represented |  |
| ST-46 | Publish history list (versions · completed time · rollbackab | DUPLICATE | G1-052 | ✓ Combined | 4418:73440 gate dropped (decision 8) |
| ST-47 | Rollback to a prior version | DUPLICATE | G1-052 | ✓ Combined | 4418:73440 gate dropped (decision 8) |
| ST-48 | Publish diff (page-by-page added / removed / changed / same  | DUPLICATE | G1-052 | ✓ Combined | 4418:73440 gate dropped (decision 8) |
| ST-49 | Cancel an in-flight publish | UNREACHABLE | G1-047 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| ST-50 | Custom domain for the live site | DUPLICATE | G1-053 | ✓ Combined |  |
| ST-51 | Legal line (Privacy policy · Terms of service links) | SHIPPED | G1-042 | ✓ Represented | copy edit 4418:99386 (decision 7) |
| ST-52 | Topbar publish button + publish confirm modal | DUPLICATE | G1-043 | ✓ Combined | B3-10 + 4418:97118 Panel footer |
| ST-53 | Review panel frame + states (loading · load error · never se | SHIPPED | G1-054 | ✓ Represented | B3-05 |
| ST-54 | Send for review popover (Client email · What changed? · Note | SHIPPED | G1-031 | ✓ Represented | B3-02, B3-03, B3-04 + 4418:121372 Re-send |
| ST-55 | Review link generation (`/review/<token>`) + invite email | SHIPPED | G1-031 | ✓ Represented | B3-02, B3-03, B3-04 + 4418:121372 Re-send |
| ST-56 | Copy review link | LIMITED | G1-031 | ✓ Represented | B3-02, B3-03, B3-04 + 4418:121372 Re-send |
| ST-57 | "Review sent" modal (shell) | DUPLICATE | G1-031 | ✓ Combined | B3-02, B3-03, B3-04 + 4418:121372 Re-send |
| ST-58 | Re-send for review (+ "Re-send anyway?" inline confirm with  | SHIPPED | G1-058 | ✓ Represented |  |
| ST-59 | Revoke link / Withdraw request (inline confirm at top of pan | SHIPPED | G1-059 | ✓ Represented |  |
| ST-60 | Round history strip ("Round 2 of 3 ▸" → previous rounds list | SHIPPED | G1-060 | ✓ Represented |  |
| ST-61 | Viewer opens the review link (read-only site + comment mode) | SHIPPED | G1-063 | ✓ Represented |  |
| ST-62 | Viewer approves | SHIPPED | G1-064 | ✓ Represented |  |
| ST-63 | Viewer rejects / requests changes | SHIPPED | G1-065 | ✓ Represented |  |
| ST-64 | Viewer comments (pins on canvas + rows in panel) | SHIPPED | G1-066 | ✓ Represented | C-03 7593:193511 (owner decision 4) |
| ST-65 | Comment thread list (Open groups per page with counts · Reso | SHIPPED | G1-055 | ✓ Represented |  |
| ST-66 | Reply composer ("Reply to the client…" internal note; Send) | SHIPPED | G1-056 | ✓ Represented |  |
| ST-67 | Resolve / Reopen a comment | SHIPPED | G1-057 | ✓ Represented | EP-4 |
| ST-68 | Detached group (element deleted) + Reattach (pick on canvas) | SHIPPED | G1-037 | ✓ Represented | B2-04 + 4418:116906 Reattach |
| ST-69 | Comment filter | LIMITED | G1-055 | ✓ Represented |  |
| ST-70 | Progress block (green track · "resolved of total") + sent me | SHIPPED | G1-055 | ✓ Represented |  |
| ST-71 | Compare with approved (list in drawer · split / overlay at 1 | SHIPPED | G1-061 | ✓ Combined |  |
| ST-72 | Approval lock gating publish (send-for-review move · waiting | SHIPPED | G1-045 | ✓ Represented | B1-09 + 4th gate route on 523 shells + reviewChangesRequested (decision 1) |
| ST-73 | Viewer-role gating (Viewers can't send for review — ask an e | SHIPPED | G1-062 | ✓ Represented | B2-07 + AN-04 |
| ST-74 | Review notifications (bell: actor · message · action link ·  | SHIPPED | G1-033 | ✓ Represented | B3-09 + EP-3 |
| ST-75 | Topbar review bar (status pill · Send for review · Compare) | DUPLICATE | G1-029 | ✓ Combined | folded into chip + panel (OD-7, owner-confirmed 2026-09-21) |
| ST-76 | Export modal (HTML · ZIP · React formats; title/description  | SHIPPED | G3-113 | ✓ Represented | export copy (decision 30) |
| ST-77 | "Vue" · "Next.js" format pills with "Soon" tag | STUB | G3-113 | ✓ Internal | export copy (decision 30) · STUB — no user door today (Q3 report-only) |
| ST-78 | Preview tab (Desktop 1440 · Tablet 768 · Mobile 375 frames) | SHIPPED | G3-113 | ✓ Represented | export copy (decision 30) |
| ST-79 | Code tab (HTML / CSS sub-tabs · line count · Copy) | SHIPPED | G3-113 | ✓ Represented | export copy (decision 30) |
| ST-80 | Options tab (Page Title · CSS Style · Minify / reset / meta  | SHIPPED | G3-113 | ✓ Represented | export copy (decision 30) |
| ST-81 | Downloads (index.html · Download CSS · Download All · <title | SHIPPED | G3-113 | ✓ Represented | export copy (decision 30) |
| ST-82 | Export doors (topbar Export button · Settings → Export row) | SHIPPED | G3-094 | ✓ Represented |  |
| ST-83 | Exported / published page contents (SEO head · JSON-LD · fon | SHIPPED | G3-114 | ✓ Internal |  |
| ST-84 | "Set Up Products Collection" modal (Include sample products  | SHIPPED | G3-115 | ✓ Represented |  |
| ST-85 | Cart & checkout on the published site (Stripe runtime) | UNREACHABLE | G3-116 | ✓ Hidden |  |
| ST-86 | Animation section (status strip · Enable / Disable · Generat | SHIPPED | G3-117 | ✓ Combined |  |
| ST-87 | Animation editor (Entrance / Attention / Exit presets · Dura | SHIPPED | G3-117 | ✓ Combined |  |
| ST-88 | ▶️ Preview Animation | SHIPPED | G3-117 | ✓ Combined |  |
| ST-89 | Interactions runtime on published pages (triggers · 39 prese | SHIPPED | G3-118 | ✓ Internal |  |
| ST-90 | Email-marketing integration (Mailchimp / SendGrid / Mailgun  | STUB | G3-111 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| ST-91 | Form submission + email notifications engine | DUPLICATE | G3-086 | ✓ Combined |  |
| ST-92 | Autosave (5 s debounce to browser; cloud mirror on the same  | SHIPPED | G1-005 | ✓ Represented | B1-07 |
| ST-93 | Cloud save refusals (project never finished loading · site g | SHIPPED | G1-084 | ✓ Represented |  |
| ST-94 | Save-conflict dialog (Reload latest · Save backup then reloa | SHIPPED | G1-080 | ✓ Represented | B1-01, B1-02 |
| ST-95 | Settings-mirror refused (page saved, a setting rejected → se | SHIPPED | G1-084 | ✓ Represented |  |
| ST-96 | Offline state (chip "Offline — changes not saved" · risky-ex | SHIPPED | G1-083 | ✓ Represented | B1-07 |
| ST-97 | Unsaved-work recovery ("Some work never reached the server"  | SHIPPED | G1-076 | ✓ Represented | B1-03 |
| ST-98 | Crash recovery banner ("Recovered your work" · Keep changes  | SHIPPED | G1-077 | ✓ Represented | B1-04 |
| ST-99 | Silent re-validate (tab visible again / caught error → recre | SHIPPED | G1-077 | ✓ Represented | B1-04 |
| ST-100 | Mirror retry queues + "not on the server" toast with Retry n | SHIPPED | G1-082 | ✓ Represented | B1-03 |
| ST-101 | Exit guard counts pending mirrors before leaving | SHIPPED | G1-003 | ✓ Represented | B1-08 |
| ST-102 | Version history storage (50 kept · auto-saves prune oldest · | DUPLICATE | G1-068 | ✓ Combined | DUPLICATE (Q3) — same job traced through its twin |
| ST-103 | Versions export / import as JSON (`versions-<site>-<time>.js | UNREACHABLE | G1-072 | ✓ Deprecated |  |
| ST-104 | Migration notices (started / complete / failed / skipped → p | SHIPPED | G1-085 | ✓ Planned for later |  |
| ST-105 | Session expired modal (Sign in opens a new tab) | DUPLICATE | G1-079 | ✓ Combined | DUPLICATE (Q3) — same job traced through its twin |
| ST-106 | Load error banner (auth · network · missing · forbidden) | DUPLICATE | G1-078 | ✓ Combined | B1-05, B1-06 |
| ST-107 | Roles (VIEWER / EDITOR / DESIGNER / ADMIN / OWNER; denied co | SHIPPED | G1-062 | ✓ Represented | B2-07 + AN-04 |
| ST-108 | AI alt text auto-request on upload (never overwrites user te | SHIPPED | G1-117 | ✓ Represented |  |
| ST-109 | Asset versions (list / create / restore) | DUPLICATE | G1-117 | ✓ Combined | DUPLICATE (Q3) — same job traced through its twin |
| ST-110 | `FEATURE_PUBLISH` flag | FLAGGED-VIABLE | G1-103 | ✓ Represented |  |
| ST-111 | `FEATURE_DS_AI` flag | FLAGGED-VIABLE | G3-119 | ✓ Represented |  |
| ST-112 | `FEATURE_COLLAB` flag | FLAGGED-VIABLE | G1-103 | ✓ Represented |  |
| ST-113 | Dev-build behaviours (console warnings · demo presence · dev | UNREACHABLE | G1-103 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| ST-114 | Legacy static flags (`AI_ASSISTANT`, `TEMPLATES`, `CUSTOM_CO | UNREACHABLE | G1-103 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| ST-115 | Plan gates (Custom code · Integrations require Pro; Locked s | SHIPPED | G3-093 | ✓ Planned for later |  |
| ST-116 | Role gates (domain · webhooks · unpublish require Admin; sen | DUPLICATE | G1-062 | ✓ Combined | B2-07 + AN-04 |
| IN-01 | Inspector panel frame | SHIPPED | G2-137 | ✓ Planned for later |  |
| IN-02 | Empty state | SHIPPED | G2-138 | ✓ Represented |  |
| IN-03 | Loading skeleton | SHIPPED | G2-138 | ✓ Represented |  |
| IN-04 | Template-just-applied state | SHIPPED | G2-138 | ✓ Represented |  |
| IN-05 | Section error state | SHIPPED | G2-138 | ✓ Represented |  |
| IN-06 | AI-run takeover | SHIPPED | G2-138 | ✓ Represented |  |
| IN-07 | Whole-site takeover | SHIPPED | G2-138 | ✓ Represented |  |
| IN-08 | Header: element icon + name | LIMITED | G2-139 | ✓ Represented |  |
| IN-09 | Pick element on canvas | SHIPPED | G2-139 | ✓ Represented |  |
| IN-10 | Select parent | SHIPPED | G2-139 | ✓ Represented |  |
| IN-11 | "✦ AI" header chip | SHIPPED | G2-139 | ✓ Represented |  |
| IN-12 | Bind to collection field (popover) | SHIPPED | G2-144 | ✓ Planned for later |  |
| IN-13 | "Bound" header chip | SHIPPED | G2-144 | ✓ Planned for later |  |
| IN-14 | Element actions menu (⋯) | SHIPPED | G2-139 | ✓ Represented |  |
| IN-15 | Delete confirmation modal | SHIPPED | G2-139 | ✓ Represented |  |
| IN-16 | Multi-select: Align | SHIPPED | G2-140 | ✓ Represented |  |
| IN-17 | Multi-select: Distribute | SHIPPED | G2-140 | ✓ Represented |  |
| IN-18 | Multi-select: batch style panel | SHIPPED | G2-140 | ✓ Represented |  |
| IN-19 | Scope pill (This / All like this / Whole site) | SHIPPED | G2-141 | ✓ Represented |  |
| IN-20 | Reach banner | SHIPPED | G2-141 | ✓ Represented |  |
| IN-21 | Breakpoint pill | SHIPPED | G2-142 | ✓ Combined |  |
| IN-22 | State pill | LIMITED | G2-143 | ✓ Represented |  |
| IN-23 | State banner | SHIPPED | G2-143 | ✓ Represented |  |
| IN-24 | Detach instance | SHIPPED | G2-125 | ✓ Represented | EP-11 |
| IN-25 | Binding banner (Unbind) | SHIPPED | G2-144 | ✓ Planned for later |  |
| IN-26 | Component instance / Variant band | SHIPPED | G2-125 | ✓ Represented | EP-11 |
| IN-27 | Breakpoint override rows (Revert to base) | SHIPPED | G2-142 | ✓ Combined |  |
| IN-28 | Media source row | SHIPPED | G2-145 | ✓ Combined |  |
| IN-29 | Section shell (collapsible + preview pill) | SHIPPED | G2-146 | ✓ Represented |  |
| IN-30 | Section open / closed memory | SHIPPED | G2-146 | ✓ Represented |  |
| IN-31 | Expand all / collapse all | UNREACHABLE | G2-146 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| IN-32 | Footer "N of M sections apply" | SHIPPED | G2-146 | ✓ Represented |  |
| IN-33 | Simplified density + "Show all controls" | UNREACHABLE | G2-137 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| IN-34 | "More settings" disclosure | SHIPPED | G2-146 | ✓ Represented |  |
| IN-35 | Standard property row (override dot, (i) helper, mixed dot,  | SHIPPED | G2-146 | ✓ Represented |  |
| IN-36 | Section order per element type | SHIPPED | G2-137 | ✓ Planned for later |  |
| IN-37 | Layout: Display | SHIPPED | G2-147 | ✓ Represented | Fill/Hug items hidden (decision 27) |
| IN-38 | Layout: Position + offsets + z-index | SHIPPED | G2-147 | ✓ Represented | Fill/Hug items hidden (decision 27) |
| IN-39 | Layout: Overflow / box-sizing / Visibility / Float / Clear | SHIPPED | G2-147 | ✓ Represented | Fill/Hug items hidden (decision 27) |
| IN-40 | Flexbox: Enable Flex prompt | SHIPPED | G2-148 | ✓ Combined |  |
| IN-41 | Flexbox container controls | SHIPPED | G2-148 | ✓ Combined |  |
| IN-42 | Flexbox: linked gap control | SHIPPED | G2-148 | ✓ Combined |  |
| IN-43 | Flex item controls | SHIPPED | G2-148 | ✓ Combined |  |
| IN-44 | Grid container controls | SHIPPED | G2-149 | ✓ Represented |  |
| IN-45 | Grid item controls | SHIPPED | G2-149 | ✓ Represented |  |
| IN-46 | Size: Width / Height (Fixed / Fill / Hug) | SHIPPED | G2-150 | ✓ Represented |  |
| IN-47 | Size: min / max width & height | SHIPPED | G2-150 | ✓ Represented |  |
| IN-48 | Size: Object fit | SHIPPED | G2-150 | ✓ Represented |  |
| IN-49 | Chain button → spacing / type token | SHIPPED | G2-150 | ✓ Represented |  |
| IN-50 | Spacing: padding / gap / margin pair rows | SHIPPED | G2-151 | ✓ Represented |  |
| IN-51 | Spacing: link toggles + nested box editor | SHIPPED | G2-151 | ✓ Represented |  |
| IN-52 | Spacing: row gap / column gap | SHIPPED | G2-151 | ✓ Represented |  |
| IN-53 | Typography: Family row + font picker panel | SHIPPED | G2-152 | ✓ Represented |  |
| IN-54 | Typography: Size / Line height pair | SHIPPED | G2-152 | ✓ Represented |  |
| IN-55 | Typography: Weight / Align / Color / Transform / Decoration  | SHIPPED | G2-152 | ✓ Represented |  |
| IN-56 | Typography: more settings | SHIPPED | G2-152 | ✓ Represented |  |
| IN-57 | "Manage site fonts" (picker foot) | SHIPPED | G2-152 | ✓ Represented |  |
| IN-58 | Background: Color / Gradient / Image mode + Fill | SHIPPED | G2-153 | ✓ Planned for later |  |
| IN-59 | Background: gradient editor | LIMITED | G2-153 | ✓ Planned for later |  |
| IN-60 | Background: image URL + Browse + header "+" | SHIPPED | G2-153 | ✓ Planned for later |  |
| IN-61 | Background image: size / position / repeat / attachment / bl | SHIPPED | G2-153 | ✓ Planned for later |  |
| IN-62 | Border: width / style / color | SHIPPED | G2-154 | ✓ Combined |  |
| IN-63 | Border: individual sides + outline | SHIPPED | G2-154 | ✓ Combined |  |
| IN-64 | Schema-driven Border section | UNREACHABLE | G2-154 | ✓ Combined |  |
| IN-65 | Corner radius (linked / per corner) | SHIPPED | G2-154 | ✓ Combined |  |
| IN-66 | Effects: Opacity | SHIPPED | G2-155 | ✓ Hidden |  |
| IN-67 | Effects: Box shadow + Inner shadow | SHIPPED | G2-155 | ✓ Hidden |  |
| IN-68 | Effects: Transform | SHIPPED | G2-155 | ✓ Hidden |  |
| IN-69 | Effects: Transition | SHIPPED | G2-155 | ✓ Hidden |  |
| IN-70 | Effects: Filters | SHIPPED | G2-155 | ✓ Hidden |  |
| IN-71 | Effects: Cursor / Blend mode / Text shadow / Will change | SHIPPED | G2-155 | ✓ Hidden |  |
| IN-72 | Link section | SHIPPED | G2-156 | ✓ Combined |  |
| IN-73 | Interactions: add (trigger picker) | SHIPPED | G2-157 | ✓ Combined |  |
| IN-74 | Interactions: edit item | LIMITED | G2-157 | ✓ Combined |  |
| IN-75 | Animation section | SHIPPED | G2-157 | ✓ Combined |  |
| IN-76 | Visibility per breakpoint | SHIPPED | G2-008 | ✓ Represented |  |
| IN-77 | Element Properties: generic fields + field renderer | SHIPPED | G2-158 | ✓ Represented |  |
| IN-78 | Settings form: Link | SHIPPED | G2-156 | ✓ Combined |  |
| IN-79 | Settings form: Button | SHIPPED | G2-156 | ✓ Combined |  |
| IN-80 | Settings form: Image | SHIPPED | G2-145 | ✓ Combined |  |
| IN-81 | Settings form: Heading | SHIPPED | G2-158 | ✓ Represented |  |
| IN-82 | Settings form: Text / Paragraph / Label content | SHIPPED | G2-158 | ✓ Represented |  |
| IN-83 | Settings form: Video | SHIPPED | G2-145 | ✓ Combined |  |
| IN-84 | Settings form: Input | SHIPPED | G2-158 | ✓ Represented |  |
| IN-85 | Settings form: Textarea | SHIPPED | G2-158 | ✓ Represented |  |
| IN-86 | Settings form: Select | SHIPPED | G2-158 | ✓ Represented |  |
| IN-87 | Settings form: Form | SHIPPED | G2-158 | ✓ Represented |  |
| IN-88 | Settings form: Iframe / Embed | SHIPPED | G2-158 | ✓ Represented |  |
| IN-89 | Settings form: Columns | SHIPPED | G2-158 | ✓ Represented |  |
| IN-90 | Settings form: Icon | SHIPPED | G2-158 | ✓ Represented |  |
| IN-91 | Form field name warning | SHIPPED | G2-158 | ✓ Represented |  |
| IN-92 | Custom data-* / aria-* attributes | SHIPPED | G2-158 | ✓ Represented |  |
| IN-93 | Per-type settings for navbar / slider / accordion / tabs / m | UNREACHABLE | G2-159 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| IN-94 | CSS classes section | SHIPPED | G2-160 | ✓ Represented |  |
| IN-95 | All CSS section | UNREACHABLE | G2-160 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| IN-96 | Number-with-unit field | LIMITED | G2-161 | ✓ Represented |  |
| IN-97 | Colour row (swatch, hex, bound / unlink / relink) | SHIPPED | G3-156 | ✓ Represented | purple swatch hidden (decision 34) |
| IN-98 | Colour row eye toggle | STUB | G3-156 | ✓ Internal | purple swatch hidden (decision 34) · STUB — no user door today (Q3 report-only) |
| IN-99 | Token picker popover — Tokens tab | SHIPPED | G3-155 | ✓ Represented |  |
| IN-100 | Token picker popover — Custom tab | SHIPPED | G3-140 | ✓ Represented | EP-10 |
| IN-101 | Eyedropper | STUB | G3-155 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| IN-102 | Token picker Brand / Recent quick rows | STUB | G3-155 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| IN-103 | Design-system binding chip (green "token") | LIMITED | G3-156 | ✓ Represented | purple swatch hidden (decision 34) |
| IN-104 | Off-DS amber chip + "Bind to token" (Beginner) / blue preset | UNREACHABLE | G3-156 | ✓ Internal | purple swatch hidden (decision 34) · UNREACHABLE — no user door today (Q3 report-only) |
| IN-105 | Breakpoint / state cascade + one-undo-step writes | SHIPPED | G2-166 | ✓ Internal |  |
| IN-106 | Disabled-reason strings | SHIPPED | G2-146 | ✓ Represented |  |
| IN-107 | Colour mode in inspector (Light / Dark toggle, per-mode valu | STUB | G3-157 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| IN-108 | Beginner / Pro effect in inspector | LIMITED | G3-122 | ✓ Represented |  |
| IN-109 | Global style presets (Primary Button, Heading 1, …) | UNREACHABLE | G3-142 | ✓ Hidden |  |
| IN-110 | Shared control set (selects, segmented, sliders, switches, p | SHIPPED | G2-161 | ✓ Represented |  |
| BR-01 | Reaching the Brand panel | SHIPPED | G3-120 | ✓ Represented |  |
| BR-02 | Panel header (title, Expand 320↔700, Help, Close) | SHIPPED | G3-121 | ✓ Represented |  |
| BR-03 | Status chip (All saved / Draft) | SHIPPED | G3-121 | ✓ Represented |  |
| BR-04 | Beginner / Pro display mode | SHIPPED | G3-122 | ✓ Represented |  |
| BR-05 | Back row ("‹ Tokens · color") | SHIPPED | G3-121 | ✓ Represented |  |
| BR-06 | Status pill band (Draft preset / Exported X / Imported token | SHIPPED | G3-123 | ✓ Represented |  |
| BR-07 | Footer save bar (Discard / Save) | SHIPPED | G3-124 | ✓ Represented |  |
| BR-08 | Discard with Undo toast | SHIPPED | G3-125 | ✓ Represented |  |
| BR-09 | Panel error state | SHIPPED | G3-126 | ✓ Represented |  |
| BR-10 | Cross-window / canvas-undo toasts | SHIPPED | G3-127 | ✓ Internal |  |
| BR-11 | Staged edits persist across navigation; topbar "Saved" aware | SHIPPED | G3-127 | ✓ Internal |  |
| BR-12 | Brand root: preview band | SHIPPED | G3-128 | ✓ Represented |  |
| BR-13 | Brand root: nine destination rows | SHIPPED | G3-128 | ✓ Represented |  |
| BR-14 | Beginner footnote | SHIPPED | G3-128 | ✓ Represented |  |
| BR-15 | Tokens first-run banner | SHIPPED | G3-129 | ✓ Hidden |  |
| BR-16 | Token kind list (14 kinds) | SHIPPED | G3-130 | ✓ Represented | W-7 |
| BR-17 | Beginner "More / Fewer token kinds" fold + note | SHIPPED | G3-130 | ✓ Represented | W-7 |
| BR-18 | Shared token row | SHIPPED | G3-131 | ✓ Represented |  |
| BR-19 | Colour kind: search + All / Issues filter | SHIPPED | G3-132 | ✓ Represented |  |
| BR-20 | Colour kind: "missing dark variant" chip | SHIPPED | G3-146 | ✓ Represented | EP-10 |
| BR-21 | Colour kind: Issues banner + Fix all + per-token Fix | SHIPPED | G3-132 | ✓ Represented |  |
| BR-22 | Colour kind: groups + empty states | SHIPPED | G3-133 | ✓ Hidden |  |
| BR-23 | "+ Add token" → Add color token modal | SHIPPED | G3-134 | ✓ Represented |  |
| BR-24 | Typography kind: Desktop / Mobile preview toggle + band | SHIPPED | G3-135 | ✓ Represented |  |
| BR-25 | Typography kind: Fonts rows (family dropdown) | SHIPPED | G3-135 | ✓ Represented |  |
| BR-26 | Typography kind: Text Sizes rows | SHIPPED | G3-135 | ✓ Represented |  |
| BR-27 | Spacing kind: presets + Reset defaults | SHIPPED | G3-130 | ✓ Represented | W-7 |
| BR-28 | Spacing kind: value chips + inline edit drawer | SHIPPED | G3-130 | ✓ Represented | W-7 |
| BR-29 | Other kinds (Radius … Imagery) generic list | SHIPPED | G3-130 | ✓ Represented | W-7 |
| BR-30 | Token detail: header + Light value + Dark value | SHIPPED | G3-136 | ✓ Represented |  |
| BR-31 | Token detail: "Used by" list → select element | SHIPPED | G3-136 | ✓ Represented |  |
| BR-32 | Token detail: "Aliased by" | SHIPPED | G3-136 | ✓ Represented |  |
| BR-33 | Token detail: Lint row + Ignore | SHIPPED | G3-136 | ✓ Represented |  |
| BR-34 | Token detail: Auto-fix | STUB | G3-136 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| BR-35 | Token detail: "Replace value" → inline colour picker | SHIPPED | G3-136 | ✓ Represented |  |
| BR-36 | Token detail: Rename ID | LIMITED | G3-137 | ✓ Represented |  |
| BR-37 | Token detail: Delete token (+ Replace token modal) | LIMITED | G3-138 | ✓ Represented | token-lock copy (decision 31) |
| BR-38 | Beginner "Delete blocked" notice | SHIPPED | G3-136 | ✓ Represented |  |
| BR-39 | Inline colour picker (canvas, hue, alpha, hex, contrast badg | LIMITED | G3-140 | ✓ Represented | EP-10 |
| BR-40 | Font family picker (token detail) | SHIPPED | G3-135 | ✓ Represented |  |
| BR-41 | Presets list (11 categories) | SHIPPED | G3-141 | ✓ Represented |  |
| BR-42 | Preset detail (variant tabs, preview chips, binding rows) | LIMITED | G3-141 | ✓ Represented |  |
| BR-43 | Preset binding editor row (token button + × delete + inline  | UNREACHABLE | G3-141 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| BR-44 | Starters grid (6 cards) | SHIPPED | G3-143 | ✓ Represented |  |
| BR-45 | Starter description line + first-run starter gallery modal | UNREACHABLE | G3-143 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| BR-46 | Classes destination | SHIPPED | G3-144 | ✓ Represented |  |
| BR-47 | Component styles: catalog list + saved components | LIMITED | G3-145 | ✓ Represented |  |
| BR-48 | "✨ Generate with AI" + Generate component modal | FLAGGED-VIABLE | G3-119 | ✓ Represented |  |
| BR-49 | AI modal "Accept" (keep the schema) | UNREACHABLE | G3-119 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| BR-50 | Typography destination (ACTIVE FONTS) | LIMITED | G3-135 | ✓ Represented |  |
| BR-51 | Colour mode: Light / Dark switch | SHIPPED | G3-146 | ✓ Represented | EP-10 |
| BR-52 | Colour mode: "NO DARK VALUE" list + Set | SHIPPED | G3-146 | ✓ Represented | EP-10 |
| BR-53 | Lint destination | SHIPPED | G3-147 | ✓ Represented |  |
| BR-54 | Lint rules (8) + Issues chip feed | LIMITED | G3-147 | ✓ Represented |  |
| BR-55 | Legacy lint banner ("N DS errors · M warnings", Review all / | UNREACHABLE | G3-147 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| BR-56 | Import / export: Dark strategy dropdown | SHIPPED | G3-148 | ✓ Represented |  |
| BR-57 | Export CSS / JSON / Tailwind (Copy + Download) | SHIPPED | G3-148 | ✓ Represented |  |
| BR-58 | Export Figma Variables JSON | STUB | G3-149 | ✓ Internal | STUB — no user door today (Q3 report-only) |
| BR-59 | Export stats line, Tailwind warning, Preview card | SHIPPED | G3-148 | ✓ Represented |  |
| BR-60 | Import: drop zone / file browse / paste JSON / Parse | LIMITED | G3-148 | ✓ Represented |  |
| BR-61 | Import: conflicts (Replace / Merge · keep mine) + Apply | SHIPPED | G3-148 | ✓ Represented |  |
| BR-62 | Legacy Export dropdown (CSS / Tailwind / JSON + unsaved warn | UNREACHABLE | G3-148 | ✓ Internal | UNREACHABLE — no user door today (Q3 report-only) |
| BR-63 | Review changes modal | LIMITED | G3-124 | ✓ Represented |  |
| BR-64 | Apply (persist tokens + presets, toasts, onboarding step) | SHIPPED | G3-124 | ✓ Represented |  |
| BR-65 | Live canvas preview of staged tokens | SHIPPED | G3-151 | ✓ Represented |  |
| BR-66 | Per-token undo / redo | LIMITED | G3-152 | ✓ Hidden |  |
| BR-67 | Browser cache of brand data per project | SHIPPED | G3-127 | ✓ Internal |  |
| BR-68 | Project migration modal (running) | SHIPPED | G3-153 | ✓ Represented | B1-14, B1-15 |
| BR-69 | Migration failed: "Restore snapshot" / "Retry vN" | STUB | G3-153 | ✓ Internal | B1-14, B1-15 · STUB — no user door today (Q3 report-only) |
| BR-70 | Silent token-schema migration v1→v5 | SHIPPED | G3-153 | ✓ Represented | B1-14, B1-15 |
| BR-71 | Legacy canvas-overlay tokens (kit §B15) | DUPLICATE | G3-154 | ✓ Deprecated |  |

## Figma → Code (1140 boards)

| Board | Name | Phase-19 status | Rows / note |
|---|---|---|---|
| 4418:47406 | S·Issues · filtered | △ Partial | G1-088 D |
| 4418:47609 | S·Issues · empty | △ Partial | G1-088 D |
| 4418:47806 | S·CMS · data · no-source (Sources) | ✗ Dummy | G3-074 D · C (Sheets: NOT IMPLEMENT |
| 4418:48214 | SS·Specification screens · every designed state | △ Partial | G1-027 B · G1-077 B · G1-120 — (scaffold) |
| 4418:52983 | CD·Full-screen Templates · Load error | ✗ Dummy | G2-094 E / F |
| 4418:53202 | CD·Full-screen Templates · Restaurant — one page preview | △ Partial | G2-096 E (code) · D |
| 4418:53239 | CD·Templates · applying · Restaurant | ✓ Code | G1-112 A (internal) · G2-099 A |
| 4418:53577 | CD·Full-screen Templates · Bistro Landing preview | △ Partial | G2-096 E (code) · D |
| 4418:54134 | CD·Full-screen Templates · Catalogue | △ Partial | G2-090 E (Figma-side stale entry) · G2-093 D (location) · G2-095 B · G2-097 B · G2-102 B |
| 4418:54297 | CD·Editor · Restaurant / created from page template | ✓ Code | G1-118 A (cross-ref) · G2-101 A |
| 4418:54536 | CD·Editor · Menu 2 / created from page template | ✓ Code | G1-118 A (cross-ref) · G2-101 A |
| 4418:54775 | CD·Editor · Landing / created from page template | ✓ Code | G1-118 A (cross-ref) · G2-101 A |
| 4418:55014 | CD·Editor · Home / Restaurant template applied | ✓ Code | G1-118 A (cross-ref) · G2-099 A |
| 4418:55249 | CD·Editor · Home / Bistro Menu applied | ✓ Code | G1-118 A (cross-ref) · G2-099 A |
| 4418:55484 | CD·Editor · Home / Bistro Landing applied | ✓ Code | G1-118 A (cross-ref) · G2-099 A |
| 4418:55951 | CD·Full-screen Templates · Loading | ✗ Dummy | G2-094 E / F |
| 4418:56071 | CD·Full-screen Templates · No templates yet | △ Partial | G2-094 E / F · G2-103 D |
| 4418:56248 | CD·Templates · applying · Bistro Menu | ✓ Code | G2-099 A |
| 4418:56469 | CD·Templates · applying · Bistro Landing | ✓ Code | G2-099 A |
| 4418:56690 | CD·Templates · applying · Autumn menu layout | ✓ Code | G2-099 A |
| 4418:56911 | CD·Full-screen Templates · Bistro Menu preview | △ Partial | G2-096 E (code) · D |
| 4418:56949 | CD·Templates · Autumn menu layout preview | △ Partial | G2-096 E (code) · D · G2-103 D |
| 4418:56986 | CD·Editor · Autumn menu layout / created from saved template | △ Partial | G1-118 A (cross-ref) · G2-101 A · G2-103 D |
| 4418:57225 | CD·Editor · Home / Autumn menu layout applied | ✓ Code | G1-118 A (cross-ref) · G2-099 A |
| 4418:58009 | SS·Templates · every designed state | ✓ Code | G2-097 B |
| 4418:58061 | S·Insert · mine-expanded · empty | △ Partial | G2-111 D |
| 4418:58292 | CD·Media · fullpage · library | ✓ Code | G1-002 A · G3-032 A · G3-051 A |
| 4418:58608 | CD·Media · fullpage · list-view · bulk-select | ✓ Code | G3-046 A |
| 4418:58798 | CD·Media · fullpage · unused-scope · context-menu | △ Partial | G3-055 A · G3-056 A · G3-057 C · NOT IMPLEMENTED |
| 4418:58943 | CD·Media · fullpage · drag-over · uploading | ✓ Code | G3-035 A |
| 4418:59771 | CD·Build · Choose media | △ Partial | G3-001 A · G3-002 A · G3-006 D |
| 4418:60496 | CD·Media · Upload replacement file | ✓ Code | G3-016 A |
| 4418:60739 | CD·Media · Replacement uploaded · pasta-2-small.jpg | ✓ Code | G3-016 A |
| 4418:61000 | CD·Media · no-results | ✓ Code | G3-001 A |
| 4418:61234 | CD·Media · folder-scoped | ✓ Code | G3-004 A |
| 4418:61465 | CD·Media · filtered · video | △ Partial | G3-003 A · G3-005 D |
| 4418:61698 | CD·Media · drill-in · asset-detail | △ Partial | G3-010 A · G3-021 D · G3-025 A |
| 4418:61966 | S·Media · quota-warn | ✓ Code | G3-017 A |
| 4418:62200 | S·Media · quota-full | ✓ Code | G3-017 A |
| 4418:62432 | S·Media · bulk-select | ✓ Code | G3-011 A |
| 4418:62658 | S·Media · empty | ✓ Code | G3-001 A |
| 4418:62883 | S·Media · drill-in · versions | △ Partial | G3-024 D |
| 4418:63087 | CD·Media · drill-in · used-in | ✓ Code | G3-023 A |
| 4418:63301 | S·Media · load-error | ✓ Code | G3-001 A |
| 4418:63527 | S·Media · loading | ✓ Code | G3-001 A |
| 4418:63773 | S·Media · drill-in · used-in · empty | ✓ Code | G3-023 A |
| 4418:63971 | S·Media · drill-in · versions · empty | △ Partial | G3-024 D |
| 4418:64168 | S·Media · drill-in · icon-picker · no-results | ✓ Code | G1-115 A (G3) · G3-028 A |
| 4418:64366 | S·Media · detail · filter-empty (of 145:49) | ✓ Code | G3-001 A |
| 4418:64562 | S·Media · detail · search-scope · truncated (of 145:2) | ✓ Code | G3-003 A |
| 4418:64757 | S·Media · detail · search-scope · failed (of 782:4353) | ✓ Code | G3-003 A |
| 4418:64952 | S·Media · drill-in · stock-browser · no-results | ✓ Code | G3-029 A |
| 4418:65181 | S·Media · drill-in · stock-browser · search-failed | ✓ Code | G3-029 A |
| 4418:65410 | S·Media · drill-in · stock-browser · not-configured | ✓ Code | G3-029 A |
| 4418:65639 | S·Media · drill-in · asset-detail · alt-generate-failed | △ Partial | G3-022 D |
| 4418:65852 | S·Media · drill-in · asset-detail · device-only (re-upload) | ✓ Code | G3-018 A |
| 4418:66065 | S·Media · local-only assets | ✓ Code | G3-018 A |
| 4418:66304 | SS·Media · every designed state | ✓ Code | G3-001 A |
| 6289:147175 | CD·Media · Loading | ✓ Code | G3-001 A |
| 6289:147437 | CD·Media · Empty | ✓ Code | G3-001 A |
| 6289:148485 | CD·Media · Permission | ✗ Dummy | G3-064 C · NOT IMPLEMENTED |
| 6623:149646 | S·Media · drill-in · asset-detail · alt-generate-generating | △ Partial | G1-117 A · G3-022 D |
| 6623:149894 | S·Media · drill-in · asset-detail · alt-generate-success | △ Partial | G1-117 A · G3-022 D |
| 6623:150370 | S·Media · drill-in · asset-detail · alt-generate-retry | △ Partial | G1-117 A · G3-022 D |
| 6764:59051 | CD·Assets · Pick mode · Menu preview image | △ Partial | G2-040 D · G2-145 A (+ E code) · G3-008 D · G3-061 D · E |
| 6881:63881 | CD·Build · Choose media · after bulk delete | △ Partial | G3-013 D |
| 6881:90256 | CD·Media · fullpage · library · alt · updated | ✓ Code | G3-048 A · E |
| 6881:90478 | CD·Media · fullpage · library · alt · regenerating | ✓ Code | G3-048 A · E |
| 6881:91481 | CD·Assets · Pick mode · Menu preview image · menu-01.jpg selected | △ Partial | G3-008 D |
| 6881:91859 | CD·Assets · Pick mode · Menu preview image · pasta.jpg selected | △ Partial | G3-008 D |
| 6881:92237 | CD·Assets · Pick mode · Menu preview image · team.jpg selected | △ Partial | G3-008 D |
| 6881:92635 | CD·Assets · Pick mode · Menu preview image · video filter | △ Partial | G3-008 D |
| 6881:93016 | CD·Assets · Pick mode · Menu preview image · svg filter | △ Partial | G3-008 D |
| 6881:93397 | CD·Assets · Pick mode · Menu preview image · icon filter | △ Partial | G3-008 D |
| 6881:93778 | CD·Assets · Pick mode · Menu preview image · folder Menu photos | △ Partial | G3-008 D |
| 6881:94157 | CD·Assets · Pick mode · Menu preview image · more loaded | △ Partial | G3-008 D · G3-014 A |
| 6883:70266 | CD·Media · filtered · svg | △ Partial | G3-005 D |
| 6883:70626 | CD·Media · filtered · icon | △ Partial | G3-005 D |
| 6883:70986 | CD·Build · Choose media · more loaded | ✓ Code | G3-014 A |
| 7093:78271 | CD·Media · fullpage · library · details expanded | ✓ Code | G3-032 A |
| 4418:71408 | SS·Brand · every designed state | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:73440 | CD·History · Published · restore-confirm | △ Partial | G1-052 D · G2-177 A |
| 4418:73452 | CD·History · Published · redeploying | △ Partial | G1-052 D · G2-177 A |
| 4418:73462 | CD·History · Published · restored | △ Partial | G1-052 D · G2-177 A |
| 4418:73545 | CD·Recover · Browse page save history | △ Partial | G1-005 D · G1-068 D · G1-070 A (minor) · G2-169 A · G2-171 A |
| 4418:73791 | CD·History · This session | △ Partial | G1-068 D · G1-069 D · G2-046 A · G2-169 A · G2-175 A |
| 4418:74024 | CD·Publish · Published versions (was History · Published versions) | △ Partial | G1-052 D · G1-068 D |
| 4418:74272 | CD·Restore draft · v3 restored / live v6 unchanged | △ Partial | G1-071 D · G1-077 B |
| 4418:74517 | S·History · Saves · empty | ✓ Code | G1-070 A (minor) · G2-172 A |
| 4418:74736 | S·History · Saves · time-travel | △ Partial | G1-071 D · G2-176 A |
| 4418:74963 | S·History · Saves · restore-confirm | △ Partial | G1-071 D · G2-172 A |
| 4418:75194 | S·History · Saves · restoring | △ Partial | G1-071 D · G2-172 A |
| 4418:75425 | S·History · Saves · pruned-notice | ✓ Code | G1-070 A (minor) · G2-172 A |
| 4418:75656 | S·History · Saves · load-error | △ Partial | G1-070 A (minor) · G1-071 D · G2-172 A |
| 4418:75876 | S·History · Saves · loading | ✓ Code | G1-070 A (minor) · G2-172 A |
| 4418:76095 | S·History · Saves · time-travel · restore-confirm | △ Partial | G1-071 D · G2-176 A |
| 4418:76323 | S·History · Saves · time-travel · no-preview | △ Partial | G1-071 D · G2-176 A |
| 4418:76552 | S·History · Saves · overflow | ✓ Code | G1-070 A (minor) · G2-172 A |
| 4418:76793 | S·History · Backups · empty | ✗ Dummy | G1-074 C · NOT IMPLEMENTED |
| 4418:77004 | S·History · Published · loading | △ Partial | G1-052 D · G2-177 A |
| 4418:77203 | S·History · Published · load-error | △ Partial | G1-052 D · G2-177 A |
| 4418:77404 | S·History · Published · empty | △ Partial | G1-052 D · G2-177 A |
| 4418:77604 | S·History · Saves · changes · restore-confirm | △ Partial | G1-069 D · G2-175 A |
| 4418:77839 | S·History · Saves · changes · start-of-history | △ Partial | G1-069 D · G2-175 A |
| 4418:78074 | S·History · Saves · changes · load-error | △ Partial | G1-069 D · G2-175 A |
| 4418:78290 | S·History · Saves · changes · clear-confirm | △ Partial | G1-069 D · G2-175 A |
| 4418:78526 | S·History · Saves · changes · undo-unavailable | △ Partial | G1-069 D · G2-046 A · G2-175 A |
| 4418:78759 | SS·History · every designed state | △ Partial | G1-120 — (scaffold) |
| 4418:78906 | S·History · Backups (tab) | △ Partial | G1-068 D · G1-074 C · NOT IMPLEMENTED |
| 6881:73209 | CD·Restore backup · restored from backup / live v6 unchanged | ✗ Dummy | G1-074 C · NOT IMPLEMENTED |
| 6881:73576 | CD·History · Backups · restore-confirm (promoted from PROPOSED 4418:14 | ✗ Dummy | G1-074 C · NOT IMPLEMENTED |
| 4418:79139 | CD·Build · Organize layers | ✓ Code | G2-042 A · G2-058 A · G2-062 A |
| 4418:79355 | CD·Layers · filtered | ✓ Code | G2-059 A |
| 4418:79546 | CD·Layers · context-menu | △ Partial | G2-051 D · G2-056 D · G2-067 D |
| 4418:79800 | CD·Layers · Heading dimmed in editor | ✓ Code | G2-007 A |
| 4418:80042 | CD·Layers · locked | △ Partial | G2-006 D · G2-065 A |
| 4418:80250 | CD·Layers · renaming | ✓ Code | G2-061 A |
| 4418:80489 | CD·Layers · dragging | ✓ Code | G2-066 A |
| 4418:80697 | SUPERSEDED · Layers · expanded (old document, unwired rows) — replaced | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:80984 | CD·Layers · scroll-overflow | ✓ Code | G2-058 A |
| 4418:81300 | CD·Editor · Bella Cucina / Home / Layers | △ Partial | G1-001 D · G1-090 A (widths UNVERIFIED) · G2-001 A |
| 4418:81536 | CD·Layers · Heading deleted | △ Partial | G2-067 D |
| 4418:81754 | CD·Layers · Heading cut | △ Partial | G2-067 D |
| 4418:81972 | CD·Layers · Heading copied | △ Partial | G2-067 D |
| 4418:82191 | CD·Layers · Link to Heading copied | △ Partial | G2-067 D |
| 4418:82409 | CD·Layers · Heading grouped | △ Partial | G2-067 D |
| 4418:82629 | CD·Layers · Heading moved to Menu | △ Partial | G2-067 D |
| 4418:82866 | CD·Layers · multi-select · 3 selected | △ Partial | G2-021 B · G2-062 A · G2-064 A · G2-068 D |
| 4418:83074 | S·Layers · loading | ✓ Code | G2-063 A |
| 4418:83295 | S·Layers · load-error | ✓ Code | G2-063 A |
| 4418:83498 | S·Layers · no-results | ✓ Code | G2-059 A |
| 4418:83699 | CD·Layers · invalid-drop | ✓ Code | G2-028 A · G2-066 A |
| 4418:83911 | S·Layers · empty | ✓ Code | G2-063 A |
| 4418:84113 | CD·Layers · display-settings | △ Partial | G2-004 F · G2-020 D · G2-060 D |
| 4418:84343 | SS·Layers · every designed state | △ Partial | G1-120 — (scaffold) |
| 6881:68143 | CD·Layers · nothing selected | ✓ Code | G2-064 A |
| 6881:68544 | CD·Layers · Hero dimmed in editor | ✓ Code | G2-007 A |
| 6881:68947 | CD·Layers · Menu card instance selected | △ Partial | G2-061 A · G2-069 D |
| 6881:69354 | CD·Layers · Menu card instance detached | △ Partial | G2-069 D |
| 6881:71323 | CD·Layers · context-menu · 3 selected | △ Partial | G2-067 D · G2-068 D |
| 6881:71749 | CD·Layers · 3 elements deleted | △ Partial | G2-068 D |
| 6881:72155 | CD·Layers · Content moved | ✓ Code | G2-066 A |
| 6881:72561 | CD·Layers · Heading renamed | ✓ Code | G2-061 A |
| 6881:76946 | CD·Layers · Hero collapsed | ✓ Code | G2-058 A |
| 6881:77349 | CD·Layers · Content collapsed | ✓ Code | G2-058 A |
| 6881:77752 | CD·Layers · Menu previews collapsed | ✓ Code | G2-058 A |
| 6881:78155 | CD·Layers · Grid collapsed | ✓ Code | G2-058 A |
| 6881:78558 | CD·Layers · all collapsed | ✓ Code | G2-058 A |
| 6881:79757 | CD·Layers · Content dimmed in editor | △ Partial | G2-067 D · G2-058 A |
| 6881:80160 | CD·Layers · Subtitle dimmed in editor | △ Partial | G2-067 D · G2-058 A |
| 6881:80563 | CD·Layers · Menu previews dimmed in editor | △ Partial | G2-067 D · G2-058 A |
| 6881:80966 | CD·Layers · Grid dimmed in editor | △ Partial | G2-067 D · G2-058 A |
| 6881:81369 | CD·Layers · Menu card dimmed in editor | △ Partial | G2-067 D · G2-058 A |
| 6881:81772 | CD·Layers · Footer dimmed in editor | ✓ Code | G2-007 A |
| 6881:82817 | CD·Layers · Heading locked | △ Partial | G2-006 D · G2-065 A |
| 6881:83220 | CD·Layers · Content locked | △ Partial | G2-067 D · G2-058 A |
| 6881:83623 | CD·Layers · Subtitle locked | △ Partial | G2-067 D · G2-058 A |
| 6881:84026 | CD·Layers · Menu previews locked | △ Partial | G2-067 D · G2-058 A |
| 6881:84429 | CD·Layers · Grid locked | △ Partial | G2-067 D · G2-058 A |
| 6881:84832 | CD·Layers · Menu card locked | △ Partial | G2-067 D · G2-058 A |
| 6881:85235 | CD·Layers · Footer locked | △ Partial | G2-006 D · G2-065 A |
| 6918:74311 | CD·Layers · expanded (SA-fix) | ✓ Code | G2-058 A |
| 6927:80958 | CD·Layers · Content selected (SA-fix) | ✓ Code | G2-064 A |
| 4418:90494 | CD·Build · Manage pages | △ Partial | G1-004 D · G1-044 D · G2-070 A · G2-082 A |
| 4418:90763 | CD·Pages · Menu deleted | ✗ Dummy | G2-079 A (+ C DESIGN-ONLY reference |
| 4418:91027 | CD·Pages · Our story renamed / existing URL kept | △ Partial | G2-076 D |
| 4418:91320 | CD·Editor · Menu / dynamic page template | ✓ Code | G1-118 A (cross-ref) |
| 4418:91805 | CD·Pages · Rename About to Our story · URL decision | △ Partial | G2-076 D |
| 4418:92016 | CD·Pages · Rename Contact · name already exists | ✓ Code | G2-075 A |
| 4418:92256 | CD·Pages · searching | ✓ Code | G2-072 A |
| 4418:92460 | CD·Pages · listings | ✓ Code | G2-084 A |
| 4418:92679 | CD·Pages · folders-collapsed | ✓ Code | G2-082 A |
| 4418:92891 | CD·Pages · Local copy only · Project unavailable | △ Partial | G2-001 A · G2-073 A (+ C PARTIALLY IMPLEMENTED |
| 4418:93108 | CD·Pages · Rename Menu · inline | ✓ Code | G2-075 A |
| 4418:93381 | CD·Pages · Menu duplicated | ✓ Code | G2-077 A (+ E inside Figma) |
| 4418:93657 | CD·Pages · Menu set as homepage | ✓ Code | G2-046 A · G2-077 A (+ E inside Figma) |
| 4418:93929 | CD·Pages · Menu link copied | ✓ Code | G2-077 A (+ E inside Figma) |
| 4418:94200 | CD·Pages · Menu renamed to Our menu | △ Partial | G2-076 D · G2-073 A (+ C PARTIALLY IMPLEMENTED |
| 4418:94471 | S·Pages · bulk-select | ✓ Code | G2-081 A |
| 4418:94702 | S·Pages · one-page | △ Partial | G2-073 A (+ C PARTIALLY IMPLEMENTED |
| 4418:94910 | S·Pages · load-error | △ Partial | G2-073 A (+ C PARTIALLY IMPLEMENTED |
| 4418:95114 | S·Pages · loading | △ Partial | G2-073 A (+ C PARTIALLY IMPLEMENTED |
| 4418:95333 | S·Pages · no-results | ✓ Code | G2-072 A |
| 4418:95789 | S·Pages · structure | △ Partial | G2-074 D · G2-085 A |
| 4418:96009 | S·Pages · tree · drag · drop indicator (of 140:2) | ✓ Code | G2-080 A |
| 4418:96273 | S·Pages · tree · homepage by position (of 140:2) | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:96537 | S·Pages · bulk · one toast per action (of 141:78) | ✓ Code | G2-081 A |
| 4418:96768 | SS·Pages · every designed state | △ Partial | G1-120 — (scaffold) |
| 6700:71154 | CD·Pages · New page created | △ Partial | G2-018 D · G2-074 D |
| 6881:63460 | CD·Pages · Menu selected | △ Partial | G2-076 D · G2-073 A (+ C PARTIALLY IMPLEMENTED |
| 6881:64564 | CD·Editor · Menu / drawer closed | ✓ Code | G1-118 A (cross-ref) · G2-001 A |
| 6881:64862 | CD·Editor · Contact / drawer closed | ✓ Code | G1-118 A (cross-ref) · G2-001 A |
| 6881:65908 | CD·Editor · About / drawer closed | ✓ Code | G1-118 A (cross-ref) · G2-001 A |
| 6881:66674 | CD·Editor · Menu / Layers | ✓ Code | G1-118 A (cross-ref) · G2-001 A |
| 6881:67033 | CD·Editor · Contact / Layers | ✓ Code | G1-118 A (cross-ref) · G2-001 A |
| 6881:74513 | CD·Pages · Menu copy selected | △ Partial | G2-076 D · G2-073 A (+ C PARTIALLY IMPLEMENTED |
| 6881:86185 | CD·Pages · New page renamed to Reservations | △ Partial | G2-076 D · G2-073 A (+ C PARTIALLY IMPLEMENTED |
| 6881:86589 | CD·Pages · Rename New page · inline | ✓ Code | G2-075 A |
| 6881:94598 | CD·Pages · Rename Menu to Our menu · URL decision | △ Partial | G2-076 D |
| 6883:69130 | CD·Pages · row menu · Home | △ Partial | G2-078 D |
| 6883:69504 | CD·Pages · row menu · Contact | △ Partial | G2-078 D |
| 6883:69879 | CD·Pages · row menu · About | △ Partial | G2-078 D |
| 6887:77525 | CD·Pages · 3 pages deleted | ✓ Code | G2-081 A |
| 6887:78343 | CD·Pages · Legal expanded | ✓ Code | G2-082 A |
| 6887:78797 | CD·Pages · Rename Contact to Get in touch · URL decision | △ Partial | G2-076 D |
| 6927:76479 | CD·Pages · row menu · Menu (SA-fix) | △ Partial | G2-076 D · G2-073 A (+ C PARTIALLY IMPLEMENTED |
| 7069:78984 | CD·Pages · select mode | ✓ Code | G2-081 A |
| 4418:97118 | CD·Publish · Review and release site | △ Partial | G1-013 D · G1-042 D · G1-044 D |
| 4418:97355 | CD·Publish · Production › Token rejected | ✓ Code | G1-049 A |
| 4418:97570 | CD·Publish · Production › Publishing | △ Partial | G1-043 D · G1-047 D |
| 4418:97787 | CD·Publish · Production › Published | △ Partial | G1-006 E · D · G1-032 C · PARTIALLY IMPLEMENTED (d · G1-048 D |
| 4418:98042 | S·Publish · loading | △ Partial | G1-042 D |
| 4418:98262 | S·Publish · load-error | △ Partial | G1-042 D |
| 4418:98463 | S·Publish · no Vercel connection | ✓ Code | G1-049 A |
| 4418:98663 | S·Publish · cancelled | △ Partial | G1-047 D |
| 4418:98876 | S·Publish · lost contact | △ Partial | G1-047 D |
| 4418:99089 | S·Publish · published (simulated) | △ Partial | G1-048 D |
| 4418:99303 | SS·Publish · every designed state | △ Partial | G1-045 D · G1-046 B · G1-050 F (stub) · C proposed (not l · G1-120 — (scaffold) |
| 4418:99386 | S·Publish · unavailable (feature off) | △ Partial | G1-042 D · G1-103 D |
| 7051:78232 | CD·Publish · changes expanded | △ Partial | G1-042 D |
| 7051:78633 | CD·Publish · last deploy expanded | △ Partial | G1-042 D |
| 4418:99611 | CD·Build · Insert elements and sections | △ Partial | G2-090 E (Figma-side stale entry) · G2-104 A · G2-106 A · G2-107 E |
| 4418:99857 | CD·Insert a saved component | △ Partial | G2-029 A · G2-111 D · G2-120 A |
| 4418:100087 | CD·Insert · searching | ✓ Code | G2-105 A |
| 4418:100299 | CD·Insert · group-expanded | △ Partial | G2-113 E (both sides) · G2-105 A |
| 4418:100523 | CD·Insert · elements-expanded | △ Partial | G2-107 E · G2-108 A |
| 4418:100890 | CD·Insert · dragging | ✓ Code | G2-028 A · G2-029 A |
| 4418:101123 | CD·Insert · blocks-expanded | △ Partial | G2-110 D (+ E in Figma) |
| 4418:101395 | CD·Insert · components-expanded | △ Partial | G2-107 E |
| 4418:101694 | S·Insert · no-results | ✓ Code | G2-105 A |
| 4418:101899 | S·Insert · disabled-item | ✗ Dummy | G2-109 C DESIGN-ONLY |
| 4418:102121 | CD·Insert · tip-dismissed | △ Partial | G2-113 E (both sides) |
| 4418:102338 | S·Insert · loading | ✗ Dummy | G2-114 C DESIGN-ONLY |
| 4418:102558 | S·Insert · load-error | ✗ Dummy | G2-114 C DESIGN-ONLY |
| 4418:102764 | S·Insert · blocks-expanded · rows | △ Partial | G2-110 D (+ E in Figma) |
| 4418:103131 | S·Insert · drop-refused | ✓ Code | G2-028 A |
| 4418:103353 | S·Insert · favourites | △ Partial | G2-115 D |
| 4418:103591 | S·Insert · element-hover (description) | ✓ Code | G2-108 A |
| 4418:103958 | S·Insert · transition-callout | △ Partial | G2-113 E (both sides) |
| 4418:104196 | SS·Insert · every designed state | △ Partial | G2-116 E |
| 6887:79186 | CD·Insert · tip 1/4 | △ Partial | G2-090 E (Figma-side stale entry) · G2-113 E (both sides) |
| 6887:79473 | CD·Insert · tip 3/4 | △ Partial | G2-113 E (both sides) |
| 6887:79760 | CD·Insert · ELEMENTS collapsed | ✓ Code | G2-104 A |
| 4418:104313 | CD·Design · Edit with AI | △ Partial | G1-025 F · G1-122 A (cross-ref) · G2-127 E (code) · G2-129 A (+ C NOT IMPLEMENTED count |
| 4418:104454 | CD·AI · Hero › Draft | △ Partial | G2-127 E (code) · G2-128 A |
| 4418:104577 | CD·AI · Hero › Thinking | △ Partial | G2-130 E (code) · D |
| 4418:104698 | CD·AI · Hero › Plan | △ Partial | G2-130 E (code) · D · G2-132 D |
| 4418:104837 | CD·AI · Hero › Running | △ Partial | G2-132 D |
| 4418:104976 | CD·AI · Hero › Approval | △ Partial | G2-132 D |
| 4418:105118 | CD·AI · Hero › Failed step | △ Partial | G2-132 D |
| 4418:105261 | CD·AI · Hero › Stopped | △ Partial | G2-132 D |
| 4418:105401 | CD·AI · Hero › Applied | △ Partial | G2-132 D |
| 4418:105548 | CD·AI · Hero › Undone | △ Partial | G2-132 D |
| 4418:105695 | CD·Editor · Home / AI changes applied | △ Partial | G1-118 A (cross-ref) · G2-132 D |
| 4418:105930 | CD·Editor · Home / one AI change applied | △ Partial | G1-118 A (cross-ref) · G2-132 D |
| 4418:106165 | CD·Editor · Home / two AI changes applied | △ Partial | G1-118 A (cross-ref) · G2-132 D |
| 4418:106400 | CD·AI · Hero / two applied and one skipped | △ Partial | G2-132 D |
| 4418:106547 | CD·AI · Hero / edit request with one applied change | △ Partial | G2-132 D |
| 4418:106671 | CD·Use AI · quota reached | ✓ Code | G1-108 A (G3) · G2-133 A |
| 4418:106796 | CD·Connect AI provider | △ Partial | G1-025 F · G1-122 A (cross-ref) · G2-127 E (code) · G2-133 A |
| 4418:106919 | CD·Use AI · provider unavailable | ✓ Code | G2-133 A |
| 4418:107044 | CD·Inspector · profile · CONTAINER (fallback) | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:107268 | S·AI · scoped-multi | ✓ Code | G2-131 A (+ E inside Figma) |
| 4418:107408 | SS·AI · every designed state | △ Partial | G1-120 — (scaffold) |
| 6881:63035 | CD·AI · Hero › Draft · typed | △ Partial | G2-128 A · G2-132 D |
| 6881:63246 | CD·AI · Draft · Text | ✓ Code | G2-128 A |
| 6881:65478 | CD·AI · Draft · Image | ✓ Code | G2-128 A |
| 6881:65693 | CD·AI · Draft · Button | ✓ Code | G2-128 A |
| 6881:67401 | CD·AI · Draft · Input | ✓ Code | G2-128 A |
| 6881:67616 | CD·AI · Draft · Flex | ✓ Code | G2-128 A |
| 6881:69766 | CD·AI · Draft · Grid | ✓ Code | G2-128 A |
| 6881:69981 | CD·AI · Draft · 3 selected | ✓ Code | G2-128 A · G2-131 A (+ E inside Figma) |
| 6881:71076 | CD·AI · Hero / edit request with one applied change · typing | △ Partial | G2-128 A · G2-132 D |
| 6881:74045 | CD·Editor · Home / AI block inserted | △ Partial | G1-118 A (cross-ref) · G2-117 D |
| 6881:75906 | CD·Use AI · quota reached · composer (New block) | △ Partial | G2-117 D · G2-133 A |
| 6881:76122 | CD·Connect AI provider · composer (New block) | △ Partial | G2-117 D · G2-133 A |
| 6881:76336 | CD·Use AI · provider unavailable · composer (New block) | △ Partial | G2-117 D · G2-133 A |
| 6881:78961 | CD·AI · Block › Inserted | △ Partial | G2-117 D |
| 6881:82175 | CD·AI · Block › Thinking | △ Partial | G2-117 D |
| 6881:86111 | CD·AI · in-canvas popover | ✓ Code | G2-025 A |
| 6881:86142 | CD·AI · publish confirm | ✓ Code | G2-134 A |
| 6891:73760 | CD·AI · Draft · All sections like this | ✓ Code | G2-128 A |
| 6891:73974 | CD·AI · Draft · Whole site | ✓ Code | G2-128 A |
| 4418:107674 | CD·Home Heading · Desktop | △ Partial | G2-013 D · G2-027 D |
| 4418:107916 | CD·Choose image · Home / Menu preview image | △ Partial | G2-145 A (+ E code) · G2-150 A · G3-008 D |
| 4418:108108 | CD·Edit button link · Home / Menu button | ✓ Code | G2-156 A (+ E code) |
| 4418:108695 | CD·Bind content · Menu / Price | △ Partial | G2-020 D · G2-144 E (Figma) · D · G3-078 D · E |
| 4418:108916 | CD·Bind content · Menu / Price / no records | △ Partial | G2-144 E (Figma) · D · G3-078 D · E |
| 4418:109146 | CD·Bind content · Menu / Price / choose record | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:109376 | CD·Motion · list · preserves selected element | △ Partial | G1-115 A (G3) · G2-157 A (+ E both sides) · G3-117 D · E |
| 4418:109525 | CD·Motion · add · preserves selected element | △ Partial | G2-157 A (+ E both sides) · G3-117 D · E |
| 4418:109686 | CD·Motion · edit · preserves selected element | △ Partial | G2-157 A (+ E both sides) · G3-117 D · E |
| 4418:110025 | CD·Motion · Scroll Into View · preserves selected element | ✓ Code | G2-157 A (+ E both sides) |
| 4418:110182 | CD·Contact Heading · Desktop | △ Partial | G2-013 D |
| 4418:110422 | CD·Contact Heading · Wide | △ Partial | G2-013 D |
| 4418:110663 | CD·Contact Heading · Tablet | △ Partial | G2-013 D |
| 4418:110904 | CD·Contact Heading · Mobile | △ Partial | G2-013 D |
| 4418:111145 | S·Inspector · profile · FLEX | ✓ Code | G2-148 A (+ E code) |
| 4418:111365 | S·Inspector · profile · GRID | ✓ Code | G2-149 A |
| 4418:111563 | S·Inspector · profile · INPUT | △ Partial | G2-158 D |
| 4418:111759 | S·Inspector · error-boundary | ✓ Code | G2-138 A |
| 4418:111890 | S·Inspector · no-selection | ✓ Code | G2-138 A |
| 4418:112020 | S·Inspector · loading | ✓ Code | G2-138 A |
| 4418:112166 | S·Inspector · multi-select | △ Partial | G2-021 B · G2-023 E · G2-140 A |
| 4418:112330 | S·Inspector · instance-selected | ✓ Code | G2-125 A |
| 4418:112556 | S·Inspector · breakpoint-override | △ Partial | G2-142 D |
| 4418:112784 | S·Inspector · pseudo-state | ✓ Code | G1-105 A · G2-143 A |
| 4418:113006 | S·Inspector · reach-all-like-this | ✓ Code | G2-141 A |
| 4418:113229 | S·Inspector · ai-agent-run | △ Partial | G2-132 D · G2-138 A |
| 4418:113365 | S·Inspector · reach-whole-site | ✓ Code | G2-138 A |
| 4418:113515 | S·Inspector · profile · SLIDER · component editor | △ Partial | G2-158 D · G2-159 C NOT IMPLEMENTED (Figma Sli |
| 4418:113785 | S·Inspector · breakpoint-override · collapsed summary | △ Partial | G2-142 D |
| 4418:114017 | S·Inspector · disabled control · reason and fix | △ Partial | G2-146 D · G2-148 A (+ E code) · G2-151 A |
| 4418:114260 | S·Inspector · findability | △ Partial | G2-040 D · G2-139 D · G2-146 D |
| 4418:114523 | S·Inspector · multi-select · with context header | △ Partial | G2-021 B · G2-023 E · G2-140 A |
| 4418:114712 | S·Inspector · CSS classes duplicate · simplified density | △ Partial | G2-137 D · G2-160 D |
| 4418:114966 | S·Inspector · locked element | △ Partial | G2-006 D · G2-167 C PARTIALLY IMPLEMENTED |
| 4418:115173 | S·Inspector · MOTION · one section | ✓ Code | G2-157 A (+ E both sides) |
| 4418:115322 | SS·Inspector · every designed state | △ Partial | G1-120 — (scaffold) |
| 6887:77945 | CD·Bind content · Menu / Price · unbound (local value) | △ Partial | G2-144 E (Figma) · D · G3-078 D · E |
| 6983:77608 | CD·Motion · interaction removed (SA-fix) | ✓ Code | G2-157 A (+ E both sides) |
| 7079:79176 | CD·Inspector · Text · TYPOGRAPHY expanded | ✓ Code | G2-152 A |
| 4418:115486 | CD·Compare · side-by-side | △ Partial | G1-061 D · E · G2-173 A (+ B) |
| 4418:115521 | CD·Compare · overlay | △ Partial | G1-061 D · E · G2-173 A (+ B) |
| 4418:115551 | CD·Compare · list | △ Partial | G1-061 D · E · G2-173 A (+ B) |
| 4418:115696 | SS·Compare · every designed state | △ Partial | G1-120 — (scaffold) |
| 4418:115766 | CD·Orphan comments · reattach | △ Partial | G1-036 D · G1-037 D |
| 4418:115784 | CD·Review · 3 open / 9 resolved | △ Partial | G1-007 D · G1-030 D · G1-032 C · PARTIALLY IMPLEMENTED (d · G1-044 D · G1-054 D · G1-055 A · G1-058 D |
| 4418:116040 | CD·Review · Revoked link / comments retained | △ Partial | G1-054 D · G1-059 D |
| 4418:116264 | CD·Review · Resolve failed / same comment retained | △ Partial | G1-055 A · G1-057 D |
| 4418:116479 | CD·Review · Send failed / draft retained | ✓ Code | G1-056 A (copy) |
| 4418:116688 | CD·Review · All comments resolved | △ Partial | G1-054 D |
| 4418:116906 | CD·Review · Detached comment | △ Partial | G1-007 D · G1-037 D |
| 4418:117140 | CD·Review · Home photo open · 1 open / 11 resolved | △ Partial | G1-054 D |
| 4418:117393 | CD·Review · Contact phone open · 1 open / 11 resolved | △ Partial | G1-054 D |
| 4418:117646 | CD·Review · Home and Contact open · 2 open / 10 resolved | △ Partial | G1-054 D |
| 4418:117900 | CD·Review · Menu request open · 1 open / 11 resolved | △ Partial | G1-054 D |
| 4418:118153 | CD·Review · Home and Menu open · 2 open / 10 resolved | △ Partial | G1-054 D |
| 4418:118407 | CD·Review · Contact and Menu open · 2 open / 10 resolved | △ Partial | G1-054 D |
| 4418:118661 | CD·Review · Comment reattached to Home / Hours | △ Partial | G1-037 D |
| 4418:118896 | CD·Review · Home comment sent / draft cleared | △ Partial | G1-054 D · G1-056 A (copy) |
| 4418:119819 | CD·Read resolved comments · Review | △ Partial | G1-055 A · G1-057 D |
| 4418:120066 | CD·Publish gate · Waiting on approver (review sent · pending) | △ Partial | G1-013 D · G1-045 D |
| 4418:120075 | CD·Preview · Home · mobile | △ Partial | G1-008 A · G1-022 D · G1-086 D |
| 4418:120123 | S·Review panel · older-round | △ Partial | G1-060 D |
| 4418:120342 | S·Review panel · empty | △ Partial | G1-054 D |
| 4418:120553 | S·Review panel · review-closed | △ Partial | G1-054 D |
| 4418:120752 | S·Review panel · load-error | △ Partial | G1-054 D |
| 4418:120964 | S·Review panel · loading | △ Partial | G1-054 D |
| 4418:121174 | S·Review · round-history · load-error | △ Partial | G1-060 D |
| 4418:121372 | S·Review · foot · revoke + invite | △ Partial | G1-031 D · G1-058 D |
| 4418:121571 | SS·Review & client sign-off · every designed state | △ Partial | G1-120 — (scaffold) |
| 4418:121686 | S·Review · reply-composer band | ✓ Code | G1-056 A (copy) |
| 5931:44782 | CD·Publish gate · Not sent for review yet (approval lock on · no round | △ Partial | G1-013 D · G1-045 D |
| 6879:66771 | CD·Review · Not sent yet · Round 3 (no link sent) | △ Partial | G1-054 D |
| 4418:121903 | CD·Client sign-off · A · viewing · 1280 | ✓ Code | G1-063 A (UNVERIFIED) · G1-064 A (UNVERIFIED) |
| 4418:121939 | CD·Client sign-off · D · approved · 1280 | ✓ Code | G1-064 A (UNVERIFIED) |
| 4418:121951 | CD·Client sign-off · C · changes-requested · 1280 | ✓ Code | G1-065 A (UNVERIFIED) |
| 4418:121971 | CD·Client sign-off · F · dead-link · revoked · 1280 | △ Partial | G1-063 A (UNVERIFIED) · G1-067 C · UNKNOWN (dashboard) |
| 4418:121999 | CD·Client sign-off · B · commenting · 1280 | △ Partial | G1-065 A (UNVERIFIED) · G1-066 D |
| 4418:122048 | CD·Open current review · access check 1 | △ Partial | G1-031 D · G1-063 A (UNVERIFIED) |
| 4418:122085 | CD·Open current review · access check 2 | ✓ Code | G1-063 A (UNVERIFIED) |
| 4418:122122 | CD·Open current review · access check 3 | ✓ Code | G1-063 A (UNVERIFIED) |
| 4418:122159 | CD·Client sign-off · F · dead-link · new link requested · 1280 | △ Partial | G1-067 C · UNKNOWN (dashboard) |
| 4418:122170 | CD·Client sign-off · C · change request not sent / notes retained · 12 | ✓ Code | G1-065 A (UNVERIFIED) |
| 4418:122315 | CD·Shell state 12 · Loading | △ Partial | G1-001 D · G1-078 D · G2-001 A |
| 4418:122932 | CD·Shell state 11 · Saving → conflict | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:123152 | CD·Shell state 2 · Returning (default) | △ Partial | G1-001 D |
| 4418:123573 | CD·Editor · Home / drawer closed | △ Partial | G1-001 D · G1-004 D · G1-090 A (widths UNVERIFIED) · G2-001 A |
| 4418:124664 | CD·Exit · Workspace (leaves the editor) | △ Partial | G1-003 D · G1-023 D · G1-028 C · NOT IMPLEMENTED (editor) |
| 4418:124730 | CD·Shell state 14 · Saving | △ Partial | G1-005 D |
| 4418:124938 | CD·Shell state 15 · Save failed | △ Partial | G1-005 D · G1-076 B |
| 4418:125151 | CD·Exit · Editor (leaves to your sites) | △ Partial | G1-003 D |
| 4418:125436 | CD·Editor · Home / Unsaved page changes | △ Partial | G1-005 D |
| 4418:125671 | CD·Session · Sign in and return to this tab | ✓ Code | G1-079 A |
| 4418:125678 | CD·Exit · Save failed / stay in editor | △ Partial | G1-003 D · G1-005 D |
| 4418:125919 | CD·Exit · Saving page before leaving | △ Partial | G1-003 D |
| 4418:126034 | CD·Site menu · Current site actions and external destinations | △ Partial | G1-006 E · D · G1-010 D · G1-014 D · G1-015 A · G1-016 E · G1-017 D · G1-018 A (door) · G1-019 D · G1-022 D ·  |
| 4418:126052 | CD·Session · Sign in / saved work | △ Partial | G1-078 D |
| 4418:126059 | CD·Editor · Workspace VIEWER / Home | △ Partial | G1-021 D · G1-062 D · G2-001 A |
| 4418:126318 | CD·S3.1 · dragging | ✓ Code | G1-119 A (cross-ref) · G2-029 A |
| 4418:126485 | CD·S3.1 · inline-edit | △ Partial | G1-119 A (cross-ref) · G2-027 D |
| 4418:126653 | CD·Canvas · breakpoints · Tablet (was S3.4 · responsive-viewport · bre | △ Partial | G1-104 D (drift) · G2-013 D |
| 4418:127180 | CD·S1.5b · session-expired · unsaved-warning | ✓ Code | G1-079 A |
| 4418:127231 | CD·S1.5 · session-expired | ✓ Code | G1-079 A |
| 4418:127245 | SS·Editor shell · every designed state | △ Partial | G1-005 D · G1-009 B · G1-011 B (PLANNED) · G1-027 B · G1-029 E · D · G1-102 B (modal) · A (locks) · G1-120 — ( |
| 6881:86093 | CD·Permissions · Site deleted (leaves the editor) | △ Partial | G1-078 D · G1-123 C · NOT IMPLEMENTED (editor) |
| 4418:127313 | CD·Full-screen Settings · General | △ Partial | G1-002 A · G1-044 D · G3-098 A |
| 4418:127438 | CD·Full-screen Settings · SEO | △ Partial | G1-044 D · G3-101 A |
| 4418:127680 | CD·Full-screen Settings · Domains | △ Partial | G1-044 D · G1-053 A (door) · G3-102 A |
| 4418:127827 | CD·Full-screen Settings · Analytics | ✓ Code | G3-106 A |
| 4418:127966 | CD·Full-screen Settings · Localization | ✓ Code | G3-099 A |
| 4418:128108 | CD·Full-screen Settings · Custom code | ✓ Code | G3-109 A |
| 4418:128227 | CD·Full-screen Settings · Redirects | ✓ Code | G3-103 A · G3-104 B |
| 4418:128374 | CD·Full-screen Settings · Headers | ✓ Code | G3-110 A |
| 4418:128507 | CD·Full-screen Settings · Forms | △ Partial | G3-084 D · PARTIALLY IMPLEMENTED · G3-085 A (ceiling shared with G3-08 |
| 4418:128657 | CD·Full-screen Settings · Webhooks | ✓ Code | G3-112 A |
| 4418:128917 | CD·Full-screen Settings · Overview | △ Partial | G1-015 A · G3-087 A · G3-094 A · G3-096 D |
| 4418:129708 | CD·Full-screen Settings · Localization · save-error | △ Partial | G3-089 D · E · G3-099 A |
| 4418:130044 | CD·Full-screen Settings · Headers · save-error | △ Partial | G3-089 D · E · G3-110 A |
| 4418:130886 | CD·Full-screen Settings · Forms · action-error | △ Partial | G3-084 D · PARTIALLY IMPLEMENTED · G3-085 A (ceiling shared with G3-08 |
| 4418:131496 | CD·Full-screen Settings · Webhooks · save-error | △ Partial | G3-089 D · E · G3-112 A |
| 4418:131709 | CD·Full-screen Settings · Headers · unsaved changes | △ Partial | G3-090 D · G3-110 A |
| 4418:131840 | CD·Full-screen Settings · Forms · delete-submission-confirm | △ Partial | G3-083 D · NOT IMPLEMENTED · G3-085 A (ceiling shared with G3-08 |
| 4418:131992 | CD·Full-screen Settings · Domains · remove-confirm | ✓ Code | G3-102 A |
| 4418:132141 | CD·Forms · Submission deleted | △ Partial | G3-084 D · PARTIALLY IMPLEMENTED |
| 4418:132281 | CD·Domains · bellacucina.com removed | ✓ Code | G3-102 A |
| 4418:132394 | CD·Settings · Redirects · About URL repair / draft | ✓ Code | G1-111 A · G3-105 A |
| 4418:132547 | CD·Settings · Redirects · About URL repair / saved | ✓ Code | G3-105 A |
| 4418:132694 | CD·Settings · Redirects · Our story URL repair / draft | ✓ Code | G3-105 A |
| 4418:132847 | CD·Settings · Redirects · Our story URL repair / saved | ✓ Code | G3-105 A |
| 4418:132994 | CD·S3.7 · page-settings · SEO | △ Partial | G2-086 D |
| 4418:133079 | CD·Full-screen Settings · Integrations | ✗ Dummy | G3-111 C · NOT IMPLEMENTED · G3-116 C · NOT IMPLEMENTED |
| 4418:133217 | CD·Full-screen Settings · General · save-error | △ Partial | G1-084 D · G3-089 D · E · G3-098 A |
| 4418:133344 | CD·Full-screen Settings · SEO · save-error | △ Partial | G1-084 D · G3-089 D · E · G3-101 A |
| 4418:133473 | CD·Full-screen Settings · Analytics · save-error | △ Partial | G3-089 D · E · G3-106 A |
| 4418:133614 | CD·Full-screen Settings · Custom code · save-error | △ Partial | G3-089 D · E · G3-109 A |
| 4418:133735 | CD·Full-screen Settings · Redirects · save-error | △ Partial | G3-089 D · E · G3-103 A |
| 4418:133885 | CD·Full-screen Settings · Integrations · loading | ✗ Dummy | G3-111 C · NOT IMPLEMENTED |
| 4418:134028 | CD·Full-screen Settings · Integrations · load-error | ✗ Dummy | G3-111 C · NOT IMPLEMENTED |
| 4418:134172 | CD·Full-screen Settings · General · loading | ✓ Code | G3-098 A |
| 4418:134302 | CD·Full-screen Settings · General · load-error | ✓ Code | G3-098 A |
| 4418:134433 | CD·Full-screen Settings · SEO · loading | ✓ Code | G3-101 A |
| 4418:134565 | CD·Full-screen Settings · SEO · load-error | ✓ Code | G3-101 A |
| 4418:134698 | CD·Full-screen Settings · Custom code · loading | ✓ Code | G3-109 A |
| 4418:134822 | CD·Full-screen Settings · Custom code · load-error | ✓ Code | G3-109 A |
| 4418:134947 | CD·Full-screen Settings · Analytics · loading | ✓ Code | G3-106 A |
| 4418:135091 | CD·Full-screen Settings · Analytics · load-error | ✓ Code | G3-106 A |
| 4418:135236 | CD·Full-screen Settings · Redirects · Edit redirect | ✓ Code | G3-103 A |
| 4418:135402 | CD·Full-screen Settings · Redirects · Redirect saved | ✓ Code | G3-103 A |
| 5905:44701 | CD·Permissions · OWNER | △ Partial | G1-062 D · G1-123 C · NOT IMPLEMENTED (editor) |
| 6816:60270 | CD·Full-screen Settings · sidebar · searching “domain” | △ Partial | G3-097 D |
| 4418:175131 | CD·Full-screen Settings · Integrations · connect-dialog | ✗ Dummy | G3-111 C · NOT IMPLEMENTED |
| 4418:175272 | CD·Full-screen Settings · Integrations · connecting | ✗ Dummy | G3-111 C · NOT IMPLEMENTED |
| 4418:175416 | CD·Full-screen Settings · Integrations · connected (success) | ✗ Dummy | G3-111 C · NOT IMPLEMENTED |
| 4418:175559 | CD·Full-screen Settings · Integrations · connect-failed | ✗ Dummy | G3-111 C · NOT IMPLEMENTED |
| 4418:175839 | CD·Full-screen Settings · Integrations · Manage | ✗ Dummy | G3-111 C · NOT IMPLEMENTED |
| 4418:175951 | CD·Full-screen Settings · Integrations · disconnect-confirm | ✗ Dummy | G3-111 C · NOT IMPLEMENTED |
| 4418:176070 | CD·Full-screen Settings · Integrations · disconnected | ✗ Dummy | G3-111 C · NOT IMPLEMENTED |
| 4418:176174 | CD·Full-screen Settings · Integrations · Browse all | ✗ Dummy | G3-111 C · NOT IMPLEMENTED |
| 4418:140114 | SS·Journey variants · every designed state | △ Partial | G1-007 D · G1-031 D · G1-045 D · G1-120 — (scaffold) |
| 4418:140492 | CD·Notifications · unread | △ Partial | G1-012 A · G1-033 D |
| 4418:140587 | CD·Activity · Review changes on Bella Cucina | △ Partial | G1-019 D · G1-032 C · PARTIALLY IMPLEMENTED (d · G1-033 D |
| 4418:140819 | SS·Notifications · every designed state | △ Partial | G1-033 D · G1-120 — (scaffold) |
| 6278:146843 | CD·Activity · Empty | △ Partial | G1-032 C · PARTIALLY IMPLEMENTED (d |
| 6278:147177 | CD·Activity · Loading | △ Partial | G1-032 C · PARTIALLY IMPLEMENTED (d |
| 6278:147511 | CD·Activity · Error | △ Partial | G1-032 C · PARTIALLY IMPLEMENTED (d |
| 6278:147845 | CD·Activity · Permission | △ Partial | G1-032 C · PARTIALLY IMPLEMENTED (d |
| 4418:141325 | SS·Commands · every designed state | △ Partial | G1-093 D · E · G1-120 — (scaffold) · G2-038 E |
| 6887:76925 | CD·Commands · Jump to layer · Menu previews selected | △ Partial | G1-093 D · E |
| 4418:141508 | S·Preview · accessibility checker | ✗ Dummy | G1-087 C · NOT IMPLEMENTED |
| 4418:141748 | SS·Preview · every designed state | △ Partial | G1-120 — (scaffold) |
| 4418:142106 | SS·Canvas · every designed state | ✓ Code | G2-002 A · G2-003 B · G2-019 B |
| 5930:44781 | CD·Canvas · Breakpoint menu | △ Partial | G1-104 D (drift) · G2-013 D · G2-014 C NOT IMPLEMENTED |
| 5930:44801 | CD·Canvas · View menu | △ Partial | G2-016 D · G2-032 D · G2-033 D · G2-034 D · G2-035 D · G2-036 E · G2-037 D |
| 6016:51780 | CD·Canvas · Breakpoint menu (canvas @60) | △ Partial | G1-104 D (drift) · G2-013 D |
| 6016:51796 | CD·Canvas · View menu (canvas @60) | △ Partial | G2-013 D · G1-104 D (drift) |
| 6016:51812 | CD·Canvas · Breakpoint menu (canvas @200) | △ Partial | G2-013 D · G1-104 D (drift) |
| 6016:51828 | CD·Canvas · View menu (canvas @200) | △ Partial | G2-013 D · G1-104 D (drift) |
| 6016:51844 | CD·Canvas · Breakpoint menu (canvas @380) | △ Partial | G2-013 D · G1-104 D (drift) |
| 6016:51860 | CD·Canvas · View menu (canvas @380) | △ Partial | G2-013 D · G1-104 D (drift) |
| 6016:51876 | CD·Canvas · View menu (canvas @340 · Tablet/Mobile label) | △ Partial | G2-013 D · G1-104 D (drift) |
| 6016:51892 | CD·Canvas · View menu (canvas @340 · Wide label) | △ Partial | G2-013 D |
| 6056:146477 | CD·Canvas · Breakpoint menu (Home Heading selected) | △ Partial | G2-013 D |
| 6056:146500 | CD·Canvas · Breakpoint menu (Contact Heading selected) | △ Partial | G2-013 D · G1-104 D (drift) |
| 4418:142143 | CD·Components · create | △ Partial | G1-098 D (G3 family) · G1-110 A (G3) · G2-123 D |
| 4418:142419 | CD·Build · Manage saved components | △ Partial | G2-091 A · G2-118 D · G2-120 A · G2-121 A |
| 4418:142651 | CD·Components · Menu card deleted | ✓ Code | G2-121 A |
| 4418:142876 | CD·Manage saved master · Menu card | △ Partial | G2-122 D |
| 4418:143126 | CD·Detach instances · Menu card master kept / 0 linked instances | △ Partial | G2-122 D |
| 4418:143371 | CD·Components · Menu card master updated · 18 linked instances | △ Partial | G2-122 D |
| 4418:143606 | CD·Layers · component-instance | △ Partial | G2-069 D |
| 4418:143889 | S·Components · loading | ✓ Code | G2-121 A |
| 4418:144105 | S·Components · load-error | ✓ Code | G2-121 A |
| 4418:144305 | S·Components · empty | ✓ Code | G2-121 A |
| 4418:144507 | SS·Components · every designed state | △ Partial | G1-120 — (scaffold) |
| 4418:144558 | S·Component properties and per-page usage · not implemented | △ Partial | G2-069 D · G2-122 D |
| 6887:80762 | CD·Layers · Home · Menu card instances | △ Partial | G2-062 A · G2-069 D |
| 6887:81221 | CD·Layers · Catering · Menu card instances | △ Partial | G2-069 D |
| 4418:145182 | S·Commerce · setup | ✓ Code | G3-115 A |
| 4418:145403 | S·Commerce · sample-added | ✓ Code | G3-115 A |
| 4418:145614 | S·Commerce · bound | ✓ Code | G3-115 A |
| 4418:145814 | SS·Commerce · every designed state | ✓ Code | G3-115 A |
| 4418:147492 | SS·index · every designed state by area | △ Partial | G1-120 — (scaffold) |
| 4418:147641 | CD·Issues · Home | △ Partial | G1-088 D |
| 4418:148264 | SS·Issues · every designed state | △ Partial | G1-120 — (scaffold) |
| 6158:51949 | CD·Issues · Home · No issues | △ Partial | G1-088 D |
| 6158:52193 | CD·Issues · Home · Scanning | △ Partial | G1-088 D |
| 6158:52437 | CD·Issues · Home · Scan failed | △ Partial | G1-088 D |
| 6158:52681 | CD·Issues · Home · Focused fix | △ Partial | G1-088 D |
| 6698:66970 | CD·Issues · Whole site | △ Partial | G1-088 D |
| 6883:73006 | CD·Issues · Home · Fix failed · Contrast | △ Partial | G1-088 D |
| 6883:73360 | CD·Issues · Home · Fixing · alt text | △ Partial | G1-088 D |
| 6883:73716 | CD·Issues · Home · Focused fix · Broken link | △ Partial | G1-088 D |
| 6883:74070 | CD·Issues · Menu · Focused fix · Image alt | △ Partial | G1-088 D |
| 4418:149091 | SS·Proposed & stress variants · every designed state | △ Partial | G1-019 D · G1-036 D · G1-041 D · G1-050 F (stub) · C proposed (not l · G1-080 D · G1-091 D · G1-120 — (scaffol |
| 4418:149701 | CD·Assets · 2 files moved to Products | ✓ Code | G3-046 A |
| 4418:150118 | Assets · List · no selection | ✓ Code | G3-044 A |
| 4418:150308 | Assets · List · hero selected | ✓ Code | G3-044 A |
| 4418:150498 | Assets · Menu cover selected | ✓ Code | G3-048 A · E |
| 4418:150780 | Canvas · Menu preview image replaced | △ Partial | G2-013 D · G2-037 D |
| 4418:151046 | Canvas · uploaded image applied | △ Partial | G2-013 D · G2-037 D |
| 4418:151238 | Canvas · team image applied | △ Partial | G2-013 D · G2-037 D |
| 4418:151430 | Assets · Search menu | ✓ Code | G3-033 A |
| 4418:151669 | Assets · Grid 2 columns | ✓ Code | G3-044 A |
| 4418:151877 | Assets · Grid 4 columns | ✓ Code | G3-044 A |
| 4418:152085 | Assets · Name ascending | ✓ Code | G3-045 A |
| 4418:152293 | Assets · No selection | ✓ Code | G3-002 A · G3-048 A · E |
| 4418:152501 | Assets · Selected · chef-intro.mp4 | ✓ Code | G3-048 A · E |
| 4418:152709 | Assets · Selected · team-photo.jpg | ✓ Code | G3-048 A · E |
| 4418:152917 | Assets · Selected · logo-mark.svg | ✓ Code | G3-048 A · E |
| 4418:153125 | Assets · Selected · pasta-closeup.jpg | ✓ Code | G3-048 A · E |
| 4418:153333 | Assets · Selected · grand-opening.mp4 | ✓ Code | G3-048 A · E |
| 4418:153541 | Assets · Selected · star-icon.svg | ✓ Code | G3-048 A · E |
| 4418:153749 | Assets · Selected · Inter-Var.woff2 | ✓ Code | G3-048 A · E |
| 4418:153957 | Assets · Selected · terrace-night.jpg | ✓ Code | G3-048 A · E |
| 6879:61904 | CD·Assets · Filter · JPG | △ Partial | G3-043 D |
| 6879:62121 | CD·Assets · Filter · PNG | △ Partial | G3-043 D |
| 6879:62338 | CD·Assets · Filter · SVG | △ Partial | G3-043 D |
| 6879:62555 | CD·Assets · Filter · MP4 | △ Partial | G3-043 D |
| 6881:67925 | CD·Assets · List · all 6 selected | ✓ Code | G3-046 A |
| 4418:154685 | Assets · Products · folder/scope | ✓ Code | G3-038 A |
| 4418:154889 | Assets · Hero shots · folder/scope | ✓ Code | G3-038 A |
| 4418:155093 | Assets · Icons · folder/scope | ✓ Code | G3-038 A |
| 4418:155297 | Assets · Recent · folder/scope | ✓ Code | G3-037 A |
| 4418:155505 | Assets · In use · folder/scope | ✓ Code | G3-037 A |
| 4418:155730 | Assets · Moved to Hero shots | ✓ Code | G3-042 A · G3-046 A |
| 4418:155931 | Assets · Campaign images · empty folder created | ✓ Code | G3-038 A |
| 4418:156235 | Assets · List · chef-intro.mp4 selected | ✓ Code | G3-048 A · E |
| 4418:156419 | Assets · List · menu-cover.png selected | ✓ Code | G3-048 A · E |
| 4418:156603 | Assets · List · logo-mark.svg selected | ✓ Code | G3-048 A · E |
| 4418:156787 | Assets · List · Inter-Var.woff2 selected | ✓ Code | G3-048 A · E · G3-054 A |
| 4418:156971 | Assets · List · terrace-night.jpg selected | ✓ Code | G3-048 A · E |
| 4418:157375 | CD·Assets · Deleted · hero-dark.jpg | ✓ Code | G3-053 A · E |
| 4418:157589 | CD·Assets · Deleted · menu-cover.png | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:157803 | CD·Assets · Deleted · chef-intro.mp4 | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:158017 | CD·Assets · Deleted · team-photo.jpg | ✓ Code | G3-053 A · E |
| 4418:158231 | CD·Assets · Deleted · logo-mark.svg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:158445 | CD·Assets · Deleted · pasta-closeup.jpg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:158659 | CD·Assets · Deleted · grand-opening.mp4 | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:158873 | CD·Assets · Deleted · star-icon.svg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:159087 | CD·Assets · Deleted · Inter-Var.woff2 | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:159301 | CD·Assets · Deleted · terrace-night.jpg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:159544 | Assets · 2 columns · no selection | ✓ Code | G3-044 A |
| 4418:159752 | Assets · 4 columns · no selection | ✓ Code | G3-044 A |
| 6879:65473 | CD·Assets · Products · folder/scope · Name A–Z | ✓ Code | G3-038 A |
| 6879:65691 | CD·Assets · Hero shots · folder/scope · Name A–Z | ✓ Code | G3-038 A |
| 6879:65909 | CD·Assets · Icons · folder/scope · Name A–Z | ✓ Code | G3-038 A |
| 6879:66127 | CD·Assets · Recent · folder/scope · Name A–Z | ✓ Code | G3-037 A |
| 6879:66349 | CD·Assets · In use · folder/scope · Name A–Z | ✓ Code | G3-037 A |
| 6879:66571 | CD·Assets · Unused · browse · Name A–Z | ✓ Code | G3-037 A |
| 6765:59890 | CD·CMS · Pick mode · Margherita photo | ✗ Dummy | G3-081 C · NOT IMPLEMENTED |
| 6881:73628 | CD·CMS · Pick mode · Margherita photo · menu-01.jpg selected | ✗ Dummy | G3-081 C · NOT IMPLEMENTED |
| 6881:75078 | CD·CMS · Pick mode · Margherita photo · folder Food | ✗ Dummy | G3-081 C · NOT IMPLEMENTED |
| 6881:75467 | CD·CMS · Pick mode · Margherita photo · video filter (not usable) | ✗ Dummy | G3-081 C · NOT IMPLEMENTED |
| 6989:77747 | CD·CMS · Pick mode · more loaded (SA-fix) | ✗ Dummy | G3-081 C · NOT IMPLEMENTED |
| 4418:160695 | Canvas · hero-imported.jpg applied to Menu preview | △ Partial | G2-013 D · G2-037 D |
| 4418:160961 | Canvas · restaurant-interior.jpg applied to Menu preview | △ Partial | G2-013 D · G2-037 D |
| 4418:161201 | Assets · Unused · browse | ✓ Code | G3-037 A |
| 4418:161381 | Assets · Tag menu | ✓ Code | G3-033 A |
| 4418:161620 | Assets · Tag team | ✓ Code | G3-033 A |
| 4418:161859 | Assets · Tag food | ✓ Code | G3-033 A |
| 4418:162133 | Canvas · New image inserted into Home | ✓ Code | G2-108 A |
| 4418:162347 | Assets · Products · team photo moved | ✓ Code | G3-042 A |
| 6883:72509 | CD·Canvas · New icon inserted into Home · arrow-right | ✓ Code | G2-108 A |
| 4418:164291 | CD·Pages · Contact selected | △ Partial | G2-071 D |
| 4418:164559 | CD·Pages · About selected | △ Partial | G2-071 D |
| 4418:165158 | CD·Pages · Home selected | △ Partial | G2-071 D |
| 4418:165563 | CD·Preview · Home · Tablet | △ Partial | G1-008 A · G1-022 D · G1-086 D |
| 4418:165611 | CD·Preview · Home · Desktop | △ Partial | G1-008 A · G1-022 D · G1-086 D |
| 4418:165744 | CD·History · Search milestone | △ Partial | G1-068 D · G2-170 D |
| 4418:166009 | CD·Home Heading · Wide | △ Partial | G2-013 D |
| 4418:166252 | CD·Home Heading · Tablet | △ Partial | G2-013 D |
| 4418:166495 | CD·Home Heading · Mobile | △ Partial | G2-013 D |
| 4418:166733 | CD·Insert Heading · placed in Home Content | △ Partial | G2-010 D · G2-090 E (Figma-side stale entry) · G2-108 A |
| 4418:166980 | CD·Components · Hero created | ✓ Code | G2-121 A |
| 4418:169143 | CD·Layers · Heading duplicated | △ Partial | G2-067 D |
| 4418:169389 | CD·Insert Container · Home Content | △ Partial | G2-009 A · G2-010 D · G2-108 A |
| 4428:43692 | CD·Canvas · hover · Hero | ✓ Code | G2-002 A |
| 4428:43928 | CD·Canvas · selected · Hero · ⋯ menu | △ Partial | G2-024 D · G2-050 A · G2-051 D · G2-055 D · G2-056 D |
| 4428:44164 | CD·Canvas · empty page · About | △ Partial | G2-018 D · G2-127 E (code) |
| 4428:44400 | CD·Canvas · reorder handles · Hero | △ Partial | G2-031 A · G2-037 D |
| 4428:139921 | CD·Canvas · drop indicator | ✓ Code | G1-107 A (G2) · G2-028 A |
| 4428:140088 | CD·Canvas · breakpoints | △ Partial | G2-013 D |
| 4428:151441 | SS·v3 · Canvas | △ Partial | G1-120 — (scaffold) |
| 5773:45430 | STATE DETAIL · Compact toolbar · Breakpoint menu | △ Partial | G1-096 A · G2-013 D |
| 5773:45444 | STATE DETAIL · Compact toolbar · View menu | △ Partial | G1-096 A · G2-037 D |
| 5905:139383 | CD·Canvas · Hero deleted | △ Partial | G2-051 D |
| 5936:44788 | CD·Canvas · selected · Hero | △ Partial | G2-019 B · G2-024 D · G2-047 D |
| 5940:147595 | CD·Canvas · Hero duplicated | △ Partial | G2-037 D · G2-046 A |
| 5940:148012 | CD·Canvas · reorder · Hero moved down | △ Partial | G2-031 A · G2-037 D · G2-046 A |
| 4428:140817 | CD·Add · Blocks | △ Partial | G2-029 A · G2-104 A · G2-110 D (+ E in Figma) |
| 4428:145110 | CD·Add · Blocks · hover | △ Partial | G2-110 D (+ E in Figma) |
| 4428:145642 | CD·Add · Blocks · inserted | △ Partial | G2-010 D · G2-046 A · G2-110 D (+ E in Figma) |
| 4428:148290 | CD·Pages · row menu · Menu | △ Partial | G2-078 D |
| 4428:149355 | CD·Templates · replace mode · Menu | △ Partial | G2-090 E (Figma-side stale entry) |
| 4428:150147 | CD·Menu · Bistro Menu template applied | ✓ Code | G2-099 A |
| 4430:141254 | SS·v3 · Templates & Blocks | △ Partial | G2-110 D (+ E in Figma) |
| 5946:51667 | CD·Add · Generate a block with AI (composer · left slot) | △ Partial | G2-117 D |
| 6881:85644 | CD·Add · Generate a block with AI (composer · typed) | △ Partial | G2-117 D |
| 4428:140486 | CD·CMS · root | △ Partial | G1-099 D (G3 owns) · G3-066 A |
| 4428:143182 | CD·CMS · Menu items · table | △ Partial | G1-099 D (G3 owns) · G3-068 D · E |
| 4428:144760 | CD·CMS · Menu items · record workspace · Margherita (wide · over the t | △ Partial | G3-069 D · E |
| 4428:147552 | CD·CMS · Menu items · Fields | △ Partial | G3-071 D |
| 4428:147857 | CD·CMS · Menu items · Dynamic pages | △ Partial | G3-072 D |
| 4428:148660 | CD·CMS · Menu items · Settings | ✗ Dummy | G3-073 C · NOT IMPLEMENTED |
| 4428:148905 | CD·CMS · empty collection · Team | △ Partial | G3-068 D · E · G3-077 C · NOT IMPLEMENTED |
| 4428:149540 | CD·Inspector · Settings · From CMS | △ Partial | G2-144 E (Figma) · D · G3-078 D · E |
| 4428:151488 | CD·Add · Elements · Collection list | ✗ Dummy | G3-079 C · NOT IMPLEMENTED |
| 4430:141185 | SS·v3 · CMS | ✓ Code | G3-066 A |
| 4762:55480 | S·CMS · Collection renamed | ✗ Dummy | G3-073 C · NOT IMPLEMENTED |
| 5940:148412 | S·CMS · record workspace · Tiramisu · Price required | △ Partial | G3-069 D · E |
| 5940:148777 | S·CMS · record workspace · Margherita · save failed | △ Partial | G3-069 D · E |
| 5940:149118 | CD·CMS · Menu items · record workspace · Quattro Formaggi (wide · over | △ Partial | G3-069 D · E |
| 5940:149532 | CD·CMS · Menu items · record workspace · Diavola (wide · over the tabl | △ Partial | G3-069 D · E |
| 5940:149946 | CD·CMS · Menu items · record workspace · Marinara (wide · over the tab | △ Partial | G3-069 D · E |
| 4418:87780 | CD·CMS · Sources | ✗ Dummy | G3-074 D · C (Sheets: NOT IMPLEMENT |
| 4418:88015 | CD·CMS · Variables | ✓ Code | G3-075 A (+ annotation) |
| 4418:88268 | S·CMS · empty | ✓ Code | G3-066 A |
| 4418:88466 | S·CMS · load-error | ✓ Code | G3-066 A |
| 4418:88666 | S·CMS · loading | ✓ Code | G3-066 A |
| 4418:88884 | S·CMS · collection · empty (legacy · see 4428:148905) | △ Partial | G3-068 D · E |
| 4418:89084 | S·CMS · dynamic-pages · no-pattern | △ Partial | G3-072 D |
| 4418:89287 | S·CMS · dynamic-pages · none-published | △ Partial | G3-072 D |
| 4418:89490 | S·CMS · conditions | △ Partial | G3-076 D |
| 4418:89895 | S·CMS · conditions · empty | △ Partial | G3-076 D |
| 4418:89696 | S·CMS · variables · empty | ✓ Code | G3-075 A (+ annotation) |
| 4418:90094 | CD·CMS · Variables · new variable · key-error | ✓ Code | G3-075 A (+ annotation) |
| 4418:90294 | SS·CMS · legacy designed states (relocated from Content 2026-09-16) | ✓ Code | G3-066 A |
| 6103:52202 | S·CMS · Fields · Price selected | △ Partial | G3-071 D |
| 6749:59940 | CD·CMS · Menu items · record workspace · New record | △ Partial | G3-069 D · E |
| 6819:59209 | CD·CMS · Menu items · searching “mar” | △ Partial | G3-068 D · E |
| 6819:59478 | S·CMS · Menu items · no results “sushi” | △ Partial | G3-068 D · E |
| 6881:64301 | CD·CMS · Menu items · table · 23 records (Margherita deleted) | △ Partial | G3-068 D · E |
| 6881:65187 | CD·CMS · Menu items · table · 25 records (New record saved) | △ Partial | G3-068 D · E |
| 6881:66225 | CD·CMS · Menu items · table · all 24 records (loaded) | △ Partial | G3-068 D · E |
| 6881:76554 | CD·CMS · record workspace · Tiramisu · Price entered | △ Partial | G3-069 D · E |
| 6881:79324 | CD·CMS · root · Menu items deleted (0 collections) | ✓ Code | G3-066 A |
| 6881:82518 | CD·CMS · Menu items · Fields · 7 fields (Price deleted) | △ Partial | G3-071 D |
| 6881:94935 | CD·CMS · Team · record workspace · New record | △ Partial | G3-069 D · E |
| 6881:95412 | CD·CMS · Team · table · 1 record (after first save) | △ Partial | G3-068 D · E |
| 6883:74428 | CD·CMS · Team · Fields | △ Partial | G3-071 D |
| 6883:74573 | CD·CMS · Team · Dynamic pages | △ Partial | G3-072 D |
| 6883:74661 | CD·CMS · Team · Settings | ✗ Dummy | G3-073 C · NOT IMPLEMENTED |
| 6887:72969 | CD·CMS · empty collection · Menu items 2 (just created) | △ Partial | G3-068 D · E |
| 6887:73027 | CD·CMS · Menu items 2 · record workspace · New record | △ Partial | G3-069 D · E |
| 6887:73254 | CD·CMS · Menu items 2 · table · 1 record | △ Partial | G3-068 D · E |
| 6887:75832 | CD·CMS · Menu items · record workspace · Panna cotta (wide · over the  | △ Partial | G3-069 D · E |
| 6887:76066 | CD·CMS · Menu items · record workspace · Bruschetta (wide · over the t | △ Partial | G3-069 D · E |
| 6887:76300 | CD·CMS · Menu items · record workspace · Caprese (wide · over the tabl | △ Partial | G3-069 D · E |
| 6887:77325 | CD·CMS · Menu items · Dynamic pages · pattern edited (/dishes/{slug}) | △ Partial | G3-072 D |
| 4418:48010 | CD·CMS · Sources · Google Sheets (watching) | ✗ Dummy | G3-074 D · C (Sheets: NOT IMPLEMENT |
| 6930:81443 | CD·CMS · Menu items · record workspace · New record · Name entered (SA | △ Partial | G3-069 D · E |
| 6930:81803 | CD·CMS · Team · record workspace · New record · Name entered (SA-fix) | △ Partial | G3-069 D · E |
| 6930:82167 | CD·CMS · Menu items 2 · record workspace · New record · Name entered ( | △ Partial | G3-069 D · E |
| 7116:76427 | CD·CMS · Menu items · record workspace · Margherita · preview open | △ Partial | G3-069 D · E |
| 4428:141170 | CD·Inspector · Style tab (Beginner) | △ Partial | G2-137 D · G2-146 D |
| 4428:141406 | CD·Inspector · Style tab (Pro) | △ Partial | G2-137 D |
| 4428:141642 | CD·Inspector · Settings tab | △ Partial | G2-008 A · G2-137 D · G2-156 A (+ E code) |
| 4428:141878 | CD·Inspector · Settings tab · Form | △ Partial | G2-158 D |
| 4428:142450 | CD·Inspector · Settings tab · Slider | △ Partial | G2-158 D · G2-159 C NOT IMPLEMENTED (Figma Sli |
| 4428:142686 | CD·Inspector · Effects tab | △ Partial | G2-137 D · G2-155 B · G2-157 A (+ E both sides) |
| 4428:151896 | SS·v3 · Inspector | △ Partial | G2-137 D |
| 6883:75643 | CD·Inspector · Settings tab · Text | △ Partial | G2-008 A · G2-158 D |
| 6883:75963 | CD·Inspector · Settings tab · Image | △ Partial | G2-008 A · G2-145 A (+ E code) · G2-158 D |
| 6883:76283 | CD·Inspector · Settings tab · Button | △ Partial | G2-008 A · G2-156 A (+ E code) · G2-158 D |
| 6883:76603 | CD·Inspector · Settings tab · Text · Price (static) | △ Partial | G2-155 B · G2-137 D |
| 6887:70589 | CD·Inspector · Effects tab · Text | ✓ Code | G2-155 B |
| 6887:70898 | CD·Inspector · Effects tab · Image | ✓ Code | G2-155 B |
| 6887:71207 | CD·Inspector · Effects tab · Button | ✓ Code | G2-155 B |
| 6887:71516 | CD·Inspector · Effects tab · Form | ✓ Code | G2-155 B |
| 6887:71825 | CD·Inspector · Effects tab · Slider | ✓ Code | G2-155 B |
| 6887:74333 | CD·Inspector · Style tab (Beginner · expanded) | △ Partial | G2-137 D |
| 6894:74290 | CD·Inspector · Style tab · Form | △ Partial | G2-155 B · G2-137 D |
| 6894:74644 | CD·Inspector · Style tab · Slider | △ Partial | G2-155 B · G2-137 D |
| 7056:78382 | CD·Inspector · TYPOGRAPHY expanded | ✓ Code | G2-152 A |
| 7056:78695 | CD·Inspector · BACKGROUND expanded | ✓ Code | G2-153 B |
| 7056:79008 | CD·Inspector · BORDER expanded | ✓ Code | G2-154 A (+ E code) |
| 7058:78647 | CD·Inspector · POSITION expanded | ✓ Code | G2-147 A (+ E in Figma) |
| 7058:78974 | CD·Inspector · GRID expanded | ✓ Code | G2-149 A |
| 7058:79301 | CD·Inspector · ADVANCED CSS expanded | △ Partial | G2-160 D |
| 7063:78923 | CD·Inspector · Settings · ADVANCED expanded | △ Partial | G2-158 D |
| 7063:79200 | CD·Inspector · Settings · CONTENT · From CMS | △ Partial | G2-055 D · G2-144 E (Figma) · D |
| 7075:79085 | CD·Inspector · Effects · BLUR expanded | ✓ Code | G2-155 B |
| 4428:150081 | SS·v3 · Brand | ✗ Dummy | G3-158 F |
| 4418:168885 | CD·Brand workspace · Import / export | ✓ Code | G3-148 A |
| 6466:6 | [not-implemented] · Brand · Loading (placeholder — skeleton lives in S | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 6466:10 | [not-implemented] · Brand · Error (placeholder — note/error lives in S | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 7315:80955 | CD·Brand workspace · Colours | △ Partial | G3-094 A · G3-120 D · E · G3-121 D · G3-128 D · G3-131 A · G3-134 D · G3-136 D |
| 7316:80949 | CD·Brand workspace · Colour mode | △ Partial | G1-106 A (EN-13) · F (EN-14, EN-15) · G3-146 D |
| 7316:81551 | CD·Brand workspace · Fonts & type styles | △ Partial | G3-135 D · E |
| 7316:82153 | CD·Brand workspace · Styles | △ Partial | G3-119 D · PLANNED · G3-142 C · NOT IMPLEMENTED · E |
| 7316:82755 | CD·Brand workspace · Component styles | △ Partial | G3-119 D · PLANNED · G3-145 A (LIMITED) |
| 7316:83357 | CD·Brand workspace · Classes | △ Partial | G3-144 D |
| 7316:83953 | CD·Brand workspace · Presets | ✓ Code | G3-141 A (LIMITED) |
| 7316:84555 | CD·Brand workspace · Brand checks | △ Partial | G3-132 D · G3-136 D · G3-147 D |
| 7316:85139 | CD·Brand workspace · Starters | ✓ Code | G3-143 A |
| 4433:46540 | CD·Rail · tooltip · Add | △ Partial | G1-089 D |
| 4433:141887 | SS·v3 · Discoverability | △ Partial | G1-089 D · G1-120 — (scaffold) |
| 4418:155920 | Assets · Create folder | ✓ Code | G3-038 A |
| 4418:154613 | CD·Assets · discard | ✓ Code | G3-059 A · E |
| 4418:157583 | Assets · Confirm delete · hero-dark.jpg | △ Partial | G3-030 D · E |
| 4418:158225 | Assets · Confirm delete · team-photo.jpg | △ Partial | G3-030 D · E |
| 4418:157797 | Assets · Confirm delete · menu-cover.png | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:158011 | Assets · Confirm delete · chef-intro.mp4 | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:158439 | Assets · Confirm delete · logo-mark.svg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:158653 | Assets · Confirm delete · pasta-closeup.jpg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:158867 | Assets · Confirm delete · grand-opening.mp4 | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:159081 | Assets · Confirm delete · star-icon.svg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:159295 | Assets · Confirm delete · Inter-Var.woff2 | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:159509 | Assets · Confirm delete · terrace-night.jpg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:156160 | Assets · Delete selected files confirmation | △ Partial | G3-030 D · E |
| 4418:60734 | CD·Media · Replacement file selected · confirm upload | ✓ Code | G3-016 A |
| 4418:59209 | CD·Media · modal · replace-across-site | △ Partial | G3-027 D · G3-053 A · E |
| 4418:154178 | CD·Assets · Replacing image | △ Partial | G3-027 D |
| 4418:154192 | CD·Assets · Retrying failed use | △ Partial | G3-027 D |
| 4418:159960 | Assets · Applying saved version | ✓ Code | G3-050 A |
| 4418:149321 | CD·S3.6 · media · image-editor (modal) | ✓ Code | G1-115 A (G3) · G3-025 A · G3-059 A · E |
| 4418:149547 | CD·S3.6 · media · optimise (drill-in) | △ Partial | G3-026 D · E · G3-053 A · E |
| 4418:149408 | CD·Assets · Image editor · Adjust | ✓ Code | G3-059 A · E |
| 4418:149498 | CD·Assets · Image editor · Resize | ✓ Code | G3-059 A · E |
| 4418:149620 | CD·Assets · Image editor · Saved | ✓ Code | G3-050 A · G3-059 A · E |
| 4418:154231 | CD·Image editor · crop · unsaved | ✓ Code | G3-059 A · E |
| 4418:154275 | CD·Image editor · adjust · unsaved | ✓ Code | G3-059 A · E |
| 4418:154331 | CD·Image editor · resize · unsaved | ✓ Code | G3-059 A · E |
| 4418:154375 | CD·Image editor · optimise · unsaved | ✓ Code | G3-059 A · E |
| 4418:154418 | CD·Image editor · unlocked · unsaved | ✓ Code | G3-059 A · E |
| 4418:154462 | CD·Image editor · invalid · unsaved | ✓ Code | G3-059 A · E |
| 4418:154506 | CD·Image editor · flipped · unsaved | ✓ Code | G3-059 A · E |
| 4418:154550 | CD·Image editor · jpeg · unsaved | ✓ Code | G3-059 A · E |
| 4418:157155 | Image editor · 1:1 · unsaved | ✓ Code | G3-059 A · E |
| 4418:157199 | Image editor · 16:9 · unsaved | ✓ Code | G3-059 A · E |
| 4418:157243 | Image editor · Flip V · unsaved | ✓ Code | G3-059 A · E |
| 4418:157287 | Image editor · Rotate 90° · unsaved | ✓ Code | G3-059 A · E |
| 4418:157331 | Image editor · Zoom 150% · unsaved | ✓ Code | G3-059 A · E |
| 4418:149891 | CD·Assets · Move selected files | ✓ Code | G3-012 B · G3-058 A |
| 4418:149309 | CD·Assets · Site fonts | ✓ Code | G3-054 A |
| 4418:149160 | CD·Assets · Picker upload | △ Partial | G3-061 D · E |
| 4418:149235 | CD·Assets · Picker upload complete | △ Partial | G3-061 D · E |
| 4418:154195 | CD·Assets · Stock assets | △ Partial | G3-036 D |
| 4418:154166 | CD·Assets · Image imported | ✓ Code | G3-034 A |
| 4418:154172 | CD·Assets · Image could not be imported | ✓ Code | G3-034 A |
| 4418:154212 | CD·Assets · Font added | ✓ Code | G3-054 A |
| 4418:154181 | CD·Assets · Replacement complete | △ Partial | G3-027 D |
| 4418:154186 | CD·Assets · Some uses could not update | △ Partial | G3-027 D |
| 4418:154206 | CD·Assets · Stock image saved | △ Partial | G3-036 D |
| 4418:154224 | CD·Assets · Apply saved version across site | ✓ Code | G3-050 A |
| 4418:154593 | CD·Assets · versions | ✓ Code | G3-050 A |
| 4418:154632 | CD·Asset versions · v2 applied | ✓ Code | G1-117 A · G3-050 A |
| 4418:154608 | CD·Assets · failure | ✓ Code | G3-059 A · E |
| 4418:154656 | Adjust Brightness · representative values | ✓ Code | G3-059 A · E |
| 4418:154663 | Adjust Contrast · representative values | ✓ Code | G3-059 A · E |
| 4418:154670 | Adjust Saturation · representative values | ✓ Code | G3-059 A · E |
| 4418:154677 | Adjust Blur · representative values | ✓ Code | G3-059 A · E |
| 4418:154648 | Resize dimensions · prototype values | ✓ Code | G3-059 A · E |
| 4418:154618 | CD·Asset versions · original selected | ✓ Code | G3-050 A |
| 4418:156174 | Assets · Rename · hero-dark.jpg | ✓ Code | G3-052 A · E |
| 4418:156165 | Assets · Download ready | ✓ Code | G3-047 A · G3-148 A |
| 4418:156192 | Assets · Rename · team-photo.jpg | ✓ Code | G3-052 A · E |
| 4418:156140 | Assets · Rename asset | ✓ Code | G3-052 A · E |
| 4418:155713 | Assets · Move · Products selected | ✓ Code | G3-058 A |
| 4418:155719 | Assets · Move · Hero shots selected | ✓ Code | G3-058 A |
| 4418:156180 | Assets · Rename · menu-cover.png | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:156186 | Assets · Rename · chef-intro.mp4 | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:156198 | Assets · Rename · logo-mark.svg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:156204 | Assets · Rename · pasta-closeup.jpg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:156210 | Assets · Rename · grand-opening.mp4 | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:156216 | Assets · Rename · star-icon.svg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:156222 | Assets · Rename · Inter-Var.woff2 | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:156228 | Assets · Rename · terrace-night.jpg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:155725 | Assets · Move · failed | ✓ Code | G3-058 A |
| 4418:155926 | Assets · Folder name error | ✓ Code | G3-038 A |
| 4418:156146 | Assets · Rename complete | ✓ Code | G3-052 A · E |
| 4418:156169 | Assets · Rename validation | ✓ Code | G3-052 A · E |
| 4418:159963 | Assets · Saved version applied | ✓ Code | G3-050 A |
| 4418:59624 | CD·Assets · Import image from URL | △ Partial | G3-034 A · G3-061 D · E |
| 4418:161187 | Upload files | △ Partial | G3-015 D · G3-035 A |
| 4418:161153 | Asset details · pasta-2-small.jpg | △ Partial | G2-136 D · G3-065 F |
| 4418:161163 | Asset details · hero-imported.jpg | △ Partial | G2-136 D · G3-065 F |
| 4418:161173 | Asset details · restaurant-interior.jpg | △ Partial | G2-136 D · G3-065 F |
| 4418:160621 | Image picker · hero-imported.jpg selected | △ Partial | G3-061 D · E |
| 4418:160887 | Image picker · restaurant-interior.jpg selected | △ Partial | G3-061 D · E |
| 4418:161193 | Upload complete | ✓ Code | G3-035 A |
| 4418:162342 | Assets · Move team-photo.jpg | ✓ Code | G3-058 A |
| 4418:162327 | Assets · Asset URL | ✗ Dummy | G3-065 F |
| 4418:162332 | Assets · Alt text | ✗ Dummy | G3-065 F |
| 4418:162337 | Assets · No site references | ✗ Dummy | G3-065 F |
| 4418:163352 | Video · Replace chef source | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:163384 | Video · Chef no references | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:163377 | Video · Replace grand-opening source | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:163364 | Video · No references to replace | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:163359 | Video · Replacement completed | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:160495 | CMS · Margherita dynamic page preview · saved record | △ Partial | G3-069 D · E |
| 4418:61914 | CD·Media · Browse icons | △ Partial | G3-028 A · G3-060 D · E |
| 6823:59907 | S·Assets · Stock assets · no results | △ Partial | G3-036 D |
| 6823:59936 | S·Assets · Stock assets · search failed | △ Partial | G3-036 D |
| 6823:59965 | S·Assets · Stock assets · not connected | △ Partial | G3-036 D |
| 6840:62903 | S·Assets · Stock assets · rest | △ Partial | G3-036 D |
| 6840:62938 | S·Assets · Stock assets · searching | △ Partial | G3-036 D |
| 6840:63150 | S·Icons · searching "arrow" | ✓ Code | G3-028 A |
| 6881:64272 | Assets · Delete selected files · drawer bulk | △ Partial | G3-013 D · G3-030 D · E |
| 6881:64282 | CD·Media · Files deleted (toast) · drawer bulk | △ Partial | G3-013 D |
| 6881:70624 | CD·Media · File deleted (toast) · hero-dark.jpg | ✓ Code | G3-053 A · E |
| 6881:70642 | CD·Media · File deleted (toast) · team-photo.jpg | ✓ Code | G3-053 A · E |
| 6881:70660 | CD·Media · File deleted (toast) · menu-cover.png | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 6881:70678 | CD·Media · File deleted (toast) · chef-intro.mp4 | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 6881:70696 | CD·Media · File deleted (toast) · logo-mark.svg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 6881:72971 | CD·Media · File deleted (toast) · pasta-closeup.jpg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 6881:72988 | CD·Media · File deleted (toast) · grand-opening.mp4 | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 6881:73005 | CD·Media · File deleted (toast) · star-icon.svg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 6881:73022 | CD·Media · File deleted (toast) · Inter-Var.woff2 | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 6881:73039 | CD·Media · File deleted (toast) · terrace-night.jpg | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 6881:73056 | CD·Media · Files deleted (toast) · bulk 2 · list | ✓ Code | G3-053 A · E |
| 6881:74018 | CD·Media · Files deleted (toast) · bulk 6 · list | ✓ Code | G3-053 A · E |
| 6881:74033 | Assets · Delete 6 selected files confirmation | △ Partial | G3-013 D · G3-030 D · E |
| 6881:86010 | CD·Assets · Uploading (overlay) | △ Partial | G3-015 D |
| 6881:86024 | CD·Assets · Upload failed (overlay) | △ Partial | G3-015 D · G3-062 A |
| 6883:72799 | CD·Media · Icon inserted (toast) | ✓ Code | G3-028 A |
| 6883:72820 | CD·Assets · Picker · menu-cover.png selected | △ Partial | G3-061 D · E |
| 6883:72901 | CD·Assets · Picker · team-photo.jpg selected | △ Partial | G3-061 D · E |
| 6883:75481 | CD·Assets · Stock assets · filter Orientation: Landscape | △ Partial | G3-036 D |
| 6883:75509 | CD·Assets · Stock assets · filter Colour: Warm | △ Partial | G3-036 D |
| 6883:75537 | CD·Assets · Stock assets · filter Type: Photo | △ Partial | G3-036 D |
| 6883:75565 | CD·Assets · Stock assets · result selected | △ Partial | G3-036 D |
| 6940:79709 | CD·Media · Replace across site · Menu excluded (SA-fix) | △ Partial | G3-027 D |
| 6940:79749 | CD·Media · Replace across site · Home excluded (SA-fix) | △ Partial | G3-027 D |
| 6998:77880 | CD·Stock assets · Orientation menu (SA-fix) | △ Partial | G3-036 D |
| 6930:79973 | CD·Media · Folder picker (▾ popover) (SA-fix) | ✓ Code | G3-004 A |
| 6930:79997 | CD·Assets · Pick mode · Folder picker (▾ popover) (SA-fix) | △ Partial | G3-004 A · G3-008 D |
| 6930:80016 | CD·CMS · Pick mode · Folder picker (▾ popover) (SA-fix) | ✗ Dummy | G3-081 C · NOT IMPLEMENTED |
| 6930:80054 | CD·Media · Sort menu (▾ popover) (SA-fix) | ✓ Code | G3-045 A |
| 6930:80106 | CD·Media · Version row menu (⋯) (SA-fix) | △ Partial | G3-024 D |
| 7056:78348 | S·Brand · colour row hover | ✓ Code | G3-131 A |
| 7056:78356 | MENU · Brand · ⋯ | △ Partial | G3-148 A · G3-150 C · NOT IMPLEMENTED |
| 7077:79171 | S·Media · filter popover | △ Partial | G3-005 D |
| 7077:79204 | S·Media · upload popover | △ Partial | G3-020 D |
| 7077:79219 | S·Media · tooltip · upload formats | △ Partial | G3-015 D · G3-062 A |
| 7077:79223 | S·Media · drawer ⋯ menu | ✓ Code | G3-011 A |
| 7084:78402 | S·Media · tile hover | △ Partial | G3-006 D |
| 7093:78182 | S·Media library · filter popover | △ Partial | G3-043 D |
| 7093:78204 | S·Media library · grid popover | ✓ Code | G3-044 A |
| 7093:78219 | S·Media library · ⋯ menu | ✓ Code | G3-045 A |
| 7093:78230 | S·Media library · upload popover | ✓ Code | G3-034 A |
| 7093:78242 | S·Media library · details ⋯ menu | ✓ Code | G3-053 A · E |
| 7093:78256 | S·Media library · tags popover | △ Partial | G3-040 D |
| 7096:76270 | MENU · CMS · collection ⋯ | △ Partial | G3-068 D · E |
| 7103:76270 | MENU · CMS · record ⋯ | △ Partial | G3-070 D |
| 4418:54243 | CD·Templates · Create Restaurant page / confirm | ✓ Code | G2-101 A |
| 4418:126882 | CD·Keyboard legend | △ Partial | G1-009 B · G1-026 D · E · G1-089 D · G1-091 D · G2-037 D · G2-039 D · G2-047 D · G2-091 A |
| 4418:165478 | CD·Unsaved settings | △ Partial | G1-090 A (widths UNVERIFIED) · G3-090 D |
| 4418:165469 | CD·Settings saved | ✓ Code | G3-091 A |
| 4418:165473 | CD·Settings could not save | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:165483 | CD·Edit social profile | ✓ Code | G3-098 A |
| 4418:165492 | CD·Add a domain | ✓ Code | G3-102 A |
| 4418:165501 | CD·Verify www.bellacucina.com | ✓ Code | G3-102 A |
| 4418:165510 | CD·DNS records not found yet | ✓ Code | G3-102 A |
| 4418:165516 | CD·Domain verified | ✓ Code | G3-102 A |
| 4418:165520 | CD·Add locale | ✓ Code | G3-099 A |
| 4418:165527 | CD·Spanish locale created | ✓ Code | G3-099 A |
| 4418:165532 | CD·French · Translation checklist | ✓ Code | G3-099 A |
| 4418:165539 | CD·Arabic · Translation checklist | ✓ Code | G3-099 A |
| 4418:165544 | CD·Translate Contact | ✗ Dummy | G3-100 C · NOT IMPLEMENTED |
| 4418:165556 | CD·Contact translation saved | ✗ Dummy | G3-100 C · NOT IMPLEMENTED |
| 4418:165988 | CD·Ali’s Studio · Members | △ Partial | G3-095 D |
| 4418:165995 | CD·Ali’s Studio · Billing | △ Partial | G3-095 D |
| 4418:173595 | CD·Translate Menu | ✗ Dummy | G3-100 C · NOT IMPLEMENTED |
| 4418:173607 | CD·French translation complete | ✗ Dummy | G3-100 C · NOT IMPLEMENTED |
| 4418:175116 | CD·Export · Preparing | △ Partial | G3-113 D |
| 4418:165727 | CD·Export · Ready | △ Partial | G3-113 D |
| 4418:165733 | CD·Export · Failed | △ Partial | G3-113 D |
| 4418:165739 | CD·Preview · Share link | △ Partial | G1-022 D |
| 4418:133026 | CD·Permissions | △ Partial | G1-021 D · G1-062 D |
| 5890:44728 | CD·Permissions · Delete site · confirm | ✗ Dummy | G1-123 C · NOT IMPLEMENTED (editor) |
| 5891:44701 | CD·Permissions · Delete site · typed DELETE | ✗ Dummy | G1-123 C · NOT IMPLEMENTED (editor) |
| 4418:127239 | CD·Site menu · Duplicate site? (modal) | ✗ Dummy | G1-028 C · NOT IMPLEMENTED (editor) |
| 4418:145075 | CD·Ecommerce · collection-setup (modal) | ✓ Code | G1-100 A · G3-115 A |
| 4418:145168 | CD·Ecommerce · Products collection already exists | ✓ Code | G1-100 A · G3-115 A |
| 4418:125416 | CD·Exit · Unsaved page changes | △ Partial | G1-003 D |
| 4418:125427 | CD·Exit · Offline with unsaved changes | △ Partial | G1-003 D · G1-083 D |
| 4418:97069 | CD·Export · HTML (modal) | △ Partial | G1-018 A (door) · G3-094 A · G3-113 D |
| 4418:98036 | CD·Site menu · Unpublished (modal · 560) | △ Partial | G1-051 D · G1-017 D |
| 4418:54252 | CD·Templates · Create Menu 2 / confirm | ✓ Code | G2-101 A |
| 4418:54262 | CD·Templates · Create Landing page / confirm | ✓ Code | G2-101 A |
| 4418:54271 | CD·Templates · Replace Home with Restaurant / confirm | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:54284 | CD·Templates · Replace Home with Bistro Menu / confirm | △ Partial | G2-098 D |
| 4418:56203 | CD·Templates · Replace Home with Bistro Landing / confirm | △ Partial | G2-098 D |
| 4418:56225 | CD·Templates · Create Autumn menu layout page / confirm | ✓ Code | G2-101 A |
| 4418:56235 | CD·Templates · Replace Home with Autumn menu layout / confirm | △ Partial | G2-098 D |
| 4418:55942 | CD·Templates · Create Menu 2 · couldn’t create | ✓ Code | G2-101 A |
| 4418:56185 | CD·Templates · Create Restaurant · couldn’t create | ✓ Code | G2-101 A |
| 4418:56194 | CD·Templates · Create Landing · couldn’t create | ✓ Code | G2-101 A |
| 4418:56216 | CD·Templates · Create Autumn menu layout · couldn’t create | ✓ Code | G2-101 A |
| 4418:53868 | CD·Templates · save-as-template (modal) | △ Partial | G1-101 A · G2-103 D |
| 4418:57460 | CD·Home backup ready · Autumn menu layout | ✓ Code | G2-101 A · G2-099 A |
| 4418:57466 | CD·Home backup ready | ✓ Code | G2-101 A · G2-099 A |
| 4418:57472 | CD·Home backup failed · Bistro Menu | ○ Planned | G2-100 C PLANNED |
| 4418:57478 | CD·Home backup ready · Bistro Menu | ✓ Code | G2-101 A · G2-099 A |
| 4418:57484 | CD·Home backup failed · Restaurant | ○ Planned | G2-100 C PLANNED |
| 4418:57490 | CD·Home backup ready · Bistro Landing | ✓ Code | G2-101 A · G2-099 A |
| 4418:57496 | CD·Home backup failed · Bistro Landing | ○ Planned | G2-100 C PLANNED |
| 4418:57502 | CD·Home backup failed · Autumn menu layout | ○ Planned | G2-100 C PLANNED |
| 4418:57508 | CD·Templates · Couldn’t apply the template to Home · Restaurant | ✓ Code | G2-099 A |
| 4418:57513 | CD·Templates · Couldn’t apply the template to Home · Bistro Menu | ✓ Code | G2-099 A |
| 4418:57518 | CD·Templates · Couldn’t apply the template to Home · Bistro Landing | ✓ Code | G2-099 A |
| 4418:57523 | CD·Templates · Couldn’t apply the template to Home · Autumn menu layou | ✓ Code | G2-099 A |
| 4428:149521 | CD·Templates · replace confirm · Menu | △ Partial | G2-098 D |
| 4428:151964 | CD·Templates · replace · backup failed · Menu | ○ Planned | G2-100 C PLANNED |
| 4428:151976 | CD·Templates · replace · couldn’t apply · Menu | ✓ Code | G2-099 A |
| 4430:141135 | CD·Templates · replace · backup ready · Menu | ✓ Code | G2-099 A |
| 6752:59256 | CD·Pages · New page (modal) | △ Partial | G2-074 D |
| 6752:59365 | CD·Pages · New page (modal) · blank selected | △ Partial | G2-074 D |
| 4418:93099 | CD·Pages · Delete “Menu”? · confirm | ✗ Dummy | G2-079 A (+ C DESIGN-ONLY reference |
| 5890:44719 | CD·Layers · Delete element? · confirm | △ Partial | G2-067 D |
| 4418:142410 | CD·Components · delete-confirm (modal) | △ Partial | G2-122 D |
| 4418:143361 | CD·Detach Menu card instances · confirmation | △ Partial | G2-122 D |
| 4418:143366 | CD·Update Menu card master · confirmation | △ Partial | G2-122 D |
| 4418:82847 | CD·Layers · Move Heading to page | △ Partial | G2-067 D |
| 5905:139737 | CD·Canvas · Delete Hero? · confirm | △ Partial | G2-051 D · G2-139 D |
| 5930:44824 | CD·Canvas · Custom width | ✗ Dummy | G2-014 C NOT IMPLEMENTED |
| 4418:173587 | CD·History · Saved version details | ✓ Code | G1-070 A (minor) · G2-172 A |
| 4418:74511 | CD·Restore saved draft · confirmation | △ Partial | G1-071 D · G2-172 A |
| 4418:165661 | CD·History · Save named version | ✓ Code | G1-070 A (minor) · G2-172 A |
| 4418:172775 | CD·Review round history | △ Partial | G1-060 D |
| 4418:120052 | CD·Send a new review link · resend | △ Partial | G1-031 D · G1-058 D |
| 4418:120059 | CD·Send a new review link · resendRevoked | △ Partial | G1-031 D · G1-058 D |
| 4418:98016 | CD·Site menu · Unpublish confirm (modal · 560) | △ Partial | G1-017 D · G1-051 D |
| 4418:98003 | CD·Publish log · Bella Cucina / Production | ✓ Code | G1-049 A |
| 4418:98009 | CD·Reconnect Vercel · Workspace | ✓ Code | G1-049 A |
| 4418:172783 | CD·Bella Cucina · Published | △ Partial | G1-033 D |
| 4418:172789 | CD·Bella Cucina · Form submission | △ Partial | G1-033 D |
| 4418:172794 | CD·Open Osteria notification? | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:172799 | CD·Osteria · Publish failed | ✗ Dummy | hidden 21 Sep 2026 (Batch 8 zero-inbound clones, or owner decisions — dump/hide-safe.json) |
| 4418:173685 | CD·Brand · Rename token | △ Partial | G3-137 D |
| 4418:173707 | CD·Brand · Token renamed | △ Partial | G3-137 D |
| 4418:173718 | CD·Brand · Delete token? | △ Partial | G3-138 D |
| 6765:60363 | CD·Brand · Delete token? · typed DELETE | △ Partial | G3-138 D |
| 4418:175027 | CD·Brand · Where the token is used | △ Partial | G3-136 D |
| 4418:175066 | CD·Brand · Workspace theme | ✗ Dummy | G3-150 C · NOT IMPLEMENTED |
| 4418:175105 | CD·Brand · Workspace theme applied | △ Partial | G3-123 D · G3-150 C · NOT IMPLEMENTED |
| 4418:176596 | CD·Brand · Token deleted | △ Partial | G3-138 D |
| 4418:173732 | CD·Brand · Token in use — cannot delete | △ Partial | G3-138 D |
| 4418:160591 | Typography · Choose heading family | △ Partial | G2-152 A · G3-135 D · E |
| 4418:84646 | CD·CMS · New collection (modal) | △ Partial | G3-067 D |
| 4418:88263 | CD·CMS · Collection name already exists | △ Partial | G3-067 D |
| 4757:150118 | S·CMS · Delete collection? | ✗ Dummy | G3-073 C · NOT IMPLEMENTED |
| 6758:59135 | S·CMS · Delete collection? · typed DELETE | ✗ Dummy | G3-073 C · NOT IMPLEMENTED |
| 4418:164208 | CD·Add field · Menu items | △ Partial | G3-071 D |
| 4418:164219 | CD·Configure text field | △ Partial | G3-071 D |
| 4418:164225 | CD·Field key already exists | △ Partial | G3-071 D |
| 4418:164230 | CD·Configure Number field | △ Partial | G3-071 D |
| 4418:164236 | CD·Configure Rich text field | △ Partial | G3-071 D |
| 4418:164242 | CD·Configure Image field | △ Partial | G3-071 D |
| 4418:164248 | CD·Configure Boolean field | △ Partial | G3-071 D |
| 4418:164254 | CD·Configure Reference field | △ Partial | G3-071 D |
| 4418:164260 | CD·Configure Slug field | △ Partial | G3-071 D |
| 4418:164266 | CD·Name · field settings | △ Partial | G3-071 D |
| 4418:164271 | CD·Configure generated pages | △ Partial | G3-072 D |
| 4418:164278 | CD·Unknown URL field | △ Partial | G3-072 D |
| 4418:164283 | CD·Generated pages · Menu items | △ Partial | G3-072 D |
| 4418:165094 | CD·Products · CMS collection (sample data) | ✓ Code | G3-115 A |
| 4418:165103 | CD·Sample product · Margherita | ✓ Code | G3-115 A |
| 4418:165107 | CD·Sample product · Quattro Formaggi | ✓ Code | G3-115 A |
| 4418:165111 | CD·Sample product · Diavola | ✓ Code | G3-115 A |
| 4418:165115 | CD·Price · Field settings | △ Partial | G3-071 D |
| 4418:165122 | CD·Description · Field settings | △ Partial | G3-071 D |
| 4418:165128 | CD·Photo · Field settings | △ Partial | G3-071 D |
| 4418:165134 | CD·Spicy · Field settings | △ Partial | G3-071 D |
| 4418:165140 | CD·Category · Field settings | △ Partial | G3-071 D |
| 4418:165146 | CD·Slug · Field settings | △ Partial | G3-071 D |
| 4418:165152 | CD·Available · Field settings | △ Partial | G3-071 D |
| 4418:165425 | CD·CMS · Delete field? | △ Partial | G3-071 D |
| 4418:165439 | CD·CMS · Field in use — cannot delete | △ Partial | G3-071 D |
| 4418:165458 | CD·CMS · Field deleted | △ Partial | G3-071 D |
| 4428:142922 | CD·Inspector · Fill picker | △ Partial | G2-161 A (+ F) · G2-162 D · G3-122 D · G3-155 D · G3-156 D |
| 4428:142968 | CD·Inspector · Fill picker · Edit Primary | △ Partial | G2-162 D · G3-120 D · E · G3-155 D |
| 4428:149324 | CD·Brand · Swatch picker | △ Partial | G3-140 D · E · G3-158 F |
| 4418:175002 | CD·Brand · Set dark-mode value | △ Partial | G2-164 F (inspector side) · G3-146 D |
| 4418:160610 | Typography · Brand inspector font picker | △ Partial | G3-135 D · E |
| 4418:109843 | CD·Inspector · Animation preset · Entrance (popover) | △ Partial | G2-157 A (+ E both sides) · G3-117 D · E |
| 4418:109912 | CD·Inspector · Animation preset · Attention (popover) | △ Partial | G2-157 A (+ E both sides) · G3-117 D · E |
| 4418:109972 | CD·Inspector · Animation preset · Exit (popover) | △ Partial | G2-157 A (+ E both sides) · G3-117 D · E |
| 4418:141220 | CD·Commands · navigation and page actions (⌘K) | △ Partial | G1-010 D · G1-016 E · G1-092 A (subset) · G1-093 D · E · G2-016 D · G2-038 E · G2-090 E (Figma-side stale entr |
| 4418:141188 | CD·Commands · no results | △ Partial | G1-093 D · E · G2-038 E |
| 4418:141171 | CD·Commands · search results | △ Partial | G1-093 D · E · G2-038 E · G2-083 E |
| 4418:145128 | CD·Ecommerce · bind · popover · collections | △ Partial | G2-144 E (Figma) · D · G3-078 D · E |
| 4418:145137 | CD·Ecommerce · bind · popover · fields | △ Partial | G3-078 D · E |
| 4418:145100 | CD·Ecommerce · bound · inspector | △ Partial | G3-078 D · E |
| 6749:58662 | CD·Issues · Issue resolved (toast) | △ Partial | G1-081 D · G1-088 D |
| 6561:54690 | CD·CMS · Record saved (toast) | △ Partial | G3-069 D · E |
| 6561:54716 | CD·Media · Asset inserted (toast) | ✓ Code | G3-007 A · G3-051 A |
| 4418:145121 | CD·Ecommerce · collection-created · toast | ✓ Code | G1-100 A · G3-115 A |
| 4418:165677 | CD·History · Version saved | △ Partial | G1-070 A (minor) · G1-081 D · G2-172 A |
| 6823:59790 | CD·Inspector · Fill picker · Advanced (18 tokens · search shown) | △ Partial | G2-162 D · G3-122 D · G3-155 D |
| 6840:62765 | S·Fill picker · Advanced · searching "prim" | △ Partial | G2-162 D · G3-132 D · G3-155 D |
| 6879:67190 | CD·CMS · Discard record changes? | △ Partial | G3-069 D · E |
| 6879:67202 | CD·Revoke review link · confirm (wrapped overlay) | △ Partial | G1-059 D |
| 6881:65462 | CD·Brand · Discard brand changes? (confirm) | △ Partial | G3-125 D |
| 6881:70349 | CD·CMS · Delete record? · Margherita | △ Partial | G3-070 D |
| 6881:70368 | CD·CMS · Delete record? · Margherita · typed DELETE | △ Partial | G3-070 D |
| 6881:70387 | CD·CMS · Record deleted (toast) | △ Partial | G3-070 D |
| 6881:70883 | CD·History · Published version details · v5 | △ Partial | G1-052 D · G2-177 A |
| 6881:71292 | CD·History · Published · v5 row menu (⋯) | △ Partial | G1-052 D · G2-177 A |
| 6881:71312 | CD·Brand · Export ready (toast) | △ Partial | G3-123 D · G3-148 A |
| 6881:79700 | CD·CMS · Collection deleted (toast) | ✗ Dummy | G3-073 C · NOT IMPLEMENTED |
| 6881:86167 | CD·CMS · Connect a source | ✗ Dummy | G3-074 D · C (Sheets: NOT IMPLEMENT |
| 6887:73801 | CD·Pages · Page settings saved (toast) | △ Partial | G2-086 D |
| 6887:73809 | CD·Pages · Page settings · Menu · SEO (modal) | △ Partial | G2-086 D · G2-087 D · G2-136 D |
| 6887:73848 | CD·Pages · Page settings · Menu · Social (modal) | △ Partial | G2-086 D · G2-088 D |
| 6887:73882 | CD·Pages · Page settings · Menu · Advanced (modal) | △ Partial | G2-086 D · G2-089 D |
| 6887:75724 | CD·Pages · Page settings · Our story · URL updated (modal) | △ Partial | G2-076 D |
| 6887:75760 | CD·Pages · Page settings · Our menu · URL updated (modal) | △ Partial | G2-076 D |
| 6887:75796 | CD·Pages · Page settings · Contact · missing title (modal) | △ Partial | G2-086 D |
| 6887:76905 | CD·Inspector · State menu (Default / :hover) | ✓ Code | G2-143 A |
| 6887:77911 | CD·Pages · Delete 3 pages? · confirm | ✓ Code | G2-081 A |
| 6887:77925 | CD·Pages · Move 3 pages to… (modal) | ✓ Code | G2-081 A |
| 6887:78291 | CD·Layers · Delete 3 elements? · confirm | △ Partial | G2-068 D |
| 6887:78306 | CD·Layers · Detach this Menu card instance? · confirm | △ Partial | G2-069 D |
| 6887:78320 | CD·Add · Paste HTML · modal | △ Partial | G2-112 D |
| 6887:79128 | CD·Pages · Page settings · Get in touch · URL updated (modal) | △ Partial | G2-076 D |
| 6894:73834 | CD·Settings · Submission deleted (toast) | △ Partial | G3-084 D · PARTIALLY IMPLEMENTED · G3-085 A (ceiling shared with G3-08 |
| 6902:73326 | CD·History · Saved · v3 row menu (⋯) | ✓ Code | G1-070 A (minor) · G2-172 A |
| 6918:73322 | CD·Inspector · Element menu (⋯) (SA-fix) | △ Partial | G2-024 D · G2-054 D · G2-139 D |
| 6918:74827 | CD·Inspector · Variant menu (Small / Medium / Large) (SA-fix) | ✓ Code | G2-125 A |
| 6930:79853 | CD·Compare · version picker (SA-fix) | △ Partial | G1-061 D · E · G2-173 A (+ B) |
| 6930:79873 | CD·History · Saves · author filter (SA-fix) | △ Partial | G1-075 C · PARTIALLY IMPLEMENTED · G2-170 D |
| 6930:80035 | CD·CMS · Dynamic pages · Template picker (SA-fix) | △ Partial | G3-072 D |
| 6930:80089 | CD·CMS · Team · Dynamic pages · Template picker (SA-fix) | △ Partial | G3-072 D |
| 6930:80353 | CD·Inspector · From CMS · Collection picker (SA-fix) | △ Partial | G2-144 E (Figma) · D · G3-078 D · E |
| 6930:80373 | CD·Inspector · From CMS · Field picker (SA-fix) | △ Partial | G2-144 E (Figma) · D · G3-078 D · E |
| 6930:80493 | CD·CMS · Field inspector · Type picker (SA-fix) | △ Partial | G3-071 D |
| 6930:80567 | CD·CMS · Sources / Variables · row menu (⋯) (SA-fix) | △ Partial | G3-074 D · C (Sheets: NOT IMPLEMENT · G3-075 A (+ annotation) |
| 6930:82577 | CD·History · Saves · version row menu (⋯) (SA-fix) | ✓ Code | G1-070 A (minor) · G2-172 A |
| 6930:82841 | CD·Preview · Link copied (toast) (SA-fix) | △ Partial | G1-022 D · G1-081 D |
| 6940:79789 | CD·CMS · New collection · field removed (SA-fix) | △ Partial | G1-099 D (G3 owns) · G3-067 D |
| 6964:80863 | CD·Inspector · Display-mode menu (Block ▾) (SA-fix) | ✓ Code | G2-147 A (+ E in Figma) · G2-150 A |
| 6964:80888 | CD·Brand · Dark-strategy menu (SA-fix) | ✓ Code | G3-148 A |
| 6979:77597 | CD·Inspector · Reset to master? (SA-fix) | ✓ Code | G2-125 A |
| 6988:77747 | CD·Brand · Copied to clipboard (toast) (SA-fix) | ✓ Code | G3-148 A |
| 6971:77663 | CD·Components · scope picker (▾ popover) (SA-fix) | △ Partial | G2-118 D |
| 7045:77972 | S·Publish · ⋯ menu | △ Partial | G1-016 E · G1-051 D |
| 7045:77984 | S·Publish · primary tooltip | △ Partial | G1-043 D |
| 7048:77970 | S·Inspector · applies-to | ✓ Code | G2-141 A |
| 7048:77991 | CD·Inspector · Element menu (⋯) · no selection | △ Partial | G2-055 D · G2-127 E (code) · G2-139 D |
| 7048:78046 | CD·Canvas · Zoom popover (canvas @60) · CL T-03 | △ Partial | G1-096 A · G2-016 D |
| 7048:78079 | CD·Canvas · Zoom popover (canvas @200) · CL T-03 | △ Partial | G2-016 D |
| 7048:78112 | CD·Canvas · Zoom popover (canvas @340) · CL T-03 | △ Partial | G2-016 D |
| 7048:78145 | CD·Canvas · Zoom popover (canvas @380) · CL T-03 | △ Partial | G2-016 D |
| 7052:78347 | S·Canvas · ⋯ menu · Arrange submenu · CL T-06 | △ Partial | G2-050 A · G2-052 E · G2-053 E |
| 7052:78361 | S·Canvas · ⋯ menu · Style submenu · CL T-06 | △ Partial | G2-054 D |
| 7052:78372 | S·Canvas · ⋯ menu · Structure submenu · CL T-06 | △ Partial | G2-052 E · G2-055 D |
| 7054:78348 | S·Add · first-use tip · CL T-10 | △ Partial | G2-113 E (both sides) |
| 7059:78935 | S·Layers · dim tooltip (ⓘ) | ✓ Code | G2-007 A |
| 7059:78941 | S·Layers · row hover | ✓ Code | G2-011 A · G2-061 A |
| 7059:78962 | CD·Layers · Panel menu (⋯) | ✓ Code | G1-090 A (widths UNVERIFIED) · G2-058 A |
| 7063:78846 | CD·Add · Panel menu (⋯) | △ Partial | G2-104 A · G2-112 D |
| 7069:78978 | S·Pages · folders tooltip (ⓘ) | ✓ Code | G2-082 A |
| 7069:79370 | S·Pages · row hover | △ Partial | G2-071 D |
| 7069:79383 | CD·Pages · Panel menu (⋯) | ✓ Code | G2-070 A |
| 7071:79114 | S·Review · ⋯ menu | △ Partial | G1-031 D · G1-058 D · G1-059 D |
| 7291:81049 | S·History · filter popover | △ Partial | G1-075 C · PARTIALLY IMPLEMENTED · G2-170 D |
| 7291:81067 | S·History · notes tooltip (ⓘ) | △ Partial | G1-068 D · G2-170 D |
| 7293:80941 | S·History · session notes tooltip (ⓘ) | △ Partial | G1-068 D · G2-175 A |
| 7293:80948 | S·History · published notes tooltip (ⓘ) | △ Partial | G1-052 D · G1-068 D |
| 7293:80955 | S·History · backups notes tooltip (ⓘ) | △ Partial | G1-068 D · G1-074 C · NOT IMPLEMENTED |
| 7294:80941 | S·History · version row hover | ✓ Code | G1-070 A (minor) · G2-172 A |
| 7294:80956 | S·History · deploy row hover | △ Partial | G1-052 D · G2-177 A |
| 7294:80973 | S·History · backup row hover | ✗ Dummy | G1-074 C · NOT IMPLEMENTED |
| 7317:80979 | CD·Brand workspace · Discard brand changes? (confirm) | △ Partial | G3-125 D |
| 7318:80959 | CD·Brand workspace · Swatch picker | △ Partial | G3-140 D · E |
| 7318:80995 | CD·Brand workspace · Set dark-mode value | △ Partial | G2-164 F (inspector side) · G3-146 D |
| 7318:81029 | CD·Brand workspace · Font picker | △ Partial | G3-135 D · E |
| 7318:81049 | CD·Brand workspace · Where the token is used | △ Partial | G3-136 D |
| 7318:81104 | MENU · Brand workspace · token ⋯ | △ Partial | G3-138 D · G3-139 C · NOT IMPLEMENTED |
| 7318:81119 | S·Brand workspace · draft note tooltip (ⓘ) | △ Partial | G3-121 D · G3-124 D |
| 7318:81125 | CD·Brand workspace · Edit item | △ Partial | G3-124 D · G3-134 D · G3-144 D |
| 7318:81146 | CD·Brand workspace · Generate with AI | △ Partial | G2-126 A (cite) · G2-136 D · G3-119 D · PLANNED |
| 4418:172567 | CD·AI pending · Hero Inspector | △ Partial | G2-132 D |
| 4418:172804 | CD·Review anchored · Home | △ Partial | G1-030 D · G1-032 C · PARTIALLY IMPLEMENTED (d |
| 4418:173065 | CD·Review anchored · Contact | △ Partial | G1-030 D · G1-032 C · PARTIALLY IMPLEMENTED (d |
| 4418:173326 | CD·Review anchored · Menu | △ Partial | G1-030 D · G1-032 C · PARTIALLY IMPLEMENTED (d |
| 4418:173613 | CD·Client sign-off · Menu snapshot | ✓ Code | G1-063 A (UNVERIFIED) |
| 4418:173649 | CD·Client sign-off · Contact snapshot | ✓ Code | G1-063 A (UNVERIFIED) |
| 4418:173751 | CD·Manage saved master · Site header | △ Partial | G2-122 D |
| 4418:174002 | CD·Manage saved master · Footer | △ Partial | G2-122 D |
| 4418:174253 | CD·Manage saved master · CTA band | △ Partial | G2-122 D |
| 4418:174503 | CD·Manage saved master · Button / primary | △ Partial | G2-122 D |
| 4418:174752 | CD·Manage saved master · Price row | △ Partial | G2-122 D |
| 4418:175703 | CD·Full-screen Settings · Integrations · Zapier connected | ✗ Dummy | G3-111 C · NOT IMPLEMENTED |
| 5861:44701 | Surface Architecture · Decision Matrix | ✗ Dummy | G1-121 F (not screens) |
| 6035:51770 | CD·Surface Architecture · Verification Walkthrough | ✗ Dummy | G1-121 F (not screens) |
| 6062:51849 | Surface Decision Matrix · Extended (Feature → Scope → Placement → Surf | ✗ Dummy | G1-121 F (not screens) |
| 6168:52221 | CD·Surface Behavior Contract · 27-feature matrix | ✗ Dummy | G1-121 F (not screens) |
| 6173:52221 | CD·Surface Behavior Contract · Verification Summary | ✗ Dummy | G1-121 F (not screens) |
| 6176:52221 | CD·Surface Behavior Contract · Per-requirement evidence | ✗ Dummy | G1-121 F (not screens) |
| 6180:52221 | CD·QA · Sub-requirement verification · 27 features | ✗ Dummy | G1-121 F (not screens) |
| 6198:52221 | VISUAL EVIDENCE · Surface Behavior Contract · 27 features | ✗ Dummy | G1-121 F (not screens) |
| 6485:53047 | Surface Behavior Contract · Closure Status · 2026-09-17 (final) | ✗ Dummy | G1-121 F (not screens) |
| 6840:62989 | CD·Full-screen Settings · Integrations · Browse all · searching “stri” | ✗ Dummy | G3-111 C · NOT IMPLEMENTED |
| 7563:197963 | CURRENT DESIGN · Recovery · conflict (3 actions) | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7563:198331 | CURRENT DESIGN · Recovery · overwrite warning | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7563:233454 | CURRENT DESIGN · Recovery · restore unsaved edits | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7563:233608 | CURRENT DESIGN · Recovery · recovered work banner | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7563:233691 | CURRENT DESIGN · Shell · offline | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7563:241890 | CURRENT DESIGN · Recovery · load error · network | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7563:241964 | CURRENT DESIGN · Recovery · load error · no access | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7563:242038 | CURRENT DESIGN · Exit · stranded mirrors | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7563:269384 | CURRENT DESIGN · Publish gate · changes were requested | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7563:269398 | CURRENT DESIGN · Publish · stale approval | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7563:269418 | CURRENT DESIGN · Publish · open errors confirm | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7564:185450 | CURRENT DESIGN · Assets · delete folder? | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7564:185465 | CURRENT DESIGN · Assets · delete folder · not empty | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7564:185480 | CURRENT DESIGN · Brand · project update · running | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7564:185497 | CURRENT DESIGN · Brand · project update · failed | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7566:186558 | CURRENT DESIGN · Comments · mode on | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7566:188906 | CURRENT DESIGN · Comments · draft popover | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7566:189283 | CURRENT DESIGN · Comments · post failed | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7566:192704 | CURRENT DESIGN · Comments · re-pin banner | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7566:192959 | CURRENT DESIGN · Comments · element deleted (N comments) | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7567:190020 | CURRENT DESIGN · Shell · view mode | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7567:190220 | CURRENT DESIGN · Permissions · disabled control tooltip | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7569:190283 | CURRENT DESIGN · Topbar · review chip states | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7570:190578 | CURRENT DESIGN · Review · send popover | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7570:190771 | CURRENT DESIGN · Review · sent ✓ | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7570:190958 | CURRENT DESIGN · Review · invite email failed | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7571:191619 | CURRENT DESIGN · Review · changes requested | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7571:191936 | PLANNED · Collab · presence live | ○ Planned | built 21 Sep 2026 (05 ledger) |
| 7571:192075 | PLANNED · Collab · reconnecting | ○ Planned | built 21 Sep 2026 (05 ledger) |
| 7571:192418 | PLANNED · Collab · remote cursors | ○ Planned | built 21 Sep 2026 (05 ledger) |
| 7572:192745 | CURRENT DESIGN · Notifications · states | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7574:193972 | CURRENT DESIGN · Publish · confirm | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7574:194162 | CURRENT DESIGN · Toasts · catalogue | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7575:194977 | CURRENT DESIGN · Canvas · inline edit · toolbar | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7575:195275 | CURRENT DESIGN · Canvas · dragging · snap guides | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7575:195538 | CURRENT DESIGN · Keyboard shortcuts · full | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7576:194193 | CURRENT DESIGN · Canvas · rulers + guide | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7576:194517 | CURRENT DESIGN · Canvas · grid overlay | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7576:194856 | CURRENT DESIGN · Canvas · spacing overlay | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7576:197036 | CURRENT DESIGN · Brand workspace · Spacing | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7593:193270 | CURRENT DESIGN · Topbar · CTA verbs | ✓ Code | built 21 Sep 2026 (05 ledger) |
| 7593:193511 | CURRENT DESIGN · Client sign-off · pin on snapshot | ✓ Code | built 21 Sep 2026 (05 ledger) |
