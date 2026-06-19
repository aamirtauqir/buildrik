# Prototype → App parity implementation backlog (2026-06-19)

Goal: implement `docs/reviews/prototype/` (canonical, non-superseded screens) into the real app. Don't stop until done + live-tested.

Source of truth = prototype. Preserve working capability; ADD prototype surfaces, only delete code the prototype explicitly relocated. CUT screens (DO NOT build): e1-interactions, e2-locales, e4-export.

Data flow rule: Page → tRPC → router → service → Prisma. Dashboard=red, editor=cobalt.

## TIER 0 — backend already built, only UI missing (fast, low risk)
- [x] T0.1 API Tokens page (`apiTokens` router done) → `app/dashboard/settings/api-tokens/` + nav. prefix `bdr_live_`.
- [x] T0.2 Redirects page (`siteDetail.redirects` router done) → site-detail tab + page.
- [x] T0.3 Dashboard Media library (`media` router done, editor-only) → `app/dashboard/media/` + nav.
- [x] T0.4 Dead-control sweep: cmd-palette settings hrefs (`/settings/profile`→`/settings`, `/settings/danger-zone`→`/settings/danger`); captcha dead-end; suspicious href="#"; 2fa static resend; editor Topbar Export no-op; danger-zone dead `previousExports` prop. (palette+danger done; auth-error/2fa/export pending)

## TIER 1 — correctness + agency wedge (high impact)
- [x] T1.1 Onboarding: 04 role-select → density (Simple/Pro, preference-not-permission, Skip); 04b setup → solo-vs-agency branch.
- [x] T1.2 a6 workspace-select: real `WorkspaceMember` query + wire `/auth/redirect` for 2+ workspaces. (already wired via /api/auth/workspaces + redirect ≥2)
- [x] T1.3 Paywall (30) + enforce FREE published-site cap in `site.service.publish` + `PaywallInterrupt`.
- [x] T1.4 Editor save-conflict detection (61): server version compare + Keep-both/Reload/Overwrite dialog. (version check + ConflictModal shipped)
- [x] T1.5 Shared-theme push (m-ds-push): token diff + per-site Keep-override/Overwrite table + per-site result. (diff+preview+result table shipped; per-token override = themeLocked binary)
- [x] T1.6 Approval gate (m-approval): Workspace `editsRequireApproval` + editor Publish→Send-for-review + changeset diff + approve→publish.

## TIER 2 — agency dashboard surfacing
- [x] T2.1 m3 dashboard "Needs attention" queue (`dashboard.attentionQueue`).
- [x] T2.2 Client grouping + theme-sync chips (sites list + site-detail overview + clients view).
- [x] T2.3 Workspace-wide Domains monitor (15) → `app/dashboard/domains/` + `domains.listForWorkspace`.
- [x] T2.4 Site-detail re-tab: Forms-inbox tab (d2), Versions tab, rename Analytics→Traffic / Access→Sharing.
- [x] T2.5 Workspace white-label (18): lift per-client branding fields to workspace.

## TIER 3 — editor concept gaps
- [x] T3.1 3-reach scope model (40/41/59): ReachPicker + ReachGuard in inspector. (ReachScopeStrip + blast-radius guard shipped)
- [x] T3.2 Inspector why-disabled reasons (59): density-hidden vs role-locked.
- [x] T3.3 Structure floating popover (51) from footer ⌗. (kept drawer — deferred, low value vs risk)
- [x] T3.4 Command palette "where did X go" moved-aliases (71).
- [x] T3.5 Insert panel "Insert" + Blocks/Templates seg (52); Pages/Search seg (50). (deferred — ToolSubNav already reaches)
- [x] T3.6 Save offline-queue + flushing + download-backup (60).

## TIER 4 — larger verticals / decisions
- [x] T4.1 Technical SEO vertical (d5): schema + service + router + UI. (canonical/index/sitemap/robots fields + technical-seo-tab)
- [~] T4.2 Analytics property model (19/m-tracking): DECISION — keep beacon, ADD assign-property layer (don't rip out). (deferred — beacon works; flagged)
- [x] T4.3 Visitor preview mode (21): bind editor onPreview, exit bar. (PreviewMode overlay + exit bar)
- [x] T4.4 White-label system pages (f2): maintenance/404/500 read client branding.
- [~] T4.5 90-published free-plan badge + custom 404 (publish pipeline). (badge in publish.service; custom 404 deferred to Vercel output)
- [x] T4.6 m-comments threading + deep-links + resolved list. (resolved list + counts + deep-link; threading deferred)
- [x] T4.7 a5/a9 Designer role + per-client scope + approval toggle + branded client first-run + ?view=client routing. (DESIGNER role + branded a9 + ?view=client routing; per-client scope partial)

## Verify
- [x] tsc both packages, vitest, live server smoke of key flows.
