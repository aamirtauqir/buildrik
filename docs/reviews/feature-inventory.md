# Buildrik — Complete Feature List

Compiled from the 9 PRD modules (`packages/editor/docs/prd/Module1..Module9`) +
the 108-screen hi-fi prototype (`docs/reviews/prototype/`). Every bullet is a
wireframe-able feature/screen. Screen codes map to prototype filenames.

> Two-accent system: editor = cobalt `#2D6DFF`, dashboard = red (per `data-surface`).

---

## 1. Auth & Account
- Sign in (email/password) — `00-signin`
- Sign up — `a1-signup`
- Email verification — `a2-verify-email`
- Password reset / change — `a3-password`
- 2FA (two-factor) — `a4-2fa`
- Auth error states — `a8-auth-errors`
- Account settings (profile, avatar, email change) — `b1-account-settings`
- API tokens — `c5-api-tokens`

## 2. Workspace & Team (Agency layer)
- Workspace select / switch — `a6-workspace-select`
- Workspace settings + delete — `18-workspace`
- Team members (invite, roles, remove) — `c1-team`
- Invite flow (send) — `a5-invite`
- Invite accept — `a9-invite-accept`
- Ownership transfer (send + accept) — `a7-transfer-accept`, `m-ownership`
- Roles & permissions — `m-roles`, `62-permissions`
- Notifications center — `c2-notifications`
- Agency multi-client view — `m-agency`
- Client approval flow — `m-approval`
- Shared design-system push (agency → clients) — `m-ds-push`

## 3. Dashboard & Site Management
- Dashboard home (activity feed, quick actions) — `10-dashboard`, `m3-dashboard`
- Sites list — `11-sites`
- Sites advanced (filter / sort / bulk actions) — `d1-sites-advanced`
- Site detail — `12-site-detail`
- New site (blank / template / AI) — `01-new-site`
- First-run / getting-started — `13-first-run`, `m4-journey`

## 4. Core Editor — Canvas
- Canvas (drag/drop, select, resize, multi-select)
- Add elements / sections panel — `52-add`
- Pages manager + page ops — `50-pages`, `50b-page-ops`
- Layers tree — `51-layers`
- Edit scope / scope picker — `40-edit-scope`, `41-scope-picker`
- 4-mode editor (build / AI / design / settings) — `fix-editor-4mode`
- Command palette (Cmd+Shift+P) — `71-command-palette`
- Editor onboarding checklist — `e3-editor-onboarding`
- Editor states (loading / empty / error) — `s-editor-states`, `80-states`
- Declutter / IA fixes — `fix-editor-declutter`, `fix-boundary`

## 5. Inspector (Styling)
- Inspector (element properties) — `59-inspector`
- Inspector states (multi-select, empty) — `59b-inspector-states`
- Styling reach / model — `fix-styling-model`, `fix-styling-3reach`
- Controls: typography, spacing, layout, size, background, effects, position

## 6. Components & Design System
- Components (create, save-as, instances, rehydrate) — `57-components`
- Design system (tokens: color / spacing / type / radius / shadow) — `ds1-design-system`
- Styles (global colors / fonts / spacing) — `ds2-styles`
- DS tools — `ds3-ds-tools`

## 7. Content System
- Text / heading editing (H1–H6), links, rich content
- Interactions / animations — `e1-interactions`
- Localization / locales — `e2-locales`

## 8. CMS
- Collections + records management — `e6-cms`
- Field-driven add / edit / delete records
- Binding (element → CMS field / specific record)
- Dynamic pages from collections

## 9. Media
- Media library — `17-media`, `56-media`
- Media states — `s-media-states`
- Stock photos / videos / icons / fonts (searchable) — `56b-stock`
- Image editor (crop, version) — `56c-image-editor`

## 10. AI Features
- AI site generation wizard — `02-ai-wizard`
- AI assistant in editor — `54-ai`
- AI SEO assist (write-with-AI title)
- AI propose-action (privileged, confirm-gated)

## 11. Templates
- Template gallery — `03-template-gallery`
- Template preview — `03b-template-preview`
- Editor templates tab — `55-templates`
- Save as custom template ("My Templates")

## 12. Publishing & Domains
- Publish flow + lifecycle states — `20-publish`, `73-lifecycle`, `s-ship-states`
- Preview — `21-preview`
- Published site view — `90-published`
- Custom domains (connect, verify, set primary) — `15-domains`, `d6-domains`, `22-domain-pending`
- Share link + password access — `91-share`, `d4-share-access`
- Export (HTML) — `e4-export`
- Redirects — `d3-redirects`
- SEO settings (per-page meta, slug, status) — `d5-seo`, `m-seo`

## 13. History & Versioning
- Undo / redo
- Version history (named versions, restore) — `58-history`
- Save states / conflict resolution — `60-save-states`, `61-conflict`

## 14. Collaboration
- Real-time collab (presence, multi-cursor) — `e5-collab`, `m-states`
- Comments — `m-comments`
- Collaboration conflict / reconnect states

## 15. Analytics & Forms
- Site analytics (visitors, sources, devices, time-series, granularity) — `19-analytics`, `m-tracking`
- Forms builder + config — `d2-forms`, `forms-config`, `s-forms-states`
- Form submissions

## 16. Settings (hub)
- Settings home — `b0-settings-home`, `fix-settings-map`
- Site settings — `14-site-settings`, `53-settings`
- Integrations (Vercel OAuth, team) — `c4-integrations`, `c4b-vercel-team`
- Help / support — `c3-help`

## 17. Billing & Plans
- Billing (payment method, plan) — `16-billing`
- Paywall / upgrade — `30-paywall`
- Pricing tiers (Free / Pro / Business)

---

## Backbone / meta screens (not features — IA + state maps)
- `m0-spine`, `m0b-spec`, `editor-spine-wireframe` — backbone / object-tree maps
- `f2-system`, `fix-*` — redesign / IA fix mocks
- `s-*-states` — state coverage per area (account, dashboard, editor, forms, media, ship)
- `70-confirm`, `60-save-states` — shared confirm / save patterns

---

### PRD module → feature-area map
| Module | Area | Sections above |
|--------|------|----------------|
| Module 1 | Core Editor + Inspector | 4, 5 |
| Module 2 | Content System | 7 |
| Module 3 | Components & Styling | 6 |
| Module 4 | CMS | 8 |
| Module 5 | Publishing | 12 |
| Module 6 | Collaboration | 14 |
| Module 7 | AI Features | 10 |
| Module 8 | Settings & Onboarding | 1, 16 |
| Module 9 | History & Versioning | 13 |
