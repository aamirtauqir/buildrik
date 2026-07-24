import { z } from "zod";

export const memberAvatarSchema = z.object({
  name: z.string(),
  avatar: z.string().nullable(),
});

export const dashboardStatsSchema = z.object({
  totalSites: z.number(),
  publishedSites: z.number(),
  draftSites: z.number(),
  archivedSites: z.number(),
  monthlyVisits: z.number(),
  visitsChange: z.number(),
  dailyVisitors: z.array(z.number()),
  memberAvatars: z.array(memberAvatarSchema),
  collaborators: z.number(),
  pendingInvites: z.number(),
  lastPublishedSiteName: z.string().nullable(),
  lastPublishedAt: z.date().nullable(),
  memberRole: z.string(),
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
  actorAvatar: z.string().nullable(),
  description: z.string().nullable(),
  siteId: z.string().nullable(),
  // Name of the site the entry acted on, when it has a siteId. Lets the feed
  // say WHICH site changed instead of a bare "Updated 2 settings".
  siteName: z.string().nullable(),
  createdAt: z.date(),
});

export const activityGroupSchema = z.object({
  label: z.string(),
  entries: z.array(activityEntrySchema),
});

export const activityFeedSchema = z.object({
  groups: z.array(activityGroupSchema),
});

export const workspaceHealthSchema = z.object({
  plan: z.enum(["FREE", "PRO", "BUSINESS"]),
  sites: z.object({ used: z.number(), limit: z.number() }),
  storage: z.object({ usedMB: z.number(), limitMB: z.number() }),
  aiCredits: z.object({ used: z.number(), limit: z.number() }),
  bandwidth: z.object({ usedMB: z.number(), limitMB: z.number() }),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type RecentSite = z.infer<typeof recentSiteSchema>;
export type ActivityEntry = z.infer<typeof activityEntrySchema>;
export type ActivityGroup = z.infer<typeof activityGroupSchema>;
export type ActivityFeed = z.infer<typeof activityFeedSchema>;
export type MemberAvatar = z.infer<typeof memberAvatarSchema>;
export type WorkspaceHealth = z.infer<typeof workspaceHealthSchema>;
