import { z } from "zod";

export const presignSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  context: z.enum(["avatar", "favicon", "touch_icon", "og_image", "workspace_icon", "site_media", "ticket"]),
  siteId: z.string().optional(),
});

export const confirmSchema = z.object({
  fileId: z.string(),
});

export const UPLOAD_LIMITS: Record<string, { formats: string[]; maxSizeMB: number; dimensions?: string }> = {
  avatar: { formats: ["image/jpeg", "image/png"], maxSizeMB: 5, dimensions: "min 100x100, crop 256x256" },
  favicon: { formats: ["image/x-icon", "image/png", "image/svg+xml"], maxSizeMB: 0.5 },
  touch_icon: { formats: ["image/png"], maxSizeMB: 0.5, dimensions: "180x180" },
  og_image: { formats: ["image/jpeg", "image/png"], maxSizeMB: 2, dimensions: "1200x630 recommended" },
  workspace_icon: { formats: ["image/jpeg", "image/png"], maxSizeMB: 1, dimensions: "64x64" },
  site_media: { formats: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "video/mp4", "video/webm"], maxSizeMB: 50 },
  ticket: { formats: ["image/png", "image/jpeg", "application/pdf"], maxSizeMB: 10 },
};

export const CDN_PATHS: Record<string, string> = {
  avatar: "cdn.buildrik.app/avatars/{userId}/{hash}",
  favicon: "cdn.buildrik.app/sites/{siteId}/favicon",
  touch_icon: "cdn.buildrik.app/sites/{siteId}/touch-icon",
  og_image: "cdn.buildrik.app/sites/{siteId}/og-image",
  workspace_icon: "cdn.buildrik.app/workspaces/{wsId}/icon",
  site_media: "cdn.buildrik.app/media/{wsId}/{hash}",
};

export type PresignInput = z.infer<typeof presignSchema>;
export type ConfirmInput = z.infer<typeof confirmSchema>;
