/**
 * Font Manager
 * Manages font library, Google Fonts integration, and custom fonts
 *
 * FRESH IMPLEMENTATION for Aquibra
 *
 * @module engine/fonts/FontManager
 * @license BSD-3-Clause
 */

import type {
  Font,
  GoogleFont,
  CustomFont,
  FontFilter,
  FontLoadOptions,
  FontUploadOptions,
  GoogleFontsConfig,
  FontVariant,
  FontWeight,
  FontStyle,
} from "../../shared/types/fonts";
import type { Composer } from "../Composer";
import { EventEmitter } from "../EventEmitter";

/** Font category type from Google Fonts API */
type FontCategory = "serif" | "sans-serif" | "display" | "handwriting" | "monospace";

/** Google Fonts API item structure */
interface GoogleFontsApiItem {
  family: string;
  category: FontCategory;
  variants: string[];
}

/** Google Fonts API response structure */
interface GoogleFontsApiResponse {
  items: GoogleFontsApiItem[];
}

/**
 * Font Manager
 * Central hub for font management
 */
export class FontManager extends EventEmitter {
  private fonts: Map<string, Font> = new Map();
  private loadedFonts: Set<string> = new Set();
  private googleFontsConfig: GoogleFontsConfig;
  private googleFontsCache: GoogleFont[] | null = null;
  private googleFontsCacheTime: number = 0;

  constructor(_composer: Composer, config?: GoogleFontsConfig) {
    super();

    this.googleFontsConfig = {
      apiUrl: "https://www.googleapis.com/webfonts/v1/webfonts",
      cache: true,
      cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
      ...config,
    };

    // Register system fonts
    this.registerSystemFonts();
  }

  // ============================================
  // System Fonts
  // ============================================

  /**
   * Register common system fonts
   */
  private registerSystemFonts(): void {
    const systemFonts: Font[] = [
      {
        id: "arial",
        family: "Arial",
        source: "system",
        category: "sans-serif",
        variants: [
          { weight: 400, style: "normal" },
          { weight: 700, style: "normal" },
          { weight: 400, style: "italic" },
          { weight: 700, style: "italic" },
        ],
        loaded: true,
      },
      {
        id: "helvetica",
        family: "Helvetica",
        source: "system",
        category: "sans-serif",
        variants: [
          { weight: 400, style: "normal" },
          { weight: 700, style: "normal" },
        ],
        loaded: true,
      },
      {
        id: "times-new-roman",
        family: "Times New Roman",
        source: "system",
        category: "serif",
        variants: [
          { weight: 400, style: "normal" },
          { weight: 700, style: "normal" },
          { weight: 400, style: "italic" },
          { weight: 700, style: "italic" },
        ],
        loaded: true,
      },
      {
        id: "georgia",
        family: "Georgia",
        source: "system",
        category: "serif",
        variants: [
          { weight: 400, style: "normal" },
          { weight: 700, style: "normal" },
        ],
        loaded: true,
      },
      {
        id: "courier-new",
        family: "Courier New",
        source: "system",
        category: "monospace",
        variants: [
          { weight: 400, style: "normal" },
          { weight: 700, style: "normal" },
        ],
        loaded: true,
      },
      {
        id: "verdana",
        family: "Verdana",
        source: "system",
        category: "sans-serif",
        variants: [
          { weight: 400, style: "normal" },
          { weight: 700, style: "normal" },
        ],
        loaded: true,
      },
    ];

    systemFonts.forEach((font) => this.fonts.set(font.id, font));
  }

  // ============================================
  // Google Fonts
  // ============================================

  /**
   * Fetch Google Fonts list
   */
  async fetchGoogleFonts(): Promise<GoogleFont[]> {
    // Check cache
    if (
      this.googleFontsConfig.cache &&
      this.googleFontsCache &&
      Date.now() - this.googleFontsCacheTime < (this.googleFontsConfig.cacheDuration || 0)
    ) {
      return this.googleFontsCache;
    }

    try {
      const url = this.googleFontsConfig.apiKey
        ? `${this.googleFontsConfig.apiUrl}?key=${this.googleFontsConfig.apiKey}&sort=popularity`
        : `${this.googleFontsConfig.apiUrl}?sort=popularity`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Fonts API error: ${response.statusText}`);
      }

      const data: GoogleFontsApiResponse = await response.json();
      const googleFonts: GoogleFont[] = data.items.map(
        (item: GoogleFontsApiItem, index: number) => ({
          id: `google-${item.family.toLowerCase().replace(/\s+/g, "-")}`,
          family: item.family,
          source: "google" as const,
          googleFamily: item.family,
          category: item.category,
          variants: this.parseGoogleFontVariants(item.variants),
          loaded: false,
          popularity: index + 1,
        })
      );

      // Cache results
      if (this.googleFontsConfig.cache) {
        this.googleFontsCache = googleFonts;
        this.googleFontsCacheTime = Date.now();
      }

      // Register fonts
      googleFonts.forEach((font) => {
        if (!this.fonts.has(font.id)) {
          this.fonts.set(font.id, font);
        }
      });

      this.emit("google-fonts:fetched", { count: googleFonts.length });

      return googleFonts;
    } catch (error) {
      this.emit("google-fonts:error", { error });
      return [];
    }
  }

  /**
   * Parse Google Font variants
   */
  private parseGoogleFontVariants(variants: string[]): FontVariant[] {
    const validWeights: FontWeight[] = [100, 200, 300, 400, 500, 600, 700, 800, 900];

    return variants.map((variant) => {
      const isItalic = variant.includes("italic");
      const parsedWeight = parseInt(variant.replace("italic", "")) || 400;
      // Snap to nearest valid weight
      const weight = validWeights.reduce((prev, curr) =>
        Math.abs(curr - parsedWeight) < Math.abs(prev - parsedWeight) ? curr : prev
      );

      return {
        weight,
        style: isItalic ? ("italic" as FontStyle) : ("normal" as FontStyle),
      };
    });
  }

  /**
   * Load Google Font
   */
  async loadGoogleFont(fontId: string, options: FontLoadOptions = {}): Promise<void> {
    const font = this.fonts.get(fontId) as GoogleFont;
    if (!font || font.source !== "google") {
      throw new Error(`Google Font "${fontId}" not found`);
    }

    if (this.loadedFonts.has(fontId)) {
      return; // Already loaded
    }

    try {
      // Build Google Fonts URL
      const variants = options.variants || font.variants;
      const variantStrings = variants.map((v) => {
        const weight = v.weight === 400 ? "" : v.weight;
        const style = v.style === "italic" ? "italic" : "";
        return `${weight}${style}`;
      });

      const fontUrl = `https://fonts.googleapis.com/css2?family=${font.googleFamily.replace(
        /\s+/g,
        "+"
      )}:wght@${variantStrings.join(";")}&display=${options.display || "swap"}`;

      // Load font
      await this.loadFontFromUrl(fontUrl);

      font.loaded = true;
      this.loadedFonts.add(fontId);

      this.emit("font:loaded", { font });

      if (options.onLoad) {
        options.onLoad(font);
      }
    } catch (error) {
      this.emit("font:error", { font, error });

      if (options.onError) {
        options.onError(error as Error);
      }

      throw error;
    }
  }

  // ============================================
  // Custom Fonts
  // ============================================

  /**
   * Upload custom font
   */
  async uploadFont(options: FontUploadOptions): Promise<CustomFont> {
    const fontId = `custom-${options.family.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

    // Convert files to data URLs
    const files: { [key: string]: string } = {};
    for (const [variant, file] of options.files.entries()) {
      const dataUrl = await this.fileToDataUrl(file);
      files[variant] = dataUrl;
    }

    // Parse variants from file names
    const validWeights: FontWeight[] = [100, 200, 300, 400, 500, 600, 700, 800, 900];
    const validStyles: FontStyle[] = ["normal", "italic", "oblique"];

    const variants: FontVariant[] = Array.from(options.files.keys()).map((key) => {
      const [weightStr, styleStr] = key.split("-");
      const parsedWeight = parseInt(weightStr) || 400;
      // Snap to nearest valid weight
      const weight = validWeights.reduce((prev, curr) =>
        Math.abs(curr - parsedWeight) < Math.abs(prev - parsedWeight) ? curr : prev
      );
      // Validate style or default to "normal"
      const style: FontStyle = validStyles.includes(styleStr as FontStyle)
        ? (styleStr as FontStyle)
        : "normal";

      return {
        weight,
        style,
        url: files[key],
      };
    });

    const customFont: CustomFont = {
      id: fontId,
      family: options.family,
      source: "custom",
      category: options.category,
      variants,
      files,
      loaded: false,
      uploadedAt: new Date().toISOString(),
      metadata: options.metadata,
    };

    this.fonts.set(fontId, customFont);

    // Load font
    await this.loadCustomFont(fontId);

    this.emit("font:uploaded", { font: customFont });

    return customFont;
  }

  /**
   * Load custom font
   */
  private async loadCustomFont(fontId: string): Promise<void> {
    const font = this.fonts.get(fontId) as CustomFont;
    if (!font || font.source !== "custom") {
      throw new Error(`Custom font "${fontId}" not found`);
    }

    try {
      // Create @font-face rules
      for (const variant of font.variants) {
        if (!variant.url) continue;

        const fontFace = new FontFace(font.family, `url(${variant.url})`, {
          weight: String(variant.weight),
          style: variant.style,
        });

        await fontFace.load();
        document.fonts.add(fontFace);

        variant.loaded = true;
      }

      font.loaded = true;
      this.loadedFonts.add(fontId);

      this.emit("font:loaded", { font });
    } catch (error) {
      this.emit("font:error", { font, error });
      throw error;
    }
  }

  /**
   * Convert File to data URL
   */
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ============================================
  // Font Management
  // ============================================

  /**
   * Get all fonts
   */
  getAllFonts(filter?: FontFilter): Font[] {
    let fonts = Array.from(this.fonts.values());

    if (filter) {
      // Apply filters
      if (filter.query) {
        const query = filter.query.toLowerCase();
        fonts = fonts.filter((f) => f.family.toLowerCase().includes(query));
      }

      if (filter.category) {
        fonts = fonts.filter((f) => f.category === filter.category);
      }

      if (filter.source) {
        fonts = fonts.filter((f) => f.source === filter.source);
      }

      if (filter.favoritesOnly) {
        fonts = fonts.filter((f) => f.favorite);
      }

      // Sort
      if (filter.sortBy) {
        fonts.sort((a, b) => {
          let aVal: string | number;
          let bVal: string | number;

          switch (filter.sortBy) {
            case "name":
              aVal = a.family.toLowerCase();
              bVal = b.family.toLowerCase();
              break;
            case "popularity":
              aVal = (a as GoogleFont).popularity || 999999;
              bVal = (b as GoogleFont).popularity || 999999;
              break;
            case "date":
              aVal = (a as CustomFont).uploadedAt || "";
              bVal = (b as CustomFont).uploadedAt || "";
              break;
            default:
              return 0;
          }

          if (filter.sortOrder === "desc") {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
          } else {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          }
        });
      }
    }

    return fonts;
  }

  /**
   * Get font by ID
   */
  getFont(fontId: string): Font | undefined {
    return this.fonts.get(fontId);
  }

  /**
   * Toggle font favorite
   */
  toggleFavorite(fontId: string): void {
    const font = this.fonts.get(fontId);
    if (font) {
      font.favorite = !font.favorite;
      this.emit("font:favorite-toggled", { font });
    }
  }

  /**
   * Delete custom font
   */
  deleteFont(fontId: string): void {
    const font = this.fonts.get(fontId);
    if (font && font.source === "custom") {
      this.fonts.delete(fontId);
      this.loadedFonts.delete(fontId);
      this.emit("font:deleted", { font });
    }
  }

  /**
   * Load font from URL
   */
  private loadFontFromUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load font from ${url}`));
      document.head.appendChild(link);
    });
  }

  /**
   * Check if font is loaded
   */
  isLoaded(fontId: string): boolean {
    return this.loadedFonts.has(fontId);
  }

  /**
   * Get loaded fonts
   */
  getLoadedFonts(): Font[] {
    return Array.from(this.loadedFonts)
      .map((id) => this.fonts.get(id))
      .filter(Boolean) as Font[];
  }

  // ============================================
  // Cleanup
  // ============================================

  /**
   * Destroy font manager
   */
  destroy(): void {
    this.fonts.clear();
    this.loadedFonts.clear();
    this.googleFontsCache = null;
    this.removeAllListeners();
  }
}
