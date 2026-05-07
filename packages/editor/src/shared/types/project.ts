/**
 * Project & Page Data Types
 * Types for project structure, pages, settings, and integrations
 *
 * @module types/project
 * @license BSD-3-Clause
 */

import type { AssetData } from "./asset";
import type { ElementData } from "./element";
import type { StyleData } from "./style";

// ============================================
// Project Data Types
// ============================================

/**
 * Dashboard project listing (Prompt 2 compliance)
 * Used by the Dashboard screen to display project cards
 */
export interface DashboardProject {
  id: string;
  name: string;
  thumbnail?: string;
  pageCount: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface ProjectData {
  /** Project version */
  version: string;
  /** Pages */
  pages: PageData[];
  /** Ordered list of page IDs (drag-to-reorder source of truth) */
  pagesOrder?: string[];
  /** Global styles */
  styles: StyleData[];
  /** Assets */
  assets: AssetData[];
  /** Metadata */
  metadata?: ProjectMetadata;
  /** Project-wide settings (analytics, integrations) */
  settings?: ProjectSettings;
  /**
   * DS schema version of the persisted project payload. v0 = pre-A.1
   * (color/spacing/type only). v1 = A.1 (+ 11 new token kinds seeded).
   * Migration runner reads this to decide whether to bump and seed.
   */
  dsSchemaVersion?: number;
}

export interface ProjectMetadata {
  /** Project name */
  name?: string;
  /** Created timestamp */
  createdAt?: string;
  /** Updated timestamp */
  updatedAt?: string;
  /** Author */
  author?: string;
  /** Analytics configuration */
  analytics?: AnalyticsConfig;
  /**
   * Custom domain for this project (e.g., "acme.com"). Used to build real
   * page URLs in copy-link, SEO previews, and redirects. When unset the UI
   * falls back to the platform default (e.g., "yoursite.aquibra.io").
   */
  domain?: string;
}

/**
 * Analytics tracking configuration
 */
export interface AnalyticsConfig {
  /** Google Analytics configuration */
  googleAnalytics?: {
    /** Enable GA tracking in exports */
    enabled: boolean;
    /** GA4 Measurement ID (e.g., G-XXXXXXXXXX) */
    measurementId: string;
  };
  /** Facebook Pixel configuration (P1-2) */
  facebookPixel?: {
    enabled: boolean;
    pixelId: string;
  };
  /** Google Ads configuration (P1-2) */
  googleAds?: {
    enabled: boolean;
    conversionId: string;
  };
  /** Cookie consent banner configuration (GDPR) */
  cookieConsent?: {
    enabled: boolean;
  };
}

/**
 * Forward-compatible per-page metadata. Persisted as Page.meta JSONB column.
 *
 * Phase -1 wiring: editor includes this in `composer.exportProject()` output;
 * sites.saveProject persists via `Page.meta`; BuildrikSyncProvider.loadProject
 * restores it on next load. REGRESSION-1: applied-template state survives reload.
 *
 * Forward-compat: extra unknown keys are preserved through save/load. Newer
 * editor builds can write fields older builds don't recognize without losing data.
 */
export interface PageMeta {
  /** Templates applied to this page (latest at end). Drives applied-template badge. */
  appliedTemplates?: Array<{
    templateId: string;
    /** Optional semver — populated once Phase B template versions ship. */
    version?: string;
    /** ISO8601 apply timestamp. */
    appliedAt: string;
  }>;
  /** Forward-compat catch-all — unknown keys preserved through round-trip. */
  [key: string]: unknown;
}

export interface PageData {
  /** Page ID */
  id: string;
  /** Page name */
  name: string;
  /** Page slug */
  slug?: string;
  /** Is this the home/landing page */
  isHome?: boolean;
  /** Root element */
  root: ElementData;
  /** Page-specific styles */
  styles?: StyleData[];
  /** Page settings */
  settings?: PageSettings;
  /**
   * Per-page metadata (applied templates, forward-compat keys).
   * Phase -1: persisted via Page.meta JSONB column.
   */
  meta?: PageMeta;
  /** ISO8601 timestamp of the most recent meaningful mutation (name, slug, settings, content) */
  updatedAt?: string;
  /**
   * True when the current slug was entered by the user in settings; false when
   * auto-derived from the page name. Controls whether "rename → auto-update slug"
   * is offered. Legacy pages (undefined) are treated as false (conservative).
   */
  slugManuallySet?: boolean;
  /**
   * Append-only history of prior slugs for this page, used to generate 301
   * redirects on export. Capped at 100 entries; oldest entries drop off.
   */
  slugHistory?: SlugChange[];
}

/** One slug change event for redirect generation */
export interface SlugChange {
  /** Prior slug (the value being redirected FROM) */
  slug: string;
  /** ISO8601 timestamp when the slug changed */
  changedAt: string;
}

export interface PageSettings {
  /** Page title */
  title?: string;
  /** Meta description */
  description?: string;
  /** Custom head content */
  head?: string;
  /** SEO metadata */
  seo?: PageSEO;
  /** Page visibility / publication status */
  visibility?: "live" | "hidden" | "password";
  /** Access password (used when visibility = "password") */
  password?: string;
}

/**
 * SEO metadata for page-level search engine optimization
 */
export interface PageSEO {
  /** Custom meta title (defaults to page title) */
  metaTitle?: string;
  /** Meta description for search engines */
  metaDescription?: string;
  /** Open Graph image URL */
  ogImage?: string;
  /** Open Graph title (defaults to metaTitle) */
  ogTitle?: string;
  /** Open Graph description (defaults to metaDescription) */
  ogDescription?: string;
  /** Twitter card type */
  twitterCard?: "summary" | "summary_large_image";
  /** Twitter title (defaults to metaTitle) */
  twitterTitle?: string;
  /** Twitter description (defaults to metaDescription) */
  twitterDescription?: string;
  /** Twitter image URL (defaults to ogImage) */
  twitterImage?: string;
  /** Prevent search engine indexing */
  noIndex?: boolean;
  /** Prevent search engines from following links */
  noFollow?: boolean;
  /** Canonical URL for duplicate content */
  canonicalUrl?: string;
  /** JSON-LD structured data */
  structuredData?: Record<string, unknown>;
}

// ============================================
// Project Settings Types
// ============================================

/**
 * Project-wide settings for analytics and integrations
 */
export interface ProjectSettings {
  /** Analytics tracking configuration */
  analytics?: AnalyticsConfig;
  /** Third-party service integrations */
  integrations?: IntegrationsConfig;
  /** Site-level SEO defaults */
  seo?: SiteSEO;
  /** Publishing configuration */
  publishing?: PublishingConfig;
  /**
   * Schema version for designTokens array. See DS V1 spec §9.
   * Absent = treated as 1 (pre-DS-V1 projects).
   * Bumped when token names rename/split/remove.
   */
  designTokensSchemaVersion?: number;
  /** Design tokens (CSS custom properties) */
  designTokens?: DesignTokenRecord[];
  /** Custom code injection (head scripts, body scripts, global CSS) */
  customCode?: CustomCodeConfig;
}

/** Serializable design token for project settings */
export interface DesignTokenRecord {
  id: string;
  name: string;
  value: string;
  cssVar: string;
  category:
    | "colors"
    | "typography"
    | "spacing"
    | "effects"
    | "layout"
    | "icons"
    | "buttons"
    | "forms";
  type?: string;
  group?: string;
}

/**
 * Site-wide SEO defaults
 *
 * P0.2b SSOT: fields below marked [Site column] persist to dashboard
 * Site table via siteDetail.settings.update tRPC. Other fields stay
 * in projectSettings JSON.
 */
export interface SiteSEO {
  /** Site name - used in og:site_name */
  siteName?: string;
  /** [Site column] Default meta title (overrides per-page if set) */
  metaTitle?: string;
  /** [Site column] Default meta description */
  metaDescription?: string;
  /** [Site column] Title template, e.g. "{page} — Site Name" */
  metaTitleTemplate?: string;
  /** [Site column] Default Open Graph image (also `ogImage` server-side) */
  defaultOgImage?: string;
  /** Twitter handle (e.g., "@aquibra") - used in twitter:site */
  twitterHandle?: string;
  /** Favicon URL */
  favicon?: string;
  /** [Site column] Apple touch icon URL */
  touchIcon?: string;
  /** Default language (e.g., "en") */
  language?: string;
  /** [Site column] Social media profile links (server: socialLinks JSON) */
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
  };
}

/**
 * Publishing configuration for deployment integrations
 */
export interface PublishingConfig {
  /** Active provider */
  provider?: "vercel" | "netlify" | "github";
  /** [Site column] Published-site password gate (Argon2-hashed server-side) */
  publishedPassword?: string | null;
  /** Last deployment info */
  lastDeployment?: {
    id: string;
    url: string;
    createdAt: string;
    status: "ready" | "error";
  };
}

/**
 * Third-party service integrations configuration
 */
export interface IntegrationsConfig {
  /** Email service integration for form submissions */
  email?: EmailServiceConfig;
  /** Stripe payment integration */
  stripe?: StripeConfig;
}

/**
 * Stripe Checkout configuration
 */
export interface StripeConfig {
  /** Whether Stripe integration is enabled */
  enabled: boolean;
  /** Stripe publishable key (pk_test_... or pk_live_...) */
  publishableKey: string;
  /** Checkout mode: 'payment-links' for simple or 'api' for advanced */
  checkoutMode: "payment-links" | "api";
  /** Backend API endpoint for 'api' mode */
  checkoutEndpoint?: string;
  /** Success redirect URL after payment */
  successUrl?: string;
  /** Cancel redirect URL */
  cancelUrl?: string;
  /** Currency code */
  currency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD";
}

/**
 * Email service provider configuration
 */
export interface EmailServiceConfig {
  /** Email service provider */
  provider: "mailchimp" | "sendgrid" | "mailgun" | "resend" | "none";
  /** API key for the email service */
  apiKey?: string;
  /** Mailing list ID for subscriber management */
  listId?: string;
  /** Whether email integration is enabled */
  enabled: boolean;
}

/**
 * Custom code injection configuration
 */
export interface CustomCodeConfig {
  headScripts: string;
  bodyScripts: string;
  globalCss: string;
}
