# Publish Tab

> **Module:** Sidebar — Tab 9
> **Source:** `src/editor/sidebar/tabs/publish/`
> **Keyboard Shortcut:** U
> **Generated:** 2026-03-25 | **Updated:** v2

## Overview

The Publish tab controls deploying the project to a live URL. Users can publish, unpublish, and view the live site status. Publishing is handled via a host app callback (the editor itself doesn't manage hosting infrastructure). **First-time experience guides users to connect hosting** before showing the publish button.

## Layout

### First-Time (No Hosting Connected)
```
+---------------------------+
| Publish                   |
+---------------------------+
| [illustration: rocket]    |
|                           |
| Connect your hosting to   |
| publish your site live.   |
|                           |
| [Connect Hosting →]       |
|                           |
| Supported:                |
| • Custom domain           |
| • Buildrik subdomain      |
| • Third-party hosting     |
+---------------------------+
```

### Connected State
```
+---------------------------+
| Publish                   |
+---------------------------+
| Status: [Draft / Published]|
+---------------------------+
| Published URL:            |
| https://my-site.buildrik  |
| .com          [Copy 📋]  |
+---------------------------+
|                           |
| [Publish Site]            |
|        or                 |
| [Unpublish]               |
|                           |
+---------------------------+
| Last published:           |
| March 24, 2026 at 3:45 PM|
|                           |
| Published by: Shah        |
+---------------------------+
```

## Fields

| Element | Type | Behavior |
|---------|------|----------|
| Status badge | Badge | "Draft" (gray) or "Published" (green) |
| Published URL | Text + Copy button | Live site URL; only shown when published |
| Publish button | Primary button | Triggers publish flow; visible to Owner and Editor roles |
| Unpublish button | Secondary button | Takes site offline; shown only when published |
| Last published | Timestamp | Date and time of most recent publish |
| Published by | User name | Who triggered the last publish |

## Interactions

### First-Time: Connect Hosting
- **Trigger:** Open Publish tab before hosting is configured
- **Behavior:** Onboarding state: illustration + explanation + "Connect Hosting" button → clicking opens hosting configuration flow (host app callback setup)
- **Rationale:** A disabled "Publish" button with no explanation is confusing. Guiding users to the integration step first prevents dead-end UX.

### Publish Site
- **Trigger:** Click "Publish Site" button
- **Behavior:** Button shows loading spinner → host app callback invoked with project data → on success: status changes to "Published", URL displayed, toast "Site published successfully" → on failure: error toast with retry option
- **Prerequisite:** Project must be saved (auto-saves before publish if dirty)
- **Role requirement:** Owner or Editor can publish. Viewers see a read-only status display.

### Unpublish Site
- **Trigger:** Click "Unpublish" button
- **Behavior:** Confirmation modal ("Your site will go offline") → on confirm: site taken down → status returns to "Draft" → URL hidden
- **Role requirement:** Owner or Editor can unpublish.

### Copy Published URL
- **Trigger:** Click copy icon next to URL
- **Behavior:** URL copied to clipboard → toast "URL copied"

## Business Rules

1. Publishing is delegated to a host app callback — the editor doesn't manage hosting
2. Project is auto-saved before publish to ensure latest changes are deployed
3. Unpublishing immediately takes the site offline
4. Published URL format is determined by the host app (custom domain or subdomain)
5. **Owner and Editor roles can publish/unpublish.** Viewers see read-only status.
6. **First-time experience shows "Connect Hosting" guidance** instead of a disabled publish button
7. "Published by" attribution tracks which team member triggered the deploy

## Screen Relationships
- **From:** Any screen (publish is a global project action)
- **Data coupling:** Publish uses ExportEngine to generate HTML + assets; respects all Settings tab configurations
