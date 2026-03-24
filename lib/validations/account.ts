import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[!@#$%^&*()]/),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(3).max(30).optional(),
  defaultLanguage: z.string().optional(),
  timezone: z.string().optional(),
});

export const workspaceSharingSettingsSchema = z.object({
  defaultExpiration: z.string().nullable().optional(),
  requirePw: z.boolean().optional(),
  allowEditors: z.boolean().optional(),
  notify: z.boolean().optional(),
});

export const addIntegrationSchema = z.object({
  provider: z.enum(["GOOGLE_ANALYTICS", "MAILCHIMP", "ZAPIER", "SLACK"]),
  config: z.record(z.unknown()),
});

export const notificationPrefSchema = z.object({
  category: z.string(),
  inApp: z.boolean(),
  email: z.enum(["instant", "digest", "off"]),
});

export const deleteAccountSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddIntegrationInput = z.infer<typeof addIntegrationSchema>;
export type NotificationPrefInput = z.infer<typeof notificationPrefSchema>;
