import { z } from "zod";

export const listTemplatesSchema = z.object({
  category: z.enum(["ALL", "PORTFOLIO", "BUSINESS", "BLOG", "AGENCY", "ECOMMERCE", "RESTAURANT"]).default("ALL"),
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(20).default(6),
  sort: z.enum(["popular", "newest", "alphabetical"]).default("popular"),
  difficulty: z.enum(["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("ALL"),
  // T2: free-text search over template name + description.
  search: z.string().max(100).optional(),
});

export const generateSiteSchema = z.object({
  name: z.string().min(2).max(100),
  businessType: z.enum(["PORTFOLIO", "BUSINESS", "BLOG", "RESTAURANT", "AGENCY", "ECOMMERCE"]),
  pages: z.array(z.string()).min(1).max(8),
  description: z.string().max(500).optional(),
  tone: z.enum(["professional", "casual", "creative", "minimal", "bold", "playful"]).optional(),
  content: z.enum(["generate", "lorem", "empty"]).optional(),
  images: z.enum(["stock", "placeholders", "none"]).optional(),
});

export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  thumbnail: z.string().nullable(),
  previewUrl: z.string().nullable(),
  usageCount: z.number(),
  isActive: z.boolean(),
});

export const aiJobStatusSchema = z.object({
  id: z.string(),
  status: z.string(),
  progress: z.number(),
  steps: z.array(z.object({ step: z.string(), status: z.string() })).nullable(),
  siteId: z.string().nullable(),
  error: z.string().nullable(),
});

export type ListTemplatesInput = z.infer<typeof listTemplatesSchema>;
export type GenerateSiteInput = z.infer<typeof generateSiteSchema>;
export type TemplateData = z.infer<typeof templateSchema>;
export type AIJobStatus = z.infer<typeof aiJobStatusSchema>;
