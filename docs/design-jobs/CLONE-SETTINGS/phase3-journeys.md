# Settings · Clone S3 — PLUMBING-1 — walk log

Brief: `phase3-brief.md`. Backend delta (approved with the §5 defaults — `vercel.json` ships
straight, the suggester reads the page slug history, no HSTS subflag columns): `phase3-backend.md`.
Shots: the 15 section frames + `4254-75736`, `4254-75747` (2 calls, taken with S2's report); this
phase's own calls: 5, for S4's overlays (`4254-76050`, `4265-26908`, `3873-25643`, `3866-25629`,
`3856-25582`) — 94 spent on 2026-09-14 in all. Graph: `reactions-settings-2..4.json`.

## Live env

As S1/S2: worktree `buildrik-settings` on `localhost:3001`, the shared Postgres. **Migration
`20260914120000_settings_s3_redirects`** (`Redirect.matchQuery`, `Redirect.notes`) applied locally
with `migrate deploy` by B (hand-written, as S2); `migrate status` clean; the client regenerated and
the `:3001` server restarted by PID. Seed extended (`matchQuery` + `notes` on `/old-menu`, the header
columns, a `pizza-menu` slug change on Home Copy with no redirect; the S1 site-rename `SlugHistory`
rows dropped — nothing reads them since the source switch) and re-run; after the walk the fixture
redirect, the walk's slug history and the repair rule were removed, then `--reset` + seed. No plan
flip this phase (nothing S3 draws is plan-gated).

## Work split

| agent | journey | files owned |
|---|---|---|
| B | the migration, `create`/`update` (+matchQuery/notes, one rule per path → `CONFLICT`), `redirects.suggestions` from `Page.slugHistory`, the overview count, `vercel.json` in `buildDeployFiles` + the worker's row selection, the seed | `prisma/schema.prisma` + the migration, `packages/shared/schemas/site-detail.ts`, `server/trpc/routers/site-detail.ts`, `server/services/{redirect,site-detail}.service.ts`, `lib/publish-files.ts`, `lib/publish-urls.ts`, `packages/dashboard/app/api/workers/publish/[jobId]/route.ts`, `prisma/seed-settings-clone.ts` |
| E1 | Redirects + Add / Edit redirect + the repair draft / saved card + the 5 states | `screens/RedirectsScreen.tsx`, `components/{RedirectDialog,RedirectRepairCard}.tsx`, `searchIndex.ts`, `shared/types/project.ts` (`redirects.suggestFrom404s`) |
| E2 | Headers + unsaved + the 3 states | `screens/HeadersScreen.tsx`, `searchIndex.ts` |
| E3 | the Pages doors: the SEO tab's offer after a saved slug change; `ui:pages-open-settings` with a tab | `pages/page-settings/{SeoTab,PageSettingsDrawer}.tsx`, `pages/PagesTab.tsx` |
| main | the shell's two doors (StudioPanels holds `ui:settings-open` / `ui:pages-open-settings` for the lazy panels; `openRequest` → `repair` → RedirectsScreen; `SAVE_ERROR_MESSAGES`), merges + folds, the literal 301/302, the mount-order fix, the live walk, `boards.json`, this log | — |

## Drift table

| screen | verdict | note |
|---|---|---|
| 3397:32517 Redirects | drift-fixed | strip · table with `Edit` · 404 suggester (switch + `/pizza-menu → /home-copy · renamed 12 Sep · Accept`) · header `Add redirect`; Accept → the 301 lands, the row moves to the table; switch off/on → Unsaved → Save → `projectSettings.redirects.suggestFrom404s` on the server; FOUND (the big one): reopened on the persisted screen, Save flushed nothing — fixed in the shell; live-3397-32517-redirects, -accepted |
| 3397:33479 loading | driven | LoadCard `REDIRECTS` · `Old URLs sent to new ones, and the 404 suggester.` |
| 3397:33526 empty | drift-fixed | every rule deleted → the card's own line + `Add redirect`, no header button; live-3397-33526-redirects-empty |
| 3397:33573 load-error | drift-fixed | `redirects.list` rejected → the card + Try again → rows; live-3397-33573-redirects-load-error |
| 3397:33620 validation | match | `From path must start with / (e.g. /old-page)` / the To URL line under the fields, submit held; live-3397-33620-redirects-validation |
| 3951:26730 save-error | drift-fixed | `redirects.create` rejected on Accept → the banner; the frame's extra `Try again` primary loses to the footer's Retry save; live-3951-26730-redirects-save-error |
| 4254:75736 Add redirect | match | created `/promo-eid → https://bellacucina.com/offers · 302 · notes` → the row; `/about-us` again → `A redirect from /about-us already exists.` inline (the server's new uniqueness gate); live-4254-75736-add-redirect, -refused |
| 4254:75747 Edit redirect | match | prefilled; Match query on → Save → `matchQuery: true`; Delete → gone at once; live-4254-75747-edit-redirect |
| 3519:19920 About URL repair / draft | drift-fixed | Pages › Page settings › SEO: slug `home-copy-2 → our-story` → the offer strip → Add redirect → Settings on Redirects with the draft (`Redirect for Home Copy 2` · `scratch-ver · URL change /home-copy-2 → /our-story` · prefilled paths · `301 · Permanent redirect` · Save / Cancel · `Unsaved redirect · Save this rule for scratch-ver.`); live-3437-13517-pages-seo-offer, live-3519-19920-repair-draft |
| 3519:20096 saved | drift-fixed | Save redirect → `Redirect saved · /home-copy-2 → /our-story · 301 · Back to Home Copy 2 SEO`; the rule heads the table, its suggester row leaves; Back → the Pages panel, the drawer open on SEO; live-3519-20096-repair-saved, -back-to-seo |
| 3519:20272 / 20448 Our story | match | the same component with the second page's names — walked once |
| 3397:32602 Headers | drift-fixed | five cards; DENY + 1 year saved → `xFrameOptions: "DENY"`, `hstsMaxAge: 31536000` on the Site row, restored; HSTS off disables Max age; live-3397-32602-headers |
| 3397:33335 / 33383 / 33431 | driven / drift-fixed / drift-fixed | load-error (`settings.get` rejected) and save-error (`settings.update` rejected → banner · Retry save → saved) live; live-3397-33383-headers-load-error, live-3397-33431-headers-save-error |
| 3397:34227 unsaved | match | footer `Unsaved changes`; Cancel → Unsaved settings → Discard → canvas; live-3397-34227-headers-unsaved |
| the published site | verified by dry run | `buildDeployFiles` against the seeded site (`scripts/tmp/deploy-dry-run.ts`, uncommitted): `index.html, robots.txt, sitemap.xml, vercel.json` — three `redirects` with `statusCode` 301 / 301 / 302 and one `headers` block on `/(.*)` with CSP · `Strict-Transport-Security: max-age=63072000` · X-Frame-Options · Referrer-Policy. No real deploy (`blocked:external`). |

## Notes

- **Contradictions decided:** the 404 suggester's rows say `renamed <d MMM>` — the source is the
  page slug history, not 404 hits (the published site sends none; the card keeps the frame's title);
  `Back to <Page> SEO` is a primary and `Accept` a plain ink link (the frames draw them so; the brief
  said secondary); the empty frame's older `ACTIVE REDIRECTS` card and the save-error frame's extra
  `Try again` bar lose to the CURRENT frames / the shell's footer; the Add dialog's submit waits for
  valid fields (the frame draws it enabled over sample values); X-Frame-Options' third option is
  `Not set`, the Max age list ascends, the referrer options are the bare values; the CSP well is the
  bordered mono Textarea (the Custom code call); Permissions-Policy stays as a fifth card (the column
  exists and nothing else edits it); table rows at 40 (frame ≈60, `founder:density-32`).
- **Backend, honest limits:** a rule ships its literal `statusCode` 301 / 302 (Vercel's `permanent`
  would mean 308 / 307 — the dialog promises the numbers); **`matchQuery` cannot be honoured at the
  host** — Vercel's configuration redirects always forward the query string and the only switch
  lives on the paid bulk-redirects file, so the toggle is a recorded preference and the rule is the
  same either way (recorded on 4254:75747); a REDIRECT-kind domain's host rule is unit-tested, not
  seeded (`blocked:host-redirect` on 3397:32206 is lifted by the file — the rule ships, its 301 is
  Vercel's); **destinations vs what the deploy serves** — pages upload as `<slug>.html` with no
  `cleanUrls`, so `/menu` as a destination is a path the deploy answers with 404 (pre-existing shape,
  now load-bearing; `cleanUrls: true` in the same file would fix it but changes what the sitemap and
  canonical name — the founder's call, in the S4 delta); `redirects.import_csv` still bypasses the
  uniqueness gate and the `toUrl` rule; the host rule's "primary" is `isPrimary` regardless of status.
- **Found on the walk, fixed (1 + the merge folds):** the shell nulled a screen's save / flush
  handlers (and `setLoadState("ready")`) whenever the screen mounted in the same commit as the shell
  — a reopen on the persisted screen, a door landing on one — because React runs a child's passive
  effects before its parent's; the reset is a layout effect now (test: reopen on a persisted screen,
  Save, the flush ran). Folds: E1's `redirectsContract.ts` → the shared schema + the typed client,
  `RedirectRow` as the screen's read shape; `SET_RESTORE_STRIP` / `SET_ROW` / `SET_ROW_LABEL` from four
  private copies (two differed) into `shared.tsx`; `SAVE_ERROR_MESSAGES` into `constants.ts` for the
  shell, Domains and Redirects; `usePages`' older `{pageId}` listener deleted (PagesTab handles the
  event and the shell's held request; the old one closed an open drawer on an unknown id).
- **The doors, measured:** a listener inside the Settings tab or the Pages panel never hears an emit
  fired in the same gesture as the tab switch — both are lazy and unmounted (E3 measured it in jsdom;
  the events file's "declared-never-works" family). StudioPanels, mounted throughout, holds each
  request and hands it down (`settingsOpen` → `SettingsTab.openRequest`, `pagesOpen` →
  `PagesTab.openSettingsRequest`), dropping it when the tab is left.
- **Open / known:** the repair draft and the suggester offer the same rule at once after a slug
  change (the draft from the door, the row from the history) — saving either takes the other away;
  the frame's `Add redirect` header button is absent on the repair frames (older sidebar) and stays
  here; the Redirects subtitle `301 / 302 + 404 suggester` is the S1 nav's line; the global `Saved —
  site settings didn't` toast (S1) still fires beside the banner; `Page settings saved` toasts twice
  on a slug change (pre-existing, the drawer's autosave); the Overview's `3 rules · 1 suggestion`
  follows the new source; `e2e/probe` settings-headers fixture still stores `hstsMaxAge: null`.
- **Not verified:** the loading frames as live screenshots (driven); a real Vercel deploy with the
  file (external); the Our story pair as its own walk (same component); a REDIRECT-kind domain's
  host rule on the scratch site (unit-tested).
- Tests / gates: see the phase report.
