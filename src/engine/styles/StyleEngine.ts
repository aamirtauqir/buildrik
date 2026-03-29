/**
 * Aquibra Style Engine
 * Manages all CSS styles in the composer
 *
 * @module engine/styles/StyleEngine
 * @license BSD-3-Clause
 */

import { injectAnimationCSS } from "../../editor/animation/AnimationPresets";
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
  private styleElement: HTMLStyleElement | null = null;

  constructor(composer: Composer) {
    this.composer = composer;
    this.createStyleElement();
    // Inject animation keyframes CSS (AQUI-026)
    injectAnimationCSS();
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
    }

    this.updateStylesheet();
    this.composer.emit("style:changed", style);
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
      this.updateStylesheet();
      this.composer.emit("style:removed", style);
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
    this.composer.emit("style:changed", style);
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
      this.composer.emit("style:changed", style);
      this.composer.markDirty();
    }
  }

  /**
   * Get all rules for a selector
   */
  getRulesForSelector(selector: string): StyleData[] {
    return Array.from(this.styles.values()).filter(
      (s) => s.selector === selector || s.selector.startsWith(selector)
    );
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

    const selector = `[data-aqb-id="${elementId}"]`;
    const mediaQuery = getBreakpointQuery(breakpoint);

    // For desktop (base styles), use regular setRule without media query
    if (mediaQuery === null) {
      this.setRule(selector, styles);
    } else {
      this.setRule(selector, styles, { mediaQuery });
    }

    // Also store in element data for serialization
    this.updateElementBreakpointStyles(element, breakpoint, styles);

    this.composer.emit("style:changed", { elementId, breakpoint, styles });
  }

  /**
   * Get all breakpoint styles for an element
   * @param elementId - The element ID
   * @returns Styles organized by breakpoint
   */
  getBreakpointStyles(elementId: string): BreakpointStyles {
    const result: BreakpointStyles = {};
    const selector = `[data-aqb-id="${elementId}"]`;

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

    const selector = `[data-aqb-id="${elementId}"]`;
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

    const selector = `[data-aqb-id="${elementId}"]`;
    const mediaQuery = getBreakpointQuery(breakpoint);
    const style = this.findRule(selector, mediaQuery ?? undefined);

    if (style && style.properties[property]) {
      delete style.properties[property];
      this.updateStylesheet();
      this.composer.emit("style:changed", style);
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

    const selector = `[data-aqb-id="${elementId}"]`;
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

    // Store back on element via setData
    element.setData("breakpointStyles", currentBreakpointStyles);
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
   * Import styles
   */
  importStyles(styles: StyleData[]): void {
    styles.forEach((style) => {
      this.styles.set(style.id, style);
    });
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
  private generateStyleRule(style: StyleData, scope?: string): string {
    const selector = scope ? `${scope} ${style.selector}` : style.selector;
    const props = Object.entries(style.properties)
      .map(([key, value]) => `  ${camelToKebab(key)}: ${value};`)
      .join("\n");

    return `${selector} {\n${props}\n}`;
  }

  /**
   * Optimize CSS (remove duplicates, merge similar rules)
   */
  optimizeCSS(css: string): string {
    // Remove duplicate rules
    const lines = css.split("\n");
    const seen = new Set<string>();
    const optimized: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        optimized.push(line);
      }
    }

    return optimized.join("\n");
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
    return Array.from(this.styles.values()).find(
      (s) => s.selector === selector && s.mediaQuery === mediaQuery
    );
  }

  /**
   * Update the stylesheet element
   */
  private updateStylesheet(): void {
    if (this.styleElement) {
      this.styleElement.textContent = this.toCSS();
    }
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

    propsToInherit.forEach((prop) => {
      if (fromStyles.properties[prop]) {
        this.setProperty(`[data-aqb-id="${to.getId()}"]`, prop, fromStyles.properties[prop]);
      }
    });

    this.composer.emit("style:inherited", {
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
    return this.findRule(`[data-aqb-id="${elementId}"]`);
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
    this.updateStylesheet();
  }

  /**
   * Destroy the style engine
   */
  destroy(): void {
    this.clear();
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = null;
  }
}
