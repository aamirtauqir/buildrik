# Source findings and prioritization

These extend, rather than replace or renumber, UX-01–25 in the earlier runtime audit. Severity reflects user impact. “Source confirmed” means the implementation supports the stated behavior; it is not a claim of live production reproduction.

## IA-01 — Keyboard cannot operate submenu actions (High; regression reproduced, corrected)

**Evidence:** `canvas/menus/ElementContextMenu.tsx` navigated only top-level actions. ArrowRight set `activeSubmenu` without child navigation. `SubmenuItem.tsx` measured position only on mouse hover; keyboard activation left coordinates at zero. `MenuItem.tsx` derived `aria-expanded` from highlighting, so focus alone announced an open submenu. Click activation was an empty handler.

**Impact:** Style/Structure/Arrange actions were inaccessible through the advertised keyboard navigation, and click-only users could not open submenus.

**Change:** One active keyboard level with child index, ArrowLeft/Escape return, Home/End, Enter/Space, click activation, activation-independent measurement, and actual expanded state. Escape is owned by the menu rather than also by the document click-outside hook. Existing actions and visual styling retained.

**Verification:** Three new regression tests failed before correction. All six menu test files / 25 tests passed after correction. Browser and typecheck results are recorded in IMPLEMENTATION.md.

## IA-02 — Action grouping mixes different intentions (Medium; design recommendation)

**Evidence:** `canvas/menus/contextMenuRegistry.ts` puts clipboard actions, wrapping, replacing a block and saving a reusable component together under Structure; Delete is adjacent to frequent top-level operations; AI is prominent regardless of the selected element's task.

**Impact:** Users must infer organization from implementation history. High-frequency clipboard actions require extra navigation, while destructive and specialized actions compete for attention.

**Target:** Clipboard/duplicate first; structure/arrange next; relevant style/content/component/interaction doors next; lock and destructive action last. Use the matrix in INTERACTION-SPEC.md. Do not remove the underlying features.

**Accept:** Text, image, root, group, CMS-bound element and multiselection each show a task-relevant menu. Menu order and availability match inspector and command palette contracts.

## IA-03 — Disabled-action reasons disappear at the menu adapter (Medium; source confirmed)

**Evidence:** `shared/elementActions.ts` supports `true | string` availability; `canvas/menus/actions/standaloneActions.ts:fromElementAction` converts it to boolean. ContextAction only carries boolean. The context menu cannot explain “copy styles first” or a locked target using the registry's existing explanation.

**Target:** Preserve the reason through the adapter and expose it accessibly. Hide irrelevant capabilities; disable relevant but temporarily unavailable operations with a short reason.

**Accept:** Locked mutation and empty style clipboard have a visible/accessible explanation; read-only cannot execute through menu, shortcut or inspector.

## IA-04 — Group eligibility does not match engine eligibility (Medium; source confirmed)

**Evidence:** Group visibility in `standaloneActions.ts` checks only selection count >=2. `engine/elements/ElementManager.ts:groupElements` returns null when selected nodes do not share a parent. The context handler provides no failure feedback for that refusal.

**Impact:** An offered action can silently do nothing. Engine refusal protects one case but does not make the UI understandable.

**Target:** Shared selection eligibility with reason, used by menu/command/palette. Preserve document order. Independently verify locked parent/child and non-contiguous selection mutation before shipping changes.

**Accept:** Cross-parent selection does not offer an enabled Group; valid grouping is one undo step and keeps a meaningful selection. Do not infer data-loss behavior without a dedicated mutation test.

## IA-05 — Arrange labels imply stacking while commands reorder siblings (Medium; source/design mismatch)

**Evidence:** `menus/actions/layoutActions.ts` labels operations Bring to front/Send to back. `engine/commands/defaultCommands.ts` routes them to sibling-order operations; reorder tests assert first/last sibling movement. Availability only excludes root, without boundary checks.

**Impact:** In normal document flow users may interpret a page-position change as a z-index change. Already-first/last moves remain offered.

**Target:** “Move earlier/later/first/last” for normal flow; reserve stacking language for a defined stacking operation. Disable impossible moves with reason. Validate flex order, grid and positioned layouts before changing labels globally.

## IA-06 — Surface routing has multiple sources of truth (Medium; source confirmed architecture risk)

**Evidence:** `rail/tabsConfig.ts` models panel/fullpage. Right-column modes are in a separate set; Assets overrides panel mode through `mediaFullPage`; CMS replaces canvas/inspector via a separate boolean in `shell/StudioPanels.tsx`. `sidebar/FullPageRouter.tsx` documents three distinct takeover shapes.

**Impact:** A new feature must understand several independent routing decisions to get close, Escape, permissions and sizing correct. Different surface shapes are valid; their policies are not yet one explicit contract.

**Target:** Express surface family, scope, return context and allowed expansion in one typed route policy, retaining each legitimate layout. Migrate one family at a time rather than rewrite StudioPanels in one change.

**Accept:** Every route has a documented host, focus rule, close behavior, persistence rule, role gate and small-viewport behavior; existing deep links remain valid.

## IA-07 — Full-page coverage is visually stronger than focus isolation (High; runtime + source confirmed)

**Evidence:** UX-22 reproduced hidden editor controls in Settings' keyboard/accessibility path. FullPageRouter uses bare fixed portals; LayoutShell.css hides drawer/canvas/inspector but not all underlying chrome. Brand host also lacks the fullpage surface attribute used by other hosts.

**Target:** Inert the covered editor subtree while leaving active workspace and nested overlay roots operable. Move focus into the workspace; return it to the opener. Do not put `inert` on a common ancestor containing the portaled workspace.

**Accept:** Keyboard and screen reader encounter only active workspace plus owned dialogs; first Escape closes innermost surface, then unsaved guard applies. Settings, Templates, Assets and Brand all pass the same contract.

## IA-08 — Preview is not a full interaction runtime (High validation gap; source confirmed)

**Evidence:** `shell/PreviewOverlay.tsx` uses an iframe sandbox with `allow-same-origin` and no `allow-scripts`, intentionally. Link handling is attached by the parent. `engine/export` contains separate interaction, slider, accordion and countdown runtimes. `renderPreviewHtml` resolves static CMS content from exportHTML.

**Impact:** A user cannot treat every previewed behavior as proof of published behavior. This is distinct from the responsive typography mismatch in UX-09.

**Target:** Define static visual preview versus isolated interactive preview. For supported built-in behaviors, use an isolated runtime/origin and shared export contract. Explicitly label custom-code limitations and provide staging validation. Do not simply enable scripts together with same-origin access in this iframe.

**Accept:** Test navigation, slider, form, interaction, CMS and breakpoint output in canvas/preview/export/staging; document intentional differences. Security review precedes runtime sandbox changes.

## IA-09 — Preview loses editing context (Medium; runtime + source confirmed)

**Evidence:** UX-11 observed Mobile → Preview opening Desktop. `PreviewOverlay.tsx` initializes local device to desktop and uses fixed widths. UX-09 observed different rendered mobile typography, which must be diagnosed separately rather than assumed solved by device preservation.

**Target:** Pass current page and viewport into preview; preserve preview width while navigating pages; return to the original edit selection and zoom.

**Accept:** Mobile → Preview opens same width and page; resizing changes actual iframe viewport; no silent reset after async export.

## IA-10 — Inspector architecture is capability-aware, but effective state is not reliably communicated (High; mixed evidence)

**Evidence:** `shared/constants/elementCapabilities.ts` and `inspector/sections/registry` already filter by type; this is a strength. UX-10/25 nevertheless show effective line height/alignment disagreement, and UX-14 mislocated override indicators. `sectionOrder.ts` places layout, typography, size, spacing under Style but puts classes/attributes in Behaviour alongside interactions.

**Target:** Keep capability filtering; unify resolved value + origin (base, breakpoint, class, token, inherited, component override). Organize common style fields ahead of advanced fields, and explain reset scope.

**Accept:** For inherited, token-bound and breakpoint-overridden values, inspector equals computed canvas/output or clearly names intentional differences. Reset removes only the targeted override.

## IA-11 — CMS takes broad space without broad-task guidance (Medium; runtime + source confirmed)

**Evidence:** UX-15–17. `cms/CmsWorkspace.tsx` reserves an inspector-width HintColumn even for empty selection states. Records/Fields, record sheets, import and dynamic-page tools exist; the issue is discovery and progression, not lack of a CMS.

**Target:** Central empty state with Create collection / Import content, examples and optional dynamic-page explanation. Once populated, use broad table workspace and contextual field/record details; avoid a permanent empty hint column.

**Accept:** First collection starts on its actual incomplete step, creates fields and a record, optionally creates a dynamic page, binds an element, and returns to that element without losing context.

## IA-12 — Fixed responsive overlay policy needs content-based validation (Medium; source confirmed risk)

**Evidence:** `rail/LayoutShell.css` makes the inspector absolute below 1366px while an open drawer still consumes space. This avoids squeezing the inspector, but places it over the editable area. UX-01 independently confirms clipping at 1280×720; it does not prove every panel is broken.

**Target:** Enforce a usable canvas minimum; collapse the least-recent secondary panel or use one transient panel below the supported working width. Preserve deliberate pins where space allows. Constrain dropdowns by measured viewport, including short-height screens.

**Accept:** 1440×900, 1280×720, 1024×768 and 200% zoom: active controls reachable, no page-level horizontal overflow, selected element can be revealed, nested menus stay usable. Explicit support policy for phone authoring rather than pretending desktop chrome fits.

## IA-13 — Settings mixes authored state and server state, so save semantics must be explicit (Medium; runtime issue + source review)

**Evidence:** UX-21 shows premature invalid styling while shell says saved. Settings navigation has site-scoped panes and workspace destinations; BuildrikSyncProvider separately handles project saves, conflicts, refusal of unloaded projects and site metadata mirroring.

**Target:** Preserve the existing site/workspace separation. Each pane states whether it autosaves, requires Save, affects publishing, or opens another workspace. Validation should reflect touched/submitted state. Global saved state must not imply an invalid local draft was persisted.

**Accept:** Load failure, untouched invalid server value, unsaved change, save failure, conflict and successful save each have distinct truthful states; route exit follows the pane's save model.

## IA-14 — Feature richness exceeds verified workflow coverage (High release risk; coverage finding)

**Evidence:** Routed publish/review/history/asset/CMS workflows and their tests exist. The earlier audit exercised a demo, not authenticated service round trips. Existing engine instructions explicitly restrict multiplayer production use. Public-facing feature presence cannot be inferred from a local flag or a catalogue entry.

**Target:** Maintain a release matrix by environment, role, entitlement and service availability. Preserve existing gates until their own acceptance criteria pass; expose understandable unavailable states where discovery is useful.

**Accept:** Authenticated owner/editor/viewer flows, reload persistence, failure recovery, review delivery, publish/rollback, plan restrictions and relevant server authorization are exercised with disposable fixtures. No production rollout claim before this evidence exists.

## IA-15 — Top-level menu lacks viewport-bound positioning (Medium; source confirmed)

**Evidence:** `canvas/Canvas.tsx:handleContextMenu` passes clientX/clientY directly; `ElementContextMenu.tsx` applies them as fixed left/top without measuring/clamping its own bounds. Submenu positioning has a separate policy. Long menus near the bottom or right edge can exceed the viewport.

**Target:** Measure main and nested menus, flip/clamp and constrain height; permit internal scrolling without triggering `useCanvasContextMenu`'s capture-phase window scroll dismissal. Treat this as its own follow-up to the keyboard correction.

**Accept:** Right-click at each viewport corner and at 200% zoom; every action reachable with pointer and keyboard, no horizontal page overflow, submenu remains anchored.

## IA-16 — Passing design gates do not establish whole-product visual parity (Medium; tooling evidence)

**Evidence:** This audit's `verify:ds` run reports 36/302 active boards measured (11.9%). Its board summary also lists 3 drift-OPEN, 10 unreachable, 15 no-verdict and 26 unchecked; the hex-drift check passes with 10 known defects still standing. Anchor checks explicitly warn that template-prefix matches do not prove individual rendered IDs.

**Impact:** Green conformance gates can coexist with unmeasured screens and known visual debt. They are useful regression constraints, not evidence that every workflow matches Figma or is usable.

**Target:** Track runtime workflow coverage alongside design recipes; prioritize representative states for each surface family and document intentional differences. Keep baselines honest rather than raising them to obtain green checks.

**Accept:** Every release-critical workflow has current runtime evidence at supported dimensions, including error/empty/permission states. Report measured, unresolved and untested coverage separately.
