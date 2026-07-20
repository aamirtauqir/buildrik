# Buildrick Editor — Complete State (every job · every feature · works / broken)

> The honest full inventory. Every feature the editor forms, organized by the 6 agency jobs, each marked: what's **implemented & works**, what's **broken/incomplete**, what's **dead**. Grounded in the verified deep-audit (`docs/audits/2026-07-08-editor-deep-audit.md`, ~55 defects live-traced), PRD Ch.12 catalog (~120 features), and the 40-fix + 7-decision pass (2026-07-17).
>
> Status legend: **✅ works** (implemented, verified) · **🟢 fixed this arc** · **🟡 partial** (half-built / saved-not-live) · **🔴 broken** (traced defect) · **🔵 stub** (fake/simulated) · **👻 dead** (orphan, never mounted) · **🔒 gated** (flag-off, intentional).

## One-glance scoreboard (end-to-end, does the whole JOB work)

| Job | Health | One line |
|---|---|---|
| J1 · Discover & onboard | 🟡 5/10 | checklist works · first-run "aha" dead · AI-wizard fake |
| J2 · AI-draft a site | 🔴 4/10 | edit-AI real · **whole-site draft is a stub (blank)** |
| J3 · Build the page | 🟢 9/10 | **the one complete job** — protect it |
| J4 · Make it on-brand | 🟡 6/10 | DS strong · **reset-to-master lies · cross-site push absent** |
| J5 · Get client sign-off | 🔴 3/10 | **THE WEDGE, worst** — client has no screen, gate gameable |
| J6 · Ship & run | 🟡 7/10 | publish works · **redirects/headers/forms saved-not-live · fake publish steps** |

**Verdict:** only **J3 works end-to-end.** The 3 headline promises are broken — J2 whole-site AI, J5 sign-off UI, J4 brand-push. Bug-fixing is done (40 fixed); the next real work is *completing jobs*, led by J5.

---

## J1 · Discover & onboard — 🟡 5/10

**✅ Works:**
- Boot / project load / returning-open (last-edited restore) — solid.
- Onboarding checklist, 7 steps (`⚪` localStorage-persist).
- Achievement prompts.
- New-page: blank + template paths real.

**🔴 Broken / dead:**
- **PageWizard "AI" is simulated** — inputs discarded, fake delays (`wizard/PageWizard.tsx:53-135`). 🔵 stub. Marked `@deprecated SIMULATED` (D7).
- **WelcomeModal — 👻 orphan** (never mounted). No first-run intro.
- **SpotlightOverlay (coach-marks) — 👻 orphan** (dead). The "aha" that teaches the UI doesn't exist.

**Call:** build a real minimal first-run (highlight the 6 rail icons once); kill or wire PageWizard.

---

## J2 · AI-draft a site — 🔴 4/10

**✅ / 🟢 Works:**
- **AITab (edit-AI)** — real streaming chat/agent, model picker, scope. 🟢 hardened this arc: 30s timeout wired, rate-limiter burst-bypass fixed, retry no-double-count.
- AI consolidated to ONE surface (D2) — removed AIAssistantBar + AICopilot + AIAssistant (−2357 LOC); ✨topbar / ⌘J / ⌘K all route to AITab.

**🔴 Broken / stub:**
- **Whole-site "prompt → site" is a STUB** — no AI branch, returns a blank site (§13-A7). 🔵 The headline promise doesn't run.
- **Image generation fake** — picsum placeholder (`openai.ts:150`), not real gen.

**Call:** build real whole-site gen **or** cut the promise from onboarding/marketing (decide before Phase 4).

---

## J3 · Build the page — 🟢 9/10 (the strength — PROTECT)

**✅ Works (the complete job):**
- **Canvas** — drag/select/resize/inline-edit, 48 element types, nesting rules, zoom 25-200%.
- **Insert** — 63-block registry / 7 categories (the rail's build catalog shows a divergent 53 — defect N2), search, drag+click.
- **Blocks** — 63 registry.
- **Templates** — apply/preview/My-Templates (server mirror).
- **Components** — catalog 27 (8 atoms/11 molecules/8 organisms) + user, create-from-selection, variants, detach (MAX 100).
- **Media library** — folders, stock (Unsplash/Pexels/Pixabay), image-editor (crop/6-filters/resize/versions), optimize (WebP/AVIF), alt-text + AI, icons (Lucide 370, 17 categories), replace-across.
- **Pages** — CRUD, dup, delete+undo, set-home, copy-link, bulk, folders, SEO-table.
- **Layers** — tree, search, reorder, hide/lock, group, 11 context-actions.
- **Inspector** — Look/Layout/Effects, 18 sections, 7 profiles, per-breakpoint + pseudo-state overrides, reach-strip, token-binding chips.
- **Interactions** — 14 triggers × 39 presets (real).
- **Animation** — 25 presets (12 entrance / 8 attention / 5 exit) + 7 easings.
- **CMS/repeaters** — collections, entries, bindings, repeaters.
- Undo/redo, keyboard shortcuts, preview/device/color-mode.

**🟢 Hardened this arc (was broken, now fixed):**
- StyleEngine: breakpoint-mirror to correct field · 2nd-breakpoint clobber · `getRulesForSelector` `.btn`↔`.btn-primary` collision · `optimizeCSS` corruption.
- `moveElement` parent-cycle guard (was infinite-loop hazard) · `syncInstance` subtree leak · ComponentStorage rejected-promise retry.
- Media 1GB quota **now enforced** (was never thrown).
- Repeaters: `escapeHtml` real · `$&`-injection · nested expansion.
- Inspector: duplicate `title` field de-duped · `aria-*` pass-through.

**🔴 Still-broken / gaps (mostly minor, don't block the job):**
- **Editor preview ≠ published for interactions** — `InteractionRuntime.reverseAnimation()` no-op stub; hover/focus-exit never reverses in-editor (exported runtime does) (`InteractionRuntime.ts:304-310`). B9.
- **Command palette bypasses CommandCenter** — hardcoded list, ignores 39 registered commands; `export-html`/`export-json` registered but unreachable (`CommandPalette.tsx:46-138`). B8.
- **Two command palettes** — shell ⌘K + canvas ⌘⇧P (fragmented). + `?` opens two help surfaces at once (B5).
- **Attribute/link edits = one transaction per keystroke** → undo spam (style path debounces; these don't) (`elementProperties/index.tsx:198-288`). B15.
- **Inspector perf inert** — zero `React.memo`; every section re-renders per keystroke (B14). Over-dense (6→2 target open).
- **Memory leaks** — ColorMode MQL listener never removed; InteractionRuntime `page-scroll`/`page-leave` cleanup targets wrong node (B10).
- **CMS front-door missing** — per-record publish/unpublish and dynamic-page-per-entry **both exist** (CMSRecordsModal / CMSCollectionSetupModal); the gap is only a discoverable in-rail entry point.
- **4 ecommerce blocks are reachable** (surface under "Advanced" via CATEGORY_REMAP) — the earlier "excluded/unreachable" claim was wrong; only `contact-form` is a true orphan.
- **Templates = 3 surfaces** (sidebar 10 + modal 15 + section 11) — clutter.
- Media: From-URL modal stub vs working LibraryManager (two UIs) · Trash stub · misleading "This device only" pill · 50MB-vs-"10MB" copy mismatch.
- MediaLibraryPanel upload failure = unhandled rejection, no feedback (B11).
- Animation: Timeline/ScrollTrigger are L0 stubs (triggers removed, engine ignored them).
- AllCSS raw editor — 👻 devMode-dead.
- ColorInput alpha — 🔵 stub (0/100 only). *Deferred (scope).*

---

## J4 · Make it on-brand — 🟡 6/10

**✅ / 🟢 Works:**
- Design system — 14 token kinds (persistAll now 14/14 🟢), tokens/styles/components/export.
- 18 style presets / 11 categories · 6 starters · DS lint (no-black/banned-hue/alias-depth).
- Import/export (CSS/JSON/Tailwind).
- 🟢 Fixed: undo dirty-guard (was silent-wipe B1) · color id-based diff/discard (was index-based B13) · Discard reverts presets · import carries darkValue.

**🔴 Broken / absent:**
- **Component "reset to master" STILL lies** — path-scheme mismatch: `ComponentInstance.ts:72` parses `#/…` but `:177-179` builds `/elements/…`; reset / is-overridden don't actually work (§13-A2). **Not fixed** (earlier "trust-lie fixed" claim was wrong).
- **Cross-site brand push ABSENT** — link-out only; backend `theme.*` schemas exist, **no in-editor UI** (diff → blast-radius → rollback). The agency-scale wedge.
- Preset-binding picker click = no-op (v1).
- Figma export = 🔵 stub envelope.

**Call:** fix the override path-scheme (real trust-lie); build the brand-push flow (2nd wedge).

---

## J5 · Get client sign-off — 🔴 3/10 (THE WEDGE — worst, build first)

**✅ / 🟢 Works (partial):**
- Approval gate **now enforced server-side** (D1) — flag-on, non-OWNER blocked unless latest ReviewRequest APPROVED. 315/315 server tests green.
- Versions/history (Changes + Saves + Time-Travel + AI-summary), cap 50.
- **Comments backend is internal-only** (`protectedProcedure`, workspace-member-scoped) — an account-less client can neither comment nor approve.

**🔴 Broken / absent (the wedge is hollow):**
- **The external client/approver has NO screen.** Zero review UI. The single biggest missing persona.
- **Comments have zero editor UI** — full server surface, nothing rendered (§13-A4).
- **Approval gate gameable** — edits after approval aren't invalidated (client approves → agency edits → publishes unseen). Gate = theater without change-since-approval tracking.
- **Approval-gate rollout unsafe** — flips every ADMIN to blocked on deploy, no flag/comms yet (⚠ prod behavior change).
- Approval error = raw `PRECONDITION_FAILED`, not a "needs approval → who → link" UX.
- Share link decorative (no real token gate).
- Publish dropdown `in-review`/`approved` states = dead wiring (shell passes only draft|published) (B18).
- `siteId`-from-URL parsed by two impls (ReviewService vs BuildrikSyncProvider) (B19).

**Call:** this is Phase-1 build. Screens spec'd → `2026-07-18-j5-signoff-wireframes.md` (6 screens, all states). Client review page = dedicated desktop surface (L2).

---

## J6 · Ship & run — 🟡 7/10

**✅ / 🟢 Works:**
- **Publish pipeline** — Vercel BYO-OAuth, job states, poll. 🟢 hardened: export-format honored, ReactExporter dup-names, AssetBundler errors, SEOInjector valid slugs, sanitizeHeadCode, media quota.
- Export modal (HTML/ZIP/React).
- Settings: General · SEO · Analytics (GA4/Pixel/consent, injected at publish) · Custom-code (sanitized) · Forms inbox (filter/CSV/mark).
- 🟢 Fixed: PublishTab reads real pages API (was always-green B2) · renders all 7 pre-publish checks · SEO limits/labels honest · bulk-delete-all spares home (B3) · redirect toUrl validated (B12) · "Go to page" wired (B4).

**🟡 Partial / 🔴 broken:**
- **Redirects / Headers / Localization saved-but-NOT-enforced** on live sites (§13b B8). Trust-eroder.
- **Publish worker fakes steps** — "Optimizing images" / "Performance check" shown ✓ but no-op; `lighthouseScore` always null (§13b A20).
- **Forms in-memory** in editor preview (published uses real POST endpoint).
- **Custom-domain e2e untested** (DNS-verify path).
- Vue/Next export = 🔵 coming-soon stubs.
- Localization: engine locale-unaware.
- SEO score labels → should show live earned points (partial).

**Call:** enforce or clearly beta-label the saved-not-live settings; make publish steps real or remove the fake ✓.

---

## Cross-cutting (no job home)

**Chrome (topbar/footer) ✅:** undo/redo, save-pill (4 variants + offline), device switch, preview ⌘P, color-mode, footer (structure ⌗ · zoom · sync · breadcrumb · issues-pill), full keyboard map.
- 🔴 Static "Connected · main" sync label (fake) · zoom logic ×3 + ZoomControls.tsx orphan (B20) · dead `FEATURES` flag map gates nothing (B17).

**Engine ✅ (the solid core):** Composer + ~30 managers, ~293 events, 48 element types, history/transactions/storage/sanitize-SSOT, export injectors.
- 🔴 Breakpoint constants disagree (1023/767 vs 991/575) · nesting cap 50 vs 30 · dead event constants + dead listeners (B6/B7) · P1-2 autosave↔manual save-race mutex (verify).

**👻 Dead / 🔒 gated (cut or gate):**
- Collaboration — 🔴 demo-only, 6 P1 non-convergence (remote-wins clobbers edits), MOCK_USERS fakes presence. **Bet D3: invest real OT/CRDT (Yjs) or cut.**
- ConnectionQualityIndicator 👻 · TemplateManager 👻 deprecated · plugin-manager 🔒 · engine/history 👻 unimplemented · engine/integrations 🔵 · EmailService cloud providers 🔵 (XSS escape done, providers throw).
- Integrations settings — 🔵 6 Coming-Soon cards (doc-links only).
- Branding settings screen — 🔵 nav-map only (no fields).

---

## Count summary

| Bucket | ~Count | Examples |
|---|---|---|
| ✅ Implemented & working | ~85 features | all of J3, DS core, publish core, media, pages, layers, inspector, interactions |
| 🟢 Fixed this arc | 40 bugs | StyleEngine, sync-retry, quota, repeaters, PublishTab, redirects, DS registry |
| 🟡 Partial / saved-not-live | ~12 | redirects/headers/localization, forms, custom-domain, brand-push, comments-backend |
| 🔴 Broken (traced defect) | ~15 open | reset-to-master, whole-site AI, client-review-UI, reverseAnimation, command-palette, memory leaks, gate-gameable |
| 🔵 Stub / fake | ~8 | PageWizard, image-gen, Figma-export, Vue/Next, ColorInput-alpha, Integrations cards, Branding, EmailService |
| 👻 Dead / orphan | ~8 | WelcomeModal, SpotlightOverlay, ZoomControls, ConnectionQualityIndicator, TemplateManager, engine/history, AllCSS, FilterChips |

**The through-line:** the editor is **module-healthy but job-incomplete.** J3 (build) is genuinely strong. Everything that makes it an *agency* product — draft (J2), brand-at-scale (J4), sign-off (J5) — is stubbed, absent, or hollow. Fix order = complete J5 wedge first, then J4 push, then J2/J6 honesty pass. Full plan: `2026-07-17-editor-product-redesign-complete.md` §8.
