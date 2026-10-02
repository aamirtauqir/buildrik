/**
 * Is an editor popup open that takes a bare Escape before whatever sits
 * behind it (the canvas selection, a right-column panel)?
 *
 * Shared by the engine's "deselect" shortcut and the column-panel Escape hook,
 * which is why it lives in shared/: engine/ may not import editor/.
 *
 * Counts only OPEN POPUPS, never a role that is merely mounted:
 * - `dialog`, `alertdialog` and `menu` — the chrome mounts these only while
 *   they are open.
 * - a listbox only through its expanded owner (`role="combobox"` or an
 *   `aria-haspopup="listbox"` trigger with `aria-expanded="true"`). A bare
 *   `role="listbox"` is also how the Templates and media grids mark
 *   themselves, and those stay mounted for as long as the panel does. A
 *   listbox inside a popover or palette is covered by its `dialog`.
 * - never canvas content: customer markup carries the same roles (the Modal
 *   block stamps `role="dialog"`, navbars carry `role="menu"`), and a
 *   selected Modal block would otherwise make Escape unable to deselect.
 *
 * @license BSD-3-Clause
 */

const OPEN_POPUPS = [
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[role="menu"]',
  '[role="combobox"][aria-expanded="true"]',
  '[aria-haspopup="listbox"][aria-expanded="true"]',
].join(", ");

const CANVAS_CONTENT = ".buildrick-canvas, [data-buildrick-id]";

export function hasOpenEscapeSurface(): boolean {
  if (typeof document === "undefined") return false;
  return Array.from(document.querySelectorAll(OPEN_POPUPS)).some((el) => !el.closest(CANVAS_CONTENT));
}
