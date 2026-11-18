# C5 — Interactions, Publish/Hosting, Team/Collab, Other (evidence)

Audit date 2026-10-20. Repo `main`, read-only. Every claim below comes from a source read with file:line.
Older audits were used only as leads. The 2026-10-14 docs were not used.
Tests run: `npx vitest run src/engine/export/__tests__/interactionRuntime*.test.ts src/engine/interactions/__tests__`. Result: 4 files, 90 passed, 2 todo.
No DB tests were run. No app was run, so none of this was checked live.
A finding marked "suspected" was found by reading code and was not reproduced.
Webflow behaviour is stated from general product knowledge. Where I am unsure of a claim, it is marked **[WF-unsure]**.

Severity is for a Webflow switcher: P0 = blocks switching or loses work; P1 = a gap a pro user notices quickly; P2 = polish.

---

## I01 Interactions / triggers — PARTIAL

**What exists**
- There are 14 triggers: hover, click, active (while pressed), focus, blur, page-load, page-scroll, page-leave, scroll-into-view, while-scrolling, scroll-out, mouse-over, mouse-move and mouse-out (`src/engine/interactions/types.ts:14-34`). The inspector offers the same list (`src/editor/inspector/sections/interactions/types.ts:88-109`).
- Each interaction is a single preset animation. The model is `{trigger, animation:{preset,duration,delay,easing,target,reverse,loop}}` (`types.ts:117-150`). There are 41 presets plus `custom`, which is a raw CSS property map (`types.ts:46-88`).
- In the editor, interactions run through GSAP (`src/engine/interactions/InteractionRuntime.ts:164-268`).
- **Published and exported sites do run interactions.** `ExportEngine` writes a `data-buildrik-interactions` JSON attribute (`src/engine/export/ExportEngine.ts:1204`; `src/shared/utils/html/generation.ts:107`). It injects a dependency-free WAAPI runtime whenever that attribute is present: single-page path `ExportEngine.ts:661-662`, multi-page/publish path `:987-988`. The runtime handles every trigger (`src/engine/export/interactionRuntime.ts:206`) and has keyframes for all non-custom presets (`:23-136`).
- The tests guard parity: `interactionRuntime.triggerParity.test.ts` and `presetCoverage` both pass.
- A second, separate model, "Element animation" (`src/shared/types/animations.ts`, `src/editor/animation/AnimationEditor.tsx`), writes a CSS `animation: bd-anim-*`. That model is **load-only**: its trigger row was removed (`AnimationEditor.tsx:~193`, comment "Trigger row removed 2026-05-18"). Export emits the keyframes it uses (`ExportEngine.ts:351-357`).

**Gaps vs Webflow**
- No multi-step actions per trigger. Webflow runs a sequence of actions on many targets with per-action timing. Here each trigger plays one preset on one target.
- No class-based targeting. Webflow can target "all elements with this class", children, or siblings. Here the target is `self`, `parent`, or the first match of a CSS selector (`interactionRuntime.ts:202`, `document.querySelector`).
- **No scroll-progress or mouse-position scrubbing.** In Webflow, "While page is scrolling" and "Mouse move in viewport" map a scroll or cursor percentage onto a timeline. Here `page-scroll`, `while-scrolling` and `mouse-move` restart the whole animation on every event (`interactionRuntime.ts:206`, `window.addEventListener('scroll',run)`; `InteractionRuntime.ts:213-249`). They look like scrubbing in the menu but behave as replay. P1.
- No per-breakpoint enable/disable of interactions.
- No "play once vs every time" setting. `scroll-into-view` replays on every entry because the observer is never unobserved (`interactionRuntime.ts:205`).
- Two animation systems sit side by side in one "Interactions" section (`inspector/sections/interactions/index.tsx:150-170`) with different preset and easing vocabularies (`AnimationEditor.tsx:21-63` against `types.ts`). That is confusing for users. P2.

**Suspected bugs**
1. `scroll-out` fires at page load for every element that starts below the fold. An IntersectionObserver always delivers an initial callback, and that callback has `isIntersecting:false` for off-screen elements. Export: `interactionRuntime.ts:205` (`exit?!e.isIntersecting`). Editor: `InteractionRuntime.ts:251-262`. (suspected)
2. `while-scrolling` behaves differently in the editor and on the published site. The editor only fires while the element is in the viewport (`InteractionRuntime.ts:232-249`). The published runtime treats it the same as `page-scroll` and fires on any scroll anywhere (`interactionRuntime.ts:206`, `case 'page-scroll':case 'while-scrolling'`). There are also threshold differences: scroll-out uses 0 in the editor and 0.3 in export. (suspected)
3. The published interaction runtime ignores `prefers-reduced-motion`. `sliderRuntime.ts:79` checks it; `interactionRuntime.ts` does not. This is an a11y gap. (suspected)
4. `mouse-move`, `page-scroll` and `while-scrolling` call `element.animate()` once per event (`interactionRuntime.ts:204,206`). That is a jank and performance risk on scroll-heavy pages. (suspected)

**Severity:** P1. Basic triggers ship; Webflow-grade scroll and mouse scrubbing and multi-step sequences are missing.

## I02 Timeline / keyframe editor, easing — MISSING

- There is no timeline or keyframe UI. The Timeline button was removed because it was a `console.warn` stub (`src/editor/inspector/sections/interactions/InteractionEditor.tsx:184-185`).
- The `custom` preset is a single `{}`→`customProperties` tween (`interactionRuntime.ts:203`). It cannot be used to author keyframes.
- Easing: a named dropdown built from `GSAPEngine.EASINGS` (`src/engine/animations/GSAPEngine.ts:75`). Export maps those names to cubic-beziers (`interactionRuntime.ts:140-180`). Elastic and bounce are approximated by a single bezier, which the code itself notes at `:173-174`. There is no custom bezier editor.
- Webflow has a timeline with multiple actions, keyframed transforms and filters, and custom bezier easing. P1.

## I03 GSAP usage — PARTIAL (editor-only by design)

- The `gsap@^3.14.2` dependency (`packages/editor/package.json:63`) is used only in the editor canvas: `GSAPEngine.ts`, `InteractionRuntime.ts`, and `useSelectionAnimation.ts`.
- Published pages deliberately do **not** ship GSAP. They get the WAAPI runtime instead (`interactionRuntime.ts:1-16`).
- ScrollTrigger is not used anywhere: grepping for it returns no hits.
- Webflow added GSAP-powered interactions in 2025 **[WF-unsure on exact feature surface]**.
- Consequence: what the user previews on the canvas uses GSAP easing and timelines, and the live site is a CSS approximation. Overshoot eases will differ. P2.

## I04 Lottie / Spline — PARTIAL (Lottie) / MISSING (Spline)

- Lottie is an iframe embed that only accepts `lottie.host` URLs (`src/shared/utils/embed/parseEmbedUrl.ts:154-160`; `embedFrameHTML.ts:32`; block `src/blocks/Media/Lottie.tsx:12-19`). It renders on the published site through `embedFrameHTML` (`ExportEngine.ts:450,1216`).
- Lottie has no upload of `.json` assets, no playback controls (loop, speed, direction), and no tie-in to interactions or scroll. Webflow supports uploaded Lottie files and drives them from interactions, including scroll-scrubbed playback. P2.
- Spline: no matches in `src/` at all. Missing (P2).

---

## X01 Publish flow — PARTIAL (different hosting model)

**What exists**
- The editor renders every live page with ExportEngine in the browser (`src/editor/shell/hooks/useExportHandlers.ts:94`, `exportPublishPages`). It sends them to `sites.publish` (`src/services/PublishService.ts:66-95`).
- `startPublish` (`server/services/publish.service.ts:330-567`) adds the following:
  - a single active job per site, enforced by a DB partial-unique index (`:342-369,502-524`);
  - a C-3 freshness CAS against `lastEditedAt` (`:390-397`);
  - an approval gate (`:399-473`);
  - a Vercel-connected precheck (`:485-488`);
  - CMS dynamic-page expansion (`:500`).
- The worker deploys into the **workspace's own Vercel account** (`runVercelDeploy` `:962-1037`).
- Unpublish exists (`:852`).
- Live-site password protection goes through Vercel deployment protection, and only works on Vercel Pro (`:996-1019`).
- Page selection is all-or-nothing. The only filter is page visibility: hidden and password pages are skipped (`src/engine/export/pageFiles.ts:26-29`, `ExportEngine.ts:770`). Users cannot pick individual pages to publish.

**Gaps vs Webflow**
- No staging versus production split. Every deploy is `target: "production"` (`lib/vercel.ts:149`). The `*.vercel.app` URL and the custom domain always serve the same build. Webflow can publish to the `webflow.io` staging domain only, or to selected domains. P1.
- No single-page publish. Webflow added this **[WF-unsure: plan availability]**. P2.
- The user must own and connect a Vercel account. Webflow hosts everything itself. That is a different model and a real onboarding hurdle. P1.
- Publishing is only possible from the editor. A dashboard publish without pages fails: "No page content to deploy. Open the site in the editor and publish from there." (`packages/dashboard/app/api/workers/publish/[jobId]/route.ts:103-108`).

**Suspected bug, high confidence from code reading: scheduled publish cannot succeed in production.**
- The cron calls `startPublish(s.siteId, s.createdBy)` with **no pages** (`packages/dashboard/app/api/cron/scheduled-publish/route.ts:38`). The comment there says this is intentional ("schedule stores WHEN").
- The worker then throws whenever `pages.length === 0` unless `PUBLISH_ALLOW_SIMULATION` is set (`workers/publish/[jobId]/route.ts:71-72,103-108`).
- Result: every due schedule queues a job that fails.
- No UI calls `schedulePublish`. A search of the editor and dashboard finds no callers; only the router exists (`server/trpc/routers/sites.ts:599-660`). So today this is a dormant backend, not a user-facing break.

**Severity:** P1.

## X02 Version history / backups / restore / rollback — PARTIAL

**What exists**
- Named versions ("Save version", `src/editor/panels/version-history/SaveVersionFooter.tsx:29`) are stored in IndexedDB and mirrored to the server (`src/services/versionSync.ts:57`; `SiteVersion` in `prisma/schema.prisma:1164-1183`).
- The server cap is 50 per site. It prunes auto versions only; named versions are never pruned (`server/services/site-version.service.ts:14,105-119`).
- Restore takes a safety version first (`src/engine/VersionTimelineManager.ts:282-300`). A titled backup is taken before a template is applied (`src/editor/sidebar/tabs/templates/TemplatesTab.tsx:196`).
- Publish history: the last 20 completed deploys keep their page payload (`publish.service.ts:618,631-665,782-797`). `rollbackPublish` redeploys a stored payload as a new job (`:806-821`). A diff between deploys exists (`:716`).

**Gaps vs Webflow**
- **No automatic time-based backups.** `DEFAULT_VERSION_HISTORY_CONFIG.autoCheckpointEvents: []` and `autoCheckpointInterval: 0` (`src/shared/types/versions.ts:72-85`).
- `autoCheckpointInterval` is read nowhere. It is a dead config field; a search finds only its two declarations.
- The comment at `versions.ts:76-78` says "the first checkpoint waits for a real edit", but no edit event is wired up.
- Net effect: unless the user names a version, or applies a template or a restore, no restore point exists.
- Webflow takes automatic backups continuously and on every publish. P1, and it is a work-loss risk.
- Rollback restores the **live site HTML** only. It does not restore editor state, so the designer and the live site can diverge after a rollback. Webflow restores the design state, and the user then republishes. P2.

## X03 Code export — MATCHES (mostly) / PARTIAL

- ZIP export of multi-page HTML, CSS and JS is available (`ExportEngine.downloadZip` `src/engine/export/ExportEngine.ts:1263-1327`; triggered at `useExportHandlers.ts:63-64`).
- The ZIP includes:
  - breakpoint CSS (`:348-349`);
  - used `@keyframes` (`:351-357`);
  - the interaction, slider, accordion and countdown runtimes (`src/engine/export/*Runtime.ts`);
  - a sitemap (`ExportEngine.ts:47`).
- React export is available (`ReactExporter`, `ExportEngine.ts:733-745`). Vue and Next.js are shown as "coming soon" (`src/editor/export/ExportOptions.tsx:26-29`), and Vue throws (`ExportEngine.ts:746-748`).
- I found no plan gating on export in `useExportHandlers.ts`. Webflow requires a paid plan.
- CMS dynamic pages are expanded server-side only (`publish.service.ts:500`), so the ZIP very likely omits collection pages. Webflow's export also omits CMS items and offers CSV instead. P2.

## X04 Hosting / SSL / custom domains / DNS — PARTIAL

**What exists**
- A domain is attached to the workspace's Vercel project (`server/services/domain.service.ts:~360-440`).
- DNS instructions are derived from Vercel's config (`instructionsFrom`). Without Vercel, a TXT ownership record is used (`:21-27`).
- A recheck and a `dns-verify` cron set VERIFIED and `sslStatus ACTIVE` only when Vercel reports verified and not misconfigured (`:98-210`). An `ssl-check` cron exists.
- Plan limits on custom domains: FREE 0, PRO 3, BUSINESS 20 (`lib/constants/plan-limits.ts:30,51,72`).

**Gaps**
- Hosting quality (CDN, SSL) is whatever Vercel gives the customer. There is no managed hosting. This is the same model point as X01.

**Suspected bugs**
1. `Domain.kind = "REDIRECT"` is stored (`domain.service.ts:406`) but never sent to Vercel. `addDomainToVercelProject` posts `{name: domain}` only (`lib/vercel.ts:319-337`), and `lib/vercel.ts` contains no `redirect` field. So a domain added as a "redirect" serves the site as a duplicate, and is not redirected. (suspected)
2. `forceHttps` is stored and toggled (`domain.service.ts:246,407`; `server/trpc/routers/site-detail.ts:472`) but read by nothing that enforces it. Vercel forces HTTPS anyway, so the toggle has no effect. (suspected; P2)
3. `autoRenewSsl` is never read. (P2)

**Severity:** P1.

## X05 Pre-publish audits — PARTIAL

`runPrePublishChecks` (`publish.service.ts:25-242`) checks:
- Vercel is connected (fail if not);
- the site has pages (fail if not);
- an SEO meta-title template exists (warning);
- a custom domain is set (warning);
- empty pages (warning);
- a favicon is set (warning);
- images with no file, missing alt, and links that are broken or have no destination (warnings, via the shared `packages/shared/content/contentIssues.ts:123,144,169`);
- stale CMS template bindings and empty CMS bindings;
- unbound collection lists (fail).

The editor's Issues scanner uses the same detector (`useContentIssueScanner.ts`).

**Gaps vs Webflow**
- "Broken link" here means an empty or invalid target or a missing `#page:`. External URLs are not fetched.
- The a11y check is alt text only. There is no heading order, contrast, form-label or lang check. A contrast lint exists, but only for the brand palette (`src/editor/design-system/utils/contrastLint.ts`).
- SEO checks only the site-level title template. There are no per-page meta description or OG checks.
- Webflow's Audit panel covers alt text, heading order, links and more **[WF-unsure on exact list]**.

**Severity:** P2.

---

## T01 Roles & permissions — DIFFERENT MODEL / PARTIAL

**What exists**
- Workspace roles are OWNER, ADMIN, EDITOR, DESIGNER and VIEWER, ranked linearly: VIEWER 0, EDITOR 1, DESIGNER 1, ADMIN 2, OWNER 3 (`lib/constants/enums.ts:7-16,66-72`).
- EDITOR and DESIGNER are the same permission level. The file says so outright (`enums.ts:11-13,24-35`), and both "edit and publish" (`:50-51`).
- VIEWER cannot open the editor (`:52`; `src/editor/shell/ViewerRoleNotice.tsx`).
- `SitePermission` gives per-site scoping plus a `roleOverride` (`prisma/schema.prisma:741-755`). Scoping is enforced (`server/services/permission.service.ts:46-60`).
- `sites.publish` requires EDITOR. `Workspace.editsRequireApproval` defaults to false, so on a default workspace any editor publishes straight to live (`enums.ts:28-33`).

**Gaps vs Webflow**
- No capability split between designer and content editor. Webflow's Content Editor role can edit content and CMS but not structure or styles.
- No publish permission separate from edit.
- No Commenter role. External reviewers exist only through review tokens; see T03.

**Severity:** P1 for agencies.

## T02 Branching / staging — MISSING

- No branches, no staging environment and no page branching. The schema has no branch model: none of the 60+ models match.
- Draft share links (`server/services/share-link.service.ts`, `/share/<token>`) and the review snapshot (T03) are the closest substitutes.
- Webflow offers page branching on Enterprise **[WF-unsure: tier]**. P2 for most users and P1 for teams.

## T03 Comments / review — PARTIAL (strong client loop, weak threads)

**What exists**
- Pinned canvas comments with a CSS anchor and x/y position (`Comment` `prisma/schema.prisma:498-523`). The editor has a review tab, an orphan-reattach flow, and a canvas `CommentLayer` (`src/editor/sidebar/tabs/review/ReviewTab.tsx:58-61,192-256`).
- An account-less client review flow works like this:
  - a `ReviewRequest` freezes `snapshotPages`, issues a token with 90-day expiry, and supports revoke (`schema.prisma:536-585`);
  - the `Reviewer` captures the client's identity, which must match the invited email;
  - the client comments and approves or requests changes (`server/services/client-review.service.ts:112-391`);
  - the `/review/[token]` page is at `packages/dashboard/app/review/[token]/page.tsx`.
- Approval gates publishing (`publish.service.ts:399-473`).
- Reviews sit behind the `agency_layer` workspace flag (`server/trpc/routers/reviews.ts:46-75`).

**Gaps vs Webflow**
- No threaded replies: there is no parent id on `Comment`.
- No @mentions or mention notifications.
- Comments are not tied to a breakpoint or state **[WF-unsure: Webflow comments are breakpoint-aware]**.

**Severity:** P2. The client-approval loop is arguably *ahead* of Webflow.

## T04 Simultaneous editing — DIFFERENT MODEL; real-time collab FLAGGED-OFF (planned)

**Default model (flag off), which is what production runs today**
- The whole project is saved as one snapshot, with **site-level optimistic concurrency**.
- `saveProjectData` runs a compare-and-swap on `Site.lastEditedAt` inside the transaction (`server/services/sites.service.ts:989,1052-1092`). A loser gets `SAVE_CONFLICT:<iso>`.
- The client holds autosave and opens an Overwrite / Reload dialog (`src/services/BuildrikSyncProvider.ts:191-210`; `src/editor/shell/hooks/useComposerInit.ts:676-686`).
- There are no page locks and no presence. Two people editing **different pages** still conflict, because the token covers the whole site.
- Webflow historically allowed one designer at a time, with locks. It has since added multi-designer simultaneous editing **[WF-unsure: plan/tier]**.

**Collab (`NEXT_PUBLIC_FEATURE_COLLAB`)**
- An op log stored in the DB (`server/services/collab.service.ts:4-95`). The client posts ops to `/api/collab/[siteId]/ops`, gated at EDITOR. An SSE route polls the DB every 1500 ms (`packages/dashboard/app/api/sse/collab/[siteId]/route.ts:14,76-116`). Ops are retained for 24 h.
- Editor side: OT with "remote wins" on a path conflict (`src/engine/collaboration/OTEngine.ts:273-288`). Element locks are visual only (`CollaborationManager.ts:349-373`).
- Both routes return 404 unless the flag is exactly "true" (`collab.service.ts:28-30`). The UI entry is `StudioHeader.tsx:296`.

**Suspected bug**
- The collab layer never updates the save baseline. `src/engine/collaboration/*` contains no `lastEditedAt` or baseline reference, and `useComposerInit.ts` has no collab branch.
- So with collab on, each collaborator's autosave still sends a full snapshot under the site CAS. The second writer will hit `SAVE_CONFLICT` after ops have already merged.
- CLAUDE.md's Collab row also records known divergence defects from Panel 21 §13 (used as a lead, not re-verified).
- (suspected)

**Severity:** P1. Teams coming from Webflow expect at least lock or presence semantics.

## T05 Client content-editing mode — MISSING

- There is no restricted "edit content only" mode in the editor. A search for content-mode or client-mode finds nothing, and no role is limited to content (T01).
- What exists instead: account-less clients can **comment and approve** (T03), and agencies get a handover checklist (`server/services/handover.service.ts:1-30`).
- Webflow's Editor and the newer content-editing mode in the Designer let clients edit text, images and CMS on the live site. P1 for agencies.

---

## O01 Ecommerce — STUB (unreachable)

- The blocks `ProductCard`, `ProductGrid`, `ProductDetail` and `CartButton` exist (`src/blocks/Ecommerce/*`) and are registered (`src/blocks/blockRegistry.ts:45,185`). They are **not in the Build catalog**: `src/editor/sidebar/tabs/build/catalog/catalog.ts` contains neither "product" nor "cart".
- `CollectionSetupModal` is wired into `StudioModals.tsx:204`. Its opener ref is assigned but **never called** (`src/editor/shell/hooks/useComposerInit.ts:185,193`). This is dead code.
- `StripeInjector` (a localStorage cart plus Payment Links or Checkout) is injected only from `config.stripe` (`ExportEngine.ts:653-657`), and nothing in the editor sets that field. A search for `stripe:` finds only the type declarations. The multi-page publish path (`:975-995`) never injects it at all.
- The marketplace offers an installable "Commerce" app, and a "Memberships" app (`lib/marketplace-catalog.ts:53,70`; `isInstallableApp` `:137-139`). Nothing reads either install. (suspected: the card is misleading)
- Webflow has native ecommerce (products, cart, checkout, orders, tax and shipping). This is MISSING in practice. P1 for store users and P2 overall.

## O02 Localization — MISSING (settings shell only)

- `Site.defaultLocale`, `enabledLocales` and `localeAutoRedirect` exist (`prisma/schema.prisma:377-381`), along with a Localization settings screen.
- The type comment says only the default locale ships and auto-redirect is no longer read (`src/shared/types/project.ts:309-324`).
- There is no per-locale content, no translation and no hreflang. The single `<html lang>` comes from SEO settings (`ExportEngine.ts:670`).
- A `translateCms.ts` exists under `server/trpc/routers/__internal__` and was not exercised.
- Webflow Localization (locales, translated content, subdirectories, hreflang) is missing here. P1 for international sites.

## O03 Apps / plugins / API — PARTIAL

**What exists**
- A static first-party app catalog with Install/Connect actions (`lib/marketplace-catalog.ts`). Installs are stored in `WorkspaceApp`. Head scripts are injected for analytics/pixel-type apps (`lib/marketplace-app-scripts.ts`).
- Workspace webhooks support exactly two events, `site.publish` and `form.submit` (`packages/shared/schemas/webhooks.ts:8`), signed with HMAC (`server/services/webhook.service.ts:149-202`).
- API tokens can be minted, but **"Tokens are deny-all today because no scopedProcedure consumes them"** (`server/trpc/routers/api-tokens.ts:33-35`; `scopedProcedure` defined at `server/trpc/trpc.ts:157` and used by no router). So there is no usable public API.

**Gaps vs Webflow**
- No Designer Extensions or app SDK.
- No public Data API for CMS, sites or forms.

**Severity:** P2.

## O04 Analytics — PARTIAL

- A first-party page-view beacon is injected at publish (`lib/publish-html.ts:18-25`) and received at `/api/public/track/[siteId]` (`packages/dashboard/app/api/public/track/[siteId]/route.ts`). Data goes to `AnalyticsEvent`, with aggregate and purge crons (`server/services/analytics.service.ts:54-98`).
- GA4, Meta Pixel and Google Ads IDs are injected from project settings (`src/engine/export/AnalyticsInjector.ts:24-64`; `ExportEngine.ts:646-651,980-984`).
- Webflow Analyze is comparable or ahead (it adds click maps and engagement) **[WF-unsure]**. P2.

## O05 AI — EXISTS in backend; UI de-scoped (owner decision: no AI in UI this version)

- The `server/trpc/routers/ai.ts` router has these procedures: content, page, layout, summarize, milestoneSuggest, quota, streamPrompt, componentSchema and logAdoption (`:200-484`).
- Services:
  - `ai.service.ts`: generateEditCommands and generatePlan, `:1212,1449`;
  - `ai-generation.service.ts`: onboarding site-generation jobs;
  - `alt-text.service.ts`: alt text;
  - `brand-extract.service.ts`, gated by `NEXT_PUBLIC_FEATURE_DS_AI`.
- Providers are OpenAI and Ollama.
- The editor still calls AI from `useAutoMilestone` (`src/shared/hooks/useAutoMilestone.ts`, used in `HistoryTab.tsx:152`). This should be checked against the no-AI-in-UI decision.
- `NEXT_PUBLIC_FEATURE_DS_AI` gates the brand-panel AI entry points (`src/shared/utils/featureFlags.ts:15`).

---

## Autosave & save conflicts — PARTIAL (debounced snapshot, not continuous op-level)

**What exists**
- Autosave runs on `project:changed` with a 1000 ms debounce (`src/shared/constants/config.ts:112`; `useComposerInit.ts:600-880`).
- Each autosave sends the **full project snapshot** to `saveProjectData`, which runs the site-level CAS.
- Failed saves retry with exponential backoff from 5 s to 60 s (`useComposerInit.ts:136-137,641`).
- Saves are serialized one at a time (`BuildrikSyncProvider.ts:776-777`).
- Unsaved edits are kept in localStorage for crash recovery (`src/services/unsavedRecovery.ts:96-119`), and a recovery banner compares them against the server's edit time.
- A 401 during autosave opens a blocking re-auth (`useComposerInit.ts:816-840`).
- Publish refuses to send a behind copy and raises the same conflict dialog (`PublishService.ts:79-99`; `publish.service.ts:390-397`).

**Gaps vs Webflow**
- Webflow autosaves continuously and hides conflicts behind single-designer locking. Here, any second tab or second user editing the site produces a blocking Overwrite/Reload choice. Overwrite discards the other party's work.
- Saves are whole-site snapshots, so the payload grows with site size. The code records that DOMPurify takes about 1 s per 700 rich-text elements (`sites.service.ts:1042-1047`).

**Severity:** P1.

---

## Not verified
- Nothing was run live. No publish to Vercel, no domain attach, no collab session, no scheduled-publish cron run.
- Webflow claims marked [WF-unsure] were not researched.
- The ZIP omitting CMS pages is inferred and was not run.
- `translateCms.ts`, `ai-actions.service.ts:66` (an AI-initiated publish) and the dashboard CMS client-editing surfaces were not inspected.
