# 13 — Accessibility & Usability

**Scope:** Prompt 13 only. It covers:
- semantic buttons, links and labels;
- keyboard use, focus and tab order;
- Escape;
- ARIA, dialogs, menus and tooltips;
- contrast;
- disabled states;
- target sizes;
- icon-only controls;
- avatars and presence;
- comment controls;
- invite and member controls.

Code covered: `packages/editor/src/editor/**`, `packages/editor/src/shared/forms`, `packages/dashboard/{app,components}`, and the collab engine where it decides what presence can show. Agent C, READ-ONLY run, 2026-09-25.

`E/` = `packages/editor/src/editor/`. `D/` = `packages/dashboard/`.

---

## Method & runtime status

**What I ran**

| Command | Result |
|---|---|
| **Scratch jsdom harness.** I wrote tests in my session scratchpad (outside the repo), run through a scratch vitest config layered over `packages/editor/vitest.config.ts`. Real components, real React, jsdom, `@testing-library/user-event`, and `dom-accessibility-api` for accessible names. **No repo file was touched.** | See the five probes below |
| **Probe 1:** `ModalRoot` + `ModalContent srTitle="…" aria-labelledby="t1"` + `ModalTitle id="t1"` | The `role="dialog"` element has **no** `aria-label` and **no** `aria-labelledby`. `getByRole("dialog", {name: /…/})` returns **null**. |
| **Probe 2:** dashboard `Modal` with an inline `onClose`. Opened from a focused trigger, then `user.keyboard("Recipes")` typed into a field. | Field value **`R`**. Focus ends on the dialog panel ("New folder"). With a `useCallback` `onClose`: value `Recipes`, focus still in the field. |
| **Probe 3:** the real `ShareDraftModal` (tRPC and toast mocked). Opened, then "Homepage" typed into the Name field. | Field value **`H`**. Focus ends on the dialog "Share Draft". |
| **Probe 4:** the real `LayerTreeItem` × 4 rows, focus on row A, ArrowDown pressed 3 times | Selection goes A→**B, B, B**. Focus stays on **A** every time. All 4 rows have `tabIndex=0`. |
| **Probe 5:** accessible name of the real `RenameModal` field, and of the dashboard `<label>` + `InputField` sibling pattern | `""` in all three cases (Rename, a password field, a text field) |
| `vitest run` of 6 existing overlay/a11y files (`Popover`, `Modal`, `ModalDescription.inset`, `Tabs`, `UpgradeModal`, dashboard `switch-a11y`) | 6 files, 40 tests, all passed |
| Static scans (Python over `.tsx`, heuristic) | 30 non-semantic `onClick` elements (triaged by hand below). 13 icon-only `<button>`/`<Button>` with no `aria-label` (8 are real misses). 69 dashboard and 78 editor form controls with no `aria-label`, `id` or wrapping `<label>`. |
| WCAG contrast computation (relative-luminance formula) on the token hex values | Listed in A13-15 and A13-19 |

**NOT RUNTIME VERIFIED**

- **No browser was used.** I did not test:
  - the screen-reader experience (VoiceOver, NVDA);
  - real focus rings;
  - measured target sizes;
  - rendered contrast;
  - `display: contents` accessibility-tree behaviour;
  - Playwright `target-size.spec.ts`.
- **jsdom is not a browser.** It confirms React effect and focus sequencing, and accname computation per `dom-accessibility-api`. Browsers may fall back to `placeholder` for an accessible name, which that library does not do, so A13-2's placeholder-only subset may read as the placeholder text in Chrome and Firefox.
- **Every consumer-level claim** in A13-1 other than `ShareDraftModal` is static: same pattern, not executed.
- **Collaboration presence is flag-gated** (`FEATURE_COLLAB`, off in production). Every presence finding is static.

---

## Output table (Prompt 13 format)

| # | Issue | File | Evidence | Impact | Recommendation | Priority |
|---|---|---|---|---|---|---|
| A13-1 | Typing in dashboard dialogs keeps only the first character | `D/components/dashboard/primitives/modal.tsx:27-70` + ≥7 consumers | The focus effect depends on `[open, onClose]`. An inline or per-render `onClose` re-runs it on every keystroke, so focus goes back to the trigger and then to the panel. Probes 2 and 3. | Share draft, use template, new folder, rename media, API token, marketplace config: **every user**, not only AT users | Read `onClose` through a ref (the editor's `useFocusTrap` fix) | **P1** |
| A13-2 | Form labels are not programmatically associated | dashboard ~69 / editor ~78 controls, e.g. `D/components/site-detail/settings-tab.tsx:373-387`, `D/components/settings/account-tab.tsx:155-160`, `E/shell/modals/CreateComponentModal.tsx:149-157` | A sibling `<label>` with no `htmlFor`, or none at all. Probe 5 gives name `""`. | Screen-reader users hear "edit text" (password fields included). Clicking the label does not focus the field. | Route fields through `FormField` (editor, which has `useId` + `htmlFor`). Give the dashboard `InputField` a `label` prop. | **P1** |
| A13-3 | Layers tree: arrow keys get stuck, and every row is a tab stop | `E/panels/layers/LayerTreeItem.tsx:155-166, 171-177` | ArrowDown calls `onSelect(next)` and never moves focus. Probe 4. There is no roving tabindex. The canvas has no keyboard traversal (`selectNextSibling`/`selectPrevSibling` have no callers). | Keyboard-only element selection falls back to Tab-walking about 3 stops per layer | Move focus with the selection and use a roving tabindex. Bind the sibling/parent traversal commands. | **P1** |
| A13-4 | 63 compound `ModalRoot` dialogs have no accessible name | `E/chrome-ui/ModalParts.tsx:57-88`, `OverlayMount.tsx:70-78` | The name sits on `ModalContent`, a generic div. The `role="dialog"` node gets nothing. Probe 1. | Screen readers announce "dialog" with no title (orphan comments, publish/exit confirm, CMS, export, delete element…) | Give `ModalRoot` a `labelledBy`/`srTitle` and pass it to `OverlayMount` | P2 |
| A13-5 | Pinning a comment is mouse-only. The dashboard comments page has no keyboard way to comment. | `E/canvas/comments/CommentLayer.tsx:411-422`; `D/components/comments/comment-preview.tsx:60,90-93` | The capture layer is a `<div onClick>`. The dashboard stage is a `<div onClick>`. Neither has a keyboard entry. | Keyboard and screen-reader users can't create element-anchored comments. On the dashboard they can't comment at all. | "Comment on selected element" command. A keyboard "Add comment" on the dashboard. | P2 |
| A13-6 | External reviewer page: the approve/request-changes confirm is not a dialog | `D/app/review/[token]/review-client.tsx:327-333, 374-420` | Plain `div` overlay with no `role`/`aria-modal`, no focus move, no Esc. It sits before the footer in the DOM. The notes textarea has no label. Timestamps are `#9CA3AF` (2.54:1). | The client sign-off flow the product exists to collect is disorienting for keyboard and screen-reader reviewers | Use the dashboard `Modal`, label the textarea, darken the metadata | P2 |
| A13-7 | Team/invite controls partly mouse-only, and the site-access choice is shown by colour only | `D/components/team/members-table.tsx:246-300`, `member-actions.tsx:28-76`, `invite-modal.tsx:189-214` | Row click → detail/select is on the `<tr>`. The select checkbox is `readOnly` + `pointer-events-none`. The actions trigger has no `aria-expanded` and no Esc. The "All sites / Specific sites" toggle has no `aria-pressed`. | Keyboard users can't bulk-select members or open member detail. Screen-reader users can't tell which site scope an invite grants. | Real checkbox with `onChange`, a row "View" button, `Menu` semantics, `aria-pressed` or a radio group | P2 |
| A13-8 | Dashboard overflow menus: no Escape, and ARIA contract mismatches | `D/components/sites/context-menu.tsx:43-76`, `team/member-actions.tsx`, `dashboard/shell/workspace-switcher.tsx`, `sites/folder-card-grid.tsx`, `clients/clients-view.tsx:289-300`; `E/design-system/ui/ExportDropdown.tsx:37` | `aria-haspopup="menu"` with no `role="menu"`. Esc count is 0. Menus close only on mousedown outside. | Keyboard users can't dismiss menus. Screen readers are promised a menu that isn't there. | One dashboard `Menu` primitive (Esc, focus-in, focus-return) | P2 |
| A13-9 | Dashboard ⌘K palette has no dialog/combobox/listbox semantics | `D/components/search/command-palette.tsx:421-450` | 0 × `role="dialog"`, `combobox`, `listbox`, `option`, `aria-activedescendant` | Arrowing results is silent for screen readers | Copy the editor palette's combobox wiring | P2 |
| A13-10 | Save-conflict dialog and inline confirm "alertdialogs" never receive focus | `E/shell/modals/ConflictModal.tsx:41-47`; `E/sidebar/tabs/review/ReviewTab.tsx:757-781, 990`; `E/panels/VersionHistoryPanel.tsx:364`; `E/sidebar/tabs/ai/AgentPlan.tsx:210`; `ReplaceAcrossDialog.tsx:179` | `aria-modal` with no focus move and no trap. Inline `role="alertdialog"` with no focus. | The conflict appears unprompted during autosave while focus stays behind it. Keyboard users must hunt for Reload/Overwrite. | Mount through `OverlayMount`. Focus the least-destructive button inside inline confirms. | P2 |
| A13-11 | Clickable rows and checkboxes that can't be focused | `E/media/components/AssetGrid.tsx:585-597, 675-700`; `E/sidebar/tabs/pages/components/PageRow.tsx:209-217`; `PageFolder.tsx:148`; `E/inspector/sections/interactions/InteractionItem.tsx:81`; `D/components/onboarding/dashboard-checklist.tsx:174-181`; `D/components/settings/integrations-content.tsx:58` | `role="checkbox"` spans with no `tabIndex` or key handler. `div`/`li` with `onClick` and no role or keyboard handler. | Full Media list view, page multi-select, editing an existing interaction, and checklist tasks are mouse-only | Use `<button>` / native checkbox | P2 |
| A13-12 | Icon-only buttons with no accessible name | `E/sidebar/tabs/ElementsTab.tsx:131,161`; `D/components/search/command-palette.tsx:448`; `sites/bulk-action-bar.tsx:97`; `theme/theme-manager.tsx:238`; `site-detail/submission-drawer.tsx:139`; `site-detail/submissions-panel.tsx:235,243` | `<button><X/></button>` with no `aria-label` or `title` | Screen readers announce "button" | Add `aria-label` | P2 |
| A13-13 | AI output is not announced | `E/sidebar/tabs/ai/ChatThread.tsx`, `ChatMessage.tsx:16-48` | No `role="log"`/`aria-live` on the thread. Only errors are `role="alert"`. | Screen-reader users don't hear the reply or know when a diff is ready to Apply | `role="log"` + a polite "response ready" | P2 |
| A13-14 | Toasts with actions auto-dismiss with no pause | `E/chrome-ui/Toast.tsx:231-238`; `D/components/dashboard/toast-provider.tsx:26-34` | Fixed 2–8 s timers with no hover or focus pause. Dashboard toasts create their live region on insert. | Toast "Undo" can't be reached by keyboard in time. Dashboard status toasts may not be announced. | Pause on hover/focus. Keep a persistent live container. | P3 |
| A13-15 | Presence gaps (flag-off in production) | `E/chrome-ui/Presence.tsx:97-121`; `E/canvas/overlays/RemoteCursorsOverlay.tsx:100`; `engine/collaboration/CollaborationManager.ts:37-46` | "+N" names are unreachable. `aria-label` on a role-less span. The live pill is about 2.93:1. Cursor labels are white on palette colours (1.53–2.98:1). Remote selection and locks are rendered nowhere. | Screen-reader and low-vision users can't tell who is present beyond 3, or who is editing what | See A13-15 | P3 |
| A13-16 | Controls below 24×24 outside the target-size gate's 12 probe cases | `E/shell/StudioFooter.tsx:259`; `E/sidebar/tabs/history/components/ActivityView.tsx:614`; `D/components/dashboard/toast.tsx:38`; `D/components/theme/theme-manager.tsx:238`; `D/components/comments/comment-preview.tsx:153` | `tw:h-5` (20px), `tw:h-4` (16px), `p-0.5`+16px icon, bare 14px/16px icons | Hard-to-hit targets. One is a destructive "Restore to…". | Extend `target-size.spec.ts` cases, or give each a min 24px | P3 |
| A13-17 | Dashboard navigation: no `aria-current`, unlabeled navs, no skip link | `D/components/dashboard/shell/sidebar.tsx:44-55,105-137`; `top-nav.tsx:49-79` | Active state is shown by colour, weight or underline only | Screen-reader users can't tell the current section. Keyboard users have no bypass. | `aria-current="page"`, `aria-label` per `<nav>`, a skip link | P3 |
| A13-18 | Editor rail: every tab is a tab stop, and the tabpanel is unnamed | `E/sidebar/LeftSidebar.tsx:155-161, 486-517, 636-700` | No roving tabindex. `role="tabpanel"` has no `aria-labelledby`. `<nav>` is overridden to `tablist`. | Extra tab stops. The panel is unnamed. | Roving tabindex + `aria-labelledby` | P3 |
| A13-19 | Contrast: muted ink on subtle backgrounds, and light-grey metadata | tokens `E/themes/tokens.generated.css:70,79`, `D/app/globals.css:121,133`; `review-client.tsx:361`; `dashboard-checklist.tsx:183` | `#6B7280` on `#F3F4F6` = 4.39:1. `#9CA3AF` on white = 2.54:1. `#C0C0C0` icon = 1.82:1. | Small secondary text fails AA on subtle surfaces | Use `ink-soft` on `bg-subtle`, and retire the `gray-400` text | P3 |
| A13-20 | No automated a11y checking | repo-wide | No `axe-core`, `jest-axe` or `eslint-plugin-jsx-a11y` in any `package.json` | Every finding above is found by hand, and regressions are silent | An axe pass in the probe/Playwright harness, plus jsx-a11y (warn) | P3 |

---

## Findings

### P0

None. Nothing in this concern is in the immediate-fix class (security, data loss, unauthorized action).

### P1

#### A13-1: Dashboard `Modal` steals focus on every re-render when `onClose` is not stable, so typing keeps one character

- **Severity:** P1.
- **File:line:**
  - Primitive: `D/components/dashboard/primitives/modal.tsx:27-70`:
    - `:31` captures `previouslyFocused`;
    - `:65` runs `if (panel && !panel.contains(document.activeElement)) panel.focus()`;
    - `:68` runs the cleanup `previouslyFocused?.focus?.()`;
    - `:70` has the deps `[open, onClose]`.
  - Consumers that re-render the `Modal` on each keystroke with a new `onClose`:
    - `D/components/site-detail/share-draft-modal.tsx:47,68,114,128` (`function handleClose` is rebuilt every render);
    - `D/components/templates/use-template-modal.tsx:83,108,188`;
    - `D/components/settings/api-tokens-tab.tsx:183` (the name input is at `:203-206`);
    - `D/app/dashboard/projects/page.tsx:746` (new folder, input `:770-773`);
    - `D/app/dashboard/marketplace/page.tsx:273` (config form `:324`);
    - `D/components/media/media-library.tsx:369,405` (inputs `:387-390`, `:423-426`).
- **Symbol:** `Modal` focus effect.
- **Evidence:**
  - The sequence on each keystroke:
    1. `setState` re-renders the parent.
    2. There is a new `onClose` identity.
    3. The effect cleanup focuses the trigger behind the scrim.
    4. The new effect captures that trigger as `previouslyFocused`, sees the panel doesn't contain it, and runs `panel.focus()`.
    5. The next keystroke lands on the panel.
  - Probe 2 (primitive): typing "Recipes" left `R`, with focus on the dialog. With a `useCallback` `onClose` it left `Recipes`.
  - Probe 3 (real `ShareDraftModal`): typing "Homepage" left `H`, with focus on the dialog "Share Draft".
  - There is no dashboard `Modal` test (`primitives/__tests__` has only `button-hover` and `select-field`).
  - The editor's `useFocusTrap` fixed exactly this bug (`E/chrome-ui/focus.ts:19-34`, "the CMS collection wizard accepted "R" of "Recipes"… Reproduced live"). The dashboard copy never got the fix.
- **Expected behavior:** Focus stays in the field while typing. Focus is pulled in once, on open.
- **Root cause:** An effect keyed on a callback identity that callers don't memoize.
- **Affected modules:**
  - Sharing (draft links);
  - Templates (use template → site name);
  - Settings (API tokens);
  - Projects (folders);
  - Marketplace;
  - dashboard Media library.
  - Any future inline-`onClose` dialog.
- **Recommendation:** Hold `onClose` in a ref (same pattern as `focus.ts:31-34`) and depend on `[open]` only. Add a regression test: type a word into a Modal field under an inline `onClose`.
- **Status:** VERIFIED in jsdom on the primitive and on one real consumer. The other consumers are PARTIAL (same pattern, static). NOT RUNTIME VERIFIED in a browser, but the mechanism is plain React effect semantics and the editor saw it reproduced live.

#### A13-2: Visible labels are not programmatically associated with their fields (dashboard and editor)

- **Severity:** P1 (systemic; includes password and permission fields).
- **File:line (representative):**
  - Dashboard:
    - `D/components/site-detail/settings-tab.tsx:373-387`: `Field` renders `<label>{label}</label>` with no `htmlFor`, then `children`.
    - `D/components/settings/account-tab.tsx:155-160, 171, 188, 275`: "Current password" and the other password fields.
    - `D/components/settings/profile-form.tsx:185-192`.
    - `D/components/sites/rename-modal.tsx:29`: no label at all.
    - `D/components/team/invite-modal.tsx:126,252`: the email list and the note.
    - `D/app/review/[token]/review-client.tsx:327`.
  - Editor:
    - `E/shell/modals/CreateComponentModal.tsx:149-157` (same pattern);
    - `E/shell/modals/CMSCollectionSetupModal.tsx:325-469`;
    - inspector `flexbox/FlexItemControls.tsx:54-126`, `layout/PositionControls.tsx:143-177`, `interactions/InteractionEditor.tsx:121,133`.
- **Symbol:** dashboard `InputField` (`primitives/input-field.tsx:12-45`) has no `label`/`id` prop. Editor `TextInput`/`Textarea` are used without `FormField`.
- **Evidence:**
  - Heuristic scan (no `aria-label`/`aria-labelledby`/`id`/spread, and not inside an open `<label>`): 69 dashboard and 78 editor controls.
  - About 17 dashboard controls have no placeholder either, so they have no name in any browser.
  - Probe 5: `computeAccessibleName` returned `""` for the real `RenameModal` field and for the sibling-label pattern (password and text).
  - The editor already has the right primitive, `E/chrome-ui/FormField.tsx:39-46` (`useId` + `<Label htmlFor>`), and `FieldRow` accepts `htmlFor`. Neither is used at these sites.
- **Expected behavior:** Every field's accessible name is its visible label (WCAG 1.3.1, 4.1.2, 2.5.3), and clicking the label focuses the field.
- **Root cause:** The label is written as a sibling element. The input primitives take no label, so every form re-invents the pairing and forgets the association.
- **Affected modules:**
  - Dashboard settings (account, profile, workspace, integrations, security);
  - site settings, SEO, domains, redirects, access, share;
  - team invite;
  - reviewer page;
  - clients;
  - editor inspector, CMS setup, component creation.
- **Recommendation:**
  1. Add `label` (and `id` via `useId`) to the dashboard `InputField`/`SelectField`, and make `Field` pass `htmlFor`.
  2. In the editor, migrate to `FormField`.
  3. Add a jsx-a11y `label-has-associated-control` rule (warn), then ratchet it (A13-20).
- **Status:** VERIFIED (jsdom accname on real components). The scan counts are heuristic (±). Browser placeholder fallback is NOT RUNTIME VERIFIED.

#### A13-3: Layers tree keyboard navigation stalls, and keyboard element selection has no other route

- **Severity:** P1. It is not a dead end (Tab + Enter works), but it is the only keyboard path to selecting elements, and selection is the entry point to every edit.
- **File:line:**
  - `E/panels/layers/LayerTreeItem.tsx:155-166`: ArrowUp/Down call `onSelect(nextId, {})` and never move focus.
  - `:171-177`: every row is `tabIndex={0}`.
  - `:207-213`: the chevron is focusable when the row has children.
  - The eye and lock buttons are also focusable.
- **Symbol:** `LayerTreeItem.handleKeyDown`.
- **Evidence:**
  - Probe 4: with focus on row A, three ArrowDowns selected B, B, B while focus stayed on A. The handler computes "next" from its own row's id, so it can never advance past one row.
  - Nothing in the panel focuses the selected row: `grep` finds only `scrollIntoView` (`panels/layers/index.tsx:181-186`).
  - The canvas has no keyboard traversal:
    - `SelectionManager.selectNextSibling`/`selectPrevSibling` (`engine/SelectionManager.ts:175,191`) have **no callers**;
    - `selectParent` is reachable only from an Inspector button (`E/inspector/ProInspector.tsx:390`) and the canvas label.
  - There is no test for arrow keys in Layers.
- **Expected behavior:** WAI-ARIA tree pattern:
  - one tab stop (roving tabindex);
  - Up/Down move focus, and the selection follows;
  - Left/Right collapse, expand or move to parent/child;
  - Home/End;
  - row actions reachable without adding 2–3 tab stops per row.
- **Root cause:** Selection and focus were conflated. The handler assumes a re-render will move focus, and nothing does.
- **Affected modules:** Layers, canvas selection, Inspector (which needs a selection).
- **Recommendation:**
  1. After `onSelect`, focus the row for `nextId`, and use a roving `tabIndex` (`0` on the selected or last-focused row, `-1` elsewhere).
  2. Take the eye and lock out of the tab order and expose them via shortcuts or the context menu, which is already keyboard-openable.
  3. Bind the existing sibling/parent selection commands on the canvas (for example Tab/Shift+Tab/Esc while a canvas element is selected). That is a product decision about shortcuts; see below.
- **Status:** VERIFIED (jsdom, real component). NOT RUNTIME VERIFIED in the full panel.

### P2

#### A13-4: Compound `ModalRoot` dialogs are unnamed

- **Severity:** P2.
- **File:line:**
  - `E/chrome-ui/ModalParts.tsx:57-65`: `ModalRoot` passes no `labelledBy`.
  - `:75-88`: `ModalContent` puts `aria-label={srTitle}` on a plain div.
  - `E/chrome-ui/OverlayMount.tsx:70-78`: the `role="dialog"` node takes `aria-labelledby={labelledBy}`, which is undefined here.
- **Evidence:**
  - Probe 1: neither `srTitle` nor `aria-labelledby` on `ModalContent` names the dialog.
  - 63 `<ModalRoot` sites, including:
    - `StudioHeader.tsx:878,970` (publish confirm and exit guard, which put `aria-labelledby` on `ModalContent`, where it does nothing);
    - `CommentLayer.tsx:518` (orphan comments);
    - `inspector/components/DeleteConfirmModal.tsx:24`;
    - `ExportModal`, `CMSRecordsModal`, `KeyboardShortcutsPanel`, `BlockPickerModal`.
  - `ConfirmDialog` and `UpgradeModal` use the all-in-one `Modal` (`Modal.tsx:90`, `labelledBy={titleId}`) and are named correctly.
  - Also a risk: the dialog node is `display: contents` (`OverlayMount.tsx:77`). Some engines have historically dropped roles on `display: contents` elements. NOT RUNTIME VERIFIED.
- **Expected behavior:** Every dialog is announced with its title.
- **Root cause:** The name was placed on the visual frame, not on the semantic node.
- **Recommendation:** Give `ModalRoot` `labelledBy`/`label` props, forwarded to `OverlayMount`. Or have `ModalTitle` register its id through context, the way `ModalClose` already consumes context. Consider rendering the dialog role on the `ModalContent` frame.
- **Status:** VERIFIED (jsdom).

#### A13-5: Comments are keyboard-accessible for reading and resolving, not for pinning; the dashboard comments page is mouse-only

- **Severity:** P2.
- **File:line:**
  - Editor:
    - `E/canvas/comments/CommentLayer.tsx:411-422`: the capture layer is a `<div onClick={handleCaptureClick}>`.
    - `:447-457`: pins are real `<Button>`s with author and body in `aria-label`, but the click only switches to the Review tab.
    - `:462`: the draft "+" `PinDot` is a focusable button with no action.
  - Dashboard: `D/components/comments/comment-preview.tsx:60,90-93`: the stage is a `<div onClick={onStageClick}>`, and that is the only way to create a comment. The pin popover (`:121-141`) and draft (`:144-170`) have no Escape and no focus move. The pins are `aria-label="Comment n"`, with no author or body and no `aria-expanded`.
- **Evidence:**
  - The editor's Review tab has keyboard-usable Resolve/Reopen buttons (`ReviewTab.tsx:659-661`) and a page-level reply composer (`:964`, `postReply`). So editor users can comment by keyboard, but not on an element.
  - The dashboard has no alternative.
  - Escape handling in the editor draft is correct (`CommentLayer.tsx:237-258`).
- **Expected behavior:** A keyboard path to anchor a comment. For example, "Comment on selected element" places the pin at the selection, since `targetSelector` already takes an element id. Pins should open or focus their thread.
- **Root cause:** Placement is modelled as pointer coordinates only.
- **Recommendation:** Add a command (palette and shortcut) that creates a draft anchored to the current selection, plus a dashboard "Add comment" button that drops a pin at centre or picks a page. Focus the thread on pin activation (see A08-13).
- **Status:** VERIFIED (static). The pin placement model is a product decision.

#### A13-6: External reviewer page: the confirm overlay has no dialog semantics; unlabeled notes; low-contrast metadata

- **Severity:** P2.
- **File:line:** `D/app/review/[token]/review-client.tsx`:
  - `:374-420`: the overlay is a `<div className="fixed inset-0…">` with no `role`, `aria-modal`, focus move, trap or Esc.
  - `:92-108`: `Shell` renders `<main>{children}</main>` before the sticky `<footer>`, so Tab from Approve goes forward, out of the document, not into the overlay.
  - `:327-333`: the notes `<textarea>` has a placeholder only. The heading "Your notes" is a `<p>`.
  - `:361`: timestamps `#9CA3AF` on white, 2.54:1.
  - `:53-63`: the page switcher buttons have no `aria-current`/`aria-pressed`.
- **Evidence:** as listed. The dashboard's own `Modal` primitive (named, trapped, Esc) exists and isn't used here.
- **Expected behavior:** The one irreversible client action ("This closes the round and you cannot reopen it") is announced as a dialog, receives focus, and can be cancelled with Esc.
- **Root cause:** A public route built outside the dashboard primitives.
- **Affected modules:** Review (external), approvals.
- **Recommendation:**
  1. Use `Modal`.
  2. Associate "Your notes" as the label.
  3. Use `#4B5563`+ for the metadata.
  4. Add `aria-current` on the active page tab.
- **Status:** VERIFIED (static). NOT RUNTIME VERIFIED with a screen reader.

#### A13-7: Invite and member controls: partial mouse dependence, and the site scope is shown by colour alone

- **Severity:** P2 (permissions surface).
- **File:line:** `D/components/team/`:
  - **Members table:** `members-table.tsx:246-253, 276-300`:
    - `<tr onClick>` opens member detail, or toggles selection in select mode.
    - The in-row checkbox is `readOnly` and `pointer-events-none` (`:288-295`), and has no label.
  - **Member actions:** `member-actions.tsx:28-76`:
    - The trigger (`aria-label="Member actions"`, good) has no `aria-expanded`/`aria-haspopup`.
    - The menu has no Esc and closes only on `mousedown` outside (`:32-38`).
    - Focus is not moved in and not returned after an action.
    - Destructive items use `--color-primary` (`:67`).
  - **Invite modal:** `invite-modal.tsx:189-214`: "All sites" / "Specific sites" are two buttons whose selected state is only a border and background colour, with no `aria-pressed`, `role="radio"` or `aria-checked`. The per-site checkboxes and role radios, by contrast, are labelled (`:152-176`, wrapped `<label>`).
- **Evidence:**
  - Keyboard users can reach every per-member action through the actions button, and the role dialog uses real buttons (`:386-399`). So removal and role change are keyboard-possible.
  - Bulk selection and the member detail card are not.
  - A screen-reader user inviting a member can't tell whether they are granting all sites or a subset.
  - Good as-is: the Online status in the detail card has `sr-only` text (`:97-100`).
- **Expected behavior:**
  - Every member operation works by keyboard.
  - The selected scope is announced (`aria-pressed` or a radio group).
  - The menu follows the menu-button pattern.
- **Root cause:** Row-click interaction model, and hand-rolled menus.
- **Recommendation:**
  - Use a real checkbox cell with `onChange` and `aria-label={`Select ${name}`}`.
  - Add a "View" button in the member cell.
  - Use a radio group for the site scope.
  - Build the actions menu on a shared dashboard `Menu` (A13-8).
- **Status:** VERIFIED (static).

#### A13-8: Dashboard (and one editor) dropdown menus can't be dismissed by keyboard, and their ARIA contract is inconsistent

- **Severity:** P2.
- **File:line:**
  - `D/components/sites/context-menu.tsx:43-76`: `aria-haspopup="menu"` and `aria-expanded`, but no `role="menu"`/`menuitem`. Esc count is 0. It closes on `mousedown` only.
  - `D/components/team/member-actions.tsx` (A13-7).
  - `D/components/dashboard/shell/workspace-switcher.tsx` (Esc count 0).
  - `D/components/sites/folder-card-grid.tsx` (Esc count 0).
  - `D/components/clients/clients-view.tsx:289-300` (coordinates menu, scrim click only).
  - `D/components/media/media-library.tsx` (Esc count 0).
  - `E/design-system/ui/ExportDropdown.tsx:37`: `useClickOutside` without `closeOnEscape`.
  - Contrast: `avatar-dropdown.tsx` and `site-header.tsx` do handle Esc.
- **Evidence:** Counted per file (`aria-expanded` / `aria-haspopup` / `Escape` / `role="menu"`).
- **Expected behavior:** Esc closes and returns focus to the trigger. The ARIA roles match what is announced.
- **Root cause:** The dashboard has no menu primitive. The editor has one (`chrome-ui` `Popover` + `Menu`), which the dashboard can't import.
- **Recommendation:** One dashboard `Menu` (Esc, focus-in, focus-return, arrow keys), and migrate these 6. Add `closeOnEscape: true` in `ExportDropdown`.
- **Status:** VERIFIED (static).

#### A13-9: Dashboard command palette is silent for screen readers

- **Severity:** P2.
- **File:line:** `D/components/search/command-palette.tsx:421-450`. Keys are handled at `:400-412`.
- **Evidence:**
  - The overlay is a plain div: no `role="dialog"`, no `aria-modal`.
  - The input (`aria-label="Search Buildrick"`, good) has no `role="combobox"`/`aria-expanded`/`aria-controls`/`aria-activedescendant`.
  - The results have no `listbox`/`option`/`aria-selected`. Highlight is visual only.
  - There is no focus return on close.
  - The query clear button at `:448` is unnamed (A13-12).
  - Both editor palettes have the full combobox wiring (`E/shell/modals/CommandPalette.tsx`, `E/canvas/controls/CommandPalette.tsx`: combobox, listbox, option and activedescendant each present).
- **Recommendation:** Port the editor palette's ARIA wiring. Mount it in `Modal`, or add dialog role and focus return.
- **Status:** VERIFIED (static).

#### A13-10: The save-conflict dialog and inline confirmations never take focus

- **Severity:** P2.
- **File:line:**
  - `E/shell/modals/ConflictModal.tsx:41-47`: `role="dialog" aria-modal="true"`, named (the test asserts the name), but with no focus move, no trap and no Escape (focus and Escape counts are 0).
  - Inline `role="alertdialog"` panels that render in place with no focus management:
    - `E/sidebar/tabs/review/ReviewTab.tsx:757-781` (revoke) and `:990` (re-send);
    - `E/panels/VersionHistoryPanel.tsx:364` (restore);
    - `E/sidebar/tabs/ai/AgentPlan.tsx:210`;
    - `E/sidebar/tabs/media/components/ReplaceAcrossDialog.tsx:179`.
- **Evidence:**
  - `ConflictModal` opens from autosave (`SAVE_CONFLICT`), so it appears while focus is wherever the user was typing.
  - `aria-modal` then hides everything else from the screen-reader virtual cursor, while real focus stays outside the dialog.
  - Global shortcuts do stand down (`isModalOpen()`, `E/chrome-ui/focus.ts:111-113`), but plain typing continues behind the dialog.
  - A11-2 counts these shells. This finding is the accessibility impact.
- **Expected behavior:** Focus moves to the dialog's least-destructive action ("Reload"/"Cancel"). Esc means the safe option. Focus returns on close.
- **Recommendation:** Wrap `ConflictModal` in `OverlayMount` (the comment at `:13` says portalling mis-fired there; a trap without a portal via `useFocusTrap` is enough). For the inline alertdialogs, focus Cancel on open and return focus on close.
- **Status:** VERIFIED (static). NOT RUNTIME VERIFIED.

#### A13-11: Clickable elements that can't be focused (Full Media list view, page and folder selection, interactions, checklist)

- **Severity:** P2.
- **File:line:**
  - **Full Media list view:** `E/media/components/AssetGrid.tsx`:
    - `:585-597`: "Select all files" `role="checkbox"` span with no `tabIndex` or key handler.
    - `:675-700`: the list row is a `<div onClick onDoubleClick>`, and the per-row `role="checkbox"` span has no `tabIndex`.
    - Grid view uses `AssetCell` (`<Button>`), which is fine.
  - **Page selection:** `E/sidebar/tabs/pages/components/PageRow.tsx:209-217`: the multi-select checkbox is a `div onClick`. `PageFolder.tsx:148` has the same shape.
  - **Interactions:** `E/inspector/sections/interactions/InteractionItem.tsx:81`: the expand header is a `<div onClick>`, and it is the only way to edit an existing interaction.
  - **Dashboard checklist:** `D/components/onboarding/dashboard-checklist.tsx:174-181`: task `<li onClick>`.
  - **Integrations:** `D/components/settings/integrations-content.tsx:58`: the expandable header is a `<div onClick>`. Whether the inner `ConnectButton` covers the same expansion is PARTIAL.
- **Evidence:** Scan result, triaged by hand. Scrim and backdrop `div onClick`s were excluded as legitimate.
- **Expected behavior:** Everything clickable is focusable and operable with Enter/Space.
- **Recommendation:** Use `<button>` or a native `<input type="checkbox">`. The `role="checkbox"` spans need `tabIndex={0}` plus Space handling at minimum.
- **Status:** VERIFIED (static).

#### A13-12: Icon-only buttons with no accessible name

- **Severity:** P2.
- **File:line:**
  - `E/sidebar/tabs/ElementsTab.tsx:131,161`: close for the recents and favorites overlays.
  - `D/components/search/command-palette.tsx:448`: clear query.
  - `D/components/sites/bulk-action-bar.tsx:97`: clear selection.
  - `D/components/theme/theme-manager.tsx:238`: dismiss push results.
  - `D/components/site-detail/submission-drawer.tsx:139`: close drawer.
  - `D/components/site-detail/submissions-panel.tsx:235,243`: previous/next page.
- **Evidence:** A `<button>` whose only child is a lucide icon, with no `aria-label` or `title`. (lucide marks SVGs `aria-hidden`, so the name is empty.) The other 5 scan hits had a `title` or real text.
- **Recommendation:** Add `aria-label` ("Close", "Clear search", "Clear selection", "Previous page", "Next page").
- **Status:** VERIFIED (static).

#### A13-13: AI responses are not announced

- **Severity:** P2.
- **File:line:** `E/sidebar/tabs/ai/ChatThread.tsx`, `ChatMessage.tsx:16-48`, `AITab.tsx:132-160`.
- **Evidence:**
  - The only live regions in `tabs/ai` are `ScopeChip.tsx:20` (`role="status"`) and errors (`ChatMessage.tsx:26`, `role="alert"`).
  - The streaming assistant message, its completion, and the "Apply changes" diff arriving have no `role="log"`/`aria-live`.
  - `AiPromptPopover` (`E/canvas/controls/AiPromptPopover.tsx:80-123`) is a named dialog with labelled controls, but it is equally silent when output arrives.
- **Expected behavior:** Screen-reader users learn that a reply or edit is ready without polling the DOM.
- **Recommendation:** `role="log" aria-live="polite"` on the thread (announce on completion, not per token), plus a status line "Suggestion ready — Apply or Discard".
- **Status:** VERIFIED (static).

### P3

#### A13-14: Toasts auto-dismiss, including their Undo actions, with no pause

- **Severity:** P3.
- **File:line:**
  - Editor: `E/chrome-ui/Toast.tsx:231-238` runs `setTimeout(onDismiss, duration)`, default 5000. There is no hover or focus pause. The viewport is a proper live region (`:207-209`).
  - Undo toasts at 2–8 s: `E/canvas/menus/actions/editActions.ts:32-154`, `sidebar/tabs/media/hooks/useSelectionState.ts:252`.
  - Dashboard: `D/components/dashboard/toast-provider.tsx:26-34` dismisses after 5000 ms. Each toast mounts with its own `role="status"`/`alert` (`toast.tsx:31`). A status region created already holding its text is not reliably announced.
- **Recommendation:** Pause timers on hover and focus-within. Keep a persistent empty `aria-live` container in the dashboard. Cmd+Z remains the keyboard fallback for Undo, and A06-6 notes it undoes the newest action, not the one the toast names.
- **Status:** VERIFIED (static).

#### A13-15: Presence and collaboration signals (flag-off in production)

- **Severity:** P3 (reachable only under `FEATURE_COLLAB`).
- **File:line:**
  - `E/chrome-ui/Presence.tsx`:
    - `:77-95`: each avatar is `role="img" aria-label={name}`. Good.
    - `:97-108`: the "+N" overflow is a `<span aria-label>` with no role, so the label is ignored on a generic element, and the overflowed names are available nowhere, not even as a tooltip.
    - `:110-121`: the connection pill is `role="status"`, but "N editing" announces a count and never who joined or left. `tw:text-green-600` on `tw:bg-green-100` (Tailwind v4 defaults, not overridden in `E/themes/tw.css`) is about 2.93:1 at 11px.
  - `E/canvas/overlays/RemoteCursorsOverlay.tsx:100`: the name label is white on `user.color`. Palette at `engine/collaboration/CollaborationManager.ts:37-46`: white on `#facc15` is 1.53, `#4ade80` 1.74, `#22d3ee` 1.81, the best `#818cf8` 2.98. All fail 4.5:1. `#818cf8` is also an indigo, which DESIGN.md bans.
  - `COLLAB_SELECTION_UPDATE`, `COLLAB_EDITING_UPDATE` and `COLLAB_LOCK_ACQUIRED` are emitted (`CollaborationManager.ts:311,375,657,674,696`) and consumed by **no** `.tsx`. What another user has selected, is editing or has locked is shown to nobody.
- **Answers to the prompt's questions:**
  - **Can screen-reader users know who is present?** Up to 3 people, yes, through the avatar labels. Beyond 3, no. Joins and leaves are announced only as a changing count.
  - **Are presence colours the only indicator?** No. Avatars carry initials and a name, and cursors carry a name label. Colour is not the sole carrier. But avatar tone (`toneFor(id)`) and cursor colour (`USER_COLORS[colorIndex]`) come from different sources, so colour can't be used to match an avatar to a cursor either.
- **Recommendation:**
  - Make the overflow a button listing all names.
  - Announce "Ana joined" / "Ana left" politely.
  - Use `--bk-success-text` for the live pill.
  - Use dark label text or a darkened palette for cursors.
  - Derive avatar and cursor colour from one source.
  - Rendering remote selection and locks is Agent D's product gap.
- **Status:** VERIFIED (static). Contrast computed from hex, not rendered.

#### A13-16: Targets below 24×24 outside the target-size gate

- **Severity:** P3.
- **File:line:**
  - `E/shell/StudioFooter.tsx:246-262`: zoom trigger `tw:h-5` (20px tall).
  - `E/sidebar/tabs/history/components/ActivityView.tsx:607-620`: "Restore the project to …" is `tw:h-4` (16px), and its own title says "discards every later change".
  - `D/components/dashboard/toast.tsx:38`: dismiss is `p-0.5` + 16px icon, so about 20px.
  - `D/components/theme/theme-manager.tsx:238`: bare 14px icon.
  - `D/components/comments/comment-preview.tsx:153`: bare 16px icon.
- **Evidence:** `packages/editor/e2e/target-size.spec.ts` runs in CI (`editor-ci.yml`, "Target size (WCAG 2.5.8)") but covers 12 probe cases only (`:37-54`). The topbar, footer, history, inspector and every dashboard surface are uncovered.
- **Recommendation:** Add probe cases for the footer and history, or enforce `min-h-6`/`min-w-6` on icon controls. There is no dashboard equivalent; add one to its Playwright suite.
- **Status:** PARTIAL. Sizes are inferred from classes, NOT RUNTIME MEASURED. WCAG 2.5.8's spacing exception may clear some of them.

#### A13-17: Dashboard navigation landmarks and current-page state

- **Severity:** P3.
- **File:line:** `D/components/dashboard/shell/sidebar.tsx:44-55` (mobile bar) and `:105-137` (sidebar); `top-nav.tsx:49-79`.
- **Evidence:**
  - The active item is shown by colour, weight or underline only. No `aria-current`. (Only `agency-tabs.tsx:30` sets it.)
  - Three `<nav>`s have no `aria-label`.
  - There is no skip link. The editor has one (`E/rail/LayoutShell.tsx:308`).
- **Recommendation:** Add `aria-current="page"`, name each `<nav>`, and add a "Skip to content" link.
- **Status:** VERIFIED (static).

#### A13-18: Editor rail tab semantics

- **Severity:** P3.
- **File:line:** `E/sidebar/LeftSidebar.tsx`:
  - `:155-161`: every tab is focusable, with no roving tabindex.
  - `:486-517`: arrows activate the tab they land on (selection follows focus). This is acceptable, but it switches drawers on every arrow press.
  - `:636-645`: a `<nav>` is given `role="tablist"`, which removes the landmark.
  - `:692`: `role="tabpanel"` has no `aria-labelledby`.
- **Recommendation:** Roving tabindex, `aria-labelledby` pointing at the active tab, and wrap the tablist in a separate `<nav aria-label>`. See also A11-1 on the `aria-current` vs `role="tab"` split.
- **Status:** VERIFIED (static).

#### A13-19: Secondary-text contrast on subtle surfaces

- **Severity:** P3.
- **File:line:**
  - Tokens:
    - `E/themes/tokens.generated.css:70` (`--bk-bg-subtle #F3F4F6`) and `:79` (`--bk-ink-muted #6B7280`);
    - `D/app/globals.css:121,133-134` (same values, and the placeholder uses muted).
  - `D/app/review/[token]/review-client.tsx:361` (`#9CA3AF` text).
  - `D/components/onboarding/dashboard-checklist.tsx:183` (`text-[#C0C0C0]` status icon).
- **Evidence:**

  | Pair | Ratio | Verdict |
  |---|---|---|
  | `#6B7280` on white | 4.83 | passes |
  | `#6B7280` on `#F3F4F6` | 4.39 | fails for text under 18.66px bold / 24px |
  | `#9CA3AF` on white | 2.54 | fails |
  | `#C0C0C0` on white | 1.82 | below the 3:1 non-text minimum |
  | `#4B5563` (ink-soft) on `#F3F4F6` | 6.87 | passes |
  | White on `#1A56DB` (accent CTA) | 6.18 | passes |

- **Recommendation:** A lint or ratchet rule against `ink-muted` on `bg-subtle` for body-size text, and drain the `gray-400` text usages (3 in the editor, 8 in the dashboard by grep).
- **Status:** PARTIAL. Ratios are computed. Which elements actually render muted-on-subtle is NOT RUNTIME VERIFIED.

#### A13-20: No automated accessibility checks anywhere

- **Severity:** P3 (process).
- **Evidence:**
  - No `axe-core`, `@axe-core/playwright`, `jest-axe` or `eslint-plugin-jsx-a11y` in the root, editor or dashboard `package.json`.
  - Code comments cite axe results (`LayerTreeItem.tsx:230-232`, `LeftSidebar.tsx:694-697`), so axe was run by hand at some point, but nothing enforces it.
  - The one accessibility gate in CI is target size, over 12 probes.
- **Recommendation:**
  1. An axe sweep in the existing probe harness and the dashboard `console-sweep.spec.ts` route list.
  2. jsx-a11y at warn, with a ratchet: `label-has-associated-control`, `click-events-have-key-events`, `no-static-element-interactions`, `control-has-associated-label`. These would have caught A13-2, A13-11 and A13-12 mechanically.
- **Status:** VERIFIED (static).

---

## Good as-is

- **Editor focus trap (`E/chrome-ui/focus.ts`):**
  - moves focus in and restores it on close;
  - only the topmost `aria-modal` dialog answers Escape;
  - skips `tabIndex=-1` roving items;
  - holds `onEscape` in a ref, which is the fix the dashboard lacks (A13-1).
- **`isModalOpen()` gating:** global shortcuts stand down while a modal owns the keyboard.
- **Tooltips:** chrome-ui `Tooltip` (flowbite `Floating` uses `useFocus` + `role: "tooltip"`) and `HintTooltip` (`:160` Esc, `:195` `aria-describedby`, `:202` open on focus) both open on keyboard focus and dismiss with Esc.
- **Closed drawer:** `inert` + `aria-hidden` (`LeftSidebar.tsx:694-698`), so hidden panels are not tab-reachable.
- **Editor toast viewport:** a persistent `role="status"` with an assertive switch on errors (`Toast.tsx:207-209`).
- **Layers row names** include hidden and locked state. The rename input is labelled. The eye and lock have explicit labels.
- **Insert rows** (`BuildTab` `GroupSection.tsx:113-131`) are `role="button"` with Enter/Space. Insert is keyboard-complete.
- **Canvas context menu** (`ElementContextMenu.tsx:36-130`): focus-in, arrows, Enter, Escape. Layer reorder has keyboard alternatives (Move to top/bottom, bring forward, send backward).
- **Editor palettes:** full combobox/listbox/activedescendant semantics.
- **Global focus-visible ring** in both apps (`a11y.css` `*:focus-visible`, `globals.css:261`). It is unlayered, so it beats `outline-none` utilities. Reduced-motion blocks exist in both.
- **Editor skip link** (`LayoutShell.tsx:308`). `<html lang="en">` in the dashboard.
- **Media:** every `<iframe>` has a `title`, and every `<img>` has `alt` (scan). Dashboard `Modal` is named and trapped (apart from A13-1).
- **Members detail:** the Online dot carries `sr-only` text. Invite role radios and per-site checkboxes are wrapped in `<label>`.
- **Blocked Publish** stays focusable with its reason in a focus tooltip. That is the correct accessibility choice. The visual gap is A08-1.
- **Target-size gate** is in CI, locked at zero, and negative-controlled.

## Product decisions required

1. **Keyboard comment placement:** anchor to the current selection? Offer a dashboard "Add comment" without a pin? (A13-5)
2. **Canvas keyboard traversal shortcuts:** which keys move the selection to sibling, parent or child? `selectNextSibling`/`selectPrevSibling` exist but are unbound. (A13-3)
3. **Undo-toast timing:** pause on hover/focus, or a longer duration, or rely on Cmd+Z only? (A13-14)
4. **Adopting axe and jsx-a11y as a ratchet**, and at what initial severity. (A13-20)
5. **Presence:** whether joins and leaves should be announced, and whether remote selection and locks get UI at all. With Agent D. (A13-15)

## Overlaps with other audits

- **A11:**
  - A11-2 (12 hand-built dialog shells, no trap) underlies A13-10.
  - A11-5 (8 bespoke tablists without arrows) and A11-11 (5 menus bypassing `Menu`) are the design-system side of A13-8 and A13-18. I did not re-audit them.
  - A11-15 (cursor-label contrast) is the same data as A13-15.
- **A08:**
  - A08-1: blocked Publish has no visual state.
  - A08-13: comment pins don't focus their thread (relevant to A13-5).
  - A08-20: dashboard notification row actions are `hidden group-hover:flex`, so keyboard users can't reach them. That is an accessibility failure owned there.
- **A06:**
  - A06-6: toast Undo undoes the newest action (A13-14).
  - A06-1: Delete keyboard gateway.
- **Agent D (collab):** remote selection, editing and lock events have no UI consumer. Presence connection never reaches "offline" (also A11).
- **A12 (states):** a toast live region created on insert (A13-14) is also a feedback-reliability issue.
- **A14/A17:** `E/sidebar/tabs/component-library/ComponentRow.tsx` (a mouse-only `div`) has no importer, so it is dead code, not an accessibility defect.

---

## AUDIT HANDOFF

- **Agent / Prompt:** C, Interaction & UX / Prompt 13: Accessibility & Usability
- **Report:** `docs/audits/2026-09-25-full-audit/13-accessibility.md`
- **Counts:** P0 = 0 · P1 = 3 · P2 = 10 · P3 = 7
- **P0:** none.
- **P1:**
  - **A13-1:** The dashboard `Modal` focus effect is keyed on the `onClose` identity. In ≥7 dialogs (share draft, use template, new folder, rename media, API token, marketplace config) typing keeps only the first character. Reproduced in jsdom on the real `ShareDraftModal`.
  - **A13-2:** Labels are not programmatically associated. About 69 dashboard and 78 editor controls, including password fields. The accessible name is `""` in jsdom.
  - **A13-3:** Layers arrow keys never move focus, so ArrowDown sticks one row down. Every row is a tab stop, and there is no canvas keyboard traversal.
- **P2:**
  - A13-4: 63 unnamed `ModalRoot` dialogs
  - A13-5: comment pinning mouse-only; dashboard comments page mouse-only
  - A13-6: reviewer confirm overlay not a dialog
  - A13-7: team bulk-select and detail mouse-only; site scope shown by colour only
  - A13-8: dashboard menus with no Esc and mismatched ARIA
  - A13-9: dashboard palette with no combobox semantics
  - A13-10: `ConflictModal` and inline alertdialogs never focused
  - A13-11: non-focusable rows and checkboxes (Full Media list view, pages, interactions, checklist)
  - A13-12: 8 unnamed icon buttons
  - A13-13: AI output not announced
- **P3:**
  - A13-14: toast timing
  - A13-15: presence (overflow names, contrast, no remote selection UI)
  - A13-16: sub-24px targets outside the gate
  - A13-17: dashboard nav `aria-current` and skip link
  - A13-18: rail roving tabindex and tabpanel name
  - A13-19: muted-on-subtle contrast 4.39:1
  - A13-20: no axe or jsx-a11y
- **Runtime verified (jsdom, scratch harness; no repo files touched):**
  - A13-1 (primitive + `ShareDraftModal`);
  - A13-2 (`RenameModal` + pattern);
  - A13-3 (`LayerTreeItem`);
  - A13-4 (`ModalRoot`);
  - 6 existing overlay/a11y test files, 40/40 passed.
- **NOT RUNTIME VERIFIED:**
  - any browser or screen reader;
  - measured target sizes;
  - rendered contrast;
  - `display: contents` role exposure;
  - the other A13-1 consumers (static, same pattern);
  - presence (flag-off).
- **Dependencies:**
  - A13-1 is a one-file fix. Land it first, with a typing regression test.
  - A13-2 wants a primitive change (`InputField`/`Field` label prop, `FormField` adoption) before a codemod. Pair it with A13-20's jsx-a11y ratchet so it can't regress.
  - A13-4 and A13-10 touch the same overlay layer as A11-2, so batch them together.
  - A13-7 and A13-8 share a new dashboard `Menu` primitive.
  - A13-3's traversal shortcuts need product decision 2.
- **Inventory corrections:** none new. This confirms the A11 note that `collaboration/PresenceIndicators` is unrendered; only `toPresenceUsers` is used.
