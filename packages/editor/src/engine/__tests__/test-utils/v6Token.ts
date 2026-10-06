import type { DesignToken, TokenRef } from "@/engine/designSystem/types";

/** A v6 token for tests, written the way the old v5 rows read: `value` (light
 *  literal), `alias` (light alias) and `dark` (dark literal). Anything that
 *  aliases or carries a dark value is semantic; a plain literal is a primitive
 *  unless `layer` says semantic. Unset fields default to a colour token; an
 *  unset kind follows the category (typography → type, spacing → spacing).
 *  Spreading an existing token in keeps its modes unless `value`, `alias` or
 *  `dark` override them. */
export type V6TokenSpec = Partial<DesignToken> & {
  id: string;
  value?: string;
  alias?: string;
  dark?: string;
};

export function v6Token(spec: V6TokenSpec): DesignToken {
  const { value, alias, dark, modes, ...rest } = spec;
  const light: TokenRef =
    alias !== undefined ? { alias } : value !== undefined ? { value } : (modes?.light ?? { value: "" });
  const darkRef: TokenRef | undefined = dark !== undefined ? { value: dark } : modes?.dark;
  const category = rest.category ?? "colors";
  return {
    name: spec.id,
    kind: category === "typography" ? "type" : category === "spacing" ? "spacing" : "color",
    cssVar: `--buildrick-design-${spec.id}`,
    type: "color",
    ...rest,
    category,
    // Only a semantic token may alias or carry a dark mode.
    layer: alias !== undefined || darkRef !== undefined ? "semantic" : (rest.layer ?? "primitive"),
    modes: darkRef !== undefined ? { light, dark: darkRef } : { light },
  };
}

/** The light literal a token holds itself — undefined when it aliases. */
export function ownLight(token: DesignToken | undefined): string | undefined {
  return token && "value" in token.modes.light ? token.modes.light.value : undefined;
}
