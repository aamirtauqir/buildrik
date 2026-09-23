# Settings · Clone S3 — PLUMBING-1 — agent brief

Redirects · Headers on the S1 shell, plus the doors that reach Redirects from the Pages panel.
Everything is CACHED — **never call Figma** (89 of today's 200 spent):

- Shots: `/Users/shahg/Desktop/pencil/buildrik-settings/docs/design-jobs/CLONE-SETTINGS/shots/<id>.png`
  (`':'→'-'`; 1024-wide renders of 1440 frames). Redirects: `3397-32517` main · `3397-33479`
  loading · `3397-33526` empty · `3397-33573` load-error · `3397-33620` validation (an OLDER inline
  form — its error copy is the contract, the dialog is the layout) · `3951-26730` save-error ·
  `3519-19920` / `3519-20096` About URL repair draft / saved · `3519-20272` / `3519-20448` Our
  story draft / saved · `4254-75736` **Add redirect** · `4254-75747` **Edit redirect**. Headers:
  `3397-32602` main · `3397-33335` loading · `3397-33383` load-error · `3397-33431` save-error ·
  `3397-34227` unsaved changes.
- Every text node of the key frames (what the shots clip below 900):
  `…/CLONE-SETTINGS/s3-text.json`.
- Graph: `…/CLONE-SETTINGS/reactions-settings-1.json` (indices 7 Redirects, 8 Headers) and `-3.json`
  / `-4.json` / `-5.json` (the state frames).
- The approved delta: `…/CLONE-SETTINGS/phase3-backend.md` — with these §5 answers:
  **vercel.json ships straight** (no toggle) · **the suggester's source is the page slug history**
  (`Page.slugHistory`) · **no HSTS subflag columns** (the frame draws `Enable HSTS` + `Max age`
  only — `s3-text.json`). So the ONLY migration is `Redirect.matchQuery` + `Redirect.notes`.
- The shell + S1/S2 patterns: `phase1-brief.md` §Contracts, `phase2-brief.md` (header actions,
  `useServerLoad`, `LoadCard`, `SaveErrorBanner`, `registerSaveHandler` that must reject, the
  label-left rows at a 192 label column), the finished `screens/DomainsScreen.tsx` (a screen whose
  actions land at once through dialogs — Redirects is the same shape) and
  `components/{AddDomainDialog,RemoveDomainDialog}.tsx`.

## Ground rules (unchanged — founder decisions 2026-09-14)

Clone wins (visual + copy; later/more-specific frame wins a Clone-vs-Clone conflict, say so);
sample data is shape (`/menu-old → /menu`, `bellacucina.com/offers`, `Old menu page retired in
March…`); behaviour is real; backend only per the delta; density 32 (labels 192 wide on
label-left rows; dialogs 640 `size="table"`, title 16/600, body 13, buttons 32); chrome from
`@/editor/chrome-ui` only, `tw:` utilities not CSS, `var(--bk-*)`, Gate 24; tests rewritten in
the same commit; **git:** worktree branch, FIRST `git log -1 --format=%H` must be
`<TIP>` (given in your prompt) — else `git merge --ff-only <TIP>` / `git reset --hard <TIP>`;
`pnpm install --prefer-offline --frozen-lockfile` if `node_modules` is missing; one commit per
frame `J-<nodeId>: implemented — …` / `backend — …`; never stage
`packages/editor/src/editor/shell/AquibraStudio.tsx` or `packages/editor/scripts/baselines/ssot.json`;
do not push; never edit another agent's files. B symlinks the `.env` files from
`/Users/shahg/Desktop/pencil/buildrik/` (never print them).

## The frames

**Redirects (`3397:32517`)** — header `SEO & publishing / Redirects` · `301 / 302 + 404
suggester` · `Add redirect` primary (header action). Body: the amber `Restoring a site version
leaves this configuration unchanged.` strip · card **Redirects**: table `FROM PATH · TO URL · TYPE`
+ an `Edit` secondary per row (32) → the Edit dialog; empty (`3397:33526`) = the card's own line
`No redirects yet. Add one to send an old URL to a new one.` + `Add redirect` · card **404
suggester**: `Suggest redirects from 404s` toggle (`projectSettings.redirects.suggestFrom404s`,
default on — saved through the shell's Save) · below it one row per suggestion `<from> → <to>` with
an `Accept` secondary (creates a 301 at once, the row leaves; a small `renamed <d MMM>` muted
after the arrow, since the source is the page slug history); toggle off → the rows hide; none →
`No suggestions — every renamed page already has a redirect.` Footer: `All changes saved` ·
Cancel · Save changes (the toggle is the only saved thing; rows apply at once through the
dialogs). The frame's second footer variant (`Discard · Save`) is the older inline form — the
shell's footer wins.
**Add redirect (`4254:75736`)** — `Add redirect` · `<site> · Redirects` · `From path` (`/old-url`
placeholder) · `To URL` (`/new-url`) · `Redirect type` segmented `301 Permanent · 302 Temporary` ·
boxed `Match query strings` row + toggle + `Forward ?utm_source and other parameters to the
destination.` · `Notes` (`Optional — why this redirect exists.`) · `Paths must start with /. A 301
is cached by browsers — use it for permanent moves; a 302 stays uncached while you test.` ·
Cancel · `Add redirect` (disabled until valid) → `redirects.create` → close → re-list. Validation
(`3397:33620`'s copy): `From path must start with / (e.g. /old-page)`; a To URL must start with
`/` or `http(s)://`; the same path twice → `A redirect from <path> already exists.` (the server's
refusal, inline).
**Edit redirect (`4254:75747`)** — the same fields prefilled · `Delete redirect` (danger, left) ·
Cancel · `Save redirect` → `redirects.update`; delete → `redirects.delete` (a confirm is NOT
drawn — delete at once, the row leaves).
**URL repair draft (`3519:19920`, `3519:20272`)** — above the Redirects card when the screen was
opened by the Pages door: `Redirect for <Page>` (14/600) · `<site> · URL change /<old> → /<new>` ·
`From path` / `To path` prefilled (editable) · `301 · Permanent redirect` · `Save redirect`
(primary) · Cancel · `Unsaved redirect · Save this rule for <site>.` Save → `redirects.create` →
**saved (`3519:20096`, `3519:20448`)**: the draft becomes a card `Redirect saved` · `/<old> →
/<new> · 301` · `Back to <Page> SEO` (secondary → the Pages panel's page settings, SEO tab, for
that page) and the rule joins the table. Cancel drops the draft.
**Headers (`3397:32602`)** — header `Advanced / Headers` · `CSP, HSTS, security policy` · the amber
restore strip · cards **Content Security Policy** (`CSP header value` mono textarea) ·
**X-Frame-Options** (`Policy` select: `DENY · SAMEORIGIN · (none)`) · **Referrer-Policy** (`Policy`
select) · **HSTS (HTTP Strict Transport Security)** (`Enable HSTS` toggle · `Max age` select `1 year ·
2 years (recommended) · 6 months · 1 month`, storing seconds) · then the code's **Permissions-Policy**
card kept below (the frame does not draw it; the column exists and nothing else edits it — say so
on the row). Footer: `All changes saved` · Cancel · Save changes — the screen's own
`registerSaveHandler` → `settings.update`, rejecting on failure. **unsaved (`3397:34227`)**: the
footer's `Unsaved changes` (warning) with Cancel / Save changes — the S1 shell already does this;
the frame's `Discard · Save` second line is the older bar. loading / load-error / save-error:
`LoadCard` `HEADERS` · `CSP, X-Frame-Options, Referrer-Policy and HSTS.` · `Couldn't load your
headers. Check your connection, then try again.` · banner `Header changes were not saved. Your
changes are still here. Review the values, then retry.` Redirects' strings: `REDIRECTS` · `Old
URLs sent to new ones, and the 404 suggester.` · `Couldn't load your redirects. Check your
connection, then try again.` · `Redirect changes were not saved. Your changes are still here.
Review the values, then retry.`

## Contracts

```ts
// B → packages/shared/schemas/site-detail.ts
createRedirectSchema / updateRedirectSchema += { matchQuery?: boolean; notes?: string | null }
redirectSuggestionSchema = z.object({ fromPath, toUrl, pageId, pageName, changedAt })   // ISO
siteDetail.redirects.suggestions({ siteId }) → RedirectSuggestion[]
siteDetail.redirects.list rows carry matchQuery, notes
// shell (main) → RedirectsScreen (E1)
ScreenProps += nothing new. RedirectsScreen gets two extra props from the shell:
  repair?: { pageId: string; pageName: string; from: string; to: string } | null
  onRepairDone?: () => void            // the draft was saved or cancelled
// doors (E3) — composer events the shell (main) listens to:
composer.emit("ui:switch-tab", { tab: "settings" });
composer.emit("ui:settings-open", { screen: "redirects", repair: { pageId, pageName, from, to } });
// the saved card's `Back to <Page> SEO` (E1 emits, E3 handles in PagesTab):
composer.emit("ui:switch-tab", { tab: "pages" });
composer.emit("ui:pages-open-settings", { pageId, tab: "seo" });
```
`EVENTS.UI_SETTINGS_OPEN` / `EVENTS.UI_PAGES_OPEN_SETTINGS` — main adds the two constants to
`shared/constants/events.ts` at merge; emit the string literals meanwhile.

## Work split

| agent | owns | delivers |
|---|---|---|
| **B** backend | `prisma/schema.prisma` + migration `settings_s3_redirects` (`Redirect.matchQuery Boolean @default(false)`, `Redirect.notes String?` — hand-written like S2, `migrate deploy`), `packages/shared/schemas/site-detail.ts`, `server/trpc/routers/site-detail.ts` (`redirects.*`), `server/services/site-detail.service.ts` (suggestions from `Page.slugHistory`; the overview's `redirects.suggestions` count on the same source), `lib/publish-files.ts` + `packages/dashboard/app/api/workers/publish/[jobId]/route.ts` (the **`vercel.json`** deploy file: `redirects` from the rows incl. `matchQuery`, a `REDIRECT`-kind domain's host rule to the primary, `headers` from the Site's CSP / HSTS (`max-age=<hstsMaxAge>`) / X-Frame-Options / Referrer-Policy / Permissions-Policy; omitted when nothing is set), `prisma/seed-settings-clone.ts` (§4: one redirect with `matchQuery` + `notes`; a page with an old slug in `slugHistory` and no redirect; the header columns set), their tests | §2 + §3 of the delta; the seed run; the live numbers in the report |
| **E1** Redirects | `settings/screens/RedirectsScreen.tsx` (+ test), new `settings/components/{RedirectDialog,RedirectRepairCard}.tsx` (+ tests) — one dialog component for Add and Edit, the repair draft/saved card, the `redirects` rows of `searchIndex.ts`, a temporary `screens/redirectsContract.ts` for the types B adds (deleted at merge) | the screen, the dialogs, the suggester, the repair draft → saved, the 5 states |
| **E2** Headers | `settings/screens/HeadersScreen.tsx` (+ test), the `headers` rows of `searchIndex.ts` | the screen in the Clone's cards (HSTS toggle + Max age select), the 4 states |
| **E3** the Pages doors | `sidebar/tabs/pages/page-settings/SeoTab.tsx` (+ test): after a slug change is SAVED there, an inline offer `URL changed from /<old> to /<new>. Add a redirect so old links keep working?` · `Add redirect` (→ the two events above) · `Not now`; `sidebar/tabs/pages/PagesTab.tsx` (+ test): handle `ui:pages-open-settings` (open that page's settings drawer on the SEO tab) | both doors |
| main | `SettingsTab.tsx` (the `ui:settings-open` listener → navigate + `repair` → `RedirectsScreen`; `SAVE_ERROR_MESSAGES` for the two), `events.ts`, merge + folds, migrate + seed, the live walk, `boards.json`, `phase3-journeys.md` | — |

## data-testids

Redirects: `set-rd-add` · `set-rd-restore` · `set-rd-table` · `set-rd-row-<id>` · `set-rd-edit-<id>` ·
`set-rd-empty` · `set-rd-suggest-toggle` · `set-rd-suggestion-<i>` · `set-rd-accept-<i>` ·
`set-rd-suggest-empty` · dialog `set-rd-dialog` · `set-rd-from` · `set-rd-to` · `set-rd-type-301` ·
`set-rd-type-302` · `set-rd-match-query` · `set-rd-notes` · `set-rd-error` · `set-rd-delete` ·
`set-rd-cancel` · `set-rd-submit` · repair `set-rd-repair` · `set-rd-repair-from` · `set-rd-repair-to`
· `set-rd-repair-save` · `set-rd-repair-cancel` · `set-rd-repair-saved` · `set-rd-repair-back`.
Headers: `set-hd-csp` · `set-hd-xfo` · `set-hd-referrer` · `set-hd-hsts-enable` · `set-hd-hsts-max` ·
`set-hd-permissions`. Pages: `page-seo-redirect-offer` · `page-seo-redirect-add` ·
`page-seo-redirect-later`. Every screen: `set-card-<slug>`, `set-load-*`, `set-save-error`.

## Report format — as S1/S2 (Branch / Commits / Frames / Contradictions / Contract notes / Tests / Not done).
