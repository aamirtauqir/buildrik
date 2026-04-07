/**
 * Google Fonts Service
 * AQUI-032: Google Fonts Integration
 *
 * Fetches and manages Google Fonts for the editor
 * Uses the free Google Fonts Developer API (no key required for CSS)
 *
 * @module services/GoogleFontsService
 * @license BSD-3-Clause
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Google Font metadata
 */
export interface GoogleFont {
  /** Font family name */
  family: string;
  /** Available variants (regular, bold, italic, etc.) */
  variants: string[];
  /** Font category (serif, sans-serif, display, handwriting, monospace) */
  category: FontCategory;
  /** Font subsets (latin, latin-ext, cyrillic, etc.) */
  subsets?: string[];
}

/**
 * Font category types
 */
export type FontCategory = "serif" | "sans-serif" | "display" | "handwriting" | "monospace";

/**
 * Font loading options
 */
export interface FontLoadOptions {
  /** Font variants to load (default: ['regular']) */
  variants?: string[];
  /** Font subsets to load (default: ['latin']) */
  subsets?: string[];
}

// ============================================================================
// POPULAR FONTS (Fallback when API is unavailable)
// ============================================================================

const POPULAR_FONTS: GoogleFont[] = [
  { family: "Inter", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Roboto", variants: ["400", "500", "700"], category: "sans-serif" },
  { family: "Open Sans", variants: ["400", "600", "700"], category: "sans-serif" },
  { family: "Lato", variants: ["400", "700"], category: "sans-serif" },
  { family: "Montserrat", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Poppins", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Source Sans Pro", variants: ["400", "600", "700"], category: "sans-serif" },
  { family: "Nunito", variants: ["400", "600", "700"], category: "sans-serif" },
  { family: "Raleway", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Ubuntu", variants: ["400", "500", "700"], category: "sans-serif" },
  { family: "Playfair Display", variants: ["400", "500", "600", "700"], category: "serif" },
  { family: "Merriweather", variants: ["400", "700"], category: "serif" },
  { family: "Lora", variants: ["400", "500", "600", "700"], category: "serif" },
  { family: "PT Serif", variants: ["400", "700"], category: "serif" },
  { family: "Crimson Pro", variants: ["400", "500", "600", "700"], category: "serif" },
  { family: "Fira Code", variants: ["400", "500", "600", "700"], category: "monospace" },
  { family: "JetBrains Mono", variants: ["400", "500", "600", "700"], category: "monospace" },
  { family: "Source Code Pro", variants: ["400", "500", "600", "700"], category: "monospace" },
  { family: "Roboto Mono", variants: ["400", "500", "700"], category: "monospace" },
  { family: "Dancing Script", variants: ["400", "500", "600", "700"], category: "handwriting" },
  { family: "Pacifico", variants: ["400"], category: "handwriting" },
  { family: "Caveat", variants: ["400", "500", "600", "700"], category: "handwriting" },
  { family: "Oswald", variants: ["400", "500", "600", "700"], category: "display" },
  { family: "Bebas Neue", variants: ["400"], category: "display" },
  { family: "Anton", variants: ["400"], category: "display" },
];

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * Google Fonts Service
 * Manages font loading and caching
 */
export class GoogleFontsService {
  private static instance: GoogleFontsService;
  private fonts: GoogleFont[] = POPULAR_FONTS;
  private loadedFonts: Set<string> = new Set();
  private linkElements: Map<string, HTMLLinkElement> = new Map();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): GoogleFontsService {
    if (!GoogleFontsService.instance) {
      GoogleFontsService.instance = new GoogleFontsService();
    }
    return GoogleFontsService.instance;
  }

  /**
   * Get all available fonts
   */
  getFonts(): GoogleFont[] {
    return [...this.fonts];
  }

  /**
   * Search fonts by name
   */
  searchFonts(query: string): GoogleFont[] {
    if (!query.trim()) return this.fonts;

    const lowerQuery = query.toLowerCase();
    return this.fonts.filter(
      (font) => font.family.toLowerCase().includes(lowerQuery) || font.category.includes(lowerQuery)
    );
  }

  /**
   * Get fonts by category
   */
  getFontsByCategory(category: FontCategory): GoogleFont[] {
    return this.fonts.filter((font) => font.category === category);
  }

  /**
   * Get font by family name
   */
  getFont(family: string): GoogleFont | undefined {
    return this.fonts.find((font) => font.family.toLowerCase() === family.toLowerCase());
  }

  /**
   * Check if a font is loaded
   */
  isFontLoaded(family: string): boolean {
    return this.loadedFonts.has(family);
  }

  /**
   * Load a Google Font
   */
  loadFont(family: string, options?: FontLoadOptions): void {
    if (typeof document === "undefined") return;
    if (this.loadedFonts.has(family)) return;

    const font = this.getFont(family);
    if (!font) return;

    // Build variants string
    const variants = options?.variants || ["400"];
    const weightsStr = variants
      .map((v) => v.replace("regular", "400").replace("bold", "700"))
      .join(";");

    // Build Google Fonts URL
    const fontFamily = family.replace(/ /g, "+");
    const url = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@${weightsStr}&display=swap`;

    // Create and append link element
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.id = `gf-${family.replace(/ /g, "-").toLowerCase()}`;
    document.head.appendChild(link);

    this.linkElements.set(family, link);
    this.loadedFonts.add(family);
  }

  /**
   * Unload a font (remove link element)
   */
  unloadFont(family: string): void {
    const link = this.linkElements.get(family);
    if (link) {
      link.remove();
      this.linkElements.delete(family);
      this.loadedFonts.delete(family);
    }
  }

  /**
   * Get all loaded fonts
   */
  getLoadedFonts(): string[] {
    return Array.from(this.loadedFonts);
  }

  /**
   * Generate CSS @import statement for export
   */
  getImportStatement(): string {
    if (this.loadedFonts.size === 0) return "";

    const families = Array.from(this.loadedFonts)
      .map((family) => {
        const font = this.getFont(family);
        const weights =
          font?.variants.map((v) => v.replace("regular", "400").replace("bold", "700")).join(";") ||
          "400";
        return `${family.replace(/ /g, "+")}:wght@${weights}`;
      })
      .join("&family=");

    return `@import url('https://fonts.googleapis.com/css2?family=${families}&display=swap');`;
  }

  /**
   * Generate link tag for HTML export
   */
  getLinkTag(): string {
    if (this.loadedFonts.size === 0) return "";

    const families = Array.from(this.loadedFonts)
      .map((family) => {
        const font = this.getFont(family);
        const weights =
          font?.variants.map((v) => v.replace("regular", "400").replace("bold", "700")).join(";") ||
          "400";
        return `${family.replace(/ /g, "+")}:wght@${weights}`;
      })
      .join("&family=");

    return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${families}&display=swap" rel="stylesheet">`;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get the Google Fonts service instance
 */
export function getGoogleFontsService(): GoogleFontsService {
  return GoogleFontsService.getInstance();
}

/**
 * Load a Google Font
 */
export function loadGoogleFont(family: string, options?: FontLoadOptions): void {
  GoogleFontsService.getInstance().loadFont(family, options);
}

/**
 * Search Google Fonts
 */
export function searchGoogleFonts(query: string): GoogleFont[] {
  return GoogleFontsService.getInstance().searchFonts(query);
}

export default GoogleFontsService;
