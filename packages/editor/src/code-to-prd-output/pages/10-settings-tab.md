# Settings Tab

> **Module:** Sidebar — Tab 8
> **Source:** `src/editor/sidebar/tabs/settings/`
> **Keyboard Shortcut:** S
> **Generated:** 2026-03-25 | **Updated:** v2

## Overview

The Settings tab is a card-based home screen with **7 drill-in sub-screens** for configuring project-level settings: site identity, domains, analytics, export preferences, third-party integrations, advanced options, and SEO defaults. **Billing is separated to the account-level menu** (accessible from the user avatar in the top bar) because it's an account concern, not a project concern — designers configuring analytics shouldn't be confronted with invoices.

## Layout

### Settings Home
```
+---------------------------+
| Settings                  |
+---------------------------+
| +--------+ +--------+    |
| |🌐      | |📊      |    |
| |Site    | |Analytics|    |
| |Settings| |         |    |
| +--------+ +--------+    |
| +--------+ +--------+    |
| |🔗      | |📤      |    |
| |Domains | |Export   |    |
| +--------+ +--------+    |
| +--------+ +--------+    |
| |🔌      | |⚙️      |    |
| |Integr- | |Advanced|    |
| |ations  | |         |    |
| +--------+ +--------+    |
| +--------+               |
| |🔍      |               |
| |SEO     |               |
| +--------+               |
+---------------------------+
```

## Sub-Screens

### 1. Site Settings

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Project name | Text | Yes | "Untitled Project" | Displayed in header and exports |
| Favicon | Image upload | No | None | 32x32 or 64x64 .ico or .png (max 512 KB) |
| Language | Select | No | English | HTML `lang` attribute |
| Logo | Image upload | No | None | Used in header/footer templates |
| Twitter URL | URL input | No | Empty | Social link |
| Facebook URL | URL input | No | Empty | Social link |
| Instagram URL | URL input | No | Empty | Social link |

### 2. Domains

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Custom domain | Text | No | None | User's custom domain name |
| SSL enabled | Toggle | — | true | HTTPS enforcement |
| Redirects | List | No | Empty | From → To redirect rules |

### 3. Analytics

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Google Analytics ID | Text | No | Empty | GA measurement ID (G-XXXXXXXXXX) |
| Meta Pixel ID | Text | No | Empty | Facebook Pixel ID |
| Custom tracking scripts | Code editor | No | Empty | Additional tracking code injected in `<head>` |

### 4. Export Settings

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Default format | Select | No | HTML | HTML, React, Vue, Next.js |
| Include assets | Toggle | No | true | Bundle images/fonts in export |
| Minify output | Toggle | No | true | Minify HTML/CSS/JS |
| Include sitemap | Toggle | No | true | Generate sitemap.xml |
| TypeScript (React/Vue) | Toggle | No | false | Generate .tsx/.vue with TS |

### 5. Integrations

| Integration | Type | Fields |
|-------------|------|--------|
| Form backend | Select | Formspree, Custom webhook URL |
| Payment | Select | Stripe publishable key, price IDs |
| Email service | Select | Provider, API key, list ID |

### 6. Advanced

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Custom CSS | Code editor | No | Empty | Global CSS injected into project |
| Custom JavaScript | Code editor | No | Empty | Global JS injected before `</body>` |
| Custom `<head>` tags | Code editor | No | Empty | Meta tags, link preloads, etc. |
| Reset onboarding | Button | — | — | Re-triggers onboarding flow for current user |

### 7. SEO (Site-Wide Defaults)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Default title | Text | No | Project name | Fallback page title |
| Default meta description | Textarea | No | Empty | Fallback description |
| Robots | Select | No | "index, follow" | Default robots directive |
| Canonical URL base | URL | No | Empty | Base URL for canonical tags |

### Billing (Account-Level — NOT in Settings Tab)

Billing is accessible from the **user avatar menu in the top bar**, not from project Settings. This separates account concerns from project configuration.

| Field | Type | Notes |
|-------|------|-------|
| Current plan | Display | Shows plan name and features |
| Payment method | Display + Edit | Card on file, update option |
| Invoices | List | Download past invoices |
| Upgrade button | CTA | Opens upgrade modal |

**Visibility:** Billing menu item is hidden entirely when `config.billing = false` (embedded editor mode).

## Interactions

### Navigate to Sub-Screen
- **Trigger:** Click feature card
- **Behavior:** Drill-in animation → sub-screen slides in from right → back button appears in header

### Return to Settings Home
- **Trigger:** Click back arrow (←) in drill-in header
- **Behavior:** Sub-screen slides out → settings home restored

### Save Settings
- **Trigger:** Change any field in a sub-screen
- **Behavior:** Auto-save with debounce → Composer `setProjectSettings()` called → settings persisted in project data
- **Special:** Analytics settings trigger `applyProjectSettings()` which reconfigures integrations

### Upload Favicon / Logo
- **Trigger:** Click upload area or drag image
- **Behavior:** File validation (type, dimensions, size limit 512 KB) → preview shown → saved to project metadata

### Reset Onboarding
- **Trigger:** Click "Reset onboarding" in Advanced sub-screen
- **Behavior:** Clears onboarding localStorage keys → next page load triggers Welcome Modal + Spotlight Tour for current user only

## Business Rules

1. Settings are project-level, not page-level (page-level settings are in Pages tab)
2. Analytics IDs are injected into exported HTML only — not active in the editor itself
3. Custom CSS/JS in Advanced settings is live in the editor canvas (can affect element rendering)
4. Integration API keys are stored in project settings and used during export
5. **Billing is account-level, not project-level** — accessible from user avatar menu in top bar. Hidden entirely when `config.billing = false` (embedded editor mode).
6. All settings changes are included in project save/export
7. **Onboarding can be reset** from Advanced sub-screen

## Screen Relationships
- **From:** Settings home cards
- **To:** Sub-screens (drill-in), Export modal (export settings apply there)
- **Data coupling:** Project settings affect Export output, Canvas rendering (custom CSS), and published site behavior
