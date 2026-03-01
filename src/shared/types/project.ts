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
  /** Global styles */
  styles: StyleData[];
  /** Assets */
  assets: AssetData[];
  /** Metadata */
  metadata?: ProjectMetadata;
  /** Project-wide settings (analytics, integrations) */
  settings?: ProjectSettings;
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
  /** Design tokens (CSS custom properties) */
  designTokens?: DesignTokenRecord[];
  /** Theme mode preference */
  themeMode?: "light" | "dark" | "system";
  /** Custom code injection (head scripts, body scripts, global CSS) */
  customCode?: CustomCodeConfig;
}

/** Serializable design token for project settings */
export interface DesignTokenRecord {
  name: string;
  value: string;
  category:
    | "colors"
    | "typography"
    | "spacing"
    | "effects"
    | "layout"
    | "icons"
    | "buttons"
    | "forms";
}

/**
 * Site-wide SEO defaults
 */
export interface SiteSEO {
  /** Site name - used in og:site_name */
  siteName?: string;
  /** Default Open Graph image for pages without one */
  defaultOgImage?: string;
  /** Twitter handle (e.g., "@aquibra") - used in twitter:site */
  twitterHandle?: string;
  /** Favicon URL */
  favicon?: string;
  /** Default language (e.g., "en") */
  language?: string;
  /** Social media profile links */
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
