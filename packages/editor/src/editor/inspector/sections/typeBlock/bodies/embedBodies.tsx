/**
 * Type-block bodies — embeds: Video embed (board 9), and by analogy (no
 * board, OQ-3) Map embed and Lottie.
 *
 *   Video embed  URL · "Detected: YouTube" · Ratio 16:9 / 4:3 / 1:1 ·
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
 * An entry no provider takes is refused, not stored (2L9 S33 `258:38255`):
 * the field keeps the draft with a red border, the page keeps the committed
 * URL, "Restore last valid URL" puts it back in the field, and Escape restores
 * the URL from the start of the edit (the field commits on Enter / blur, so
 * that is the committed one). A legacy stored URL no provider takes still
 * reads "Not a link we can embed".
 *
 * Ratio also clears the old block's `padding-bottom: 56.25%; height: 0`
 * box, which would otherwise crop a 4:3 or 1:1 frame to 16:9.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TypeBlockBodyProps } from "@/editor/inspector/config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";
import { EMBED_RATIOS, EMBED_URL_ATTR, embedRatio, isOnAttr } from "@/shared/utils/embed/embedFrameHTML";
import { parseEmbedUrl, type EmbedKind } from "@/shared/utils/embed/parseEmbedUrl";
import { Button } from "@/editor/chrome-ui";
import { ButtonGroup } from "@/editor/inspector/shared/controls";
import { WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";
import { CommitRow } from "@/editor/inspector/sections/behaviourRows";
import { runTxn, writeAttribute } from "../attributeWriter";
import { Note, Warning, useElementVersion } from "./bodyRows";
import { CheckRow } from "@/editor/inspector/shared/controls/CheckRow";

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

const KIND_COPY: Record<EmbedKind, { supported: string; thing: string }> = {
  video: { supported: "a supported YouTube or Vimeo link", thing: "video" },
  map: { supported: "an address or a Google Maps link", thing: "map" },
  lottie: { supported: "a LottieFiles link", thing: "animation" },
};

/** URL field + what it was recognised as, or the refused draft (S33). The
 *  field and its line are `field`; the restore button and its note are
 *  `restore`, which the Video embed draws under Ratio, as the board does. */
function useUrlRows({ label, placeholder, attr, kind, p }: { label: string; placeholder: string; attr: string; kind: EmbedKind; p: TypeBlockBodyProps }) {
  const { read, write } = useEmbedAttrs(p);
  const url = read(attr) ?? "";
  const parsed = url ? parseEmbedUrl(url, kind) : null;
  /* The refused entry, still in the field; null once nothing is refused. */
  const [refused, setRefused] = React.useState<string | null>(null);
  /* Bumped to remount the field on its committed value (Restore). */
  const [generation, setGeneration] = React.useState(0);
  React.useEffect(() => setRefused(null), [p.element.id]);
  const valid = (v: string) => v === "" || parseEmbedUrl(v, kind) !== null;
  const commit = (v: string) => {
    const next = v.trim();
    if (!valid(next)) {
      setRefused(next);
      return;
    }
    setRefused(null);
    write(attr, next);
  };
  const restore = () => {
    setRefused(null);
    setGeneration((n) => n + 1);
  };
  const errorId = React.useId();
  const copy = KIND_COPY[kind];
  const field = (
    <div
      onKeyDown={(e) => {
        /* The field restores its own text on Escape; the refusal goes with it. */
        if (e.key === "Escape") setRefused(null);
      }}
    >
      <CommitRow
        key={generation}
        label={label}
        value={url}
        placeholder={placeholder}
        type="url"
        onCommit={commit}
        onDraft={(v) => {
          if (refused !== null) setRefused(valid(v.trim()) ? null : v.trim());
        }}
        error={refused !== null ? { id: errorId } : null}
      />
      {refused !== null ? (
        <p id={errorId} className="tw:m-0 tw:py-2 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="inspector-embed-refused">
          {`Use ${copy.supported}. `}
          {parsed ? `The last valid ${parsed.label} ${copy.thing} remains on the page.` : `Nothing is embedded until the link is valid.`}
        </p>
      ) : url ? (
        <Note testId="inspector-embed-detected">
          {parsed ? `Detected: ${parsed.label}` : "Not a link we can embed — paste a YouTube, Vimeo, Google Maps or LottieFiles link."}
        </Note>
      ) : null}
    </div>
  );
  const restoreRows =
    refused !== null ? (
      <div className="tw:flex tw:flex-col tw:gap-2 tw:py-2">
        {parsed ? (
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={restore} data-testid="inspector-embed-restore">
            Restore last valid URL
          </Button>
        ) : null}
        <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
          Escape restores the URL from the start of this edit. Invalid draft does not replace the committed source.
        </p>
      </div>
    ) : null;
  return { field, restore: restoreRows };
}

function UrlRows(props: { label: string; placeholder: string; attr: string; kind: EmbedKind; p: TypeBlockBodyProps }) {
  const { field, restore } = useUrlRows(props);
  return (
    <>
      {field}
      {restore}
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
  const urlRows = useUrlRows({ label: "URL", placeholder: "Paste a YouTube or Vimeo link", attr: EMBED_URL_ATTR, kind: "video", p });
  return (
    <>
      {urlRows.field}
      <ButtonGroup label="Ratio" value={embedRatio(read("data-embed-ratio"))} options={RATIO_OPTIONS} onChange={setRatio} />
      {urlRows.restore}
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
