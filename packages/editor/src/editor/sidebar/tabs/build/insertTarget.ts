/**
 * resolveInsertTarget — where a click in the Add panel lands, as the
 * "Insert into Hero · Home / Hero · At end" strip names it (boards 7:18981,
 * 302:3965).
 *
 * The rule is `useBlockInsertion`'s smart placement, written once so the strip
 * and the insert cannot disagree (REQUESTS.md #10 moves the hook onto it):
 * - a selected element that accepts the type takes it at its end;
 * - a selected text leaf never does — the insert goes after it;
 * - a selected Section with one inner container fills that container;
 * - otherwise walk up to the first ancestor that accepts it and insert after
 *   the child on the selection path;
 * - nothing selected (or nothing accepts it): the page root, at the end.
 *
 * Pure read: no selection, history or DOM.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";
import type { ElementType } from "@/shared/types";
import { canNestElement, ELEMENT_CATEGORIES, ElementCategory } from "@/shared/utils/nesting";
import { elementLocation } from "@/editor/canvas/utils/elementInfo";

export interface InsertTarget {
  parentId: string;
  /** Index in the parent's child list the insert takes. */
  index: number;
  /** The parent's name — "Hero", or the page's name at the root. */
  parentName: string;
  /** "Home / Hero" — the page, then the parent's path under it. */
  path: string;
  /** The sibling it lands after, or null for "At end". */
  afterName: string | null;
}

type El = NonNullable<ReturnType<Composer["elements"]["getElement"]>>;

function displayName(composer: Composer, el: El): string {
  return elementLocation(composer, el.getId(), true).split(" › ").pop() ?? "";
}

export function resolveInsertTarget(composer: Composer, elementType: ElementType): InsertTarget | null {
  /* Optional reads: the panel also mounts against a partial composer (a
     project still loading, test doubles) and then simply names no target. */
  const page = composer.elements?.getActivePage?.();
  const root = page?.root ? composer.elements.getElement?.(page.root.id) : undefined;
  if (!page || !root) return null;

  const at = (parent: El, index: number, after: El | null): InsertTarget => {
    const path = elementLocation(composer, parent.getId(), true).split(" › ").join(" / ");
    return {
      parentId: parent.getId(),
      index,
      parentName: parent === root ? page.name : displayName(composer, parent),
      path,
      afterName: after ? displayName(composer, after) : null,
    };
  };

  const ids = composer.selection?.getSelectedIds?.() ?? [];
  const selected = ids.length === 1 ? composer.elements.getElement(ids[0]) : undefined;
  if (selected && selected !== root) {
    let candidate: El | null = selected;
    let childOnPath: El = selected;
    let isSelected = true;
    while (candidate) {
      const type = candidate.getType() as ElementType;
      const textLeaf = isSelected && (ELEMENT_CATEGORIES[type] ?? []).includes(ElementCategory.TEXT);
      const kids = isSelected && type === "section" ? candidate.getChildren() : [];
      const slot = kids.length === 1 && kids[0].getType() === "container" ? kids[0] : null;
      if (slot && canNestElement(elementType, "container")) return at(slot, slot.getChildCount(), null);
      if (!textLeaf && canNestElement(elementType, type)) {
        if (isSelected) return at(candidate, candidate.getChildCount(), null);
        const i = candidate.getChildren().findIndex((c) => c.getId() === childOnPath.getId());
        return at(candidate, i >= 0 ? i + 1 : candidate.getChildCount(), i >= 0 ? childOnPath : null);
      }
      childOnPath = candidate;
      candidate = candidate.getParent();
      isSelected = false;
    }
  }
  return at(root, root.getChildCount(), null);
}
