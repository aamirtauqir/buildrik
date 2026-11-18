# Panel 14 — Publish, end to end: functionality specification (FD-PNL-14)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by P-1, P-9 (Vercel plan protection check, S7) *(R-1018)*, FI-03 (P1-D18), Access gate; plan rows by TR-7, TR-12 · not VERIFIED.** Independent `design-qa-critic` review: pass 1 PROPOSAL with 7 blocking (B1–B7) + 15 notes; pass 2 PROPOSAL with 2 one-line items (X1, X2) — all fixed 2026-10-17 (pass 2 said no further re-review needed beyond a diff check). Runtime NOT RUN; geometry NOT MEASURED. Written from the product-design review (`REVIEW-2026-10-17-pro-product-design.md` X08) after a code inventory (file:line below). *(DS)* = designer-selected; owner instruction 2026-10-17 "han likh do". Panel 00 (incl. SC-11…SC-19) wins on conflicts.
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S2, S7, P8, N4, V2; gap rows T5-08, T5-11, D3-26, T5-07, D3-16, D3-1 (row kept Blocking; enum owned by Panel 25); CS-01, CS-10, CS-11, CS-12. Round 2: Q14 (Missing alt check stays), Q15; damage-scan check row (not-asked item, F-EN-C5.7) *(R-1018b)*.
Governing IA: IAF-16 (A–M, `evidence/ia-final-2026-10-16/module-specifications.md:847`), Panel 12 (task host; RT-10 interior was "kept" — **this panel replaces that "kept" with a full design**), Panel 01 (topbar CTA), Panel 11 (bottom status), SC-4 status priority, SC-15 recovery, SC-18 plan-limit pattern, 00-STRATEGY (Publish = step 4 of the core loop; north star = sites published per week).

---

## 1. Purpose and boundary

Job: J3 Publish and maintain (00-STRATEGY §3) *(R-1018)*

Publish answers one question: **"What will go live, is it safe, and did it work?"** It takes the site's saved state to the production domain and tells the truth about the result.

- In: the Publish task (right column 360), its review-and-publish dialog, running/outcome states, topbar CTA states, republish of an earlier release, unpublish, simulation labelling.
- Out (owned elsewhere, linked): History › Published list and Compare (Panel 12 RT-12, shared Compare), Review rounds (Review task), Site settings › Domains (Panel 10), Issues task (Panel 12), Preview and share link (SC-8, IAF-15), dashboard notifications.
- Not in scope: staging environments, partial (selected-pages) publish — see §10 Planned. Scheduled publish is **removed until built** (owner decision P8; the backend stub stays unexposed) *(R-1018)*.

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)
Editor paths under `packages/editor/src/`; server paths from repo root. **`route.ts`** below always means the publish worker `packages/dashboard/app/api/workers/publish/[jobId]/route.ts`.

| ID | Area | Today |
|---|---|---|
| PB-01 | Decision | One derivation `editor/shell/lifecycle.ts:281-421` (via `editor/shell/hooks/useLifecycle.ts:253`) feeds topbar and panel; every button calls `requestPublish` (`AquibraStudio.tsx:544-548`) |
| PB-02 | Hard blockers (order) | flag off · viewer · offline · save conflict · save failed (`lifecycle.ts:236-243`) |
| PB-03 | Gates (order) | review not cleared → closed; status read failed → Retry; changes requested → gate modal; open Issues errors → errors confirm ("Publish anyway" → next gate); approved-but-edited → `StaleApprovalModal`; else four-facts confirm (`lifecycle.ts:215-220,312-410`) |
| PB-04 | Checks | Server list of 13 rows (`publish.service.ts:25-229`): Vercel connected (fail), Pages ready (fail), SEO, Domain, Empty pages, Favicon, Missing image, Missing alt, Broken link, CMS templates, Template pages, CMS bindings (warnings), Collection lists (fail). `ready = !hasFail` |
| PB-05 | Fix › | Only 5 rows have Fix (`PublishTab.tsx:92-98`); content/CMS rows (incl. blocking Collection lists) have none (`:485-486`) |
| PB-06 | Enforcement | `startPublish` refuses server-side on `ALREADY_PUBLISHING`, `SAVE_CONFLICT`, approval states (stale override ADMIN-checked) and `VERCEL_NOT_CONNECTED` (`publish.service.ts:344-488`), but **does not run `runPrePublishChecks`** — only the panel query does (`sites.ts:444-454`). So the blocking **Pages ready** and **Collection lists** rows are UI-only |
| PB-07 | Destination | Production (live domain) + "Preview deployment: None" row that is always null (`usePublishSnapshot.ts:179-183`); deploy `target: "production"` always (`lib/vercel.ts:149`) |
| PB-08 | Changes | "Changes in this session" = undo-stack labels after the last deploy (`usePublishSnapshot.ts:155-168`); cleared on project load; **no draft-vs-live diff**; version-to-version diff exists (`getPublishDiff`, `publish.service.ts:716-745`) |
| PB-09 | Unsaved edits | Publish exports the live canvas; dirty edits are not blocked, only failed save / conflict (`useLifecycle.ts:46-48`); freshness token waits for in-flight saves (`BuildrikSyncProvider.ts:219-222`); CMS outbox gate `cmsSyncBlocker()` when bindings exist (`cmsSync.ts:459-482`) |
| PB-10 | Running | "Publishing to production…", step n of N + elapsed (`PublishTab.tsx:304-330,727-741`); **step line never shows: panel looks for `"running"`, worker writes `"active"`** (`route.ts:48`); poll every 2s, lost after 3 failures (`usePublishJob.ts:25-26`) |
| PB-11 | Cancel | shown to every role; server requires ADMIN (`sites.ts:575`) and only cancels QUEUED/BUILDING while the worker sets DEPLOYING immediately (`route.ts:136-138`) — effectively only while queued |
| PB-12 | Outcomes | Published ("LIVE · vN", View live site, "Compare" → only switches to History), simulated (URL heuristic `.dev-simulated.invalid`, `PublishTab.tsx:273`), failed (Check status / Repair connection / Try again / View log), cancelled, poll lost; toasts in `useExportHandlers.ts:151-190`; Copy link only in site menu |
| PB-13 | Failure log | worker always marks step 1 failed (`route.ts:208`) |
| PB-14 | Reload mid-publish | in-flight job not picked up (`usePublishJob.ts:323-343`); Publish again → "A publish job is already in progress." |
| PB-15 | Versions | positional over the latest 20 COMPLETED jobs (`publish.service.ts:782-797`) — numbers shift after 20 publishes; payloads beyond 20 pruned |
| PB-16 | Republish | History › Published, ADMIN only, new job tagged `rolledBackFrom`, skips approval (`sites.ts:736-770`) |
| PB-17 | Unpublish | typed UNPUBLISH confirm (`UnpublishConfirmModal.tsx`); site menu ADMIN-gated, panel ⋯ not role-gated (`PublishTab.tsx:421`); domains stay attached |
| PB-18 | Roles | EDITOR publishes; stale "Publish anyway" shown to all, needs ADMIN; OWNER exempt from approval gate (`publish-approval.ts:35`) |
| PB-19 | Flag off | panel says "Connect Vercel to publish." (wrong reason, `PublishTab.tsx:677-690`) |
| PB-20 | Limits | 2 MB/page, 16 MB total, 500 pages (`shared/schemas/publish.ts:12-18`) — no pre-check row |
| PB-21 | Notifications | in-app to workspace **owner** only (`notification.trigger.ts:54-66`) + `site.publish` webhook; publisher not notified |
| PB-22 | Scheduled | `schedulePublish` always throws "isn't available yet" (`scheduled-publish.service.ts:40-57`); no UI |
| PB-23 | Keys | U opens the task; no key starts a publish |

## 3. Problems this design solves (by job — 00-STRATEGY §3 job 3 "publish safely")
1. **The user can't see what will go live.** Only session undo labels, lost on reload (PB-08).
2. **Two blocking checks are not enforced.** Pages ready and Collection lists are UI-only (PB-06); a second tab or an API call skips them.
3. **Four separate dialogs** in a row (errors → gate → stale → facts) for one decision (PB-03).
4. **Dead ends:** blocking "Collection lists" has no Fix (PB-05); flag-off shows a Vercel message (PB-19).
5. **Progress and outcome lie or vanish:** step line never shows (PB-10), failure log always says step 1 (PB-13), reload loses the job (PB-14), simulation looks like production when a domain exists (PB-12).
6. **Role mismatches:** Cancel, stale override and panel Unpublish are shown to people the server refuses (PB-11/17/18).
7. **Unsaved edits ship unclearly:** the canvas is exported, not a named saved revision (PB-09).
8. **Unstable version numbers** break "Republish v7" and "Compare v6 → v7" (PB-15).

## 4. Target layout

### 4.1 Publish task (right column, 360; Panel 12 host frame)
```
┌─ Publish ── Bella Cucina · whole site ‹ Back to Inspector ✕ ┐  header 48 (back per SC-1: only when the Inspector was visible)
│ ● Live · v12 · bellacucina.com                   │  STATUS card
│   Published 2 days ago · View live ↗ · ⧉         │
│                                                   │
│ WHAT WILL CHANGE (since v12)            See all › │  CHANGES
│   3 pages changed · 1 added · 0 removed           │
│   ✎ Home   ✎ Menu   + Catering                   │
│   CMS: 4 records published · Brand: 2 tokens      │
│                                                   │
│ CHECKS                         1 blocking · 3 tips│  CHECKS
│   ✕ Collection list "Latest posts" has no source  │
│                                       Fix ›       │
│   ! 2 images have no alt text          Fix ›      │
│   ! No favicon                         Fix ›      │
│   ! SEO description missing on 1 page  Fix ›      │
│                                                   │
│ APPROVAL   ✓ Approved by client · Oct 15  (or —)  │  APPROVAL (only when reviews are on)
│ GOES TO    bellacucina.com  · Manage domains ›    │  DESTINATION
├───────────────────────────────────────────────────┤
│ [ Publish changes ]                               │  footer 48
│  Fix 1 blocking issue to publish                  │  (reason line when disabled)
│  Privacy policy · Terms of service                │  legal line (restored, T5-11)
└───────────────────────────────────────────────────┘
```
- **Status card** (NEW layout of existing data): live state (Live · Changes not published · Not published — glyph + text, never colour-only, SC-11 wording), version (after P-4), domain, last publish time (actor shown only after P-8 — `getPublishHistory` selects none today), **View live ↗** and **Copy link ⧉** (Move: from site menu only → also here; site menu keeps it).
- **What will change** (NEW, §5.1). Replaces "Changes in this session" (Change). Fallback until P-2 ships: the existing session list under the heading **"Edits this session"**, with the line "After publishing, see the full change list in History › Compare"; after a reload with no session edits it reads "Changes not published since v12".
- **Checks** (Fix): grouped **Blocking** first then **Tips**; header counts; **every row has Fix ›** (§5.2) or, if no owner exists, a one-line "How to fix". Legend text kept: "Red = blocks publish · Amber = advisory".
- **Overflow** *(R-1018, D3-26)*: Blocking rows are **always all shown**; Tips show the first **5** *(DS)*, then a row "Show all {n} tips" expands the list in place (the task body scrolls; collapses again with "Show fewer"). No check row is ever hidden behind a count alone.
- **"See all ›" destination** *(R-1018, D3-26)*: the What-will-change "See all ›" opens a **task subview "What will change"** inside the Publish task (header "‹ Back to Publish", one scroll) listing every changed / added / removed page plus the CMS and Brand counts; each page row opens the shared Compare for that page (§5.1). The chip row in the card shows at most 5 pages. In the dialog (§4.3) section 1's "See all ›" expands the section in place (the dialog body scrolls) — it never leaves the dialog.
- **Approval** row (existing review state), only when reviews are on; link "Open Review ›". When "Edits require approval" is off the row is informational and ends **"(not required)"** ("Approved by client · Oct 15 (not required)"). A **revoked latest round counts as no review** (never falls back to an older round, R-14). Expired link: the gate banner reads "Waiting on {client} — the review link expired · Re-send ›" (R-12). *(amended 2026-10-17 — source: Panel 17 §4.3, §5.2 / SC-10)*
- **Goes to** (Change): one row — the production domain (or `{slug}.vercel.app` when none) + "Manage domains ›". The always-empty "Preview deployment: None" row is **removed** *(DS; no capability lost — it never had data; share preview link stays in Preview, SC-8)*.
- **Legal line** *(R-1018, T5-11 — restored; it was dropped without a decision)*: under the reason line, "Privacy policy · Terms of service" as two links opening in a new tab (existing, `PublishTab.tsx:1086-1095`, INV P19); 12/16 secondary text.
- **Footer CTA** uses the same lifecycle verb as the topbar (Publish / Publish changes / Send for review / Open feedback — Panel 01 §5.9); the destination is named in the Goes to row and the dialog title. Disabled → `aria-disabled`, focusable, reason line under it (existing reasons and strings).
- Header ⋯: **All releases ›** (History › Published), **Unpublish site…** (ADMIN only, §5.7). Noun: a site publish result is a **release** (SC-11 amended 2026-10-17, matching IAF-16 H).

### 4.2 Topbar CTA (Panel 01 §5.9 delta)
Panel 01 §5.9 stays authoritative for verbs, hiding and disabled reasons; Panel 14 adds two states only.
| Site state | CTA | Source |
|---|---|---|
| Review verbs / Publish / Publish changes | unchanged lifecycle verbs | 01 §5.9 (Keep) |
| Live and unchanged | hidden (unchanged); "✓ Published" 2s after success | 01 §5.9 (Keep) |
| Blocked (flag off, viewer, offline, conflict, save failed, review waiting/unchecked) | shown **disabled with the existing reason** (viewer: **"Publishing needs Editor access"** — SC role-refusal pattern, replaces "Viewers can't publish — ask an editor" *(R-1018, D3-16/CS-11)*; offline: "Needs a connection", Panel 22) | 01 §5.9 (Keep; copy per DS §3) |
| **Issues chip** (N4) *(R-1018)* | shown **left of Publish only while Blocking checks or Issues errors exist**; opens the Issues task (Panel 12) | Panel 01 owns placement |
| **Running** | **"Publishing 2/5…"** with a `role=progressbar` ring (`aria-valuenow` = step); click reopens the task; step changes announced politely | **NEW (Change to 01 "Busy = spinner")** — resolves review S-05; needs PB-10 fix |
| **Failed** | "Publish failed" (✕ glyph + danger tone) until the task outcome is opened | **NEW** |

### 4.3 Review-and-publish dialog (720, bounded; replaces 4 dialogs)
One dialog, sections in the existing gate order; each section shows only when its gate applies.
```
Publish to bellacucina.com                                  ✕
───────────────────────────────────────────────────────────
1 Changes      3 pages changed · 1 added · CMS 4 records     See all ›
2 Tips         3 advisory checks · [ ] I've seen these        (only if tips)
3 Errors       2 editor errors open · Fix issues first ›      (only if Issues errors)
               [ ] Publish with these errors
4 Approval     Approved Oct 15 · edited since (5 changes)     View changes ›
               ADMIN: [ ] Publish without a fresh review      Request fresh review
               others: "Publishing without a fresh review needs Admin access — or request a fresh review" (R-1018)
5 Release      Saved 10:42 · rollback: the current live release stays available
───────────────────────────────────────────────────────────
                                  [ Cancel ]  [ Publish ]
```
- **Section 4 staleness** ("edited since") is measured from the **round's snapshot time** (R-11 ⛔; interim guard: compare the last edit with the round's `createdAt`, never `updatedAt`), so edits made between send and approval are never counted as approved *(amended 2026-10-17 — source: Panel 17 §5.5 / SC-9, SC-10)*.
- Keeps every existing capability: errors confirm (Fix issues first / Publish anyway), gate modal content (changes requested → Open Review), stale approval (Request fresh review / Publish anyway — **ADMIN only**, Fix PB-18), four facts (Target, Pages, Approval, Rollback → sections 1, 4, 5 and the title). *(DS — merge.)*
- **Publish** is enabled only when every shown checkbox is ticked; while disabled it is `aria-disabled` with the reason "Tick the boxes above to publish" (version numbers in the title/button only after P-4). Checkboxes replace the separate "Publish anyway" dialogs; their wording is specific.
- **Change:** changes requested / review pending / no review → the dialog does not open; the task shows the gate banner (existing) with "Open Review ›". This **replaces the separate gate modal** (`PublishGateModal`); its text moves into the banner (recorded in §9).
- Esc/Cancel closes with no effect (SC-2).

## 5. Flows

### 5.1 What will change (draft vs live)
- Server compares the **saved revision about to publish** with the **last published payload** at page level (reuse `getPublishDiff` shape: added / removed / changed pages) plus counts for CMS records published/unpublished since the last publish and Brand token changes. Requires engineering **P-2**.
- Rows open Compare (shared, SC IAF-18) for that page: live vs draft.
- Empty: "No changes since v12 — the live site matches your saved work." Topbar CTA is hidden (01 §5.9); the task footer shows no publish button; Republish lives in History.
- Never published: "First publish · 5 pages will go live" + page list.

### 5.2 Checks and Fix ›
| Check | Severity | Fix › opens |
|---|---|---|
| Vercel connected | Blocking | dashboard integrations (existing "Connect", new tab) |
| Pages ready (0 live pages) | Blocking | Pages manager (Panel 11) |
| Collection lists (no source) | Blocking | Editor with the list element selected, Inspector › Content › Source — **NEW Fix** |
| Site size (NEW row: >16 MB total, page >2 MB, >500 pages; PB-20) | Blocking | Pages manager with the heaviest pages listed |
| Password protection on a Free site (after the Pro trial, SC-20) | **Blocking** (safety — never publish a protected site as public silently); also refused server-side as `PASSWORD_ON_FREE` (Panel 23 TR-7) | inline: Upgrade · **Remove protection and publish** (clears the saved password first; **SC-15 class b consequence confirm**, default Cancel — S2 *(R-1018)*). If that publish then fails: "Publish failed — protection was removed from your settings, but the live site is still protected (v12) · Restore protection · Try again" (Until the Access gate ships. After it, clearing the password unprotects the live site at once: the confirm says "{domain} becomes public now"; a failed publish reads "Publish failed — protection is off and the live site is public · Restore protection · Try again".) |
| Motion that never stops on an automatic trigger (WCAG 2.2.2, Panel 19 §5.8) | Blocking (**stays Blocking** — confirmed 2026-10-18); check id **`motion_wcag_2_2_2`** (Panel 25 `publish_blocked.check_ids` enum, D3-1) *(R-1018)* | the element's Interactions row |
| **Your Vercel plan can't password-protect this site** (S7, T5-08) — the site has a password set and the connected Vercel plan has no deployment protection (today the server skips protection silently on 402/403 and publishes public, `publish.service.ts:996-1015`) | **Blocking** — never publish a protected site as public silently (same principle as the Free row); check id **`vercel_protection_unsupported`** (Panel 25 enum); needs ⛔ **P-9** *(R-1018)* | inline: **Remove protection and publish** (SC-15 class b consequence confirm: "{domain} will be public — anyone with the link can see it." · Cancel (default) · Remove and publish) · Manage access › (Site settings › Access, Panel 10 §7) |
| Pro features on this site (Custom code on Free, SC-20) | Tip — dropping custom code on Free is **client-enforced, not a security boundary** (Panel 23) | inline: Upgrade · Publish without it |
| Free-plan badge (SC-20) | Tip | inline: Upgrade to remove |
| Unresolved images (Panel 08 §5) | Blocking *(DS — image would vanish)*; **client-enforced** (local state the server can't see; depends on FI-03 / P1-D18 ⛔) | first affected image on canvas |
| SEO configured | Tip | **How to fix:** "Set a page title on each page (Page settings)" — until the SEO arc; the title-template condition lives only in the reserved Planned card (Panel 10 §7), so a Site settings › SEO Fix could never clear the row *(R-1018, T5-07)* |
| Domain connected | Tip | Site settings › Domains |
| Empty pages | Tip | Pages manager filtered to empty pages |
| Favicon | Tip | Site settings › General |
| Missing image / Broken link | Tip | first affected element on canvas, then "Next ›" within the Issues task |
| Missing alt | Tip — **stays**; auto alt-text on upload is deferred to the AI Build tab (owner Q14, SC-21) *(R-1018b)* | first affected image (Inspector › Content › Alt), "Next ›" |
| **{N} elements couldn't be loaded correctly** *(R-1018b — not-asked item; load-time damage scan F-EN-C5.7; copy (DS))* | Tip *(DS)* | **Locate** — the first affected element on canvas, then "Next ›" within the Issues task (row pattern: Panel 12 §5 Issues). No Repair action: the repair code (`DamageScanner` / `useLoadRepair`, commit `5cfd71467`) is only on the unmerged `feat/phase1-s*` branches, not in `src` on main — the scan itself is there too, so this row appears only once the scan merges |
| Collection pages (code labels "CMS templates" / "Template pages"; UI copy per SC-11) | Tip | CMS › Dynamic pages for that collection (Panel 07 §7) |
| CMS bindings | Tip | the bound element on canvas (Inspector row of the binding); if the record is the problem, CMS › that record |
- **Return model (one rule, added to SC-7):** Fix targets **in the Editor** keep the Publish task open beside the canvas — no return chip (same as Issues "Fix ›"). Fix targets **in another area** (Site settings, CMS, Pages manager, dashboard) open that area with the **Publish task kept in its task tray** (Panel 12 resource-workspace tray); Back from the area follows SC-1. Checks re-run when the task is next visible.
- **Topbar Publish pressed outside Editor** *(R-1018b, owner Q15)*: in CMS, Assets, Brand, Site settings, Templates or Components the topbar CTA opens **this task in that area's tray, in place** (SC-7) — no switch to Editor, no return chip; the dialog (§4.3) opens over that area. Unsaved Site settings edits first get SC-24 "Save settings first?" (Q2).
- **Server enforces** the Blocking rows it can see — Pages ready, Collection lists, Site size — inside `startPublish` (Fix PB-06, engineering **P-1**); Unresolved images stays client-enforced. A server refusal maps to the same row and opens the task on it.
- Checks re-run: on task open, after any Fix return, after a publish ends (existing), and before the dialog opens.

### 5.3 Saved revision first (Fix PB-09)
Pressing Publish (CTA or dialog): (0) **an open CMS record form with unsaved edits** runs the IA-03 preflight first — "Save the record first or publish without it" (Panel 12 §4.3); (1) flush pending saves and the CMS outbox — CTA shows "Saving…"; (2) on success the dialog shows "Saved {time}"; (3) publish. **Today the client exports the live canvas after the flush, not a stored revision id** — publishing a named saved revision needs engineering **P-7**; until then the flush is the guarantee. Save failure → blocked with "Couldn't save — Retry" (DS §3 save states; replaces "Save failed — Retry") *(R-1018, CS-12)*; CMS outbox not empty after flush → "CMS changes still syncing — Retry" (existing `cmsSyncBlocker`). Edits made while the job runs are **not** in this release; the status card then shows "Changes not published".

### 5.4 Running
- Task body: step list from the worker (Generating pages · Deploying to CDN · Verifying SSL; skipped steps hidden), current step marked (glyph + text), elapsed time; topbar CTA mirrors (§4.2). Fix PB-10 (accept the worker's `"active"`).
- **Cancel** (Fix PB-11): shown only to ADMIN and only while the job is **Queued** — label "Cancel (not started)"; once deploying: "Publishing can't be stopped once deploying" (text, no button). Other roles: no Cancel.
- Leaving the task, switching tasks, or switching areas never cancels (Panel 12 §4.3). **Exit editor while running** (resolves review S-04): exit dialog row "A publish is running — it will finish without you." + (after P-6) "You'll get a notification." / (until then) "Check the site's status in the dashboard." [Leave] [Stay].
- **Reload / second tab** (Fix PB-14, engineering **P-3**): on load the editor queries the site's active job and resumes the running view. The P-3 fallback "Show progress" needs the job id inside the `ALREADY_PUBLISHING` error (not there today — part of P-3). **Refresh on focus:** when a tab regains focus, the status card and checks re-read, so a release made in another tab shows.
- **Start request timed out** (no job id returned — IAF-16 G, T-IAF16-3): "Checking whether the publish started…"; the client queries the site's active job (P-3) before offering anything; found → running view; none → "Publishing didn't start. Nothing changed." + Publish again. **Try again is never offered while the outcome is unknown.** Fallback until P-3: the next Publish press returns `ALREADY_PUBLISHING` if the job exists, which maps to "A publish is already running" (no duplicate job — partial unique index, `publish.service.ts:494-498`).
- Poll lost (3 failures) → "Checking status…" automatic retry every 5s for 1 min, then "We lost track of this publish — Check status" (existing button). Never shown as Failed until the server says so (IAF-16 G).

### 5.5 Outcomes
| Outcome | Task copy | Actions | Toast |
|---|---|---|---|
| Published | "Your changes are live on bellacucina.com" ("v13 is live…" after P-4) | View live ↗ · Copy link · **See what changed** (opens shared Compare v12 → v13 — needs P-4; fallback History › Published with v13 selected) | "Published — site is live · View live" (existing) |
| Published, reviews on | + next step line "Let your client know · Copy link" *(DS)* | — | — |
| Simulated | banner on the whole task while simulation is on (info banner: neutral grey + icon, V2 *(R-1018)*): **"Simulation mode — nothing is deployed"**; outcome "Simulated publish — nothing went live" | none | "Simulated — nothing went live" |
| Failed | "Publish failed — {specific reason} · The live site still shows v12" (or "Nothing is live yet") | per reason (§7) + **View log** (with the real failed step, Fix PB-13) | "Publish failed · Open" |
| Cancelled | "Publish cancelled before it started. Nothing changed." (existing, tightened) | Publish again | — |
| Live but recording failed (IAF-16 G) | "The site is live, but we couldn't record this release. — Check status" | Check status (no blind redeploy) | — |
- **Role revoked mid-flow** (server FORBIDDEN): "You no longer have permission to publish this site." — no retry; CTA recomputes. **Session expired:** SC-18 re-sign-in; the job continues server-side and the view resumes after sign-in. **`WORKSPACE_DELETION_SCHEDULED`:** "This workspace is scheduled for deletion — publishing is off."
- Simulation is decided by a **server `simulated` flag** on the job (engineering **P-5**), not by the URL (Fix PB-12).
- Notifications: the **publisher** also gets the in-app SITE_PUBLISHED / SITE_PUBLISH_FAILED notification *(DS; engineering P-6)*, so a user who left gets the result.

### 5.6 Republish an earlier release (rollback)
- Entry: History › Published row "Republish this release" (existing, ADMIN; non-admin disabled "Republishing needs Admin access" *(R-1018, D3-16)*); Publish task ⋯ "All releases ›" goes there.
- Confirm — **SC-15 class b consequence confirm** (S2; default Cancel) *(R-1018)*: "Republish v10 to bellacucina.com? Your draft is not changed. v13 stays in the list." · Cancel · Republish. Runs as a normal job with the §5.4 running view in the Publish task (focus moves there).
- Release labels use **stable release numbers** (engineering **P-4**); until then rows show date + time as the primary label and "v" numbers secondary *(DS)*.
- **Pruned release** (`rollbackable=false`, server `NOT_ROLLBACKABLE`): row action disabled with "This release is no longer stored — it can't be republished." (**copy change** from `PublishHistory.tsx:268` "That version's snapshot is no longer stored, so it cannot be re-published.", to use the SC-11 noun).

### 5.7 Unpublish
Existing typed confirm kept (**SC-15 class c**, S2 *(R-1018)*). **ADMIN only on every entry** (Fix PB-17: panel ⋯ gains the role gate). Copy states the consequence: "bellacucina.com will show a 'site not found' page. Domains stay connected. You can publish again any time." Toast "Site unpublished · Publish again".

## 6. States and permissions
| State | Behaviour |
|---|---|
| Checking (role / approval / connection / checks loading) | skeleton rows; CTA disabled "Checking…"; nothing actionable while unknown (IAF-16 I) |
| Checks failed to load | "Couldn't run checks — Retry"; CTA disabled with that reason (existing) |
| Not published yet | status "Not published" (outline glyph); changes = first-publish list |
| Flag off | task body uses the existing derivation string **"Publishing isn't switched on for this workspace yet"** (`lifecycle.ts:237`; Fix PB-19 — the panel stops showing the Vercel copy); topbar CTA disabled with that reason (01 §5.9) |
| Not connected to Vercel | Blocking check "Connect Vercel" + CTA reason "Connect Vercel to publish" |
| Offline | CTA disabled with **"Needs a connection"** (Panel 22 §5.3 owns the banner and the one polite announcement; replaces "Can't publish while offline", `lifecycle.ts:238`) *(R-1018, CS-10)*; a running job view shows "Reconnecting…" and resumes polling |
| Viewer | status card + changes read-only; CTA shown **disabled** with "Publishing needs Editor access" (SC-6, 01; DS §3 role refusal) *(R-1018)*; no ⋯ actions |
| EDITOR | publish with gates; no Cancel, no stale override, no Unpublish, no Republish |
| ADMIN / OWNER | all; OWNER exempt from approval gate (existing) |
| Site locked after the trial (over the Free limit, SC-20) | task read-only; CTA disabled "Over the Free limit — Upgrade to publish" (owner) / "Over the Free limit — Ask the workspace owner to upgrade" (others); the live version keeps serving |
| Plan | per SC-20: trial = Pro (no badge); on Free the badge is added and Pro-only output is dropped, announced by the check rows in §5.2 |

## 7. Content — failure reasons (Fix: specific, with the next action)
| Server reason | Copy | Action |
|---|---|---|
| `ALREADY_PUBLISHING` | "A publish is already running." | Show progress (resumes §5.4) |
| `PASSWORD_ON_FREE` | "This site is password protected and this workspace is on Free." | Upgrade · Remove protection and publish |
| protection unsupported (NEW reason with P-9; today 402/403 is only a console warning) *(R-1018, S7)* | "Your Vercel plan can't password-protect this site." | Remove protection and publish (class b confirm) · Manage access › |
| `VERCEL_NOT_CONNECTED` | "Connect Vercel to publish this site." | Connect ↗ |
| `VERCEL_TOKEN_INVALID` | "Your Vercel connection expired." | Repair connection ↗ (existing) |
| `VERCEL_DEPLOY_<state>` / timeout | "Vercel couldn't finish the deployment ({state})." | Try again · View log |
| `SAVE_CONFLICT` | "Someone else saved a newer version. Review it before publishing." | Resolve conflict (existing dialog) |
| `APPROVAL_*` | existing four approval sentences (`publish.ts:136-145`) | Open Review |
| `WORKER_DISPATCH_FAILED` / stranded | "Publishing didn't start. Nothing changed." | Try again |
| No page content | "There's nothing to publish yet — add a page." | Open Pages |
| Project-name clash / `UNSAFE_PUBLISH_PATH` | existing sentence | View log |
| FORBIDDEN (role revoked) | "You no longer have permission to publish this site." | — |
| `WORKSPACE_DELETION_SCHEDULED` | "This workspace is scheduled for deletion — publishing is off." | — |
| `NOT_ROLLBACKABLE` | "This release is no longer stored — it can't be republished." | — |
| Unknown | "Publish failed for an unexpected reason. The live site is unchanged." | Try again · View log |

## 8. Geometry and accessibility (NOT MEASURED)
- Task 360 (GEO-01); dialog 720 bounded, body scroll; long domains wrap; step list rows 32.
- Task landmark `<aside aria-label="Publish">` (T-RT-10). Disabled CTA and dialog primary are `aria-disabled`, focusable, with the reason as accessible description (01 §5.9).
- Live region (polite) for step changes, outcome, check re-run counts; assertive only for Failed. Progress ring `role=progressbar`, `aria-valuemin=0`, `aria-valuemax=N`, `aria-valuenow=n`, `aria-valuetext="{step name}, step n of N"`.
- Focus: opening the task → header title; dialog → first unchecked checkbox or primary; outcome → outcome heading.
- Status glyphs: filled ● Live, half ◐ Changes not published, outline ○ Not published (SC-11/review S-06).
- Keyboard: U opens task; inside dialog Tab order follows sections; Enter on primary only when enabled. No shortcut starts a publish *(kept — deliberate)*.

## 9. Preservation map
| Today | Target | Disposition |
|---|---|---|
| PB-01 derivation + `requestPublish` | unchanged single source | Keep |
| PB-02 hard blockers + copy | §6 / §4.2 | Keep (flag-off copy Fix) |
| PB-03 gates and order | §4.3 sections in the same order | Change (errors confirm + stale modal + facts confirm → 1 dialog) |
| `PublishGateModal` (changes requested) | gate banner in the task with "Open Review ›" | Change (modal → banner; same text) |
| PB-04 checks | §5.2 + Site size row + Unresolved images row | Keep + Fix |
| PB-05 Fix › (5 rows) | Fix on every row | Fix |
| "Changes in this session" | "What will change" (fallback: session list) | Change |
| Release to / Environment rows | "Goes to" row; empty Preview deployment row removed | Change (no data lost) |
| Last deploy | Status card | Move |
| Running view, Cancel | §5.4 (role + queued only) | Fix |
| Topbar busy spinner | "Publishing n/N…" progress (§4.2) | Change (amends 01 §5.9) |
| Outcomes, toasts, View log | §5.5 / §7 | Keep + Fix |
| Copy live URL (site menu) | also in status card + outcome | Keep + Move (copy) |
| Republish (History, ADMIN) | §5.6 | Keep |
| Unpublish typed confirm | §5.7, ADMIN everywhere | Keep + Fix |
| `publish` flag + Vercel gating | §6 | Keep |
| Gate banner (Open Review / Open Issues / Retry) | kept above Checks | Keep |
| Legal line "Privacy policy · Terms of service" | task footer under the reason line | Keep *(R-1018, T5-11)* |
| Password silently skipped on Vercel plans without protection | Blocking check + failure reason (S7) | Fix *(R-1018)* |
| Scheduled publish (backend stub) | not listed as Planned; stub stays unexposed until built (P8) | Remove from docs (no user capability existed) *(R-1018)* |
No capability removed.

## 10. Planned (not designed here; reserved)
- ~~Scheduled publish~~ — **removed until built** (owner decision P8, 2026-10-18); no reserved UI *(R-1018)*.
- **Staging / preview environment** — none in code; the share-preview link (SC-8) covers client preview today.
- **Partial publish** (selected pages) — none in code.
- **Release note** per publish — none in code; would show in History › Published.

## 11. Engineering dependencies (add to SC-9)
| ID | Dependency | Fallback until shipped |
|---|---|---|
| ⛔ P-1 | `startPublish` also refuses on the Blocking rows it doesn't check today: Pages ready, Collection lists, Site size | UI-only gating for those rows as today; doc status stays "blocked" |
| P-2 | Draft-vs-live page diff + CMS/Brand counts endpoint | "Edits this session" list + "details in History › Compare after publishing" |
| P-3 | Query the site's active job on load / after a start timeout; include the job id in `ALREADY_PUBLISHING` | the next Publish press returns "A publish is already running" (no duplicate) — no resume view |
| P-4 | Stable release numbers + both job ids on the outcome | dates as primary labels; "See what changed" opens History › Published |
| P-5 | Server `simulated` flag on jobs | simulation banner driven by the check row "simulation is on" warning |
| P-6 | Notify the publisher (not only the owner) | owner-only notifications; exit copy points to the dashboard |
| P-7 | Publish a stored saved revision (revision id captured at Publish) | flush saves + export the live canvas (today) |
| P-8 | Actor on publish history rows | no actor shown |
| ⛔ P-9 *(R-1018, S7)* | Know before publishing whether the connected Vercel plan supports password protection (capability read at check time), and turn a 402/403 on protection into a refused publish (`PROTECTION_UNSUPPORTED`), never a silent public deploy (`publish.service.ts:996-1015`) — = SC-9 ⛔ "P-9" | none safe — the row can't be shown without it; panel stays "blocked by P-9" |
| ⛔ (Panel 08) | FI-03 persistence P1-D18 | Unresolved images row client-enforced only |
| — | Worker step status `"active"` read by the panel; failure step recorded correctly | code defects, not design (§13) |

## 12. Acceptance (specified, NOT RUN)
| ID | Case |
|---|---|
| T-PB-01 | With 1 Blocking check, CTA disabled with "Fix 1 blocking issue to publish"; calling the publish API directly with 0 live pages is refused with the Pages ready row (P-1) |
| T-PB-02 | Every check row has Fix › or "How to fix"; Fix on "Collection lists" selects the list element in the Editor with the Publish task still open (no return chip); checks re-run |
| T-PB-03 | Errors + stale approval + tips → one dialog with three sections; **Publish** enabled only after all shown boxes are ticked, otherwise aria-disabled with reason; EDITOR sees no stale override |
| T-PB-04 | Unsaved edit → Publish → "Saving…" then dialog shows "Saved {time}"; an edit made during the run shows "Changes not published" afterwards; open unsaved CMS record → IA-03 preflight first |
| T-PB-05 | Running job shows the current step name; topbar shows "Publishing n/N…"; screen reader announces step changes |
| T-PB-06 | Reload during a run resumes the running view (P-3) |
| T-PB-07 | EDITOR sees no Cancel; ADMIN sees "Cancel (not started)" only while Queued |
| T-PB-08 | Simulation on → banner on the task and "Simulated" outcome even when a verified domain exists (P-5) |
| T-PB-09 | Failure at "Deploying to CDN" → log names that step; copy names the reason and says the live version is unchanged |
| T-PB-10 | Panel ⋯ Unpublish absent for EDITOR; ADMIN typed confirm unchanged |
| T-PB-11 | No changes since live → task says "No changes since vN"; topbar CTA hidden; no publish button in the task |
| T-PB-12 | Exit editor while running → dialog "A publish is running…"; leaving does not cancel the job |
| T-PB-13 | Republish v10 leaves the draft unchanged and creates a new release (IAF-16 T-5) |
| T-PB-14 | Flag off → task and disabled topbar CTA say "Publishing isn't switched on for this workspace yet" (no Vercel copy) |
| T-PB-15 | Start request times out → "Checking whether the publish started…"; no Try again until the job query answers; never two jobs (IAF-16 T-3) |
| T-PB-16 | Offline → CTA disabled "Needs a connection" (one polite announcement, Panel 22); going offline mid-run shows "Reconnecting…" and resumes *(R-1018)* |
| T-PB-17 | Poll lost → "Checking status…" auto-retries, then "Check status"; never shown as Failed without a server answer |
| T-PB-18 | CMS outbox not empty after flush → blocked "CMS changes still syncing — Retry" |
| T-PB-19 | Before P-2: "Edits this session" list + History › Compare line; after reload with no session edits: "Changes not published since …" |
| T-PB-20 | Viewer: CTA disabled "Publishing needs Editor access", task read-only, no ⋯ actions; EDITOR: Republish disabled "Republishing needs Admin access" *(R-1018)* |
| T-PB-21 | Publish in tab A; tab B regains focus → status card shows the new release |
| T-PB-22 | Pruned release row: Republish disabled with "no longer stored" message |
| T-PB-24 | (after P-9) Site with a password on a Vercel plan without protection → Blocking row "Your Vercel plan can't password-protect this site"; CTA disabled; the API refuses with `PROTECTION_UNSUPPORTED`; nothing deploys public (S7) *(R-1018)* |
| T-PB-25 | Publish task footer shows "Privacy policy · Terms of service"; both open in a new tab (T5-11) *(R-1018)* |
| T-PB-26 | 9 tips + 1 blocking → the blocking row and 5 tips show, then "Show all 9 tips" expands in place; "See all ›" on What will change opens the "What will change" subview with "‹ Back to Publish" (D3-26) *(R-1018)* |
| T-PB-27 | Republish v10 → consequence confirm with Cancel as default; "Remove protection and publish" → consequence confirm naming that the domain becomes public (S2) *(R-1018)* |
| T-PB-28 | Issues chip appears left of Publish only while a Blocking check or Issues error exists (N4) *(R-1018)* |
| T-PB-23 | Collection lists Fix → list selected in Editor, Publish task still open, no return chip; SEO Fix → Site settings › SEO with Publish in the tray, Back per SC-1 |

## 13. Code defects found during this inventory (engineering, not design)
1. Panel reads step status `"running"`; worker writes `"active"` → step line never shows (`PublishTab.tsx:307` vs `route.ts:48`); test mocks the wrong value (`PublishTab.buildLog.test.tsx:112`).
2. Worker failure path marks step 0 failed regardless of where it failed (`route.ts:208`).
3. Blocking rows Pages ready and Collection lists not enforced server-side (`startPublish` never calls `runPrePublishChecks`; only `sites.ts:444-454` does); the comment at `PublishTab.tsx:395-396` is only true for Vercel/approval/conflict.
4. Cancel / stale override / panel Unpublish shown to roles the server refuses (`PublishTab.tsx:421,752-767`; `StaleApprovalModal.tsx:245-250`).
5. Cancel can only succeed while QUEUED because the worker sets DEPLOYING immediately (`route.ts:136-138` vs `publish.service.ts:594`).
6. Flag-off copy is the Vercel message (`PublishTab.tsx:677-690`).
7. Simulation with a verified domain reports "Published to production" (`route.ts:473`).
8. Version numbers positional over 20 jobs (`publish.service.ts:782-797`).
9. `PrePublishChecks.tsx:15-18` comment says six checks; server sends 13.
10. SSE route + `use-publish-sse.ts` exist with no importer (dead code or unfinished).

## 14. Review and not verified
Independent `design-qa-critic` review: pass 1 PROPOSAL (B1–B7 + N1–N15), pass 2 PROPOSAL (X1, X2) — all fixed 2026-10-17. 21 of 24 code citations confirmed by the reviewer; 3 corrected (PB-06 scope, worker path, check count). Not verified: runtime, real Vercel deploy timings, dialog geometry, screen-reader output. No new shortcuts are added. Code facts are from a source read on 2026-10-17 (file:line above), not from running the app.
