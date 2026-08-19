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
  siteFontCSS,
  googleFontsHeadLinks,
  siteFontsFromTokens,
  getTagForType,
  escapeHTML,
  stylesToString,
  stylesToCSS,
  minifyCSS,
  downloadFile,
} from "./ExportHelpers";
import { FormspreeInjector } from "./FormspreeInjector";
import { SEOInjector } from "./SEOInjector";
import { sanitizeHeadCode } from "./sanitizeHeadCode";
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

/**
 * Per-breakpoint hide, as the media queries that actually hide something.
 *
 * The inspector's Visibility toggles write `--hide-<bp>: true` into an
 * element's styles. That is an inert custom property in a browser — the
 * publish path turns it into a media query, and the single-file export wrote
 * the property straight into the stylesheet and nothing else, so an element
 * hidden on mobile was fully visible on mobile in the exported file.
 */
/**
 * Whether a page is deployed at all.
 *
 * Page settings → Advanced offers Live / Hidden / Password. Both non-live
 * states are left out of a deploy — static hosting cannot ask for a password,
 * and publishing a page the owner believes is protected is the worse mistake.
 *
 * Exported because the Publish panel counts pages too, and a count that does
 * not match what ships is the same lie one layer up: it read "2 pages" for a
 * site with one live page and one hidden.
 */
export function isPageLive(page: PageData): boolean {
  const v = page.settings?.visibility;
  return v === undefined || v === "live";
}

const HIDE_MEDIA_QUERIES: Record<string, string> = {
  "--hide-mobile": "(max-width:767px)",
  "--hide-tablet": "(min-width:768px) and (max-width:1023px)",
  "--hide-desktop": "(min-width:1024px)",
};

function hideRulesFor(selector: string, styles: Record<string, string>): string[] {
  return Object.entries(HIDE_MEDIA_QUERIES)
    .filter(([key]) => styles[key] === "true")
    .map(([, query]) => `@media ${query}{${selector}{display:none!important}}`);
}

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
    // Internal links resolve against the names every export path writes, so
    // the map has to exist here too — not only in the multi-page pipeline.
    this.buildPageHrefs(
      this.composer.elements.exportPages?.() ?? this.composer.elements.getAllPages?.() ?? []
    );
    const page = this.composer.elements.getActivePage?.();
    if (!page) return this.wrapInDocument("", cfg);

    const rootElement = this.composer.elements.getElement(page.root.id);
    if (!rootElement) return this.wrapInDocument("", cfg);

    const bodyContent = this.elementToHTML(rootElement, cfg);

    // The CSS is generated either way: an external stylesheet still decides
    // which font families the page needs fetched, and passing it only in the
    // embedded case left the ZIP export naming families it never loaded.
    return this.wrapInDocument(bodyContent, cfg, this.generateCSS(cfg));
  }

  /**
   * The three font families the SITE names in its own tokens. They reach the
   * page through `siteFontCSS`, so they need fetching just like a family an
   * element names directly.
   */
  private siteFontFamilies(): string[] {
    const { heading, body, mono } = siteFontsFromTokens(
      this.composer.getProjectSettings?.()?.designTokens
    );
    return [heading, body, mono].filter((v): v is string => Boolean(v));
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

    // The site's fonts, after the reset so they win over its one hardcoded
    // family. Read from the project's own tokens — the Brand panel's three
    // font slots reached the canvas and stopped there.
    css += siteFontCSS(siteFontsFromTokens(this.composer.getProjectSettings?.()?.designTokens));

    const page = this.composer.elements.getActivePage?.();
    if (!page) return css;

    const rootElement = this.composer.elements.getElement(page.root.id);
    if (!rootElement) return css;

    const styles = this.extractStyles(rootElement, cfg);
    css += styles;

    // The breakpoint overrides. `extractStyles` walks base styles only, so a
    // site styled for phones exported with its desktop rules and nothing else —
    // the mobile layout simply was not in the file. The publish path has always
    // appended these, and the order is the same for the same reason: base and
    // breakpoint rules share specificity, so the @media has to come later to
    // win at its viewport.
    const responsive = this.composer.styles?.generateResponsiveCSS?.({ minify: cfg.minify }) ?? "";
    if (responsive) css += (cfg.minify ? "" : "\n") + responsive;

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
    /* The user's own classes belong here too. The multi-page writer has always
       joined them (:753); this one emitted only the generated per-element
       class, so a download dropped every class the Classes panel adds and the
       CSS written against those class names had nothing to match. */
    const className = [`${config.cssPrefix}${id}`, ...(element.getClasses?.() ?? [])].join(" ");
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
      if (!isSafeAttrValue(key, out, tag)) continue;
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
      // …and the breakpoint hides those styles carry, the same way the publish
      // path emits them. Without this the file kept `--hide-mobile: true` — an
      // inert custom property — and showed the element on every screen.
      const hides = hideRulesFor(className, styles);
      if (hides.length) css += hides.join(config.minify ? "" : "\n") + (config.minify ? "" : "\n\n");
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
    const HIDE_QUERIES = HIDE_MEDIA_QUERIES;
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
        hideRules.push(...hideRulesFor(sel, styles));
      }
      el.children?.forEach(walk);
    };
    for (const page of pages) walk(page.root);

    return [...baseRules, ...hideRules].join(minify ? "" : "\n");
  }

  /**
   * Wrap content in full HTML document
   */
  private wrapInDocument(content: string, config: ExportConfig, css?: string): string {
    // Embedded only when the caller asked for it; the CSS is always read for
    // the font links below.
    const embeddedCSS = config.cssStyle === "embedded" ? css : undefined;
    const nl = config.minify ? "" : "\n";
    const indent = config.minify ? "" : "  ";

    let head = "";

    if (config.includeMeta) {
      head += `${indent}<meta charset="UTF-8">${nl}`;
    }

    if (config.includeViewport) {
      head += `${indent}<meta name="viewport" content="width=device-width, initial-scale=1.0">${nl}`;
    }



    // The page's SEO, from the SAME emitter the published page uses. This
    // path used to assemble its own head: a title, and a description only if
    // one had been typed into the export modal's Options tab — no Open Graph,
    // no Twitter card, no canonical, no JSON-LD, no robots directive, no
    // custom head code. Each of those was found and patched in one at a time
    // today; calling `inject` is what stops the next one.
    const seoPage = this.composer.elements.getActivePage?.();
    if (seoPage) {
      const siteSEO = this.composer.getProjectSettings?.()?.seo;
      /* The engine's DEFAULT pageTitle is the literal "Buildrick Export". Passed
         through as an override it would beat the page's own title on every
         export that did not set one — the same brand-name-on-your-page bug
         fixed in the modal earlier today, one layer down. Only a title the
         caller actually chose is an override; an explicit empty string keeps
         its documented meaning of "no title tag". */
      const chosenTitle =
        config.pageTitle === DEFAULT_EXPORT_CONFIG.pageTitle ? undefined : config.pageTitle;
      const seoTags = this.seoInjector.inject(seoPage, siteSEO, {
        title: chosenTitle === "" ? null : chosenTitle,
        description: config.metaDescription,
      });
      // `inject` joins its tags with a newline and two spaces of its own, which
      // a minified document must not carry.
      const seoBlock = config.minify ? seoTags.replace(/\n\s*/g, "") : seoTags;
      if (seoBlock) head += `${indent}${seoBlock}${nl}`;
    }

    // The families the page names have to be fetched, or the visitor gets the
    // generic fallback while the editor showed the real face.
    const fontLinks = googleFontsHeadLinks(css ?? "", this.siteFontFamilies());
    if (fontLinks) {
      head += fontLinks
        .split("\n")
        .map((l) => `${indent}${l}`)
        .join(nl) + nl;
    }

    if (embeddedCSS) {
      head += `${indent}<style>${nl}${embeddedCSS}${indent}</style>${nl}`;
    } else if (config.cssStyle === "external") {
      head += `${indent}<link rel="stylesheet" href="styles.css">${nl}`;
    }

    // User's global custom CSS (Settings → Advanced). Emitted last so it can
    // override generated element styles. Previously stored but injected nowhere.
    const customCode = this.composer.getProjectSettings?.()?.customCode;
    const globalCss = customCode?.globalCss;
    if (globalCss && globalCss.trim()) {
      head += `${indent}<style>${nl}${globalCss}${nl}${indent}</style>${nl}`;
    }

    // …and the head scripts from the same screen, which said "Custom code runs
    // on all pages" and ran on none: the field saves (verified live), and
    // nothing read it — not this export, not the publish worker, which selects
    // the site's icons and SEO and never its head code. Same sanitiser the
    // per-page head field uses, so inline <script> does not survive; an
    // external `<script src>` does.
    const headScripts = sanitizeHeadCode(customCode?.headScripts);
    if (headScripts) head += `${indent}${headScripts}${nl}`;

    // Inject analytics scripts before closing head tag.
    //
    // `config.analytics` is EXPORT config, and nothing has ever filled it in —
    // the modal does not set it and the default config omits it, so this call
    // received undefined every time. The user's tracking IDs live in project
    // settings, written by Settings → Analytics, whose own note says they are
    // "written into the site when you publish". They were written nowhere.
    const analyticsConfig =
      config.analytics ?? this.composer.getProjectSettings?.()?.analytics;
    const analyticsScripts = generateAnalyticsScripts(analyticsConfig);
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

    const bodyScripts = sanitizeHeadCode(customCode?.bodyScripts);
    const bodyTail = bodyScripts ? `${nl}${indent}${bodyScripts}` : "";

    return `<!DOCTYPE html>${nl}<html lang="en">${nl}<head>${nl}${head}</head>${nl}<body>${nl}${content}${interactionScript}${bodyTail}</body>${nl}</html>`;
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
    const allPages =
      this.composer.elements.exportPages?.() ??
      this.composer.elements.getAllPages?.() ??
      [];

    /* A page marked Hidden — or password-protected — was published exactly
       like a live one. Page settings → Advanced offers "Live / Hidden /
       Password" and tells the user to "Share this password with visitors who
       need access"; nothing outside that panel ever read the field, so the
       promise was never kept. One page in the database is already marked
       hidden.
       Static hosting cannot ask for a password, so both non-live states fail
       CLOSED here: the page is not written. Publishing a page the user
       believes is protected is the worse of the two mistakes. The screen says
       so, in the same words the Redirects and Headers screens use for their
       own not-yet-enforced settings. */
    const livePages = allPages.filter(isPageLive);
    // …unless that leaves nothing to deploy. A site with no index.html is a
    // broken deploy, which helps nobody.
    const pages = livePages.length > 0 ? livePages : allPages.filter((p) => p.isHome).slice(0, 1);
    const files: MultiPageExportFile[] = [];

    // CSS = class-based base styles FIRST, then StyleEngine breakpoint overrides.
    // Order matters: base + breakpoint rules share specificity (0,0,1,0), so the
    // @media override must come later to win at its viewport (H1 cascade fix).
    const baseCss = this.buildPublishBaseCss(pages, !!options.minify);
    const responsiveCss =
      this.composer.styles?.generateResponsiveCSS?.({ minify: options.minify }) ??
      this.generateCSS({ ...this.config, minify: options.minify });
    let css = [baseCss, responsiveCss].filter(Boolean).join(options.minify ? "" : "\n\n");

    /* …and the @keyframes those styles reference. `generateCSS` has emitted
       them since the single-file export was found shipping `animation:
       bd-anim-fadeIn` with no keyframe behind it; this path never did, so the
       animation worked in a downloaded file and silently no-opped on the
       PUBLISHED site — the direction that actually reaches visitors. */
    const publishKeyframes = collectUsedKeyframes(css);
    if (publishKeyframes) css += (options.minify ? "" : "\n") + publishKeyframes;

    // CMS export options
    const cmsOptions: CMSExportOptions = {
      mode: options.cmsMode || "none",
      syntax: options.cmsSyntax,
    };

    this.buildPageHrefs(pages);

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
  /**
   * The filename each page will be written as, keyed by page id.
   *
   * A slug is a path, and "/about" is what a person types for one —
   * `normalizeSlug` keeps that leading slash and `validateSlug` allows it, so
   * the file came out named "/about.html": a malformed entry in the ZIP and a
   * leading-slash `path` in the publish payload. Stripped here rather than by
   * rewriting anyone's stored slug.
   *
   * Built for the single-file export too. It never built one, so `resolveHref`
   * fell through to its "page deleted" fallback for EVERY link: a link to the
   * About page came out as `href="index.html"` — pointing the visitor back at
   * the page they were already on, which reads as broken navigation rather
   * than a missing file.
   */
  private buildPageHrefs(pages: PageData[]): void {
    this.pageHrefs = new Map(
      pages.map((p) => {
        const slug = (p.slug ?? "").replace(/^\/+/, "");
        return [p.id, p.isHome || !slug ? "index.html" : `${slug}.html`];
      }),
    );
  }

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

    // Same reason as generateHTML: a named family that is never fetched is the
    // visitor's default sans, not the site's font.
    const pageFontLinks = googleFontsHeadLinks(css, this.siteFontFamilies());
    if (pageFontLinks) {
      headParts.push(...pageFontLinks.split("\n").map((l) => `  ${l}`));
    }

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
    const siteCustomCode = this.composer.getProjectSettings?.()?.customCode;
    const globalCss = siteCustomCode?.globalCss;
    if (globalCss && globalCss.trim()) {
      headParts.push(`  <style>\n${globalCss}\n  </style>`);
    }

    // The site's head scripts, on every published page — see the note in
    // wrapInDocument. Sanitised by the same allowlist as the per-page field.
    const siteHeadScripts = sanitizeHeadCode(siteCustomCode?.headScripts);
    if (siteHeadScripts) headParts.push(`  ${siteHeadScripts}`);

    // …and the site's analytics, which the published page never carried: the
    // single-file path read an export-config field nobody fills in, and this
    // path did not look at all.
    const publishedAnalytics = generateAnalyticsScripts(
      this.composer.getProjectSettings?.()?.analytics
    );
    if (publishedAnalytics) headParts.push(publishedAnalytics);

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
${bodyContent}${interactionScript}${sanitizeHeadCode(siteCustomCode?.bodyScripts) ? `\n  ${sanitizeHeadCode(siteCustomCode?.bodyScripts)}` : ""}
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
        if (!isSafeAttrValue(key, out, tag)) continue;
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

    // EVERY page, not just the open one. This built its archive from
    // `generateHTML`, which is the ACTIVE page — so "Export code → ZIP" on a
    // twelve-page site handed back one index.html and silently dropped the
    // other eleven, while Publish (which runs `exportAllPages`) shipped them
    // all. Verified on a two-page site: the ZIP held index.html + styles.css,
    // and the React export beside it held both pages.
    const { files } = await this.exportAllPages({ format: "html", minify: cfg.minify });

    const htmlFiles = files.filter((f) => f.type === "html");
    let css = files.find((f) => f.name === "styles.css")?.content ?? "";

    // Assets referenced by ANY page, deduped — one image used on three pages
    // should be bundled once.
    const imageUrls = [...new Set(htmlFiles.flatMap((f) => bundler.extractImageUrls(f.content)))];
    const { assets: imageAssets } = await bundler.bundleAssets(imageUrls);
    const fontUrls = bundler.extractFontUrls(css);
    const { assets: fontAssets } = await bundler.bundleAssets(fontUrls);
    const allAssets = [...imageAssets, ...fontAssets];

    css = bundler.rewriteFontUrls(css, fontAssets);

    for (const file of files) {
      if (file.name === "styles.css") continue;
      zip.file(
        file.name,
        file.type === "html" ? bundler.rewriteUrls(file.content, allAssets) : file.content
      );
    }
    if (css) zip.file("styles.css", css);

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
