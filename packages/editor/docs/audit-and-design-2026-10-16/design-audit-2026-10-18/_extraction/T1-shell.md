# T1 — Shell: feature inventory + traceability (INV lines 96–360)

Mode: AUDIT ONLY · 2026-10-18 · spec-level only (no hi-fi screens exist; nothing run).
Abbreviations: **INV** = `docs/editor-feature-inventory-2026-10-16.md` · **P00…P25** = `panels/NN-*.md` · **MS** = `evidence/ia-final-2026-10-16/module-specifications.md` · **CPres** = `evidence/ia-final-2026-10-16/capability-preservation.md` · **BRIEF** = `PRODUCT-DESIGN-BRIEF.md`.
States key: def · hov · foc · sel · dis · load · empty · err · perm · succ.

## Scope read

| File | Lines read | How |
|---|---|---|
| `_extraction/EXTRACTION-BRIEF.md` | 1–46 | full |
| INV | 90–360 (shell section §1–§15 + Not verified + counts) | full |
| P00-SHARED-CONTRACTS.md | 1–361 | full |
| BRIEF | 1012–1166 | full |
| P01-TOPBAR.md | 1–254 | full |
| P02-LEFT-RAIL.md | 1–194 | full |
| P11-PAGES-AND-BOTTOM-BAR.md | 1–173 | full |
| P12-RIGHT-TASK-HOST.md | 1–158 | full |
| P14-PUBLISH.md | 1–313 | full |
| P16-FIRST-RUN.md | 1–194 | full |
| P18-COMMAND-PALETTE-AND-HELP.md | 1–340 | full |
| P22-GLOBAL-STATES.md | 1–328 | full |
| P05-CANVAS.md | 25–179 | sections §2–§11 |
| P17-CLIENT-REVIEW.md | 95–145 + grep hits (21, 24, 33, 105, 119, 233, 241–259, 277) | partial |
| P24-UNDO-COVERAGE.md | 40–70 + grep hits (82–162) | partial |
| P10-SITE-SETTINGS.md | 23–31, 55–72, grep hits (79–150) | partial |
| P13-COMPONENTS.md | 28, 67–72, grep hits | partial |
| P07 / P08 / P09 / P15 / P19 / P20 / P21 / P23 | grep hits only (cited lines) | grep |
| MS | 7–62 (IAF-01), 791–846 (IAF-15); §E/F/H/I of IAF-16, 18, 19, 20, 21, 22 | partial |
| CPres | grep of M01-* rows (lines 52–202) | grep |

Skipped: P03, P04, P06, P25, ENGINEERING-BACKLOG, REVIEW-2026-10-17, ARCHITECTURE-DECISION (SUPERSEDED), REMAINING-IA-HANDOFF (beyond grep), all HTML/PNG/JSON evidence. Reason: their scope belongs to other tasks, or a grep (≥2 synonyms) found no shell row they own. For every OMITTED/PARTIAL claim, I ran ≥2 synonym greps over P and D. Examples: "Skip to / skip link / landmark"; "Connect to tokens / raw value / match token"; "Review closed / approved this design / round closes"; "Permissions / PermissionsModal / role permission"; "Products / product block / ecommerce".

## Traceability

| FID | Feature (INV #) | INV | INV line | Design home | Controls | States specified | Interaction | Coverage | Gap / note |
|---|---|---|---|---|---|---|---|---|---|
| F-SH-001 | Shell grid (1.1) | ✅ | 100 | P01 §4 · P02 §4 · P11 §4 · P12 §4.5 · P05 §4 | Y | def, load (P22 §5.1), perm | Y | COVERED | Brings back a full-width 32px bottom bar (P11 §4). This reverses INV's "no footer row" |
| F-SH-002 | Status footer (1.2) | ❌ | 101 | — | — | — | — | REMOVED-N/A | Readout → P05 §5 breadcrumb dimension. The new bottom bar (P11) carries different content |
| F-SH-003 | Zoom flyout (1.3) | ❌ | 102 | — | — | — | — | REMOVED-N/A | Zoom lives in P05 §5 |
| F-SH-004 | Dev alt rails (1.4) | ❌ | 103 | — | — | — | — | REMOVED-N/A | — |
| F-SH-005 | Right column multi-mode host (1.5) | ✅🆕 | 104 | P12 §4.1–4.5 | Y | def, foc, load, err, perm | Y | COVERED | One `activeTask` fixes "can't see which modes are stacked" |
| F-SH-006 | Hide/show inspector (1.6) | ✅🆕 | 105 | P12 §4.2 (prior visibility) · P05 §9 ("canvas-corner Inspector door") · CPres M01-1.6 | P | def, hidden | P | PARTIAL | ⌘\ appears in neither the SC-12 table nor the P18 sheet groups. Show-button label/placement and per-session persistence are not restated (T1-11) |
| F-SH-007 | CMS workspace takeover (1.7) | ✅🆕 | 106 | P02 §5 · P07 · P00 SC-1 | Y | def, perm (viewer dis), err (P02 §10) | Y | COVERED | Esc no longer leaves (SC-10 BD-15). INV says Esc leaves today |
| F-SH-008 | Full-screen takeovers (1.8) | 🐞 | 107 | P02 §5–6 · P15 §4 (area) · P08 · P09 · P10 · SC-1 | Y | def, perm | Y | COVERED | Takeovers become areas inside the shell, with one back slot. `inert` is specified only for the task tray (P12 §4.5) and hidden workspaces (MS IAF-01 I) |
| F-SH-009 | View mode `?view=readonly` (1.9) | ✅ | 108 | P01 §9 · P02 LR-09/§10 · P11 §8 · P18 §6 · P05 §8 | Y | def, perm | Y | COVERED | — |
| F-SH-010 | Viewer chrome (1.10) | ✅🆕 | 109 | P00 SC-6 · P12 §6 (ViewerRoleNotice) · P02 §10 | Y | perm, dis | Y | COVERED | Viewer rail group removed by decision. Doors moved to chip, "Versions ›" and bell footer |
| F-SH-011 | Skip to Canvas + landmarks (1.11) | ✅ | 110 | P02 §8 (nav) · P12 §4.2 (aside) · P05 §10 (toolbar) · CPres M01-1.11 only for skip link | P | foc | P | PARTIAL | Skip link not specified in any panel. Its behaviour over areas (UX-22) is undefined (T1-12) |
| F-SH-012 | Boot skeleton (1.12) | ✅ | 111 | P22 §5.1 step 2 | Y | load | Y | COVERED | One skeleton; "Opening {site}…" |
| F-SH-013 | Shell crash screen (1.13) | ✅ | 112 | P22 §4.3 · §5.9 | Y | err | Y | COVERED | Computed safety line; error code depends on G-8 |
| F-SH-014 | Drawer panel loading/crash (1.14) | ✅ | 113 | P22 §5.8–5.9 | Y | load, err | Y | COVERED | "Your work is safe" becomes a computed line (needs G-11) |
| F-SH-015 | Column panel loading/crash (1.15) | ✅🆕 | 114 | P12 §4.2 (all six tasks) | Y | load, err | Y | COVERED | — |
| F-SH-016 | "Project loaded" toast (1.16) | ❌ | 115 | — | — | — | — | REMOVED-N/A | — |
| F-SH-017 | Load toasts (1.17) | ✅ | 116 | P22 §4.1–4.2, §5.1 · CPres M01-1.17 | P | err | P | PARTIAL | "Load failed" → banner "Couldn't load". The "Project update failed" (design-system schema) toast has no spec (T1-24) |
| F-SH-018 | Exit button (2.1) | ✅ | 122 | P01 §5.1, §7.1 · P22 §5.3 | Y | def, perm (view-mode label) | Y | COVERED | — |
| F-SH-019 | Site › page breadcrumb (2.2) | ✅🆕 | 123 | P01 §4, §5.2 | Y | def, perm | Y | COVERED | Becomes non-interactive identity text. Page crumb → bottom bar / canvas breadcrumbs |
| F-SH-020 | Save status pill (2.3) | ✅ | 124 | P11 §8 · P00 SC-4 · P01 §7.4 | Y | def, load (saving), err, succ, perm, offline | Y | COVERED | Moved to bottom status. Priority is reordered on purpose |
| F-SH-021 | Save pill click (2.4) | ✅🆕 | 125 | P11 §8 table | Y | as 020 | Y | COVERED | Same click targets |
| F-SH-022 | Timestamp drop on narrow (2.5) | ✅ | 126 | P11 §8, §10 | P | — | N | PARTIAL | Status sets max 280 but has no truncation/drop rule for "· {time}" or "· N changes not published" |
| F-SH-023 | Live chip (2.6) | ❌ | 127 | P01 §5.2 · §11 Q-TB4 | Y | def (live / not published / changes not published), err ("Status unavailable"), load | Y | COVERED | Doc brings it back as an 8px status dot |
| F-SH-024 | Review chip (2.7) | ✅🆕 | 128 | P01 §5.4 · P17 §4.4 · SC-10 | Y | def, perm, all chip states | Y | COVERED | "Link expired" depends on R-12 |
| F-SH-025 | Review-closed toasts (2.8) | ✅ | 129 | CPres M01-2.8 ("Keep", IAF-17) vs P22 §4.1/§5.10 | N | — | N | CONFLICT | Toast is kept by family map, but P22 limits toasts to the user's own actions and sends others' events to the bell (T1-07) |
| F-SH-026 | Comments toggle (2.9) | ✅ | 130 | P01 §5.5 | Y | def, sel (pressed), dis (non-Editor), perm | Y | COVERED | — |
| F-SH-027 | Issues chip (2.10) | ❌ | 131 | P01 §11 Q-TB3 | — | — | — | REMOVED-N/A | Stays removed by decision |
| F-SH-028 | Presence + connection pill (2.11) | 🚩 | 132 | P01 §5.6 · P21 §5.1 | Y | def, reconnecting, offline | Y | COVERED | Planned. Phase A blocked by ⛔ MP-3/4/5 |
| F-SH-029 | Notifications bell (2.12) | ✅🆕 | 133 | P01 §5.7 · P22 §5.11 | Y | def, err ("Status unavailable") | Y | COVERED | — |
| F-SH-030 | Preview button (2.13) | ✅🆕 | 134 | P01 §5.8 | Y | def, load (spinner) | Y | COVERED | — |
| F-SH-031 | Primary CTA verbs (2.14) | 🚩 | 135 | P01 §5.9 · P14 §4.2 | Y | def, dis, load ("Publishing n/N…"), err ("Publish failed"), succ | Y | COVERED | — |
| F-SH-032 | CTA blocked reasons (2.15) | ✅🆕 | 136 | P01 §5.9 · P14 §4.2, §6 | Y | dis + reasons | Y | COVERED | — |
| F-SH-033 | CTA routing (2.16) | ✅ | 137 | P01 §7.5 · P14 §4.3 | Y | — | Y | COVERED | 4 dialogs merged into 1 |
| F-SH-034 | SR announcements (2.17) | ✅ | 138 | P11 §8 · P22 §5.10, §8 · P14 §8 | Y | — | Y | COVERED | Live pipe moves to bottom bar |
| F-SH-035 | Viewer top bar (2.18) | ✅🆕 | 139 | P01 §9 · SC-6 | Y | perm, dis | Y | COVERED | — |
| F-SH-036 | ⋯ menu shell (3.1) | ✅ | 145 | P01 §5.10, §6 (+ plan chip SC-20; "Search ⌘K" P18) | Y | def, perm | Y | COVERED | Groups now: This site · Collaborate · Help & tools · Leaves the editor · View mode |
| F-SH-037 | Site settings row (3.2) | ✅ | 146 | P01 §6, §5.3 | Y | def | Y | COVERED | Shortcut glyph ambiguous (T1-10) |
| F-SH-038 | Export site… (3.3) | ✅ | 147 | P01 §6 · MS IAF-15 E/H/I | Y | load (preparing), succ, err | Y | COVERED | Dialog interior is only in MS IAF-15 |
| F-SH-039 | Duplicate site (3.4) | ✅🆕 | 148 | P01 §6 (Confirm → toast, Keep) vs SC-15 · CPres M01-3.4 | Y | succ | Y | CONFLICT | The confirm is not an SC-15 exception. CPres moves it to Site settings (T1-03, T1-05) |
| F-SH-040 | Issues row (3.5) | 🟡 | 149 | P01 §6 ("Issues · 3") · §11 Q-TB3 | Y | def | Y | COVERED | Count moves into the label |
| F-SH-041 | Activity log row (3.6) | 🟡🆕 | 150 | P01 §6 · P12 §5 Activity | Y | inherited ("states" by reference) | P | PARTIAL | Activity empty/loading copy not restated. Exact-item open and Load more depend on the API (P12 §9) |
| F-SH-042 | Command palette row (3.7) | ✅🆕 | 151 | P18 §5.1, §9 | Y | — | Y | COVERED | Row replaced by the menu header entry "Search ⌘K" |
| F-SH-043 | Enter/Exit view mode (3.8) | ✅ | 152 | P01 §6, §9 | Y | perm | Y | COVERED | — |
| F-SH-044 | Keyboard shortcuts row (3.9) | ✅ | 153 | P01 §6 · P18 §5.9 | Y | — | Y | COVERED | — |
| F-SH-045 | Share preview link (3.10) | ✅🆕 | 154 | P01 §6, §7.3 · MS IAF-15 I | P | succ (copied); "expired share" only in MS | P | PARTIAL | Mint/reuse loading and failure, plus copy failure, are not in panels. Password/expiry being dashboard-only is not stated |
| F-SH-046 | Copy live URL (3.11) | ✅ | 155 | P01 §6 · P14 §4.1 (status card ⧉) | Y | — | P | PARTIAL | Outcome toasts "Live URL copied" / "Couldn't copy" not specified |
| F-SH-047 | Getting started row (3.12) | ✅ | 156 | P01 §6 · P18 §5.10 · P16 §5.3 | Y | perm (hidden in view mode) | Y | COVERED | — |
| F-SH-048 | Start collaboration (3.13) | 🚩 | 157 | P01 §6 · P21 §5.1 | Y | dis ("Planned") | Y | COVERED | → "People on this site…" with auto-join |
| F-SH-049 | Unpublish site… (3.14) | ✅ | 158 | P01 §6 · P14 §5.7 | Y | perm (ADMIN) | Y | COVERED | — |
| F-SH-050 | View live site ↗ (3.15) | ✅ | 159 | P01 §6 | Y | perm (live only) | Y | COVERED | — |
| F-SH-051 | Site health ↗ · Invite teammates ↗ / Account settings ↗ (3.16–3.17) | ✅ | 160–161 | P01 §6 ("Leaves the editor", Keep) vs CPres M01-3.16/3.17 ("Move → IAF-14 Site settings") | Y | perm (Invite ADMIN) | Y | CONFLICT | Stale family map (T1-05) |
| F-SH-052 | View-mode menu (3.18) | ✅ | 162 | P01 §6, §9 | Y | perm | Y | COVERED | — |
| F-SH-053 | Removed menu rows (3.19) | ❌ | 163 | P01 §10 | — | — | — | REMOVED-N/A | — |
| F-SH-054 | Rail items (4.1) | ✅ | 169 | P02 §4–5 | Y | def, sel, dis, perm | Y | COVERED | Six items become five; Pages → bottom bar (P11) |
| F-SH-055 | Rail logo (4.2) | ❌ | 170 | — | — | — | — | REMOVED-N/A | — |
| F-SH-056 | Rail Help button (4.3) | ✅🆕 | 171 | P02 §5 · P18 §4.5, §5.10 | Y | def, foc, perm | Y | COVERED | Opens the Help popover; legend card retired |
| F-SH-057 | Rail active/hover/focus (4.4) | ✅ | 172 | P02 §6, §8 | Y | def, sel, "last" plate, foc, dis (hover = tooltip only) | Y | COVERED | — |
| F-SH-058 | Rail click semantics (4.5) | ✅ | 173 | P02 §5 | Y | — | Y | COVERED | — |
| F-SH-059 | Rail keyboard (4.6) | ✅ | 174 | P02 §8 | Y | foc | Y | COVERED | Arrows now move focus only (deliberate change) |
| F-SH-060 | Rail unsaved dot (4.7) | ❌ | 175 | P02 §4 ("no badges") | — | — | — | REMOVED-N/A | — |
| F-SH-061 | Off-rail panels + keys (4.8) | ✅ | 176 | P02 §2/§8 · P12 RT-09 · P15 · P13 · P10 | Y | — | Y | COVERED | Templates becomes an area (P15) |
| F-SH-062 | Drawer container (4.9) | ✅ | 177 | P02 §5 (284 panel, collapse/restore) · SC-10 BD-15 | Y | def, collapsed | Y | COVERED | Widen-700 removed. "Closed = inert" not restated |
| F-SH-063 | Remembered tab (4.10) | ✅ | 178 | P02 §10 (Reload, storage migration) | Y | — | Y | COVERED | — |
| F-SH-064 | Unsaved-switch guard (4.11) | ✅🆕 | 179 | P02 §7 vs P10 §5 "Dirty guard" | Y | err (Retry/Stay) | Y | CONFLICT | Buttons differ and both claim to be "existing" (T1-01). Whether Brand is guarded disagrees with INV (T1-02) |
| F-SH-065 | Cross-panel hand-offs (4.12) | ✅ | 180 | P11 §6 · P14 §5.7 · P02 §5 · SC-3 · SC-7 · P12 §5 | Y | — | Y | COVERED | — |
| F-SH-066 | Create-component guard (4.13) | ✅ | 181 | P13 CP-03 + §5 ("All existing doors kept") | P | — | P | PARTIAL | The no-selection toast is kept only by reference. It uses a toast, not the SC-6/SC-18 disabled-with-reason pattern |
| F-SH-067 | Full-screen close return (4.14) | ✅ | 182 | SC-1 · P02 §6.1 · P05 §5 | Y | — | Y | COVERED | Return is now to the exact Editor origin |
| F-SH-068 | Page tabs (5.1) | ✅🆕 | 188 | P11 §4, §9, §11 | Y | def, sel, unsaved dot, load, err, perm, plan-locked | Y | COVERED | Moved into the bottom bar. Guarded "Open {page} in Editor" |
| F-SH-069 | "+" button (5.2) | 🟡 | 189 | P11 §4 | Y | — | Y | PARTIAL | Viewer/view-mode behaviour of "+" unspecified. Pages button is disabled for viewers (§9) (T1-19) |
| F-SH-070 | Tab context menu (5.3) | ❌ | 190 | P11 §4 ("No strip context menu") | — | — | — | REMOVED-N/A | — |
| F-SH-071 | Notification dropdown (6.1) | ✅ | 196 | P01 §5.7 · MS IAF-19 F | Y | def | Y | COVERED | — |
| F-SH-072 | Notification states (6.2) | ✅ | 197 | P01 TB-08 + §5.7 · P22 §5.11 · MS IAF-19 I | Y | load, err, empty, err (count) | Y | COVERED | — |
| F-SH-073 | Notification rows (6.3) | ✅🆕 | 198 | P22 §5.11 | Y | def, unread, target deleted/forbidden/unavailable, perm | Y | PARTIAL | Bell counts all unread but lists 5; no full-inbox/Load more spec (MS IAF-19 E says "full inbox entry preserved") (T1-13) |
| F-SH-074 | Mark all read (6.4) | ✅ | 199 | P22 §5.11 · MS IAF-19 H | Y | err | Y | COVERED | — |
| F-SH-075 | Footer "View all activity ›" (6.5) | ✅🆕 | 200 | P01 §5.7 · SC-6 | Y | — | Y | COVERED | — |
| F-SH-076 | Deleted-target note (6.6) | ❌ | 201 | P22 §5.11 target states | Y | err (gone / forbidden / unavailable) | Y | COVERED | Brought back as a per-row line |
| F-SH-077 | Issues panel host (7.1) | ✅🆕 | 207 | P12 §4, §5 | Y | load, err | Y | COVERED | — |
| F-SH-078 | Issue sources (7.2) | 🟡🆕 | 208 | P12 RT-15/§5 · P19 §5.8 | Y | — | P | PARTIAL | Sources kept as today. No a11y module (L4-040 DECISION); motion checks added |
| F-SH-079 | Scan state (7.3) | ✅🆕 | 209 | P12 RT-15 ("scan / fix bands", kept) | P | load (by reference) | P | PARTIAL | "Scan failed + Try again" only by reference |
| F-SH-080 | Empty / scope / filter (7.4) | ✅ | 210 | P12 §5 Issues | Y | — | Y | PARTIAL | Empty "No issues." not restated. Scope label changes to "This page / Whole site" |
| F-SH-081 | Row → locate (7.5) | 🟡 | 211 | P12 §5 Issues · SC-7 · SC-19 | Y | — | Y | COVERED | Fixes INV's "no way back" and off-viewport targets |
| F-SH-082 | Fix › auto-fix (7.6) | ✅ | 212 | P12 RT-15 · P24 §4.1 row 51 | Y | succ (toast + Undo) | Y | COVERED | — |
| F-SH-083 | Fix-failed band (7.7) | ✅ | 213 | P12 RT-15 (kept by reference) | P | err (by reference) | P | PARTIAL | Copy/actions only in INV (T1-17) |
| F-SH-084 | Ignored (n) (7.8) | ✅🆕 | 214 | P12 RT-15/§5 | Y | — | Y | COVERED | — |
| F-SH-085 | Issue copy (7.9) | 🟡 | 215 | CPres M01-7.9 (Redesign → IAF-16) | N | — | N | PARTIAL | No panel rewrites the "developer-facing" messages (T1-17) |
| F-SH-086 | Preview overlay (8.1) | 🟡🆕 | 221 | P01 §5.8, §7.3 · SC-1 · SC-8 · MS IAF-15 E/F/I | Y | load, draft-record bar, preparing/failed (MS) | Y | COVERED | Unclear whether the topbar stays visible in Preview (T1-09) |
| F-SH-087 | Preview keeps device (8.2) | 🐞 | 222 | P01 §5.8 · SC-8 · T-TB-06 | Y | — | Y | COVERED | — |
| F-SH-088 | Preview fidelity (8.3) | 🟡 | 223 | SC-8 (1440) · P19 §5.4 / IXD-3 · MS IAF-15 H | P | — | P | PARTIAL | Font/colour drift between canvas and Preview (UX-09) is not addressed (T1-23). Scripts blocked by ⛔ IXD-3 |
| F-SH-089 | Preview page switching (8.4) | ✅🆕 | 224 | P01 §7.3 (page select) | P | — | P | PARTIAL | Internal-link navigation and editor-page sync are not specified |
| F-SH-090 | Share preview dialog (8.5) | ✅🆕 | 225 | P01 §7.3 · MS IAF-15 E/I | P | succ | P | PARTIAL | Same gaps as F-SH-045 |
| F-SH-091 | Compare (8.6) | ✅🆕 | 226 | P05 §8 · P12 §5 (doors) · SC-1/SC-2 · MS IAF-18 E/F/H/I | Y | empty, load, err, perm, pruned | Y | COVERED | Interior only in MS IAF-18 |
| F-SH-092 | Time travel (8.7) | ✅🆕 | 227 | P05 §8 · SC-12 · SC-2 · P24 UN-13/row 53 · MS IAF-18 H/I | Y | load, err (no preview), restoring | Y | COVERED | Band → dedicated area |
| F-SH-093 | Review bar (9.1) | ❌ | 233 | — | — | — | — | REMOVED-N/A | — |
| F-SH-094 | Send for review (9.2) | ✅ | 234 | P17 CR-02, §5.1 · P12 §5 | Y | load, succ, err (invite failed, render failed) | Y | COVERED | P17 calls it a "dialog"; INV calls it a "popover" |
| F-SH-095 | Review-sent outcome dialog (9.3) | ✅ | 235 | P17 §5.1 step 3 ("outcome modal (existing)") | P | by reference | P | PARTIAL | States/copy only by reference |
| F-SH-096 | Publish with N errors (9.4) | ✅ | 236 | P14 §4.3 section 3 | Y | dis (tick to publish) | Y | COVERED | Merged into one dialog |
| F-SH-097 | Publish confirm facts (9.5) | 🚩 | 237 | P14 §4.3 sections 1/4/5 | Y | dis, def | Y | COVERED | Blocked by ⛔ P-1 |
| F-SH-098 | Approval gate dialogs (9.6) | ✅ | 238 | P14 §4.3 (modal → task banner) · P17 §5.2 | Y | def | Y | COVERED | — |
| F-SH-099 | Stale-approval dialog (9.7) | ✅ | 239 | P14 §4.3 section 4 · P17 §5.5 | Y | perm (ADMIN override) | Y | COVERED | Staleness rule blocked by ⛔ R-11 (interim guard) |
| F-SH-100 | Publish outcome toasts (9.8) | ✅ | 240 | P14 §5.5, §7 | Y | succ, err, simulated, cancelled | Y | COVERED | — |
| F-SH-101 | Publish history (9.9) | ✅ | 241 | P14 §5.6 · P12 §5 History · MS IAF-16 H | Y | perm, pruned (dis) | Y | COVERED | "Rolled back" strings → SC-11 "Release / Republish" |
| F-SH-102 | Rollback picker (9.10) | ❌ | 242 | — | — | — | — | REMOVED-N/A | — |
| F-SH-103 | Exit guard dialogs (10.1) | ✅ | 248 | P01 §7.1 · P22 §5.3, §5.9 · P14 §5.4 | Y | err, offline, queued, publish running | Y | COVERED | — |
| F-SH-104 | Browser leave prompt (10.2) | ✅ | 249 | P01 §5.1 · P22 §5.9 | Y | — | Y | COVERED | Registered at route level |
| F-SH-105 | Save-failed banner (10.3) | ✅🆕 | 250 | P11 §8 · P22 §4.2, §5.4 | Y | err | Y | COVERED | — |
| F-SH-106 | Recovered-work banner (10.4) | ✅ | 251 | P11 §8 · P22 §4.2 (kept on canvas) | Y | — | P | PARTIAL | Unclear whether "Discard & reload" needs the SC-15 kept-copy confirm (T1-18) |
| F-SH-107 | "Never reached the server" (10.5) | ✅ | 252 | P22 §4.2 banner (4), §7, §5.2 | Y | def, dismissed ("Not now") | Y | COVERED | Toast → banner. ⛔ G-12 interim guard |
| F-SH-108 | Load-error banner (10.6) | 🐞 | 253 | P22 §4.2, §5.1, §5.7, §7 | Y | err, perm, load (Reconnecting) | Y | COVERED | Fixes the false "no trash" copy |
| F-SH-109 | Session-expired dialog (10.7) | ✅ | 254 | P22 §5.2 · SC-18 | Y | err, perm (other user) | Y | COVERED | Auto-resend blocked by ⛔ G-2 |
| F-SH-110 | Conflict dialog (10.8) | ✅ | 255 | P22 §5.4 · P11 §8 | Y | err (backup failed), succ ("Download started") | Y | COVERED | — |
| F-SH-111 | Other-tab notice (10.9) | ✅🆕 | 256 | P22 §5.12 | Y | def, err (other tab couldn't save) | Y | COVERED | Toast → banner + "Edit here" |
| F-SH-112 | Save toasts (10.10) | ✅ | 257 | P22 §5.4, §5.7, §5.10 · P11 §8 | P | succ, err | P | PARTIAL | "Saved — site settings / CMS bindings didn't" partial saves rely on P11 details rows (blocked by the receipt registry). Manual "Saved" toast removed |
| F-SH-113 | Page-limit save refusal (10.11) | 🔒🆕 | 258 | P22 §5.4 · P11 §6 · SC-18 · P23 PL-11 | Y | dis, perm (owner/others) | Y | COVERED | Pre-check needs the capacity query (SC-9) |
| F-SH-114 | Sync-failure toasts (10.12) | ✅ | 259 | P22 §1 (Out) · P11 §8 Sync queue row · P13 §6 states · P07 | P | err (count only) | P | PARTIAL | Mirror "didn't sync + Retry now" has no surface level in the P22 §4.1 ladder (T1-16) |
| F-SH-115 | Engine error toasts (10.13) | ✅🆕 | 260 | P22 §8 (refused edits announce) · CPres M01-10.13 | P | err | P | PARTIAL | "Couldn't save a local copy" / "Couldn't complete that action" unspecified |
| F-SH-116 | Create component modal (11.1) | ✅ | 266 | P13 §5 | Y | dis (cap), err (duplicate name), succ (Undo toast) | Y | COVERED | Scope "This site" → "Component library" (label) |
| F-SH-117 | Create collection modal (11.2) | ✅ | 267 | P07 §9 · §10 | Y | empty, def | Y | COVERED | Checkbox renamed "Create a page for each record" |
| F-SH-118 | Records manager (11.3) | ❌ | 268 | — | — | — | — | REMOVED-N/A | — |
| F-SH-119 | Set up Products collection (11.4) | ✅ | 269 | CPres M01-11.4 ("Keep → IAF-23 … unsupported UI deferred") | N | — | N | PARTIAL | Family map only. No panel says whether the auto-offer stays (T1-28) |
| F-SH-120 | Save page as template (11.5) | ✅ | 270 | P15 §… (line 119–121) · P24 row 44 | P | empty (Saved filter) | P | PARTIAL | "Name field" only, so the description field is dropped silently. New Pages row door is missing from P11 §5 row menu (T1-08) |
| F-SH-121 | New page modal (11.6) | ✅🆕 | 271 | P11 §6 | Y | dis (capacity), perm | Y | COVERED | — |
| F-SH-122 | Site fonts modal (11.7) | ✅🆕 | 272 | P08 §4 nav ("modal kept as quick door from Inspector"), §7 · P09 typography row | Y | perm (viewer read-only) | Y | COVERED | Management moves to Assets › Fonts |
| F-SH-123 | Upgrade dialog (11.8) | 🔒 | 273 | P23 §4.5 · SC-18/SC-20 | Y | perm (owner/others), trial | Y | COVERED | Trial copy blocked by ⛔ P-TRIAL |
| F-SH-124 | Permissions dialog (11.9) | ✅🆕 | 274 | CPres M01-11.9 · P10 §4 sketch ("Your role · Permissions") · MS IAF-20 F | N | — | N | PARTIAL | Dialog content and states unspecified. P18 §5.2 target index does not list the "Permissions" row that CP-06 has today (T1-29) |
| F-SH-125 | Delete site (owner) (11.10) | ✅🆕 | 275 | P10 ST-04 / §… "Danger zone: unchanged actions and confirmations" vs SC-15 | P | perm (OWNER) | P | CONFLICT | Typed confirm is not an SC-15 exception. Deleted screen still omits the 30-day restore (T1-04) |
| F-SH-126 | Export modal (11.11) | ✅ | 276 | P01 §6 · MS IAF-15 F/H/I | Y | load, succ, err | Y | COVERED | — |
| F-SH-127 | Rail coach mark (12.1) | ✅ | 282 | P16 §4.2 · P02 §10 | Y | def, dismissed | Y | COVERED | Copy fixed. Sequencing against Add tips (FR-14) and checklist is still not ordered (UX-02 residual) |
| F-SH-128 | Getting-started chip (12.2) | ✅🆕 | 283 | P16 §4.3 placement | Y | def, collapsed (≤1366) | Y | COVERED | Moves from rail foot to bottom-left above the bottom bar. Not in the preservation map (T1-15) |
| F-SH-129 | Checklist panel (12.3) | ✅ | 284 | P16 §4.3, §5.3 | Y | def, dismissed (Undo toast) | Y | COVERED | ✕ confirm becomes Undo |
| F-SH-130 | Seven steps (12.4) | 🐞 | 285 | P16 §4.3 eligibility table | Y | dis + reason, perm, zero-eligible | Y | COVERED | Fixes the reviews-off dead step |
| F-SH-131 | Progress scope (12.5) | 🐞 | 286 | P16 §5.3 · F-2 | Y | — | Y | COVERED | Leaks until F-2 ships |
| F-SH-132 | Step-complete prompt (12.6) | 🟡 | 287 | P16 §4.4 | Y | succ, queued | Y | COVERED | Modal → non-modal toast. Location ambiguous (T1-14) |
| F-SH-133 | Hidden in view mode (12.7) | ✅ | 288 | P16 §6 | Y | perm | Y | COVERED | — |
| F-SH-134 | Onboarding board coverage (12.8) | 🟡 | 289 | P16 §9 F-5 (empty-canvas board only) · P01 §13 "Figma boards deferred by owner" | N | — | N | PARTIAL | No board for coach, checklist or achievement |
| F-SH-135 | One palette (13.1) | ✅ | 295 | P18 §4.1, §5.1, §8 | Y | def, perm (viewer), dis (modal open) | Y | COVERED | Opens in read-only view (OD-18-2) |
| F-SH-136 | Opening bands (13.2) | 🟡 | 296 | P18 §4 (canonical order), §4.1 | Y | first-use (no Recent) | Y | COVERED | — |
| F-SH-137 | Search-only results (13.3) | ✅🆕 | 297 | P18 §5.2–5.3 | Y | load, err (records) | Y | COVERED | Cross-page layers depend on K-7 |
| F-SH-138 | Disabled rows + reason (13.4) | ✅ | 298 | P18 §5.6, §7 | Y | dis | Y | COVERED | Fixes the reason-case inconsistency |
| F-SH-139 | No results (13.5) | ✅🆕 | 299 | P18 §5.7 · SC-21 | Y | empty | Y | COVERED | "Ask AI" part is DEFERRED-BY-DECISION (SC-21) |
| F-SH-140 | Scope chip (13.6) | ⏳ | 300 | P18 §5.1 ("In {Area}") | Y | def | Y | COVERED | CPres M01-13.6 "Defer" is stale (T1-06) |
| F-SH-141 | Clear history (13.7) | 🟡 | 301 | P18 §5.5 · K-8 · SC-15 E-5 | Y | succ | Y | COVERED | — |
| F-SH-142 | Start collab command (13.8) | 🚩 | 302 | P21 §5.1 · SC-10 | Y | — | Y | COVERED | — |
| F-SH-143 | Palette legend footer (13.9) | 🟡 | 303 | P18 §7 | Y | — | Y | COVERED | — |
| F-SH-144 | Shortcuts sheet (14.1) | ✅ | 309 | P18 §4.4, §5.9 | Y | dis (muted rows), empty (search) | Y | COVERED | Adds the single-key toggle |
| F-SH-145 | Keyboard legend card (14.2) | 🐞 | 310 | P18 §9 (Removal) · P02 §11 | — | — | — | COVERED | Deliberate removal; rows → sheet BASICS |
| F-SH-146 | Rail/panel letters (14.3) | ✅ | 311 | SC-12 · P02 §8 · P12 RT-09 · P18 §5.9 | Y | dis (toggle off) | Y | COVERED | I inactive (SC-21) |
| F-SH-147 | Global chords (14.4) | ✅ | 312 | SC-12 table · P18 §5.9 | P | — | Y | PARTIAL | ⌘\ and ⌘, missing from SC-12. ⌘, vs ⌃, is ambiguous (T1-10, T1-11) |
| F-SH-148 | F6 region cycling (14.5) | ✅ | 313 | SC-5 | Y | — | Y | COVERED | Adds banner slot + ⌃` fallback |
| F-SH-149 | Escape innermost (14.6) | ✅ | 314 | SC-2 · P12 §4.4 | Y | — | Y | COVERED | — |
| F-SH-150 | Deep links (14.7) | ✅🆕 | 315 | P22 T-GS-01, G-9 · P10 ST-01 · MS IAF-20 E | P | — | P | PARTIAL | States for an invalid/deleted/forbidden `?el=` / `?page=` target are unspecified |
| F-SH-151 | Toast stacking rule (15.1) | 🟡🆕 | 321 | P22 §5.10 | Y | caps, "+N more" | Y | COVERED | — |
| F-SH-152 | Undo/redo feedback (15.2) | ✅ | 322 | P24 §4.4 · UN-09 · P05 §5 | Y | succ, dis ("Nothing to undo") | Y | COVERED | — |
| F-SH-153 | Editing/insert/clipboard toasts (15.3) | ✅ | 323 | P24 §4.1 rows 1–2, 4 · SC-3 · SC-13 | P | succ | P | PARTIAL | Copied/cut/pasted and insert-failure toast copy is unspecified |
| F-SH-154 | "Connect to tokens" offer (15.4) | ✅🆕 | 324 | P09 Checks row ("Connect-to-tokens subtask (existing)") · CPres M01-15.4 | N | — | N | PARTIAL | The trigger toast after a template apply is not in P15, P09 or P22 (T1-30) |
| F-SH-155 | Auto alt-text on upload (15.5) | ✅🆕 | 325 | SC-21 · P20 AI-09 | — | — | — | DEFERRED-BY-DECISION | Hook not mounted while AI is off (SC-21) |

## Counts

| Coverage status | Rows (FIDs) |
|---|---|
| COVERED | 106 |
| PARTIAL | 31 |
| CONFLICT | 5 |
| OMITTED | 0 |
| DEFERRED-BY-DECISION | 1 |
| REMOVED-N/A | 12 |
| **Total FIDs** | **155** (156 INV rows; 3.16 and 3.17 merged) |

Notes: 14 INV ❌ rows give 12 REMOVED-N/A. 2.6 (live chip) and 6.6 (deleted-target note) are revived by docs and counted COVERED. No row is OMITTED: every PARTIAL item at least appears in the CPres family map.

## Principle observations

| PID | Module | Observation (spec-level) | Risk | Evidence | Suggested status |
|---|---|---|---|---|---|
| P23 | Status / global states | Six-level surface ladder (full screen › dialog › banner › status › toast › bell). Save priority, publish progress "n/N" and "Status unavailable" (never 0) are all defined | Low | P22 §4.1 · SC-4 · P14 §4.2 · P01 §5.7 | PASS-SPEC |
| P38 | Shell states | Most shell surfaces list loading/error/empty/permission. Gaps: share-link dialog, sync-failure level, deep-link bad target, Permissions dialog, issue copy | Medium | F-SH-045/090/114/124/150 | NEEDS REVISION |
| P25 | Recovery | Conflict backup failure keeps conflict. Recovery copy is user-scoped. Session resend is defined but gated | Medium (gated) | P22 §5.2, §5.4 · SC-9 ⛔ G-2/G-12 | BLOCKED (G-2 auto-resend); rest PASS-SPEC |
| P24 | Error prevention | SC-15 Undo-over-confirm is clear. Panel text still keeps confirms outside its list (Duplicate site, Delete site) | Medium | SC-15 · P01 §6 · P10 Danger zone | NEEDS REVISION |
| P31 | Consistency | One back-label pattern (SC-1) and one task header (P12 §4.2). Navigation-guard dialogs use 3+ button sets | Medium | SC-1 · P02 §7 · P10 §5 · P01 §7.1 | NEEDS REVISION |
| P33 | Navigation | Two destination types (tool panel vs area), one active task, exact-return rules | Low | P02 §5–6 · P12 §4.1 · SC-1 | PASS-SPEC |
| P26 | Discoverability | Palette has no topbar button (OD-18-3). Issues count only in the ⋯ row label (Q-TB3). Both are owner-decided; P18 adds "Search ⌘K" in the ⋯ header and sheet header | Medium | P18 §10 · P01 §11 | PASS-SPEC (owner decision; residual risk) |
| P02 | Hick | Palette opening list no longer floods with pages ("Go to page ›"). Empty canvas has one primary path. Publish goes from 4 dialogs to 1 | Low | P18 §4.1 · P16 §4.1 · P14 §4.3 | PASS-SPEC |
| P04 | Progressive disclosure | Status "Details ⌄" popover. Banner "N more ⌄". Palette "Show all ›" nested levels | Low | P11 §8 · P22 §4.2 · P18 §4.3 | PASS-SPEC |
| P34 | Responsive | Topbar compact ≤1280 / ≤1024 reduction order. Rail scrolls at short height. Task sheet ≤1280. Narrow-window banner never blocks. None measured | Medium (unmeasured) | P01 §8 · P02 §9 · P12 §4.5 · P22 §5.13 | PASS-SPEC (geometry NOT MEASURED) |
| P39 | Accessibility | F6 + ⌃` fallback, single-key toggle (WCAG 2.1.4), single alert owner, focus return, never-block zoom. Skip link and ⌘\ unspecified | Low–Medium | SC-5 · SC-12 · P22 §8 · P18 §8 | NEEDS REVISION (skip link) |
| P20 | Spatial consistency | Save status and page tabs both move (top → bottom bar). Achievement toast position conflicts with the toast floor. Checklist pill relocation is not mapped | Medium | P11 §4 · P16 §4.3–4.4 · P22 §5.10 | NEEDS REVISION |
| P05 | Recognition | Rail labels under icons. Site settings always labelled. Disabled rows show reasons inline | Low | P02 §8 · P01 §5.3 · P18 §5.6 | PASS-SPEC |
| P35 | Component reuse | One review-and-publish dialog, one banner slot, one toast system, one capability resolver (K-2) | Low | P14 §4.3 · P22 §4.2 · P18 §11 | PASS-SPEC |
| P06 | Mental models | Site name is no longer a hidden Pages door. "Release" and "Changes not published" nouns (SC-11). Live dot added | Low | P01 §5.2 · SC-11 | PASS-SPEC |
| P40 | UX debt | Many shell rows ship only on fallbacks (⛔ G-2, G-12, P-1, R-11, MP-3…5, IXD-3, P-TRIAL) | High | SC-9 | BLOCKED (per ⛔ row) |

## Contradictions & gaps

| ID | Type | Statement A | Statement B / missing | Severity | Proposed resolution |
|---|---|---|---|---|---|
| T1-01 | contradiction | P02 §7: guard dialog (existing `UnsavedTabSwitchDialog`) = **Keep editing · Leave and lose changes** (+ Retry/Stay on failure) | P10 §5 "Dirty guard": existing dialog = **Keep editing / Discard / Save and continue**, applied to rail clicks and Back to Editor. INV 4.11: "Keep editing vs a leave action" | Major | Define one guard dialog in P00 (button set, when "Save and continue" is offered) and point P02/P10/P12 at it |
| T1-02 | contradiction | INV 4.11 (`useTabSwitchGuard`): guard covers "staged Brand" | P02 §7: "Brand stays unguarded (autosave) — inventory 4.11 is corrected". SC-4/P11 §8: Brand has a local "applied locally" state before receipt | Major | Code-read is UNKNOWN which one is true. Settle it from source before spec, and state whether "applied locally" counts as dirty |
| T1-03 | contradiction | P01 §6: Duplicate site "Confirm → toast Open · Keep" | P00 SC-15: confirms remain **only** for the listed cases; "Any other confirm in panel text is overridden" | Minor | Either add "Duplicate site" to the SC-15 list (it is not destructive, so likely drop the confirm) or amend P01 §6 |
| T1-04 | contradiction | P10 ST-04 / §… "Danger zone: unchanged actions and confirmations" (delete = typed DELETE, INV 11.10) | SC-15 exception list names transfer and unpublish but **not site delete**. Sites have a 30-day Recently deleted (P22 GS-06), so Undo/restore is possible | Major | Add "delete site" to the SC-15 declared exceptions or specify an Undo + Recently deleted path. Add the 30-day restore line to the "{site} deleted" screen (INV 11.10 note) |
| T1-05 | stale | CPres M01-3.4 / 3.16 / 3.17 / 11.10: "Move → IAF-14 Topbar → Site settings → named screen" | P01 §6 keeps Duplicate site, Site health ↗, Invite ↗, Account ↗ in the ⋯ menu ("Keep") | Minor | Update CPres dispositions to P01 §6 (panel spec is newer) |
| T1-06 | stale | CPres M01-13.6: scope chip "Defer" | P18 §5.1/§9: redesigned "In {Area}" removable chip | Minor | Update CPres |
| T1-07 | contradiction | CPres M01-2.8: review-closed toasts "Keep" | P22 §4.1/§5.10: toasts only for the outcome of the user's own action; events from elsewhere → bell (L6). P17 §4.4: client events → bell "Feedback" | Minor | Decide: retire the in-session toast in favour of bell + chip change, or declare it an exception in P22 §5.10 |
| T1-08 | contradiction | P15 (line 119): NEW door "Pages row menu › Save as template…" | P11 §5 row-menu list (Rename … Delete) has no such row. P15 also lists only a "name field" while INV 11.5 has name + description | Minor | Add the row to P11 §5. State whether the description field is kept |
| T1-09 | ambiguity | INV 8.1: Preview covers the top bar. SC-1 lists "Preview bar" as a 56px work-area header | P01 §1 "same topbar in every module workspace" and T-TB-10 list areas but not Preview. P01 §5.8 says "full-work-area Preview" | Minor | State explicitly whether the global topbar stays visible above the Preview bar |
| T1-10 | ambiguity | INV 14.4: "⌘, Settings". P10 ST-01: "⌃,/⌘," | INV 3.2 / P01 §5.3 / §6: "⌃, / Ctrl+,". SC-12 has no Site settings row (on macOS ⌃ ≠ ⌘) | Minor | Add a Site settings row to SC-12 with one macOS key |
| T1-11 | missing | INV 1.6 / 14.4: ⌘\ toggles the Inspector; "Show inspector ⌘\" button | Absent from the SC-12 table, P18 sheet groups and P12. P05 §9 names only a "canvas-corner Inspector door" | Minor | Add an SC-12 row plus a P12/P05 control contract for hide/show (label, placement, persistence) |
| T1-12 | missing | INV 1.11: Skip to Canvas link (stays tabbable under full-page views, UX-22) | No panel specifies it. Only CPres M01-1.11 → IAF-01 | Minor | Add it to P02 §8 or P05 §10: target per area, hidden when the canvas is replaced |
| T1-13 | missing | INV 6.3: bell counts all unread but lists 5 | P01 §5.7 / P22 §5.11 keep 5 rows. MS IAF-19 E: "full inbox entry preserved". No full-inbox or Load more spec | Minor | Specify "View all notifications" or Load more, or make the badge count match the list |
| T1-14 | ambiguity | P16 §4.4: achievement toast "in the checklist's corner" (bottom-left), stacked above Undo toasts | P22 §5.10: toasts sit 16 above the toast floor in the canvas column, ≤1 transient | Minor | Name one position; say whether the achievement counts against the transient cap |
| T1-15 | missing | INV 12.2: Getting-started chip at the rail foot above Help | P16 §4.3 moves it to bottom-left above the bottom bar. Not in P16 §8 preservation map; P02 §9 rail height omits it | Minor | Add a "Move" row to the P16 §8 map |
| T1-16 | ambiguity | INV 10.12: mirror/sync failures as toasts with "Retry now" | P22 §4.1 assigns persistent conditions to banners and save state to status. P11 §8 shows only "Sync queue (N waiting)", and P22 §1 sends per-owner messages out of scope | Minor | Assign sync failures to one level (status details row with Retry vs banner) |
| T1-17 | missing | INV 7.7 / 7.9: fix-failed band copy; issue messages "developer-facing" (L4-039) | P12 keeps "bands" by reference. CPres M01-7.9 says "Redesign", but no copy is specified | Minor | Add an Issues copy table (message, location, Fix label) to P12 §5 or P14 §5.2 |
| T1-18 | ambiguity | INV 10.4: RecoveryBanner "Discard & reload" (local crash draft) | SC-15 / P22 §7: discarding a **kept unsaved copy** needs a confirm. P22 keeps RecoveryBanner unchanged, with no rule for its Discard | Major | State whether RecoveryBanner's Discard falls under the same SC-15 exception |
| T1-19 | missing | INV 5.2: "+" not withheld in view mode | P11 §9: viewer Pages button disabled. Strip "+" for viewers/view mode is not stated | Minor | Specify "+" hidden or disabled-with-reason for viewers |
| T1-22 | stale | MS IAF-22 E: status labels "Saved at… / Offline—local changes / Saving revision…" | P11 §8: "Saved {time} / Offline — not saved / Saving…" | Minor | Align MS to P11 (P00 SC-4 wins) |
| T1-23 | missing | INV 8.3: fonts and colours differ between canvas and Preview (UX-09); "users can't trust it as what ships" | SC-8 fixes width; P19 IXD-3 fixes scripts. No doc addresses font/colour parity | Major | Add a parity requirement (or a visible limitation line) to SC-8 / IAF-15 |
| T1-24 | missing | INV 1.17: "Project update failed" (design-system schema) load toast | No surface level in P22 | Minor | Map it to the P22 ladder (banner vs toast) |
| T1-26 | stale | MS IAF-21 E: checklist order "Set brand, Add page, Add block…" | P16 §4.3 reorders it (section, preview first). Only IAF-21 H carries the amendment | Minor | Amend IAF-21 E |
| T1-28 | ambiguity | INV 11.4: "Set up Products collection" auto-offered on first product block (✅) | CPres M01-11.4: "Keep → IAF-23 … unsupported UI explicitly deferred". No panel mentions it | Minor | State keep / defer in P07 |
| T1-29 | missing | INV 11.9: Permissions dialog (⌘K "Permissions", viewer notice) | P18 §5.2 target index has no Permissions row. No panel specifies dialog content or states. P10 sketch only links "Permissions" | Minor | Add a Permissions row to P18 §5.2 and a short contract (content, roles, Delete site door) |
| T1-30 | missing | INV 15.4: "Connect to tokens" toast after a template lands raw values | P09 names only the Brand-checks subtask. P15/P22 do not specify the trigger toast | Minor | Specify the trigger, copy and action in P15 §5 or P09 |

## Consistency notes

| Topic | Variants found | Evidence |
|---|---|---|
| Leave/discard confirmations | "Keep editing / Leave and lose changes" · "Keep editing / Discard / Save and continue" · "Stay / Leave anyway / Save & leave" · "Leave — changes stay in this browser only" · "Discard prompt? Keep / Discard" · "Discard your reply? Keep / Discard" | P02 §7 · P10 §5 · P01 §7.1 · P22 §5.3 · P12 §4.3 · P17 §4.3 |
| Back labels | SC-1 one pattern "‹ Back to {origin}". Exceptions still in text: "‹ Back to editing" (owner view mode, P01 §5.1), "‹ Activity" (P12 RT-13 today → "‹ Back to Activity" §5) | SC-1 · P01 · P12 |
| Confirm vs Undo | SC-15 Undo-first. Panel confirms outside the list: Duplicate site (P01 §6), Delete site (P10). Checklist hide uses Undo (P16 §5.3), consistent | SC-15 |
| Disabled vs toast refusal | SC-6/SC-18 disabled-with-reason everywhere. The create-component no-selection toast (P13 CP-03, kept) and the old viewer rail toast (fixed in P02) are exceptions | P13 · P02 §11 |
| Toast durations | 5 s default / Undo ≥8 s (P22 §5.10) · achievement 6 s (P16 §4.4) · "Can't undo … from here" 4 s (P24 UN-09) · "✓ Published" 2 s (button state) | — |
| Status vocabulary | SC-4 / P11 "Saved {time}", "Offline — not saved" vs MS IAF-22 E "Saved at…", "Offline—local changes" | T1-22 |
| Live state glyphs | P01 dot (green / grey / amber / hollow) vs P14 glyph (● / ◐ / ○). Both use "Changes not published" (SC-11) | P01 §11 · P14 §8 |
| Popover/dialog widths | 360 bell / status details / task / "N more"; 240 Help popover; 640 palette; 720 sheet / publish dialog / conflict / page settings; 480 full-screen card / Upgrade / question dialog. Consistent family | P01 · P11 · P12 · P18 · P22 · P23 |
| Retry copy case | "Try Again" (SidebarFallbacks, flagged P22 §13 #9) vs "Try again" everywhere else | P22 §13 |
| Shortcut notation | ⌘H removed (SC-12), and P01/P12 amended. Site settings ⌃, vs ⌘, still mixed (T1-10). ⌘\ undocumented (T1-11) | SC-12 |
| Send for review surface | INV "popover" vs P17 §5.1 "dialog" | INV 9.2 · P17 §5.1 |
