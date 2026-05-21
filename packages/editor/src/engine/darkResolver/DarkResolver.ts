import type { DesignToken } from "../designSystem/types";
import type { EventEmitter } from "../EventEmitter";

/**
 * Composer-owned dark-mode resolver for color tokens.
 *
 * Resolution rule:
 *   resolved === "light"  → token.value
 *   resolved === "dark"   → token.darkValue ?? token.value (+ emit tokens:dark-missing)
 *
 * `darkValue === ""` (empty string) is treated as explicit and NOT as missing.
 *
 * Phase B.0 ships only resolution + missing-pair emission. UI listener
 * (Inspector warn chip) ships in a later sub-phase.
 */
export class DarkResolver {
  constructor(private readonly events: EventEmitter) {}

  resolve(token: DesignToken, resolved: "light" | "dark"): string {
    if (resolved === "light") {
      return token.value;
    }
    if (token.darkValue !== undefined) {
      return token.darkValue;
    }
    this.events.emit("tokens:dark-missing", { tokenId: token.id });
    return token.value;
  }

  resolveAll(tokens: readonly DesignToken[], resolved: "light" | "dark"): Map<string, string> {
    const out = new Map<string, string>();
    for (const t of tokens) {
      out.set(t.id, this.resolve(t, resolved));
    }
    return out;
  }
}
