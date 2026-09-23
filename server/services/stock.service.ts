/**
 * Stock media search proxy (#24, 2026-06-24). Server-side so provider API keys
 * stay off the client. Photos via Unsplash (UNSPLASH_ACCESS_KEY), videos via
 * Pexels (PEXELS_API_KEY). Shapes mirror the editor's StockPhoto / StockVideo.
 *
 * A search has FOUR outcomes and they are not the same fact:
 *
 *   nothing matched   → `[]`
 *   no key configured → StockError("NOT_CONFIGURED")
 *   key was refused   → StockError("UNAUTHORIZED")
 *   request faulted   → StockError("REQUEST_FAILED")
 *
 * Until 2026-09-07 all four returned `[]`, so an unconfigured deployment and an
 * expired key both reached the user as "No photos found for '<their query>'" —
 * a sentence about their search term describing our configuration. Nobody could
 * report the bug because the product never admitted there was one.
 *
 * @license BSD-3-Clause
 */

export interface StockPhotoResult {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  author: string;
  authorUrl: string;
  width: number;
  height: number;
  source: "unsplash";
}

export interface StockVideoResult {
  id: string;
  url: string;
  thumb: string;
  duration: number;
  author: string;
  source: "pexels";
}

const PER_PAGE = 24;
const TIMEOUT_MS = 8000;

export type StockErrorCode = "NOT_CONFIGURED" | "UNAUTHORIZED" | "REQUEST_FAILED";

/** Domain error, per the services-throw / routers-translate convention. */
export class StockError extends Error {
  constructor(
    public code: StockErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "StockError";
  }
}

async function fetchJson(
  url: string,
  headers: Record<string, string>,
  provider: string,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    // 401/403 is the expired-or-revoked-key case: a key WAS sent and the
    // provider refused it. That is an operator problem with a different fix
    // from "no key at all", so it gets its own code rather than the generic one.
    if (res.status === 401 || res.status === 403) {
      throw new StockError("UNAUTHORIZED", `${provider} rejected the configured API key.`);
    }
    if (!res.ok) {
      throw new StockError("REQUEST_FAILED", `${provider} returned HTTP ${res.status}.`);
    }
    return await res.json();
  } catch (e) {
    if (e instanceof StockError) throw e;
    // DNS failure, connection refused, the TIMEOUT_MS abort, unparseable body.
    throw new StockError("REQUEST_FAILED", `${provider} could not be reached.`);
  } finally {
    clearTimeout(timer);
  }
}

export async function searchStockPhotos(
  query: string,
  page: number,
  orientation: "landscape" | "portrait" | "squarish" | null,
  color: string | null,
): Promise<StockPhotoResult[]> {
  // Configured-ness is checked before the query: an operator whose key is
  // missing needs to hear that whatever they typed.
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    throw new StockError(
      "NOT_CONFIGURED",
      "Stock photo search is not configured — UNSPLASH_ACCESS_KEY is unset.",
    );
  }
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    query,
    page: String(Math.max(1, page)),
    per_page: String(PER_PAGE),
  });
  if (orientation) params.set("orientation", orientation);
  if (color) params.set("color", color);

  const data = await fetchJson(
    `https://api.unsplash.com/search/photos?${params}`,
    { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
    "Unsplash",
  );
  const results = (data as { results?: unknown[] })?.results;
  // A successful Unsplash search always carries a `results` array — an empty
  // one for no matches. Anything else means we did not get a search result,
  // which is a failure, not an absence.
  if (!Array.isArray(results)) {
    throw new StockError("REQUEST_FAILED", "Unsplash returned an unexpected response.");
  }

  return results.flatMap((raw) => {
    const r = raw as {
      id?: string;
      urls?: { regular?: string; thumb?: string; small?: string };
      width?: number;
      height?: number;
      alt_description?: string | null;
      description?: string | null;
      user?: { name?: string; links?: { html?: string } };
    };
    if (!r.id || !r.urls?.regular) return [];
    return [{
      id: r.id,
      url: r.urls.regular,
      thumb: r.urls.thumb ?? r.urls.small ?? r.urls.regular,
      alt: r.alt_description || r.description || query,
      author: r.user?.name ?? "Unknown",
      authorUrl: r.user?.links?.html ?? "https://unsplash.com",
      width: r.width ?? 0,
      height: r.height ?? 0,
      source: "unsplash" as const,
    }];
  });
}

export async function searchStockVideos(
  query: string,
  page: number,
): Promise<StockVideoResult[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    throw new StockError(
      "NOT_CONFIGURED",
      "Stock video search is not configured — PEXELS_API_KEY is unset.",
    );
  }
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    query,
    page: String(Math.max(1, page)),
    per_page: String(PER_PAGE),
  });

  const data = await fetchJson(
    `https://api.pexels.com/videos/search?${params}`,
    { Authorization: key },
    "Pexels",
  );
  const videos = (data as { videos?: unknown[] })?.videos;
  if (!Array.isArray(videos)) {
    throw new StockError("REQUEST_FAILED", "Pexels returned an unexpected response.");
  }

  return videos.flatMap((raw) => {
    const v = raw as {
      id?: number | string;
      duration?: number;
      image?: string;
      user?: { name?: string };
      video_files?: Array<{ link?: string; quality?: string; height?: number }>;
    };
    // Prefer an HD/SD mp4 with a real link; fall back to the first file.
    const file =
      v.video_files?.find((f) => f.quality === "hd" && f.link) ??
      v.video_files?.find((f) => f.link) ??
      null;
    if (!v.id || !file?.link) return [];
    return [{
      id: String(v.id),
      url: file.link,
      thumb: v.image ?? "",
      duration: v.duration ?? 0,
      author: v.user?.name ?? "Unknown",
      source: "pexels" as const,
    }];
  });
}
