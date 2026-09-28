/**
 * embedFrameHTML — the `<iframe>` a Video embed, Map embed or Lottie element
 * renders, built from the settings its type block writes (board 9, Q5).
 *
 * Called by every HTML writer (canvas / preview `elementDataToHTML`, and both
 * ExportEngine writers), so the canvas and the published page show the same
 * frame. The iframe is NOT an element in the stored tree — `iframe` is off the
 * shared tag allowlist and DOMPurify strips it — it exists only at
 * serialization, and its src comes only from `parseEmbedUrl`'s allowlist.
 *
 * Attributes the type block writes on the element:
 *   video-embed  data-embed-url, data-embed-ratio ("16:9" | "4:3" | "1:1"),
 *                data-embed-autoplay / data-embed-muted ("true" = on),
 *                data-embed-controls ("false" = off; on by default)
 *   map-embed    data-embed-url (a maps link, or an address)
 *   lottie       data-lottie-src (the block's own attribute)
 *
 * @license BSD-3-Clause
 */

import { escapeAttr } from "../html/encoding";
import { parseEmbedUrl, type EmbedKind, type ParsedEmbed } from "./parseEmbedUrl";

export const EMBED_URL_ATTR = "data-embed-url";
export const EMBED_RATIOS = ["16:9", "4:3", "1:1"] as const;
export type EmbedRatio = (typeof EMBED_RATIOS)[number];

/** Which embed kind an element type is, and the attribute holding its URL. */
const EMBED_TYPES: Record<string, { kind: EmbedKind; attr: string }> = {
  "video-embed": { kind: "video", attr: EMBED_URL_ATTR },
  "map-embed": { kind: "map", attr: EMBED_URL_ATTR },
  lottie: { kind: "lottie", attr: "data-lottie-src" },
};

/** A boolean data attribute: on when present as "true", or bare (""). */
export const isOnAttr = (value: string | undefined): boolean => value === "true" || value === "";

export function embedRatio(value: string | undefined): EmbedRatio {
  return (EMBED_RATIOS as readonly string[]).includes(value ?? "") ? (value as EmbedRatio) : "16:9";
}

/** The parsed embed an element's attributes describe, or null. */
function embedFor(type: string | undefined, attrs: Record<string, string> | undefined): ParsedEmbed | null {
  const spec = type ? EMBED_TYPES[type] : undefined;
  const url = spec ? attrs?.[spec.attr] : undefined;
  if (!spec || !url) return null;
  return parseEmbedUrl(url, spec.kind, {
    autoplay: isOnAttr(attrs?.["data-embed-autoplay"]),
    muted: isOnAttr(attrs?.["data-embed-muted"]),
    controls: attrs?.["data-embed-controls"] !== "false",
  });
}

const TITLES: Record<ParsedEmbed["provider"], string> = {
  youtube: "YouTube video",
  vimeo: "Vimeo video",
  "google-maps": "Map",
  lottie: "Animation",
};

/**
 * The iframe markup for an embed element, or null when it has no valid URL
 * (the element then renders its own placeholder children).
 */
export function embedFrameHTML(type: string | undefined, attrs: Record<string, string> | undefined): string | null {
  const embed = embedFor(type, attrs);
  if (!embed) return null;
  const video = embed.provider === "youtube" || embed.provider === "vimeo";
  const size = video
    ? `aspect-ratio:${embedRatio(attrs?.["data-embed-ratio"]).replace(":", "/")};`
    : "height:100%;min-height:inherit;";
  const parts = [
    "data-bk-embed",
    `src="${escapeAttr(embed.src)}"`,
    `title="${TITLES[embed.provider]}"`,
    'loading="lazy"',
    'referrerpolicy="strict-origin-when-cross-origin"',
    /* A third-party origin, so allow-same-origin is ITS origin, not ours —
       the players need it (and scripts) to run at all. No top navigation. */
    'sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"',
    ...(video ? ['allow="autoplay; encrypted-media; picture-in-picture; fullscreen"', "allowfullscreen"] : []),
    `style="display:block;width:100%;${size}border:0"`,
  ];
  return `<iframe ${parts.join(" ")}></iframe>`;
}
