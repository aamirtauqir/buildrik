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
import { collectUsedKeyframes } from "../../shared/constants/animationKeyframes";
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
import { ReactExporter } from "./ReactExporter";
import { generateStripeScripts } from "./StripeInjector";
import { buildInteractionRuntimeScript, INTERACTION_ATTR } from "./interactionRuntime";
import { isSafeAttrValue, sanitizeHTML } from "../../shared/utils/html/sanitization";

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
  type: "html" | "css" | "js" | "xml" | "tsx" | "json";
}

/**
 * Result of multi-page export
 */
export interface MultiPageExportResult {
  /** Array of exported files */
  files: MultiPageExportFile[];
}

/** Bucket a filename into the coarse MultiPageExportFile type tag. */
function multiPageFileType(name: string): MultiPageExportFile["type"] {
  if (name.endsWith(".css")) return "css";
  if (name.endsWith(".tsx") || name.endsWith(".ts")) return "tsx";
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".xml")) return "xml";
  if (name.endsWith(".js")) return "js";
  return "html";
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
  /**
   * pageId → exported filename, for resolving the inspector's internal-link
   * scheme. Built per export because it depends on the page set being written.
   */
  private pageHrefs = new Map<string, string>();

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
      if (exportConfig.format === "react") {
        const reactExporter = new ReactExporter(this.composer);
        return reactExporter.export();
      }

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

    // Emit @keyframes for any bd-anim-* animation referenced in the styles.
    // Element animations write `animation: bd-anim-<name> …` but the exported
    // site never loads the editor's animation-utils.css, so without this the
    // keyframes are undefined and the animation silently no-ops on the live
    // site. Only used keyframes are emitted (no bloat when none are animated).
    const keyframes = collectUsedKeyframes(css);
    if (keyframes) css += `\n${keyframes}`;

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
    const contentFormat = element.getData?.().contentFormat as "text" | "html" | undefined;
    const attrs = element.getAttributes?.() || {};
    const styles = element.getStyles?.() || {};
    const children = element.getChildren?.() || [];

    // Prefer the element's explicit tagName (e.g. an h1/h3 heading the user
    // chose) so the export matches the canvas; fall back to the type→tag map.
    const tag = element.getData?.().tagName || getTagForType(type);
    const className = `${config.cssPrefix}${id}`;
    const indentStr = config.minify ? "" : "  ".repeat(indent);
    const newline = config.minify ? "" : "\n";

    // Build attributes
    const attrParts: string[] = [`class="${className}"`];

    /* Emit every attribute the element carries, the way the multi-page writer
       below already does. This was a five-name whitelist — alt, href, src,
       target, id — so the HTML and ZIP exports silently dropped everything
       else the Element Properties inspector writes: rel, title, poster, value,
       placeholder, name, required, download, and every aria- / data- attribute an
       element had. class and style come from their canonical fields above and
       below, so a raw attribute mirroring them would double-emit. */
    for (const [key, value] of Object.entries(attrs)) {
      if (key === "class" || key === "style") continue;
      const out = key === "href" ? this.resolveHref(value) : value;
      attrParts.push(`${key}="${escapeHTML(out)}"`);
    }

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
      childContent = this.renderContent(content, contentFormat, type);
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
   * Build class-based base CSS for the multi-page publish path.
   *
   * H1 cascade fix: base styles are emitted as `.${prefix}${id}` class rules
   * (NOT inline on the element). That gives them the SAME specificity (0,0,1,0)
   * as the StyleEngine breakpoint rules (`@media { [data-buildrick-id] {…} }`
   * from generateResponsiveCSS), so when both set the same property the @media
   * override wins by source order (base emitted first, breakpoints after).
   * Inline base styles (the H1 interim) out-specificity the stylesheet and
   * shadowed breakpoint overrides — this removes that.
   *
   * D1 visibility also moves here: per-breakpoint hide becomes a class-based
   * `@media { .${prefix}${id} { display:none } }` rule instead of the inline
   * `[style*="--hide-…"]` substring selector (which no longer works once the
   * inline style attr is gone).
   *
   *   base rules         .buildrick-<id> { color:red }              (0,0,1,0)
   *   breakpoint (later)  @media(...) { [data-buildrick-id] { … } }  (0,0,1,0) → wins
   *   hide               @media(...) { .buildrick-<id>{display:none} } (!important)
   */
  private buildPublishBaseCss(pages: PageData[], minify: boolean): string {
    const prefix = this.config.cssPrefix;
    const HIDE_QUERIES: Record<string, string> = {
      "--hide-mobile": "(max-width:767px)",
      "--hide-tablet": "(min-width:768px) and (max-width:1023px)",
      "--hide-desktop": "(min-width:1024px)",
    };
    const baseRules: string[] = [];
    const hideRules: string[] = [];

    const walk = (el: PageData["root"] | undefined): void => {
      if (!el) return;
      const styles = el.styles;
      if (el.id && styles && Object.keys(styles).length > 0) {
        const sel = `.${prefix}${el.id}`;
        // Same defense-in-depth guard buildAttributeString applies — drop the
        // whole rule if it carries a dangerous CSS pattern (F1 carried over).
        if (isSafeAttrValue("style", stylesToString(styles), "")) {
          const styleStr = stylesToCSS(styles, minify);
          baseRules.push(minify ? `${sel}{${styleStr}}` : `${sel} {\n${styleStr}}\n`);
        }
        for (const [key, query] of Object.entries(HIDE_QUERIES)) {
          if (styles[key] === "true") {
            hideRules.push(`@media ${query}{${sel}{display:none!important}}`);
          }
        }
      }
      el.children?.forEach(walk);
    };
    for (const page of pages) walk(page.root);

    return [...baseRules, ...hideRules].join(minify ? "" : "\n");
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

    // User's global custom CSS (Settings → Advanced). Emitted last so it can
    // override generated element styles. Previously stored but injected nowhere.
    const globalCss = this.composer.getProjectSettings?.()?.customCode?.globalCss;
    if (globalCss && globalCss.trim()) {
      head += `${indent}<style>${nl}${globalCss}${nl}${indent}</style>${nl}`;
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

    // Inject the interaction runtime only when the page actually uses
    // interactions — keeps interaction-free sites byte-for-byte unchanged.
    const interactionScript = content.includes(INTERACTION_ATTR)
      ? buildInteractionRuntimeScript() + nl
      : "";

    return `<!DOCTYPE html>${nl}<html lang="en">${nl}<head>${nl}${head}</head>${nl}<body>${nl}${content}${interactionScript}</body>${nl}</html>`;
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
    // Honor the requested format. HTML falls through to the multi-page HTML
    // pipeline below; react delegates to ReactExporter; vue is not built yet.
    if (options.format === "react") {
      const reactResult = new ReactExporter(this.composer).export();
      if (!reactResult.success || !reactResult.files) {
        throw new Error(reactResult.error ?? "React export failed");
      }
      return {
        files: reactResult.files.map((f) => ({
          name: f.name,
          content: f.content,
          type: multiPageFileType(f.name),
        })),
      };
    }
    if (options.format === "vue") {
      throw new Error("Vue export is not implemented");
    }

    // exportPages() rehydrates root via live Element.toJSON(); getAllPages()
    // returns the stale ctx.pages snapshot, which misses click-to-add children
    // because element mutations only touch Element instances, not page.root JSON.
    // Without this, deployed sites publish empty <div></div> bodies.
    const pages =
      this.composer.elements.exportPages?.() ??
      this.composer.elements.getAllPages?.() ??
      [];
    const files: MultiPageExportFile[] = [];

    // CSS = class-based base styles FIRST, then StyleEngine breakpoint overrides.
    // Order matters: base + breakpoint rules share specificity (0,0,1,0), so the
    // @media override must come later to win at its viewport (H1 cascade fix).
    const baseCss = this.buildPublishBaseCss(pages, !!options.minify);
    const responsiveCss =
      this.composer.styles?.generateResponsiveCSS?.({ minify: options.minify }) ??
      this.generateCSS({ ...this.config, minify: options.minify });
    const css = [baseCss, responsiveCss].filter(Boolean).join(options.minify ? "" : "\n\n");

    // CMS export options
    const cmsOptions: CMSExportOptions = {
      mode: options.cmsMode || "none",
      syntax: options.cmsSyntax,
    };

    this.pageHrefs = new Map(
      pages.map((p) => [p.id, p.isHome || !p.slug ? "index.html" : `${p.slug}.html`]),
    );

    // Export each page
    for (const page of pages) {
      let html = this.exportPageToHtml(page, css);

      // Apply CMS resolution if mode is not 'none'
      if (cmsOptions.mode !== "none") {
        html = await this.cmsResolver.resolve(html, cmsOptions);
      }

      const fileName = this.pageHrefs.get(page.id) ?? "index.html";

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
  /**
   * The Link inspector writes an internal page link as `#page:<pageId>` and
   * nothing else in the package has ever understood that scheme. Exported
   * verbatim it is a fragment identifier for an id that does not exist, so
   * every internal link on a published site did nothing — the browser stayed
   * on the page and appended a hash. Resolved here against the filenames this
   * same export is writing (`<slug>.html`, or index.html for home).
   *
   * An unresolvable id — a page deleted after the link was made — falls back
   * to the home page rather than shipping the raw scheme.
   */
  private resolveHref(href: string): string {
    if (!href.startsWith("#page:")) return href;
    return this.pageHrefs.get(href.slice("#page:".length)) ?? "index.html";
  }

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

    // D1 responsive visibility now lives in the class-based styles.css
    // (buildPublishBaseCss emits `@media { .${prefix}${id}{display:none} }`),
    // matching the H1 cascade fix — no inline-substring hide block here.

    // User's global custom CSS (Settings → Advanced), emitted after the
    // stylesheet link so it can override generated styles.
    const globalCss = this.composer.getProjectSettings?.()?.customCode?.globalCss;
    if (globalCss && globalCss.trim()) {
      headParts.push(`  <style>\n${globalCss}\n  </style>`);
    }

    // Inject the interaction runtime only when this page uses interactions.
    const interactionScript = bodyContent.includes(INTERACTION_ATTR)
      ? "\n" + buildInteractionRuntimeScript()
      : "";

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
${headParts.join("\n")}
</head>
<body>
${bodyContent}${interactionScript}
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
  /**
   * Emit an element's `content` for export.
   *
   * Plain text is escaped. That is what every hand-authored element relies on —
   * without it a user who types `<script>` gets markup on their published site.
   *
   * `contentFormat: "html"` means `content` is already markup. AI site
   * generation stores whole generated sections that way and the canvas mounts
   * them un-escaped, so escaping them here published every AI-generated site as
   * visible angle brackets. Those are emitted as markup — but sanitized first,
   * because model output is untrusted input like any other. Export runs in the
   * editor client, so DOMPurify has a real DOM here.
   */
  private renderContent(content: string, contentFormat?: "text" | "html", type?: string): string {
    // A real tag (`<h1>…`), not plain text like "a < b". Template & AI page
    // seeds store raw HTML in a container's `content` without stamping
    // contentFormat, so an unset format on a container with tag-shaped content
    // is treated as markup. The type gate is load-bearing: a hand-authored
    // `text` element that literally contains `<script>` must still be escaped,
    // never rendered — that is the safety guarantee the escape default exists for.
    const looksLikeHtml = /<[a-z][\s\S]*>/i.test(content);
    if (contentFormat === "html" || (contentFormat == null && type === "container" && looksLikeHtml)) {
      return sanitizeHTML(content);
    }
    return escapeHTML(content);
  }

  private renderPageElement(element: PageData["root"], indent = 1): string {
    if (!element) return "";

    const tag = element.tagName || getTagForType(element.type);
    const indentStr = "  ".repeat(indent);
    const children = element.children ?? [];
    const content = element.content ?? "";
    const contentFormat = (element as { contentFormat?: "text" | "html" }).contentFormat;

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

    // H1: published elements must carry their styling hooks. renderPageElement
    // historically emitted only raw data.attributes, dropping class +
    // data-buildrick-id, so deployed sites rendered unstyled. Emit both:
    //  - `data-buildrick-id` → what the StyleEngine breakpoint rules target.
    //  - `class="${prefix}${id} …userClasses"` → matches the class-based base
    //    CSS from buildPublishBaseCss. Base styles are class-based (NOT inline)
    //    so @media breakpoint overrides win by source order — see the cascade
    //    note on buildPublishBaseCss.
    attrParts.push(`data-buildrick-id="${escapeHTML(element.id)}"`);
    const classNames = [`${this.config.cssPrefix}${element.id}`, ...(element.classes ?? [])].join(" ");
    attrParts.push(`class="${escapeHTML(classNames)}"`);

    if (element.attributes) {
      for (const [key, value] of Object.entries(element.attributes)) {
        // class/style/data-buildrick-id emitted above from their canonical
        // fields — don't double-emit if a raw attribute mirrors them.
        if (key === "class" || key === "style" || key === "data-buildrick-id") continue;
        // Internal page links carry the inspector's `#page:<id>` scheme — this
        // is the writer the PUBLISH path uses, so resolving it only in the
        // live-Element writer above would have fixed nothing that ships.
        const out = key === "href" ? this.resolveHref(value) : value;
        attrParts.push(`${key}="${escapeHTML(out)}"`);
      }
    }

    // Interactions live on element.data.interactions, NOT element.attributes
    // (toJSON serializes raw data.attributes; the computed interactions attr is
    // only added by the live element's getAttributes()). Emit it here so the
    // published runtime can wire the configured triggers.
    const interactions = element.data?.interactions;
    if (Array.isArray(interactions) && interactions.length > 0) {
      attrParts.push(`${INTERACTION_ATTR}="${escapeHTML(JSON.stringify(interactions))}"`);
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
      childContent = this.renderContent(content, contentFormat, element.type);
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
