/**
 * Font Management Type Definitions
 * Types for font library and management
 *
 * FRESH IMPLEMENTATION for Aquibra
 *
 * @module types/fonts
 * @license BSD-3-Clause
 */

/**
 * Font source type
 */
export type FontSource = "google" | "custom" | "system" | "adobe";

/**
 * Font weight
 */
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/**
 * Font style
 */
export type FontStyle = "normal" | "italic" | "oblique";

/**
 * Font variant
 */
export interface FontVariant {
  /** Weight */
  weight: FontWeight;

  /** Style */
  style: FontStyle;

  /** URL to font file (for custom fonts) */
  url?: string;

  /** Is this variant loaded? */
  loaded?: boolean;
}

/**
 * Font definition
 */
export interface Font {
  /** Unique font ID */
  id: string;

  /** Font family name */
  family: string;

  /** Font source */
  source: FontSource;

  /** Available variants */
  variants: FontVariant[];

  /** Font category */
  category?: "serif" | "sans-serif" | "display" | "handwriting" | "monospace";

  /** Preview text */
  previewText?: string;

  /** Is font loaded? */
  loaded: boolean;

  /** Is font favorite? */
  favorite?: boolean;

  /** Font metadata */
  metadata?: {
    designer?: string;
    license?: string;
    version?: string;
    description?: string;
  };
}

/**
 * Google Font
 */
export interface GoogleFont extends Font {
  source: "google";

  /** Google Fonts API family parameter */
  googleFamily: string;

  /** Popularity rank */
  popularity?: number;
}

/**
 * Custom uploaded font
 */
export interface CustomFont extends Font {
  source: "custom";

  /** Font files */
  files: {
    [key: string]: string; // weight-style -> url
  };

  /** Upload date */
  uploadedAt: string;
}

/**
 * Font filter options
 */
export interface FontFilter {
  /** Search query */
  query?: string;

  /** Filter by category */
  category?: Font["category"];

  /** Filter by source */
  source?: FontSource;

  /** Show only favorites */
  favoritesOnly?: boolean;

  /** Sort by */
  sortBy?: "name" | "popularity" | "date";

  /** Sort order */
  sortOrder?: "asc" | "desc";
}

/**
 * Font load options
 */
export interface FontLoadOptions {
  /** Variants to load */
  variants?: FontVariant[];

  /** Load all variants? */
  loadAll?: boolean;

  /** Display strategy */
  display?: "auto" | "block" | "swap" | "fallback" | "optional";

  /** Callback when loaded */
  onLoad?: (font: Font) => void;

  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Font upload options
 */
export interface FontUploadOptions {
  /** Font family name */
  family: string;

  /** Font files (weight-style -> File) */
  files: Map<string, File>;

  /** Font category */
  category?: Font["category"];

  /** Font metadata */
  metadata?: Font["metadata"];
}

/**
 * Google Fonts API configuration
 */
export interface GoogleFontsConfig {
  /** API key */
  apiKey?: string;

  /** API endpoint */
  apiUrl?: string;

  /** Cache fonts list? */
  cache?: boolean;

  /** Cache duration (ms) */
  cacheDuration?: number;
}
