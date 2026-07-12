import { z } from "zod";

/** BCP-47 language tag: `en`, `en-US`, `pt-BR`, `zh-Hans-CN`. */
const BCP47_LANG = /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-[A-Z]{2})?$/;

/** IANA timezone: `Area/Subarea` or `UTC`. Loose check — full IANA list
 *  isn't worth shipping in shared, but the shape catches typos. */
const IANA_TZ = /^(?:UTC|[A-Z][A-Za-z_]+(?:\/[A-Z][A-Za-z_]+){1,2})$/;

/** DNS-friendly slug: lowercase alphanumeric + hyphens, no leading/trailing
 *  hyphen, no consecutive hyphens. Reserved for URL paths. */
const URL_SLUG = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  language: z.string().regex(BCP47_LANG, "Must be a BCP-47 language tag (e.g. en, en-US)").optional(),
  timezone: z.string().regex(IANA_TZ, "Must be an IANA timezone (e.g. America/New_York or UTC)").optional(),
  // CDN URL from the upload flow, or null to clear. http(s) only — blob:/data:
  // previews must never be persisted.
  avatar: z.string().url().startsWith("http").nullable().optional(),
});

export const changeEmailSchema = z.object({
  // Normalize case-insensitively so the stored address stays lowercase and
  // matches case-insensitive login. Keeps the whole email pipeline consistent.
  newEmail: z.string().trim().toLowerCase().email(),
  password: z.string().optional().default(""),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[!@#$%^&*()]/),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

// Initial password for OAuth-only accounts (no current password to verify).
export const setPasswordSchema = z.object({
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[!@#$%^&*()]/),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(3).max(30).regex(URL_SLUG, "Must be a DNS-friendly slug").optional(),
  defaultLanguage: z.string().regex(BCP47_LANG, "Must be a BCP-47 language tag").optional(),
  timezone: z.string().regex(IANA_TZ, "Must be an IANA timezone").optional(),
  iconUrl: z.string().url().nullable().optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  // m-approval: workspace-wide gate — edits go through review before publish.
  editsRequireApproval: z.boolean().optional(),
});

// W1: create an additional workspace (plan-gated server-side).
export const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(60),
});

export const workspaceSharingSettingsSchema = z.object({
  defaultExpiration: z.string().nullable().optional(),
  requirePw: z.boolean().optional(),
  allowEditors: z.boolean().optional(),
  notify: z.boolean().optional(),
});

/**
 * Manual / config-blob integrations. Vercel is INTENTIONALLY excluded —
 * it ships as an OAuth-only integration via `vercelIntegrationsRouter`
 * which writes `provider="vercel"` (lowercase) directly. Adding "VERCEL"
 * here previously produced a footgun: callers could write uppercase
 * "VERCEL" rows that `integrations.service.ts` lowercase lookups never
 * find — silent duplicates that orphaned the OAuth flow.
 */
export const addIntegrationSchema = z.object({
  provider: z.enum(["GOOGLE_ANALYTICS", "MAILCHIMP", "ZAPIER", "SLACK"]),
  config: z.record(z.unknown()),
});

export const notificationPrefSchema = z.object({
  category: z.string(),
  inApp: z.boolean(),
  email: z.enum(["instant", "digest", "off"]),
});

export const deleteAccountSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const updatePreferencesSchema = z.object({
  siteViewMode: z.enum(["grid", "list"]).optional(),
  siteViewSort: z.string().optional(),
  analyticsRange: z.enum(["7d", "30d", "90d"]).optional(),
  theme: z.enum(["light"]).optional(),
  locale: z.string().optional(),
  editorDensity: z.enum(["full", "fewer"]).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddIntegrationInput = z.infer<typeof addIntegrationSchema>;
export type NotificationPrefInput = z.infer<typeof notificationPrefSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
