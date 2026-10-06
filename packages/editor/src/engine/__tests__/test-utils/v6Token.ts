import type { DesignToken } from "@/engine/designSystem/types";

/** A v6 token for tests, written the way the old v5 rows read: `value` (light
 *  literal), `alias` (light alias) and `dark` (dark literal). Anything that
 *  aliases or carries a dark value is semantic; a plain literal is a primitive
 *  unless `layer` says otherwise. Unset fields default to a colour token. */
export type V6TokenSpec = Partial<Omit<DesignToken, "modes">> & {
  id: string;
  value?: string;
  alias?: string;
  dark?: string;
};

export function v6Token(spec: V6TokenSpec): DesignToken {
  const { value, alias, dark, ...rest } = spec;
  const light = alias !== undefined ? { alias } : { value: value ?? "" };
  return {
    name: spec.id,
    kind: "color",
    category: "colors",
    cssVar: `--buildrick-design-${spec.id}`,
    type: "color",
    layer: alias !== undefined || dark !== undefined ? "semantic" : "primitive",
    ...rest,
    modes: dark !== undefined ? { light, dark: { value: dark } } : { light },
  };
}
