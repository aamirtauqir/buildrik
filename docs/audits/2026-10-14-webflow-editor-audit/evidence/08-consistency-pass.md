# Consistency audit: 2026-10-14 Webflow editor audit README vs its evidence

Scope: `docs/audits/2026-10-14-webflow-editor-audit/README.md` (679 lines) checked against `evidence/01–07*.md` and `evidence/live/L1–L6-results.md`. Code checked at `df60cf9ec` (= HEAD = main). Read-only. I did not edit the report.

Severity: **must-fix** = the report contradicts itself or its evidence on a load-bearing point. **should-fix** = a claim is stronger than the evidence, or a reference is wrong. **nit** = wording, precision or convention.

Result in brief: the backbone holds. Every BK-01…BK-81 has exactly one §F row and every referenced BK id resolves. All 48 file:line spot-checks point at real code, and almost all show what is claimed. Every top-15 lane/check number exists, and nearly all quoted numbers match the lanes (296×28→143×18, 16,855 chars, 11/45·19/60·18/50·19/50, 8 indicators, z 10001 vs 50, 3 Blob PUTs, `xdfj`, 4→3, 6/7/7 counts). The defects are concentrated in five places: a §B1 vs BK-58 contradiction, the P0 definition vs BK-51, §C priorities that drift from §F, P1 recommendations with no backlog row, and about 10 "LIVE ✔" cells that claim more than the lane measured.

---

## 1. LIVE ✔ rows vs lane files

| # | Sev | Location | Problem | Recommended replacement text |
|---|---|---|---|---|
| 1.1 | **must-fix** | §B1 "Export (HTML, ZIP, React)" row (l.144) vs BK-58 (l.662) | B1 says React export output is unverified and "BK-58 is CODE only". BK-58 says `LIVE ✔ L4 #5, N-6`. L4 did exercise React export: #2 ("React export is the same"), #5 (`<h2><hr/></h2>`, heading text dropped) and N-6 (invalid `styles.heading_el-…` dot access). L4 is also missing from B1's lane list. | B1 Live lane cell: `L2 (HTML), L4 (ZIP/HTML/React, served locally), L5 (ZIP), L6 (HTML)`. Remaining cell: `React export: duplicate class/className (BK-58 third clause) is CODE only`. |
| 1.2 | should-fix | §C4 "Tokens (variables)" Verification (l.245) | It cites `LIVE ✔ L3 LC-11`, but L3 marks LC-11 **NOT REPRODUCED (premise not reachable)**. The radius gap was only observed in passing. | `LIVE ~ L3 LC-11 (claim not reachable; observed: the Radius row has no token link)` |
| 1.3 | should-fix | §C4 "Workspace-pushed tokens" (l.247) | User impact reads "Agency pushes silently undone", but L3 LC-14 is **PARTIAL**: tokens were **not** reverted (DB kept 132 pushed tokens; primary stayed #B91C1C). LC-15 restore points were created through tRPC, not the UI. | User impact: `Push origin invisible; dsSchemaVersion regresses 4→3 on a stale Overwrite; push rollback lost after 10 restore points`. Verification: `LIVE ~ L3 LC-14 (no token revert); LIVE ✔ L3 LC-15 (via tRPC, not UI)` |
| 1.4 | should-fix | §C3 "Number fields" (l.226) and BK-60 (l.619) | "`calc()`/`clamp()` rejected" is presented as LIVE ✔ L2 §10-17. L2 measured only the unitless Top offset (and marked §10-17 PARTIAL). L2 never tried calc/clamp. | Verification: `LIVE ~ L2 §10-17 (unitless offset confirmed); calc()/clamp() rejection is CODE only` |
| 1.5 | should-fix | §C8 "Pre-publish enforcement" (l.313) | The whole row is marked LIVE ✔ L5 #19, NF-4, including "Server doesn't run checks". L5 #19 measured only the client button (the publish was "Not clicked"). Server non-enforcement is CODE D-P1, which BK-21 states correctly. | `LIVE ✔ L5 #19, NF-4 (client); CODE D-P1, D-P9 (server, retry path)` |
| 1.6 | should-fix | §C8 "Head code" (l.311) and BK-66 (l.625) | L5 #7 confirmed only the `<meta>` rejection. "Site head code silently wins over page" is CODE (`SEOInjector.ts`), as §D3 l.399 says. | `LIVE ✔ L5 #7 (meta rejected); CODE SEOInjector (site-over-page precedence)` |
| 1.7 | should-fix | §A top-15 BK-08 (l.78) | "can read every site's component masters **and theme data**". L3 LC-18 measured `library`/`libraryGet` returning other sites' masters, and `theme.targets` returning the list of workspace sites. `theme.getShared` and `theme.snapshots` were not called. | `…a site-scoped member can read other sites' component masters (library, libraryGet) and list every workspace site (theme.targets)…` |
| 1.8 | should-fix | §A BK-07 (l.77), §C5 (l.256) | "toast reports 0 lost". In L3 LC-3 the toast carried **no** lost count ("…2 linked instances updated · Undo"). In C-10 the toast did report a loss. | `…the update toast mentions no loss (LC-3); Undo does not restore dropped overrides (C-10)` |
| 1.9 | should-fix | §C6 "Forms: submission correctness" (l.279), BK-44 (l.87, l.574) | "radio/checkbox answers stored as `"on"`". L4 #22 tested **radio only**. | `radio answers stored as "on" (LIVE ✔ L4 #22; checkbox by CODE)` |
| 1.10 | should-fix | §C8 "Redirects / URLs" (l.309) | "sitemap/robots point at a **truncated** non-existent host". Per L5 NF-2 it is the reverse: the sitemap uses the **full untruncated** project name, which does not resolve, while Vercel truncated the real alias. | `sitemap/robots use the untruncated project host (…-d013128c-copy-11.vercel.app), which 404s; Vercel's real alias is truncated (…-d01312.vercel.app)` |
| 1.11 | should-fix | BK-22 (l.593) | "Unpublish/Share/**Cancel** offered to roles the server refuses" is cited as LIVE ✔. Cancel for EDITOR (D-P6) is in L5's "Not verified" list. | `…Unpublish/Share offered to roles the server refuses (LIVE ✔); Cancel for EDITOR (D-P6) not verified` |
| 1.12 | should-fix | §C10 "Primary actions" (l.338), §C1 "Full-page tools" (l.196) | "Four Upload button treatments; four Back-to-canvas placements". L4 #21 (UX-20) is PARTIAL and measured **2 distinct** upload backgrounds, "not 3". L1 J3 measured **three** Back-to-canvas positions (Settings, Templates, Brand). | `Two Upload button treatments (L4 #21); three measured Back-to-canvas placements (L1 J3)` |
| 1.13 | nit | §A "Strengths" Publish row (l.100) | "cancel-wins worker CAS" sits under LIVE ✔. No cancel was exercised. | `…typed UNPUBLISH confirm (LIVE ✔ two real deploys + unpublish); cancel-wins worker CAS (CODE)` |
| 1.14 | nit | §A "Strengths" Layers row (l.106) | "lock-aware Layers drag" was not run in L1 J1. L2 N-6 also shows Layers ⌘-click **adds locked elements** to a multi-selection that the multi-bar then moves. | `Layers ↔ canvas selection sync and inspector breadcrumb (LIVE ✔ L1 J1); lock-aware Layers drag (CODE; note L2 N-6)` |
| 1.15 | nit | §C3 "Displayed value" (l.224) | "colour shows defaults". L2 J1 observed token **names** shown (and an empty Weight), not defaults. | `colour/weight show token names or empty instead of the resolved value (L2 J1)` |
| 1.16 | nit | §C9 "Comments" (l.327) | "comments hidden without the agency layer" sits under LIVE ✔. L6 ran with `agency_layer` ON. | append `(agency-layer dependency: CODE)` |
| 1.17 | nit | §D3 "Form field label vs placeholder" (l.398) | Marked CODE, but L4 #42 confirmed it live (Fields › Label wrote `placeholder`). | `LIVE ✔ L4 #42` |
| 1.18 | nit | BK-09 / top-15 (l.79, l.580) | L5 #15 and #16 are both PARTIAL. #15: Preview remembers Mobile after the first switch. #16: interaction click not exercised. The core claims stand on L2. | `LIVE ✔ L2 §10-1/-8/-10, UX-11; LIVE ~ L5 #15–16; LIVE ✔ L6 #4` |
| 1.19 | nit | BK-17 (l.588) | "edits before reload lost to next sync" is the lane's prediction ("will wipe it"). It was not observed. | `edits before reload are never recorded as overrides (so the next master sync would drop them)` |
| 1.20 | nit | BK-42 (l.86) | "the retry uploads the same file 3×". Measured: 3 Blob PUTs **in total** for 1 file (1 original + 2 on retry), and 2 duplicate rows. | `the retry re-uploads it (3 Blob PUTs for one file) and creates duplicate asset rows` |

All other LIVE ✔ citations checked out against the lane verdicts, including partial checks used only for their confirmed part: L1 #9a, #12, #20; L2 §10-17 unit; L4 #8, #28; L5 #5, #28.

## 2. Webflow (W-id) claims vs 07-webflow-reference.md

| # | Sev | Location | Problem | Replacement |
|---|---|---|---|---|
| 2.1 | should-fix | §C3 Number fields (l.226) | "Values can use `calc()`, `clamp()` (W05)". W05 says this about **variable values**, not Style-panel fields in general. | `Variable values can use calc()/clamp() (W05); calc in plain Style fields is not documented in the sources read` |
| 2.2 | should-fix | §C5 Delete an instance (l.254) | "Instances delete like elements (W06)". 07 §8 does not document this. It documents only that a *main component* can be deleted once it has zero instances. | `Not documented in W06 (W06: a main component is deletable only with zero instances)` |
| 2.3 | should-fix | §C1 Onboarding (l.198) | "Sparse in-product help (W01)". W01 does not describe help as sparse. It lists Video tutorials, an AI learning assistant and help/feedback. | `In-product help via Video tutorials and AI learning assistant panels (W01)` |
| 2.4 | should-fix | §C7 Interactions preview (l.298) | "preview mode runs interactions (W08, W28)". 07 §9 documents timeline playback, not that Preview runs interactions. | `Timeline with play/pause/reverse/loop/scrub (W28); Preview-mode playback not documented in the sources read` |
| 2.5 | nit | §C8 Redirects (l.309) | "clean URLs (W49)" is not in 07. The paid-plan restriction on redirects is omitted. | `301 redirects with wildcards, oldest-first; needs a paid Site or Workspace plan (W49); clean URLs not documented` |
| 2.6 | nit | §C8 Head code (l.311) | Omits the documented plan and role gates. | `…(W47); needs Core/Growth/Agency/Freelancer Workspace or a Site plan; Custom-code section is Site manager/Designer only (W58)` |
| 2.7 | nit | §C7 Recovery (l.297) | "restore locks the site (W50)": 07 attributes the lock to **W62**. Also omits "Only Site managers can access backups (W58)". | `…manual (W50); restore locks the site (W62); Site managers only (W58)` |
| 2.8 | nit | §C7 Undo (l.295) | "Undo per user". 07 scopes this to real-time collaboration. | `Undo per user in real-time collaboration (W62); page delete not undoable (W12/W13)` |
| 2.9 | nit | §C6 Text editing (l.270), Links (l.272), Upload (l.274), Shared library (l.275); §C2 Desktop frame (l.211); §C3 Position (l.225); §C4 Token usage (l.246); §C8 Versions (l.318) | Specifics that 07 does not contain: a "link popover" (W77); page/section/email/phone/asset link types (W03); "Atomic upload" (W07); "shared by collaborators" (W07); "canvas width adjustable" (that is W19, not W01); "every element has Layout + Position" (W04 lists sections, not per element); "Variables show bound fields" (no source); "Backups server-side" (W50 doesn't say). | Drop the unsupported specifics or mark them `not documented`. Re-cite canvas-edge drag to W19. |
| 2.10 | nit | §C5 Library (l.260) | Plan limits are quoted correctly. The role restriction is omitted. | append `; only admin/owner/Designer can accept updates (W25)` |

These are verified correct: rail shortcuts (W01), 1268 px (W01), breakpoints ≤991/767/479 + 1280/1440/1920 (W19), the state list and "not documented: focus-within, pseudo-elements" (W20), orange/blue/pink (W04), variable types (W05), props/slots/variants (W21–W23), library plan table (W25), the 16 CMS field types (W29), collection-list limits (W31–W38), Code Embed 50,000 (W48), single-page publish Team/Enterprise (W53), design approvals Enterprise (W52), RTC 25 users/LWW/no cursors (W62), Audit panel checks (W63), per-item/multi/scheduled publish Premium (W75), "77 sources" and "five conflicts".

## 3. file:line spot-checks (48 checked at df60cf9ec)

All cited files exist. Lines that match the claim: `editor/rail/tabsConfig.ts:294-296` (six rail ids); `CommandCenter.ts:132-148` (read-only gate); `stylePeers.ts:79` (`[data-buildrik-id=…]`, the typo is confirmed); `canvasGeometry.ts:53-66` (unscaled rect); `ResizeOrchestrator.ts:44-45` (raw deltas); `DOMUpdater.ts:117-118` (both axes written); `SelectionHandles.tsx:107,135` (`KeyboardEvent as MouseEvent`); `ResizeHandler.ts:264-268,444` (`history.undo()` on cancel/destroy); `useEditorShortcuts.ts:183-194` (⌘Z with no full-page guard), `:108-113,167-170`; `useComposerInit.ts:326-377,906-909`; `ElementManager.ts:365-372` (clone copies no StyleEngine rules); `ComponentInstances.ts:43-56` (re-clone with new ids); `ExportEngine.ts:1139-1150` (escape path); `useCanvasInlineEdit.ts:164`; `HTMLParser.ts:249-250,268-287`; `AssetUploadService.ts:153-185` (catch → null drops `uploaded.url`); `BuildrikSyncProvider.ts:835-840` (strips `blob:`); `MediaManager.ts:733-735`; `Composer.ts:390-414,561-568,930`; `ReactExporter.ts:219-247`; `reviews.ts:180-191` (workspace `requireAdmin` only), `:263-289`; `review.service.ts:461-483` (filters on workspace, not site); `site-component.ts:91-103`; `media.service.ts:153-155` (`userId` filter); `forms.ts:91-99` (`guardSite` only); `comments.ts:39-44`; `enums.ts:52`; `SEOInjector.ts:231-235`; `CanvasFooterToolbar.tsx:370,403-452`; `sectionOrder.ts:15-54`; `LayoutShell.css:187-193`; `behaviour.tsx:52-59` (raw easing in the shorthand); `cms.ts:19-36` (16) vs `fieldTypes.ts:17` (10); `usePublishSnapshot.ts:183`; `seo/urls.ts:5-9`; `LayerContextMenu.tsx:57-62`; `PageRow.tsx:247-258` (no ⌘D handler); `NewPageModal.tsx:44,52`; `commandOperations.ts:49`; `AssetDetailsPanel.tsx:752-765`; `PreviewOverlay.tsx:119,209-211`; `generation.ts:111-118`; `VersionTimelineManager.ts:282-324`; `sites.service.ts:1049-1092`; `defaultCommands.ts:80-85`; `box.tsx:49`; `Canvas.tsx:709`; `CSSClassesSection.tsx:111-114`; `publish-forms.ts:120`; `Tabs.tsx:84`; `Modal.tsx:57`; `publish-widgets.ts:25-28`; `pruneThemeSnapshots`, `ComponentManager.rehydrateInstances`, `PageManager.duplicatePage` (all exist).

| # | Sev | Issue | Replacement |
|---|---|---|---|
| 3.1 | should-fix | §C6 Rich text (l.269) / BK-40: "`contentFormat` never set". The AI-generate worker sets it: `packages/dashboard/app/api/workers/ai-generate/[jobId]/route.ts:79` `contentFormat: "html"`. `renderContent` also treats tag-shaped `container` content as HTML. | `contentFormat is never set by inline edit, toolbar or HTML import (only the AI-generate worker sets "html"); text elements with markup are escaped` |
| 3.2 | nit | BK-41 (l.649) says "include accordion/slider/countdown runtimes". `publish-widgets.ts:25-28` has countdown and accordion only. | `accordion/countdown runtimes` |
| 3.3 | nit | Path convention is mixed. Some paths are relative to `packages/editor/src/` (`engine/…`, `editor/shell/…`, `services/…`), some to `src/editor/` (`canvas/overlays/SelectionHandles.tsx`, `rail/tabsConfig.ts`, `inspector/…`), some are bare filenames, and the dashboard path `edit/[siteId]/page.tsx` has no prefix. The report never states the base. | Add under "Sources": `File paths: engine/, services/, shared/, blocks/, editor/ are under packages/editor/src/; bare canvas/, rail/, inspector/, panels/ paths are under packages/editor/src/editor/; server/, lib/, packages/ are repo-root.` Better: normalize them all to `editor/…`. |

## 4. Backlog integrity

- **Ids:** BK-01…BK-81 are each defined exactly once in §F. Every BK referenced elsewhere resolves.
- **No LIVE ✘ item is filed as a defect.** UX-01 and the L5 #27 restore are correctly marked ✘ and not backlogged. LC-11 is the only not-reproduced check cited as ✔ (see 1.2).

| # | Sev | Issue | Replacement |
|---|---|---|---|
| 4.1 | **must-fix** | The P0 definition (l.42) includes "security", yet BK-51 (script execution in the editor origin, LIVE ✔ L4 #6) is rated `P1 (security)` in §A, §C6 and §F. BK-45's "VIEWER can export submitter IPs" (a privacy leak, LIVE ✔ L4 #28) is also P1. | Either move BK-51 to the P0 table (`P0 (security)`), or change the definition to `P0 critical, blocking, data-loss, or exploitable cross-user security; self-only XSS is P1` and say why at BK-51. Then split the IP export out of BK-45, or restate its P against the same rule. |
| 4.2 | should-fix | The heading reads "top 15" (l.67), but the table has **18** rows. | `### Highest-impact issues (top 18; full backlog in §F)` |
| 4.3 | should-fix | §C priority ≠ §F priority for the same BK. Full-page tools §C1 **P1** vs BK-65 **P2**. Click-add §C2 **P2** vs BK-37 **P1**. Publish state UI §C8 **P2** vs BK-22 **P1**. Onboarding §C1 **P2** vs BK-75 **P3**. Inspector at 1280 §C3 **P2** vs BK-14 **P1**. Staging §C8 **P1** vs BK-79 **P3** (explained in BK-79 text, but the cells still disagree). | Align each pair. Suggested: BK-65 → P1 (it is the BK-05 enabler); §C2 click-add → P1; §C8 publish state → P1; §C1 onboarding → P3; §C3 1280 → P1; §C8 staging → `P3 (P1 while the row is visible)`. |
| 4.4 | should-fix | Wrong dependency: §C8 "New page flow" (l.307) Dep = **BK-23**, which is version compare. | Dep `BK-25` (template-apply orphan) or `—` |
| 4.5 | **must-fix** | L3 NF-1 (lane-rated **High**, "most serious") is §C5 "Orphan instances after site duplicate" P1 LIVE ✔ (l.255), but it has **no BK row**. Undeletable elements in any duplicated site go untracked. | Add §F P1 row `BK-82 · Orphan instances after site duplicate · server/services/sites.service.ts (duplicate), Inspector Component section · Copy SiteComponent rows on duplicate; offer Detach when master missing · Eng · In a duplicated site every instance can be deleted or detached · LIVE ✔ L3 NF-1` |
| 4.6 | should-fix | Other §C **P1** recommendations with no §F row: Rail additions (§C1 l.194), in-place master editing (§C5 l.253), component properties/slots (l.258), Rich Text element (§C6 l.271), responsive images (l.278), conditional visibility (l.283). There are also P2/P3 orphans: Add-panel taxonomy, parent-selection breadcrumb, cross-parent Group, ⌘-drag+Esc clone, Disclosure, Copy style, radius token picker, Embed, Approvals copy. | Add BK rows, or put this note under §F: `§C rows without a BK id are strategic or polish items, tracked in §E only`. The ⌘-drag+Esc clone and cross-parent Group are LIVE ✔ defects and should get rows (or fold them into BK-13/BK-28). |
| 4.7 | ok / nit | P0 rows vs definition. BK-01…07, 42, 44 are data-loss; BK-08 is security; BK-40 is critical output corruption, verified on export only with publish by CODE (this is stated). | None needed. Optionally note in BK-40: `live deploy not sampled (L4 not authorised to publish)`. |

## 5. Coverage register §B vs lane "not verified" lists

| # | Sev | Issue | Replacement |
|---|---|---|---|
| 5.1 | **must-fix** | B1 Export row (see 1.1). | as 1.1 |
| 5.2 | should-fix | B1 "Canvas: resize, zoom, marquee ✔ / remaining: D-09" hides L1 #19: PARTIAL, marquee drawn at half size and handles jump about 135 px at 50 %. This is a LIVE defect with no row anywhere. | Remaining: `D-09; marquee/handle geometry under zoom is a LIVE ~ defect (L1 #19), folded into BK-01` and add it to BK-01's acceptance criteria |
| 5.3 | should-fix | B1 Components remaining omits items L3 explicitly lists as not verified: LC-9 with a truly offline network, LC-15 through the UI (it used tRPC), ⌘Z after Update from selection, 1280×720. | Append `; LC-9 offline variant; LC-15 via UI (tRPC used); ⌘Z after Update; 1280×720` |
| 5.4 | should-fix | B1 Publish remaining omits D-P6 (Cancel for EDITOR), which L5 lists as not verified (and which BK-22 claims; see 1.11). | Append `, Cancel for EDITOR (D-P6)` |
| 5.5 | nit | B1 Preview "Remaining: —", yet L5 #16's interaction click was not exercised and L4 #8 (page link) is PARTIAL. | `Remaining: interaction click inside Preview (L5 #16)` |
| 5.6 | nit | Viewport: L3, L4 and L6 all state "1280×720 not run". B1 Inspector/A11y rows imply broader coverage. | Add to B3: `1280×720 run only in L1/L2` |
| 5.7 | nit | Lanes conflict on Escape in Brand. L1 J3 says "Escape … **not Brand**" (moves focus to Preview zoom). L6 #7 says Escape closes Brand (NOT REPRODUCED). The report mentions neither. | Add to B3: `Escape in Brand: L1 J3 and L6 #7 disagree; rerun` |

## 6. CONFIRMED lane findings the report omits entirely

(Grep-checked against the README. "Partly" = only a fragment is present.)

| Lane / id | Finding | Sev of omission | Suggested home |
|---|---|---|---|
| **L5 #18 (RR-03)** | Aborted `prePublishChecks` make the 4 server issue rows vanish silently ("7"→"3"), with no scan banner. Blockers look clean. | **should-fix** | Add to BK-21: `failed server checks render as no issues (L5 #18)` |
| **L2 N-3** | The single-page HTML export includes breakpoint CSS for elements on other pages (cross-page CSS leak). | should-fix | BK-80 (export fidelity) |
| **L3 NF-2** | Update/Reset leaves orphaned `:hover` rules for old ids in the saved project after reload. | should-fix | BK-07 |
| **L3 LC-9** | When library hydration fails, the IndexedDB component row's `projectId` moves to the other site; S1 instances lose their Component row. | should-fix | BK-18 or BK-54 |
| **L3 LC-16** (PARTIAL) | "Save page as template" drops the `componentInstance` markers (save side confirmed). | should-fix | New row or BK-69 (currently only "remaining") |
| L3 LC-10 | Rename accepts `brand.test`; the failure toast gives no reason. | nit (only E10 mentions it) | BK-36 |
| L3 NF-6 | ⌘Z/⇧⌘Z with focus in the Brand Value input records two token edits. | nit | BK-05 |
| L3 NF-7 | After a failed DELETE the toast says "saved on this device". | nit | BK-18 / BK-54 |
| L3 J2 | Brand restore point applies in one click with no confirm. | nit | E10 |
| L4 N-8 | Collection-list clones reuse `data-buildrick-id` (duplicate ids in the canvas DOM). | should-fix | BK-46 |
| L4 N-9 / #18 | Library "used in N places" is stale, yet "Apply version" rewrites that image anyway. There is no UI to restore v1. | nit | BK-52 |
| L4 journey 3 | Submissions store `sourceUrl: null` (F-58 observed). | nit | BK-44 |
| L4 journey 2 | Assets header count "1" vs 2 listed tiles after the retry. | nit | BK-42 |
| L5 D-PG12 (J2) | A page's own OG image is ignored; the live page uses the site default `og:image`. | should-fix | BK-66 |
| L5 NF-4 (part) | The errors gate flags links to a *hidden* (existing) page as "points to a page that no longer exists". | nit | BK-21 |
| L5 NF-8 | Hidden pages are offered as CMS dynamic-page templates. | nit | BK-46/47 |
| L5 NF-10 | Nested `Before restoring "Before restoring …"` names, and the row overflows. | nit | BK-67 |
| L5 NF-12 | Session-restore confirm says "discard 2 changes", but only 1 was undone. | nit | BK-19 |
| L5 #11 | Settings Save is disabled with no reason given. | nit (E15 says "with the reason" but no BK cites it) | BK-63 |
| L6 #19 (D-15) | With the role unknown, "‹ Back to editing" loops back to `?view=readonly`. | should-fix | BK-39 |
| L6 #20 | Site menu "Start collaboration PLANNED" is `aria-disabled` with no reason. | nit | BK-64 |
| L6 N7 | Viewer Activity › comment row is a dead door. | nit | BK-57 |
| L6 N9 | Review comment row is `role=button` containing buttons (nested interactive). | nit | BK-64 |
| L6 N10 | Empty "RESOLVED" header after reload. | nit | BK-57 |
| L6 N11 | Internal "Send for review" shows no success toast. | nit | BK-57 |
| L6 N13 | Viewer History empty state says "Use ⌘Z to undo changes". | nit | BK-39 |
| L6 N8 (part) | Escape does nothing while focus is inside the Preview iframe. | nit | §C10 Dialog semantics / E16 |
| L1 #3 (UX-07, PARTIAL) | The selection tag intersects the toolbar on small elements, and the caption is drawn over the element. | nit | §C2 |
| L1 N8 | ⌘1 "Zoom to fit" gives 26 % (fits height, not width). | nit | BK-14 (E3 implies it) |
| L1 N7 / N11 | No automatic save retry after the network returns; a stale "Couldn't save" toast shows beside "Restore my edits". | nit | BK-11 / BK-04 |
| L1 N10 | Preview page selector label overlaps its chevron (visual only). | nit | BK-09 |
| L2 N-5 | Move X/Y show empty while `translateX(10px)` exists. | nit | BK-27 |
| L2 J1 | Border › Color is empty in the inspector while it renders as currentColor. | nit | BK-10 |
| L2 N-7 / L1 harness note | Enter in Add-page goes to the template gallery, and the typed text becomes the page name. | nit | BK-24 |

---

## Counts

- must-fix: 4. Two of them (1.1 and 5.1) are the same B1/BK-58 contradiction. The others are 4.1 (BK-51 vs the P0 definition) and 4.5 (L3 NF-1 has no BK row).
- should-fix: 31 (§1: 11, §2: 4, §3: 1, §4: 4, §5: 3, §6: 8).
- nit: about 45.
