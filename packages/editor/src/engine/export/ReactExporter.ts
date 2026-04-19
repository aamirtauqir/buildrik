/**
 * React Exporter
 * Convert element tree to React components with CSS modules
 * @license BSD-3-Clause
 */

import JSZip from "jszip";
import type { ElementData, PageData } from "../../shared/types";
import type { Composer } from "../Composer";
import { getTagForType, camelToKebab, escapeHTML } from "./ExportHelpers";

// ============================================================================
// TYPES
// ============================================================================

interface ReactExportFile {
  path: string;
  content: string;
}

interface ReactExportResult {
  files: ReactExportFile[];
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
    const zip = new JSZip();

    for (const file of result.files) {
      zip.file(file.path, file.content);
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
  export(): ReactExportResult {
    const pages = this.composer.elements.getAllPages?.() ?? [];
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

    return { files };
  }

  // ============================================================================
  // PAGE TO JSX CONVERSION
  // ============================================================================

  /**
   * Convert a page's element tree to JSX string + collected CSS classes
   */
  private pageToJSX(page: PageData): { jsx: string; cssClasses: Map<string, Record<string, string>> } {
    const cssClasses = new Map<string, Record<string, string>>();

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
    cssClasses: Map<string, Record<string, string>>,
    indent: number
  ): string {
    const tag = getTagForType(element.type);
    const indentStr = "  ".repeat(indent);
    const children = element.children ?? [];
    const content = element.content ?? "";
    const styles = element.styles ?? {};
    const attrs = element.attributes ?? {};

    // Extract styles to CSS module class
    let className: string | undefined;
    if (Object.keys(styles).length > 0) {
      className = this.generateClassName(element);
      cssClasses.set(className, styles);
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
  private generateCSSModule(cssClasses: Map<string, Record<string, string>>): string {
    const parts: string[] = [];

    for (const [className, styles] of cssClasses) {
      const props = Object.entries(styles)
        .map(([key, value]) => `  ${camelToKebab(key)}: ${value};`)
        .join("\n");
      parts.push(`.${className} {\n${props}\n}`);
    }

    return parts.join("\n\n") + "\n";
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
