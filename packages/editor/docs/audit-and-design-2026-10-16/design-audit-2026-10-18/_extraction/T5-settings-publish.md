# T5 — Settings · Publish · Review · Export · E-commerce · Animation · Integrations · Sync · Flags

Task T5, INV lines 1257–1550. Audit only. The specs are SPEC-ONLY, so every judgement here is at spec level.

Abbreviations: P/nn = `panels/nn-*.md`. MS = `evidence/ia-final-2026-10-16/module-specifications.md`. CP = `evidence/ia-final-2026-10-16/capability-preservation.md`. INSP = `evidence/inspector-2026-10-16/inspector-preservation-map.md`. BL = `panels/ENGINEERING-BACKLOG-2026-10-17.md`.

## Scope read

| File | Lines read | Note |
|---|---|---|
| `_extraction/EXTRACTION-BRIEF.md` | 1–46 | full |
| INV `editor-feature-inventory-2026-10-16.md` | 1250–1554 | full T5 range (172 table rows + 10-14 P0 bullets + Not verified) |
| P/00-SHARED-CONTRACTS | 1–361 | full |
| D/PRODUCT-DESIGN-BRIEF | 1012–1166 | as assigned; plus grep hits 108, 168, 342, 851, 916–917, 989 |
| P/10-SITE-SETTINGS | 1–158 | full |
| P/14-PUBLISH | 1–313 | full |
| P/12-RIGHT-TASK-HOST | 1–158 | full |
| P/22-GLOBAL-STATES | 1–328 | full |
| P/17-CLIENT-REVIEW | 1–215 | §11–14 (215–end) not read; grep only |
| P/19-INTERACTIONS | 1–60 | rest by grep (§4.3, §4.4 l.103, §5.5 l.143–144, §13 l.273) |
| P/11-PAGES-AND-BOTTOM-BAR | 95–108 | + grep |
| P/01-TOPBAR | 115, 120–150 | site menu §6 |
| P/05, P/23, P/24, P/02, P/09, P/15, P/08, P/03, P/18, P/21, P/25, BL | grep hits only | cited lines only |
| CP | 731–902 | all 172 M06 rows |
| MS | 735–790 (IAF-14), 791–846 (IAF-15), 847–860 (IAF-16 head), 1187–1300 (IAF-22, IAF-23) | |
| INSP | l.342 (grep) | Transform & motion row |
| Skipped | RL, ARCHITECTURE-DECISION (SUPERSEDED), REVIEW-2026-10-17, P/20 (SC-21 deferred), P/13, P/16, P/04, P/06–07 bodies | outside T5 homes; consulted only by grep |

Synonym greps run against P and D for every "OMITTED" verdict (≥2 terms each): export/Export site/ExportModal/ZIP; e-commerce/Stripe/Product card/cart/CollectionSetup; Languages/locale/Translation; your connection/L3-035/server-vs-network; touched/premature; nameserver/L3-033/registrar; 402/403/Vercel plan; L3-027/never-published/accepts submissions; Privacy policy/Terms/Legal line; L5-061/confirm over the panel; too large/bindings size; consent; Grid size/Snap to grid; storage-full/quota exceeded/50 versions; Restore my edits/server-newer/BK-04; authz/site-scope/reviews.revoke/site-component/theme.targets; StripeInjector/unescaped; Secrets/password stripped; mirror (P/11).

## Traceability

Coverage states: COV = COVERED, PART = PARTIAL, OMIT = OMITTED, DEF = DEFERRED-BY-DECISION, REM = REMOVED-N/A, CONF = CONFLICT.

### Settings (F-ST)

| FID | feature | INV | INV line | design home | controls? | states specified | interaction? | coverage | gap / note |
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

### Publish / Review / Export / E-commerce / Animation / Integrations / Sync / Flags (F-PB)

| FID | feature | INV | INV line | design home | controls? | states specified | interaction? | coverage | gap / note |
|---|---|---|---|---|---|---|---|---|---|
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
| F-PB-R15 | Resolve as workspace ADMIN (authz) | 🐞 | 1413 | none | N | — | N | OMITTED | not in P/17 §6 rights or BL (T5-05) |
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
| F-PB-Y44 | Site-scope authz on save/sync | ✅ | 1502 | MS IAF-20 (per CP:896) | — | — | — | COVERED | non-UI; read at the IA-row level only |
| F-PB-Y45 | Site-scope authz holes (P0) | 🐞 | 1503 | none (P and BL grep: 0) | — | — | — | OMITTED | T5-05 |
| F-PB-F1 | FEATURE_PUBLISH | 🚩 | 1509 | P/14 §6; P/12 §6 | Y | flag off copy | Y | COVERED | PLANNED, designed as on |
| F-PB-F2 | FEATURE_DS_AI | 🚩 | 1510 | SC-21 | — | — | — | DEFERRED-BY-DECISION | SC-21 adds a new `NEXT_PUBLIC_FEATURE_AI`; how it relates to DS_AI is unstated (T5-10) |
| F-PB-F3 | FEATURE_COLLAB | 🚩 | 1511 | P/21; SC-9 ⛔ MP-3…5 | Y | per P/21 | Y | COVERED | Phase A blocked |
| F-PB-F4 | Dev build (IS_DEV_BUILD) | 🧪 | 1512 | none | — | — | — | OMITTED | dev-only; the INV note that the beforeunload prompt runs in all builds is not addressed |
| F-PB-F5 | Legacy static flags | ❌ | 1513 | — | — | — | — | REMOVED-N/A | — |

### 10-14 P0 check (INV 1515–1522) → design homes

| P0 | Design home | Verdict |
|---|---|---|
| "Restore my edits" overwrites newer work (Y18/Y19) | P/22 §7 keeps the action; MS IAF-22 H requires a revision check | **Not designed at panel level** (T5-01) |
| Resize Esc / NaNpx (Y6/Y7) | P/05 CV-12, l.107, l.109 | Designed |
| Site-scope authz (R11, R15, Y45) | none in P or BL | **Untracked** (T5-05) |
| Cancel/Unpublish shown to EDITOR (P8, P12) | P/14 §5.4, §5.7 | Designed |

## Principle observations

| PID | module/panel | observation (spec-level) | risk | evidence | suggested status |
|---|---|---|---|---|---|
| P23 | Settings | scope chip per screen + Saving… label + "never Saved before ack" make save scope legible | low | P/10 §4, §5 | PASS-SPEC |
| P23 | Sync/recovery | the recovery banner offers Restore with no server-newer comparison, so success feedback can be false | high | P/22 §7 vs MS IAF-22 H | NEEDS REVISION |
| P24 | Publish | Blocking checks enforced server-side (P-1 ⛔), Free+password Blocking row, typed unpublish | low | P/14 §5.2, §5.7 | BLOCKED (P-1) |
| P24 | Settings | unknown role now disables writes ("Checking access") | low | P/10 §6 | PASS-SPEC |
| P25 | Settings / SC-15 | Settings deletes keep confirms that SC-15 says are overridden; recovery model per action is ambiguous | med | P/10 §7 vs SC-15 | NEEDS REVISION |
| P38 | Publish | full state table: checking, flag off, not connected, offline, viewer, locked, running, timeout, poll lost, outcomes | low | P/14 §5.4–5.5, §6–7 | PASS-SPEC |
| P38 | Export | states exist only in the IA record; no panel-level state/geometry spec | med | MS IAF-15 I; P/01 §6 | NEEDS REVISION |
| P38 | E-commerce | no state spec at all; the only modal is reachable through old documents | med | P/03 AD-16; CP:841 | BLOCKED (P1-D15 discovery) |
| P04 | Publish | one dialog showing only the applicable gate sections replaces four dialogs | low | P/14 §4.3 | PASS-SPEC |
| P01 | Publish | the four-dialog chain collapses to one; checks grouped Blocking/Tips with counts | low | P/14 §3.3, §4.1 | PASS-SPEC |
| P32 | Settings | two SEO homes (site / page) linked both ways; Export removed from Settings and homed in the site menu | low | P/10 §4; P/01 §6 | PASS-SPEC |
| P33 | Fix/return | one rule: Fix in Editor keeps the task open, Fix elsewhere uses the tray + SC-1 Back | low | SC-7; P/14 §5.2 | PASS-SPEC |
| P31 | Confirmations | SC-15 list vs Settings/Redirects/Danger zone confirms disagree | med | SC-15; P/10 §7; P/24 row 37 | NEEDS REVISION |
| P39 | Publish | progressbar ARIA, polite/assertive split, aria-disabled reasons | low | P/14 §8 | PASS-SPEC |
| P39 | Interactions | reduced motion in published runtime + export is release-blocking | low (once guarded) | P/19 §5.5; SC-9 IXD-4 | BLOCKED (IXD-4) |
| P40 | Review / authz | known authz holes (cross-site revoke, resolve cap, library/theme scope) have no backlog row | high | INV 1409, 1413, 1503; BL grep 0 | NEEDS REVISION |
| P26 | Settings | Permissions dialog is placed only in a sketch; its content is undefined | low | P/10 §4 | NEEDS REVISION |
| P36 | Docs | backlog uses `BK-0nn`, INV uses `BK-nn` (Webflow audit) for different items | med | BL; INV 1460–1503 | NEEDS REVISION |

## Contradictions & gaps

| ID | type | statement A | statement B / missing | severity | proposed resolution |
|---|---|---|---|---|---|
| T5-01 | contradiction | P/22 §7 Recovery offer: "Restore my edits (Keep)"; §9 GS-11 "same action" | MS IAF-22 H "Restore check current revision…"; INV 1476–1477 P0 BK-04 (overwrites teammate's newer work) | Critical | P/22 §5.2/§7: before Restore, compare the kept-copy time with the server revision; if the server is newer, offer Download a copy + Compare, never a silent apply. Add a ⛔ SC-9 row (fix exists on an unmerged branch, 765343348) |
| T5-02 | missing | INV 1503 / 1409 / 1413 site-scope authz holes still on main | No row in any P doc or BL (grep authz/site-component/theme.targets/reviews.revoke = 0) | Critical | Add the three to BL and SC-9 as ⛔ with a "server refuses cross-site" acceptance; reference feat/phase1-s5-authz 7140abdd2 |
| T5-03 | contradiction | SC-15: confirms remain only for the listed cases; "Any other confirm in panel text is overridden" | P/10 §5 locale remove "with confirm"; §7 Danger zone "unchanged actions and confirmations" (Archive, Delete site); Redirect delete confirm (P/24 row 37 Keep); Set as primary, slug-change confirm, Forms Delete confirm | Major | Decide per action: add Delete site, slug change and Set primary (live-impact) to the SC-15 list, or rewrite P/10 §7 to Undo. Archive and locale remove → Undo |
| T5-04 | contradiction | P/03 l.145, l.202: e-commerce blocks "Defer (P1-D15)" | CP:841 M06-C1 Set Up Products Collection = "Redesign"; brief l.168 P1-D15 is only a "proposed scope decision" | Major | Mark C1 Defer in CP; record P1-D15 as decided or open in SC-22; state the read-only behaviour for existing product blocks (IAF-23 E) |
| T5-05 | missing | INV 1433: Stripe values injected unescaped ("fix before shipping") | No BL/P row (grep StripeInjector = 0) | Major | Add a BL security row even while the commerce UI is deferred |
| T5-06 | contradiction | MS IAF-15 H: "Vue/Next disabled Soon" | INV 1421 note "Don't draw 'Soon' tiles unless planned"; nothing in P plans Vue/Next | Minor | Remove the Soon tiles from the target or record a plan decision |
| T5-07 | ambiguity | P/14 §5.2: "SEO configured" Tip → Settings › SEO | P/10 §7: the title template is only in the reserved Planned card, so the Tip can never clear (INV 1355) | Minor | Change Fix to "How to fix: set a page title on each page (Page settings)" until the SEO arc, or drop the row's title-template condition |
| T5-08 | missing | INV 1321: password protection is silently skipped on Vercel plans without protection | P/10 §7, P/14 §5.2 and §7 have no state for it | Major | Add a Blocking check / failure row "Your Vercel plan can't protect this site" — never publish public silently (same principle as SC-20) |
| T5-09 | missing | Export is a ~7-feature module (INV 1420–1426) | No panel doc in P; only P/01 §6 row + MS IAF-15 (IA level) | Major | Write a short Export panel (or a P/01 annex): dialog geometry, tab order, states, ⌘K entry, plan-lock behaviour (P/23 allows export on locked sites), reduced-motion parity (BL BK-013) |
| T5-10 | ambiguity | SC-21 introduces `NEXT_PUBLIC_FEATURE_AI` (default off) | INV F2 FEATURE_DS_AI (Brand AI + server extractBrandFromUrl) | Minor | State in SC-21 whether DS_AI is subsumed by, or AND-ed with, FEATURE_AI |
| T5-11 | missing | INV 1371 legal line (Privacy · Terms) in Publish | P/14 §4.1 layout omits it; §9 "No capability removed" | Minor | Add it to the P/14 §4.1 footer or record its removal |
| T5-12 | missing | INV 1292 premature validation (UX-21) | P/10 §7 "validation unchanged" | Minor | Add "validate on blur/submit, not on open" to P/10 §7 General |
| T5-13 | missing | INV 1273 load cards blame "your connection" | P/10 has no copy rule; P/22 §5.3 split is banner-only | Minor | Reuse the P/22 split in Settings load/error cards |
| T5-14 | missing | INV 1467 Overwrite keeps no pre-overwrite snapshot (BK-59) | P/22 §5.4 Overwrite "existing confirm" only | Major | Overwrite first writes a "Before overwrite" save to History › Saves |
| T5-15 | missing | INV 1460 session-row restore never triggers save (BK-19) | P/12 RT-12 keeps Session restore; no fix | Major | P/12 / P/24: a restore marks the document dirty and queues a save; acceptance row |
| T5-16 | missing | INV 1479 RecoveryBanner off for dashboard sites | P/22 §4.2 "stays on the canvas (Keep)" | Minor | State whether it mounts for dashboard sites (with the server-newer check, T5-01) |
| T5-17 | missing | INV 1470 CMS bindings too large; 1469 settings mirror refused | P/11 §8 popover owners have no Site settings / bindings row | Minor | Add owner rows or inline copy |
| T5-18 | stale | CP:733, 784, 785 "Defer" for ❌ rows (S3, S54, S55); CP:803 Defer for P17 that P/14 designs; CP:879 Defer for Y27 that P/15 T-TP-18 revives; CP:792 "Keep" for P6 that P/14 changes | — | Minor | Refresh the M06 dispositions in CP against P/10, P/14, P/15 |
| T5-19 | ambiguity | P/10 §7 Workspace doors "open … in a new tab" | INV 1343: an in-pane door card (Close · Open ↗) exists | Minor | Say whether the door card stays (an intermediate step) or the row opens a tab directly |
| T5-20 | ambiguity | P/10 ST-03 Overview "workspace pending deletion strip" | P/22 §5.6 global banner (9) says the same thing | Minor | One surface: banner editor-wide; Overview keeps a row in Needs attention only |
| T5-21 | missing | S24 grid size / snap to grid left General | No doc names where they live (grep 0) | Minor | UNKNOWN; P/05 should state whether canvas snapping exists |

## Consistency notes

| Topic | Variants | Where |
|---|---|---|
| Release list label | "All releases ›" vs "All versions ›" | P/14 §4.1 vs P/12 RT-10; INV P7/P8 |
| Publish CTA verb | "Publish changes" / "Publish to production" / "Publish" | P/14 §4.1, §4.2 vs INV P10; P/01 §5.9 |
| Export name | "Export site…" vs "Export code" | P/01 §6 vs INV X1 |
| Backup action | "Save a backup" vs "Download a copy" | INV Y9 / IAF-22 vs P/22 §5.4 |
| Noun "Project" | "Project saved successfully", "Project update failed" vs SC-11 "Site" | P/22 §13-19; INV Y36 (not fixed in P/09) |
| Confirms vs Undo | SC-15 list vs Settings confirms | T5-03 |
| Site menu grouping | "Unpublish site…" sits under the Collaborate group | P/01 §6 l.141 |
| Back label | "‹ Back to Editor · Home" (P/10 sketch) consistent with SC-1; Settings group label "Organization workspace ↗" vs the SC-11 rule "Workspace = organization" | consistent |
| Footer height | Settings footer 48 (P/10 §9) and task footer 48 (P/12 §4.2) match | consistent |
| Width | Desktop 1440 for authoring/preview/export (P/05 l.90, SC-8) vs INV X3 note 1024/1320/1440 | resolved by docs |
| Bug IDs | BL `BK-0nn` and INV `BK-nn` are different namespaces with overlapping prefixes | BL vs INV |
| Status priority | SC-4 and P/11 §8 agree: Conflict › Save failed › Offline › Saving › Unsaved › Saved | consistent |

## Counts

- INV table rows in scope: **172** (✅ 112 · 🟡 18 · 🐞 15 · 🚩 5 · 🔒 2 · ⏳ 6 · 🧪 2 · ❌ 12, INV l.1540). Traceability rows: **150** after merging contiguous rows (S28–S30, S38–S40, S43–S44, W4–W6, R2–R7, R9–R10, X3–X7, N2–N5, Y6–Y7, Y18–Y19).
- Coverage by **INV row** (172):

| Status | INV rows |
|---|---|
| COVERED | 101 |
| PARTIAL | 32 |
| OMITTED | 13 |
| DEFERRED-BY-DECISION | 8 |
| REMOVED-N/A | 11 |
| CONFLICT | 7 |

  - Counted by script over the Traceability table (merged rows weighted by INV span).
  - REMOVED-N/A: S3, S24, S27, S45, S54, S55, W1, N1, G1, Y33, F5. Y27 (❌) is counted COVERED because P/15 revives it.
  - CONFLICT: S37, S50, S52, X2, C1, Y18, Y19.
  - By traceability row (150): the same distribution, with merges collapsed.
- Flags requested:
  - **Export:** no panel in P. The only homes are the P/01 §6 site-menu row and the IA-level MS IAF-15. All 7 rows are PARTIAL or CONFLICT.
  - **E-commerce:** no design home. Deferred under P1-D15, which is still only a proposal. P/03 says Defer and CP says Redesign (CONFLICT).
  - **Languages:** covered in P/10 (§4 chip, §5 Mixed, §6 Checking access) and MS IAF-14 H. The remove-locale confirm conflicts with SC-15. Auto-redirect is REMOVED, with no decision to bring it back.
