/**
 * Type-block bodies — embeds: Video embed (board 9), and by analogy (no
 * board, OQ-3) Map embed and Lottie.
 *
 *   Video embed  Video URL · "Detected: YouTube" · Ratio 16:9 / 4:3 / 1:1 ·
 *                Autoplay · Muted · Show controls · the warning while
 *                autoplay runs with sound ("Browsers block autoplay with
 *                sound. Turn on Muted.")
 *   Map embed    Address or map link · "Detected: Google Maps"
 *   Lottie       Animation URL · "Detected: LottieFiles"
 *
 * The URL is stored as typed; what the canvas and the published page render
 * is `embedFrameHTML`'s iframe, whose src only `parseEmbedUrl` produces — so
 * the "Detected" line and the rendered frame read the same parser. A URL no
 * provider recognises says so and renders nothing.
 *
 * Ratio also clears the old block's `padding-bottom: 56.25%; height: 0`
 * box, which would otherwise crop a 4:3 or 1:1 frame to 16:9.
 *
 * @license BSD-3-Clause
 */

import type * as React from "react";
import type { TypeBlockBodyProps } from "../../../config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";
import { EMBED_RATIOS, EMBED_URL_ATTR, embedRatio, isOnAttr } from "@/shared/utils/embed/embedFrameHTML";
import { parseEmbedUrl, type EmbedKind } from "@/shared/utils/embed/parseEmbedUrl";
import { ButtonGroup, InputRow } from "../../../shared/controls";
import { runTxn, writeAttribute } from "../attributeWriter";
import { CheckRow, Note, Warning, useElementVersion } from "./bodyRows";

const RATIO_OPTIONS = EMBED_RATIOS.map((r) => ({ value: r, label: r }));

/** The fixed-ratio box the Video embed block ships with. */
const isLegacyRatioBox = (styles: Record<string, string>) =>
  /%$/.test(styles["padding-bottom"] ?? "") && /^0(px)?$/.test(styles.height ?? "");

function useEmbedAttrs(p: TypeBlockBodyProps) {
  useElementVersion(p.composer);
  const el = p.composer?.elements.getElement(p.element.id);
  const read = (name: string) => el?.getAttribute(name);
  const write = (name: string, value: string) => {
    if (p.composer) writeAttribute(p.composer, p.targetIds, name, value);
  };
  return { read, write };
}

/** URL field + what it was recognised as. */
function UrlRows({ label, placeholder, attr, kind, p }: { label: string; placeholder: string; attr: string; kind: EmbedKind; p: TypeBlockBodyProps }) {
  const { read, write } = useEmbedAttrs(p);
  const url = read(attr) ?? "";
  const parsed = url ? parseEmbedUrl(url, kind) : null;
  return (
    <>
      <InputRow label={label} value={url} placeholder={placeholder} onChange={(v) => write(attr, v.trim())} />
      {url && (
        <Note testId="inspector-embed-detected">
          {parsed ? `Detected: ${parsed.label}` : "Not a link we can embed — paste a YouTube, Vimeo, Google Maps or LottieFiles link."}
        </Note>
      )}
    </>
  );
}

const VideoEmbed: React.FC<TypeBlockBodyProps> = (p) => {
  const { read, write } = useEmbedAttrs(p);
  const autoplay = isOnAttr(read("data-embed-autoplay"));
  const muted = isOnAttr(read("data-embed-muted"));
  /* One Undo for the ratio and the box it replaces. */
  const setRatio = (ratio: string) =>
    runTxn(p.composer, "embed-ratio", () => {
      write("data-embed-ratio", ratio);
      if (isLegacyRatioBox(p.styles)) p.onBatchChange({ "padding-bottom": "", height: "" });
    });
  return (
    <>
      <UrlRows label="Video URL" placeholder="Paste a YouTube or Vimeo link" attr={EMBED_URL_ATTR} kind="video" p={p} />
      <ButtonGroup label="Ratio" value={embedRatio(read("data-embed-ratio"))} options={RATIO_OPTIONS} onChange={setRatio} />
      <CheckRow label="Autoplay" checked={autoplay} onChange={(on) => write("data-embed-autoplay", on ? "true" : "")} />
      <CheckRow label="Muted" checked={muted} onChange={(on) => write("data-embed-muted", on ? "true" : "")} />
      <CheckRow
        label="Show controls"
        checked={read("data-embed-controls") !== "false"}
        onChange={(on) => write("data-embed-controls", on ? "" : "false")}
      />
      {autoplay && !muted && <Warning testId="inspector-autoplay-warning">Browsers block autoplay with sound. Turn on Muted.</Warning>}
    </>
  );
};

const MapEmbed: React.FC<TypeBlockBodyProps> = (p) => (
  <UrlRows label="Location" placeholder="Address or Google Maps link" attr={EMBED_URL_ATTR} kind="map" p={p} />
);

const Lottie: React.FC<TypeBlockBodyProps> = (p) => (
  <UrlRows label="Animation URL" placeholder="lottie.host link" attr="data-lottie-src" kind="lottie" p={p} />
);

export const EMBED_BODIES: Partial<Record<TypeBlockId, React.FC<TypeBlockBodyProps>>> = {
  "video-embed": VideoEmbed,
  "map-embed": MapEmbed,
  lottie: Lottie,
};
