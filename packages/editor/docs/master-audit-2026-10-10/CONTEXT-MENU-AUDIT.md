# Context-menu audit — current behavior

All55 canonical element types were evaluated in110 locked/unlocked cases using the actual registry and real Composer-created fixtures. This establishes menu visibility/availability, **not** successful action execution or complete element functionality. AI callback was present; clipboard empty; single selection. [Raw matrix](evidence/context-menu-type-matrix.json) includes every action label/group/enabled flag.

## Per-element relevance matrix

Common actions were broadly shared: AI, duplicate/delete, sibling arrangement, style copy/paste, wrap/unwrap, clipboard, component creation, lock/unlock and interaction. Text-specific Edit text and Select parent are not explicit rows in this menu registry. Their absence from this menu is not proof the editor lacks those capabilities elsewhere. CMS binding is correctly capability-filtered rather than a global collection-manager action.

| Type | Inspector capability block | CMS binding door | Replace block door | Locked mutation rows currently offered |
|---|---|---|---|---|
| heading | heading | Yes | No | Delete enabled; Wrap in container enabled; Cut enabled |
| text | text | Yes | No | Delete enabled; Wrap in container enabled; Cut enabled |
| paragraph | text | Yes | No | Delete enabled; Wrap in container enabled; Cut enabled |
| label | label | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| link | link | Yes | No | Delete enabled; Wrap in container enabled; Cut enabled |
| button | button | Yes | No | Delete enabled; Wrap in container enabled; Cut enabled |
| input | input | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| textarea | input | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| select | input | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| checkbox | choice | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| radio | choice | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| switch | choice | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| upload | input | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| image | image | Yes | No | Delete enabled; Wrap in container enabled; Cut enabled |
| video | video | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| audio | audio | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| svg | svg | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| icon | svg | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| lottie | lottie | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| video-embed | video-embed | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| map-embed | map-embed | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| spacer | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| divider | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| countdown | countdown | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| progress | progress | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| accordion | accordion | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| flex | flex | No | Yes | Delete enabled; Wrap in container enabled; Cut enabled; Replace with block… disabled |
| stack | flex | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| grid | grid | No | Yes | Delete enabled; Wrap in container enabled; Cut enabled; Replace with block… disabled |
| columns | grid | No | Yes | Delete enabled; Wrap in container enabled; Cut enabled; Replace with block… disabled |
| container | structural/general | No | Yes | Delete enabled; Wrap in container enabled; Cut enabled; Replace with block… disabled |
| section | structural/general | No | Yes | Delete enabled; Wrap in container enabled; Cut enabled; Replace with block… disabled |
| card | structural/general | No | Yes | Delete enabled; Wrap in container enabled; Cut enabled; Replace with block… disabled |
| cta | structural/general | No | Yes | Delete enabled; Wrap in container enabled; Cut enabled; Replace with block… disabled |
| hero | structural/general | No | Yes | Delete enabled; Wrap in container enabled; Cut enabled; Replace with block… disabled |
| features | structural/general | No | Yes | Delete enabled; Wrap in container enabled; Cut enabled; Replace with block… disabled |
| header | structural/general | No | Yes | Delete enabled; Wrap in container enabled; Cut enabled; Replace with block… disabled |
| footer | structural/general | No | Yes | Delete enabled; Wrap in container enabled; Cut enabled; Replace with block… disabled |
| nav | structural/general | No | Yes | Delete enabled; Wrap in container enabled; Cut enabled; Replace with block… disabled |
| navbar | structural/general | No | Yes | Delete enabled; Wrap in container enabled; Cut enabled; Replace with block… disabled |
| pricing | structural/general | No | Yes | Delete enabled; Wrap in container enabled; Cut enabled; Replace with block… disabled |
| social | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| testimonials | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| tabs | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| list | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| table | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| gallery | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| custom | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| list-item | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| form | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| slider | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| collection-list | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| product-card | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| product-grid | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |
| product-detail | structural/general | No | No | Delete enabled; Wrap in container enabled; Cut enabled |

## Menu-family audit

| Trigger / owner | Current contract evidence | Findings / open checks |
|---|---|---|
| Canvas selected element | `canvas/menus`, `Canvas.tsx:handleContextMenu` | Target selection preserved for existing multi-selection; registry frozen at open. Main menu uses raw pointer coordinates. Earlier working-tree keyboard patch is not original baseline. Lock state does not disable many offered mutations; underlying engine may refuse—do not call this lock bypass without execution evidence |
| Canvas spacing indicator | `canvas/spots/CanvasSpotSpacing.tsx` | Forwards right-click coordinates to the element; not a separate menu |
| Layers tree row | `panels/layers/components/LayerContextMenu.tsx`, `hooks/useLayersState.ts`, `useLayerContextActions.ts` | Target/count labels, root/lock/action behavior needs end-to-end check. Menu focuses first native button but has no own arrow-key navigation. Group can wrap one element here, while canvas Group requires multiple siblings: terminology/workflow divergence, not necessarily redundant feature |
| Page row | `sidebar/tabs/pages/components/PageContextMenu.tsx` | Uses shared Menu keyboard primitive; prevents homepage/only-page delete with visible reason; fixed estimated260px clamp may undercount folder/reason rows |
| Full media asset / quick chooser | `sidebar/tabs/media/components/MediaContextMenu.tsx`, `media/LibraryManager.tsx`, `SlimLauncher.tsx` | Shared asset actions, read-only tooltips, Escape captured before workspace handler. Fixed estimated eight-row clamp; no initial-focus or arrow navigation handler in this component. Upload/create/versions require separate verification |

Discovery searched actual `onContextMenu` consumers, not only files named ContextMenu. Overflow menus, command palette, tree-row shortcuts and inspector actions remain alternate entry points to compare. No action was deleted or moved during audit.

## Authenticated page and version overflow menus

Page menu Duplicate works; its advertised ⌘D did not work with a focused page row (PAGE-01). F2 rename worked. Home Delete is disabled with an explanation; deleting the copied page requires confirmation and Meta+Z restored it. The version overflow exposes details/name/restore/compare/delete; restore requires a scope explanation/confirmation and preserves a safety save. Compare omits page-name differences (HIST-01). See [workflow evidence](PAGES-HISTORY-AUDIT.md). These pointer tests used overflow triggers; they are not additional physical right-click coverage.
