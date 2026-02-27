/**
 * Hit Tester
 * Functions for testing mouse position against resize handles
 *
 * @module engine/canvas/resize/HitTester
 * @license BSD-3-Clause
 */

import type { SelectionBox } from "../../../shared/types/canvas";
import { DEFAULT_HANDLE_HIT_AREA, DEFAULT_BORDER_HIT_WIDTH } from "./constants";
import type { HandlePosition, AnyHandle } from "./types";

/**
 * Test if mouse is over a resize handle
 */
export function hitTestHandles(
  selectionBox: SelectionBox,
  mouseX: number,
  mouseY: number,
  hitArea: number = DEFAULT_HANDLE_HIT_AREA
): HandlePosition | null {
  for (const handle of selectionBox.handles) {
    if (
      mouseX >= handle.x - hitArea / 2 &&
      mouseX <= handle.x + hitArea / 2 &&
      mouseY >= handle.y - hitArea / 2 &&
      mouseY <= handle.y + hitArea / 2
    ) {
      return handle.position;
    }
  }

  return null;
}

/**
 * Test if mouse is over the rotation handle
 */
export function hitTestRotation(
  selectionBox: SelectionBox,
  mouseX: number,
  mouseY: number,
  hitArea: number = DEFAULT_HANDLE_HIT_AREA
): boolean {
  if (!selectionBox.rotationHandle) return false;

  const rh = selectionBox.rotationHandle;

  return (
    mouseX >= rh.x - hitArea / 2 &&
    mouseX <= rh.x + hitArea / 2 &&
    mouseY >= rh.y - hitArea / 2 &&
    mouseY <= rh.y + hitArea / 2
  );
}

/**
 * Test if mouse is on the selection box border
 */
export function hitTestBorder(
  selectionBox: SelectionBox,
  mouseX: number,
  mouseY: number,
  borderWidth: number = DEFAULT_BORDER_HIT_WIDTH
): HandlePosition | null {
  const { x, y, width, height } = selectionBox.bounds;
  const bw = borderWidth;

  const onTop = mouseY >= y - bw && mouseY <= y + bw && mouseX >= x && mouseX <= x + width;
  const onBottom =
    mouseY >= y + height - bw && mouseY <= y + height + bw && mouseX >= x && mouseX <= x + width;
  const onLeft = mouseX >= x - bw && mouseX <= x + bw && mouseY >= y && mouseY <= y + height;
  const onRight =
    mouseX >= x + width - bw && mouseX <= x + width + bw && mouseY >= y && mouseY <= y + height;

  if (onTop && onLeft) return "nw";
  if (onTop && onRight) return "ne";
  if (onBottom && onLeft) return "sw";
  if (onBottom && onRight) return "se";
  if (onTop) return "n";
  if (onBottom) return "s";
  if (onLeft) return "w";
  if (onRight) return "e";

  return null;
}

/**
 * Combined hit test for all handles
 */
export function hitTest(
  selectionBox: SelectionBox,
  mouseX: number,
  mouseY: number,
  handleHitArea: number = DEFAULT_HANDLE_HIT_AREA,
  borderHitWidth: number = DEFAULT_BORDER_HIT_WIDTH
): AnyHandle | null {
  // Check rotation handle first
  if (hitTestRotation(selectionBox, mouseX, mouseY, handleHitArea)) {
    return "rotation";
  }

  // Check resize handles
  const handle = hitTestHandles(selectionBox, mouseX, mouseY, handleHitArea);
  if (handle) return handle;

  // Check border
  return hitTestBorder(selectionBox, mouseX, mouseY, borderHitWidth);
}
