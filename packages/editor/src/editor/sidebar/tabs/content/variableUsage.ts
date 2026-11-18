/**
 * variableUsage — where each site variable is typed as `{{site.<key>}}`
 * (2L9 B5-V13 260:238267: "phone · 2 text placeholders · Home / Footer /
 * Contact line"). Renaming or deleting a variable does not rewrite these
 * placeholders, so Site variables shows them before either.
 *
 * The placeholder grammar is the export's (`ExportEngine.withSiteVariables`),
 * which is what turns them into values on the published page.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";

/** Same pattern as `ExportEngine.withSiteVariables`. */
const SITE_VARIABLE_REF = /\{\{\s*site\.([a-zA-Z][\w-]*)\s*\}\}/g;

export interface VariableUse {
  elementId: string;
  /** "<page> / <element>", the element as Layers names it. */
  label: string;
}

export function variableUsage(composer: Composer | null): Map<string, VariableUse[]> {
  const uses = new Map<string, VariableUse[]>();
  if (!composer) return uses;
  const pageByRoot = new Map(composer.elements.getAllPages().map((p) => [p.root?.id, p.name]));
  for (const el of composer.elements.getAllElements()) {
    const content = el.getContent?.() ?? "";
    if (!content.includes("{{")) continue;
    let top = el;
    for (let up = el.getParent?.(); up; up = up.getParent?.()) top = up;
    const page = pageByRoot.get(top.getId());
    const label = `${page ? `${page} / ` : ""}${getLayerName(el) ?? elementTypeLabel(el.getType?.() ?? "element")}`;
    const keys = new Set(Array.from(content.matchAll(SITE_VARIABLE_REF), (m) => m[1]));
    for (const key of keys) {
      const list = uses.get(key) ?? [];
      list.push({ elementId: el.getId(), label });
      uses.set(key, list);
    }
  }
  return uses;
}

/** "2 text placeholders" / "1 text placeholder" / "0 placeholders" (260:235689). */
export function placeholderCount(n: number): string {
  return n === 0 ? "0 placeholders" : `${n} text placeholder${n === 1 ? "" : "s"}`;
}
