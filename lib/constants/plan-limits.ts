export type PlanName = "FREE" | "PRO" | "BUSINESS";

export type PlanLimitKey =
  | "sites"
  | "pagesPerSite"
  | "customDomains"
  | "teamMembers"
  | "storageMB"
  | "bandwidthMB"
  | "aiGenerations"
  | "fileUploadMaxMB"
  | "formSubmissions"
  | "urlRedirects"
  | "integrations"
  | "analyticsRetentionDays"
  | "shareLinkExpiryMaxDays"
  | "shareLinkPasswords"
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
    fileUploadMaxMB: 10,
    formSubmissions: 100,
    urlRedirects: 100,
    integrations: 0,
    analyticsRetentionDays: 7,
    shareLinkExpiryMaxDays: 7,
    shareLinkPasswords: false,
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
    fileUploadMaxMB: 50,
    formSubmissions: 2500,
    urlRedirects: 500,
    integrations: 2,
    analyticsRetentionDays: 30,
    shareLinkExpiryMaxDays: 30,
    shareLinkPasswords: true,
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
    fileUploadMaxMB: 200,
    formSubmissions: -1,
    urlRedirects: -1,
    integrations: -1,
    analyticsRetentionDays: 90,
    shareLinkExpiryMaxDays: 90,
    shareLinkPasswords: true,
    priceMonthly: 79,
    priceYearly: 63,
  },
};

export function getPlanLimit(plan: PlanName, key: PlanLimitKey): number | boolean {
  return PLAN_LIMITS[plan][key];
}
