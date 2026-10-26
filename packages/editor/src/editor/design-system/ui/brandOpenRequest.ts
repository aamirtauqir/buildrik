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
const pendingPage = new WeakMap<Composer, string>();
const pendingReturn = new WeakMap<Composer, BrandReturn>();

/** `returnLabel` — the inspector's chip names what it came from ("Heading"):
 *  Brand's door then reads "‹ Back to Heading" and returns to the editor with
 *  that element still selected (2L9 B6-B31). */
export function requestBrandToken(composer: Composer, tokenId: string, opts: { returnLabel?: string } = {}): void {
  pending.set(composer, tokenId);
  if (opts.returnLabel) pendingReturn.set(composer, { to: "editor", label: opts.returnLabel });
  composer.emit(EVENTS.UI_OPEN_DESIGN_PANEL, { tokenId });
}

/** The token asked for before the workspace mounted, if any — read once. */
export function takeBrandTokenRequest(composer: Composer | null | undefined): string | undefined {
  if (!composer) return undefined;
  const tokenId = pending.get(composer);
  pending.delete(composer);
  return tokenId;
}

/** Asking Brand to open on one of its pages — the template-applied Connect
 *  offer (BRP1-M7) opens Connect to tokens; the theme-toggle inspector
 *  (BRP1-M12) opens Colour mode. Same hold as a token request, read once. */
export function requestBrandPage(composer: Composer, page: string): void {
  pendingPage.set(composer, page);
  composer.emit(EVENTS.UI_OPEN_DESIGN_PANEL, {});
}

/** The page asked for before the workspace mounted, if any — read once. */
export function takeBrandPageRequest(composer: Composer | null | undefined): string | undefined {
  if (!composer) return undefined;
  const page = pendingPage.get(composer);
  pendingPage.delete(composer);
  return page;
}

/** Where "‹ Back" goes when Brand was opened from somewhere other than the
 *  rail: Site settings (GAP-ST-T03 — back to the screen the user left), or an
 *  inspector chip (B6-B31 — back to the editor, named by the element). */
export type BrandReturn = { to: "settings"; screen?: string } | { to: "editor"; label: string };

/** Site settings' Branding row, before it switches to Brand. */
export function requestBrandReturn(composer: Composer, ret: { screen?: string }): void {
  pendingReturn.set(composer, { to: "settings", screen: ret.screen });
}

/** The return asked for before the workspace mounted, if any — read once. */
export function takeBrandReturn(composer: Composer | null | undefined): BrandReturn | undefined {
  if (!composer) return undefined;
  const ret = pendingReturn.get(composer);
  pendingReturn.delete(composer);
  return ret;
}
