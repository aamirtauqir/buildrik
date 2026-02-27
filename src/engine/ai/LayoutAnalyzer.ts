/**
 * Layout Analyzer
 * Analyzes canvas elements for layout issues and suggestions
 * @license BSD-3-Clause
 */

import type { Composer } from "../Composer";

// ============================================================================
// TYPES
// ============================================================================

export type SuggestionType = "spacing" | "alignment" | "contrast" | "accessibility";
export type SuggestionSeverity = "info" | "warning" | "error";

export interface LayoutSuggestion {
  id: string;
  type: SuggestionType;
  severity: SuggestionSeverity;
  title: string;
  description: string;
  elementIds: string[];
  fix?: () => void;
}

export interface LayoutAnalysisResult {
  suggestions: LayoutSuggestion[];
  score: number; // 0-100
  summary: {
    spacing: number;
    alignment: number;
    contrast: number;
    accessibility: number;
  };
}

interface ElementBounds {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

// ============================================================================
// LAYOUT ANALYZER
// ============================================================================

export class LayoutAnalyzer {
  private composer: Composer;

  constructor(composer: Composer) {
    this.composer = composer;
  }

  /**
   * Analyze the current layout and return suggestions
   */
  analyze(): LayoutAnalysisResult {
    const suggestions: LayoutSuggestion[] = [];
    const bounds = this.getAllElementBounds();

    // Run all analyzers
    suggestions.push(...this.analyzeSpacing(bounds));
    suggestions.push(...this.analyzeAlignment(bounds));
    suggestions.push(...this.analyzeContrast());
    suggestions.push(...this.analyzeAccessibility());

    // Calculate scores
    const spacingScore = this.calculateCategoryScore(suggestions, "spacing");
    const alignmentScore = this.calculateCategoryScore(suggestions, "alignment");
    const contrastScore = this.calculateCategoryScore(suggestions, "contrast");
    const accessibilityScore = this.calculateCategoryScore(suggestions, "accessibility");

    const overallScore = Math.round(
      (spacingScore + alignmentScore + contrastScore + accessibilityScore) / 4
    );

    return {
      suggestions,
      score: overallScore,
      summary: {
        spacing: spacingScore,
        alignment: alignmentScore,
        contrast: contrastScore,
        accessibility: accessibilityScore,
      },
    };
  }

  /**
   * Get bounds for all elements by traversing from root
   */
  private getAllElementBounds(): ElementBounds[] {
    const bounds: ElementBounds[] = [];
    const page = this.composer.elements.getActivePage?.();
    if (!page) return bounds;

    const rootElement = this.composer.elements.getElement(page.root.id);
    if (!rootElement) return bounds;

    // Traverse element tree
    const traverse = (element: typeof rootElement) => {
      const id = element.getId?.() || "";
      const styles = element.getStyles?.() || {};

      const left = parseFloat(styles.left || "0") || 0;
      const top = parseFloat(styles.top || "0") || 0;
      const width = parseFloat(styles.width || "100") || 100;
      const height = parseFloat(styles.height || "50") || 50;

      bounds.push({
        id,
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
      });

      // Traverse children
      const children = element.getChildren?.() || [];
      for (const child of children) {
        traverse(child);
      }
    };

    traverse(rootElement);
    return bounds;
  }

  /**
   * Analyze spacing between elements
   */
  private analyzeSpacing(bounds: ElementBounds[]): LayoutSuggestion[] {
    const suggestions: LayoutSuggestion[] = [];
    const spacings: number[] = [];

    // Calculate all vertical spacings
    for (let i = 0; i < bounds.length; i++) {
      for (let j = i + 1; j < bounds.length; j++) {
        const a = bounds[i];
        const b = bounds[j];

        // Check vertical spacing
        if (a.bottom < b.top) {
          spacings.push(b.top - a.bottom);
        } else if (b.bottom < a.top) {
          spacings.push(a.top - b.bottom);
        }
      }
    }

    // Check for inconsistent spacing
    if (spacings.length >= 3) {
      const uniqueSpacings = [...new Set(spacings.map((s) => Math.round(s / 4) * 4))];
      if (uniqueSpacings.length > 3) {
        suggestions.push({
          id: `spacing-inconsistent-${Date.now()}`,
          type: "spacing",
          severity: "warning",
          title: "Inconsistent spacing detected",
          description: `Found ${uniqueSpacings.length} different spacing values. Consider using a consistent spacing scale (8, 16, 24, 32px).`,
          elementIds: [],
        });
      }
    }

    return suggestions;
  }

  /**
   * Analyze element alignment
   */
  private analyzeAlignment(bounds: ElementBounds[]): LayoutSuggestion[] {
    const suggestions: LayoutSuggestion[] = [];

    // Group elements by approximate left position
    const leftGroups = new Map<number, ElementBounds[]>();
    for (const b of bounds) {
      const key = Math.round(b.left / 8) * 8;
      if (!leftGroups.has(key)) leftGroups.set(key, []);
      const group = leftGroups.get(key);
      if (group) group.push(b);
    }

    // Check for near-misses in alignment
    const keys = [...leftGroups.keys()].sort((a, b) => a - b);
    for (let i = 0; i < keys.length - 1; i++) {
      const diff = keys[i + 1] - keys[i];
      if (diff > 0 && diff < 8) {
        const group1 = leftGroups.get(keys[i]) ?? [];
        const group2 = leftGroups.get(keys[i + 1]) ?? [];
        const elements = [...group1, ...group2];
        suggestions.push({
          id: `alignment-near-miss-${Date.now()}-${i}`,
          type: "alignment",
          severity: "info",
          title: "Elements nearly aligned",
          description: `${elements.length} elements are ${diff}px apart from being aligned. Consider snapping to grid.`,
          elementIds: elements.map((e) => e.id),
        });
      }
    }

    return suggestions;
  }

  /**
   * Analyze color contrast
   */
  private analyzeContrast(): LayoutSuggestion[] {
    const suggestions: LayoutSuggestion[] = [];
    const page = this.composer.elements.getActivePage?.();
    if (!page) return suggestions;

    const rootElement = this.composer.elements.getElement(page.root.id);
    if (!rootElement) return suggestions;

    const traverse = (el: typeof rootElement) => {
      const type = el.getType?.() || "";
      if (type === "text" || type === "heading" || type === "paragraph") {
        const styles = el.getStyles?.() || {};
        const color = styles.color || "#000000";
        const background = styles.backgroundColor || "#ffffff";

        const ratio = this.calculateContrastRatio(color, background);

        if (ratio < 4.5) {
          suggestions.push({
            id: `contrast-low-${el.getId?.()}`,
            type: "contrast",
            severity: ratio < 3 ? "error" : "warning",
            title: "Low text contrast",
            description: `Contrast ratio is ${ratio.toFixed(1)}:1. WCAG AA requires 4.5:1 for normal text.`,
            elementIds: [el.getId?.() || ""],
          });
        }
      }

      const children = el.getChildren?.() || [];
      for (const child of children) {
        traverse(child);
      }
    };

    traverse(rootElement);
    return suggestions;
  }

  /**
   * Analyze accessibility issues
   */
  private analyzeAccessibility(): LayoutSuggestion[] {
    const suggestions: LayoutSuggestion[] = [];
    const page = this.composer.elements.getActivePage?.();
    if (!page) return suggestions;

    const rootElement = this.composer.elements.getElement(page.root.id);
    if (!rootElement) return suggestions;

    const traverse = (el: typeof rootElement) => {
      const type = el.getType?.() || "";
      const attrs = el.getAttributes?.() || {};

      // Check for missing alt text on images
      if (type === "image" && !attrs.alt) {
        suggestions.push({
          id: `a11y-missing-alt-${el.getId?.()}`,
          type: "accessibility",
          severity: "warning",
          title: "Missing alt text",
          description: "Images should have alt text for screen readers.",
          elementIds: [el.getId?.() || ""],
        });
      }

      // Check for missing link text
      if (type === "link" || type === "button") {
        const content = el.getContent?.() || "";
        if (!content.trim()) {
          suggestions.push({
            id: `a11y-empty-link-${el.getId?.()}`,
            type: "accessibility",
            severity: "error",
            title: "Empty interactive element",
            description: "Links and buttons must have visible text or aria-label.",
            elementIds: [el.getId?.() || ""],
          });
        }
      }

      const children = el.getChildren?.() || [];
      for (const child of children) {
        traverse(child);
      }
    };

    traverse(rootElement);
    return suggestions;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  private calculateContrastRatio(fg: string, bg: string): number {
    const fgLum = this.getLuminance(fg);
    const bgLum = this.getLuminance(bg);

    const lighter = Math.max(fgLum, bgLum);
    const darker = Math.min(fgLum, bgLum);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calculate relative luminance
   */
  private getLuminance(color: string): number {
    const hex = color.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const sRGB = [r, g, b].map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  /**
   * Calculate score for a category (100 - penalties)
   */
  private calculateCategoryScore(suggestions: LayoutSuggestion[], type: SuggestionType): number {
    const categorySuggestions = suggestions.filter((s) => s.type === type);
    let penalty = 0;

    for (const s of categorySuggestions) {
      if (s.severity === "error") penalty += 20;
      else if (s.severity === "warning") penalty += 10;
      else penalty += 5;
    }

    return Math.max(0, 100 - penalty);
  }
}

export default LayoutAnalyzer;
