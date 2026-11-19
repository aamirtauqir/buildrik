/**
 * The one CSS generator for an element tree's BASE layer — the element's own
 * (desktop) styles plus its per-breakpoint hides — shared by the published
 * page, Preview and the editor canvas (plan D10). The breakpoint and state
 * layers come from StyleEngine.generateResponsiveCSS, which takes the same
 * target.
 *
 * A target is either
 *   "media"        — real viewport queries: the published page and Preview;
 *   a breakpoint   — the editor canvas previewing that breakpoint. The editor
 *                    is one page with a narrowed canvas inside it, so no
 *                    viewport query (and, with the canvas padding and a
 *                    classic scrollbar, no container query either — D35)
 *                    measures the device being previewed. Rules that apply
 *                    at that breakpoint are written without a query, in the
 *                    same order and at the same specificity.
 * Same selectors, same order, same precedence — so the canvas, Preview and
 * the live site resolve every property the same way (ResolvedStyle).
 */
import { isSafeElementId } from "@buildrik/shared/schemas/element-markup";
import { CLASS_CHAIN_MAX, type StyleModel } from "@buildrik/shared/schemas/class-styles";
import type { BreakpointId } from "@/shared/types/breakpoints";
import { isSafeAttrValue } from "@/shared/utils/html/sanitization";
import { stylesToCSS, stylesToString } from "../export/ExportHelpers";

export type CascadeTarget = "media" | BreakpointId;

/**
 * How many times an element-local rule repeats its identity selector in the
 * class style model (CLASS-FIRST-SPEC §4.2, the specificity ladder). A class
 * rule is at most CLASS_CHAIN_MAX classes plus one pseudo-class — (0,4,0) —
 * so a local identity repeated one more time than that, (0,5,0), beats every
 * class rule, state rules included, by specificity alone. The spec's 4×
 * relied on locals coming after classes in source order, but every surface
 * writes the element base rules (elementBaseCSS) BEFORE the class rules, so
 * `.a.b.c:hover` would have tied a local base value and won.
 */
const LOCAL_LADDER = CLASS_CHAIN_MAX + 2;

/**
 * An element-local rule's identity selector (`.buildrick-<id>` on publish,
 * `[data-buildrick-id="<id>"]` on the canvas and in StyleEngine rules) as the
 * cascade writes it: unchanged in the element model, so legacy output stays
 * byte-identical; repeated LOCAL_LADDER times in the class model, so a value
 * set on "this element only" wins over every tag and class rule at every
 * breakpoint and in every state (owner Q3, BD-38). `pseudo` (`:hover`) goes
 * after the repeated identity.
 */
export function localSelector(identity: string, styleModel: StyleModel, pseudo = ""): string {
  return (styleModel === "class" ? identity.repeat(LOCAL_LADDER) : identity) + pseudo;
}

/** `--hide-<bp>: true` (the inspector's Visibility toggles), per breakpoint, as the viewport query that hides. */
const HIDE_QUERIES: Record<BreakpointId, { key: string; query: string }> = {
  mobile: { key: "--hide-mobile", query: "(max-width:767px)" },
  tablet: { key: "--hide-tablet", query: "(min-width:768px) and (max-width:1023px)" },
  desktop: { key: "--hide-desktop", query: "(min-width:1024px)" },
};

/**
 * Per-breakpoint hide, as the rules that actually hide something. The custom
 * property itself is inert in a browser. On the canvas only the previewed
 * breakpoint's hide applies; the element stays in the tree, so it can still
 * be selected to un-hide.
 */
export function hideRulesFor(selector: string, styles: Record<string, string>, target: CascadeTarget = "media"): string[] {
  if (target !== "media") {
    return styles[HIDE_QUERIES[target].key] === "true" ? [`${selector}{display:none!important}`] : [];
  }
  return (["mobile", "tablet", "desktop"] as const)
    .filter((bp) => styles[HIDE_QUERIES[bp].key] === "true")
    .map((bp) => `@media ${HIDE_QUERIES[bp].query}{${selector}{display:none!important}}`);
}

export interface StyleNode {
  id: string;
  styles?: Record<string, string>;
  children?: StyleNode[];
}

/** Built rules per element, keyed by id + serialized styles + target. */
export type BaseRuleCache = Map<string, { base: string | null; hides: string[] }>;

/**
 * Base rules for every element under `roots`, then their hide rules.
 *
 *   base  `<sel> { … }`                         (0,1,0)
 *   later breakpoint rules (generateResponsiveCSS) win by source order
 *   hide  `<at-rule>{<sel>{display:none!important}}`
 *
 * A declaration that could leave its rule is dropped (stylesToCSS), and a
 * whole block carrying a dangerous pattern (expression(), -moz-binding) is
 * dropped, as the inline style attribute used to be.
 *
 * `styleModel` "class" writes each selector through localSelector (the
 * specificity ladder); "element" leaves it as `selectorFor` built it.
 *
 * `cache` (the canvas passes one) keeps each element's built rules between
 * calls: the canvas rewrites its whole sheet on every edit, and rebuilding
 * 500 unchanged rules each time was the bulk of the cost. An element whose
 * styles changed gets a new key and is rebuilt.
 */
export function elementBaseCSS(
  roots: Array<StyleNode | undefined>,
  selectorFor: (id: string) => string,
  target: CascadeTarget,
  minify: boolean,
  cache?: BaseRuleCache,
  styleModel: StyleModel = "element",
): string {
  const baseRules: string[] = [];
  const hideRules: string[] = [];
  const build = (id: string, styles: Record<string, string>, flat: string) => {
    const sel = localSelector(selectorFor(id), styleModel);
    const base = isSafeAttrValue("style", flat, "")
      ? minify
        ? `${sel}{${stylesToCSS(styles, true)}}`
        : `${sel} {\n${stylesToCSS(styles, false)}}\n`
      : null;
    return { base, hides: hideRulesFor(sel, styles, target) };
  };
  const walk = (el: StyleNode | undefined): void => {
    if (!el) return;
    const styles = el.styles;
    if (isSafeElementId(el.id) && styles && Object.keys(styles).length > 0) {
      const flat = stylesToString(styles);
      let built;
      if (cache) {
        const key = `${el.id}|${target}|${styleModel}|${flat}`;
        built = cache.get(key);
        if (!built) cache.set(key, (built = build(el.id, styles, flat)));
      } else {
        built = build(el.id, styles, flat);
      }
      if (built.base) baseRules.push(built.base);
      hideRules.push(...built.hides);
    }
    el.children?.forEach(walk);
  };
  roots.forEach(walk);
  if (cache && cache.size > 20000) cache.clear();
  return [...baseRules, ...hideRules].join(minify ? "" : "\n");
}
