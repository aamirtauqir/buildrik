/**
 * SourceRow — a media element's file, first thing in its type block
 * (Inspector v4 boards 8 and 10; moved from sections/MediaSourceRow.tsx).
 *
 *   [thumb]  pasta-closeup.jpg
 *            2400 × 1600 · 428 KB          ← what the library knows of it
 *   [            Replace            ]      ← picks another file
 *
 * The one door opens the Assets drawer in pick mode for this element's kind
 * (`onOpenMediaLibrary`) — image, video, audio and SVG alike; nothing opens
 * the full-page library any more (the SVG row used to). The pick lands on
 * every writable element of the selection, in one transaction, through the
 * lock gate.
 *
 * An inline `<svg>` (the SVG block's markup) has no src to swap: picking a
 * file makes it an `<img>` showing that file, its drawn shapes removed — the
 * element stays an SVG.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { FileAudio, FileVideo, Image as ImageIcon, Shapes } from "lucide-react";
import { Button } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import type { MediaAsset, MediaAssetType } from "@/shared/types/media";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { writableElements } from "@/engine/commands/commandOperations";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { displayNameFor, fmtSize } from "@/editor/sidebar/tabs/media/data/mediaUtils";
import { handleGenericAttributeChange, handleVideoSrcChange, runTxn } from "./attributeWriter";
import { useElementVersion } from "./bodies/bodyRows";

interface Kind {
  picker: MediaAssetType;
  /** The door with no file yet, and with one. */
  choose: string;
  replace: string;
  Icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
}

const KINDS: Record<string, Kind> = {
  image: { picker: "image", choose: "Choose image", replace: "Replace", Icon: ImageIcon },
  video: { picker: "video", choose: "Choose video", replace: "Replace", Icon: FileVideo },
  /* Board 10 keeps "Choose audio" with a file already set. */
  audio: { picker: "audio", choose: "Choose audio", replace: "Choose audio", Icon: FileAudio },
  svg: { picker: "svg", choose: "Choose SVG", replace: "Replace", Icon: Shapes },
};

export interface SourceRowProps {
  composer: Composer | null | undefined;
  element: { id: string; type: string };
  /** Every id the pick lands on (DD-12). */
  targetIds: readonly string[];
  onOpenMediaLibrary?: (allowedTypes: MediaAssetType[], onSelect: (asset: MediaAsset) => void, forLabel?: string) => void;
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

function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${rest}` : `${m}:${rest}`;
}

/** "2400 × 1600 · 428 KB" / "3:42 · 4.8 MB" — only what the library knows. */
export function sourceMeta(asset: MediaAsset | null): string | null {
  if (!asset) return null;
  const parts: string[] = [];
  if (asset.width && asset.height) parts.push(`${asset.width} × ${asset.height}`);
  if (asset.metadata?.duration) parts.push(formatDuration(asset.metadata.duration));
  if (asset.size > 0) parts.push(fmtSize(asset.size));
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** An element's src — a <video>/<audio> may hold it on its <source> child. */
function readSrc(el: Element | null | undefined): string {
  if (!el) return "";
  const own = el.getAttribute("src");
  if (own) return own;
  const source = el.getChildren?.().find((c) => c.getTagName?.().toLowerCase() === "source");
  return source?.getAttribute("src") ?? "";
}

/** The write for one picked file on one element. */
function writeSrc(composer: Composer, el: Element, src: string): void {
  const type = el.getType();
  if (type === "video" || type === "audio") return handleVideoSrcChange(el, src);
  if (type === "svg" && el.getTagName().toLowerCase() === "svg") {
    for (const child of el.getChildren()) composer.elements.removeElement(child.getId());
    el.setContent("");
    el.setTagName("img");
    if (el.getAttribute("alt") === undefined) el.setAttribute("alt", "");
  }
  handleGenericAttributeChange(el, "src", src);
}

export function SourceRow({ composer, element, targetIds, onOpenMediaLibrary }: SourceRowProps) {
  useElementVersion(composer);
  const kind = KINDS[element.type];
  if (!kind || !composer) return null;

  const el = composer.elements.getElement(element.id);
  const src = readSrc(el);
  const asset = src ? composer.media.getAssets().find((a) => a.src === src) ?? null : null;
  const name = asset ? displayNameFor(asset.name, asset.mimeType) : src ? basename(src) : "No file yet";
  const meta = sourceMeta(asset);
  const thumb = element.type === "image" && src ? asset?.thumbnailSrc || src : null;

  const open = () => {
    if (!onOpenMediaLibrary) return;
    /* Pick mode reads "For <element> · Image": the layer's own name, else its type label. */
    const forLabel = getLayerName(el) ?? elementTypeLabel(element.type);
    onOpenMediaLibrary(
      [kind.picker],
      (chosen) => {
        /* P-1: the lock gate — a locked element keeps its source. */
        const targets = writableElements(composer, targetIds.map((id) => composer.elements.getElement(id)));
        if (targets.length === 0) return;
        runTxn(composer, "media-source-change", () => {
          for (const target of targets) writeSrc(composer, target, chosen.src);
        });
      },
      forLabel,
    );
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-2 tw:py-2" data-testid="inspector-source-row">
      <div className="tw:flex tw:min-w-0 tw:items-start tw:gap-2">
        <div
          className="tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink-soft)]"
          data-testid="inspector-source-thumb"
        >
          {thumb ? <img src={thumb} alt="" className="tw:size-full tw:object-cover" /> : <kind.Icon size={16} aria-hidden />}
        </div>
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1 tw:text-[length:var(--bk-text-12)] tw:leading-4">
          <span className="tw:truncate tw:font-medium tw:text-[var(--bk-ink-soft)]" title={src || undefined} data-testid="inspector-source-name">
            {name}
          </span>
          {meta && (
            <span className="tw:truncate tw:font-[family-name:var(--bk-font-mono)] tw:tabular-nums tw:text-[var(--bk-ink-muted)]" data-testid="inspector-source-meta">
              {meta}
            </span>
          )}
        </div>
      </div>
      {onOpenMediaLibrary && (
        <Button type="button" size="xs" color="light" className="tw:h-7 tw:w-full" onClick={open} data-testid="inspector-source-door">
          {src ? kind.replace : kind.choose}
        </Button>
      )}
    </div>
  );
}
