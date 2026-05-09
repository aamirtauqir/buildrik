/**
 * tokenSnapshot — derives a flat per-kind name→value map from
 * DesignToken[] OR :root computed style.
 *
 * Used by `resolveTemplateTokens` to substitute `{{token.kind.name}}`
 * placeholders before sanitize+import. Pure data transform.
 *
 * Naming: snapshot keys come from stripping the `${kind}-` prefix off
 * each token's id (e.g., `color-primary` → `primary` under `colors`).
 * Falls back to lower-cased token.name when id has no kind prefix.
 *
 * @license BSD-3-Clause
 */

import type { DesignToken } from "../../../../design-system/types";

export interface TokenSnapshot {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  typography: Record<string, string>;
  radius: Record<string, string>;
}

/** Map a DesignToken to its snapshot bucket name + short key. */
function bucketAndKey(
  token: DesignToken,
): { bucket: keyof TokenSnapshot; key: string } | null {
  const kind =
    token.kind ??
    (token.category === "colors"
      ? "color"
      : token.category === "typography"
        ? "type"
        : token.category === "spacing"
          ? "spacing"
          : null);
  if (!kind) return null;

  let bucket: keyof TokenSnapshot;
  switch (kind) {
    case "color":
      bucket = "colors";
      break;
    case "spacing":
      bucket = "spacing";
      break;
    case "type":
      bucket = "typography";
      break;
    case "radius":
      bucket = "radius";
      break;
    default:
      return null;
  }

  // Strip `${kind}-` prefix from id; fall back to lowercased name.
  const prefix = `${kind}-`;
  const key = token.id.startsWith(prefix)
    ? token.id.slice(prefix.length)
    : token.name.toLowerCase();
  return { bucket, key };
}

export function snapshotFromTokens(
  tokens: ReadonlyArray<DesignToken>,
): TokenSnapshot {
  const out: TokenSnapshot = {
    colors: {},
    spacing: {},
    typography: {},
    radius: {},
  };
  for (const token of tokens) {
    const placement = bucketAndKey(token);
    if (!placement) continue;
    out[placement.bucket][placement.key] = token.value;
  }
  return out;
}

/**
 * Build a snapshot from :root computed style. For each token, reads
 * `getPropertyValue(cssVar).trim()` and falls back to `token.value`
 * when the computed value is empty (e.g., test environment without
 * the runtime cascade).
 *
 * Use at apply time so the snapshot reflects in-flight token edits
 * (a token edited in the Design tab applies to :root immediately;
 * runtime read is the source of truth).
 */
export function snapshotFromComputedStyle(
  el: HTMLElement,
  tokens: ReadonlyArray<DesignToken>,
): TokenSnapshot {
  const style = el.ownerDocument?.defaultView?.getComputedStyle?.(el);
  return snapshotFromTokens(
    tokens.map((token) => {
      const computed = style?.getPropertyValue(token.cssVar).trim() ?? "";
      return computed ? { ...token, value: computed } : token;
    }),
  );
}
