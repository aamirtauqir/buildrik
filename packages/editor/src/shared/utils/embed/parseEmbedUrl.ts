/**
 * parseEmbedUrl — the ONE gate between what someone pastes into an embed's
 * URL field and the `src` of an `<iframe>` the canvas and the published page
 * render (Inspector v4 board 9, Q5).
 *
 * Allowlist, not blocklist: a pasted string becomes an embed src only when it
 * is recognised as one of the providers below, and the src is REBUILT from the
 * parts that identify the media (a video id, a map query, a Lottie file) on a
 * fixed https host — the pasted URL itself never reaches an iframe. So
 * `javascript:`, `data:`, an unknown host or a lookalike (`youtube.com.evil.io`)
 * is refused by construction, not by pattern.
 *
 * Kinds: a Video embed takes YouTube / Vimeo, a Map embed Google Maps (a maps
 * link, or a plain address / coordinates), a Lottie a lottie.host file.
 *
 * @license BSD-3-Clause
 */

export type EmbedKind = "video" | "map" | "lottie";
export type EmbedProvider = "youtube" | "vimeo" | "google-maps" | "lottie";

export interface ParsedEmbed {
  provider: EmbedProvider;
  /** Shown as "Detected: <label>". */
  label: string;
  /** The iframe src, on the provider's own embed host. */
  src: string;
}

/** Player settings a video embed carries (board 9). */
export interface VideoEmbedOptions {
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

/** The iframe hosts this module can produce — for a frame-src CSP. */
export const EMBED_FRAME_HOSTS = [
  "https://www.youtube-nocookie.com",
  "https://player.vimeo.com",
  "https://www.google.com",
  "https://lottie.host",
] as const;

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{1,12}$/;
const VIMEO_HASH = /^[0-9a-f]{6,20}$/i;
const LOTTIE_ID = /^[0-9a-f-]{36}$/i;
const LOTTIE_FILE = /^[A-Za-z0-9_-]{1,80}\.(json|lottie)$/;
const MAX_QUERY = 200;

/** A URL for `input`, allowing a pasted link without its scheme. */
function toUrl(input: string): URL | null {
  const raw = /^[a-z][a-z0-9+.-]*:/i.test(input) ? input : `https://${input}`;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

const hostOf = (url: URL) => url.hostname.toLowerCase().replace(/^(www|m)\./, "");

function youtube(url: URL): string | null {
  const host = hostOf(url);
  const parts = url.pathname.split("/").filter(Boolean);
  let id: string | null = null;
  if (host === "youtu.be") id = parts[0] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parts[0] === "watch") id = url.searchParams.get("v");
    else if (["embed", "shorts", "live", "v"].includes(parts[0] ?? "")) id = parts[1] ?? null;
  } else return null;
  return id && YOUTUBE_ID.test(id) ? id : null;
}

function vimeo(url: URL): { id: string; hash: string | null } | null {
  const host = hostOf(url);
  const parts = url.pathname.split("/").filter(Boolean);
  if (host === "player.vimeo.com" && parts[0] === "video" && VIMEO_ID.test(parts[1] ?? "")) {
    const h = url.searchParams.get("h");
    return { id: parts[1], hash: h && VIMEO_HASH.test(h) ? h : null };
  }
  if (host === "vimeo.com" && VIMEO_ID.test(parts[0] ?? "")) {
    return { id: parts[0], hash: parts[1] && VIMEO_HASH.test(parts[1]) ? parts[1] : null };
  }
  return null;
}

function videoSrc(input: string, opts: VideoEmbedOptions): ParsedEmbed | null {
  const url = toUrl(input);
  if (!url) return null;
  const controls = opts.controls !== false;
  const yt = youtube(url);
  if (yt) {
    const q = new URLSearchParams();
    if (opts.autoplay) q.set("autoplay", "1");
    if (opts.muted) q.set("mute", "1");
    if (!controls) q.set("controls", "0");
    q.set("playsinline", "1");
    return { provider: "youtube", label: "YouTube", src: `https://www.youtube-nocookie.com/embed/${yt}?${q}` };
  }
  const vm = vimeo(url);
  if (vm) {
    const q = new URLSearchParams();
    if (vm.hash) q.set("h", vm.hash);
    if (opts.autoplay) q.set("autoplay", "1");
    if (opts.muted) q.set("muted", "1");
    if (!controls) q.set("controls", "0");
    const qs = q.toString();
    return { provider: "vimeo", label: "Vimeo", src: `https://player.vimeo.com/video/${vm.id}${qs ? `?${qs}` : ""}` };
  }
  return null;
}

const isGoogleHost = (url: URL) => {
  const host = url.hostname.toLowerCase();
  return host === "google.com" || host === "www.google.com" || host === "maps.google.com";
};

/** The place a Google Maps link points at: an embed `pb`, or a search query. */
function mapsTarget(url: URL): { pb: string } | { q: string } | null {
  if (!isGoogleHost(url)) return null;
  const path = url.pathname;
  if (!path.startsWith("/maps")) return null;
  const pb = url.searchParams.get("pb");
  if (path.startsWith("/maps/embed") && pb) return { pb };
  const q = url.searchParams.get("q") ?? url.searchParams.get("query");
  if (q) return { q };
  const parts = path.split("/").filter(Boolean).map((p) => decodeURIComponent(p));
  const named = parts[1] === "place" || parts[1] === "search" ? parts[2] : null;
  if (named) return { q: named.replace(/\+/g, " ") };
  const at = parts.find((p) => p.startsWith("@"));
  const coords = at?.slice(1).split(",").slice(0, 2);
  if (coords && coords.length === 2 && coords.every((c) => /^-?\d+(\.\d+)?$/.test(c))) return { q: coords.join(",") };
  return null;
}

function mapSrc(input: string): ParsedEmbed | null {
  const looksLikeUrl = /^[a-z][a-z0-9+.-]*:/i.test(input) || /^[^\s/]+\.[a-z]{2,}\//i.test(input);
  let target: { pb: string } | { q: string } | null;
  if (looksLikeUrl) {
    const url = toUrl(input);
    target = url ? mapsTarget(url) : null;
  } else {
    /* An address or coordinates, typed as the placeholder asks. */
    target = { q: input };
  }
  if (!target) return null;
  if ("pb" in target) {
    return { provider: "google-maps", label: "Google Maps", src: `https://www.google.com/maps/embed?${new URLSearchParams({ pb: target.pb })}` };
  }
  const query = target.q.trim().slice(0, MAX_QUERY);
  if (!query) return null;
  return {
    provider: "google-maps",
    label: "Google Maps",
    src: `https://www.google.com/maps?${new URLSearchParams({ q: query, output: "embed" })}`,
  };
}

function lottieSrc(input: string): ParsedEmbed | null {
  const url = toUrl(input);
  if (!url || url.hostname.toLowerCase() !== "lottie.host") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const [id, file] = parts[0] === "embed" ? parts.slice(1) : parts;
  if (!id || !file || !LOTTIE_ID.test(id) || !LOTTIE_FILE.test(file)) return null;
  return { provider: "lottie", label: "LottieFiles", src: `https://lottie.host/embed/${id.toLowerCase()}/${file}` };
}

/**
 * The provider and iframe src for a pasted URL, or null when it is not one
 * this kind of embed accepts.
 */
export function parseEmbedUrl(input: string, kind: EmbedKind, opts: VideoEmbedOptions = {}): ParsedEmbed | null {
  const value = input.trim();
  if (!value || value.length > 2048) return null;
  if (kind === "video") return videoSrc(value, opts);
  if (kind === "map") return mapSrc(value);
  return lottieSrc(value);
}
