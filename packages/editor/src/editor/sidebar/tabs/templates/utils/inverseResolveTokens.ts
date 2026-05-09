/**
 * inverseResolveTokens — replace literal token values in HTML with
 * `{{token.kind.name}}` placeholders.
 *
 * Used by save-as-template (P4). When a user saves the active page as a
 * template, this walks the HTML and rewrites every CSS value that
 * matches a known token back into a placeholder. The result is a
 * portable template that re-applies cleanly under any project's DS.
 *
 * Per CEO plan AD2: build a `byValue` lookup from TokenSnapshot, run a
 * single-pass replace. Hex colors are case-normalized so `#2D6DFF` and
 * `#2d6dff` both bind. Non-token values pass through unchanged.
 *
 * Conflict policy: when two tokens share the same value (e.g., color-
 * primary and color-accent both set to cobalt), the FIRST registered
 * wins (insertion order). Ties are unavoidable but rare; users can
 * post-edit the placeholder if needed.
 *
 * @license BSD-3-Clause
 */
import type { TokenSnapshot } from "./tokenSnapshot";

type Bucket = keyof TokenSnapshot;

const KIND_OUT: Record<Bucket, string> = {
  colors: "color",
  spacing: "spacing",
  typography: "type",
  radius: "radius",
};

interface ReverseEntry {
  /** Pre-built placeholder string, e.g., "{{token.color.primary}}". */
  placeholder: string;
  /** Original literal value, kept for diagnostics. */
  value: string;
}

/**
 * Build a value → placeholder lookup table. Hex colors are stored
 * lowercased; the resolve step normalizes the input before lookup
 * so `#2D6DFF` and `#2d6dff` collide on the same entry.
 */
function buildReverseLookup(snapshot: TokenSnapshot): Map<string, ReverseEntry> {
  const out = new Map<string, ReverseEntry>();
  (Object.keys(snapshot) as Bucket[]).forEach((bucket) => {
    const kindOut = KIND_OUT[bucket];
    const entries = snapshot[bucket];
    for (const [name, value] of Object.entries(entries)) {
      if (!value) continue;
      const key = normalize(value);
      // First-write wins on ties.
      if (!out.has(key)) {
        out.set(key, {
          placeholder: `{{token.${kindOut}.${name}}}`,
          value,
        });
      }
    }
  });
  return out;
}

function normalize(value: string): string {
  const trimmed = value.trim();
  // Lowercase hex colors so #2D6DFF / #2d6dff bind to the same token.
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed.toLowerCase();
  return trimmed;
}

export interface InverseResolveOptions {
  /** Telemetry hook fired for every successful substitution. */
  onSwap?: (from: string, placeholder: string) => void;
}

/**
 * Walk the HTML once, replace every token value with its placeholder.
 *
 * Strategy: scan with a master regex that matches any token value in
 * the lookup table. We escape values for regex safety and join with
 * alternation. Hex matches are case-insensitive; other values are
 * exact. Avoids parsing the DOM — keeps the function pure + portable.
 */
export function inverseResolveTokens(
  html: string,
  snapshot: TokenSnapshot,
  options: InverseResolveOptions = {},
): string {
  if (!html) return html;
  const lookup = buildReverseLookup(snapshot);
  if (lookup.size === 0) return html;

  // Sort keys by length DESC so longer values match before shorter
  // substrings of them (e.g., "#2d6dff" before "#2d").
  const keys = Array.from(lookup.keys()).sort((a, b) => b.length - a.length);

  // Build alternation pattern. Escape regex metacharacters in each
  // value. Hex colors live as lowercase keys; the matcher uses the
  // `i` flag so source-case input still matches.
  const pattern = keys.map(escapeRegExp).join("|");
  if (!pattern) return html;
  const re = new RegExp(pattern, "gi");

  return html.replace(re, (match) => {
    const entry = lookup.get(normalize(match));
    if (!entry) return match;
    options.onSwap?.(match, entry.placeholder);
    return entry.placeholder;
  });
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
