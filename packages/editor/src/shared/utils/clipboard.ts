/**
 * The one way chrome copies text. `navigator.clipboard` exists only on secure
 * origins, so on an http LAN origin a bare `navigator.clipboard.writeText`
 * throws a TypeError before any promise exists — Layers ⋯ Copy link crashed
 * that way (gap walk 93 #5). This never throws synchronously: it uses the
 * async API when present, falls back to the legacy copy command (a transient
 * offscreen textarea) when not, and rejects when neither copied, so every
 * caller can tell the user.
 *
 * @license BSD-3-Clause
 */

function legacyCopy(text: string): boolean {
  if (typeof document === "undefined" || typeof document.execCommand !== "function") return false;
  /* Selecting the textarea takes focus; the caller's control gets it back. */
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "-1000px";
  document.body.appendChild(area);
  area.focus();
  area.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
    previous?.focus({ preventScroll: true });
  }
}

export async function writeClipboardText(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  if (!legacyCopy(text)) throw new Error("Clipboard unavailable");
}
