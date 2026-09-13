/**
 * MediaSourceRow — a media element's SOURCE, first thing in its inspector.
 *
 * Clone 3721:45178 (image), 3724:43815 (video) and 3724:44339 (SVG) open the
 * inspector with `Image source · team-photo.jpg · [Choose image]`, `Video
 * source · chef-intro.mp4 · [Manage video]`, `SVG image source · logo-mark.svg
 * · [Manage SVG]` — label, the file's library name, one primary door — above
 * SIZE. The source used to sit four sections down as an "Image URL · Browse"
 * row inside Element Properties, where nothing said which library file the
 * element showed.
 *
 * Choose image opens the picker for this element (the src lands through the
 * same attribute write Element Properties makes). Manage video / Manage SVG
 * open the Asset library with the file selected (edge → 3696:20326): the
 * library reads `composer.media.getSelectedAssets()` on mount, the same
 * handoff the drawer's "Manage in full library" uses.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine/Composer";
import type { MediaAsset, MediaAssetType } from "../../../shared/types/media";
import { displayNameFor } from "../../sidebar/tabs/media/data/mediaUtils";
import { handleGenericAttributeChange, runTxn } from "./elementProperties/handlers";

const KINDS: Record<string, { label: string; door: string; picker: MediaAssetType | null }> = {
  image: { label: "Image source", door: "Choose image", picker: "image" },
  video: { label: "Video source", door: "Manage video", picker: null },
  svg: { label: "SVG image source", door: "Manage SVG", picker: null },
};

interface MediaSourceRowProps {
  composer: Composer | null | undefined;
  selectedElement: { id: string; type: string };
  onOpenMediaLibrary?: (allowedTypes: MediaAssetType[], onSelect: (asset: MediaAsset) => void) => void;
}

/** The URL's own file name — for a source the library does not hold. */
function basename(src: string): string {
  try {
    const path = new URL(src, "http://x").pathname;
    return decodeURIComponent(path.slice(path.lastIndexOf("/") + 1)) || src;
  } catch {
    return src;
  }
}

export function MediaSourceRow({ composer, selectedElement, onOpenMediaLibrary }: MediaSourceRowProps) {
  const kind = KINDS[selectedElement.type];
  /* Re-read the src when the element changes underneath the inspector — the
     picker and the library both write it through element:updated. */
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!composer || !kind) return;
    composer.on("element:updated", bump);
    return () => {
      composer.off("element:updated", bump);
    };
  }, [composer, kind]);

  if (!kind || !composer) return null;
  const el = composer.elements.getElement(selectedElement.id);
  const src = el?.getAttribute("src") ?? "";
  const asset = src ? composer.media.getAssets().find((a) => a.src === src) ?? null : null;
  const name = asset ? displayNameFor(asset.name, asset.mimeType) : src ? basename(src) : "No source yet";

  const open = () => {
    if (kind.picker && onOpenMediaLibrary) {
      onOpenMediaLibrary([kind.picker], (chosen) => {
        const target = composer.elements.getElement(selectedElement.id);
        if (!target) return;
        runTxn(composer, "media-source-change", () => handleGenericAttributeChange(target, "src", chosen.src));
        bump();
      });
      return;
    }
    composer.media.selectAssets(asset ? [asset.id] : []);
    composer.emit("ui:switch-tab", { tab: "assets", fullPage: true });
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-1 tw:border-b tw:border-[var(--bk-border)] tw:px-4 tw:py-3" data-testid="inspector-source-row">
      <span className="tw:text-[length:var(--bk-text-12)] tw:font-medium tw:text-[var(--bk-ink)]" data-testid="inspector-source-label">
        {kind.label}
      </span>
      <span className="tw:truncate tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-soft)]" title={src || undefined} data-testid="inspector-source-name">
        {name}
      </span>
      <Button type="button" size="xs" className="tw:mt-1 tw:h-7 tw:self-start tw:px-3" onClick={open} data-testid="inspector-source-door">
        {kind.door}
      </Button>
    </div>
  );
}
