/**
 * Asset pick mode — the ONE image picker (audit G3-008 / G3-061).
 *
 * Board 6764:59051 draws picking as a takeover of the Assets drawer: "Choose
 * image · For <element> · Image", the grid, and Cancel · Use selected image.
 * Every opener — the inspector's Choose image, a background image, a CMS
 * field, the ⌘K "Replace selected media" command, a dropped empty Image —
 * asks for it through `requestAssetPick`.
 *
 * The request is held HERE rather than sent as a composer event because the
 * drawer that answers it is lazy: it mounts only once the Assets tab is open,
 * so an event fired before that has nobody listening. A stored request is
 * read on mount.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine/Composer";
import type { MediaAsset, MediaAssetType } from "@shared/types/media";

export interface AssetPickRequest {
  /** Canvas element whose media the pick replaces (no `onSelect`). */
  elementId?: string;
  /** What the pick is for — "Menu preview" reads `For Menu preview · Image`. */
  label?: string;
  /** Kinds the field accepts; the grid shows only these. Default: image. */
  allowedTypes?: MediaAssetType[];
  /** A field that stores the pick itself (background, CMS, share image). */
  onSelect?: (asset: MediaAsset) => void;
  /** A starting search for the grid (⌘K passes the element's name). */
  query?: string;
  /** The rail tab whose workspace asked. It stays the active rail item and
   *  keeps its workspace open beside the picker — CMS pick boards 6765:59890
   *  draw the record sheet still open, rail on CMS, while the drawer picks. */
  host?: "content";
}

let pending: AssetPickRequest | null = null;
/** Who asked — so a hosted pick can hand the rail back when it ends. */
let pendingComposer: Composer | null = null;
const listeners = new Set<() => void>();

function publish(next: AssetPickRequest | null) {
  pending = next;
  for (const l of listeners) l();
}

/** Open the Assets drawer in pick mode for `request`. */
export function requestAssetPick(composer: Composer, request: AssetPickRequest): void {
  pendingComposer = composer;
  publish(request);
  composer.emit("ui:switch-tab", { tab: "assets" });
}

/** Leave pick mode (Cancel, ✕, or after a pick lands). A hosted pick
 *  returns the drawer to its host tab. */
export function endAssetPick(): void {
  const host = pending?.host;
  const composer = pendingComposer;
  pendingComposer = null;
  publish(null);
  if (host && composer) composer.emit("ui:switch-tab", { tab: host });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAssetPick(): AssetPickRequest | null {
  return React.useSyncExternalStore(subscribe, () => pending, () => null);
}

/** The rail tab that reads as active: the pick's host while its picker is
 *  open in the Assets drawer, else the drawer's own tab. */
export function useRailTab<T extends string>(activeTab: T): T | "content" {
  const pick = useAssetPick();
  return activeTab === "assets" && pick?.host ? pick.host : activeTab;
}

/**
 * The engine cannot import the editor, so its ⌘K "Replace selected media"
 * command emits `ui:media-selection-request`. This listener lives in the
 * always-mounted shell and turns that event into a stored request.
 */
export function useAssetPickBridge(composer: Composer | null): void {
  React.useEffect(() => {
    if (!composer) return;
    const handler = (data: { elementId: string; label?: string }) => requestAssetPick(composer, { ...data, query: data.label });
    composer.on("ui:media-selection-request", handler);
    return () => {
      composer.off("ui:media-selection-request", handler);
    };
  }, [composer]);
}
