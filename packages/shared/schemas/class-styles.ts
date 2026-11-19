import { z } from "zod";

/**
 * Class-first styling (BD-30, CLASS-FIRST-SPEC) — the transport-safe pieces
 * the editor and the server share.
 *
 * `styleModel` is a server-owned Site column. "element" is every site that
 * exists today: all styles are element-local and the cascade is unchanged.
 * "class" turns on the class-first cascade ladder (tag < class < combo <
 * element-local). The column is never taken from a client payload.
 */
export const styleModelSchema = z.enum(["element", "class"]);
export type StyleModel = z.infer<typeof styleModelSchema>;

/**
 * The reason a save is refused because the editor did not load the site in
 * its style model (a tab opened before the site moved to classes, or a build
 * that predates class-first). Carried AHEAD of the ordinary
 * `SAVE_CONFLICT:<iso>` tail, like BRAND_FORMAT_CONFLICT, so an older bundle
 * still opens its conflict dialog and a current one offers Reload only.
 */
export const STYLE_MODEL_CONFLICT = "SAVE_CONFLICT_STYLE_MODEL";

/** Most classes one element's chain may hold (owner Q2, BD-38). */
export const CLASS_CHAIN_MAX = 3;

const CLASS_NAME_SHAPE = /^[a-z][a-z0-9_-]{0,63}$/;
/** Engine namespaces (`buildrick-<id>`, chrome `bd-*`) and `w-`, kept for a future Webflow import. */
const RESERVED_PREFIXES = ["buildrick-", "bd-", "w-"] as const;

export type ClassNameError = "empty" | "start" | "too-long" | "reserved";

/**
 * The one class-name normaliser (CLASS-FIRST-SPEC §4.3): trim, lower-case,
 * every character outside `[a-z0-9_-]` (whitespace included) becomes `-`,
 * runs of `-` collapse and `-` is stripped from both ends. `name` is that
 * normalised form — the suggestion shown beside an error — and `error` says
 * why it still cannot be a class: it must start with a letter, be at most 64
 * characters and not use a reserved prefix. Names are case-insensitive, so
 * `Card` and `card` normalise to the same class.
 */
export function normalizeClassName(raw: string): { name: string; error: ClassNameError | null } {
  const name = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (name === "") return { name, error: "empty" };
  if (!/^[a-z]/.test(name)) return { name, error: "start" };
  if (!CLASS_NAME_SHAPE.test(name)) return { name, error: "too-long" };
  if (RESERVED_PREFIXES.some((p) => name.startsWith(p))) return { name, error: "reserved" };
  return { name, error: null };
}
