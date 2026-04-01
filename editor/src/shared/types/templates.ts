/**
 * Template System Type Definitions
 * Types for template management and marketplace
 *
 * FRESH IMPLEMENTATION for Aquibra
 *
 * @module types/templates
 * @license BSD-3-Clause
 */

import type { ProjectData } from "./index";

/**
 * Template category
 */
export type TemplateCategory =
  | "landing-page"
  | "portfolio"
  | "blog"
  | "ecommerce"
  | "dashboard"
  | "email"
  | "marketing"
  | "business"
  | "creative"
  | "other";

/**
 * Template metadata
 */
export interface TemplateMetadata {
  /** Unique template ID */
  id: string;

  /** Template name */
  name: string;

  /** Description */
  description?: string;

  /** Category */
  category: TemplateCategory;

  /** Tags for search */
  tags?: string[];

  /** Author information */
  author?: {
    name: string;
    url?: string;
    avatar?: string;
  };

  /** Preview image URL */
  thumbnail?: string;

  /** Full preview images */
  previews?: string[];

  /** Version */
  version?: string;

  /** Creation date */
  createdAt?: string;

  /** Last updated */
  updatedAt?: string;

  /** Is this a premium template? */
  premium?: boolean;

  /** Price (if premium) */
  price?: number;

  /** Number of downloads/uses */
  downloads?: number;

  /** Rating (0-5) */
  rating?: number;

  /** License type */
  license?: "free" | "personal" | "commercial" | "custom";
}

/**
 * Template data
 */
export interface Template extends TemplateMetadata {
  /** Project data (elements, styles, etc.) */
  data: ProjectData;
}

/**
 * Template source configuration
 */
export interface TemplateSource {
  /** Source type */
  type: "local" | "api" | "custom";

  /** API endpoint (for API source) */
  endpoint?: string;

  /** Custom fetch function */
  fetch?: () => Promise<Template[]>;

  /** Authentication headers */
  headers?: Record<string, string>;
}

/**
 * Template filter options
 */
export interface TemplateFilter {
  /** Filter by category */
  category?: TemplateCategory;

  /** Filter by tags */
  tags?: string[];

  /** Search query */
  query?: string;

  /** Show only free templates */
  freeOnly?: boolean;

  /** Minimum rating */
  minRating?: number;

  /** Sort by */
  sortBy?: "name" | "date" | "downloads" | "rating";

  /** Sort order */
  sortOrder?: "asc" | "desc";
}

/**
 * Template load options
 */
export interface TemplateLoadOptions {
  /** Replace current project? */
  replace?: boolean;

  /** Merge with current project? */
  merge?: boolean;

  /** Custom merge strategy */
  mergeStrategy?: "append" | "prepend" | "replace";

  /** Callback before load */
  onBeforeLoad?: (template: Template) => boolean | Promise<boolean>;

  /** Callback after load */
  onAfterLoad?: (template: Template) => void | Promise<void>;
}

/**
 * Template save options
 */
export interface TemplateSaveOptions {
  /** Template metadata */
  metadata: Omit<TemplateMetadata, "id">;

  /** Include current project data */
  includeData?: boolean;

  /** Generate thumbnail automatically? */
  generateThumbnail?: boolean;

  /** Thumbnail options */
  thumbnailOptions?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}

/**
 * Template marketplace configuration
 */
export interface TemplateMarketplaceConfig {
  /** API endpoint */
  apiUrl: string;

  /** API key */
  apiKey?: string;

  /** Enable caching */
  cache?: boolean;

  /** Cache duration (ms) */
  cacheDuration?: number;

  /** Enable analytics */
  analytics?: boolean;
}
