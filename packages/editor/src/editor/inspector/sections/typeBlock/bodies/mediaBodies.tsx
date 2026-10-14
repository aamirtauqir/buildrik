/**
 * Type-block bodies — media: Image (board 8), Audio (board 10), and by
 * analogy (no board, OQ-3) native Video and SVG / Icon.
 *
 *   Image  source row · Alt text + "Add alt text…" hint while empty ·
 *          Fit Cover / Contain / Fill (object-fit — the only writer since
 *          Size lost it) · Loading
 *   Audio  source row (Choose audio) · Show controls · Loop · Autoplay
 *   Video  source row · Poster image · Autoplay · Muted · Loop · Show
 *          controls · Plays inline, with board 9's warning while autoplay
 *          runs with sound
 *   SVG    source row (drawer pick mode, like images); Icon: Change icon,
 *          size, stroke
 *
 * Attribute rows write through `writeAttribute` (lock gate, one transaction
 * for the whole selection); Fit writes a style through the Inspector's style
 * path (`onChange`), so it follows breakpoint and state like every style.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { IconConfig } from "@/shared/types/media";
import type { TypeBlockBodyProps } from "@/editor/inspector/config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";
import { writableElements } from "@/engine/commands/commandOperations";
import { ButtonGroup, InputRow, SelectRow } from "@/editor/inspector/shared/controls";
import { SourceRow } from "../SourceRow";
import { getCurrentIconConfig, handleIconSelectAction, handleVideoPosterChange, runTxn, writeAttribute } from "../attributeWriter";
import { PropertyRows, type PropertyConfig } from "../PropertyField";
import { Note, Warning, useElementVersion } from "./bodyRows";
import { CheckRow } from "@/editor/inspector/shared/controls/CheckRow";

const FIT_OPTIONS = [
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
  { value: "fill", label: "Fill" },
];

const LOADING_OPTIONS = [
  { value: "lazy", label: "Lazy" },
  { value: "eager", label: "Eager" },
];

/** A boolean attribute is on when present (HTML writes it empty) and not "false". */
const isOn = (v: string | undefined) => v !== undefined && v !== null && v !== "false";

/** Reads the primary element's attributes; writes land on the whole selection. */
function useAttrs(p: TypeBlockBodyProps) {
  useElementVersion(p.composer);
  const el = p.composer?.elements.getElement(p.element.id);
  const read = (name: string) => el?.getAttribute(name);
  const write = (name: string, value: string) => {
    if (p.composer) writeAttribute(p.composer, p.targetIds, name, value);
  };
  const toggle = (name: string) => (on: boolean) => write(name, on ? "true" : "");
  return { read, write, toggle };
}

function Source(p: TypeBlockBodyProps) {
  return <SourceRow composer={p.composer} element={p.element} targetIds={p.targetIds} onOpenMediaLibrary={p.onOpenMediaLibrary} />;
}

const Image: React.FC<TypeBlockBodyProps> = (p) => {
  const { read, write } = useAttrs(p);
  const alt = read("alt") ?? "";
  return (
    <>
      <Source {...p} />
      <InputRow label="Alt text" value={alt} placeholder="Describe this image" onChange={(v) => write("alt", v)} />
      {!alt.trim() && <Note testId="inspector-alt-hint">Add alt text so everyone can understand this image.</Note>}
      <ButtonGroup label="Fit" property="object-fit" value={p.styles["object-fit"] ?? ""} options={FIT_OPTIONS} onChange={(v) => p.onChange("object-fit", v)} />
      <SelectRow label="Loading" value={read("loading") ?? ""} options={LOADING_OPTIONS} onChange={(v) => write("loading", v)} />
    </>
  );
};

const Audio: React.FC<TypeBlockBodyProps> = (p) => {
  const { read, toggle } = useAttrs(p);
  return (
    <>
      <Source {...p} />
      <CheckRow label="Show controls" checked={isOn(read("controls"))} onChange={toggle("controls")} />
      <CheckRow label="Loop" checked={isOn(read("loop"))} onChange={toggle("loop")} />
      <CheckRow label="Autoplay" checked={isOn(read("autoplay"))} onChange={toggle("autoplay")} />
    </>
  );
};

const Video: React.FC<TypeBlockBodyProps> = (p) => {
  const { read, toggle } = useAttrs(p);
  const autoplay = isOn(read("autoplay"));
  const muted = isOn(read("muted"));
  const setPoster = (value: string) => {
    const composer = p.composer;
    if (!composer) return;
    const targets = writableElements(composer, p.targetIds.map((id) => composer.elements.getElement(id)));
    if (targets.length === 0) return;
    runTxn(composer, "element-prop-change", () => {
      for (const el of targets) handleVideoPosterChange(el, value);
    });
  };
  return (
    <>
      <Source {...p} />
      <InputRow label="Poster image" value={read("poster") ?? ""} placeholder="https://…" onChange={setPoster} />
      <CheckRow label="Autoplay" checked={autoplay} onChange={toggle("autoplay")} />
      <CheckRow label="Muted" checked={muted} onChange={toggle("muted")} />
      <CheckRow label="Loop" checked={isOn(read("loop"))} onChange={toggle("loop")} />
      <CheckRow label="Show controls" checked={isOn(read("controls"))} onChange={toggle("controls")} />
      <CheckRow label="Plays inline" checked={isOn(read("playsinline"))} onChange={toggle("playsinline")} />
      {autoplay && !muted && <Warning testId="inspector-autoplay-warning">Browsers block autoplay with sound. Turn on Muted.</Warning>}
    </>
  );
};

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
  audio: Audio,
  svg: Svg,
};
