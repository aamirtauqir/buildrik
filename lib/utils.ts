import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Tailwind 4's `@theme` turns every `--text-*` token into a `text-…` utility, so
 * `text-auth-btn` (a size) is shape-identical to `text-auth-text-body` (a colour).
 * tailwind-merge files both under text-color and keeps only the last one, which
 * silently dropped the font size from every cn() that set size and colour
 * together — all five core auth primitives were rendering at their inherited
 * size. The size tokens have to be declared; they cannot be inferred.
 */
const FONT_SIZE_TOKENS = [
  "auth-btn",
  "auth-error",
  "auth-fine",
  "auth-input",
  "auth-label",
  "auth-subtitle",
  "auth-title",
  "auth-title-lg",
  "onb-title",
  "body",
  "body-sm",
  "eyebrow",
  "metric",
  "page-title",
  "section-title",
];

const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: FONT_SIZE_TOKENS }] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 24800 → "24.8k", 1_200_000 → "1.2m". Keeps big visitor/view counts compact. */
export function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  const m = n / 1_000_000;
  return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}m`;
}

/**
 * Draft share links are served by the dashboard itself, at `/share/<token>`.
 * They used to be built against `preview.buildrick.app`, a host that has no DNS
 * record and no handler — so every link handed to a client was dead. Baked at
 * build time, so this is safe in both the server and client halves of a page.
 */
export function shareUrl(token: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/share/${token}`;
}

/**
 * The address to show for a site: its verified custom domain, else the host of
 * the URL it actually deployed to. Null when the site has never been published —
 * in which case there is no address, and the UI must not invent one.
 */
export function siteAddress(site: { domain?: string | null; publishedUrl?: string | null }): string | null {
  if (site.domain) return site.domain;
  if (!site.publishedUrl) return null;
  try {
    return new URL(site.publishedUrl).host;
  } catch {
    return null;
  }
}

/**
 * Render one CSV cell: RFC-4180 quoting plus spreadsheet formula
 * neutralization. User-supplied values starting with = + - @ or a tab/CR
 * execute as formulas when the export opens in Excel/Sheets (`=cmd|...`
 * reaches the OS on Windows), so those get a leading apostrophe.
 */
export function csvCell(value: unknown): string {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
