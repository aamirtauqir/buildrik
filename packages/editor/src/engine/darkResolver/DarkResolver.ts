import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@/engine/designSystem/types";

/**
 * Composer-owned dark-mode resolver for color tokens.
 *
 * Resolution rule: the token's literal in the resolved mode, following
 * aliases (`resolveTokenLiteral`). Dark falls back to light at every hop, so
 * a token without a dark mode resolves to its light literal.
 *
 * An empty dark literal is treated as explicit and NOT as missing.
 *
 * It used to emit `tokens:dark-missing` for the planned "Dark value missing"
 * inspector chip, which was never built and has no board (C5 G1-106, owner:
 * build or delete — deleted).
 */
export class DarkResolver {

  resolve(token: DesignToken, tokens: readonly DesignToken[], resolved: "light" | "dark"): string {
    return resolveTokenLiteral(tokens, token.id, resolved) ?? "";
  }

  resolveAll(tokens: readonly DesignToken[], resolved: "light" | "dark"): Map<string, string> {
    const out = new Map<string, string>();
    for (const t of tokens) {
      out.set(t.id, this.resolve(t, tokens, resolved));
    }
    return out;
  }
}
