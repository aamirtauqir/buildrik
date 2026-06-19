I’m reviewing the actual wireframe HTML in `docs/reviews/wireframes` and mapping the product model screen-by-screen before judging placement, naming, grouping, and density. After that I’ll synthesize a concrete IA and panel-by-panel critique tied to file names.
I’ve got the full screen inventory. Next I’m reading the model/spine docs plus the main editor, dashboard, agency, settings, and site-ops screens so the critique stays grounded in the actual wireframes rather than the filenames alone.
I’m in the editor cluster now. I need the actual labels, helper copy, and panel contents from `m-editor`, `50/51/52/53`, `59/59b`, and `40/41` because the critique hinges on whether the surface matches the user’s mental model, not just the conceptual model docs.
The agency/settings/cross-cutting cluster is clear. I’m filling the remaining gaps in media and shared-theme screens, because those are the biggest places where “same thing, two doors” can easily turn into user confusion if the naming and primary action aren’t exact.
**1. Overall Product Review**
- `m0-spine.html`, `m-editor.html`, and `12-site-detail.html` finally give the product a usable backbone: dashboard for workspace/client/site ops, editor for page/content/layout. Reason: users can now form a stable mental map of where work happens.
- The product is still harder than it should be because the same thing changes name across screens: `Shared theme` in `m3-dashboard.html`, `shared design system` in `m-agency.html`, `shared theme` in `ds1-design-system.html`, `Styles/presets` in `ds2-styles.html`, `Media` in `17-media.html`, `Asset library` in `56-media.html`. Reason: users should learn one noun once.
- The editor is closer to the right shape than the dashboard/settings layer. `m-editor.html`, `52-add.html`, `50-pages.html`, and `59-inspector.html` mostly align to normal builder behavior; `m3-dashboard.html`, `b0-settings-home.html`, `18-workspace.html`, and `m-agency.html` still feel like a model explanation more than a daily operating system. Reason: agency users return to queues, status, and actions, not architecture diagrams.
- Too many screens still explain the boundary instead of embodying it: `m3-dashboard.html`, `12-site-detail.html`, `53-settings.html`, `80-states.html`. Reason: the product should teach itself through labels and grouping, not long helper copy.

**2. Main UX Problems**
- Primary navigation is not stable across dashboard surfaces. `m3-dashboard.html`, `15-domains.html`, `17-media.html`, `b0-settings-home.html`, and `18-workspace.html` all imply different top-level maps. Reason: users build confidence from repetition; changing nav makes the product feel inconsistent.
- The editor’s scope model is conceptually right but verbally inconsistent. `41-scope-picker.html` uses `This item / All like this / Site theme`, while `m-editor.html` uses `This item / Reusable block / Site theme`. Reason: users care about blast radius, not internal implementation.
- `Settings` is trying to be both a real home and a meta-directory in `b0-settings-home.html`. Reason: “everything settings” pages become a second navigation system and recreate the confusion they are meant to solve.
- Action labels are too generic in high-value surfaces: `Open / Edit / Duplicate` in `m-agency.html`, `Edit / Visit / Manage` in `m3-dashboard.html`, `Manage` in `11-sites.html`. Reason: generic verbs hide destination and force users to click to learn.
- `Delivery` in `14-site-settings.html` is not a normal user term for redirects, indexing, and diagnostics. Reason: agencies may know deploys, but most users will look for `SEO`, `Routing`, `Publishing`, or `Infrastructure`.
- `History` is overloaded. `m-editor.html` uses `History` for in-canvas undo/timeline, while `58-history.html` uses it for published versions. Reason: one label should not describe two different time models.
- Cross-site data leaks into site-scoped screens. `d5-seo.html` shows a portfolio health table inside a single-site context. Reason: when the breadcrumb says one site, the user expects one site.

**3. Information Architecture Issues**
- `Workspace` exists as a real object in `18-workspace.html`, but `m3-dashboard.html` still promotes `Shared theme`, `Team`, and `Billing` as separate primary peers. Reason: if Workspace is a real container, its sub-tools should live under it.
- `b0-settings-home.html` mixes personal, workspace, site ops, and editor content into one directory. Reason: that helps explain the model once, but it is not a good permanent IA because it teaches users to look in Settings for things that are not settings.
- `15-domains.html` and `12-site-detail.html > Domains` both look like writable homes. Reason: global overview and site-specific editing are two different jobs; only one should be the editing surface.
- `50-pages.html` introduces the right `SEO overview` surface, but `m-editor.html` does not expose it in the canonical Pages panel. Reason: the many-page model is only real if it is on the main path.
- `c5-api-tokens.html` is marked cut, but `b0-settings-home.html` and `18-workspace.html` still route to it. Reason: dead concepts in the IA create false promises.

**4. Feature Placement Suggestions (which feature → which panel/tab, and why)**
- `Shared theme` → `Workspace` tab, not primary top nav in `m3-dashboard.html`. Reason: it is a workspace asset, not a daily top-level destination for every user.
- `White-label branding` → `Workspace > Branding` from `18-workspace.html`. Reason: it affects every invited client and belongs with other org-wide settings.
- `Approval policy` → `Workspace > Team` or `Client policy`, with invite inheriting it in `a5-invite.html`. Reason: approval is a workflow rule, not a property of a single invite email.
- `Cross-site SEO health` → dashboard `Home` or `Clients`, not `d5-seo.html`. Reason: cross-site monitoring is a portfolio job, not a site-detail job.
- `Technical SEO` → `Site detail > Publishing` or `Routing & SEO` from `14-site-settings.html`. Reason: it is site-serving policy, not page authoring.
- `Domain editing` → `Site detail > Domains`; `15-domains.html` becomes a global monitoring table only. Reason: users connect domains to a specific site, but want a workspace-wide status view.
- `Traffic connect` → `Workspace > Integrations`, `Traffic assign` → `Editor > Site`, `Traffic reports` → `Site detail > Traffic` from `c4-integrations.html`, `m-tracking.html`, and `19-analytics.html`. Reason: this three-layer split matches how analytics actually works.
- `Asset management` → `Workspace > Asset library`; asset selection → contextual picker from `56-media.html`. Reason: managing and choosing are different jobs on the same store.
- `Published versions` → `Site detail > Versions`; editor topbar becomes `Undo history` only. Reason: users need a clean split between session edits and deployed states.
- `SEO overview` → `Editor > Pages` as a core subtab from `50-pages.html`. Reason: page SEO belongs where page structure already lives.
- `Command palette` → global across dashboard and editor, with aliases from `71-command-palette.html`. Reason: moved features only stay findable if search works everywhere.

**5. Panel-by-Panel Improvement Plan**
- `Editor rail / topbar / canvas` — Keep the 4-item rail in `m-editor.html`. Improve the topbar by replacing the `B` logo exit with an explicit `Back to site` control, keep `Preview` and `Publish` as the dominant actions, and treat `Simple/Pro` as a density preference rather than a headline control. Add `SEO overview` to Pages and make Components a consistent Insert subtab like `52-add.html`. Reason: the editor should feel like one stable workspace, not a spec demo.
- `Inspector` — Keep reach-first editing from `59-inspector.html` and `59b-inspector-states.html`, but standardize the language to `This item / All like this / Site theme`, show counts on the middle option, and regroup fields into clearer buckets like Content, Layout, Style, Responsive, Behavior, Advanced. Reason: the current accordion stack is harder to scan than it needs to be.
- `Dashboard` — Keep the start tiles and recent work in `m3-dashboard.html`, but remove the permanent boundary explainer card from the main surface and replace it with operational queues: approval requests, failed DS pushes, no-data traffic, domain issues. Rename `Manage` to `Site ops` or `Open site`. Reason: home should prioritize work needing attention.
- `Agency` — Keep the Client layer from `m-agency.html`, the invite scoping in `a5-invite.html`, the approval loop in `m-approval.html`, and the DS push contract in `m-ds-push.html`. Replace generic row actions with explicit ones like `Client`, `Site ops`, `Open editor`, `Duplicate as template`. Reason: agencies operate by account/site/status, not abstract verbs.
- `Settings` — Keep personal settings in `b1-account-settings.html` and workspace controls in `18-workspace.html`. Downgrade `b0-settings-home.html` from a primary nav destination to a searchable finder page, and remove `API tokens` until it is truly in product. Reason: settings should reduce hunting, not become a second IA.
- `Site-ops tabs` — Keep the tab split in `12-site-detail.html`, but rename `Delivery` in `14-site-settings.html` to `Publishing`, `Routing & SEO`, or `Infrastructure`; rename `History` in `58-history.html` to `Versions`; keep `Traffic`, `Forms`, and `Sharing` clear and site-scoped. Reason: the tabs are structurally right, but two names are too internal.
- `Media` — Rename `Media` to `Assets` across `17-media.html` and `56-media.html`. Keep the one-store-two-doors model, but do not bundle `Image editor`, `Icon picker`, and `Version history` as one coequal work surface like `56c-image-editor.html`. Reason: users usually arrive with one task, and the tool should stay focused on that task.
- `DS` — Decide whether the shared object is a `Shared theme` or a `Design system` and use one name across `m-agency.html`, `ds1-design-system.html`, and `ds2-styles.html`. If shared components are not shipping yet, standardize on `Shared theme`. Reason: `theme` and `design system` imply different scope.

**6. User Flow Improvements**
- `m3-dashboard.html` needs a real agency work queue: `Needs review`, `Push failed`, `No analytics assigned`, `Domain pending`, `Share link expired`. Reason: agencies come back to exceptions, not to “start something” after the first week.
- `a5-invite.html` → client login → `m-editor.html` Simple → `m-approval.html` should be one explicit handoff path with inherited approval policy and a visible “what this client can do” summary. Reason: handoff is the core agency promise.
- `50-pages.html` should let users move from issue table → page drawer → save → next issue without leaving Pages. Reason: SEO cleanup is batch work.
- `15-domains.html` should act as workspace-wide monitoring and deep-link into `12-site-detail.html > Domains` for edits. Reason: users monitor many domains globally but solve one site at a time.
- `56-media.html` should keep replace-image flows in context and only open stock, icon, or edit subtools on request. Reason: media changes are often micro-tasks during page editing.
- `71-command-palette.html` should search old names and vendor names: `GA`, `Analytics`, `Meta Pixel`, `Shared theme`, `Branding`, `Redirects`, `Forms inbox`. Reason: users search by what they know, not by your new IA.

**7. UI and Visual Design Improvements**
- Reduce paragraph-length helper copy on core screens like `m3-dashboard.html`, `12-site-detail.html`, and `53-settings.html`; convert it into shorter section labels and inline helper rows. Reason: the product should scan in seconds.
- Make action hierarchy more obvious. In `m3-dashboard.html` and `11-sites.html`, `Edit`, `Visit`, and `Manage/Open` read too evenly. Reason: users need one obvious primary next step.
- Standardize chips and state badges across `m3-dashboard.html`, `11-sites.html`, `58-history.html`, `d4-share-access.html`, and `80-states.html`: `live`, `draft`, `pending`, `synced`, `override`, `approval pending`, `failed`. Reason: state language is currently fragmented.
- Differentiate `hidden by density` and `blocked by role` visually, not just in prose, across `59-inspector.html`, `59b-inspector-states.html`, and `80-states.html`. Reason: these two causes feel identical if the UI treatment is the same.
- Strengthen persistent context markers: active tab, breadcrumb, site/client scope, and object being edited. Reason: the product has multiple levels of scope, so context must be visually louder than it is now.

**8. Features to Add, Remove, Merge, or Improve (explicit verbs per feature)**
- `Rename` `Delivery` in `14-site-settings.html` to `Publishing`, `Routing & SEO`, or `Infrastructure`. Reason: `Delivery` is not a natural label for redirects and indexing.
- `Rename` `Media` to `Assets` in `17-media.html`, `56-media.html`, and related nav. Reason: `Assets` better describes a shared image/icon/file library.
- `Rename` editor `History` in `m-editor.html` to `Undo history`, and rename site-detail `History` in `58-history.html` to `Versions`. Reason: users need separate terms for edit session vs deployed release.
- `Merge` `Shared theme` into `Workspace` navigation instead of keeping it as a peer tab in `m3-dashboard.html`. Reason: it is a workspace-owned tool.
- `Merge` approval policy into `Team` or `Client policy` instead of making it a prominent per-invite control in `a5-invite.html`. Reason: policy belongs to governance, not the invite form.
- `Add` `SEO overview` to the canonical Pages panel in `m-editor.html`, matching `50-pages.html`. Reason: the many-page SEO model should be on the main path.
- `Add` an explicit `Back to site` control to `m-editor.html`. Reason: logos are weak exit affordances in editors.
- `Add` dashboard queues for approvals, failed pushes, no-data traffic, and domain problems in `m3-dashboard.html`. Reason: agency home should surface work, not just entry points.
- `Remove` `API tokens` from `b0-settings-home.html` and `18-workspace.html` while `c5-api-tokens.html` is cut. Reason: dead IA damages trust.
- `Improve` all generic verbs in `m-agency.html`, `m3-dashboard.html`, and `11-sites.html`. Reason: users should know the destination before clicking.
- `Improve` the reach picker in `m-editor.html` to match `41-scope-picker.html` exactly. Reason: one naming model is essential here.
- `Separate` `Image editor`, `Icon picker`, and `Version history` in `56c-image-editor.html` into task-specific entry points. Reason: bundling them creates unnecessary cognitive load.

**9. Recommended New Product Structure (the clean target IA tree)**
Use one stable tree, with solo mode collapsing `Clients` into `Sites`:

```text
Dashboard
  Home
  Clients
    Client detail
      Sites
  Workspace
    Branding
    Shared theme
    Asset library
    Team & approvals
    Integrations
  Billing
  Personal settings (avatar)

Site detail
  Overview
  Domains
  Traffic
  Forms
  Sharing
  Publishing
    Redirects
    Indexing & sitemap
    Diagnostics
  Versions

Editor
  Insert
    Blocks
    Sections
    Components
    AI
  Pages
    Page list
    Structure
    SEO overview
  Styles
    Brand
    Typography
    Tokens & presets (Pro)
  Site
    Search appearance
    Analytics & pixels
    Forms
    Custom code (Pro)

Inspector
  Scope
  Content
  Layout
  Style
  Responsive
  Behavior
  Advanced

Global
  Command palette
  Notifications
  State system
```

**10. Final Product Designer Recommendations (prioritized: P0 must-fix → P2 polish)**
- `P0` Unify navigation across `m3-dashboard.html`, `17-media.html`, `15-domains.html`, `18-workspace.html`, and `b0-settings-home.html`. Reason: no other change will matter if the top-level map keeps moving.
- `P0` Unify naming: `Shared theme` vs `design system`, `Media` vs `Asset library`, `History` vs `Versions`, `Delivery` vs a clearer site-ops label. Reason: vocabulary drift is the biggest day-to-day friction.
- `P0` Fix the canonical editor mismatch by adding `SEO overview` to `m-editor.html` and making the reach labels match `41-scope-picker.html`. Reason: the main editing surface must reflect the real model.
- `P0` Stop using `Settings` as a catch-all IA. Keep personal/workspace settings there; keep site ops in site detail and content config in the editor. Reason: this removes an entire layer of navigation confusion.
- `P0` Resolve one-home rules for domains, technical SEO health, and API tokens. Reason: users should never wonder which of two screens is the real place to act.
- `P1` Turn dashboard home into an ops console with approval, domain, tracking, and DS-push queues. Reason: that is the core agency value after onboarding.
- `P1` Make agency actions explicit and scope-aware in `m-agency.html` and `11-sites.html`. Reason: agencies manage clients and sites, not abstract objects.
- `P1` Rebuild the inspector hierarchy and visual treatment of hidden-vs-blocked states using `59-inspector.html`, `59b-inspector-states.html`, and `80-states.html`. Reason: this is where advanced power either feels safe or scary.
- `P2` Trim explanatory copy and replace it with stronger labels, active states, and helper links. Reason: the product should feel confident, not defensive.
- `P2` Polish contextual tools like assets, stock, icon picker, and version history so they stay subtools, not destinations. Reason: focused tools make the editor feel faster and simpler.
---

## APPLIED (design pass executed 2026-06-18) — codex-verified 8.0/10 BUILD-READY

**Naming SSOT (one noun per concept):** Shared theme (not design system/DS) · Assets (not Media/Asset library) · Publishing (not Delivery) · Versions (dashboard, was History) · Undo history (editor topbar) · Sharing (not Access/Share-&-access) · theme push (not DS push). 0 residual on active screens.

**Nav SSOT:** one canonical dashboard appbar in `wf.css` (`.dbar/.dnav` = Home · Clients · Workspace · Billing + 🔔/?/avatar) on m3, m-agency, 18, 17, 15, 16, ds1, c1, c4, b0. Workspace sub-tab bar (`.subtabs` = Branding · Shared theme · Assets · Team & approvals · Integrations). Settings (b0) downgraded to a finder reached from avatar/⌘K.

**Site-detail shell SSOT:** one `.scrumb` + `.stabs` 7-tab bar (Overview · Domains · Traffic · Forms inbox · Sharing · Publishing · Versions) on 12/14/58/19/d2/d3/d4/d5/d6.

**One-home:** new `d6-domains` = site-scoped Domains EDIT home; `15-domains` = all-sites MONITOR that deep-links to d6. d5 cross-site SEO table removed (single-site). Cut API-tokens drained from active IA.

**Editor:** reach labels unified (This item / All like this / Site theme) · SEO subtab added to Pages · explicit "‹ Exit" control. Inspector regrouped into job buckets (Content/Layout/Style + Pro: Responsive/Behavior/Advanced) with distinct *hidden-by-density* vs *🔒 locked-by-role* states; 59 + m-editor mirror aligned.

**Dashboard:** m3 opens with a "Needs attention" agency queue (review · push-failed · no-analytics · domain-pending); boundary explainer trimmed; generic verbs → explicit (Site ops ↗ / Open client ↗ / ＋ Site from template).

Verified: 0 dead links, 0 dead-`#`, 0 naming residue across 96 active screens.

---

## CODEX FINAL REVIEW (2026-06-18, post-quota-reset) — 9/10 BUILD-READY

Fresh holistic codex pass (after quota reset) found 5 model-level blockers the incremental passes missed; all fixed + verified:
1. **Workspace=agency model** — a6-workspace-select / a7-transfer now treat the workspace as the agency (holds many clients), not "one workspace = one client".
2. **Concrete create-from-template** — m3→01→03-gallery→03b-preview→editor (no self-loop).
3. **Onboarding copy** — 04b aligned to its pre-Start, workspace-seeding position.
4. **Dashboard shell** — 11-sites carries the canonical appbar; solo/agency nav mocks (m-states) use the canonical shell.
5. **M3 "all activity"** → c2-notifications (was 80-states).
Plus model SSOT in m-ownership: SEO row (content=editor/technical=dashboard), analytics row (3-layer), history/versions row (undo=topbar/versions=58); and **Simple/Pro** naming canonical everywhere (drained Simple/Advanced).

**Codex verdict: 9/10 — BUILD-READY. "Final scan for remaining build-blocker: none."**
Remaining = nice-to-haves only (superseded-screen proto-links). 96 screens · 0 dead links · 0 dead-#.
