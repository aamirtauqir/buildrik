/**
 * Form Settings Types
 * Types for form submission handling
 *
 * @module types/seo
 * @license BSD-3-Clause
 */

// ============================================================================
// FORM SETTINGS (for form elements)
// ============================================================================

export interface FormSettings {
  /** Form submission provider */
  provider: "formspree" | "custom";
  /** Formspree form ID (e.g., "xyzabc123") */
  formId?: string;
  /** Custom form action URL */
  actionUrl?: string;
  /** Redirect URL after successful submission */
  successRedirect?: string;
  /** Custom email subject for Formspree */
  emailSubject?: string;
}

// ============================================================================
// SOCIAL PREVIEW (for UI components)
// ============================================================================

export type SocialPlatform = "google" | "facebook" | "twitter";

export interface SocialPreviewData {
  /** Preview title */
  title: string;
  /** Preview description */
  description: string;
  /** Preview image URL */
  image?: string;
  /** Site URL */
  url: string;
  /** Site name */
  siteName?: string;
}
