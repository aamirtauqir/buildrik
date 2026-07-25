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

/** Map of appId → its config schema. The single place that knows which apps are
 *  head-inject-configurable and how to validate each. */
export const APP_CONFIG_SCHEMAS = {
  "live-chat": liveChatConfigSchema,
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
