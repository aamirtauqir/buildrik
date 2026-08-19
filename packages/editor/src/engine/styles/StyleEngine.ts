/**
 * Aquibra Style Engine
 * Manages all CSS styles in the composer
 *
 * @module engine/styles/StyleEngine
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../shared/constants/events";
import {
  BREAKPOINT_ORDER,
  getBreakpointQuery,
  isValidBreakpoint,
} from "../../shared/constants/breakpoints";
import type { StyleData, ExportOptions, BreakpointStyles } from "../../shared/types";
import type { BreakpointId } from "../../shared/types/breakpoints";
import { devWarn } from "../../shared/utils/devLogger";
import { generateId, camelToKebab } from "../../shared/utils/helpers";
import type { Composer } from "../Composer";
import type { Element } from "../elements/Element";

/**
 * Manages CSS styles and selectors
 */
export class StyleEngine {
  private composer: Composer;
  private styles: Map<string, StyleData> = new Map();
  private ruleIndex: Map<string, StyleData> = new Map();
  private styleElement: HTMLStyleElement | null = null;
  private pendingUpdate = false;
  private rafId: number | null = null;

  constructor(composer: Composer) {
    this.composer = composer;
    this.createStyleElement();
    // The live stylesheet's device-preview block (see flush) depends on the
    // active device, so a device switch must re-render the sheet.
    this.composer.on(EVENTS.BREAKPOINT_CHANGED, this.onBreakpointChanged);
  }

  private onBreakpointChanged = (): void => {
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
   * Add or update a style rule
   */
  setRule(
    selector: string,
    properties: Record<string, string>,
    options?: {
      mediaQuery?: string;
      pseudo?: string;
    }
  ): StyleData {
    const fullSelector = options?.pseudo ? `${selector}${options.pseudo}` : selector;

    // Check if rule exists
    let style = this.findRule(fullSelector, options?.mediaQuery);

    if (style) {
      // Update existing rule
      style.properties = { ...style.properties, ...properties };
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
  // Media Queries
  // ============================================

  /**
   * Set rule for specific device
   */
  setDeviceRule(
    selector: string,
    properties: Record<string, string>,
    device: "tablet" | "mobile"
  ): StyleData {
    const mediaQuery = this.getDeviceMediaQuery(device);
    return this.setRule(selector, properties, { mediaQuery });
  }

  /**
   * Get media query for device
   */
  private getDeviceMediaQuery(device: "tablet" | "mobile"): string {
    const queries = {
      tablet: "(max-width: 991px)",
      mobile: "(max-width: 575px)",
    };
    return queries[device];
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

    const selector = `[data-buildrick-id="${elementId}"]`;
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
    const selector = `[data-buildrick-id="${elementId}"]`;

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

    const selector = `[data-buildrick-id="${elementId}"]`;
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

    const selector = `[data-buildrick-id="${elementId}"]`;
    const mediaQuery = getBreakpointQuery(breakpoint);
    const style = this.findRule(selector, mediaQuery ?? undefined);

    if (style && style.properties[property]) {
      delete style.properties[property];
      this.updateStylesheet();
      this.composer.emit(EVENTS.STYLE_CHANGED, style);
      this.composer.markDirty();
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

    const selector = `[data-buildrick-id="${elementId}"]`;
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
  generateResponsiveCSS(options?: ExportOptions): string {
    const opts = {
      minify: false,
      ...options,
    };

    const baseRules: string[] = [];
    const tabletRules: string[] = [];
    const mobileRules: string[] = [];
    const otherMediaRules: Map<string, string[]> = new Map();

    const tabletQuery = getBreakpointQuery("tablet");
    const mobileQuery = getBreakpointQuery("mobile");

    this.styles.forEach((style) => {
      const css = this.generateStyleRule(style);

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

    // Tablet styles (larger breakpoint first)
    if (tabletRules.length > 0) {
      output.push(`@media ${tabletQuery} {\n${tabletRules.join("\n")}\n}`);
    }

    // Mobile styles (smaller breakpoint last)
    if (mobileRules.length > 0) {
      output.push(`@media ${mobileQuery} {\n${mobileRules.join("\n")}\n}`);
    }

    // Other media queries
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
   */
  importStyles(styles: StyleData[]): void {
    let dropped = 0;
    for (const style of styles) {
      const valid =
        style != null &&
        typeof style.id === "string" && style.id.length > 0 &&
        typeof style.selector === "string" && style.selector.length > 0 &&
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

    this.styles.forEach((style) => {
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
   * Generate a single style rule
   */
  private generateStyleRule(style: StyleData, scope?: string, important = false): string {
    const selector = scope ? `${scope} ${style.selector}` : style.selector;
    const bang = important ? " !important" : "";
    const props = Object.entries(style.properties ?? {})
      .map(([key, value]) => `  ${camelToKebab(key)}: ${value}${bang};`)
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
    this.styleElement.textContent = this.toCSS() + this.editorDevicePreviewCSS();
    this.pendingUpdate = false;
  }

  /**
   * The editor's device preview is a NARROWED CANVAS in a full-width page, so
   * `@media (max-width: …)` rules never match inside the editor no matter
   * which device is active — a tablet font-size override was stored,
   * exported, and invisible on the canvas that claimed to be showing Tablet.
   * When a narrow device is active, re-emit that breakpoint's rules without
   * their media query, appended AFTER the base rules so they win by source
   * order — the same desktop-first cascade the exported CSS gets from real
   * media queries (mobile preview applies tablet rules first, then mobile).
   * Editor-only: exports go through toCSS/generateCSS, which never append
   * this block.
   */
  private editorDevicePreviewCSS(): string {
    const device = this.composer.viewport?.getDevice();
    if (device !== "tablet" && device !== "mobile") return "";

    const cascade: BreakpointId[] = device === "tablet" ? ["tablet"] : ["tablet", "mobile"];
    const out: string[] = [];
    for (const bp of cascade) {
      const query = getBreakpointQuery(bp);
      if (!query) continue;
      this.styles.forEach((style) => {
        // !important, because the canvas renders an element's BASE styles
        // inline and inline beats any stylesheet. The publish path solved the
        // same collision by emitting base styles as class rules instead
        // ("Inline base styles … shadowed breakpoint overrides"); the canvas
        // still inlines them, so this block — which exists to make the
        // override visible — lost to them. Measured: a heading set to 22px on
        // Mobile, this rule present in the sheet, and the canvas drawing 48px.
        if (style.mediaQuery === query) out.push(this.generateStyleRule(style, undefined, true));
      });
    }
    if (out.length === 0) return "";
    return `\n\n/* editor device preview (${device}) — breakpoint rules re-emitted without media queries */\n${out.join("\n")}`;
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
        this.setProperty(`[data-buildrick-id="${to.getId()}"]`, prop, fromStyles.properties[prop]);
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
    return this.findRule(`[data-buildrick-id="${elementId}"]`);
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
    this.composer.off(EVENTS.BREAKPOINT_CHANGED, this.onBreakpointChanged);
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingUpdate = false;
    this.styles.clear();
    this.ruleIndex.clear();
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = null;
  }
}
