# Dashboard IA — Dashboard topbar link, full-width ecosystem pages, template escape

**Date:** 2026-07-21
**Extends:** `docs/superpowers/specs/2026-07-16-dashboard-ia-v2-design.md` (IA v2)
**Scope:** Part A only — layout/IA. No engine work. Live-rendering the template
(Part B) is a separate spec.

## Problem

Three connected gaps in the current shell:

1. **No "Dashboard" affordance in the topbar.** The topbar carries the brand
   (which links to `/dashboard`), an "EXPLORE" label, and Marketplace / Learn /
   Resources. The only way back to the workspace from an ecosystem page is the
   brand logo — not obvious. The prototype had "Dashboard" as a first topbar item.

2. **The sidebar shows on ecosystem pages too.** `DashboardShell` renders the
   sidebar on every `/dashboard/*` route, so Marketplace, Learn and Resources —
   which are ecosystem areas, not workspace destinations — sit in a narrowed
   column beside a workspace nav that does not belong to them. They should be
   full-width, with the sidebar reserved for the workspace ("Dashboard") area.

3. **The template preview is a dead-end.** `TemplatePreview` is a `fixed inset-0`
   overlay that covers the whole shell, topbar included. Its only exit is a back
   arrow to the gallery. There is no way to reach the dashboard from it.

## Decisions (all locked with the user)

- **Topbar Dashboard link:** a distinct "Dashboard" link, placed *before* the
  EXPLORE cluster with a separator. The "EXPLORE" label stays. Active when the
  current route is a workspace page (i.e. not an ecosystem route).
- **Ecosystem pages full-width:** the sidebar (and its mobile bottom-nav twin)
  is hidden on Marketplace / Learn / Resources; those pages go full-width. Every
  other `/dashboard/*` route keeps the sidebar.
- **Template escape:** the preview overlay no longer covers the topbar. It starts
  below the topbar and spans full width (over the sidebar), so the real topbar —
  now carrying the Dashboard link — stays visible and is the escape. The preview's
  own sub-header (← Templates, device toggles, Use Template) is unchanged.

## Architecture

### One route classifier, in `nav.ts` (SSOT)

The same workspace-vs-ecosystem split drives three things: sidebar visibility,
the Dashboard link's active state, and (implicitly) which pages are full-width.
Encoding it once prevents the drift that a duplicated list invites.

`nav.ts` is already the pure, React-free SSOT the sidebar, command palette and
contract tests import. Add:

- `ECOSYSTEM_NAV` — the `[Marketplace, Learn, Resources]` list, moved here from
  `top-nav.tsx` (which currently declares its own `TOP_NAV`).
- `isEcosystemRoute(pathname)` — true when the path is under any `ECOSYSTEM_NAV`
  href. This is the single predicate both the shell and the topbar consume.

### `DashboardShell` — conditional sidebar + full-width main

```
const showSidebar = !isEcosystemRoute(pathname);
...
{showSidebar && <Sidebar />}
<main className={cn("pt-[var(--topnav-h)]", showSidebar && "lg:ml-[var(--sidebar-w)]")}>
```

`Sidebar` renders both the desktop `<aside>` and the mobile bottom nav, so one
condition hides both — a workspace nav should not appear in either form on an
ecosystem page. Removing the left margin is what makes the page full-width; the
existing `px-10` content padding stays.

### `TopNav` — Dashboard link, imported ecosystem list

- Import `ECOSYSTEM_NAV` and `isEcosystemRoute` from `nav.ts`; drop the local
  `TOP_NAV`.
- Render a "Dashboard" `Link` to `/dashboard` before the EXPLORE cluster, with a
  thin separator between it and the label.
- Dashboard is active when `!isEcosystemRoute(pathname)`; the ecosystem tabs keep
  their own `startsWith` active check.

### `TemplatePreview` — overlay below the topbar

Change the overlay bounds from `fixed inset-0 z-50` to start at the topbar's
bottom edge and span the rest of the viewport (`fixed left-0 right-0 bottom-0
top-[var(--topnav-h)]`), with a z-index above the sidebar but below the topbar so
the real topbar stays visible and interactive. Nothing else in the component
changes; the render area still shows "No live preview" until Part B.

## What Part A does NOT do

- No live template render — the preview area stays empty (Part B).
- No change to which routes exist or to the sidebar's own items.
- No change to the ecosystem pages' internal layout beyond the width they get
  from losing the sidebar margin.

## Testing

- **`nav.ts` classifier** (pure, unit): `isEcosystemRoute` true for marketplace /
  learn / resources and their sub-paths, false for `/dashboard`, projects, media,
  templates, settings, sites, agency. This is the load-bearing predicate; a wrong
  answer either hides the sidebar on a workspace page or shows it on an ecosystem
  page.
- **Topbar** (existing `top-nav` test area): Dashboard link present and pointing
  at `/dashboard`; active on a workspace path, inactive on an ecosystem path.
- **Shell / preview layout:** live-verify — sidebar gone and page full-width on
  Marketplace/Learn/Resources; sidebar present on workspace pages; the template
  preview shows the topbar with a working Dashboard link and the sidebar covered.

## Files

- `packages/dashboard/components/dashboard/shell/nav.ts` — add `ECOSYSTEM_NAV`,
  `isEcosystemRoute`.
- `packages/dashboard/components/dashboard/shell/top-nav.tsx` — Dashboard link,
  import ecosystem list.
- `packages/dashboard/components/dashboard/shell/dashboard-shell.tsx` — conditional
  sidebar + full-width main.
- `packages/dashboard/components/templates/template-preview.tsx` — overlay below
  topbar.
- `packages/dashboard/components/dashboard/shell/__tests__/nav.test.ts` (or the
  existing nav test) — `isEcosystemRoute` cases.
