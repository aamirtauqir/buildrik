# Settings · Clone S2 — DISTRIBUTION — walk log

Brief: `phase2-brief.md`. Backend delta (approved with the §5 defaults): `phase2-backend.md`.
Shots: the 16 section frames + `3737-43669`, `3737-44855`, `3737-44869`, `4256-26844` (4 calls;
86 spent on 2026-09-14 in all). Graph: `reactions-settings-1..3.json`.

## Live env

As S1 (`phase1-journeys.md` § Live env): worktree `buildrik-settings` on `localhost:3001`, the
shared Postgres. **Migration `20260914100000_settings_s2_domains_locales`** applied locally with
`prisma migrate deploy` (`migrate dev` wanted to reset the database over pre-existing drift —
`known_devices`, `onboarding_states.wizardData` exist without a migration — so B wrote the file
by hand in Prisma's format; prod is the founder's `migrate deploy`). Seed extended and re-run
(domain with A + CNAME verified / TXT pending · `en, fr, ar` with `fr` on 2 of 3 pages · 43
`AnalyticsEvent` rows · `projectSettings.analytics.googleAnalytics`), reset and re-seeded after the
walk. Plan flipped FREE → PRO for the Add-domain connect (FREE's `customDomains` is 0) and back.
The :3001 server was restarted for the regenerated Prisma client (a stale process had kept serving
— the first `domains.list` came back without the new columns).

## Work split

| agent | journey | files owned |
|---|---|---|
| B | the migration, `connect` (+kind/provider/https, A + CNAME + TXT), `checkAvailability`, `update`, TXT resolution, `analyticsStatus`, `locales`, `localeAutoRedirect`, the seed | `prisma/schema.prisma` + the migration, `packages/shared/schemas/site-detail.ts` (`DNS_PROVIDERS`, the S2 schemas), `server/trpc/routers/site-detail.ts`, `server/services/{domain,site-detail,site-settings,analytics}.service.ts`, `prisma/seed-settings-clone.ts` |
| E1 | Domains + Add a domain + Remove confirm + the 7 states | `screens/DomainsScreen.tsx`, `components/{AddDomainDialog,RemoveDomainDialog}.tsx`, `settings.css` (284 → 192) |
| E2 | Analytics + Verify / Connection verified + validation + the 3 states | `screens/AnalyticsScreen.tsx`, `screens/analyticsIds.ts`, `components/ConnectionVerifiedDialog.tsx`, `shared/types/project.ts` (`verifiedAt`) |
| E3 | Localization + Add locale + Translation checklist + the 3 states | `screens/LocalizationScreen.tsx`, `components/{AddLocaleDialog,TranslationChecklistDialog}.tsx`, `constants.ts` (`native`, `ur`, `RTL_LOCALES`) |
| main | the shell's header-action slot + the immediate-action footer + the save-error lines (before the agents), merges + the three contract folds, the live walk, 3 fixes, `boards.json`, this log | — |

## Drift table

| screen | verdict | note |
|---|---|---|
| 3397:32206 Domains | drift-fixed | strips · Custom domain card (status pill, Force HTTPS → `domains.update` verified on the row, Remove) · DNS records table + Check DNS (the real resolver → FAILED on the fixture domain, honest) · `Actions apply immediately · nothing to save here` · Done; live-3397-32206-domains |
| 3737:43669 Add a domain | drift-fixed | Available / Already connected tag live; type · provider · nameservers · records · Force HTTPS; FOUND: the records drew `<ip>` / `<target>` — `DNS_TARGETS` shared, real values now; on FREE the server's `custom-domain limit` line stays in the dialog (live-3737-43669-plan-limit); on PRO → the new PENDING card with the minted TXT token (live-3397-32206-added) |
| 3397:34402 remove-confirm | match | title/body/Cancel/Remove domain; live-3397-34402-remove-confirm |
| 3455:15509 removed | match | the empty card + `<domain> removed…`; live-3455-15509-removed |
| 3397:33034 empty | match | reached by the remove; `Add domain` in the card |
| 3397:32985 / 33085 / 33134 | driven / drift-fixed / drift-fixed | load-error (`domains.list` rejected) and save-error (`domains.update` rejected on the toggle) live; live-3397-33085-domains-load-error, live-3397-33134-domains-save-error |
| 3397:32295 Analytics | drift-fixed | five cards, GA's status + last-received lines from the seeded events (`RECEIVING DATA`, `40 events in the last 24 hours`); FOUND: `Enable Google Analytics` wrapped at the 144 label column → 192 on every label-left row; live-3397-32295-analytics |
| 4256:26844 Connection verified | match | Verify on `G-ABCD123456` → the dialog with the count → `Measurement ID verified on 14 Sep 2026` → Save → `verifiedAt` on the row; live-4256-26844-verified |
| 3397:34148 validation | match | the seeded 11-char id drew the frame's sentence at once |
| 3953:49515 / 49670 / 3951:26455 | driven / drift-fixed / driven | load-error live (`analyticsStatus` rejected); live-3953-49670-analytics-load-error |
| 3397:32376 Localization | drift-fixed | Default card (select · Auto-redirect toggle → row, verified) · Locales table from `siteDetail.locales` (LIVE / PENDING / NOT STARTED with `3 of 3` etc.) · Remove; FOUND: the toggle saved and nothing read it — the export engines now emit the first-visit redirect on every published page (`sessionStorage` once, default-locale paths only) from a read-only `settings.localization` mirror; live-3397-32376-localization |
| 3737:44855 Add locale | match | Urdu created (`/ur · 0 of 3 · NOT STARTED`), then removed and saved; live-3737-44855-add-locale |
| 3737:44869 Translation checklist | match | Arabic: `Right-to-left locale. Begin with Home, then Home Copy and Home Copy 2.`; live-3737-44869-checklist |
| 3397:33194 / 33241 / 33288 | driven / drift-fixed / drift-fixed | load-error (`locales` rejected) and save-error (`settings.update` rejected) live; live-3397-33241-loc-load-error, live-3397-33288-loc-save-error |

## Notes

- **Contradictions decided:** the busy/load-error copy follows the S1 card where a REFERENCE
  VARIANT frame draws an older string (`Failed to load locales.`, `Is the dashboard running?`);
  the Analytics loading line is the frame's own `GA4, GTM, Meta Pixel and Clarity keys.`; the
  Domains save-error frame's inline connect form loses to the later Add-a-domain dialog; locale
  codes stay bare; Cloudflare/GoDaddy nameservers are patterns (they assign per zone); the GA
  events are the site's own tracker's; `Remove` on a locale row is a visible quiet button (the
  frame draws nothing in that slot); `Verify` stamps `verifiedAt` into the draft and rides the
  next Save (no extra mutation); the S1 shell's `SAVE_ERROR_MESSAGES` carry the three sentences;
  `siteDetail.analyticsStatus` is top-level (the `analytics` key was taken).
- **Backend, honest limits:** Force HTTPS and a REDIRECT-kind domain's 301 are **stored, not
  enforced at the host** — the deploy ships no redirects/headers file and Vercel forces HTTPS on
  every deployment itself (`blocked:host-redirect` on 3397:32206); `Available` = this database
  only; `Check DNS` on the fixture domain resolves to FAILED; FREE refuses every connect
  (`customDomains: 0`) and the dialog says so.
- **Found on the walk, fixed (3):** the auto-redirect flag nothing read (the export snippet, both
  engines, tested on published pages); the dialog's placeholder DNS values; the 144 label column.
  Plus the merge folds (three temporary contracts → the shared schema + the typed client;
  `DomainRow` as the screen's read shape; the Analytics test's mock path).
- **Open / known:** the plan tier is read at project load (`getEditorPlanTier`), so after a plan
  flip the nav's `Pro` pills lag until a reload (S1 note); the `Remove` on locales is not a row
  menu; the seeded TXT value is a fixture token; `Check DNS` cannot pass without a real domain
  (`blocked:external` for a VERIFIED walk); `packages/dashboard` `tsc --noEmit` is masked by the
  `@types/react-window` stub (B verified `--types node` clean) — pre-existing.
- **Not verified:** the loading frames as live screenshots (driven); a real registrar / DNS
  (external); the save-error on Analytics as a live click (the same shell path walked on the
  other screens); the redirect snippet in a browser (unit-tested; the published page carries it).
- Tests / gates: see the phase report.
