# FEATURE_TRACEABILITY_MATRIX

## Current visual-evidence amendment — 2026-10-20

[Current handoff and source-acceptance mapping](../evidence/figma-design-execution/COMPLETION-2026-10-20.md) links the changed CMS creation/import/protection/recovery/Site-variable, Settings, Templates and recovery requirements to concrete states. [B4's 122-row map](../evidence/figma-design-execution/b4-20261020-source-mapping.md) explicitly separates 99 current controls, 18 superseded rows, 4 deferred rows and 1 nonvisual contract; it also indexes 69 blocks and 120 native routes. [Current frame inventory](../evidence/figma-design-execution/current-frame-inventory-2026-10-20.json) supports finding the other drawn families.

These are new bounded visual mappings, not a bulk upgrade of the historical 1,179 trace rows or a claim that all 1,238 source features were visually verified. Historical “no screens” claims below apply to their dated audit. Engine invariants, full per-acceptance playback, research and runtime remain separate. B9/R1 is pending by explicit user confirmation.

## B3.1 documentation mapping — 2026-10-19

This maps existing FIDs to the new owning written contracts; historical audit and visual entries below remain unchanged. **No new frames or runtime verification.** See [P11 §7.1–7.4](../panels/11-PAGES-AND-BOTTOM-BAR.md#71-b31-page-navigation-and-settings-return-contract) and [SC-24.1–3](../panels/00-SHARED-CONTRACTS.md#sc-241-navigation-transaction-and-draft-ownership--b31-2026-10-19). “Specified” here is not a new whole-feature completion status.

| Existing FID / capability | B3.1 mapping | Written disposition / remaining evidence |
|---|---|---|
| F-SH-068 — Page tabs | PG-G02/08/12; P11 §7.1–2 | Preserve page navigation and Viewer scope; shared guard, snapshots and exact activation specified; runtime pending |
| F-PG-004 — Go to page command | PG-G02; P11 §7.1 | Same named destination/guard as row and strip; palette hands off to one active modal; command playback pending |
| F-PG-015 — Select/open page | PG-G01–04/08/11/12 | Preserve identity; fixed pending target, successful resolution and return specified; source handler remains direct switch |
| F-PG-046 — Page settings shell | PG-G05/07; P11 §7.1–2 | Same scoped writer and captured origin; guard suspends underlying trap; geometry and accessibility unverified |
| F-PG-047 — Save model | PG-G03/06/10/11; SC-24.2 | Explicit owner completion, key-save versus close, partial/late results specified; remote receipt dependency remains |
| F-PG-048 — Discard guard | PG-G04/05/07; SC-24.1–3 | Extend current local two-action warning to SC-24; failed discard cannot navigate; no applied-history discard |
| F-ST-S10 — Unsaved settings guard | PG-G02/03/10; SC-24.1–3 | Shared page-navigation transaction preserves settings ownership. Preview/Publish variant unchanged and outside this slice |

PG-G09 additionally exercises SC-24's approved Brand pending/failed-save variant. It remains a shared-contract mapping; no invented FID or claim of full Brand coverage is added. PG-G11 uses IA-07/P22 recovery ownership; it does not certify all account/session recovery.

## Figma execution checkpoint · 2026-10-18 (later than Audit A)

The documentation audit below remains historical. New editable output now exists in the [authorized design file](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7). The following scoped mappings do **not** upgrade entire rows to complete design or runtime coverage. See [execution evidence](../evidence/figma-design-execution/README.md).

| Existing FID | Represented example | Actual scope / remaining work |
|---|---|---|
| F-SH-020 / F-PB-Y13 | J08 bottom status [8:1705](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=8-1705); C04 Saving / C05 failed | Saved/pending/failure represented; full conflict/offline/priority set remains B7. No real save verified. |
| F-SH-021 | Named Details button in J08; current journey ledger records its ID | Trigger represented; status-popover destination and complete click matrix remain B3. |
| F-SH-030 / F-SH-086 / F-SH-087 / F-SH-088 | J11 Preview [8:3262](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=8-3262) → J12 return | Tablet 768 draft snapshot, interim fidelity note and return link represented. Loading/failure, page navigation, actual output fidelity remain partial. |
| F-SH-152 | J09 Undo → J10 / Redo → J09 | Connected illustrative states; actual history engine, disabled reasons and feedback breadth remain unverified. |
| F-CV-019 / F-CV-022 / F-CV-026 | J06 Desktop 1440 → J07 Tablet 768, retained 52% zoom | One responsive switch represented using current P05 amendment. Other breakpoint/preset/custom-width branches remain B3. |
| F-CV-027 / F-CV-030 | Percentage/menu split control across current frames | Split geometry represented. Zoom-menu contents, 100% state, pointer-centered zoom and real interaction remain partial. |
| F-CV-051 | C03 [10:1190](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=10-1190) | Combined 2-object bounds without handles, common ancestry, multi actions and accurate Mixed specimen. Bounded post-fix design review passed; multi operations/keyboard/runtime not verified. |
| F-PB-Y15 | C05 [10:2199](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=10-2199) | Failed save disables Publish and exposes Retry; linked Retry→Saving is an illustrative state transition. |

All other FID mappings remain at their recorded documentation status until their owning batches are inspected. This is not a full 1,179-row reconciliation.

Date 2026-10-18 · Mode AUDIT (design-only) · Object of verification: **design documentation**, not runtime, not hi-fi design (none exists).

Source of features: `docs/editor-feature-inventory-2026-10-16.md` (INV, 1,238 code-read rows). Design homes: `docs/audit-and-design-2026-10-16/` (P = panels/, PDB = PRODUCT-DESIGN-BRIEF, MS/CP/REG = IA-final evidence registers). Rows merged only where family, coverage and home are identical. Extraction files with full gap notes: `_extraction/T1…T7`.

Coverage vocabulary: COVERED (location + controls + states specified) · PARTIAL · OMITTED · DEFERRED-BY-DECISION · REMOVED-N/A · CONFLICT.

**Verification status column for every row = DOC-TRACED ONLY.** No row is design-verified (no screens) or runtime-verified (no walk this pass).

## Summary (Audit A — documentation coverage)

| Coverage | Rows | Share |
|---|---|---|
| COVERED (UI: location + controls + states cited) | 577 | 49% |
| COVERED (engine rule — non-UI invariant a doc honours) | 95 | 8% |
| PARTIAL | 293 | 25% |
| CONFLICT | 33 | 3% |
| OMITTED | 33 | 3% |
| DEFERRED-BY-DECISION | 46 | 4% |
| REMOVED-N/A | 102 | 9% |
| **Total trace rows** | **1,179** | (1,238 INV rows; contiguous identical rows merged) |

**Verdict: 100% coverage is NOT claimed.** 359 rows (PARTIAL + CONFLICT + OMITTED) need doc work before any screen can be called complete. Every row is DOC-TRACED only — none is design-verified (no hi-fi screens) or runtime-verified.

Caveats on what COVERED means:
- **Corrected after independent review (2026-10-18):** 34 rows whose only design home was an IA-final register entry (PM/MS/CP/REG) and 5 rows with no controls or states cited were downgraded COVERED → PARTIAL (tagged "[audit 10-18 …]" in the note). Engine-rule rows (F-EN-*) are counted separately because "controls/states" do not apply to them.
- About 40 further PARTIAL rows across T2/T3/T4 exist **only** as a one-line disposition in the IA-final register (`evidence/ia-final-2026-10-16/`), with no controls or states. They are counted PARTIAL, not COVERED.
- "Kept (existing)" rows are COVERED only where the existing behaviour was described; drag feedback, marquee and format bar were "kept" with no state spec and are PARTIAL.

### OMITTED rows that need a design answer (user-facing)

| FID | Feature | Needed |
|---|---|---|
| F-PB-Y18–Y19 *(CONFLICT, P0)* | "Restore my edits" / Retry overwrite newer server work (BK-04) | P/22 §5.2/§7: compare kept-copy time with server revision before Restore; server newer → Download copy + Compare, never silent apply; ⛔ SC-9 row |
| *(now PARTIAL)* F-PB-Y45, F-PB-R15, F-EN-C5.6 | Site-scope authz holes — decided in PDB:173 (P1-D20) and PDB:187 FI-05 + T-FI-05, P13 FI-05; **missing only from SC-9 ⛔ and the backlog** | add SC-9 ⛔ + backlog rows; refusal copy |
| F-PB-P19 | Publish legal line | Restore it in P/14 or record its removal as a decision |
| F-ST-S13 | Settings cards blame "your connection" for server errors | Server-vs-network error copy (SC-level, reuse P/22) |
| F-ST-S22 | General · premature validation | Validate-on-blur/touch rule (CTRL-01) |
| F-ST-S47 | Forms submitted before first publish | State + copy in Forms home |
| F-PB-Y11, Y12, Y26, Y32 | Settings mirror refused · CMS bindings too large · CMS hydration error · storage full | Rows in P/22 state ladder with copy + recovery |
| F-EN-A1.2 | Types refined on load/paste (Layers may show a different type) | One line in P/04 / P/06 |
| F-EN-A1.6 | Drop depth limit 50 | Refusal copy in P05 drag-feedback table |
| F-EN-C5.7 | Load-time damage scan → Issues rows | Issue row copy in Issues task |
| F-EN-B37 | Purple gradients in templates (banned hue) | Owner call (with T6-14 starters) |
| F-EN-C1.1, C2.9, C2.13, C2.15–17 | Open L-bugs with user-visible effect (export drops text, nested saved component, rich-text strip on key rename, repeated field names, upload element, library re-upload) | Each needs correct-behaviour line in its panel |

Non-UI or dev-only OMITTED rows (F-PB-Y5, Y10, F4, F-EN-A2.6, A3.40, A5.4/5/7/14, A6.5, B11, B20–22, C3.6) need no screen; recorded for completeness.

### CONFLICT rows (33) — resolve before Figma
Grouped by cause:
1. **SC-15 confirm rule vs panel confirms** (F-SH-039, F-SH-125, F-PG-071, F-AD-052, F-ST-S37, S50, S52, F-IN-49): one decision fixes all — see CROSS_SCREEN_CONSISTENCY_AUDIT CS-01.
2. **SC-13 override/reset wording vs FD-INS** (F-IN-38, F-IN-39): CS-04.
3. **BATCH-01A stale vs FD-INS-02** (F-IN-01, F-IN-19, F-IN-51, F-IN-90): mark BATCH-01A superseded (DOC-03).
4. **Unsaved guard dialogs** (F-SH-064): CS-02.
5. **Factual drift vs code** (F-AS-14 quota 90/80, F-AS-50 audio, F-AS-52 synthetic progress, F-FM-12 spam toggle live vs next publish, F-CV-102 lock gate "existing", F-EN-A1.1 element count 69/54/55, F-EN-A5.3 marquee): correct the doc to the code fact.
6. **Scope undecided** (F-PB-C1/F-CM-13 e-commerce, F-PB-X2 export "Soon" tiles, F-EN-B5 Brand from URL, F-BR-10 preview width, F-AD-026 Library scope, F-PG-086 Layers empty copy, F-SH-025 others' toasts, F-SH-051 stale map): owner or author decision, listed in FINAL_DESIGN_QA_REPORT §5.

## Shell (top bar, site menu, rail, dialogs, onboarding, ⌘K, keyboard, toasts)

INV §1 lines 96–360 · 155 rows · gaps: `_extraction/T1-shell.md` §Contradictions & gaps

| FID | Feature | INV | INV line | Design home | Controls | States specified | Interaction | Coverage | Gap / note |
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
| F-SH-145 | Keyboard legend card (14.2) | 🐞 | 310 | P18 §9 (Removal) · P02 §11 | — | — | — | PARTIAL | [audit 10-18: no controls/states cited → PARTIAL] Deliberate removal; rows → sheet BASICS |
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

## Canvas + canvas interactions

INV §2 lines 361–616 · 147 rows · gaps: `_extraction/T2-canvas.md` §Contradictions & gaps

| FID | Feature | INV | INV line | Design home | Controls | States specified | Interaction | Coverage | Gap / note |
|---|---|---|---|---|---|---|---|---|---|
| F-CV-001 | Page card on grey canvas | ✅ | 365 | P05 §4, §9 (wrapper 24 gutter, frame radius 12) | Y | authored frame width; Fit | P | COVERED | 1440 frame (P05 §5) is wider than the 752 px column, so behaviour rests on Fit. REVIEW §7:71: about 52 % zoom on laptops, unresolved |
| F-CV-002 | Auto fit-to-width on load | ✅ | 366 | P05 §5 Desktop width ("Fit zoom on load is unchanged"), Remember view | Y | load → Fit; reload → Desktop + Fit | Y | COVERED | Sub-100 % default is where INV 6.4/7.6 bite; resize compensation specified, marquee compensation not |
| F-CV-003 | Click grey surround to deselect | ✅ | 367 | P05 CV-08 kept; P04 §7 "Empty-canvas click … deselects only" | Y | deselect; Layers stays open (Change) | Y | COVERED |  |
| F-CV-004 | Page links/forms can't navigate editor | ✅ | 368 | P05 CV-18 "DOM render … with navigation guard" kept | P | — | P | PARTIAL | Named only; no states (for example feedback when a link click is swallowed) |
| F-CV-005 | Live widget runtimes on canvas | ✅ | 369 | REG M02-1.5 Keep | N | — | N | PARTIAL | REG-only. Relation to "canvas never runs interactions" (P19 §5.3) not stated |
| F-CV-006 | CMS preview + Collection list repeat | 🟡 | 370 | FD-DYN §12–13, D5; P05 §5 Record ▾, View › Show drafts | Y | published default, Show drafts, 0 records, inert copies 2..N, status line | Y | COVERED | Resolves L3-017 (D5: canvas follows Show drafts) |
| F-CV-007 | Animations + global custom CSS live on canvas | ✅ | 371 | REG M02-1.7 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-008 | Locked element styling | ✅ | 372 | P05 §8 Locked element; SC-14 | Y | dotted outline, not-allowed, no handles, badge | Y | COVERED | Canvas marker for SC-14 *inherited* (descendant) lock not specified; Layers only (T2-29) |
| F-CV-009 | Hidden (Layers eye) element | ✅ | 373 | P04 §6 "Dim in editor" | Y | dimmed; selectable from Layers; tooltip "still published" | Y | COVERED | Renamed. Canvas 25 % rendering kept implicitly ("same behaviour", P04:163) |
| F-CV-010 | Hidden-per-breakpoint | ✅ | 374 | SC-13; IAF-02 I; P04 §5 markers | Y | hidden at current breakpoint; reachable via Layers | P | COVERED |  |
| F-CV-011 | Empty container placeholder copy | 🐞 | 375 | REG M02-1.11 Fix | N | — | N | PARTIAL | REG-only. The stale hint names a removed "+" control; no doc gives the new copy (T2-23) |
| F-CV-012 | Empty column label | ✅ | 376 | REG M02-1.12 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-013 | Src-less image placeholder | ✅ | 377 | REG M02-1.13 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-014 | Drop/insert flash + settle | ✅ | 378 | REG M02-1.14 Keep | N | — | N | PARTIAL | REG-only. No motion spec, no reduced-motion rule for chrome |
| F-CV-015 | Layers-row ↔ canvas hover | ✅ | 379 | P05 §6 Hover; P04 §7 "Hover locate" | Y | two-way hover; crumb hover | Y | COVERED |  |
| F-CV-016 | Read-only / view mode | ✅ | 380 | P05 §8 Read-only; SC-6 Canvas row | Y | withheld actions; breadcrumbs select-only; Undo/Redo hidden | Y | COVERED | Change: Undo/Redo hidden for viewers |
| F-CV-017 | "Pick an element" mode | ✅ | 381 | P05 §8 "Choose on canvas" (Components); P19 §4.3 "Pick on canvas…" | P | banner, eligible hover, not-allowed + reason, Esc | P | PARTIAL | The spec covers only the Components and Interactions pickers. The general Inspector crosshair mode (INV 1.17) is not named and is not shown to share that contract |
| F-CV-018 | Screen-reader live region | ✅ | 382 | P05 §10 | Y | selection announcement copy | Y | COVERED |  |
| F-CV-019 | Breakpoint switch | 🟡 | 388 | P05 §5 Breakpoint segments; SC-13; §7 "Editing Tablet" | Y | active segment non-colour; label in frame; cascade | Y | COVERED | Fixes UX-06 |
| F-CV-020 | Wide 1920 | ❌ | 389 | P05 §5 Width field presets; SC-13 | Y | Desktop preset, not a breakpoint | Y | COVERED | Revived by the docs as a preset. REG says Defer: stale (T2-15). IAF-02 F still lists Wide alongside the breakpoints |
| F-CV-021 | Watch device | ❌ | 390 | — | — | — | — | REMOVED-N/A | No doc revives it |
| F-CV-022 | Re-fit zoom on breakpoint switch | ✅ | 391 | P05 §5 Remember view | N | — | P | PARTIAL | Remember view keeps zoom per page. It does not say whether a breakpoint switch still re-fits (T2-21) |
| F-CV-023 | Width label under page | ✅ | 392 | — (P05 §5 width field + §7 "Editing Tablet" label) | N | — | N | PARTIAL | Not mentioned. Whether it is replaced or kept is undecided (REG Keep) |
| F-CV-024 | Custom width | ✅ | 393 | P05 §5 Width field; IAF-02 H | Y | invalid draft + inline error, Enter/Esc, saved per site | Y | COVERED | Modal retired. Strict parsing (T-CV-06, T-CV-15) |
| F-CV-025 | Device frame | 🟡 | 394 | P05 §5 View ▾ "Show device frame" | Y | Tablet/Mobile only | Y | COVERED | Moving it into the View menu removes the inline-style button |
| F-CV-026 | "Desktop" = three widths | 🟡 | 395 | P05 §5 Desktop authoring width; SC-8; P01 §5.8 | Y | 1440 canvas = Preview = export | Y | COVERED |  |
| F-CV-027 | Zoom menu | ✅ | 401 | P05 §5 Zoom | Y | presets, Fit, Zoom to selection, ⌘/Ctrl+scroll, pinch, 10–400 | Y | COVERED | Adds the Zoom-to-selection row that INV says is missing |
| F-CV-028 | View › Zoom submenu | ✅ | 402 | P05 §5 View ▾ (row list omits Zoom ▸/Breakpoint ▸) | P | — | P | PARTIAL | Removal of the duplicate door is implied, not stated. P05 §11 "CV-03 … Keep + extend" is ambiguous |
| F-CV-029 | Zoom keys | ✅ | 403 | SC-12 (⇧1, ⇧2, ⇧0, ⌘0 alias); P05 §5 | Y | per-browser acceptance | Y | COVERED | INV 3.4 "(also ⌘K)" zoom-to-selection alias is not addressed. ⌘K is the palette (T2-20) |
| F-CV-030 | Zoom to fit / to selection | ✅ | 404 | P05 §5 Zoom | Y | — | Y | COVERED |  |
| F-CV-031 | Zoom-aware overlays | 🟡 | 405 | P05 §6 Resize ("bounds zoom-compensated") | P | — | P | PARTIAL | Only resize is compensated. Marquee (7.6) and W×H pill placement are not (T2-12) |
| F-CV-032 | Empty-page CTA | 🟡 | 411 | P16 §4.1 (supersedes P05 §8) | Y | one primary path, Start blank persisted | Y | PARTIAL | UX-01 (clips at 1280×720) and UX-02 (competes with tips) have no geometry or short-height rule (T2-25) |
| F-CV-033 | Template cards in empty CTA | 🟡 | 412 | P16 §4.1 | Y | card → that template's preview (Replacing mode) | Y | COVERED | Fixes UX-03. Board 4428:44164 stale (F-5) |
| F-CV-034 | Add a block / Describe doors | ✅ | 413 | P16 §4.1 "+ Add a section"; SC-21 | Y | Describe hidden | Y | COVERED | Describe = DEFERRED-BY-DECISION (SC-21) |
| F-CV-035 | Start blank | ✅ | 414 | P16 §4.1 | Y | persisted per page per user (F-2) | Y | COVERED |  |
| F-CV-036 | Loading skeleton | ✅ | 415 | P05 §8 "Existing skeleton"; P22 §5 boot "one shell skeleton" | P | "Opening {site}…" | P | COVERED | Which skeleton survives is ambiguous: canvas skeleton or the single shell skeleton (T2-27) |
| F-CV-037 | Project unavailable | ✅ | 416 | P22 §4.2 global banner slot; GS-05 | Y | banner kinds, Retry, priority | Y | COVERED | Canvas render error is NEW (P05 §8) |
| F-CV-038 | Default hover | ✅ | 422 | P05 CV-09 kept, §6 Hover | Y | outline + label | Y | COVERED |  |
| F-CV-039 | Alt-hover hierarchy | ✅ | 423 | P05 CV-09 "Alt parent chain" kept | Y | — | P | COVERED | No discoverable door (INV note). Not in the P18 sheet BASICS either (T2-37) |
| F-CV-040 | Alt+Shift box model | ✅ | 424 | P05 CV-09 kept | Y | — | P | COVERED | Raw hex in badge and orange/green/blue fills are not tokenized (T2-26) |
| F-CV-041 | Clone badge (⌘ held) | ✅ | 425 | REG M02-5.4 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-042 | Inspector mode (I key) | ❌ | 426 | — | — | — | — | REMOVED-N/A | Also I = AI task (SC-12, inactive) |
| F-CV-043 | Hover drag grip | ✅ | 427 | REG M02-5.6 Keep | N | — | N | PARTIAL | REG-only. Grip is the primary drag affordance but is not in P05 |
| F-CV-044 | Selection box | ✅ | 433 | P05 CV-10, §6 | Y | single / multi / locked / CMS | Y | COVERED |  |
| F-CV-045 | Selection tag | ✅ | 434 | P05 CV-10 tag "Type · name" kept | Y | page root "Page" (SC-11) | P | COVERED |  |
| F-CV-046 | Resize handles | ✅ | 435 | P05 CV-10; §9 handles 12/8 + focus ring | Y | focusable | Y | COVERED |  |
| F-CV-047 | Resize at zoom ≠ 100 % | 🐞 | 436 | P05 §6 Resize (Fix FI-01); FDB FI-01/T-FI-01 | Y | zoom-compensated bounds | Y | COVERED | Engineering fix; specified as acceptance |
| F-CV-048 | Esc cancels resize | 🐞 | 437 | P05 §6 Resize; T-CV-03; P24 row 5 | Y | gesture-only cancel, one Undo step | Y | COVERED |  |
| F-CV-049 | NaN risk in resize | 🐞 | 438 | P05 §6 "finite valid values only"; T-FI-01 | P | — | P | COVERED |  |
| F-CV-050 | Resize modifiers | ✅ | 439 | P05 CV-12 "with modifiers" | P | — | P | PARTIAL | Modifiers (Shift, Alt, Ctrl snap, min sizes) are not enumerated in any doc. No hint surface |
| F-CV-051 | Multi-select resize | 🐞 | 440 | FDB FI-01 (T-FI-01 "multi-selection"); IAF-02 I | N | — | N | PARTIAL | No decision on hiding handles or wiring multi-resize. REVIEW §7:73 flagged it; not resolved in SC-17 or P05 (T2-6) |
| F-CV-052 | Rotation handle | ✅ | 441 | P05 CV-10 kept | Y | Shift 15°, slider semantics | Y | COVERED |  |
| F-CV-053 | Size label while resizing | ✅ | 442 | P05 CV-10; §9 collapse step 2 | Y | — | P | COVERED | Misplacement at zoom ≠ 100 % is folded into FI-01 |
| F-CV-054 | CMS-bound badge | ✅ | 443 | P05 §6 badges | Y | single only | P | COVERED |  |
| F-CV-055 | Locked badge | ✅ | 444 | P05 §6; SC-14 one lock copy | Y | "Locked — unlock to edit" | Y | COVERED | Resolves the copy mismatch |
| F-CV-056 | Selection toolbar (single) | ✅ | 445 | P05 CV-11, §6 | Y | inside/outside small elements | Y | COVERED |  |
| F-CV-057 | Toolbar caption overlap | 🟡 | 446 | REG M02-6.14 Redesign | N | — | N | PARTIAL | REG-only. P05 §6 "buttons unchanged" is silent on the caption (T2-22) |
| F-CV-058 | Old toolbar actions (parent, + child, wrap, AI…) | ❌ | 447 | P05 §5 Breadcrumbs; SC-3; SC-2 Esc → parent | Y | — | Y | REMOVED-N/A | The capabilities moved: parent via breadcrumbs and Esc, Move/Wrap via the SC-3 menu. AI is SC-21 |
| F-CV-059 | Add-child modal; Edit-with-AI popover | ❌ | 448–449 | — | — | — | — | REMOVED-N/A | AI part also SC-21 |
| F-CV-060 | Bottom breadcrumb bar | ❌ | 450 | P05 §5 Breadcrumbs (toolbar) | Y | overflow, multi "· 3 elements", none = "Page" | Y | COVERED | Revived in the top toolbar. REG Defer is stale |
| F-CV-061 | Footer selection readout | ✅ | 451 | P05 §5 Breadcrumbs last crumb "· 640 × 48"; §11 | Y | dropped at collapse step 2 | Y | COVERED | Move |
| F-CV-062 | Click / Shift / ⌘ cycle / dbl / triple | ✅ | 452 | P05 §6 Selection + Double-click (Fix) | Y | locked → toast | Y | COVERED | Fixes the double-click conflict (T-CV-08) |
| F-CV-063 | Spacing spots | ✅ | 453 | P05 CV-14, §6 Spacing chips; View ▾ Spacing | Y | default off | P | COVERED |  |
| F-CV-064 | Multi-select box | ✅ | 459 | P05 CV-10 "combined multi box" | Y | primary solid / others dashed (INV only) | P | COVERED | Visuals are kept only by reference |
| F-CV-065 | Canvas align/distribute toolbar | ❌ | 460 | FDB INS-D12 (Inspector) | — | — | — | REMOVED-N/A | Capability lives in the Inspector |
| F-CV-066 | Toolbar hidden in multi-select | 🟡 | 461 | SC-17 Multi-selection (Duplicate · Delete · Group · More) | P | — | P | PARTIAL | SC-17 adds a multi toolbar. P05 CV-11/§6 still say single-only. Anchor/placement on the combined box is unspecified (T2-1) |
| F-CV-067 | Multi-delete confirm | ✅ | 462 | SC-3 "Delete … never asks"; P24 row 2 | Y | toast "N elements deleted · Undo" | Y | COVERED | Change: confirm removed. REG Keep is stale (T2-16) |
| F-CV-068 | Marquee select | 🟡 | 463 | P05 CV-08/§6 "marquee kept" | P | — | P | PARTIAL | The start rule (only the 20 px strip works) and parent+child co-selection are not addressed (T2-11) |
| F-CV-069 | Marquee at zoom ≠ 100 % | 🐞 | 464 | REG M02-7.6 Fix | N | — | N | PARTIAL | REG-only (T2-12) |
| F-CV-070 | Double-click to edit text | ✅ | 470 | P05 §6 Double-click, Inline text; SC-14 lock | Y | lock refused | Y | COVERED | P21 §4.3 adds the "Ana is typing here" confirm |
| F-CV-071 | Inspector "Edit text on canvas" | ✅ | 471 | REG M02-8.2 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-072 | Floating rich-text toolbar | ✅ | 472 | P05 CV-15 "format bar kept" | Y | — | P | COVERED | Stays an inline-style toolbar outside chrome-ui; migration not specified (P35) |
| F-CV-073 | Inline commit / cancel | 🟡 | 473 | P05 CV-15 (Enter commit, Esc revert); SC-17 field undo; P24 row 7 | Y | field undo → one step | Y | PARTIAL | Enter-always-commits is kept, so the format bar's lists can't get a second item and there are no line breaks (T2-9) |
| F-CV-074 | "Type here..." placeholder | ✅ | 474 | REG M02-8.5 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-075 | View ▾ menu | ✅ | 480 | P05 §5 View ▾ | Y | "View · N", contextual rows | Y | COVERED | UX-06 fixed by moving Breakpoint out |
| F-CV-076 | Overlay chords | ✅ | 481 | SC-12 (⇧R, ⌥B, ⌥X; Canvas scope) | Y | scope Canvas only | Y | COVERED | The scope fixes the "fire behind full-page tools" problem |
| F-CV-077 | Snap / smart guides | ✅ | 482 | P05 §5 View ▾ "Snap guides" | P | — | N | PARTIAL | Toggle only. Guide visuals (magenta lines, red labels) are not specified or tokenized (T2-26) |
| F-CV-078 | Grid overlay + size | 🟡 | 483 | P05 §5 "Grid + pane" | P | — | P | PARTIAL | 10 px default not a preset; unresolved (T2-31) |
| F-CV-079 | Snap-to-grid follows Grid | ✅ | 484 | REG M02-9.5 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-080 | Rulers + guides | ✅ | 485 | P05 §5 "Rulers ⇧R" | P | — | N | PARTIAL | Guide create, move, remove and lock gestures are unspecified (T2-32) |
| F-CV-081 | Guides saved with site | ✅ | 486 | REG M02-9.7 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-082 | Badges; X-Ray | ✅ | 487–488 | P05 §5 View ▾ (⌥B, ⌥X) | Y | — | P | COVERED |  |
| F-CV-083 | Component view / Outlines / Dev mode | ❌ | 489 | — | — | — | — | REMOVED-N/A |  |
| F-CV-084 | Overlay state remembered | ✅ | 490 | P05 §5 Remember view (breakpoint, width, zoom only) | N | — | N | PARTIAL | Overlay persistence is not stated |
| F-CV-085 | Docked footer bar | ✅ | 496 | P05 §4, §11 (toolbar above canvas) | Y | 44h / two rows 88h | Y | COVERED | Move (BD-10) |
| F-CV-086 | Undo / Redo buttons | ✅ | 497 | P05 §5 Undo/Redo; P24 | Y | disabled, "Undo {label}", area-aware | Y | COVERED | Labels depend on P24 problem 6 (machine words) |
| F-CV-087 | Inspector toggle; Help on bar | ❌ | 498–499 | P18 §4.5 Help popover; ⌘\ | — | — | — | REMOVED-N/A |  |
| F-CV-088 | Toasts anchored to canvas | ✅ | 500 | P05 §9 Moved anchors; P22 §5.10 | Y | 16 above toast floor | Y | COVERED |  |
| F-CV-089 | Open menu: right-click / Shift+F10 / ⋯ | ✅ | 506 | P05 CV-16; SC-3 columns | Y | multi kept on member hit | Y | COVERED |  |
| F-CV-090 | Menu structure | ✅ | 507 | SC-3 registry; P05 CV-16 | P | — | P | PARTIAL | No order or grouping is defined after SC-3 adds rows. IA-02 (clipboard buried, Delete next to AI) is unresolved. The menu is one generic registry, not per type (T2-3, T2-4) |
| F-CV-091 | Keyboard in menu | ✅ | 508 | P05 §10 "Canvas keys unchanged"; P04 §10 (Layers) | P | — | P | PARTIAL | Submenu keyboard is not respecified for canvas |
| F-CV-092 | Menu viewport clamping | 🐞 | 509 | REG M02-11.4 Fix; P04 §10 (Layers menu clamps) | N | — | N | PARTIAL | Canvas menu clamp is not specified (T2-13) |
| F-CV-093 | Disabled-row reasons | 🟡 | 510 | SC-3 ("refusals same for every surface"); SC-14; SC-18 (palette) | P | lock copy | N | PARTIAL | How the reason renders in a canvas menu row is not specified (T2-14) |
| F-CV-094 | Duplicate / Delete rows | ✅ | 511 | SC-3; P24 rows 2–3 | Y | Undo toast | Y | COVERED |  |
| F-CV-095 | Copy / Cut / Paste | ✅ | 512 | SC-3 | Y | Paste greyed when empty (INV) | P | COVERED |  |
| F-CV-096 | Wrap / Unwrap | ✅ | 513 | SC-3 "Group ≠ Wrap" | Y | — | Y | COVERED |  |
| F-CV-097 | Replace with block… | ✅ | 514 | SC-3 (sections) | Y | locked greyed | P | COVERED | Term clash: SC-11 says "Section", not "block" |
| F-CV-098 | Save as component… | ✅ | 515 | SC-3; P13 | Y | — | P | COVERED |  |
| F-CV-099 | Arrange front/back | ✅ | 516 | SC-3; SC-12 ⌘⌥]/[ | Y | — | P | COVERED | The label implies z-index but the action moves DOM order; not addressed (T2-33) |
| F-CV-100 | Copy / Paste style | ✅ | 517 | SC-3 | Y | disabled until copied | P | COVERED |  |
| F-CV-101 | Lock / Unlock | ✅ | 518 | SC-3 ⌘⇧L; SC-14 | Y | descendants locked | Y | COVERED |  |
| F-CV-102 | Group / Ungroup lock gate | 🐞 | 519 | SC-3; P04 §8 "Group … refuse … (existing)"; REG Fix | Y | — | Y | CONFLICT | P04 §8 calls the lock refusal "existing"; INV 11.14 and REG call it a bug (T2-10) |
| F-CV-103 | Bind to CMS field… | ✅ | 520 | SC-3; P06 A1 (binding section retired → per-row bind icon) | P | — | P | PARTIAL | The menu row's landing target after A1 is unspecified (T2-28) |
| F-CV-104 | Add interaction | ✅ | 521 | P19 §5.1; SC-10 | Y | opens Add picker; root disabled + reason; multi "Select one element" | Y | COVERED |  |
| F-CV-105 | Improve with AI | ✅ | 522 | SC-21; SC-3 row inactive | — | hidden | — | DEFERRED-BY-DECISION | SC-21 |
| F-CV-106 | Insert rows; Layout "make it…"; Quick Style | ❌ | 523–525 | — (Add drawer; Inspector ⋯ Reset) | — | — | — | REMOVED-N/A |  |
| F-CV-107 | Reveal in layers / Select parent rows | ❌ | 526 | SC-3 "Show in Layers ⇧L"; P04 §7; P05 §6 | Y | — | Y | COVERED | Revived as Show in Layers. Select parent comes via breadcrumbs, ←, Esc |
| F-CV-108 | Menu closes on deselect/delete/scroll | ✅ | 527 | SC-2 step 2 (Esc) only | P | — | P | PARTIAL | Close-on-scroll, resize and deselect are not stated |
| F-CV-109 | Windows shortcut hints | ✅ | 528 | SC-12 Platform | Y | — | Y | COVERED |  |
| F-CV-110 | Drop highlight / between cue / inside cue | ✅ | 534–536 | P05 CV-13 "drop feedback" kept; IAF-02 H; P03 §5 Target | N | — | P | PARTIAL | No design doc specifies drag-feedback visuals (valid, invalid, between, inside, path pill). Kept only as "existing" (T2-38) |
| F-CV-111 | Add-drawer "Drop into" cue | ✅ | 537 | P03 §5 Target "drag shows existing drop indicator + path note"; SC-14 | P | locked drop refusal "Locked — drop somewhere else" | P | PARTIAL | Same as above |
| F-CV-112 | Invalid-drop badge + messages | ✅ | 538 | IAF-02 H "rejects invalid nesting"; P03 §5 (click reasons) | P | — | P | PARTIAL | Drag messages are not enumerated. P03 click-reason copy ("Can't go inside Heading…") is not reconciled with the drag badge copy |
| F-CV-113 | Drop sources | ✅ | 539 | P03 AD-12/AD-20; P08 "OS file drop on canvas" | Y | — | Y | COVERED |  |
| F-CV-114 | Insert toast + Undo | ✅ | 540 | P24 row 1; P22 §5.10 | Y | ≥8 s Undo; selection restore (SC-17) | Y | COVERED |  |
| F-CV-115 | Media drop toast text bug | 🐞 | 541 | REG M02-12.8 Fix | N | — | N | PARTIAL | REG-only (T2-24) |
| F-CV-116 | Media drop insert vs replace | ✅ | 542 | P08 §1 (1) picker "replace a selected image"; P08 §3 problem 1 / IAF-09 E "explicit Replace" | P | — | P | PARTIAL | Drop onto an image replaces implicitly, against IAF-09 E's explicit-Replace rule. The docs do not settle it (T2-36) |
| F-CV-117 | OS image drop | ✅ | 543 | P08 §5 "OS file drop on canvas kept", Uploading / Waiting to sync chips; FI-03 | Y | uploading, local-only | Y | COVERED |  |
| F-CV-118 | Drop while inline editing | ✅ | 544 | REG M02-12.11 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-119 | Auto-scroll near edges | ✅ | 545 | P05 CV-13 kept | P | — | P | COVERED |  |
| F-CV-120 | Nesting rules | ✅ | 546 | IAF-02 H; P03 §5 Eligibility; SC-14 | Y | — | Y | COVERED |  |
| F-CV-121 | Drag-move element | ✅ | 552 | P05 CV-13; IAF-02 H (Esc cancels before drop) | P | — | Y | COVERED | Ghost-card and fade visuals are kept only by reference |
| F-CV-122 | ⌘-drag clone | 🐞 | 553 | FDB FI-02 / P1-D17 (clone-drag styles) | N | — | N | PARTIAL | A cancelled clone leaving its copy is in no doc (T2-8) |
| F-CV-123 | Multi-element drag | ✅ | 554 | P05 CV-13 "multi" | P | — | P | COVERED |  |
| F-CV-124 | Duplicate/paste keep styles | 🐞 | 555 | FDB FI-02 / T-FI-02; IAF-02 K | N | — | N | PARTIAL | No panel: P05 has no acceptance and P24 row 3 says "Keep" (T2-7) |
| F-CV-125 | Touch long-press drag | ❌ | 556 | P22 OD-2 (phone: no editing) | — | — | — | REMOVED-N/A |  |
| F-CV-126 | Section reorder grips | ✅ | 557 | P05 CV-13 "section grips" kept; SC-13 toast | P | "Moved · applies to all breakpoints · Undo" off Desktop | P | COVERED |  |
| F-CV-127 | Arrow-key selection nav | ✅ | 558 | P05 CV-21, §10 | Y | — | Y | COVERED | Tab conflict with keyboard resize (T2-5) |
| F-CV-128 | Keyboard nudge | ✅ | 559 | P05 CV-13 nudge, in-flow toast kept | Y | positioned only | Y | COVERED |  |
| F-CV-129 | ⌥↑/↓, ⌥Home/End reorder | ✅ | 560 | P05 CV-13; P04 §7 (reused in tree); SC-3 | Y | — | Y | COVERED |  |
| F-CV-130 | ⌘Z behind full-page tools | 🐞 | 561 | P24 ⛔ U-1; SC-9; SC-12 scope; BK-006/034 | Y | "Nothing to undo here — Open Editor to undo" | Y | COVERED | Blocked by U-1 (interim guard mandatory) |
| F-CV-131 | Clipboard & edit chords | ✅ | 562 | SC-3; SC-12 (⌘⇧V Canvas scope) | Y | — | Y | COVERED |  |
| F-CV-132 | App chords | ✅ | 563 | SC-12; P18 §5.9 | Y | per-browser acceptance | Y | COVERED | ⌘H→H, ⌘J/⌘⇧A AI inactive |
| F-CV-133 | Canvas palette ⌘⇧P | ❌ | 564 | SC-12 (⌘⇧P alias to ⌘K) | — | — | — | REMOVED-N/A |  |
| F-CV-134 | Keyboard shortcuts sheet | ✅ | 565 | P18 §4.4, §5.9 | Y | generated from one table; single-key toggle | Y | COVERED |  |
| F-CV-135 | Keyboard legend card | ✅ | 566 | P18 §9; SC-10 | — | retired; rows → sheet BASICS | — | COVERED | Removed by decision. REG Keep is stale (T2-15) |
| F-CV-136 | Comment mode toggle | ✅ | 572 | P01 §5 Comments; P05 §8 Comment mode | Y | C key, Esc exits, disabled in non-Editor areas | Y | COVERED |  |
| F-CV-137 | Pins | ✅ | 573 | P17 §4.4; P05 §8 | Y | visible in comment mode + Review task; "Client" label | Y | COVERED | No count badge on the button (INV), unchanged |
| F-CV-138 | New-comment popover | ✅ | 574 | P05 CV-17 kept | Y | 2000 max, ⌘Enter | Y | COVERED |  |
| F-CV-139 | Re-pin detached comment | ✅ | 575 | P17 CR-16 "reattach" kept; §5.4 | P | — | P | COVERED |  |
| F-CV-140 | Orphan comments modal | ✅ | 576 | P05 CV-17; P17 §5.4 Locate (located / page-only / gone) | P | — | P | COVERED |  |
| F-CV-141 | Replies / threads / @mentions | ⏳ | 577 | P17 §4.3, R-3 (replies + audience) | P | — | P | PARTIAL | Replies specified. @mentions are in no doc (T2-35) |
| F-CV-142 | Start collaboration | 🚩 | 583 | P21 §5.1 (auto-join; "People on this site…") | Y | flag off "Planned" | Y | COVERED | Planned. ⛔ MP-3/4/5 |
| F-CV-143 | Presence avatars + pill | 🚩 | 584 | P21 §4.1 | Y | N here / Live / Reconnecting / Offline | Y | COVERED | INV "up to 3" vs P21 "≤2" (T2-19) |
| F-CV-144 | Remote cursors | 🚩 | 585 | P21 §4.2 | Y | same page+breakpoint, Hide my cursor, fade, max 10 | Y | COVERED | ⛔ MP-11 fallback: cursors hidden |
| F-CV-145 | Remote selections / editing / soft-locks | ⏳ | 586 | P21 §4.2–4.3 | Y | tone outline + tag, "· editing", typing confirm | Y | COVERED | Blocked by Phase A/B deps |
| F-CV-146 | Interaction runtime | ✅ | 592 | P19 §5.3–5.5 | Y | canvas Play only; Preview under IXD-3 | Y | COVERED | INV "plays in preview" contradicts P19 IX-11 (T2-17) |
| F-CV-147 | Reverse on leave/blur | ⏳ | 593 | P19 §4.3 "Reverse when the pointer / focus leaves" | Y | — | P | PARTIAL | UI specified, but no IXD row makes reverse work in the published runtime (UNKNOWN whether WAAPI implements it) (T2-18) |

## Pages, Templates, Layers, History, Activity · Add, Components, AI

INV §3–4 lines 617–997 · 216 rows · gaps: `_extraction/T3-pages-add.md` §Contradictions & gaps

| FID | Feature | INV | INV line | Design home | Controls | States specified | Interaction | Coverage | Gap / note |
|---|---|---|---|---|---|---|---|---|---|
| F-PG-001 | Pages panel (entry) | ✅ | 621 | P11 §4, §5, §12 (rail → bottom-bar Pages, P key) | Y | loading, error, viewer disabled-with-reason | Y | COVERED | Move per BD-02/05 |
| F-PG-002 | Header ⋯ menu | ✅ | 622 | P11 §5 Header | Y | select-mode "Done" not restated | P | COVERED | Widen/Narrow → sheet bounds; + Recently deleted (N) |
| F-PG-003 | ⌘K keycap / panel-local palette (#3–4) | ❌ | 623–624 | P18 §5.2 Pages row | — | — | — | REMOVED-N/A | replaced by global "Go to page ›" |
| F-PG-004 | ⌘K "New page" / "Go to {page}" | ✅ | 625 | P18 §5.2, §4.3 | Y | "Loading…" generic | Y | COVERED | Change: nested "Go to page ›" |
| F-PG-005 | Search pages | ✅ | 626 | P11 §5 Header; SC-2 | Y | — (clear-on-close not restated) | P | COVERED | extended to slugs + all views (DS) |
| F-PG-006 | "/" focuses search | ❌ | 627 | SC-12 "Focus area search /" | P | — | P | REMOVED-N/A | SC-12 revives "/" globally; P11 silent whether it reaches the Pages manager (T3-23) |
| F-PG-007 | No-results state | ✅ | 628 | P11 PG-03 (as-is only) | N | as-is only | N | PARTIAL | target silent; no Clear search (Layers/Add/Templates have it) |
| F-PG-008 | Loading skeleton | ✅ | 629 | P11 §9 | Y | manager skeleton, strip skeleton | Y | COVERED |  |
| F-PG-009 | Empty state | ✅ | 630 | P11 PG-03 (as-is); P16 §4.6 generic | P | as-is only | N | PARTIAL | "No pages yet / Create blank page · From template" not restated |
| F-PG-010 | Load error | ✅ | 631 | P11 §9 | Y | error + Retry; strip "Pages unavailable — Retry" | Y | COVERED |  |
| F-PG-011 | One-page note | ✅ | 632 | P11 §9 | Y | one page; delete disabled with reason | Y | COVERED |  |
| F-PG-012 | Footer legend | ✅ | 633 | P11 PG-03 (as-is "legend") | N | "N of M match" not restated | N | PARTIAL | target silent; legend text "● unpublished changes" conflicts with §5 "● Unsaved" (T3-8) |
| F-PG-013 | "+N from collections ›" | ✅ | 634 | P11 §5 Body; FD-DYN-01 §6 | Y | — | Y | COVERED | replaced by "Blog post · Collection page · 20 pages" group |
| F-PG-014 | Footer add actions | ✅ | 635 | P11 §5 Footer, §6 | Y | capacity / plan-locked | Y | COVERED |  |
| F-PG-015 | Select / open page | ✅ | 641 | P11 §4, §5 Row actions | Y | draft guard, announce | Y | COVERED | Change: row click = "Open {page} in Editor", closes sheet |
| F-PG-016 | Home glyph | ✅ | 642 | P11 §4, §5 Row | Y | — | Y | COVERED |  |
| F-PG-017 | External-link page glyph | ❌ | 643 | — | — | — | — | REMOVED-N/A |  |
| F-PG-018 | Status chip | 🟡 | 644 | P11 §5 Row, T-PG-05 | Y | Live (none), Hidden, Hidden (legacy password), plan-locked | Y | COVERED | Fix: only real states |
| F-PG-019 | "● Unpublished" marker | 🟡 | 645 | P11 §5 Row ("● Unsaved"), §4 strip dot | Y | unsaved | P | COVERED | L3-009 SR announcing "Live" on never-published site not addressed |
| F-PG-020 | Inline rename | ✅ | 646 | P11 §5 guards, §11 | Y | duplicate-name error | Y | COVERED |  |
| F-PG-021 | Rename → URL decision | ✅ | 647 | P11 PG-06, §5 guards | Y | Keep / Update / Cancel, redirect offer | Y | COVERED |  |
| F-PG-022 | Drag to reorder | ✅ | 648 | P11 §5 Row (grip only) | P | drop indicator not specified | N | PARTIAL | no keyboard / non-drag reorder (T3-4) |
| F-PG-023 | Bulk selection | ✅ | 649 | P11 §5 Bulk, PG-08, §11 | Y | select mode; Esc exits | P | COVERED |  |
| F-PG-024 | Page context menu | ✅ | 650 | P11 §5 Row actions | Y | Delete disabled-with-reason (PG-05) | Y | COVERED | missing P15 §5.5 "Save as template…" door (T3-9) |
| F-PG-025 | Menu chords ⌘D / ⌫ | 🐞 | 651 | P11 §5, §11, T-PG-06 | Y | — | Y | COVERED | Fix: bound on focused row |
| F-PG-026 | Duplicate | ✅ | 652 | P11 §5; P24 §4.1 #34 | Y | toast Undo + Open | Y | COVERED | error toasts (missing source/corrupt) not restated |
| F-PG-027 | Set as homepage | ✅ | 653 | P11 §5; P24 #34 | Y | toast Undo | Y | COVERED |  |
| F-PG-028 | Copy link | ✅ | 654 | P11 §5 menu (name only) | P | "No address yet" absent | N | PARTIAL |  |
| F-PG-029 | Delete one page | ✅ | 655 | P11 §5–6; SC-15; P24 §4.8 | Y | guards, Undo toast + warnings, Recently deleted (offline/viewer/loading/failure) | Y | COVERED | Change: confirm removed |
| F-PG-030 | Replace layout with template… | ✅ | 656 | P11 §5; P15 §5.1 | Y | Replacing mode | Y | COVERED |  |
| F-PG-031 | Server-backed folders | ✅ | 662 | P11 §5 Body/Folders | Y | — | P | COVERED | privacy label "My folders · only you see these" (DS) |
| F-PG-032 | Folder row | ✅ | 663 | P11 §5 "Folders: existing" | N | none | N | PARTIAL | tri-state, ⓘ tip, hover Rename/"Delete folder (pages kept)" unspecified; folder-delete recovery absent (T3-12) |
| F-PG-033 | New folder | ✅ | 664 | P11 §5 Footer | Y | — | P | COVERED | "opens into rename" not restated |
| F-PG-034 | Move page into folder | ✅ | 665 | P11 §5 menu "Remove from folder"; P24 #34 | P | move toast Undo | P | PARTIAL | drag-onto-folder / empty-folder drop target unspecified |
| F-PG-035 | Reorder inside folder | 🟡 | 666 | P11 §5 Folders | — | — | — | PARTIAL | [audit 10-18: no controls/states cited → PARTIAL] documented limitation (accepted) |
| F-PG-036 | Bulk toolbar | ✅ | 667 | P11 §5 Bulk, PG-08 | Y | — | P | COVERED |  |
| F-PG-037 | Move pages dialog | ✅ | 668 | P11 PG-08 (as-is "Move to…"); CP-reg M03-38 | P | — | N | PARTIAL | dialog body/width unspecified |
| F-PG-038 | Bulk delete | ✅ | 669 | P11 §5 Delete; SC-15; P24 #33, §4.8 bulk Restore | Y | Undo toast, Recently deleted | P | COVERED | bulk toast copy / inbound-link warning for N pages unspecified |
| F-PG-039 | Bulk duplicate | ✅ | 670 | P11 PG-08, §5 Bulk | Y | — | P | COVERED |  |
| F-PG-040 | New page modal | ✅ | 676 | P11 §6; P15 §5.1; P24 #31 | Y | capacity, at-limit disabled, Undo toast | Y | COVERED |  |
| F-PG-041 | Plan page limit | 🟡 | 677 | P11 §6; SC-9; SC-18; SC-20 | Y | capacity, locked, post-save fallback | Y | COVERED | blocked on capacity query |
| F-PG-042 | Listings view | ✅ | 678 | P11 §5 Body | P | — | N | PARTIAL | columns/score/click target not restated |
| F-PG-043 | SEO score consistency (two formulas) | 🐞 | 679 | CP-reg M03-44 "Fix" only | N | — | N | PARTIAL | no doc picks one score model (T3-5) |
| F-PG-044 | "Open full listings ›" | 🟡 | 680 | P11 §5 Header | Y | — | P | COVERED | expands sheet to work-area size |
| F-PG-045 | Structure view | ✅ | 681 | P11 §5 Body (name only) | N | — | N | PARTIAL |  |
| F-PG-046 | Page settings dialog shell | ✅ | 687 | P11 §7 | Y | — | Y | COVERED | 720 max; opens without switching canvas page |
| F-PG-047 | Save model (Cancel / Save) | 🟡 | 688 | P11 §7; SC-10 | Y | saving, failure + Retry | Y | COVERED | "Done" → "Save" |
| F-PG-048 | Discard guard | ✅ | 689 | P11 §7 ("existing") | P | — | P | COVERED |  |
| F-PG-049 | SEO score pill on tab | ✅ | 690 | CP-reg M03-50; P11 §7 "unchanged" | N | — | N | PARTIAL | depends on F-PG-043 |
| F-PG-050 | Google preview | ✅ | 691 | P11 PG-10, §7 "unchanged" | Y | no-description | N | COVERED | by reference |
| F-PG-051 | Score card + checklist | ✅ | 692 | P11 PG-10; P10 §5 "SEO analysis · Planned" (site-level) | P | — | N | PARTIAL | FG-007 page-level checks undecided |
| F-PG-052 | Meta title override + "Write with AI" | ✅ | 693 | P11 §7 (field); SC-21 (AI button) | Y | — | P | DEFERRED-BY-DECISION | AI button hidden (SC-21); field itself COVERED |
| F-PG-053 | Meta description | ✅ | 694 | P11 PG-10, §7; IAF-05 H (≤160) | Y | — | P | COVERED |  |
| F-PG-054 | URL slug + redirect offer | ✅ | 695 | P11 PG-06, §5, §7 | Y | warning, redirect offer | Y | COVERED |  |
| F-PG-055 | Indexing select in SEO tab | ✅ | 696 | P11 PG-10 | Y | — | N | PARTIAL | duplicates Advanced toggle (T3-13) |
| F-PG-056 | Social tab | ✅ | 697 | P11 PG-10, §7 | Y | — | N | COVERED | FG-011 linked/independent X switch not addressed |
| F-PG-057 | Visibility Live / Hidden | ✅ | 698 | P11 PG-10, §5 Row | Y | Hidden chip, legacy password | Y | COVERED |  |
| F-PG-058 | Password-protected pages | ❌ | 699 | P11 §5 "Hidden (legacy password)" | — | — | — | REMOVED-N/A |  |
| F-PG-059 | Indexing / Follow toggles | ✅ | 700 | P11 PG-10 | Y | — | N | COVERED |  |
| F-PG-060 | Custom `<head>` code | ✅ | 701 | P11 PG-10, §7; P23 l.181 / OD-PL-5 | Y | Pro lock only in P23 | P | PARTIAL | P11 §7 omits Pro chip/lock (T3-11) |
| F-PG-061 | Settings error boundary | ✅ | 702 | CP-reg M03-62; P22 §5.9 (generic) | N | crash (generic) | N | PARTIAL |  |
| F-PG-062 | Templates view (full-canvas → area) | ✅ | 708 | P15 §4 Host, §5.1 | Y | loading skeleton | Y | COVERED | Change: portal → in-shell area; T-5 Figma update |
| F-PG-063 | Compact drawer gallery | ❌ | 709 | — | — | — | — | REMOVED-N/A |  |
| F-PG-064 | Search / filter / tags | ❌ | 710 | P15 §4 (search, Show filter, category rule) | Y | no match | Y | COVERED | revived by doc (IAF-06 E/K) |
| F-PG-065 | Workspace sidebar | ✅ | 711 | P15 §4 header 56 + local nav 240 | Y | — | Y | COVERED | per-template list → Show + Recent; back labels fixed |
| F-PG-066 | Catalogue grid | ✅ | 712 | P15 §4 Grid, §7 | Y | applied, Pro, preview unavailable | Y | COVERED |  |
| F-PG-067 | Catalogue content | ✅ | 713 | P15 TP-03, §4 | Y | saved syncing / failed | Y | COVERED |  |
| F-PG-068 | In-place preview | ✅ | 714 | P15 §4.1 | Y | render error | Y | COVERED |  |
| F-PG-069 | Detail panel / "where used" dialog | ❌ | 715 | P15 §4.1 ("Used on" kept) | — | — | — | REMOVED-N/A |  |
| F-PG-070 | Replace mode | ✅ | 716 | P15 §4 mode bar | Y | Replacing; target cleared | Y | COVERED |  |
| F-PG-071 | Replace confirm | ✅ | 717 | P15 §5.3; P24 #43 | Y | backup on | Y | CONFLICT | confirm kept vs SC-15 / P24 §4.9 (T3-2) |
| F-PG-072 | "Reset global styles" option | ❌ | 718 | — | — | — | — | REMOVED-N/A |  |
| F-PG-073 | Backup-failed dialog | ✅ | 719 | P15 §5.3 | Y | Cancel / Try again / Replace without | Y | COVERED |  |
| F-PG-074 | New page from template | ✅ | 720 | P15 §5.2; P11 §6 | Y | confirm until T-4; truthful failure | Y | COVERED |  |
| F-PG-075 | Apply progress card | ✅ | 721 | P15 §5.4 | Y | "Taking longer than usual…", Cancel pre-import | Y | COVERED | 15 s auto-fail removed |
| F-PG-076 | Admin-only apply | ✅ | 722 | P15 §6 Role | Y | viewer disabled, role unknown | Y | COVERED | Change: EDITOR+ (OD-T1) |
| F-PG-077 | Pro templates | 🔒 | 723 | P15 §6; SC-20 | Y | trial, Free locked | Y | COVERED |  |
| F-PG-078 | Brand tokens after apply | 🟡 | 724 | P15 §4.1 Brand line (copy only), TP-09 | P | — | N | PARTIAL | L4-024 "re-author on semantic tokens" not in any doc (T3-24) |
| F-PG-079 | Empty-canvas template cards bug | 🐞 | 725 | P15 §5.1; P16 §4.1; SC-10 | Y | — | Y | COVERED | cards open their preview |
| F-PG-080 | Save page as template | 🟡 | 726 | P15 §5.5 | Y | empty Saved filter; Rename hidden until T-3 | Y | COVERED | cross-device pull-back still unverified |
| F-PG-081 | Legacy template list / manager | ❌ | 727 | — | — | — | — | REMOVED-N/A |  |
| F-PG-082 | Layers panel | ✅ | 733 | P04 §4; P02 | Y | — | Y | COVERED |  |
| F-PG-083 | Layers header ⋯ | ✅ | 734 | P04 §4, §12 | Y | — | Y | COVERED | Display → ≡; Widen removed |
| F-PG-084 | Search layers | ✅ | 735 | P04 §9; SC-2 | Y | no results, count | Y | COVERED | Change: Esc no longer closes |
| F-PG-085 | Breadcrumb band | ❌ | 736 | — | — | — | — | REMOVED-N/A |  |
| F-PG-086 | Layers panel states | ✅ | 737 | P04 §11, LY-05 | Y | loading, error, empty, no results, rejected drop | Y | CONFLICT | empty copy/CTA P04 §11 vs P16 §4.6 (T3-3) |
| F-PG-087 | Display settings | ✅ | 738 | P04 LY-03, §12 | Y | — | Y | COVERED |  |
| F-PG-088 | Layer row | ✅ | 739 | P04 §5 | Y | selected, multi, hover, drop, dimmed, locked, hidden-bp, condition | Y | COVERED |  |
| F-PG-089 | Names/locks saved with project | ✅ | 740 | P04 §11; P24 #8 | P | — | P | COVERED |  |
| F-PG-090 | Dim in editor | ✅ | 741 | P04 §6 | Y | dimmed | Y | COVERED | renamed |
| F-PG-091 | Drag reorder / nest | ✅ | 742 | P04 §7 | Y | rejected drop | Y | COVERED |  |
| F-PG-092 | Multi-select / Select mode | ✅ | 743 | P04 §8 | Y | mixed summary | Y | COVERED |  |
| F-PG-093 | Multi-select banner | ❌ | 744 | — | — | — | — | REMOVED-N/A |  |
| F-PG-094 | Row keyboard | ✅ | 745 | P04 §10 | Y | — | Y | COVERED |  |
| F-PG-095 | Layer context menu | ✅ | 746 | P04 §7; SC-3 | Y | lock refusals | Y | COVERED |  |
| F-PG-096 | Move to page dialog | ✅ | 747 | P04 §7 | Y | pre-check refusal, Go to page | Y | COVERED |  |
| F-PG-097 | Delete a multi-selection | ✅ | 748 | P04 §7; SC-3 | Y | Undo toast | Y | COVERED | Change: confirm removed |
| F-PG-098 | Lock/Unlock + Select children in menu | 🟡 | 749 | P04 §7; SC-3 | Y | — | Y | COVERED |  |
| F-PG-099 | Viewer read-only Layers | ✅ | 750 | P04 §11; SC-6 | Y | view only | Y | COVERED | Change: Dim allowed to viewers |
| F-PG-100 | Hover sync | ✅ | 751 | P04 §7 | Y | — | Y | COVERED |  |
| F-PG-101 | History location (right column) | ✅ | 757 | P12 §4–5; SC-6; SC-12 (H) | Y | — | Y | COVERED |  |
| F-PG-102 | Tabs Session / Saves / Published | ✅ | 758 | P12 §5; IAF-18 E | Y | — | P | COVERED | default tab not restated |
| F-PG-103 | History ⋯ menu | ✅ | 759 | P12 RT-12; P24 §4.6; SC-12 | Y | Clear confirm until K-8 (E-5) | Y | COVERED |  |
| F-PG-104 | Remembers last view | ✅ | 760 | P12 RT-12 | Y | — | N | COVERED |  |
| F-PG-105 | Viewer read-only History | ✅ | 761 | SC-6; P12 §6; IAF-18 D | Y | read-only | P | COVERED |  |
| F-PG-106 | "‹ Activity" back row | ✅ | 762 | P12 §5 Activity; SC-1 | Y | — | Y | COVERED | label → "‹ Back to Activity" |
| F-PG-107 | Saves list | ✅ | 763 | P12 RT-12; IAF-18 E/I | P | empty/filtered/pruned (IAF-18 I) | P | PARTIAL | row anatomy, date groups, "Auto" chip unspecified |
| F-PG-108 | Version row ⋯ menu | ✅ | 764 | P12 RT-12 | Y | — | P | COVERED |  |
| F-PG-109 | Saved-version details modal | ✅ | 765 | P12 RT-12 ("details") | P | — | N | PARTIAL |  |
| F-PG-110 | Saves filter | ✅ | 766 | CP-reg M03-111 only | N | filtered (IAF-18 I) | N | PARTIAL | register-only (T3-19) |
| F-PG-111 | Restore a version | ✅ | 767 | IAF-18 G; P24 #54; P12 §4.3 | Y | checkpoint fail Retry/Cancel; Undo restore | Y | COVERED |  |
| F-PG-112 | Delete a version | ✅ | 768 | P24 #45 → IAF-18 I | P | "deleted, keep explanation" only | N | PARTIAL | no Undo / confirm / Recently deleted decision (T3-6) |
| F-PG-113 | Save a version modal | ✅ | 769 | P12 RT-12, §5 | P | — | N | PARTIAL | name suggestions, modal fields unspecified |
| F-PG-114 | Inline compare | ✅ | 770 | P12 §5; IAF-18 E/F | Y | compare failed | Y | COVERED | + "Open comparison ›" |
| F-PG-115 | Get AI Summary | ✅ | 771 | SC-21; P12 §5; P20 AI-11 | — | — | — | DEFERRED-BY-DECISION |  |
| F-PG-116 | Milestone suggestion banner | ✅ | 772 | SC-21 / P20 §0 (hook not mounted); P20 AI-12 | — | — | — | DEFERRED-BY-DECISION | P12 §5 still lists it "Kept" (T3-7) |
| F-PG-117 | Approval band | ✅ | 773 | CP-reg M03-118; P17 §5 stale card (Review side) | P | "edited since" (P17) | N | PARTIAL | History › Saves placement absent from panels |
| F-PG-118 | Retention / prune notes | ✅ | 774 | IAF-18 I "version pruned"; P24 §4.6 divider (Session) | P | pruned | N | PARTIAL | Saves copy not specified |
| F-PG-119 | Saves states | ✅ | 775 | IAF-18 I; P12 §6 | Y | empty, filtered, loading, pruned, restricted, compare failed | P | COVERED |  |
| F-PG-120 | "Use Ctrl+Z" hint bug | 🐞 | 776 | CP-reg M03-121 "Fix"; SC-12 platform rule | P | — | N | PARTIAL | SC-12 covers tooltips/dialog, not state copy |
| F-PG-121 | Session undo trail | ✅ | 777 | P24 §4.5; P12 §5 | Y | dividers opened/cleared | Y | COVERED |  |
| F-PG-122 | Restore to a step | ✅ | 778 | P24 §4.5–4.6; IAF-18 G | Y | truncation warning, checkpoint fail | Y | COVERED | "Restore to here" |
| F-PG-123 | Session keyboard j/k/g/G | ✅ | 779 | CP-reg M03-124 only | N | — | N | PARTIAL | absent from SC-12 and P18 sheet (T3-19) |
| F-PG-124 | Session footer + states | ✅ | 780 | P12 RT-12 ("Save a version") | P | empty/error not restated | N | PARTIAL |  |
| F-PG-125 | Time Travel | ✅ | 781 | P05 §8; P12 §5; SC-12; IAF-18 F/H | Y | no preview, restore confirm | Y | COVERED | Change: band → dedicated area |
| F-PG-126 | Time Travel restore safety | ✅ | 782 | IAF-18 G | Y | checkpoint failed, Restore anyway (session only) | Y | COVERED |  |
| F-PG-127 | Time Travel "no preview" point | 🟡 | 783 | IAF-18 H | Y | absent vs render-failed split | Y | COVERED |  |
| F-PG-128 | Published tab | ✅ | 784 | P14 PB-16, §5.6; P12 RT-12; SC-11 | Y | pruned release disabled | Y | COVERED | "Republish this release" |
| F-PG-129 | Shared Compare view | ✅ | 785 | P05 §8; IAF-18 E/H; P12 §5 | Y | missing/pruned/denied/failed | Y | COVERED |  |
| F-PG-130 | Activity panel | ✅ | 791 | P12 §5; P01 TB-08, §6; SC-6 | Y | — | Y | COVERED |  |
| F-PG-131 | Activity filters + rows | ✅ | 792 | P12 RT-13, §5; IAF-18 E | Y | — | Y | COVERED | exact-item open needs API (SC-9) |
| F-PG-132 | Activity states | ✅ | 793 | P12 RT-13 ("states"), §6 | N | not restated | N | PARTIAL | (T3-22) |
| F-PG-133 | Panel frame + header | ✅ | 799 | P03 §8; P04 §10; P12 §4.2; SC-1 | Y | — | Y | COVERED | heights 44/48/56 differ (consistency) |
| F-PG-134 | Panel search field | ✅ | 800 | SC-2; P03 §6.1; P04 §9 | Y | — | Y | COVERED |  |
| F-PG-135 | Shared panel states | ✅ | 801 | P04 LY-05; P18 §5.7; P22 §5.9 | P | — | P | PARTIAL | no single shared no-results contract |
| F-PG-136 | Drill-in header | ✅ | 802 | SC-1; P13 §4 | Y | — | Y | COVERED | superseded by SC-1 back slot |
| F-PG-137 | Old sidebar SearchBar | ❌ | 803 | — | — | — | — | REMOVED-N/A |  |
| F-AD-001 | Add panel frame + header | ✅ | 830 | P03 §4, §8 | Y | — | Y | COVERED |  |
| F-AD-002 | Expand to 700 | ❌ | 831 | P03 §8 | — | — | — | REMOVED-N/A | resize 260–360 |
| F-AD-003 | Paste HTML dialog | ✅ | 832 | P03 §6.8, §5; SC-12 | Y | strip report, lock refusal | Y | COVERED | ⌘⇧V scope ambiguity (T3-21) |
| F-AD-004 | Pinned Paste HTML row | ❌ | 833 | — | — | — | — | REMOVED-N/A |  |
| F-AD-005 | Search field | ✅ | 834 | P03 §6.1; SC-2; SC-12 | Y | — | Y | COVERED |  |
| F-AD-006 | Search results | ✅ | 835 | P03 §6.1 | Y | count status line | Y | COVERED | Change: grouped by source |
| F-AD-007 | No-results state | ✅ | 836 | P03 §6.1 | Y | no results | Y | COVERED |  |
| F-AD-008 | Selection-aware purpose line | ❌ | 837 | P03 §5 (target subtitle replaces) | — | — | — | REMOVED-N/A |  |
| F-AD-009 | Group headers | ✅ | 838 | P03 §8, §10 | Y | — | Y | COVERED |  |
| F-AD-010 | ★ Favourites + Recent (A10–A11) | ✅ | 839–840 | P03 §6.2, §5 Recents | Y | only when non-empty | Y | COVERED | Fix: all sources; recents on success |
| F-AD-011 | ELEMENTS (54) | ✅ | 841 | P03 §4, §6.3 | Y | — | Y | COVERED | 54 → 37 + Theme toggle |
| F-AD-012 | Collection list element | ✅ | 842 | P03 §4; FD-DYN-01 §10.2 | Y | — | Y | COVERED | + List of {collection} |
| F-AD-013 | Theme toggle element | ✅ | 843 | P03 §6.3 | Y | hidden unless Dark Auto | N | COVERED | unexplained disappearance not addressed |
| F-AD-014 | Upload element | ❌ | 844 | CP-reg M04-A15 Defer | — | — | — | REMOVED-N/A |  |
| F-AD-015 | Description bubble | ✅ | 845 | P03 §6.3, §8 | Y | — | Y | COVERED |  |
| F-AD-016 | Drag element + drag note | ✅ | 846 | P03 §5 Target | Y | "Locked" refusal | Y | COVERED |  |
| F-AD-017 | Disabled "Soon" row | ⏳ | 847 | P03 §9 (disabled-with-reason rows) | Y | disabled reasons | Y | COVERED | state reused for lock / no page |
| F-AD-018 | BLOCKS 8 cards | ✅ | 848 | P03 §6.5 | Y | — | Y | COVERED | label "Sections" |
| F-AD-019 | Block thumbnails | 🟡 | 849 | P03 §6.5 | Y | — | N | COVERED | wireframes kept; slot reserved |
| F-AD-020 | Hover pill + preview card; drag cards (A21–A22) | ✅ | 850–851 | P03 §6.5, §5 | Y | — | Y | COVERED |  |
| F-AD-021 | Token-bound blocks footnote | ✅ | 852 | P03 §6.5 | Y | — | — | COVERED | footnote wording vs SC-11 (consistency) |
| F-AD-022 | Blocks no longer in Add | ❌ | 853 | P03 §7 (Defer) | — | — | — | REMOVED-N/A | documented defer |
| F-AD-023 | "✦ Generate a block" row | ✅ | 854 | SC-21; P03 §4, §6.4 | — | — | — | DEFERRED-BY-DECISION |  |
| F-AD-024 | BUILT-IN components (14) | ✅ | 855 | P03 §6.3a | Y | — | Y | COVERED | renamed Catalog components; draggable |
| F-AD-025 | Saved components + From library + Manage › (A27–A29) | ✅ | 856–858 | P03 §6.6 | Y | empty, library error, library empty, restricted | Y | COVERED |  |
| F-AD-026 | Saved count vs Components panel (L1-024) | 🐞 | 859 | P03 §6.6 vs P13 §4 | Y | — | Y | CONFLICT | scope definitions disagree (T3-1) |
| F-AD-027 | "Page templates ›" link | ✅ | 860 | P03 §4, §6.5; P15 §5.1 | Y | — | Y | COVERED | moved to Sections footer |
| F-AD-028 | First-use tip card | 🟡 | 861 | P03 §10; P16 FR-14 | P | — | P | PARTIAL | L1-029 stacking unresolved (T3-25) |
| F-AD-029 | Tips strip; Quick Picks callout (A33–A34) | ❌ | 862–863 | — | — | — | — | REMOVED-N/A |  |
| F-AD-030 | Loading / "Couldn't load library" states | ❌ | 864 | P03 §9 "Catalogue unavailable" | Y | catalogue unavailable | Y | COVERED | doc revives a state INV calls unreachable |
| F-AD-031 | Click-insert placement | ✅ | 865 | P03 §5 | Y | stale target, lock | Y | COVERED |  |
| F-AD-032 | Insert toasts | ✅ | 866 | P03 §5 Receipt/Feedback | Y | refusal | Y | COVERED |  |
| F-AD-033 | Replace with block… | ✅ | 867 | P03 AD-14, §5; SC-3 | Y | locked refused | Y | COVERED |  |
| F-AD-034 | Media insert → Assets | 🟡 | 868 | P03 §5 Media; P02 §5 | Y | Pick / Cancel | Y | COVERED | picker chosen over L1-017 default (SC-22 accepts) |
| F-AD-035 | Doors into Add | ✅ | 869 | P03 §1, §6.6; P16 §4.1; P09 l.84 | Y | — | Y | COVERED |  |
| F-AD-036 | Add keyboard | ✅ | 870 | P03 §10; SC-12 | Y | — | Y | COVERED | ARIA grid, F key (DS) |
| F-AD-037 | Block default-content copy debt | 🟡 | 871 | CP-reg M04-A42 "Redesign" only | N | — | N | PARTIAL | register-only; grepped "Aquibra", "© 2024", "sample content", "emoji", "copy pass" (T3-20) |
| F-AD-038 | Live embeds + runtimes | ✅ | 872 | CP-reg M07-48d/48f/62 → FD-INS-02/03 | UNKNOWN | UNKNOWN | UNKNOWN | PARTIAL | FD-INS annex not read |
| F-AD-039 | Generate a block (B1–B5) | ✅ | 878–882 | SC-21; P03 §6.4; P20 AI-01/02 | — | — | — | DEFERRED-BY-DECISION |  |
| F-AD-040 | Quick-add Element Picker modal | ❌ | 888 | CP-reg M04-C1 Defer | — | — | — | REMOVED-N/A | IAF-04 F still mentions "quick-add modal" (stale) |
| F-AD-041 | Components entry points | ✅ | 894 | P13 §4; P02 | Y | — | Y | COVERED |  |
| F-AD-042 | "‹ Add" back row | ✅ | 895 | SC-1; P13 §4 | Y | — | Y | COVERED |  |
| F-AD-043 | Components list view | ✅ | 896 | P13 §4 | Y | New, Update available, Local changes, Restricted | Y | COVERED | Redesign (workspace) |
| F-AD-044 | Detach-all notice | ✅ | 897 | P13 §6 Detach all ("existing") | P | notice not restated | N | PARTIAL |  |
| F-AD-045 | Empty / unavailable / error | ✅ | 898 | P13 §10 | Y | empty, loading, error + Retry | P | PARTIAL | "storage unavailable" state not in target |
| F-AD-046 | "+ Create component" | ✅ | 899 | P13 §4 | Y | capacity | Y | COVERED |  |
| F-AD-047 | Create component modal | ✅ | 900 | P13 §5 | Y | capacity, duplicate-name warning | Y | COVERED |  |
| F-AD-048 | Old create fields | ❌ | 901 | — | — | — | — | REMOVED-N/A | tags still feed search, unaddressed |
| F-AD-049 | No-selection pre-check | ✅ | 902 | P13 CP-03; P03 §6.6 | P | — | P | COVERED |  |
| F-AD-050 | Page-scoped masters | ✅ | 903 | P13 §4 This page | Y | — | Y | COVERED |  |
| F-AD-051 | Detail header/rename + Insert (D11–D12) | ✅ | 904–905 | P13 §6 | Y | ADMIN rename reason | Y | COVERED |  |
| F-AD-052 | Update from selection… | ✅ | 906 | P13 §6 | Y | Choose on canvas, Cancel | Y | CONFLICT | "existing confirm + Undo" vs SC-15 (T3-2) |
| F-AD-053 | Instance edits survive master update | 🟡 | 907 | P13 §7 (stable node keys); risks IA-X09 | P | — | N | PARTIAL | breakpoint/pseudo-state overrides untracked (T3-14) |
| F-AD-054 | Detach all | ✅ | 908 | P13 §6 | Y | locked skipped | Y | COVERED | "existing" carries a confirm — same SC-15 ambiguity (T3-2) |
| F-AD-055 | Duplicate master | ✅ | 909 | P13 §6 | Y | — | Y | COVERED | Fix: variants + scope kept |
| F-AD-056 | Delete master | ✅ | 910 | P13 §6; SC-15; P24 §4.8 | Y | Undo toast, Recently deleted | Y | COVERED |  |
| F-AD-057 | Master preview thumbnail | 🐞 | 911 | P13 §4 rows thumbnail | P | — | N | PARTIAL | L2-020 not addressed (T3-26) |
| F-AD-058 | STRUCTURE + USED ON (D19–D20) | ✅ | 912–913 | P13 §6, §10 subview | Y | — | Y | COVERED |  |
| F-AD-059 | No in-place master editing | 🐞 | 914 | P13 §9 | — | — | — | PARTIAL | [audit 10-18: no controls/states cited → PARTIAL] decided: Update from selection is the edit path |
| F-AD-060 | Inspector ComponentRow + override dots (D22–D23) | ✅ | 915–916 | P13 §9; FD-INS-02 | Y | "Variant unavailable" | Y | COVERED |  |
| F-AD-061 | Instance root hides Layout/Text | ✅ | 917 | CP-reg M04-D24 → FD-INS-02/03 | UNKNOWN | UNKNOWN | UNKNOWN | PARTIAL | FD-INS annex not read |
| F-AD-062 | Layers instance badge | ✅ | 918 | P04 §5 | Y | — | Y | COVERED |  |
| F-AD-063 | Variant authoring | ⏳ | 919 | P13 §9 (IAF-11 K) | — | — | — | DEFERRED-BY-DECISION |  |
| F-AD-064 | Rename/Variant modals; JSON export (D27–D28) | ❌ | 920–921 | P13 §8 (PKG-01 packages supersede export) | — | — | — | REMOVED-N/A |  |
| F-AD-065 | Server mirror + workspace library | ✅ | 922 | P13 CP-06, §7 | Y | library load failure | Y | COVERED |  |
| F-AD-066 | 100-component cap | 🟡 | 923 | P13 §5; SC-9 | Y | "N of 100", at-cap disabled | Y | COVERED |  |
| F-AD-067 | 27-component DS catalogue | 🟡 | 929 | CP-reg M04-E1 "Redesign" only | N | — | N | PARTIAL | no panel decides surfacing (T3-15) |
| F-AD-068 | Brand › Components summary | ❌ | 930 | — | — | — | — | REMOVED-N/A |  |
| F-AD-069 | Brand › Component styles | 🟡 | 931 | P09 l.84, l.153 | Y | — | Y | COVERED | becomes "Browse section blocks in Add ›"; AI part DEFERRED (SC-21) |
| F-AD-070 | Draggable DS card grid | ❌ | 932 | — | — | — | — | REMOVED-N/A |  |
| F-AD-071 | AI placement + doors (F1–F2) | ✅ | 938–939 | SC-21; P12 RT-14, §5; P20 AI-03…06 | — | — | — | DEFERRED-BY-DECISION |  |
| F-AD-072 | Removed AI doors | ❌ | 940 | P20 §2.1; SC-3 inactive row | — | — | — | REMOVED-N/A |  |
| F-AD-073 | Scope band … pre-run note (F4–F9) | ✅ | 941–946 | SC-21; P20 §4.2; P12 §5 | — | — | — | DEFERRED-BY-DECISION |  |
| F-AD-074 | Chat thread; Auto-apply (F10–F11) | ❌ | 947–948 | — | — | — | — | REMOVED-N/A |  |
| F-AD-075 | Plan review … privileged confirm (F12–F20) | ✅ | 949–957 | SC-21; P20 §4–7; P12 §5 | — | — | — | DEFERRED-BY-DECISION |  |
| F-AD-076 | One-click content actions | 🟡 | 958 | SC-21; P20 (L5-016) | — | — | — | DEFERRED-BY-DECISION |  |
| F-AD-077 | AI helpers elsewhere | ✅ | 959 | SC-21 (SEO, alt text, History summary, Brand listed) | — | — | — | DEFERRED-BY-DECISION |  |
| F-AD-078 | Build AI workspace spec | ⏳ | 960 | SC-21 ("AI Build tab", later) | — | — | — | DEFERRED-BY-DECISION |  |
| F-AD-079 | Engine element types | ✅ | 966 | D brief l.1155 (BIC-01, 69 block records); SC-11 | P | — | — | COVERED | 52 types vs SC-11 "69 types" (T3-18) |

## Assets, CMS, Forms

INV §5 lines 998–1256 · 129 rows · gaps: `_extraction/T4-assets-cms-forms.md` §Contradictions & gaps

| FID | Feature | INV | INV line | Design home | Controls | States specified | Interaction | Coverage | Gap / note |
|---|---|---|---|---|---|---|---|---|---|
| F-AS-01 | Drawer header + count + ⋯ Select | ✅ | 1001 | P/08 §4.1, §11 (Merge) | Y | count | Y | COVERED | Drawer merges into workspace; "Select assets…" mode kept (P/08 §10) |
| F-AS-02 | Panel search | ✅ | 1002 | P/08 §4.1 | Y | no-match, truncated, failed | Y | COVERED | `/` focuses (SC-12) |
| F-AS-03 | Server search-scope line | ✅ | 1003 | P/08 §9 | Y | truncated, failed | Y | COVERED | — |
| F-AS-04 | "Manage assets ›" door | ✅ | 1004 | P/08 §4.1 "one management surface" | Y | — | Y | COVERED | Door disappears by merge |
| F-AS-05 | Filter ▾ type + folder | ✅ | 1005 | P/08 §4.1 toolbar, nav | Y | — | P | COVERED | Fonts bucket label fixed |
| F-AS-06 | Grid + Load more | ✅ | 1006 | P/08 §4.1, T-AS-09 | Y | loading | Y | COVERED | Load more now in workspace |
| F-AS-07 | Click-insert / replace selected | ✅ | 1007 | P/08 §4.3, §4.5 | Y | target gone/locked | Y | COVERED | Change: click selects; explicit Replace |
| F-AS-08 | Drag asset onto canvas | ✅ | 1008 | P/08 §4.3, MS IAF-09 E | Y | invalid drop | Y | PARTIAL | Stock drag forced `imported-*.webp` copy not addressed |
| F-AS-09 | OS file drop on canvas | ✅ | 1009 | P/08 §5 last row | P | locked refusal (INV only) | P | COVERED | — |
| F-AS-10 | Hover-to-select check | ✅ | 1010 | P/08 §10 (Shift/⌘ multi) | N | — | P | PARTIAL | Hover check entry not specified |
| F-AS-11 | Bulk bar | ✅ | 1011 | P/08 §10 "bulk Move/Tag/Delete" | P | — | P | PARTIAL | Bar layout/controls not specified |
| F-AS-12 | Upload split button | ✅ | 1012 | P/08 §4.1 Upload ▾ | Y | — | Y | COVERED | Fonts move to nav section |
| F-AS-13 | Drop strip, progress, failed rows | ✅ | 1013 | P/08 §5 | Y | uploading, failed, unsupported, oversize | Y | COVERED | Progress claim conflicts, see F-AS-52 |
| F-AS-14 | Quota band | ✅ | 1014 | P/08 §9, §10 footer; P/23:262 | Y | near-limit, full | P | CONFLICT | Warn at 90% (P/08 §9) vs ≥80% (P/23:103, INV) — T4-4 |
| F-AS-15 | Replacement upload modal + banner | ✅ | 1015 | CP:616 (Move); P/08 §5 "Choose a smaller file" | P | oversize | N | PARTIAL | Follow-on modal/banner unspecified |
| F-AS-16 | Empty/error/loading/no-match | ✅ | 1016 | P/08 §9 | Y | empty, no results, truncated, failed, offline | Y | COVERED | — |
| F-AS-17 | Pick mode (one picker) | ✅ | 1017 | P/08 §4.3–4.4; P/02 §5 | Y | target gone, cancel | Y | COVERED | Header copy canonical |
| F-AS-18 | Viewer read-only gating | ✅ | 1018 | P/08 §8; SC-6 | Y | disabled-with-reason | Y | COVERED | — |
| F-AS-19 | Device-only insert warning | 🐞 | 1019 | P/08 §5 Failure (FI-03); P/14:142 | Y | not saved, retry, other device | Y | COVERED | Data-loss answered; ⛔ P1-D18 blocks cross-device |
| F-AS-20 | APPLIED badge / lock overlay on cards | ⏳ | 1020 | CP:621 (Defer) | N | — | N | DEF (FD-IA-09 Defer) | APPLIED kept only in Versions |
| F-AS-21 | Detail hub: preview, alt, Generate | ✅ | 1025 | P/08 §4.2 Details | Y | — | P | COVERED | Generate hidden (SC-21) |
| F-AS-22 | Hub rows (Used in/Versions/Edit/Optimise/Replace) | ✅ | 1026 | P/08 §4.2 | Y | — | Y | COVERED | — |
| F-AS-23 | Hub action list | ✅ | 1027 | P/08 §4.2 actions | Y | — | Y | COVERED | Download added to all menus |
| F-AS-24 | Versions + inline restore | ✅ | 1028 | P/08 §4.2 Versions | P | — | N | PARTIAL | Restore/apply-version flow and author line unspecified |
| F-AS-25 | Used-in + Go | ✅ | 1029 | P/08 §4.2 Usage, T-AS-05 | Y | unused, scope banner | Y | COVERED | + CMS scan (new) |
| F-AS-26 | Drawer Optimise panel | ❌ | 1030 | — | — | — | — | REMOVED-N/A | — |
| F-AS-27 | Replace across site | ✅ | 1031 | P/08 §6; MS IAF-09 G | Y | blocked batch | Y | COVERED | All-or-none (Change) |
| F-AS-28 | Icon browser drill-in | ✅ | 1036 | P/08 AS-09, §4.1 Upload ▾ Icons | N | — | N | PARTIAL | Drill-in vs modal not reconciled; recents unspecified |
| F-AS-29 | "Select Icon" modal (Inspector) | ✅ | 1037 | CP:630 (Move → "Rail → Assets") | N | — | N | PARTIAL | Register-only; home is boilerplate (T4-10) |
| F-AS-30 | Drawer stock overlay | ❌ | 1038 | — | — | — | — | REMOVED-N/A | — |
| F-AS-31 | Stock modal | ✅ | 1039 | P/08 §5 Stock save, §4.1 | P | not configured | P | PARTIAL | Photos/Videos switch, Orientation/Colour filters unspecified |
| F-AS-32 | Stock: one provider missing | 🟡 | 1040 | P/08 §9 | P | not configured | N | PARTIAL | Single-provider fallback state missing |
| F-AS-33 | Stock save loses alt/credit | 🐞 | 1041 | P/08 §5 Stock save | Y | — | P | COVERED | Data-loss answered (keep author/source/alt + ping) |
| F-AS-34 | Site fonts modal | ✅ | 1042 | P/08 §7 | Y | added/not added | Y | COVERED | Owner name needs API (SC-9) |
| F-AS-35 | Library top bar | ✅ | 1047 | P/08 §4.1; SC-1 | Y | — | Y | COVERED | UX-20 back position solved by SC-1 slot |
| F-AS-36 | Folder rail | ✅ | 1048 | P/08 §4.1 nav | Y | — | P | COVERED | "Unused" → "No known placements" |
| F-AS-37 | Folder delete confirm | ✅ | 1049 | P/08 §6 last sentence | P | — | P | PARTIAL | No confirm (SC-15) and no Undo (MS IAF-09 G) — T4-6 |
| F-AS-38 | Trash row | ❌ | 1050 | P/08 §4.1 Recently deleted | — | — | — | REMOVED-N/A | Revived as Recently deleted after U-4 |
| F-AS-39 | Grid toolbar | 🟡 | 1051 | P/08 §4.1 (density separate) | Y | — | Y | COVERED | UX-20 label clash resolved |
| F-AS-40 | List/grid views, drop zone | ✅ | 1052 | P/08 §4.1, §10 (rows 40) | P | empty drop zone | P | PARTIAL | List columns and grid drop overlay unspecified |
| F-AS-41 | Details rail | ✅ | 1053 | P/08 §4.2 (320, tabs) | Y | — | Y | COVERED | — |
| F-AS-42 | Regenerate alt local-only bug | 🐞 | 1054 | SC-21 | — | — | — | DEF (SC-21) | AI alt hidden |
| F-AS-43 | Context menu | ✅ | 1055 | P/08 AS-04, §4.2 | Y | — | Y | COVERED | — |
| F-AS-44 | Library modals (13) | ✅ | 1056 | P/08 §11 "item actions kept" | P | — | N | PARTIAL | Modals not enumerated; clash/move-failed states unspecified |
| F-AS-45 | Confirm delete + 8s Undo | ✅ | 1057 | P/08 §6; SC-15 E-4; P/24 | Y | grace, Recently deleted | Y | COVERED | — |
| F-AS-46 | Status bar | ✅ | 1058 | P/08 §10 footer 32 | Y | not on server | P | COVERED | — |
| F-AS-47 | Image editor | ✅ | 1063 | P/08 §6; MS IAF-09 F/H | Y | — | Y | COVERED | Modal → work-area subview |
| F-AS-48 | Saved/discard/save-failed dialogs | ✅ | 1064 | MS IAF-09 H ("history failure does not erase file") | P | save failed | N | PARTIAL | Discard-unsaved dialog not specified |
| F-AS-49 | Output formats | ✅ | 1065 | P/08 §6; MS IAF-09 H | Y | — | — | COVERED | — |
| F-AS-50 | Accepted kinds + limits | 🟡 | 1070 | P/08 §5 Accept | Y | refused-with-reason | Y | CONFLICT | P/08 §4.1 Type filter lists "Audio"; §5/§11 refuse audio — T4-5 |
| F-AS-51 | Upload → Blob → createAsset | 🟡 | 1071 | P/08 §5 Confirm | Y | uploading, waiting to sync | Y | COVERED | — |
| F-AS-52 | Upload progress | 🟡 | 1072 | P/08 AS-07, §5 Progress | Y | — | — | CONFLICT | Docs call 75→99 "real, existing"; INV: synthetic, stalls at 75 — T4-3 |
| F-AS-53 | Auto alt on upload | 🟡 | 1073 | SC-21 (hook unmounted) | — | — | — | DEF (SC-21) | — |
| F-AS-54 | Unconfigured alt provider | 🟡 | 1074 | SC-21 | — | — | — | DEF (SC-21) | — |
| F-AS-55 | Server quota trusts declared bytes | 🐞 | 1075 | P/08 AS-07 (noted); CP:656 Fix | N | — | N | PARTIAL | No SC-9 / backlog row — T4-9 |
| F-AS-56 | Image loss after failed registration | 🐞 | 1076 | P/08 §5; SC-9 ⛔ FI-03; P/14:142; backlog BK-007 | Y | not saved, retry, other device, publish block, exit guard | Y | COVERED | Blocked ⛔ P1-D18; interim guard mandatory |
| F-AS-57 | Library scope = user | 🟡 | 1077 | P/08 header, §8 | Y | viewer | — | COVERED | Decided per user per site |
| F-CM-01 | Rail entry | ✅ | 1086 | P/02 LR-05; P/07 §4 | Y | viewer disabled | Y | COVERED | — |
| F-CM-02 | Drawer root | ✅ | 1087 | P/07 §4 (nav column) | Y | — | Y | COVERED | Merge |
| F-CM-03 | Loading / error | ✅ | 1088 | P/07 §11 | P | loading, failed+Retry | P | COVERED | "Not a data loss" wording not carried |
| F-CM-04 | Drawer empty state | 🐞 | 1089 | P/07 §11, §9 | P | no collections | P | PARTIAL | Toggle default + one primary action not stated |
| F-CM-05 | Workspace takeover empty centre | 🐞 | 1090 | P/07 §11; CM-02 "Keep" | P | no collections | N | PARTIAL | CTA placement (centre vs hint column) unspecified |
| F-CM-06 | Back to canvas | ✅ | 1091 | SC-1; P/07 §4 | Y | — | Y | COVERED | Relabel "‹ Back to {origin}" |
| F-CM-07 | ⌘K "Manage CMS records" | ✅ | 1092 | P/18 CP-06 (as-is), §Records group | P | — | P | PARTIAL | Label/target mismatch not addressed |
| F-CM-08 | Collection header, tabs, ⋯ | 🟡 | 1097 | P/07 §4 (four visible tabs) | Y | — | Y | COVERED | — |
| F-CM-09 | Sheets / Airtable | ⏳ | 1098 | P/07 §4, §12 "Planned" | Y | disabled | — | COVERED | — |
| F-CM-10 | Create Collection modal | 🐞 | 1099 | P/07 §9 | P | create fails | P | PARTIAL | Stepper bug and 9-type list untouched — T4-16 |
| F-CM-11 | Two-step wizard | ❌ | 1100 | — | — | — | — | REMOVED-N/A | — |
| F-CM-12 | Collection settings | ✅ | 1101 | P/07 §8 | Y | blocked while bound | Y | COVERED | + preflight, soft delete |
| F-CM-13 | Products preset | ✅ | 1102 | CP:671 vs CP:841; P/03 AD-16 Defer | N | — | N | CONFLICT | T4-11 |
| F-CM-14 | Records table | 🟡 | 1107 | P/07 §5 Table, Bulk | Y | draft/published/changed | Y | COVERED | — |
| F-CM-15 | Records search | ✅ | 1108 | P/07 §5 | Y | no match | Y | COVERED | — |
| F-CM-16 | Empty collection states | ✅ | 1109 | P/07 §11, CM-04 | Y | no fields, no records | Y | COVERED | — |
| F-CM-17 | Record sheet | ✅ | 1110 | P/07 §5 Open record, Form | Y | — | Y | COVERED | Rich-text toolbar has no board |
| F-CM-18 | Record footer (eligibility colour bug) | 🐞 | 1111 | P/07 §5 Published, Save states | Y | saving, saved, failed, conflict | Y | PARTIAL | Eligibility line "kept"; colour defect not addressed |
| F-CM-19 | Record previews | ✅ | 1112 | P/07 §5 Preview | Y | — | Y | COVERED | "Preview (unsaved)" relabel |
| F-CM-20 | Delete record (new id) | 🟡 | 1113 | P/07 §5 Delete; SC-9; SC-15 E-1 | Y | Recently deleted, slug taken | Y | COVERED | Fallback until undelete endpoint |
| F-CM-21 | Conflict / gone banners | 🟡 | 1114 | P/07 §5 Save states | P | conflict | N | PARTIAL | No "theirs" diff — T4-17 |
| F-CM-22 | In-drawer views | ❌ | 1115 | — | — | — | — | REMOVED-N/A | — |
| F-CM-23 | Fields table | ✅ | 1120 | P/07 §6 List | Y | — | Y | COVERED | Field reorder absent everywhere |
| F-CM-24 | + Add field | ✅ | 1121 | P/07 §6 Add field | Y | key clash | Y | COVERED | — |
| F-CM-25 | Field inspector | ✅ | 1122 | P/07 §6 Settings, Save | Y | saving, failed | Y | COVERED | Receipts (Fix) |
| F-CM-26 | Delete field | ✅ | 1123 | P/07 §6; SC-15 E-3 | Y | bound, has values | Y | COVERED | ⛔ tombstone dependency |
| F-CM-27 | Field-type coverage 16/10/9 | 🟡 | 1124 | P/07 §6 (16 in Add field) | Y | — | Y | PARTIAL | Create modal list not unified — T4-16 |
| F-CM-28 | Dynamic pages pane | ✅ | 1129 | P/07 §7; DYN §10.1 | Y | missing, collision, ready | Y | COVERED | — |
| F-CM-29 | Server render + pre-publish | ✅ | 1130 | DYN §16 T-DYN-10; P/14 checks | Y | warn/fail | — | COVERED | — |
| F-CM-30 | Pages-panel dynamic count | 🐞 | 1131 | P/11:75; DYN §6, §14 | P | 0 pages, missing | N | PARTIAL | Count rule (pattern without collection page) not stated |
| F-CM-31 | Sources (lost on reload) | 🐞 | 1136 | P/07 §10 banner | Y | session reset | Y | COVERED | Disclosure, not persistence — T4-12 |
| F-CM-32 | Variables (canvas braces) | 🟡 | 1137 | P/07 §10; DYN §7.1 | Y | — | P | PARTIAL | Canvas still shows `{{site.key}}` — not addressed |
| F-CM-33 | Conditions (no-op) | 🐞 | 1138 | DYN §12; P/07 §10 | Y | ghost, not active | Y | COVERED | Redesign; legacy kept inactive |
| F-CM-34 | Inspector CMS binding | ✅ | 1143 | DYN §8; P/06 A1 | Y | §14 list | Y | COVERED | Section retired → row binds |
| F-CM-35 | Binding popover | ❌ | 1144 | — | — | — | — | REMOVED-N/A | — |
| F-CM-36 | Bound chip | ✅ | 1145 | DYN §8.4; P/06 A5 | Y | missing | Y | COVERED | — |
| F-CM-37 | Canvas follows publish | ✅ | 1146 | DYN §8.3 If empty, §14 | Y | empty fallback, unpublished | Y | COVERED | — |
| F-CM-38 | Collection list | 🟡 | 1147 | DYN §11 | Y | empty block, drafts | Y | COVERED | — |
| F-CM-39 | Rich text export | ✅ | 1148 | DYN D6 | Y | formatting removed | — | COVERED | — |
| F-CM-40 | Handlebars/Liquid mode | 🧪 | 1149 | CP:698 (Defer) | — | — | — | DEF (FD-IA-09 Defer) | — |
| F-CM-41 | Server authority | ✅ | 1154 | P/14:156; MS IAF-07 G | — | — | — | PARTIAL | [audit 10-18: no controls/states cited → PARTIAL] — |
| F-CM-42 | Outbox + retry toast | ✅ | 1155 | P/14 T-PB-18; P/11:106 | P | pending | P | PARTIAL | Retry toast copy not in any spec |
| F-CM-43 | Conflict handling | 🟡 | 1156 | P/07 §5 "existing semantics" | P | conflict | N | PARTIAL | Stale Keep-mine resend not addressed — T4-17 |
| F-CM-44 | Gone / invalid (local-only collection) | 🟡 | 1157 | P/07 §5 Offline | P | device-only | N | PARTIAL | No local-only collection marker — T4-18 |
| F-CM-45 | Soft-delete tombstones | ✅ | 1158 | P/07 §8; SC-9 | Y | Recently deleted | Y | COVERED | — |
| F-CM-46 | Publish gate + snapshot | ✅ | 1159 | P/14:156, T-PB-18 | Y | syncing, conflict | Y | COVERED | Caps not mentioned |
| F-CM-47 | Import CSV | ✅ | 1164 | P/07 §12 | Y | partial result | Y | COVERED | No export (consistent) |
| F-CM-48 | Import JSON | ✅ | 1165 | P/07 §4 ⋯ | P | skipped rows | P | COVERED | — |
| F-CM-49 | Records modal | ❌ | 1166 | — | — | — | — | REMOVED-N/A | — |
| F-FM-01 | Form block | ✅ | 1175 | P/03 §4 Forms; REPORT:290 | P | — | P | PARTIAL | Missing labels (L3-029) only in REPORT contract |
| F-FM-02 | Contact Form component | ✅ | 1176 | P/03:80, :118 | P | — | P | PARTIAL | Label `for` not addressed in a panel |
| F-FM-03 | Contact section empty box | 🐞 | 1177 | CP:710 (Fix) | N | — | N | PARTIAL | Register-only |
| F-FM-04 | Field elements list | ✅ | 1178 | P/03 §4 (Forms sub-heading) | Y | — | Y | COVERED | — |
| F-FM-05 | Password field on public forms | 🐞 | 1179 | CP:712 (Fix → "After submit") | N | — | N | PARTIAL | Register-only; no design answer — T4-7 |
| F-FM-06 | Upload field | ❌ | 1180 | CP:713 (Defer) | — | — | — | REMOVED-N/A | REPORT:280 still lists "upload" — T4-14 |
| F-FM-07 | Fields section | 🟡 | 1185 | PDB INS-06 (:549); REPORT:288–290 | P | — | P | PARTIAL | `field-N` collision not addressed; no panel spec |
| F-FM-08 | Per-field inspector | ✅ | 1186 | PDB FD-INS-02 Content (:678) | P | — | P | PARTIAL | Required/Type editable in two places unresolved |
| F-FM-09 | After submit | ✅ | 1187 | CPC FORM-01; MS IAF-13 H | Y | loading, saving, saved, failed, restricted | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] — |
| F-FM-10 | Old Store/Webhook/Email settings | ❌ | 1188 | CP:717 (Defer) | — | — | — | REMOVED-N/A | PDB:679 "Submission → Advanced" stale — T4-15 |
| F-FM-11 | Send to (ADMIN) | ✅ | 1189 | CPC FORM-01 | Y | restricted | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] — |
| F-FM-12 | Spam protection toggle | 🟡 | 1190 | CPC:65; P/10 T-ST-02 | Y | saved | Y | CONFLICT | "Saved directly / live" vs applies on next publish — T4-2 |
| F-FM-13 | Publish wiring | ✅ | 1195 | CP:720 (Keep) | N | — | N | PARTIAL | Register-only; `NEXT_PUBLIC_APP_URL` refusal not in P/14 errors |
| F-FM-14 | Public endpoint | ✅ | 1196 | CP:721 (Keep) | — | — | — | PARTIAL | Backend; register-only |
| F-FM-15 | Visitor outcome | ✅ | 1197 | REPORT:292 A20; MS IAF-13 G | N | success, failure (named only) | N | PARTIAL | Visitor page/inline error undesigned |
| F-FM-16 | Spam / abuse limits | 🟡 | 1198 | P/23:268 | P | at limit | N | PARTIAL | Owner not notified at cap |
| F-FM-17 | Notifications | ✅ | 1199 | P/22:160 (bell row) | P | target deleted/forbidden | P | PARTIAL | Email notification undesigned |
| F-FM-18 | Unified inbox | ✅ | 1204 | P/10:105; MS IAF-13 G–I | Y | no forms, no submissions, no matches, failed | Y | COVERED | — |
| F-FM-19 | Inbox filters / Unspam / Unarchive | ❌ | 1205 | P/10:105, :132 (SET-01 NEW) | Y | — | Y | COVERED | Revived; per-form filter only in REPORT — T4-13 |
| F-FM-20 | "Configure in Inspector ›" (pageId) | 🐞 | 1206 | SC-7; P/10:105, T-ST-07; MS IAF-13 E | Y | missing form | Y | PARTIAL | Return designed; `pageId` dependency unregistered — T4-8 |
| F-FM-21 | "Sent from <url>" | 🐞 | 1207 | CP:728 (Fix) | N | — | N | PARTIAL | Register-only — T4-8 |
| F-FM-22 | 365-day retention | ✅ | 1208 | CP:729 (Keep) | N | — | N | PARTIAL | No disclosure anywhere — T4-21 |
| F-FM-23 | Engine FormHandler unused | 🟡 | 1209 | CP:730 (Redesign); REPORT:292 | N | — | N | PARTIAL | Validation messaging undesigned |

## Site settings, Publish, Review, Export, E-commerce, Animation, Sync

INV §6 lines 1257–1550 · 150 rows · gaps: `_extraction/T5-settings-publish.md` §Contradictions & gaps

| FID | Feature | INV | INV line | Design home | Controls | States specified | Interaction | Coverage | Gap / note |
|---|---|---|---|---|---|---|---|---|---|
| F-ST-S1 | Full-pane Settings shell | ✅ | 1261 | P/10 §4, §9; MS IAF-14 F | Y | first entry → Overview, then last screen | Y | COVERED | nav 256→240, footer 44→48, header 112→56 (Change) |
| F-ST-S2 | Phase B nav IA | ✅ | 1262 | P/10 §4 sketch; MS IAF-14 E | Y | — | Y | COVERED | the "Managed in workspace settings ↗" group is renamed "Organization workspace ↗" |
| F-ST-S3 | Old Fonts & colours / Export doors | ❌ | 1263 | P/10 §1 (Brand door); P/01 §6 (Export in site menu) | — | — | — | REMOVED-N/A | CP:733 marks a removed row "Defer", which is a stale disposition |
| F-ST-S4 | Scope line per screen | ✅ | 1264 | P/10 §4 scope chip; T-ST-02 | Y | publish / live / lifecycle / mixed | Y | COVERED | restyled as a chip; Redirects gets a new two-part wording |
| F-ST-S5 | Role-based read-only screens | ✅ | 1265 | P/10 §6 | Y | Checking access (NEW), Could not verify, below role, viewer, plan | Y | COVERED | fixes the rule that an unknown role is treated as a grant |
| F-ST-S6 | Role foot + Permissions dialog | ✅ | 1266 | P/10 §4 sketch line 65; ST-02 | P | — | N | PARTIAL | position sketched; dialog content, states and focus not specified (INV: "place it deliberately") |
| F-ST-S7 | Search Mode | ✅ | 1267 | P/10 §8 | Y | results; restricted rows with lock | Y | PARTIAL | no-results and Esc-twice states not specified (SC-2 search exception applies) |
| F-ST-S8 | Footer save bar (conditional) | ✅ | 1268 | P/10 §5 SET-01; ST-05 | Y | Unsaved, Saving… (NEW), All changes saved, Couldn't save — Retry, Changed elsewhere — Review (needs ⛔ revision stamp), Loading/could-not-load | Y | COVERED | conflict state BLOCKED (T-ST-04); interim read-compare-write is mandatory |
| F-ST-S9 | "Saved · applies on next publish" toast | ✅ | 1269 | P/10 §5 | Y | success | Y | COVERED | — |
| F-ST-S10 | Unsaved settings guard | ✅ | 1270 | P/10 §5 Dirty guard | Y | Keep / Discard / Save and continue + NEW Publish/Preview variant | Y | COVERED | the guard is extended to topbar Publish and Preview |
| F-ST-S11 | Escape leaves Settings | ✅ | 1271 | P/10 §10; SC-2 | Y | — | Y | COVERED | deliberate Change: Esc no longer leaves (T-ST-06) |
| F-ST-S12 | Per-screen save-error banner | ✅ | 1272 | P/10 §5, §6 Server refusal, §10 | Y | error + field errors; focus moves to the first invalid field | Y | COVERED | — |
| F-ST-S13 | Load/error cards blame "your connection" | 🐞 | 1273 | none (P/22 §5.3 splits offline from "Can't reach Buildrick", but only for the global banner) | N | — | N | OMITTED | the server-vs-network copy split for Settings cards has no home |
| F-ST-S14 | Remembered screen + deep links | ✅ | 1274 | P/10 §4 Entry; ST-01; P/14 §5.2 Fix targets | Y | — | Y | COVERED | `SETTINGS_SCREEN_IDS` contract implied, not named |
| F-ST-S15 | Plan gate LockedScreen | 🔒 | 1275 | P/10 §6 Plan restriction; SC-20; P/23 | Y | trial "Pro · included", Free locked, over-limit | Y | COVERED | — |
| F-ST-S16 | Covered editor chrome focusable | 🐞 | 1276 | P/10 §9 "Editor behind inert" | Y | — | Y | COVERED | the one focus-containment contract for all full-page areas sits in P/12 §4.5 (tray inert) and P/10; there is no shared SC row |
| F-ST-S17 | Inconsistent exits across full-page tools | 🐞 | 1277 | SC-1; P/10 §4 | Y | — | Y | COVERED | — |
| F-ST-S18 | Overview group cards | ✅ | 1283 | P/10 ST-03, §11 | Y | — | P | PARTIAL | Overview load and error states not restated; kept as-built |
| F-ST-S19 | Needs attention card | ✅ | 1284 | P/10 ST-03, §7 Access (new item) | Y | — | P | PARTIAL | hidden-when-empty state not specified |
| F-ST-S20 | Site-state strips (archived / deletion) | ✅ | 1285 | P/10 ST-03; P/22 §5.6 banner (9) | P | — | P | PARTIAL | workspace-deletion strip duplicated by the P/22 global banner (9); which one wins is unspecified |
| F-ST-S21 | General · Site identity | ✅ | 1291 | P/10 §7 General (+ "Choose from Assets") | Y | — | P | PARTIAL | upload pending and failure states not specified |
| F-ST-S22 | General · premature validation | 🐞 | 1292 | P/10 §7 "validation unchanged" | N | — | N | OMITTED | the defect is preserved by "unchanged"; there is no validate-on-touch rule |
| F-ST-S23 | Site URL slug + confirm | ✅ | 1293 | P/10 §7 General | Y | taken / format errors | Y | COVERED | confirm not on the SC-15 exception list (see T5-03) |
| F-ST-S24 | Language/social/grid/snap moved | ❌ | 1294 | none for grid/snap (grep 0) | — | — | — | REMOVED-N/A | grid/snap destination still UNKNOWN in docs |
| F-ST-S25 | Languages · default locale (footer) | ✅ | 1295 | P/10 §5 Mixed, §4 chip; MS IAF-14 H; T-IAF14-4 | Y | staged footer states | Y | COVERED | — |
| F-ST-S26 | Languages · locales table (immediate) | ✅ | 1296 | P/10 §5 Mixed, §6 Checking access; MS IAF-14 H | Y | immediate + confirm; disabled while checking | Y | COVERED | remove-confirm conflicts with SC-15 (T5-03); Translation checklist dialog not specified; brief:917 says there is no page-level translation |
| F-ST-S27 | Languages · auto-redirect by browser | ❌ | 1297 | none | — | — | — | REMOVED-N/A | no doc revives it |
| F-ST-S28–S30 | SEO defaults, social profiles ×6, indexing/robots | ✅ | 1303–1305 | P/10 §7 SEO, ST-04; MS IAF-14 H | Y | staged | Y | COVERED | OG image gains "Choose from Assets" |
| F-ST-S31 | Per-page overrides strip | ✅ | 1306 | P/10 §4 sketch; T-ST-08; T-IAF14-3 | Y | — | Y | COVERED | links the two SEO homes (site vs page) |
| F-ST-S32 | Yoast-level SEO | ⏳ | 1307 | P/10 §7 reserved "SEO analysis · Planned" card | P | disabled "Coming soon" | N | DEFERRED-BY-DECISION | owner 2026-10-04 (P/10 header l.5); T-ST-09 |
| F-ST-S33 | Domains list | ✅ | 1313 | P/10 §7 Domains | Y | Pending DNS / Verified / Failed — Retry | Y | COVERED | — |
| F-ST-S34 | Add a domain dialog | 🟡 | 1314 | P/10 §7 "unchanged"; CP:764 "Redesign" | P | — | N | PARTIAL | CP says Redesign but no redesign is written; hard-coded nameservers (L3-033) unaddressed |
| F-ST-S35 | Set as primary | ✅ | 1315 | P/10 ST-04 | P | — | N | PARTIAL | its confirm is not an SC-15 exception (T5-03) |
| F-ST-S36 | Manage DNS view | ✅ | 1316 | P/10 §7 Domains + reserved "Edit records at Vercel · Planned" | Y | DNS statuses; remove = SC-15 confirm | Y | COVERED | — |
| F-ST-S37 | Redirect rules table | ✅ | 1317 | P/10 §7 "unchanged"; P/24 row 37 "Keep" | Y | Undo toast | Y | CONFLICT | delete keeps confirm + Undo (P/10, P/24) vs SC-15 "Undo over confirm" (T5-03) |
| F-ST-S38–S40 | Redirect CSV, 404 suggester, slug repair card | ✅ | 1318–1320 | P/10 §7 Redirects; MS IAF-14 H | Y | as-built (all-or-nothing CSV) | Y | COVERED | — |
| F-ST-S41 | Access · password protection | 🟡 | 1321 | P/10 §7 Access (C-3 warning, ⛔ access gate); SC-20; P/14 §5.2 Free Blocking row | Y | on/off warnings; Needs attention; plan lock | Y | PARTIAL | silent skip when the Vercel plan lacks protection (402/403) is not specified anywhere |
| F-ST-S42 | Access · share links door | ✅ | 1322 | P/10 ST-04, ST-07 | Y | — | Y | COVERED | leaves editor |
| F-ST-S43–S44 | Analytics providers + Verify dialog | ✅ | 1328–1329 | P/10 §7 Analytics; MS IAF-14 H | Y | not configured / waiting / receiving / error | Y | COVERED | — |
| F-ST-S45 | Analytics consent toggle | ❌ | 1330 | none (grep "consent": REVIEW only) | — | — | — | REMOVED-N/A | — |
| F-ST-S46 | Form submissions inbox | ✅ | 1331 | P/10 §7 (+Spam/Archived views); SC-7 return chip; P/22 §5.11 bell row | Y | Inbox/Spam/Archived; Unspam/Unarchive | Y | COVERED | the Delete confirm is not on the SC-15 list (T5-03) |
| F-ST-S47 | Forms lifecycle edge (pre-publish submissions) | 🐞 | 1332 | none (CP:777 "Fix" → IAF-13, no spec text) | N | — | N | OMITTED | — |
| F-ST-S48 | Custom code | 🔒 | 1338 | P/10 §7; SC-2 code exception; SC-20; P/14 §5.2 Tip; P/23 TR-7 | Y | Pro/trial/Free locked; "Saved · not published on Free" | Y | COVERED | export omission is client-enforced (P/23 l.215) |
| F-ST-S49 | Security headers | ✅ | 1339 | P/10 §7 "unchanged incl. custom HSTS" | Y | staged | Y | COVERED | no board (FG-032 WONTFIX) |
| F-ST-S50 | Danger zone · Archive/Unarchive | ✅ | 1340 | P/10 §7 "unchanged actions and confirmations", §6 | Y | disabled while checking | Y | CONFLICT | archive confirm is not an SC-15 exception (T5-03) |
| F-ST-S51 | Danger zone · Transfer | ✅ | 1341 | P/10 §6 exception note; SC-15 exception | Y | creator-ADMIN allowed | Y | COVERED | — |
| F-ST-S52 | Danger zone · Delete site | ✅ | 1342 | P/10 §7 "unchanged… confirmations" | Y | — | Y | CONFLICT | delete-site confirm is not on the SC-15 list; the dashboard has a 30-day restore (T5-03) |
| F-ST-S53 | Workspace doors | ✅ | 1343 | P/10 §7 "open … in a new tab"; MS IAF-14 G | Y | — | P | PARTIAL | the in-pane door card (`WorkspaceDoorScreen` Close / Open ↗) is neither kept nor removed explicitly |
| F-ST-S54 | Integrations screen | ❌ | 1344 | P/10 §11 "door to dashboard Integrations" | — | — | — | REMOVED-N/A | CP:784 "Defer" is stale |
| F-ST-S55 | Webhooks screen | ❌ | 1345 | P/10 ST-07 door "Integrations & webhooks" | — | — | — | REMOVED-N/A | CP:785 "Defer" is stale |
| F-ST-S56 | Settings-server authz | ✅ | 1346 | P/10 ST-06, §6; MS IAF-14 D | Y | role matrix | Y | COVERED | server authoritative; "spot-checked, not exhaustive" in INV |
| F-PB-P1 | Pre-publish checks in panel | ✅ | 1353 | P/14 §4.1 Checks, §5.2, §6 | Y | checking, failed-to-load Retry, Blocking/Tips | Y | COVERED | — |
| F-PB-P2 | New check rows (Fix dead ends) | 🟡 | 1354 | P/14 §5.2 table; T-PB-02 | Y | Blocking/Tip per row | Y | COVERED | every row has Fix › or "How to fix" |
| F-PB-P3 | "SEO configured" check can't clear | 🐞 | 1355 | P/14 §5.2 (Tip → Settings › SEO); P/10 §7 title template = Planned | P | Tip | P | PARTIAL | still a dead end: Fix goes to a screen with no title-template field until the SEO arc (T5-07) |
| F-PB-P4 | Client approval row | ✅ | 1356 | P/14 §4.1 Approval; P/17 §5.5 | Y | approved / (not required) / expired / revoked = no review | Y | COVERED | — |
| F-PB-P5 | Release to / Environment | 🟡 | 1357 | P/14 §4.1 "Goes to" | Y | — | Y | COVERED | empty Preview row removed (DS) |
| F-PB-P6 | Changes in this session | ✅ | 1358 | P/14 §4.1, §5.1 (P-2 fallback "Edits this session") | Y | empty, first publish, fallback | Y | COVERED | CP:792 says "Keep", P/14 §9 says "Change" |
| F-PB-P7 | Last deploy | ✅ | 1359 | P/14 §4.1 Status card | Y | Live / Changes not published / Not published (glyph + text) | Y | COVERED | — |
| F-PB-P8 | Panel ⋯ menu | 🟡 | 1360 | P/14 §4.1 header ⋯, §5.7 | Y | ADMIN-only Unpublish | Y | COVERED | label "All releases ›" (P/14) vs "All versions ›" (P/12 RT-10) |
| F-PB-P9 | Unpublish confirm | ✅ | 1361 | P/14 §5.7; SC-15 exception | Y | typed confirm, toasts | Y | COVERED | — |
| F-PB-P10 | Single CTA + gate reason | ✅ | 1362 | P/14 §4.1 footer, §4.2, §6; P/01 §5.9 | Y | disabled reasons (flag, viewer, offline, conflict, save failed, checks, nothing changed, locked) | Y | COVERED | CTA verb "Publish changes" replaces "Publish to production" |
| F-PB-P11 | Progress block | ✅ | 1363 | P/14 §5.4, §4.2 | Y | step list, elapsed, topbar "Publishing n/N…" | Y | COVERED | depends on the PB-10 code fix |
| F-PB-P12 | Cancel running publish | 🟡 | 1364 | P/14 §5.4 | Y | "Cancel (not started)" ADMIN + Queued only | Y | COVERED | closes the role mismatch in the 10-14 P0 note |
| F-PB-P13 | Failure block | ✅ | 1365 | P/14 §5.5, §7 | Y | 13 reason rows | Y | COVERED | — |
| F-PB-P14 | Publish log modal | ✅ | 1366 | P/14 §5.5 "View log" | P | real failed step | P | PARTIAL | modal size and layout not specified |
| F-PB-P15 | Reconnect Vercel modal | ✅ | 1367 | P/14 §7 "Repair connection ↗ (existing)" | P | — | P | PARTIAL | the "Connection restored · review publish" return state is not specified |
| F-PB-P16 | Just published | 🟡 | 1368 | P/14 §5.5 Published; P/12 §5; T-RT-08 | Y | live, reviews-on next step | Y | COVERED | "See what changed" needs P-4; fallback specified |
| F-PB-P17 | Simulated publish notice | 🧪 | 1369 | P/14 §5.5 Simulated; P-5 | Y | task banner + outcome | Y | COVERED | CP:803 "Defer" vs P/14 designed |
| F-PB-P18 | Flag off / deploy unreachable | 🚩 | 1370 | P/14 §6 Flag off; P/12 §6 | Y | flag off | Y | PARTIAL | "Couldn't reach the deploy service" state (INV) is absent from P/14 §6/§7 |
| F-PB-P19 | Legal line | ✅ | 1371 | none (P/14 §4.1 layout and §9 map omit it) | N | — | N | OMITTED | P/14 §9 says "No capability removed", yet the legal line is dropped (T5-11) |
| F-PB-W1 | Two-step wizard | ❌ | 1377 | P/14 §4.3 | — | — | — | REMOVED-N/A | — |
| F-PB-W2 | "Publish to production?" confirm | ✅ | 1378 | P/14 §4.3 one dialog (sections 1, 4, 5) | Y | section gating, Publish enabled when ticked | Y | COVERED | the amber "replaces the live site" band maps to section 5 implicitly |
| F-PB-W3 | Checks-failed blocks confirm | ✅ | 1379 | P/14 §5.2 re-run before dialog; §6 | Y | checks failed → CTA disabled | Y | COVERED | — |
| F-PB-W4–W6 | Open-errors gate, approval gate, stale approval | ✅ | 1380–1382 | P/14 §4.3 sections 3–4; gate modal → banner | Y | per section; ADMIN-only stale override | Y | COVERED | — |
| F-PB-W7 | Scheduled publish | ⏳ | 1383 | P/14 §10 Planned | N | — | N | DEFERRED-BY-DECISION | P/14 §1 "not in scope" |
| F-PB-W8 | Topbar publish opens confirm over panel | 🐞 | 1384 | P/01 §5.9 routing; P/14 §4.2 | P | — | P | PARTIAL | order "dialog → task progress" is given; L5-061 (both visible at once) not explicitly decided |
| F-PB-H1 | Published versions list | ✅ | 1390 | P/12 RT-12, §5 History; SC-6 | Y | loading/error/empty kept | Y | COVERED | viewer read-only per SC-6; server needs EDITOR (unresolved) |
| F-PB-H2 | Republish (rollback) | ✅ | 1391 | P/14 §5.6 | Y | confirm, running, done/failed, pruned disabled | Y | COVERED | — |
| F-PB-H3 | Version details overlay | ✅ | 1392 | P/12 RT-12 "Published: details, compare" | P | — | P | PARTIAL | overlay content not specified |
| F-PB-H4 | One Compare host | ✅ | 1393 | P/12 §1, §5; P/05 §8; IAF-18 | P | — | P | PARTIAL | Compare interior not read in T5 (home P/05 §8 / IAF-18) |
| F-PB-R1 | Review availability (agency_layer) | 🚩 | 1399 | P/17 §6; OD-R1 (SC-22) | Y | flag off | Y | COVERED | on for all workspaces; flag stays a kill switch |
| F-PB-R2–R7 | Status line, team comments, thread groups, Locate/Copy link, Next ›, Reattach | ✅ | 1400–1405 | P/17 §4.3; P/12 §5 Review | Y | loading / error / never-sent / all-resolved / revoked | Y | COVERED | round card replaces the plain status line |
| F-PB-R8 | Note composer | 🟡 | 1406 | P/17 §4.3 audience toggle; OD-R5 | P | Send / Retry send | Y | PARTIAL | replies covered; edit/delete (L5-033) and @mentions (L5-032) not decided |
| F-PB-R9–R10 | Review ⋯ menu, Round history modal | ✅ | 1407–1408 | P/17 CR-14 Keep, §4.3 | Y | — | Y | COVERED | — |
| F-PB-R11 | Revoke/withdraw confirm (+cross-site authz hole) | 🐞 | 1409 | P/17 §5.2 (confirm = SC-15 exception) | Y | — | Y | PARTIAL | the INV BK-08 cross-site revoke hole is in no panel or BL (T5-05) |
| F-PB-R12 | Send for review popover | ✅ | 1410 | P/17 §5.1 | Y | snapshot fail, one-seat note | Y | COVERED | — |
| F-PB-R13 | Compare with approved | ✅ | 1411 | P/17 §5.5 "Compare ›" | Y | — | Y | COVERED | — |
| F-PB-R14 | Client `/review/<token>` page | 🟡 | 1412 | P/17 §4.1–4.2, §5.3, §6 | Y | loading / identify / open / no snapshot / answered / dead / offline / rate-limited | Y | COVERED | pins depend on OD-R4 security review |
| F-PB-R15 | Resolve as workspace ADMIN (authz) | 🐞 | 1413 | none | N | — | N | PARTIAL | Covered at decision level: PDB:173 (P1-D20), PDB:187 FI-05 + T-FI-05 server-boundary acceptance, P13:31/62/113, RIH:150. Missing from SC-9 ⛔ and backlog (T5-02, corrected after review) |
| F-PB-R16 | Hand a comment to AI | ⏳ | 1414 | SC-21 | — | — | — | DEFERRED-BY-DECISION | SC-21 |
| F-PB-X1 | Export modal + entry points | ✅ | 1420 | P/01 §6 "Export site… → Export dialog · Keep"; MS IAF-15 E–F | P | — | P | PARTIAL | **no panel spec**; ⌘K entry not listed (P/18); label "Export site…" vs code "Export code" |
| F-PB-X2 | Formats (Vue/Next "Soon") | ⏳ | 1421 | MS IAF-15 H "Vue/Next disabled Soon"; IAF-23 H | Y | disabled Soon | N | CONFLICT | IAF-15 keeps the Soon tiles, but INV says "don't draw Soon unless planned" and nothing in P plans them (T5-06) |
| F-PB-X3–X7 | Preview/Code/Options tabs, Preparing/Ready/Failed, ZIP contents, React export, fidelity | ✅ | 1422–1426 | MS IAF-15 F–I, K–L only | P | Preparing / ready / failed / blocked | P | PARTIAL | IA-level record only; no geometry beyond "bounded 720"; Desktop width 1440 parity from P/05 l.90 |
| F-PB-C1 | Set Up Products Collection modal | 🟡 | 1432 | P/03 AD-16 + l.145 "Defer (P1-D15)"; CP:841 "Redesign" | N | — | N | CONFLICT | P/03 says Defer, CP says Redesign; no design home either way (T5-04) |
| F-PB-C2 | Cart + Stripe checkout | ⏳ | 1433 | MS IAF-23 E/M; CP:842 Defer; brief P1-D15 l.168 | N | — | N | DEFERRED-BY-DECISION | P1-D15 is still a "proposed scope decision"; unescaped Stripe injection (INV) is not in BL |
| F-PB-N1 | Standalone Animation section | ❌ | 1439 | P/19 IX-04 (row inside Interactions) | — | — | — | REMOVED-N/A | — |
| F-PB-N2–N5 | Animation row, Animation editor, Interactions list + drill-in, trigger picker | ✅ | 1440–1443 | P/19 §4.1–4.4 | Y | On/Off rows, play, presets-first | Y | COVERED | ▶️ emoji replaced by "Play" (P/19 l.103) |
| F-PB-N6 | Interaction editor (target/loop/reverse) | 🟡 | 1444 | P/19 §4.3 (NEW UI on target/reverse/repeat) | Y | — | Y | COVERED | — |
| F-PB-N7 | Published interaction runtime | 🟡 | 1445 | P/19 §5.5; ⛔ IXD-4; BL BK-013 | Y | reduced motion / normal / no-JS | Y | COVERED | release-blocking until IXD-4 ships |
| F-PB-N8 | Transform & motion section | ✅ | 1446 | INSP:342 (FD-INS-02 Effects → Transform / Transition) | Y | — | P | COVERED | outside P; read at row level only |
| F-PB-G1 | Email marketing simulation | ❌ | 1452 | — | — | — | — | REMOVED-N/A | — |
| F-PB-G2 | In-browser form/email service | ⏳ | 1453 | CP:852 Defer → IAF-13 | N | — | N | DEFERRED-BY-DECISION | real path = S46 |
| F-PB-Y1 | Local autosave (non-dashboard) | ✅ | 1459 | MS IAF-22 K "Keep autosave"; P/10 §6 demo note | N | — | N | PARTIAL | only kept generically; 5 s interval semantics not stated |
| F-PB-Y2 | Dashboard autosave (+BK-19 session restore never saves) | 🟡 | 1460 | P/11 §8 status; P/12 RT-12 session restore | P | — | P | PARTIAL | the BK-19 gap (restore not saved) has no design or BL row |
| F-PB-Y3 | Auto-retry failed save | ✅ | 1461 | P/22 §5.3 "replays unchanged" | Y | Reconnecting… saving n | Y | COVERED | INV hint "retrying in Ns" not adopted |
| F-PB-Y4 | Autosave held during conflict | ✅ | 1462 | P/22 GS-10 Keep, §5.4 | Y | conflict status persists | Y | COVERED | — |
| F-PB-Y5 | Secrets kept out of browser storage | ✅ | 1463 | none | — | — | — | OMITTED | non-UI invariant; G-12 payload change (P/22 §5.2) should restate it |
| F-PB-Y6–Y7 | Escape-cancelled resize undo; keyboard resize NaNpx | 🐞 | 1464–1465 | P/05 CV-12, l.107 Esc ladder step 1, l.109 keyboard resize; FI-01 | Y | Esc restores; one Undo step | Y | COVERED | 10-14 P0 resize class has a design home |
| F-PB-Y8 | Save refused (never loaded / site gone) | ✅ | 1466 | P/22 §5.1 step 3, §5.7 | Y | read-only canvas + Download local copy | Y | COVERED | OD-1 |
| F-PB-Y9 | Save conflict dialog (+BK-59 no pre-overwrite snapshot) | 🟡 | 1467 | P/22 §5.4; MS IAF-22 G–H | Y | Download started, Reload confirm, Overwrite confirm, backup-fail Retry | Y | PARTIAL | Overwrite still keeps no "before overwrite" copy; "Save a backup" renamed "Download a copy" |
| F-PB-Y10 | Serialized saves | ✅ | 1468 | none | — | — | — | OMITTED | non-UI; T-IAF22-1 implies it |
| F-PB-Y11 | Settings mirror refused | ✅ | 1469 | none (P/11 §8 popover has no Site settings owner row) | N | — | N | OMITTED | — |
| F-PB-Y12 | CMS bindings too large | 🟡 | 1470 | none (grep "too large"/size: 0 in P/07 and FD-DYN-01) | N | — | N | OMITTED | INV: "Needs visible copy" |
| F-PB-Y13 | Save pill | 🐞 | 1471 | P/11 §8 status button; SC-4; P/22 §5.3 "never Saved before receipt" | Y | Conflict › Save failed › Offline › Saving › Unsaved › Saved | Y | COVERED | — |
| F-PB-Y14 | Save-failed card | ✅ | 1472 | P/22 §4.2 (stays on canvas); P/11 §8 | Y | — | Y | COVERED | — |
| F-PB-Y15 | Publish blocked after failed save | ✅ | 1473 | P/14 §5.3, §6 | Y | "Save failed — Retry" | Y | COVERED | — |
| F-PB-Y16 | Open in another tab notice | ✅ | 1474 | P/22 §5.12 | Y | banner, Edit here, failure, race | Y | COVERED | toast → banner |
| F-PB-Y17 | Unsaved-work copy per site | ✅ | 1475 | P/22 GS-11, §5.2, ⛔ G-12 | Y | user-scoped interim | Y | COVERED | — |
| F-PB-Y18–Y19 | "Restore my edits" / Retry ⌘S overwrite newer server work (P0 BK-04) | 🐞 | 1476–1477 | P/22 §7 Recovery offer "Restore my edits (Keep)" vs MS IAF-22 H "Restore check current revision" | N | — | N | CONFLICT | **the P0 has no panel-level fix**; P/22 keeps the action unchanged (T5-01) |
| F-PB-Y20 | View-mode variant | ✅ | 1478 | P/22 §5.5 banner (5) | Y | — | Y | COVERED | — |
| F-PB-Y21 | Recovery banner (crash marker) | 🟡 | 1479 | P/22 §4.2 "RecoveryBanner stays on canvas (Keep)" | P | — | P | PARTIAL | banner is off for dashboard sites; not addressed |
| F-PB-Y22 | Toast closes once used | ✅ | 1480 | P/22 §7 Recovery offer (banner: Not now / Discard…) | Y | — | Y | COVERED | superseded by the banner |
| F-PB-Y23 | Shared mirror retry queue | ✅ | 1481 | P/22 §5.3 | Y | — | Y | COVERED | — |
| F-PB-Y24 | Exit guard on pending mirrors | ✅ | 1482 | P/01 l.151; P/22 GS-18, §5.3 | Y | stranded dialog | Y | COVERED | — |
| F-PB-Y25 | Persisted CMS outbox | ✅ | 1483 | P/22 §5.3; P/14 §5.3 | Y | "Saved on this device only" | Y | COVERED | — |
| F-PB-Y26 | CMS hydration error copy | ✅ | 1484 | none in P (CP:878 → IAF-07) | N | — | N | OMITTED | P/07 grep 0 |
| F-PB-Y27 | Saved-templates hydration states | ❌ | 1485 | P/15 l.194 T-TP-18 "Couldn't load saved templates — Retry" | Y | load fail + Retry | Y | COVERED | the doc revives a removed row; CP:879 "Defer" is now stale |
| F-PB-Y28 | Project save queue across reload | 🟡 | 1486 | P/22 §10 Planned (offline-first queue) | N | — | N | DEFERRED-BY-DECISION | P/22 §10 |
| F-PB-Y29 | Crash marker + recheck | ✅ | 1487 | P/22 §5.9 | Y | computed safety line | Y | COVERED | — |
| F-PB-Y30 | Load-error banner | ✅ | 1488 | P/22 §4.2, §5.1, §7 | Y | 4 kinds | Y | COVERED | moved into the global banner slot |
| F-PB-Y31 | Local version history (50) | ✅ | 1489 | P/12 RT-12 Saves | P | — | P | PARTIAL | the 50-version cap and prune rule are not stated |
| F-PB-Y32 | Storage-full recovery | ✅ | 1490 | none (grep "storage-full"/"quota exceeded": plan copy only) | N | — | N | OMITTED | — |
| F-PB-Y33 | Versions export/import JSON | ❌ | 1491 | — | — | — | — | REMOVED-N/A | — |
| F-PB-Y34 | Server versions + rename | ✅ | 1492 | P/12 RT-12 Saves (name, restore, delete) | Y | — | Y | COVERED | — |
| F-PB-Y35 | Migration progress modal | ✅ | 1493 | P/09 BR-13 | Y | — | P | COVERED | — |
| F-PB-Y36 | "Project update failed" toast | ✅ | 1494 | P/09 BR-12 (failed reason) | P | — | N | PARTIAL | toast copy not restated; "Project" noun breaks SC-11 |
| F-PB-Y37 | Brand read-only after failed migration | ✅ | 1495 | P/09 l.132; P/24 l.259 | Y | EditLock reasons switch_off / held / failed | Y | COVERED | — |
| F-PB-Y38 | Notifications bell | ✅ | 1496 | P/22 §5.11; P/01 §5.7 | Y | target deleted / forbidden / unavailable; mark-read fail | Y | COVERED | G-7 blocks in-place open |
| F-PB-Y39 | Role gates disabled with reason | ✅ | 1497 | SC-6; P/10 §6 | Y | — | Y | COVERED | — |
| F-PB-Y40 | Media upload local fallback + retry | 🟡 | 1498 | P/08 §5 FI-03; SC-9 ⛔ interim guard | Y | Save failed; exit blocked with Retry / Remove / Stay | Y | COVERED | — |
| F-PB-Y41 | AI alt text auto | ✅ | 1499 | SC-21 (background hooks unmounted) | — | — | — | DEFERRED-BY-DECISION | SC-21 |
| F-PB-Y42 | Asset versions | ✅ | 1500 | P/08 AS-04 "Versions", l.62 tab; P/23 TR-8 | P | — | P | PARTIAL | P/08 interior not read in T5 |
| F-PB-Y43 | Unsaved tab-switch dialog | ✅ | 1501 | P/02 l.116 | Y | Keep editing / Leave | Y | COVERED | — |
| F-PB-Y44 | Site-scope authz on save/sync | ✅ | 1502 | MS IAF-20 (per CP:896) | — | — | — | PARTIAL | [audit 10-18: no controls/states cited → PARTIAL] non-UI; read at the IA-row level only |
| F-PB-Y45 | Site-scope authz holes (P0) | 🐞 | 1503 | none (P and BL grep: 0) | — | — | — | PARTIAL | Covered at decision level: PDB:173 (P1-D20), PDB:187 FI-05 + T-FI-05 server-boundary acceptance, P13:31/62/113, RIH:150. Missing from SC-9 ⛔ and backlog (T5-02, corrected after review) |
| F-PB-F1 | FEATURE_PUBLISH | 🚩 | 1509 | P/14 §6; P/12 §6 | Y | flag off copy | Y | COVERED | PLANNED, designed as on |
| F-PB-F2 | FEATURE_DS_AI | 🚩 | 1510 | SC-21 | — | — | — | DEFERRED-BY-DECISION | SC-21 adds a new `NEXT_PUBLIC_FEATURE_AI`; how it relates to DS_AI is unstated (T5-10) |
| F-PB-F3 | FEATURE_COLLAB | 🚩 | 1511 | P/21; SC-9 ⛔ MP-3…5 | Y | per P/21 | Y | COVERED | Phase A blocked |
| F-PB-F4 | Dev build (IS_DEV_BUILD) | 🧪 | 1512 | none | — | — | — | OMITTED | dev-only; the INV note that the beforeunload prompt runs in all builds is not addressed |
| F-PB-F5 | Legacy static flags | ❌ | 1513 | — | — | — | — | REMOVED-N/A | — |

## Inspector · Brand workspace

INV §7–8 lines 1551–1881 · 187 rows · gaps: `_extraction/T6-inspector-brand.md` §Contradictions & gaps

| FID | Feature | INV | INV line | Design home | Controls | States specified | Interaction | Coverage | Gap / note |
|---|---|---|---|---|---|---|---|---|---|
| F-IN-01 | Tab strip | ✅ 🆕 | 1555 | PDB:672 INS-D01; PDB:744 INS-D07 Tabs; PM M07-1 | Y | active, error indicator, empty tab "No [category] properties", 2×2 fallback | Y (INS-D08 tablist) | CONFLICT | 3→4 tabs (Content added). B1A:51 H05 keeps "Style/Behaviour/Effects same IDs/order" (T6-1). "Behaviour" vs SC-11 US English (T6-8) |
| F-IN-02 | Flat section list (09-16) | ❌ | 1556 | PM M07-2 Keep replacement | — | — | — | REMOVED-N/A |  |
| F-IN-03 | Page panel | ✅ 🆕 | 1557 | PDB:681 Page appearance; PDB:698 INS-D03; PM M07-3; P06 C5 | Y | no selection/root, collection-page context, breakpoint shown | Y | COVERED | Order: name → background → max width → font/text colour → spacing → Page settings |
| F-IN-04 | "Select something" empty prompt | ❌ | 1558 | PM M07-4 | — | — | — | REMOVED-N/A |  |
| F-IN-05 | Page panel header actions | 🟡 | 1559 | PM M07-5 Fix; PDB:698 | P | — | P | PARTIAL | Says "preserve current menu actions". The one-item ⋯ menu (L2-034) is left undecided (T6-23). AI hidden (SC-21) |
| F-IN-06 | Loading skeleton | ✅ | 1560 | PDB:702 INS-D03; PM M07-6; P22 §error levels | Y | loading, failed load + Retry | Y | COVERED |  |
| F-IN-07 | "Template applied!" banner | ✅ | 1561 | PM M07-7 | P | success, dismiss/expiry | P | PARTIAL | The "Set Brand Colors" action and the Connect-to-tokens follow-up are not named (T6-22). Raw `text-white` is not addressed |
| F-IN-08 | Error boundary | ✅ | 1562 | PM M07-8 Fix; PDB:702; P22 §4 levels | Y | render error vs save error, Retry | Y | COVERED |  |
| F-IN-09 | AI-run takeover | ✅ | 1563 | SC-21; PM M07-9; II-03 | — | — | — | DEFERRED-BY-DECISION | SC-21 hides all AI |
| F-IN-10 | Whole-site takeover | ❌ | 1564 | PM M07-10 | — | — | — | REMOVED-N/A |  |
| F-IN-11 | Theme-toggle inspector | ✅ 🆕 | 1565 | PDB:699; PM M07-11; BIC B69-theme-toggle | Y | Off/Auto, hidden-on-publish | Y | COVERED | PM still routes to "Brand → Colour mode", but P09 renames that page Tools › Dark mode (consistency note) |
| F-IN-12 | Read-only status line | ✅ 🆕 | 1566 | PM M07-12; PDB:700; SC-14 copy | Y | locked, conflict, role denied | Y | COVERED |  |
| F-IN-13 | Section display modes | ✅ 🆕 | 1567 | PM M07-13; PDB:746 | Y | open, closed+summary, empty "Name +" | P | COVERED | Section-header and empty-row heights are not given (T6-10) |
| F-IN-14 | Per-section error band | ✅ 🆕 | 1568 | PM M07-14; IC-02; PDB:721 | Y | invalid draft, retained input | Y | COVERED |  |
| F-IN-15 | Scroll memory | ✅ | 1569 | PM M07-15; PDB:693 | Y | per object/tab | Y | COVERED |  |
| F-IN-16 | SR selection announcement | ✅ | 1570 | PM M07-16; PDB:752 INS-D08 | Y | single, N selected, locked count | Y | COVERED |  |
| F-IN-17 | "N of M sections apply" footer | ❌ | 1571 | PM M07-17 | — | — | — | REMOVED-N/A |  |
| F-IN-18 | density=fewer mode | ❌ | 1572 | PM M07-18 Defer; PDB:687 | — | — | — | REMOVED-N/A |  |
| F-IN-19 | "More settings" disclosure | 🐞 | 1573 | PM M07-19 Fix; PDB:561 INS-18; B1A:26 B01-04 | Y | active-value count, auto-reveal target | Y | CONFLICT | PM keeps the label "More settings". B1A renames it "Advanced typography · 9 / Less typography". UX-05 auto-open is addressed by INS-18 |
| F-IN-20 | ⌘K Jump to property | ✅ 🆕 | 1574 | PM M07-20; P18 §Properties row:160; PDB:756 | Y | unavailable reason | Y | COVERED |  |
| F-IN-21 | Hide inspector | ✅ 🆕 | 1575 | PM M07-21; PDB:737 | Y | hidden, overlay | Y | COVERED | ⌘\ is missing from the SC-12 shortcut table |
| F-IN-22 | Breadcrumb path | ✅ 🆕 | 1581 | PM M07-22; P06 D1 compact "… › parent › element" | Y | overflow menu, multi "· N elements" | Y | COVERED |  |
| F-IN-23 | Editable element name | ✅ 🆕 | 1582 | PM M07-23; PDB:711 | Y | empty→type label, invalid draft | Y | COVERED |  |
| F-IN-24 | ✦ AI chip | ✅ | 1583 | SC-21; SC-3 "Ask AI" inactive | — | — | — | DEFERRED-BY-DECISION |  |
| F-IN-25 | Crosshair pick | ❌ | 1584 | PM M07-25 | — | — | — | REMOVED-N/A |  |
| F-IN-26 | Select parent button | ❌ | 1585 | PM M07-26 | — | — | — | REMOVED-N/A |  |
| F-IN-27 | Header bind popover | ❌ | 1586 | PM M07-27; P06 A10 | — | — | — | REMOVED-N/A | Replaced by per-row bind icon (P06 A1) |
| F-IN-28 | Status marks row | ✅ 🆕 | 1587 | PM M07-28; P06 A5/B1 "🗄 N bindings" | Y | component, bound, missing source, locked | Y | COVERED | Hidden during multi-select is not restated |
| F-IN-29 | ⋯ Element actions menu | ✅ | 1588 | SC-3 table; P06 C7; PM M07-29 | P | disabled reasons | Y | PARTIAL | The SC-3 registry has no rows for "Apply style to all…" or "Reset style", yet INV, M07-29 and B1A H31–H32 all keep them (T6-6) |
| F-IN-30 | Apply style confirm | ✅ 🆕 | 1589 | PDB:719 INS-D04 Bulk; PM M07-30; PDB:560 INS-17 | Y | eligible/skipped count, no-op "No authored styles at this scope" | Y | COVERED |  |
| F-IN-31 | Inspector delete modal | ❌ | 1590 | SC-3 (no confirm, Undo); PM M07-31 | — | — | — | REMOVED-N/A |  |
| F-IN-32 | Context row placement | ✅ 🆕 | 1596 | PM M07-32; IA-06 PDB:832; PDB:745 | Y | Desktop shown, state, instance, "All breakpoints" | Y | COVERED |  |
| F-IN-33 | Scope pill This/All/Whole site | ❌ | 1597 | PM M07-33 | — | — | — | REMOVED-N/A |  |
| F-IN-34 | State chip | ✅ | 1598 | PM M07-34; IA-06 PDB:834–836 | Y | non-Base, unknown saved state read-only | Y | COVERED | Pressed/visited/checked are not added (INV gap, kept out) |
| F-IN-35 | State override line | ✅ 🆕 | 1599 | PM M07-35 Merge | Y | — | P | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-36 | Breakpoint picker in inspector | ❌ | 1600 | IA-06 PDB:834; SC-13; P05 §5 | — | — | — | REMOVED-N/A | Decided canvas-owned with a read-only mirror. UX-06 is answered by the P05 toolbar |
| F-IN-37 | Breakpoint revert line | ✅ 🆕 | 1601 | PM M07-37 | Y | fallback explained | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-38 | Field override dot | ✅ 🆕 | 1602 | PM M07-38; IC-03; SC-13 00:263 | Y | local, inherited, token, class, component, pseudo | Y | CONFLICT | SC-13 says "Reset to {parent breakpoint}". IC-03/INS-D04 say "Remove Mobile override" with the fallback resolved (T6-4) |
| F-IN-39 | Override info repeated | 🐞 | 1603 | PM M07-39 Merge; PDB:561 INS-18; SC-13 | Y | — | P | CONFLICT | SC-13 re-specifies dot + label + section count + note: the UX-14 structure again (T6-5) |
| F-IN-40 | "Editing :hover" banner | ❌ | 1604 | PM M07-40 | — | — | — | REMOVED-N/A |  |
| F-IN-41 | Detach pill in context row | ❌ | 1605 | PM M07-41 | — | — | — | REMOVED-N/A |  |
| F-IN-42 | Effective values in fields | 🐞 | 1606 | PM M07-42 Fix; II-01; IC-03; PDB:544 INS-01; T-INS-01 | Y | resolved, authored, "source unavailable" | Y | COVERED |  |
| F-IN-43 | Multi header | ✅ 🆕 | 1612 | PM M07-43; P06 A8/D1; SC-17 | Y | N selected, eligible/locked | Y | COVERED |  |
| F-IN-44 | Align/Distribute/Group bar | ✅ | 1613 | PDB:771–775 INS-D12; PM M07-44 | Y | disabled reasons, no-op, overlap warning | Y | COVERED | Glyph/icon treatment is unspecified |
| F-IN-45 | Intersection + "Mixed" | ✅ 🆕 | 1614 | PM M07-45; PDB:696; SC-17; IC-02/04 | Y | mixed, indeterminate, skipped | Y | COVERED | Mixed visual unspecified (T6-26) |
| F-IN-46 | 5-row batch panel | ❌ | 1615 | PM M07-46 | — | — | — | REMOVED-N/A |  |
| F-IN-47 | Capability table | ✅ 🆕 | 1623 | PM M07-47 Redesign; PDB:678,705 | Y | disabled reason, empty tab | Y | COVERED |  |
| F-IN-48a | Text types | ✅ | 1624 | PM M07-48a; PDB:677–678 | Y | (per IC-04) | Y | COVERED |  |
| F-IN-48b | Button | ✅ | 1625 | PM M07-48b | Y | unset vs false | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-48c | Form fields | ✅ | 1626 | PM M07-48c; PDB:723 INS-D05; BIC | Y | mixed, validation | Y | COVERED |  |
| F-IN-48d | Media types | ✅ | 1627 | PM M07-48d; P06 B3/B6 | Y | loading, missing, invalid URL | Y | COVERED |  |
| F-IN-48e | Spacer/divider | ✅ | 1628 | PM M07-48e | Y | — | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-48f | Widgets | ✅ | 1629 | PM M07-48f | Y | — | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-48g | Layout primitives | ✅ | 1630 | PM M07-48g; PDB:727 | Y | — | Y | COVERED |  |
| F-IN-48h | Containers | ✅ | 1631 | PM M07-48h; BIC B69-* (navbar, tabs, gallery…) | P | — | P | COVERED | Navbar/tabs/gallery get per-block BIC records; commerce is deferred (PDB:789) |
| F-IN-48i | Structural child | ✅ 🆕 | 1632 | PM M07-48i | Y | — | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-48j | form/slider/collection-list | ✅ 🆕 | 1633 | PM M07-48j; DYN §11 | Y | — | Y | COVERED |  |
| F-IN-48k | Component instance root | ✅ 🆕 | 1634 | PM M07-48k; PDB:697,729 | Y | override count | Y | COVERED |  |
| F-IN-49 | Component row | 🟡 | 1640 | PDB:676 INS-D01 header identity subview; PM M07-49; P13 §9 | Y | read-only refusal | Y | CONFLICT | INS-D01 puts it in the header. P13 §9 keeps "Inspector ComponentRow". Labels drift: Edit master / Edit definition / Edit main component (T6-7). Confirms vs SC-15 (T6-28) |
| F-IN-50 | Type block frame | ✅ 🆕 | 1641 | PM M07-50 Redesign (split by owner) | Y | — | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-51 | Heading block | ✅ 🆕 | 1642 | PDB:678; PM M07-51; B1A B01-01, H07–H09 | Y | Custom, unresolved token | Y | CONFLICT | "Font-size token" (PDB) vs "Size preset" (B1A). Level is in Content (PDB) vs Heading in Style (B1A) (T6-1, T6-2) |
| F-IN-52 | Text/Paragraph/Link/Label block | ✅ 🆕 | 1643 | PM M07-52 | Y | — | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] B1A keeps "Text style" for non-heading callers; PDB renames all (T6-2) |
| F-IN-53 | Button block | ✅ | 1644 | PM M07-53 | Y | unset/false | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-54 | Input/Textarea/Select/Upload | ✅ | 1645 | PM M07-54; PDB:723; INS-06 | Y | name warning, options structure | Y | COVERED |  |
| F-IN-55 | Checkbox/Radio/Switch | 🐞 | 1646 | PM M07-55; PDB:723 "Submission value" | Y | empty vs removed | Y | COVERED | Radio/checkbox value gap is closed by the spec |
| F-IN-56 | Image block | ✅ | 1647 | PM M07-56; P06 B6 "Replace…"; PDB:694 | Y | decorative empty alt, custom fit | Y | COVERED |  |
| F-IN-57 | Video block | ✅ | 1648 | PM M07-57; P06 B3 | Y | autoplay warning | Y | COVERED | Poster stays a URL field with no picker (INV note); only a bind icon is added |
| F-IN-58 | Audio block | ✅ 🆕 | 1649 | PM M07-58 | Y | — | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-59 | SVG block | ✅ | 1650 | PM M07-59 Fix | Y | conversion disclosure | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-60 | Icon block | ✅ | 1651 | PM M07-60; PDB:559 INS-16 | Y | custom saved values | Y | COVERED |  |
| F-IN-61 | Video embed | ✅ 🆕 | 1652 | PM M07-61 | Y | invalid draft keeps last valid | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-62 | Map/Lottie | ✅ 🆕 | 1653 | PM M07-62 | Y | invalid/missing/loading | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-63 | Countdown | 🟡 | 1654 | PM M07-63; PDB:558 INS-15 | Y | invalid date error | Y | COVERED | Still a typed date with no picker |
| F-IN-64 | Progress | ✅ 🆕 | 1655 | PM M07-64; PDB:767 INS-D11 | Y | batch reject, legacy corrupt | Y | COVERED |  |
| F-IN-65 | Accordion | 🟡 | 1656 | PM M07-65 | Y | — | P | PARTIAL | [audit 10-18: register-only home → PARTIAL] Item CRUD is routed to the hierarchy commands, not added to the Inspector |
| F-IN-66 | Flex/Stack block | ✅ 🆕 | 1657 | PM M07-66 | Y | — | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-67 | Grid/Columns block | ✅ | 1658 | PM M07-67; PDB:727; INS-07 | Y | reduce-populated choice | Y | COVERED | Its confirm conflicts with SC-15 (T6-28) |
| F-IN-68 | Product type block | ⏳ | 1659 | PM M07-68 Defer; PDB:687 | — | — | — | DEFERRED-BY-DECISION |  |
| F-IN-69 | Display + flex | ✅ | 1665 | PM M07-69 | Y | display-change impact | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-70 | Grid controls | ✅ | 1666 | PM M07-70 | Y | — | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-71 | Position | ✅ | 1667 | PM M07-71; IC-02 | Y | — | Y | COVERED |  |
| F-IN-72 | Overflow/Visibility/Float | ✅ | 1668 | PM M07-72 | Y | — | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] Says "readable labels", which addresses the jargon buttons |
| F-IN-73 | Standalone Flex/Grid/Radius | ❌ | 1669 | PM M07-73 | — | — | — | REMOVED-N/A |  |
| F-IN-74 | Typography | ✅ | 1670 | PM M07-74; B1A H10–H26 | Y | — | Y | COVERED | The only section with a written field order |
| F-IN-75 | Text inside | ✅ 🆕 | 1671 | PM M07-75 | Y | closed summary | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-76 | Font picker | ✅ | 1672 | PM M07-76; II-04; PDB:717,754 | Y | no matches, empty, failed load, missing ref | Y | COVERED |  |
| F-IN-77 | Width/Height | ✅ | 1673 | PM M07-77; P06 C9 | Y | live during gesture | Y | COVERED |  |
| F-IN-78 | Spacing-token chain | ✅ | 1674 | PM M07-78; IC-11 | Y | bound, unlinked | Y | COVERED |  |
| F-IN-79 | Min/Max | ✅ | 1675 | PM M07-79 | Y | unset vs none | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-80 | Flex/grid item | ✅ 🆕 | 1676 | PM M07-80 | Y | — | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-81 | Inline disabled reason | 🟡 | 1677 | PM M07-81 Fix | Y | disabled+reason | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-82 | Spacing box | ✅ | 1678 | PM M07-82; DESIGN.md:130 | Y | token-bound, unset vs 0 | Y | COVERED | The 16px value-target exception is not reconciled with INS-D07's 32px controls (T6-27) |
| F-IN-83 | Pair rows / Gap rows | ❌ | 1679 | PM M07-83 | — | — | — | REMOVED-N/A |  |
| F-IN-84 | Fill › Colour | ✅ | 1680 | PM M07-84 | Y | none vs inherited | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-85 | Fill › Gradient | 🟡 | 1681 | PM M07-85 | Y | Custom for multi-stop | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] No multi-stop editor (gap kept) |
| F-IN-86 | Fill › Image | ✅ | 1682 | PM M07-86; II-05; P06 B6/C8/C10 | Y | load failure | Y | COVERED |  |
| F-IN-87 | Border | ✅ | 1683 | PM M07-87 | Y | — | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-88 | Colour row | ✅ | 1689 | PM M07-88; II-06; PDB:716 | Y | bound, unresolved, mixed, invalid | Y | COVERED |  |
| F-IN-89 | Colour popover | ✅ 🆕 | 1690 | PM M07-89; II-06 | Y | Light/Dark edit target, "Follows Light" | Y | COVERED | No eyedropper or recents (grep: 0 hits) |
| F-IN-90 | Number + unit | ✅ | 1691 | PM M07-90; IC-02; PDB:766 INS-D11; B1A:84 | Y | invalid, custom expr, conversion disabled | Y | CONFLICT | Unit change: B1A says "preserve number, no conversion". INS-D11 says convert to keep the computed size (T6-3). Scrub is not specified |
| F-IN-91 | Live writes | ✅ | 1692 | PM M07-91; PDB:721; P24 UN-03 | Y | draft, flush | Y | COVERED |  |
| F-IN-92 | Read-only + lock gate | ✅ | 1693 | PM M07-92; IC-13; PDB:548 INS-05; SC-14 | Y | locked, conflict | Y | COVERED |  |
| F-IN-93 | Opacity | ✅ 🆕 | 1699 | PM M07-93 | Y | unset vs 100% | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-94 | Shadow | ✅ | 1700 | PM M07-94; IC-09 | Y | custom layers | Y | COVERED | No visual x/y/blur editor (gap kept) |
| F-IN-95 | Filters | ✅ | 1701 | PM M07-95 | Y | custom functions | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-96 | Transform & motion | ✅ | 1702 | PM M07-96; PDB:551 INS-08 | Y | custom value | Y | COVERED |  |
| F-IN-97 | Advanced effects | ✅ | 1703 | PM M07-97 | Y | — | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-98 | Link | ✅ | 1709 | PM M07-98; P06 B2 | Y | validation, D4 disabled | Y | COVERED | Anchor section picker not addressed |
| F-IN-99 | CMS binding | ✅ 🆕 | 1710 | P06 A1 (overrides PM M07-99); DYN §8 | Y | missing source, no collections, failure | Y | COVERED | "Disconnect" renamed "Unbind" |
| F-IN-100 | CMS-conditional visibility | ⏳ | 1711 | P06 A2 → Content › Conditions; DYN §12 | Y | legacy "Not active" | Y | COVERED | New BD-20 scope; not built |
| F-IN-101 | Visibility | ✅ | 1712 | PM M07-101; P06 B4; P04 markers | Y | indeterminate multi | Y | COVERED |  |
| F-IN-102 | Interactions | 🟡 | 1713 | P19 §4.1; PM M07-102 | Y | missing target, conflict | Y | COVERED | No actions beyond animate (OD-I3 "later") |
| F-IN-103 | Element CSS animation | ✅ | 1714 | P19; PDB:735; II-07 | Y | "Plays when rendered" | Y | COVERED |  |
| F-IN-104 | CSS classes | ✅ | 1715 | PM M07-104 (→ Style first group) | Y | — | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-105 | Attributes | ✅ | 1716 | PM M07-105 | Y | duplicate ID | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-106 | data-*/aria-* | 🟡 | 1717 | PM M07-106; PDB:552 INS-09 | Y | empty vs removed, reserved | Y | COVERED |  |
| F-IN-107 | Form › Fields | 🟡 | 1718 | PM M07-107; PDB:723–725 | Y | conversion impact | Y | COVERED | Its confirm conflicts with SC-15 (T6-28) |
| F-IN-108 | Form › After submit | 🟡 | 1719 | PM M07-108; PDB:679 | P | admin gate | P | PARTIAL | No Redirect page picker (L3-028); forms still cannot be named (T6-24) |
| F-IN-109 | Slider › Slides | ✅ 🆕 | 1720 | PM M07-109 (→ Content) | Y | — | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-110 | Slider › Playback | ✅ 🆕 | 1721 | PM M07-110 | Y | invalid interval | Y | PARTIAL | [audit 10-18: register-only home → PARTIAL] |
| F-IN-111 | Collection list | ✅ 🆕 | 1722 | PM M07-111; DYN §11 | Y | empty block | Y | COVERED |  |
| F-IN-112 | All CSS | ❌ | 1723 | PM M07-112 Defer | — | — | — | REMOVED-N/A |  |
| F-BR-01 | Rail Brand (B) | ✅ 🆕 | 1760 | P09 BR-01, §11; P02 | Y | viewer disabled | Y | COVERED | inert + `data-bk-surface` added |
| F-BR-02 | Other ways in | ✅ 🆕 | 1761 | P09 §9 "Edit token ›"; P18; P12 RT-15 | P | — | P | PARTIAL | The theme-toggle door and the template "Connect to tokens" toast are not respecified (T6-22) |
| F-BR-03 | Nav column | ✅ 🆕 | 1762 | P09 §4, §4.1 | Y | counts on Colours/Checks | Y | COVERED | Grouped Tokens / Reusable styles / Tools |
| F-BR-04 | Leave Brand | ✅ 🆕 | 1763 | P09 §11; SC-1, SC-2 | Y | — | Y | COVERED | Change: Esc no longer leaves |
| F-BR-05 | Page header | ✅ 🆕 | 1764 | P09 §5; SC-10 | Y | Undo/Redo disabled with reason | Y | COVERED | 56 minimum |
| F-BR-06 | Autosave + one undo | ✅ 🆕 | 1765 | P09 §9; IA-02 PDB:794–804; SC-4 | Y | applied locally / saved | Y | COVERED |  |
| F-BR-07 | Review changes | ✅ 🆕 | 1766 | P09 §5; SC-15 | P | — | Y | COVERED | Empty/stale states are kept by reference only |
| F-BR-08 | Read-only banner | 🚩 | 1767 | P09 §10 | Y | switch_off, held, failed | Y | COVERED |  |
| F-BR-09 | "No brand set." card | ✅ 🆕 | 1768 | P09 §10 | Y | first run | Y | PARTIAL | The L4-029 reword decision is left open (T6-19) |
| F-BR-10 | Live preview column | ✅ 🆕 | 1769 | P09 §8 | Y | preview source lock, collapse <1280 | Y | CONFLICT | P09 fixes it at 360–520 (default 468). MS:537 IAF-10 F says "preview flex" (T6-12) |
| F-BR-11 | Light/Dark preview switch | ✅ 🆕 | 1770 | P09 §8 | Y | disabled (Off / previewing) | Y | COVERED |  |
| F-BR-12 | Beginner/Pro toggle | ❌ | 1771 | P09 §12 "Keep (Pro)"; CP M08-12 Defer | — | — | — | REMOVED-N/A | Inspector users stay stuck in Beginner mode, and this is unaddressed (T6-15) |
| F-BR-13 | Drawer-era frame | ❌ | 1772 | — | — | — | — | REMOVED-N/A |  |
| F-BR-14 | Focus isolation | 🐞 | 1773 | P09 §11 | Y | inert | Y | COVERED |  |
| F-BR-15 | Colours table | ✅ 🆕 | 1779 | P09 §4 sketch, §6 | P | usage unknown | Y | PARTIAL | The sketch drops the DARK column. UX-18 palette presentation is not decided (T6-16) |
| F-BR-16 | Table keyboard | ✅ 🆕 | 1780 | P09 §11 | Y | — | Y | COVERED |  |
| F-BR-17 | Used by highlight | ✅ 🆕 | 1781 | P09 BR-10, §6, §8 | Y | "Can't count right now" | Y | COVERED | Large-reach note >20 is new |
| F-BR-18 | + Add token | 🐞 | 1782 | P09 §9 copy fix | Y | — | Y | COVERED |  |
| F-BR-19 | Token card | ✅ 🆕 | 1783 | P09 §6 | Y | dark via alias | Y | COVERED |  |
| F-BR-20 | "About drafts" hint | 🐞 🆕 | 1784 | P09 §9 | Y | — | — | COVERED |  |
| F-BR-21 | Colour picker | ✅ 🆕 | 1785 | P09 §6; II-06 | Y | invalid draft | Y | COVERED |  |
| F-BR-22 | Rename token | ✅ 🆕 | 1786 | P09 §6 | P | disabled reason | P | COVERED |  |
| F-BR-23 | Delete token | ✅ 🆕 | 1787 | P09 §6 | Y | usage unknown + Retry | Y | COVERED |  |
| F-BR-24 | Reset to default | ✅ 🆕 | 1788 | P09 §6 | P | — | P | COVERED |  |
| F-BR-25 | Duplicate token | ⏳ | 1789 | CP M08-25 Defer | — | — | — | DEFERRED-BY-DECISION |  |
| F-BR-26 | Colours action row | ✅ 🆕 | 1790 | P09 §4 sketch, §4.1 | Y | — | Y | COVERED | Connect moves to Checks; From logo moves to Starters |
| F-BR-27 | Scale generator | ✅ 🆕 | 1791 | P09 §4.1, §8, BR-10 | P | preview lock | Y | COVERED |  |
| F-BR-28 | Drawer colour list | ❌ | 1792 | — | — | — | — | REMOVED-N/A | INV asks whether groups/search come back; no doc decides (T6-16) |
| F-BR-29 | Add/Replace token modals | ❌ | 1793 | CP M08-29 | — | — | — | REMOVED-N/A |  |
| F-BR-30 | Dark mode card | ✅ 🆕 | 1799 | P09 §7 Dark mode | Y | impact card, restore point | Y | COVERED |  |
| F-BR-31 | Per-token dark values | ✅ 🆕 | 1800 | P09 §4.1, §6, §7 | Y | "No dark value" | Y | COVERED | One write op from both surfaces |
| F-BR-32 | Theme-toggle block | ✅ 🆕 | 1801 | CP M08-32; BIC B69-theme-toggle; PM M07-11 | Y | Off hidden on publish | Y | COVERED |  |
| F-BR-33 | Fonts & type styles | ✅ 🆕 | 1807 | P09 §4.1, §6 | P | — | P | COVERED | Where type styles live is ambiguous (T6-17) |
| F-BR-34 | Font popover | ✅ 🆕 | 1808 | P09 §6 | P | — | P | COVERED |  |
| F-BR-35 | + Add a font | ✅ 🆕 | 1809 | P09 §4.1 → Assets › Fonts; P08 §7 | Y | — | Y | COVERED | Renamed "Manage site fonts ›" |
| F-BR-36 | Styles page | ✅ 🆕 | 1810 | P09 §4.1 Reusable styles | P | read-only label | — | COVERED |  |
| F-BR-37 | Drawer type-scale editor | ❌ | 1811 | — | — | — | — | REMOVED-N/A |  |
| F-BR-38 | Spacing page | ✅ 🆕 | 1812 | P09 §6 | Y | — | P | COVERED |  |
| F-BR-39 | Other 11 kinds | 🟡 | 1813 | P09 §4.1 Other kinds, §6 | Y | — | P | COVERED |  |
| F-BR-40 | Drawer generic rows | ❌ | 1814 | — | — | — | — | REMOVED-N/A |  |
| F-BR-41 | Component styles | 🟡 | 1820 | P09 §4.1 → "Browse section blocks in Add ›" | Y | — | Y | COVERED |  |
| F-BR-42 | ✦ Generate with AI | 🚩 | 1821 | SC-21; P09 §5, §7 | — | — | — | DEFERRED-BY-DECISION | CP M08-42 still reads "Keep" (T6-18) |
| F-BR-43 | Classes | ✅ 🆕 | 1822 | P09 §4.1; MS:543 H | P | no selection | P | PARTIAL | The page's controls and states are not specified in P09 |
| F-BR-44 | Presets | 🟡 | 1823 | P09 §4.1 "Read-only catalogue" | P | — | N | PARTIAL | The inert binding-row affordance is not addressed (T6-20) |
| F-BR-45 | Brand checks list | ✅ 🆕 | 1829 | P09 §7 Checks | P | — | P | PARTIAL | Open action, "Nothing to fix" and error-first ordering are not restated (T6-13) |
| F-BR-46 | Rules | ✅ | 1830 | P09 §7 (implicit) | N | — | — | PARTIAL | No rule list in any doc (grep "Banned hue" / "Pure black" = 0) |
| F-BR-47 | Run checks | ✅ 🆕 | 1831 | P09 §7 | Y | — | Y | COVERED |  |
| F-BR-48 | Ignore (suppress) | ✅ | 1832 | CP M08-48 only | N | — | N | PARTIAL | Not in P09 (T6-13) |
| F-BR-49 | Connect to tokens | ✅ 🆕 | 1833 | P09 §4.1, §7, §8 | Y | preview lock | Y | COVERED | Restore point not decided (T6-21) |
| F-BR-50 | Templates bind literal colours | 🐞 | 1834 | P15 §4.1 Brand line; CP M08-50 Fix | P | — | P | PARTIAL | Only the copy is made honest; the Brand value gap stays open (T6-22) |
| F-BR-51 | Starters | 🐞 | 1840 | P09 §7 Starters | Y | preview, offline restore-point notice | Y | PARTIAL | Real-brand names and indigo/violet primaries are not addressed (T6-14) |
| F-BR-52 | Brand from logo/URL | 🚩 | 1841 | SC-21; P09 §7 | — | — | — | DEFERRED-BY-DECISION | Flagged PLANNED; hidden this version |
| F-BR-53 | Restore points | ✅ 🆕 | 1842 | P09 §5, §7, §10; SC-15 | Y | empty, unavailable | Y | COVERED | SC-11 definition is narrower (T6-21) |
| F-BR-54 | Theme push / Recapture | ⏳ | 1843 | CP M08-54 Defer | — | — | — | DEFERRED-BY-DECISION | Dashboard scope |
| F-BR-55 | Starter grid / pill | ❌ | 1844 | CP M08-55 | — | — | — | REMOVED-N/A |  |
| F-BR-56 | Import/export panel | ✅ | 1850 | P09 §5, §7; MS:543 | Y | — | Y | COVERED | Gains the header |
| F-BR-57 | Figma Variables row | ❌ | 1851 | — | — | — | — | REMOVED-N/A |  |
| F-BR-58 | Import | 🟡 | 1852 | P09 §7 Import | Y | detected/valid/errors/conflicts, dry-run | Y | COVERED | "Tailwind config (AST)" detection label not addressed |
| F-BR-59 | Legacy Export dropdown | ❌ | 1853 | — | — | — | — | REMOVED-N/A |  |
| F-BR-60 | Migration modal | ✅ | 1854 | P09 BR-13, §12 Keep; CP M08-60 | P | — | P | PARTIAL | Kept by reference; Restore snapshot/Retry not restated |
| F-BR-61 | Server token boundary | 🚩 | 1855 | P09 §10; root CLAUDE env | Y | held ≠ denied | Y | COVERED |  |
| F-BR-62 | Lint aggregate banner | ❌ | 1856 | — | — | — | — | REMOVED-N/A |  |
| F-BR-63 | Canvas token application | ✅ | 1862 | P09 §1, T-BR-02 | Y | — | Y | COVERED |  |
| F-BR-64 | Checks feed Issues | ✅ | 1863 | P12 RT-15; CP M08-64 | Y | — | Y | COVERED |  |
| F-BR-65 | Onboarding "Set your brand" | ✅ | 1864 | P16 step 3 | Y | role gate | Y | COVERED |  |

## Engine rules, gap register, open bugs

INV §9 lines 1970–2275 · 195 rows · gaps: `_extraction/T7-design-system-engine.md` §Contradictions & gaps

| FID | Feature | INV | INV line | Design home | Controls | States specified | Interaction | Coverage | Gap / note |
|---|---|---|---|---|---|---|---|---|---|
| F-EN-A1.1 | Element type registry (55) | ✅🆕 | 1976 | SC-11 "69 types" (00:206); PDB BIC-01 "69 registered blocks" (PDB:221); Add "54 rows" (03:31) | — | — | — | CONFLICT | Docs say 69, Add says 54, code says 55 |
| F-EN-A1.2 | Types refined on load/paste | ✅🆕 | 1977 | none (grep refine / refineElementTypes / "real type") | — | — | — | OMITTED | Layers/Inspector may show a type different from stored — no doc says so |
| F-EN-A1.3 | Types that cannot have children | ✅ | 1978 | generic refusal "Can't go inside Heading — will add after it" (03:171) | — | — | — | PARTIAL | per-type list and video-accepts-children not reflected |
| F-EN-A1.4 | Restricted parents (gallery, product-grid) | ✅ | 1979 | 03:171 generic; 04:33 "invalid nesting (named error)" | — | — | — | PARTIAL | no copy for restricted-parent case |
| F-EN-A1.5 | HTML5 forbidden pairs | 🟡 | 1980 | 04:33; 03:171 | — | — | — | PARTIAL | error copy per pair not specified |
| F-EN-A1.6 | Drop depth limit 50 | ✅ | 1981 | none (grep nesting depth / Max depth / MAX_NESTING: only FDDYN D11 CMS reference) | — | — | — | OMITTED | overlay copy "Max depth reached" not designed |
| F-EN-A1.7 | Tree-audit depth messages | ❌ | 1982 | — | — | — | — | REMOVED-N/A |  |
| F-EN-A1.8 | Lock gate | ✅🆕 | 1983 | SC-14 (00:269-271); 04 LY-14 | — | — | — | COVERED (engine rule) |  |
| F-EN-A1.9 | Multi-delete confirmation | ✅🆕 | 1984 | SC-3 "Delete of one or many … never asks for confirmation" (00:65) | — | — | — | COVERED (engine rule) | Contradicts INV "Decision #17. Needs a confirm design" → T7-21 |
| F-EN-A1.10 | Page root protections | ✅ | 1985 | Esc at root (05:102,107); "Page root" noun (00:226); root move refused (04:33) | — | — | — | PARTIAL | not-deletable / excluded from ⌘A / arrow refusal not stated |
| F-EN-A2.1 | Undo depth 100 | ✅ | 1991 | 24:186, 24:310 (OD-U6) | — | — | — | COVERED (engine rule) |  |
| F-EN-A2.2 | Coalesce 500 ms | ✅ | 1992 | 24:46 UN-03; 24:87 | — | — | — | COVERED (engine rule) |  |
| F-EN-A2.3 | Checkpoint every 10 patches | ✅ | 1993 | 24:175 (checkpoint rows → dividers) | — | — | — | PARTIAL | interval not user-facing; label handled |
| F-EN-A2.4 | Undo/redo/restore autosaved | ✅ | 1994 | 24 UN-13 safety version (24:56) | — | — | — | PARTIAL | no doc states undo triggers a save / status |
| F-EN-A2.5 | Unrecorded change toast | ✅ | 1995 | 24:51, 24:167 | — | — | — | COVERED (engine rule) |  |
| F-EN-A2.6 | Spurious undo step on load | ✅🆕 | 1996 | none | — | — | — | OMITTED | fixed; low design need |
| F-EN-A2.7 | Brand ⌘Z ignores read-only/full-page (bug) | 🐞 | 1997 | U-1 interim guard (00:128); 00:184; Brand Undo disabled when read-only (09:93) | — | — | — | COVERED (engine rule) |  |
| F-EN-A2.8 | Version cap 50; named never pruned | ✅ | 1998 | History › Saves (12:37) | — | — | — | PARTIAL | cap / pruning not shown to user anywhere |
| F-EN-A2.9 | Time-Travel scrubber | ✅ | 1999 | dedicated area (05:128); key ⌃⇧T / Alt+Shift+T (00:248); viewer read-only (00:90) | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.1 | ⌘S save | ✅ | 2007 | 01:205; 11:91 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.2 | ⌘Z undo | ✅ | 2008 | 05:87; SC-17 (00:287) | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.3 | ⌘⇧Z / ⌘Y redo | ✅ | 2009 | 05:87 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.4 | ⌘P preview | ✅ | 2010 | 00:254 (+⌘↵ alias) | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.5 | ⌘K palette | ✅ | 2011 | 00:256; 18 §5.1 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.6 | ⌘⇧P alias | ✅🆕 | 2012 | 00:256 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.7 | ? and ⌘/ sheet | ✅🆕 | 2013 | 00:253; 18 §5.9 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.8 | ⌘J AI | ✅ | 2014 | 00:252 | — | — | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-A3.9 | I AI | ✅ | 2015 | 00:252, 00:340 | — | — | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-A3.10 | ⌘, settings | ✅ | 2016 | 01:93,132 "⌃, / Ctrl+,"; 10:23 "⌃,/⌘," | — | — | — | PARTIAL | ⌃ vs ⌘ ambiguity under SC-12 platform mapping → T7-24 |
| F-EN-A3.11 | ⌘H history | ✅ | 2017 | 00:240 (removed; H only) | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.12 | C comment mode | 🔒 | 2018 | 01:101; OD-R1 agency_layer on for all (00:344) | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.13 | F6 / ⇧F6 | ✅ | 2019 | SC-5 (00:74-76) + ⌃` fallback | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.14 | Esc | ✅ | 2020 | SC-2 (00:19-37); 05:107 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.15 | Panel letter keys | ✅ | 2021 | 00:236; 02:124 | — | — | — | COVERED (engine rule) | P → Pages manager; DESIGN.md:293,417 key lists stale → T7-10 |
| F-EN-A3.16 | ⇧A components | ✅ | 2022 | 02:124; 13:26 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.17 | Delete / Backspace | ✅ | 2023 | 00:45,65 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.18 | ⌘C/⌘X/⌘V | ✅ | 2024 | 00:46 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.19 | ⌘⇧V paste HTML | ✅🆕 | 2025 | 00:249 (Canvas scope); 03:28 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.20 | ⌘D duplicate | ✅ | 2026 | 00:44 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.21 | ⌘G / ⌘⇧G | ✅ | 2027 | 00:49 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.22 | ⌘⌥C / ⌘⌥V | ✅ | 2028 | 00:47 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.23 | Arrange chords | ✅ | 2029 | 00:59, 00:247 (front/back → ⌘⌥]/[) | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.24 | ⌘A select all (root excluded) | ✅ | 2030 | 05:47 (as-is); 04:108 Layers Select all | — | — | — | PARTIAL | root exclusion not stated |
| F-EN-A3.25 | ⌘⇧E exporter | ✅ | 2031 | 01:133 "Export site…" kept | — | — | — | PARTIAL | chord not stated |
| F-EN-A3.26 | ⌘\ toggle inspector | ✅🆕 | 2032 | PDB:594,737 hide/reveal | — | — | — | PARTIAL | chord not stated |
| F-EN-A3.27 | ⌘⇧A AI | ✅ | 2033 | 00:252 | — | — | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-A3.28 | ⌘⇧C component view | ❌ | 2034 | — | — | — | — | REMOVED-N/A |  |
| F-EN-A3.29 | Tab / ⇧Tab cycling (bug BK-28) | 🐞 | 2035 | "Tab cycles elements" (05:47) vs "Tab from selection box enters handles" (05:109); flagged REV:77 | — | — | — | CONFLICT | correct scope of Tab from canvas-column controls not defined |
| F-EN-A3.30 | Arrow / Home / End navigation | ✅ | 2036 | 05:47; 04 tree keys (04:135) | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.31 | ⇧/⌘ + arrow nudge | ✅ | 2037 | 05:39 (positioned only; toast for in-flow) | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.32 | ⌥↑↓ reorder | ✅ | 2038 | 00:58; 05:39 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.33 | ⇧F10 context menu | ✅ | 2039 | context menu kept (05:168) | — | — | — | PARTIAL | ⇧F10 keyboard door not named (grep ⇧F10 / Shift+F10: none) |
| F-EN-A3.34 | Zoom chords | ✅ | 2040 | 00:241-243; 05:92 | — | — | — | COVERED (engine rule) | ⇧0/⇧1/⇧2 |
| F-EN-A3.35 | View toggles chords | ✅ | 2041 | 00:244-246; 05:93 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.36 | / or ⌘F focus Add search | ✅🆕 | 2042 | `/` (00:257; 18 §5.8) | — | — | — | PARTIAL | ⌘F alias silently dropped |
| F-EN-A3.37 | ⌘↵ post comment / run generate | ✅🆕 | 2043 | 17:68 (comment ⌘↵); 00:254 (⌘↵ = Preview alias) | — | — | — | COVERED (engine rule) | double meaning; scope rule (Field vs Global) must resolve → T7-25 |
| F-EN-A3.38 | ⌘K inside media library | ✅🆕 | 2044 | 00:170; 18 §5.8 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.39 | Enter/Esc inline text | ✅ | 2045 | SC-2 step 1 (00:20); 05:107 | — | — | — | COVERED (engine rule) |  |
| F-EN-A3.40 | No device chords | ✅ | 2046 | none | — | — | — | OMITTED | nothing to design; listed for completeness |
| F-EN-A3.41 | Global guard rules | ✅ | 2047 | SC-12 scopes (00:234); 02:124; 18:144 | — | — | — | COVERED (engine rule) |  |
| F-EN-A4.1 | Breakpoint ranges | ✅ | 2053 | SC-13 (00:261) | — | — | — | COVERED (engine rule) |  |
| F-EN-A4.2 | Legacy 991/575 | ❌ | 2054 | — | — | — | — | REMOVED-N/A |  |
| F-EN-A4.3 | Device frames (Wide palette-only) | ✅ | 2055 | 05:90-91; 00:261 | — | — | — | COVERED (engine rule) |  |
| F-EN-A4.4 | Breakpoint switcher hidden (UX-06) | 🐞 | 2056 | visible segments (05:66,93,160) | — | — | — | COVERED (engine rule) |  |
| F-EN-A4.5 | Three Desktop widths | 🟡 | 2057 | SC-8 1440 (00:99); 05:90; 01:115 | — | — | — | COVERED (engine rule) |  |
| F-EN-A4.6 | Emoji device presets | 🟡 | 2058 | sketch "[🖥 ▭ 📱]" device segments (05:66) | — | — | — | PARTIAL | no icon spec; sketch reproduces emoji → T7-14 |
| F-EN-A4.7 | Preview always Desktop (UX-11) | 🐞 | 2059 | SC-8 current breakpoint + width (00:99) | — | — | — | COVERED (engine rule) |  |
| F-EN-A5.1 | Zoom 10–400 + presets | ✅ | 2065 | 05:92 | — | — | — | COVERED (engine rule) |  |
| F-EN-A5.2 | Drag thresholds | ✅ | 2066 | Layers zones 30/40/30 (04:33) | — | — | — | PARTIAL | canvas drop feedback values not stated |
| F-EN-A5.3 | Marquee min 3 px | ✅ | 2067 | "marquee (5px …)" (05:34) | — | — | — | CONFLICT | doc as-is value disagrees with code → T7-26 |
| F-EN-A5.4 | Element size min/max | ✅ | 2068 | none | — | — | — | OMITTED |  |
| F-EN-A5.5 | Canvas max 20000 | ✅ | 2069 | none | — | — | — | OMITTED |  |
| F-EN-A5.6 | Components per project 100 | ✅ | 2070 | 00:117, 00:328 | — | — | — | COVERED (engine rule) |  |
| F-EN-A5.7 | Slug history 100 | ✅ | 2071 | none (redirect offer only, 11:37) | — | — | — | OMITTED |  |
| F-EN-A5.8 | Recents (8/3/12) | 🟡 | 2072 | Templates Recent (15:65); palette Recent ≤5 (18:297) | — | — | — | PARTIAL | Add 8 / icons 12 not stated |
| F-EN-A5.9 | Media upload limits | ✅ | 2073 | 08:34,91-92 | — | — | — | COVERED (engine rule) |  |
| F-EN-A5.10 | Storage quota thresholds | ✅ | 2074 | quota bar (08:40,126); SC-20 quota (08:92) | — | — | — | PARTIAL | 80 % / 95 % warning states not specified |
| F-EN-A5.11 | Plan limits | ✅ | 2075 | SC-18 / SC-20 (00:293, 00:315) | — | — | — | COVERED (engine rule) |  |
| F-EN-A5.12 | AI rate limit | ✅ | 2076 | 00:294 | — | — | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-A5.13 | AI prompt payload | ✅🆕 | 2077 | — | — | — | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-A5.14 | API timeout/retries | ✅ | 2078 | none | — | — | — | OMITTED | not user-facing |
| F-EN-A6.1 | Single sanitizer | ✅ | 2084 | Paste HTML strip report + sanitized insert (03:40); PDB:714 | — | — | — | COVERED (engine rule) |  |
| F-EN-A6.2 | URL schemes | ✅ | 2085 | PDB:714 "accepted URL … follows existing sanitization" | — | — | — | PARTIAL | rejection message not specified |
| F-EN-A6.3 | Session blob: URLs dropped | ✅🆕 | 2086 | FI-03 interim guard (00:135); 08:95 | — | — | — | COVERED (engine rule) |  |
| F-EN-A6.4 | Head-code allowlist | ✅ | 2087 | code-field Esc (00:28); Custom code screen (10) | — | — | — | PARTIAL | stripped-tag feedback not designed |
| F-EN-A6.5 | Plain text purified server-side (bug) | 🐞 | 2088 | none | — | — | — | OMITTED |  |
| F-EN-A6.6 | Form wiring loses attributes (bug) | 🐞 | 2089 | Behaviour › form after-submit (PDB:586; INS-D05 PDB:723) | — | — | — | PARTIAL |  |
| F-EN-A7.1 | Autosave debounce 1 s | ✅ | 2095 | bottom status L4 (22:63) | — | — | — | PARTIAL | timing not user-facing |
| F-EN-A7.2 | Save retry backoff | ✅🆕 | 2096 | Reconnecting / Retry now (22 §5.3, §7) | — | — | — | COVERED (engine rule) |  |
| F-EN-A7.3 | Failure toasts | ✅🟡 | 2097 | 22 §5.4, §7; SC-4 (00:69) | — | — | — | COVERED (engine rule) | persistent ones → banners |
| F-EN-A7.4 | Conflict state | 🟡 | 2098 | 22 §5.4 (720 dialog) | — | — | — | COVERED (engine rule) |  |
| F-EN-A7.5 | Reload recovery | 🟡❌ | 2099 | 22 §7 Recovery offer; 22 §4.2 | — | — | — | COVERED (engine rule) |  |
| F-EN-A7.6 | False exit prompt / "Not saving" | 🐞 | 2100 | exit guard risky variant (22 §5.2) | — | — | — | PARTIAL | false prompt on clean load not addressed |
| F-EN-A8.1 | Brand Light/Dark preview-only | ✅🆕 | 2106 | 09:34, 09:118 | — | — | — | COVERED (engine rule) |  |
| F-EN-A8.2 | Settings plan locks | 🔒🟡 | 2107 | 00:304; 10:29; 23 PL-15 | — | — | — | COVERED (engine rule) |  |
| F-EN-A8.3 | Upgrade modal triggers | 🔒 | 2108 | 23 §4.5 (480); one Pro chip (23:91) | — | — | — | COVERED (engine rule) |  |
| F-EN-B1 | Publish flow (flag) | 🚩 | 2116 | Panel 14 (whole); 16:82 | — | — | — | COVERED (engine rule) | PLANNED |
| F-EN-B2 | Real-time collaboration | 🚩 | 2117 | Panel 21; SC-9 MP-1…MP-12 (00:138-145) | — | — | — | COVERED (engine rule) | blocked by ⛔ MP-3/4/5 |
| F-EN-B3 | DS AI client | 🚩 | 2118 | 00:337 "Brand DS-AI entries" hidden | — | — | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-B4 | Brand "AI component styles" CTA | 🚩⏳ | 2119 | 00:337 | — | — | — | DEFERRED-BY-DECISION | not named individually |
| F-EN-B5 | Brand "From logo or URL" | 🚩 | 2120 | 09:33 (listed under AI) vs 20:26 ("Not AI … never labelled ✦") | — | — | — | CONFLICT | visible in this version or not? → T7-22 |
| F-EN-B6 | Export Vue / Next "Soon" | ⏳ | 2121 | Export dialog kept (01:133) | — | — | — | PARTIAL | "Soon" pills not addressed |
| F-EN-B7 | CMS import Sheets/Airtable | ⏳ | 2122 | 07:25, 07:63 | — | — | — | COVERED (engine rule) | label "Coming soon" vs "Planned" → consistency note |
| F-EN-B8 | CMS source dialog Sheets/Airtable rows | ⏳ | 2123 | 07:63 (collection ⋯ only); D8 live sources "Coming soon" (00:137) | — | — | — | PARTIAL | second surface not named |
| F-EN-B9 | Add-panel "Soon" rows | ⏳ | 2124 | disabled-reason rows (03:171) | — | — | — | PARTIAL | "Soon" tag pattern not specified |
| F-EN-B10 | IntegrationRow "COMING SOON" (unmounted) | ⏳ | 2125 | Integrations → dashboard door (10:29,32) | — | — | — | COVERED (engine rule) | primitive dead (INV:1940) |
| F-EN-B11 | Upload element hidden | ⏳ | 2126 | none (grep upload element / file input / multipart) | — | — | — | OMITTED |  |
| F-EN-B12 | Comment C / Review panel gated | 🔒 | 2127 | OD-R1 (00:344); 01:101; SC-6 | — | — | — | COVERED (engine rule) |  |
| F-EN-B13 | Custom code Pro | 🔒 | 2128 | 00:304; 10 | — | — | — | COVERED (engine rule) |  |
| F-EN-B14 | Password protection Pro | 🔒 | 2129 | 00:304, 00:320; 10:26 | — | — | — | COVERED (engine rule) |  |
| F-EN-B15 | Premium templates | 🔒 | 2130 | 00:353; 15:133 | — | — | — | COVERED (engine rule) |  |
| F-EN-B16 | Settings "Upgrade" | 🔒 | 2131 | SC-18 (00:293); 23 | — | — | — | COVERED (engine rule) |  |
| F-EN-B17 | Viewer disabled doors | 🟡 | 2132 | SC-6 matrix (00:78-91) | — | — | — | COVERED (engine rule) |  |
| F-EN-B18 | Read-only view | ✅ | 2133 | OD-18-2 (00:345); 02 LR-09 | — | — | — | COVERED (engine rule) |  |
| F-EN-B19 | Presence mock users | 🧪 | 2134 | "Demo" label (21:72) | — | — | — | COVERED (engine rule) |  |
| F-EN-B20 | Agentation overlay | 🧪 | 2135 | none | — | — | — | OMITTED | dev-only; no design need |
| F-EN-B21 | Exit-reason instrumentation | 🧪 | 2136 | none | — | — | — | OMITTED | dev-only |
| F-EN-B22 | Dev console warnings | 🧪 | 2137 | none | — | — | — | OMITTED | dev-only; behaviour.tsx gap (missing get/setInteractions) not reflected in Panel 19 |
| F-EN-B23 | Preset binding row inert | ⏳ | 2138 | EVMS:519,565 | — | — | — | PARTIAL | not in any panel |
| F-EN-B24 | Brand Figma export row | ❌ | 2139 | — | — | — | — | REMOVED-N/A |  |
| F-EN-B25 | Media "Trash" row | ❌ | 2140 | Assets Recently deleted 30 d (00:185) | — | — | — | REMOVED-N/A | revived as Recently deleted |
| F-EN-B26 | Brand unmounted pieces | ❌ | 2141 | — | — | — | — | REMOVED-N/A |  |
| F-EN-B27 | Plugins | ❌ | 2142 | — | — | — | — | REMOVED-N/A |  |
| F-EN-B28 | Snap-to-grid command | ❌ | 2143 | grid pane 1–100 kept (05:29,93) | — | — | — | REMOVED-N/A |  |
| F-EN-B29 | Watch device | ❌ | 2144 | — | — | — | — | REMOVED-N/A |  |
| F-EN-B30 | Wide device palette-only | 🟡 | 2145 | Wide 1920 preset in width field (05:91,160) | — | — | — | COVERED (engine rule) |  |
| F-EN-B31 | Hover levels | 🟡 | 2146 | CV-09 hover, Alt parent chain, Alt+Shift box model (05:35) | — | — | — | PARTIAL | no level toggle door |
| F-EN-B32 | Forms submissions inbox | ✅🆕 | 2147 | SC-7 (00:95); 22 §5.11 | — | — | — | COVERED (engine rule) |  |
| F-EN-B33 | Site/Page SEO arc | ⏳ | 2148 | reserved "SEO analysis · Planned" card (10:100) | — | — | — | PARTIAL | "detailed design is a separate task" |
| F-EN-B34 | Review v2 | ⏳ | 2149 | Panel 17; 00:174 | — | — | — | COVERED (engine rule) |  |
| F-EN-B35 | Activity off-rail | ✅🆕 | 2150 | 00:83, 00:90; 12 | — | — | — | COVERED (engine rule) |  |
| F-EN-B36 | CMS off-rail | 🟡 | 2151 | rail CMS → workspace (02:78); BD-05 (PDB:207) | — | — | — | COVERED (engine rule) |  |
| F-EN-B37 | Purple gradients in templates | 🐞 | 2152 | none (grep purple / #667eea / gradient → only Pro chip 23:91) | — | — | — | OMITTED | needs owner call → T7-15 |
| F-EN-B38 | Onboarding progress key global | 🐞 | 2153 | seeding silent (16:86); dismissal per user (16:106) | — | — | — | PARTIAL | per-site progress not stated |
| F-EN-C1.1 | L1-002 export drops own text with child | ✅ fixed | 2165 | none | — | — | — | OMITTED |  |
| F-EN-C1.2 | L2-001 save page as template | ✅ fixed | 2166 | saved templates "Styles captured with it" (15:31,119-121) | — | — | — | PARTIAL |  |
| F-EN-C1.3 | L3-002 insert lands on previous page | ✅ fixed | 2167 | target subtitle + stale-target message (03:195,208) | — | — | — | COVERED (engine rule) |  |
| F-EN-C1.4 | L4-001 media drag wrote src onto section | ✅ fixed | 2168 | picker header names target (08:79) | — | — | — | PARTIAL | drag-to-canvas target not specified |
| F-EN-C2.1 | L1-001 click-insert inside heading | ✅ fixed | 2174 | 03:171 | — | — | — | COVERED (engine rule) |  |
| F-EN-C2.2 | L1-003/L2-007 selection toolbar covers small elements | ✅ fixed | 2175 | 05:37,106 ("buttons unchanged") | — | — | — | PARTIAL | UX-07 crowding not addressed |
| F-EN-C2.3 | L1-004 Tablet resize wrote Desktop | ✅ fixed | 2176 | SC-13 cascade (00:262) | — | — | — | COVERED (engine rule) |  |
| F-EN-C2.4 | L1-007 undo jumped to first page | ✅ fixed | 2177 | "Undo keeps the current page" (24:48) | — | — | — | COVERED (engine rule) |  |
| F-EN-C2.5 | L2-002/L3-001 duplicate slug | ✅ fixed | 2178 | slug-taken on Restore (00:116) | — | — | — | PARTIAL | page-slug collision copy not specified |
| F-EN-C2.6 | L2-003 Layers Delete removed locked | ✅ fixed | 2179 | SC-14 (00:269) | — | — | — | COVERED (engine rule) |  |
| F-EN-C2.7 | L2-004 Layers Delete removed instance child | ✅ fixed | 2180 | 04:34 (as-is Group refusal only) | — | — | — | PARTIAL |  |
| F-EN-C2.8 | L2-005 instance overrides lost | ✅ fixed | 2181 | "retain supported overrides by identity" (PDB:727) | — | — | — | COVERED (engine rule) |  |
| F-EN-C2.9 | L2-006 saved component nested in same instance | ✅ fixed | 2182 | none | — | — | — | OMITTED |  |
| F-EN-C2.10 | L2-008 :hover not shown on canvas | ✅ fixed | 2183 | authored state preserved (12:56; PDB:570) | — | — | — | PARTIAL | canvas display of state not stated |
| F-EN-C2.11 | L2-009 Pro templates on Business | ✅ fixed | 2184 | effective-plan lock (00:353) | — | — | — | COVERED (engine rule) |  |
| F-EN-C2.12 | L2-010 component delete undo | ✅ fixed | 2185 | 00:278; 13:83 | — | — | — | COVERED (engine rule) |  |
| F-EN-C2.13 | L3-015 field-key rename stripped rich text | ✅ fixed | 2186 | none in P (EVMS:377 hit unverified) | — | — | — | OMITTED | UNKNOWN for EVMS |
| F-EN-C2.14 | L3-016 stale bound text | ✅ fixed | 2187 | FDDYN:344,355 | — | — | — | PARTIAL | empty-bound 0 px collapse "design call" unresolved |
| F-EN-C2.15 | L3-024 repeated field names | ✅ fixed | 2188 | none | — | — | — | OMITTED |  |
| F-EN-C2.16 | L3-025 upload element | 🟡 hidden | 2189 | none | — | — | — | OMITTED | = B11 |
| F-EN-C2.17 | L4-002 library drag re-upload | ✅ fixed | 2190 | none | — | — | — | OMITTED |  |
| F-EN-C2.18 | L4-003 replace kept old alt | ✅ fixed | 2191 | local alt override → Inspector (08:15) | — | — | — | PARTIAL |  |
| F-EN-C2.19 | L4-018 token rename bindings | ✅ fixed | 2192 | Rename on card (09:99) | — | — | — | PARTIAL | rename-moves-bindings not stated |
| F-EN-C2.20 | L4-019 delete-and-replace token | ✅ fixed | 2193 | PDB:526 | — | — | — | PARTIAL |  |
| F-EN-C2.21 | L4-020 token usage reset | ✅ fixed | 2194 | "Used by N" (09:99) | — | — | — | PARTIAL | persistence not stated |
| F-EN-C2.22 | L4-021 Light/Dark global | ✅ fixed | 2195 | session toggle (09:118) | — | — | — | COVERED (engine rule) |  |
| F-EN-C2.23 | L4-022 contrast fix direction | ✅ fixed | 2196 | Issues Fix › (12:40) | — | — | — | PARTIAL |  |
| F-EN-C2.24 | L4-033 missing alt error vs warning | ✅ fixed | 2197 | Missing alt = Tip (14:148) | — | — | — | COVERED (engine rule) |  |
| F-EN-C2.25 | L4-034 issue selected invisible element | ✅ fixed | 2198 | jump to element (12:40); "Hidden everywhere" (00:265) | — | — | — | PARTIAL |  |
| F-EN-C2.26 | L5-001 dev AI / Ollama | 🟡 | 2199 | — | — | — | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-C2.27 | L5-002 element AI id only | ✅ fixed | 2200 | — | — | — | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-C2.28 | L5-003 AI edits locked | ✅ fixed | 2201 | — | — | — | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-C2.29 | L5-004 Undo all | ✅ fixed | 2202 | 00:294 "Undo this run's N changes" | — | — | — | DEFERRED-BY-DECISION | SC-21 (spec exists) |
| F-EN-C2.30 | L5-007 Stop still inserted | ✅ fixed | 2203 | — | — | — | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-C2.31 | L5-030 team comments before round | ✅ fixed | 2204 | Client/Team filter (17:160-162) | — | — | — | COVERED (engine rule) |  |
| F-EN-C2.32 | L5-070 failed autosave retry | ✅ fixed | 2205 | 22 §5.3, §7 | — | — | — | COVERED (engine rule) |  |
| F-EN-C2.33 | L5-074 contradictory recovery | ✅ fixed | 2206 | one surface per severity (22 §4.1) | — | — | — | COVERED (engine rule) |  |
| F-EN-C2.34 | L5-075 Restore/Keep didn't save | ✅ fixed | 2207 | 22 §7 recovery offer | — | — | — | COVERED (engine rule) |  |
| F-EN-C2.35 | FG-001 Review v2 | 🐞 open | 2208 | Panel 17 | — | — | — | COVERED (engine rule) |  |
| F-EN-C2.36 | FG-002 two Review designs in Figma | 🐞 open | 2209 | Panel 17 is the single design | — | — | — | COVERED (engine rule) | Figma not updated (out of doc scope) |
| F-EN-C2.37 | FG-007 Page SEO | 🐞 open | 2210 | 11 PG-10 kept; 10:100 reserved card | — | — | — | PARTIAL | readability/keyphrase not designed |
| F-EN-C2.38 | FG-009 Site SEO | 🐞 open | 2211 | 10:100 | — | — | — | PARTIAL |  |
| F-EN-C3.1 | UX-01 empty-page intro clips 1280×720 | ❓ | 2217 | empty canvas (16 §4.1; 05:122) | — | — | — | PARTIAL | no 1280×720 fit rule |
| F-EN-C3.2 | UX-04 page creation stacks modals | ❓ | 2218 | achievement non-modal toast (16:89); silent seeding (16:86) | — | — | — | PARTIAL | "one surface at a time" not stated |
| F-EN-C3.3 | UX-06 breakpoint hidden | 🐞 | 2219 | 05:93,160 | — | — | — | COVERED (engine rule) |  |
| F-EN-C3.4 | UX-09 mobile font override missing in Preview | 🟡 | 2220 | SC-8 (00:99); width parity (05:198) | — | — | — | PARTIAL | content-rule parity not stated |
| F-EN-C3.5 | UX-10 line-height field vs render | 🟡 | 2221 | PDB:707 unitless preserved; Source/reset (PDB:714) | — | — | — | COVERED (engine rule) |  |
| F-EN-C3.6 | UX-12 starter nav at 375 | 🐞 | 2222 | none | — | — | — | OMITTED | template content |
| F-EN-C3.7 | UX-22 full-page Settings not inert | 🐞 | 2223 | "Editor behind inert" (10:117); tray inert (12:87) | — | — | — | COVERED (engine rule) |  |
| F-EN-C4.1 | IA-01 context submenus keyboard | ✅ fixed | 2229 | SC-3 menus (00:39) | — | — | — | PARTIAL | submenu keyboard not restated |
| F-EN-C4.2 | IA-07 full-page not focus isolation | 🐞 | 2230 | 10:117; RIH:87 | — | — | — | COVERED (engine rule) |  |
| F-EN-C4.3 | IA-08 Preview not interaction runtime | 🐞 by design | 2231 | OD-I1 / IXD-3 (00:177; 19 §5.4) | — | — | — | COVERED (engine rule) | ⛔ IXD-3 |
| F-EN-C4.4 | IA-10 effective value + origin | 🟡 | 2232 | INS-D04 Source/reset (PDB:714) | — | — | — | COVERED (engine rule) |  |
| F-EN-C4.5 | IA-14 richness > verified coverage | 🐞 process | 2233 | SC-16 VERIFIED gate (00:283) | — | — | — | PARTIAL | process, not UI |
| F-EN-C5.1 | BK-06 duplicate loses breakpoint/:state styles | 🐞 branch | 2239 | SC-13 cascade (00:262) | — | — | — | PARTIAL | duplicate/paste rule not stated |
| F-EN-C5.2 | BK-05 ⌘Z ignores gates | 🐞 branch | 2240 | U-1 (00:128) | — | — | — | COVERED (engine rule) |  |
| F-EN-C5.3 | BK-11 save claims in-flight edits | 🐞 branch | 2241 | "Never Saved before the server receipt" (22 §5.3); SC-9 receipt | — | — | — | COVERED (engine rule) |  |
| F-EN-C5.4 | BK-40/51 content rule differs canvas/Preview/export | 🐞 branch | 2242 | width parity (05:198) | — | — | — | PARTIAL |  |
| F-EN-C5.5 | Live deploy recorded failed | 🐞 branch | 2243 | Publish outcomes (14 PB-12/13 as-is) | — | — | — | PARTIAL |  |
| F-EN-C5.6 | Server authz by target site | 🐞 branch | 2244 | none in P (BKLG only) | — | — | — | PARTIAL | Covered at decision level: PDB:173 (P1-D20), PDB:187 FI-05 + T-FI-05 server-boundary acceptance, P13:31/62/113, RIH:150. Missing from SC-9 ⛔ and backlog (T5-02, corrected after review) |
| F-EN-C5.7 | Load-time damage scan / repair | ⏳ branch | 2245 | none (grep damage / repair) | — | — | — | OMITTED | INV says "New Issues rows" — undesigned |
