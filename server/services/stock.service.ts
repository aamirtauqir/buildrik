/**
 * Stock media search proxy (#24, 2026-06-24). Server-side so provider API keys
 * stay off the client. Photos via Unsplash (UNSPLASH_ACCESS_KEY), videos via
 * Pexels (PEXELS_API_KEY). When a key is unset OR the upstream errors, returns
 * `[]` — exactly the prior stub behavior, so the editor's "no results" empty
 * state still holds. Shapes mirror the editor's StockPhoto / StockVideo.
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

async function fetchJson(url: string, headers: Record<string, string>): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // network / abort / parse — caller falls back to []
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
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !query.trim()) return [];

  const params = new URLSearchParams({
    query,
    page: String(Math.max(1, page)),
    per_page: String(PER_PAGE),
  });
  if (orientation) params.set("orientation", orientation);
  if (color) params.set("color", color);

  const data = await fetchJson(`https://api.unsplash.com/search/photos?${params}`, {
    Authorization: `Client-ID ${key}`,
    "Accept-Version": "v1",
  });
  const results = (data as { results?: unknown[] })?.results;
  if (!Array.isArray(results)) return [];

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
  if (!key || !query.trim()) return [];

  const params = new URLSearchParams({
    query,
    page: String(Math.max(1, page)),
    per_page: String(PER_PAGE),
  });

  const data = await fetchJson(`https://api.pexels.com/videos/search?${params}`, {
    Authorization: key,
  });
  const videos = (data as { videos?: unknown[] })?.videos;
  if (!Array.isArray(videos)) return [];

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
