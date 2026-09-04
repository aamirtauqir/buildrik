/**
 * Sort folders depth-first so nested children render directly under their
 * parent. Returns { folder, depth } pairs.
 *
 * One home. It lived privately in MediaContextMenu, so the drawer's bulk bar
 * — which needed the same list for "Move to…" — had no picker of its own and
 * bounced to the full library instead. Two folder lists would drift; one
 * cannot.
 *
 * @license BSD-3-Clause
 */
import type { MediaFolder } from "../data/mediaTypes";

export function flattenFolderTree(
  folders: ReadonlyArray<MediaFolder>,
): Array<{ folder: MediaFolder; depth: number }> {
  const byParent = new Map<string | null, MediaFolder[]>();
  for (const f of folders) {
    const list = byParent.get(f.parentId) ?? [];
    list.push(f);
    byParent.set(f.parentId, list);
  }
  const out: Array<{ folder: MediaFolder; depth: number }> = [];
  const walk = (parentId: string | null, depth: number) => {
    const children = byParent.get(parentId) ?? [];
    for (const f of children) {
      out.push({ folder: f, depth });
      walk(f.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}
