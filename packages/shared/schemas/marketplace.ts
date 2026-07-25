import { z } from "zod";

/**
 * Config contracts for installable marketplace apps (SSOT). An app's config is
 * validated against its schema here before it is written to WorkspaceApp.config,
 * and the same schema gates whether the app injects anything into published
 * sites. Only apps whose behaviour is a workspace-wide head-inject live here;
 * big features (Commerce, Memberships) and per-page embeds (Typeform) are not
 * configured through this path.
 */

/**
 * Live Chat = Tawk.to. The embed URL is https://embed.tawk.to/<property>/<widget>.
 * Property id is the 24-hex account/property id; widget id is a short
 * alphanumeric (or the literal "default").
 */
export const liveChatConfigSchema = z.object({
  propertyId: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{20,24}$/i, "Property ID looks like a 20–24 character code from your Tawk.to dashboard."),
  widgetId: z
    .string()
    .trim()
    .regex(/^[a-z0-9]{1,20}$/i, "Widget ID is a short code (often 1abc2def3, or “default”)."),
});
export type LiveChatConfig = z.infer<typeof liveChatConfigSchema>;

/** HubSpot tracking code — numeric portal (account) id from Settings → Tracking Code. */
export const hubspotConfigSchema = z.object({
  portalId: z.string().trim().regex(/^\d{4,12}$/, "Portal ID is the numeric Hub ID from HubSpot → Settings → Tracking Code."),
});

/** LinkedIn Insight Tag — numeric partner id from Campaign Manager. */
export const linkedinInsightConfigSchema = z.object({
  partnerId: z.string().trim().regex(/^\d{4,12}$/, "Partner ID is the numeric ID from LinkedIn Campaign Manager → Insight Tag."),
});

/** TikTok Pixel — pixel id from TikTok Events Manager (letters + digits). */
export const tiktokPixelConfigSchema = z.object({
  pixelId: z.string().trim().regex(/^[A-Z0-9]{15,30}$/i, "Pixel ID is the code from TikTok Events Manager (15–30 letters/digits)."),
});

/** Pinterest Tag — numeric tag id from Pinterest Ads. */
export const pinterestTagConfigSchema = z.object({
  tagId: z.string().trim().regex(/^\d{10,20}$/, "Tag ID is the numeric ID from Pinterest → Ads → Conversions."),
});

/**
 * Search-engine ownership verification meta tags. All three fields are optional
 * but at least one must be present. Empty strings are stripped before validation
 * so a partially-filled form is fine.
 */
const verifyToken = z.string().trim().regex(/^[A-Za-z0-9_-]{8,100}$/, "Verification code is the token from the HTML-tag method (letters, digits, - and _).");
export const siteVerificationConfigSchema = z.preprocess(
  (raw) => {
    if (!raw || typeof raw !== "object") return raw;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim() !== "") out[k] = v.trim();
    }
    return out;
  },
  z
    .object({
      google: verifyToken.optional(),
      bing: verifyToken.optional(),
      pinterest: verifyToken.optional(),
    })
    .refine((c) => !!(c.google || c.bing || c.pinterest), { message: "Enter at least one verification code." }),
);

/** Map of appId → its config schema. The single place that knows which apps are
 *  head-inject-configurable and how to validate each. */
export const APP_CONFIG_SCHEMAS = {
  "live-chat": liveChatConfigSchema,
  hubspot: hubspotConfigSchema,
  "linkedin-insight": linkedinInsightConfigSchema,
  "tiktok-pixel": tiktokPixelConfigSchema,
  "pinterest-tag": pinterestTagConfigSchema,
  "site-verification": siteVerificationConfigSchema,
} as const;

export type ConfigurableAppId = keyof typeof APP_CONFIG_SCHEMAS;

export function isConfigurableApp(appId: string): appId is ConfigurableAppId {
  return appId in APP_CONFIG_SCHEMAS;
}

/** Validate raw config for an app. Throws ZodError on bad input; returns the
 *  parsed, trimmed config. */
export function parseAppConfig(appId: ConfigurableAppId, raw: unknown) {
  return APP_CONFIG_SCHEMAS[appId].parse(raw);
}

/** tRPC input: which app + its config object. appId is checked against the
 *  configurable set in the service (keeps this schema free of the catalog). */
export const configureAppInput = z.object({
  appId: z.string().min(1).max(64),
  config: z.record(z.string(), z.unknown()),
});
export type ConfigureAppInput = z.infer<typeof configureAppInput>;
