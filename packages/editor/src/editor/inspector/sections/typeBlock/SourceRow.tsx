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
 * file does not write. It opens "Replace inline SVG" (2L9 S34 `258:38731`),
 * which names the loss of the drawn paths; "Replace with image" turns the
 * SAME element into an image of that file in one step (S35 `258:39198`,
 * `replaceInPlace` — id, outer styles and placement kept), "Keep SVG" drops
 * the pick.
 *
 * @license BSD-3-Clause
 */

import { WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";
import * as React from "react";
import { FileAudio, FileVideo, Image as ImageIcon, Shapes } from "lucide-react";
import { Button, useToast } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import type { MediaAsset, MediaAssetType } from "@/shared/types/media";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { writableElements, writeElement } from "@/engine/commands/commandOperations";
import { replaceInPlace } from "@/editor/inspector/sections/elementConversion";
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
  image: { picker: "image", choose: "Choose image", replace: "Replace image", Icon: ImageIcon },
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
function writeSrc(el: Element, src: string): void {
  const type = el.getType();
  if (type === "video" || type === "audio") return handleVideoSrcChange(el, src);
  handleGenericAttributeChange(el, "src", src);
}

/** An SVG drawn inline (its own markup, no file behind it). */
const isInlineSvg = (el: Element | null | undefined): el is Element => !!el && el.getType() === "svg" && el.getTagName().toLowerCase() === "svg";

/** SVG-only attributes that mean nothing on an <img>. */
const SVG_ONLY = new Set(["viewbox", "xmlns", "xmlns:xlink", "fill", "stroke", "stroke-width", "preserveaspectratio", "version"]);

/** S35: the inline SVG becomes an image of `src` — same element id, outer
 *  attributes and styles; its paths go. One step (caller's transaction). */
function replaceSvgWithImage(composer: Composer, el: Element, src: string): Element | null {
  const attributes: Record<string, string> = {};
  for (const [k, v] of Object.entries(el.getData().attributes ?? {})) if (!SVG_ONLY.has(k.toLowerCase())) attributes[k] = v;
  attributes.src = src;
  if (attributes.alt === undefined) attributes.alt = el.getAttribute("aria-label") ?? "";
  delete attributes["aria-label"];
  return replaceInPlace(composer, el, "image", { tagName: "img", attributes }, true);
}

/** S34 "Replace inline SVG": the loss named, then one step (S35) with its receipt. */
function SvgReplaceCard({ composer, el, pending, onDone }: { composer: Composer; el: Element; pending: { src: string; name: string }; onDone: () => void }) {
  const { addToast } = useToast();
  const replace = () => {
    let made: Element | null = null;
    if (!writeElement(composer, el, "Replace SVG with image", () => (made = replaceSvgWithImage(composer, el, pending.src))) || !made) return;
    const undo = composer.history.captureUndo();
    onDone();
    composer.selection.select(made);
    addToast({ description: "SVG replaced with image.", action: { label: "Undo", onClick: undo } });
  };
  return (
    <div className="tw:flex tw:flex-col tw:gap-2 tw:py-2" data-testid="inspector-svg-replace">
      <div className="tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">Replace inline SVG</div>
      <div className="bdi-row-ctrl">
        <span className="bdi-lb">New source</span>
        <span className="bdi-row-content">
          <span className="tw:flex tw:h-7 tw:min-w-0 tw:flex-1 tw:items-center tw:truncate tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:text-[12px] tw:text-[var(--bk-ink-soft)]">
            {pending.name}
          </span>
        </span>
      </div>
      <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
        This changes the SVG element to an image and removes its internal SVG paths. Existing outer styles and placement are preserved.
      </p>
      <Button size="xs" className={`${WIDE_BUTTON} tw:text-white!`} onClick={replace} data-testid="inspector-svg-replace-confirm">
        Replace with image
      </Button>
      <Button color="light" size="xs" className={WIDE_BUTTON} onClick={onDone} data-testid="inspector-svg-keep">
        Keep SVG
      </Button>
    </div>
  );
}

export function SourceRow({ composer, element, targetIds, onOpenMediaLibrary }: SourceRowProps) {
  useElementVersion(composer);
  const [pending, setPending] = React.useState<{ src: string; name: string } | null>(null);
  React.useEffect(() => setPending(null), [element.id]);
  const kind = KINDS[element.type];
  if (!kind || !composer) return null;

  const el = composer.elements.getElement(element.id);
  const src = readSrc(el);
  const asset = src ? composer.media.getAssets().find((a) => a.src === src) ?? null : null;
  const name = asset ? displayNameFor(asset.name, asset.mimeType) : src ? basename(src) : "No file yet";
  const meta = sourceMeta(asset);
  const thumb = element.type === "image" && src ? asset?.thumbnailSrc || src : null;

  const inline = targetIds.length <= 1 && isInlineSvg(el);
  const open = () => {
    if (!onOpenMediaLibrary) return;
    /* Pick mode reads "For <element> · Image": the layer's own name, else its type label. */
    const forLabel = getLayerName(el) ?? elementTypeLabel(element.type);
    onOpenMediaLibrary(
      inline ? ["image", "svg"] : [kind.picker],
      (chosen) => {
        if (inline) return setPending({ src: chosen.src, name: displayNameFor(chosen.name, chosen.mimeType) });
        /* P-1: the lock gate — a locked element keeps its source. */
        const targets = writableElements(composer, targetIds.map((id) => composer.elements.getElement(id)));
        if (targets.length === 0) return;
        runTxn(composer, "media-source-change", () => {
          for (const target of targets) writeSrc(target, chosen.src);
        });
      },
      forLabel,
    );
  };

  if (pending && isInlineSvg(el)) return <SvgReplaceCard composer={composer} el={el} pending={pending} onDone={() => setPending(null)} />;

  return (
    <div className="tw:flex tw:flex-col tw:gap-2 tw:py-2" data-testid="inspector-source-row">
      {/* 2L9 36:2: one grey card — the file's glyph or thumbnail, its name,
          then "1600 × 1200 · JPG". */}
      <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2.5 tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:p-2.5">
        <div
          className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:text-[var(--bk-ink-soft)]"
          data-testid="inspector-source-thumb"
        >
          {thumb ? <img src={thumb} alt="" className="tw:size-full tw:object-cover" /> : <kind.Icon size={20} aria-hidden />}
        </div>
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5 tw:leading-4">
          <span className="tw:truncate tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)]" title={src || undefined} data-testid="inspector-source-name">
            {name}
          </span>
          {meta && (
            <span className="tw:truncate tw:text-[12px] tw:tabular-nums tw:text-[var(--bk-ink-muted)]" data-testid="inspector-source-meta">
              {meta}
            </span>
          )}
        </div>
      </div>
      {onOpenMediaLibrary && (
        <Button type="button" size="xs" color="light" className={WIDE_BUTTON} onClick={open} data-testid="inspector-source-door">
          {src ? kind.replace : kind.choose}
        </Button>
      )}
    </div>
  );
}
