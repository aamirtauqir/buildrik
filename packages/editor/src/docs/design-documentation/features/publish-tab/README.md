---
title: Publish Tab — Deploy & Hosting
description: Design specification for the publish flow with hosting connection, draft/published states, and role-based access
feature: publish-tab
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../settings-tab/README.md
  - ../collaboration/README.md
dependencies:
  - Settings Tab (domain configuration)
  - Collaboration (role-based publish permissions)
status: approved
---

# Publish Tab — Deploy & Hosting

## Overview

The Publish Tab handles the transition from editor to live website. First-time users see a "Connect Hosting" guidance flow with an illustration. Once connected, users see the current publish status (Draft/Published), live URL, and publish/unpublish controls. Role-based access ensures only Owners and Editors can publish, while Viewers see a read-only status. Auto-save triggers before every publish to prevent data loss.

**Primary User Goal:** Take the current page live with one click.
**Success Criteria:** Publish completes in < 10 seconds with visible confirmation.
**Key Pain Points Addressed:** No ambiguity about what is live vs draft; clear attribution for who published.

---

## Layout Architecture

```
┌──────────────────────────────┐ 280px
│ Publish                      │ Header
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │      Status Badge        │ │
│ │   🟢 Published           │ │ Or 🟡 Draft
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ Live URL                     │
│ ┌──────────────────────────┐ │
│ │ mysite.buildrik.app  [📋]│ │ Copy button
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ Last published: Mar 25, 2026 │
│ by Sarah Chen                │ Attribution
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │    [Unpublish Site]      │ │ Secondary/destructive
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │    [Publish Changes]     │ │ Primary button
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ Changes since last publish:  │
│ · 3 pages modified           │ Change summary
│ · 2 new elements added       │
│ · Design tokens updated      │
└──────────────────────────────┘
```

---

## Screen States

### State 1: First Time — No Hosting Connected

- **Illustration:** Centered graphic (rocket/cloud icon), 120x120px, `--aqb-text-tertiary`.
- **Heading:** "Connect Hosting to Go Live" in `--aqb-heading-md`, `--aqb-text-primary`.
- **Description:** "Publish your site to Buildrik hosting or connect your own domain." in `--aqb-body`, `--aqb-text-tertiary`.
- **CTA:** [Connect Hosting] primary button, full-width.
- **Setup flow:** Guided steps — choose subdomain → verify → connected.

### State 2: Draft (Never Published)

- **Status badge:** `--aqb-warning` bg, "Draft" text, pill shape.
- **URL preview:** Shows what the URL will be (dimmed).
- **Publish button:** [Publish Site] primary, full-width, `--aqb-primary` bg.
- **No "Unpublish"** button visible (nothing is live yet).

### State 3: Published (Live)

- **Status badge:** `--aqb-success` bg, "Published" text, green dot pulsing subtly.
- **Live URL:** Clickable link (opens in new tab) + copy button. `--aqb-primary` text.
- **Attribution:** "Published by [Name]" + timestamp in `--aqb-caption`, `--aqb-text-tertiary`.
- **Buttons:** [Publish Changes] primary (if changes exist) + [Unpublish Site] ghost/destructive.
- **Change summary:** Bullet list of changes since last publish.

### State 4: Publishing in Progress

- **Button:** Disabled, shows spinner + "Publishing..."
- **Progress:** Indeterminate progress bar below button, `--aqb-primary`.
- **Auto-save note:** "Auto-saving before publish..." shown briefly.

### State 5: Viewer Role (Read-Only)

- **Status visible:** Same status badge and URL.
- **Buttons hidden:** No Publish or Unpublish buttons.
- **Note:** "Only Owners and Editors can publish." in `--aqb-caption`, `--aqb-text-tertiary`.

### State 6: Publish Failed

- **Error banner:** `--aqb-error-subtle` bg, `--aqb-error` border. Error message + [Retry] button.
- **Common errors:** Build failure, domain not verified, quota exceeded.

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Click [Publish Site/Changes] | Auto-save → build → deploy | Button spinner, progress bar |
| Click [Unpublish Site] | Confirmation modal → site goes offline | Modal fade-in, status badge change |
| Click live URL | Opens in new browser tab | Standard link behavior |
| Click copy icon | Copies URL to clipboard | Checkmark flash, 1.5s |
| Connect Hosting | Guided setup modal | Step transitions, 200ms |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Publish tab load | < 100ms |
| Auto-save before publish | < 2s |
| Full publish pipeline | < 10s |
| URL copy to clipboard | < 50ms |
| Status check (is site live?) | < 500ms |

---

## Accessibility

- **Status badge:** `aria-label="Site status: [Published/Draft]"`
- **Live URL:** `aria-label="Live site URL"`, copy button `aria-label="Copy URL to clipboard"`
- **Publish button:** `aria-label="Publish site changes"`, disabled state announced
- **Confirmation modal:** Focus trapped, Escape to cancel
- **Progress bar:** `role="progressbar"`, `aria-label="Publishing in progress"`

---

## Implementation Notes

- Publish triggers `Composer.save()` (auto-save) before initiating deploy pipeline
- Deploy pipeline: serialize → build → upload → CDN invalidate → verify
- Role check via `Composer.collaboration.getCurrentUserRole()` — only "owner" and "editor" see publish button
- Change summary computed by diffing current state against last-published snapshot
- "Published by" attribution stored with publish metadata

---

## Related Documentation
- [Settings Tab](../settings-tab/README.md) — Domain configuration
- [Collaboration](../collaboration/README.md) — Role-based publish permissions
- [Pages Tab](../pages-tab/README.md) — All pages included in publish
- [Style Guide](../../design-system/style-guide.md) — Button and badge specs
