# 92 · Fix report: 2026-09-25 full-audit fix arc

Branch `fix/audit-2026-09-25`. Base: main `d8f81319b`. HEAD: `52d03a62d` (368 commits). Every lane is merged, including Lship (the final-review fixes).

**Sources.** Everything below comes from these documents. Nothing was re-run to write this report.
- The plan: `docs/superpowers/plans/2026-09-25-audit-fix.md`.
- The baseline ledger: `91-rebaseline-ledger.json` (75 findings).
- The SDD ledger: `docs/audits/2026-09-25-full-audit/sdd/progress.md`, plus every `lane-*-report.md`.
- The live verification results in `buildrik-af-verify/docs/audits/2026-09-25-full-audit/verify/`.
- `gap-walk/93-gap-walk.md` and `gap-walk/owner-decisions.md`.
- `git log`.

> **The evidence files are not committed yet.** The `verify/results-*.md` files are untracked in the `buildrik-af-verify` worktree. The links below resolve only after the controller copies them into this branch.

Short names for the results files, used in the tables:

| Short | File | Pass |
|---|---|---|
| SEC | `verify/results-security.md` | pass 1, security |
| EA | `verify/results-editor-a.md` | pass 2, editor |
| EB / EB2 | `verify/results-editor-b.md` / `results-editor-b2.md` | passes 1–2, editor |
| DASH | `verify/results-dashboard.md` | pass 2, dashboard |
| EV3 / DV3 | `verify/results-editor-v3.md` / `results-dashboard-v3.md` | pass 3, reseeded DB |
| LV3 | `verify/results-lv3-live.md` | re-check of lane Lv3's fixes |
| LGW | `verify/results-lgw-live.md` | re-walk of lane Lgw's fixes |
| GW | `gap-walk/93-gap-walk.md` | every door × 4 roles |

---

## 1. Summary

### Findings (75 ledger ids)

| Status | Count | Meaning |
|---|---|---|
| **FIXED** | **50** | The ledger's decision-free fix has fully landed. Any remainder sits behind an open product decision (§5). |
| — of which LIVE-verified | 40 | At least one results file shows PASS for the id in the running app. For 7 of these the pass covers only part of the runtime check (marked "partial" in §2). |
| — of which unit / DB / review only | 10 | A-10, A-16, B-4, B-5, B-6, D-1, D-10, D-12, D-13, D-15 |
| **PARTIAL** | **18** | Part of the fix is still open. Either a decision-free piece was not built, or only a guard shipped and the rewrite was deferred by the founder. Each has its reason in §2. |
| **NOT DONE** | **5** | A-11, A-21, C-5, D-2 (founder-deferred rewrites; each has a follow-up plan) and D-8 (the stretch goal was never attempted, and the live pass confirms saves still send every page). |
| Already fixed on main | 1 | S-2 (`2c7b7698c`). It was not re-walked live in this arc. |
| OBSOLETE | 1 | B-17 |

### Other headline numbers

- **Security P0s: all 6 closed in code.** Five have live evidence; the exceptions are listed below.

  | P0 | Id | Evidence | Not verified |
  |---|---|---|---|
  | P0-1 | S-1 | live (SEC) | — |
  | P0-2 | S-2 | fixed before this arc | not re-walked |
  | P0-3 | S-3 | live (SEC) | real Vercel Blob |
  | P0-4 | S-4 | live (SEC) | real Vercel Blob |
  | P0-5 | S-5 | DB tier for the reclaim path; live for unverified login, invite and transfer (DV3, LV3) | the reclaim path live |
  | P0-6 | S-6 | live (SEC) | — |

- **Bugs found beyond the audit: 55 fixed, 14 open** (§3).
  - All of them were caught by live verification, the gap walk, or lane and final reviews, not by the audit.
  - One is critical data loss that already exists in production: duplicate element ids collapse pages (§3 #1). It needs a production backfill (§6).
  - The final whole-branch review ("SHIP-WITH-NOTES") raised 3 Important and 8 Minor items. All are fixed and merged (lane Lship), reviewed, and the three Important ones passed live (LSHIP 6/6).
- **Last full gate** (gate4, final HEAD `52d03a62d`, after every merge):
  - **tsc:** dashboard 0 errors, editor 0 errors.
  - **Root suite:** 1305 / 1305 files, **12,606 tests pass**, no unhandled errors.
  - **Editor suite:** 1179 / 1179 files, **11,508 tests pass**.
  - **`test:db`:** **70/70** (17 files).
  - **`verify:ds`:** exit 0.
- **Live verification volume:**
  - 9 results files across 3 passes plus 2 re-walks.
  - The gap walk covered 272 doors × 4 roles. It found 10 non-ok doors and 0 role-leaks, and all 10 were fixed and re-walked PASS (LGW 17/17).
  - The shared verify DB was written by concurrent verifiers during passes 1–2. Several first-pass FAILs and BLOCKEDs were re-run on a reseeded DB in pass 3.

### Release criteria from `99-release-readiness.md`, re-run

| Criterion | Was (99) | Now | Evidence / what is left |
|---|---|---|---|
| No P0 | FAIL | **PASS (code); live except real Blob and S-2** | §2 S-1…S-6 |
| No critical dead end | FAIL | **PASS** | The approval deadlock is fixed (A-8 PD-7/8 gate, unit only). Review doors are hidden with the layer off (GW). The 10 gap-walk doors are fixed (LGW). |
| No misleading exposed feature | FAIL | **PARTIAL** | Fixed: the page password copy (B-3), the sharing policy (A-9) and the AI summary (C-1), all live. Still open: the dashboard shows VIEWERs write doors that the server then refuses (OD-GW-1), and the Webhooks card copy is stale. |
| No broken return path | NOT VERIFIED | **PASS (door level)** | GW found one no-return door (#3); it is fixed, and LGW GW-3 is PASS. |
| No major ownership violation | FAIL | **PASS** | A-1's mirror is diff-only and runs after the save (live, EA). The owner-surface consolidation is deferred under PD-1. |
| No silent critical failure | FAIL | **PARTIAL** | Fixed: C-8, A-1 and C-9 (live), and B-5 (unit). The production crontab is still NOT VERIFIED (C-2). |
| No collab data-loss risk | FAIL | **PARTIAL** | Fixed: A-1, A-2, the C-4 client half, and the duplicate-id collapse. Still open: the C-4 server resurrection guard. The production backfill has not been run. |
| No unauthorized realtime access | FAIL | **PASS with the flag off** | S-12 returns 404 with collab off (live). Flag-on behaviour was not verified. |
| No critical a11y blocker | FAIL | **PASS (jsdom), not live** | B-6 has a unit test only. |
| No known authz bypass | FAIL | **PASS** | All P0s are fixed. The final review's I-2 (`saveProjectData` accepted another site's page id; predates this arc) is fixed in Lship: refused as BAD_REQUEST inside the save transaction, DB test + live (LSHIP: S2 byte-identical). |
| Critical E2E + collab flows tested | FAIL | **PARTIAL** | There is now a DB tier (66 tests) plus the Phase-2 walks. Collab has 0 of 11 scenarios, because C-5 is deferred. |

---

## 2. Per-finding table

Merge SHAs are the lane merge commits on `fix/audit-2026-09-25`:

| Lane | Merge SHA | | Lane | Merge SHA |
|---|---|---|---|---|
| x1a | `e143ffbaf` | | x4 | `072e6c21f` |
| L1a-2 | `922b9a52c` | | Lfix | `e242b2949` |
| L5 | `e3224e64d` | | L5b | `bda180a95` |
| L4a | `6712dac6a` | | Lrt2 | `90c0a51ee` |
| x3 | `8d4387c37` | | Lrt | `5079568ee` |
| L1a-1 | `8a445d16c` (+`693037f76`) | | Ldata | `0cb9e5c1f` |
| L1b | `31995c39e` | | Lfinal | `092495bdf` |
| L3 | `389c495d6` | | Lv3 | `4a513679e` |
| L2 | `e61a351cb` | | Lgw | `3e298797b` |
| x1b | `7080831de` | | Task 0.1 (direct commit) | `f6c28b7bd` |
| L6 | `0431517b8` | | Task 0.2 (direct commit) | `335de1b72` |
| x5 | `f7ffd5dbd` | | | |
| x2 | `55712c5bc` | | | |
| L4b | `099a4d3ec` | | | |

What the verification column means:
- **LIVE** means a results file shows PASS for this id.
- **LIVE (partial)** means some sub-checks passed live and the rest were not run.
- **Unit/DB** means tests plus code review only.

### Security (S)

| Id | Status | Lane · merge | Verification | Notes |
|---|---|---|---|---|
| S-1 (P0-1) | FIXED | L2 · `e61a351cb`; Lfix `e242b2949`; Lfinal `092495bdf` | LIVE — SEC S-1 | A hostile tree written straight into `pages.blocks` is stripped on load, and Preview carried none of it. Review rounds 3–4 also closed stored XSS on published sites via styles, selectors, `@media` and element ids (§3 #5). S-1b (sandboxed canvas) is deferred with D-7. Not live: the Export modal click-through, and publishing a hostile payload. |
| S-2 (P0-2) | FIXED ON MAIN | `2c7b7698c` (before the arc) | not re-walked | — |
| S-3 (P0-3) | FIXED | L1a-2 · `922b9a52c` | LIVE — SEC S-3 | The PUT re-checks the role and returns 403 after a demotion. The random-suffix key is proven by a DB test only; there is no Blob token locally. |
| S-4 (P0-4) | FIXED | L1a-2 · `922b9a52c` | LIVE — SEC S-4 | `createAsset(foreign URL)` returns 403 URL_NOT_OWNED. A real Blob `del()` was not run. The review closed an encoded-separator bypass (§3 #13). |
| S-5 (P0-5) | FIXED | L1a-1 · `8a445d16c`; L5b `bda180a95`; Lv3 `4a513679e` | LIVE (partial) — DV3 7a/7b/7c, LV3 #11; reclaim DB tier (SEC S-5, 11 DB tests) | Unverified users can log in. Invite and transfer acceptance by an unverified user are refused, and the invite screen now says "Verify your email". Signup reclaim was not walked through `/auth/signup`. Hardened in review: GitHub email trusted only when verified; account-first OAuth (§3 #9–11). |
| S-6 (P0-6) | FIXED | L1a-1 · `8a445d16c` | LIVE — SEC S-6 | An EDITOR member with a VIEWER override gets 403 on save, and the editor shows the Viewer banner. |
| S-7 | FIXED | L1b · `31995c39e`; Lfinal `092495bdf`; x1a `e143ffbaf` | LIVE — SEC S-7 sub-checks 2–4; DV3 row 5 | SEC checked the PD-9 path live: EDITOR submits, the client approves, the site changes, and publish is refused with 412; an EDITOR acknowledging the stale approval gets 403. SEC's 500-instead-of-400 FAIL was fixed in Lfinal and re-passed in DV3. The ADMIN acknowledge-stale positive path is unit-tested only. |
| S-8 | FIXED | L1b · `31995c39e` | LIVE — SEC S-8 | Oversize input → 400. Exhausted quota → 429. VIEWER `templates.generate` → 403. |
| S-9 | FIXED | L1a-1 · `8a445d16c` | LIVE — SEC S-9 | A scoped member sees only S1 in `sites.list`, `recentSites` and `stats`. The domains and components lists are covered by DB tests only. |
| S-10 | FIXED | L1b · `31995c39e` | LIVE — SEC S-10, DASH X-11 | Integrations are redacted for VIEWER. Share links carry no `passwordHash`. SSE carries no `log`, and a suspended member is refused. Found on the way: the `sites.publish` response echoes the caller's own `log.pages` HTML. It is still open (§3). |
| S-11 | PARTIAL | L1b · `31995c39e` | DB tier — SEC S-11 | The SQL-side peek is proven under `America/New_York`, and there is one `clientIp()` helper. Deferred ops step: confirm LiteSpeed's XFF behaviour, then switch to the rightmost entry. The production `TimeZone` is NOT VERIFIED. |
| S-12 | FIXED | L2 · `e61a351cb` | LIVE (flag-off half) — SEC S-12 | Ops and SSE return 404 with collab off. Not verified: flag-on pollution/size refusal, auto-close on demotion, and `check-baked-flags` against a production build. |

### Architecture / ownership (A)

| Id | Status | Lane · merge | Verification | Notes |
|---|---|---|---|---|
| A-1 | FIXED | L3 · `389c495d6` | LIVE — EA A-1 | A canvas-only save sends no `settings.update`. A dashboard SEO edit survives the editor's autosave. EDITOR gets no mirror error. The optional server token was not added. PD-1 remainder in §5. |
| A-2 | FIXED | L3 · `389c495d6` | LIVE — EA A-2 (raw + UI) | CAS `updateMany`. One conflict dialog, and autosave pauses while it is open. The DB race test flipped to passing. |
| A-3 | FIXED | L3 · `389c495d6` | LIVE — EA A-3 | A push writes `designTokens` only, and `projectStyles` stays NULL. Push was kept visible instead of hidden (controller ruling). |
| A-4 | FIXED | L3 `389c495d6` + Lv3 `4a513679e` | LIVE — EA A-4, EV3 A-4 rename, LV3 #3 | Undo keeps settings and the site name. The toast Undo now undoes only its own action; it failed in EV3 and was fixed in Lv3. |
| A-5 | FIXED | L4a `6712dac6a` + Lv3 `4a513679e` + Lgw `3e298797b` | LIVE — LV3 4a/4b/4c, EV3 Layers lock, LGW L-4 | ⌘A + Delete keeps locked elements; it failed in EV3 and was fixed in Lv3. Cut → Paste was inconclusive (HARNESS?). Drag onto an instance was not tried. |
| A-6 | FIXED | L4a · `6712dac6a` | LIVE (partial) — EA A-6 | Esc in library search keeps the library open. ⌘K opens one palette. "Delete with an asset selected" was blocked (empty library). ⌘S with Settings open was not walked live. |
| A-7 | FIXED | L4a · `6712dac6a` | LIVE — EA A-7 | A reload lands on the canvas. "Open export settings" opens Export. History reopens on the Session tab. |
| A-8 | FIXED | L1b `31995c39e` + L4b `099a4d3ec` | LIVE (door level) — GW (review doors n/a with the layer off; ok as OWNER on S3) | "Approval ON + layer OFF → an EDITOR can publish" is unit-tested only. ReviewTab/SendForReview have no guard of their own; both are unreachable with the layer off. |
| A-9 | FIXED | L1b · `31995c39e` | LIVE — SEC A-9 | `requirePw` → 400. DESIGNER is blocked when editors are not allowed. The default expiry is applied. |
| A-10 | FIXED | L1a-1 · `8a445d16c` | DB tier — SEC A-10 | The transfer flow was not walked in the UI. |
| A-11 | NOT DONE | — | — | Founder-deferred: the media scope migration and plan quota. The decision-free quota piece was not built either. Plan: `docs/superpowers/plans/2026-09-26-media-scope-quota.md`. |
| A-12 | FIXED | L5 `e3224e64d` + L5b `bda180a95` | LIVE — DV3 4a/4b/4c, DASH X-9 | The SEO error state has a Retry. Only touched fields are sent. Webhooks moved to dashboard Integrations. The PD-1 surface consolidation remains (§5). |
| A-13 | FIXED | L4a · `6712dac6a` | LIVE — EA A-13 | ⌘K and ⌘⇧P open the same palette, and the chord badge measures 20 px. The local Kbd was kept on purpose, because its tokens differ. |
| A-14 | FIXED | L4a `6712dac6a` + Lgw `3e298797b` | LIVE — EV3 A-14, LGW GW-2/8 | ⌘J opens a collapsed inspector. `check-trpc-orphans` still lists `ai.page` and `ai.layout` with no reason recorded, yet exits 0 (§3 open). |
| A-15 | FIXED | L4b `099a4d3ec` + Lv3 `4a513679e` | LIVE — EV3 A-15 (parent), LV3 #8 (toast) | There is one insert path. The PD-4 catalog merge remains. |
| A-16 | FIXED | L1b · `31995c39e` | Unit / route test | The publish page redirects to `/edit/:id`, and `schedulePublish` returns NO_RENDERER. Neither was walked live. |
| A-17 | FIXED | L1b `31995c39e` + L4b `099a4d3ec` + Lv3 `4a513679e` | LIVE — EV3 A-17, LV3 #7 | Each dynamic page has one `<title>`. A stale template shows a warning row. A template page is no longer published with raw `{title}`. Still open: an empty `<title>` when there is no SEO pattern. The PD-20 remainder is in §5. |
| A-18 | FIXED | L4a · `6712dac6a` | LIVE — EA A-18 | Delete during a time-travel scrub is inert. |
| A-19 | FIXED | L5 `e3224e64d` + Lgw `3e298797b` | LIVE (partial) — SEC A-19 (2 of 4), LGW GW-10 | The deep link keeps its query through login. A bogus site shows "not found" with a way back. Not live: the ⌘K Invite/AI links, and the workspace auto-switch after accepting an invite. PD-22 remainder. |
| A-20 | PARTIAL | L1b `31995c39e` + L4b `099a4d3ec` + L5 `e3224e64d` | Unit | Done: the Mentions → "Account & billing" rename, `actionUrl` values, and no "was deleted" band. Not built: the decision-free A07-16 comment/review notifications. |
| A-21 | NOT DONE | — | — | Founder-deferred (PD-25). Plan: `2026-09-26-presence-heartbeat.md`. |
| A-22 | PARTIAL | L4a `6712dac6a` (+L6 `0431517b8`, Lgw) | LIVE — EV3 A-22 (tsc, verify:ds, siteId on every sync call) | There is now one `getSiteIdFromUrl`, and the dead files are deleted. Three zero-importer dashboard components remain: `limit-reached`, `workspace-health` and `contextual-help`. BrandWorkspace still runs `useDSLint` a second time. The vite build size was not measured. |

### Behaviour / UX (B)

| Id | Status | Lane · merge | Verification | Notes |
|---|---|---|---|---|
| B-1 | FIXED | L4a `6712dac6a` + L5b `bda180a95` | LIVE — EV3 B-1 ×3, EA X-A2 (a)(e) | One shell dirty registry, with prompts for Brand, Settings and CMS records. X-A2(b) has no reachable Exit while Settings is full-page (BLOCKED). The brand-dialog copy differs from the checklist text. |
| B-2 | FIXED | L4b · `099a4d3ec` | LIVE — EV3 B-2 ×3 | A lost status poll gives a retry state. A double publish sends 1 POST. Unpublish is not styled primary. Still open: the "Publish failed" copy when only the poll failed (§3). |
| B-3 | FIXED | L4b · `099a4d3ec` | LIVE — EA B-3 | One honest helper line and a "Hidden from publish" chip. Exclusion from the export is inferred from shared code, not observed. |
| B-4 | FIXED | L5 · `e3224e64d` | Unit | 4xx toast, delete confirm, revert and double-submit guard. None was walked live. |
| B-5 | FIXED | L1a-1 `8a445d16c` + L5 `e3224e64d` | Unit — SEC B-5 | Blocked live: the seed workspace is at its seat limit, so the invite never reaches SMTP. |
| B-6 | FIXED | L5 · `e3224e64d` | Unit (jsdom) | Typing in the dashboard modals was not walked live. |
| B-7 | PARTIAL | L3 `389c495d6` + L4b `099a4d3ec` + Lv3 `4a513679e` | LIVE — EV3 B-7 conflict dialog + ModalRoot name; LV3 #9 dashboard ⌘K | Still without a focus trap: IconBrowser, AssetDetail, PageSettingsDrawer, and the editor command palette. |
| B-8 | FIXED | L5 `e3224e64d` + L5b `bda180a95` | LIVE — DASH X-10 (16/16 fields, 4 forms) | Label colours are unchanged. |
| B-9 | FIXED | L4a · `6712dac6a` | LIVE (partial) — EA B-9 | Layers and rail arrow keys work. Tab-out of the tree is ambiguous. The media checkbox was not tried. |
| B-10 | PARTIAL | L6 · `0431517b8` | Gates | (a) and (b) are done: the dead `FONT_FAMILY` constant, and shell literals now use tokens. The shell migration is founder-deferred (PD-30). Plan: `2026-09-26-shell-migration.md`. |
| B-11 | PARTIAL | L6 · `0431517b8` | Gates | Weight 700 → 600, plus an unsized-Button counter. Snapping font sizes to the ramp was not audited outside the owned files. PD-31 remainder. |
| B-12 | PARTIAL | L6 · `0431517b8` | Gate | Item 1 of 4 is done (Gate 24b ratchet on `shared/forms`). StatusBadge, Tabs and SearchBar consolidation are founder-deferred. |
| B-13 | PARTIAL | L5 · `e3224e64d` | Gate (fails on a planted hex) | The D7 hex ratchet is at 177. jsx-a11y was not added (PD-32 default "warn" not applied). |
| B-14 | FIXED | L4b `099a4d3ec` + Lrt `5079568ee` + Lv3 `4a513679e` | LIVE — EB B-14 Ignore, EV3 A02-9, LV3 #1 | Content issues now reach Issues (they had failed in EB2). Root-relative links are no longer flagged. The clean "No brand issues." state was not reached live. PD-33 remainder. |
| B-15 | FIXED | x3 `8d4387c37` + Lrt `5079568ee` | LIVE — EV3 B-14/A02-9 (a)(b), LV3 #1 | Issues and pre-publish checks list the same alt and link facts. The PD-35 chrome trim remains. |
| B-16 | PARTIAL | L4b `099a4d3ec` + L5 `e3224e64d` | LIVE — EB B-16 ×4 | Done: toast hover pause, menu Esc with focus return, `aria-current`, and the team checkbox. Not done: the `#9CA3AF` → ink-soft swap on the dashboard, and the target-size spec cases. |
| B-17 | OBSOLETE | — | — | — |

### Collaboration / wiring (C)

| Id | Status | Lane · merge | Verification | Notes |
|---|---|---|---|---|
| C-1 | FIXED | L3 · `389c495d6` | LIVE — EB C-1/D-3 (transport 200; the old shape gives 400) | The UI path through the History AI summary was not clicked. |
| C-2 | PARTIAL | L1b · `31995c39e` | Unit (route tests) | The full crontab is in `docs/cpanel-deploy.md`. The production crontab install is an ops step and NOT VERIFIED. |
| C-3 | FIXED | L3 · `389c495d6` | LIVE — EB2 C-3 | A stale publish gets 409 and creates 0 jobs. |
| C-4 | PARTIAL | L3 `389c495d6` + Lrt `5079568ee` | LIVE (crash fix) — EV3 C-4 | The client half is done: server-first reconcile. The server resurrection guard (`expectedUpdatedAt`) was not built. The two-browser reconcile was not run live. |
| C-5 | NOT DONE | — | — | Founder-deferred (PD-37). S-12 is the guard. Plan: `2026-09-26-collab-engine.md`. |
| C-6 | PARTIAL | L4a · `6712dac6a` | LIVE — EB C-6 ×2, EB2 C-6 | Editor half done: export command, "Clear history" confirm, and "Replace media" from the Pages tab. Still open: A14-6 (stale redirects-tab copy), A14-9 (`gate:baked-flags` not in CI), A14-17 (no toast listener for storage/command errors). |
| C-7 | FIXED | L4b · `099a4d3ec` | LIVE — EB C-7 | Honest copy, and `<html lang="en">` in the export. Locale emission is a follow-up (PD-39 override). |
| C-8 | FIXED | x1b · `7080831de` | LIVE — EB2 C-8 | A forced restore failure shows an error toast and no false success. |
| C-9 | PARTIAL | L3 `389c495d6` + Lrt `5079568ee` + Lv3 `4a513679e` + Lgw `3e298797b` | LIVE — LGW L-2 (5/5), EV3 C-9 prompt | A demoted member keeps their work, drops to read-only, and gets no leave prompt. This failed in EB2, EV3 and LV3 before the final fix. Not done: A14-19(c) (link-audit path) and A14-14(b) (cron skip reason). |

### Engineering / performance / tests (D)

| Id | Status | Lane · merge | Verification | Notes |
|---|---|---|---|---|
| D-1 | FIXED | L1b · `31995c39e` | Unit (+ indirect: EV3/LV3 read `publish_build_jobs.log` after COMPLETED) | Rollback was not clicked in the UI. |
| D-2 | NOT DONE | — | — | Founder-deferred. Plan: `2026-09-26-authz-resolver-consolidation.md`. |
| D-3 | PARTIAL | L3 · `389c495d6` | LIVE via C-1 | The AI calls use the superjson client. There is still a separate `AiTrpcClient` factory, and the lint ban on raw `/api/trpc` fetches was not added. |
| D-4 | FIXED | L3 · `389c495d6` | LIVE — EB2 D-4 | The Issues count is correct before Brand is ever opened. |
| D-5 | FIXED | L4b · `099a4d3ec` | LIVE (partial) — EB2 D-5 block drag | A template drag was not completed. |
| D-6 | PARTIAL | L6 · `0431517b8` | Unit / lint | Done: the NUL escape, stale exemptions, the engine↔services lint at warn, and dead files. Not done: unifying the four server slugify copies; deleting the stub email integrations (PD-42 default "delete"). |
| D-7 | PARTIAL | L6 · `0431517b8` | Unit; live inconclusive (EB2 D-7 HARNESS?) | Only the decision-free guard shipped. Incremental DOM patching is founder-deferred with S-1b. Plan: `2026-09-26-canvas-sandbox-incremental-dom.md`. |
| D-8 | NOT DONE | — | LIVE FAIL — EB2 D-8 | A one-page edit still saves all 3 pages. L3's stretch goal was never attempted. |
| D-9 | PARTIAL | L6 · `0431517b8` | Unit | Hover updater and rAF coalescing are done. The `React.memo` wraps on ProInspector, LeftSidebar and PageTabBar were not done. The Profiler was not run. |
| D-10 | FIXED | L6 · `0431517b8` | Unit | Hydration now emits once, as a batch. Review found and fixed a font-sync regression (§3 #23). The Profiler was not run. The PD-44 thumbnails remain. |
| D-11 | FIXED | L1a-1 `8a445d16c` + L6 `0431517b8` | LIVE (partial) — EB2 D-11 list | The site list is one batched request, plus a DB query-count test. CMS batching was not measured live. The PD-45 versions part remains. |
| D-12 | FIXED | L6 · `0431517b8` | Unit only | A production bundle check was never run (EB/EB2 D-12 BLOCKED). The lane called this its biggest gap. |
| D-13 | FIXED | L5 `e3224e64d` + L5b `bda180a95` | Unit | `staleTime`, SSE back-off, debounced search, and an infinite media query. None was walked live. |
| D-14 | PARTIAL | Task 0.2 · `335de1b72` | Suite | D-14a is done: a Postgres tier with 66 DB tests. Its CI job has never run on real GitHub Actions. D-14b/c/d are founder-deferred. |
| D-15 | FIXED | Task 0.1 `f6c28b7bd` + L6 `0431517b8` | Suite (gate3) | The suite is green, and the source-scan tests are renamed `*.source.test.ts`. |

---

## 3. Bugs found beyond the audit

These are defects that were not audit findings, or that the audit fix itself missed and verification or review then caught. The "Fixed" column gives the live evidence when there is some.

### Fixed

| # | Bug | Severity | Found by → lane | Fixed |
|---|---|---|---|---|
| 1 | **Duplicate element ids across pages.** Every seeded page, AI-generated page and template page has root id `"root"`. The canvas showed the wrong page (X-A1), and a save copied one tree into every page. This is **data loss that already exists in production.** | Critical | EA X-A1 / DASH X-4 → Lrt (+Lrt2 diagnosis) | Y. LIVE: EV3 X-4, X-A1. Existing collapsed pages cannot be recovered. A **production backfill** is required (§6). |
| 2 | **`FormBlock.id` was a global PK equal to the element id.** Sites from one template overwrote each other's form settings, and the second site's submissions returned FORM_NOT_FOUND (cross-tenant). | Critical | Lrt review → Ldata | Y. LIVE: DV3 1a/1b/1c. |
| 3 | CMS bindings were stripped by the save schema, so every reload unbound elements and publish shipped placeholders. | High | Lrt → Ldata | Y. LIVE: EV3 D-11 rows. |
| 4 | Persisted bindings allowed stored XSS: the property was unvalidated and the fallback could be `javascript:`. | High | Ldata review → Ldata | Y. LIVE: EV3 D-11 security. |
| 5 | Stored XSS on **published** sites via element style values, selectors, `@media` queries and element ids, including a `</style>` breakout. | Critical | L2 review rounds 3–4 → L2 | Y. Review and unit only. |
| 6 | Component masters and instance overrides bypassed the sanitizer. A malformed master crashed the library, and a malformed override deleted the instance on sync. | High | L2 review → L2 | Y. Unit. |
| 7 | A CMS field `javascript:` value was substituted into a template `href` on dynamic pages. Now handled by a parser-based sanitizer. | High | x4 review → x4 | Y. DV3 3b/3c (render). The `href` case is checked by code only. |
| 8 | `stripMarkup`'s fixed 10-pass cap failed open: a 10×-nested `<img onerror>` survived. | Critical | final Lfinal review → Lfinal | Y. LIVE: DV3 3a/3b. |
| 9 | The GitHub OAuth email was trusted without its verified flag, which allowed account takeover. | Critical | L1a-1 review → L1a-1 | Y. Unit and DB. |
| 10 | The OAuth provider-link guard ran after side effects: an orphan user, or a lockout after an email change. Fixed by making sign-in account-first. | Important | L1a-1 review → L1a-1 | Y. DB test. |
| 11 | "Connect provider" in Settings silently switched the session to another user. | Important | L1a-1 minor → L5b | Y. Unit. |
| 12 | Share-link create and revoke responses included `passwordHash`. | High | L1b review → L1b | Y. LIVE: DASH X-11 (create). |
| 13 | `isOwnedBlobUrl` accepted `%2F` and `%5C` encoded separators. | Important | L1a-2 review → L1a-2 | Y. Unit. |
| 14 | `reviews.currentRound` returned the client token to EDITORs. | Critical | x1a review → Task 0.3 | Y. Unit. SEC confirmed `token:null` on submit. |
| 15 | The ⌘K palette and `ui:switch-tab` bypassed the VIEWER rail gate. | Important | carry → Lfix | Y. Unit. The VIEWER palette was never opened live. |
| 16 | `projectStyles` was not sanitized on theme rollback or on `duplicateSite`. | Important | L2 carry → Lfix | Y. Unit. |
| 17 | `</head>` first-match injection put head tags inside a `<style>` block. | Important | L2 carry → Lfix | Y. Unit. |
| 18 | A conflict raised by publish suspended autosave with no visible blocker. "Reload latest" resurrected the stale copy. Unstamped rows hid teammates' edits. | Important | L3 review → L3 | Y. Unit. |
| 19 | A lost publish poll left the UI stuck on "publishing". | Critical | L4b review → L4b | Y. LIVE: EV3 B-2. |
| 20 | The auto-milestone cooldown reset on remount and burned AI quota. | Critical | L4b review → L4b | Y. LIVE: EB2 D-3. |
| 21 | Form after-submit problems: the redirect could not be saved; a relative redirect gave a 500; an EDITOR could reroute submission email; a blur caused a false FORBIDDEN. | Important | x2 review → x2 | Y. LIVE: DASH X-2/X-3. |
| 22 | x2 and x4 each had their own `isDangerousUrl` copy (SSOT). | Minor | controller → x2/x4 | Y (unified onto L2's helper). |
| 23 | The D-10 batch event was not heard by font sync, so synced site fonts stopped registering. | Important | L6 review → L6 | Y. Unit. |
| 24 | The `--bk-danger` token was undefined, which made `verify:ds` red and blocked the pre-push hook. | Base defect | L5b / Lrt → Lfinal | Y. Gate. |
| 25 | The CMS RecordsTable crashed on slugless fields. | High | EB2 → Lrt | Y. LIVE: EV3 C-4. |
| 26 | `isForbiddenSaveError` never matched a real 403, so demotion recovery was dead code. | High | EB2 → Lrt | Y. LIVE: EV3, LGW L-2. |
| 27 | The Issues scanner read emptied page snapshots, so content issues never appeared. | High | EB2 → Lrt | Y. LIVE: EV3. |
| 28 | Server pre-publish checks had no alt-text or link rows. | Medium | EB2 → Lrt | Y. LIVE: EV3, LV3. |
| 29 | The "Empty pages" pre-check could never warn. | Low | Lrt → Lrt | Y. Unit. |
| 30 | A renamed version showed its stale name after reload. The first fix then lost offline renames. | Medium | DASH X-1 → Lrt2 | Y. LIVE: EV3 X-1. |
| 31 | "+N from collections" never rendered (it listened on the wrong object), and once it did it was hidden under the footer. | Medium | DASH X-6 / EV3 → Lrt2 + Lv3 | Y. LIVE: LV3 #6. |
| 32 | A VIEWER had no door to History, Review or Activity. | Medium | DASH X-8 → Lrt2 | Y. LIVE: EV3 X-8. The palette half was not checked. |
| 33 | `reviews.submit` returned 500 instead of 400. | Low | SEC → Lfinal | Y. LIVE: DV3 5. |
| 34 | Root-relative links were flagged "malformed" in Issues and pre-publish. | High | EV3 → Lv3 | Y. LIVE: LV3 #1. |
| 35 | Any CMS binding caused an autosave on every open. It wiped the bound text, and VIEWERs got a 403 banner. | High | EV3 / DV3 → Lv3 | Y. LIVE: LV3 #2. |
| 36 | The toast Undo reverted a newer edit (A-4 residual). | High | EV3 → Lv3 | Y. LIVE: LV3 #3. |
| 37 | ⌘A + Delete deleted locked elements (A-5 residual). | High | EV3 → Lv3 | Y. LIVE: LV3 #4. |
| 38 | A demoted member was not switched to read-only (C-9 residual). | Medium | EV3 → Lv3 | Y. LIVE after #44. |
| 39 | A collection's template page published raw `{title}`. | Medium | EV3 → Lv3 | Y. LIVE: LV3 #7. |
| 40 | Components-panel Insert showed no toast. | Minor | EV3 → Lv3 | Y. LIVE: LV3 #8. |
| 41 | The dashboard ⌘K had no combobox ARIA. | Minor | EV3 → Lv3 | Y. LIVE: LV3 #9. |
| 42 | Share draft and Preview showed stale or empty text for a bound element. | High | DV3 → Lv3 | Y. LIVE: LV3 #10 (share). The editor Preview half was not live-checked. |
| 43 | The invite page showed "another email" to an unverified invitee. | Minor | DV3 → Lv3 | Y. LIVE: LV3 #11. |
| 44 | "Publish now" was disabled under `PUBLISH_ALLOW_SIMULATION`. | Medium (dev loop) | EV3 → Lv3 | Y. LIVE: LV3 #12. |
| 45 | **A single click on a canvas link navigated the whole editor away** with no prompt. | High | LV3 → Lgw | Y. LIVE: LGW L-1 (15/15). |
| 46 | The read-only switch raised "Leave site?" in 2 of 5 runs. | Medium | LV3 → Lgw | Y. LIVE: LGW L-2 (5/5). |
| 47 | Switching page tabs sent a save with no edit. | Medium | LV3 → Lgw | Y. LIVE: LGW L-3. |
| 48 | The Delete key did nothing on a Layers row. | Low | LV3 → Lgw | Y. LIVE: LGW L-4. |
| 49 | The share payload carried binding metadata for hidden pages. | Low | LV3 → Lgw | Y. LIVE: LGW L-5. |
| 50 | "Bind to CMS field" did nothing when AI or a column panel was open, or the inspector was hidden. | Important | Lgw review → Lgw | Y. LIVE: LGW 8. |
| 51 | The L-1 link guard detached after a device-frame toggle. | Important | Lgw review → Lgw | Y. LIVE: LGW L-1 (frame states). |
| 52 | The clipboard crashed on http in 8 dashboard copy buttons plus Layers Copy link. | Medium | GW / Lgw → Lgw | Y. LIVE: LGW GW-5, 7. |
| 53 | The 10 gap-walk doors. | S–M | GW → Lgw | Y. LIVE: LGW GW-1…GW-10. |
| 54 | **Suite fallout from merges:** 6 test drifts, the boundary-rules case, the save-styles mock, and the StudioHeader and TemplatesTab mocks. | Test only | gates → Lfix / controller | Y. |
| 55 | A controller-resolved merge made Rename a no-op for viewers. Flagged for review; Lfinal pinned it with a test. | Minor | x1b × x5 merge | Y. DV3 6b. |

The gap-walk doors in #53:
- the letter shortcut after Esc;
- a column panel opening with the inspector hidden;
- hiding the inspector with no way back;
- Bind to CMS landing in the wrong place;
- Layers Copy link throwing a TypeError;
- the Published tab's `<div>` inside `<p>`;
- a dead VIEWER search field;
- Invite and Transfer offered to non-admins;
- the `/edit` 404 for a member without access.

### Final-review fixes (lane Lship, merged)

These come from the final whole-branch review ("SHIP-WITH-NOTES").

| Item | Fix | Commit on `fix/audit-Lship` |
|---|---|---|
| I-1 | The blob new-tab record preview ran `<head>` scripts on the app origin, and analytics ids were not escaped. | `f2eef3553`, `1592f4a5b`, `60dc07b16` |
| I-2 | `saveProjectData` accepted a page id belonging to another site (cross-site overwrite; predates this arc). | `2680937be` |
| I-3 | The CHANGELOG deploy steps did not include the re-id backfill ordering. | `a88964c18` |
| M-4 … M-8 | The public form route escapes through the shared helper. There is one clipboard helper in `packages/shared`. `duplicateSite` sanitizes the copied blocks. The AI worker stores sanitized HTML. The approval and share gates read the effective site role. | `4a73b0cd6`, `cbd891bac`, `89d14042f`, `489b2df00`, `19539d45f` |
| M-1, M-3 | Migration transaction and future-dated migrations. | Handled in the deploy procedure |

**Status:** reviewed (1 fix round: legacy analytics ids are kept, the server only refuses injection-shaped ids; the cross-site refusal is BAD_REQUEST so the editor does not drop to read-only), merged, and live-checked 6/6 (`verify/results-lship-live.md`).

### Found and still open

| Bug | Severity | Source |
|---|---|---|
| The `sites.publish` response returns the job row, including `log.pages` HTML. It is the caller's own HTML, but it breaks the "HTML never leaves the service" rule. | Low | SEC found-on-the-way (checked at HEAD: `publish.service.ts` `return job`) |
| A generated dynamic page gets an empty `<title>` when there is no SEO title pattern. | Low | EV3 #5 |
| B-2: the panel says "Publish failed… previous live version unchanged" when only the status poll failed, even though the job may have succeeded. | Low | EV3 #6 |
| The Webhooks card says form.submit "nothing sends it yet (form capture is unbuilt)". In fact `form-submission.service.ts:173` delivers it. | Low (copy) | DV3 #2 |
| A user with no workspace sees a generic "Couldn't load your dashboard". | Low | DV3 #3 |
| A duplicated site ships the source site's `data-form-block-id` in published markup. | Low | DV3 #4 |
| The editor Preview drops the form's input and Submit button. | Medium, not investigated | DV3 #5 |
| `/dashboard/projects?sort=traffic` sends `sort:"lastEdited"`. | Low, not investigated | EB2 |
| `check-trpc-orphans` lists `ai.page` and `ai.layout` as FAIL but exits 0. | Low | EV3 A-14b |
| The "Locked · Unlock" toast lingers in the stack. | Low | LV3 #5 |
| `/api/sse/notifications` fails on every dashboard load (305×). May be the dev server. | not investigated | GW |
| A VIEWER's Sharing tab shows an enabled "+ New link" (part of OD-GW-1). | UX | DASH |
| A click inside inline-edited text ends the edit. May be the harness. | ? | LGW |
| The selection toolbar covers small selected links (2 of 19 midline points exposed). | UX | LGW |
| On the cross-site save refusal, the canvas banner still says "Check your connection" while the toast says "Reload the site". | Low (copy) | LSHIP |
| The Meta Pixel `<noscript><img>` ends the published `<head>` early, so the Clarity script lands at the top of `<body>` (it still runs). Pre-existing. | Low | LSHIP |

---

## 4. Not verified live, and why

This collects every "not verified" line from the results files and lane reports that still applies at HEAD.

### Needs infrastructure this environment does not have

- **Real Vercel Blob** (S-3 random key, S-4 `/u/<userId>/` prefix and `del()`, the upload routes): there is no `BLOB_READ_WRITE_TOKEN`. DB tests only.
- **Production values:** the Postgres `TimeZone` and the LiteSpeed XFF behaviour (S-11), and the cPanel crontab (C-2). There is no production access.
- **Collab with the flag on** (S-12: pollution/size refusal, auto-close on demotion), and `check-baked-flags` on a production build. This would have meant restarting the shared server or running `next build`.
- **A production bundle** (D-12 lazy chunks, A-22 build size): `next build` was not run.
- **A real Vercel deploy:** simulation only. A form submitted from a real published page was replaced by a POST to the public route (DV3 1c).
- **Real OAuth providers** (the S-5 GitHub/Google paths, the connect-provider refusal): unit and DB tier only.
- **SMTP failure** (B-5): the seed workspace is at its seat limit, so the invite never reaches SMTP.
- **The GitHub Actions DB-tier job** (D-14a): it has never run on real GHA.

### Needs Profiler or Performance instrumentation

- D-7 colour-slider cost (the harness never opened the picker), D-9 hover commits, and D-10 hydration commits.

### Not walked because of time budget, harness limits or missing fixtures

- **S-1:** the Export/Download-All UI; publishing a hostile payload.
- **S-5:** the `/auth/signup` reclaim walk.
- **S-7:** the ADMIN acknowledge-stale positive path.
- **A-10:** the transfer UI.
- **A-19:** the ⌘K Invite/AI links; the invite-accept workspace auto-switch.
- **A-4, A-6:** A-6's ⌘S with Settings open; A-6's Delete in the library (blocked: the library was empty).
- **A-5:** Cut → Paste (HARNESS?); drag onto an instance.
- **B-1 / X-A2(b):** no reachable Exit while Settings is full-page.
- **B-3:** export file-list exclusion (inferred, not observed).
- **B-4, B-6, D-13:** no live walk.
- **B-9:** the media checkbox; tab-out of the tree is ambiguous.
- **B-14:** the clean "No brand issues." state; the low-contrast Ignore via the Issues panel.
- **C-4:** the two-browser reconcile; the components error/Retry state.
- **C-1:** the UI path (History → AI summary).
- **D-3:** the milestone banner trigger itself (only the cooldown was checked).
- **D-5:** template drag.
- **D-11:** CMS batching across several collections (the seed has 1 collection).
- **D-1:** Rollback click.
- **A-16:** the publish-page redirect in the browser.
- **A-20:** the bell UI.
- **C-7:** a published `fr` payload.
- **X-2:** the inspector toast and revert on the ADMIN-only FORBIDDEN (server call only).
- **X-5:** the `javascript:` → sanitized-href case in real generated HTML (by code; render-level checks passed in DV3).
- **X-8 / Lfix #15:** ⌘K for a VIEWER (the palette never opened for VIEWER in any pass).
- **LV3 #10:** the editor Preview toggle on a bound element.
- **LGW:** transfer by OWNER on a site another member created (no such site in the seed); a canvas form submit; the 2-row Layers delete confirm; the real OS clipboard; the reveal tint.

### Gap-walk coverage limits (93 §"Doors not walked")

- Destructive commits were only opened to their confirm.
- Doors that need a published site were not walked.
- Review-layer doors were walked as OWNER only.
- Agency tabs were not walked.
- Notification side effects and inner panel controls were not walked, nor were canvas gestures.
- Routes outside the inventory: `/onboarding`, `/auth`, `/review`, `/share`, Use template.
- Roles: ADMIN, DESIGNER and outsider were not walked.
- Widths: nothing below 1440 px.
- Missing-screen checks against boards were not possible, because `boards.json` has no 4418 rows.

### Caveat on all of the above

The shared verify DB saw writes from concurrent verifiers in passes 1–2. Pass-1 FAILs of that kind (X-4, X-A1) were re-run on a reseeded DB in pass 3.

---

## 5. Owner decision list

### Plan decisions (PDs) still open

These PDs were either deferred by default, or their default was not applied.

| PD | Question | Blocks |
|---|---|---|
| PD-1 | Consolidate the two site-settings surfaces (dashboard vs editor)? | A-12 remainder |
| PD-2 | Sandboxed-iframe canvas or nonce CSP? | S-1b, D-7 full |
| PD-4 | Merge the template/catalog pipelines? | A-15 remainder (A01-11/A02-10) |
| PD-9 (rest) | Should approval ever work without the agency layer? Stronger signer proof (emailed code)? | S-7 end state |
| PD-14 | Share-link `notify` semantics | A-9 remainder |
| PD-15 | Media scope: workspace or site, plus the data migration | A-11 |
| PD-18 | Build a server renderer, or remove scheduled publish? | A-16 (today it returns NO_RENDERER) |
| PD-19 | Where do Components live? | A-15 remainder |
| PD-20 | Show generated CMS routes in Pages; server-side record search | A-17 remainder |
| PD-22 | Editor tab rule and "Edit in Editor" placement | A-19 (A03-5) |
| PD-25 | Presence-lite vs soft lock | A-21 |
| PD-30 | Migrate the live shell onto the chrome-ui primitives, or delete them | B-10 main |
| PD-31 | Button height 28 vs 32, modal radius, spacing scale, font self-hosting | B-11 remainder |
| PD-32 | jsx-a11y/axe. The default ("warn as a ratchet") was **not applied**. | B-13 |
| PD-33 / PD-34 | Bring Forward meaning; pins and tone | B-14 remainder |
| PD-35 | View popover, inspector density, inline toolbar, PageTabBar, Brand trim | B-15 remainder |
| PD-37 | Collab engine: replace or repair | C-5 |
| PD-39 (follow-up) | Ship locale emission (the UI is kept, with honest copy) | C-7 end state |
| PD-42 | Delete the stub email integrations. The default "delete" was **not applied**. | D-6 remainder |
| PD-43 / PD-44 / PD-45 | Canvas perf target / media thumbnails / version metadata locality | D-7, D-10, D-11 remainders |

### Deferred rewrites (guard or plan only)

Each has a follow-up plan in `docs/superpowers/plans/2026-09-26-*.md`.

| Rewrite | What exists today | Plan |
|---|---|---|
| **C-5** collab engine | S-12 is the guard | `collab-engine` |
| **A-11** media scope and quota | nothing built | `media-scope-quota` |
| **S-1b / D-7** sandboxed canvas and incremental DOM | the D-7 decision-free guard | `canvas-sandbox-incremental-dom` |
| **B-10** shell migration | (a) and (b) done | `shell-migration` |
| **B-11 / B-12** size contract and primitive consolidation | the decision-free subset | `ds-size-contract-primitive-consolidation` |
| **A-21** presence | nothing built | `presence-heartbeat` |
| **D-2** authz resolver consolidation | nothing built | `authz-resolver-consolidation` |
| **C-2 install + S-11 XFF switch** (ops) | runbook in `docs/cpanel-deploy.md` | `cron-install-xff-switch` |
| **D-14b/c/d** | no plan of its own | authz matrix, a real editor E2E, and collab scenarios |
| **A-12 remainder** | — | PD-1 |
| **A-15 remainder** | — | PD-4; the decision-free parts are done |
| **D-8** | — | Needs its own lane. A-2's CAS is in, so it is unblocked. |

### Product calls raised during the arc

- **Home page as a CMS template.** Today it publishes the collection's `{title}` placeholders. Lv3 now leaves template pages out of the publish and adds a pre-check row. For the home page, the reviewer recommends refusing it as a template, plus a pre-check warning.
- **BIG rows not built by x1b:**
  - version author and changes;
  - release note;
  - republish progress;
  - "previous" anchor.
- **x2 built BIG-sized rows that were dispatched as "small only".** These are Form after-submit, honeypot and notify email, and Slider playback. The controller accepted them. Please confirm you want them shipped.
- **x4 Sheets/Airtable** show as "Coming soon" rows. Keep them?

### Gap-walk decisions (`gap-walk/owner-decisions.md`)

| Item | Question | Recommendation |
|---|---|---|
| OD-GW-1 | The dashboard offers VIEWERs about 30 write doors that the server refuses with 403. | (b) Disable each with its reason, from one `can` capability map. Size L. |
| OD-GW-2 | Where does "Bind to CMS field" land? | Lgw built the inspector binding section, as recommended. Revert only if you want the CMS workspace instead. |
| OD-GW-3 | Should view mode have a ⌘K palette? | (a) Hide the field. Lgw did this. |
| OD-GW-4 | Confirm before dashboard Duplicate/Archive? | Confirm for Duplicate; instant Archive with an Undo toast. |
| OD-GW-5 | Board states with no code screen: Publish not-connected, Issues fixing, Components loading, Preview device frame, Compare resend, New page 3-way, Exit interstitial. | Decide per row, or retire it in `boards.json`. |
| OD-GW-6 | Seed fixtures | Agency EDITOR/VIEWER members plus a published site, then re-walk those doors. |

### Follow-ups logged in the SDD ledger

- **P2002 first-write race** on FormBlock or a second GitHub account with the same email. It predates this arc and is rare.
- **The sanitizer's force-keep path** still lets `to`, `values` and `from` through on SVG `set`/`animate`, and still keeps `codebase`. The risk is low: the S-1 write boundary gates it.
- **Templates keyed by file name.** The CMS stale-template check re-derives the exporter's `pageFileNames` rule, so a false stale warning is possible. A binding pinned to an item past the 10k cap falls back.
- **frameRef remount effects.** Other frameRef-keyed effects in `Canvas.tsx` (about lines 361 and 568) have the same remount blind spot that L-1 had. This predates the arc.
- **Simulated-publish toast** says "Published — site is live" even though nothing is deployed.
- **Inline edit:** a click inside a link that is being inline-edited ends the edit. This needs one manual check in a real browser.
- **The selection toolbar** covers small selected links.
- **Dashboard VIEWER write doors** (OD-GW-1).
- **Carried minors:**
  - Lock state goes stale in a race window.
  - A null role briefly shows enabled write controls.
  - A Settings "connect provider" edge case.
  - `requireAdmin(ctx: any)` in `reviews.ts`.
  - A router→Prisma read in `acceptInvite`, and another in `app/edit/[siteId]/page.tsx` (a service import).
  - The honeypot field name is guessable.
  - The per-site CSP blocks inline scripts.

---

## 6. Deploy order

The canonical, ordered procedure is in `CHANGELOG.md` (§Deploy of the audit-fix entry) and, with full commands, `docs/cpanel-deploy.md` §"Ordered deploy — audit-fix release". In short:

1. `pnpm run env:check:prod` — must pass (it also fails if `PUBLISH_ALLOW_SIMULATION=true`, the only thing keeping simulated publishes out of production).
2. DB snapshot + **editors-quiet window** (no edit or publish until step 5).
3. `prisma migrate deploy` over the SSH tunnel — this branch's five migrations in order (`20261001100000` → `20261001120000` → `20261002100000` → `20261003100000` → `20261003110000`) plus any earlier `main` migrations still pending in production. **The new code 500s until these are applied.**
4. `scripts/audit/reid-duplicate-elements.mjs --i-know-this-is-production`: dry run, check the per-site counts, then `--apply`. **Must run after `20261003100000` and before the new editor reaches users**, or collapsed sites lose their form settings for good.
5. Deploy the code (`prisma generate` before build, `NEXT_PUBLIC_*` at build time, `rsync --delete`, restart). The quiet window ends.
6. `scripts/audit/sanitize-dry-run.mjs` on a local restore of the step-2 snapshot, to see which stored markup the S-1 sanitizer will rewrite on the next save.

Before step 3, run the read-only prod SQL in `sdd/lane-Lrt-report.md` (collapsed sites) and `sdd/lane-Ldata-report.md` (sites whose form row was overwritten by another site) and keep the output: the second one is damage the migration cannot undo.

---

## 7. Merge risk vs the founder checkout

The founder tree is `/Users/shahg/Desktop/pencil/buildrik` on `integration/code-gap-final` at `69a88e0b1`.

### How the branches relate

- `69a88e0b1` is an **ancestor** of main `d8f81319b`, 732 commits behind it. This branch is main plus 355 commits, so it is 1,087 commits ahead of the founder's HEAD.
- The founder branch has **no commits** that this branch lacks. Committed work therefore moves forward cleanly (a fast-forward, with no 3-way merge).
- The risk is all in the founder's **uncommitted** state.

### Staged, uncommitted work in the founder tree

These belong to the founder; the fix arc did not touch them.

| File | Risk |
|---|---|
| `packages/editor/src/editor/media/LibraryManager.tsx` (M, +55) | **The staged content has a stray `<<<<<<< HEAD` conflict marker** (line 870 of the staged blob, the `+<<<<<<< HEAD` hunk). It is the founder's to resolve; this arc did not touch that copy. The file also changed 16 times between `69a88e0b1` and HEAD, including this branch's A-6 Escape change `117aa7c10` (+6/−2), so expect a content conflict. |
| `.../tabs/media/components/ConfirmFolderDeleteModal.tsx` and its test (A) | Both already exist on main and on this branch (2 commits). Expect an **add/add conflict**. |
| `.../tabs/media/data/mediaTypes.ts` (M) | Changed in 10 commits since `69a88e0b1`. A conflict is likely. |
| `pnpm-workspace.yaml` (M) | Only moves the `prisma: true` line. This branch does not touch the file, so it is clean. |

### Untracked founder paths that are tracked on this branch

A checkout will refuse to overwrite them. Move them aside first.
- `docs/audits/2026-09-25-full-audit/`: the founder has an untracked copy of the 25 audit docs; this branch tracks 28 files there.
- `packages/editor/docs/audit-2026-09-21/`: 47 files tracked here, already on main.

### Files this branch deletes or renames that exist in the founder tree

27 files are affected. Anything the founder has in progress that imports them will break.

**Dashboard:**
- the publish UI (`components/publish/{pre-publish-checks,publish-progress,publish-success}.tsx` and the pre-publish-checks test). The publish page now redirects to `/edit/:id`.
- `components/comments/comment-preview.tsx`
- `components/dashboard/{recent-sites,site-card}.tsx`

**Editor:**
- `chrome-ui/CommandPalette.tsx` and its test, plus its barrel export
- `sidebar/tabs/settings/screens/WebhooksScreen.tsx` and its test. Webhooks now live on the dashboard's Integrations page.
- `sidebar/tabs/media/components/StockBrowserOverlay.tsx`
- `shell/hooks/{useDeviceZoom,useSaveState}.ts`
- `sidebar/tabs/media/{data/mediaData,hooks/useUsageMap}.ts`
- `inspector/shared/types.ts`
- `shared/constants/storage.ts`

**Conformance:** `specs/s7-settings-webhooks.json`, `surfaces/s7-settings-webhooks.json` and `surfaces/media-drill-in-stock-browser.json`.

**Tests:**
- `__tests__/publish-components.test.ts` is deleted.
- Five root tests are renamed to `*.source.test.ts`: `db-data-flows`, `e2e-backend-safety`, `e2e-frontend-gaps`, `schema-integrity` and `soft-delete-cascade`.

**Symbols removed:**
- `ReviewService.currentSiteId` (use `getSiteIdFromUrl`)
- `AiTrpcClient.generateLayout`
- `openai.ts` `generateLayout`/`generateCode`/`improveContent`
- the `isFullPageMode` prop on `StudioPanels`

`schedulePublish` now always throws NO_RENDERER.

### `AquibraStudio.tsx`

This branch changed it in 12 commits (+116/−57) across lanes L3, L4b, L5b, Lv3 and Lgw. The founder tree currently has **no** edit to this file, so it is clean today. Per the standing rule, any founder edit made before the merge must not be staged from an agent session.

### Schema and environment after checkout

- There are 5 new migrations to run:
  - `20261001100000_notification_site_id`
  - `20261001120000_form_block_after_submit`
  - `20261002100000_site_version_updated_at`
  - `20261003100000_form_block_site_scoped_identity`
  - `20261003110000_site_project_cms_bindings`
- Run `npx prisma generate`.
- Run `pnpm install`. A stale `.bin` `NODE_PATH` caused 9 false editor failures in gate3.
