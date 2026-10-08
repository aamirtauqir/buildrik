/**
 * inverseResolveTokens — replace literal token values in HTML with
 * `{{token.kind.name}}` placeholders.
 *
 * Used by save-as-template (P4). When a user saves the active page as a
 * template, this walks the HTML and rewrites every CSS value that
 * matches a known token back into a placeholder. The result is a
 * portable template that re-applies cleanly under any project's DS.
 *
 * Only whole values inside `style="…"` declarations are rewritten, and only
 * against tokens of the property's kind (radius tokens in `border-radius`,
 * spacing in padding/margin/gap…). It used to be a blind substring replace
 * over the whole document: a "0" radius token landed inside `#0a081e`, rgba
 * channels and element ids, and applying the template stripped the page's
 * styling (audit L2-001). Hex colors are case-normalized so `#2D6DFF` and
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
}

/* resolveTemplateTokens' PLACEHOLDER_RE reads only these names; a placeholder
   it cannot read would be left verbatim in the applied page. */
const READABLE_NAME = /^[a-z0-9-]+$/;

/** Which token kind a CSS property may take. */
function bucketFor(property: string): Bucket {
  if (property.includes("radius")) return "radius";
  if (/^(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left)\b/.test(property)) {
    return "spacing";
  }
  if (/^(font|line-height|letter-spacing)\b/.test(property)) return "typography";
  return "colors";
}

/** Per bucket: value → placeholder. First-write wins on ties. */
function buildReverseLookup(snapshot: TokenSnapshot): Record<Bucket, Map<string, ReverseEntry>> {
  const out = {} as Record<Bucket, Map<string, ReverseEntry>>;
  (Object.keys(KIND_OUT) as Bucket[]).forEach((bucket) => {
    const map = new Map<string, ReverseEntry>();
    for (const [name, value] of Object.entries(snapshot[bucket] ?? {})) {
      if (!value || !READABLE_NAME.test(name)) continue;
      const key = normalize(value);
      if (!map.has(key)) map.set(key, { placeholder: `{{token.${KIND_OUT[bucket]}.${name}}}` });
    }
    out[bucket] = map;
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
 * Replace token values with placeholders inside `style` attributes. A value
 * matches as a whole, or as a whole space-separated part (`padding: 4px 8px`);
 * never as a substring of a longer word.
 */
export function inverseResolveTokens(
  html: string,
  snapshot: TokenSnapshot,
  options: InverseResolveOptions = {},
): string {
  if (!html) return html;
  const lookup = buildReverseLookup(snapshot);
  if (Object.values(lookup).every((m) => m.size === 0)) return html;

  const swap = (word: string, bucket: Bucket): string => {
    const entry = lookup[bucket].get(normalize(word));
    if (!entry) return word;
    options.onSwap?.(word, entry.placeholder);
    return entry.placeholder;
  };

  return html.replace(/(\sstyle=")([^"]*)(")/gi, (_m, open: string, decls: string, close: string) => {
    const rewritten = decls.replace(
      /(^|;)(\s*)([a-zA-Z-]+)(\s*:\s*)([^;]*)/g,
      (_d, sep: string, ws: string, prop: string, colon: string, value: string) => {
        const bucket = bucketFor(prop.toLowerCase());
        const trimmed = value.trim();
        const whole = swap(trimmed, bucket);
        const next = whole !== trimmed
          ? value.replace(trimmed, whole)
          : value.replace(/[^\s]+/g, (part) => swap(part, bucket));
        return `${sep}${ws}${prop}${colon}${next}`;
      },
    );
    return `${open}${rewritten}${close}`;
  });
}
