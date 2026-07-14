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
