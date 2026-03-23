import { z } from "zod";

export const dashboardStatsSchema = z.object({
  totalSites: z.number(),
  publishedSites: z.number(),
  draftSites: z.number(),
  archivedSites: z.number(),
  monthlyVisits: z.number(),
  visitsChange: z.number(),
  collaborators: z.number(),
  pendingInvites: z.number(),
  lastPublishedSiteName: z.string().nullable(),
  lastPublishedAt: z.date().nullable(),
});

export const recentSiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  status: z.string(),
  thumbnail: z.string().nullable(),
  pages: z.number(),
  lastEditedAt: z.date(),
  publishedUrl: z.string().nullable(),
});

export const activityEntrySchema = z.object({
  id: z.string(),
  action: z.string(),
  actorName: z.string().nullable(),
  description: z.string().nullable(),
  siteId: z.string().nullable(),
  createdAt: z.date(),
});

export const workspaceHealthSchema = z.object({
  sites: z.object({ used: z.number(), limit: z.number() }),
  storage: z.object({ usedMB: z.number(), limitMB: z.number() }),
  aiCredits: z.object({ used: z.number(), limit: z.number() }),
  bandwidth: z.object({ usedMB: z.number(), limitMB: z.number() }),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type RecentSite = z.infer<typeof recentSiteSchema>;
export type ActivityEntry = z.infer<typeof activityEntrySchema>;
export type WorkspaceHealth = z.infer<typeof workspaceHealthSchema>;
