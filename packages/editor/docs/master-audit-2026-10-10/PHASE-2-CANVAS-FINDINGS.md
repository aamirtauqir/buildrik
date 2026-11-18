# Phase 2 — Newly verified canvas failures

No application code was changed to diagnose or fix these findings. Fixtures were created in an isolated Chromium context on the local demo; dimensions/zoom and a preceding edit were set through Composer, then gestures used the real rendered selection handles. This is a browser/engine integration probe, not proof of all inspector input workflows or authenticated persistence.

## CAN-01 — Resize changes coordinate systems at non-100% zoom — P0

A heading had model/computed dimensions400×80px. At50% zoom its screen rectangle was200×40px. Dragging the right edge+20 screen pixels stored220×40px and rendered110×20px. The expected result is440×80 CSS pixels. At100% zoom the same gesture correctly stored420×80px.

Evidence: [measurements](evidence/resize-runtime.json). Source: `src/engine/canvas/canvasGeometry.ts:getElementBounds` returns boundingClientRect dimensions; `ResizeOrchestrator.calculateResizeBounds` adds client-coordinate deltas; `resize/DOMUpdater.ts` writes those numbers as CSS/model pixels. No zoom normalization occurs in that inspected path.

User impact: normal resizing can shrink the element and change the supposedly untouched axis. Design polish cannot compensate for this unreliable direct manipulation.

Acceptance after approval: equivalent gestures at50/100/150% preserve CSS-space dimensions; horizontal resize leaves height unchanged; include zero-delta, aspect ratio, min/max, nested/absolute/rotated elements, snapping, undo and breakpoint scope.

## CAN-02 — Keyboard-triggered resize can write NaNpx — P0

At100% zoom, a400×80 heading's right resize handle was focused and activated with Enter; a subsequent pointer move/release committed `width: NaNpx`. The browser ignored the invalid width and the heading expanded to984px in this fixture. No uncaught page error reported the invalid document style.

Evidence: [before/after values](evidence/resize-runtime.json), [result screenshot](evidence/keyboard-resize-invalid.png). Source: `SelectionHandles.tsx` casts a KeyboardEvent to React.MouseEvent; `useCanvasResize` reads `clientX/clientY`; the resize handler accepts them without a finite-coordinate guard. The test demonstrates activation plus completion, not that pressing Enter alone commits the value.

Acceptance: keyboard interaction has a defined finite dimension model, announced feedback and cancellation; no valid gesture or mixed input sequence can store NaN/Infinity. Preserve the alternative numeric-inspector path and test focus ownership.

## CAN-03 — Cancelling a resize undoes an unrelated earlier edit — P0

A separate completed color transaction set the heading to `rgb(180,20,20)`. Starting a right-edge resize and pressing Escape restored width/height but removed that preceding color style. The user cancelled the new gesture, not the previous accepted edit.

Evidence: [before/after values](evidence/resize-cancel-runtime.json). Source: `ResizeHandler.cancelResize` restores transient DOM bounds, ends the transaction and calls `history.undo()`. If no model mutation was committed during the gesture, this can target the previous transaction.

Acceptance: cancelled gestures restore only their own baseline; previous model content, history position and redo state remain unchanged. Include parent-expansion paths, where transient and model mutations may differ.

## MENU-01 — Layers context menu does not move focus with ArrowDown — P1

Right-click Heading in Layers focused `Cut · Heading`; ArrowDown left focus on that same item. The page context menu moved from Rename to Duplicate under the equivalent key. Source agrees: LayerContextMenu focuses the first button but has no menu roving handler, whereas PageContextMenu uses the shared Menu primitive.

Evidence: [keyboard probe](evidence/layers-menu-keyboard.json), [Layers screenshot](evidence/layers-menu.png), [Pages screenshot](evidence/pages-menu.png). These are different menus; the earlier canvas-menu patch does not fix Layers.

Acceptance: all menu families implement their declared keyboard contract, including disabled rows, Escape, focus return and viewport bounds.

## Existing test coverage

The targeted existing canvas suite passed **11 files /210 tests**: resize math/constraints/snap/hit tests, ResizeHandler snap, canvas drag/drop, selection and reorder coverage. No tests were modified in this phase. This is evidence of existing coverage, not evidence that the new browser failures are harmless or fixed. Browser integration coverage needs the above sequences after implementation is approved.
