/**
 * React Exporter
 * Convert element tree to React components with CSS modules
 * @license BSD-3-Clause
 */

import JSZip from "jszip";
import type { ElementData, PageData } from "../../shared/types";
import type { Composer } from "../Composer";
import type { ExportResult, ExportedFile } from "../../shared/types/export";
import { getTagForType, camelToKebab, escapeHTML } from "./ExportHelpers";

// ============================================================================
// TYPES
// ============================================================================

interface ReactExportFile {
  path: string;
  content: string;
}

interface CSSClassEntry {
  base: Record<string, string>;
  tablet?: Record<string, string>;
  mobile?: Record<string, string>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** data-buildrick-* attributes are editor internals and must be stripped */
const EDITOR_ATTR_PREFIX = "data-buildrick-";

/** HTML attributes that map to different JSX names */
const JSX_ATTR_MAP: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  maxlength: "maxLength",
  colspan: "colSpan",
  rowspan: "rowSpan",
  enctype: "encType",
  accesskey: "accessKey",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  novalidate: "noValidate",
};

/** Self-closing HTML tags */
const SELF_CLOSING_TAGS = new Set(["img", "input", "br", "hr"]);

// ============================================================================
// REACT EXPORTER CLASS
// ============================================================================

export class ReactExporter {
  private composer: Composer;

  constructor(composer: Composer) {
    this.composer = composer;
  }

  /**
   * Export all pages as React components bundled in a zip
   */
  async exportZip(): Promise<Blob> {
    const result = this.export();
    if (!result.success || !result.files) {
      throw new Error(result.error ?? "Export failed");
    }
    const zip = new JSZip();

    for (const file of result.files) {
      zip.file(file.name, file.content);
    }

    return zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
  }

  /**
   * Generate React component files from all pages
   */
  export(): ExportResult {
    try {
      const pages = this.composer.elements.getAllPages?.() ?? [];
      if (pages.length === 0) {
        return { success: false, error: "No pages to export" };
      }

      const files: ReactExportFile[] = [];
      const componentNames: string[] = [];

      for (const page of pages) {
        const name = this.pageToComponentName(page);
        componentNames.push(name);

        const { jsx, cssClasses } = this.pageToJSX(page);
        const cssContent = this.generateCSSModule(cssClasses);

        files.push({
          path: `components/${name}.tsx`,
          content: this.wrapComponent(name, jsx, cssClasses.size > 0),
        });

        if (cssClasses.size > 0) {
          files.push({
            path: `components/${name}.module.css`,
            content: cssContent,
          });
        }
      }

      files.push({
        path: "index.tsx",
        content: this.generateIndex(componentNames),
      });

      files.push({
        path: "package.json",
        content: this.generatePackageJson(),
      });

      return {
        success: true,
        files: files.map((f) => ({
          name: f.path,
          content: f.content,
          mimeType: this.inferMimeType(f.path),
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
      };
    }
  }

  // ============================================================================
  // PAGE TO JSX CONVERSION
  // ============================================================================

  /**
   * Convert a page's element tree to JSX string + collected CSS classes
   */
  private pageToJSX(page: PageData): { jsx: string; cssClasses: Map<string, CSSClassEntry> } {
    const cssClasses = new Map<string, CSSClassEntry>();

    if (!page.root) {
      return { jsx: "      <div />\n", cssClasses };
    }

    const jsx = this.elementToJSX(page.root, cssClasses, 3);
    return { jsx, cssClasses };
  }

  /**
   * Recursively convert an ElementData to JSX
   */
  private elementToJSX(
    element: ElementData,
    cssClasses: Map<string, CSSClassEntry>,
    indent: number
  ): string {
    const tag = getTagForType(element.type);
    const indentStr = "  ".repeat(indent);
    const children = element.children ?? [];
    const content = element.content ?? "";
    const styles = element.styles ?? {};
    const attrs = element.attributes ?? {};
    const breakpointStyles = element.breakpointStyles;

    // Extract styles to CSS module class
    let className: string | undefined;
    if (Object.keys(styles).length > 0 || breakpointStyles?.tablet || breakpointStyles?.mobile) {
      className = this.generateClassName(element);
      const entry: CSSClassEntry = { base: styles };
      if (breakpointStyles?.tablet && Object.keys(breakpointStyles.tablet).length > 0) {
        entry.tablet = breakpointStyles.tablet;
      }
      if (breakpointStyles?.mobile && Object.keys(breakpointStyles.mobile).length > 0) {
        entry.mobile = breakpointStyles.mobile;
      }
      cssClasses.set(className, entry);
    }

    // Build JSX attributes
    const attrParts: string[] = [];

    if (className) {
      attrParts.push(`className={styles.${className}}`);
    }

    for (const [key, value] of Object.entries(attrs)) {
      // Strip editor-internal attributes
      if (key.startsWith(EDITOR_ATTR_PREFIX)) continue;

      const jsxKey = JSX_ATTR_MAP[key] ?? key;
      attrParts.push(`${jsxKey}="${escapeHTML(value)}"`);
    }

    const attrStr = attrParts.length > 0 ? " " + attrParts.join(" ") : "";

    // Self-closing tags
    if (SELF_CLOSING_TAGS.has(tag)) {
      return `${indentStr}<${tag}${attrStr} />\n`;
    }

    // Build children
    let childContent = "";
    if (children.length > 0) {
      childContent =
        "\n" +
        children.map((child) => this.elementToJSX(child, cssClasses, indent + 1)).join("") +
        indentStr;
    } else if (content) {
      childContent = escapeHTML(content);
    }

    return `${indentStr}<${tag}${attrStr}>${childContent}</${tag}>\n`;
  }

  // ============================================================================
  // CSS MODULE GENERATION
  // ============================================================================

  /**
   * Generate CSS module content from collected class map
   */
  private generateCSSModule(cssClasses: Map<string, CSSClassEntry>): string {
    const parts: string[] = [];

    for (const [className, entry] of cssClasses) {
      const baseProps = this.stylesToCSS(entry.base, 1);
      parts.push(`.${className} {\n${baseProps}\n}`);

      if (entry.tablet) {
        const tabletProps = this.stylesToCSS(entry.tablet, 2);
        parts.push(`@media (max-width: 1023px) {\n  .${className} {\n${tabletProps}\n  }\n}`);
      }

      if (entry.mobile) {
        const mobileProps = this.stylesToCSS(entry.mobile, 2);
        parts.push(`@media (max-width: 767px) {\n  .${className} {\n${mobileProps}\n  }\n}`);
      }
    }

    return parts.join("\n\n") + "\n";
  }

  /**
   * Convert styles object to indented CSS properties
   */
  private stylesToCSS(styles: Record<string, string>, indentLevel: number): string {
    const indent = "  ".repeat(indentLevel);
    return Object.entries(styles)
      .map(([key, value]) => `${indent}${camelToKebab(key)}: ${value};`)
      .join("\n");
  }

  /**
   * Infer MIME type from file path
   */
  private inferMimeType(path: string): string {
    if (path.endsWith(".tsx")) return "text/typescript";
    if (path.endsWith(".css")) return "text/css";
    if (path.endsWith(".json")) return "application/json";
    return "text/plain";
  }

  // ============================================================================
  // COMPONENT WRAPPERS
  // ============================================================================

  /**
   * Wrap JSX in a React component file
   */
  private wrapComponent(name: string, jsx: string, hasStyles: boolean): string {
    const lines: string[] = [];
    lines.push('import React from "react";');
    if (hasStyles) {
      lines.push(`import styles from "./${name}.module.css";`);
    }
    lines.push("");
    lines.push(`export const ${name}: React.FC = () => {`);
    lines.push("  return (");
    lines.push(jsx.trimEnd());
    lines.push("  );");
    lines.push("};");
    lines.push("");
    lines.push(`export default ${name};`);
    lines.push("");
    return lines.join("\n");
  }

  /**
   * Generate index.tsx that re-exports all page components
   */
  private generateIndex(componentNames: string[]): string {
    const lines: string[] = [];

    for (const name of componentNames) {
      lines.push(`export { ${name} } from "./components/${name}";`);
    }

    lines.push("");
    return lines.join("\n");
  }

  /**
   * Generate minimal package.json
   */
  private generatePackageJson(): string {
    return JSON.stringify(
      {
        name: "buildrik-export",
        version: "1.0.0",
        private: true,
        dependencies: {
          react: "^18.3.0",
          "react-dom": "^18.3.0",
        },
        devDependencies: {
          "@types/react": "^18.3.0",
          "@types/react-dom": "^18.3.0",
          typescript: "^5.4.0",
        },
      },
      null,
      2
    ) + "\n";
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Convert page name to a valid PascalCase React component name
   */
  private pageToComponentName(page: PageData): string {
    const base = page.name || page.slug || "Page";
    // Remove non-alphanumeric chars, split on boundaries, PascalCase
    const cleaned = base
      .replace(/[^a-zA-Z0-9\s_-]/g, "")
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("");

    return cleaned || "Page";
  }

  /**
   * Generate a stable CSS class name from element id and type
   */
  private generateClassName(element: ElementData): string {
    const type = element.type || "el";
    // Sanitize id to valid CSS class name characters
    const id = (element.id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 8);
    return `${type}${id ? "_" + id : ""}`;
  }
}
