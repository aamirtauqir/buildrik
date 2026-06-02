export type PlanName = "FREE" | "PRO" | "BUSINESS";

export type PlanLimitKey =
  | "sites"
  | "pagesPerSite"
  | "customDomains"
  | "teamMembers"
  | "storageMB"
  | "bandwidthMB"
  | "aiGenerations"
  | "aiPromptsPerDay"
  | "fileUploadMaxMB"
  | "formSubmissions"
  | "urlRedirects"
  | "integrations"
  | "analyticsRetentionDays"
  | "shareLinkExpiryMaxDays"
  | "shareLinkPasswords"
  | "assetVersionsCap"
  | "templateVersionsCap"
  | "priceMonthly"
  | "priceYearly";

type PlanLimits = Record<PlanLimitKey, number | boolean>;

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  FREE: {
    sites: 3,
    pagesPerSite: 10,
    customDomains: 0,
    teamMembers: 1,
    storageMB: 500,
    bandwidthMB: 1024,
    aiGenerations: 3,
    aiPromptsPerDay: 10,
    fileUploadMaxMB: 10,
    formSubmissions: 100,
    urlRedirects: 100,
    integrations: 0,
    analyticsRetentionDays: 7,
    shareLinkExpiryMaxDays: 7,
    shareLinkPasswords: false,
    assetVersionsCap: 5,
    templateVersionsCap: -1,
    priceMonthly: 0,
    priceYearly: 0,
  },
  PRO: {
    sites: 15,
    pagesPerSite: 30,
    customDomains: 3,
    teamMembers: 5,
    storageMB: 5120,
    bandwidthMB: 10240,
    aiGenerations: 20,
    aiPromptsPerDay: 200,
    fileUploadMaxMB: 50,
    formSubmissions: 2500,
    urlRedirects: 500,
    integrations: 2,
    analyticsRetentionDays: 30,
    shareLinkExpiryMaxDays: 30,
    shareLinkPasswords: true,
    assetVersionsCap: 25,
    templateVersionsCap: -1,
    priceMonthly: 29,
    priceYearly: 23,
  },
  BUSINESS: {
    sites: 50,
    pagesPerSite: 50,
    customDomains: 20,
    teamMembers: 25,
    storageMB: 51200,
    bandwidthMB: 102400,
    aiGenerations: -1,
    aiPromptsPerDay: -1,
    fileUploadMaxMB: 200,
    formSubmissions: -1,
    urlRedirects: -1,
    integrations: -1,
    analyticsRetentionDays: 90,
    shareLinkExpiryMaxDays: 90,
    shareLinkPasswords: true,
    assetVersionsCap: 100,
    templateVersionsCap: -1,
    priceMonthly: 79,
    priceYearly: 63,
  },
};

export function getPlanLimit(plan: PlanName, key: PlanLimitKey): number | boolean {
  return PLAN_LIMITS[plan][key];
}

/**
 * Per-tier AI model policy. The client may send a preferred model, but the
 * server treats it as a hint only: an unlisted (e.g. premium) model requested
 * by a lower tier is ignored in favour of that tier's `default`. Model ids must
 * match `server/services/types.ts` `modelSchema` exactly (validated at the
 * router via `modelSchema.parse`).
 */
export const PLAN_MODELS: Record<PlanName, { default: string; allowed: string[] }> = {
  FREE: {
    default: "claude-haiku-4-5",
    allowed: ["claude-haiku-4-5", "gpt-4o-mini"],
  },
  PRO: {
    default: "claude-sonnet-4-6",
    allowed: ["claude-haiku-4-5", "claude-sonnet-4-6", "gpt-4o-mini"],
  },
  BUSINESS: {
    default: "claude-opus-4-7",
    allowed: [
      "claude-opus-4-7",
      "claude-sonnet-4-6",
      "claude-haiku-4-5",
      "gpt-4o-mini",
    ],
  },
};
