/**
 * Aquibra Style Engine
 * Manages all CSS styles in the composer
 *
 * @module engine/styles/StyleEngine
 * @license BSD-3-Clause
 */

import { isSafeCssDeclaration, isSafeStyleRuleTarget } from "@buildrik/shared/schemas/element-markup";
import { EVENTS } from "@/shared/constants/events";
import {
  BREAKPOINT_ORDER,
  getBreakpointQuery,
  isValidBreakpoint,
} from "@/shared/constants/breakpoints";
import type { StyleData, ExportOptions, BreakpointStyles } from "@/shared/types";
import type { BreakpointId } from "@/shared/types/breakpoints";
import { devWarn } from "@/shared/utils/devLogger";
import { generateId, camelToKebab } from "@/shared/utils/helpers";
import type { Composer } from "../Composer";
import type { Element } from "../elements/Element";
import { elementSelector } from "@/shared/utils/elementSelector";
import { elementBaseCSS, localSelector, type BaseRuleCache, type CascadeTarget } from "./cascadeCSS";
import { selectorLayer } from "@/shared/utils/classSelector";

/**
 * Where a rule sorts inside its breakpoint bucket in the class style model
 * (CLASS-FIRST-SPEC §4.2): tags, then class chains by length (a combo after
 * its base), then any other selector, then element-local rules. Ties keep
 * insertion order (first-seen).
 */
function layerRank(selector: string): number {
  const layer = selectorLayer(selector);
  if (layer.kind === "tag") return 0;
  if (layer.kind === "class") return layer.chain.length;
  if (layer.kind === "other") return 100;
  return 200;
}


/**
 * Manages CSS styles and selectors
 */
export class StyleEngine {
  private composer: Composer;
  private styles: Map<string, StyleData> = new Map();
  private ruleIndex: Map<string, StyleData> = new Map();
  private styleElement: HTMLStyleElement | null = null;
  /** The canvas sheet's per-element base rules, reused across flushes. */
  private baseRuleCache: BaseRuleCache = new Map();
  private pendingUpdate = false;
  private rafId: number | null = null;

  constructor(composer: Composer) {
    this.composer = composer;
    this.createStyleElement();
    /* The live sheet carries every element's base styles (see canvasCSS), so
       any document change — an element's own style, an add, a page switch, an
       undo — re-renders it, on the same signals the canvas HTML follows. */
    this.composer.on(EVENTS.COMPOSER_READY, this.onDocumentChanged);
    this.composer.on(EVENTS.PROJECT_LOADED, this.onDocumentChanged);
    this.composer.on(EVENTS.PROJECT_CHANGED, this.onDocumentChanged);
    // …and a device switch changes which breakpoint layers the sheet holds.
    this.composer.on(EVENTS.BREAKPOINT_CHANGED, this.onDocumentChanged);
  }

  private onDocumentChanged = (): void => {
    this.updateStylesheet();
  };

  /**
   * Composite key for rule index lookup
   */
  private ruleKey(selector: string, mediaQuery?: string): string {
    return mediaQuery ? `${selector}|${mediaQuery}` : selector;
  }

  /**
   * Create style element in document
   */
  private createStyleElement(): void {
    if (typeof document !== "undefined") {
      this.styleElement = document.createElement("style");
      this.styleElement.id = "aquibra-styles";
      document.head.appendChild(this.styleElement);
    }
  }

  // ============================================
  // Style Operations
  // ============================================

  /**
   * Add or update a style rule.
   *
   * By default `properties` are MERGED into an existing rule. `replace: true`
   * makes them the rule's whole property set — the only way to take a key out
   * of a rule through this method (P-9: a reset under :hover wrote the rule
   * without the key, the merge kept it, and the reset did nothing).
   */
  setRule(
    selector: string,
    properties: Record<string, string>,
    options?: {
      mediaQuery?: string;
      pseudo?: string;
      replace?: boolean;
    }
  ): StyleData {
    const fullSelector = options?.pseudo ? `${selector}${options.pseudo}` : selector;

    // Check if rule exists
    let style = this.findRule(fullSelector, options?.mediaQuery);

    if (style) {
      // Update existing rule
      style.properties = options?.replace ? { ...properties } : { ...style.properties, ...properties };
    } else {
      // Create new rule
      style = {
        id: generateId("style"),
        selector: fullSelector,
        properties,
        mediaQuery: options?.mediaQuery,
        pseudo: options?.pseudo,
      };
      this.styles.set(style.id, style);
      this.ruleIndex.set(this.ruleKey(fullSelector, options?.mediaQuery), style);
    }

    this.updateStylesheet();
    this.composer.emit(EVENTS.STYLE_CHANGED, style);
    this.composer.markDirty();

    return style;
  }

  /**
   * Get style rule by selector
   */
  getRule(selector: string, mediaQuery?: string): StyleData | undefined {
    return this.findRule(selector, mediaQuery);
  }

  /**
   * Remove a style rule
   */
  removeRule(selector: string, mediaQuery?: string): boolean {
    const style = this.findRule(selector, mediaQuery);
    if (style) {
      this.styles.delete(style.id);
      this.ruleIndex.delete(this.ruleKey(selector, mediaQuery));
      this.updateStylesheet();
      this.composer.emit(EVENTS.STYLE_REMOVED, style);
      this.composer.markDirty();
      return true;
    }
    return false;
  }

  /**
   * Set a single property on a selector
   */
  setProperty(selector: string, property: string, value: string): void {
    const style = this.findRule(selector) || this.setRule(selector, {});
    style.properties[property] = value;
    this.updateStylesheet();
    this.composer.emit(EVENTS.STYLE_CHANGED, style);
    this.composer.markDirty();
  }

  /**
   * Remove a property from a selector
   */
  removeProperty(selector: string, property: string): void {
    const style = this.findRule(selector);
    if (style && style.properties[property]) {
      delete style.properties[property];
      this.updateStylesheet();
      this.composer.emit(EVENTS.STYLE_CHANGED, style);
      this.composer.markDirty();
    }
  }

  /**
   * Get all rules for a selector
   */
  getRulesForSelector(selector: string): StyleData[] {
    return Array.from(this.styles.values()).filter((s) => {
      if (s.selector === selector) return true;
      if (!s.selector.startsWith(selector)) return false;
      // Only count a match when the prefix ends on a selector boundary — a
      // pseudo (`:hover`), compound (`.active`), attribute (`[disabled]`), or
      // combinator/descendant (`> + ~ ,` or whitespace). A plain identifier
      // continuation (`-`, letters, digits, `_`) is a different class, so
      // `.btn` must NOT match `.btn-primary`.
      return /[:.[>+~,\s]/.test(s.selector.charAt(selector.length));
    });
  }

  // ============================================
  // Breakpoint Styles
  // ============================================

  /**
   * Set styles for a specific breakpoint on an element
   * @param elementId - The element ID
   * @param breakpoint - The breakpoint (desktop, tablet, mobile)
   * @param styles - CSS properties to set
   */
  setBreakpointStyle(
    elementId: string,
    breakpoint: BreakpointId,
    styles: Record<string, string>
  ): void {
    if (!isValidBreakpoint(breakpoint)) {
      devWarn("StyleEngine", `Invalid breakpoint: ${breakpoint}`);
      return;
    }

    const element = this.composer.elements.getElement(elementId);
    if (!element) {
      devWarn("StyleEngine", `Element not found: ${elementId}`);
      return;
    }

    const selector = elementSelector(elementId);
    const mediaQuery = getBreakpointQuery(breakpoint);

    // For desktop (base styles), use regular setRule without media query
    if (mediaQuery === null) {
      this.setRule(selector, styles);
    } else {
      this.setRule(selector, styles, { mediaQuery });
    }

    // Also store in element data for serialization
    this.updateElementBreakpointStyles(element, breakpoint, styles);

    this.composer.emit(EVENTS.STYLE_CHANGED, { elementId, breakpoint, styles });
  }

  /**
   * Get all breakpoint styles for an element
   * @param elementId - The element ID
   * @returns Styles organized by breakpoint
   */
  getBreakpointStyles(elementId: string): BreakpointStyles {
    const result: BreakpointStyles = {};
    const selector = elementSelector(elementId);

    for (const breakpoint of BREAKPOINT_ORDER) {
      const mediaQuery = getBreakpointQuery(breakpoint);
      const style = this.findRule(selector, mediaQuery ?? undefined);

      if (style && Object.keys(style.properties).length > 0) {
        result[breakpoint] = { ...style.properties };
      }
    }

    return result;
  }

  /**
   * Get styles for a specific breakpoint
   * @param elementId - The element ID
   * @param breakpoint - The breakpoint to get styles for
   * @returns CSS properties for the breakpoint, or empty object
   */
  getBreakpointStyle(elementId: string, breakpoint: BreakpointId): Record<string, string> {
    if (!isValidBreakpoint(breakpoint)) {
      return {};
    }

    const selector = elementSelector(elementId);
    const mediaQuery = getBreakpointQuery(breakpoint);
    const style = this.findRule(selector, mediaQuery ?? undefined);

    return style ? { ...style.properties } : {};
  }

  /**
   * Remove a style property from a specific breakpoint
   * @param elementId - The element ID
   * @param breakpoint - The breakpoint
   * @param property - The CSS property to remove
   */
  removeBreakpointStyleProperty(
    elementId: string,
    breakpoint: BreakpointId,
    property: string
  ): void {
    if (!isValidBreakpoint(breakpoint)) {
      return;
    }

    const selector = elementSelector(elementId);
    const mediaQuery = getBreakpointQuery(breakpoint);
    const style = this.findRule(selector, mediaQuery ?? undefined);

    if (style && style.properties[property]) {
      delete style.properties[property];
      this.updateStylesheet();
      this.composer.emit(EVENTS.STYLE_CHANGED, style);
      this.composer.markDirty();
    }

    /* P-9: setBreakpointStyle writes the rule AND the element's own
       breakpointStyles (serialisation; ReactExporter reads it). Removal only
       emptied the rule, so a reverted override survived on the element and
       shipped in the React export. */
    const element = this.composer.elements.getElement(elementId);
    const stored = element?.getData().breakpointStyles;
    const current = stored?.[breakpoint];
    if (element && stored && current && property in current) {
      const rest = { ...current };
      delete rest[property];
      const next = { ...stored };
      if (Object.keys(rest).length > 0) next[breakpoint] = rest;
      else delete next[breakpoint];
      element.setBreakpointStyles(next);
    }
  }

  /**
   * Clear all styles for a breakpoint on an element
   * @param elementId - The element ID
   * @param breakpoint - The breakpoint to clear
   */
  clearBreakpointStyles(elementId: string, breakpoint: BreakpointId): void {
    if (!isValidBreakpoint(breakpoint)) {
      return;
    }

    const selector = elementSelector(elementId);
    const mediaQuery = getBreakpointQuery(breakpoint);
    this.removeRule(selector, mediaQuery ?? undefined);

    // Update element data
    const element = this.composer.elements.getElement(elementId);
    if (element) {
      const data = element.getData();
      if (data.breakpointStyles) {
        delete data.breakpointStyles[breakpoint];
      }
    }
  }

  /**
   * Update element's breakpointStyles data for serialization
   */
  private updateElementBreakpointStyles(
    element: Element,
    breakpoint: BreakpointId,
    styles: Record<string, string>
  ): void {
    const data = element.getData();
    const currentBreakpointStyles = data.breakpointStyles || {};

    // Merge new styles with existing breakpoint styles
    currentBreakpointStyles[breakpoint] = {
      ...(currentBreakpointStyles[breakpoint] || {}),
      ...styles,
    };

    // Store back on the TOP-LEVEL ElementData.breakpointStyles field — the one
    // ReactExporter and serialization read. setData() writes into the
    // custom-data bag (data.data), which those consumers never look at.
    element.setBreakpointStyles(currentBreakpointStyles);
  }

  /**
   * Generate CSS with proper media query ordering for export
   * Desktop-first: base styles, then tablet, then mobile
   */
  generateResponsiveCSS(
    options?: ExportOptions & {
      target?: CascadeTarget;
      /** Which rules to write, by selector — all when omitted. The publish
       *  export passes one to leave out rules for elements that are not on
       *  the page (or not on the site at all). */
      keep?: (selector: string) => boolean;
    },
  ): string {
    const opts = {
      minify: false,
      ...options,
    };
    const target: CascadeTarget = opts.target ?? "media";

    const baseRules: string[] = [];
    const tabletRules: string[] = [];
    const mobileRules: string[] = [];
    const otherMediaRules: Map<string, string[]> = new Map();

    const tabletQuery = getBreakpointQuery("tablet");
    const mobileQuery = getBreakpointQuery("mobile");

    /* The class model writes each bucket in layer order (tag → class →
       element-local, stable) and weights element-local selectors (the
       ladder). The element model keeps insertion order, byte for byte. */
    const classModel = this.composer.styleModel === "class";
    const rules = this.writableRules();
    if (classModel) rules.sort((a, b) => layerRank(a.selector) - layerRank(b.selector));

    rules.forEach((style) => {
      if (opts.keep && !opts.keep(style.selector)) return;
      const css = this.generateStyleRule(style, undefined, classModel);

      if (!style.mediaQuery) {
        // Base/desktop styles
        baseRules.push(css);
      } else if (style.mediaQuery === tabletQuery) {
        tabletRules.push(css);
      } else if (style.mediaQuery === mobileQuery) {
        mobileRules.push(css);
      } else {
        // Other custom media queries
        if (!otherMediaRules.has(style.mediaQuery)) {
          otherMediaRules.set(style.mediaQuery, []);
        }
        otherMediaRules.get(style.mediaQuery)!.push(css);
      }
    });

    const output: string[] = [];

    // Base styles first
    if (baseRules.length > 0) {
      output.push(baseRules.join("\n\n"));
    }

    /* Tablet then mobile — the larger breakpoint first, so the narrower one
       wins by order. On the canvas (target = a breakpoint) the layers that
       apply there are written without their query; the rest are left out. */
    const layer = (bp: "tablet" | "mobile", query: string | null, rules: string[]): void => {
      if (rules.length === 0 || !query) return;
      if (target === "media") output.push(`@media ${query} {\n${rules.join("\n")}\n}`);
      else if (BREAKPOINT_ORDER.indexOf(target) >= BREAKPOINT_ORDER.indexOf(bp)) output.push(rules.join("\n"));
    };
    layer("tablet", tabletQuery, tabletRules);
    layer("mobile", mobileQuery, mobileRules);

    // Other media queries — custom ranges a canvas cannot evaluate keep their
    // viewport query everywhere.
    otherMediaRules.forEach((rules, query) => {
      output.push(`@media ${query} {\n${rules.join("\n")}\n}`);
    });

    let css = output.join("\n\n");

    if (opts.minify) {
      css = this.minifyCSS(css);
    }

    return css;
  }

  // ============================================
  // Export & Import
  // ============================================

  /**
   * Export all styles
   */
  exportStyles(): StyleData[] {
    return Array.from(this.styles.values());
  }

  /**
   * Import styles. Drops malformed entries (missing id / non-string
   * selector / missing properties) instead of letting them poison the
   * engine state. Legacy project payloads have shipped with rules
   * carrying selector=undefined; without this filter they reach
   * downstream consumers (useTokenUsageMap, generateCSS) and crash
   * the panel via the error boundary above DesignSystemTab.
   *
   * A rule whose selector or media query is outside the shared grammar is
   * dropped too: both are written raw into the preview document, the
   * single-file export's <style> and the published stylesheet, so a stored
   * selector `a{}</style><script>…` ran script (S-1).
   */
  importStyles(styles: StyleData[]): void {
    let dropped = 0;
    for (const style of styles) {
      const valid =
        style != null &&
        typeof style.id === "string" && style.id.length > 0 &&
        isSafeStyleRuleTarget(style.selector, style.mediaQuery) &&
        style.properties != null && typeof style.properties === "object";
      if (!valid) {
        dropped += 1;
        continue;
      }
      this.styles.set(style.id, style);
      this.ruleIndex.set(
        this.ruleKey(style.selector, style.mediaQuery ?? undefined),
        style
      );
    }
    if (dropped > 0) {
      console.warn(
        `[StyleEngine.importStyles] dropped ${dropped} malformed rule(s) — selector/id/properties missing or invalid`,
      );
    }
    this.updateStylesheet();
  }

  /**
   * Convert to CSS string
   */
  toCSS(options?: ExportOptions): string {
    return this.generateCSS(options);
  }

  /**
   * Generate CSS with advanced options
   */
  generateCSS(
    options?: ExportOptions & {
      optimize?: boolean;
      scope?: string;
    }
  ): string {
    const opts = {
      minify: false,
      optimize: false,
      scope: undefined,
      ...options,
    };

    const rules: string[] = [];
    const mediaRules: Map<string, string[]> = new Map();

    this.writableRules().forEach((style) => {
      const css = this.generateStyleRule(style, opts.scope);

      if (style.mediaQuery) {
        if (!mediaRules.has(style.mediaQuery)) {
          mediaRules.set(style.mediaQuery, []);
        }
        mediaRules.get(style.mediaQuery)!.push(css);
      } else {
        rules.push(css);
      }
    });

    // Add media queries
    mediaRules.forEach((cssRules, query) => {
      rules.push(`@media ${query} {\n${cssRules.join("\n")}\n}`);
    });

    let output = rules.join("\n\n");

    if (opts.optimize) {
      output = this.optimizeCSS(output);
    }

    if (opts.minify) {
      output = this.minifyCSS(output);
    }

    return output;
  }

  /**
   * The rules a stylesheet may be written from. `importStyles` already keeps
   * out a selector or media query that could leave the stylesheet; this is the
   * writers' own check, for a rule set live (setRule takes any string) or by a
   * path that skips the load boundary (S-1).
   */
  private writableRules(): StyleData[] {
    return [...this.styles.values()].filter((style) =>
      isSafeStyleRuleTarget(style.selector, style.mediaQuery)
    );
  }

  /**
   * Generate a single style rule
   */
  private generateStyleRule(style: StyleData, scope?: string, ladder = false): string {
    const layer = ladder ? selectorLayer(style.selector) : undefined;
    const own = layer?.kind === "local" ? localSelector(layer.identity, "class", layer.pseudo) : style.selector;
    const selector = scope ? `${scope} ${own}` : own;
    // Exported into a published <style>: a declaration that could leave the
    // rule or the element is not written (A19-1 class).
    const props = Object.entries(style.properties ?? {})
      .filter(([key, value]) => isSafeCssDeclaration(key, value))
      .map(([key, value]) => `  ${camelToKebab(key)}: ${value};`)
      .join("\n");

    return `${selector} {\n${props}\n}`;
  }

  /**
   * Optimize CSS (remove duplicate rules).
   *
   * Dedupes on whole rules (selector + brace block), not raw lines. A
   * line-based pass would eat declaration lines and closing braces shared
   * across different rules (`display: flex;`, `margin: 0;`, `}`), corrupting
   * any multi-rule stylesheet. Brace-depth tracking keeps @media blocks intact
   * as a single unit.
   */
  optimizeCSS(css: string): string {
    const seen = new Set<string>();
    const rules: string[] = [];
    let depth = 0;
    let start = 0;

    for (let i = 0; i < css.length; i++) {
      const ch = css[i];
      if (ch === "{") {
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0) {
          const rule = css.slice(start, i + 1).trim();
          if (rule && !seen.has(rule)) {
            seen.add(rule);
            rules.push(rule);
          }
          start = i + 1;
        }
      }
    }

    return rules.join("\n");
  }

  /**
   * Convert single style to CSS
   */
  // Reserved for future per-style CSS generation
  // private styleToCSS(style: StyleData): string {
  //   const props = Object.entries(style.properties)
  //     .map(([key, value]) => `  ${camelToKebab(key)}: ${value};`)
  //     .join("\n");
  //   return `${style.selector} {\n${props}\n}`;
  // }

  /**
   * Minify CSS
   */
  minifyCSS(css: string): string {
    return css
      .replace(/\s+/g, " ")
      .replace(/\s*{\s*/g, "{")
      .replace(/\s*}\s*/g, "}")
      .replace(/\s*;\s*/g, ";")
      .replace(/\s*:\s*/g, ":")
      .replace(/;\s*}/g, "}")
      .trim();
  }

  /**
   * Generate scoped CSS
   */
  generateScopedCSS(scope: string): string {
    return this.generateCSS({ scope });
  }

  // ============================================
  // Internal Methods
  // ============================================

  /**
   * Find rule by selector and media query
   */
  private findRule(selector: string, mediaQuery?: string): StyleData | undefined {
    return this.ruleIndex.get(this.ruleKey(selector, mediaQuery));
  }

  /**
   * Update the stylesheet element
   * Batched: multiple calls coalesce into a single RAF-aligned flush
   */
  private updateStylesheet(): void {
    this.pendingUpdate = true;
    if (this.rafId === null) {
      if (typeof requestAnimationFrame !== "undefined") {
        this.rafId = requestAnimationFrame(() => {
          this.rafId = null;
          this.flush();
        });
      } else {
        this.flush();
      }
    }
  }

  /**
   * Synchronously flush any pending stylesheet update
   */
  flush(): void {
    if (!this.pendingUpdate || !this.styleElement) return;
    this.styleElement.textContent = this.canvasCSS();
    this.pendingUpdate = false;
  }

  /**
   * The canvas stylesheet: the published cascade at the breakpoint being
   * previewed (plan D10, D35).
   *
   * It used to render an element's BASE styles inline on the canvas, which
   * beat every stylesheet rule — so breakpoint and :hover rules were
   * re-emitted `!important`. That made the canvas a different cascade from
   * the published page: a mobile base value beat the desktop :hover on the
   * canvas and lost to it live. Now the base is a rule like on the published
   * page (`[data-buildrick-id]` here, `.buildrick-<id>` there, same
   * specificity) and the previewed breakpoint's layers follow it unwrapped.
   */
  private canvasCSS(): string {
    const root = this.composer.elements?.getActivePageRootData?.();
    const device = this.composer.viewport?.getDevice();
    const breakpoint: CascadeTarget = device && isValidBreakpoint(device) ? device : "desktop";
    const base = elementBaseCSS([root], elementSelector, breakpoint, false, this.baseRuleCache, this.composer.styleModel);
    return [base, this.generateResponsiveCSS({ target: breakpoint })].filter(Boolean).join("\n\n");
  }

  // ============================================
  // Style Inheritance & Computation
  // ============================================

  /**
   * Inherit styles from another element
   */
  inheritStyles(from: Element, to: Element, properties?: string[]): void {
    const fromStyles = this.getStyles(from.getId());
    const toStyles = this.getStyles(to.getId());

    if (!toStyles || !fromStyles) return;

    const propsToInherit = properties || Object.keys(fromStyles.properties);

    // Batched: setProperty calls are coalesced into a single RAF flush
    propsToInherit.forEach((prop) => {
      if (fromStyles.properties[prop]) {
        this.setProperty(elementSelector(to.getId()), prop, fromStyles.properties[prop]);
      }
    });

    this.composer.emit(EVENTS.STYLE_INHERITED, {
      from,
      to,
      properties: propsToInherit,
    });
  }

  /**
   * Compute all styles affecting an element
   */
  computeStyles(element: Element): Record<string, string> {
    const computed: Record<string, string> = {};

    // Get element-specific styles
    const elementStyles = this.getStyles(element.getId());
    if (elementStyles) {
      Object.assign(computed, elementStyles.properties);
    }

    // Get class-based styles
    const classes = element.getClasses();
    classes.forEach((className) => {
      const classStyles = this.getRulesForSelector(`.${className}`);
      classStyles.forEach((style) => {
        Object.assign(computed, style.properties);
      });
    });

    // Get global styles (if integrated)
    // This will be enhanced when GlobalStyleManager is integrated

    return computed;
  }

  /**
   * Get effective styles for an element
   */
  getEffectiveStyles(element: Element): Record<string, string> {
    return this.computeStyles(element);
  }

  /**
   * Get styles for an element ID
   */
  getStyles(elementId: string): StyleData | undefined {
    return this.findRule(elementSelector(elementId));
  }

  /**
   * Get class-based styles
   */
  getClassStyles(classes: string[]): Record<string, string> {
    const styles: Record<string, string> = {};

    classes.forEach((className) => {
      const classRules = this.getRulesForSelector(`.${className}`);
      classRules.forEach((rule) => {
        Object.assign(styles, rule.properties);
      });
    });

    return styles;
  }

  /**
   * Clear all styles
   */
  clear(): void {
    this.styles.clear();
    this.ruleIndex.clear();
    this.updateStylesheet();
  }

  /**
   * Destroy the style engine
   */
  destroy(): void {
    this.composer.off(EVENTS.COMPOSER_READY, this.onDocumentChanged);
    this.composer.off(EVENTS.PROJECT_LOADED, this.onDocumentChanged);
    this.composer.off(EVENTS.PROJECT_CHANGED, this.onDocumentChanged);
    this.composer.off(EVENTS.BREAKPOINT_CHANGED, this.onDocumentChanged);
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingUpdate = false;
    this.baseRuleCache.clear();
    this.styles.clear();
    this.ruleIndex.clear();
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = null;
  }
}
