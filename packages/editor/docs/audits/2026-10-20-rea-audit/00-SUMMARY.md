# REA audit — Buildrick editor vs Webflow (2026-10-20)

Consolidates R1–R4 in this folder. Every row below points to the report that holds its evidence (REA Evidence IDs, file:line, screenshots). Nothing here is new evidence; where reports disagree or a claim is only inferred, it says so.

## 0. What was examined, and how far to trust it

| Part | Method | Code revision | Trust notes |
|---|---|---|---|
| R1 static feature map | REA `analyze_javascript_application` (editor `ev_cc6610f8…`, server `ev_e1e8fed4…`, dashboard `ev_9d0372fe…`) + scripts + manual reading | `6dbe51b25` → re-checked at `dc72314c2` | **REA's graph could not resolve `@/` / `@server/` aliases** (2,080 of 6,226 editor imports "not-found"; 905 of 2,329 files got edges). Reachability counts come from the agent's own import-graph script, not REA. Top-10 issues re-read by hand; the other ~180 come from read passes, labelled O/I/U. |
| R2 runtime surfaces | REA `capture_browser_scenario` (28 Evidence IDs, 83 screenshots) | s00–s11 on `6dbe51b25`, s12–s29 on `dc72314c2` | **Partial coverage**: machine load ~600 during the run, ~40% of REA runs failed. REA has no drag/hover/modifier-click actions. 3 false findings from the agent's own harness were found and withdrawn. |
| R3 runtime workflows vs Webflow | REA scenarios (E1–E7) + Playwright for computed styles, 128 screenshots | tagged [A] `6dbe51b25` / [B] `dc72314c2` | All 21 workflows walked; 18 of 65 Webflow IDs NOT TESTED. W1 create-site could not be re-checked (workspace at 3/3 site limit). |
| R4 published output | **Harness** (real engine + block registry, Export & Publish code paths, publish-worker transforms) + REA on the served output | `6dbe51b25` (export files unchanged in `dc72314c2`) | Shipped Export button not used (site limit). Harness checked against a real simulated publish: same structure, byte-identical animation runtime. CMS item pages, real domains, real form delivery NOT TESTED. |

Webflow side: `../2026-10-20-webflow-reverse-audit/evidence/W-webflow-reference.md` (65 IDs, official sources, docs only — not a Webflow account).

## 1. How much does it match Webflow? (R3 §3, 65 capability IDs)

| Verdict | Count | IDs |
|---|---|---|
| MATCHES | **10** | C04 drag-add, C05 reorder, C07 copy/paste/duplicate, C11 undo/redo, S03 breakpoint cascade, M03 template pages, M06 CMS editing, P02 page settings, X02 versions, X05 pre-publish checks |
| PARTIAL | **27** | C01, C02, C03, C06, C10, C12, C13, C14, S02, S04, S05, S07, S08, S09, S10, E01, E02, E03, K05, M01, M02, P01, P03, P04, I01, X01, F01 |
| DIFFERENT | **5** | C09 shortcuts, S11 paste styles (superset), K01 components (push-from-instance), I03 own runtime not GSAP, O05 AI (removed by decision) |
| MISSING | **5** | S01 class-based styling, S06 style manager, K02 component props, M05 references, I02 timeline |
| BROKEN (whole capability) | **0** | broken sub-behaviours sit inside S03/C02, C01, C12 |
| NOT TESTED | **18** | C08, K03, K04, M04, M07, P05, I04, X03, X04, T01–T05, O01–O04 |

Of the 47 tested: 10 match, 27 partly, 5 work differently, 5 missing. Plain reading: **the everyday building loop works like Webflow; the styling model, component system, CMS depth and animation tooling do not.**

## 2. What the editor contains (R1)

- 1,202 editor source files; 1,141 reachable, **61 unreachable** (36 unused barrel files + 25 modules).
- ~744 feature rows: **679 wired, 41 dead, 9 stub, 13 flag-off, 5 unreachable**.
- Engine: 31 managers, **4 dead** but still constructed on every load (plugins, forms, router, canvas interactions).
- Server: **317 tRPC procedures, 39 with no production caller** (whole `ai` router — kept by decision — `actions`, 7 `pages.*`, 4 `theme.presets.*`, scheduled-publish trio).
- Full inventories: R1 §4–§8.

## 3. Issues — one ledger

De-duplicated across R1–R4. "Src" = report and item. O = observed, I = inferred.

### P0 — breaks published sites or silently loses/changes work

| # | Issue | Src | Label |
|---|---|---|---|
| 1 | **Esc after Enter in an inspector field reverts a saved edit, and the revert persists**; on Tablet/Mobile it also writes a hidden override that ships in the published `@media` block. No undo, no feedback. | R3 P0-1 | O [A] + re-confirmed [B] |
| 2 | **Tabs do not work** on any exported or published site — no runtime exists. | R4 P0-1 | O |
| 3 | **Modal never opens** on the published site — no trigger runtime. | R4 P0-2 | O |
| 4 | **Navbar has no mobile menu** — at 375 px links overflow, page scrolls sideways 9 px, last link clipped. | R4 P0-3 | O |
| 5 | **ZIP code export is a more broken site than Publish** — accordion all open, form has no `action` and submits visitor data in a GET URL, no robots/sitemap. | R4 P0-4 | O (form leak: partial capture) |

### P1 — major friction, likely data loss, or wrong output

| # | Issue | Src |
|---|---|---|
| 6 | Classes carry no styles; class field accepts invalid names (`9 Bad Name!`) and ships them; suggestions call a missing engine method. (Decision BD-30 class-first; spec written.) | R3 P1-2, P2-10 · R1 ISS-C07 · R4 P2-13 |
| 7 | Autosave failing with a server/5xx error keeps **no local recovery copy**. | R1 #1 (O) |
| 8 | An edit is lost if the tab closes within ~1 s; no beforeunload behaviour observed. | R2 P2-8 (O) |
| 9 | Publish ships the live, unsaved tab state; server does not bind it to what was saved/reviewed. | R1 #2 (I) |
| 10 | Deleting a non-empty media folder hard-deletes every file — no in-use check, no undo. | R1 #3 (O) |
| 11 | CMS deletes non-atomic and silent; undo re-creates records under new ids. CMS data sources exist only in memory (gone on reload while UI says "Watching for changes"). | R1 #4, #5 (O) |
| 12 | Read-only/lock bypassed by section reorder, ⌘-drag clone, Group, late inline commit; ⌘K Undo/Redo/Add skip the read-only and Time-travel gates. | R1 #6, #7 (O) |
| 13 | "+ Add page" while the project loads creates a page that is then wiped, no undo. | R1 #8 (O) |
| 14 | Media move/rename/update failures swallowed; "Moved N files" toast always shows. | R1 #9 (O) |
| 15 | Click-to-add nests into the selected leaf (Image inside a Button → `<button><img>`). Paste lands as 2nd child, not last. | R2 P1-1 · R3 P2-21 (O) |
| 16 | Inline text toolbar covers the text, shows wrong values ("Paragraph / 10px" on a 36 px H2), clipped at canvas edge. | R2 P1-2 (O) |
| 17 | Canvas clipping: Tablet frame top (~166 px) unreachable; Desktop frame narrows to ~752 px when a left panel opens, no horizontal scroll. | R3 P1-3 · R2 P1-4 (O) |
| 18 | Preview ≠ canvas ≠ published: Preview drops Forms entirely; heading colour `rgb(51,65,85)` canvas vs `rgb(0,0,0)` Preview/published vs inspector `1a1a1a`; broken images and missing draft CMS list with no explanation. | R3 P1-4, P1-5 · R2 P1-3 (O) |
| 19 | Navigator hides component-instance children and labels them "Card ◇". | R3 P1-6 (O) |
| 20 | Single-key shortcuts collide with Webflow (S/D/H open panels, ↑ = previous sibling, Enter doesn't edit, 1–4 dead, ⌘⇧P opens palette). | R3 P1-7 (O) |
| 21 | CMS: no Reference/Multi-reference fields; collection lists have no filter/sort/limit; list items render empty slots and duplicate `data-buildrick-id`. | R3 P1-8 · R4 P1-12 (O) |
| 22 | `calc()` in spacing silently dropped; spacing fields show no unit. | R3 P1-9 (O) |
| 23 | Published images: no `src` when none chosen; no width/height/loading/srcset. | R4 P1-5 (O) |
| 24 | Published forms: labels not tied to inputs, no required fields, success message only on Publish path. | R4 P1-6 · R3 P2-16 (O) |
| 25 | Orphan CSS of deleted elements ships; whole-site CSS inlined into every page (About: 19.8 KB, 18.2 KB CSS). | R4 P1-7, P1-8 (O) |
| 26 | No canonical/og:url by default; sitemap URLs end in `.html` on a vercel.app domain. | R4 P1-9 · R3 P2-12 (O) |
| 27 | Site body code with inline `<script>` (chat, analytics) silently stripped. | R4 P1-10 (O output; editor warning NOT TESTED) |
| 28 | No `<h1>` by default (Heading = h2), no main/header/footer landmarks. | R4 P1-11 (O) |
| 29 | Scheduled publish has no UI and would fail anyway (cron sends no pages). | R1 #10 (O) |
| 30 | R1 §9.2: 28 further P1s (session expiry on "Go to dashboard", ⌘⇧V hijacking paste in text fields, lint "Ignore" key leaking across sites, presets read per-browser storage, Publish "Compare" opens nothing, Restore without safety checkpoint, custom attributes add-only, Align/Distribute no-op, …). | R1 §9.2 |

### P2 — polish and confusion (selected; full lists R1 §9.3 ·146, R2 P2, R3 P2, R4 P2)

- Status copy contradicts itself: "Published — site is live" beside "Unsaved changes"; simulated publish called live / "connected Vercel account"; Publish button disappears when nothing is pending; About still "Live" after edits. (R2 P2-7, P2-12 · R3 P2-12)
- Raw `{{item.title}}` flashes in collection cards on load. (R2 P2-5)
- Comments mode has no visible cue. (R2 P2-6)
- Three overlapping add catalogues with repeated names; generic icons. Brand says "No brand set" with 58 tokens, triplicates of #1A56DB. (R2 P2-9, P2-10)
- Breakpoints only inside View ›; no breakpoint indicator in the inspector; canvas jumps on switch. (R2 P2-11)
- Enter/Shift+Enter always exit text editing — no line breaks. (R3 P2-11)
- Only `:hover` styled on published output; no focus-visible. 87 unused tokens ship. Editor-internal attributes leak into HTML. Analytics beacon uses localStorage without consent (I). (R4 P2)
- Image Gallery has no layout; no Lightbox. (R4 P2-16)
- Component created on another site appears in a new site's Saved components (I, scope unconfirmed). (R3 P2-13)
- AI leftovers outside the editor: dashboard "Generate with AI", empty-state copy "describe your site". (R3 P2-22 · R2)
- Console: `StyleEngine.importStyles dropped 19 malformed rule(s)` on a new site; React duplicate-key in CMS RecordsTable; dashboard hydration mismatch; favicon 404. (R2, R3)
- Code health: 61 unreachable files, 4 dead managers, duplicated systems (five restore/version systems, four drag mechanisms, two inspector write paths, three zoom paths, two interaction runtimes); layering breaks; `help.feedback` public and un-rate-limited. (R1 §9.3)

## 4. Confirmed fixed on this branch (live, R3 "Changed since the L walk")

Spacing units rem/%/vw · Esc commits inline text · Insert link wraps the selection · Clear formatting · hover states and interactions in Preview · in-panel interaction preview · Mobile inherits Tablet · paste styles on the active breakpoint · Push to master only from an instance root · New page defaults to Blank · ⇧/ opens the shortcut sheet · no AI alt-text on upload.
Also working: published CMS items (drafts excluded, template page generated), published form submission (stored, honeypot), version save/compare/restore, persistence after reload in a fresh browser.

## 5. Not tested (combined)

- Webflow IDs: C08 context menu, K03 slots, K04 variants, M04 conditional visibility, M07 CSV import, P05 fonts, I04 Lottie, X03 code export UI, X04 hosting, T01–T05 roles/branching/comments/collab/client mode, O01–O04 ecommerce/localization/apps/analytics.
- Interactions REA cannot drive: drag, resize, hover on canvas, ⌘/Shift multi-select (R2).
- 48 of 53 element rows not inserted; inspector families container/flex/grid/link/video/form/locked not selected (R2).
- BD-37 create-site redirect, BD-35 conflict save-to-History, BD-36 paste on Tablet+:hover — not live (site limit / not reached).
- Published: CMS item pages via server, real domains/redirects/headers, real form delivery, analytics.
- Static: per-procedure workspace/site authorisation (only CMS, theme, marketplace, clients spot-checked); prisma schema; production build flags.

## 6. Recommended fix order

1. **P0 #1–#5** (Esc revert; Tabs, Modal, Navbar mobile runtimes; make ZIP export run the same post-processing as Publish).
2. **Data-loss P1s** #7, #8, #10, #11, #13, #14 and lock bypasses #12.
3. **Output correctness** #18 (one renderer for canvas/Preview/published), #23–#28.
4. **Editing friction** #15–#17, #19, #20, #22.
5. **Class-first build** (#6) per CLASS-FIRST-SPEC.md, starting P0 foundations; CMS depth (#21) and component props after.
6. P2 copy/status clean-up and dead-code removal.

Side effects of this audit: test content on `audit1020-webflow`; one simulated publish; one form submission row in the local DB; two small PNGs uploaded to the real Vercel Blob store (only upload path). Workspace is at its 3-site limit.
