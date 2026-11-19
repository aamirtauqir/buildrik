/**
 * ResolvedStyle — the value a property actually has at a breakpoint and
 * state, by the one precedence contract canvas, Preview and publish share
 * (plan D10). The published stylesheet is desktop-first:
 *
 *   base (desktop)                      [data-buildrick-id] / .buildrick-<id>   (0,1,0)
 *   base :state                         [data-buildrick-id]:hover               (0,2,0)
 *   @media (max-width: 1023px)  tablet, then tablet :state
 *   @media (max-width: 767px)   mobile, then mobile :state
 *
 * At a breakpoint every wider layer still applies (a mobile viewport also
 * matches the tablet query), later layers win among equals, and a state rule
 * outranks every plain rule by specificity — so the desktop :hover beats a
 * tablet base value while hovering on tablet. Resolution mirrors exactly
 * that: plain layers widest → narrowest, then state layers widest → narrowest.
 *
 * Reading only through `StyleLayerSource` keeps this pure (no composer, no
 * DOM), so the inspector, the resize/keyboard nudges and tests share it.
 */
import { BREAKPOINT_ORDER } from "@/shared/constants/breakpoints";
import type { PseudoStateId } from "@/shared/types";
import type { BreakpointId } from "@/shared/types/breakpoints";

export interface StyleLayerSource {
  /** The element's base (desktop) styles. */
  base(): Record<string, string>;
  /** The element's own override at a non-desktop breakpoint. */
  breakpoint(breakpoint: Exclude<BreakpointId, "desktop">): Record<string, string>;
  /** The element's rule for `state` at `breakpoint` (desktop = no media query). */
  state(state: Exclude<PseudoStateId, "normal">, breakpoint: BreakpointId): Record<string, string>;
}

/** The breakpoints whose rules apply at `breakpoint`, widest first. */
function layersAt(breakpoint: BreakpointId): BreakpointId[] {
  const end = BREAKPOINT_ORDER.indexOf(breakpoint);
  return BREAKPOINT_ORDER.slice(0, end < 0 ? 1 : end + 1);
}

/**
 * One selector's rules, as a cascade source (class-first, CLASS-FIRST-SPEC
 * §2.2): a tag (`h1`), a class chain (`.card.is-dark`) or the element itself
 * ("local" — its own styles and `[data-buildrick-id]` rules).
 */
export interface StyleSource {
  kind: "tag" | "class" | "local";
  /** The rule selector: `h1`, `.card.is-dark`, or the element's `[data-buildrick-id]`. */
  selector: string;
  layers: StyleLayerSource;
}

/** Where a resolved value comes from: which selector, at which breakpoint, in which state. */
export interface StyleOrigin {
  kind: StyleSource["kind"];
  selector: string;
  breakpoint: BreakpointId;
  state: PseudoStateId;
}

export type ResolvedValue = { value: string; from: StyleOrigin };

/**
 * Every property's value and origin at `breakpoint` × `state`, from sources
 * listed lowest first — tags, classes (base before combo, as the class
 * model's sheet orders them), then the element. Each source resolves by the
 * D10 rule above; a later source wins outright, even against an earlier
 * source's state or narrower breakpoint, which is the class model's ladder
 * (owner Q3: an element's own value beats a class's :hover). Pure: no DOM.
 */
export function resolveStyleSources(
  sources: readonly StyleSource[],
  breakpoint: BreakpointId,
  state: PseudoStateId = "normal",
): Record<string, ResolvedValue> {
  const layers = layersAt(breakpoint);
  const out: Record<string, ResolvedValue> = {};
  for (const { kind, selector, layers: source } of sources) {
    const put = (props: Record<string, string>, bp: BreakpointId, st: PseudoStateId) => {
      for (const [prop, value] of Object.entries(props)) out[prop] = { value, from: { kind, selector, breakpoint: bp, state: st } };
    };
    for (const bp of layers) put(bp === "desktop" ? source.base() : source.breakpoint(bp), bp, "normal");
    if (state !== "normal") for (const bp of layers) put(source.state(state, bp), bp, state);
  }
  return out;
}

/** One element's own layers resolved, values only — the element model's whole cascade. */
export function resolveStyle(
  source: StyleLayerSource,
  breakpoint: BreakpointId,
  state: PseudoStateId = "normal",
): Record<string, string> {
  const resolved = resolveStyleSources([{ kind: "local", selector: "", layers: source }], breakpoint, state);
  return Object.fromEntries(Object.entries(resolved).map(([prop, r]) => [prop, r.value]));
}
