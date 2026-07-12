# Editor PRD · Ch.04 — Canvas

> Part of BUILDRIK-PRD-EDITOR v2.0 · `main` @ `e5624ca1` · 2026-07-07 · base `packages/editor/src/editor/canvas/`

## 4.1 Capabilities

- **Selection**: SSOT = engine SelectionManager, React mirrors via events (`hooks/useComposerSelection.ts:96-108`). Click / Shift+click additive / ⌘click click-through cycling / double-click first child / triple-click deep-select (`useSelectionBehavior.ts:74-264`). Locked elements toast + block (`:88-115`). Hit expansion for small elements. Inspector pick-mode (crosshair, Escape cancels) (`Canvas.tsx:159-181,415-434`). Root excluded everywhere.
- **Drag**: event delegation survives innerHTML recreation (`useCanvasElementDrag.ts:151-503`); Alt+drag = clone (`:216-240`); multi-drag payload `application/x-aquibra-multi`; custom ghost ≤300px removed after 50ms (BUG-018); touch long-press 500ms/5px cancel (`drag/useTouchDrag.ts:33-36`); drop chain multi→element→component→catalog→template→block (`drag/useDropExecution.ts:263-282`); DataTransfer snapshotted synchronously (browsers zero it, `:172-184`); OS image drop → upload + src (`:219-261`).
- **Resize/rotate**: engine ResizeHandler; 8 handles (edges only if >50px); rotation offset 24px, Shift 15° snap, aria slider 0-360; live W×H readout; hidden for locked (`overlays/SelectionHandles.tsx:81-208`, `SelectionBoxOverlay.tsx:426-533`).
- **Inline text edit**: double-click, whitelisted tags (p…blockquote), no nested ids; Enter commits/Escape reverts; sanitize + setContent + save (`useCanvasInlineEdit.ts:31-211`). Rich commands via Selection API not execCommand; unsafe URLs rejected (`useCanvasInlineCommands.ts:46-131`).
- **Snapping**: threshold 5px ÷ scale, sibling edges+centers, cap 5 lines, magenta overlay (`useCanvasSnapping.ts:31-184`); engine smart guides for drag-over; ruler guides persisted `buildrick-guides`.
- **Zoom**: presets [10…300] step to next/prev; fit-to-screen 64px breathing clamp [0.1,5] (`shared/constants/canvas.ts:381-387`, `Canvas.tsx:260-282`). No free-pan mode.
- **Device preview**: DEVICE_SIZES wide 1920 / desktop 100% / tablet 768×1024 / mobile 375×812 / watch 196×230; CSS device frame only mobile/tablet (`Canvas.types.ts:47-56`, `DeviceFramePreview.tsx:54-231`).
- **Context menu**: nearest id + elementsFromPoint stack picker; data frozen at open; 4 submenus + standalone (`Canvas.tsx:437-462`, `menus/contextMenuRegistry.ts:49-105`).
- **Insertion UX**: empty-canvas CTA (Browse templates/Start blank); QuickAddBar 5 blocks; palette quick-add; nesting-validated drops + column placeholder clearing + success animation (`CanvasEmptyCTA.tsx`, `drag/dropOperations.tsx:378-486`).

## 4.2 Keyboard

Canvas-scoped (`useCanvasKeyboard.ts`): ⌘A all · Tab/⇧Tab cycle · ⇧F10 context menu · Del/Backspace delete (multi = one txn, excludes locked) · Esc clear · arrows tree-nav (↑↓ siblings ←parent →child) · ⌘arrows 1px, ⇧arrows 10px, Alt-arrows reorder · ⌘D dup · ⌘C/⌘⌥C copy/copy-styles · ⌘V/⌘⌥V paste/paste-styles · ⌘X cut — all toasted w/ Undo. Cheat sheet '?'. Palette ⌘⇧P.
⚠ **Second overlapping window-level arrow handler** `drag/useKeyboardMove.ts` (arrows = reorder/reparent) conflicts with canvas arrows — see defects.

## 4.3 State machines

No single canvas-mode enum — implicit flags: editing.id · pickMode · DragSessionState {isDragOver, draggingElementId, dropTargetId, dropPosition before/after/inside, isValidDrop, invalidDropReason, dropSlotRect} (`useDragSession.ts:35-73`) · clone/axis refs · touch refs · isResizing/isRotating · SectionDragState · MarqueeState (min-drag 5px, `useCanvasMarquee.ts:13-186`). Engine DragManager = drag SSOT.

## 4.4 Enums

DropPosition ×4 · DropErrorType ×8 (`useCanvasDragDrop.ts:27-35`) · InvalidDropReason ×9 (`DropFeedbackOverlay.tsx:18-28`) · CursorContext ×9 → CURSOR_MAP (`useCursorIntelligence.ts:23-80`) · AxisConstraint ×3 · HandlePosition ×8 · CanvasOverlayState {guides,spacing,grid,rulers,badges,xray}.

## 4.5 Business rules

Snap 5px (⚠ comment says 4) · grid 10px · zoom 10-300 step 10 (⚠ engine THRESHOLDS say 500 max) · element MIN 10 MAX 10000 (⚠ shared tokens minElementSize 20 — conflict) · drop edge zones 25% · drop slot 48px · drag throttle 50ms · auto-scroll edge 60/speed 2-20 (⚠ panel-drag 50/15) · multi-click 400ms/5px · rotation snap 15° · keyboard steps 1/10/50 · rulers 20/100/10 · z-scale 1→5500 (⚠ SmartGuides hardcodes 9999) · quick-style presets (padding 16, border 1px #ccc, shadow 0 2px 8px) · toasts 2-5s.

## 4.6 Defects (feeds §13)

1. **Dual conflicting arrow-key handlers** (canvas vs window) — double-execution risk (`useCanvasKeyboard.ts:242-312` vs `useKeyboardMove.ts:61-176`); step magnitude dead in the latter
2. Constant conflicts: minElementSize 20 vs 10; auto-scroll 60 vs 50; snap comment 4 vs 5; z 9999 vs scale
3. GSAP selection animation disabled "FOR STABILITY", code retained (`SelectionBoxOverlay.tsx:316-321`)
4. Catalog drop v1 = placeholder insert, "future renderer arc" (`dropOperations.tsx:492-536`)
5. Duplicate type defs (DragModifiers/AxisConstraint ×2); dead `payloads` arg cast `as any` (`useDropExecution.ts:265-278`)
6. Bug-fix archaeology: BUG-009/012/015/018; 5 dead event listeners removed (`useCanvasSync.ts:44-49`); context Copy/Paste separate-clipboards fixed (`menus/actions/editActions.ts:18-24`)
7. Palette "Open SEO" honest fallback — drawer deep-link pending (`useCanvasCommandPalette.ts:209-217`)

## 4.7 Integration

Engine: selection/elements/history/commands/canvas.{resize,drag,indicators}/media/mediaOps/components/styles/cms/designSystem.tokenBindingResolver/collab. Events consumed/emitted per lists (`useCanvasSync.ts:74-80`, `Canvas.tsx:299-513`). DOM contract: `data-buildrick-id`, `.buildrick-canvas`, innerHTML memoized against reconciler wipes (`Canvas.tsx:349-363,497-509`).
