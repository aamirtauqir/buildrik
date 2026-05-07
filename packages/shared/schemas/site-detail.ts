import { z } from "zod";

export const siteOverviewSchema = z.object({
  site: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    status: z.string(),
    publishedUrl: z.string().nullable(),
    lastPublishedAt: z.date().nullable(),
    lastPublishedBy: z.string().nullable(),
    createdAt: z.date(),
  }),
  stats: z.object({
    totalPages: z.number(),
    monthlyVisitors: z.number(),
    visitorsChange: z.number(),
    teamMembers: z.number(),
    formSubmissions: z.number(),
    unreadSubmissions: z.number(),
    healthScore: z.number(),
    healthBreakdown: z.object({
      seo: z.number(),
      content: z.number(),
      ssl: z.number(),
      favicon: z.number(),
    }),
  }),
  formBlocks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    _count: z.object({ submissions: z.number() }),
  })),
  recentActivity: z.array(z.object({
    id: z.string(),
    action: z.string(),
    description: z.string().nullable(),
    createdAt: z.date(),
  })),
});

export const updateSiteSettingsSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(3).max(50).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaTitleTemplate: z.string().optional(),
  ogImage: z.string().url().nullable().optional(),
  headCode: z.string().max(10240).optional(),
  bodyCode: z.string().max(10240).optional(),
  socialLinks: z.record(z.string()).optional(),
  publishedPassword: z.string().nullable().optional(),
  touchIcon: z.string().nullable().optional(),
  cspPolicy: z.string().max(4096).nullable().optional(),
  hstsMaxAge: z.number().int().min(0).max(63072000).nullable().optional(),
  xFrameOptions: z.enum(["DENY", "SAMEORIGIN"]).nullable().optional(),
  referrerPolicy: z.enum([
    "no-referrer",
    "no-referrer-when-downgrade",
    "origin",
    "origin-when-cross-origin",
    "same-origin",
    "strict-origin",
    "strict-origin-when-cross-origin",
    "unsafe-url",
  ]).nullable().optional(),
  permissionsPolicy: z.string().max(2048).nullable().optional(),
  defaultLocale: z.string().min(2).max(10).optional(),
  enabledLocales: z.array(z.string().min(2).max(10)).min(1).max(50).optional(),
});

export const createRedirectSchema = z.object({
  siteId: z.string(),
  fromPath: z.string().startsWith("/"),
  toUrl: z.string(),
  type: z.enum(["301", "302"]),
});

export const connectDomainSchema = z.object({
  siteId: z.string(),
  domain: z.string().min(3),
});

export const createShareLinkSchema = z.object({
  siteId: z.string(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).optional(),
  expiresInDays: z.number().min(1).max(90).optional(),
});

export const siteAnalyticsQuerySchema = z.object({
  siteId: z.string(),
  range: z.enum(["today", "yesterday", "7d", "30d", "90d"]).default("7d"),
  granularity: z.enum(["hourly", "daily", "weekly", "monthly"]).default("daily"),
});

export type SiteOverview = z.infer<typeof siteOverviewSchema>;
export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>;
export type CreateRedirectInput = z.infer<typeof createRedirectSchema>;
export type ConnectDomainInput = z.infer<typeof connectDomainSchema>;
export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;
export type SiteAnalyticsQuery = z.infer<typeof siteAnalyticsQuerySchema>;
