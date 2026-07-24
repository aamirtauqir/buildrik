import { z } from "zod";

export const inviteMembersSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(10),
  role: z.enum(["ADMIN", "EDITOR", "DESIGNER", "VIEWER"]),
  // Omit for "all sites" access; a non-empty list scopes the invite to those
  // sites. An EMPTY array (chose "specific sites" but picked none) is rejected —
  // it used to silently fall through to unrestricted all-site access.
  siteIds: z.array(z.string()).min(1).optional(),
  message: z.string().max(500).optional(),
});

export const changeRoleSchema = z.object({
  memberId: z.string(),
  role: z.enum(["ADMIN", "EDITOR", "DESIGNER", "VIEWER"]),
});

export const listMembersSchema = z.object({
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(50).default(20),
  role: z.string().optional(),
  status: z.string().optional(),
});

export const memberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fullName: z.string(),
  email: z.string(),
  avatar: z.string().nullable(),
  role: z.string(),
  status: z.string(),
  lastActiveAt: z.date().nullable(),
  joinedAt: z.date(),
  sitesAccess: z.string(),
});

export const teamStatsSchema = z.object({
  total: z.number(),
  active: z.number(),
  pending: z.number(),
});

export type InviteMembersInput = z.infer<typeof inviteMembersSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
export type ListMembersInput = z.infer<typeof listMembersSchema>;
export type MemberData = z.infer<typeof memberSchema>;
export type TeamStats = z.infer<typeof teamStatsSchema>;
