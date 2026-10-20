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

/** The inset layer of a box-shadow, "" when there is none. */
export const extractInnerShadow = (boxShadow: string | undefined): string => {
  if (!boxShadow || boxShadow === "none") return "";
  return splitLayers(boxShadow).find((s) => s.startsWith("inset")) ?? "";
};

/** Every non-inset layer of a box-shadow, "" when there is none. */
export const extractOuterShadow = (boxShadow: string | undefined): string => {
  if (!boxShadow || boxShadow === "none") return "";
  return splitLayers(boxShadow)
    .filter((s) => !s.startsWith("inset"))
    .join(", ");
};

/** One box-shadow from an outer and an inner layer; "none" when both are empty. */
export const composeShadow = (outer: string, inner: string): string => {
  const layers = [outer, inner].filter((l) => l && l !== "none");
  return layers.length ? layers.join(", ") : "none";
};

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

const FILTER_ORDER = ["blur", "brightness", "contrast", "grayscale"];
const FILTER_IDENTITY: Record<string, string> = {
  blur: "0px",
  brightness: "100%",
  contrast: "100%",
  grayscale: "0%",
};
export const composeFilter = (current: string | undefined, fn: string, arg: string) =>
  composeFunctional(current, FILTER_ORDER, FILTER_IDENTITY, fn, arg);
