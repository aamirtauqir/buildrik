# Editor full audit — 2026-10-08

**Scope:** the whole Buildrik Editor (bundled at `/edit/:siteId`) plus the server it talks to.
**Method:** two phases, 15 agents.

- **Phase 1 — code audit (8 agents)** against `main@44f5db956`: every AI path end to end, engine/history/persistence, canvas/inspector, pages/CMS/components/forms, brand/media/SEO/issues, publish/API contract, AI extension map. Reports: `phase1-code/`.
- **Phase 2 — live walkthrough (7 agents)** against `main@f9f79bc66` running on `localhost:3300` as `qa@buildrik.local` (BUSINESS plan). Each agent used its own throwaway site (all deleted afterwards). Five walked modules in a real browser (Playwright, 1440×900); one compared Figma ↔ code ↔ product logic (11 Figma calls + the 1,321-board inventory); one audited design consistency and code quality. Reports: `phase2-live/`.
- **Every issue, sorted by severity:** `ISSUE-INDEX.md` (292 rows). Full entries (expected / current / Figma / code / root cause / next action) live in the per-agent reports.
- **Screenshots and probe scripts** (175 MB, deliberately outside the repo): `~/Desktop/buildrik-worktrees/editor-audit-evidence-2026-10-08/work-*`.

> **Roman Urdu khulasa:** Editor ka har module "screen maujood hai" level pe hai, lekin **koi bhi module end-to-end complete nahi** — har module mein kam az kam ek BROKEN ya INCOMPLETE journey mili. 4 Critical masle data kharab karte hain (export text gira deta hai, page switch ke baad insert ghalat page pe, template save page ko corrupt karta hai, media drop image insert nahi karta). AI ka plumbing (endpoints, schemas) sahi hai, magar AI ko element dikhta hi nahi, lock ignore karta hai, Stop kaam nahi karta, "Undo all" user ka kaam bhi mita deta hai — aur dev mein Ollama band hone ki wajah se AI panel bilkul dead hai. Phase-1 ke 38 fixes ek parked branch pe ready hain; 4 Critical mein se sirf 1 (media drop) us branch mein fix hai.

---

## 1. Executive summary

| | Count |
|---|---|
| Issues (Phase 2, live + Figma + quality) | **292** — Critical 4 · High 40 · Medium 119 · Low 129 |
| Phase-1 code findings (overlapping, many re-confirmed live) | P0 2 · P1 ≈45 · P2 ≈150 |
| Phase-1 findings confirmed live in Phase 2 | 41 (marked `PHASE-1 CONFIRMED LIVE` in the Evidence field) |
| Phase-1 findings refuted or already fixed on main | 4 (AI double-run, ⌘S double save, 500 ms undo merge didn't reproduce; Pages "Copy link" fixed) |
| Module rows whose full journey is verified complete | **0 of 37** (§2) |
| Fixes already written (parked branch) | 38 commits, 127 files, tests green — **not merged** |

**Condition in one paragraph.** The architecture is sound. There is one engine (Composer) and one chrome library, the tRPC contract matches field by field, and the `verify:ds` gates, `tsc` and about 13,000 unit tests are green. The product breaks in the **seams between modules**: insert × page switch, insert × text elements × export, media × canvas, tokens × bindings, colour mode × lint, CMS × canvas, save × recovery × publish, AI × locks × history. Unit tests pass because each unit is correct in isolation, and almost nothing tests the seams (see §16). Visually most panels match Figma well. The 09-21 Figma gaps are closed except the newest boards (Review v2, Yoast-level SEO, Brand 1b/1c). Figma also has its own debt: 51 of 84 new Settings/SEO boards are unreachable, two "current" Review designs exist, and ~500 shells show stale inspector tab names.

**Biggest risks to users, in order:**
1. **Silent content loss on publish.** Text inside a heading or paragraph that also has a child is dropped by the exporter (L1-002). The everyday Add flow creates exactly that structure (L1-001).
2. **Work lands somewhere the user can't see.** Inserts go to the previous page (L3-002), media drop writes `src` onto the section (L4-001), and undo jumps to Home (L1-007).
3. **Saves fail hard and recovery lies.** A duplicate slug makes every autosave return 500 (L3-001/L2-002). Failed saves are never retried (L5-070). "Restore my edits" doesn't save (L5-075). Publish stays enabled after a failed save (L5-060), and the confirm step treats a failed check request as a pass (DQ-001).
4. **AI can damage work.** It edits locked elements (L5-003), "Undo all" removes the user's own edits (L5-004), Stop still inserts (L5-007), and the model never sees the element it is asked to rewrite (L5-002).
5. **The design-system promise doesn't hold.** Token rename/replace never reaches elements (L4-018/019), the Brand preview's dark switch leaks into global lint and "Fix" breaks colours (L4-021/022), and templates save corrupted styles (L2-001).

---

## 2. Module-by-module status

Columns: UI · Function · States · Integrations · Persistence · Errors · **Journey complete?** (V = verified, P = partial, B = broken, — = not checked). Issue IDs point into `ISSUE-INDEX.md`.

| Module | UI | Fn | States | Integr. | Persist. | Errors | Complete? | Key issues |
|---|---|---|---|---|---|---|---|---|
| Top bar / site menu / Exit | V | V | P | V | — | — | P | L1-028 |
| Rail / Help / onboarding | P | P | B | P | B | — | P | L1-014 (wrong shortcut legend), L1-015 (7/7 vs 0/7), L1-008 |
| Footer: undo/redo, View, Zoom | V | V | P | V | V | — | P | L1-021 |
| **Add / Insert** | P | **B** | V | **B** | V | — | **No** | L1-001, L1-002, L3-002 |
| **Canvas selection / toolbar / context menu** | **B** | P | P | P | V | — | **No** | L1-003, L2-007, L1-011 |
| **Canvas drag / resize / lock** | P | **B** | P | **B** | V | — | **No** | L1-004, L1-005, L1-010, L2-038 |
| Keyboard shortcuts | V | V | P | V | n/a | n/a | P | L1-014, L1-020 |
| Zoom / View / Breakpoints | P | P | V | **B** | V | n/a | P | L1-013 (Desktop = 1024/1320/1440), FG-029 (Wide) |
| Command palette | V | V | V | V | n/a | n/a | P | L1-033 |
| **Undo / history stack** | V | **B** | P | P | n/a | — | **No** | L1-007; engine P1-1 (100-entry trim), P1-2 |
| **Layers** | V | **B** | P | P | V | P | **No** | L2-003, L2-004, L2-012, L1-006 |
| **Inspector** | P | **B** | P | V | V | P | **No** | L2-008 (hover/focus never show), L2-019, FG-021 |
| **Components** | P | **B** | P | **B** | P | P | **No** | L2-005, L2-006, L2-010 |
| **Templates** | V | **B** | P | **B** | P | **B** | **No** | L2-001, L2-002, L2-009 |
| Selected-element toolbar | **B** | P | — | — | n/a | — | **No** | L1-003, L2-007, L5-015 |
| **Pages** | P | **B** | P | P | V | **B** | **No** | L3-001, L3-002, L3-005, L3-008, FG-008 |
| Page settings / page SEO | P | P | P | P | V | P | **No** | FG-007, FG-010–012 |
| **CMS** | P | **B** | P | **B** | P | P | **No** | L3-015, L3-016, L3-018 |
| **Forms** | P | **B** | P | P | V | **B** | **No** | L3-024, L3-025, L3-027, FG-032b |
| Site Settings | V | P | P | V | V | P | **No** | L3-035, L3-036, FG-013 |
| Site SEO | P | P | P | — | V | — | **No** | FG-009 |
| Domains | P | — | V | — | — | V | **No** | L3-032 (promised "buildrick.app" doesn't exist), FG-034 |
| Activity log | V | **B** | V | **B** | n/a | — | **No** | L3-031 (empty after an hour of edits) |
| **Assets / Media drawer** | P | P | P | **B** | V | P | **No** | L4-001, L4-002, L4-003, L4-007 |
| Full Media Library | V | P | P | P | V | P | **No** | L4 (sticky toasts, fake progress) |
| **Brand: values / tokens** | P | P | P | **B** | P | — | **No** | L4-018, L4-019, L4-020, L4-024 |
| **Brand: colour mode** | P | **B** | P | **B** | **B** | — | **No** | L4-021, L4-022, L4-023 |
| Brand: review / undo | V | P | P | V | — | — | **No** | L4-026 |
| Brand: Generate with AI | — | — | — | — | — | — | **No** | flag off everywhere; result has no apply path (L5-019) |
| **Issues** | P | P | P | **B** | n/a | P | **No** | L4-033, L4-034, IR-1 (stale server rows) |
| Accessibility | P | P | P | **B** | n/a | — | **No** | FG-026 (no a11y report), L4-022 |
| **AI (all doors)** | P | **B** | P | **B** | P | P | **No** | §8 |
| **Review & Comments** | P | **B** | P | V | V | — | **No** | L5-030, L5-031–035, FG-001/002 |
| History / Versions | P | P | P | V | V | — | **No** | L5-040, L5-043, L5-044, DQ-011 |
| Preview | P | **B** | V | **B** | n/a | — | **No** | L5-050, L5-051 |
| Publish | V | — | P | — | — | — | **No (unverified past confirm)** | L5-060, DQ-001; Phase-1 publish P1s |
| **Save / reload / recovery** | P | **B** | **B** | P | P | P | **No** | L5-070, L5-074, L5-075, L5-076; engine P1-4/5 |

---

## 3. Critical blockers

| ID | What breaks | Root cause | On parked branch? |
|---|---|---|---|
| **L1-002** | Export and publish drop an element's own text once it has a child (`<h2><hr></h2>`, "Heading" gone). Live in Export → Code; publish uses the same exporter. | Either/or between `content` and `children` at `engine/export/ExportEngine.ts:486-494`. | No |
| **L3-002** | After a page switch, Add inserts into the previous page. The visible page stays empty, and the toast names the hidden target. Reproduced 3×, once nesting a Divider inside a Button. | `useBlockInsertion.ts:77-125` trusts a selection from another page; `PageManager.setActivePage` never clears selection. | No |
| **L2-001** | "Save page as template" corrupts the page: blind substring replace turns hex/rgba/ids into `{{token…}}` placeholders whose names contain spaces. Applying the template strips almost all styling. | `inverseResolveTokens.ts`. (No corrupted `UserTemplate` row remains in the local DB.) | No |
| **L4-001** | Dragging a Media asset onto the canvas inserts no image; it writes `src` onto the section under the cursor. The toast says "applied". | `useDropExecution.ts:85-116` → `ElementManager.ts:484-501`, page-root fallback in `dragCalculations.ts:238-242`; a test asserted the bug. | **Yes** (`2cb6d3a43`) |

**High-severity blockers that behave like Critical** (data loss or a dead end):
- **L1-001** — click-insert nests blocks inside text, which feeds L1-002.
- **L3-001 / L2-002** — a duplicate slug makes every save fail, the error blames the network, and a raw Prisma error leaks (L3-008).
- **L5-070 / 074 / 075** — save failures are not retried, recovery is contradictory, and restore doesn't save.
- **DQ-001 + L5-060** — Publish stays enabled after a failed save or a failed check request.

---

## 4. Broken user journeys

| # | Journey | Breaks at | IDs |
|---|---|---|---|
| J1 | Build a page: select heading → Add Divider/Image → Publish | The block nests inside the heading; the heading text vanishes in export | L1-001 → L1-002 |
| J2 | Switch to page "Team" → Add Text | It lands on the previous page; "Team" stays empty | L3-002 |
| J3 | Drag image from Media onto a section | The section gets `src`, no image appears; each drag re-uploads and pays for AI alt text | L4-001, L4-002 |
| J4 | Create page "About" twice (or from a template) | Every autosave 500s; the banner blames the connection; the second page is gone after reload | L3-001, L2-002, L3-008 |
| J5 | Save page as template → apply it elsewhere | Styling is destroyed in both places | L2-001 |
| J6 | Rename a Brand token / Delete-and-replace | Bound elements keep the old value; usage shows 0 after reload; delete then hard-deletes a token in use | L4-018, L4-019, L4-020 |
| J7 | Preview brand in Dark → back to editing | Global colour mode flipped and persisted; 4 false contrast errors; "Fix" turns a brand colour black and the warning stays | L4-021, L4-022 |
| J8 | Select a text element → AI "make it more concise" | The model gets only the id and invents text; works on locked elements; Stop doesn't stop; Undo all removes user work | L5-002/003/004/006/007 |
| J9 | Generate a block → Stop | The block is still inserted, with no toast and no Undo | L5-007, L5-011 |
| J10 | Edit while offline → network back → reload | No retry; two contradictory recovery prompts; "Restore my edits" doesn't save | L5-070, L5-074, L5-075 |
| J11 | Undo on page "About" | The editor jumps to Home, so the user can't see what was undone | L1-007 |
| J12 | Tablet view → resize a box | Desktop layout changes too | L1-004 |
| J13 | Edit text in a component instance → update master | The override is silently lost | L2-005 |
| J14 | Rename a CMS field key | Rich text is stripped to plain text permanently | L3-015 |
| J15 | Unpublish a bound CMS record | The canvas keeps showing it; the live site won't | L3-016 |
| J16 | Visitor submits a form with checkboxes / a file | Only the last checkbox value is kept; uploads fail with "Invalid JSON" | L3-024, L3-025 |
| J17 | Teammate posts a comment | It is invisible in Review until a client round is sent; no replies or mentions | L5-030, L5-031, L5-032 |
| J18 | Click an Issue on another page | The element is selected but not shown; no page switch | L4-034 |
| J19 | Preview → click an internal link | The preview goes blank; there's no page switcher; text colour and font differ from the canvas | L5-050, L5-051 |
| J20 | Restore a version | Undo stack wiped; a deleted element stays editable; if the safety copy fails, restore proceeds anyway | L5-043, L5-044, DQ-011 |

---

## 5. Figma vs Code mismatches

Full three-way table per module: `phase2-live/FG.md` §3. Summary:

- **Figma-only (designed, not built):**
  - Review v2 (28 boards, 3 Oct).
  - Page SEO drawer with Readability, keyphrase, schema, canonical and Fix hand-off (SEO-M1–M6b).
  - Site SEO: structured data, sitemap, pages overview, previews (SEO-M7–M12); Pages SEO dot (M11).
  - Brand Part 1b/1c: theme-toggle block, from-logo, colour scale, restore-points UI, connect-to-tokens, dark controls, safe delete, theme-push results.
  - Brand AI proposals.
  - Inspector "Visibility condition" (CMS-conditional).
  - AI "Applied draft · Canvas".
  - Forms workspace · Submissions.
  - Client pin-on-snapshot.
  - Preview a11y checker.
  - Commerce beyond setup.
- **Code-only (built, no board):**
  - Settings: Security headers screen.
  - Domains: DNS card / Check DNS / Force HTTPS (DNS-M paused by owner).
  - Onboarding: checklist, achievement prompt, rail coach.
  - Pages: "From template".
  - Layers: display settings, Move to page.
  - Media: quota bar, import-from-URL, site fonts.
  - Canvas: X-Ray / Badges overlays, invalid-drop feedback.
  - Templates: backup checkbox.
  - Activity: permission state.
- **Implemented UI ≠ intended design:**
  - Page settings is a centred modal (Cancel/Done) where the board has a docked drawer (FG-012).
  - The Wide breakpoint is designed but missing from the menu (FG-029).
  - The selection toolbar overlays the element (L1-003/L2-007; Figma draws it the same way, so FIGMA + CODE).
- **Figma itself incomplete or wrong:**
  - Two CURRENT Review designs, and the shells link only the old one (FG-002).
  - 51/84 new Settings/SEO boards unreachable (FG-013).
  - Brand Part 1 error branches unreachable (FG-014).
  - Brand "dirty / unsaved" board contradicts autosave (FG-019).
  - ~500 shells say "Settings" where v4 says "Behaviour" (FG-020).
  - Review v2 draws the old floating footer (FG-040).
  - History still has a Backups tab (FG-033).
  - Notifications drawn "all sites" (FG-035).
  - "Connect AI provider" contradicts the owner-managed AI model (FG-024).
  - Two homes for form submissions (FG-031).
- **Missing in both:**
  - Form validation / submit-failed / spam states (FG-032b).
  - One accessibility report as a publish input (FG-026).
  - Commerce product list and checkout (FG-037).
  - Invalid-drop board.
  - Wide-breakpoint editing rules.
  - Domain verification lifecycle (FG-034).
- **Closed since 09-21:** every 09-21 P0 gap and almost every P1 gap (FG.md §2).

## 6. Missing screens and states

From the per-module "States" column and the FG lists:
- **Loading and error rows**
  - Add panel: toast only (FG-041).
  - Template error dialogs: not reachable (L2).
  - Generate-block: every failure reads "timed out" (L5-009).
- **Empty states**
  - Issues says "No brand issues." for all kinds (FG-027).
  - History AI summary is offered with no data (L5-020).
- **Recovery states**
  - Contradictory banners (L5-074).
  - A non-expiring "work never reached the server" toast that leaks across tabs (L5-076).
  - The dashboard's "Auto-retrying in Ns" banner shows inside the editor and retries nothing (L5-071).
- **Missing confirmations and undo**
  - Restore relies on an expiring toast (L5-044).
  - Pages toasts' Undo undoes the wrong thing (Phase-1 Pages P1-4).
- **Disabled states that lie:** Pro templates locked on a BUSINESS plan (L2-009); Brand AI tooltip blames the workspace (L5-019).
- **Wrong counts:** Getting started 7/7 vs 0/7 (L1-015); token usage 0 after reload (L4-020); AI "2 changes applied" when nothing applied (L5-005).

## 7. Broken integrations (cross-module)

| Chain | Status | IDs |
|---|---|---|
| Add → Canvas → Layers → Inspector | **Broken** (nesting, wrong page) | L1-001, L3-002 |
| Canvas → Export → Publish | **Broken** (text loss) | L1-002; images without src ship and pass checks (L1-016/035) |
| Media → Canvas → Inspector | **Broken** (drop, re-upload, alt) | L4-001/002/003 |
| CMS → bound elements → canvas | **Broken** (unpublish/delete stale; field rename) | L3-015, L3-016 |
| Components → instances | **Broken** (overrides lost, nested insert, delete undo not persisted) | L2-005/006/010 |
| Brand → tokens → elements/components | **Broken** (rename/replace, usage, templates bake hex) | L4-018/019/020/024 |
| Brand colour mode → lint → Issues | **Broken** (global leak) | L4-021/022 |
| Issues → fix → canvas → status | Partial (same page OK; cross-page broken; editor vs server severity disagree; server rows stale) | L4-033/034, IR-1 |
| AI → change → canvas/Inspector/Layers/History | Partial (applies and undoes as one step; ignores locks; Undo all wrong; no `AI_OPS_APPLIED` event for Issues) | §8 |
| Editor state → save → reload | **Broken** under failure | L5-070/074/075, L1-008 (shared localStorage key) |
| Editor → Preview → Publish | **Broken** (preview ≠ canvas; publish enabled after failed save) | L5-050/051/060, DQ-001 |
| Forms → config → submission | **Broken** | L3-024/025/027 |
| Pages → redirects | **Broken** (redirect from a path a live page still owns) | L3-005 |
| Engine events → UI | `ERROR`, `STORAGE_ERROR`, `COMMAND_ERROR` emitted with no listener; `SHOW_IN_LAYERS`, `ZOOM_SELECTION`, layer/template toggles listened for but never emitted | DQ-003, DQ-005 |
| Activity log ← edits | **Broken** (nothing recorded) | L3-031 |

---

## 8. AI audit

### 8.1 Entry points (all exist; plumbing correct)
- AI rail tab (agent plan/run)
- ✦AI in the Inspector header
- Canvas context-menu "Ask AI"
- Generate block (Add)
- SEO "Write with AI"
- Version-history AI summary
- Media alt text (automatic on upload)
- Brand "Generate with AI" (flag off)
- Onboarding AI site generation (dashboard)

Every editor call hits a real procedure with a matching Zod payload, and the session cookie is sent. There is **no** AI button on the selection toolbar (L5-015). Five doors open the same empty prompt with no intent (L5-014).

### 8.2 Broken, with root causes

| Problem | Root cause | Evidence | Fixed on branch? |
|---|---|---|---|
| AI panel and Generate-block dead in dev | `OLLAMA_BASE_URL` is set, so the server forces Ollama, and Ollama isn't running. Other procedures use OpenAI: two providers at once. | L5-001, 02-ai-server | No (env/config decision) |
| Model never sees the element | Client sends only `elementId`; server prompt has no element snapshot | L5-002, `ai.ts:146`, `ai.service.ts:906` | **Yes** `21635494e`, `3915996bd` |
| Zero design tokens / media sent | Element scope skips the token/media builder; default token set yields 0 | L5-010 | **Yes** (element scope) |
| Edits locked elements | `applyAiEdit` writes directly, bypassing `canWrite` | L5-003 | **Yes** `1cdb991dd` |
| Partial batches stay applied | `finally` commits; a stale comment says rollback is unsafe | 01-ai-editor P1 | **Yes** `1cdb991dd` |
| "Undo all" removes user edits | Counts "applied" steps, including no-op steps and steps with interleaved user edits | L5-004, L5-005 | **Yes** `3915996bd` |
| Stop doesn't cancel; Generate-block Stop still inserts | `runPromptOnce` had no abort; apply ran before the cancel check | L5-006, L5-007 | **Yes** `675830d02`, `0764e514c` |
| Generate-block sends all pages | First 200 elements site-wide | L5-008 | **Yes** `0764e514c` |
| History summary wrong / fails | Raw element ids fed to model; diff over server cap fails | L5-021, 01-ai-editor | Cap **yes** `e5a33d3e3`; readable labels **no** |
| SEO title irrelevant / truncated / no regenerate | Almost no page context; hard 60-char cut | L5-017, L5-018 | No |
| Alt text: no quota, raw OpenAI errors leaked, auto-runs on every upload, re-runs on every re-upload | Missing reserve/refund; errorFormatter copied raw causes | L4-007, L5-025, 02-ai-server | Quota, rate limit, masking **yes** `6883950e8`, `283a34c76`. Auto-run opt-out **no** |
| Brand Generate with AI | Flag off everywhere; returns a component schema nothing can apply | L5-019 | No (feature work) |
| Onboarding generation | All pages map to "landing"; page name not in prompt; failed jobs use slots; FAILED→COMPLETED resurrection; probably unstyled output (Tailwind classes) | 02-ai-server | Mapping, slots, resurrection **yes** (`ffea050c4`, `8b5bf3f8b`, `d1a189fc2`); unstyled output **unverified** |
| No timeouts / abort to provider | SDK default 10 min × 2 retries | 02-ai-server | 60 s / 1 retry **yes** `331d8f34f`; signal pass-through **no** |
| Duplicate AI plumbing | Three transports with three error/retry/cache behaviours; `ai.quota` fetched twice | L5-023, L5-024 | No |
| Dead AI code | `ai.page`, `ai.layout`, text intent unreachable | 01/02 | Helpers deleted `5d6bee9b3`; procedures remain |
| Missing apply event | No `AI_OPS_APPLIED`, so Issues/Review can't react | 08-ai-extensions | No |

### 8.3 Recommended AI extensions

Full table with integration points: `phase1-code/08-ai-extensions.md`.

- **Do now:**
  - **AI Ops v2 hardening.** One shared op schema in `packages/shared/schemas/ai-ops.ts`; `buildAiContext`; lock gate; all-or-nothing; `AI_OPS_APPLIED` event; `siteId` access check.
  - **One-click Rewrite / Shorten / Tone / Fix grammar** on the selection toolbar and context menu (`UnifiedSelectionToolbar.tsx`, canvas context menu → `applyAiEdit`) (L5-016).
  - **Issues "Fix with AI" for missing alt text,** reusing `alt-text.service` (L5-026).
- **Next:**
  - Styled section insert (`insert-tree` op through the sanitize path).
  - "Fix for mobile".
  - Restyle-to-brand led by the DS linter.
  - "Apply this review comment" (L5-027).
  - Stock suggestions.
  - CMS sample records.
  - New page from a prompt.
- **Later:** analyse page; pre-publish AI proofread (advisory); forms from a prompt; comment-thread summary; explain deploy errors.
- **Don't:**
  - AI on individual Inspector controls.
  - AI for broken links or conflicts.
  - Image generation.
  - Classifying form submissions (PII).
  - More SEO-copy AI (owner non-goal 10-04).
  - Silent background suggestions that spend quota.

---

## 9. Code-quality problems that affect the product

From DQ.md and phase1 03-engine; all `verify:ds` gates are green, so these are things the gates don't see.

- **Errors swallowed or unheard:**
  - Engine `ERROR` / `STORAGE_ERROR` / `COMMAND_ERROR` have no listener, so a read-only refusal fails silently (DQ-005).
  - 25 swallowed promise rejections (DQ-012).
  - Restore proceeds if the safety copy fails (DQ-011).
  - Publish confirm treats a failed checks request as a pass (DQ-001).
- **Duplicate implementations with different behaviour:**
  - Two contrast-fix algorithms (DQ-010).
  - Group ×3, reorder ×3, Layers vs engine delete/duplicate (04-canvas, DQ-002).
  - Right-click Copy vs ⌘C (04).
  - Three AI transports (L5-023).
  - Four tRPC client setups (07).
  - Two meta-tag builders (06).
- **Conflicting state sources:** engine state mirrored into several React states (DQ-013); shared unscoped `aquibra-project` localStorage key (L1-008); recovery copy and version snapshots store the email API key and site password (03-engine P2).
- **History engine defects:**
  - 100-entry trim rebuilds from the wrong state (03 P1-1, probe-confirmed).
  - Out-of-history writes reverted by the next undo (03 P1-2).
  - Page operations don't mark the project dirty.
- **Dead code:**
  - 8 Composer managers never used (DQ-008).
  - 79 unused event constants.
  - About 40 public methods with no caller.
  - Dead endpoints (`/api/ai`, `/api/assets`, `/api/templates`, `/api/export`, Stripe `/api/checkout`).
  - Engine forms stack, `DataBindResolver`, unused `pages` router procedures, `cms.generateDynamicPages`.
- **Rule drift:**
  - 919 `../../` imports with no gate (DQ-006).
  - 26 files over 800 lines (DQ-007).
  - 345 inline style objects (DQ-033).
  - `any` / `@ts-ignore` in drag and AI paths (DQ-032).
  - Router→Prisma shortcuts in forms and the ai-generate worker (05, 02).
- **Design drift the gates miss:**
  - Menus built 4 ways at 28 / 30 / 32 px (DQ-018).
  - 9 button heights; 16 px spacing inputs (DQ-020).
  - Weight 700 via `<strong>` (DQ-021).
  - Indigo `#667eea` in canvas chrome (DQ-022).
  - 10 undefined `--bk-*` tokens (DQ-024).
  - Two icon systems plus 62 inline SVGs (DQ-017).
  - Heading icon renders in Times (DQ-016).
  - Mono labels in the spacing box (DQ-015).
- **Test harness:** see §16.

## 10. UX and interaction problems
- **Direct manipulation:**
  - The selection toolbar covers small elements, so a second click deletes or duplicates (L1-003, L2-007).
  - Invisible 48×40 hit areas block the left edge of sections (L1-011).
  - Drops land below even when the indicator shows above (L1-010).
  - A resize-handle drag moved the element to the end of the page (L2-038).
- **Inspector:** hover/focus styles never show on canvas (L2-008); edits lag 300 ms (L2-019); the colour picker lists internal tokens and duplicate names (L4-025).
- **Feedback overload:** one save failure raises 3–4 surfaces, and the banner covers the canvas (L5-072); "Save failed" stays after a successful retry (L5-073); Media toasts are sticky.
- **Discoverability:**
  - Version rows aren't clickable; everything sits in a hover-only "…" menu (L5-045).
  - After "Start from scratch", Edit is hidden under More (L1-025).
  - The Help shortcut legend is wrong (L1-014).
  - No page switcher in Preview (L5-051).
- **Terminology and truthfulness:**
  - "Desktop" is 1024 / 1320 / 1440 px depending on the screen (L1-013).
  - Delete-site dialog says "cannot be undone", but the site is restorable for 30 days (FG).
  - Domains promises "buildrick.app" (L3-032).
  - Generate-block says "you review the draft before it lands" but inserts immediately (L5-011).
  - The comment author is shown twice (L5-035).
- **Multi-tab:** no warning that the site is open elsewhere; "Reload latest" triggers the native "Leave site?" (L5-077, L5-078).

## 11. Duplicate or conflicting functionality
- Editor vs server disagree on missing-alt / broken-link severity (L4-033, owner decision).
- Two Review designs in Figma (FG-002).
- Two form-submission homes in Figma (FG-031).
- Brand "dirty" vs autosave (FG-019).
- Two contrast fixers (DQ-010).
- Three AI transports (L5-023).
- Layers vs engine delete / duplicate / group / reorder (04, DQ-002).
- ⌘S handled by both engine and shell (04, unverified live).
- Two meta-tag builders (06).
- Engine localStorage autosave alongside server save (03, L1-008).
- Dashboard offline banner rendered inside the editor (L5-071).

## 12. Missing product functionality (kept separate from bugs)

| Category | Items |
|---|---|
| **Missing required feature** | Comment replies, @mentions, edit/delete (L5-031–033); site-level dark mode switch for publishing (L4-023); deliberate form test submission (L3-027); Preview page switcher (L5-051); auto-retry of failed saves (L5-070); a11y report as publish input (FG-026); Wide breakpoint in menu (FG-029); title template setting or a corrected SEO check (06 SEO-1) |
| **Incomplete existing feature** | Review v2 (FG-001); Yoast-level page and site SEO (FG-007/009); Brand Part 1b/1c (FG-015a–i); Activity log recording (L3-031); Commerce beyond setup (FG-037); Brand AI apply path (L5-019); component properties editor (FG §3) |
| **UX improvement** | Everything in §10; one-click AI content actions (L5-016); AI intent per door (L5-014) |
| **Nice-to-have** | Analyse-page AI; proofread before publish; comment-thread summary; onboarding Figma boards |

---

## 13. Priority order for fixing

Each wave is ordered so that later waves don't re-break or re-test earlier ones.

**Wave 0 — land what is already fixed (½ day).**
1. Rebase `fix/editor-ai-audit-2026-10-08` (38 commits, base `44f5db956`) onto current `main` (`f9f79bc66`). Watch `AquibraStudio.tsx`, which agents edited inside the worktree.
2. Run the full suites and gates.
3. Walk the fixed flows live (J3, J8, J9, J11-part, J12, J18, AI locks, publish workspace/path guards).
4. Merge.

This closes about 35 of the Phase-1 P0/P1 findings, including L4-001 (Critical) and 9 of the 40 High.

**Wave 1 — content integrity (Critical, not yet fixed).**
1. L1-002: exporter keeps own text alongside children. Also decide whether text elements may hold block children at all, because L1-001 is the root.
2. L1-001: nesting rules / smart placement insert after the text element, not inside it.
3. L3-002: clear or validate the selection on page switch, and insert only on the active page.
4. L2-001: replace substring inverse-resolution with structural token mapping; slugify placeholder names.

**Wave 2 — save, recovery, publish safety.**
- Duplicate-slug guard in `PageManager.createPage` / rename / template-add, plus a translated server error with no Prisma leak (L3-001, L2-002, L3-008).
- Save auto-retry; one coherent recovery surface; restore that marks dirty and saves (L5-070/074/075/076; engine P1-4/5).
- Publish disabled after a failed save, and confirm fails closed on a check error (L5-060, DQ-001).
- Undo keeps the active page (L1-007).
- History 100-entry trim fix and baseline refresh after out-of-history writes (engine P1-1/2).
- Scope the localStorage key per site, and strip secrets from recovery snapshots (L1-008, 03).

**Wave 3 — design-system truth.**
- Brand colour-mode leak and the inverted contrast Fix (L4-021/022).
- Token usage persisted (L4-020).
- BRAND_TOKENS_V2 kill switch honoured in scratch composers (BR-2).
- Review-changes honours ⌘Z (L4-026).
- Owner decision on template hex baking (L4-024).

**Wave 4 — module correctness.**
- Components: L2-005/006/010.
- CMS: L3-015/016/018.
- Forms: L3-024/025/027.
- Pages redirects: L3-005.
- Activity log: L3-031.
- Hover/focus on canvas: L2-008.
- Pro templates on BUSINESS: L2-009.
- Comments visible before a round: L5-030.
- Preview fidelity: L5-050/051.
- Images without src blocked: L1-016/035.

**Wave 5 — AI completion (after Wave 0's AI fixes).**
- Dev provider config: start Ollama or unset `OLLAMA_BASE_URL` in dev; decide one provider policy (L5-001).
- AI Ops v2 shared schema and `AI_OPS_APPLIED`.
- One-click content actions.
- Alt-text opt-out plus Issues AI fix.
- Readable history summary.
- SEO AI context and regenerate.
- Consolidate the three AI transports.

**Wave 6 — interaction and UX.** §10 items, led by toolbar placement (L1-003/L2-007), hit areas (L1-011) and drop accuracy (L1-010).

**Wave 7 — design debt (Figma + code, needs owner/designer).**
- Review v2.
- SEO M1–M12.
- Brand 1b/1c.
- Figma orphans and stale shells (FG-013/014/019/020/033/035).

**Wave 8 — code quality.**
- Wire the error events.
- Remove dead managers and endpoints.
- Collapse duplicate implementations.
- `../../` gate.
- Menu and button primitives in chrome-ui.
- Test-harness work (§16).

## 14. Dependencies between fixes
- **Wave 0 before everything.** Many later fixes touch the same files (`applySetStyle.ts`, `useLayerActions.ts`, `commandOperations.ts`, `publish.service.ts`); landing the branch first avoids conflicts.
- **L1-001 → L1-002.** Deciding "can text hold blocks?" changes the size of the exporter fix. If text can't hold blocks, the exporter fix is still needed for existing saved sites.
- **L3-002 shares `useBlockInsertion.ts` with L1-001.** Fix together.
- **Duplicate-slug guard (Wave 2)** before the template add-as-page flow is retested (L2-002).
- **Save retry/recovery (Wave 2)** before Publish freshness work, because both read the same "server has it" state (`siteColumnsLoaded`, changed on the branch).
- **Engine history fixes (Wave 2)** before AI Undo-all is re-verified (Wave 5); the AI undo relies on history entry identity.
- **Colour-mode leak (L4-021)** before re-auditing contrast Issues; otherwise the counts are false.
- **Token usage (L4-020)** before safe-delete (FG-015g).
- **AI Ops v2 schema (Wave 5)** before any new AI surface (§8.3).
- **Owner decisions** block: IR-2/L4-033 severity, L4-024 template baking, L5-001 provider policy, Review v2 vs old Review (FG-002), Wide breakpoint (FG-029), SEO-1 check vs title-template UI.

## 15. Areas that could not be verified, and why

| Area | Why |
|---|---|
| Real publish / deploy, rollback, cancel, approval gate blocking, published-site behaviour (forms, hover rules, dynamic CMS pages, dark mode) | The QA workspace has a **real** Vercel connection; the brief forbade a real deploy. Stopped at the confirm dialog. |
| AI with real model answers for the AI panel / Generate block | Ollama not running in dev (L5-001); editor side tested with intercepted responses. 5 real AI calls (SEO, summary). |
| Stock photo search | `PEXELS_API_KEY` / `UNSPLASH_ACCESS_KEY` unset locally |
| Custom domain connect / DNS verification | Calls the real Vercel API |
| Client review page `/review/<token>` | Needs a real token; out of harness reach |
| Collaboration with the flag on | Flag off everywhere (planned feature) |
| DB-tier tests (`pnpm test:db`) | Phase 1: Postgres was down at that moment. Not re-run in Phase 2. |
| Production env (`OPENAI_API_KEY`, flags baked) | No prod access in this audit |
| Help modal, some toasts, destructive paths in DQ | Dev-tools bubble covers Help; DQ ran read-only |
| Resize on Tablet via handle (L2) | The handle drag moved the element instead (filed L2-038); confirmed separately by L1-004 |
| Toast-Undo on Pages (Phase-1 Pages P1-4) | Live attempt inconclusive; a newer toast replaces the old one |
| Real devices / browsers other than Chromium; performance at scale; long-session undo in UI | Not in scope this pass (100-entry trim was probe-confirmed in the engine only) |
| Figma beyond 11 fresh calls | Budget; relied on the 09-21 dump plus 223 new boards' metadata |

## 16. Why the test suites were green over these bugs

Answer to the owner's question during the audit:

1. **Mocks are not the system.** The AI tests mock transport and history, so 323 pass while the model never sees the element. Server tests hand-build payloads.
2. **Tests that lock in bugs.** `useCanvasDragDrop.test.ts:729` asserted the media-drop P0 as correct.
3. **Unit-only coverage of seams.** Every finding in §7 crosses 2+ modules; almost no test does.
4. **Load-sensitive timeouts.** 15 s per test; under parallel load 2–11 tests per suite fail falsely and pass alone.
5. **Skipped infrastructure.** The DB tier needs Postgres; the root `tsconfig` reports 4,239 alias errors (only the dashboard tsconfig is a working check).

**Remedies:**
- Contract tests that parse real payloads through the shared Zod schemas.
- Integration tests on a real `Composer` (no mocked history).
- A Playwright journey suite for J1–J20 against the dev server, using `scripts/baseline/editor-rig.mjs`.
- `--testTimeout=60000 --maxWorkers=4` for full runs.
- Postgres in CI for `test:db`.
- A working root typecheck script.

---

## Appendix A — parked fix branch

`fix/editor-ai-audit-2026-10-08` at `~/Desktop/buildrik-worktrees/editor-ai-audit`. 38 commits on base `44f5db956`, not pushed, not merged.

- **Covers:**
  - **AI:** locks, all-or-nothing, element context, abort, Undo all, Generate-block Stop and scope, summary cap, href guard.
  - **Server AI:** alt-text quota, masking and rate limit, errorFormatter, OpenAI timeout, generation slots, dispatcher, worker guards, page-type mapping.
  - **Canvas:** Layers through engine commands, breakpoint-aware writes, lock refusals, Copy, hidden/locked attributes after re-render, media drop, inline save.
  - **Publish:** site workspace, path validation, not-loaded guard, cancel keeps PUBLISHED, conditional claim, poll race, Vercel toast.
  - **Brand/media/SEO/issues:** token alias emit, plan quota, replace alt, stock per-provider, robots, SEO merge, Issues refetch, cross-page locate.
- **Known caveats:**
  - Commit `21635494e` also contains an `AquibraStudio.tsx` hunk from the Issues fix (the intermediate commit doesn't typecheck alone; HEAD does).
  - `CanvasButton.tsx` deletion landed in a test commit.
  - The editor's `openai` dependency removal was reverted (pnpm v11 lockfile churn).
  - Rollback of legacy versions with unsafe paths (`/about.html`) now fails by design.
  - Page slugs starting with `api/` are refused at publish.
- **Test results at branch HEAD:**
  - Editor: 518 files / 5,227 tests (canvas scope) and 258 / 2,819 (brand/media scope) green.
  - Server AI: 36 files / 297 tests.
  - Publish: 65 files / 663 tests.
  - Typecheck: editor `tsc` 0 errors; dashboard + server `tsc` 0 errors.
  - **No live walk of the branch yet** (Wave 0 step 3).

## Appendix B — files

- `README.md` — this synthesis
- `ISSUE-INDEX.md` — all 292 Phase-2 issues sorted by severity
- `phase1-code/01…08` — code audits
- `phase2-live/L1…L5, FG, DQ, BRIEF` — live, Figma and quality audits with full per-issue entries

---

## CEO review (2026-10-08) — working record

Plan under review: this README §13 (waves 0–8) and §14 (dependencies). Reviewer: /plan-ceo-review. Main has moved since the audit: `f9f79bc66..b51ade6fd` (11 commits — brand follow-ups incl. "⌘Z of a Dark mode change reverts it", a Brand Part 1b implementation plan, settings a11y). Findings touching Brand colour mode (L4-021/022) must be re-checked against `b51ade6fd` before work starts.

### 0A. Premise challenge
- **Real problem:** users cannot trust the Editor with their content. Four Critical issues lose or corrupt content silently (export text loss, wrong-page insert, template corruption, media drop), and save/recovery/publish fail open. The 292-issue list is the symptom inventory, not the goal.
- **Target outcome:** every user action is one undoable step that lands where the user is looking, persists, survives reload and publishes exactly what the canvas shows. Measured by journeys J1–J20 passing in a real browser, not by issue count.
- **Premise risk in the plan as written:** §13 is ordered by severity but has no exit gate. Nothing stops the same class of seam bug from coming back, because §16's journey suite is listed as a remedy, not a wave deliverable. Fixing 292 issues one by one solves the proxy (the list), not the pain (untrusted seams).
- **Do-nothing cost:** every published site with text+child structures (created by the default Add flow) ships missing text today; duplicate slugs lock a site out of saving; AI can overwrite locked work. Each week of delay is more customer sites carrying corrupted HTML.

### 0B. Existing code leverage
| Sub-problem | Reuse |
|---|---|
| ~35 Phase-1 fixes | Parked branch `fix/editor-ai-audit-2026-10-08` (38 commits, green) |
| Journey tests in a real browser | `scripts/baseline/editor-rig.mjs` (7 traps solved) + the 5 live agents' probe scripts in `editor-audit-evidence-2026-10-08/work-L*` + existing `packages/editor/e2e` Playwright setup |
| AI as structured ops | `ai.streamPrompt` → validated commands → `applyAiEdit` one history transaction (already exists; harden, don't rebuild) |
| Brand Part 1b | `docs/plans/...` Part 1b binding plan on main (`87b7de364`) — Wave 7 Brand work must follow it, not this audit |
| Lock / breakpoint gate | `writeCanvasStyles` + `setStyleAt` on the parked branch |
| Seam assertions | engine events (`COMMAND_ERROR`, `STORAGE_ERROR`) exist but have no listener — wire, don't invent |

### 0C. Dream state
```
  CURRENT STATE                         THIS PLAN                              12-MONTH IDEAL
  Units green, seams broken;     --->   Land parked fixes, kill 4 Criticals,  --->  Every editor action is an op:
  0/37 journeys complete;               close save/publish fail-open,             validated, lock-gated, one undo
  AI edits bypass locks;                then module + AI waves                    step, persisted, event-emitting.
  292 issues, no regression gate                                                   AI is just another op producer.
                                                                                   Journey suite gates every merge.
```
The plan moves toward the ideal only if the journey suite becomes a gate; otherwise it is a one-time cleanup.

### Decision ledger
| ID and owner | Contract and evidence | Current | Proposed | Status | Exact approval and scope |
|---|---|---|---|---|---|
| D-MODE (owner) | Skill 0E | — | SCOPE REDUCTION was recommended | approved | User chose **SCOPE EXPANSION** (AskUserQuestion D1, 2026-10-08). Mode only; approves no plan changes. |
| E1 Journey gate (owner) | §16; L1–L5 live probes; editor-rig.mjs | J1–J20 Playwright suite gates merge to main; Wave 1–2 fixes close only on a green journey | — | approved | D2 answer "Add to plan (recommended)" 2026-10-08; scope = option A text exactly |
| E2 Unified op pipeline (owner) | §7, §9; `applyAiEdit`, `writeCanvasStyles`, engine commands | `applyOps` in engine + shared op schema; Layers/canvas/media/insert/template/AI migrated in Waves 1–2, Inspector after | — | approved | D3 answer "Add to plan (recommended)" 2026-10-08; scope = option A text exactly |
| E3 Contextual AI agent (owner) | §8; 08-ai-extensions; L5 | AI = empty prompt panel + 5 doors without intent | Selection-aware agent: one-click actions, draft preview on canvas, page analyse, all as ops | unresolved | — |
| E4 AI-assisted Issues + quality report (owner) | L4-033/034, FG-026, L5-026 | Issues = DS lint + alt/link scan; no AI fix; no a11y report | One quality report gating publish, with "Fix" / "Fix with AI" per row | unresolved | — |
| E5 Publish fidelity check (owner) | L1-002, L1-016, L5-050 | Exporter can silently diverge from canvas | Render export, diff against canvas text/structure before deploy; block on loss | unresolved | — |
| E6 Save integrity layer (owner) | L5-070…078, engine P1-4/5, L1-008 | Save fails open; 4 surfaces; shared LS key | Outbox + auto-retry + one recovery surface + multi-tab presence + per-site cache | unresolved | — |
| E7 Delight batch (owner) | L1-014/015, L5-013/031/051, L3-002 | small papercuts | 6 × 30-min delighters (see 0G) | unresolved | — |

### 0F/0G. Expansion analysis (SCOPE EXPANSION)

**10x check.** The audit plan makes the Editor *not broken*. 10x is an Editor where **breaking is structurally hard**: every mutation (user, AI, media, template) is one validated op through one gate, every journey is proven on each merge, and what ships is checked against what the canvas shows. Cost is ~2× the fix plan because Waves 0–2 already touch the same seams (`useBlockInsertion`, `applyAiEdit`, `writeCanvasStyles`, exporter, save) — E2/E5/E6 generalise fixes the plan has to write anyway.

**Platonic ideal (user experience first).** A designer selects a hero, types "make this calmer and shorter", sees the change drafted on the canvas with a before/after, presses Apply, and it is one ⌘Z. They switch to mobile, drag an image in, and it lands exactly where the line shows, on the page they're looking at, in the mobile style only. They go offline; a quiet pill says "3 changes waiting"; they come back and it syncs itself. Before publish, one report says "2 images need alt text — Fix with AI", "Hero text contrast fails — use brand Primary 700", and a fidelity check confirms the published HTML contains every word on the canvas. Publish. Nothing surprising ever happens.

**Landscape (Layer 1–3).** L1: incumbents (Framer Agents, Wix Aria, Webflow AI Assistant) moved to *agentic, canvas-aware* AI that edits pages, components, breakpoints and CMS in place [htmlburger, vezadigital, dupple]. L2: builders converge on "visual-edit mode for targeted changes + chat for structure + restore point per AI apply" [docs.instant.so, support.b12.io, docs.youware.com]. L3 (where conventional wisdom is wrong for Buildrik): competitors bolt agents onto the editor; Buildrik's engine already has a validated-ops + single-transaction path. Making **every** mutation an op (E2) means the AI agent gets lock/page/breakpoint/undo correctness for free — trust as the differentiator, not model quality.

**Delight scan (≥5 × ~30 min, E7):**
1. "Added to *Team*" toast names the page and scrolls/flashes the new element (kills L3-002 confusion even after the fix).
2. Help → Keyboard legend generated from the real shortcut map (L1-014 can't recur).
3. Preview page switcher + internal links navigate inside Preview (L5-051).
4. AI review card shows **from → to** values (L5-013).
5. Getting-started count reads the same source as the checklist (L1-015).
6. Comment replies (threaded, one level) (L5-031).

### Answered decision (E1) — ADD
Commitment comparison:
Commitment | Source/approval or pending | Current | A Add | B Defer | C Skip
Journey suite J1–J20 in Playwright via editor-rig | pending | not in plan (§16 remedy only) | built in this plan, gates merge to main | TODOS.md | not built
Runs where | pending | none | CI with Postgres service + local `pnpm test:journeys` | — | —
Waves 1–2 exit criterion | pending | issue closed | journey for that issue green | issue closed | issue closed

Question: D2 — E1: Journey test suite ko merge gate banayein? Project: Buildrik Editor audit plan, SCOPE EXPANSION. ELI10: Abhi 13,000 unit tests green hain lekin 20 user journeys (J1–J20) toote hue hain, kyunke koi test modules ke jod (seams) check nahi karta. E1 yeh 20 journeys asli browser mein Playwright se chalayega aur jab tak sab green na hon, main pe merge nahi hoga. Stakes: bina gate ke yahi bug wapis aayenge; har fix sirf ek baar ka cleanup rahega. Recommendation: A, kyunke rig + probe scripts pehle se bane hain aur yahi wahid cheez hai jo "tests green, product broken" ka cycle todti hai.
Header: E1 gate
A) Add to plan (recommended)
J1–J20 Playwright journeys (editor-rig + Phase-2 probe scripts) built in Wave 0–1 and required green before merging to main; each Wave 1–2 fix closes only when its journey passes. Effort M (human ~1 week / CC ~3 hrs), risk medium (flaky on loaded machines). ✅ Seam bugs can't silently return; every fix proven in a real browser. ✅ Reuses rig traps already solved and ~100 probe scripts from this audit. ❌ CI time grows ~10–15 min and needs Postgres + dev server in CI.
B) Defer to TODOS.md
Record the journey suite as a TODO with the J1–J20 list; fixes close on unit tests + manual walk. Effort S (zero implementation work now), risk high. ✅ Fix waves start faster with no CI work. ✅ Keeps this plan smaller. ❌ Same blind spot that hid 4 Criticals behind green suites stays open.
C) Skip
No journey suite; rely on unit tests and occasional audits. Effort S (zero implementation work), risk high. ✅ No CI cost or flake handling. ✅ Nothing new to maintain. ❌ The audit's main lesson (§16) is ignored; regressions are found by customers.

### Answered decision (E2) — ADD
Commitment comparison:
Commitment | Source/approval or pending | Current | A Add | B Defer | C Skip
Single op applier for every mutation | pending | ≥4 paths: engine commands, Layers direct calls, `applyAiEdit`, media drop, template insert, inline edit | one `applyOps(ops, ctx)` in engine: Zod-validated ops, lock gate, active page + breakpoint scope, one history entry, `OPS_APPLIED` event | TODOS.md | per-bug fixes only
Shared op schema | pending | editor Zod + server hand-written allow-lists duplicate | `packages/shared/schemas/editor-ops.ts` used by editor and AI server | — | —
Migration of call sites | pending | — | Layers, canvas drag/resize/nudge, media drop, block insert, template insert, AI move first; Inspector last | — | —
Wave 1–2 fixes | approved via plan | per-file fixes | implemented as ops where they touch these paths | per-file | per-file

Question: D3 — E2: Har editor change ek hi "op pipeline" se guzre? Project: Buildrik Editor audit plan, SCOPE EXPANSION. ELI10: Abhi ek hi kaam (delete, insert, style change) 4–5 alag raston se hota hai aur har rasta lock, page, breakpoint aur undo ke rules alag tarah lagata hai. Audit ke zyada tar bug isi wajah se hain. E2 ek hi darwaza banata hai: har change (user, AI, media, template) ek validated "op" ho, ek hi jagah lock/page/breakpoint check ho, ek undo step bane aur event jaye taake Layers/Inspector/Issues update hon. Stakes: na karein to har naya feature phir se yeh rules bhoolega; karein to bada refactor hai. Recommendation: A, kyunke Waves 0–2 ke fixes pehle se inhi files ko chhoo rahe hain aur AI Ops v2 bhi yahi chahta hai.
Header: E2 op pipeline
A) Add to plan (recommended)
Build `applyOps` in the engine on top of the parked branch's `writeCanvasStyles`/`setStyleAt` and `applyAiEdit`; shared op schema in packages/shared; migrate Layers, canvas, media drop, insert, template and AI call sites in Waves 1–2, Inspector after. Effort L (human ~3 weeks / CC ~1–2 days), risk medium. ✅ Lock, page, breakpoint and undo rules live in one place, killing whole bug classes (L1-004/005, L2-003, L3-002, L5-003). ✅ AI agent (E3) and quality fixes (E4) get correctness for free. ❌ Large refactor touching hot paths; needs E1 journeys to land safely.
B) Defer to TODOS.md
Fix Waves 0–2 per file now; record the op pipeline as a TODO for after the fixes. Effort S (zero implementation work now), risk medium. ✅ Faster first fixes with smaller diffs. ✅ Refactor can be designed with full knowledge later. ❌ Waves 1–2 write per-path fixes that the refactor later rewrites.
C) Skip
Keep multiple mutation paths; fix bugs where found. Effort S (zero implementation work), risk high. ✅ No refactor risk. ✅ Smallest diffs. ❌ The same lock/page/undo bugs reappear with every new feature, including AI.

## currentDecision (E3)
Commitment comparison:
Commitment | Source/approval or pending | Current | A Add | B Defer | C Skip
Element context to model | parked branch fixes it | id only on main | snapshot + tokens + media (branch) | branch only | branch only
One-click actions (Rewrite/Shorten/Tone/Fix grammar) on toolbar + context menu | pending | none; 5 doors open empty prompt | built as ops (E2) | TODOS | none
Draft-on-canvas preview with Apply/Discard + from→to | pending | applies immediately; PreviewLayer unused | uses PreviewLayer; one undo on Apply | TODOS | none
Page-level "Analyse & improve" (suggestions list, each applicable) | pending | none | built, advisory, quota-shown | TODOS | none
Provider policy (dev+prod) | open owner decision L5-001 | Ollama forced when env set; OpenAI elsewhere | decide in this plan: one provider path with fallback + health check | — | —

Question: D4 — E3: AI ko "contextual agent" banayein (Framer Agents / Wix Aria jaisa)? Project: Buildrik Editor audit plan, SCOPE EXPANSION. ELI10: Abhi AI ek khaali prompt box hai; 5 jagah se khulta hai lekin kisi ko pata nahi user kya chahta hai, aur change foran lag jata hai. E3 element select karke ek click pe "Rewrite / Shorten / Tone / Fix grammar", change pehle canvas pe draft dikhaye (pehle → baad), Apply = ek undo step, aur poore page ka "Analyse & improve". Sab E2 ops se chalega, to lock/page/undo sahi rahenge. Stakes: competitors yahi de rahe hain; bina iske AI "alag aur toota hua feature" hi rahega. Recommendation: A, kyunke backend ops path aur PreviewLayer pehle se maujood hain; sirf jodna hai.
Header: E3 AI agent
A) Add to plan (recommended)
Wave 5 becomes: provider policy fixed (one path + health check), one-click content actions on toolbar/context menu, draft-on-canvas via existing PreviewLayer with from→to and Apply/Discard, page-level Analyse & improve; all through E2 ops and one undo per apply. Effort L (human ~3 weeks / CC ~1–2 days), risk medium. ✅ AI becomes a contextual, trusted capability instead of a separate panel. ✅ Matches 2026 market (agentic, canvas-aware) using code that already exists. ❌ Model cost and quota UX need care; depends on E2 landing first.
B) Defer to TODOS.md
Keep Wave 5 as written (land branch AI fixes, provider decision, alt-text opt-out); agent features become a TODO. Effort S (zero implementation work now), risk medium. ✅ AI stops being dangerous without new surface area. ✅ Smaller plan. ❌ AI stays a blank prompt box; product falls behind competitors.
C) Skip
Only the AI bug fixes; no new AI experience. Effort S (zero implementation work), risk medium. ✅ No new model cost. ✅ No new UI to design. ❌ Owner's goal "AI as deeply integrated contextual capability" is not met.
