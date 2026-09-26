/**
 * Element ids unique across a site's pages — ONE scheme for the editor's
 * load path, every server path that writes pages, and the backfill script.
 *
 * X-A1: the editor's element registry is keyed by id across ALL pages, but
 * stored pages repeated ids (`"root"` on every AI-generated, template and
 * seeded page; section ids like `ai-hero-0`). The last page loaded owned the
 * shared ids, so the canvas drew it under another page's tab and a save
 * wrote its tree into every page.
 *
 * The scheme (binding ruling, audit-fix lane Lrt round 1):
 *   - pages are processed in position order; ids a page is first to use are
 *     kept, so the first page keeps every stored id;
 *   - an id already taken (by an earlier page, or earlier in the same page)
 *     becomes `stableElementId(pageKey, oldId, occurrence)`, a hash — the
 *     same stored page gets the same ids on every load, for every
 *     collaborator, and on the server;
 *   - anything keyed by a renamed id (style rules, CMS bindings) is COPIED to
 *     the new id, not moved: the old id still belongs to the page that kept it.
 *
 * In-tree references (`href="#x"`, `for`, `aria-*`) are NOT rewritten, on
 * purpose: they target the HTML `id` attribute (`attributes.id`), which the
 * generator emits separately from the element id (`data-buildrick-id`,
 * editor `shared/utils/html/generation.ts`). Re-id leaves `attributes`
 * untouched, so those references keep resolving.
 *
 * Pure: no Prisma, no editor imports.
 *
 * @license BSD-3-Clause
 */

/** The element fields the scheme reads and writes. */
export interface IdTreeNode {
  id: string;
  children?: IdTreeNode[];
}

export interface IdRename {
  from: string;
  to: string;
}

/** 32-bit FNV-1a with a caller-chosen offset basis. */
function fnv1a(input: string, basis: number): number {
  let hash = basis >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Deterministic replacement id for the `occurrence`-th reuse of `oldId` on
 *  the page identified by `pageKey` (the page id; a server path that has no
 *  row id yet passes a stable per-site key). Two independent 32-bit hashes
 *  keep an accidental collision out of reach for any real site. */
export function stableElementId(pageKey: string, oldId: string, occurrence: number): string {
  const input = `${pageKey}\u0000${oldId}\u0000${occurrence}`;
  return `el-${fnv1a(input, 0x811c9dc5).toString(36)}${fnv1a(input, 0x050c5d1f).toString(36)}`;
}

/**
 * Give every element of `root` an id not in `taken`, mutating `root` in
 * place (callers that must not mutate their input clone first). Adds every
 * final id to `taken` so the next page sees them. Returns the renames in
 * tree order.
 */
export function claimUniqueIds(root: IdTreeNode, pageKey: string, taken: Set<string>): IdRename[] {
  const renames: IdRename[] = [];
  const occurrences = new Map<string, number>();
  const walk = (node: IdTreeNode) => {
    const original = node.id;
    if (taken.has(original)) {
      let occurrence = occurrences.get(original) ?? 0;
      let candidate = stableElementId(pageKey, original, occurrence);
      while (taken.has(candidate)) {
        occurrence += 1;
        candidate = stableElementId(pageKey, original, occurrence);
      }
      occurrences.set(original, occurrence + 1);
      node.id = candidate;
      renames.push({ from: original, to: candidate });
    }
    taken.add(node.id);
    if (Array.isArray(node.children)) node.children.forEach(walk);
  };
  walk(root);
  return renames;
}

/** A stored `pages.blocks` value that is an element tree root, else undefined. */
function asTreeRoot(blocks: unknown): IdTreeNode | undefined {
  if (typeof blocks !== "object" || blocks === null || Array.isArray(blocks)) return undefined;
  return typeof (blocks as { id?: unknown }).id === "string" ? (blocks as IdTreeNode) : undefined;
}

/**
 * The server/backfill entry point: make ids unique across `pages` (in the
 * order given — position order), cloning each tree it changes. `taken` seeds
 * ids already owned by pages NOT in this list. Pages whose blocks are not an
 * element tree (legacy `[]`) pass through unchanged.
 */
export function withUniqueIds<P extends { key: string; blocks: unknown }>(
  pages: P[],
  taken: Set<string> = new Set(),
): Array<P & { renames: IdRename[] }> {
  return pages.map((page) => {
    const root = asTreeRoot(page.blocks);
    if (!root) return { ...page, renames: [] };
    const copy = structuredClone(root);
    const renames = claimUniqueIds(copy, page.key, taken);
    return { ...page, blocks: renames.length > 0 ? copy : page.blocks, renames };
  });
}

/** A fresh, empty page root whose id cannot collide with another page's. */
export function blankPageRoot(pageKey: string) {
  return {
    id: stableElementId(pageKey, "root", 0),
    type: "container",
    tagName: "div",
    classes: ["buildrick-page-root"],
    children: [],
  };
}

const ID_SELECTOR = /\[data-buildrick-id="([^"]+)"\]/g;

/**
 * Style rules keyed to a renamed element (`[data-buildrick-id="<old>"]`,
 * with any pseudo/media) copied onto the new id. The originals stay: the page
 * that kept the old id still uses them. Copy ids are derived, so running
 * twice adds nothing new.
 */
export function copyIdKeyedStyles<S extends { id: string; selector: string }>(styles: S[], renames: IdRename[]): S[] {
  if (renames.length === 0) return [];
  const targets = new Map<string, string[]>();
  for (const { from, to } of renames) targets.set(from, [...(targets.get(from) ?? []), to]);
  const existing = new Set(styles.map((s) => s.id));
  const copies: S[] = [];
  for (const style of styles) {
    if (typeof style?.selector !== "string") continue;
    const ids = Array.from(style.selector.matchAll(ID_SELECTOR), (m) => m[1]);
    for (const from of new Set(ids)) {
      for (const to of targets.get(from) ?? []) {
        const id = `${style.id}~${to}`;
        if (existing.has(id)) continue;
        existing.add(id);
        copies.push({ ...style, id, selector: style.selector.split(`[data-buildrick-id="${from}"]`).join(`[data-buildrick-id="${to}"]`) });
      }
    }
  }
  return copies;
}

/** Entries of an element-id-keyed record (CMS bindings) copied onto the new
 *  ids. Existing keys win, so a second pass is a no-op. */
export function copyIdKeyedRecord<V>(record: Record<string, V>, renames: IdRename[]): Record<string, V> {
  const out: Record<string, V> = { ...record };
  for (const { from, to } of renames) {
    if (from in record && !(to in out)) out[to] = structuredClone(record[from]);
  }
  return out;
}
