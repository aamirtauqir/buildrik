import { z } from "zod";

/**
 * Workspace webhooks (P6, Figma Site boards 176:456…727). One endpoint per
 * workspace; deliveries signed with HMAC-SHA256 of the raw body.
 */

export const WEBHOOK_EVENTS = ["site.publish", "form.submit"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const connectWebhookInput = z.object({
  url: z.string().url().max(2000),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
});
export type ConnectWebhookInput = z.infer<typeof connectWebhookInput>;
