# Buildrik — Complete Feature List (master), 2026-06-23 · API-reconciled 2026-06-24 · editor-audit-reconciled 2026-06-28

Every feature in one place. Consolidates `feature-inventory.md` (the list) +
`feature-backend-map.md` (real status, code-grounded) + `ia-home-map-20260623.md`
(home/verdict). **Read this one.** Grouped by the 6 user-jobs, not backend modules.

> **2026-06-24 update:** independent codex sweep of the whole codebase added the
> API-level truth (every `router.procedure` → service → UI call-site). Full matrix:
> **`wiring-matrix-codex-20260624.md`**. It found ~150 procedures (most WIRED),
> **~29 ORPHAN-BACKEND** (built, no UI calls it), ~9 STUB/fake, ~12 editor-only
> (data-loss). It also corrected 2 stale rows below (dns-verify, localization).
> The API-wiring summary is appended at the end of this doc.

**Status:** ✅ WORKING · 🟡 PARTIAL (works, gap noted) · 🔵 STUB (UI exists, logic fake) ·
🔴 BROKEN · ⚪ NO-BACKEND
**Home:** DASH dashboard · ED editor rail · RIGHT inspector · TOP topbar · HIDE/CUT

---

## DASHBOARD — across sites / the business

### Job 1 — Run the business
| Feature | Status | Note |
|---|:--:|---|
| Account — profile · avatar · email · password · 2FA | ✅ | avatar = URL only (no upload backend) |
| API tokens | ✅ | `bdr_live_*`, SHA-256 |
| Workspace — settings · switch · delete | ✅ | settings update weak authz; extra-workspace create ⚪ |
| Team — list · invite · roles · revoke · remove | ✅ | resendInvite sends no email 🟡 |
| Invite accept / decline | ✅ | |
| Ownership transfer (send/accept/cancel) | ✅ | 48h token |
| Roles & permissions | ✅ | |
| Clients — CRUD + assign (agency) | ✅ | flag OFF — turn on (the wedge) |
| Notifications center | ✅ | SSE 5s |
| Integrations (Vercel OAuth) | ✅ | needs ENCRYPTION_KEY + VERCEL_OAUTH_* |
| Billing — usage · invoices · plans | ✅ | bandwidth=0 🟡 |
| Upgrade / paywall / payment method | 🔵 | throws PAYMENTS_NOT_CONFIGURED → hide CTA |
| Help / support | ✅ | feedback unthrottled |

### Job 2 — Start a site
| Feature | Status | Note |
|---|:--:|---|
| Sites — list · detail · advanced (filter/sort/bulk) | ✅ | bulk-publish = status flip 🟡; bulk move/export ⚪ |
| Dashboard home — activity feed · quick actions · health | 🟡 | feed under-fed (no log on rename/dup/delete); bandwidth fake |
| New site — blank / template | ✅ | |
| New site — AI | 🔵 | no AI branch → blank site → HIDE |
| Template gallery + preview | ✅ | seed.ts seeds none → empty gallery |
| First-run / getting-started | ✅ | |

---

## EDITOR — inside one site

### Job 3 — Build the page
| Feature | Status | Note |
|---|:--:|---|
| Canvas — add · select · resize · drag · group/ungroup | ✅ | |
| Add elements / sections | ✅ | → ED rail "Add" |
| Pages — CRUD · reorder · set-home | ✅ | → ED rail "Pages" |
| Layers tree | ✅ | → ED rail "Layers" |
| Edit-scope / scope picker | ✅ | |
| 4-mode rail | ✅ | being redesigned (left-bar worksheet) |
| Command palette (⌘⇧P) | ✅ | → TOP |
| Editor onboarding checklist | ✅ | |
| Text / heading / links / rich content | ✅ | |
| CMS — collections · records · binding · dynamic pages | ✅ | server-sync lossy 🟡; → ED rail "CMS" (progressive) |
| Media library | ✅ | → ED rail "Assets" |
| Stock photos / videos | ✅ | SHIPPED env-gated (Unsplash/Pexels via server keys); no-key prompt is dead code (reconciled 06-28, was 🔵) |
| Stock icons / fonts | ⚪ | hardcoded-local, works |
| Image editor (crop / version) | ✅ | inside Assets |
| Templates (editor tab) | ✅ | hardcoded → lives in Pages/new-page |
| My Templates / save-as | ✅ | server-backed (user-template router): localStorage cache + server mirror/hydrate, cross-device (reconciled 06-28, was 🟡) |

### Job 4 — Make it on-brand
| Feature | Status | Note |
|---|:--:|---|
| Inspector — type · spacing · layout · size · bg · effects · position · responsive | ✅ | → RIGHT (on select) |
| Design system / tokens (colors/fonts/spacing) | ✅ | → ED rail "Design" |
| Global styles | ✅ | merge into "Design" |
| DS tools | ✅ | merge into "Design" |
| Components — create · instance · variant · detach | 🟡 | masters server-backed (componentSync); F1a: style/attr overrides survive resync, but content/trait still revert 🔴, no override indicator, master-propagate unwired, no scope picker (reconciled 06-28) |
| Shared DS push (agency → clients) | ✅ | the agency wedge |
| Custom CSS / code injection | ⚠️ | NOT shipped — AllCSSSection gated `devMode===false` (hardcoded), never renders in prod; not Pro-gated (reconciled 06-28, was ✅ Pro-gated — false) |
| Interactions (7 triggers) | ✅ | click/hover/focus/blur/page-load/scroll-in/scroll-out (reconciled 06-28, was "13 triggers" — real count 7) → RIGHT/Effects tab |
| Animations (GSAP) | 🟡 | native ScrollTrigger removed |
| Localization / locales | 🟡 | editor settings WIRED (LocalizationScreen → `siteDetail.settings` `LocalizationScreen.tsx:90,133`); runtime engine still locale-unaware → HIDE the runtime feature |

### Job 5 — Get sign-off
| Feature | Status | Note |
|---|:--:|---|
| Preview / preview-as-client | ✅ | → TOP |
| Client review — request + queue | 🟡 | agency side wired; client side broken (share page just redirects); no notify |
| Comments | ✅ | client overlay missing (cross-origin) 🟡 |
| Share link + password | 🟡 | decorative — redirects to public URL, token not a real gate |
| Client approval flow | ✅ | folds into review queue |

### Job 6 — Ship & run it
| Feature | Status | Note |
|---|:--:|---|
| Publish flow + lifecycle | ✅ | → TOP hero |
| Published-site view | ✅ | |
| Custom domains — connect · verify · primary | 🟡 | code fix landed (`f51c50e6`; `dns-verify/route.ts:34-41` compares per-record expected value) — no longer 🔴; live-DNS verify still untested end-to-end |
| Published-site password | 🟡 | 402/403 swallowed on Hobby → doesn't gate |
| Per-page SEO | ✅ | → RIGHT / Settings |
| Site settings (general/SEO/social/code/security) | ✅ | 3 homes → 1 (dashboard site-detail) |
| Forms — builder + config + submissions | ✅ | form-block config no server write path 🟡 |
| Analytics (visitors/sources/devices/time-series) | 🟡 | avgSession=0; hourly→daily |
| Redirects | 🟡 | stored but never deployed → don't work live |
| Export HTML | ✅ | CUT (anti-retention) |

---

## AI — cross-cutting (lives inside jobs, not a cluster)
| Feature | Status | Note |
|---|:--:|---|
| AI assistant — chat · edit-commands · plan | ✅ | needs provider key; runtime live-unverified |
| AI propose-action (propose→confirm→execute) | ✅ | fully wired, ADMIN-gated, single-use token |
| AI SEO write-with-AI | ✅ | needs OPENAI_API_KEY (legacy path) |
| AI alt-text | ✅ | Claude Haiku, needs ANTHROPIC_API_KEY |
| AI site generation | 🔵 | → HIDE (see J2) |
| AI adoption telemetry | ✅ | no key; not user-facing |

---

## SUBSTRATE — not nav items (gates / patterns)
| Feature | Status | Note |
|---|:--:|---|
| Auth — signin · signup · verify · reset · 2FA · errors | ✅ | magic-link/verify need SMTP (silent no-op without) |
| Undo / redo | ✅ | RAM-only, lost on reload |
| Version history (named / restore) | ✅ | server-backed (site-version router): IndexedDB mirror + server upsert/hydrate, cross-device (reconciled 06-28, was IndexedDB-only 🟡) |
| Save / conflict / autosave | ✅ | 5s debounce |
| State surfaces (empty/loading/error per area) | — | patterns (#13), not destinations |

## BILLING INTERNALS (un-triggered until Checkout)
| Feature | Status | Note |
|---|:--:|---|
| Stripe webhook + handlers | ✅ | manual HMAC; idempotent |
| Dunning / downgrade cron | ✅ | 7-day grace → FREE |
| Cancel / reactivate / downgrade-reconcile | ✅ | DB-only (no Stripe call) |

---

## Counts (≈ by feature)
- **✅ WORKING** ~95 · **🟡 PARTIAL** ~20 · **🔵 STUB** ~5 · **🔴 BROKEN** ~0 (dns un-flagged) · **⚪ NO-BACKEND** ~8
- **API level (codex 06-24):** ~150 `router.procedure` · most WIRED · **~29 ORPHAN-BACKEND** · ~9 STUB · ~12 editor browser-only.
- **Total ≈ 100+ features** across 2 surfaces, 6 jobs.

## Top fixes by user impact (codex-ranked, 2026-06-24)
1. **Billing not sellable** — `billing.upgrade` throws `PAYMENTS_NOT_CONFIGURED` (`billing.service.ts:173`); payment UI disabled. Checkout absent. 🔵
2. **"Create with AI" is fake** — non-template path makes a blank site (`sites.service.ts:186-263`); dashboard still offers it. 🔵
3. **Share links don't protect** — page + password-verify both redirect to public URL (`share/[token]/page.tsx:35-42`). 🟡
4. **Editor state browser-only = data-loss** — version history, components, crash-resume in IndexedDB/localStorage (`VersionHistoryStorage.ts:19`, `ComponentStorage.ts:15`, `useComposerInit.ts:260,341`).
5. **Editor media metadata edits not synced** despite server route existing (`media.updateAsset` `media.service.ts:261` vs `MediaManager.ts:948-980` — only `folderId` mirrors).
6. **Folder rename/move APIs exist, editor doesn't use them** (`media-folder.service.ts:60,74`) → cross-device divergence.
7. **Account data export queued, not fulfilled** — writes `ExportJob` (`account.service.ts:205-206`); no processor found.
8. Published password not enforced on Hobby Vercel 🟡 · Stock photos/videos STUB → `[]` 🔵 · Redirects stored not deployed 🟡 · Collab off (6 P1 bugs) 🟡 · Email SMTP failures swallowed (silent no-send) · `resendInvite` sends no email 🟡.

## API-wiring summary (codex sweep, 2026-06-24)

Full per-procedure matrix + file:line: **`wiring-matrix-codex-20260624.md`**.

**ORPHAN-BACKEND (~29) — built, but NO button calls it. The "wire it like a job" worklist:**
`pages.get/create/update/delete/*Translation` (editor persists via `saveProject` blob, not per-page API — stranded surface, not a user bug) · `media.updateAsset` · `media.renameFolder` · `media.moveFolder` · `forms.exportSubmissions` · `siteDetail.redirects.update` · `siteDetail.redirects.export_csv` · `notifications.list` · `onboarding.completeStep` · `cms.dynamicPages` · `cms.generateDynamicPages` · `billing.plans` · `billing.usage` · `billing.switchInterval` · `billing.upgrade` (also STUB) · `help.categories` · `auth.logout` · `ai.getQuotaStatus` · `upload.limits` · `sites.unarchive` · `sites.saveProjectData` · `sites.getProjectData` · `sites.folders.delete` · `sites.folders.rename`

**STUB / fake UI (~9) — button shows, backend lies:**
billing upgrade (throws) · AI-create-site (→ blank) · stock media (`[]`) · share-link (decorative redirect) · editor runtime form-submit (in-memory `Map`) · editor media rename/alt-text (local, skips `media.updateAsset`) · editor folder rename (local) · My Templates (localStorage) · version history + component masters (IndexedDB).

**Editor browser-only (~12) — data-loss risk, never reaches server:**
local project (`buildrick-project`) · undo/redo (RAM) · version history (`aquibra-versions`) · component masters (`aquibra-components`) · CMS cache (`aquibra-cms`) · runtime form submit (RAM) · media metadata + folder rename · layers state · page-sidebar folders · DS token/preset/mode prefs · My Templates.

**Orphaned prisma models (defined, no router/service):** `PaymentMethod` · `TemplateVersion`.

**Stale-row corrections codex made vs prior docs:** `/api/asset-upload` is real+wired (`asset-upload/route.ts:1-220`) · dns-verify fixed in code (`dns-verify/route.ts:34-41`, was 🔴, now 🟡 pending live test) · localization editor-settings are wired (engine still locale-unaware).

> Source of truth: API-level → `wiring-matrix-codex-20260624.md` (codex, file:line).
> Placement → `ia-home-map-20260623.md`. Editor left-bar → `editor-left-bar-decision-worksheet.md`.
> Build sequence → `enhance-existing-features-plan-20260623.md`.
