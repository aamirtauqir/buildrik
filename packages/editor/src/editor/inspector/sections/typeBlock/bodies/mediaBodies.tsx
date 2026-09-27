/**
 * Type-block bodies — media: Image, Video, Audio, SVG / Icon (boards 8, 10).
 * Lane L2-B replaces these generic W1 bodies with the board layouts (source
 * row with thumb + size, Fit, missing-alt hint, audio picker).
 *
 * W1: the source row (MediaSourceRow) heads the block, then the old Advanced
 * rows for the type. Image decoding and video preload moved to Attributes
 * (§17.H); image "Title" is Attributes' shared Title row.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { IconConfig } from "@/shared/types/media";
import type { TypeBlockBodyProps } from "../../../config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";
import { writableElements } from "@/engine/commands/commandOperations";
import { MediaSourceRow } from "../../MediaSourceRow";
import { getCurrentIconConfig, handleIconSelectAction, runTxn } from "../attributeWriter";
import { PropertyRows, type PropertyConfig } from "../PropertyField";

const IMAGE_ROWS: readonly PropertyConfig[] = [
  { id: "alt", label: "Alt text", type: "text", placeholder: "Describe the image" },
  {
    id: "loading",
    label: "Loading",
    type: "select",
    options: [
      { value: "lazy", label: "Lazy" },
      { value: "eager", label: "Eager" },
    ],
  },
];

const VIDEO_ROWS: readonly PropertyConfig[] = [
  { id: "poster", label: "Poster image", type: "text", placeholder: "https://…" },
  { id: "autoplay", label: "Autoplay", type: "checkbox" },
  { id: "loop", label: "Loop", type: "checkbox" },
  { id: "muted", label: "Muted", type: "checkbox" },
  { id: "controls", label: "Show controls", type: "checkbox" },
  { id: "playsinline", label: "Plays inline", type: "checkbox" },
];

const ICON_ROWS: readonly PropertyConfig[] = [
  {
    id: "data-icon-size",
    label: "Icon size",
    type: "select",
    options: ["16", "20", "24", "32", "48", "64"].map((v) => ({ value: v, label: `${v}px` })),
  },
  {
    id: "data-icon-stroke",
    label: "Stroke width",
    type: "select",
    options: ["1", "1.5", "2", "2.5", "3"].map((v) => ({ value: v, label: v })),
  },
];

const Image: React.FC<TypeBlockBodyProps> = (p) => (
  <>
    <MediaSourceRow composer={p.composer} selectedElement={p.element} onOpenMediaLibrary={p.onOpenMediaLibrary} />
    <PropertyRows composer={p.composer} element={p.element} targetIds={p.targetIds} rows={IMAGE_ROWS} />
  </>
);

const Video: React.FC<TypeBlockBodyProps> = (p) => (
  <>
    <MediaSourceRow composer={p.composer} selectedElement={p.element} onOpenMediaLibrary={p.onOpenMediaLibrary} />
    <PropertyRows composer={p.composer} element={p.element} targetIds={p.targetIds} rows={VIDEO_ROWS} />
  </>
);

const Source: React.FC<TypeBlockBodyProps> = (p) => (
  <MediaSourceRow composer={p.composer} selectedElement={p.element} onOpenMediaLibrary={p.onOpenMediaLibrary} />
);

/** SVG: its source row. Icon: the icon picker door and its size / stroke. */
const Svg: React.FC<TypeBlockBodyProps> = (p) => {
  const { composer, element, onOpenIconPicker } = p;
  if (element.type !== "icon") return <Source {...p} />;
  const choose = (icon: IconConfig) => {
    if (!composer) return;
    /* P-1: the lock gate — a locked icon keeps its glyph. */
    const [el] = writableElements(composer, [composer.elements.getElement(element.id)]);
    if (!el) return;
    runTxn(composer, "icon-change", () => handleIconSelectAction(el, icon, () => undefined));
  };
  return (
    <>
      {onOpenIconPicker && (
        <div className="tw:flex tw:justify-end tw:py-0.5">
          <Button
            type="button"
            size="xs"
            color="light"
            className="tw:h-6 tw:w-40 tw:text-[12px]"
            data-testid="inspector-icon-change"
            onClick={() => onOpenIconPicker(getCurrentIconConfig(element, composer), choose)}
          >
            Change icon
          </Button>
        </div>
      )}
      <PropertyRows composer={composer} element={element} targetIds={p.targetIds} rows={ICON_ROWS} />
    </>
  );
};

export const MEDIA_BODIES: Partial<Record<TypeBlockId, React.FC<TypeBlockBodyProps>>> = {
  image: Image,
  video: Video,
  svg: Svg,
};
