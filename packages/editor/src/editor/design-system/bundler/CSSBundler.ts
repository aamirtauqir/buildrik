import type { DesignToken } from "../types";

export interface BundleOptions {
  /**
   * Strategy for dark-mode emission:
   *   - "media": emit dark block under `@media (prefers-color-scheme: dark)`
   *   - "data-attr": emit dark block under `:root[data-theme="dark"]`
   *   - "off": skip dark block entirely (light only)
   * Default: "media".
   */
  darkStrategy?: "media" | "data-attr" | "off";
  /**
   * Pretty-print or single-line. Default: pretty.
   */
  pretty?: boolean;
}

const DEFAULT_OPTIONS: Required<BundleOptions> = {
  darkStrategy: "media",
  pretty: true,
};

function escapeCssValue(value: string): string {
  // Reject control chars + closing-brace injection. CSS values shouldn't
  // contain `{`, `}`, or unescaped backslashes anyway.
  return value.replace(/[\x00-\x1f\x7f{}]/g, "");
}

function isColorToken(t: DesignToken): boolean {
  return t.category === "colors" || t.kind === "color";
}

/**
 * D5: CSSBundler — emits a publish-ready CSS bundle from project tokens.
 *
 * Output structure:
 *   :root {
 *     --buildrick-design-color-primary: #3B82F6;
 *     ...
 *   }
 *   @media (prefers-color-scheme: dark) {
 *     :root {
 *       --buildrick-design-color-primary: #60A5FA;
 *       ...
 *     }
 *   }
 *
 * Used at publish time (Phase 1c+) to inject the active DS into the
 * generated site bundle, so Buildrik-generated pages style themselves
 * with the user's tokens without runtime JS.
 *
 * Pure: no DOM access, no engine state. `bundle()` is a function dressed
 * as a class for Composer surface symmetry with other resolvers.
 */
export class CSSBundler {
  bundle(tokens: readonly DesignToken[], options: BundleOptions = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const indent = opts.pretty ? "  " : "";
    const nl = opts.pretty ? "\n" : "";

    // Light block — every token contributes its `value`.
    const lightLines: string[] = [];
    for (const t of tokens) {
      lightLines.push(`${indent}${t.cssVar}: ${escapeCssValue(t.value)};`);
    }

    let bundle = `:root {${nl}${lightLines.join(nl)}${nl}}`;

    // Dark block — only color tokens with darkValue. Skip if strategy=off.
    if (opts.darkStrategy !== "off") {
      const darkColorLines: string[] = [];
      for (const t of tokens) {
        if (!isColorToken(t)) continue;
        if (t.darkValue === undefined) continue;
        darkColorLines.push(`${indent}${indent}${t.cssVar}: ${escapeCssValue(t.darkValue)};`);
      }

      if (darkColorLines.length > 0) {
        if (opts.darkStrategy === "media") {
          bundle += `${nl}@media (prefers-color-scheme: dark) {${nl}${indent}:root {${nl}${darkColorLines.join(nl)}${nl}${indent}}${nl}}`;
        } else {
          // data-attr: :root[data-theme="dark"] { ... }
          const dataAttrLines = darkColorLines.map((l) => l.replace(`${indent}${indent}`, indent));
          bundle += `${nl}:root[data-theme="dark"] {${nl}${dataAttrLines.join(nl)}${nl}}`;
        }
      }
    }

    return bundle;
  }
}
