# PRODUCT_FEATURE_INVENTORY

Date 2026-10-18. Every documented feature/sub-feature, re-keyed with audit FIDs. Feature facts (existence, status) come from the code-read inventory INV (`docs/editor-feature-inventory-2026-10-16.md`, main @19f964d5e, **code read only, not walked**). Design location, coverage and gaps: see FEATURE_TRACEABILITY_MATRIX.md (same FIDs).

INV status key: ✅ complete · 🟡 partial · 🐞 bug · 🚩 flagged (planned) · 🔒 plan-gated · ⏳ stub · 🧪 dev-only · ❌ removed · 🆕 new since 09-16.

Purpose / controls / states per feature are not re-typed here; they live in INV (by line) and in the design home cited in the matrix — one source each (SSOT).

## Module summary

| Module | INV rows | Trace rows | Extraction |
|---|---|---|---|
| Shell | 156 | 155 | T1 |
| Canvas | 154 | 147 | T2 |
| Pages · Templates · Layers · History · Activity · Add · Components · AI | 245 | 216 | T3 |
| Assets · CMS · Forms | 129 | 129 | T4 |
| Settings · Publish · Review · Export · E-commerce · Animation · Sync | 172 | 150 | T5 |
| Inspector · Brand | 187 | 187 | T6 |
| Engine rules · gap register · open bugs | 195 | 195 | T7 |
| *(Chrome UI kit + tokens, INV 1882–1969)* | — | in DESIGN_SYSTEM_SPECIFICATION | T7 |
| **Total** | **1,238** | **1,179** | |

Scope boundary: INV is a **code read of `main` @ 19f964d5e, not walked live**. A feature missing from INV and present only in a doc is not inventoried here (none found that adds capability; docs add fixes and states, not features — except where a doc revives a ❌ row, marked COVERED in the matrix).

### Merge map (INV rows → one FID)

Rows were merged only when family, coverage status and design home were identical. Every merged INV row is listed so the 1,238 → 1,179 reduction can be checked:

| Pass | INV → FID rows | Merged INV rows |
|---|---|---|
| T1 Shell | 156 → 155 | 3.16 + 3.17 |
| T2 Canvas | 154 → 147 | 6.16+6.17 · 9.8+9.9 · 10.3+10.4 · 11.18–11.20 · 12.1–12.3 |
| T3 Pages/Add | 245 → 216 | Pages #3–4 · A10–11 · A21–22 · A27–29 · A33–34 · B1–5 · D11–12 · D19–20 · D22–23 · D27–28 · F1–2 · F4–9 · F10–11 · F12–20 |
| T4 Assets/CMS/Forms | 129 → 129 | none |
| T5 Settings/Publish | 172 → 150 | S28–S30 · S38–S40 · S43–S44 · W4–W6 · R2–R7 · R9–R10 · X3–X7 · N2–N5 · Y6–Y7 · Y18–Y19 |
| T6 Inspector/Brand | 187 → 187 | none (M07-n / M08-n one-to-one) |
| T7 Engine | 195 → 195 | none |

INV's own totals are approximate (emoji counted per row, INV:23). The FID row of each merge names the merged INV labels in its Feature cell.

Modules with **no dedicated panel doc** although they hold real features: **Forms** (23 rows; inbox specified in P10, build + visitor states scattered over 5 other docs), **Export** (7 rows, P/01 row + IAF-15 only), **E-commerce** (deferred P1-D15, decision still "proposed").

## Shell (top bar, site menu, rail, dialogs, onboarding, ⌘K, keyboard, toasts)

INV §1 lines 96–360 · 155 rows

| FID | Feature | INV status | INV line | Parent module | Coverage |
|---|---|---|---|---|---|
| F-SH-001 | Shell grid (1.1) | ✅ | 100 | Shell | COVERED |
| F-SH-002 | Status footer (1.2) | ❌ | 101 | Shell | REMOVED-N/A |
| F-SH-003 | Zoom flyout (1.3) | ❌ | 102 | Shell | REMOVED-N/A |
| F-SH-004 | Dev alt rails (1.4) | ❌ | 103 | Shell | REMOVED-N/A |
| F-SH-005 | Right column multi-mode host (1.5) | ✅🆕 | 104 | Shell | COVERED |
| F-SH-006 | Hide/show inspector (1.6) | ✅🆕 | 105 | Shell | PARTIAL |
| F-SH-007 | CMS workspace takeover (1.7) | ✅🆕 | 106 | Shell | COVERED |
| F-SH-008 | Full-screen takeovers (1.8) | 🐞 | 107 | Shell | COVERED |
| F-SH-009 | View mode `?view=readonly` (1.9) | ✅ | 108 | Shell | COVERED |
| F-SH-010 | Viewer chrome (1.10) | ✅🆕 | 109 | Shell | COVERED |
| F-SH-011 | Skip to Canvas + landmarks (1.11) | ✅ | 110 | Shell | PARTIAL |
| F-SH-012 | Boot skeleton (1.12) | ✅ | 111 | Shell | COVERED |
| F-SH-013 | Shell crash screen (1.13) | ✅ | 112 | Shell | COVERED |
| F-SH-014 | Drawer panel loading/crash (1.14) | ✅ | 113 | Shell | COVERED |
| F-SH-015 | Column panel loading/crash (1.15) | ✅🆕 | 114 | Shell | COVERED |
| F-SH-016 | "Project loaded" toast (1.16) | ❌ | 115 | Shell | REMOVED-N/A |
| F-SH-017 | Load toasts (1.17) | ✅ | 116 | Shell | PARTIAL |
| F-SH-018 | Exit button (2.1) | ✅ | 122 | Shell | COVERED |
| F-SH-019 | Site › page breadcrumb (2.2) | ✅🆕 | 123 | Shell | COVERED |
| F-SH-020 | Save status pill (2.3) | ✅ | 124 | Shell | COVERED |
| F-SH-021 | Save pill click (2.4) | ✅🆕 | 125 | Shell | COVERED |
| F-SH-022 | Timestamp drop on narrow (2.5) | ✅ | 126 | Shell | PARTIAL |
| F-SH-023 | Live chip (2.6) | ❌ | 127 | Shell | COVERED |
| F-SH-024 | Review chip (2.7) | ✅🆕 | 128 | Shell | COVERED |
| F-SH-025 | Review-closed toasts (2.8) | ✅ | 129 | Shell | CONFLICT |
| F-SH-026 | Comments toggle (2.9) | ✅ | 130 | Shell | COVERED |
| F-SH-027 | Issues chip (2.10) | ❌ | 131 | Shell | REMOVED-N/A |
| F-SH-028 | Presence + connection pill (2.11) | 🚩 | 132 | Shell | COVERED |
| F-SH-029 | Notifications bell (2.12) | ✅🆕 | 133 | Shell | COVERED |
| F-SH-030 | Preview button (2.13) | ✅🆕 | 134 | Shell | COVERED |
| F-SH-031 | Primary CTA verbs (2.14) | 🚩 | 135 | Shell | COVERED |
| F-SH-032 | CTA blocked reasons (2.15) | ✅🆕 | 136 | Shell | COVERED |
| F-SH-033 | CTA routing (2.16) | ✅ | 137 | Shell | COVERED |
| F-SH-034 | SR announcements (2.17) | ✅ | 138 | Shell | COVERED |
| F-SH-035 | Viewer top bar (2.18) | ✅🆕 | 139 | Shell | COVERED |
| F-SH-036 | ⋯ menu shell (3.1) | ✅ | 145 | Shell | COVERED |
| F-SH-037 | Site settings row (3.2) | ✅ | 146 | Shell | COVERED |
| F-SH-038 | Export site… (3.3) | ✅ | 147 | Shell | COVERED |
| F-SH-039 | Duplicate site (3.4) | ✅🆕 | 148 | Shell | CONFLICT |
| F-SH-040 | Issues row (3.5) | 🟡 | 149 | Shell | COVERED |
| F-SH-041 | Activity log row (3.6) | 🟡🆕 | 150 | Shell | PARTIAL |
| F-SH-042 | Command palette row (3.7) | ✅🆕 | 151 | Shell | COVERED |
| F-SH-043 | Enter/Exit view mode (3.8) | ✅ | 152 | Shell | COVERED |
| F-SH-044 | Keyboard shortcuts row (3.9) | ✅ | 153 | Shell | COVERED |
| F-SH-045 | Share preview link (3.10) | ✅🆕 | 154 | Shell | PARTIAL |
| F-SH-046 | Copy live URL (3.11) | ✅ | 155 | Shell | PARTIAL |
| F-SH-047 | Getting started row (3.12) | ✅ | 156 | Shell | COVERED |
| F-SH-048 | Start collaboration (3.13) | 🚩 | 157 | Shell | COVERED |
| F-SH-049 | Unpublish site… (3.14) | ✅ | 158 | Shell | COVERED |
| F-SH-050 | View live site ↗ (3.15) | ✅ | 159 | Shell | COVERED |
| F-SH-051 | Site health ↗ · Invite teammates ↗ / Account settings ↗ (3.16–3.17) | ✅ | 160–161 | Shell | CONFLICT |
| F-SH-052 | View-mode menu (3.18) | ✅ | 162 | Shell | COVERED |
| F-SH-053 | Removed menu rows (3.19) | ❌ | 163 | Shell | REMOVED-N/A |
| F-SH-054 | Rail items (4.1) | ✅ | 169 | Shell | COVERED |
| F-SH-055 | Rail logo (4.2) | ❌ | 170 | Shell | REMOVED-N/A |
| F-SH-056 | Rail Help button (4.3) | ✅🆕 | 171 | Shell | COVERED |
| F-SH-057 | Rail active/hover/focus (4.4) | ✅ | 172 | Shell | COVERED |
| F-SH-058 | Rail click semantics (4.5) | ✅ | 173 | Shell | COVERED |
| F-SH-059 | Rail keyboard (4.6) | ✅ | 174 | Shell | COVERED |
| F-SH-060 | Rail unsaved dot (4.7) | ❌ | 175 | Shell | REMOVED-N/A |
| F-SH-061 | Off-rail panels + keys (4.8) | ✅ | 176 | Shell | COVERED |
| F-SH-062 | Drawer container (4.9) | ✅ | 177 | Shell | COVERED |
| F-SH-063 | Remembered tab (4.10) | ✅ | 178 | Shell | COVERED |
| F-SH-064 | Unsaved-switch guard (4.11) | ✅🆕 | 179 | Shell | CONFLICT |
| F-SH-065 | Cross-panel hand-offs (4.12) | ✅ | 180 | Shell | COVERED |
| F-SH-066 | Create-component guard (4.13) | ✅ | 181 | Shell | PARTIAL |
| F-SH-067 | Full-screen close return (4.14) | ✅ | 182 | Shell | COVERED |
| F-SH-068 | Page tabs (5.1) | ✅🆕 | 188 | Shell | COVERED |
| F-SH-069 | "+" button (5.2) | 🟡 | 189 | Shell | PARTIAL |
| F-SH-070 | Tab context menu (5.3) | ❌ | 190 | Shell | REMOVED-N/A |
| F-SH-071 | Notification dropdown (6.1) | ✅ | 196 | Shell | COVERED |
| F-SH-072 | Notification states (6.2) | ✅ | 197 | Shell | COVERED |
| F-SH-073 | Notification rows (6.3) | ✅🆕 | 198 | Shell | PARTIAL |
| F-SH-074 | Mark all read (6.4) | ✅ | 199 | Shell | COVERED |
| F-SH-075 | Footer "View all activity ›" (6.5) | ✅🆕 | 200 | Shell | COVERED |
| F-SH-076 | Deleted-target note (6.6) | ❌ | 201 | Shell | COVERED |
| F-SH-077 | Issues panel host (7.1) | ✅🆕 | 207 | Shell | COVERED |
| F-SH-078 | Issue sources (7.2) | 🟡🆕 | 208 | Shell | PARTIAL |
| F-SH-079 | Scan state (7.3) | ✅🆕 | 209 | Shell | PARTIAL |
| F-SH-080 | Empty / scope / filter (7.4) | ✅ | 210 | Shell | PARTIAL |
| F-SH-081 | Row → locate (7.5) | 🟡 | 211 | Shell | COVERED |
| F-SH-082 | Fix › auto-fix (7.6) | ✅ | 212 | Shell | COVERED |
| F-SH-083 | Fix-failed band (7.7) | ✅ | 213 | Shell | PARTIAL |
| F-SH-084 | Ignored (n) (7.8) | ✅🆕 | 214 | Shell | COVERED |
| F-SH-085 | Issue copy (7.9) | 🟡 | 215 | Shell | PARTIAL |
| F-SH-086 | Preview overlay (8.1) | 🟡🆕 | 221 | Shell | COVERED |
| F-SH-087 | Preview keeps device (8.2) | 🐞 | 222 | Shell | COVERED |
| F-SH-088 | Preview fidelity (8.3) | 🟡 | 223 | Shell | PARTIAL |
| F-SH-089 | Preview page switching (8.4) | ✅🆕 | 224 | Shell | PARTIAL |
| F-SH-090 | Share preview dialog (8.5) | ✅🆕 | 225 | Shell | PARTIAL |
| F-SH-091 | Compare (8.6) | ✅🆕 | 226 | Shell | COVERED |
| F-SH-092 | Time travel (8.7) | ✅🆕 | 227 | Shell | COVERED |
| F-SH-093 | Review bar (9.1) | ❌ | 233 | Shell | REMOVED-N/A |
| F-SH-094 | Send for review (9.2) | ✅ | 234 | Shell | COVERED |
| F-SH-095 | Review-sent outcome dialog (9.3) | ✅ | 235 | Shell | PARTIAL |
| F-SH-096 | Publish with N errors (9.4) | ✅ | 236 | Shell | COVERED |
| F-SH-097 | Publish confirm facts (9.5) | 🚩 | 237 | Shell | COVERED |
| F-SH-098 | Approval gate dialogs (9.6) | ✅ | 238 | Shell | COVERED |
| F-SH-099 | Stale-approval dialog (9.7) | ✅ | 239 | Shell | COVERED |
| F-SH-100 | Publish outcome toasts (9.8) | ✅ | 240 | Shell | COVERED |
| F-SH-101 | Publish history (9.9) | ✅ | 241 | Shell | COVERED |
| F-SH-102 | Rollback picker (9.10) | ❌ | 242 | Shell | REMOVED-N/A |
| F-SH-103 | Exit guard dialogs (10.1) | ✅ | 248 | Shell | COVERED |
| F-SH-104 | Browser leave prompt (10.2) | ✅ | 249 | Shell | COVERED |
| F-SH-105 | Save-failed banner (10.3) | ✅🆕 | 250 | Shell | COVERED |
| F-SH-106 | Recovered-work banner (10.4) | ✅ | 251 | Shell | PARTIAL |
| F-SH-107 | "Never reached the server" (10.5) | ✅ | 252 | Shell | COVERED |
| F-SH-108 | Load-error banner (10.6) | 🐞 | 253 | Shell | COVERED |
| F-SH-109 | Session-expired dialog (10.7) | ✅ | 254 | Shell | COVERED |
| F-SH-110 | Conflict dialog (10.8) | ✅ | 255 | Shell | COVERED |
| F-SH-111 | Other-tab notice (10.9) | ✅🆕 | 256 | Shell | COVERED |
| F-SH-112 | Save toasts (10.10) | ✅ | 257 | Shell | PARTIAL |
| F-SH-113 | Page-limit save refusal (10.11) | 🔒🆕 | 258 | Shell | COVERED |
| F-SH-114 | Sync-failure toasts (10.12) | ✅ | 259 | Shell | PARTIAL |
| F-SH-115 | Engine error toasts (10.13) | ✅🆕 | 260 | Shell | PARTIAL |
| F-SH-116 | Create component modal (11.1) | ✅ | 266 | Shell | COVERED |
| F-SH-117 | Create collection modal (11.2) | ✅ | 267 | Shell | COVERED |
| F-SH-118 | Records manager (11.3) | ❌ | 268 | Shell | REMOVED-N/A |
| F-SH-119 | Set up Products collection (11.4) | ✅ | 269 | Shell | PARTIAL |
| F-SH-120 | Save page as template (11.5) | ✅ | 270 | Shell | PARTIAL |
| F-SH-121 | New page modal (11.6) | ✅🆕 | 271 | Shell | COVERED |
| F-SH-122 | Site fonts modal (11.7) | ✅🆕 | 272 | Shell | COVERED |
| F-SH-123 | Upgrade dialog (11.8) | 🔒 | 273 | Shell | COVERED |
| F-SH-124 | Permissions dialog (11.9) | ✅🆕 | 274 | Shell | PARTIAL |
| F-SH-125 | Delete site (owner) (11.10) | ✅🆕 | 275 | Shell | CONFLICT |
| F-SH-126 | Export modal (11.11) | ✅ | 276 | Shell | COVERED |
| F-SH-127 | Rail coach mark (12.1) | ✅ | 282 | Shell | COVERED |
| F-SH-128 | Getting-started chip (12.2) | ✅🆕 | 283 | Shell | COVERED |
| F-SH-129 | Checklist panel (12.3) | ✅ | 284 | Shell | COVERED |
| F-SH-130 | Seven steps (12.4) | 🐞 | 285 | Shell | COVERED |
| F-SH-131 | Progress scope (12.5) | 🐞 | 286 | Shell | COVERED |
| F-SH-132 | Step-complete prompt (12.6) | 🟡 | 287 | Shell | COVERED |
| F-SH-133 | Hidden in view mode (12.7) | ✅ | 288 | Shell | COVERED |
| F-SH-134 | Onboarding board coverage (12.8) | 🟡 | 289 | Shell | PARTIAL |
| F-SH-135 | One palette (13.1) | ✅ | 295 | Shell | COVERED |
| F-SH-136 | Opening bands (13.2) | 🟡 | 296 | Shell | COVERED |
| F-SH-137 | Search-only results (13.3) | ✅🆕 | 297 | Shell | COVERED |
| F-SH-138 | Disabled rows + reason (13.4) | ✅ | 298 | Shell | COVERED |
| F-SH-139 | No results (13.5) | ✅🆕 | 299 | Shell | COVERED |
| F-SH-140 | Scope chip (13.6) | ⏳ | 300 | Shell | COVERED |
| F-SH-141 | Clear history (13.7) | 🟡 | 301 | Shell | COVERED |
| F-SH-142 | Start collab command (13.8) | 🚩 | 302 | Shell | COVERED |
| F-SH-143 | Palette legend footer (13.9) | 🟡 | 303 | Shell | COVERED |
| F-SH-144 | Shortcuts sheet (14.1) | ✅ | 309 | Shell | COVERED |
| F-SH-145 | Keyboard legend card (14.2) | 🐞 | 310 | Shell | PARTIAL |
| F-SH-146 | Rail/panel letters (14.3) | ✅ | 311 | Shell | COVERED |
| F-SH-147 | Global chords (14.4) | ✅ | 312 | Shell | PARTIAL |
| F-SH-148 | F6 region cycling (14.5) | ✅ | 313 | Shell | COVERED |
| F-SH-149 | Escape innermost (14.6) | ✅ | 314 | Shell | COVERED |
| F-SH-150 | Deep links (14.7) | ✅🆕 | 315 | Shell | PARTIAL |
| F-SH-151 | Toast stacking rule (15.1) | 🟡🆕 | 321 | Shell | COVERED |
| F-SH-152 | Undo/redo feedback (15.2) | ✅ | 322 | Shell | COVERED |
| F-SH-153 | Editing/insert/clipboard toasts (15.3) | ✅ | 323 | Shell | PARTIAL |
| F-SH-154 | "Connect to tokens" offer (15.4) | ✅🆕 | 324 | Shell | PARTIAL |
| F-SH-155 | Auto alt-text on upload (15.5) | ✅🆕 | 325 | Shell | DEFERRED-BY-DECISION |

## Canvas + canvas interactions

INV §2 lines 361–616 · 147 rows

| FID | Feature | INV status | INV line | Parent module | Coverage |
|---|---|---|---|---|---|
| F-CV-001 | Page card on grey canvas | ✅ | 365 | Canvas + canvas interactions | COVERED |
| F-CV-002 | Auto fit-to-width on load | ✅ | 366 | Canvas + canvas interactions | COVERED |
| F-CV-003 | Click grey surround to deselect | ✅ | 367 | Canvas + canvas interactions | COVERED |
| F-CV-004 | Page links/forms can't navigate editor | ✅ | 368 | Canvas + canvas interactions | PARTIAL |
| F-CV-005 | Live widget runtimes on canvas | ✅ | 369 | Canvas + canvas interactions | PARTIAL |
| F-CV-006 | CMS preview + Collection list repeat | 🟡 | 370 | Canvas + canvas interactions | COVERED |
| F-CV-007 | Animations + global custom CSS live on canvas | ✅ | 371 | Canvas + canvas interactions | PARTIAL |
| F-CV-008 | Locked element styling | ✅ | 372 | Canvas + canvas interactions | COVERED |
| F-CV-009 | Hidden (Layers eye) element | ✅ | 373 | Canvas + canvas interactions | COVERED |
| F-CV-010 | Hidden-per-breakpoint | ✅ | 374 | Canvas + canvas interactions | COVERED |
| F-CV-011 | Empty container placeholder copy | 🐞 | 375 | Canvas + canvas interactions | PARTIAL |
| F-CV-012 | Empty column label | ✅ | 376 | Canvas + canvas interactions | PARTIAL |
| F-CV-013 | Src-less image placeholder | ✅ | 377 | Canvas + canvas interactions | PARTIAL |
| F-CV-014 | Drop/insert flash + settle | ✅ | 378 | Canvas + canvas interactions | PARTIAL |
| F-CV-015 | Layers-row ↔ canvas hover | ✅ | 379 | Canvas + canvas interactions | COVERED |
| F-CV-016 | Read-only / view mode | ✅ | 380 | Canvas + canvas interactions | COVERED |
| F-CV-017 | "Pick an element" mode | ✅ | 381 | Canvas + canvas interactions | PARTIAL |
| F-CV-018 | Screen-reader live region | ✅ | 382 | Canvas + canvas interactions | COVERED |
| F-CV-019 | Breakpoint switch | 🟡 | 388 | Canvas + canvas interactions | COVERED |
| F-CV-020 | Wide 1920 | ❌ | 389 | Canvas + canvas interactions | COVERED |
| F-CV-021 | Watch device | ❌ | 390 | Canvas + canvas interactions | REMOVED-N/A |
| F-CV-022 | Re-fit zoom on breakpoint switch | ✅ | 391 | Canvas + canvas interactions | PARTIAL |
| F-CV-023 | Width label under page | ✅ | 392 | Canvas + canvas interactions | PARTIAL |
| F-CV-024 | Custom width | ✅ | 393 | Canvas + canvas interactions | COVERED |
| F-CV-025 | Device frame | 🟡 | 394 | Canvas + canvas interactions | COVERED |
| F-CV-026 | "Desktop" = three widths | 🟡 | 395 | Canvas + canvas interactions | COVERED |
| F-CV-027 | Zoom menu | ✅ | 401 | Canvas + canvas interactions | COVERED |
| F-CV-028 | View › Zoom submenu | ✅ | 402 | Canvas + canvas interactions | PARTIAL |
| F-CV-029 | Zoom keys | ✅ | 403 | Canvas + canvas interactions | COVERED |
| F-CV-030 | Zoom to fit / to selection | ✅ | 404 | Canvas + canvas interactions | COVERED |
| F-CV-031 | Zoom-aware overlays | 🟡 | 405 | Canvas + canvas interactions | PARTIAL |
| F-CV-032 | Empty-page CTA | 🟡 | 411 | Canvas + canvas interactions | PARTIAL |
| F-CV-033 | Template cards in empty CTA | 🟡 | 412 | Canvas + canvas interactions | COVERED |
| F-CV-034 | Add a block / Describe doors | ✅ | 413 | Canvas + canvas interactions | COVERED |
| F-CV-035 | Start blank | ✅ | 414 | Canvas + canvas interactions | COVERED |
| F-CV-036 | Loading skeleton | ✅ | 415 | Canvas + canvas interactions | COVERED |
| F-CV-037 | Project unavailable | ✅ | 416 | Canvas + canvas interactions | COVERED |
| F-CV-038 | Default hover | ✅ | 422 | Canvas + canvas interactions | COVERED |
| F-CV-039 | Alt-hover hierarchy | ✅ | 423 | Canvas + canvas interactions | COVERED |
| F-CV-040 | Alt+Shift box model | ✅ | 424 | Canvas + canvas interactions | COVERED |
| F-CV-041 | Clone badge (⌘ held) | ✅ | 425 | Canvas + canvas interactions | PARTIAL |
| F-CV-042 | Inspector mode (I key) | ❌ | 426 | Canvas + canvas interactions | REMOVED-N/A |
| F-CV-043 | Hover drag grip | ✅ | 427 | Canvas + canvas interactions | PARTIAL |
| F-CV-044 | Selection box | ✅ | 433 | Canvas + canvas interactions | COVERED |
| F-CV-045 | Selection tag | ✅ | 434 | Canvas + canvas interactions | COVERED |
| F-CV-046 | Resize handles | ✅ | 435 | Canvas + canvas interactions | COVERED |
| F-CV-047 | Resize at zoom ≠ 100 % | 🐞 | 436 | Canvas + canvas interactions | COVERED |
| F-CV-048 | Esc cancels resize | 🐞 | 437 | Canvas + canvas interactions | COVERED |
| F-CV-049 | NaN risk in resize | 🐞 | 438 | Canvas + canvas interactions | COVERED |
| F-CV-050 | Resize modifiers | ✅ | 439 | Canvas + canvas interactions | PARTIAL |
| F-CV-051 | Multi-select resize | 🐞 | 440 | Canvas + canvas interactions | PARTIAL |
| F-CV-052 | Rotation handle | ✅ | 441 | Canvas + canvas interactions | COVERED |
| F-CV-053 | Size label while resizing | ✅ | 442 | Canvas + canvas interactions | COVERED |
| F-CV-054 | CMS-bound badge | ✅ | 443 | Canvas + canvas interactions | COVERED |
| F-CV-055 | Locked badge | ✅ | 444 | Canvas + canvas interactions | COVERED |
| F-CV-056 | Selection toolbar (single) | ✅ | 445 | Canvas + canvas interactions | COVERED |
| F-CV-057 | Toolbar caption overlap | 🟡 | 446 | Canvas + canvas interactions | PARTIAL |
| F-CV-058 | Old toolbar actions (parent, + child, wrap, AI…) | ❌ | 447 | Canvas + canvas interactions | REMOVED-N/A |
| F-CV-059 | Add-child modal; Edit-with-AI popover | ❌ | 448–449 | Canvas + canvas interactions | REMOVED-N/A |
| F-CV-060 | Bottom breadcrumb bar | ❌ | 450 | Canvas + canvas interactions | COVERED |
| F-CV-061 | Footer selection readout | ✅ | 451 | Canvas + canvas interactions | COVERED |
| F-CV-062 | Click / Shift / ⌘ cycle / dbl / triple | ✅ | 452 | Canvas + canvas interactions | COVERED |
| F-CV-063 | Spacing spots | ✅ | 453 | Canvas + canvas interactions | COVERED |
| F-CV-064 | Multi-select box | ✅ | 459 | Canvas + canvas interactions | COVERED |
| F-CV-065 | Canvas align/distribute toolbar | ❌ | 460 | Canvas + canvas interactions | REMOVED-N/A |
| F-CV-066 | Toolbar hidden in multi-select | 🟡 | 461 | Canvas + canvas interactions | PARTIAL |
| F-CV-067 | Multi-delete confirm | ✅ | 462 | Canvas + canvas interactions | COVERED |
| F-CV-068 | Marquee select | 🟡 | 463 | Canvas + canvas interactions | PARTIAL |
| F-CV-069 | Marquee at zoom ≠ 100 % | 🐞 | 464 | Canvas + canvas interactions | PARTIAL |
| F-CV-070 | Double-click to edit text | ✅ | 470 | Canvas + canvas interactions | COVERED |
| F-CV-071 | Inspector "Edit text on canvas" | ✅ | 471 | Canvas + canvas interactions | PARTIAL |
| F-CV-072 | Floating rich-text toolbar | ✅ | 472 | Canvas + canvas interactions | COVERED |
| F-CV-073 | Inline commit / cancel | 🟡 | 473 | Canvas + canvas interactions | PARTIAL |
| F-CV-074 | "Type here..." placeholder | ✅ | 474 | Canvas + canvas interactions | PARTIAL |
| F-CV-075 | View ▾ menu | ✅ | 480 | Canvas + canvas interactions | COVERED |
| F-CV-076 | Overlay chords | ✅ | 481 | Canvas + canvas interactions | COVERED |
| F-CV-077 | Snap / smart guides | ✅ | 482 | Canvas + canvas interactions | PARTIAL |
| F-CV-078 | Grid overlay + size | 🟡 | 483 | Canvas + canvas interactions | PARTIAL |
| F-CV-079 | Snap-to-grid follows Grid | ✅ | 484 | Canvas + canvas interactions | PARTIAL |
| F-CV-080 | Rulers + guides | ✅ | 485 | Canvas + canvas interactions | PARTIAL |
| F-CV-081 | Guides saved with site | ✅ | 486 | Canvas + canvas interactions | PARTIAL |
| F-CV-082 | Badges; X-Ray | ✅ | 487–488 | Canvas + canvas interactions | COVERED |
| F-CV-083 | Component view / Outlines / Dev mode | ❌ | 489 | Canvas + canvas interactions | REMOVED-N/A |
| F-CV-084 | Overlay state remembered | ✅ | 490 | Canvas + canvas interactions | PARTIAL |
| F-CV-085 | Docked footer bar | ✅ | 496 | Canvas + canvas interactions | COVERED |
| F-CV-086 | Undo / Redo buttons | ✅ | 497 | Canvas + canvas interactions | COVERED |
| F-CV-087 | Inspector toggle; Help on bar | ❌ | 498–499 | Canvas + canvas interactions | REMOVED-N/A |
| F-CV-088 | Toasts anchored to canvas | ✅ | 500 | Canvas + canvas interactions | COVERED |
| F-CV-089 | Open menu: right-click / Shift+F10 / ⋯ | ✅ | 506 | Canvas + canvas interactions | COVERED |
| F-CV-090 | Menu structure | ✅ | 507 | Canvas + canvas interactions | PARTIAL |
| F-CV-091 | Keyboard in menu | ✅ | 508 | Canvas + canvas interactions | PARTIAL |
| F-CV-092 | Menu viewport clamping | 🐞 | 509 | Canvas + canvas interactions | PARTIAL |
| F-CV-093 | Disabled-row reasons | 🟡 | 510 | Canvas + canvas interactions | PARTIAL |
| F-CV-094 | Duplicate / Delete rows | ✅ | 511 | Canvas + canvas interactions | COVERED |
| F-CV-095 | Copy / Cut / Paste | ✅ | 512 | Canvas + canvas interactions | COVERED |
| F-CV-096 | Wrap / Unwrap | ✅ | 513 | Canvas + canvas interactions | COVERED |
| F-CV-097 | Replace with block… | ✅ | 514 | Canvas + canvas interactions | COVERED |
| F-CV-098 | Save as component… | ✅ | 515 | Canvas + canvas interactions | COVERED |
| F-CV-099 | Arrange front/back | ✅ | 516 | Canvas + canvas interactions | COVERED |
| F-CV-100 | Copy / Paste style | ✅ | 517 | Canvas + canvas interactions | COVERED |
| F-CV-101 | Lock / Unlock | ✅ | 518 | Canvas + canvas interactions | COVERED |
| F-CV-102 | Group / Ungroup lock gate | 🐞 | 519 | Canvas + canvas interactions | CONFLICT |
| F-CV-103 | Bind to CMS field… | ✅ | 520 | Canvas + canvas interactions | PARTIAL |
| F-CV-104 | Add interaction | ✅ | 521 | Canvas + canvas interactions | COVERED |
| F-CV-105 | Improve with AI | ✅ | 522 | Canvas + canvas interactions | DEFERRED-BY-DECISION |
| F-CV-106 | Insert rows; Layout "make it…"; Quick Style | ❌ | 523–525 | Canvas + canvas interactions | REMOVED-N/A |
| F-CV-107 | Reveal in layers / Select parent rows | ❌ | 526 | Canvas + canvas interactions | COVERED |
| F-CV-108 | Menu closes on deselect/delete/scroll | ✅ | 527 | Canvas + canvas interactions | PARTIAL |
| F-CV-109 | Windows shortcut hints | ✅ | 528 | Canvas + canvas interactions | COVERED |
| F-CV-110 | Drop highlight / between cue / inside cue | ✅ | 534–536 | Canvas + canvas interactions | PARTIAL |
| F-CV-111 | Add-drawer "Drop into" cue | ✅ | 537 | Canvas + canvas interactions | PARTIAL |
| F-CV-112 | Invalid-drop badge + messages | ✅ | 538 | Canvas + canvas interactions | PARTIAL |
| F-CV-113 | Drop sources | ✅ | 539 | Canvas + canvas interactions | COVERED |
| F-CV-114 | Insert toast + Undo | ✅ | 540 | Canvas + canvas interactions | COVERED |
| F-CV-115 | Media drop toast text bug | 🐞 | 541 | Canvas + canvas interactions | PARTIAL |
| F-CV-116 | Media drop insert vs replace | ✅ | 542 | Canvas + canvas interactions | PARTIAL |
| F-CV-117 | OS image drop | ✅ | 543 | Canvas + canvas interactions | COVERED |
| F-CV-118 | Drop while inline editing | ✅ | 544 | Canvas + canvas interactions | PARTIAL |
| F-CV-119 | Auto-scroll near edges | ✅ | 545 | Canvas + canvas interactions | COVERED |
| F-CV-120 | Nesting rules | ✅ | 546 | Canvas + canvas interactions | COVERED |
| F-CV-121 | Drag-move element | ✅ | 552 | Canvas + canvas interactions | COVERED |
| F-CV-122 | ⌘-drag clone | 🐞 | 553 | Canvas + canvas interactions | PARTIAL |
| F-CV-123 | Multi-element drag | ✅ | 554 | Canvas + canvas interactions | COVERED |
| F-CV-124 | Duplicate/paste keep styles | 🐞 | 555 | Canvas + canvas interactions | PARTIAL |
| F-CV-125 | Touch long-press drag | ❌ | 556 | Canvas + canvas interactions | REMOVED-N/A |
| F-CV-126 | Section reorder grips | ✅ | 557 | Canvas + canvas interactions | COVERED |
| F-CV-127 | Arrow-key selection nav | ✅ | 558 | Canvas + canvas interactions | COVERED |
| F-CV-128 | Keyboard nudge | ✅ | 559 | Canvas + canvas interactions | COVERED |
| F-CV-129 | ⌥↑/↓, ⌥Home/End reorder | ✅ | 560 | Canvas + canvas interactions | COVERED |
| F-CV-130 | ⌘Z behind full-page tools | 🐞 | 561 | Canvas + canvas interactions | COVERED |
| F-CV-131 | Clipboard & edit chords | ✅ | 562 | Canvas + canvas interactions | COVERED |
| F-CV-132 | App chords | ✅ | 563 | Canvas + canvas interactions | COVERED |
| F-CV-133 | Canvas palette ⌘⇧P | ❌ | 564 | Canvas + canvas interactions | REMOVED-N/A |
| F-CV-134 | Keyboard shortcuts sheet | ✅ | 565 | Canvas + canvas interactions | COVERED |
| F-CV-135 | Keyboard legend card | ✅ | 566 | Canvas + canvas interactions | COVERED |
| F-CV-136 | Comment mode toggle | ✅ | 572 | Canvas + canvas interactions | COVERED |
| F-CV-137 | Pins | ✅ | 573 | Canvas + canvas interactions | COVERED |
| F-CV-138 | New-comment popover | ✅ | 574 | Canvas + canvas interactions | COVERED |
| F-CV-139 | Re-pin detached comment | ✅ | 575 | Canvas + canvas interactions | COVERED |
| F-CV-140 | Orphan comments modal | ✅ | 576 | Canvas + canvas interactions | COVERED |
| F-CV-141 | Replies / threads / @mentions | ⏳ | 577 | Canvas + canvas interactions | PARTIAL |
| F-CV-142 | Start collaboration | 🚩 | 583 | Canvas + canvas interactions | COVERED |
| F-CV-143 | Presence avatars + pill | 🚩 | 584 | Canvas + canvas interactions | COVERED |
| F-CV-144 | Remote cursors | 🚩 | 585 | Canvas + canvas interactions | COVERED |
| F-CV-145 | Remote selections / editing / soft-locks | ⏳ | 586 | Canvas + canvas interactions | COVERED |
| F-CV-146 | Interaction runtime | ✅ | 592 | Canvas + canvas interactions | COVERED |
| F-CV-147 | Reverse on leave/blur | ⏳ | 593 | Canvas + canvas interactions | PARTIAL |

## Pages, Templates, Layers, History, Activity · Add, Components, AI

INV §3–4 lines 617–997 · 216 rows

| FID | Feature | INV status | INV line | Parent module | Coverage |
|---|---|---|---|---|---|
| F-PG-001 | Pages panel (entry) | ✅ | 621 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-002 | Header ⋯ menu | ✅ | 622 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-003 | ⌘K keycap / panel-local palette (#3–4) | ❌ | 623–624 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-PG-004 | ⌘K "New page" / "Go to {page}" | ✅ | 625 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-005 | Search pages | ✅ | 626 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-006 | "/" focuses search | ❌ | 627 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-PG-007 | No-results state | ✅ | 628 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-008 | Loading skeleton | ✅ | 629 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-009 | Empty state | ✅ | 630 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-010 | Load error | ✅ | 631 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-011 | One-page note | ✅ | 632 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-012 | Footer legend | ✅ | 633 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-013 | "+N from collections ›" | ✅ | 634 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-014 | Footer add actions | ✅ | 635 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-015 | Select / open page | ✅ | 641 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-016 | Home glyph | ✅ | 642 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-017 | External-link page glyph | ❌ | 643 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-PG-018 | Status chip | 🟡 | 644 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-019 | "● Unpublished" marker | 🟡 | 645 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-020 | Inline rename | ✅ | 646 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-021 | Rename → URL decision | ✅ | 647 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-022 | Drag to reorder | ✅ | 648 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-023 | Bulk selection | ✅ | 649 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-024 | Page context menu | ✅ | 650 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-025 | Menu chords ⌘D / ⌫ | 🐞 | 651 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-026 | Duplicate | ✅ | 652 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-027 | Set as homepage | ✅ | 653 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-028 | Copy link | ✅ | 654 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-029 | Delete one page | ✅ | 655 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-030 | Replace layout with template… | ✅ | 656 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-031 | Server-backed folders | ✅ | 662 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-032 | Folder row | ✅ | 663 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-033 | New folder | ✅ | 664 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-034 | Move page into folder | ✅ | 665 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-035 | Reorder inside folder | 🟡 | 666 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-036 | Bulk toolbar | ✅ | 667 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-037 | Move pages dialog | ✅ | 668 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-038 | Bulk delete | ✅ | 669 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-039 | Bulk duplicate | ✅ | 670 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-040 | New page modal | ✅ | 676 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-041 | Plan page limit | 🟡 | 677 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-042 | Listings view | ✅ | 678 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-043 | SEO score consistency (two formulas) | 🐞 | 679 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-044 | "Open full listings ›" | 🟡 | 680 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-045 | Structure view | ✅ | 681 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-046 | Page settings dialog shell | ✅ | 687 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-047 | Save model (Cancel / Save) | 🟡 | 688 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-048 | Discard guard | ✅ | 689 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-049 | SEO score pill on tab | ✅ | 690 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-050 | Google preview | ✅ | 691 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-051 | Score card + checklist | ✅ | 692 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-052 | Meta title override + "Write with AI" | ✅ | 693 | Pages, Templates, Layers, History, Activity · Add, Components, AI | DEFERRED-BY-DECISION |
| F-PG-053 | Meta description | ✅ | 694 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-054 | URL slug + redirect offer | ✅ | 695 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-055 | Indexing select in SEO tab | ✅ | 696 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-056 | Social tab | ✅ | 697 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-057 | Visibility Live / Hidden | ✅ | 698 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-058 | Password-protected pages | ❌ | 699 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-PG-059 | Indexing / Follow toggles | ✅ | 700 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-060 | Custom `<head>` code | ✅ | 701 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-061 | Settings error boundary | ✅ | 702 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-062 | Templates view (full-canvas → area) | ✅ | 708 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-063 | Compact drawer gallery | ❌ | 709 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-PG-064 | Search / filter / tags | ❌ | 710 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-065 | Workspace sidebar | ✅ | 711 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-066 | Catalogue grid | ✅ | 712 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-067 | Catalogue content | ✅ | 713 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-068 | In-place preview | ✅ | 714 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-069 | Detail panel / "where used" dialog | ❌ | 715 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-PG-070 | Replace mode | ✅ | 716 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-071 | Replace confirm | ✅ | 717 | Pages, Templates, Layers, History, Activity · Add, Components, AI | CONFLICT |
| F-PG-072 | "Reset global styles" option | ❌ | 718 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-PG-073 | Backup-failed dialog | ✅ | 719 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-074 | New page from template | ✅ | 720 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-075 | Apply progress card | ✅ | 721 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-076 | Admin-only apply | ✅ | 722 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-077 | Pro templates | 🔒 | 723 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-078 | Brand tokens after apply | 🟡 | 724 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-079 | Empty-canvas template cards bug | 🐞 | 725 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-080 | Save page as template | 🟡 | 726 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-081 | Legacy template list / manager | ❌ | 727 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-PG-082 | Layers panel | ✅ | 733 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-083 | Layers header ⋯ | ✅ | 734 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-084 | Search layers | ✅ | 735 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-085 | Breadcrumb band | ❌ | 736 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-PG-086 | Layers panel states | ✅ | 737 | Pages, Templates, Layers, History, Activity · Add, Components, AI | CONFLICT |
| F-PG-087 | Display settings | ✅ | 738 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-088 | Layer row | ✅ | 739 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-089 | Names/locks saved with project | ✅ | 740 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-090 | Dim in editor | ✅ | 741 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-091 | Drag reorder / nest | ✅ | 742 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-092 | Multi-select / Select mode | ✅ | 743 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-093 | Multi-select banner | ❌ | 744 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-PG-094 | Row keyboard | ✅ | 745 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-095 | Layer context menu | ✅ | 746 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-096 | Move to page dialog | ✅ | 747 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-097 | Delete a multi-selection | ✅ | 748 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-098 | Lock/Unlock + Select children in menu | 🟡 | 749 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-099 | Viewer read-only Layers | ✅ | 750 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-100 | Hover sync | ✅ | 751 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-101 | History location (right column) | ✅ | 757 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-102 | Tabs Session / Saves / Published | ✅ | 758 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-103 | History ⋯ menu | ✅ | 759 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-104 | Remembers last view | ✅ | 760 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-105 | Viewer read-only History | ✅ | 761 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-106 | "‹ Activity" back row | ✅ | 762 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-107 | Saves list | ✅ | 763 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-108 | Version row ⋯ menu | ✅ | 764 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-109 | Saved-version details modal | ✅ | 765 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-110 | Saves filter | ✅ | 766 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-111 | Restore a version | ✅ | 767 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-112 | Delete a version | ✅ | 768 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-113 | Save a version modal | ✅ | 769 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-114 | Inline compare | ✅ | 770 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-115 | Get AI Summary | ✅ | 771 | Pages, Templates, Layers, History, Activity · Add, Components, AI | DEFERRED-BY-DECISION |
| F-PG-116 | Milestone suggestion banner | ✅ | 772 | Pages, Templates, Layers, History, Activity · Add, Components, AI | DEFERRED-BY-DECISION |
| F-PG-117 | Approval band | ✅ | 773 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-118 | Retention / prune notes | ✅ | 774 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-119 | Saves states | ✅ | 775 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-120 | "Use Ctrl+Z" hint bug | 🐞 | 776 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-121 | Session undo trail | ✅ | 777 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-122 | Restore to a step | ✅ | 778 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-123 | Session keyboard j/k/g/G | ✅ | 779 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-124 | Session footer + states | ✅ | 780 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-125 | Time Travel | ✅ | 781 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-126 | Time Travel restore safety | ✅ | 782 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-127 | Time Travel "no preview" point | 🟡 | 783 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-128 | Published tab | ✅ | 784 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-129 | Shared Compare view | ✅ | 785 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-130 | Activity panel | ✅ | 791 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-131 | Activity filters + rows | ✅ | 792 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-132 | Activity states | ✅ | 793 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-133 | Panel frame + header | ✅ | 799 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-134 | Panel search field | ✅ | 800 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-135 | Shared panel states | ✅ | 801 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-PG-136 | Drill-in header | ✅ | 802 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-PG-137 | Old sidebar SearchBar | ❌ | 803 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-AD-001 | Add panel frame + header | ✅ | 830 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-002 | Expand to 700 | ❌ | 831 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-AD-003 | Paste HTML dialog | ✅ | 832 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-004 | Pinned Paste HTML row | ❌ | 833 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-AD-005 | Search field | ✅ | 834 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-006 | Search results | ✅ | 835 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-007 | No-results state | ✅ | 836 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-008 | Selection-aware purpose line | ❌ | 837 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-AD-009 | Group headers | ✅ | 838 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-010 | ★ Favourites + Recent (A10–A11) | ✅ | 839–840 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-011 | ELEMENTS (54) | ✅ | 841 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-012 | Collection list element | ✅ | 842 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-013 | Theme toggle element | ✅ | 843 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-014 | Upload element | ❌ | 844 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-AD-015 | Description bubble | ✅ | 845 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-016 | Drag element + drag note | ✅ | 846 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-017 | Disabled "Soon" row | ⏳ | 847 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-018 | BLOCKS 8 cards | ✅ | 848 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-019 | Block thumbnails | 🟡 | 849 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-020 | Hover pill + preview card; drag cards (A21–A22) | ✅ | 850–851 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-021 | Token-bound blocks footnote | ✅ | 852 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-022 | Blocks no longer in Add | ❌ | 853 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-AD-023 | "✦ Generate a block" row | ✅ | 854 | Pages, Templates, Layers, History, Activity · Add, Components, AI | DEFERRED-BY-DECISION |
| F-AD-024 | BUILT-IN components (14) | ✅ | 855 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-025 | Saved components + From library + Manage › (A27–A29) | ✅ | 856–858 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-026 | Saved count vs Components panel (L1-024) | 🐞 | 859 | Pages, Templates, Layers, History, Activity · Add, Components, AI | CONFLICT |
| F-AD-027 | "Page templates ›" link | ✅ | 860 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-028 | First-use tip card | 🟡 | 861 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-AD-029 | Tips strip; Quick Picks callout (A33–A34) | ❌ | 862–863 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-AD-030 | Loading / "Couldn't load library" states | ❌ | 864 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-031 | Click-insert placement | ✅ | 865 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-032 | Insert toasts | ✅ | 866 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-033 | Replace with block… | ✅ | 867 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-034 | Media insert → Assets | 🟡 | 868 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-035 | Doors into Add | ✅ | 869 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-036 | Add keyboard | ✅ | 870 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-037 | Block default-content copy debt | 🟡 | 871 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-AD-038 | Live embeds + runtimes | ✅ | 872 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-AD-039 | Generate a block (B1–B5) | ✅ | 878–882 | Pages, Templates, Layers, History, Activity · Add, Components, AI | DEFERRED-BY-DECISION |
| F-AD-040 | Quick-add Element Picker modal | ❌ | 888 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-AD-041 | Components entry points | ✅ | 894 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-042 | "‹ Add" back row | ✅ | 895 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-043 | Components list view | ✅ | 896 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-044 | Detach-all notice | ✅ | 897 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-AD-045 | Empty / unavailable / error | ✅ | 898 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-AD-046 | "+ Create component" | ✅ | 899 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-047 | Create component modal | ✅ | 900 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-048 | Old create fields | ❌ | 901 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-AD-049 | No-selection pre-check | ✅ | 902 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-050 | Page-scoped masters | ✅ | 903 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-051 | Detail header/rename + Insert (D11–D12) | ✅ | 904–905 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-052 | Update from selection… | ✅ | 906 | Pages, Templates, Layers, History, Activity · Add, Components, AI | CONFLICT |
| F-AD-053 | Instance edits survive master update | 🟡 | 907 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-AD-054 | Detach all | ✅ | 908 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-055 | Duplicate master | ✅ | 909 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-056 | Delete master | ✅ | 910 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-057 | Master preview thumbnail | 🐞 | 911 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-AD-058 | STRUCTURE + USED ON (D19–D20) | ✅ | 912–913 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-059 | No in-place master editing | 🐞 | 914 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-AD-060 | Inspector ComponentRow + override dots (D22–D23) | ✅ | 915–916 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-061 | Instance root hides Layout/Text | ✅ | 917 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-AD-062 | Layers instance badge | ✅ | 918 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-063 | Variant authoring | ⏳ | 919 | Pages, Templates, Layers, History, Activity · Add, Components, AI | DEFERRED-BY-DECISION |
| F-AD-064 | Rename/Variant modals; JSON export (D27–D28) | ❌ | 920–921 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-AD-065 | Server mirror + workspace library | ✅ | 922 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-066 | 100-component cap | 🟡 | 923 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-067 | 27-component DS catalogue | 🟡 | 929 | Pages, Templates, Layers, History, Activity · Add, Components, AI | PARTIAL |
| F-AD-068 | Brand › Components summary | ❌ | 930 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-AD-069 | Brand › Component styles | 🟡 | 931 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |
| F-AD-070 | Draggable DS card grid | ❌ | 932 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-AD-071 | AI placement + doors (F1–F2) | ✅ | 938–939 | Pages, Templates, Layers, History, Activity · Add, Components, AI | DEFERRED-BY-DECISION |
| F-AD-072 | Removed AI doors | ❌ | 940 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-AD-073 | Scope band … pre-run note (F4–F9) | ✅ | 941–946 | Pages, Templates, Layers, History, Activity · Add, Components, AI | DEFERRED-BY-DECISION |
| F-AD-074 | Chat thread; Auto-apply (F10–F11) | ❌ | 947–948 | Pages, Templates, Layers, History, Activity · Add, Components, AI | REMOVED-N/A |
| F-AD-075 | Plan review … privileged confirm (F12–F20) | ✅ | 949–957 | Pages, Templates, Layers, History, Activity · Add, Components, AI | DEFERRED-BY-DECISION |
| F-AD-076 | One-click content actions | 🟡 | 958 | Pages, Templates, Layers, History, Activity · Add, Components, AI | DEFERRED-BY-DECISION |
| F-AD-077 | AI helpers elsewhere | ✅ | 959 | Pages, Templates, Layers, History, Activity · Add, Components, AI | DEFERRED-BY-DECISION |
| F-AD-078 | Build AI workspace spec | ⏳ | 960 | Pages, Templates, Layers, History, Activity · Add, Components, AI | DEFERRED-BY-DECISION |
| F-AD-079 | Engine element types | ✅ | 966 | Pages, Templates, Layers, History, Activity · Add, Components, AI | COVERED |

## Assets, CMS, Forms

INV §5 lines 998–1256 · 129 rows

| FID | Feature | INV status | INV line | Parent module | Coverage |
|---|---|---|---|---|---|
| F-AS-01 | Drawer header + count + ⋯ Select | ✅ | 1001 | Assets, CMS, Forms | COVERED |
| F-AS-02 | Panel search | ✅ | 1002 | Assets, CMS, Forms | COVERED |
| F-AS-03 | Server search-scope line | ✅ | 1003 | Assets, CMS, Forms | COVERED |
| F-AS-04 | "Manage assets ›" door | ✅ | 1004 | Assets, CMS, Forms | COVERED |
| F-AS-05 | Filter ▾ type + folder | ✅ | 1005 | Assets, CMS, Forms | COVERED |
| F-AS-06 | Grid + Load more | ✅ | 1006 | Assets, CMS, Forms | COVERED |
| F-AS-07 | Click-insert / replace selected | ✅ | 1007 | Assets, CMS, Forms | COVERED |
| F-AS-08 | Drag asset onto canvas | ✅ | 1008 | Assets, CMS, Forms | PARTIAL |
| F-AS-09 | OS file drop on canvas | ✅ | 1009 | Assets, CMS, Forms | COVERED |
| F-AS-10 | Hover-to-select check | ✅ | 1010 | Assets, CMS, Forms | PARTIAL |
| F-AS-11 | Bulk bar | ✅ | 1011 | Assets, CMS, Forms | PARTIAL |
| F-AS-12 | Upload split button | ✅ | 1012 | Assets, CMS, Forms | COVERED |
| F-AS-13 | Drop strip, progress, failed rows | ✅ | 1013 | Assets, CMS, Forms | COVERED |
| F-AS-14 | Quota band | ✅ | 1014 | Assets, CMS, Forms | CONFLICT |
| F-AS-15 | Replacement upload modal + banner | ✅ | 1015 | Assets, CMS, Forms | PARTIAL |
| F-AS-16 | Empty/error/loading/no-match | ✅ | 1016 | Assets, CMS, Forms | COVERED |
| F-AS-17 | Pick mode (one picker) | ✅ | 1017 | Assets, CMS, Forms | COVERED |
| F-AS-18 | Viewer read-only gating | ✅ | 1018 | Assets, CMS, Forms | COVERED |
| F-AS-19 | Device-only insert warning | 🐞 | 1019 | Assets, CMS, Forms | COVERED |
| F-AS-20 | APPLIED badge / lock overlay on cards | ⏳ | 1020 | Assets, CMS, Forms | DEF (FD-IA-09 Defer) |
| F-AS-21 | Detail hub: preview, alt, Generate | ✅ | 1025 | Assets, CMS, Forms | COVERED |
| F-AS-22 | Hub rows (Used in/Versions/Edit/Optimise/Replace) | ✅ | 1026 | Assets, CMS, Forms | COVERED |
| F-AS-23 | Hub action list | ✅ | 1027 | Assets, CMS, Forms | COVERED |
| F-AS-24 | Versions + inline restore | ✅ | 1028 | Assets, CMS, Forms | PARTIAL |
| F-AS-25 | Used-in + Go | ✅ | 1029 | Assets, CMS, Forms | COVERED |
| F-AS-26 | Drawer Optimise panel | ❌ | 1030 | Assets, CMS, Forms | REMOVED-N/A |
| F-AS-27 | Replace across site | ✅ | 1031 | Assets, CMS, Forms | COVERED |
| F-AS-28 | Icon browser drill-in | ✅ | 1036 | Assets, CMS, Forms | PARTIAL |
| F-AS-29 | "Select Icon" modal (Inspector) | ✅ | 1037 | Assets, CMS, Forms | PARTIAL |
| F-AS-30 | Drawer stock overlay | ❌ | 1038 | Assets, CMS, Forms | REMOVED-N/A |
| F-AS-31 | Stock modal | ✅ | 1039 | Assets, CMS, Forms | PARTIAL |
| F-AS-32 | Stock: one provider missing | 🟡 | 1040 | Assets, CMS, Forms | PARTIAL |
| F-AS-33 | Stock save loses alt/credit | 🐞 | 1041 | Assets, CMS, Forms | COVERED |
| F-AS-34 | Site fonts modal | ✅ | 1042 | Assets, CMS, Forms | COVERED |
| F-AS-35 | Library top bar | ✅ | 1047 | Assets, CMS, Forms | COVERED |
| F-AS-36 | Folder rail | ✅ | 1048 | Assets, CMS, Forms | COVERED |
| F-AS-37 | Folder delete confirm | ✅ | 1049 | Assets, CMS, Forms | PARTIAL |
| F-AS-38 | Trash row | ❌ | 1050 | Assets, CMS, Forms | REMOVED-N/A |
| F-AS-39 | Grid toolbar | 🟡 | 1051 | Assets, CMS, Forms | COVERED |
| F-AS-40 | List/grid views, drop zone | ✅ | 1052 | Assets, CMS, Forms | PARTIAL |
| F-AS-41 | Details rail | ✅ | 1053 | Assets, CMS, Forms | COVERED |
| F-AS-42 | Regenerate alt local-only bug | 🐞 | 1054 | Assets, CMS, Forms | DEF (SC-21) |
| F-AS-43 | Context menu | ✅ | 1055 | Assets, CMS, Forms | COVERED |
| F-AS-44 | Library modals (13) | ✅ | 1056 | Assets, CMS, Forms | PARTIAL |
| F-AS-45 | Confirm delete + 8s Undo | ✅ | 1057 | Assets, CMS, Forms | COVERED |
| F-AS-46 | Status bar | ✅ | 1058 | Assets, CMS, Forms | COVERED |
| F-AS-47 | Image editor | ✅ | 1063 | Assets, CMS, Forms | COVERED |
| F-AS-48 | Saved/discard/save-failed dialogs | ✅ | 1064 | Assets, CMS, Forms | PARTIAL |
| F-AS-49 | Output formats | ✅ | 1065 | Assets, CMS, Forms | COVERED |
| F-AS-50 | Accepted kinds + limits | 🟡 | 1070 | Assets, CMS, Forms | CONFLICT |
| F-AS-51 | Upload → Blob → createAsset | 🟡 | 1071 | Assets, CMS, Forms | COVERED |
| F-AS-52 | Upload progress | 🟡 | 1072 | Assets, CMS, Forms | CONFLICT |
| F-AS-53 | Auto alt on upload | 🟡 | 1073 | Assets, CMS, Forms | DEF (SC-21) |
| F-AS-54 | Unconfigured alt provider | 🟡 | 1074 | Assets, CMS, Forms | DEF (SC-21) |
| F-AS-55 | Server quota trusts declared bytes | 🐞 | 1075 | Assets, CMS, Forms | PARTIAL |
| F-AS-56 | Image loss after failed registration | 🐞 | 1076 | Assets, CMS, Forms | COVERED |
| F-AS-57 | Library scope = user | 🟡 | 1077 | Assets, CMS, Forms | COVERED |
| F-CM-01 | Rail entry | ✅ | 1086 | Assets, CMS, Forms | COVERED |
| F-CM-02 | Drawer root | ✅ | 1087 | Assets, CMS, Forms | COVERED |
| F-CM-03 | Loading / error | ✅ | 1088 | Assets, CMS, Forms | COVERED |
| F-CM-04 | Drawer empty state | 🐞 | 1089 | Assets, CMS, Forms | PARTIAL |
| F-CM-05 | Workspace takeover empty centre | 🐞 | 1090 | Assets, CMS, Forms | PARTIAL |
| F-CM-06 | Back to canvas | ✅ | 1091 | Assets, CMS, Forms | COVERED |
| F-CM-07 | ⌘K "Manage CMS records" | ✅ | 1092 | Assets, CMS, Forms | PARTIAL |
| F-CM-08 | Collection header, tabs, ⋯ | 🟡 | 1097 | Assets, CMS, Forms | COVERED |
| F-CM-09 | Sheets / Airtable | ⏳ | 1098 | Assets, CMS, Forms | COVERED |
| F-CM-10 | Create Collection modal | 🐞 | 1099 | Assets, CMS, Forms | PARTIAL |
| F-CM-11 | Two-step wizard | ❌ | 1100 | Assets, CMS, Forms | REMOVED-N/A |
| F-CM-12 | Collection settings | ✅ | 1101 | Assets, CMS, Forms | COVERED |
| F-CM-13 | Products preset | ✅ | 1102 | Assets, CMS, Forms | CONFLICT |
| F-CM-14 | Records table | 🟡 | 1107 | Assets, CMS, Forms | COVERED |
| F-CM-15 | Records search | ✅ | 1108 | Assets, CMS, Forms | COVERED |
| F-CM-16 | Empty collection states | ✅ | 1109 | Assets, CMS, Forms | COVERED |
| F-CM-17 | Record sheet | ✅ | 1110 | Assets, CMS, Forms | COVERED |
| F-CM-18 | Record footer (eligibility colour bug) | 🐞 | 1111 | Assets, CMS, Forms | PARTIAL |
| F-CM-19 | Record previews | ✅ | 1112 | Assets, CMS, Forms | COVERED |
| F-CM-20 | Delete record (new id) | 🟡 | 1113 | Assets, CMS, Forms | COVERED |
| F-CM-21 | Conflict / gone banners | 🟡 | 1114 | Assets, CMS, Forms | PARTIAL |
| F-CM-22 | In-drawer views | ❌ | 1115 | Assets, CMS, Forms | REMOVED-N/A |
| F-CM-23 | Fields table | ✅ | 1120 | Assets, CMS, Forms | COVERED |
| F-CM-24 | + Add field | ✅ | 1121 | Assets, CMS, Forms | COVERED |
| F-CM-25 | Field inspector | ✅ | 1122 | Assets, CMS, Forms | COVERED |
| F-CM-26 | Delete field | ✅ | 1123 | Assets, CMS, Forms | COVERED |
| F-CM-27 | Field-type coverage 16/10/9 | 🟡 | 1124 | Assets, CMS, Forms | PARTIAL |
| F-CM-28 | Dynamic pages pane | ✅ | 1129 | Assets, CMS, Forms | COVERED |
| F-CM-29 | Server render + pre-publish | ✅ | 1130 | Assets, CMS, Forms | COVERED |
| F-CM-30 | Pages-panel dynamic count | 🐞 | 1131 | Assets, CMS, Forms | PARTIAL |
| F-CM-31 | Sources (lost on reload) | 🐞 | 1136 | Assets, CMS, Forms | COVERED |
| F-CM-32 | Variables (canvas braces) | 🟡 | 1137 | Assets, CMS, Forms | PARTIAL |
| F-CM-33 | Conditions (no-op) | 🐞 | 1138 | Assets, CMS, Forms | COVERED |
| F-CM-34 | Inspector CMS binding | ✅ | 1143 | Assets, CMS, Forms | COVERED |
| F-CM-35 | Binding popover | ❌ | 1144 | Assets, CMS, Forms | REMOVED-N/A |
| F-CM-36 | Bound chip | ✅ | 1145 | Assets, CMS, Forms | COVERED |
| F-CM-37 | Canvas follows publish | ✅ | 1146 | Assets, CMS, Forms | COVERED |
| F-CM-38 | Collection list | 🟡 | 1147 | Assets, CMS, Forms | COVERED |
| F-CM-39 | Rich text export | ✅ | 1148 | Assets, CMS, Forms | COVERED |
| F-CM-40 | Handlebars/Liquid mode | 🧪 | 1149 | Assets, CMS, Forms | DEF (FD-IA-09 Defer) |
| F-CM-41 | Server authority | ✅ | 1154 | Assets, CMS, Forms | PARTIAL |
| F-CM-42 | Outbox + retry toast | ✅ | 1155 | Assets, CMS, Forms | PARTIAL |
| F-CM-43 | Conflict handling | 🟡 | 1156 | Assets, CMS, Forms | PARTIAL |
| F-CM-44 | Gone / invalid (local-only collection) | 🟡 | 1157 | Assets, CMS, Forms | PARTIAL |
| F-CM-45 | Soft-delete tombstones | ✅ | 1158 | Assets, CMS, Forms | COVERED |
| F-CM-46 | Publish gate + snapshot | ✅ | 1159 | Assets, CMS, Forms | COVERED |
| F-CM-47 | Import CSV | ✅ | 1164 | Assets, CMS, Forms | COVERED |
| F-CM-48 | Import JSON | ✅ | 1165 | Assets, CMS, Forms | COVERED |
| F-CM-49 | Records modal | ❌ | 1166 | Assets, CMS, Forms | REMOVED-N/A |
| F-FM-01 | Form block | ✅ | 1175 | Assets, CMS, Forms | PARTIAL |
| F-FM-02 | Contact Form component | ✅ | 1176 | Assets, CMS, Forms | PARTIAL |
| F-FM-03 | Contact section empty box | 🐞 | 1177 | Assets, CMS, Forms | PARTIAL |
| F-FM-04 | Field elements list | ✅ | 1178 | Assets, CMS, Forms | COVERED |
| F-FM-05 | Password field on public forms | 🐞 | 1179 | Assets, CMS, Forms | PARTIAL |
| F-FM-06 | Upload field | ❌ | 1180 | Assets, CMS, Forms | REMOVED-N/A |
| F-FM-07 | Fields section | 🟡 | 1185 | Assets, CMS, Forms | PARTIAL |
| F-FM-08 | Per-field inspector | ✅ | 1186 | Assets, CMS, Forms | PARTIAL |
| F-FM-09 | After submit | ✅ | 1187 | Assets, CMS, Forms | PARTIAL |
| F-FM-10 | Old Store/Webhook/Email settings | ❌ | 1188 | Assets, CMS, Forms | REMOVED-N/A |
| F-FM-11 | Send to (ADMIN) | ✅ | 1189 | Assets, CMS, Forms | PARTIAL |
| F-FM-12 | Spam protection toggle | 🟡 | 1190 | Assets, CMS, Forms | CONFLICT |
| F-FM-13 | Publish wiring | ✅ | 1195 | Assets, CMS, Forms | PARTIAL |
| F-FM-14 | Public endpoint | ✅ | 1196 | Assets, CMS, Forms | PARTIAL |
| F-FM-15 | Visitor outcome | ✅ | 1197 | Assets, CMS, Forms | PARTIAL |
| F-FM-16 | Spam / abuse limits | 🟡 | 1198 | Assets, CMS, Forms | PARTIAL |
| F-FM-17 | Notifications | ✅ | 1199 | Assets, CMS, Forms | PARTIAL |
| F-FM-18 | Unified inbox | ✅ | 1204 | Assets, CMS, Forms | COVERED |
| F-FM-19 | Inbox filters / Unspam / Unarchive | ❌ | 1205 | Assets, CMS, Forms | COVERED |
| F-FM-20 | "Configure in Inspector ›" (pageId) | 🐞 | 1206 | Assets, CMS, Forms | PARTIAL |
| F-FM-21 | "Sent from <url>" | 🐞 | 1207 | Assets, CMS, Forms | PARTIAL |
| F-FM-22 | 365-day retention | ✅ | 1208 | Assets, CMS, Forms | PARTIAL |
| F-FM-23 | Engine FormHandler unused | 🟡 | 1209 | Assets, CMS, Forms | PARTIAL |

## Site settings, Publish, Review, Export, E-commerce, Animation, Sync

INV §6 lines 1257–1550 · 150 rows

| FID | Feature | INV status | INV line | Parent module | Coverage |
|---|---|---|---|---|---|
| F-ST-S1 | Full-pane Settings shell | ✅ | 1261 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S2 | Phase B nav IA | ✅ | 1262 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S3 | Old Fonts & colours / Export doors | ❌ | 1263 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | REMOVED-N/A |
| F-ST-S4 | Scope line per screen | ✅ | 1264 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S5 | Role-based read-only screens | ✅ | 1265 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S6 | Role foot + Permissions dialog | ✅ | 1266 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-ST-S7 | Search Mode | ✅ | 1267 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-ST-S8 | Footer save bar (conditional) | ✅ | 1268 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S9 | "Saved · applies on next publish" toast | ✅ | 1269 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S10 | Unsaved settings guard | ✅ | 1270 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S11 | Escape leaves Settings | ✅ | 1271 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S12 | Per-screen save-error banner | ✅ | 1272 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S13 | Load/error cards blame "your connection" | 🐞 | 1273 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | OMITTED |
| F-ST-S14 | Remembered screen + deep links | ✅ | 1274 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S15 | Plan gate LockedScreen | 🔒 | 1275 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S16 | Covered editor chrome focusable | 🐞 | 1276 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S17 | Inconsistent exits across full-page tools | 🐞 | 1277 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S18 | Overview group cards | ✅ | 1283 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-ST-S19 | Needs attention card | ✅ | 1284 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-ST-S20 | Site-state strips (archived / deletion) | ✅ | 1285 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-ST-S21 | General · Site identity | ✅ | 1291 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-ST-S22 | General · premature validation | 🐞 | 1292 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | OMITTED |
| F-ST-S23 | Site URL slug + confirm | ✅ | 1293 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S24 | Language/social/grid/snap moved | ❌ | 1294 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | REMOVED-N/A |
| F-ST-S25 | Languages · default locale (footer) | ✅ | 1295 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S26 | Languages · locales table (immediate) | ✅ | 1296 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S27 | Languages · auto-redirect by browser | ❌ | 1297 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | REMOVED-N/A |
| F-ST-S28–S30 | SEO defaults, social profiles ×6, indexing/robots | ✅ | 1303–1305 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S31 | Per-page overrides strip | ✅ | 1306 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S32 | Yoast-level SEO | ⏳ | 1307 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | DEFERRED-BY-DECISION |
| F-ST-S33 | Domains list | ✅ | 1313 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S34 | Add a domain dialog | 🟡 | 1314 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-ST-S35 | Set as primary | ✅ | 1315 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-ST-S36 | Manage DNS view | ✅ | 1316 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S37 | Redirect rules table | ✅ | 1317 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | CONFLICT |
| F-ST-S38–S40 | Redirect CSV, 404 suggester, slug repair card | ✅ | 1318–1320 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S41 | Access · password protection | 🟡 | 1321 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-ST-S42 | Access · share links door | ✅ | 1322 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S43–S44 | Analytics providers + Verify dialog | ✅ | 1328–1329 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S45 | Analytics consent toggle | ❌ | 1330 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | REMOVED-N/A |
| F-ST-S46 | Form submissions inbox | ✅ | 1331 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S47 | Forms lifecycle edge (pre-publish submissions) | 🐞 | 1332 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | OMITTED |
| F-ST-S48 | Custom code | 🔒 | 1338 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S49 | Security headers | ✅ | 1339 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S50 | Danger zone · Archive/Unarchive | ✅ | 1340 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | CONFLICT |
| F-ST-S51 | Danger zone · Transfer | ✅ | 1341 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-ST-S52 | Danger zone · Delete site | ✅ | 1342 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | CONFLICT |
| F-ST-S53 | Workspace doors | ✅ | 1343 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-ST-S54 | Integrations screen | ❌ | 1344 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | REMOVED-N/A |
| F-ST-S55 | Webhooks screen | ❌ | 1345 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | REMOVED-N/A |
| F-ST-S56 | Settings-server authz | ✅ | 1346 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P1 | Pre-publish checks in panel | ✅ | 1353 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P2 | New check rows (Fix dead ends) | 🟡 | 1354 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P3 | "SEO configured" check can't clear | 🐞 | 1355 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-P4 | Client approval row | ✅ | 1356 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P5 | Release to / Environment | 🟡 | 1357 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P6 | Changes in this session | ✅ | 1358 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P7 | Last deploy | ✅ | 1359 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P8 | Panel ⋯ menu | 🟡 | 1360 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P9 | Unpublish confirm | ✅ | 1361 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P10 | Single CTA + gate reason | ✅ | 1362 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P11 | Progress block | ✅ | 1363 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P12 | Cancel running publish | 🟡 | 1364 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P13 | Failure block | ✅ | 1365 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P14 | Publish log modal | ✅ | 1366 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-P15 | Reconnect Vercel modal | ✅ | 1367 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-P16 | Just published | 🟡 | 1368 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P17 | Simulated publish notice | 🧪 | 1369 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-P18 | Flag off / deploy unreachable | 🚩 | 1370 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-P19 | Legal line | ✅ | 1371 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | OMITTED |
| F-PB-W1 | Two-step wizard | ❌ | 1377 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | REMOVED-N/A |
| F-PB-W2 | "Publish to production?" confirm | ✅ | 1378 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-W3 | Checks-failed blocks confirm | ✅ | 1379 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-W4–W6 | Open-errors gate, approval gate, stale approval | ✅ | 1380–1382 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-W7 | Scheduled publish | ⏳ | 1383 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | DEFERRED-BY-DECISION |
| F-PB-W8 | Topbar publish opens confirm over panel | 🐞 | 1384 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-H1 | Published versions list | ✅ | 1390 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-H2 | Republish (rollback) | ✅ | 1391 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-H3 | Version details overlay | ✅ | 1392 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-H4 | One Compare host | ✅ | 1393 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-R1 | Review availability (agency_layer) | 🚩 | 1399 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-R2–R7 | Status line, team comments, thread groups, Locate/Copy link, Next ›, Reattach | ✅ | 1400–1405 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-R8 | Note composer | 🟡 | 1406 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-R9–R10 | Review ⋯ menu, Round history modal | ✅ | 1407–1408 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-R11 | Revoke/withdraw confirm (+cross-site authz hole) | 🐞 | 1409 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-R12 | Send for review popover | ✅ | 1410 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-R13 | Compare with approved | ✅ | 1411 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-R14 | Client `/review/<token>` page | 🟡 | 1412 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-R15 | Resolve as workspace ADMIN (authz) | 🐞 | 1413 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-R16 | Hand a comment to AI | ⏳ | 1414 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | DEFERRED-BY-DECISION |
| F-PB-X1 | Export modal + entry points | ✅ | 1420 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-X2 | Formats (Vue/Next "Soon") | ⏳ | 1421 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | CONFLICT |
| F-PB-X3–X7 | Preview/Code/Options tabs, Preparing/Ready/Failed, ZIP contents, React export, fidelity | ✅ | 1422–1426 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-C1 | Set Up Products Collection modal | 🟡 | 1432 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | CONFLICT |
| F-PB-C2 | Cart + Stripe checkout | ⏳ | 1433 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | DEFERRED-BY-DECISION |
| F-PB-N1 | Standalone Animation section | ❌ | 1439 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | REMOVED-N/A |
| F-PB-N2–N5 | Animation row, Animation editor, Interactions list + drill-in, trigger picker | ✅ | 1440–1443 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-N6 | Interaction editor (target/loop/reverse) | 🟡 | 1444 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-N7 | Published interaction runtime | 🟡 | 1445 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-N8 | Transform & motion section | ✅ | 1446 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-G1 | Email marketing simulation | ❌ | 1452 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | REMOVED-N/A |
| F-PB-G2 | In-browser form/email service | ⏳ | 1453 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | DEFERRED-BY-DECISION |
| F-PB-Y1 | Local autosave (non-dashboard) | ✅ | 1459 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-Y2 | Dashboard autosave (+BK-19 session restore never saves) | 🟡 | 1460 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-Y3 | Auto-retry failed save | ✅ | 1461 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y4 | Autosave held during conflict | ✅ | 1462 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y5 | Secrets kept out of browser storage | ✅ | 1463 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | OMITTED |
| F-PB-Y6–Y7 | Escape-cancelled resize undo; keyboard resize NaNpx | 🐞 | 1464–1465 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y8 | Save refused (never loaded / site gone) | ✅ | 1466 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y9 | Save conflict dialog (+BK-59 no pre-overwrite snapshot) | 🟡 | 1467 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-Y10 | Serialized saves | ✅ | 1468 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | OMITTED |
| F-PB-Y11 | Settings mirror refused | ✅ | 1469 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | OMITTED |
| F-PB-Y12 | CMS bindings too large | 🟡 | 1470 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | OMITTED |
| F-PB-Y13 | Save pill | 🐞 | 1471 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y14 | Save-failed card | ✅ | 1472 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y15 | Publish blocked after failed save | ✅ | 1473 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y16 | Open in another tab notice | ✅ | 1474 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y17 | Unsaved-work copy per site | ✅ | 1475 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y18–Y19 | "Restore my edits" / Retry ⌘S overwrite newer server work (P0 BK-04) | 🐞 | 1476–1477 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | CONFLICT |
| F-PB-Y20 | View-mode variant | ✅ | 1478 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y21 | Recovery banner (crash marker) | 🟡 | 1479 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-Y22 | Toast closes once used | ✅ | 1480 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y23 | Shared mirror retry queue | ✅ | 1481 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y24 | Exit guard on pending mirrors | ✅ | 1482 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y25 | Persisted CMS outbox | ✅ | 1483 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y26 | CMS hydration error copy | ✅ | 1484 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | OMITTED |
| F-PB-Y27 | Saved-templates hydration states | ❌ | 1485 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y28 | Project save queue across reload | 🟡 | 1486 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | DEFERRED-BY-DECISION |
| F-PB-Y29 | Crash marker + recheck | ✅ | 1487 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y30 | Load-error banner | ✅ | 1488 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y31 | Local version history (50) | ✅ | 1489 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-Y32 | Storage-full recovery | ✅ | 1490 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | OMITTED |
| F-PB-Y33 | Versions export/import JSON | ❌ | 1491 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | REMOVED-N/A |
| F-PB-Y34 | Server versions + rename | ✅ | 1492 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y35 | Migration progress modal | ✅ | 1493 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y36 | "Project update failed" toast | ✅ | 1494 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-Y37 | Brand read-only after failed migration | ✅ | 1495 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y38 | Notifications bell | ✅ | 1496 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y39 | Role gates disabled with reason | ✅ | 1497 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y40 | Media upload local fallback + retry | 🟡 | 1498 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y41 | AI alt text auto | ✅ | 1499 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | DEFERRED-BY-DECISION |
| F-PB-Y42 | Asset versions | ✅ | 1500 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-Y43 | Unsaved tab-switch dialog | ✅ | 1501 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-Y44 | Site-scope authz on save/sync | ✅ | 1502 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-Y45 | Site-scope authz holes (P0) | 🐞 | 1503 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | PARTIAL |
| F-PB-F1 | FEATURE_PUBLISH | 🚩 | 1509 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-F2 | FEATURE_DS_AI | 🚩 | 1510 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | DEFERRED-BY-DECISION |
| F-PB-F3 | FEATURE_COLLAB | 🚩 | 1511 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | COVERED |
| F-PB-F4 | Dev build (IS_DEV_BUILD) | 🧪 | 1512 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | OMITTED |
| F-PB-F5 | Legacy static flags | ❌ | 1513 | Site settings, Publish, Review, Export, E-commerce, Animation, Sync | REMOVED-N/A |

## Inspector · Brand workspace

INV §7–8 lines 1551–1881 · 187 rows

| FID | Feature | INV status | INV line | Parent module | Coverage |
|---|---|---|---|---|---|
| F-IN-01 | Tab strip | ✅ 🆕 | 1555 | Inspector · Brand workspace | CONFLICT |
| F-IN-02 | Flat section list (09-16) | ❌ | 1556 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-03 | Page panel | ✅ 🆕 | 1557 | Inspector · Brand workspace | COVERED |
| F-IN-04 | "Select something" empty prompt | ❌ | 1558 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-05 | Page panel header actions | 🟡 | 1559 | Inspector · Brand workspace | PARTIAL |
| F-IN-06 | Loading skeleton | ✅ | 1560 | Inspector · Brand workspace | COVERED |
| F-IN-07 | "Template applied!" banner | ✅ | 1561 | Inspector · Brand workspace | PARTIAL |
| F-IN-08 | Error boundary | ✅ | 1562 | Inspector · Brand workspace | COVERED |
| F-IN-09 | AI-run takeover | ✅ | 1563 | Inspector · Brand workspace | DEFERRED-BY-DECISION |
| F-IN-10 | Whole-site takeover | ❌ | 1564 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-11 | Theme-toggle inspector | ✅ 🆕 | 1565 | Inspector · Brand workspace | COVERED |
| F-IN-12 | Read-only status line | ✅ 🆕 | 1566 | Inspector · Brand workspace | COVERED |
| F-IN-13 | Section display modes | ✅ 🆕 | 1567 | Inspector · Brand workspace | COVERED |
| F-IN-14 | Per-section error band | ✅ 🆕 | 1568 | Inspector · Brand workspace | COVERED |
| F-IN-15 | Scroll memory | ✅ | 1569 | Inspector · Brand workspace | COVERED |
| F-IN-16 | SR selection announcement | ✅ | 1570 | Inspector · Brand workspace | COVERED |
| F-IN-17 | "N of M sections apply" footer | ❌ | 1571 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-18 | density=fewer mode | ❌ | 1572 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-19 | "More settings" disclosure | 🐞 | 1573 | Inspector · Brand workspace | CONFLICT |
| F-IN-20 | ⌘K Jump to property | ✅ 🆕 | 1574 | Inspector · Brand workspace | COVERED |
| F-IN-21 | Hide inspector | ✅ 🆕 | 1575 | Inspector · Brand workspace | COVERED |
| F-IN-22 | Breadcrumb path | ✅ 🆕 | 1581 | Inspector · Brand workspace | COVERED |
| F-IN-23 | Editable element name | ✅ 🆕 | 1582 | Inspector · Brand workspace | COVERED |
| F-IN-24 | ✦ AI chip | ✅ | 1583 | Inspector · Brand workspace | DEFERRED-BY-DECISION |
| F-IN-25 | Crosshair pick | ❌ | 1584 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-26 | Select parent button | ❌ | 1585 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-27 | Header bind popover | ❌ | 1586 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-28 | Status marks row | ✅ 🆕 | 1587 | Inspector · Brand workspace | COVERED |
| F-IN-29 | ⋯ Element actions menu | ✅ | 1588 | Inspector · Brand workspace | PARTIAL |
| F-IN-30 | Apply style confirm | ✅ 🆕 | 1589 | Inspector · Brand workspace | COVERED |
| F-IN-31 | Inspector delete modal | ❌ | 1590 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-32 | Context row placement | ✅ 🆕 | 1596 | Inspector · Brand workspace | COVERED |
| F-IN-33 | Scope pill This/All/Whole site | ❌ | 1597 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-34 | State chip | ✅ | 1598 | Inspector · Brand workspace | COVERED |
| F-IN-35 | State override line | ✅ 🆕 | 1599 | Inspector · Brand workspace | PARTIAL |
| F-IN-36 | Breakpoint picker in inspector | ❌ | 1600 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-37 | Breakpoint revert line | ✅ 🆕 | 1601 | Inspector · Brand workspace | PARTIAL |
| F-IN-38 | Field override dot | ✅ 🆕 | 1602 | Inspector · Brand workspace | CONFLICT |
| F-IN-39 | Override info repeated | 🐞 | 1603 | Inspector · Brand workspace | CONFLICT |
| F-IN-40 | "Editing :hover" banner | ❌ | 1604 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-41 | Detach pill in context row | ❌ | 1605 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-42 | Effective values in fields | 🐞 | 1606 | Inspector · Brand workspace | COVERED |
| F-IN-43 | Multi header | ✅ 🆕 | 1612 | Inspector · Brand workspace | COVERED |
| F-IN-44 | Align/Distribute/Group bar | ✅ | 1613 | Inspector · Brand workspace | COVERED |
| F-IN-45 | Intersection + "Mixed" | ✅ 🆕 | 1614 | Inspector · Brand workspace | COVERED |
| F-IN-46 | 5-row batch panel | ❌ | 1615 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-47 | Capability table | ✅ 🆕 | 1623 | Inspector · Brand workspace | COVERED |
| F-IN-48a | Text types | ✅ | 1624 | Inspector · Brand workspace | COVERED |
| F-IN-48b | Button | ✅ | 1625 | Inspector · Brand workspace | PARTIAL |
| F-IN-48c | Form fields | ✅ | 1626 | Inspector · Brand workspace | COVERED |
| F-IN-48d | Media types | ✅ | 1627 | Inspector · Brand workspace | COVERED |
| F-IN-48e | Spacer/divider | ✅ | 1628 | Inspector · Brand workspace | PARTIAL |
| F-IN-48f | Widgets | ✅ | 1629 | Inspector · Brand workspace | PARTIAL |
| F-IN-48g | Layout primitives | ✅ | 1630 | Inspector · Brand workspace | COVERED |
| F-IN-48h | Containers | ✅ | 1631 | Inspector · Brand workspace | COVERED |
| F-IN-48i | Structural child | ✅ 🆕 | 1632 | Inspector · Brand workspace | PARTIAL |
| F-IN-48j | form/slider/collection-list | ✅ 🆕 | 1633 | Inspector · Brand workspace | COVERED |
| F-IN-48k | Component instance root | ✅ 🆕 | 1634 | Inspector · Brand workspace | COVERED |
| F-IN-49 | Component row | 🟡 | 1640 | Inspector · Brand workspace | CONFLICT |
| F-IN-50 | Type block frame | ✅ 🆕 | 1641 | Inspector · Brand workspace | PARTIAL |
| F-IN-51 | Heading block | ✅ 🆕 | 1642 | Inspector · Brand workspace | CONFLICT |
| F-IN-52 | Text/Paragraph/Link/Label block | ✅ 🆕 | 1643 | Inspector · Brand workspace | PARTIAL |
| F-IN-53 | Button block | ✅ | 1644 | Inspector · Brand workspace | PARTIAL |
| F-IN-54 | Input/Textarea/Select/Upload | ✅ | 1645 | Inspector · Brand workspace | COVERED |
| F-IN-55 | Checkbox/Radio/Switch | 🐞 | 1646 | Inspector · Brand workspace | COVERED |
| F-IN-56 | Image block | ✅ | 1647 | Inspector · Brand workspace | COVERED |
| F-IN-57 | Video block | ✅ | 1648 | Inspector · Brand workspace | COVERED |
| F-IN-58 | Audio block | ✅ 🆕 | 1649 | Inspector · Brand workspace | PARTIAL |
| F-IN-59 | SVG block | ✅ | 1650 | Inspector · Brand workspace | PARTIAL |
| F-IN-60 | Icon block | ✅ | 1651 | Inspector · Brand workspace | COVERED |
| F-IN-61 | Video embed | ✅ 🆕 | 1652 | Inspector · Brand workspace | PARTIAL |
| F-IN-62 | Map/Lottie | ✅ 🆕 | 1653 | Inspector · Brand workspace | PARTIAL |
| F-IN-63 | Countdown | 🟡 | 1654 | Inspector · Brand workspace | COVERED |
| F-IN-64 | Progress | ✅ 🆕 | 1655 | Inspector · Brand workspace | COVERED |
| F-IN-65 | Accordion | 🟡 | 1656 | Inspector · Brand workspace | PARTIAL |
| F-IN-66 | Flex/Stack block | ✅ 🆕 | 1657 | Inspector · Brand workspace | PARTIAL |
| F-IN-67 | Grid/Columns block | ✅ | 1658 | Inspector · Brand workspace | COVERED |
| F-IN-68 | Product type block | ⏳ | 1659 | Inspector · Brand workspace | DEFERRED-BY-DECISION |
| F-IN-69 | Display + flex | ✅ | 1665 | Inspector · Brand workspace | PARTIAL |
| F-IN-70 | Grid controls | ✅ | 1666 | Inspector · Brand workspace | PARTIAL |
| F-IN-71 | Position | ✅ | 1667 | Inspector · Brand workspace | COVERED |
| F-IN-72 | Overflow/Visibility/Float | ✅ | 1668 | Inspector · Brand workspace | PARTIAL |
| F-IN-73 | Standalone Flex/Grid/Radius | ❌ | 1669 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-74 | Typography | ✅ | 1670 | Inspector · Brand workspace | COVERED |
| F-IN-75 | Text inside | ✅ 🆕 | 1671 | Inspector · Brand workspace | PARTIAL |
| F-IN-76 | Font picker | ✅ | 1672 | Inspector · Brand workspace | COVERED |
| F-IN-77 | Width/Height | ✅ | 1673 | Inspector · Brand workspace | COVERED |
| F-IN-78 | Spacing-token chain | ✅ | 1674 | Inspector · Brand workspace | COVERED |
| F-IN-79 | Min/Max | ✅ | 1675 | Inspector · Brand workspace | PARTIAL |
| F-IN-80 | Flex/grid item | ✅ 🆕 | 1676 | Inspector · Brand workspace | PARTIAL |
| F-IN-81 | Inline disabled reason | 🟡 | 1677 | Inspector · Brand workspace | PARTIAL |
| F-IN-82 | Spacing box | ✅ | 1678 | Inspector · Brand workspace | COVERED |
| F-IN-83 | Pair rows / Gap rows | ❌ | 1679 | Inspector · Brand workspace | REMOVED-N/A |
| F-IN-84 | Fill › Colour | ✅ | 1680 | Inspector · Brand workspace | PARTIAL |
| F-IN-85 | Fill › Gradient | 🟡 | 1681 | Inspector · Brand workspace | PARTIAL |
| F-IN-86 | Fill › Image | ✅ | 1682 | Inspector · Brand workspace | COVERED |
| F-IN-87 | Border | ✅ | 1683 | Inspector · Brand workspace | PARTIAL |
| F-IN-88 | Colour row | ✅ | 1689 | Inspector · Brand workspace | COVERED |
| F-IN-89 | Colour popover | ✅ 🆕 | 1690 | Inspector · Brand workspace | COVERED |
| F-IN-90 | Number + unit | ✅ | 1691 | Inspector · Brand workspace | CONFLICT |
| F-IN-91 | Live writes | ✅ | 1692 | Inspector · Brand workspace | COVERED |
| F-IN-92 | Read-only + lock gate | ✅ | 1693 | Inspector · Brand workspace | COVERED |
| F-IN-93 | Opacity | ✅ 🆕 | 1699 | Inspector · Brand workspace | PARTIAL |
| F-IN-94 | Shadow | ✅ | 1700 | Inspector · Brand workspace | COVERED |
| F-IN-95 | Filters | ✅ | 1701 | Inspector · Brand workspace | PARTIAL |
| F-IN-96 | Transform & motion | ✅ | 1702 | Inspector · Brand workspace | COVERED |
| F-IN-97 | Advanced effects | ✅ | 1703 | Inspector · Brand workspace | PARTIAL |
| F-IN-98 | Link | ✅ | 1709 | Inspector · Brand workspace | COVERED |
| F-IN-99 | CMS binding | ✅ 🆕 | 1710 | Inspector · Brand workspace | COVERED |
| F-IN-100 | CMS-conditional visibility | ⏳ | 1711 | Inspector · Brand workspace | COVERED |
| F-IN-101 | Visibility | ✅ | 1712 | Inspector · Brand workspace | COVERED |
| F-IN-102 | Interactions | 🟡 | 1713 | Inspector · Brand workspace | COVERED |
| F-IN-103 | Element CSS animation | ✅ | 1714 | Inspector · Brand workspace | COVERED |
| F-IN-104 | CSS classes | ✅ | 1715 | Inspector · Brand workspace | PARTIAL |
| F-IN-105 | Attributes | ✅ | 1716 | Inspector · Brand workspace | PARTIAL |
| F-IN-106 | data-*/aria-* | 🟡 | 1717 | Inspector · Brand workspace | COVERED |
| F-IN-107 | Form › Fields | 🟡 | 1718 | Inspector · Brand workspace | COVERED |
| F-IN-108 | Form › After submit | 🟡 | 1719 | Inspector · Brand workspace | PARTIAL |
| F-IN-109 | Slider › Slides | ✅ 🆕 | 1720 | Inspector · Brand workspace | PARTIAL |
| F-IN-110 | Slider › Playback | ✅ 🆕 | 1721 | Inspector · Brand workspace | PARTIAL |
| F-IN-111 | Collection list | ✅ 🆕 | 1722 | Inspector · Brand workspace | COVERED |
| F-IN-112 | All CSS | ❌ | 1723 | Inspector · Brand workspace | REMOVED-N/A |
| F-BR-01 | Rail Brand (B) | ✅ 🆕 | 1760 | Inspector · Brand workspace | COVERED |
| F-BR-02 | Other ways in | ✅ 🆕 | 1761 | Inspector · Brand workspace | PARTIAL |
| F-BR-03 | Nav column | ✅ 🆕 | 1762 | Inspector · Brand workspace | COVERED |
| F-BR-04 | Leave Brand | ✅ 🆕 | 1763 | Inspector · Brand workspace | COVERED |
| F-BR-05 | Page header | ✅ 🆕 | 1764 | Inspector · Brand workspace | COVERED |
| F-BR-06 | Autosave + one undo | ✅ 🆕 | 1765 | Inspector · Brand workspace | COVERED |
| F-BR-07 | Review changes | ✅ 🆕 | 1766 | Inspector · Brand workspace | COVERED |
| F-BR-08 | Read-only banner | 🚩 | 1767 | Inspector · Brand workspace | COVERED |
| F-BR-09 | "No brand set." card | ✅ 🆕 | 1768 | Inspector · Brand workspace | PARTIAL |
| F-BR-10 | Live preview column | ✅ 🆕 | 1769 | Inspector · Brand workspace | CONFLICT |
| F-BR-11 | Light/Dark preview switch | ✅ 🆕 | 1770 | Inspector · Brand workspace | COVERED |
| F-BR-12 | Beginner/Pro toggle | ❌ | 1771 | Inspector · Brand workspace | REMOVED-N/A |
| F-BR-13 | Drawer-era frame | ❌ | 1772 | Inspector · Brand workspace | REMOVED-N/A |
| F-BR-14 | Focus isolation | 🐞 | 1773 | Inspector · Brand workspace | COVERED |
| F-BR-15 | Colours table | ✅ 🆕 | 1779 | Inspector · Brand workspace | PARTIAL |
| F-BR-16 | Table keyboard | ✅ 🆕 | 1780 | Inspector · Brand workspace | COVERED |
| F-BR-17 | Used by highlight | ✅ 🆕 | 1781 | Inspector · Brand workspace | COVERED |
| F-BR-18 | + Add token | 🐞 | 1782 | Inspector · Brand workspace | COVERED |
| F-BR-19 | Token card | ✅ 🆕 | 1783 | Inspector · Brand workspace | COVERED |
| F-BR-20 | "About drafts" hint | 🐞 🆕 | 1784 | Inspector · Brand workspace | COVERED |
| F-BR-21 | Colour picker | ✅ 🆕 | 1785 | Inspector · Brand workspace | COVERED |
| F-BR-22 | Rename token | ✅ 🆕 | 1786 | Inspector · Brand workspace | COVERED |
| F-BR-23 | Delete token | ✅ 🆕 | 1787 | Inspector · Brand workspace | COVERED |
| F-BR-24 | Reset to default | ✅ 🆕 | 1788 | Inspector · Brand workspace | COVERED |
| F-BR-25 | Duplicate token | ⏳ | 1789 | Inspector · Brand workspace | DEFERRED-BY-DECISION |
| F-BR-26 | Colours action row | ✅ 🆕 | 1790 | Inspector · Brand workspace | COVERED |
| F-BR-27 | Scale generator | ✅ 🆕 | 1791 | Inspector · Brand workspace | COVERED |
| F-BR-28 | Drawer colour list | ❌ | 1792 | Inspector · Brand workspace | REMOVED-N/A |
| F-BR-29 | Add/Replace token modals | ❌ | 1793 | Inspector · Brand workspace | REMOVED-N/A |
| F-BR-30 | Dark mode card | ✅ 🆕 | 1799 | Inspector · Brand workspace | COVERED |
| F-BR-31 | Per-token dark values | ✅ 🆕 | 1800 | Inspector · Brand workspace | COVERED |
| F-BR-32 | Theme-toggle block | ✅ 🆕 | 1801 | Inspector · Brand workspace | COVERED |
| F-BR-33 | Fonts & type styles | ✅ 🆕 | 1807 | Inspector · Brand workspace | COVERED |
| F-BR-34 | Font popover | ✅ 🆕 | 1808 | Inspector · Brand workspace | COVERED |
| F-BR-35 | + Add a font | ✅ 🆕 | 1809 | Inspector · Brand workspace | COVERED |
| F-BR-36 | Styles page | ✅ 🆕 | 1810 | Inspector · Brand workspace | COVERED |
| F-BR-37 | Drawer type-scale editor | ❌ | 1811 | Inspector · Brand workspace | REMOVED-N/A |
| F-BR-38 | Spacing page | ✅ 🆕 | 1812 | Inspector · Brand workspace | COVERED |
| F-BR-39 | Other 11 kinds | 🟡 | 1813 | Inspector · Brand workspace | COVERED |
| F-BR-40 | Drawer generic rows | ❌ | 1814 | Inspector · Brand workspace | REMOVED-N/A |
| F-BR-41 | Component styles | 🟡 | 1820 | Inspector · Brand workspace | COVERED |
| F-BR-42 | ✦ Generate with AI | 🚩 | 1821 | Inspector · Brand workspace | DEFERRED-BY-DECISION |
| F-BR-43 | Classes | ✅ 🆕 | 1822 | Inspector · Brand workspace | PARTIAL |
| F-BR-44 | Presets | 🟡 | 1823 | Inspector · Brand workspace | PARTIAL |
| F-BR-45 | Brand checks list | ✅ 🆕 | 1829 | Inspector · Brand workspace | PARTIAL |
| F-BR-46 | Rules | ✅ | 1830 | Inspector · Brand workspace | PARTIAL |
| F-BR-47 | Run checks | ✅ 🆕 | 1831 | Inspector · Brand workspace | COVERED |
| F-BR-48 | Ignore (suppress) | ✅ | 1832 | Inspector · Brand workspace | PARTIAL |
| F-BR-49 | Connect to tokens | ✅ 🆕 | 1833 | Inspector · Brand workspace | COVERED |
| F-BR-50 | Templates bind literal colours | 🐞 | 1834 | Inspector · Brand workspace | PARTIAL |
| F-BR-51 | Starters | 🐞 | 1840 | Inspector · Brand workspace | PARTIAL |
| F-BR-52 | Brand from logo/URL | 🚩 | 1841 | Inspector · Brand workspace | DEFERRED-BY-DECISION |
| F-BR-53 | Restore points | ✅ 🆕 | 1842 | Inspector · Brand workspace | COVERED |
| F-BR-54 | Theme push / Recapture | ⏳ | 1843 | Inspector · Brand workspace | DEFERRED-BY-DECISION |
| F-BR-55 | Starter grid / pill | ❌ | 1844 | Inspector · Brand workspace | REMOVED-N/A |
| F-BR-56 | Import/export panel | ✅ | 1850 | Inspector · Brand workspace | COVERED |
| F-BR-57 | Figma Variables row | ❌ | 1851 | Inspector · Brand workspace | REMOVED-N/A |
| F-BR-58 | Import | 🟡 | 1852 | Inspector · Brand workspace | COVERED |
| F-BR-59 | Legacy Export dropdown | ❌ | 1853 | Inspector · Brand workspace | REMOVED-N/A |
| F-BR-60 | Migration modal | ✅ | 1854 | Inspector · Brand workspace | PARTIAL |
| F-BR-61 | Server token boundary | 🚩 | 1855 | Inspector · Brand workspace | COVERED |
| F-BR-62 | Lint aggregate banner | ❌ | 1856 | Inspector · Brand workspace | REMOVED-N/A |
| F-BR-63 | Canvas token application | ✅ | 1862 | Inspector · Brand workspace | COVERED |
| F-BR-64 | Checks feed Issues | ✅ | 1863 | Inspector · Brand workspace | COVERED |
| F-BR-65 | Onboarding "Set your brand" | ✅ | 1864 | Inspector · Brand workspace | COVERED |

## Engine rules, gap register, open bugs

INV §9 lines 1970–2275 · 195 rows

| FID | Feature | INV status | INV line | Parent module | Coverage |
|---|---|---|---|---|---|
| F-EN-A1.1 | Element type registry (55) | ✅🆕 | 1976 | Engine rules, gap register, open bugs | CONFLICT |
| F-EN-A1.2 | Types refined on load/paste | ✅🆕 | 1977 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-A1.3 | Types that cannot have children | ✅ | 1978 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A1.4 | Restricted parents (gallery, product-grid) | ✅ | 1979 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A1.5 | HTML5 forbidden pairs | 🟡 | 1980 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A1.6 | Drop depth limit 50 | ✅ | 1981 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-A1.7 | Tree-audit depth messages | ❌ | 1982 | Engine rules, gap register, open bugs | REMOVED-N/A |
| F-EN-A1.8 | Lock gate | ✅🆕 | 1983 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A1.9 | Multi-delete confirmation | ✅🆕 | 1984 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A1.10 | Page root protections | ✅ | 1985 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A2.1 | Undo depth 100 | ✅ | 1991 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A2.2 | Coalesce 500 ms | ✅ | 1992 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A2.3 | Checkpoint every 10 patches | ✅ | 1993 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A2.4 | Undo/redo/restore autosaved | ✅ | 1994 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A2.5 | Unrecorded change toast | ✅ | 1995 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A2.6 | Spurious undo step on load | ✅🆕 | 1996 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-A2.7 | Brand ⌘Z ignores read-only/full-page (bug) | 🐞 | 1997 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A2.8 | Version cap 50; named never pruned | ✅ | 1998 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A2.9 | Time-Travel scrubber | ✅ | 1999 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.1 | ⌘S save | ✅ | 2007 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.2 | ⌘Z undo | ✅ | 2008 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.3 | ⌘⇧Z / ⌘Y redo | ✅ | 2009 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.4 | ⌘P preview | ✅ | 2010 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.5 | ⌘K palette | ✅ | 2011 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.6 | ⌘⇧P alias | ✅🆕 | 2012 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.7 | ? and ⌘/ sheet | ✅🆕 | 2013 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.8 | ⌘J AI | ✅ | 2014 | Engine rules, gap register, open bugs | DEFERRED-BY-DECISION |
| F-EN-A3.9 | I AI | ✅ | 2015 | Engine rules, gap register, open bugs | DEFERRED-BY-DECISION |
| F-EN-A3.10 | ⌘, settings | ✅ | 2016 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A3.11 | ⌘H history | ✅ | 2017 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.12 | C comment mode | 🔒 | 2018 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.13 | F6 / ⇧F6 | ✅ | 2019 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.14 | Esc | ✅ | 2020 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.15 | Panel letter keys | ✅ | 2021 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.16 | ⇧A components | ✅ | 2022 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.17 | Delete / Backspace | ✅ | 2023 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.18 | ⌘C/⌘X/⌘V | ✅ | 2024 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.19 | ⌘⇧V paste HTML | ✅🆕 | 2025 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.20 | ⌘D duplicate | ✅ | 2026 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.21 | ⌘G / ⌘⇧G | ✅ | 2027 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.22 | ⌘⌥C / ⌘⌥V | ✅ | 2028 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.23 | Arrange chords | ✅ | 2029 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.24 | ⌘A select all (root excluded) | ✅ | 2030 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A3.25 | ⌘⇧E exporter | ✅ | 2031 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A3.26 | ⌘\ toggle inspector | ✅🆕 | 2032 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A3.27 | ⌘⇧A AI | ✅ | 2033 | Engine rules, gap register, open bugs | DEFERRED-BY-DECISION |
| F-EN-A3.28 | ⌘⇧C component view | ❌ | 2034 | Engine rules, gap register, open bugs | REMOVED-N/A |
| F-EN-A3.29 | Tab / ⇧Tab cycling (bug BK-28) | 🐞 | 2035 | Engine rules, gap register, open bugs | CONFLICT |
| F-EN-A3.30 | Arrow / Home / End navigation | ✅ | 2036 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.31 | ⇧/⌘ + arrow nudge | ✅ | 2037 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.32 | ⌥↑↓ reorder | ✅ | 2038 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.33 | ⇧F10 context menu | ✅ | 2039 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A3.34 | Zoom chords | ✅ | 2040 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.35 | View toggles chords | ✅ | 2041 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.36 | / or ⌘F focus Add search | ✅🆕 | 2042 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A3.37 | ⌘↵ post comment / run generate | ✅🆕 | 2043 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.38 | ⌘K inside media library | ✅🆕 | 2044 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.39 | Enter/Esc inline text | ✅ | 2045 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A3.40 | No device chords | ✅ | 2046 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-A3.41 | Global guard rules | ✅ | 2047 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A4.1 | Breakpoint ranges | ✅ | 2053 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A4.2 | Legacy 991/575 | ❌ | 2054 | Engine rules, gap register, open bugs | REMOVED-N/A |
| F-EN-A4.3 | Device frames (Wide palette-only) | ✅ | 2055 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A4.4 | Breakpoint switcher hidden (UX-06) | 🐞 | 2056 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A4.5 | Three Desktop widths | 🟡 | 2057 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A4.6 | Emoji device presets | 🟡 | 2058 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A4.7 | Preview always Desktop (UX-11) | 🐞 | 2059 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A5.1 | Zoom 10–400 + presets | ✅ | 2065 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A5.2 | Drag thresholds | ✅ | 2066 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A5.3 | Marquee min 3 px | ✅ | 2067 | Engine rules, gap register, open bugs | CONFLICT |
| F-EN-A5.4 | Element size min/max | ✅ | 2068 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-A5.5 | Canvas max 20000 | ✅ | 2069 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-A5.6 | Components per project 100 | ✅ | 2070 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A5.7 | Slug history 100 | ✅ | 2071 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-A5.8 | Recents (8/3/12) | 🟡 | 2072 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A5.9 | Media upload limits | ✅ | 2073 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A5.10 | Storage quota thresholds | ✅ | 2074 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A5.11 | Plan limits | ✅ | 2075 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A5.12 | AI rate limit | ✅ | 2076 | Engine rules, gap register, open bugs | DEFERRED-BY-DECISION |
| F-EN-A5.13 | AI prompt payload | ✅🆕 | 2077 | Engine rules, gap register, open bugs | DEFERRED-BY-DECISION |
| F-EN-A5.14 | API timeout/retries | ✅ | 2078 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-A6.1 | Single sanitizer | ✅ | 2084 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A6.2 | URL schemes | ✅ | 2085 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A6.3 | Session blob: URLs dropped | ✅🆕 | 2086 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A6.4 | Head-code allowlist | ✅ | 2087 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A6.5 | Plain text purified server-side (bug) | 🐞 | 2088 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-A6.6 | Form wiring loses attributes (bug) | 🐞 | 2089 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A7.1 | Autosave debounce 1 s | ✅ | 2095 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A7.2 | Save retry backoff | ✅🆕 | 2096 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A7.3 | Failure toasts | ✅🟡 | 2097 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A7.4 | Conflict state | 🟡 | 2098 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A7.5 | Reload recovery | 🟡❌ | 2099 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A7.6 | False exit prompt / "Not saving" | 🐞 | 2100 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-A8.1 | Brand Light/Dark preview-only | ✅🆕 | 2106 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A8.2 | Settings plan locks | 🔒🟡 | 2107 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-A8.3 | Upgrade modal triggers | 🔒 | 2108 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B1 | Publish flow (flag) | 🚩 | 2116 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B2 | Real-time collaboration | 🚩 | 2117 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B3 | DS AI client | 🚩 | 2118 | Engine rules, gap register, open bugs | DEFERRED-BY-DECISION |
| F-EN-B4 | Brand "AI component styles" CTA | 🚩⏳ | 2119 | Engine rules, gap register, open bugs | DEFERRED-BY-DECISION |
| F-EN-B5 | Brand "From logo or URL" | 🚩 | 2120 | Engine rules, gap register, open bugs | CONFLICT |
| F-EN-B6 | Export Vue / Next "Soon" | ⏳ | 2121 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-B7 | CMS import Sheets/Airtable | ⏳ | 2122 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B8 | CMS source dialog Sheets/Airtable rows | ⏳ | 2123 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-B9 | Add-panel "Soon" rows | ⏳ | 2124 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-B10 | IntegrationRow "COMING SOON" (unmounted) | ⏳ | 2125 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B11 | Upload element hidden | ⏳ | 2126 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-B12 | Comment C / Review panel gated | 🔒 | 2127 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B13 | Custom code Pro | 🔒 | 2128 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B14 | Password protection Pro | 🔒 | 2129 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B15 | Premium templates | 🔒 | 2130 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B16 | Settings "Upgrade" | 🔒 | 2131 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B17 | Viewer disabled doors | 🟡 | 2132 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B18 | Read-only view | ✅ | 2133 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B19 | Presence mock users | 🧪 | 2134 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B20 | Agentation overlay | 🧪 | 2135 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-B21 | Exit-reason instrumentation | 🧪 | 2136 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-B22 | Dev console warnings | 🧪 | 2137 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-B23 | Preset binding row inert | ⏳ | 2138 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-B24 | Brand Figma export row | ❌ | 2139 | Engine rules, gap register, open bugs | REMOVED-N/A |
| F-EN-B25 | Media "Trash" row | ❌ | 2140 | Engine rules, gap register, open bugs | REMOVED-N/A |
| F-EN-B26 | Brand unmounted pieces | ❌ | 2141 | Engine rules, gap register, open bugs | REMOVED-N/A |
| F-EN-B27 | Plugins | ❌ | 2142 | Engine rules, gap register, open bugs | REMOVED-N/A |
| F-EN-B28 | Snap-to-grid command | ❌ | 2143 | Engine rules, gap register, open bugs | REMOVED-N/A |
| F-EN-B29 | Watch device | ❌ | 2144 | Engine rules, gap register, open bugs | REMOVED-N/A |
| F-EN-B30 | Wide device palette-only | 🟡 | 2145 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B31 | Hover levels | 🟡 | 2146 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-B32 | Forms submissions inbox | ✅🆕 | 2147 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B33 | Site/Page SEO arc | ⏳ | 2148 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-B34 | Review v2 | ⏳ | 2149 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B35 | Activity off-rail | ✅🆕 | 2150 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B36 | CMS off-rail | 🟡 | 2151 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-B37 | Purple gradients in templates | 🐞 | 2152 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-B38 | Onboarding progress key global | 🐞 | 2153 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C1.1 | L1-002 export drops own text with child | ✅ fixed | 2165 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-C1.2 | L2-001 save page as template | ✅ fixed | 2166 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C1.3 | L3-002 insert lands on previous page | ✅ fixed | 2167 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C1.4 | L4-001 media drag wrote src onto section | ✅ fixed | 2168 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C2.1 | L1-001 click-insert inside heading | ✅ fixed | 2174 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.2 | L1-003/L2-007 selection toolbar covers small elements | ✅ fixed | 2175 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C2.3 | L1-004 Tablet resize wrote Desktop | ✅ fixed | 2176 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.4 | L1-007 undo jumped to first page | ✅ fixed | 2177 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.5 | L2-002/L3-001 duplicate slug | ✅ fixed | 2178 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C2.6 | L2-003 Layers Delete removed locked | ✅ fixed | 2179 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.7 | L2-004 Layers Delete removed instance child | ✅ fixed | 2180 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C2.8 | L2-005 instance overrides lost | ✅ fixed | 2181 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.9 | L2-006 saved component nested in same instance | ✅ fixed | 2182 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-C2.10 | L2-008 :hover not shown on canvas | ✅ fixed | 2183 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C2.11 | L2-009 Pro templates on Business | ✅ fixed | 2184 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.12 | L2-010 component delete undo | ✅ fixed | 2185 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.13 | L3-015 field-key rename stripped rich text | ✅ fixed | 2186 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-C2.14 | L3-016 stale bound text | ✅ fixed | 2187 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C2.15 | L3-024 repeated field names | ✅ fixed | 2188 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-C2.16 | L3-025 upload element | 🟡 hidden | 2189 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-C2.17 | L4-002 library drag re-upload | ✅ fixed | 2190 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-C2.18 | L4-003 replace kept old alt | ✅ fixed | 2191 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C2.19 | L4-018 token rename bindings | ✅ fixed | 2192 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C2.20 | L4-019 delete-and-replace token | ✅ fixed | 2193 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C2.21 | L4-020 token usage reset | ✅ fixed | 2194 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C2.22 | L4-021 Light/Dark global | ✅ fixed | 2195 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.23 | L4-022 contrast fix direction | ✅ fixed | 2196 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C2.24 | L4-033 missing alt error vs warning | ✅ fixed | 2197 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.25 | L4-034 issue selected invisible element | ✅ fixed | 2198 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C2.26 | L5-001 dev AI / Ollama | 🟡 | 2199 | Engine rules, gap register, open bugs | DEFERRED-BY-DECISION |
| F-EN-C2.27 | L5-002 element AI id only | ✅ fixed | 2200 | Engine rules, gap register, open bugs | DEFERRED-BY-DECISION |
| F-EN-C2.28 | L5-003 AI edits locked | ✅ fixed | 2201 | Engine rules, gap register, open bugs | DEFERRED-BY-DECISION |
| F-EN-C2.29 | L5-004 Undo all | ✅ fixed | 2202 | Engine rules, gap register, open bugs | DEFERRED-BY-DECISION |
| F-EN-C2.30 | L5-007 Stop still inserted | ✅ fixed | 2203 | Engine rules, gap register, open bugs | DEFERRED-BY-DECISION |
| F-EN-C2.31 | L5-030 team comments before round | ✅ fixed | 2204 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.32 | L5-070 failed autosave retry | ✅ fixed | 2205 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.33 | L5-074 contradictory recovery | ✅ fixed | 2206 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.34 | L5-075 Restore/Keep didn't save | ✅ fixed | 2207 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.35 | FG-001 Review v2 | 🐞 open | 2208 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.36 | FG-002 two Review designs in Figma | 🐞 open | 2209 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C2.37 | FG-007 Page SEO | 🐞 open | 2210 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C2.38 | FG-009 Site SEO | 🐞 open | 2211 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C3.1 | UX-01 empty-page intro clips 1280×720 | ❓ | 2217 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C3.2 | UX-04 page creation stacks modals | ❓ | 2218 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C3.3 | UX-06 breakpoint hidden | 🐞 | 2219 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C3.4 | UX-09 mobile font override missing in Preview | 🟡 | 2220 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C3.5 | UX-10 line-height field vs render | 🟡 | 2221 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C3.6 | UX-12 starter nav at 375 | 🐞 | 2222 | Engine rules, gap register, open bugs | OMITTED |
| F-EN-C3.7 | UX-22 full-page Settings not inert | 🐞 | 2223 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C4.1 | IA-01 context submenus keyboard | ✅ fixed | 2229 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C4.2 | IA-07 full-page not focus isolation | 🐞 | 2230 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C4.3 | IA-08 Preview not interaction runtime | 🐞 by design | 2231 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C4.4 | IA-10 effective value + origin | 🟡 | 2232 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C4.5 | IA-14 richness > verified coverage | 🐞 process | 2233 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C5.1 | BK-06 duplicate loses breakpoint/:state styles | 🐞 branch | 2239 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C5.2 | BK-05 ⌘Z ignores gates | 🐞 branch | 2240 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C5.3 | BK-11 save claims in-flight edits | 🐞 branch | 2241 | Engine rules, gap register, open bugs | COVERED (engine rule) |
| F-EN-C5.4 | BK-40/51 content rule differs canvas/Preview/export | 🐞 branch | 2242 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C5.5 | Live deploy recorded failed | 🐞 branch | 2243 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C5.6 | Server authz by target site | 🐞 branch | 2244 | Engine rules, gap register, open bugs | PARTIAL |
| F-EN-C5.7 | Load-time damage scan / repair | ⏳ branch | 2245 | Engine rules, gap register, open bugs | OMITTED |
