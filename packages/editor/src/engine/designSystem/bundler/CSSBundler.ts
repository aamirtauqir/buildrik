import { emitTokenCss } from "@buildrik/shared/tokens";
import type { DesignToken } from "@/engine/designSystem/types";

export interface BundleOptions {
  /**
   * Which dark block to ship:
   *   - "media": `@media (prefers-color-scheme: dark)` (default)
   *   - "data-attr": `:root[data-theme="dark"]`
   *   - "off": light only
   */
  darkStrategy?: "media" | "data-attr" | "off";
}

/**
 * D5: CSSBundler — emits a publish-ready CSS bundle from project tokens.
 *
 * Delegates to `emitTokenCss` — the one emitter the canvas and every export
 * share — so a bundle can never disagree with the canvas about a value.
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
    const { darkStrategy = "media" } = options;
    const css = emitTokenCss(tokens, {
      darkMode: darkStrategy === "off" ? "off" : "auto",
      onSkip: (id, reason) => console.warn(`[tokens] skipped ${id}: ${reason}`),
    });
    // The emitter writes both dark blocks, one per line; a strategy keeps one.
    const drop = darkStrategy === "media" ? ":root[data-theme" : "@media";
    return css
      .split("\n")
      .filter((line) => !line.startsWith(drop))
      .join("\n");
  }
}
