// packages/shared/tokens/migrate.ts
/**
 * v5 → v6 (Brand Part 1 spec §4). Pure and deterministic: the editor (on
 * load), every server write path and publish call this one function. It
 * never changes a resolved value; the tests prove that per fixture.
 */
import { validateTokens, type DesignToken, type TokenRef } from "../schemas/design-tokens";

export class TokenMigrationError extends Error {
  constructor(readonly reason: string) {
    super(`token migration failed: ${reason}`);
    this.name = "TokenMigrationError";
  }
}

export const LEGACY_PRIMITIVE_IDS = ["color-brand-500", "color-slate-50", "color-slate-700", "color-red-500"] as const;

const DUPLICATE_OF: Record<string, string> = {
  "color-action": "color-primary",
  "color-surface": "color-background",
  "color-text-primary": "color-text",
  "color-feedback-error": "color-error",
};

interface V5Row {
  id: string; name: string; value: string; category: DesignToken["category"]; cssVar: string;
  type: DesignToken["type"]; kind?: DesignToken["kind"]; darkValue?: string; aliasOf?: string;
  group?: string; options?: string[]; description?: string; friendlyName?: string;
  semanticKind?: DesignToken["semanticKind"]; replacedBy?: string;
}

function isV5Row(x: unknown): x is V5Row {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return typeof r.id === "string" && r.id.length > 0 && typeof r.name === "string" &&
    typeof r.value === "string" && typeof r.cssVar === "string" && typeof r.category === "string" && typeof r.type === "string";
}

/** Kind for a v5 row: its explicit kind, then what its id (or var) names,
 *  then its category/type. The v5 seed's radius rows had no kind and an
 *  "effects" category, which the fallback alone read as sizing. */
const KIND_BY_PREFIX: Array<[RegExp, DesignToken["kind"]]> = [
  [/^radius-/, "radius"],
  [/^shadow-/, "shadow"],
  [/^(space|spacing)-/, "spacing"],
  [/^(z-|zindex)/, "zindex"],
  [/^opacity-/, "opacity"],
  [/^(motion|duration)-/, "motion"],
];

function kindOf(r: V5Row): DesignToken["kind"] {
  if (r.kind) return r.kind;
  const names = [r.id, r.cssVar.replace(/^--(buildrick-design|bd)-/, "")];
  for (const [re, kind] of KIND_BY_PREFIX) if (names.some((n) => re.test(n))) return kind;
  if (r.category === "typography" && names.some((n) => /^(font|text)-/.test(n))) return "type";
  if (r.category === "colors" || r.type === "color") return "color";
  if (r.category === "typography") return "type";
  if (r.category === "spacing") return "spacing";
  if (r.type === "shadow") return "shadow";
  return "sizing";
}

/** v5 emitted `darkValue` only for colour tokens (CSSBundler); on any other
 *  kind it was inert, so it must not become a v6 dark mode. */
function darkOf(r: V5Row): string | undefined {
  if (r.category !== "colors" && r.kind !== "color") return undefined;
  const d = r.darkValue?.trim();
  return d ? d : undefined;
}

export function migrateTokensToV6(legacy: unknown): DesignToken[] {
  if (!Array.isArray(legacy)) throw new TokenMigrationError("designTokens is not an array");
  const parsed: V5Row[] = [];
  for (const [i, x] of legacy.entries()) {
    if (!isV5Row(x)) throw new TokenMigrationError(`entry ${i} is not a v5 token`);
    parsed.push(x);
  }
  // The v5 seed list declares radius/shadow ids twice under different CSS
  // vars (`--buildrick-design-*` and `--bd-*`). The `--buildrick-design-<id>`
  // row keeps the id. Another row with the same id and the same values folds
  // into it as a legacy name (its kind and friendly name fill gaps); one with
  // different values keeps its var under a suffixed id. The same CSS var twice
  // is genuinely corrupt.
  const varsSeen = new Set<string>();
  for (const x of parsed) {
    if (varsSeen.has(x.cssVar)) throw new TokenMigrationError(`duplicate token ${x.id} (${x.cssVar})`);
    varsSeen.add(x.cssVar);
  }
  const ownVar = (r: V5Row) => r.cssVar === `--buildrick-design-${r.id}`;
  const keeperOf = new Map<string, V5Row>();
  for (const x of parsed) {
    const kept = keeperOf.get(x.id);
    if (!kept || (!ownVar(kept) && ownVar(x))) keeperOf.set(x.id, x);
  }
  const sameValues = (a: V5Row, b: V5Row) => a.value.trim() === b.value.trim() && darkOf(a) === darkOf(b);
  const legacyNamesFor = new Map<string, string[]>();
  const keeperFill = new Map<string, Partial<V5Row>>();
  const rows: V5Row[] = [];
  const idsTaken = new Set(parsed.map((r) => r.id));
  for (const x of parsed) {
    const keeper = keeperOf.get(x.id)!;
    if (x === keeper) {
      rows.push(x);
      continue;
    }
    if (sameValues(x, keeper)) {
      legacyNamesFor.set(x.id, [...(legacyNamesFor.get(x.id) ?? []), x.cssVar]);
      const fill = keeperFill.get(x.id) ?? {};
      if (keeper.kind === undefined && fill.kind === undefined && x.kind !== undefined) fill.kind = x.kind;
      if (keeper.friendlyName === undefined && fill.friendlyName === undefined && x.friendlyName !== undefined) fill.friendlyName = x.friendlyName;
      keeperFill.set(x.id, fill);
      continue;
    }
    let id = x.id;
    for (let n = 2; idsTaken.has(id); n++) id = `${x.id}-${n}`;
    idsTaken.add(id);
    rows.push({ ...x, id });
  }
  for (const [i, r] of rows.entries()) {
    const fill = keeperFill.get(r.id);
    if (fill && keeperOf.get(r.id) === r) rows[i] = { ...fill, ...r };
  }

  const byId = new Map(rows.map((r) => [r.id, r]));

  // Merge equal duplicates (BRD-12). Equality is exact (after trim) because the
  // emitted literal must not change. Unequal ones stay separate.
  const survivorOf = new Map<string, string>(); // dropped id → survivor id
  for (const [dupId, keepId] of Object.entries(DUPLICATE_OF)) {
    const dup = byId.get(dupId);
    const keep = byId.get(keepId);
    if (!dup || !keep) continue;
    if (dup.value.trim() !== keep.value.trim() || darkOf(dup) !== darkOf(keep)) continue;
    survivorOf.set(dupId, keepId);
    legacyNamesFor.set(keepId, [...(legacyNamesFor.get(keepId) ?? []), dup.cssVar]);
  }
  const live = (id: string) => survivorOf.get(id) ?? id;

  const out: DesignToken[] = [];
  const primitiveByValue = new Map<string, string>(); // `${kind}|${exact value}` → real seed primitive id
  const usedIds = new Set(rows.map((r) => r.id));
  const usedVars = new Set(rows.map((r) => r.cssVar));
  const keyOf = (r: V5Row, value: string) => `${kindOf(r)}|${value.trim()}`;

  const base = (r: V5Row) => {
    const t: Omit<DesignToken, "layer" | "modes"> = {
      id: r.id, name: r.name, kind: kindOf(r), category: r.category, cssVar: r.cssVar, type: r.type,
    };
    for (const key of ["group", "options", "description", "friendlyName", "semanticKind"] as const) {
      if (r[key] !== undefined) Object.assign(t, { [key]: r[key] });
    }
    if (r.replacedBy !== undefined) t.replacedBy = live(r.replacedBy);
    return t;
  };

  // A v5 primitive that carries a dark value cannot be a v6 primitive (those
  // have exactly one literal), so it migrates as a semantic token below.
  const isPrimitive = (r: V5Row) =>
    ((LEGACY_PRIMITIVE_IDS as readonly string[]).includes(r.id) || r.group === "primitive") && darkOf(r) === undefined;
  const primitiveIds = new Set<string>();
  for (const r of rows) {
    if (!isPrimitive(r)) continue;
    const legacyNames = legacyNamesFor.get(r.id);
    out.push({
      ...base(r), layer: "primitive", modes: { light: { value: r.value.trim() } },
      ...(legacyNames ? { legacyNames } : {}),
    });
    primitiveIds.add(r.id);
    if (!primitiveByValue.has(keyOf(r, r.value))) primitiveByValue.set(keyOf(r, r.value), r.id);
  }

  // A real seed primitive holding the exact literal is aliased; otherwise the
  // token gets a primitive of its own (spec §4) — never one another token uses.
  const primitiveFor = (r: V5Row, value: string, suffix: string): TokenRef => {
    const hit = primitiveByValue.get(keyOf(r, value));
    if (hit) return { alias: hit };
    let id = `custom-${r.id}${suffix}`;
    for (let n = 2; usedIds.has(id) || usedVars.has(`--buildrick-design-${id}`); n++) id = `custom-${r.id}${suffix}-${n}`;
    usedIds.add(id);
    usedVars.add(`--buildrick-design-${id}`);
    out.push({
      id, name: `${r.name}${suffix ? " (dark)" : ""}`, kind: kindOf(r), layer: "primitive",
      modes: { light: { value: value.trim() } }, category: r.category, cssVar: `--buildrick-design-${id}`, type: r.type,
    });
    return { alias: id };
  };

  // v5 emitted `${cssVar}: ${value}` for every token; `aliasOf` was metadata.
  // It only becomes an alias when it points at a primitive holding that exact literal.
  const aliasTarget = (r: V5Row): string | undefined => {
    if (!r.aliasOf) return undefined;
    const id = live(r.aliasOf);
    const target = byId.get(id);
    return target && primitiveIds.has(id) && kindOf(target) === kindOf(r) && target.value.trim() === r.value.trim() ? id : undefined;
  };

  for (const r of rows) {
    if (survivorOf.has(r.id) || primitiveIds.has(r.id)) continue;
    const isColour = kindOf(r) === "color";
    const target = aliasTarget(r);
    const light: TokenRef = target ? { alias: target } : isColour ? primitiveFor(r, r.value, "") : { value: r.value.trim() };
    const darkValue = darkOf(r);
    const dark: TokenRef | undefined = darkValue === undefined ? undefined : isColour ? primitiveFor(r, darkValue, "-dark") : { value: darkValue };
    const legacyNames = legacyNamesFor.get(r.id);
    out.push({
      ...base(r), layer: "semantic",
      modes: dark ? { light, dark } : { light },
      ...(legacyNames ? { legacyNames } : {}),
    });
  }

  const checked = validateTokens(out);
  if (!checked.ok) throw new TokenMigrationError(checked.reason);
  return checked.tokens;
}
