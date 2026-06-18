# Wireframe coverage matrix — app feature parity (started 2026-06-15)

Goal: every real app feature/surface has a wireframe. Source = live inventory of editor + dashboard + server (tRPC 120+ procedures, 55 Prisma models, 60+ routes). ✅ have · 🔨 building · ⬜ gap.

## Auth (real: ~30 routes — wireframes had only 00-signin)
- ✅ sign-in (magic-link / password / 2fa stub) — 00
- 🔨 sign-up (name+password+strength) — A1
- 🔨 verify-email + check-inbox + resend — A2
- 🔨 forgot / reset / password-changed — A3
- 🔨 2FA entry + backup codes + OTP — A4
- 🔨 invite-accept (workspace) — A5
- 🔨 workspace-select (multi-ws) — A6
- 🔨 transfer-accept (ownership) — A7
- 🔨 auth error states (expired-link/invite-expired/session/2fa-locked/locked/rate-limited/access-denied/suspicious/captcha/disabled/social) — A8 (one toggle screen)
- 🔨 OAuth callback / splash / success / redirect — folded into A2/A8

## Account & personal settings (real: /dashboard/settings/*)
- 🔨 account — email change, password change/set, connected OAuth — B1
- 🔨 security — sessions list + revoke, 2FA enable/QR/backup — B2
- 🔨 notifications prefs (per-category in-app/email/digest) — B3
- 🔨 AI credits (usage + history + quota) — B4
- 🔨 danger zone — export data, delete account (30-day grace) — B5
- 🔨 profile (name/avatar/bio/lang/tz) — B6

## Team & workspace (real: /dashboard/team, /settings/workspace)
- 🔨 team management — members table, role change, suspend/remove, pending invites, activity — C1
- 🔨 invite modal (emails, role, site-scope, message) — C1 (sub)
- ✅ workspace settings + transfer + delete — 18 (extend)
- 🔨 notifications inbox (/dashboard/notifications, SSE) — C2
- 🔨 help center + article + support ticket — C3
- 🔨 integrations (Vercel OAuth + generic webhooks: GA/Mailchimp/Zapier/Slack) — C4
- 🔨 API tokens (create once / scopes / revoke) — C5

## Site management depth (real: /dashboard/sites + [id]/*)
- ✅ sites list (basic) — 11; 🔨 extend: folders, bulk-action bar, advanced filters, grid/list — D1
- 🔨 forms — form blocks list + submissions inbox + drawer + export — D2
- 🔨 redirects — list/create/import-csv/export (was only a tile in 14) — D3
- 🔨 share/access management (owner side: create link, password, expiry, revoke, viewcount) — D4
- ✅ site SEO — folded in 50/14; 🔨 dedicated per-site SEO — D5
- ✅ site detail / settings / domains / analytics / billing / dashboard-media — 12/14/15/19/16/17

## Editor depth (real engine + sidebar)
- 🔨 interactions / animation panel (triggers, timeline) — E1
- 🔨 multi-locale / translation UI (per-page locale variants) — E2
- 🔨 editor onboarding tour / coachmarks + editor-task checklist — E3
- 🔨 export (code/zip) — E4
- 🔨 collaboration presence (live cursors, avatars; demo-blocked but UI) — E5
- ✅ AI/templates/media/stock/components/history/pages/layers/add/settings/inspector(+states)/scope — 54/55/56/56b/57/58/50/51/52/53/59/59b/40/41

## Ship / public (real)
- ✅ publish / domain / paywall / live+404 / share-states — 20/22/30/90/91
- 🔨 pre-publish checks detail (framework health/content/SEO/SSL) — F1 (extend 20)
- 🔨 maintenance / terms / privacy / cookie-consent / offline / dashboard-404 — F2 (one system screen)

## Cross-cutting
- ✅ ⌘K palette / state-standard / confirm — 71/80/70
- 🔨 onboarding role-select exists (04); 🔨 dashboard onboarding checklist widget — C-onb (fold into 10)

---
Build order: A (auth) → B (account) → C (team/notif/help/integrations/tokens) → D (site depth) → E (editor depth) → F (system). Update this matrix + index.html + run link-check after each batch.

---

## CLOSED 2026-06-15 — all 🔨 shipped (25 new screens → 69 total + index)

- **A** auth: a1 signup · a2 verify-email · a3 password · a4 2fa · a5 invite · a6 workspace-select · a7 transfer-accept · a8 auth-errors(11 states). ✅
- **B** b1 account-settings (profile/login/security/notifications/AI-credits/danger — one sectioned screen covering all `/settings/*`). ✅
- **C** c1 team · c2 notifications-inbox · c3 help+ticket · c4 integrations · c5 api-tokens. ✅
- **D** d1 sites-advanced (folders/bulk/filters) · d2 forms+submissions · d3 redirects · d4 share-access (owner) · d5 SEO. ✅
- **E** e1 interactions/animation · e2 locales/translations · e3 editor-onboarding tour · e4 export · e5 collaboration (presence, demo-only honesty). ✅
- **F** f2 system pages (terms/privacy/cookie/offline/dashboard-404/error/maintenance). ✅

Wired: dashboard topbar (🔔→c2, ?→c3, avatar→b1) + Team nav; site-detail "Site tools" row → d2-d5; all in index map (stages 7-10). Integrity: no dead links, no orphans.

Deferred (genuinely not built in app / out of low-fi scope): ecommerce storefront UI (folder exists, minimal), granular per-field form-builder canvas (form *config* covered in d2 + editor Add), Stripe checkout internals (payment off-screen by design/safety).

## ADDENDUM 2026-06-15 — Design system (was missing)
The site's own DESIGN SYSTEM (`editor/design-system/` — DesignSystemTab) was uncovered. Added 3 screens:
- ✅ ds1 design-system — Tokens section: 14 token kinds (color/type/spacing/radius/shadow/motion/border/opacity/z/breakpoint/grid/sizing/icon/imagery) as accordion cards, swatch+usage+lint+alias rows, Light/Dark color-mode toggle (darkValue per token), Simple/Advanced density, token detail drill-in (value + dark + WCAG). 4 workspace tabs (Tokens/Styles/Components/Export).
- ✅ ds2 styles — 11 preset categories (button/card/form/link/badge/alert/tooltip/modal/nav/table/layout), variant tabs, BindingRow (cssProperty → kind-filtered TokenPicker). The layer between raw tokens and on-canvas elements.
- ✅ ds3 ds-tools — StarterGallery (6 themes), AI generate (tokens/schema), DS lint issues, Migration progress (v0→vN), Review&Apply (+tab-guard), Export (CSS/Tailwind/JSON/Figma).
Wired: spine rail "Design" → ds1. Index editor stage. Grounded in DesignSystemTab + token registry + presets + dark-mode trilogy + lint + starter/AI/migration modals.

## ADDENDUM 2026-06-15 — usability/dedup FIXES (the agency wedge) + reconciliation
Agency switch-ask = "good features, not user-friendly" → 3 sub-agents (live-code audits) produced 4 canonical fix screens:
- ✅ fix-boundary — editor↔dashboard: 12 dups → one home + mirror-never-404.
- ✅ fix-settings-map — 9 settings dups → 4 scopes (account/workspace/site/editor) by blast-radius.
- ✅ fix-styling-model — 5-layer overlap → ONE reach ladder (element→class→component→preset→token, narrowest wins, default-to-element, counted opt-ins).
- ✅ fix-editor-declutter — calmer Pro editor (4-verb rail + progressive inspector + density + ⌘K), zero power removed.
**Reconciliation pass:** aligned existing screens to the canonical fixes — 41 added Preset as 5th rung (4→5) + canonical link; ds2/57 reworded to "rung N of the one ladder"; d5/b1/c4 settings-scope labels (site-default home, AI-credits=workspace read-only mirror, analytics split); 53/14/59/spine cross-link the fix screens as canonical. Structural rebuilds of spine-rail (4-verb) + inspector (3-group) are SPEC'd by fix-editor-declutter for the rebuild phase, not re-drawn here. Integrity: zero dead links, zero orphans, zero href="#".

## ADDENDUM 2026-06-18 — SCOPE-COMPLETENESS LAYER (codex CEO/real-app review)
Codex scope-review verdict: the set was flow-/coherence-10/10 but **real-app-scope 6.5/10** — a state *philosophy* existed (80-states, m-states) but most feature screens were **happy-path only**. Fix = render every surface's empty/loading/error/failure/denied state. 6 new S-* state boards (mirror the m-states board pattern) + 2 inline extends:
- ✅ **s-editor-states** — blank canvas / first-block / deleted-last-block · ✨AI generating/partial-salvage/failed/apply-conflict · image upload type/size/quota/processing fail · paste(sanitized) · keyboard map · undo session-boundary · small-screen/touch. (P0+P2)
- ✅ **s-media-states** — empty / loading skeleton / no-results · upload unsupported/too-large/processing/quota · bulk partial · stock provider down · delete-in-use blast-radius. (P0)
- ✅ **s-forms-states** — owner: inbox empty / routing-broken (stored-before-emailed) / export-failed · visitor: submit success / inline validation / spam-held / server-error (values kept). (P0)
- ✅ **s-dashboard-states** — solo zero-sites home (re-homed from archived 13-first-run) · agency zero-clients · loading skeleton · failed-to-load · search no-results · scale/search/paginate at 38 clients. (P0)
- ✅ **s-ship-states** — blocking pre-flight (errors block, warnings don't) · cancel-before-go-live · deploy-failed (old site stays live) · DNS-stuck→human escalation · restore-failed (no-op) · approve-then-publish-fail (stays approved) · approval queue empty. (P0+P2)
- ✅ **s-account-states** — permission-denied page · last-admin guard · self-demotion confirm · pending-invite resend/revoke/expired · seat-limit · integration token-expired→reconnect · card-failed→grace→auto-downgrade. (P1)
- ✅ **a8-auth-errors** extended 11→14: email-already-exists · invite-to-existing-account · wrong-credential (inline, anti-enumeration).
- ✅ **d5-seo** extended: sitemap-submit-fail · robots-invalid · canonical-conflict · live-but-no-index.

Wired: each board ← proto-nav of its source screens (m-editor, 56/17/56b, d2/53, m3/11/m-agency, 20/22/58/m-approval/73, c1/c4/16/m-roles/m-tracking/19) + index stage 3 "Behavior & state coverage" + cross-link each other. Integrity: zero dead links, zero orphans, 103 html screens.

**Codex CEO/real-app verification (3 passes):** 6.5 → 8.8 → **10/10**.
- Pass 1 (scope): real-app-scope 6.5/10 — state philosophy existed, feature screens happy-path only. P0/P1 gap list produced.
- Pass 2 (after 6 boards + 2 extends): 8.8/10. All P0 closed. 4 items named for 10: (a) 13-first-run still promoted as active → archived to ⊘ (one canonical zero-state home = M3 + s-dashboard-states); (b) inline auth error on the real screen + 11/14 count drift → 00-signin s_err inline wrong-credential state (anti-enumeration, email kept) + index card "Auth errors (14)" + a8 topnote reworded; (c) loading/error/denied not instantiated on 4 ops surfaces → "States on this surface" strip on 12/14/19/53; (d) delete-in-use must review-before-delete → s-media delete locked until blast-radius reviewed, then type-to-confirm.
- Pass 3 (after the 4 fixes): 9.8/10, sole remaining nit = s_err email placeholder mismatch (jane vs you) contradicting "email kept" → fixed (both you@company.com). → **real-app-scope 10/10.**

