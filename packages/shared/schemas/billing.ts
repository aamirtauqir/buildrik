import { z } from "zod";

export const billingOverviewSchema = z.object({
  plan: z.string(),
  status: z.string(),
  interval: z.string(),
  price: z.number(),
  currency: z.string(),
  cancelAtPeriodEnd: z.boolean(),
  isGrandfathered: z.boolean(),
  currentPeriodEnd: z.date(),
  paymentMethod: z
    .object({
      brand: z.string(),
      last4: z.string(),
      expMonth: z.number(),
      expYear: z.number(),
    })
    .nullable(),
  usage: z.object({
    sites: z.object({ used: z.number(), limit: z.number() }),
    bandwidth: z.object({ usedMB: z.number(), limitMB: z.number() }),
    storage: z.object({ usedMB: z.number(), limitMB: z.number() }),
    teamMembers: z.object({ used: z.number(), limit: z.number() }),
    domains: z.object({ used: z.number(), limit: z.number() }),
    aiCredits: z.object({ used: z.number(), limit: z.number() }),
    formSubmissions: z.object({ used: z.number(), limit: z.number() }),
    redirects: z.object({ used: z.number(), limit: z.number() }),
  }),
});

export const upgradeSchema = z.object({
  planId: z.enum(["PRO", "BUSINESS"]),
  interval: z.enum(["MONTHLY", "YEARLY"]),
});

export const cancelReasonSchema = z.enum([
  "TOO_EXPENSIVE",
  "MISSING_FEATURES",
  "SWITCHING",
  "NOT_USING",
  "TEMPORARY",
  "OTHER",
]);

export type CancelReason = z.infer<typeof cancelReasonSchema>;

/**
 * Our cancel reasons -> Stripe's `cancellation_details.feedback` enum, which is
 * a closed set Stripe rejects anything outside of:
 * customer_service | low_quality | missing_features | other | switched_service
 * | too_complex | too_expensive | unused.
 *
 * TEMPORARY has no Stripe equivalent (pausing is not a cancellation reason
 * there), so it maps to `other` and survives verbatim in `cancelReason`
 * locally. Lives here rather than in billing.service because schemas are the
 * SSOT for anything derived from the enum.
 */
export const STRIPE_CANCEL_FEEDBACK: Record<CancelReason, string> = {
  TOO_EXPENSIVE: "too_expensive",
  MISSING_FEATURES: "missing_features",
  SWITCHING: "switched_service",
  NOT_USING: "unused",
  TEMPORARY: "other",
  OTHER: "other",
};

export const cancelSchema = z.object({
  reason: cancelReasonSchema,
  feedback: z.string().max(500).optional(),
});

export const invoiceSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  pdfUrl: z.string().nullable(),
  periodStart: z.date(),
  periodEnd: z.date(),
  paidAt: z.date().nullable(),
  createdAt: z.date(),
});

export type BillingOverview = z.infer<typeof billingOverviewSchema>;
export type UpgradeInput = z.infer<typeof upgradeSchema>;
export type CancelInput = z.infer<typeof cancelSchema>;
export type InvoiceData = z.infer<typeof invoiceSchema>;
