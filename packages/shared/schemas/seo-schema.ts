import { z } from "zod";

/**
 * Site structured data (Settings › SEO › Structured data, FG-009): who is
 * behind the site — an Organization (optionally a local business) or a Person.
 * Only types real content supports; the publish worker turns it into JSON-LD
 * (`packages/shared/seo/jsonLd.ts`).
 *
 * Stored in `Site.projectSettings.seo.schema` (JSON-only, merged like
 * `seo.author`) — no Site column, so no migration is needed to read it.
 */

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour time like 09:00.");
export const OPENING_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

export const LOCAL_BUSINESS_TYPES = [
  "LocalBusiness", "Restaurant", "CafeOrCoffeeShop", "Bakery", "Store", "ClothingStore",
  "ProfessionalService", "LegalService", "AccountingService", "Dentist", "MedicalClinic",
  "BeautySalon", "HairSalon", "HealthClub", "HomeAndConstructionBusiness", "AutoRepair",
] as const;
export type LocalBusinessType = (typeof LOCAL_BUSINESS_TYPES)[number];

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const openingHoursSchema = z
  .object({ days: z.array(z.enum(OPENING_DAYS)).min(1), opens: hhmm, closes: hhmm })
  .refine((h) => h.closes > h.opens, { message: "closes must be after opens", path: ["closes"] });

export const localBusinessSchema = z.object({
  enabled: z.boolean(),
  businessType: z.enum(LOCAL_BUSINESS_TYPES),
  streetAddress: optionalText(200),
  locality: optionalText(100),
  region: optionalText(100),
  postalCode: optionalText(20),
  country: z.string().trim().regex(/^[A-Z]{2}$/, "Use a two-letter country code, like US.").optional().or(z.literal("")),
  telephone: z
    .string()
    .trim()
    .max(40)
    .regex(/^(\+?[0-9][0-9 ()./-]{4,})?$/, "Enter a valid phone number.")
    .optional(),
  priceRange: optionalText(20),
  openingHours: z.array(openingHoursSchema).max(14).optional(),
});
export type LocalBusiness = z.infer<typeof localBusinessSchema>;

const httpsUrl = z.string().url("Enter a full https:// address.").max(2048).optional().or(z.literal(""));

export const seoSiteSchemaSchema = z.discriminatedUnion("entity", [
  z.object({
    entity: z.literal("Organization"),
    name: z.string().trim().min(1, "Enter an organization name.").max(120),
    logoUrl: httpsUrl,
    localBusiness: localBusinessSchema.optional(),
  }),
  z
    .object({
      entity: z.literal("Person"),
      name: z.string().trim().min(1, "Enter a name.").max(120),
      photoUrl: httpsUrl,
    })
    .strict(),
]);
export type SeoSiteSchema = z.infer<typeof seoSiteSchemaSchema>;
