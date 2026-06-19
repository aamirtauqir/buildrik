import { z } from "zod";

/**
 * Agency Client node (redesign E2). SSOT for client create/update payloads —
 * services and routers import these, never redefine. Branding fields are the
 * white-label layer (null = inherit workspace / Buildrik default).
 */
export const clientBrandingSchema = z.object({
  logoUrl: z.string().url().nullable().optional(),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex color")
    .nullable()
    .optional(),
  customDomain: z.string().max(253).nullable().optional(),
  hideBuildrik: z.boolean().optional(),
});

export const createClientInput = clientBrandingSchema.extend({
  name: z.string().min(1, "Client name is required").max(80),
});
export type CreateClientInput = z.infer<typeof createClientInput>;

export const updateClientInput = clientBrandingSchema.extend({
  id: z.string().min(1),
  name: z.string().min(1, "Client name is required").max(80).optional(),
});
export type UpdateClientInput = z.infer<typeof updateClientInput>;
