# 08: Signifiers and Affordances (Prompt 8)

**Agent:** C, Interaction & UX · **Date:** 2026-09-25 · **Mode:** read-only.

**Scope:** signifiers and affordances only. That covers icons, badges, status dots, counts, chevrons, arrows, ellipsis, close and expand controls, chips, presence indicators, avatars, and the comment, sync and connection indicators, across:
- the editor chrome (`packages/editor/src/editor`);
- the dashboard (`packages/dashboard`);
- the server code that decides what those signifiers claim (`server/services`, `packages/shared/schemas`).

Out of scope, and left to the owning audits: navigation doors (A03), feedback and error states (Prompt 12), accessibility (Prompt 13) and wiring (Prompt 14).

Path prefixes used below:
- `E/` = `packages/editor/src/editor/`
- `EN/` = `packages/editor/src/engine/`
- `D/` = `packages/dashboard/`
- `S/` = `server/`

---

## Method & runtime status

**What I did:**
- For each signifier, I read the component that draws it.
- Then I traced what it claims to the code that decides that claim: handler → event or service → persisted field → the reader that acts on it (the exporter, the notification producer, the lint store).
- A finding is only recorded where the signifier's visual meaning and its actual function disagree in code.

**Commands run (read-only):**

| Command | Result |
|---|---|
| `pnpm --filter @buildrik/editor exec vitest run` on 10 files: `IssueChip`, `Presence`, `SaveStatus`, `Topbar`, `IssuesPanel`, `NotificationPanel`, `LayerVisibilityCopy`, `PageRow`, `PageRow.aria`, `EN/commands/__tests__/reorderElement.order` | **10 files, 85 tests, all passed.** These tests pin the current behaviour. Some of them pin the defects below as intended, for example `Topbar.test.tsx:37`, which asserts that a blocked Publish stays enabled-looking and focusable, and `reorderElement.order.test.ts:54`, which asserts that `bring-forward` swaps with the *next* sibling. |
| grep, sed and file reads over the editor, dashboard, server and shared code | Cited as file:line throughout |

**NOT RUNTIME VERIFIED:**
- There is no browser and no Postgres here, so nothing was looked at on screen.
- Every visual claim, such as "renders as a solid blue button" or "renders no chip", comes from reading class lists, CSS rules and JSX branches.
- Computed styles, hover states and glyph legibility were not measured. `getComputedStyle` was not run.
- The production values of `NEXT_PUBLIC_FEATURE_PUBLISH` and `_COLLAB` cannot be seen from the repo. They decide how often the blocked-Publish state (A08-1) and the Presence UI (A08-26) actually appear.

---

## Output table: control → meaning → function

| # | Control | File / component | Visual meaning | Actual function | Expected meaning | Issue | Prio |
|---|---|---|---|---|---|---|---|
| 1 | Topbar primary CTA, blocked state | `E/chrome-ui/Topbar.tsx:307-333` | Solid accent button, the one filled button in the shell: "press me" | `aria-disabled`, `onClick={() => {}}`. Does nothing. The reason is only in a hover tooltip. | Looks inert, and the reason is visible without hovering | Clickable-looking non-action on the primary CTA | **P1** |
| 2 | Page Settings → Visibility: Hidden / Password, plus the password field | `E/sidebar/tabs/pages/page-settings/AdvancedTab.tsx:23-86` | "Hidden = reachable via direct URL", "Password = visitors must enter a password", plus a password input and a Copy button to share it | The exporter drops the page entirely (`EN/export/ExportEngine.ts:123-126, 703`). No password is ever enforced. | A single, true statement: "Not published" | Two contradictory helper texts. The password field is a false affordance. | **P1** |
| 3 | Pages list row | `E/sidebar/tabs/pages/components/PageRow.tsx:139-147, 232-306` | Looks the same as a live page | A Hidden or Password page is left out of the deploy. The status appears only in `aria-label`. | A status chip on non-live pages | Missing signifier on a state that changes what ships | P2 |
| 4 | Site header "Unpublish" | `D/components/site-detail/site-header.tsx:136-138` | Primary blue CTA, the most prominent action | Takes the live site down (behind a confirm) | Danger or secondary styling. Edit or Publish as the primary. | Destructive action styled as the primary action | P2 |
| 5 | Destructive menu rows and trash icons | `D/components/sites/context-menu.tsx:69-82`, `sites/bulk-action-bar.tsx:66-68`, `team/member-actions.tsx:54-67`, `notifications/notification-item.tsx:128-131`, `site-detail/domains-tab.tsx:137`, `site-detail/access-tab.tsx:179` | Accent blue, the same colour as links, Edit and CTAs | Delete, Archive, Remove member, Revoke, Delete notification, Remove domain, Revoke share link | Red, which `DESIGN.md:40` reserves for destructive actions | Destructive actions are styled as accent. Probably residue from when `--color-primary` was red. | P2 |
| 6 | Canvas toolbar ⋯ → "Bring Forward ↑" / "Send Backward ↓" | `E/canvas/controls/toolbar/ToolbarActionsSection.tsx:158-186` | An up arrow, so "moves up" | Swaps with the next sibling (`reorderElement.order.test.ts:54-57`). In normal flow the element moves *down* the page and the Layers tree. | An arrow that matches the visible move, or "Move up / down" copy | The arrow contradicts the effect | P2 |
| 7 | Layers eye, and the eye glyph across the product | `E/panels/layers/LayerTreeItem.tsx:302-328`; topbar `E/chrome-ui/Topbar.tsx:258-266`; `D/components/notifications/notification-item.tsx:97-103`; `D/components/site-detail/access-tab.tsx:169` | Eye / eye-slash, the usual "hidden from output" | Layers: dims the element in the editor only, and it still publishes. Topbar: Quick preview. Dashboard: mark read/unread, and a view count. | One meaning per glyph | One glyph with four meanings. In Layers it sits beside `M`/`T` badges that *do* mean hidden-on-site. | P2 |
| 8 | Topbar Issues chip, zero state (shield with a check) | `E/chrome-ui/IssueChip.tsx:259-278`; source `E/shell/AquibraStudio.tsx:304-329` | "No issues": the site is clear to publish | Only design-system token lint feeds it. No other producer exists (`addIssue` has 0 callers, `E/shell/hooks/useStudioState.ts:416`). | Scoped copy ("Brand: no issues") or real site checks | False reassurance, with the same weight as a real audit | P2 |
| 9 | Issues panel rows, "Fix ›", the progress bar | `E/shell/IssuesPanel.tsx:263-294, 211`; handler `E/shell/AquibraStudio.tsx:626` | Interactive row (hover and pointer), so "jump to the problem". The chevron says "go deeper". The bar reads as determinate progress. | A row click only closes the panel. Fix is in place, not a drill-in. The bar is fixed at 60%. | Rows that do nothing should not be interactive. The fix button needs no chevron. The progress indicator should be indeterminate. | False affordance and false progress | P2 |
| 10 | Issues panel "Ignore once" | `E/shell/IssuesPanel.tsx:230-240`; `EN/designSystem/LintState.ts:4-5, 47` | Ignore this one issue, one time | Suppresses **every** issue on that token, is saved to localStorage, and survives reloads. No UI calls `unsuppress`. | "Ignore for this token", plus a way to undo it | The label misstates the scope and how long it lasts | P2 |
| 11 | Dashboard notifications "Mentions" tab | `D/components/notifications/notification-page.tsx:10-16`; `packages/shared/schemas/notifications.ts:13-18` | Where someone @-mentioned me | Lists password, 2FA, new-device and payment-failed notifications | A "Security & billing" label, or no tab at all | False label: mentions do not exist | P2 |
| 12 | Editor notification row with no link | `E/shell/NotificationPanel.tsx:265-336` | "What this points to was deleted" (a warning band) | Shown for every row with `actionUrl == null`, and security and `PAYMENT_FAILED` rows *never* have one (`S/services/account.service.ts:28-53`, `S/services/stripe-webhook.service.ts:64-70`) | Say nothing, or link to billing or security | A false statement on the highest-priority notifications | P2 |
| 13 | Canvas comment pins, and the Comments toggle | `E/canvas/comments/CommentLayer.tsx:397-457`; `E/chrome-ui/Topbar.tsx:268-272` | Numbered pins 1…n, so "comment #n". A bare "Comments" icon. | Numbers are an index over OPEN comments on this page and match nothing in the Review list. A pin click only switches to the Review tab (`{ tab: "review" }`). Pins exist only while comment mode is on. The toggle shows no count. | Numbers that match the list. A click that focuses its own thread. An open-comment count on the toggle. | Low information scent and ambiguous numbering | P2 |
| 14 | Rail logo | `E/sidebar/LeftSidebar.tsx:647-649`; `E/sidebar/LeftSidebar.css:60-68` | The lucide `Layers` glyph in accent blue, at 28px, above the rail | Nothing: a non-interactive `div` | A product mark that no tool uses | Looks like the Layers tool, and accent means "active" | P3 |
| 15 | CMS rail icon | `E/rail/tabsConfig.ts:255` vs `:103` | `LayoutGrid`, the same glyph as Templates | Opens the CMS (collections, records) | A data or database glyph (the panel itself uses `Database` for Sources) | Low scent, and a glyph shared with Templates | P3 |
| 16 | Save pill: "Unsaved changes" and "Save failed — retry" | `E/chrome-ui/SaveStatus.tsx:63-65, 142-149` | Status text | A `<button>` that saves, but with no cursor or hover class (`chrome-reset.css:56-61` sets neither) | A visible button affordance | Weak affordance. "Conflict — reload" says "reload" but cannot be clicked. | P3 |
| 17 | Footer "Desktop · 100%" | `E/shell/StudioFooter.tsx:246-262` | A muted readout | A zoom menu button. The device name inside it does not change the device. | A caret or chevron, and zoom only | Clickable control styled as a label | P3 |
| 18 | Topbar review pill | `E/chrome-ui/Topbar.tsx:364-368` | Gray pill | "In review" and "Approved" are drawn the same | The one success state is distinct | Ambiguous, by design (D7 rule 3) | P3 · PD |
| 19 | Unread indicators | `E/chrome-ui/Topbar.tsx:279-292` vs `D/components/notifications/notification-dropdown.tsx:67-74` | Editor: an accent dot. Dashboard: an uncapped number. | The same `notifications.unreadCount` | One convention | Inconsistent. The editor's empty state says "on this site", but the bell covers the whole account (`S/services/notification.service.ts:68-74`). | P3 |
| 20 | Dashboard notification row actions | `D/components/notifications/notification-item.tsx:96` | — | `hidden group-hover:flex`, so the actions have no box until hover and are unreachable by keyboard or touch | Always present, or shown on focus-within | Hidden affordance | P3 |
| 21 | Site menu rows that leave the editor | `E/shell/SiteMenu.tsx:117-119, 222-227, 275-294` | Same as in-editor rows | `window.open(..., "_blank")` into the dashboard (7 rows) | An external-link glyph (↗) | Low scent | P3 |
| 22 | Rail dirty dot (Settings) | `E/sidebar/LeftSidebar.tsx:111, 143, 179`; `E/rail/tabsConfig.ts:367` | A dot on the Settings rail item | Settings is not on the production rail, so the dot can never show | Show it on the Settings door that exists (the site menu) | Dead signifier | P3 |
| 23 | Dashboard site status pill | `D/components/sites/site-status.ts:5-16` | "Published", in green | Stays green after unpublished edits. Unknown statuses fall back to `warning`. | "Published · changes pending", as the editor derives it | Low information | P3 |
| 24 | Domain "Primary" pill | `D/components/site-detail/domains-tab.tsx:125-128` | Yellow warning pill with a star | Marks the primary domain | Neutral or success | Wrong tone | P3 |
| 25 | Layers lock glyph | `E/panels/layers/LayerTreeItem.tsx:329-350`; `layers-v2.css:241-242` | Open vs closed shackle at 11px | Locked and unlocked differ by one path segment, and both turn ink on hover or select | A clearer state difference | Poor signifier (not measured) | P3 |
| 26 | Presence pill | `E/chrome-ui/Presence.tsx:42-46, 69, 120`; `E/shell/StudioHeader.tsx:774` | "N editing". Offline in red. | N counts yourself. "Offline" cannot be reached, because a disconnected session hides the whole cluster. | — | Minor; collab is flag-off | P3 |
| 27 | Sites context menu "Copy Site URL" | `D/components/sites/context-menu.tsx:71` vs `D/app/dashboard/projects/page.tsx:350-361` | Enabled | On an unpublished site it gives an error toast, while "View Published" beside it is disabled with a tooltip | The same disabled treatment | Inconsistent affordance | P3 |

`PD` = product decision required.

---

## Findings

### P0

None. No signifier found here causes a security hole, data loss, or a destructive action on the wrong object.

The closest candidates were checked and ruled out:
- **Member remove/revoke** (A08-5): gated by a confirm at `D/components/team/members-table.tsx:193-206`.
- **Site delete** (A08-5): gated by a typed-name confirm at `sites/delete-confirm-modal.tsx`.
- **Unpublish** (A08-4): gated by a confirm at `site-header.tsx:186-193`.
- **Password pages** (A08-2): fail *closed*. The page is not published, so nothing goes out unprotected.

### P1

**A08-1: When Publish is blocked, the topbar still shows the solid accent CTA and clicking it does nothing**
- **Severity:** P1
- **File:** `E/chrome-ui/Topbar.tsx:307-333`; state source `E/shell/StudioHeader.tsx:630-635`; `E/shell/lifecycle.ts:102-108, 155-172`
- **Symbol:** `Topbar` (the `publish === "disabled"` branch)
- **Evidence:**
  - The blocked branch renders `<Button aria-disabled="true" onClick={() => {}} className={PUBLISH_BTN_CLASS}>`.
  - `PUBLISH_BTN_CLASS` (`:43`) has only size and typography.
  - The only disabled styling in the Button theme is `tw:disabled:*` (`E/chrome-ui/buttonTheme.ts:25-31`), which needs the native `:disabled` state.
  - `grep "aria-disabled:"` finds no rule covering this button.
  - The `Topbar` imports `Button` straight from `flowbite-react` (`:23`), and blocked Publish is on purpose not natively disabled (`:308-316`).
  - The result is that the one filled button in the shell looks fully enabled whenever `blockedReason` is set:
    - publishing is switched off for the workspace;
    - the user is a VIEWER;
    - the editor is offline;
    - a review is pending or opened;
    - on every first paint, before `reviews.status` answers ("Checking this site's review settings…", `lifecycle.ts:167-172`).
  - The reason exists only in a hover or focus tooltip.
  - `Topbar.test.tsx:37` asserts focusability and the tooltip, but nothing about how it looks.
- **Expected behavior:** a blocked CTA looks inert (the DS disabled tokens `--bk-bg-subtle` / `--bk-ink-muted`) while staying focusable. Ideally the reason shows without hovering, for example as a short sub-label.
- **Root cause:** the focusable-blocked pattern (the right a11y decision) was adopted without a matching `aria-disabled:` visual variant.
- **Affected modules:** Topbar, StudioHeader lifecycle CTA, Publish, Review, viewer mode.
- **Recommendation:**
  - Add `tw:aria-disabled:bg-[var(--bk-bg-subtle)] tw:aria-disabled:text-[var(--bk-ink-muted)] tw:aria-disabled:cursor-not-allowed` to the blocked branch. `Row.tsx:45` and `FormatRow.tsx:41` already use this pattern.
  - Consider rendering `publishBlockedReason` inline next to the button.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED visually.

**A08-2: Page visibility "Hidden" and "Password" contradict themselves, and the password field shares a password that nothing enforces**
- **Severity:** P1
- **File:** `E/sidebar/tabs/pages/page-settings/AdvancedTab.tsx:23-86`; `EN/export/ExportEngine.ts:112-126, 692-708`
- **Symbol:** `AdvancedTab`, `isPageLive`
- **Evidence:**
  - With visibility set to anything other than live, the panel shows two helper texts, one under the other:
    - `:49-56` says "Not published. Hidden pages are left out of the deploy… a password page is left out too".
    - `:57-61` says "Page is not linked in menus but reachable via direct URL" (Hidden) or "Visitors must enter a password to view this page" (Password).
  - For Password it also renders a password input with Show and Copy buttons, and says "Share this password with visitors who need access" (`:63-83`).
  - `isPageLive` returns false for any visibility other than `undefined` or `live`, and `exportPages` filters those pages out (`ExportEngine.ts:703`). So the page has no URL at all, and a visitor given the copied password gets nothing.
  - The exporter's own comment (`:692-700`) records that this promise "was never kept".
- **Expected behavior:** one true description ("Not published: left out of the deploy until password protection ships"). The password field and Copy button should be withheld, or clearly marked as not yet enforced.
- **Root cause:** the fail-closed export fix added a new helper, but the old per-option copy and the password affordance were left in place.
- **Affected modules:** Pages → Page settings, Export/Publish, page count in the Publish panel.
- **Recommendation:**
  - Remove the per-option helper and the Copy/Share affordance, or gate them behind the future published-site middleware.
  - Keep the single "Not published" line.
  - Pair this with A08-3.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

### P2

**A08-3: Pages rows show no status for pages left out of the deploy**
- **Severity:** P2
- **File:** `E/sidebar/tabs/pages/components/PageRow.tsx:139-147, 232-306`; `E/sidebar/tabs/pages/usePages.ts:127`; `E/sidebar/tabs/pages/utils/statusLabel.ts:1-28`
- **Symbol:** `PageRow`
- **Evidence:**
  - `getStatusLabel(page.status)` is computed, but it only feeds `ariaLabel`.
  - The only glyphs drawn are the Home roof and the External link.
  - `statusLabel.ts` documents itself as "map PageStatus enum to human-readable chip label", and `PagesTab.css:310` still has `.bd-pg-chip.password`. No JSX renders `bd-pg-chip` (grep finds 0).
  - So a Hidden or Password page, which `isPageLive` drops from the deploy, looks exactly like a live page in the list and in `PageTabBar`.
- **Expected behavior:** a chip ("Hidden", "Password · not published") on non-live rows.
- **Root cause:** the chip was removed during board conformance ("plain page rows carry NO icon", `:230-231`), but the state it carried became publish-relevant after that.
- **Affected modules:** Pages panel, PageTabBar, Publish.
- **Recommendation:** render the chip for `status !== "live"`, using the existing `getStatusLabel`.
- **Status:** VERIFIED in code.

**A08-4: The site header's primary button on a live site is "Unpublish"**
- **Severity:** P2
- **File:** `D/components/site-detail/site-header.tsx:103-138`
- **Symbol:** `SiteHeader`
- **Evidence:**
  - `{site.status === "PUBLISHED" && onUnpublish && (<Button onClick={() => setConfirmUnpublish(true)}>Unpublish</Button>)}`.
  - The dashboard `Button` defaults to `primary`, which is flowbite `blue` (`D/components/dashboard/primitives/button.tsx:13-17`), so the only filled accent button in the header takes the site offline.
  - "Edit in Editor" sits inside "More" (`:147-158`).
  - The confirm correctly uses `variant="danger"` (`:193`), so the trigger and the confirm disagree about what kind of action this is.
- **Expected behavior:** Unpublish as `ghost` or `danger`. The primary should be the forward action (Edit, or Publish changes).
- **Root cause:** a Publish/Unpublish toggle slot reuses the primary variant for both directions.
- **Affected modules:** dashboard site detail, publish.
- **Recommendation:** use `variant="danger"`, or move Unpublish into More.
- **Status:** VERIFIED in code.

**A08-5: Destructive actions in the dashboard are painted in the accent blue**
- **Severity:** P2
- **File:**
  - `D/components/sites/context-menu.tsx:69-82` (Archive, Delete)
  - `D/components/sites/bulk-action-bar.tsx:66-68` (Delete)
  - `D/components/team/member-actions.tsx:54-67` (Revoke Access, Remove Member)
  - `D/components/notifications/notification-item.tsx:128-131` (Delete)
  - `D/components/site-detail/domains-tab.tsx:137` (remove-domain trash)
  - `D/components/site-detail/access-tab.tsx:179` (revoke-share-link trash)
- **Symbol:** `isDestructive ? "var(--color-primary)" : …`
- **Evidence:**
  - Each of these sets `color: var(--color-primary)` (#1A56DB, `D/app/globals.css:113`) on the destructive row or icon.
  - `DESIGN.md:40` says: "Red means error/danger/destructive only… on every surface".
  - `DESIGN.md:12-14` records that the dashboard accent *was* red (`#E42313`), which makes these `isDestructive → primary` branches look like migration residue: correct when primary was red, inverted since.
  - Most of these are behind a confirm (members `members-table.tsx:193-206`, sites `delete-confirm-modal.tsx`).
  - The share-link revoke fires `revokeMutation` on one click (`D/app/dashboard/sites/[id]/access/page.tsx:58`), with a blue trash icon the same size as Copy beside it.
- **Expected behavior:** `--color-error-text` / `--color-error` for destructive rows.
- **Root cause:** the accent was repointed from red to blue without re-auditing its destructive consumers.
- **Affected modules:** sites list, bulk bar, team, notifications, domains, access.
- **Recommendation:** swap in the error token at these 6 sites (7 lines). Add a confirm to share-link revoke (that part is Prompt 12).
- **Status:** VERIFIED in code. The residue root cause is inferred from DESIGN.md history.

**A08-6: "Bring Forward ↑" moves the element down**
- **Severity:** P2
- **File:** `E/canvas/controls/toolbar/ToolbarActionsSection.tsx:158-186`; `E/canvas/hooks/useCanvasToolbarActions.ts:106-114`; `EN/commands/__tests__/reorderElement.order.test.ts:53-61`
- **Symbol:** `handleToolbarMoveUp` → `bring-forward`
- **Evidence:**
  - The menu item draws an up arrow (`M12 19V5M5 12l7-7 7 7`) labelled "Bring Forward".
  - The handler runs `bring-forward`, and the test pins it as "swaps with the next sibling" (`[a,b,c,d]` → `[a,c,b,d]` for `b`).
  - In normal document flow, the next sibling is *below*. So ↑ moves the element down the canvas and down the Layers tree. ↓ "Send Backward" moves it up.
  - The z-order wording also names a concept (stacking) that isn't what happens for non-positioned elements.
- **Expected behavior:** labels and arrows that describe the visible result ("Move down ↓" / "Move up ↑"), or z-order commands that change `z-index`.
- **Root cause:** Figma/Photoshop z-order vocabulary laid over a DOM-order swap.
- **Affected modules:** canvas selection toolbar, Layers, possibly keyboard shortcuts that run the same commands.
- **Recommendation:** re-label and swap the glyphs, or implement the real z-order. This is a product call.
- **Status:** VERIFIED (code plus a passing unit test).

**A08-7: The eye glyph has four meanings, and in Layers it contradicts the "hidden" badges beside it**
- **Severity:** P2
- **File:** `E/panels/layers/LayerTreeItem.tsx:176-178, 279-328`; `E/chrome-ui/Topbar.tsx:258-266`; `D/components/notifications/notification-item.tsx:97-103`; `D/components/site-detail/access-tab.tsx:169`
- **Symbol:** `LayerTreeItem` eye, `EyeIcon`, the mark-read toggle
- **Evidence:**
  - **Layers:** the eye only sets `data-hidden` on the canvas node, and the element still publishes (the tooltip at `:305-309` admits it). But when toggled, the row announces ", hidden" (`:176`) and draws an eye-slash plus a 0.45 row dim.
  - On the same row, the `M` / `T` badges (`:279-284`) mean *actually hidden on the published site* at that breakpoint.
  - **Topbar:** the eye means Quick preview.
  - **Dashboard notification row:** the eye means "Mark as read".
  - **Access tab:** the eye means a view count.
- **Expected behavior:** one meaning per glyph. The Layers dim control should use a distinct glyph, or a label other than ", hidden".
- **Root cause:** each surface picked lucide `Eye` locally.
- **Affected modules:** Layers, topbar, dashboard notifications, access.
- **Recommendation:**
  - Use a different glyph for editor-only dimming (for example `ScanEye`, or a half-opacity square).
  - Replace ", hidden" in the row name with ", dimmed in editor".
  - Use a check or envelope glyph for mark-read.
- **Status:** VERIFIED in code (`LayerVisibilityCopy.test.ts` passes and pins the tooltip copy).

**A08-8: The Issues chip's "No issues" shield reflects only brand-token lint**
- **Severity:** P2
- **File:** `E/chrome-ui/IssueChip.tsx:166-173, 259-278`; `E/shell/AquibraStudio.tsx:304-329`; `E/shell/hooks/useStudioState.ts:416-431`
- **Symbol:** `IssueChip`, the issues bridge `useEffect`
- **Evidence:**
  - The only producer of `state.issues` is the design-system lint bridge, which maps `lintState.getAllVisibleIssues()` with `location: "Brand › …"`.
  - `addIssue` / `setIssues` have no other caller outside tests.
  - The chip's own doc calls the zero state "the 'all clear' reassurance", and its tooltip says "No issues".
  - The chip is always visible and sits between Preview and Publish.
  - So a site with missing alt text, broken links or empty SEO shows the shield check. The IssuesPanel page-scope toggle only appears for page-bound issues, which never occur.
- **Expected behavior:** a scoped claim ("Brand checks pass"), or real site checks feeding the chip.
- **Root cause:** a publish-readiness chip wired to a single, brand-only source.
- **Affected modules:** topbar, Issues panel, the publish-anyway confirm (which only ever lists brand issues).
- **Recommendation:** change the zero-state label or tooltip to name the scope, until more producers exist. This is a product call on which checks feed it.
- **Status:** VERIFIED in code.

**A08-9: Issue rows look navigable but only close the panel; the "Fix ›" chevron and the progress bar mislead**
- **Severity:** P2
- **File:** `E/shell/IssuesPanel.tsx:263-294, 211`; `E/shell/AquibraStudio.tsx:622-626`
- **Symbol:** `IssuesPanel` rows
- **Evidence:**
  - Rows are `<Row interactive onClick={() => onSelectElement?.(i.id)}>`, which gives hover, pointer and button semantics.
  - The shell passes `onSelectElement={() => setIssuesOpen(false)}`, commented as "v1 just closes". So clicking an issue dismisses the list the user was reading.
  - "Fix ›" uses a drill-in chevron for an in-place action.
  - While fixing, `<Progress progress={60}>` shows a fixed 60% bar, and the code comment admits "has always been a fixed activity indicator rather than real progress".
- **Expected behavior:** rows are non-interactive until a jump target exists (or they jump to Brand › token). "Fix" has no chevron. The progress indicator is indeterminate (a spinner).
- **Root cause:** the interactive styling was kept ahead of the navigation it implies.
- **Affected modules:** Issues panel, Brand.
- **Recommendation:** have the row call `onOpenBrand` with the token (the data is there, `tokenId`), or drop `interactive`.
- **Status:** VERIFIED in code.

**A08-10: "Ignore once" is permanent, covers the whole token, and can't be undone**
- **Severity:** P2
- **File:** `E/shell/IssuesPanel.tsx:230-240`; `E/shell/AquibraStudio.tsx:640`; `EN/designSystem/LintState.ts:4-5, 47, 78`
- **Symbol:** `onIgnore` → `lintState.suppress(tokenId)`
- **Evidence:**
  - `LintState` says: "Suppressions persist to localStorage so an 'Ignore' decision sticks across reloads".
  - The suppression is keyed by token, and `getVisibleIssues` returns `[]` for a suppressed token, so every issue on it is hidden.
  - grep finds no UI caller of `unsuppress`. The only `suppress` callers are here and `TokenDetailView.tsx:242, 246`.
  - The suppressed issues also disappear from the chip (A08-8), so the chip can reach "No issues" through Ignore alone.
- **Expected behavior:** a label that states the scope ("Ignore for this token"), plus a way to see and restore ignored issues.
- **Root cause:** the label was written for a one-shot dismiss, but the store implements a persistent mute.
- **Affected modules:** Issues panel, Brand token detail, IssueChip.
- **Recommendation:** re-label now, and add an "Ignored (n)" filter that can unsuppress.
- **Status:** VERIFIED in code.

**A08-11: The "Mentions" notification tab shows security and payment alerts**
- **Severity:** P2
- **File:** `D/components/notifications/notification-page.tsx:10-16`; `packages/shared/schemas/notifications.ts:13-18`; `S/services/notification.service.ts:10, 82`
- **Symbol:** `NOTIFICATION_TYPES` tab `mentions`, `MENTION_NOTIFICATION_TYPES`
- **Evidence:**
  - `MENTION_NOTIFICATION_TYPES = ["SECURITY_PASSWORD_CHANGED","SECURITY_2FA_CHANGED","SECURITY_LOGIN_NEW_DEVICE","PAYMENT_FAILED"]`.
  - The server filters the "mentions" tab to exactly these types.
  - No mention feature exists anywhere (confirmed by the inventory and by grep).
- **Expected behavior:** a tab label that matches its content ("Security & billing"), or no tab.
- **Root cause:** a placeholder filter was named for a future feature.
- **Affected modules:** dashboard notifications, shared schema, notification service.
- **Recommendation:** rename the tab and the constant. Rename the schema enum value in a follow-up.
- **Status:** VERIFIED in code.

**A08-12: The editor tells users the target "was deleted" on notifications that never had one, including PAYMENT_FAILED**
- **Severity:** P2
- **File:** `E/shell/NotificationPanel.tsx:255-336`; producers `S/services/account.service.ts:28-53, 378-420`, `S/services/stripe-webhook.service.ts:64-70`
- **Symbol:** `NotificationPanel` (`jumpable = n.actionUrl != null`)
- **Evidence:**
  - Any row with a null `actionUrl` gets `interactive={false}` plus a warning-tinted band that says "What this points to was deleted / The notification is kept, but there's nothing to jump to".
  - All four security `createNotification` calls and the Stripe `PAYMENT_FAILED` insert pass no `actionUrl`. The only producers that do are the form submission (`form-submission.service.ts:58-63`) and member joined (`S/trpc/routers/auth.ts:323-329`).
  - So the most urgent notification a user can get (payment failed) is labelled as pointing at something deleted, with no path to billing.
- **Expected behavior:** a null link renders as plain information. Payment and security rows link to `/dashboard/settings/billing` and `/…/security`.
- **Root cause:** "no URL" was read as "deleted target".
- **Affected modules:** editor notifications, notification producers.
- **Recommendation:**
  - Drop the band unless the server marks the target as deleted.
  - Set `actionUrl` at the 5 producer sites.
- **Status:** VERIFIED in code.

**A08-13: Comment pins have numbers that don't match the list, and nothing shows open comments until comment mode is on**
- **Severity:** P2
- **File:** `E/canvas/comments/CommentLayer.tsx:397-457`; `E/chrome-ui/Topbar.tsx:268-272`; `E/sidebar/tabs/review/ReviewTab.tsx`
- **Symbol:** `PinDot`, the `pins` memo
- **Evidence:**
  - `label: String(i + 1)` counts over the OPEN comments of the active page, filtered in the order the comments arrived. The Review list shows no numbers, so "3" matches nothing there.
  - A pin click emits `ui:switch-tab {tab:"review"}` with no comment id, so the list opens without scrolling to or highlighting the pin's thread.
  - `pins` returns `[]` unless `modeOn || reattachingId` (`:401`), so client comments are invisible on the canvas by default.
  - The topbar "Comments" toggle has no count and no badge.
  - Taken together: a client's new comment gets no in-editor signifier except the review pill's state (and only when a review round exists).
- **Expected behavior:**
  - Pin numbers that appear in the list too, or no numbers.
  - A click that focuses the pin's thread.
  - An open-comment count on the Comments toggle.
- **Root cause:** pins were built as a mode overlay, not as a status layer.
- **Affected modules:** canvas comments, Review tab, topbar.
- **Recommendation:**
  - Pass `commentId` in the switch-tab payload.
  - Show the numbers in `CommentRow`.
  - Add a count to the toggle. Whether pins are always shown is a product call.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

### P3

Each P3 below is in the output table with its file and line.

| ID | Summary | Status |
|---|---|---|
| **A08-14** | The rail logo is the `Layers` tool glyph in accent blue, on a non-interactive `div`. It reads as the Layers tool, and as active. Use a product mark instead. | VERIFIED |
| **A08-15** | CMS uses `LayoutGrid`, the same glyph as Templates (`tabsConfig.ts:103, 255`). The CMS panel itself uses `Database` for Sources. | VERIFIED |
| **A08-16** | The save pill's actionable states ("Unsaved changes", "Save failed — retry") are `<button>`s with no cursor or hover styling. "Conflict — reload" names an action but is a plain `span`. | VERIFIED in code; not measured |
| **A08-17** | The footer "Desktop · 100%" is a zoom menu button drawn as muted text with no caret, and it bundles the device name, which it cannot change. | VERIFIED |
| **A08-18** | The review pill draws "In review" and "Approved" the same way (D7 rule 3, deliberate). | PRODUCT DECISION REQUIRED |
| **A08-19** | Unread counts are shown two ways (the editor uses a dot, the dashboard an uncapped number). The editor's empty state promises "on this site", but `getRecentNotifications` covers the whole account. | VERIFIED |
| **A08-20** | Dashboard notification row actions are `hidden group-hover:flex`, so keyboard and touch users can't reach them. The row also has two doors to the same URL (the row click and "View"). | VERIFIED |
| **A08-21** | 7 site-menu rows open the dashboard in a new tab, but look the same as in-editor rows. | VERIFIED |
| **A08-22** | The rail dirty dot for Settings can't be seen, because Settings is not on the production rail (`RAIL_FIGMA`). | VERIFIED |
| **A08-23** | The dashboard "Published" pill ignores unpublished changes, and unknown statuses fall back to the warning tone. | VERIFIED |
| **A08-24** | The primary domain is marked with a yellow warning pill. | VERIFIED |
| **A08-25** | The locked and unlocked Layers glyphs differ by one path, at 11px, in the same colour on hover or select. | NOT RUNTIME VERIFIED (legibility) |
| **A08-26** | Presence: "N editing" includes yourself, and the "Offline" state can't be reached, because a disconnected session hides the cluster. Low priority while collab is flag-off. | VERIFIED |
| **A08-27** | "Copy Site URL" is enabled on unpublished sites (it gives an error toast), while "View Published" beside it is disabled with a tooltip. | VERIFIED |

---

## Good as-is (verified)

- **IssueChip severity** is carried by shape *and* colour: shield, triangle, octagon (`IssueChip.tsx:273`). The accessible name includes the counts.
- **The live chip** (`Topbar.tsx:228-247`) shows the domain, not the URL. It is a real link, and the dot is `aria-hidden` with sr-only "Live at".
- **ReviewBadge** is a button only when it has somewhere to go, and a span otherwise (`Topbar.tsx:377-397`). This is the right non-action rule.
- **SaveStatus** gives each state its own colour token, and stays a span for the non-actionable states. Only A08-16's cursor gap remains.
- **Site-menu Unpublish** is role-gated (`StudioHeader.tsx:218`), so it doesn't open a 403 door.
- **The site context menu** disables "View Published" with a reason tooltip on unpublished sites (`context-menu.tsx:71-88`).
- **The Layers component-instance badge** is a single ◇ with one accessible name (`LayerTreeItem.tsx:258-266`). The duplicate ⚡ was removed.
- **Notification rows** in the editor use an unread bar plus an `aria-label="Unread"` disc, not colour alone.
- **The publish-with-errors confirm** makes "Fix issues first" the primary and "Publish anyway" the amber secondary (`StudioHeader.tsx:938-961`).
- **The site-header "View site"** on an unpublished site is a muted `span` with a title, not a fake link (`site-header.tsx:114-126`).

## Product decisions required

1. **A08-6:** should "Bring Forward / Send Backward" become DOM "Move up / down" (re-label and swap the arrows), or real z-order?
2. **A08-8:** what should feed the Issues chip (alt text, links, SEO, empty pages)? Until that is decided, should the zero state say "Brand checks pass"?
3. **A08-13:** should comment pins always be visible on the canvas, or only in comment mode with a count on the toggle?
4. **A08-18:** should "Approved" get its own (success) tone? The D7 colour budget says no.
5. **A08-2 / A08-3:** should the Password visibility option stay visible at all before password enforcement ships?

## Overlaps with other audits (observed, not audited here)

- **Prompt 12 (states and feedback):**
  - share-link revoke has no confirm (`access-tab.tsx:179`);
  - "Copy link" in the access tab gives no toast;
  - `publish.service.ts:4` imports `notifyWorkspaceOwner` but never calls it, so no publish or review notifications exist. The editor panel's comment still describes "live / review / changes / failed" types.
- **Prompt 13 (a11y):**
  - the hover-only notification actions (A08-20);
  - the blocked Publish has no visual state (A08-1) but is correctly focusable;
  - the M/T badges use `role="img"` with 8.5px text.
- **Prompt 14 (wiring):** `addIssue` has no callers. `clearIssues`/`removeIssue` are unused.
- **A03 (navigation):**
  - the card "Edit" opens a new tab (`site-card-full.tsx:134`), while the context-menu "Edit" navigates in the same tab (`projects/page.tsx:323-327`) — the same label with two behaviours, matching A03-5;
  - the Layers empty state still says "Open Insert".
- **Prompt 11 (DS consistency):** `Presence`/`Topbar` use raw `tw:bg-green-*`/`yellow-*` utilities instead of `--bk-success`/`--bk-warning` tokens. The `.bd-pg-chip` CSS is orphaned (A08-3).
- **Agent D (collab):** the Presence states (A08-26) need re-checking once `FEATURE_COLLAB` is on.

---

## AUDIT HANDOFF

- **Agent / Prompt:** C, Interaction & UX / Prompt 8: Signifiers & Affordances
- **Report:** `docs/audits/2026-09-25-full-audit/08-signifiers-affordances.md`
- **Counts:** P0 = 0 · P1 = 2 · P2 = 11 · P3 = 14
- **P0:** none. Each destructive-signifier candidate was checked for a confirm, or found to fail closed.
- **P1:**
  - **A08-1:** a blocked topbar Publish shows the solid accent CTA and does nothing when clicked. This happens for viewers, with the flag off, offline, during a pending review, and on every first paint.
  - **A08-2:** Page visibility Hidden and Password contradict themselves ("Not published" and "reachable via URL / enter a password"), and the password field and Copy button share a password nothing enforces.
- **P2:**
  - A08-3: Pages rows have no non-live status chip.
  - A08-4: Unpublish is the primary CTA.
  - A08-5: destructive actions are painted in the accent blue.
  - A08-6: "Bring Forward ↑" moves the element down.
  - A08-7: the eye glyph is overloaded, and Layers "hidden" is not hidden.
  - A08-8: "No issues" reflects brand lint only.
  - A08-9: Issue rows only close the panel, and the progress bar is fake.
  - A08-10: "Ignore once" is permanent and covers the whole token.
  - A08-11: the "Mentions" tab shows security and payment alerts.
  - A08-12: notifications with no link are shown as "deleted".
  - A08-13: comment pins have numbers that match nothing and no count.
- **Runtime verified:** none visually. A unit run of 10 related test files gave 85/85 passing. Several of those tests pin the current (defective) behaviour as intended: `Topbar.test.tsx:37` and `reorderElement.order.test.ts:54`.
- **NOT RUNTIME VERIFIED:**
  - every computed colour, cursor and hover claim;
  - glyph legibility (A08-25);
  - how often the blocked-Publish states occur in production (depends on the build flags);
  - how many real notifications have a null `actionUrl`.
- **Dependencies:**
  - A08-2 and A08-3 should land together, because they share the page-status copy.
  - A08-8, A08-9 and A08-10 all sit in the Issues bridge (`AquibraStudio.tsx:304-329, 622-641`), so they form one batch.
  - A08-11 and A08-12 share the notification producers and schema.
  - A08-5 is a mechanical token swap at 6 sites (7 lines).
  - A08-6 needs the product decision first.
- **Inventory corrections:**
  - The Issues panel is "fed only by the DS linter" (correct), and the IssueChip's zero state presents that as a site-wide all-clear.
  - The notifications "mentions" filter is confirmed as security plus payment types.
  - No publish or review notification producer exists: `notifyWorkspaceOwner` is imported by `publish.service.ts` but never called.
