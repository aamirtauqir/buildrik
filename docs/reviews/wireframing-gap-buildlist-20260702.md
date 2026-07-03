# Wireframing page gap build-list — 2026-07-02 (/goal run) — ✅ COMPLETE

**PART 2 (same day, /goal):** the same 22 gap-screens ALSO implemented as **HI-FI** on page `187:2 "UI Screens"` (founder's polished design page — matched its Sign-In/Sign-Up style: real copy, cobalt CTAs, dark IA-5 sidebar, 1440×1024). Job-band labels y=1520→8120, x-pitch 1640. Verify: 22/22 present, 0 missing, screenshots clean (ds-push-select, review-queue).

**RESULT:** 22/22 screens created (bands y=30500–36500, job-labeled) · 16 dashboard frames' sidebars → locked IA-5 (Home·Sites·Clients·Team·Settings; Templates/Analytics/Notifications drained, verified on 197:6) · 10 renames (5 settings-batch shells + client-review-view + dups marked) · domains-management + pending/failed/set-primary states panel · workspace-settings chrome fixed (editor→dashboard) · 12 job-cluster labels. Mechanical verify: 0 missing, nav spot-check exact, screenshots clean (ds-push-select + dashboard-home).

Page: `195:2` "Wireframes - Buildrik" (~95 screens, 1440×900). Goal: implement everything the raw-design page requires — all jobs, all states, visual, same page. Update existing + create only missing.

## Style contract (from exemplars 198:7 / 197:6)
- Editor chrome: white topbar (← name · Preview/Share outline · Publish cobalt #2D6DFF), 48px left icon rail (4 slots, active = cobalt tint), right inspector 280px, canvas grey-boxes.
- Dashboard chrome: dark #0F1117 sidebar 184px (logo B Buildrik, nav rows, user footer), white topbar (title + cobalt CTA + bell + avatar), content cards #fff on #F7F8FA, chips: Live green / Draft grey / Review amber.
- Font Inter. New-screen names: kebab-case like existing.

## DEDUP (already exist — DON'T create)
version-history=244:9 · team=244:93 · billing=244:193 · account=244:307 · page-seo=244:377 · client-review-view=200:272 · sites-list≈245:142 · quota=inside 245:10 · clients/detail=241:8/241:125 (200:7/147 = dups).

## CREATE — 22 screens, new labeled job-bands from y=30500 (x pitch 1640, y pitch 1200)
Band J1/J0 y=30500: auth-invite-accept(x0) · new-site-chooser(x1640, J2 modal Blank/Template/AI over dashboard)
Band J3-CMS y=31700: cms-content-view(x0) · cms-records(x1640, publish-toggle + 0-published warn) · cms-binding-dynamic(x3280) · editor-my-templates(x4920) · media-stock-browser(x6560)
Band J4 WEDGE y=32900: brand-tokens-blast(x0, "14 elements will update") · components-library(x1640) · ds-push-select(x3280, client-site checklist + dry-run diff) · ds-push-result(x4920, per-site ✓/⚠ retry + rollback)
Band J5 WEDGE y=34100: preview-as-client(x0) · send-for-review(x1640, note+what-changed popover) · review-queue(x3280, dashboard resolve) · review-approved(x4920, status flip + email note)
Band J6 y=35300: redirects(x0, saved-NOT-live notice + empty state) · publish-error(x1640, retry) · ai-inline-target(x3280, dashed TARGET banner)
Band STATES y=36500: media-upload-error(x0) · editor-save-conflict(x1640) · analytics-empty(x3280) · forms-empty(x4920)

## UPDATE — existing screens
U1 Sidebar → locked IA-5 (Home·Sites·Clients·Team·Settings) on 7-item frames: rewrite Dashboard→Home, Templates→Clients, Clients→Team, hide Analytics+Notifications rows. Frames: 197:6, 197:157, 197:205, 245:142, 468:466, 455:856, 241:8, 241:125, 241:245, 241:436, 199:6(?), 199:130(diff variant-skip), 199:229(?), 202:7? (only where Templates+Notifications texts exist in left 220px).
U2 Renames: 244:9→version-history · 244:93→team-members · 244:193→billing-plans · 244:307→account-profile-security · 244:377→page-seo-editor · 200:7→clients-list (dup — archived) · 200:147→client-detail (dup — archived) · 200:272→client-review-view · 486:2→template-gallery (dup — archived) · 468:121→archived-editor-batch
U3 domains-management (243:296): add PENDING + FAILED domain rows (states).
U4 workspace-settings (202:99): editor-chrome top nav → dashboard chrome texts.
U5 Job band labels (new texts): existing clusters (J0 AUTH y≈150, J0b ONBOARDING y≈4550, JH DASHBOARD y≈8950, J1 CLIENTS/WORKSPACE y≈11350/18750, J3 EDITOR y≈12550, J3 MEDIA/FORMS y≈15750, JD SITE-DETAIL y≈17750, J6 PUBLISH y≈20200, JX AI y≈21200, UTILITY/ERRORS y≈22200) + the 6 new bands.

## VERIFY
Mechanical: every create exists + named; U1 frames show 5-item nav; coverage vs raw-design (74-feature + journeys) → checklist below all ✓.
Visual: screenshot each new band + 2 updated frames.
