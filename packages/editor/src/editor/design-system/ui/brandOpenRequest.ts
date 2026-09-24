/**
 * Asking Brand to open on one token — the inspector's bound-token chip
 * (G3-156: "the chip jumps to Brand root, not the token").
 *
 * The chip emits UI_OPEN_DESIGN_PANEL, which switches the rail to Brand; the
 * workspace mounts AFTER the emit, so the token rides a per-composer hold the
 * workspace takes once on mount (the same shape as Add's insertGroupRequest).
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";

const pending = new WeakMap<Composer, string>();

export function requestBrandToken(composer: Composer, tokenId: string): void {
  pending.set(composer, tokenId);
  composer.emit(EVENTS.UI_OPEN_DESIGN_PANEL, { tokenId });
}

/** The token asked for before the workspace mounted, if any — read once. */
export function takeBrandTokenRequest(composer: Composer | null | undefined): string | undefined {
  if (!composer) return undefined;
  const tokenId = pending.get(composer);
  pending.delete(composer);
  return tokenId;
}
