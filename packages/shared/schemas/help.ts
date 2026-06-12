import { z } from "zod";

export const helpArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  category: z.string(),
  excerpt: z.string().nullable(),
  readTime: z.number(),
});

export const supportTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  category: z.enum(["GENERAL", "BILLING", "TECHNICAL", "ACCOUNT", "FEATURE", "BUG"]),
  description: z.string().min(20).max(5000),
  // Blob URLs of uploaded attachments (presign -> PUT -> confirm flow).
  attachments: z.array(z.string().url()).max(5).optional(),
});

export const HELP_CATEGORIES = [
  { key: "getting-started", label: "Getting Started", icon: "Rocket" },
  { key: "sites", label: "Managing Sites", icon: "Globe" },
  { key: "team", label: "Team & Permissions", icon: "Users" },
  { key: "billing", label: "Billing & Plans", icon: "CreditCard" },
  { key: "domains", label: "Domains & DNS", icon: "Link" },
  { key: "editor", label: "Using the Editor", icon: "Pencil" },
] as const;

export type HelpArticleData = z.infer<typeof helpArticleSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
