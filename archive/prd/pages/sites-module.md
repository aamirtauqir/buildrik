# Sites Module -- Product Requirements Document

**Module:** Sites Management
**Route prefix:** `/dashboard/sites`
**Last updated:** 2026-03-25

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Sites List Page](#2-sites-list-page)
3. [New Site Page](#3-new-site-page)
4. [Site Detail Layout](#4-site-detail-layout)
5. [Overview Tab](#5-overview-tab)
6. [Settings Tab](#6-settings-tab)
7. [SEO Tab](#7-seo-tab)
8. [Domains Tab](#8-domains-tab)
9. [Access Tab](#9-access-tab)
10. [Analytics Tab](#10-analytics-tab)
11. [Publish Page](#11-publish-page)
12. [Folder Management](#12-folder-management)
13. [Bulk Actions](#13-bulk-actions)
14. [Business Rules & Constraints](#14-business-rules--constraints)
15. [API Dependency Map](#15-api-dependency-map)
16. [Page Relationship Map](#16-page-relationship-map)

---

## 1. Module Overview

The Sites module is the core management surface for Buildrik websites. It provides a full lifecycle for sites: creation (blank, template, or AI-generated), organization (folders, filters, search), configuration (settings, SEO, domains, access), analytics, and publishing.

### Key Actors

- **Owner**: Full control; can transfer ownership.
- **Admin / Editor**: Can create, edit, manage sites. Eligible for ownership transfer.
- **Viewer**: Read-only access via share links.

### Site Statuses

| Status | Color Badge | Description |
|---|---|---|
| `DRAFT` | Yellow (`#FEF9C3` / `#854D0E`) | Unpublished, in-progress site |
| `PUBLISHED` | Green (`#DCFCE7` / `#166534`) | Live and publicly accessible |
| `ARCHIVED` | Orange (`#FED7AA` / `#9A3412`) | Soft-removed from active list |

### Domain Model

A `Site` belongs to a `Workspace` and optionally a `Folder`. It has many `Pages`, `Domains`, `ShareLinks`, `FormBlocks`, `FormSubmissions`, `SiteAnalytics`, `ActivityLogs`, `Redirects`, `SitePermissions`, and `PublishBuildJobs`.

---

## 2. Sites List Page

**Route:** `/dashboard/sites`
**Component:** `SitesPage` (client component)
**Purpose:** Central hub for browsing, filtering, organizing, and acting on all workspace sites.

### 2.1 Layout

```
+------------------------------------------------------------+
| "My Sites" heading                   [ViewToggle] [+ New Site] |
+------------------------------------------------------------+
| [All Sites (N)] [Folder1 (N)] ... [Archived (N)]  [+ Folder]  |
+------------------------------------------------------------+
| [Search...] [Published] [Draft] [Archived] [Sort v] [Filters v]|
+------------------------------------------------------------+
| Grid (3-col) or Table view of site cards                        |
+------------------------------------------------------------+
| Page X of Y (Z sites)             [Previous] [Next]            |
+------------------------------------------------------------+
| [Bulk Action Bar -- fixed bottom, appears when items selected] |
+------------------------------------------------------------+
```

### 2.2 View Modes

Toggled via `ViewToggle` component. Persisted to user preferences (`account.preferences.update`).

| Mode | Component | Layout |
|---|---|---|
| **Grid** | `SiteGrid` -> `SiteCardFull` | 3-column card grid |
| **List** | `SiteListView` | Full-width table with columns |

#### Grid Card (`SiteCardFull`)

- **Thumbnail area:** Placeholder with Globe icon (136px tall, `#F4F4F4` bg).
- **Checkbox:** Top-left overlay for multi-select. Supports shift+click range selection.
- **Body:** Site name (truncated), status badge, slug (`{slug}.buildrik.app`), page count, visitor count (30d), "Edited X ago" timestamp.
- **Hover overlay:** Bottom bar with "Edit" (links to `/editor/{id}`), "Manage" (links to `/dashboard/sites/{id}`), and context menu.
- **Click target:** Card body links to `/dashboard/sites/{id}`.
- **Selection ring:** Red 2px ring (`#E42313`) when selected.

#### List View (`SiteListView`)

Table columns:

| Column | Content |
|---|---|
| Checkbox | Select/deselect, header checkbox for select-all |
| Name | Site name (link to detail), slug below |
| Status | Colored badge pill |
| Pages | Page count |
| Visitors (30d) | Formatted number (K suffix at 1000+) |
| Domain | Custom domain or "--" |
| Last Edited | Relative time ("5m ago", "2h ago", "3d ago") |
| Actions | Context menu (three-dot) |

### 2.3 Search & Filters

**Component:** `SiteFilters`

#### Primary Filters (always visible)

| Filter | Type | Behavior |
|---|---|---|
| **Search** | Text input with search icon | Filters by site name (case-insensitive contains). Resets to page 1 on change. |
| **Status** | Chip toggle (Published / Draft / Archived) | Single-select; click again to deselect. |
| **Sort** | Dropdown | Options: Last edited, Name, Created date, Traffic, Pages count, Last published. Persisted to user preferences. |

#### Advanced Filters (collapsible panel)

Toggled by "Filters" button. Panel has `#FAFAFA` background.

| Filter | Type | Options |
|---|---|---|
| **Created by** | Dropdown | Lists workspace members (loaded via `team.list`) |
| **Date range** | Chip toggle | 7 days, 30 days, 90 days |
| **Template** | Dropdown | Lists all templates (loaded via `templates.list`) |
| **Custom domain** | Tri-state toggle | Undefined -> Has domain -> No domain -> Undefined |
| **Traffic** | Chip toggle | None, 1-100, 100-1K, 1K+ |
| **Clear all** | Link | Resets all advanced filters. Only visible when filters are active. |

Active advanced filters cause the "Filters" button border to turn red (`#E42313`).

### 2.4 Empty States

| Condition | Display |
|---|---|
| No sites exist, no filters active | Dashed border card: "No sites yet. Create your first site to get started." + "Create Site" CTA |
| Filters active, no results | Search icon + "No sites found. Try a different search term or filter." |

### 2.5 Pagination

- 12 items per page.
- Shows "Page X of Y (Z sites)" on left, Previous/Next buttons on right.
- Buttons disabled at boundaries.
- Changing any filter resets to page 1.

### 2.6 Loading State

6-item skeleton grid (3 columns x 2 rows) with pulsing placeholders (`#F4F4F4`, 208px tall rounded rectangles).

### 2.7 Context Menu

**Component:** `ContextMenu`

Triggered by three-dot icon on each site card/row. Click-outside dismisses.

| Action | Icon | Behavior |
|---|---|---|
| Edit | Pencil | Navigate to `/editor/{id}` |
| Manage | Settings | Navigate to `/dashboard/sites/{id}` |
| Rename | Type | Opens `RenameModal` |
| Duplicate | Copy | Calls `sites.duplicate` mutation |
| Move to Folder | FolderInput | (placeholder for future sub-menu) |
| Transfer Site | UserCheck | Opens `TransferModal` |
| Export Site | Download | (placeholder) |
| View Published | ExternalLink | Opens `publishedUrl` in new tab. **Disabled** if site is not PUBLISHED (tooltip: "Site is not published"). |
| Copy Site URL | Link2 | Copies `{slug}.buildrik.app` to clipboard |
| --- | --- | Divider before destructive actions |
| Archive | Archive | Calls `sites.archive` mutation |
| Delete | Trash2 | Opens `DeleteConfirmModal` |

Destructive actions (Archive, Delete) render in red (`#E42313`).

### 2.8 Modals

#### Create Site Modal (`CreateSiteModal`)

- **Fields:** Site Name (text input, default "My New Site").
- **Slug preview:** Live slugified preview (`{slug}.buildrik.app`). Debounced slug availability check (300ms delay) via `sites.checkSlug`. Shows green checkmark "Available" or red X "Taken".
- **AI credits:** Shown next to AI option. Displays `{used}/{limit} credits remaining` or "Upgrade for more" with lock icon when exhausted. Data from `dashboard.health` query.
- **Method options (3 buttons):**
  - Use a Template (icon: LayoutTemplate) -> triggers `onSubmit` with method "template"
  - Generate with AI (icon: Sparkles, red tint) -> triggers `onSubmit` with method "ai"
  - Start from Scratch (icon: Plus) -> triggers `onSubmit` with method "blank"
- **Cancel button:** Full-width at bottom.
- **Backdrop:** Click-to-dismiss.

#### Rename Modal (`RenameModal`)

- Pre-filled text input with current site name.
- Auto-focused.
- Cancel / Save buttons.
- Calls `sites.rename` mutation.

#### Delete Confirm Modal (`DeleteConfirmModal`)

- Warning banner (red background): "This action cannot be undone. Type **{siteName}** to confirm."
- Text input: must exactly match site name. Border turns green when matched.
- Delete button disabled until name matches.
- Calls `sites.delete` with `confirmName` parameter.
- Delete button styled dark red (`#7F1D1D`).

#### Transfer Modal (`TransferModal`)

- Loads eligible team members (ADMIN or EDITOR roles) via `team.list`.
- Custom dropdown selector showing member name and role.
- Confirmation message (yellow bg): "Transfer ownership of '{siteName}' to {memberName}. You will become an Editor on this site."
- Transfer button disabled until member selected or while pending.
- Calls `sites.transfer` mutation.
- On success: invalidates sites list, closes modal.

### 2.9 Mutations & Queries

| API Call | Type | Trigger |
|---|---|---|
| `sites.list` | Query | Page load, filter/sort/page change |
| `sites.folders.list` | Query | Page load (folder tabs) |
| `sites.create` | Mutation | Create modal submit |
| `sites.rename` | Mutation | Rename modal submit |
| `sites.delete` | Mutation | Delete modal confirm |
| `sites.archive` | Mutation | Context menu "Archive" |
| `sites.duplicate` | Mutation | Context menu "Duplicate" |
| `sites.bulk` | Mutation | Bulk action bar |
| `sites.folders.moveSite` | Mutation | Bulk "Move to Folder" |
| `sites.transfer` | Mutation | Transfer modal submit |
| `sites.checkSlug` | Query | Create modal (debounced) |
| `account.preferences.get` | Query | Initialize view mode/sort |
| `account.preferences.update` | Mutation | View mode or sort change |
| `dashboard.health` | Query | Create modal (AI credits) |
| `team.list` | Query | Transfer modal, advanced filters |
| `templates.list` | Query | Advanced filters |

---

## 3. New Site Page

**Route:** `/dashboard/sites/new`
**Component:** `NewSitePage` (client component)
**Purpose:** Multi-step site creation wizard with three paths: template, AI generation, or blank.

### 3.1 Entry Points

- "New Site" button on sites list page (opens create modal which redirects here based on method).
- Direct URL with optional `?method=template` or `?method=ai` query parameter to skip the choose step.

### 3.2 Views / Steps

The page manages an internal `view` state machine:

```
choose -> templates -> preview
       -> ai-type -> ai-pages -> ai-progress
       -> (blank: immediate create + redirect)
```

#### View: Choose Method (`choose`)

Centered card (max 600px) with three option buttons:

| Option | Description | Action |
|---|---|---|
| Use a Template | "Browse 50+ professionally designed templates" | Sets view to `templates` |
| Generate with AI | "Describe your site and let AI build it" | Sets view to `ai-type` |
| Start from Scratch | "Full creative control from the first pixel" | Calls `sites.create` with method "blank", redirects to `/editor/{id}` on success |

#### View: Template Gallery (`templates`)

**Component:** `TemplateGallery`

- Filters by category: ALL, PORTFOLIO, BUSINESS, BLOG, AGENCY, ECOMMERCE, RESTAURANT.
- Sort: popular, newest, alphabetical.
- Pagination (6 per page) with "Load More".
- Each template card has "Preview" and "Use" buttons.
- "Start with a blank site" fallback option.
- Back navigation returns to `choose`.

#### View: Template Preview (`preview`)

**Component:** `TemplatePreview`

- Full preview of selected template.
- Back button returns to gallery.
- "Use Template" button calls `templates.use` mutation, redirects to `/editor/{id}`.

#### View: AI Wizard Step 1 -- Business Type (`ai-type`)

**Components:** `WizardProgress` (step 1/3), `StepType`

- Progress indicator: 3-step breadcrumb.
- Selection of business type from `BUSINESS_TYPES` constant.
- "Next" button advances to `ai-pages`.

#### View: AI Wizard Step 2 -- Pages (`ai-pages`)

**Components:** `WizardProgress` (step 2/3), `StepPages`

- Suggests pages based on selected business type (from `BUSINESS_TYPES[type].pages`).
- User can customize page selection.
- "Back" returns to `ai-type`.
- "Generate" calls `templates.generate.create` mutation with business type, name, and page config.

#### View: AI Wizard Step 3 -- Generation Progress (`ai-progress`)

**Components:** `WizardProgress` (step 3/3), `GenerationProgress`

- Polls `templates.generate.status` every 2 seconds using `jobId`.
- Displays: status (QUEUED/BUILDING/etc), progress percentage, step list, error state.
- "Cancel" button calls `templates.generate.cancel`.
- "Retry" returns to `ai-pages`.
- On completion: "View Site" button navigates to `/editor/{siteId}`.

### 3.3 Mutations & Queries

| API Call | Type | Trigger |
|---|---|---|
| `templates.list` | Query | Template gallery view |
| `templates.get` | Query | Template preview view |
| `templates.use` | Mutation | "Use Template" button |
| `templates.generate.create` | Mutation | AI wizard generate |
| `templates.generate.status` | Query (polling) | AI progress view |
| `templates.generate.cancel` | Mutation | Cancel generation |
| `sites.create` | Mutation | "Start from Scratch" |

---

## 4. Site Detail Layout

**Route:** `/dashboard/sites/[id]/layout.tsx`
**Component:** `SiteDetailLayout`
**Purpose:** Shared layout wrapper for all site detail tabs.

### 4.1 Layout Structure

```
+------------------------------------------------------------+
| Dashboard > My Sites > {Site Name}          (Breadcrumb)    |
+------------------------------------------------------------+
| <- Back to My Sites                                         |
| {Site Name}  [status badge]  {slug}.buildrik.app            |
|                           [View Site] [Edit in Editor] [...] |
+------------------------------------------------------------+
| [Overview] [Settings] [SEO] [Domains] [Access] [Analytics] |
+------------------------------------------------------------+
| {Tab Content - children}                                    |
+------------------------------------------------------------+
```

### 4.2 Site Header (`SiteHeader`)

- **Back link:** "Back to My Sites" with left arrow, links to `/dashboard/sites`.
- **Title:** Site name in 22px bold.
- **Status badge:** Colored pill matching site status.
- **Published URL:** Globe icon + `{slug}.buildrik.app` (only if published, opens in new tab).
- **Action buttons:**
  - "View Site" -- links to `publishedUrl` in new tab. Disabled with tooltip when not published.
  - "Edit in Editor" -- red button, links to `/editor/{id}`.
  - "Publish" -- shown only when status is DRAFT and `onPublish` callback provided.
  - "Unpublish" -- shown only when status is PUBLISHED and `onUnpublish` callback provided.
  - Three-dot menu button (placeholder).

### 4.3 Tab Navigation (`TabNav`)

**Tabs (in order):**

| Tab | Segment | Route |
|---|---|---|
| Overview | `overview` | `/dashboard/sites/{id}` (default) |
| Settings | `settings` | `/dashboard/sites/{id}/settings` |
| SEO | `seo` | `/dashboard/sites/{id}/seo` |
| Domains | `domains` | `/dashboard/sites/{id}/domains` |
| Access | `access` | `/dashboard/sites/{id}/access` |
| Analytics | `analytics` | `/dashboard/sites/{id}/analytics` |

**Desktop (md+):** Horizontal tab bar with underline indicator. Active tab has red bottom border (`#E42313`) and red text.

**Mobile (<md):** Native `<select>` dropdown with chevron icon. Navigates via `router.push` on change.

### 4.4 Loading & Error States

- **Loading:** 3-tier skeleton: breadcrumb placeholder (48px), tab bar placeholder (40px), content placeholder (256px).
- **Not found:** Centered message: "Site not found. This site may have been deleted or you don't have access."

### 4.5 Data Dependencies

| API Call | Type | Purpose |
|---|---|---|
| `sites.get` | Query | Fetch site data for header/breadcrumb |

---

## 5. Overview Tab

**Route:** `/dashboard/sites/[id]` (default tab)
**Component:** `OverviewTab`
**Purpose:** Dashboard-style summary of site health, stats, form submissions, and recent activity.

### 5.1 Stat Cards (3-column grid, 6 cards)

| Card | Icon | Value | Extra |
|---|---|---|---|
| Total Pages | FileText | Page count | Subtitle: "{N} pages total" |
| Monthly Visitors | Eye | Formatted number | Trend arrow: green up or red down with % change |
| Last Published | Calendar | Relative time or "Never" | Subtitle: "by {username}" |
| Team Members | Users | Member count | Link: "Manage ->" to settings |
| Form Submissions | MessageSquare | "{N} this month" | Red badge if unread: "{N} unread" |
| Site Health | Heart | "{score}/100" | Color-coded: green (>70), orange (41-70), red (<=40) |

### 5.2 Health Score Panel

Expandable panel with composite progress bar always visible.

**Collapsed:** Shows "Health Score" label + numeric score + progress bar.

**Expanded (click to toggle):** 2-column grid of individual health metrics:

| Metric | Key | Icon | Links to |
|---|---|---|---|
| SEO | `seo` | Search | `/dashboard/sites/{id}/settings` |
| Content Fill | `content` | FileCheck | `/dashboard/sites/{id}/settings` |
| SSL | `ssl` | Shield | `/dashboard/sites/{id}/domains` |
| Favicon | `favicon` | Image | `/dashboard/sites/{id}/settings` |

Each metric card shows: icon, label, score percentage, individual progress bar. Color logic: green >70%, orange 41-70%, red <=40%.

**Health score formula (server-side):**
```
healthScore = round(seoScore * 0.3 + contentScore * 0.3 + sslScore * 0.2 + faviconScore * 0.2)
```

Where:
- `seoScore` = (pages with seoTitle AND seoDescription) / totalPages * 100
- `contentScore` = (pages with non-empty blocks) / totalPages * 100
- `sslScore` = 100 if any domain has `sslStatus: "ACTIVE"`, else 0
- `faviconScore` = 100 if `touchIcon` is set, else 0

### 5.3 Form Blocks Section

Shown only when `formBlocks.length > 0`.

- Header: "Form Blocks" with "View All Submissions" link.
- Accordion list of form blocks. Each item shows:
  - Form name with MessageSquare icon.
  - Submission count.
  - Expandable: shows count summary and "View details" link to `/dashboard/sites/{id}/submissions?form={formId}`.

### 5.4 Submissions Table

Shown only when `formBlocks.length > 0`.

**Header row:** "All Submissions" + form filter dropdown + "Export CSV" button.

**Table columns:**

| Column | Content |
|---|---|
| Submitted | Date/time formatted as "Mar 25, 02:30 PM" |
| Form | Form block name |
| Data Preview | First 2 key-value pairs, truncated at 30 chars each |
| Status | Badges: "Unread" (blue), "Spam" (red) |

**Row click:** Opens `SubmissionDrawer`.

**Pagination:** Previous/Next with page counter. 20 items per page.

**Export CSV:** Downloads all visible submissions as CSV. Columns: ID, Submitted, Form, all dynamic data keys, Read, Spam, Archived.

### 5.5 Submission Drawer (`SubmissionDrawer`)

Right-side slide-over panel (480px wide) with overlay backdrop.

**Sections:**

1. **Form Data:** Key-value pairs from submission data.
2. **Metadata:** Submitted date, Form name, Source URL, IP address (masked: `xxx.xxx.xxx.xxx` -> last octet hidden).
3. **Status toggles:** Read (toggle), Spam (toggle), Archived (toggle). Each uses a custom switch component.
4. **Delete button:** Full-width red button at bottom (conditional on `onDelete` prop).

**Interactions:**
- Escape key closes drawer.
- Clicking overlay closes drawer.
- Opening drawer auto-marks submission as read.
- Toggle changes call `forms.updateSubmission` mutation.
- Delete calls `forms.deleteSubmission` mutation, closes drawer on success.

### 5.6 Recent Activity

- Header: "Recent Activity".
- Timeline list (max 5 entries). Each entry: red dot + description text + relative timestamp.
- Empty state: "No activity yet. Start editing to see updates here."

### 5.7 Error State

Centered error card with "Failed to load site details" message, Retry button, and "Back to My Sites" link.

### 5.8 Queries & Mutations

| API Call | Type | Trigger |
|---|---|---|
| `siteDetail.overview` | Query | Page load |
| `forms.listSubmissions` | Query | When form blocks exist |
| `forms.updateSubmission` | Mutation | Drawer toggles, row click (mark read) |
| `forms.deleteSubmission` | Mutation | Drawer delete button |

---

## 6. Settings Tab

**Route:** `/dashboard/sites/[id]/settings`
**Component:** `SettingsTab`
**Purpose:** General site configuration, favicon, password protection, custom code, and social links.

### 6.1 Sections

#### General

| Field | Type | Validation | Notes |
|---|---|---|---|
| Site Name | Text input | -- | "This appears in browser tabs and search results" |
| Slug | Text input | -- | Shows live preview: `{slug}.buildrik.app` |

#### Favicon & Icons

| Field | Type | Notes |
|---|---|---|
| Favicon | File upload (ICO, PNG, SVG, max 500KB) | Shows 3 previews: 16px, 32px, 64px. Uses presigned upload flow. |
| Touch Icon | File upload (PNG only, 180x180) | "Auto-generated from favicon if not set". Single 60px preview. |

**Upload flow:** `upload.presign` -> PUT to S3 URL -> `upload.confirm` -> CDN URL returned.

#### Site Password (Pro-gated)

- Toggle switch: "Require password to view published site".
- When enabled: text input for password.
- **Free plan:** Disabled with "Available on Pro" banner and 50% opacity overlay.
- Saves as `publishedPassword` (null when disabled).

#### Custom Code (Pro-gated)

| Field | Type | Notes |
|---|---|---|
| Head Code | Textarea (monospace, 4 rows) | "Injected before `</head>`. Max 10KB." |
| Body Code | Textarea (monospace, 4 rows) | "Injected before `</body>`. Max 10KB." |

Both fields disabled on Free plan with "Available on Pro" overlay.

#### Social Links

Dynamic list of social platform URL inputs.

**Supported platforms:** Twitter/X, Instagram, LinkedIn, YouTube, GitHub.

- Each visible platform has: label, URL input, "Remove" button.
- "+ Add Social Link" button adds next available platform.
- Only non-empty URLs are saved (empty strings filtered out).

### 6.2 Save Action

Single "Save Changes" button at bottom. Calls `siteDetail.settings.update` with all field values.

### 6.3 Business Rules

- Slug changes are tracked: old slug recorded in `SlugHistory` table for 301 redirect support.
- Pro-gated features (password, custom code) are visually disabled on Free plan but the gate is UI-only -- the toggle and inputs are wrapped in `pointer-events-none` + `opacity-50`.

### 6.4 Queries & Mutations

| API Call | Type | Trigger |
|---|---|---|
| `siteDetail.settings.get` | Query | Page load |
| `siteDetail.settings.update` | Mutation | Save button |
| `upload.presign` | Mutation | File upload |
| `upload.confirm` | Mutation | After S3 PUT |

---

## 7. SEO Tab

**Route:** `/dashboard/sites/[id]/seo`
**Component:** `SeoTab`
**Purpose:** Search engine optimization settings with live previews.

### 7.1 Sections

#### Meta Tags

| Field | Type | Validation |
|---|---|---|
| Meta Title | Text input | Max 60 chars. Character counter turns red when exceeded. |
| Meta Description | Textarea (3 rows) | Max 160 chars. Character counter turns red when exceeded. |

#### Google Search Preview

Live preview card simulating a Google search result:
- Title: blue link text (meta title or "Page Title" placeholder)
- URL: green text (`{slug}.buildrik.app`)
- Description: gray text (meta description or "No description set")

#### Meta Title Template

- Text input with current template value.
- Default: `{page_title} | {site_name}`.
- Hint: "Applies to all pages. Use `{page_title}` and `{site_name}` as placeholders."

#### Social Share Image (og:image)

- File upload (JPG/PNG, max 2MB, recommended 1200x630px).
- Uses presigned upload flow (same as favicon).
- When image is set, displays two live preview cards:
  - **Twitter/X Preview:** 504px wide, 252px image, white card bg.
  - **Facebook Preview:** 524px wide, 274px image, `#F0F2F5` card bg with description text.

### 7.2 Save Action

"Save SEO" button. Sends `metaTitle`, `metaDescription`, `metaTitleTemplate` to `siteDetail.settings.update`.

### 7.3 Queries & Mutations

| API Call | Type | Trigger |
|---|---|---|
| `siteDetail.settings.get` | Query | Page load |
| `siteDetail.settings.update` | Mutation | Save button |
| `upload.presign` | Mutation | OG image upload |
| `upload.confirm` | Mutation | After S3 PUT |

---

## 8. Domains Tab

**Route:** `/dashboard/sites/[id]/domains`
**Component:** `DomainsTab`
**Purpose:** Connect and manage custom domains with DNS verification and SSL provisioning.

### 8.1 Connect Domain Section

- Text input for domain name (placeholder: "www.example.com").
- "Connect" button: calls `siteDetail.domains.connect` mutation.
- **DNS Provider Guides:** Row of linked buttons to external documentation:
  - Cloudflare, GoDaddy, Namecheap, Google Domains.

**On connect:** Creates domain record with status PENDING, provisions two CNAME DNS records:
- `@` -> `sites.buildrik.app`
- `www` -> `sites.buildrik.app`

### 8.2 Domain Table

Table columns:

| Column | Content |
|---|---|
| Domain | Globe icon + domain name |
| Status | Badge: `VERIFIED` (green), `PENDING` (yellow), `FAILED` (red) |
| SSL | Expandable: shield icon + status text. Click expands detail panel. |
| Primary | Star badge if primary; "Set as Primary" button if not |
| Actions | Trash icon to remove |

**SSL Detail Panel (expanded):**
- Status: Valid / Provisioning
- Issuer: Let's Encrypt
- Expiry: Auto-renewed / Pending verification
- Auto-renew: Enabled

### 8.3 Polling Behavior

When any domain has `status: "PENDING"`, the domains list query re-fetches every 30 seconds to check for DNS verification completion.

### 8.4 Business Rules

- A domain can only be connected to one site globally. Attempting to connect an in-use domain throws `DOMAIN_IN_USE`.
- Setting a new primary domain first unsets all others for that site, then marks the selected one.
- Removing a domain deletes it entirely (cascade to DNS records).

### 8.5 Queries & Mutations

| API Call | Type | Trigger |
|---|---|---|
| `siteDetail.domains.list` | Query | Page load + 30s polling when pending |
| `siteDetail.domains.connect` | Mutation | Connect button |
| `siteDetail.domains.remove` | Mutation | Trash icon |
| `siteDetail.domains.setPrimary` | Mutation | "Set as Primary" button |

---

## 9. Access Tab

**Route:** `/dashboard/sites/[id]/access`
**Component:** `AccessTab`
**Purpose:** Create and manage password-protected share links for client review.

### 9.1 Share Links

Header with "Share Links" title + "New Link" button.

#### Create Link Form (toggle panel)

| Field | Type | Notes |
|---|---|---|
| Link name | Text input | Placeholder: "Link name (e.g. Client Review)" |
| Password | Password input | Optional. Disabled with "upgrade to PRO" text when `allowPasswords` is false. |
| Expiry | Chip selector | Options: 1 day, 7 days, 30 days, 90 days, No expiry. Options beyond `maxExpiryDays` are disabled with "(upgrade)" suffix. |

"Create Link" button submits to `siteDetail.sharing.create`.

#### Share Link List

Each link card shows:

| Element | Content |
|---|---|
| Name | Link name (bold) |
| View count | Eye icon + "{N} views" |
| Password indicator | Lock icon + "Password" (if password set) |
| Expiry | Calendar icon + "Expires {date}" (if expiry set) |
| Created date | "Created {date}" |
| QR Code button | Toggles inline QR code display |
| Copy button | Copies `preview.buildrik.app/share/{token}` to clipboard |
| Revoke button | Trash icon, calls `siteDetail.sharing.revoke` |

**QR Code display:** Inline expandable panel with canvas-rendered QR code (120x120px) and URL text below.

**Empty state:** "No share links yet. Create one to share this site with clients."

### 9.2 Plan-Based Constraints

Fetched via `siteDetail.overview` query to determine workspace plan.

| Feature | Constraint |
|---|---|
| `maxExpiryDays` | Limits available expiry options. Plan-dependent. |
| `allowPasswords` | Boolean. When false, password field is disabled. |

### 9.3 Business Rules (Server-Side)

- Share link tokens are UUIDs (`crypto.randomUUID()`).
- Passwords are bcrypt-hashed before storage.
- Expiry exceeding plan limit throws `EXPIRY_EXCEEDS_PLAN`.
- Revoking sets `isActive: false` (soft delete).
- Only active links are returned by list query.

### 9.4 Queries & Mutations

| API Call | Type | Trigger |
|---|---|---|
| `siteDetail.sharing.list` | Query | Page load |
| `siteDetail.sharing.create` | Mutation | Create form submit |
| `siteDetail.sharing.revoke` | Mutation | Revoke button |
| `siteDetail.overview` | Query | Plan limit lookup |

---

## 10. Analytics Tab

**Route:** `/dashboard/sites/[id]/analytics`
**Component:** `AnalyticsTab`
**Purpose:** Traffic analytics dashboard with time series, sources, and geographic data.

### 10.1 Date Range Selector

Horizontal button group:

| Option | Value |
|---|---|
| Today | `today` |
| Yesterday | `yesterday` |
| 7 days | `7d` (default) |
| 30 days | `30d` |
| 90 days | `90d` |

Active button: red bg (`#FEF2F2`) with red text (`#E42313`).

**Plan clamping:** Server clamps requested range to plan's `analyticsRetentionDays` limit. Allowed range is returned as `clampedRange`.

### 10.2 Metric Cards (3-column grid)

Dynamic cards from server response. Each shows:
- Label (gray text)
- Value (bold, 20px)
- Change percentage (green up arrow or red down arrow)

### 10.3 Traffic Overview Chart

Bar chart visualization of `timeSeries` data.

- Bars fill proportionally to max visitor count.
- Bar color: `#E42313` at 70% opacity.
- Hover tooltip: `{date}: {visitors} visitors`.

### 10.4 Traffic Sources & Countries (2-column grid)

| Panel | Content |
|---|---|
| **Traffic Sources** | List of source + percentage rows |
| **Top Countries** | List of country + count (percentage) rows |

### 10.5 Empty & Loading States

| State | Display |
|---|---|
| Loading | 6 skeleton cards (3x2 grid) |
| No data (time series empty) | BarChart3 icon + "No analytics data yet. Analytics will appear here once your site starts receiving visitors." |
| Null data | Dashed border: "No analytics data yet. Publish your site to start tracking visitors." |

### 10.6 Server-Side Data Model

Analytics query aggregates from:
- `siteAnalytics` table: date, visitors, uniqueVisitors, pageViews, avgSession, bounceRate.
- `analyticsEvent` table (grouped): referrer -> traffic sources, country -> top countries.

### 10.7 Queries

| API Call | Type | Trigger |
|---|---|---|
| `siteDetail.analytics` | Query | Page load, range change |

---

## 11. Publish Page

**Route:** `/dashboard/sites/[id]/publish`
**Component:** `PublishPage`
**Purpose:** Multi-phase publishing workflow: pre-flight checks, build progress, and success confirmation.

### 11.1 Phase State Machine

```
checks -> publishing -> success
       -> error -> checks (retry)
```

### 11.2 Phase: Pre-Publish Checks

**Component:** `PrePublishChecks` (modal overlay)

Runs 5 automated checks via `sites.prePublishChecks`:

| Check | Pass Condition | Fail/Warning |
|---|---|---|
| Pages ready | At least 1 page exists | **Fail** if 0 pages |
| SEO configured | `metaTitleTemplate` is set | Warning if missing |
| Domain connected | At least one VERIFIED domain | Warning: will use buildrik.app subdomain |
| Empty pages | All pages have content blocks | Warning: lists count of empty pages |
| Favicon | `touchIcon` is set | Warning: browsers show default icon |

**Status icons:** Green checkmark (pass), Yellow triangle (warning), Red X (fail).

**Publish blocked:** If any check has status `fail`, the Publish button is disabled.

**Notify team checkbox:** "Notify team members when published" -- passed to publish handler.

**Buttons:** Cancel (returns to previous page via `router.back()`) / Publish.

### 11.3 Phase: Publishing Progress

**Component:** `PublishProgress`

- Polls `sites.publishStatus` every 2 seconds.
- **Progress bar:** Red fill (`#E42313`) with percentage text.
- **Step list (5 steps):**
  1. Generating pages
  2. Optimizing images
  3. Deploying to CDN
  4. Verifying SSL
  5. Performance check

Step indicators: green checkmark (done), red spinner (active), gray circle (pending), red X (failed).

If server provides `steps` array, uses those. Otherwise derives step from progress percentage.

**Cancel flow:** "Cancel publish" text link -> confirmation inline panel ("Cancel this publish?" + Yes/No buttons) -> calls `sites.cancelPublish`.

**Error state:** Red error card with message + "Retry" button (re-fetches status).

**Completion:** Auto-detected when `status === "COMPLETED"`. Calls `onComplete` callback, advances to success phase.

### 11.4 Phase: Success

**Component:** `PublishSuccess`

- Large green checkmark icon.
- "Site Published!" heading.
- **Live URL row:** Buildrik URL (`https://{slug}.buildrik.app`) with copy and external link buttons.
- **Custom domain row:** Shown if a verified domain exists.
- **Lighthouse Score:** Placeholder with spinner ("Calculating...").
- **CTA grid (2x2):**
  - Share with Client -> `/dashboard/sites/{id}/sharing`
  - View Analytics -> `/dashboard/sites/{id}/analytics`
  - Edit Site -> `/dashboard/sites/{id}`
  - Dashboard -> `/dashboard/sites`

### 11.5 Phase: Error

Centered error message with site-specific error text and "Try Again" button (resets to checks phase).

### 11.6 Server-Side Publish Flow

1. Check no existing active publish job (QUEUED/BUILDING/DEPLOYING). Throws `ALREADY_PUBLISHING` if found.
2. Create `PublishBuildJob` record (status: QUEUED, progress: 0).
3. Update site: status -> PUBLISHED, set `lastPublishedAt` and `lastPublishedBy`.
4. Trigger notification to workspace owner (`SITE_PUBLISHED`).
5. (Background worker processes the job through build stages.)
6. On completion: update job status, set site `publishedUrl`.

**Cancel:** Only cancellable in QUEUED or BUILDING status. Sets status to CANCELLED.

**Unpublish:** Separate endpoint. Sets site status back to DRAFT, clears `publishedUrl`.

### 11.7 Queries & Mutations

| API Call | Type | Trigger |
|---|---|---|
| `sites.get` | Query | Derive slug/domain info |
| `siteDetail.domains.list` | Query | Check for verified custom domain |
| `sites.prePublishChecks` | Query | Checks phase |
| `sites.publish` | Mutation | Publish button |
| `sites.publishStatus` | Query (2s poll) | Publishing phase |
| `sites.cancelPublish` | Mutation | Cancel button |

---

## 12. Folder Management

### 12.1 Folder Tabs

**Component:** `FolderTabs`
**Location:** Sites list page, below header.

Tab bar with:
- "All Sites" tab (always first, `id: null`). Count = total sites from current query.
- One tab per folder. Count = `folder._count.sites`.
- "Archived" tab (special toggle, not a folder).
- "Create folder" button (FolderPlus icon, right-aligned).

**Interactions:**
- Clicking a folder tab filters the site list by `folderId`. Resets page to 1.
- Clicking "Archived" toggles `showArchived` state. Clears folder filter and resets page.
- Active tab has red bottom border indicator.
- Create folder: browser `prompt()` for name -> calls `sites.folders.create`.

### 12.2 Folder Service Operations

| Operation | Service Function | Behavior |
|---|---|---|
| List | `listFolders(workspaceId)` | Returns folders ordered by position, with site counts |
| Create | `createFolder(workspaceId, name)` | Throws `FOLDER_NAME_EXISTS` if duplicate name |
| Delete | `deleteFolder(folderId)` | Unlinks all sites (sets `folderId: null`), then deletes folder |
| Rename | `renameFolder(folderId, name)` | Updates folder name |
| Move site | `moveSiteToFolder(siteId, folderId)` | Sets site's `folderId` (nullable) |

### 12.3 API Endpoints

| API Call | Type |
|---|---|
| `sites.folders.list` | Query |
| `sites.folders.create` | Mutation |
| `sites.folders.delete` | Mutation |
| `sites.folders.rename` | Mutation |
| `sites.folders.moveSite` | Mutation |

---

## 13. Bulk Actions

### 13.1 Selection Mechanics

**Component:** `BulkActionBar` (fixed bottom bar)

- **Selection cap:** 25 items maximum (`BULK_SELECTION_CAP`). Warning toast shown when cap reached.
- **Single click:** Toggles individual selection.
- **Shift+click:** Range selection (selects all items between last selected and current click).
- **Select all (list view only):** Header checkbox toggles all items on current page (capped at 25).
- Selection state persists within the sites list page session. Cleared on bulk action completion.

### 13.2 Bulk Action Bar

Appears fixed at bottom center when `selectedCount > 0`. Shows:

```
[N selected] | [Publish All] [Unpublish All] [Archive All] [Move to Folder v] [Delete All] [Export All] [X]
```

| Action | Behavior |
|---|---|
| Publish All | Bulk sets status to PUBLISHED |
| Unpublish All | Bulk sets status to DRAFT |
| Archive All | Bulk sets status to ARCHIVED |
| Move to Folder | Opens dropdown of available folders. Each click moves all selected sites. |
| Delete All | Bulk soft-deletes (sets `deletedAt`) |
| Export All | (Placeholder) |
| X (clear) | Deselects all |

**Move to Folder dropdown:** Opens above the button. Lists all folders. "No folders available" shown if empty. Move calls `sites.folders.moveSite` per site (iterated).

### 13.3 Server-Side Bulk

`bulkAction(workspaceId, { action, siteIds })` -- Single `updateMany` Prisma call scoped to workspace. Returns `{ succeeded: string[], failed: string[] }`.

Supported actions: `archive`, `unarchive`, `publish`, `unpublish`, `delete`.

---

## 14. Business Rules & Constraints

### Plan Limits

| Feature | Enforcement Point |
|---|---|
| **Site count** | `createSite()`, `duplicateSite()` -- checks against `PLAN_LIMITS[plan].sites` |
| **Share link expiry** | `createShareLink()` -- validates `expiresInDays <= maxExpiryDays` |
| **Share link passwords** | UI-level disable on Access tab when `!planLimits.shareLinkPasswords` |
| **Analytics retention** | `getSiteAnalytics()` -- clamps date range to `analyticsRetentionDays` |
| **URL redirects** | `createRedirect()`, `importRedirects()` -- checks against `PLAN_LIMITS[plan].urlRedirects` |
| **Custom code injection** | UI-level disable (SettingsTab "ProGate" wrapper) |
| **Site password** | UI-level disable (SettingsTab "ProGate" wrapper) |

### Deletion Behavior

- **Site deletion:** Soft delete (`deletedAt` set). Also deactivates all share links and form blocks for the site. Requires exact name confirmation.
- **Folder deletion:** Hard delete. All sites in folder are unlinked (moved to "All Sites").
- **Domain removal:** Hard delete with cascade to DNS records.
- **Share link revocation:** Soft delete (`isActive: false`).

### Slug Management

- Auto-generated from site name via `slugify()`.
- Uniqueness enforced with up to 10 retry attempts (appending `-2`, `-3`, etc.), then timestamp fallback.
- Slug changes tracked in `SlugHistory` for 301 redirect support.
- Availability checked in real-time during site creation.

### Ownership Transfer

- Only the current owner (`createdBy`) can initiate transfer.
- Target must be an ADMIN or EDITOR in the same workspace.
- After transfer: original owner gets `EDITOR` role override via `SitePermission`.

### Publishing

- Only one active publish job per site (QUEUED/BUILDING/DEPLOYING states block new publishes).
- Cancel only allowed in QUEUED or BUILDING states.
- Workspace owner notified on publish start.
- Unpublish clears `publishedUrl` and resets status to DRAFT.

---

## 15. API Dependency Map

### Sites Router (`sites.*`)

| Endpoint | Type | Service |
|---|---|---|
| `sites.list` | Query | `sites.service.listSites` |
| `sites.get` | Query | `sites.service.getSite` |
| `sites.create` | Mutation | `sites.service.createSite` |
| `sites.rename` | Mutation | `sites.service.renameSite` |
| `sites.duplicate` | Mutation | `sites.service.duplicateSite` |
| `sites.archive` | Mutation | `sites.service.archiveSite` |
| `sites.unarchive` | Mutation | `sites.service.unarchiveSite` |
| `sites.delete` | Mutation | `sites.service.deleteSite` |
| `sites.bulk` | Mutation | `sites.service.bulkAction` |
| `sites.checkSlug` | Query | `sites.service.checkSlugAvailability` |
| `sites.transfer` | Mutation | `sites.service.transferSite` |
| `sites.prePublishChecks` | Query | `publish.service.runPrePublishChecks` |
| `sites.publish` | Mutation | `publish.service.startPublish` |
| `sites.publishStatus` | Query | `publish.service.getPublishStatus` |
| `sites.cancelPublish` | Mutation | `publish.service.cancelPublish` |
| `sites.unpublish` | Mutation | `publish.service.unpublishSite` |
| `sites.folders.list` | Query | `folder.service.listFolders` |
| `sites.folders.create` | Mutation | `folder.service.createFolder` |
| `sites.folders.delete` | Mutation | `folder.service.deleteFolder` |
| `sites.folders.rename` | Mutation | `folder.service.renameFolder` |
| `sites.folders.moveSite` | Mutation | `folder.service.moveSiteToFolder` |

### Site Detail Router (`siteDetail.*`)

| Endpoint | Type | Service |
|---|---|---|
| `siteDetail.overview` | Query | `site-detail.service.getSiteOverview` |
| `siteDetail.settings.get` | Query | `site-settings.service.getSiteSettings` |
| `siteDetail.settings.update` | Mutation | `site-settings.service.updateSiteSettings` |
| `siteDetail.domains.list` | Query | `domain.service.listDomains` |
| `siteDetail.domains.connect` | Mutation | `domain.service.connectDomain` |
| `siteDetail.domains.remove` | Mutation | `domain.service.removeDomain` |
| `siteDetail.domains.setPrimary` | Mutation | `domain.service.setPrimaryDomain` |
| `siteDetail.sharing.list` | Query | `share-link.service.listShareLinks` |
| `siteDetail.sharing.create` | Mutation | `share-link.service.createShareLink` |
| `siteDetail.sharing.revoke` | Mutation | `share-link.service.revokeShareLink` |
| `siteDetail.analytics` | Query | `analytics.service.getSiteAnalytics` |
| `siteDetail.redirects.list` | Query | `redirect.service.listRedirects` |
| `siteDetail.redirects.create` | Mutation | `redirect.service.createRedirect` |
| `siteDetail.redirects.update` | Mutation | `redirect.service.updateRedirect` |
| `siteDetail.redirects.delete` | Mutation | `redirect.service.deleteRedirect` |
| `siteDetail.redirects.import_csv` | Mutation | `redirect.service.importRedirects` |
| `siteDetail.redirects.export_csv` | Query | `redirect.service.exportRedirects` |

### Cross-Module Dependencies

| API Call | Used By | Module |
|---|---|---|
| `account.preferences.get/update` | Sites list | Account |
| `dashboard.health` | Create modal | Dashboard |
| `team.list` | Transfer modal, filters | Team |
| `templates.list/get/use` | New site page, filters | Templates |
| `templates.generate.*` | New site AI wizard | Templates |
| `upload.presign/confirm` | Settings, SEO tabs | Upload |
| `forms.listSubmissions` | Overview tab | Forms |
| `forms.updateSubmission` | Overview tab drawer | Forms |
| `forms.deleteSubmission` | Overview tab drawer | Forms |

---

## 16. Page Relationship Map

```
/dashboard/sites                          Sites List (hub page)
    |
    +-- (modal) Create Site Modal ------> /dashboard/sites/new (or direct create)
    |
    +-- /dashboard/sites/new              New Site Wizard
    |       |-- Template Gallery
    |       |-- Template Preview
    |       |-- AI Wizard (3 steps)
    |       +-- (redirects to) /editor/{id}
    |
    +-- /dashboard/sites/{id}             Site Detail Layout
            |-- / (default)               Overview Tab
            |-- /settings                 Settings Tab
            |-- /seo                      SEO Tab
            |-- /domains                  Domains Tab
            |-- /access                   Access Tab
            |-- /analytics                Analytics Tab
            |-- /publish                  Publish Flow

External navigations from Sites module:
    /editor/{id}          -- Edit in Editor (from card, header)
    /dashboard            -- Breadcrumb root
    {publishedUrl}        -- View published site (new tab)
```
