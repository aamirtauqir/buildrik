import { z } from "zod";

export const ElementDataSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.string(),
    tagName: z.string().optional(),
    attributes: z.record(z.string()).optional(),
    classes: z.string().array().optional(),
    styles: z.record(z.string()).optional(),
    breakpointStyles: z.record(z.record(z.string())).optional(),
    content: z.string().optional(),
    children: z.array(ElementDataSchema).optional(),
    traits: z.array(z.object({ type: z.string(), name: z.string(), label: z.string().optional(), value: z.any().optional() })).optional(),
    draggable: z.boolean().optional(),
    droppable: z.boolean().optional(),
    resizable: z.boolean().optional(),
  })
);

export const PageDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  isHome: z.boolean().optional(),
  root: ElementDataSchema.optional(),
  settings: z.any().optional(),
  updatedAt: z.string().optional(),
  slugManuallySet: z.boolean().optional(),
  slugHistory: z.array(z.object({ slug: z.string(), timestamp: z.string() })).optional(),
});

export const ProjectDataSchema = z.object({
  version: z.string(),
  pages: z.array(PageDataSchema),
  pagesOrder: z.string().array().optional(),
  styles: z.array(z.any()),
  assets: z.array(z.any()),
  metadata: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export type ValidatedProjectData = z.infer<typeof ProjectDataSchema>;
