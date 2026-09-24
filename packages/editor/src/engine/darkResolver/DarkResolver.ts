import type { DesignToken } from "../designSystem/types";

/**
 * Composer-owned dark-mode resolver for color tokens.
 *
 * Resolution rule:
 *   resolved === "light"  → token.value
 *   resolved === "dark"   → token.darkValue ?? token.value
 *
 * `darkValue === ""` (empty string) is treated as explicit and NOT as missing.
 *
 * It used to emit `tokens:dark-missing` for the planned "Dark value missing"
 * inspector chip, which was never built and has no board (C5 G1-106, owner:
 * build or delete — deleted).
 */
export class DarkResolver {

  resolve(token: DesignToken, resolved: "light" | "dark"): string {
    if (resolved === "light") {
      return token.value;
    }
    return token.darkValue ?? token.value;
  }

  resolveAll(tokens: readonly DesignToken[], resolved: "light" | "dark"): Map<string, string> {
    const out = new Map<string, string>();
    for (const t of tokens) {
      out.set(t.id, this.resolve(t, resolved));
    }
    return out;
  }
}
