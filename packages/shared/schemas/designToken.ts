import { z } from "zod";

export const TokenKindSchema = z.enum([
  "color", "type", "spacing",
  "radius", "shadow", "motion",
  "border", "opacity", "zindex",
  "breakpoint", "grid", "sizing",
  "icon", "imagery",
]);

export type TokenKind = z.infer<typeof TokenKindSchema>;

const ColorValueSchema    = z.object({ kind: z.literal("color"),    value: z.string().min(1) });
const TypeValueSchema     = z.object({ kind: z.literal("type"),     family: z.string().min(1), weight: z.number().int().min(100).max(900).optional(), size: z.string().optional(), lineHeight: z.string().optional() });
const SpacingValueSchema  = z.object({ kind: z.literal("spacing"),  value: z.string().min(1) });
const RadiusValueSchema   = z.object({ kind: z.literal("radius"),   value: z.string().min(1) });
const ShadowValueSchema   = z.object({ kind: z.literal("shadow"),   value: z.string().min(1) });
const MotionValueSchema   = z.object({ kind: z.literal("motion"),   duration: z.string().regex(/^\d+(\.\d+)?(ms|s)$/), easing: z.string().min(1) });
const BorderValueSchema   = z.object({ kind: z.literal("border"),   width: z.string().min(1), style: z.string().min(1), color: z.string().optional() });
const OpacityValueSchema  = z.object({ kind: z.literal("opacity"),  value: z.number().min(0).max(1) });
const ZindexValueSchema   = z.object({ kind: z.literal("zindex"),   value: z.number().int() });
const BreakpointValueSchema = z.object({ kind: z.literal("breakpoint"), value: z.string().regex(/^\d+(px|rem|em)$/) });
const GridValueSchema     = z.object({ kind: z.literal("grid"),     columns: z.number().int().positive(), gap: z.string().optional() });
const SizingValueSchema   = z.object({ kind: z.literal("sizing"),   value: z.string().min(1) });
const IconValueSchema     = z.object({ kind: z.literal("icon"),     name: z.string().min(1), size: z.string().optional() });
const ImageryValueSchema  = z.object({ kind: z.literal("imagery"),  url: z.string().url(), alt: z.string().optional() });

export const TokenValueSchema = z.discriminatedUnion("kind", [
  ColorValueSchema,
  TypeValueSchema,
  SpacingValueSchema,
  RadiusValueSchema,
  ShadowValueSchema,
  MotionValueSchema,
  BorderValueSchema,
  OpacityValueSchema,
  ZindexValueSchema,
  BreakpointValueSchema,
  GridValueSchema,
  SizingValueSchema,
  IconValueSchema,
  ImageryValueSchema,
]);

export type TokenValue = z.infer<typeof TokenValueSchema>;

// Mirror of the legacy TS TokenCategory union (types.ts). 9 values; new code
// should prefer TokenKindSchema. Pinned as z.enum so Zod is not weaker than TS.
export const TokenCategorySchema = z.enum([
  "colors", "typography", "spacing", "effects", "layout",
  "icons", "buttons", "forms", "theme",
]);

// Mirror of the legacy TS TokenType union (types.ts). 8 values.
export const TokenTypeSchema = z.enum([
  "color", "font-family", "font-size", "length",
  "shadow", "number", "string", "select",
]);

export const DesignTokenSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  value: z.string(),
  category: TokenCategorySchema,
  cssVar: z.string().regex(/^--[a-z0-9-]+$/),
  type: TokenTypeSchema,
  group: z.string().optional(),
  options: z.array(z.string()).optional(),
  description: z.string().optional(),
  kind: TokenKindSchema.optional(),
  friendlyName: z.string().optional(),
  aliasOf: z.string().optional(),
  typedValue: TokenValueSchema.optional(),
});

export type DesignToken = z.infer<typeof DesignTokenSchema>;
