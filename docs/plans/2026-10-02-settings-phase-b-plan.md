# Settings Phase B — implementation plan + board map

- **Date:** 2026-10-02 · **Status:** PLAN ONLY. Nothing below is built. Owner review first.
- **Base:** `main` @ `deb2cd4f6` (Phase A SA-01…08 merged; checked in code, not just docs).
- **Contract:** `docs/plans/2026-09-27-settings-architecture-proposal.md` §18–28 + DECIDED block (D1, PD-1…PD-8).
- **Folded in (owner 2026-10-02):** Settings · Clone S4 (`docs/design-jobs/CLONE-SETTINGS/phase4-backend.md`) and S5
  (`phase5-backend.md`). §3 below says what survives.
- **Starts after:** `fix/editor-known-bugs` lands (its only overlap with this plan is
  `packages/editor/src/engine/commands/defaultCommands.ts`, which Lane 0 also edits — rebase Lane 0 after it).
- **Figma:** file `g4GzQFqzNYz5sosz1QtZXC`, page `4418:45431` (Editor v3 · IA), section `4418:127312`
  "Configure site and workspace · Settings". 7 Figma calls spent (read-only `use_figma`), all listed in §8.

---

## 0. Ground truth this plan was built on (verified on `main`, 2026-10-02)

| Claim | Evidence |
|---|---|
| Settings Save still goes through `sites.saveProject` (BuildrikSyncProvider `saveProject`) and mirrors column fields to `siteDetail.settings.update`; toast still says "Configuration saved. Your canvas content is unchanged." | `SettingsTab.tsx:436-498`, `BuildrikSyncProvider.ts:566-625` |
| Columns are the one SoT for 14 fields (SA-01 done) | `packages/shared/schemas/site-column-fields.ts` |
| **No** `projectSettingsSchema` exists; JSON-only keys (analytics, `customCode.globalCSS`, `redirects.suggestFrom404s`, `seo.twitterHandle`) are only partly checked (analytics injection guard, `sites.service.ts:766`) | grep: zero hits for `projectSettingsSchema` |
| `siteDetail.settings.update` exists (ADMIN, Pro gates for custom code + password, slug/unique, locale rules) | `server/trpc/routers/site-detail.ts:104-146` |
| **No restore** for deleted sites (PD-6 not built). Soft delete + 30-day purge cron exist | `sites.service.ts:589-636`; `app/api/cron/soft-delete-purge/route.ts:12` |
| `sites.rename` is still **EDITOR** (PD-4 not built) | `server/trpc/routers/sites.ts:110-119` |
| `sites.archive`/`unarchive` = ADMIN, `sites.transfer` = OWNER **and** `site.createdBy === caller` | `sites.ts:152-173, 277-300`; `sites.service.ts:290-298` |
| Workspace default language / timezone still in UI (PD-8 not built); dashboard GA "Tracking ID" integration + Marketplace GA still present (PD-2 not built) | `components/settings/workspace-form.tsx`, `integrations-tab.tsx:9-12`, `lib/marketplace-catalog.ts` |
| Editor Integrations stub screen still mounted; ⌘K "integrations" command opens it | `screens/IntegrationsScreen.tsx`, `engine/commands/defaultCommands.ts:732` |
| Webhooks is already an external door to dashboard Integrations (A-12) | `constants.ts` `WORKSPACE_LINKS.webhooks` |
| Redirect CSV import validates only "starts with /" + non-empty — `toUrl` never goes through `redirectTargetSchema` | `redirect.service.ts` `importRedirects` |
| Editor Domains has no set-primary; Redirects has no CSV; Forms has no per-form Inspector link | grep of the three screens |
| `FormBlock.spamProtection` already on main; S4's `forms.create/update/delete`, `webhooks.setActive/deliveries` are **not** on main | `prisma/schema.prisma:979`; `git merge-base` on S4 commits |
| Permissions dialog (S5) is already built on v3 boards `4418:133026` / `5905:44701`, incl. owner "Delete this site" → `5890:44728` | `editor/shell/modals/PermissionsModal.tsx` |
| Page-settings SEO (S5) already built to the v3 modal `6887:73809` | `pages/page-settings/SeoTab.tsx:299` |
| Editor has no `?settings=<screen>` deep link (only `?el=` / `?page=`) | `editor/shell/hooks/useDeepLink.ts` |
| Dashboard site tabs: Overview · Traffic · Domains · SEO · Submissions(`/feedback`) · Redirects · Sharing(`/access`) · Settings | `components/site-detail/tab-nav.tsx` |
| **Every v3 Settings board still draws the OLD nav** (SITE SETUP / SEO & PUBLISHING / VISITORS / ADVANCED / WORKSPACE, with Export, Integrations, Webhooks) | Figma call 4 (`4418:144988` texts), call 5 (`4418:128917`) |
| The file has **no dashboard boards** (pages: Foundations, Components, Editor v3 · IA, empty "Page 4") | Figma calls 6–7 |

---

## 1. Target IA table

Legend — **Board**: `EXACT` = content matches the new IA (the old sidebar on the board is ignored; it is fixed once via
the nav row in this table) · `CHANGE` = board exists but draws the old IA/content · `NONE` = no board.
**Delta** per §18–24. **Save** per §27: `footer` = per-screen Save/Discard via a dedicated settings mutation, Save
disabled while invalid · `immediate` = object actions via own dialog · `door` = navigation only.

### 1a. Editor › Site settings — shell

| # | Screen / state | Board(s) | Board | Code today | Delta | Save |
|---|---|---|---|---|---|---|
| 1 | Sidebar nav: groups SITE / SEARCH & SHARING / PUBLISHING / VISITORS / ADVANCED / DANGER ZONE + footer group "Managed in workspace settings ↗" | `4418:144988` (LIBRARY "Settings navigation / Job groups"), drawn on every screen board | CHANGE | `constants.ts` `SETTINGS_NAV`, `SETTINGS_NAV_GROUPS`; `types.ts` `SettingsNavId`; `SettingsTab.tsx` `GROUP_ORDER` | SPLIT "SEO & publishing"; REMOVE Export, Integrations; MERGE Webhooks into "Integrations & webhooks ↗"; NEW Access, Danger zone; rename Localization→Languages, Forms→Form submissions, Headers→Security headers | — |
| 2 | Scope line "<Site> · all pages · applies on next publish" (per screen; "Live immediately · no publish needed" on Domains / Form submissions) | none | NONE | header in `SettingsTab.tsx` (title/subtitle only) | NEW | — |
| 3 | Search (filter + "Search everywhere") | `6816:60270`, Clone `3737:46109` | CHANGE (placeholder → "Search site settings"; new entries) | `searchIndex.ts` | KEEP + index moved fields (slug, password, canonical, robots, touch icon, social) + aliases | — |
| 4 | Unsaved dialog (all exits incl. shell tab switch, SA-17) | `4418:165478` | EXACT | `components/UnsavedSettingsDialog.tsx` | KEEP (B-1 already routes shell exits through it — verify) | — |
| 5 | Saved toast "Saved · applies on next publish [Publish]" | `4418:165469` | CHANGE (copy + action) | `SettingsTab.tsx:443-452` | fix copy/action (SA-13) | — |
| 6 | Save-error banner (per screen) | per-screen save-error boards (rows below) + `4418:165473` "Settings could not save" | EXACT | `SAVE_ERROR_MESSAGES`, `shared.tsx` | KEEP; add field-level server errors (SA-10) | — |
| 7 | Read-only (role below min) screen state — banner + disabled controls | none | NONE | `SiteColumnsLockedContext` (ADMIN cols only) | NEW: one `SCREEN_MIN_ROLE` table drives every screen (SA-21) | — |
| 8 | Plan-locked screen + Pro pill on nav row | `4418:128808` (REFERENCE VARIANT Custom code · locked) | EXACT for screen; nav pill NONE | `LockedScreen.tsx`, `SCREEN_PLAN_REQUIREMENTS` | KEEP; drop `integrations` key; add `access` (Pro) | — |
| 9 | Overview (cards per new group, needs-attention) | `4418:128917` (Clone `3397:32915`) | CHANGE (cards for Export/Integrations/Webhooks; old groups; no pending-deletion) | `screens/OverviewScreen.tsx`, `siteDetail.settingsOverview` | KEEP, regroup; drop integrations row; add Access + Danger cards | — |
| 10 | Overview · pending-deletion / archived state | none | NONE | Home banner only | NEW | — |

### 1b. SITE

| # | Screen / state | Board(s) | Board | Code today | Delta | Save |
|---|---|---|---|---|---|---|
| 11 | General (name · favicon + touch icon upload · author; language row = link to Languages) | `4418:127313` (+ loading `4418:134172`, load-error `4418:134302`, save-error `4418:133217`) | CHANGE (draws Social Links card + Favicon URL text; no touch icon) | `screens/SiteSettingsScreen.tsx` | MOVE social → SEO; MOVE touch icon + upload from dashboard `settings-tab.tsx`; MERGE "Site Language" → link | footer |
| 12 | General › Advanced (collapsed): URL slug | none | NONE | slug only in dashboard `components/site-detail/settings-tab.tsx` | MOVE (PD-1, ADVANCED) | footer |
| 13 | Slug change confirm "Moves the default URL from <old> to <new>" | none | NONE | none (SA-06 validation exists server-side) | NEW | — |
| 14 | Languages (default locale + locales table) | `4418:127966` (+ loading `4418:129507`, load-error `4418:129607`, save-error `4418:129708`) | CHANGE (title "Localization"; draws Auto-redirect row — hidden by SA-05; footer Save covers the table) | `screens/LocalizationScreen.tsx` | rename; default locale = footer field; locales = objects, immediate; Add locale stops committing staged edits (SA-16) | default: footer · locales: immediate |
| 15 | Add locale dialog / locale created | `4418:165520` / `4418:165527` | EXACT | `components/AddLocaleDialog.tsx` | KEEP | immediate |
| 16 | Translation checklist / Translate page / translation saved / complete | `4418:165532`, `4418:165539`, `4418:165544`, `4418:165556`, `4418:173595`, `4418:173607` | EXACT | `components/TranslationChecklistDialog.tsx` | KEEP | immediate |
| 17 | Remove locale confirm (when it has translations) | none | NONE | staged remove, no confirm | NEW | immediate |
| 18 | Brand ↗ door (+ fallback card when no Brand panel) | `4418:128908` (REFERENCE VARIANT S7.2 Branding pointer) | EXACT (fallback) | nav `branding` kind `door` | KEEP; fallback card = S5 Q3 | door |

### 1c. SEARCH & SHARING

| # | Screen / state | Board(s) | Board | Code today | Delta | Save |
|---|---|---|---|---|---|---|
| 19 | SEO (defaults: meta title, description, OG image) + "Page overrides live in Pages ›" strip | `4418:127438` (+ loading `4418:134433`, load-error `4418:134565`, save-error `4418:133344`) | CHANGE (has "Twitter Handle" field; indexing card not collapsible; robots read-only) | `screens/SeoScreen.tsx` | KEEP defaults; PD-7 static strip | footer |
| 20 | SEO › Social profiles (all networks — Q-B9; Twitter URL + handle merged) | `4418:165483` "Edit social profile" (dialog only) | CHANGE (dialog exists; no 5-row block) | General's 3 social inputs + SEO `twitterHandle` (JSON) | MERGE (SET-29), MOVE from General + dashboard | footer |
| 21 | SEO › Indexing (Advanced, collapsed): allow indexing · canonical · editable robots.txt | none (current board shows a read-only robots preview) | NONE | `SeoScreen.tsx` `robotsPreview`; canonical/robots edit only in dashboard `seo-tab.tsx` | MOVE (PD-1, ADVANCED) | footer |

### 1d. PUBLISHING

| # | Screen / state | Board(s) | Board | Code today | Delta | Save |
|---|---|---|---|---|---|---|
| 22 | Domains (list, primary first, force HTTPS, DNS, check) | `4418:127680` (+ loading `4418:129084`, empty `4418:129186`, load-error `4418:129290`, save-error `4418:129393`) | CHANGE (one domain only; no primary badge / "Set as primary") | `screens/DomainsScreen.tsx` | KEEP; MOVE set-primary from dashboard `domains-tab.tsx` | immediate |
| 23 | Add a domain · Verify · DNS not found · Domain verified | `4418:165492`, `4418:165501`, `4418:165510`, `4418:165516` | EXACT | `components/AddDomainDialog.tsx` | KEEP | immediate |
| 24 | Remove domain confirm / removed | `4418:131992` / `4418:132281` | EXACT | `components/RemoveDomainDialog.tsx` | KEEP | immediate |
| 25 | Set primary confirm ("<domain> becomes the address visitors land on") | none | NONE | none in editor (`siteDetail.domains.setPrimary` exists, ADMIN) | NEW | immediate |
| 26 | Redirects (rules, 404 suggestions) | `4418:128227` (+ loading `4418:130172`, empty `4418:130272`, load-error `4418:130372`, validation `4418:130473`, save-error `4418:133735`) | CHANGE (no CSV actions; 404 toggle is a footer field today, becomes immediate; "Soon" pill on suggester) | `screens/RedirectsScreen.tsx` | KEEP; 404 toggle immediate (SA-16) | immediate |
| 27 | Add / Edit redirect, Redirect saved | Clone `4254:75736` / `4418:135236` / `4418:135402` | EXACT | `components/RedirectDialog.tsx` | KEEP | immediate |
| 28 | URL repair draft / saved (from Pages) | `4418:132394`, `4418:132547`, `4418:132694`, `4418:132847` | EXACT | `components/RedirectRepairCard.tsx` | KEEP | immediate |
| 29 | Delete redirect → undo toast (5 s) | none | NONE | one-click delete, no confirm | NEW | immediate |
| 30 | Redirects CSV import dialog + result (created N / line-error) + Export CSV | none | NONE | dashboard `redirects-tab.tsx` only | MOVE (PD-1) | immediate |
| 31 | **Access** (site password set / change / remove; "Share links ↗") | none | NONE | password only in dashboard `settings-tab.tsx`; share links at `/dashboard/sites/[id]/access` | NEW screen (MOVE password; door to Sharing) | footer |
| 32 | Access · Pro-locked | reuse pattern `4418:128808` | CHANGE (copy) | `LockedScreen.tsx` | `LOCKED_COPY.access` | — |

### 1e. VISITORS

| # | Screen / state | Board(s) | Board | Code today | Delta | Save |
|---|---|---|---|---|---|---|
| 33 | Analytics (GA · GTM · Pixel · Clarity; "Check data is arriving") | `4418:127827` (+ loading `4418:134947`, load-error `4418:135091`, save-error `4418:133473`, validation `4418:131600`) | CHANGE (subtitle "GA4, Plausible, PostHog, Pixel" stale; still draws Consent card; "Verify" wording) | `screens/AnalyticsScreen.tsx` (Consent already removed, G3-108) | KEEP; rename Verify (SET-05); legacy-ID warning not lock (SA-14) | footer |
| 34 | Check data is arriving result | Clone `4256:26844` "Connection verified" | CHANGE (copy "Format OK · no events yet") | `components/ConnectionVerifiedDialog.tsx` | fix copy | — |
| 35 | Form submissions (inbox, Export CSV, delete) | `7889:196284` "Forms workspace · Submissions" (new v3 functional-ownership section `7889:196283`) | CHANGE — see Q-B1: the board places the inbox in a **Forms workspace**, with Settings keeping a "Form settings" screen `4418:128507` (provider / spam / endpoint, "Soon") | `screens/FormsScreen.tsx` | rename; per-form "Configure in Inspector ›" | immediate |
| 36 | Form submissions states: loading, empty, error, action-error, inbox-loading, inbox-empty | `4418:130583`, `4418:130683`, `4418:130785`, `4418:130886`, `4418:130993`, `4418:131093` | EXACT | `FormsScreen.tsx` | KEEP | — |
| 37 | Delete submission confirm / deleted / toast | `4418:131840` / `4418:132141` / `6894:73834` | EXACT | `FormsScreen.tsx:430` | KEEP | immediate |
| 38 | Per-form row → "Configure in Inspector ›" (selects the form block) | none (`7889:196284` draws "Form settings ›" in the header only) | NONE | none (SET-17) | NEW door | door |

### 1f. ADVANCED

| # | Screen / state | Board(s) | Board | Code today | Delta | Save |
|---|---|---|---|---|---|---|
| 39 | Custom code (head · body · global CSS, Pro, ADMIN) | `4418:128108` (+ loading `4418:134698`, load-error `4418:134822`, save-error `4418:133614`, locked `4418:128808`) | EXACT | `screens/AdvancedScreen.tsx` | KEEP; global CSS via new project-settings mutation | footer |
| 40 | Security headers | `4418:128374` (+ loading `4418:129841`, load-error `4418:129942`, save-error `4418:130044`, unsaved `4418:131709`) | CHANGE (title "Headers") | `screens/HeadersScreen.tsx` | rename; ADMIN read-only state | footer |

### 1g. DANGER ZONE (OWNER, PD-3)

| # | Screen / state | Board(s) | Board | Code today | Delta | Save |
|---|---|---|---|---|---|---|
| 41 | Danger zone screen: Archive · Transfer · Delete site (owner-only; others see read-only reason) | none | NONE | delete only via ⌘K → Permissions → `DeleteSiteModal`; archive/transfer only in dashboard Sites list | NEW | immediate |
| 42 | Archive site confirm / archived state (+ Unarchive) | none | NONE | `sites.archive` / `unarchive` | NEW | immediate |
| 43 | Transfer site dialog (pick member, typed name) | none | NONE | `sites.transfer`; dashboard list menu | NEW | immediate |
| 44 | Delete site confirm → typed DELETE | `5890:44728` → `5891:44701` | CHANGE (copy must add "unpublishes <domain> now" + "restore within 30 days") | `editor/shell/modals/DeleteSiteModal.tsx` | KEEP, reuse from Danger zone | immediate |

### 1h. Workspace doors (footer group)

| # | Screen / state | Board(s) | Board | Code today | Delta | Save |
|---|---|---|---|---|---|---|
| 45 | Members ↗ / Billing ↗ summary cards (+ plan pill) | `4418:165988` / `4418:165995` | EXACT (plan pill NONE) | `WORKSPACE_LINKS` | KEEP | door |
| 46 | Integrations & webhooks ↗ | none (`4418:128657` Webhooks screen is superseded) | NONE | `webhooks` external row | MERGE door | door |

### 1i. REMOVED from the editor (boards to mark superseded, not build)

| Item | Boards | Why |
|---|---|---|
| Integrations screen + 10 states | `4418:133079`, `4418:133885`, `4418:134028`, `4418:175131`, `4418:175272`, `4418:175416`, `4418:175559`, `4418:175839`, `4418:175951`, `4418:176070`, `4418:176174` | PD-2 |
| Webhooks screen + states | `4418:128657`, `4418:131193`, `4418:131293`, `4418:131395`, `4418:131496` | A-12 (`c673f654c`) moved webhooks to dashboard |
| Export screen | `4418:127565` (already REFERENCE · superseded) | §24 REMOVE; Export stays in site menu / ⌘K |
| Form settings (provider, "Soon") | `4418:128507` | Only if Q-B1 = A (see §7); provider routing is undecided (gap matrix G3-083) |

### 1j. Dashboard

| # | Screen / state | Board | Code today | Delta | Save |
|---|---|---|---|---|---|
| 47 | Workspace settings directory regrouped: WORKSPACE (General & branding, Team) · CONNECTIONS (Apps & integrations, Domains roll-up, Workspace API tokens) · BILLING (Plan & billing, Usage & credits) · PERSONAL (Profile, Account & sign-in, Security, Notifications — "Only affects you") · DANGER ZONE | NONE (no dashboard boards in the file; DESIGN.md + Flowbite primitives govern) | `components/dashboard/shell/settings-sections.ts` | MOVE Security → Personal, Transfer → Danger; MERGE Plans→Billing, Usage+AI credits; rename API tokens | per §27 dashboard rows |
| 48 | Workspace General: remove Default language, Timezone, sharing `notify` | NONE | `components/settings/workspace-form.tsx` | REMOVE (PD-8) | explicit |
| 49 | Apps & integrations: remove GA "Tracking ID" + Marketplace GA | NONE | `components/settings/integrations-tab.tsx`, `lib/marketplace-catalog.ts` | REMOVE (PD-2) | — |
| 50 | Site tab Settings → read-only summary + "Edit in Site settings ›" (opens `/edit/:id?settings=general`) | NONE | `components/site-detail/settings-tab.tsx` | PD-1 | — |
| 51 | Site tab SEO → read-only + deep link `?settings=seo` (fixes SET-13, which links to the canvas) | NONE | `components/site-detail/seo-tab.tsx:71` | PD-1 | — |
| 52 | Site tab Domains → read-only + `?settings=domains` | NONE | `components/site-detail/domains-tab.tsx` | PD-1 | — |
| 53 | Site tab Redirects → read-only + `?settings=redirects` | NONE | `components/site-detail/redirects-tab.tsx` | PD-1 | — |
| 54 | Recently deleted (Sites list) + Restore within 30 days | NONE | none | NEW (PD-6) | immediate |

Site tabs Overview · Traffic · Submissions · Sharing stay as they are.

**Counts (54 rows: 46 editor, 8 dashboard):**
- **Board EXACT: 14** — #4, 6, 8, 15, 16, 18, 23, 24, 27, 28, 36, 37, 39, 45
- **Old board needing change: 16** — #1, 3, 5, 9, 11, 14, 19, 20, 22, 26, 32, 33, 34, 35, 40, 44
- **No board: 24** — editor 16 (#2, 7, 10, 12, 13, 17, 21, 25, 29, 30, 31, 38, 41, 42, 43, 46) + dashboard 8 (#47–54)
- Plus 17 boards to mark superseded (§1i), not build.

---

## 2. Missing boards — design needed before build

Each needs a CURRENT DESIGN board in section `4418:127312` (editor) at 1440×900 with an element of the new sidebar,
built from the nav component `4418:144988` once it is updated (#1). Sample data stays shape-only.

**M0 · Nav component update (blocks everything visual).** `4418:144988`: groups SITE (General · Languages · Brand ↗) ·
SEARCH & SHARING (SEO) · PUBLISHING (Domains · Redirects · Access) · VISITORS (Analytics · Form submissions) · ADVANCED
(Custom code · Security headers) · DANGER ZONE (Danger zone) · separator · "Managed in workspace settings ↗" (Members ·
Billing + plan pill · Integrations & webhooks). Pro pill on Custom code + Access rows when locked. Search placeholder
"Search site settings". Pane header gets the scope line under the title.

| ID | Board | What it must show |
|---|---|---|
| M1 | Scope line (on any screen) | "<Site> · all pages · applies on next publish"; Domains / Form submissions variant "Live immediately · no publish needed" |
| M2 | Read-only (role) state | Any footer screen for an EDITOR viewing an ADMIN screen: info banner "Only admins can change <screen>" + all controls disabled, no footer |
| M3 | Overview · pending deletion / archived | Banner at top of Overview naming the date the site is purged or that it is archived, with Restore / Unarchive for the owner |
| M4 | General (new) | Site name · Favicon (upload + URL, preview) · Touch icon (upload, 180×180 hint) · Author · Language row as link "English (en) · Manage in Languages ›" · collapsed "Advanced" disclosure |
| M5 | General › Advanced expanded + slug confirm | Slug field with `/^[a-z0-9]+(-[a-z0-9]+)*$/` hint, the current default URL; inline errors "taken" / "format"; confirm modal "Change the site URL? <old> → <new>. Links to the old address stop working; custom domains are not affected." Cancel / Change URL |
| M6 | Languages (renamed) | Default locale (footer field) + Locales table whose Add/Remove apply immediately (header "Saves immediately" for the table), no Auto-redirect row |
| M7 | Remove locale confirm | "Remove French? 4 of 6 pages have French translations. They are kept and come back if you add French again." (confirm the keep-vs-delete behaviour against code before drawing — Q-B6) |
| M8 | SEO (new) | Defaults card · Social profiles card — six rows: Twitter/X, Facebook, LinkedIn, Instagram, YouTube, GitHub (Q-B9) · strip "Page titles and descriptions can be overridden per page in Pages ›" · collapsed "Indexing" disclosure |
| M9 | SEO › Indexing expanded | Allow indexing switch · Canonical URL · robots.txt editable code well with "Reset to default" and the generated default shown as placeholder · warning when indexing off |
| M10 | Domains · several domains + Set primary | Two domain cards, PRIMARY badge on one, "Set as primary" on the other; confirm modal naming the new primary |
| M11 | Redirects · CSV | Header actions Import CSV / Export CSV; import dialog (file pick, format line `/from,to[,301|302]`, limit 1000 rows); result states: created N · line-N error (nothing imported) |
| M12 | Redirect deleted · Undo toast | Toast "Redirect /a → /b deleted · Undo" |
| M13 | Access | Card "Password protection" (Pro): off/on switch, password field (set / change; never shows the stored value — "A password is set"), Remove; note "Applies on next publish"; card "Share links" door "Manage share links ↗"; Pro-locked variant |
| M14 | Form submissions (if Q-B1 = B) | `7889:196284` content inside Settings, title "Form submissions", per-form row "Configure in Inspector ›" |
| M15 | Danger zone | Three rows: Archive site (hides from the Sites list, keeps the live site? — Q-B4), Transfer site (to another member), Delete site (unpublishes now, restorable 30 days); non-owner read-only variant |
| M16 | Archive confirm · Transfer dialog | Archive: typed-free confirm. Transfer: member select + typed site name; success toast |
| M17 | Delete site copy update | `5890:44728` / `5891:44701` copy: "unpublishes <domain> now" + "You can restore it from Recently deleted for 30 days" |
| M18 | Integrations & webhooks ↗ card | Same shape as Members/Billing cards `4418:165988` |
| M19 | Saved toast copy | `4418:165469` → "Saved · applies on next publish" + Publish action |

Dashboard (no boards exist anywhere; build to DESIGN.md + existing `PageHeader`/`SectionCard` primitives, owner approves
by live screenshot unless he wants boards — Q-B7): workspace directory regroup (#47), read-only site tab summary
pattern (#50–53, one pattern reused four times), Recently deleted list + Restore (#54).

---

## 3. S4 / S5 fold-in

### S4 (17 frames, Clone section `3397:32010`)

| Frames | Fate | Why |
|---|---|---|
| Forms `3397:32678` + 8 states/overlays (`33669`, `33716`, `33765`, `33812`, `33860`, `33907`, `34304`, `3445:14050`) | **Survive as "Form submissions"** — but measured against the v3 copies (`4418:130583…132141`, `7889:196284`), not the Clone | Inbox is §25 VISITORS. The v3 boards supersede the Clone ones (`sourceOfTruthFlippedAt` 2026-09-15) |
| Clone Add form `4254:76050` / Manage form `4265:26908` | **Superseded** | Form definition belongs to the Inspector (element scope, §4); Settings only links to it (SET-17) |
| Webhooks `3397:32769` + 4 states | **Superseded** | A-12 moved webhooks to dashboard Settings › Integrations; editor keeps one door |
| Integrations `3397:34499` + 2 states, Browse all `3873:25643`, Manage `3866:25629`, Connect `3856:25582` | **Superseded** | PD-2 removes the editor Integrations stub |

**Salvage from the agent worktrees** (`packages/editor/.claude/worktrees/agent-*`, read only, nothing merged):

| Worktree | Piece | Verdict |
|---|---|---|
| `agent-af79128b3150604ec` | `components/DeleteSubmissionDialog.tsx`, `screens/formsContract.ts` | Not needed: main already has the delete confirm (`FormsScreen.tsx:430`). `formsContract.ts` "FROM = first email field" rule — compare with main's FROM column and keep whichever is in main |
| `agent-af79…` | `components/FormDialog.tsx` (Add/Manage form) | **Drop** (superseded above) |
| `agent-a5913bf63e779e636` | commits `71d3b1455` (migration), `0ff2c14b9` (`forms.create/update/delete`), `2b54d490e` (`webhooks.setActive/deliveries`) | **Drop** the forms CRUD + webhooks migration for Phase B. `webhooks.deliveries` (recent-deliveries table) is a reasonable dashboard Integrations follow-up but is out of Phase B scope |
| `agent-a8f27b9905dfb9bbd`, `agent-aa49b767901abf5df` | Integrations / Webhooks screens + dialogs | **Drop** (PD-2, A-12) |

### S5 (4 frames)

| Frame | Fate |
|---|---|
| Permissions `3397:14146` | **Done on main** against v3 `4418:133026` / `5905:44701` (`PermissionsModal.tsx`). Phase B only adds a "Your role: <ROLE> · Permissions" link in the Settings sidebar foot (S5 Q1) |
| page-settings SEO `3397:38740` | **Done on main** against v3 `6887:73809` (`SeoTab.tsx`). Nothing to do |
| Branding pointer `3397:32906` | Survives as v3 `4418:128908` fallback card (row #18) |
| Export `3397:32144` | Record only — superseded |

### Proposed answers (all **needs owner confirm**)

- **S4 Q1 (form created in Settings has no block):** **B — no "Add form" in Settings.** Forms are created by placing a
  form element; Settings is the inbox + door to the Inspector. Reason: §3/§4 put form config at element scope.
- **S4 Q4 (`cleanUrls`):** **Separate ticket, not Phase B.** It changes sitemap/canonical URLs for every published site;
  it belongs to Publish, and Phase B's done-conditions do not require a publish. Flagged as risk R4 because the Redirects
  screen points at `/slug` while the deploy serves `/slug.html` — check this live before deciding (not verified here).
- **S4 Q2/Q3:** moot (webhooks/integrations left the editor).
- **S5 Q1 (where Permissions opens):** every role, from the Settings sidebar foot, reusing `PermissionsModal`.
- **S5 Q2 (page indexing select vs toggle):** moot — already built to v3 `6887:73809`.
- **S5 Q3 (Branding fallback card):** build it — one card, only in the standalone shell, and Search needs a landing.

---

## 4. Backend delta (Lane 0)

Chain: Page → tRPC → Router → Service → Prisma. Shared Zod in `packages/shared/schemas/`.

| ID | Change | Files | Migration |
|---|---|---|---|
| BE-1 | NEW `projectSettingsSchema` for JSON-only keys: `analytics` (four providers, enable + id shapes from `analytics-ids.ts`; legacy ids → warning flag, not reject), `customCode.globalCSS` (max length = head/body cap), `redirects.suggestFrom404s` boolean. `seo.twitterHandle` is dropped from JSON (merged into `socialLinks.twitter`, BE-4). Used by client screens and by `saveProjectData` | `packages/shared/schemas/project-settings.ts` (new), `server/services/sites.service.ts`, `server/services/site-settings.service.ts` | no |
| BE-2 | NEW mutation `siteDetail.projectSettings.update({ siteId, patch })` — validates `patch` with BE-1, merges per top-level key into `Site.projectSettings`, logs `site.settings.updated`. Role: EDITOR for `analytics` + `redirects`; ADMIN + Pro for `customCode.globalCSS` (same gate as head/body) | `server/trpc/routers/site-detail.ts`, `server/services/site-settings.service.ts` | no |
| BE-3 | Editor Settings Save stops calling `sites.saveProject`: column fields → `siteDetail.settings.update`, JSON fields → BE-2. Server Zod path → field error (SA-10). Composer project settings updated from the response so autosave carries no stale copy | `SettingsTab.tsx`, `BuildrikSyncProvider.ts` (client) | no |
| BE-4 | Tighten `updateSiteSettingsSchema`: `favicon` / `touchIcon` / `ogImage` / `canonicalUrl` = https URL or site path (reject `javascript:` / `data:`); `socialLinks` = record of the six network keys (Q-B9) → https URL; Twitter handle accepted and normalised to URL. Shared by editor and dashboard | `packages/shared/schemas/site-detail.ts` | no |
| BE-5 | `sites.rename` → ADMIN (PD-4) | `server/trpc/routers/sites.ts:110` | no |
| BE-6 | NEW `sites.listDeleted({})` (workspace, deletedAt within 30 d) + `sites.restore({ id })` (OWNER, same gate as delete): clears `deletedAt`, status `DRAFT`, re-activates the FormBlocks `deleteSite` deactivated (ids recorded in the existing `site.deleted` activity metadata — extend `deleteSite` to record them), share links stay revoked; activity `site.restored`. No republish | `server/services/sites.service.ts`, `server/trpc/routers/sites.ts`, `packages/shared/schemas/sites.ts` | no |
| BE-7 | Redirect CSV import: each row through `createRedirectSchema` (`redirectTargetSchema`), reject duplicates of existing `fromPath`, all-or-nothing, return `{ created }` | `server/services/redirect.service.ts` | no |
| BE-8 | Transfer: allow the workspace OWNER as well as the creator (Q-B5) | `server/services/sites.service.ts:290-298` | no |
| BE-9 | PD-2: remove GA from dashboard integrations catalog + Marketplace catalog; drop the `integrations` count from `settingsOverview` (`site-detail.service.ts:346`) | `lib/marketplace-catalog.ts`, `components/settings/integrations-tab.tsx`, `server/services/site-detail.service.ts` | no (existing rows ignored) |
| BE-10 | PD-8: remove `defaultLanguage`, `timezone`, sharing `notify` from the workspace update schema + UI | workspace settings schema/service + `workspace-form.tsx` | **optional** — column drop later, separately (recommend: no migration in Phase B) |
| BE-11 | Settings deep link: `?settings=<screenId>` opens Settings on that screen (dashboard read-only tabs link to it) | `packages/editor/src/editor/shell/hooks/useDeepLink.ts` | no |

Already present, no change: `siteDetail.settings.update` (password, slug, canonical, robots, touch icon),
`siteDetail.domains.setPrimary` (ADMIN), `redirects.export_csv`, `sites.archive/unarchive/delete`, soft-delete purge cron,
workspace-deletion processor (PD-5, Phase A).

**Net: zero required migrations.** (BE-10 column drop deferred.)

---

## 5. Work breakdown — lanes with strict file ownership

Root for every editor path below: `packages/editor/src/editor/sidebar/tabs/settings/`.

### Lane 0 · Foundation (1 build agent, runs FIRST, alone)
Owns: `packages/shared/schemas/{project-settings,site-detail,sites}.ts`, `server/**` (BE-1…10), `SettingsTab.tsx`,
`constants.ts`, `types.ts`, `shared.tsx`, `searchIndex.ts`, `hooks/**`, `components/UnsavedSettingsDialog.tsx`,
`screens/index.ts`, `screens/LockedScreen.tsx`, `screens/OverviewScreen.tsx`, removal of `screens/IntegrationsScreen.tsx`,
`engine/commands/defaultCommands.ts` (integrations command), `editor/shell/hooks/useDeepLink.ts`,
`services/BuildrikSyncProvider.ts`.
Delivers: new nav (#1) + scope line (#2) + read-only state (#7) + save model (#5, BE-3) + empty stub screens `AccessScreen.tsx`
and `DangerZoneScreen.tsx` registered in the nav, the deep link, all backend.
**Contract handed to lanes:** `SCREEN_MIN_ROLE`, `ScreenProps` additions (`saveModel: "footer" | "immediate"`,
`registerFieldErrors`), the two mutations' client helpers. After Lane 0 merges, nobody else edits the shell files.

### Lane 1 · SITE + SEARCH + ADVANCED + dashboard workspace (build agent A)
Owns: `screens/SiteSettingsScreen.tsx`, `screens/LocalizationScreen.tsx`, `components/AddLocaleDialog.tsx`,
`components/TranslationChecklistDialog.tsx`, new `components/SlugChangeDialog.tsx`, new `components/RemoveLocaleDialog.tsx`,
`screens/SeoScreen.tsx`, new `components/SocialProfilesCard.tsx`, `screens/AdvancedScreen.tsx`, `screens/HeadersScreen.tsx`,
their `__tests__`; dashboard `components/dashboard/shell/settings-sections.ts`, `components/settings/workspace-form.tsx`,
`components/settings/integrations-tab.tsx` (UI side of PD-2), `app/dashboard/settings/**`.
Rows: #11–21, #39–40, #47–49.

### Lane 2 · PUBLISHING + VISITORS + DANGER + dashboard site tabs (build agent B)
Owns: `screens/DomainsScreen.tsx`, `components/AddDomainDialog.tsx`, `components/RemoveDomainDialog.tsx`, new
`components/SetPrimaryDomainDialog.tsx`, `screens/RedirectsScreen.tsx`, `components/RedirectDialog.tsx`,
`components/RedirectRepairCard.tsx`, new `components/RedirectCsvDialog.tsx`, `screens/AccessScreen.tsx` (fills the stub),
`screens/AnalyticsScreen.tsx`, `screens/analyticsIds.ts`, `components/ConnectionVerifiedDialog.tsx`,
`screens/FormsScreen.tsx`, `screens/DangerZoneScreen.tsx` (fills the stub), new `components/{ArchiveSiteDialog,TransferSiteDialog}.tsx`,
`editor/shell/modals/DeleteSiteModal.tsx`; dashboard `components/site-detail/{settings,seo,domains,redirects}-tab.tsx`,
their `app/dashboard/sites/[id]/*/page.tsx`, the Sites list "Recently deleted" view.
Rows: #22–38, #41–46, #50–54.

Shared-file rule: a lane that needs a shell change files it as a request to the coordinator, who lands it on the
integration branch; lanes never edit Lane 0 files.

### Lane QA (1 agent, starts when the first lane screen lands)
Loop per screen (from the IA table, in lane order):
1. Live: unified editor `/edit/<site>?settings=<screen>` at 1440×900, dashboard on its own port with
   `NEXT_PUBLIC_APP_URL`/`AUTH_URL`/`NEXTAUTH_URL` overridden (memory: worktree login 403s), gstack `/browse`.
2. Board vs live screenshot side by side (cached board shot, or `get_screenshot` within the shared budget — ≤ 2/screen).
   Ignore the board's old sidebar until M0 lands.
3. Measure, don't eyeball: `getComputedStyle` on row height, control height (32px), label column (180), widths (520 wells).
4. Drive every state in the row: loading / load-error / save-error forced via request block; read-only by flipping the
   member role (one Prisma update, reverted); Pro lock by plan flip (SQL, reverted).
5. Behaviour: Save disabled while invalid; refused value names its field; toast copy; immediate actions survive reload;
   the dashboard tab shows the same value read-only.
6. Report to the owning lane: screen, board id, defect, measured value, screenshot path. Lane fixes test-first; QA re-walks.
QA owns only `docs/plans/settings-phase-b-walk/**` and `packages/editor/scripts/conformance/boards.json` rows (one writer).

### Order
1. `fix/editor-known-bugs` merged → **design** M0 + M1–M19 (owner/designer; can start now, in parallel with Lane 0).
2. **Lane 0** (backend + shell) → merge to the integration branch.
3. **Lane 1 ∥ Lane 2** (each screen starts when its board exists; screens with EXACT/CHANGE boards first, NEW ones after
   their board lands). QA follows each lane.
4. Lane 2's dashboard read-only tabs land **after** the editor screens they point to (#22, #26, #31, #11, #19) are walked,
   so the editor is the editor of record before the dashboard loses its forms.
5. Final: full suites, `verify:ds`, `gate:ds`/`gate:figma`/`gate:trpc-orphans`, one end-to-end walk, owner review.

---

## 6. Done-conditions (observed live, not claimed)

**Lane 0**
- Saving General in the editor sends **no** `sites.saveProject` request (network tab) and one `siteDetail.settings.update`; the toast reads "Saved · applies on next publish" with a Publish action.
- An analytics id of the wrong shape: Save disabled, field shows the error; forcing the request returns a Zod path the field renders.
- Nav shows the §25 groups; Integrations and Export rows are gone; ⌘K has no "integrations" command.
- `/edit/<site>?settings=domains` opens Settings on Domains.
- As an EDITOR, Security headers shows the read-only banner and no footer (role flipped in DB, reverted).
- `sites.restore` brings back a deleted throwaway site with its forms active and share links still revoked (DB + Sites list).
- `sites.rename` as EDITOR returns FORBIDDEN.

**Lane 1**
- General: upload a touch icon → the Site row's `touchIcon` changes; the dashboard Settings tab shows it.
- Slug change: confirm modal names old → new; a taken slug shows "taken" inline; after confirm `vercelProjectName` is unchanged.
- Languages: Add/Remove a locale persists without pressing Save (reload); default locale only changes after Save; no auto-redirect row.
- SEO: all six social links round-trip; a dashboard-set Instagram link survives an editor save (SA-08 regression); robots.txt edited in the editor equals `Site.robotsTxt`.
- Dashboard: directory shows the five §25 groups; workspace form has no language/timezone; Integrations has no GA card.
- Each screen walked beside its board at 1440×900 with measured row/control sizes recorded.

**Lane 2**
- Domains: Set primary on a second (seeded) domain → PRIMARY badge moves, dashboard roll-up agrees.
- Redirects: CSV with a `javascript:` target is refused with its line number and nothing imported; valid CSV creates N rows; Export downloads the same N.
- Delete redirect shows Undo; Undo restores it (reload proves it).
- Access: as PRO, set a password → `hasPublishedPassword` true, value never returned (`settings.get` response); FREE shows the lock.
- Danger zone: hidden-actions read-only for ADMIN; OWNER archives (site leaves the active list), transfers (createdBy changes), deletes (deployment taken down — real Vercel on the QA workspace, memory `qa-workspace-real-vercel`) and restores from Recently deleted.
- Dashboard site tabs Settings/SEO/Domains/Redirects render read-only values and their "Edit in Site settings ›" lands on the matching editor screen.

**QA**
- Every row in §1 has a status (walked / driven / blocked:<reason>) in `boards.json`; nothing NOT walked is counted as walked.

---

## 7. Risks and open questions for the owner

| ID | Question | Recommendation |
|---|---|---|
| Q-B1 | The newest Figma (`7889:196284`, section "Functional ownership · Forms & global AI") puts the submissions inbox in a **Forms workspace** and keeps a "Form settings" screen (`4418:128507`) in Settings — §25 puts "Form submissions" in Settings. Which? | **B: follow §25** — inbox stays in Settings as "Form submissions" (board content `7889:196284` reused inside Settings, M14); drop "Form settings" (provider routing has no backend; G3-083 undecided). |
| Q-B2 | Every v3 Settings board draws the old sidebar. Update the nav component once (M0) and accept boards whose only drift is the sidebar? | **Yes** — one component edit, not 50 board redraws. |
| Q-B3 | 19 new boards (M1–M19). Who draws them, and does build wait per screen? | Designer draws M0 + M4–M15 first; build starts per screen as its board lands; Lane 0 needs none. |
| Q-B4 | Archive: hide from Sites list only, or also take the live site down? | Hide only (today's behaviour), copy says the live site stays up. |
| Q-B5 | Transfer requires the caller to be the site creator, so a workspace OWNER who did not create the site cannot transfer it. | Allow workspace OWNER too (BE-8). |
| Q-B6 | Removing a locale: keep or delete its page translations? | Keep (re-adding restores them); confirm only when translations exist. Verify current code behaviour before M7 is drawn. |
| Q-B7 | Dashboard has no Figma boards. Build to DESIGN.md and approve by live screenshot? | Yes. |
| Q-B8 | Restore: re-activate forms deleted with the site, leave share links revoked? | Yes (share links were revoked for safety; owner re-creates). |
| Q-B9 | §25 says "5 networks", but the editor writes twitter/facebook/linkedin and the dashboard twitter/instagram/linkedin/youtube/github (`site-detail/settings-tab.tsx:9`) — six keys in use. | Support all six, so no stored link is orphaned. |
| R1 | Lane 0 rewrites the save path every screen depends on; lanes cannot start before it. | Keep Lane 0 small and land it in one merge; screens with EXACT boards first. |
| R2 | Dashboard read-only tabs remove the only edit path for slug/password/CSV until the editor screens ship. | Ordering step 4. |
| R3 | `cleanUrls` (S4 Q4): redirects to `/slug` may 404 on the deploy. Not verified. | Check one published site before Lane 2's Redirects walk; separate ticket if real. |
| R4 | Figma budget is shared (200/day). QA screenshots can eat it. | Cache board shots once per screen in `docs/plans/settings-phase-b-walk/boards/`; ≤ 2 calls per screen. |

---

## 8. What was not checked

- Live app: nothing was run. All "code today" claims are from reading `main`; no screen was walked.
- Figma: 7 read-only calls — (1) page-wide keyword inventory (truncated at 20 KB), (2) section `4418:127312` children,
  (3) boards added since the 2026-09-21 dump (`packages/editor/docs/audit-2026-09-21/dump/live-all.json`), (4) texts of
  `7889:196284`, `4418:144988`, `5905:44701` and the Settings audit section `4418:176607`, (5) texts of ten screen boards,
  (6) page list, (7) "Page 4" (empty). Board contents for state boards (loading/errors) were not opened — taken as EXACT
  on their names plus the 2026-09-11 Settings audit's completeness claim.
- No screenshot of any board was taken in this session; shots for Clone frames are cached in
  `docs/design-jobs/CLONE-SETTINGS/shots/`, v3 shots are not cached.
- Locale removal behaviour (Q-B6), `cleanUrls` (R3), whether every shell exit already uses the one unsaved dialog (#4, commits `7e3c52719`/`bf13d8d07`) — read, not run.
- Whether `sites.archive` should also unpublish (Q-B4) — no product rule found.

---

## Owner decisions (2026-10-02)

- **Missing boards (Q-B3):** build per screen as its board lands. Design starts with M0 (nav component `4418:144988`); screens that already have an exact or old board start right after Lane 0.
- **Dashboard (Q-B7):** no Figma boards — build to DESIGN.md (Flowbite, Inter, `#1A56DB`) and approve by live screenshot.
- **All remaining questions — every recommendation accepted:** Q-B1 Form submissions stays in Settings, no "Form settings"; Q-B2 fix the sidebar once in the nav component; Q-B4 Archive hides from the Sites list only, the live site stays up; Q-B5 the workspace OWNER may transfer a site as well as its creator; Q-B6 removing a locale keeps its translations, confirm only when translations exist; Q-B8 restore reactivates forms, share links stay revoked; Q-B9 support all six social keys; S4 Q1 no "Add form" in Settings; S4 Q4 `cleanUrls` is a separate ticket, verified on one published site first; S5 Q1 Permissions link for every role from the Settings sidebar foot; S5 Q2 closed (page-settings SEO already built); S5 Q3 build the Branding fallback card.

**Order:** `fix/editor-known-bugs` lands first → Lane 0 (alone) → Lanes 1 + 2 in parallel with the QA agent.

---

## Lane 0 delivered (2026-10-03, branch `feat/settings-b-lane0`)

Backend BE-1…BE-11 and the shell are built, tested and walked live (port 3220, QA workspace). Zero migrations.
Shell visuals follow the boards: M0 nav `4418:144988` (on `8134:212121`), M1 `8134:212121` / `8134:212529`, M2
`8134:212323`, M19 `8134:212718` (copy), workspace door `8139:217358`, sidebar search `6816:60270`, Overview archived
`8137:216346` (header + notice).

### Contract for Lanes 1 and 2

**Screen props (`types.ts` `ScreenProps`)**
- `registerFlushHandler(() => ProjectSettings | void)` — **changed**: the flush RETURNS the full `ProjectSettings` to
  save (`{ ...composer.getProjectSettings(), <your edits> }`) and must NOT write the composer. The shell diffs it against
  the composer and saves Site columns through `siteDetail.settings.update` and JSON-only keys through
  `siteDetail.projectSettings.update`; the composer adopts the values only after the server has them
  (`Composer.adoptSavedProjectSettings` — no dirty flag, no autosave, no `sites.saveProject`). Throw to refuse the Save.
  A changed key no mutation covers (SEO's `seo.twitterHandle` today) is handed to the composer as an edit instead, so the
  project save still carries it — Lane 1 removes that case by merging the handle into `socialLinks.twitter` (BE-4 accepts
  `@handle` and stores the x.com link).
- `registerSaveHandler` — unchanged; a handler that throws `SettingsSaveError` gets its refused fields back as `fieldErrors`.
- `saveModel: "footer" | "immediate"` — the screen's model (`SCREEN_SAVE_MODEL`).
- `readOnly: boolean` — the member is below `SCREEN_MIN_ROLE`. The shell already shows the M2 notice, disables every native
  control (a disabled `<fieldset>`), hides the header action and the save bar, and turns off the per-field
  `SiteColumnGate` hints; hide anything else that acts (links, menus). **Narrowed by the owner 2026-10-04
  (`8134:212323`):** navigation stays visible and live (an anchor escapes the disabled fieldset); writes stay visible,
  disabled. The Danger zone renders its own notice and disables per action (a creator ADMIN keeps Transfer).
- `registerFieldErrors(errors | null)` — report the screen's own invalid fields (keyed by settings path); while any are
  reported the footer's Save is disabled.
- `fieldErrors` — the fields the server refused on the last Save, keyed by `ProjectSettings` path
  (`seo.defaultOgImage`, `seo.socialLinks.instagram`, `analytics.googleAnalytics.measurementId`, `customCode.globalCss`)
  or by Site column name where there is no settings path (`slug`, `canonicalUrl`, `cspPolicy`, …). Render under the field.
  `AnalyticsScreen` is wired as the reference.

**Tables (`constants.ts`)** — `SETTINGS_NAV`, `SETTINGS_NAV_GROUPS`, `SETTINGS_NAV_GROUP_ORDER`, `SCREEN_MIN_ROLE`
(general/localization/seo/domains/access/custom-code/headers ADMIN · redirects/analytics/forms EDITOR · danger-zone OWNER),
`SCREEN_SAVE_MODEL` (domains/redirects/forms/danger-zone immediate, the rest footer), `SCREEN_SCOPE`, `scopeLine`,
`SAVE_ERROR_MESSAGES`, `WORKSPACE_LINKS`, `WORKSPACE_DOOR_COPY`, `isSettingsScreenId`, `isSettingsPaneId`.
`types.ts` `SCREEN_PLAN_REQUIREMENTS` = `{ "custom-code": "pro", access: "pro" }`; `LockedScreen` `LOCKED_COPY.access`.

**Client helpers (`services/BuildrikSyncProvider.ts`)** — `updateSiteColumns(siteId, patch)`,
`updateProjectSettings(siteId, patch)` (use it for an immediate JSON write, e.g. Redirects' 404 switch, then
`composer.adoptSavedProjectSettings({ ...composer.getProjectSettings(), redirects: result.saved.redirects })`),
`saveSiteSettings(siteId, plan)`, `planSettingsSave(before, next)`, `SettingsSaveError` (`fieldErrors`),
`SiteColumnPatch`, `getEditorWorkspaceName()`.

**Server** — `siteDetail.projectSettings.update({ siteId, patch })` (`packages/shared/schemas/project-settings.ts`:
`projectSettingsPatchSchema`, `legacyAnalyticsIds`); `sites.listDeleted()` → `{ id, name, slug, deletedAt, purgeAt }[]`;
`sites.restore({ id })` (OWNER) → `{ site, reactivatedFormBlockIds, reactivatedForms }`; `SITE_RESTORE_WINDOW_DAYS`;
`sites.rename` is ADMIN; `sites.transfer` allows the creator or the workspace OWNER (router gate still OWNER);
`siteDetail.redirects.import_csv` → `{ created }`, refusals name the line (`BAD_REQUEST` invalid row, `CONFLICT` duplicate),
nothing imported; `updateSiteSettingsSchema` takes https-or-site-path icons/OG/canonical (`""` clears) and the six
`SOCIAL_NETWORKS`; `settingsOverview` drops `integrations`, adds `access { passwordSet, shareLinks }`,
`site.archived`, `site.workspaceDeletionAt`; `settings.get` adds `workspaceName`; every tRPC Zod refusal carries
`data.zodIssues: [{ path, message }]`.

**Deep link** — `/edit/<siteId>?settings=<id>` with `id` ∈ `overview · general · localization · seo · domains ·
redirects · access · analytics · forms · custom-code · headers · danger-zone` (`useDeepLink`). Doors and removed ids open
nothing. The dashboard's "Edit in Site settings ›" links use these.

**Search anchors your screens must set** (`id` on the control, or the `Field` label slug): General `site-name`,
`favicon-url`, `touch-icon`, `site-author`, `site-slug` · Languages `default-locale`, `locales` · SEO `seo-meta-title`,
`seo-meta-description`, `seo-og`, `social-twitter|facebook|linkedin|instagram|youtube|github`, `seo-allow-indexing`,
`seo-canonical`, `seo-robots` · Domains `dom-domain`, `dom-primary`, `dom-force-https`, `dom-dns-records` · Redirects
`rd-rules`, `rd-suggest-from-404s`, `rd-import-csv`, `rd-export-csv` · Access `access-password`, `access-share-links` ·
Danger zone `danger-archive`, `danger-transfer`, `danger-delete`.

**Stubs to fill (Lane 2):** `screens/AccessScreen.tsx` (boards `8136:216089`–`8136:216758`),
`screens/DangerZoneScreen.tsx` (`8137:216600`–`8137:218168`).

**Frozen after merge (no lane edits; requests go to the coordinator):** `SettingsTab.tsx`, `constants.ts`, `types.ts`,
`shared.tsx`, `searchIndex.ts`, `icons.tsx`, `hooks/**`, `components/UnsavedSettingsDialog.tsx`, `screens/index.ts`,
`screens/LockedScreen.tsx`, `screens/OverviewScreen.tsx`, `screens/WorkspaceDoorScreen.tsx`,
`editor/shell/hooks/useDeepLink.ts`, `engine/commands/defaultCommands.ts`, `services/BuildrikSyncProvider.ts`,
`engine/Composer.ts` (`adoptSavedProjectSettings`), `packages/shared/schemas/{project-settings,site-detail,sites}.ts`,
`server/**` touched here.

### Found against the plan
- §0 "`sites.transfer` = OWNER **and** creator": the BE-8 change alone leaves a non-OWNER creator unable to transfer —
  the router's OWNER gate decides first. Kept (Danger zone is OWNER, PD-3).
- General's **Author** is persisted by no path (`saveProjectFromEditor` ignores `metadata`; load never reads it). It lives
  only in the session. Lane 1 needs a home for it (a column or a JSON-only key).
- The dashboard GA card (BE-9) and workspace language/timezone/notify (BE-10) UI were removed here, although §5 lists
  `integrations-tab.tsx` / `workspace-form.tsx` under Lane 1 — the BE rows named them. Lane 1 only walks #48/#49.
- `IntegrationsScreen` removal left `INTEGRATION_CATALOG` unread; it is deleted (`packages/shared/schemas/integrations.ts`).
  `chrome-ui/IntegrationRow` now has no product consumer (library component, kept).
- The workspace-door board (`8139:217358`) makes Members / Billing / Integrations & webhooks open an in-pane card, not a
  new tab as the plan's "↗ door" rows said.
- Overview boards `8137:216346` / `8137:216089` draw six plain group cards; the shell keeps the summary-row cards of
  `4418:128917` below the new header and archived notice. "Pending deletion" of the *site* cannot be shown: a deleted
  site does not open in the editor; the strip is drawn for the *workspace's* scheduled deletion instead.
- M19's light toast card: the copy is built; the chrome-ui `Toast` (shared by the whole editor) still renders its dark
  style at the top.
- Dev DB drift (not Lane 0): `prisma migrate status` reports `20261004130000_site_cms_edited_at` unapplied (the column
  exists) and an unknown `20260915130000_settings_s4_forms_webhooks` applied.
