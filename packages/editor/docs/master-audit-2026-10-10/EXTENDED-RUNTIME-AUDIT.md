# Extended runtime audit — 10 October 2026

Scope: authenticated disposable site `cmv1z8k860002yulrh29dr5fw`, Chromium at 1280×720 (confirmed by viewport read and screenshot); the separate native demo used 1440×900. App code and tests are unchanged. Network timing occurred in a busy development environment and is not a production performance measurement.

## Media upload, failure fallback and reload

Created a synthetic 320×180 PNG (780 bytes) as an audit fixture. Assets → Manage assets → file input opened Upload files, with the correct filename/size and a confirmation. The pipeline converted it to WebP (988 bytes). The upload-prefix request and asset-upload endpoint returned 200; Vercel Blob PUT returned 200; `media.createAsset` returned **500**. Upload complete then said the WebP was in the library, while the library footer reported **1 not on the server**. This is a local success with failed remote registration, not an end-to-end cloud pass.

View asset exposed dimensions, alt text, image editing and Insert to canvas. Inserting closed the library and created image `el-mv2g8ftn-zfjetw1e8v`, rendered from a blob URL at natural dimensions 320×180. The image inspector showed its file and dimensions. Meta+S displayed Saving; the browser was reloaded before a settled Saved acknowledgement. This explicitly exercises recovery during an unsettled save rather than proving a completed server save.

After reload the quick chooser still listed the local asset, and the document still contained the same image element, but its `src` was absent and natural dimensions were 0×0. The editor subsequently showed Saved. Issues detected **Image has no file** and **Image is missing alt text**. The absent alt text was deliberately left empty in the fixture and is not an editor defect.

**RT-01 — P1, observed failed-sync recovery gap:** a device-local asset survives, but the inserted document image loses its source after reload in the tested failed-registration/unsettled-save sequence. Root cause is not isolated. The media registration HTTP 500 occurred alongside development console database-connectivity errors for localhost:5432; a subsequent socket check found PostgreSQL listening. Do not claim a permanent database outage, an upload algorithm defect, or a successful durable URL mapping from that evidence. Further acceptance: repeat after acknowledged save, with a deliberate remote refusal/offline fixture and reconnection; ensure local image identity can resolve its retained blob or present explicit recoverable missing-media feedback.

Evidence: `evidence/extended-media-runtime.json`. Cloud retry success, deletion/versioning, cross-device media use and successful remote persistence remain unverified.

## Canvas keyboard, multi-selection and grouping

- Selected the existing Heading and pressed Meta+D. A fresh sibling heading appeared (`el-mv2gc92o-u34k2ybjmj`). Meta+Z reduced heading count from two to one; Meta+Shift+Z returned it to two.
- Meta+A with canvas focus selected the four direct children: two headings, paragraph and image. Inspector showed 4 selected, Align, Distribute and Group.
- Activating Group created a new container (`el-mv2gdu8l-ezxqg59j07`) and moved those same four IDs beneath it in their prior order. Meta+Z removed the wrapper and restored all four as direct children of the original root (`el-27muk51pokt9n`) in the same order.
- This verifies one sibling grouping/undo sequence. It does not validate cross-parent/locked grouping, layout preservation in every display mode, or native drag gestures. The CLI returned a timeout for a Group activation although subsequent DOM inspection confirmed the mutation; no second Group was applied to compensate blindly.

The working canvas duplicate shortcut is separate from the previously recorded broken page-row shortcut (PAGE-01).

## Issues, Activity and Notifications

- Site menu → Issues opened the right column. It listed six findings: the missing image file, missing alt text, missing title template, no custom domain, one empty page and missing favicon. Both This page / Whole site controls were visible. No autofix or publish was executed.
- Activity opened with All / Edits / Comments / Publish filters, then reported **Couldn’t load activity** with Retry. This is observed error feedback; the event list happy path did not load in this attempt.
- Notifications opened a dialog with “You’re all caught up” and site-scoped empty-state copy. Escape closed it. No inbox item was opened, marked read or sent to anyone.
- Review was opened through its actual top-bar control; final load outcome is recorded in the appended continuation below. Review submission, emails, client sign-off and publishing are excluded from this runtime session.

These outcomes evaluate the tested paths; they do not close unexecuted multi-role/provider/cross-browser coverage. The master gate report must retain those boundaries explicitly.

## Review, Brand and preview continuation

Review finished loading with **Couldn’t load this review round**, explanatory text that the review list alone failed, and Try again. No review submission or message was sent. Site preview loaded the two headings and paragraph in its iframe; the actual sandbox was `allow-same-origin` without scripts. This is a content-preview observation, not a live interaction-trigger pass.

Brand → Colours → `color-page-background` → Change opened its picker. Applied `#FFF4CC` and returned to canvas: the bound root background computed to `rgb(255, 244, 204)`. Meta+Z restored `transparent` / `rgba(0, 0, 0, 0)`; Meta+Shift+Z restored the edited color. Meta+S reached Saved before reload. After reload the same token and computed color remained, with Saved feedback. This closes the tested token-propagation/undo/redo/save/reload happy path. It does not test every token type, restore-point operation or migration.

Settings opened as a full workspace with explicit Site and Workspace destination groups and Owner role copy. General showed Loading settings, then loaded. Changed only the disposable site's Author to `Buildrick audit 1010`. At 1280×720 the development Agentation floating toolbar intercepted the Save button's pointer position (`elementFromPoint` identified that toolbar). Keyboard Tab navigation to Save and Enter succeeded; the workspace reported All changes saved and disabled Save. After browser reload, reopening General retained the exact Author value. This verifies the tested settings save/reload path; provider configuration and other settings categories remain source/contract coverage in WORKSPACES-SERVICES-COVERAGE.md. The development overlay collision is environment-specific evidence, not a verified production overlay defect.

## Native drag investigation: explicitly incomplete

The browse CLI lacks a drag action, so an isolated Playwright browser was launched against the existing Vite demo at `127.0.0.1:5050`, with a new disposable browser context. Sandbox launch failed; an escalated launch then hit a 90-second cold-navigation timeout. After HTTP readiness returned 200, a new session reached the real editor. The native attempt used Playwright `locator.dragTo`, not an injected DOM event or engine mutation.

The first target was the empty page root, whose element box was not visible; Playwright refused the target. That is an invalid locator/geometry attempt and not a product drag failure. A second native attempt targeted the visible canvas at x180/y100 with the current 61% zoom. No completion/result was obtained; the audit process was interrupted (exit 130) rather than marked passed. The last complete snapshot still had an empty root. `evidence/native-start.json` and `native-after-drag.json` capture the complete states obtained; no successful native-drag screenshot or result is claimed. The exact cause of the unresponsive attempt is not isolated.

Source and existing drag/drop contracts are assessed in CANVAS-INSPECTOR-COVERAGE.md. Real native before/inside/after, zoom/scroll and cancel coverage remains an explicit tool/runtime verification blocker for subsequent QA. This audit does not substitute keyboard insertion or mocked geometry for a native gesture pass.

## Phase 4 capture continuation — IA-06: Issues masks Activity navigation

**Observed by the coordinating browser session:** while Issues was visible, clicking Site menu → Activity log (`site-menu-activity-log`) completed, but repeated DOM snapshots still showed Issues. Clicking the Issues back control (`issues-back-label`) then revealed Activity in its loading state. This sequence changed navigation state only; no user data was mutated. It establishes the concealed Activity transition, not a successfully loaded activity feed.

**Verified source chain:** `SiteMenu.tsx:118–120,185` closes the menu and invokes `onOpenActivity`; `StudioHeader.tsx:866` forwards that callback. `AquibraStudio.tsx:718` calls `guardedOpenLeftPanelToTab("activity")`. The guard at `hooks/useTabSwitchGuard.ts:117–124` reaches `hooks/useStudioState.ts:353–356`, setting the panel open and active tab to Activity. None of this clears the separate `issuesOpen` state owned by `AquibraStudio.tsx:223`. In `StudioPanels.tsx:956–962`, Issues has render priority over `rightColumnTab`; its back handler clears Issues at lines 957–959, exposing the already-selected Activity panel. Paths in this paragraph are under `src/editor/shell/`.

This is a concrete runtime manifestation of existing **IA-06 — surface routing has multiple sources of truth**, supported by the current render chain; no new finding ID is added. The same precedence also affects other right-column task tabs in source, but Publish, Review and History were **not runtime-tested in this sequence**. UX-24 concerns inconsistent full-workspace exit presentation and is not the matching defect. No implementation fix was made.
