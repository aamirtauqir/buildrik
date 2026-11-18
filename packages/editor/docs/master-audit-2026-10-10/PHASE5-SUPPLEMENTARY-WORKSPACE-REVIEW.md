# Phase 5 supplementary workspace and entry review

10 October 2026. Five additional native desktop workflow states and one paired validation specimen are delivered on TO-BE page `8312:2`. These supplement the [twelve dedicated workspaces](PHASE5-WORKSPACE-DESIGN-REVIEW.md). They are proposed design states and source-grounded behavior contracts, not backend/runtime verification. All original and AS-IS pages remain intact.

## Native delivery

| Design ID | State | Figma | Reviewed export |
|---|---|---|---|
| TB-G01 | Media quick chooser | [Native frame](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8318-751) | [PNG](evidence/tobe-workspace-validation/TB-G01.png) |
| TB-G02 | Site menu | [Native frame](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8318-911) | [PNG](evidence/tobe-workspace-validation/TB-G02.png) |
| TB-G03 | History restore safety-copy guard | [Native frame](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8318-1141) | [PNG](evidence/tobe-workspace-validation/TB-G03.png) |
| TB-G04 | Export format and options | [Native frame](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8318-1310) | [PNG](evidence/tobe-workspace-validation/TB-G04.png) |
| TB-G05 | CMS first collection draft validation | [Native frame](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8318-243842) | [PNG](evidence/tobe-workspace-validation/TB-G05.png) |
| TB-G06 | General settings validation timing | [Native frame](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8318-244095) | [PNG](evidence/tobe-workspace-validation/TB-G06.png) |

TB-G01–05 are 1440×900. TB-G06 is a 1440×650 comparative specimen, not a sixth full workspace. [The supplementary ledger](evidence/figma-tobe-workspaces-supplementary.json) records native IDs, actions, forms, content fills, disabled controls and mutations.

## Source and behavior trace

### TB-G01 — Quick Media choice

UX-20 and IA-06/07: one asset library supplies the compact chooser and TB-W03 full workspace. Select highlights a card without committing the property; Use image applies to the captured Home / Hero image target. Manage full library transfers that target, selected asset and query, so full-library return restores the same Inspector field. Upload opens the existing TB-W05 queue/recovery destination. Library metadata persistence and document mutation remain separate (WS-01 / RT-01).

The source contract is captured in [AS-IS Media workspace states](AS-IS-WORKSPACE-STATE-SPEC.md) and [the workspace design specification](PHASE5-WORKSPACE-DESIGN-SPEC.md). The four raster fills are three content thumbnails and the website image itself; UI chrome is editable. The reviewed canvas selection outlines the image, not the heading.

### TB-G02 — Site tool menu

Settings, Templates, CMS and Export are proposed direct doors into the existing destination owners; they do not create additional managers. Current source [SiteMenu.tsx](../../src/editor/shell/SiteMenu.tsx) has Site settings and Export and dashboard/account/share actions. Templates/CMS placement here is explicitly the IA proposal rather than a claimed current menu label. Existing Issues/Activity/shortcuts/view-mode/live-site/unpublish/collaboration capabilities retain their documented root destinations and availability rules; this representative menu does not deprecate them.

Opening the menu is read-only. Share preview proceeds to a creation confirmation before a token request in the proposal; current AS-IS behavior automatically requests a token on its share opener. No token was created during this work. Dashboard links remain outward handoffs and role visibility remains authoritative. Escape closes the menu and restores site-trigger focus; menu arrows move among enabled items.

### TB-G03 — History restore safety guard

[VersionTimelineManager.ts:282](../../src/engine/VersionTimelineManager.ts:282) saves a version of the current work before importing a target snapshot and returns false when that save fails. [VersionHistoryPanel.tsx:196](../../src/editor/panels/VersionHistoryPanel.tsx:196) presents the stopped outcome; [its confirmation](../../src/editor/panels/VersionHistoryPanel.tsx:393) identifies draft pages/styles/saved site settings versus unaffected live site, CMS records, Media, saved components and server settings.

The native design is the recovery variant of that confirmation: named target, unchanged draft, failure explanation, Keep current draft and Try save and restore again. There is no restore-without-safety-copy bypass. Normal confirmation uses the same scope and Restore draft action; pending state disables duplicate requests; success offers Undo restore only when a verified safety-version ID is available. Those transitions are service contracts, not fake Figma restore outcomes. Closing returns focus to the originating History row.

### TB-G04 — Export capabilities

[ExportOptions.tsx:26](../../src/editor/export/ExportOptions.tsx:26) exposes HTML, ZIP and React, with Vue/Next.js disabled. JSON exists in types and label maps but is not a selectable format in this picker. The native dialog retains this exact availability. [OptionsPanel](../../src/editor/export/ExportOptions.tsx:160) supports page title, embedded/external/inline CSS, minify/reset/meta/viewport choices. CMS None/Embed Data/Template appears only with CMS bindings; Handlebars/Liquid is conditional on Template mode. No unrelated format or backend export mode is invented.

[ExportModal.tsx](../../src/editor/export/ExportModal.tsx) owns preview/code/options and idle/working/ready/error/retry download behavior. ZIP contains all pages, stylesheet and assets; React output targets an existing project. The shown HTML option does not publish. A working prototype may show format/tab choices and a labeled simulated busy/error state; it must not imply that Figma generated files. Export cancellation closes the dialog and restores focus, not a guaranteed cancellation of an already initiated browser download.

### TB-G05 — First CMS collection draft

[CmsWorkspace.tsx:202](../../src/editor/cms/CmsWorkspace.tsx:202) explicitly invites the first collection. [CMSCollectionSetupModal.tsx](../../src/editor/shell/modals/CMSCollectionSetupModal.tsx) currently uses one form: collection name, field names/types, add/remove with Undo, and an optional Generate a page per entry switch. It starts with a title/text field and excludes reference from this compact picker. It is not a working multistep wizard and has no independent URL-handle input. The slug pattern is derived from the name; template and SEO are configured later in Dynamic pages.

The source’s [fieldKeyError](../../src/editor/cms/fieldTypes.ts:38) detects duplicate keys before collection creation. The native example shows two title fields and the exact duplicate-key error, alongside Not created and the empty workspace’s zero saved counts. The inline placement and invalid field outline are a proposal improving the current error banner. Correct/remove the duplicate, retry Create, and navigate to the created collection only after service success. Missing service/permission/save errors retain the draft. Cancel clears this setup draft under its explicit leave/dirty contract; it does not undo unrelated document work. Name collisions retain the existing edit-or-use-free-name behavior and do not silently rename.

### TB-G06 — General settings validation timing

UX-21: the side-by-side specimen compares untouched fields with an interacted invalid draft, linked to TB-W08 (`8317:242436`) and its footer/return contract. [SiteSettingsScreen.tsx:53](../../src/editor/sidebar/tabs/settings/screens/SiteSettingsScreen.tsx:53) enforces trimmed site name length 2–100; [slug validation](../../src/editor/sidebar/tabs/settings/screens/SiteSettingsScreen.tsx:67) enforces 3–50 lowercase letters/numbers/hyphens; Author is optional. The example uses actual messages for a one-character name and malformed slug. Name absence uses neutral required guidance before interaction.

The current source renders nameError immediately; delaying its error presentation until interaction or submit attempt is the proposed fix, not observed runtime behavior. Validation truth can still disable unsafe submission without announcing untouched errors. Changed invalid values and server-refused slugs prevent saving; failure retains the draft. The error text is associated with its field, and the save attempt focuses the first invalid field. Red alone is insufficient. No new required Author field is invented.

## Review and bounded completion

All six exports were visually inspected after composition. Targeted corrections moved the Media selection outline from the shared shell heading to its actual image, aligned menu labels left, made modal backdrops cover the full editor, and converted related form/grid/menu content to Auto Layout. The final exported files passed PNG-signature and exact-dimension checks. Native readback found 886 descendants, 330 editable text nodes, 44 Auto Layout frames and 77 shared button instances. All text uses Inter; no text bounds extend beyond the six outer frames. This does not prove every nested constraint, semantic accessibility or constrained-width behavior.

There are 120 named action nodes, including repeated shell and disabled controls. Modal-covered controls must remain inert in the prototype; their presence in the ledger is not permission to wire through a scrim. These are action purposes for Phase 6, not implemented reactions. Every remaining complex/provider/server action needs its explicit simulation limitation; root owns that connection and action audit. The General specimen demonstrates timing, not an entire new Settings journey.

No app code, browser state, user project, remote service, publication, migration or test was changed. Existing source tests were read as context; no fresh app tests were run for these design artifacts. The parent owns the overall Phase 5 acceptance gate.
