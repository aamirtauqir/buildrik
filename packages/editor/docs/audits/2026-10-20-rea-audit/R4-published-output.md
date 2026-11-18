# R4 — Published / exported site (what visitors get)

REA-based reverse-engineering audit, Part 4. Date 2026-10-20.
Each claim is labelled **OBSERVED** (an REA Evidence ID or file bytes read), **INFERRED** (with the source it comes from) or **UNKNOWN**.

Code revision: worktree `~/Desktop/buildrik-worktrees/phase1-integration`, branch `feat/phase1-integration`.
- HEAD was `6dbe51b25` when the harness ran (17:31–17:34).
- The orchestrator's merge `dc72314c2` (BD-32..37) landed during the audit. `git diff --stat 6dbe51b25 dc72314c2` is **empty** for `packages/editor/src/engine/export/`, `packages/editor/src/blocks/`, `editor/shell/exportPublishPages.ts`, `lib/publish-*.ts` and the publish worker route.
- So the results hold for both revisions.

---

## 1. Method, and which path was used

### Path (a), the shipped UI export on a new site: BLOCKED

- Logging in worked: magic token → `/auth/callback` → `/dashboard`, with the `next-auth.session-token` cookie set.
- `sites.create {name:"audit1020-rea-export", method:"blank"}` returned **403 "Site limit reached. Upgrade your plan…"**. This is OBSERVED in the tRPC response.
- The qa@buildrik.local workspace already holds 3 sites: `audit1020-rea-flows`, `audit1020-webflow` and `s0-qa site`.
- Creating the site would have meant deleting another audit's site or changing the plan in the DB. Both are out of bounds, so neither was done.

### Path (b), harness (the main evidence; NOT the shipped path)

The harness is a vitest jsdom script in the scratchpad that imports the worktree source. It builds the site with the **real block registry** (`insertBlock(getBlockById(...))`, which is what the Insert panel calls) and the real engine APIs. Content:
- Navbar, heading, paragraph, button, image, flex, grid, contact form, tabs, modal, accordion, image gallery, collection list and card.
- Responsive styles via `styles.setBreakpointStyle`.
- Hover styles via `styles.setRule(sel,{…},{pseudo:":hover"})`, which is the inspector's own write path (`useStyleHandlers.ts:287`).
- A scroll-into-view interaction and a hover interaction (`element.setInteractions`).
- A CMS collection with 2 published items and 1 draft, bound to the list.
- A component with 2 instances (`createComponent` + `adoptInstances` + `instantiateComponent`).
- Two pages with SEO title and description and page head code `<meta name="google-site-verification" content="x">`.
- Site custom code: `headScripts`, `bodyScripts` and `globalCss`.
- One element was styled (base and hover) and then **deleted**.

The harness writes three outputs:
1. **ZIP**: `ExportEngine.generateZip()`, the exact call `useExportHandlers.handleExportHTML → downloadZip` makes (no site origin is passed). Output: `out-b/zip/`.
2. **Publish payload**: `exportAllPages({format:"html",minify:true,rootAbsoluteHrefs:true})` + `inlinePublishStylesheet`. This is the same as `exportPublishPages` for a site with no CMS bindings or siteId. Output: `out-b/publish/`.
3. **Simulated deploy (path b2)**: the publish worker's pure transform chain applied to (2), with the same order as `app/api/workers/publish/[jobId]/route.ts:457-490`:
   - `planFormWiring → wireSliders → wireWidgetRuntimes → buildDeployFiles`.
   - The site columns are stand-ins: no custom domain or canonical, `allowIndexing:true`, `showBadge:true` (Free plan), `appOrigin=http://localhost:3330`, and the origin derived from the Vercel project name `audit1020-rea-export`.
   - `NEXT_PUBLIC_APP_URL` was unset in the harness, so the analytics beacon was **not** injected.
   - Output: `out-b/deploy/`. **This is the closest thing to what a visitor receives.**
   - CMS dynamic template pages (`appendDynamicPagesToPublish`) need the database and were not run (see §6).

### Parity check against the real shipped path (OBSERVED)

I made a read-only tRPC `sites.publishedSnapshot` call on `audit1020-webflow`, job `cmvfso508002j135cgncehwyg`. That job was published from the real editor UI on 2026-10-19 in simulation mode, `deploymentId: sim_cmvfso50`.
- Its pages have the same structure as the harness output: `data-buildrick-id` + `buildrick-<id>` classes, one inline `<style>` of the whole-site CSS on every page (10,220 B on both pages), and the same `@media (max-width:767px)` form.
- Its interaction-runtime `<script>` has **byte-identical sha256 `69f00dc94e81…`** to the harness output.
- That ties the harness to the shipped renderer.

### REA Evidence IDs

| ID | What |
|---|---|
| `ev_48d7f35a…5575` (parent `ev_df180c6e…c323`) | `analyze_javascript_application` on `out-b/deploy/` (directory): 0 external JS files; 3 inline script bodies in index.html (lines 173, 184, 203) |
| `ev_f3d6941d…b772` | `capture_browser_scenario` deploy index @1440: screenshot, DOM, accessibility, network (4 requests, all 200), 0 console or page errors |
| `ev_28aaa6d6…0707` | deploy @1440: click Tab 2 → click Open Modal → click accordion item 2, with the accessibility tree after each step |
| `ev_58adbcba…d386` | ZIP @1440: click accordion item 2 → accessibility tree |
| `ev_f4849bb0…a83b` | deploy @375: screenshot |
| partial (cleanup timeout, no ID issued) | ZIP @1440: fill name + submit → navigated to `index.html?fullname=REA+Audit&email=&message=` (GET) |
| partial (cleanup timeout) | deploy @1440: submit → Playwright click "waiting for scheduled navigations" to the POST target (localhost:3330); a direct `curl` POST to that endpoint with the stand-in siteId returned 404 |
| partial (cleanup timeout) | deploy @1440 multi-step: only console error is `favicon.ico` 404 |

**REA limitation:** `capture_browser_scenario` has no hover or scroll action, and network capture plus per-step screenshots ran past the tool's 30 s limit. Hover, overflow and computed styles were therefore measured with a supplementary Playwright script (`live/measure.mjs` → `captures/measure.json`). That data is labelled **OBSERVED (Playwright)**.

---

## 2. Script inventory (what JS ships)

The deployed home page (49,869 B) carries no external JS files. Inline scripts are as follows (OBSERVED, file bytes):

| Script | Bytes | Source | In ZIP? | Purpose |
|---|---|---|---|---|
| interaction runtime | 7,850 | `engine/export/interactionRuntime.ts` (ExportEngine:996, only when `data-buildrick-interactions` is present) | yes | Web Animations API player. Triggers: hover, click, scroll-into-view (IntersectionObserver, threshold 0.3), page-load and others |
| form success + `_return` | 658 | `lib/publish-forms.ts` (worker) | **no** | Fills `_return=location.href` and swaps the form for a success `<p>` on `?submitted=1` |
| accordion runtime | 5,585 | `lib/publish-widgets.ts` → `accordionRuntime.ts` (worker) | **no** | Open/close with single or multiple open items |
| slider / countdown runtimes | — | `lib/publish-sliders.ts`, `publish-widgets.ts` | **no** | Not on this page |
| analytics beacon | ~600 | `lib/publish-html.ts:22` | no | INFERRED: injected in prod when `NEXT_PUBLIC_APP_URL` is set. It writes `localStorage._bk_sid` and calls `sendBeacon` to `/api/public/track/<siteId>` with no consent gate |
| **tabs runtime** | — | **does not exist** (no file in `engine/export/` or `lib/`) | — | — |
| **modal runtime** | — | **does not exist** | — | — |
| **navbar mobile-menu runtime** | — | **does not exist** | — | — |

Runtime network on load (OBSERVED, `ev_f3d6941d`):
- `index.html`
- Google Fonts CSS
- one Inter woff2
- the Unsplash image

No third-party JS loads, and there were no console errors.

---

## 3. Per-feature table — does it work on the published site?

"Deploy" means `out-b/deploy` (the simulated worker output); "ZIP" means the code export.

| Feature | Deploy | ZIP | Evidence |
|---|---|---|---|
| Responsive heading font-size (48/36/24 px) | **Works** | Works | OBSERVED (Playwright): computed 48px @1440, 36px @768, 24px @375 |
| Hover styles (button bg #1A56DB→#1E429F, heading color) | **Works** | Works | OBSERVED (Playwright): `rgb(30,66,159)` on hover; heading `rgb(26,86,219)` |
| Flex → column on mobile | Works | Works | OBSERVED `ev_f4849bb0` screenshot. Items are centred, not stretched |
| Grid → 1fr on mobile | Works | Works | OBSERVED `ev_f4849bb0` |
| Image alt | Works | Works | OBSERVED: `alt="Audit image alt text"` |
| **Tabs** | **Broken**: clicking Tab 2 does nothing | Broken | OBSERVED `ev_28aaa6d6`: accessibility sha unchanged after the click (`91b237dd…`). Playwright: panel 1 still `display:block` |
| **Modal** | **Broken**: "Open Modal" never opens | Broken | OBSERVED `ev_28aaa6d6`: no dialog enters the accessibility tree. Overlay computed `display:none` after the click. Hidden only by a static per-id rule |
| Accordion | **Works** (only one item open at a time) | **Broken**: every panel is open, so all content shows | OBSERVED `ev_28aaa6d6` (item 2 expanded, item 1 collapsed) vs `ev_58adbcba` (all 3 bodies visible, no `[expanded]`) |
| **Navbar mobile menu at 375** | **None exists**: no toggle, links overflow | same | OBSERVED `ev_f4849bb0`: "Contact" is clipped. Playwright: `document.scrollWidth 384 > 375` (9 px horizontal scroll) |
| Nav links | All `href="#"` | same | OBSERVED bytes. These are block defaults, not linked to pages |
| Scroll-into-view interaction | Registers and plays | same | OBSERVED (Playwright): `h2.getAnimations().length === 1`. The element is in view on load, so the "on scroll" effect was not separately proven |
| Hover interaction (pulse) | Wired (`mouseenter`/`mouseleave`) | same | OBSERVED bytes of the runtime. Visual pulse not measured |
| Form submit | POSTs to `${NEXT_PUBLIC_APP_URL}/api/public/forms/<siteId>/<formElementId>`, with honeypot + `_return` added | **Broken**: no `action`, so it GETs the same page and puts the field values in the URL | OBSERVED deploy bytes `<form action="http://localhost:3330/api/public/forms/…" method="POST">`. ZIP partial capture URL `?fullname=REA+Audit&email=&message=` |
| Form validation | None: no `required`, empty email accepted | same | OBSERVED: the submit went through with `email=` empty |
| Form labels ↔ inputs | Not associated (`label` has no `for`, input has no `id`) | same | OBSERVED: Playwright `labelsFor:[null,null,null]`. The accessibility tree names the inputs by placeholder only |
| CMS collection list (2 published) | Renders 2 cards, draft excluded | same | OBSERVED: "Second Post", "First Post"; "Draft Post SHOULD NOT SHIP" absent |
| CMS list item fields | The image slot and paragraph render **empty** | same | OBSERVED bytes (`<p …></p>`, empty div) |
| CMS per-item template pages | Not generated by the editor. The server generates them in `appendDynamicPagesToPublish` | **Not in ZIP** | INFERRED from `server/services/cms.service.ts:1033` (needs DB). UNKNOWN in practice for this audit |
| Component, 2 instances | Both render as plain duplicated markup | same | OBSERVED |
| Image Gallery | Stacks full-width placeholder images in one column; no grid, no lightbox | same | OBSERVED (Playwright full-page screenshot). Block HTML `blocks/Media/ImageGallery.tsx` has classes but no styles. No Lightbox element exists in the block registry |
| SEO title / description / OG / Twitter | Present per page | Present | OBSERVED bytes |
| Page head code `<meta name="google-site-verification" content="x">` | Present, once per page | Present | OBSERVED |
| Site head code (`headScripts`) and global CSS | Present on every page | Present | OBSERVED (`site-head-marker`, `.site-global-css-marker`) |
| Site **body** code with an inline `<script>` | **Silently dropped** | dropped | OBSERVED: `window.__siteBodyMarker` absent. Cause: `sanitizeHeadCode.ts:14,52` blocks any `<script>` without `src` |
| Canonical / og:url | **Absent** unless the page has an override, a typed canonical or a verified domain | absent | OBSERVED (0 canonicals). INFERRED from `publish-files.ts` `resolveSiteOrigin` |
| robots.txt | Present (`Allow: /` + Sitemap line) | **Absent** | OBSERVED |
| sitemap.xml | Present, URLs use the `.html` extension (`/about.html`) | **Absent**: `downloadZip` never passes `siteOrigin` | OBSERVED / INFERRED (`ExportEngine.ts:1267,1334`) |
| "Made with Buildrick" badge (Free) | Injected, fixed bottom-right, `font: … sans-serif` | not in ZIP | OBSERVED |
| `<html lang>` | `en` (from site language) | same | OBSERVED |
| Favicon | none: `favicon.ico` 404 | none | OBSERVED (console error in the partial capture) |

---

## 4. HTML / CSS findings (OBSERVED from bytes unless noted)

### Class naming
- Every element carries `data-buildrick-id="<id>"` and `class="buildrick-<id>"`. Block semantic classes (`tabs`, `tab-panel`, `modal-overlay`, `accordion`, `btn`, `buildrick-contact-form`, `buildrick-gallery-grid`) also ship but have **zero CSS rules** (grep count 0 for each).
- Styling is 100% per-element (69 `.buildrick-el-*` rules + 10 `[data-buildrick-id=…]` rules). There are **no shared or user classes** in the output. The 4 navbar links each get an identical copy of `{text-decoration:none;color:#333}`.
- This is the opposite of Webflow S01, where class names are shared and readable.

### Selectors are mixed
- Base styles use `.buildrick-<id>` (specificity 0,1,0).
- Breakpoint and `:hover` rules use `[data-buildrick-id="…"]` (also 0,1,0; with `:hover` it is 0,2,0).
- This follows the D10 contract (`engine/styles/ResolvedStyle.ts:1-15`).

### Media queries
- Desktop-first: `@media (max-width:1023px)` (tablet) and `@media (max-width:767px)` (mobile).
- There are no larger-than-desktop breakpoints (Webflow S03 has 1280/1440/1920).

### State selectors
- Only `:hover` is emitted.
- There are no `:focus`, `:focus-visible` or `:active` rules and no custom focus styles (Webflow S04 offers 10 states).

### CSS size and duplication
- `styles.css` is 19,384 B (ZIP, unminified). It defines 132 custom properties and uses 45, so 87 design tokens ship unused.
- In publish/deploy, the **whole-site CSS is inlined into every page** (`inlinePublishStylesheet`). The About page, which holds one `<h1>`, is 19,825 B; 18,173 B of that is CSS for the other page.
- The real snapshot shows the same: 10,220 B of identical CSS on both pages.
- There is no shared cacheable stylesheet.

### Orphan rules
- The deleted element's rules (`outline:7px dotted rgb(1,2,3)` and its `:hover`) **still ship** in `styles.css` and on both deployed pages.
- They match no element in any page (orphan detector: 1 of 70 styled ids).

### Reset and fonts
- A compact reset ships (box-sizing, margin 0, img block/max-width).
- `body{font-family:Inter, sans-serif}` comes from Google Fonts CSS2 with `display=swap` and preconnect. No `@font-face` is self-hosted.

### Images
- No `width`, `height`, `loading` or `srcset` on any of the 6 images (Playwright `imgAttrs`). This causes layout shift and no lazy loading.
- Placeholders are inline SVG data URIs.
- The ZIP did not bundle the remote Unsplash image locally (no `assets/` folder). INFERRED cause: `AssetBundler` fetch did not run in jsdom. Not verified in a real browser.
- The real snapshot shipped `<img … alt="Image">` with **no `src`** twice. Image blocks without a chosen image publish as broken images.

### Semantics and accessibility
- No `<main>`, `<header>` or `<footer>`.
- The home page has **no `<h1>`**: the Heading block defaults to `h2`.
- `<nav>` is present.
- Tabs carry `role=tablist/tab/tabpanel` and `aria-selected`, but there is no `aria-controls`, no keyboard handling and no runtime.
- The modal carries `role=dialog aria-modal`, but there is no trigger wiring, no focus trap and no Esc.
- Accordion headers are `<button>`. The worker runtime handles open/close; `aria-expanded` is observed in the accessibility tree on deploy.
- `lang="en"` is set.
- The badge font uses the generic `sans-serif`.

### CMS list markup
- The repeated cards **duplicate `data-buildrick-id`** (both items share `el-…-1ac9s2wwsoa`).
- Order is newest-first ("Second Post" before "First Post"). INFERRED: the server orders `updatedAt desc` (`cms.service.ts:1018`) and the export exposes no sort control.

### Leaked editor attributes
- `data-buildrick-interactions` carries the raw JSON on each animated element.
- `data-buildrick-type`, `data-allow-multiple` and `data-accordion-state` ship.
- `data-buildrick-id` appears 110 times on one page.

### SEO
- Title, description, og:title/description/locale/type/site_name and twitter:* are present.
- No og:image (none set), no canonical, no og:url (see §3).
- The title template only acts on `{page_title}`. A template written as `{page}` is silently ignored (`SEOInjector.ts:64`); the harness used `{page}`, so this is by design, not a defect.
- `<title>` is not indented like the other head tags (cosmetic).

---

## 5. Issues ranked

### P0
1. **Tabs do not work on any exported or published site.** No runtime exists, and clicking a tab changes nothing (`ev_28aaa6d6`).
2. **Modal never opens on the published site.** No trigger runtime exists. The content is unreachable (`ev_28aaa6d6`).
3. **Navbar has no mobile menu.** At 375 px the links overflow, the page scrolls horizontally by 9 px and the last link is clipped (`ev_f4849bb0`, Playwright scrollWidth 384).
4. **ZIP code export is a different, more broken site than Publish.** The worker post-processes pages, and the ZIP gets none of it:
   - Accordion renders with every panel open (`ev_58adbcba`).
   - Forms have no `action` and leak field values into a GET URL (partial capture).
   - No robots.txt or sitemap.

### P1
5. **Images publish without `src`** when no image was chosen (real snapshot `audit1020-webflow`). There is also no `width`/`height`/`loading`/`srcset` on any image (Webflow P04 auto-generates srcset).
6. **Form accessibility and validation:**
   - Labels are not tied to inputs.
   - There are no `required` or `type` constraints beyond `type=email`; the empty email submitted.
   - Webflow F01 has success and error states. Buildrick's success message exists only on deploy, and only after the round-trip redirect (INFERRED).
7. **Orphan CSS ships.** Styles of deleted elements stay in `styles.css` and on every page (Webflow S06 has "Clean up unused").
8. **Whole-site CSS is inlined into every published page.** This duplicates bytes per page and removes cross-page caching. The size grows with page count × site CSS.
9. **No canonical / og:url by default** when the site has only its `*.vercel.app` origin, while the sitemap does list that origin. Sitemap URLs carry `.html`.
10. **Site body custom code with inline `<script>` is silently stripped.** Typical chat-widget and analytics snippets are inline. Webflow P02/S10 allows them. INFERRED: no warning appears in the export. The editor UI was NOT TESTED.
11. **No `<h1>` by default and no landmarks** (main/header/footer). Webflow X05 audits heading order.
12. **CMS list items render empty field slots** (image and paragraph) when only the title is bound. Repeated items duplicate `data-buildrick-id`.

### P2
13. **No shared classes.** Per-element duplicated declarations; unreadable `buildrick-el-mvgo09…` names (vs Webflow S01).
14. Only `:hover` among states; no focus-visible styling (vs Webflow S04).
15. 87 unused design-token custom properties ship.
16. **Image Gallery has no layout** (stacked column) and there is **no Lightbox** element (vs Webflow E01).
17. Editor-internal attributes and raw interaction JSON are leaked into production HTML.
18. **Analytics beacon writes `localStorage` with no consent switch.** INFERRED from `lib/publish-html.ts:22`, not observed (env unset in the harness).
19. Badge font is generic `sans-serif`; no favicon by default.
20. Collection list order is fixed newest-first, with no sort or limit in the export (vs Webflow M02). INFERRED.

### Comparison to Webflow reference (W-webflow-reference.md)

| Ref | Webflow | Buildrick published output |
|---|---|---|
| X01 | staging + custom domains, single-page publish | Publish goes to the workspace's Vercel; this audit used simulation only |
| X03 | ZIP export = HTML/CSS/JS/assets; CMS lists show empty state | ZIP lacks the worker runtimes (accordion, forms) and robots/sitemap. **CMS lists ARE rendered with data**, which is better than Webflow on that point |
| X05 | a11y/SEO audit panel | none of the a11y defects above are caught by the output |
| S01 | readable shared classes | per-element id classes only |
| S03 | desktop base + up/down breakpoints | desktop base + 2 down breakpoints only |
| S04 | 10 states | `:hover` only |
| I01–I03 | GSAP plus Classic navbar/tab/slider triggers | WAAPI runtime with 13 triggers; no navbar or tab behaviour |
| F01 | storage/email/webhook, reCAPTCHA/Turnstile/honeypot, success/error | endpoint + honeypot + success message on publish only; nothing in ZIP |
| P02 | SEO/OG/custom code head + body | SEO/OG and head code OK; inline body scripts dropped |
| P04 | responsive srcset, WebP/AVIF | no srcset, no dimensions, no conversion |
| E01 | Navbar, Tabs, Lightbox, Slider all functional | Navbar and Tabs non-functional, Lightbox absent; Slider not tested |

---

## 6. NOT TESTED, and why

- **The real UI "Export code → ZIP" click and a real publish of this content:** blocked by the plan's site limit (403). Deleting another audit's site or editing the plan in the DB was out of bounds.
  - Publish was never clicked. `runVercelDeploy` deploys for real whenever the workspace has a Vercel connection, even with `PUBLISH_ALLOW_SIMULATION=true` (`publish.service.ts:1069-1075`).
  - The prior snapshots on this workspace show `sim_*` deployments, so simulation was in use. I did not rely on that.
- **CMS per-item template pages:** these are generated server-side from DB rows (`appendDynamicPagesToPublish`) and could not run in the harness.
- **Analytics beacon, workspace app scripts, real favicon/og:image/touch icon, custom-domain canonical, vercel.json redirects and headers:** they need real site columns or env. Stand-ins were used.
- **Pulse hover animation visuals, and the scroll-into-view effect for an element starting off-screen:** REA has no hover or scroll action, and the heading was already in view.
- **Slider, countdown, theme toggle, Lottie, video, password-protected pages and localized pages:** not in the requested set.
- **Form submission storage on a real site:** the stand-in siteId gives 404 (curl). End-to-end delivery is UNKNOWN.
- **ZIP asset bundling of remote images in a real browser:** the jsdom harness produced no `assets/` folder. Whether the shipped download bundles them is UNKNOWN.
- **Editor UI warnings for stripped inline body scripts:** UI not exercised.

---

## 7. Artifacts (scratchpad)

Root: `/private/tmp/claude-501/-Users-shahg-Desktop-pencil-buildrik-packages-editor/56bb4919-4be8-4b4f-9e42-32587e7a3d44/scratchpad/rea-export/`

- `harness/build.harness.ts`, `harness/zworker.harness.ts`, `harness/vitest.harness.config.ts`
- `out-b/zip/` (index 24,637 B · about 1,323 B · styles.css 19,384 B)
- `out-b/publish/`
- `out-b/deploy/` (index 49,869 B · about 19,825 B · robots.txt · sitemap.xml)
- `out-b/deploy-forms.json`
- `project.json`
- `snapshot-cmvfrjygj000e135czkn8rzm8/` (real published payload, read-only)
- `captures/` (REA screenshots, `pw-*-full.png`, `measure.json`)
- `live/` (login, list, snapshot and measure scripts)
