# Target interaction and workspace contract

This is a proposed product specification. Existing behavior is recorded separately in FINDINGS.md. Implement incrementally and preserve saved projects, commands, deep links, permissions and history.

## Navigation and scope

Keep six durable authoring destinations: **Add, Layers, Pages, Assets, CMS, Brand**. Components are discoverable within Add and through selected instances. Templates open from Add or New page with intent carried into the browser. Site settings live in the site menu. Preview and Publish remain persistent top-bar tasks. Review, History and Activity are secondary task modes with direct links from relevant status/notification entries.

Show the active site, page, editing mode and breakpoint. The inspector belongs to the selected object; a CMS record or brand workspace must not leave page-element controls pretending to be active. Account/workspace settings must explicitly name that scope before leaving the editor.

## Surface selection

| Surface | Use when | Required behavior |
|---|---|---|
| Context menu | A short action on the current target | Filter by target/capability; close after action; keyboard and click work; no large editors embedded |
| Popover | Small value/preset choice | Anchor to field, fit viewport, clear apply/live-edit semantics, Escape returns focus |
| Inspector section | Edit a property of selected object | Canvas remains visible, immediate feedback, effective value + origin, undo |
| Left sidebar | Browse hierarchy or insert while watching canvas | Search, meaningful hierarchy, resizable within supported range, preserve scroll/search |
| Expanded library | Scan visual choices or manage larger result sets | Explicit Expand/Back, remember query/selection, return result to originating field |
| Right task panel | Review, publishing status, history, AI, issues | One task panel at a time; retain selection; closing restores prior inspector |
| Full workspace | Work primarily on tables, assets, global tokens or site configuration | Own nav/header/content, explicit return, background inert, independent content scrolling |
| Compare workspace | Inspect two versions/differences | Adequate width, label before/after and scope; return to originating History/Review entry |
| Dialog / sheet | Bounded creation, confirmation, record edit | One primary task, validation, focus containment, nested Escape ownership, unsaved protection |

Do not choose full width merely because a feature has many controls. Use progressive disclosure in the inspector for element-local complexity. CMS records and asset bulk management benefit from width because the task itself spans rows/columns or multiple items.

## Context-action matrix

One canonical eligibility/handler source; surfaces may choose order, but must not invent mutation behavior.

| Action | Show for | Disable / omit when | Destination/result |
|---|---|---|---|
| Copy / Duplicate / Cut / Delete | Non-root target or valid selection | No writable target; structural constraints. Copy may remain on locked content if permitted | Shared selection commands; single history transaction for writes |
| Paste | Valid insertion parent | Empty/incompatible clipboard or locked destination | Insert with visible selection and precise placement |
| Copy styles / Paste styles | Stylable element | Paste disabled with explanation when clipboard empty; locked target | Copy property payload, preserve breakpoint/style scope contract |
| Group | Multiple siblings | Cross-parent, locked participants/parent, unsupported structure | New group selected; one undo |
| Wrap | Wrappable non-root target | Invalid parent or lock | Wrapper selected or original focus retained by declared policy |
| Ungroup / Unwrap | Eligible structural wrapper | Root, protected/semantic constraints, no children, lock | Children preserved and selected; no silent selection loss |
| Arrange | Movable siblings | First/last boundary or forbidden parent | DOM order explicitly labelled; no implicit z-index claim |
| Replace block | Supported structural block | Lock, unsupported type, destructive replacement lacking scope | Scoped replacement browser, preview and preservation rules |
| Create component | Eligible selection | Unsupported/root scope, unavailable storage or permissions | Name/create dialog, then master/instance identity visible |
| Edit component / Detach | Component instance | Already detached, unavailable master, forbidden action | Explicit master versus instance scope |
| Bind content | Supported CMS field target | Unsupported type; no collection triggers create/select guidance | Binding inspector with field type filtering |
| Add interaction | Supported interactive target | Unsupported target/runtime | Interaction inspector section |
| Improve with AI | Supported editable target | Service unavailable/read-only; meaningful reason | Scoped AI task with apply/undo |
| Lock / Unlock | Non-root element | Permission constraint | State changes visibly in canvas/layers/inspector |

Suggested groups: clipboard/edit; structure/arrange; style and relevant feature doors; lock; separated Delete. For root, offer page-relevant controls rather than a normal element menu. For multiselection, name the count and never silently apply single-target actions to an arbitrary member.

## Menu contract

- Click, pointer hover and keyboard open the same submenu at the same anchor.
- Up/Down navigate the active level; Right/Enter opens; Left returns; Enter/Space executes; Home/End jump; Escape closes one level; Tab dismisses.
- Announce actual expanded and disabled state, including reason where applicable.
- Measure real bounds and flip/clamp; short viewports need scrollable menus. Scrolling inside a menu must not trigger the canvas's global dismiss handler.
- Revalidate mutation eligibility at execution. A frozen menu snapshot must not bypass locks or permissions changed after opening.
- Closing should restore a useful focus target; no document-body keyboard dead end.

## Responsive panel policy

Proposed starting ranges, to validate against content and the existing token system: left drawer 260–360px, inspector 280–360px, canvas working area at least 480px. These are not competitor dimensions or finalized Figma tokens.

At 1440px, both panels may dock. At 1280px, use actual available space rather than a blanket overlay: collapse the least-recent unpinned secondary panel if the usable canvas minimum cannot be met. At 1024px, prefer one active side panel with a clear return/close control. For widths below the supported authoring minimum, provide an explicit compact mode or support message; do not ship clipped controls. Phone preview width is independent of browser chrome width.

Full workspaces use a collapsible navigation column and flexible content; tables scroll inside their region with persistent row identity and reachable actions. Record/asset details become a sheet when a permanent third column leaves insufficient usable content. Short-height screens scroll content without hiding exit or primary actions. Menus and dialogs must fit 200% zoom.

## Inspector and state

Common order: selected-object identity; layout; size; spacing; typography when relevant; appearance; content/type-specific configuration; interactions; advanced. Figma should evaluate whether Content/Style/Interactions tabs improve scanning over the existing Style/Behaviour/Effects split before changing all routes.

Every field needs a resolved value and an identifiable source: local base, breakpoint override, inherited, class, token or component override. Reset text names what is reset. Mixed multiselection values remain mixed until explicitly changed. Token/variable pickers should show human labels, swatches/previews and usage rather than raw technical IDs by default.

Preserve page, selection, viewport, zoom, sidebar query/scroll and caller on workspace return. Distinguish Back (within task), Back to canvas (leave workspace), Cancel (discard draft), Close (dismiss), and Save (persist draft). The primary exit position and wording should be consistent across workspace families.

## Loading, empty, error and permission states

Each feature must specify loading, empty, populated, selected, invalid, saving, saved, failed/retry, offline/conflict, read-only and unavailable states. A helpful empty state offers the first task where work will happen. Success feedback must correspond to completion, not merely dispatching a request. Avoid stacking onboarding, success and next-step dialogs over the same task.

For remote operations, state whether edits are local, queued, saved, published or blocked. Recoverable failures preserve user input. Destructive operations name affected items and support undo or a specific confirmation where undo is unavailable. Keep existing service/role gates effective on all alternative entry points.
