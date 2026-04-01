/**
 * Export Engine
 * Generate HTML/CSS from Composer designs
 * @license BSD-3-Clause
 */

import JSZip from "jszip";
import type { PageData } from "../../shared/types";
import type {
  ExportConfig,
  ExportResult,
  ExportStats,
  ExportedFile,
} from "../../shared/types/export";
import { DEFAULT_EXPORT_CONFIG } from "../../shared/types/export";
import { CMSExportResolver } from "../cms/CMSExportResolver";
import type { CMSExportMode, CMSExportOptions } from "../cms/CMSExportResolver";
import type { Composer } from "../Composer";
import { generateAnalyticsScripts } from "./AnalyticsInjector";
import { AssetBundler } from "./AssetBundler";
import {
  RESET_CSS,
  getTagForType,
  escapeHTML,
  stylesToString,
  stylesToCSS,
  minifyCSS,
  downloadFile,
} from "./ExportHelpers";
import { FormspreeInjector } from "./FormspreeInjector";
import { SEOInjector } from "./SEOInjector";
import { SitemapGenerator } from "./SitemapGenerator";
import { generateStripeScripts } from "./StripeInjector";

// ============================================================================
// MULTI-PAGE EXPORT TYPES
// ============================================================================

/**
 * Options for multi-page export
 */
export interface MultiPageExportOptions {
  /** Export format */
  format: "html" | "react" | "vue";
  /** Include sitemap.xml */
  includeSitemap?: boolean;
  /** Base URL for sitemap */
  baseUrl?: string;
  /** Minify output */
  minify?: boolean;
  /** CMS export mode: 'static' embeds data, 'template' uses syntax, 'none' ignores */
  cmsMode?: CMSExportMode;
  /** Template syntax for 'template' mode */
  cmsSyntax?: "handlebars" | "liquid";
}

/**
 * Exported file with type information
 */
export interface MultiPageExportFile {
  /** File name */
  name: string;
  /** File content */
  content: string;
  /** File type */
  type: "html" | "css" | "js" | "xml";
}

/**
 * Result of multi-page export
 */
export interface MultiPageExportResult {
  /** Array of exported files */
  files: MultiPageExportFile[];
}

// ============================================================================
// EXPORT ENGINE CLASS
// ============================================================================

export class ExportEngine {
  private composer: Composer;
  private config: ExportConfig;
  private cmsResolver: CMSExportResolver;
  private seoInjector: SEOInjector;
  private formspreeInjector: FormspreeInjector;

  constructor(composer: Composer, config?: Partial<ExportConfig>) {
    this.composer = composer;
    this.config = { ...DEFAULT_EXPORT_CONFIG, ...config };
    this.cmsResolver = new CMSExportResolver(composer);
    this.seoInjector = new SEOInjector();
    this.formspreeInjector = new FormspreeInjector();
  }

  /**
   * Export the current design
   */
  async export(config?: Partial<ExportConfig>): Promise<ExportResult> {
    const exportConfig = { ...this.config, ...config };

    try {
      const html = this.generateHTML(exportConfig);
      const css = this.generateCSS(exportConfig);
      const stats = this.calculateStats(html, css);

      if (exportConfig.format === "zip") {
        const files = this.generateZipFiles(html, css, exportConfig);
        return { success: true, html, css, files, stats };
      }

      return { success: true, html, css, stats };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
      };
    }
  }

  /**
   * Generate HTML from the design
   */
  generateHTML(config?: Partial<ExportConfig>): string {
    const cfg = { ...this.config, ...config };
    const page = this.composer.elements.getActivePage?.();
    if (!page) return this.wrapInDocument("", cfg);

    const rootElement = this.composer.elements.getElement(page.root.id);
    if (!rootElement) return this.wrapInDocument("", cfg);

    const bodyContent = this.elementToHTML(rootElement, cfg);

    if (cfg.cssStyle === "embedded") {
      return this.wrapInDocument(bodyContent, cfg, this.generateCSS(cfg));
    }

    return this.wrapInDocument(bodyContent, cfg);
  }

  /**
   * Generate CSS from the design
   */
  generateCSS(config?: Partial<ExportConfig>): string {
    const cfg = { ...this.config, ...config };
    let css = "";

    if (cfg.includeResetCSS) {
      css += cfg.minify ? RESET_CSS.replace(/\s+/g, " ") : RESET_CSS;
    }

    const page = this.composer.elements.getActivePage?.();
    if (!page) return css;

    const rootElement = this.composer.elements.getElement(page.root.id);
    if (!rootElement) return css;

    const styles = this.extractStyles(rootElement, cfg);
    css += styles;

    return cfg.minify ? minifyCSS(css) : css;
  }

  /**
   * Convert element tree to HTML string
   */
  private elementToHTML(
    element: ReturnType<typeof this.composer.elements.getElement>,
    config: ExportConfig,
    indent = 0
  ): string {
    if (!element) return "";

    const id = element.getId?.() || "";
    const type = element.getType?.() || "div";
    const content = element.getContent?.() || "";
    const attrs = element.getAttributes?.() || {};
    const styles = element.getStyles?.() || {};
    const children = element.getChildren?.() || [];

    const tag = getTagForType(type);
    const className = `${config.cssPrefix}${id}`;
    const indentStr = config.minify ? "" : "  ".repeat(indent);
    const newline = config.minify ? "" : "\n";

    // Build attributes
    const attrParts: string[] = [`class="${className}"`];

    if (attrs.alt) attrParts.push(`alt="${escapeHTML(attrs.alt)}"`);
    if (attrs.href) attrParts.push(`href="${escapeHTML(attrs.href)}"`);
    if (attrs.src) attrParts.push(`src="${escapeHTML(attrs.src)}"`);
    if (attrs.target) attrParts.push(`target="${attrs.target}"`);
    if (attrs.id) attrParts.push(`id="${escapeHTML(attrs.id)}"`);

    // Build inline styles if configured
    if (config.cssStyle === "inline" && Object.keys(styles).length > 0) {
      const styleStr = stylesToString(styles);
      attrParts.push(`style="${styleStr}"`);
    }

    const attrStr = attrParts.length > 0 ? " " + attrParts.join(" ") : "";

    // Self-closing tags
    if (["img", "input", "br", "hr"].includes(tag)) {
      return `${indentStr}<${tag}${attrStr} />${newline}`;
    }

    // Build children content
    let childContent = "";
    if (children.length > 0) {
      childContent =
        newline +
        children.map((child) => this.elementToHTML(child, config, indent + 1)).join("") +
        indentStr;
    } else if (content) {
      childContent = escapeHTML(content);
    }

    return `${indentStr}<${tag}${attrStr}>${childContent}</${tag}>${newline}`;
  }

  /**
   * Extract CSS styles from element tree
   */
  private extractStyles(
    element: ReturnType<typeof this.composer.elements.getElement>,
    config: ExportConfig
  ): string {
    if (!element) return "";
    if (config.cssStyle === "inline") return "";

    const id = element.getId?.() || "";
    const styles = element.getStyles?.() || {};
    const children = element.getChildren?.() || [];

    let css = "";
    const className = `.${config.cssPrefix}${id}`;

    if (Object.keys(styles).length > 0) {
      const styleStr = stylesToCSS(styles, config.minify);
      css += config.minify ? `${className}{${styleStr}}` : `${className} {\n${styleStr}}\n\n`;
    }

    for (const child of children) {
      css += this.extractStyles(child, config);
    }

    return css;
  }

  /**
   * Wrap content in full HTML document
   */
  private wrapInDocument(content: string, config: ExportConfig, embeddedCSS?: string): string {
    const nl = config.minify ? "" : "\n";
    const indent = config.minify ? "" : "  ";

    let head = "";

    if (config.includeMeta) {
      head += `${indent}<meta charset="UTF-8">${nl}`;
    }

    if (config.includeViewport) {
      head += `${indent}<meta name="viewport" content="width=device-width, initial-scale=1.0">${nl}`;
    }

    if (config.pageTitle) {
      head += `${indent}<title>${escapeHTML(config.pageTitle)}</title>${nl}`;
    }

    if (config.metaDescription) {
      head += `${indent}<meta name="description" content="${escapeHTML(config.metaDescription)}">${nl}`;
    }

    if (embeddedCSS) {
      head += `${indent}<style>${nl}${embeddedCSS}${indent}</style>${nl}`;
    } else if (config.cssStyle === "external") {
      head += `${indent}<link rel="stylesheet" href="styles.css">${nl}`;
    }

    // Inject analytics scripts before closing head tag
    const analyticsScripts = generateAnalyticsScripts(config.analytics);
    if (analyticsScripts) {
      head += analyticsScripts + nl;
    }

    // Inject Stripe/cart scripts for e-commerce
    const stripeScripts = generateStripeScripts(config.stripe);
    if (stripeScripts) {
      head += stripeScripts + nl;
    }

    return `<!DOCTYPE html>${nl}<html lang="en">${nl}<head>${nl}${head}</head>${nl}<body>${nl}${content}</body>${nl}</html>`;
  }

  /**
   * Generate files for ZIP export
   */
  private generateZipFiles(html: string, css: string, config: ExportConfig): ExportedFile[] {
    const files: ExportedFile[] = [];

    files.push({ name: "index.html", content: html, mimeType: "text/html" });

    if (config.cssStyle === "external" && css) {
      files.push({ name: "styles.css", content: css, mimeType: "text/css" });
    }

    return files;
  }

  /**
   * Calculate export statistics
   */
  private calculateStats(html: string, css: string): ExportStats {
    return {
      elementCount: this.countElements(),
      cssRuleCount: (css.match(/\{/g) || []).length,
      htmlSize: new Blob([html]).size,
      cssSize: new Blob([css]).size,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Count total elements
   */
  private countElements(): number {
    const page = this.composer.elements.getActivePage?.();
    if (!page) return 0;

    const rootElement = this.composer.elements.getElement(page.root.id);
    if (!rootElement) return 0;

    const count = (el: typeof rootElement): number => {
      if (!el) return 0;
      const children = el.getChildren?.() || [];
      return 1 + children.reduce((sum, child) => sum + count(child), 0);
    };

    return count(rootElement);
  }

  // ============================================================================
  // MULTI-PAGE EXPORT
  // ============================================================================

  /**
   * Export all pages as separate HTML files
   * @param options - Multi-page export configuration
   * @returns Promise resolving to export result with files array
   */
  async exportAllPages(options: MultiPageExportOptions): Promise<MultiPageExportResult> {
    const pages = this.composer.elements.getAllPages?.() ?? [];
    const files: MultiPageExportFile[] = [];

    // Use generateResponsiveCSS for proper breakpoint ordering, or fall back to generateCSS
    const css =
      this.composer.styles?.generateResponsiveCSS?.({ minify: options.minify }) ??
      this.generateCSS({ ...this.config, minify: options.minify });

    // CMS export options
    const cmsOptions: CMSExportOptions = {
      mode: options.cmsMode || "none",
      syntax: options.cmsSyntax,
    };

    // Export each page
    for (const page of pages) {
      let html = this.exportPageToHtml(page, css);

      // Apply CMS resolution if mode is not 'none'
      if (cmsOptions.mode !== "none") {
        html = await this.cmsResolver.resolve(html, cmsOptions);
      }

      const fileName = page.isHome || !page.slug ? "index.html" : `${page.slug}.html`;

      files.push({
        name: fileName,
        content: html,
        type: "html",
      });
    }

    // Add sitemap if requested and baseUrl is provided
    if (options.includeSitemap && options.baseUrl) {
      const generator = new SitemapGenerator(options.baseUrl);
      files.push({
        name: "sitemap.xml",
        content: generator.generate(pages),
        type: "xml",
      });
    }

    // Add shared CSS if not empty
    if (css) {
      files.push({
        name: "styles.css",
        content: css,
        type: "css",
      });
    }

    return { files };
  }

  /**
   * Convert a single page to HTML document
   * @param page - Page data to convert
   * @param css - CSS content (used to determine if styles.css should be linked)
   */
  private exportPageToHtml(page: PageData, css: string): string {
    // Build body content from root element
    let bodyContent = "";
    if (page.root) {
      bodyContent = this.renderPageElement(page.root);
    }

    // Get site-level SEO from project settings
    const siteSEO = this.composer.getProjectSettings?.()?.seo;

    // Build head content
    const headParts: string[] = [
      '  <meta charset="UTF-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    ];

    // Inject SEO meta tags (title, description, OG, Twitter cards, etc.)
    const seoTags = this.seoInjector.inject(page, siteSEO);
    if (seoTags) {
      headParts.push(seoTags);
    }

    if (css) {
      headParts.push('  <link rel="stylesheet" href="styles.css">');
    }

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
${headParts.join("\n")}
</head>
<body>
${bodyContent}
</body>
</html>`;

    // Collect form elements and inject Formspree settings
    const forms = this.collectFormElements(page.root);
    if (forms.length > 0) {
      html = this.formspreeInjector.processHTML(html, forms);
    }

    return html;
  }

  /**
   * Recursively collect form elements with their settings
   */
  private collectFormElements(
    element: PageData["root"] | undefined
  ): Array<{ id: string; formSettings?: import("../../shared/types").FormSettings }> {
    if (!element) return [];

    const forms: Array<{ id: string; formSettings?: import("../../shared/types").FormSettings }> =
      [];

    // Check if this is a form element with form config
    if (element.type === "form" && element.data?.formConfig) {
      const formConfig = element.data.formConfig as {
        formId?: string;
        action?: string;
        webhookUrl?: string;
        successRedirect?: string;
      };

      // Convert FormConfig to FormSettings for FormspreeInjector
      // If webhookUrl contains formspree.io, treat as Formspree provider
      if (formConfig.webhookUrl) {
        const isFormspree = formConfig.webhookUrl.includes("formspree.io");

        if (isFormspree) {
          // Extract form ID from Formspree URL (e.g., https://formspree.io/f/xyzabc)
          const formspreeIdMatch = formConfig.webhookUrl.match(/formspree\.io\/f\/([a-zA-Z0-9]+)/);
          forms.push({
            id: element.attributes?.id || element.id,
            formSettings: {
              provider: "formspree",
              formId: formspreeIdMatch?.[1],
              successRedirect: formConfig.successRedirect,
            },
          });
        } else {
          // Custom webhook URL
          forms.push({
            id: element.attributes?.id || element.id,
            formSettings: {
              provider: "custom",
              actionUrl: formConfig.webhookUrl,
              successRedirect: formConfig.successRedirect,
            },
          });
        }
      }
    }

    // Recursively check children
    if (element.children) {
      for (const child of element.children) {
        forms.push(...this.collectFormElements(child));
      }
    }

    return forms;
  }

  /**
   * Render a page element to HTML string (simplified for multi-page export)
   */
  private renderPageElement(element: PageData["root"], indent = 1): string {
    if (!element) return "";

    const tag = getTagForType(element.type);
    const indentStr = "  ".repeat(indent);
    const children = element.children ?? [];
    const content = element.content ?? "";

    // Build attributes
    const attrParts: string[] = [];

    // For form elements with formConfig, ensure they have an id attribute
    // so FormspreeInjector can find and update them
    if (element.type === "form" && element.data?.formConfig) {
      const hasIdAttr = element.attributes?.id;
      if (!hasIdAttr) {
        attrParts.push(`id="${escapeHTML(element.id)}"`);
      }
    }

    if (element.attributes) {
      for (const [key, value] of Object.entries(element.attributes)) {
        attrParts.push(`${key}="${escapeHTML(value)}"`);
      }
    }

    const attrStr = attrParts.length > 0 ? " " + attrParts.join(" ") : "";

    // Self-closing tags
    if (["img", "input", "br", "hr"].includes(tag)) {
      return `${indentStr}<${tag}${attrStr} />\n`;
    }

    // Build children content
    let childContent = "";
    if (children.length > 0) {
      childContent =
        "\n" +
        children.map((child) => this.renderPageElement(child, indent + 1)).join("") +
        indentStr;
    } else if (content) {
      childContent = escapeHTML(content);
    }

    return `${indentStr}<${tag}${attrStr}>${childContent}</${tag}>\n`;
  }

  // ============================================================================
  // DOWNLOAD METHODS
  // ============================================================================

  /**
   * Download generated HTML
   */
  downloadHTML(html: string, filename = "export.html"): void {
    downloadFile(html, filename, "text/html");
  }

  /**
   * Download generated CSS
   */
  downloadCSS(css: string, filename = "styles.css"): void {
    downloadFile(css, filename, "text/css");
  }

  /**
   * Generate ZIP file with HTML, CSS, and bundled assets
   */
  async generateZip(config?: Partial<ExportConfig>): Promise<Blob> {
    const cfg = { ...this.config, ...config };
    const zip = new JSZip();
    const bundler = new AssetBundler();

    // Generate HTML and CSS
    let html = this.generateHTML({ ...cfg, cssStyle: "external" });
    let css = this.generateCSS(cfg);

    // Extract and bundle image assets
    const imageUrls = bundler.extractImageUrls(html);
    const { assets: imageAssets } = await bundler.bundleAssets(imageUrls);

    // Extract and bundle font assets from CSS
    const fontUrls = bundler.extractFontUrls(css);
    const { assets: fontAssets } = await bundler.bundleAssets(fontUrls);

    const allAssets = [...imageAssets, ...fontAssets];

    // Rewrite URLs to use local paths
    html = bundler.rewriteUrls(html, allAssets);
    css = bundler.rewriteFontUrls(css, fontAssets);

    // Add HTML file
    zip.file("index.html", html);

    // Add CSS file
    if (css) {
      zip.file("styles.css", css);
    }

    // Add assets to ZIP
    if (allAssets.length > 0) {
      const assetsFolder = zip.folder("assets");
      if (assetsFolder) {
        for (const asset of allAssets) {
          const filename = asset.localPath.replace("assets/", "");
          assetsFolder.file(filename, asset.content);
        }
      }
    }

    // Generate the ZIP blob
    return zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
  }

  /**
   * Download as ZIP file
   */
  async downloadZip(filename = "export.zip", config?: Partial<ExportConfig>): Promise<void> {
    const blob = await this.generateZip(config);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Check if the project has any CMS bindings
   */
  hasCMSBindings(): boolean {
    return this.cmsResolver.hasBindings();
  }
}

export default ExportEngine;
