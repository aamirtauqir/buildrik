// packages/shared/tokens/emit.ts
/**
 * The one token CSS emitter (spec §2): canvas, single-file export, ZIP export
 * and publish all write this string. Aliases stay `var()` so a primitive edit
 * cascades in the browser. Dark blocks only when the site's Dark mode is
 * "auto" (D8). A bad value is skipped and reported, never thrown, so one token
 * can never fail a publish (D17).
 */
import type { DarkMode, DesignToken, TokenRef } from "../schemas/design-tokens";
import { LEGACY_SEED } from "./legacySeed";

// Same strip set as v5's escapeCssValue (control chars, braces) plus `;` and `<`.
// eslint-disable-next-line no-control-regex -- control-char stripping is the intent
const clean = (v: string) => v.replace(/[\x00-\x1f\x7f;{}<]/g, "").trim();

/** A custom-property name is user data too: a crafted `--x:red}</style><script>` must never reach a page. */
const SAFE_VAR = /^--[a-zA-Z0-9_-]+$/;
export const isSafeCssVarName = (name: string) => SAFE_VAR.test(name);

export function emitTokenCss(
  tokens: readonly DesignToken[],
  opts: { darkMode: DarkMode; onSkip?: (id: string, reason: string) => void },
): string {
  const byId = new Map(tokens.map((t) => [t.id, t]));
  /* A soft-deleted token (spec §6) points at its replacement: every name it
     answers to must read the replacement's value, in both modes. */
  const lightRef = (t: DesignToken): TokenRef => (t.replacedBy ? { alias: t.replacedBy } : t.modes.light);
  const safeNames = (t: DesignToken) => SAFE_VAR.test(t.cssVar) && (t.legacyNames ?? []).every((n) => SAFE_VAR.test(n));

  /* Pass one: which tokens get a light declaration. An alias counts only when
     its target does — `var()` of a var nobody defines is not a fallback, it
     is no value at all, and it would beat the legacy backstop below. */
  const emitted = new Map<string, boolean>();
  const emits = (t: DesignToken, visiting: Set<string> = new Set()): boolean => {
    const known = emitted.get(t.id);
    if (known !== undefined) return known;
    if (visiting.has(t.id)) return false;
    visiting.add(t.id);
    const ref = lightRef(t);
    let ok = safeNames(t);
    if (ok) {
      if ("alias" in ref) {
        const target = byId.get(ref.alias);
        ok = target !== undefined && emits(target, visiting);
      } else {
        ok = clean(ref.value) !== "";
      }
    }
    emitted.set(t.id, ok);
    return ok;
  };
  for (const t of tokens) emits(t);

  const refCss = (ref: TokenRef): string | null => {
    if ("alias" in ref) {
      const target = byId.get(ref.alias);
      return target && emitted.get(target.id) ? `var(${target.cssVar})` : null;
    }
    return clean(ref.value) || null;
  };

  const light: string[] = [];
  const dark: string[] = [];
  const seen = new Set<string>();
  for (const t of tokens) {
    if (!safeNames(t)) {
      opts.onSkip?.(t.id, "unsafe custom-property name");
      continue;
    }
    const lv = emitted.get(t.id) ? refCss(lightRef(t)) : null;
    if (!lv) {
      opts.onSkip?.(t.id, "alias" in lightRef(t) ? "alias target not emitted" : "empty or unresolvable light value");
      continue;
    }
    seen.add(t.cssVar);
    light.push(`${t.cssVar}:${lv}`);
    for (const legacy of t.legacyNames ?? []) {
      if (seen.has(legacy)) continue;
      seen.add(legacy);
      light.push(`${legacy}:var(${t.cssVar})`);
    }
    if (opts.darkMode === "auto" && t.modes.dark && !t.replacedBy) {
      const dv = refCss(t.modes.dark);
      if (dv) dark.push(`${t.cssVar}:${dv}`);
      else opts.onSkip?.(t.id, "unresolvable dark value");
    }
  }
  for (const s of LEGACY_SEED) {
    if (seen.has(s.cssVar)) continue;
    const v = clean(s.value);
    if (!v) continue;
    seen.add(s.cssVar);
    light.push(`${s.cssVar}:${v}`);
  }

  let css = `\n:root{${light.join(";")}}\n`;
  if (dark.length) {
    const body = dark.join(";");
    css += `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${body}}}\n`;
    css += `:root[data-theme="dark"]{${body}}\n`;
  }
  return css;
}
