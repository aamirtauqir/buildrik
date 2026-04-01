---
title: Settings Tab — Project Configuration
description: Design specification for the card-based settings panel with 7 drill-in screens
feature: settings-tab
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../publish-tab/README.md
  - ../pages-tab/README.md
dependencies:
  - Publish Tab (domain settings affect publish flow)
  - Onboarding (Reset Onboarding in Advanced)
status: approved
---

# Settings Tab — Project Configuration

## Overview

The Settings Tab provides project-level configuration through 7 card-based drill-in screens: Site, Domains, Analytics, Export, Integrations, Advanced, and SEO. Billing has been intentionally removed from this panel and moved to the account-level avatar menu to separate project settings from account management. All settings auto-save with a debounce to prevent excessive writes.

**Primary User Goal:** Configure project settings without leaving the editor.
**Success Criteria:** Any setting change auto-saves within 2 seconds with visible confirmation.
**Key Pain Points Addressed:** Eliminates navigating to separate dashboards for basic configuration; keeps users in context.

---

## Layout Architecture

```
┌──────────────────────────────┐ 280px
│ Settings                     │ Header
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ 🌐  Site Info            │ │ Card 1
│ │     Name, favicon, lang  │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 🔗  Domains              │ │ Card 2
│ │     Custom domains       │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 📊  Analytics            │ │ Card 3
│ │     GA, GTM, Hotjar      │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 📦  Export               │ │ Card 4
│ │     Code export prefs    │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 🔌  Integrations         │ │ Card 5
│ │     Third-party services │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ⚙️  Advanced              │ │ Card 6
│ │     Reset, danger zone   │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 🔍  SEO                  │ │ Card 7
│ │     Site-wide SEO        │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

---

## Screen States

### State 1: Settings Overview (Card Grid)

- **Cards:** Full-width, 64px height, `--aqb-chrome-surface` bg, `--aqb-radius-md`, 12px padding.
- **Icon:** 20px, `--aqb-text-tertiary`, left-aligned.
- **Title:** `--aqb-body`, `--aqb-text-primary`. Subtitle: `--aqb-caption`, `--aqb-text-tertiary`.
- **Chevron:** Right-aligned, `--aqb-text-tertiary`.
- **Hover:** `--aqb-chrome-surface-hover` bg.

### State 2: Site Info (Drill-In)

- **Fields:** Site Name (text input), Tagline (text input), Favicon (image upload, 32x32 preview), Language (dropdown), Time Zone (dropdown).
- **Auto-save:** 1.5s debounce. Save indicator: "Saved" in `--aqb-success` text, top-right.

### State 3: Domains (Drill-In)

- **Default domain:** `project-name.buildrik.app` shown as read-only with copy button.
- **Custom domain:** Input field + [Connect] button. DNS verification steps shown inline.
- **Status badges:** Connected (`--aqb-success`), Pending (`--aqb-warning`), Failed (`--aqb-error`).

### State 4: Analytics (Drill-In)

- **Supported:** Google Analytics 4, Google Tag Manager, Hotjar, custom scripts.
- **Each integration:** Toggle + ID input. Preview snippet shown in `--aqb-code` font.
- **Validation:** Real-time format check on tracking IDs.

### State 5: Export Preferences (Drill-In)

- **Options:** Default export format (HTML/React/Vue/Next.js), include comments toggle, minify toggle, component structure toggle.
- **These are defaults** that pre-populate the Export Modal.

### State 6: Integrations (Drill-In)

- **List:** Available third-party services as cards with Connect/Disconnect toggle.
- **Connected:** Green dot + "Connected" badge.
- **Available:** Zapier, Mailchimp, Stripe, Slack, Webhooks.

### State 7: Advanced (Drill-In)

- **Custom Code:** Head injection + Body injection textareas in `--aqb-code` font.
- **Reset Onboarding:** Button that re-triggers the onboarding flow.
- **Danger Zone:** Red-bordered section with "Delete Project" button. Requires typing project name to confirm.
- **Debug Mode:** Toggle for verbose console logging (dev use).

### State 8: SEO (Drill-In)

- **Site-wide defaults:** Default title template (`{page} | {site}`), default meta description, sitemap toggle, robots.txt editor.
- **Note:** Page-level SEO in Pages Tab overrides these defaults.

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Click settings card | Opens drill-in view | Slide-in from right, 200ms |
| Back button | Returns to card overview | Slide-out to right, 200ms |
| Edit any field | Auto-save after 1.5s debounce | "Saving..." → "Saved" indicator |
| Connect domain | DNS verification flow starts | Spinner → status badge |
| Delete Project | Type-to-confirm modal | Modal fade-in, input validation |
| Reset Onboarding | Confirmation modal → triggers onboarding | Modal → redirect to onboarding |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Settings overview load | < 100ms |
| Drill-in open | < 100ms |
| Auto-save round-trip | < 2s (debounce + network) |
| Domain verification check | < 3s |
| Settings data fetch | < 500ms |

---

## Accessibility

- **Settings cards:** `role="link"`, `aria-label="[Title]: [Subtitle]"`, Enter to open
- **Drill-in views:** Focus moves to first input on open. Back button is first in tab order.
- **Auto-save indicator:** `aria-live="polite"` region announces "Settings saved"
- **Danger zone:** `aria-describedby` warning text, confirmation input has `aria-label="Type project name to confirm deletion"`
- **All form fields:** Proper `<label>` associations, error messages linked via `aria-describedby`

---

## Implementation Notes

- Settings stored per-project via `Composer.settings` API
- Auto-save uses `debounce(1500)` before calling `Composer.settings.save()`
- Domain verification polls DNS records via `services/` layer
- Custom code injection validated for script tags and sanitized for XSS
- Billing intentionally absent — accessed via avatar menu → Account Settings (separate route)
- Reset Onboarding clears `onboarding.completed` flag in project state

---

## Related Documentation
- [Publish Tab](../publish-tab/README.md) — Domain settings affect publish URL
- [Pages Tab](../pages-tab/README.md) — Page-level SEO overrides site defaults
- [Onboarding](../onboarding/README.md) — Reset Onboarding triggers from Advanced
- [Export Modal](../export-modal/README.md) — Export preferences set defaults
- [Style Guide](../../design-system/style-guide.md) — Card and form specs
