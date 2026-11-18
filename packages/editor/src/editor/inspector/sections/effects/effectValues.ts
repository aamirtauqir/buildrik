/**
 * Effect values — reading and composing the multi-part CSS values the
 * Effects sections share: `box-shadow` (outer + inset layers), `filter` and
 * `transform` (several functions in one string).
 *
 * Composing merges ONE function into the existing value instead of replacing
 * the whole string: adjusting one slider (rotate) used to wipe every other
 * function (scale, translate…) — silently destroying the user's other
 * effects.
 *
 * @license BSD-3-Clause
 */

/** Split on commas that are not inside parentheses (rgba(…)). */
const splitLayers = (value: string) => value.split(/,(?![^(]*\))/).map((s) => s.trim());

/** One box-shadow layer as the Shadow rows edit it (2L9 161:12525). */
export interface ShadowLayer {
  inset: boolean;
  x: string;
  y: string;
  blur: string;
  spread: string;
  color: string;
}

const LENGTH = /^-?(\d+\.?\d*|\.\d+)(px|em|rem|%)?$/;

/** A layer's parts, or null when it is not "[inset] x y [blur] [spread] [color]"
 *  (a var(), calc(), more lengths) — such a value is kept as written. */
function parseShadowLayer(layer: string): ShadowLayer | null {
  const tokens = layer.trim().match(/[^\s(]+(\([^)]*\))?/g) ?? [];
  let inset = false;
  const lengths: string[] = [];
  const colour: string[] = [];
  for (const t of tokens) {
    if (t === "inset") inset = true;
    else if (LENGTH.test(t)) {
      if (colour.length) return null;
      lengths.push(/^-?0$/.test(t) ? "0px" : /\d$/.test(t) ? `${t}px` : t);
    } else if (/^(#|rgba?\(|hsla?\(|[a-z]+$)/i.test(t)) colour.push(t);
    else return null;
  }
  if (lengths.length < 2 || lengths.length > 4 || colour.length > 1) return null;
  const [x, y, blur = "0px", spread = "0px"] = lengths;
  return { inset, x, y, blur, spread, color: colour[0] ?? "rgba(0, 0, 0, 1)" };
}

/** Every layer of a box-shadow, or null when any one cannot be edited as parts. */
export function parseShadowLayers(value: string | undefined): ShadowLayer[] | null {
  if (!value || value === "none") return [];
  const layers = splitLayers(value).map(parseShadowLayer);
  return layers.every((l): l is ShadowLayer => l !== null) ? layers : null;
}

export const composeShadowLayers = (layers: readonly ShadowLayer[]): string =>
  layers.length ? layers.map((l) => `${l.inset ? "inset " : ""}${l.x} ${l.y} ${l.blur} ${l.spread} ${l.color}`).join(", ") : "none";

/** The functions of a filter / transform value, in written order. */
export const functionsOf = (value: string | undefined): string[] =>
  value && value !== "none" ? [...value.matchAll(/([\w-]+)\(/g)].map((m) => m[1]) : [];

/** Can controls for `known` edit this value without losing part of it — no
 *  function they do not know, none written twice? */
export function composable(value: string | undefined, known: readonly string[]): boolean {
  const fns = functionsOf(value);
  return fns.every((f) => known.includes(f)) && new Set(fns).size === fns.length;
}

/** The argument of `type(…)` inside a filter / transform value. */
export const parseFunction = (value: string | undefined, type: string, defaultValue: string): string => {
  if (!value) return defaultValue;
  const match = value.match(new RegExp(`${type}\\(([^)]+)\\)`));
  return match?.[1] || defaultValue;
};

/** The `name(args)` functions of a filter / transform value, in order;
    nested parentheses (`drop-shadow(… rgba(…))`) stay inside their function. */
const splitFunctions = (value: string): Array<[string, string]> => {
  const out: Array<[string, string]> = [];
  const re = /([\w-]+)\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value))) {
    let depth = 1;
    let i = re.lastIndex;
    for (; i < value.length && depth > 0; i++) {
      if (value[i] === "(") depth++;
      else if (value[i] === ")") depth--;
    }
    out.push([m[1], value.slice(re.lastIndex, i - 1)]);
    re.lastIndex = i;
  }
  return out;
};

/* Functions the sliders do not own (`translate(-50%, -50%)`, `matrix(…)`,
   `drop-shadow(…)`) are kept, ahead of the slider functions and in their
   own order — editing rotate used to drop a centring translate. */
const composeFunctional = (
  current: string | undefined,
  order: string[],
  identity: Record<string, string>,
  fn: string,
  arg: string
): string => {
  const map = new Map<string, string>();
  const others: string[] = [];
  if (current && current !== "none") {
    for (const [name, args] of splitFunctions(current)) {
      if (order.includes(name)) map.set(name, args);
      else others.push(`${name}(${args})`);
    }
  }
  const trimmed = arg.trim();
  if (trimmed === "" || trimmed === identity[fn]) map.delete(fn);
  else map.set(fn, trimmed);

  const parts: string[] = [...others];
  for (const key of order) {
    const v = map.get(key);
    if (v === undefined || v === "" || v === identity[key]) continue;
    parts.push(`${key}(${v})`);
  }
  return parts.length ? parts.join(" ") : "none";
};

const TRANSFORM_ORDER = ["translateX", "translateY", "scale", "rotate", "skew"];
const TRANSFORM_IDENTITY: Record<string, string> = {
  translateX: "0px",
  translateY: "0px",
  scale: "1",
  rotate: "0deg",
  skew: "0deg",
};
export const composeTransform = (current: string | undefined, fn: string, arg: string) =>
  composeFunctional(current, TRANSFORM_ORDER, TRANSFORM_IDENTITY, fn, arg);

export const FILTER_ORDER = ["blur", "brightness", "contrast", "grayscale"];
const FILTER_IDENTITY: Record<string, string> = {
  blur: "0px",
  brightness: "100%",
  contrast: "100%",
  grayscale: "0%",
};
export const composeFilter = (current: string | undefined, fn: string, arg: string) =>
  composeFunctional(current, FILTER_ORDER, FILTER_IDENTITY, fn, arg);
