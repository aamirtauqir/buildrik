# Settings · Clone S1 — Shell + SITE — walk log

Brief: `phase1-brief.md`. Backend delta (approved): `phase1-backend.md`. Shots:
`shots/3397-32011` … `3397-32859`, `3397-32915`, `3737-43639`, `3737-43624`, `3737-46109`,
`3737-43652`. Graph: `reactions-settings-1.json` / `-5.json`. Figma calls this phase: 0 (82 spent
on 2026-09-14 for the census, all 68 section shots, the graph and S1's three overlays).

## Live env

Worktree `/Users/shahg/Desktop/pencil/buildrik-settings` (branch `feat/settings-clone`) with its
own dashboard on `localhost:3001` — env re-pointed (`NEXTAUTH_URL` / `AUTH_URL` /
`NEXT_PUBLIC_APP_URL` / `VITE_DASHBOARD_URL` / `EDITOR_ORIGIN` → 3001), same Postgres as `:3000`.
The main checkout stays on `feat/assets-clone-p1` for the other session's Editor v3 IA edits.
Site `scratch-ver` seeded by `prisma/seed-settings-clone.ts` (1 domain + pending TXT, 3 redirects +
2 slug-history suggestions, 3 forms / 38 submissions, 1 webhook + failed delivery, `en, ar`,
2 integrations, this week's analytics rows) — left seeded. Plan flipped FREE → PRO for the unlocked
walk and back to FREE. Site name, custom code and OG image edited live and restored.

## Work split

| agent | journey | files owned |
|---|---|---|
| B | `siteDetail.settingsOverview` + `settingsOverviewSchema` + the seed | `server/trpc/routers/site-detail.ts`, `server/services/site-detail.service.ts`, `packages/shared/schemas/{site-detail,integrations}.ts`, `prisma/seed-settings-clone.ts`, tests |
| E1 | the shell (sidebar, header, footer states, doors), the Overview | `SettingsTab.tsx`, `shared.tsx`, `types.ts`, `constants.ts` (nav), `icons.tsx`, `screens/OverviewScreen.tsx`, `settings.css` (540 → 284), `StudioHeader.tsx` (`ui:open-exporter`), `FullPageRouter.tsx` |
| E2 | General · SEO defaults · Custom code · Locked, the dual-save map | `screens/{SiteSettingsScreen,SeoScreen,AdvancedScreen,LockedScreen}.tsx`, `hooks/useServerLoad.ts`, `services/BuildrikSyncProvider.ts`, `constants.ts` (`SITE_LOCALES`) |
| E3 | Unsaved settings · Settings saved · Search settings + the registry | `components/{UnsavedSettingsDialog,SettingsSavedDialog,SearchSettingsModal}.tsx`, `searchIndex.ts` |
| main | merge + folds (loadCard → shared, ServerLoadProps → types, INTEGRATION_CATALOG → shared, LOCKED_COPY, the mirror-error save), live walk, 4 fixes, boards.json, this log | — |

## Drift table

| screen | verdict | note |
|---|---|---|
| 3397:32011 General (+ the shell) | drift-fixed | sidebar 256 / header / cards / footer as drawn; values from the Site row; Save → `Site.name` / `favicon` / `defaultLocale` / `socialLinks` verified on the server. FOUND: the saved name stayed old in the sidebar/topbar (project metadata) → the flush updates it; Save changes was the engine's local write, the server mirror ran on the autosave tick and its refusal event fired after the dialog — with a site id the Save is the provider's, awaited; live-3397-32011-general |
| 3953:26363 loading | drift-fixed | read delayed 4 s → `SITE IDENTITY` card `Loading…`, footer `Loading settings…`, Save disabled; live-3953-26363-general-loading |
| 3953:26503 load-error | drift-fixed | `settings.get` rejected → `Couldn't load your site settings…` + Try again, footer `Settings could not load`; Try again re-reads; live-3953-26503-general-load-error |
| 3950:26309 save-error | drift-fixed | banner + `Changes not saved` + `Retry save` — mechanism verified on SEO and Custom code (below); the app's global `Saved — site settings didn't` toast also fires (outside this surface, `AquibraStudio` territory) |
| 3397:32076 SEO defaults | drift-fixed | info strip, Site SEO, Indexing toggle + robots.txt preview (no Sitemap line without a host — honest); `allowIndexing` / `ogImage` reach the row; live-3397-32076-seo |
| 3953:26646 / 26785 / 3951:26319 | driven / drift-fixed / drift-fixed | load-error copy live; save-error forced by an invalid OG image (server 400 → 207 batch): banner · Retry save → fixed value → Settings saved; live-3951-26319-seo-save-error |
| 3397:32456 Custom code | drift-fixed | on PRO: three side-labelled code cards; a head script saved → `Site.headCode`, then cleared; live-3397-32456-custom-code |
| 3953:49260 / 49386 / 3951:26607 | driven / drift-fixed / drift-fixed | load-error copy live (`Head, body and CSS injections for this site.` — the frame's line); save-error with `settings.update` rejected → banner · Retry save → saved; live-3951-26607-cc-save-error |
| 3397:32859 locked (Pro) | drift-fixed | on FREE: header `Upgrade`, the one card, `Upgrade to Pro`; FOUND: the shell drew Cancel / Save changes under it — the frame has no footer → none when locked; live-3397-32859-locked |
| 3397:32915 Overview | drift-fixed | NEEDS ATTENTION 3 + five cards with the seeded numbers (`2 locales · Arabic not started`, `scratchver.example.com · 1 DNS pending`, `3 rules · 2 suggestions`, `3 forms · 38 submissions`, `1 endpoint · last delivery failed`, `2 of 1 seats used` on FREE / `2 of 5` on PRO, `Free · $0` / `Pro · $29 / month`); lines follow the saves (`None set` → `Head set`); Done → canvas; live-3397-32915-overview |
| 3737:43639 Unsaved settings | drift-fixed | Back / Cancel / Escape / nav while dirty → dialog (Keep editing focused); Keep keeps; Discard on a nav click lands there rolled back; Discard on a door → canvas; live-3737-43639-unsaved |
| 3737:43624 Settings saved | match | after every Save; Return to settings |
| 3737:46109 Search settings | drift-fixed | `domain` → Domains / Domain / DNS records with groups; a row opens Domains; FOUND: two ✕ (WebKit's search-input clear + the frame's) → `type=text`; live-3737-46109-search |
| 3737:43652 Edit social profile | out-of-scope | the prototype's stand-in for typing; the real input |
| 3397:32144 Export (superseded) | record | the sidebar's Export opens the Export modal (`Export site as HTML`) via `ui:open-exporter`; the in-tab screen is gone |
| doors | verified | Fonts & colours → Brand panel; Members / Billing → `…/dashboard/settings/team` / `billing` in a new tab; `‹ Back to canvas`; Overview `Done` |
| the door IN (found after the report) | drift-fixed | the full-screen Settings had none of its own — `⋯ → Site settings` and `⌃,` opened board 1172:4867's Project settings modal, only `⋯ → Plugins` reached the shell. Both doors are AquibraStudio's `openProjectSettings`, so `StudioModals` routes that flag to the Settings tab; the modal retires (1172:4867, 183:16) and its Author + Canvas grid (grid size · snap) move to General; live: menu row and ⌃, both land on the Overview, grid 8 + snap on → engine state 8 / true; live-site-menu-settings-door, live-3397-32011-general-canvas |

## Notes

- **Contradictions decided:** Clone shell edge-to-edge like the Asset library (the frame is 1440
  wide with the sidebar at x=0); nav labels/groups are the Clone's, the S7 in-tab screens keep
  their components under the new header; the locked frame's subtitle (`CSP, HSTS…`) and its older
  sidebar lose to the CURRENT frames; `Free` shows the dead `2 of 1 seats used` honestly (the
  workspace has two members on a one-seat plan — the data, not the frame's `3 of 5`); the Overview
  is not a search result; `Force HTTPS` is not in the registry (no such control); Discard on a nav
  click follows the click; Save changes stays enabled on a clean screen (the frame draws it so); the
  robots.txt Sitemap line needs a real host; Members/Billing overlays (`3737:46094` / `46102`) stay
  dashboard deep links (`superseded:code:deep-link` — the founder's default at the S1 go).
- **Found on the walk, fixed (5):** the Settings surface had no door (above); saved site name not reaching the sidebar/topbar; Save changes
  not the server's save (the mirror's refusal unobserved — the biggest one); a footer under the
  locked screen; the doubled ✕ in Search. Plus the merge folds (E2's stub → `shared.tsx`,
  `ServerLoadProps` → `types.ts`, the catalog → shared, `LOCKED_COPY`, `set-load-state`).
- **Open / known:** the global `Saved — site settings didn't` toast duplicates the frame's banner
  (its listener lives in the shell outside Settings); the floating `N` / `≡` FABs overlap the
  sidebar's last row and the footer's primary at 1440×900 (pre-existing on every fullpage surface —
  the Asset library too); the sidebar's row pitch 32 vs the frame's ~36 and the Overview rows ~50 vs
  ~56 (`founder:density-32`); `General · English (en)` where the frame writes `English (en-US)` (the
  product's locale codes are bare); Settings reopens on the last screen, not the Overview
  (`usePanelNavigation` persists it — no frame says otherwise); the S7 recipes (`s7-settings-*`)
  will measure the new card shape on their next run — anchors intact.
- **Not verified:** the loading frames of SEO / Custom code as live screenshots (same card, driven
  by tests; General's was); a real non-admin's save (role-gated 403 — same banner path); a real
  network outage (fetch was patched in the page).
- Tests / gates: see the phase report (run after this log).
