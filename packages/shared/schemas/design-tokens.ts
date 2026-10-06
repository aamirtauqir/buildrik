/**
 * Design tokens, schema v6 (Brand Part 1, spec §1).
 *
 * Shaped like the W3C Design Tokens format (D4): `kind` ~ `$type`, a mode's
 * `{ value }` ~ `$value` literal, `{ alias }` ~ `{group.token}` reference.
 * The editor, every server write path and publish validate with this one
 * schema. Primitives carry exactly `modes.light` as a literal; only semantic
 * tokens alias or carry `modes.dark`.
 */
import { z } from "zod";
import { TokenKindSchema, TokenCategorySchema, TokenTypeSchema } from "./designToken";

export const TOKENS_SCHEMA_VERSION = 6;

export const TokenRefSchema = z.union([
  z.object({ alias: z.string().min(1) }).strict(),
  z.object({ value: z.string() }).strict(),
]);
export type TokenRef = z.infer<typeof TokenRefSchema>;

export const TokenLayerSchema = z.enum(["primitive", "semantic"]);
export type TokenLayer = z.infer<typeof TokenLayerSchema>;

export const DarkModeSchema = z.enum(["auto", "off"]);
export type DarkMode = z.infer<typeof DarkModeSchema>;

export const DesignTokenSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    name: z.string().min(1),
    kind: TokenKindSchema,
    layer: TokenLayerSchema,
    modes: z.object({ light: TokenRefSchema, dark: TokenRefSchema.optional() }).strict(),
    category: TokenCategorySchema,
    cssVar: z.string().regex(/^--[a-z0-9-]+$/),
    type: TokenTypeSchema,
    group: z.string().optional(),
    options: z.array(z.string()).optional(),
    description: z.string().optional(),
    friendlyName: z.string().optional(),
    semanticKind: z.enum(["action", "surface", "text", "feedback"]).optional(),
    replacedBy: z.string().optional(),
    /** Old var names this token still answers to (merged duplicates, renames). */
    legacyNames: z.array(z.string().regex(/^--[a-z0-9-]+$/)).optional(),
  })
  .strict();
export type DesignToken = z.infer<typeof DesignTokenSchema>;

const isAlias = (r: TokenRef): r is { alias: string } => "alias" in r;

function graphProblem(tokens: DesignToken[]): string | null {
  const byId = new Map<string, DesignToken>();
  for (const t of tokens) {
    if (byId.has(t.id)) return `duplicate token id ${t.id}`;
    byId.set(t.id, t);
  }
  for (const t of tokens) {
    if (t.layer === "primitive" && (t.modes.dark || isAlias(t.modes.light))) {
      return `primitive ${t.id} must have exactly one literal light value`;
    }
    for (const ref of [t.modes.light, t.modes.dark]) {
      if (!ref || !isAlias(ref)) continue;
      const target = byId.get(ref.alias);
      if (!target) return `${t.id} aliases missing token ${ref.alias}`;
      if (target.kind !== t.kind) return `${t.id} (${t.kind}) aliases ${target.id} of another kind (${target.kind})`;
    }
    if (t.replacedBy && !byId.has(t.replacedBy)) return `${t.id} replacedBy missing token ${t.replacedBy}`;
  }
  // Cycle check per mode: follow aliases; light falls back to light, dark to dark then light.
  for (const mode of ["light", "dark"] as const) {
    for (const start of tokens) {
      const seen = new Set<string>();
      let cur: DesignToken | undefined = start;
      while (cur) {
        if (seen.has(cur.id)) return `alias cycle through ${cur.id}`;
        seen.add(cur.id);
        const ref: TokenRef = (mode === "dark" && cur.modes.dark) || cur.modes.light;
        cur = isAlias(ref) ? byId.get(ref.alias) : undefined;
      }
    }
  }
  return null;
}

export const DesignTokensSchema = z.array(DesignTokenSchema).superRefine((tokens, ctx) => {
  const problem = graphProblem(tokens);
  if (problem) ctx.addIssue({ code: z.ZodIssueCode.custom, message: problem });
});

export function validateTokens(
  input: unknown,
): { ok: true; tokens: DesignToken[] } | { ok: false; reason: string } {
  const parsed = DesignTokensSchema.safeParse(input);
  if (parsed.success) return { ok: true, tokens: parsed.data };
  const issue = parsed.error.issues[0];
  return { ok: false, reason: `${issue.path.join(".") || "tokens"}: ${issue.message}` };
}
