/**
 * Asset Bundler
 * Extract and bundle images/fonts for ZIP export
 * @license BSD-3-Clause
 */

import { devWarn } from "../../shared/utils/devLogger";

// ============================================================================
// TYPES
// ============================================================================

export interface BundledAsset {
  /** Original URL (absolute or relative) */
  originalUrl: string;
  /** Local path in ZIP (e.g., "assets/image-1.png") */
  localPath: string;
  /** Binary content */
  content: ArrayBuffer;
  /** MIME type */
  mimeType: string;
}

export interface AssetExtractionResult {
  /** Successfully bundled assets */
  assets: BundledAsset[];
  /** Failed URLs with error messages */
  errors: Array<{ url: string; error: string }>;
}

// ============================================================================
// MIME TYPE DETECTION
// ============================================================================

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
};

function getMimeType(url: string): string {
  const ext = url.match(/\.[a-zA-Z0-9]+(?:\?|$)/)?.[0]?.toLowerCase() || "";
  return MIME_TYPES[ext.replace(/\?.*/, "")] || "application/octet-stream";
}

function getExtension(url: string): string {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? `.${match[1].toLowerCase()}` : ".bin";
}

// ============================================================================
// ASSET BUNDLER CLASS
// ============================================================================

export class AssetBundler {
  private assetCounter = 0;
  private urlMap = new Map<string, string>();

  /**
   * Extract all image URLs from HTML string
   */
  extractImageUrls(html: string): string[] {
    const urls = new Set<string>();

    // Extract src attributes from img tags
    const imgSrcRegex = /src=["']([^"']+)["']/gi;
    let match;
    while ((match = imgSrcRegex.exec(html)) !== null) {
      const url = match[1];
      if (this.isImageUrl(url)) {
        urls.add(url);
      }
    }

    // Extract background-image URLs from inline styles
    const bgRegex = /url\(["']?([^"')]+)["']?\)/gi;
    while ((match = bgRegex.exec(html)) !== null) {
      const url = match[1];
      if (this.isImageUrl(url)) {
        urls.add(url);
      }
    }

    return Array.from(urls);
  }

  /**
   * Extract font URLs from CSS string
   */
  extractFontUrls(css: string): string[] {
    const urls = new Set<string>();

    // Extract @font-face url() references
    const fontRegex = /url\(["']?([^"')]+\.(?:woff2?|ttf|otf|eot)[^"')]*?)["']?\)/gi;
    let match;
    while ((match = fontRegex.exec(css)) !== null) {
      urls.add(match[1]);
    }

    return Array.from(urls);
  }

  /**
   * Check if URL points to an image
   */
  private isImageUrl(url: string): boolean {
    // Skip data URLs (already embedded)
    if (url.startsWith("data:")) return false;

    // Skip SVG inline (not file URLs)
    if (url.startsWith("<svg")) return false;

    // Check for image extensions
    const imageExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico"];
    const lowerUrl = url.toLowerCase();
    return imageExts.some((ext) => lowerUrl.includes(ext));
  }

  /**
   * Fetch a single asset and return bundled data
   */
  async fetchAsset(url: string): Promise<BundledAsset | null> {
    try {
      // Handle data URLs - already embedded, skip
      if (url.startsWith("data:")) {
        return null;
      }

      // Fetch the asset
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const content = await response.arrayBuffer();
      const mimeType = response.headers.get("content-type") || getMimeType(url);
      const ext = getExtension(url);

      // Generate local path
      this.assetCounter++;
      const localPath = `assets/asset-${this.assetCounter}${ext}`;

      // Store mapping for URL rewriting
      this.urlMap.set(url, localPath);

      return {
        originalUrl: url,
        localPath,
        content,
        mimeType,
      };
    } catch (error) {
      devWarn("AssetBundler", `Failed to fetch asset: ${url}`, error);
      return null;
    }
  }

  /**
   * Bundle multiple assets in parallel
   */
  async bundleAssets(urls: string[]): Promise<AssetExtractionResult> {
    const assets: BundledAsset[] = [];
    const errors: Array<{ url: string; error: string }> = [];

    // Fetch all assets in parallel
    const results = await Promise.allSettled(urls.map((url) => this.fetchAsset(url)));

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled" && result.value) {
        assets.push(result.value);
      } else if (result.status === "rejected") {
        errors.push({ url: urls[i], error: String(result.reason) });
      }
    }

    return { assets, errors };
  }

  /**
   * Rewrite URLs in HTML to use local paths
   */
  rewriteUrls(html: string, assets: BundledAsset[]): string {
    let result = html;

    for (const asset of assets) {
      // Escape special regex characters in URL
      const escapedUrl = asset.originalUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedUrl, "g");
      result = result.replace(regex, asset.localPath);
    }

    return result;
  }

  /**
   * Rewrite font URLs in CSS to use local paths
   */
  rewriteFontUrls(css: string, assets: BundledAsset[]): string {
    let result = css;

    for (const asset of assets) {
      const escapedUrl = asset.originalUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedUrl, "g");
      result = result.replace(regex, asset.localPath);
    }

    return result;
  }

  /**
   * Get the URL mapping (for debugging/inspection)
   */
  getUrlMap(): Map<string, string> {
    return new Map(this.urlMap);
  }

  /**
   * Reset the bundler state
   */
  reset(): void {
    this.assetCounter = 0;
    this.urlMap.clear();
  }
}

export default AssetBundler;
