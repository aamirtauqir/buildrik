/**
 * StyleBindingResolver
 *
 * Extracts style-to-token bindings from a set of elements. Given a list of
 * element ids and the full element tree, returns a `Map<"elementId:styleProp", "tokenId">`
 * containing only style values that reference a single design-system token
 * (syntax: `{{token.<dotted.id>}}`).
 *
 * Downstream consumer: Canvas right-click "Save as component" flow uses this
 * to pre-fill bindings on the new component definition with the tokens the
 * selected elements were already referencing.
 *
 * Whole-value match only (anchored `^...$`). A style value like
 * `linear-gradient({{token.color.brand.primary}}, #000)` is intentionally
 * skipped — partial-token bindings aren't a thing in the component schema.
 *
 * @module engine/designSystem/StyleBindingResolver
 * @license BSD-3-Clause
 */

import type { Element } from "../elements/Element";

const TOKEN_REF_RE = /^\{\{token\.([a-zA-Z0-9._-]+)\}\}$/;

export class StyleBindingResolver {
  /**
   * Walks `elements` and returns a map of `"elementId:styleProp" → tokenId`
   * for every style value on every requested element whose value is a
   * single whole-value token reference. Elements not in `elementIds` are
   * skipped.
   */
  resolveForElements(
    elementIds: readonly string[],
    elements: readonly Element[],
  ): Map<string, string> {
    const idSet = new Set(elementIds);
    const result = new Map<string, string>();
    if (idSet.size === 0) return result;
    for (const el of elements) {
      const id = el.getId();
      if (!idSet.has(id)) continue;
      const styles = el.getStyles();
      for (const [prop, value] of Object.entries(styles)) {
        if (typeof value !== "string") continue;
        const match = value.match(TOKEN_REF_RE);
        if (match) result.set(`${id}:${prop}`, match[1]);
      }
    }
    return result;
  }
}
