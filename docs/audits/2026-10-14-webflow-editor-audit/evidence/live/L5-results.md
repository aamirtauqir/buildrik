# L5 live results: Pages, Settings, Preview, Publish, History

Lane L5, 2026-10-14. App http://localhost:3300 (main @ df60cf9ec). Site `audit1014-L5` = `cmv7v820v0010i7dbb0ht8j9b`, workspace "E2E Blank WS 0a95fc". Viewport 1440×900.
Code map: `scratchpad/audit/05-pages-settings-publish.md` §10 (32 checks) and §9.
Evidence: `scratchpad/audit/live/L5/` (`pNN.mjs` scripts, `pNN.json` measurements, PNG screenshots, `live/` curl bodies of the deployed site, `exportzip/` ZIP export).

Sessions used:
- OWNER `qa@buildrik.local`
- VIEWER `qa-viewer@buildrik.local`
- EDITOR `audit1014-l5-editor@buildrik.local` (`cmv7y5eo00000r9mvvljca2g9`), which I created.

**Coordinator notice: the EDITOR user was deleted and recreated.** Another lane's cleanup deleted this user, and the coordinator recreated it with the same id as an ACTIVE EDITOR at 10:14:20Z. I never set a per-site role override, so nothing was lost. My first EDITOR run (p16, 10:12:54Z) may have fallen in the gap, so I re-ran it at about 10:20Z after the recreate. The results were identical: "Only an admin can apply a template", and the export modal opens with Vue and Next.js marked "Soon". The earlier output is kept as `p16-pre-recreate.json`. For D-ST3 I promoted this user to ADMIN for one run, then set it back to EDITOR (verified in DB).

## Real publish and cleanup (owner-authorised)

- **Flag state:** the worktree `.env.local` has `NEXT_PUBLIC_FEATURE_PUBLISH=true` and `VITE_FEATURE_PUBLISH=true`. `PUBLISH_ALLOW_SIMULATION` is not set, so publishes were real.
- **Pre-check:** before publishing, `GET /v9/projects/buildrik-site-e2e-blank-full-d013128c-copy-11?teamId=…` returned 404, so the project did not exist beforehand.
- **Confirm dialog text, first publish:** "Publish to production? Target: your connected Vercel project · Pages: 7 pages · Approval: Not sent for review. · Rollback: The last 20 versions stay restorable · ⚠ 7 warnings — none block". The dialog does not name the target project on a first publish.
- **Confirm dialog text, re-publish:** "Target: Production · buildrik-site-e2e-blank-full-d01312.vercel.app … This replaces the live site immediately for all visitors."
- **Errors gate before the confirm:** "Publish with 6 open errors? … +18 more warnings · Fix issues first · Publish anyway".
- **Deploy 1** (10:36:25Z): job `cmv7z5ums00ggi7dbaooodjgq`, deployment `dpl_2rsKL8qx5UZJunrYRotCVSKnnru2`. It went QUEUED for about 7 s, then DEPLOYING at 40%, then COMPLETED after about 18 s. The success toast read "Published — site is live · https://buildrik-site-e2e-blank-full-d01312.vercel.app · View live".
- **Deploy 2** (re-publish of the already-live site, 10:40Z): job `cmv7zaugm00gxi7dbizby81ea`, deployment `dpl_7WYqaVa5sLi21myeS2Svy7WMrv4Q`, COMPLETED.
- **Vercel project:** `buildrik-site-e2e-blank-full-d013128c-copy-11` (`prj_ht0Kutt5ZuJmKPbAKQ9WG0LRtXkp`).
- **URLs:**
  - Production alias: https://buildrik-site-e2e-blank-full-d01312.vercel.app
  - Deployment URL: https://buildrik-site-e2e-blank-full-d013128c-copy-11-q1kv3n1gy-shah8.vercel.app
- **Unpublish:** done from the Publish panel ⋯ menu. The dialog requires typing UNPUBLISH, and its button is disabled until you do. The request returned 200, the site went to DRAFT, `publishedUrl` became null and the live URL started returning 404. No toast confirmed it.
- **Cleanup:** `DELETE /v9/projects/{name}?teamId=…` using the workspace's stored token (decrypted with the app's own `getActiveVercelConnection` via `npx tsx`; the token was never printed) returned **204**. A follow-up `GET` returned **404 not_found**. Both URLs above now return 404. No other Vercel project was touched. The temporary helper `scripts/baseline/.l5-vercel.ts` was removed from the repo.
- **What remains:** the local DB row `Site.vercelProjectName` still holds the deleted project name. Nothing remains on Vercel.

## Summary counts (32 checks)

| Verdict | Count | Checks |
|---|---|---|
| CONFIRMED | 19 | 1, 2, 4, 7, 8, 10, 11, 12, 13, 14, 17, 18, 19, 20, 25, 26, 29, 30, 32 |
| PARTIAL | 6 | 3, 5 (correct except the defect part, which is confirmed), 15, 16, 21, 28 |
| NOT REPRODUCED (behaves correctly) | 5 | 6, 9, 24, 27, 31 |
| BLOCKED | 2 | 22 (deploy budget), 23 (AI service returns 431) |

## Check table

| ID | Claim | Steps run | Measured | Verdict | Evidence |
|---|---|---|---|---|---|
| 1 UX-03 | A starter card on an empty page opens the whole catalogue | Created a blank page "audit1014 Blank", clicked `canvas-empty-template-site-saas-landing` | `tpl-workspace` present, `.tpl-grid` present, `tpl-ws-preview` absent ("Page templates" grid) | CONFIRMED | 04-blank-page.png, 04b-ux03-after-card.png |
| 2 UX-26/D-PG10/D-PG14 | Create defaults to the template path; no page is created; EDITOR hits a dead end | "+ Add page" as OWNER, then as EDITOR | `new-page-source-template` aria-checked="true". Create with "audit1014 Pricing" left the page list unchanged (4 pages) and opened the catalogue. Confirm text: "A new page named ‘audit1014 Pricing’ will be added". EDITOR: Create page gives toast "Only an admin can apply a template" and no page | CONFIRMED | p2.json, p3.json, p16.json, 02-editor-template-refusal.png |
| 3 UX-04 | Stacked creation feedback | Polled every 16 ms during apply | Applying card and success card never on screen together (0 of 342 frames); `#achievement-title` never present. But stacked feedback did appear: the applying card, then a stray **"Link duplicated · Undo"** toast, then the success modal, then the toast "4 values on this page match your tokens exactly · Connect to tokens" | PARTIAL | p3.json, 03c-after-apply.png |
| 4 D-PG1 | Rename gets stuck after a duplicate-name error | Renamed Page 3 to "Page 4" + Enter, then Keep URL, then typed "audit1014 Unique" + Enter | First Enter showed the URL decision. After Keep URL: error "A page with this name already exists". After the unique name + Enter: input still open, error still shown, **no `sites.saveProject` in 5 s**, name still "Page 3". Only Esc exits | CONFIRMED | p5.json, 05-pg1-dup-error.png, 05b-pg1-unique.png |
| 5 Keep/Update URL + D-PG2 | Redirect offer uses `/slug` while the deploy serves `.html` | Renamed About to "Our story" with Keep URL, then to "Our journey" with Update URL, reloaded, accepted the redirect suggestion, published, ran curl | Toast "Renamed to Our story · URL /about kept · Undo". Update URL opened `pg-drawer` with offer "/about → /our-journey", while the preview URL reads `yoursite.com/our-journey.html`. `slugHistory[0].slug==="about"` survives reload. The server suggestion is also `/about → /our-journey`, saved as a 301. **Live:** `/about` returns 301 to `/our-journey`, which returns **404**. `/about.html` (the old URL actually served) returns **404**. `/our-journey.html` returns 200 | PARTIAL (rename flow works; D-PG2 CONFIRMED live) | p5.json, p6.json, p25.json, live/ |
| 6 Delete + undo | Toast Undo restores; reload after a save keeps the delete | Context menu Delete page, confirm, Undo; then delete again, wait for save, reload, ⌘Z | Toast "audit1014 Fail deleted · Undo"; Undo restored the row; after save and reload the page is gone and `canUndo=false`, so ⌘Z does nothing. Folder case (D-PG11) not run | NOT REPRODUCED | p7.json, 07-delete-toast.png |
| 7 D-PG5 | `<meta>` in head code is rejected | Advanced tab, `<meta name="robots" content="noarchive">`, Done | Toast "Unclosed HTML tag detected. Ensure all tags are properly closed."; drawer stays open. The self-closing `<meta … />` is accepted. The helper text still says "Sanitized before save". The live page-4 HTML contains `<meta name="robots" content="noarchive">` | CONFIRMED | p8.json, 08-pg5-meta.png, live/_page-4.html.body |
| 8 D-PG4 | Hidden home page silently moves the site root | Set "audit1014 Blank" as home, then Hidden, then exported a ZIP | The row still shows the ⌂ icon plus "Hidden from publish". In the ZIP, `audit1014-blank.html` is absent and `index.html` holds the "Home" page's content. Home was restored afterwards | CONFIRMED | p8.json, 08b-pg4-hidden-home.png, exportzip/ |
| 9 D-PG6 | VIEWER can reach New page through ⌘K | VIEWER (`?view=readonly`): Meta+K, Ctrl+K, site-menu trigger | No command palette opens at all, and the site menu is empty, so New page and Export cannot be reached. OWNER palette works (control) | NOT REPRODUCED | p15b-viewer.json, p15b-owner.json, 09-viewer-cmdk.png |
| 10 UX-22 | Background stays reachable under full-page Settings | Ctrl+, then 40 × Tab | `set-host` present; `header[role=banner].inert=false`; set-host `role`=null, `aria-modal`=null. Tab order wraps out to `topbar-exit` in the topbar | CONFIRMED | p9.json, 10-settings-tab-focus.png |
| 11 UX-21 | Stored invalid name shows red with no touch, and the footer says saved | `siteDetail.settings.update({id, name:"a "})` (input key is `id`, not `siteId`), then Settings › General | `#site-name` aria-invalid="true"; alert "Needs at least 2 characters."; border rgb(224,36,36); footer "All changes saved"; Save disabled with no reason given. Name restored afterwards | CONFIRMED | p10.json, 11-ux21-general.png |
| 12 IA-13 | No "Saving…" state and no conflict handling | 3 s latency through CDP, then Save; two tabs saving different SEO titles | Footer showed "Unsaved changes" plus disabled Save for 3.2 s, then "All changes saved"; never "Saving…". Two tabs: no conflict UI; the server holds the last writer's value ("audit1014 T1"). The only signal is a generic "This site is open in another tab" toast | CONFIRMED | p10.json, p11.json |
| 13 D-ST1/D-ST2 | "Save and continue" drops the empty name; topbar shows unsaved and discarded names | Cleared the name, Back to canvas, "Save and continue"; then offline rename, Save, Discard | Guard closed with **no `settings.update` request** and no toast; `seo.siteName === ""` in the composer. Offline: footer "Not saved" while the topbar shows "audit1014-L5 OFFLINE"; after Discard the topbar still shows OFFLINE. Footer then stuck at "Settings could not load" even after going back online | CONFIRMED | p10.json, 13-st1-guard.png, 13-st2-*.png |
| 14 D-ST3 | Archive/unarchive has three role rules | Archived via tRPC; opened Settings as EDITOR, then as ADMIN | EDITOR: Overview `set-ov-unarchive` enabled; clicking returns 403 "Insufficient permissions". Danger zone Unarchive is disabled for both EDITOR and **ADMIN**, although the server allows ADMIN. Site unarchived afterwards | CONFIRMED | p31.json, 14-*.png |
| 15 IA-09/UX-11 | Preview opens on Desktop even from a Mobile canvas | Canvas set to Mobile, eye icon; chose Mobile, back, reopened | First open: Desktop selected, iframe 1320 px wide. After choosing Mobile and reopening: still **Mobile (375 px)**, so the choice is not reset on every open | PARTIAL | p12.json, 15-preview-from-mobile.png |
| 16 IA-08 | Preview is not an interaction runtime | Inspected the iframe | `sandbox="allow-same-origin"`; 0 `<script>`; the site body script (`window.__audit1014`) did not run. The preview also omits the site global CSS and site head code (both present on the live site). No accordion was available to click | PARTIAL (sandbox confirmed; interaction click not exercised) | p12.json |
| 17 D-P10 | Share preview is offered to viewers | VIEWER: Preview, then Share | `sharing.list` 200, `sharing.create` **403**; modal says "Couldn’t get a preview link · Insufficient permissions" | CONFIRMED | p15.json, 17-viewer-share.png |
| 18 RR-03 | Failed server checks look clean | Aborted `prePublishChecks`, reloaded, opened Issues | Baseline "Open issues: 7" (4 server rows: SEO, Domain, Empty pages, Favicon). Blocked: "Open issues: 3"; the server rows silently vanish; no `issues-scan-banner`. The topbar label is unchanged | CONFIRMED | p13.json, 18-*.png |
| 19 D-P3/D-P1 | "Publish now" is enabled while checks load | Added an unbound Collection list, delayed checks by 8 s, then topbar, "Publish anyway", confirm | The panel shows a red "Collection lists" row and a disabled CTA. In the confirm, while checks are pending ("Preparing… / Checking review status…"), **"Publish now" has no `disabled`**. After the checks load: the blocker is listed and the button is disabled. Not clicked. Collection list removed afterwards | CONFIRMED | p14.json, p14b.json, 19*.png |
| 20 D-P5 | Unpublish offered to non-admins | EDITOR on the live site, `publish-menu` | Menu shows "All versions ›" and "Unpublish site…" (enabled). The site menu has no Unpublish row. Not confirmed | CONFIRMED | p26.json, 20-editor-publish-menu.png |
| 21 D-P7/D-P11/D-P12 | Panel steps and reload mid-publish (REAL) | Two real deploys, polling the DB every 1 s, reloading mid-job on deploy 2 | **D-P11 confirmed:** steps are written as `"active"`; the panel shows only "Publishing to production… 40% · started Ns ago · Cancel", never "Step N of M". The topbar CTA kept saying "Publish anyway" throughout. **D-P7:** the reload landed after the job had already finished (QUEUED→DEPLOYING→COMPLETED in about 5–18 s). The reloaded page then showed CTA "Publish anyway" with title **"Not live yet."** and made no `publishStatus` polls, while the site was PUBLISHED. A fresh load later correctly hid the CTA. The CONFLICT click was not attempted, to stay within the deploy budget. D-P12 needs a failed deploy (none happened) | PARTIAL | p25.json, p28.json, p29.json, 21*.png |
| 22 D-P4 | After rollback, the editor says nothing to publish | History › Published › v1 row menu | The live version only offers "View details / Compare with current". A rollback needs an older version, which would have been a third deploy, beyond the owner's "one publish + at most one re-publish/rollback". After the normal re-publish the panel correctly says "Nothing has changed since the last deploy" | BLOCKED (deploy budget) | p27.json, p29.json |
| 23 RR-02 | AI publish skips gates | AI tab, prompt "publish the site" | `ai.streamPrompt` returned **HTTP 431**; UI says "The AI service didn’t respond". No proposal card. I could not unset the flag (config is out of scope) | BLOCKED | p32.json, 23-ai-publish.png |
| 24 Export | EDITOR export modal; VIEWER ⌘K Export | Site menu › Export code as EDITOR | Modal opens; Vue and Next.js have aria-disabled="true" and "Soon". VIEWER has no palette (see 9) | NOT REPRODUCED (as expected) | p16.json |
| 25 HIST-01 | Compare ignores page rename and wider changes | Saved version "audit1014 A", then cumulatively: page rename, layer rename (Layers panel; name lands in element data), section reorder (`moveElement`), site SEO title change; ran "Compare with current" after each | All four comparisons: "The current draft matches “audit1014 A”." | CONFIRMED | p18.json, 25-compare-*.png |
| 26 D-H1 | A session-row restore is never autosaved | Added 3 dividers (saved), History › Session › oldest timestamp, confirmed "Restore, discard 2 changes" | No `saveProject` within 10 s; pill still "saved"; no beforeunload dialog; after reload the dividers are back (6). Also the dialog said it would discard 2 changes, but the divider count only went 6→5 | CONFIRMED | p19b.json, 26-session-restore-confirm.png |
| 27 Saved-version restore | Safety copy, save, and Undo restore | Pending edit, then Restore "audit1014 A" | `siteVersions.create` named `Before restoring "audit1014 A"`, then `saveProject` and `settings.update`; canvas undo disabled; "Undo restore" brought back the pending edit. Restore also reverted site SEO title (column-backed setting). Undo-restore creates the oddly named `Before restoring "Before restoring "audit1014 A""` | NOT REPRODUCED (works) | p20.json, 27*.png |
| 28 Conflict + D-H3 | Two tabs, Overwrite | T1 edit saved, then a T2 edit | T2 `saveProject` **409 `SAVE_CONFLICT:<iso>`**; modal "This site changed somewhere else" with Reload latest / Save a backup / Overwrite… → "Yes, overwrite". **No** `bk-unsaved-v1-*` key in T2 localStorage. After Overwrite, T1 reloaded without its spacer, and the version count did not change (4 to 4): D-H3 confirmed | PARTIAL (no local key) | p21.json, 28-conflict-t2.png |
| 29 D-H2 | "Restore my edits" overwrites newer server work | T1 offline edit ("Offline — not saved", key present), T2 online edit saved, T1 online, reload, Restore my edits | T1's reload save got 409; after "Restore my edits" `saveProject` returned **200 with no conflict**; T2 reloaded with its Button gone (13 to 12). The reload also showed a "Couldn't save … Check your connection" dialog for what was a 409 | CONFIRMED | p22.json, 29*.png |
| 30 D-H5 | Version list drifts between devices | Persistent profile P2 hydrated; P1 deleted a version (inline row "Delete" confirm, `siteVersions.delete` 200); P2 reopened | Server has 3 versions; P2 still lists 4 including the deleted one (IndexedDB `aquibra-versions` has 4 rows) | CONFIRMED | p23c.json |
| 31 Viewer history | Read-only history for VIEWER | VIEWER › History › Saves | Rename, Restore and Delete have aria-disabled with "Viewers can't … — ask an editor"; Save version aria-disabled; Compare works; Time-Travel band opens; tRPC `siteVersions.delete` returns 403 FORBIDDEN | NOT REPRODUCED (works) | p24.json, 31-viewer-history-menu.png |
| 32 D-H7 | ⌘Z bypasses read-only during Time-Travel | ⌃⇧T, then ←, then ⌘Z after one edit | `history:undo` fired once; element count went 163→162; band closed | CONFIRMED | p23.json (first run), 32*.png |

## Journey walkthroughs

### Journey 1: pages

| Step | Observed | Issue |
|---|---|---|
| Create page, blank | Modal defaults to "From template"; Blank works. A **"2 elements duplicated · Undo" toast** appears on page creation. | NF-1 |
| Create page from template | Works ("Page created — you're on it now"); stray "Link duplicated · Undo" toast. Saves page shows "No saved versions", yet the hint says versions are created when a template is applied. | UX-04, NF-1 |
| Template failure (injected one-shot throw in `importHTMLToActivePage`) | Toast "Template apply failed — nothing was changed · Retry" plus modal "Couldn't create the page… Your pages are unchanged". **An orphan page "audit1014 Fail" already exists and is active.** "Try again" creates a **second "audit1014 Fail"** (slug `-2`). The stale failure toast stays visible next to the success modal. | D-PG3 CONFIRMED |
| CMS page | Created collection "audit1014 Posts". Dynamic pages lets you assign Template page = Page 4 Copy (saved; toast explains nothing is generated without a pattern). Home is not offered. The hidden page "audit1014 Blank" is offered as a template. | minor NF-8 |
| Rename + Keep/Update URL + redirect | See check 5; the offer and suggestion use extensionless paths that 404 live. | D-PG2 |
| Duplicate | Menu Duplicate gives "Page 4 duplicated · Page 4 Copy · Open". **⌘D on a focused row does nothing**; arrow keys do not move focus; F2 works. | D-PG9 CONFIRMED |
| Delete + undo, reload | Correct (check 6). | none |

### Journey 2: settings

- **Site SEO:** invalid OG URL shows the inline alert "Use an https:// address…" and Save is disabled with no reason given. A title over 60 characters shows "Keep it under 60…" on typing. Both save correctly once valid. Live HTML carries the site title, `og:image`, and the `audit1014-site-head` meta.
- **Custom code:** a toast warns that an inline `<script>` is removed on publish. Verified: `__audit1014` is absent from the live HTML.
- **Global CSS** is shipped.
- **Page vs site:** the Page 4 meta title override shipped as `<title>audit1014 Page4 Title</title>`. The page Social tab preview shows a "1200 × 630" placeholder, while the live page uses the site default `og:image` (D-PG12 confirmed). The page drawer's unsaved-exit guard (Esc) gives "Discard unsaved changes? Keep editing / Discard changes"; Keep editing keeps the value.
- **Site unsaved exit:** gives the guard with three options. "Save and continue" bug: see D-ST1.
- **Save failure (offline):** "Not saved", topbar shows the unsaved name, Discard does not revert it (D-ST2). Afterwards the screen is stuck on "Settings could not load".

### Journey 3: preview from Mobile

Opens on Desktop at 1320 px (check 15). In preview at Mobile, the heading computes to 22 px (the mobile override). The preview has no scripts, site CSS or head code.

### Journey 4: publish and history

- **Publish:** see above. The live site carries the mobile override (`@media (max-width:767px){[data-buildrick-id="el-msz82g6s-16o7fcvwd3q"]{font-size:22px}}`). The 301 issue is covered in check 5.
- **History:**
  - Named version saved.
  - Restore with safety copy and Undo restore works.
  - Compare is blind to page rename, layer rename, reorder and site SEO changes.
  - The conflict dialog appears.
  - Overwrite loses T1 with no snapshot.
  - Session restore is never saved.
- **Rollback:** not possible within the deploy budget.
- **Unpublish:** works but gives no success toast.

## New findings (not in the code map)

1. **NF-1: false "duplicated · Undo" toasts.** Creating a page with "Add to site navigation" raises "2 elements duplicated · Undo" (blank page) or "Link duplicated · Undo" (template). The likely source is `useClipboardToasts.ts` reacting to `ELEMENT_DUPLICATED` emitted by nav-link propagation. The Undo reverts an operation the user did not do. Evidence: 04-blank-page.png, p3.json.
2. **NF-2: sitemap.xml and robots.txt point at a host that does not exist.** They use `https://buildrik-site-e2e-blank-full-d013128c-copy-11.vercel.app/…`, which returns 404. The real alias is `…-d01312.vercel.app`; Vercel truncates long project names. The sitemap also lists `.html` URLs. Evidence: live/_sitemap.xml.body, live/_robots.txt.body.
3. **NF-3: no clean URLs on deploy.** `/our-journey` and `/page-4` return 404; only the `.html` form serves. So every extensionless link (redirect targets, suggestions) is dead. This widens D-PG2.
4. **NF-4: issue counts disagree.** The errors gate says "6 open errors · +18 more warnings", the Issues panel says "Open issues: 7", and the confirm says "7 warnings — none block". The errors include "Link points to a page that no longer exists" for links to the *hidden* page "audit1014 Blank" (which exists) and to the deleted duplicate.
5. **NF-5: the topbar CTA ignores an in-flight publish.** During both deploys the topbar kept "Publish anyway" (not busy) while the panel showed progress.
6. **NF-6: AI prompt requests fail with HTTP 431** (Request Header Fields Too Large) on `ai.streamPrompt`, reported to the user as "The AI service didn't respond".
7. **NF-7: a save conflict is shown as a connection problem.** On reload after an offline edit, the 409 conflict appears as "Couldn't save … Check your connection, then retry saving".
8. **NF-8: hidden pages are offered** as CMS dynamic-page templates.
9. **NF-9: Unpublish gives no success feedback.** No toast; the topbar silently changes to "Publish anyway".
10. **NF-10: nested and overflowing version names.** Undo restore creates `Before restoring "Before restoring "audit1014 A""`; the row title overflows the History panel edge (30b-after-delete-click.png).
11. **NF-11: Settings Discard while offline** leaves the screen stuck on "Settings could not load", even after going back online.
12. **NF-12: session restore count is off.** The session-restore confirm says "discards 2 later changes" but only 1 change was undone (6→5 dividers).
13. **NF-13: the Publish panel has no rail entry.** I reached it through ⌘K "Open Publish" or the internal `ui:switch-tab` event.

## Not verified

- **D-P4** (rollback): would need a third deploy, beyond the owner's budget.
- **D-P7 CONFLICT click mid-job:** skipped for budget and safety; both jobs finished in under 20 s, so the reload landed after completion.
- **D-P12** (failure log step): no deploy failed.
- **D-P6** (Cancel for EDITOR): needs an EDITOR watching an in-flight job.
- **RR-02:** AI service returns 431, and the publish flag cannot be unset without changing config.
- **D-PG11** (folder membership after delete/undo): not run.
- **D-PG13, D-ST4–ST13** beyond the checks above, and **D-H8–H12**: not in §10, not run.
- **IA-08 interaction click:** no accordion or interaction on the page.
- **UX-04 `#achievement-title`:** the onboarding checklist was not active for this user, so it could not appear.

## State left behind

- **Site `audit1014-L5`:** DRAFT and unarchived; name restored. It contains audit1014 pages, collection "audit1014 Posts", a 301 redirect `/about → /our-journey`, site SEO/OG/custom-code values, and 3 versions.
- **EDITOR user** `audit1014-l5-editor@buildrik.local`: still in the workspace as EDITOR.
- **Vercel:** project deleted (verified 404).
