/**
 * Component trash on the document side (design-2l9 K18, K42). A delete
 * records what it detaches — each instance link plus a fingerprint of the
 * instance's element as it stands without that link — and how many pages
 * they sat on. A restore re-links only the instances whose element still has
 * the same fingerprint: "Restoring re-links instances that weren't changed
 * after the detach." (217:41750).
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";
import type { ComponentDefinition, ComponentInstance } from "@/shared/types/components";
import type { ComponentTrashInfo } from "@buildrik/shared/schemas/site-component";
import { hashString } from "@/shared/utils/helpers";

/** The element's serialized tree without its own instance link (the one thing a detach changes). */
function instanceFingerprint(composer: Composer, elementId: string): string | null {
  const element = composer.elements.getElement(elementId);
  if (!element) return null;
  const json = element.toJSON();
  const data = json.data ? { ...json.data, componentInstance: undefined } : undefined;
  return hashString(JSON.stringify({ ...json, data }));
}

/** The page each element sits on, by its root. */
function pageCountOf(composer: Composer, elementIds: string[]): number {
  const roots = new Set<string>();
  for (const id of elementIds) {
    let el = composer.elements.getElement(id) ?? null;
    while (el?.getParent()) el = el.getParent();
    if (el) roots.add(el.getId());
  }
  return roots.size;
}

/** Taken BEFORE the delete: what deleting `componentId` will detach. */
export function captureDeleteRecord(composer: Composer, componentId: string): ComponentTrashInfo {
  const instances = composer.components.getInstancesOfComponent(componentId);
  return {
    instances: instances.flatMap((record) => {
      const fingerprint = instanceFingerprint(composer, record.elementId);
      return fingerprint ? [{ record: { ...record } as unknown as Record<string, unknown>, fingerprint }] : [];
    }),
    pageCount: pageCountOf(composer, instances.map((i) => i.elementId)),
  };
}

/** The recorded instances whose element is still there and unchanged. */
export function unchangedInstances(composer: Composer, trash: ComponentTrashInfo | null): ComponentInstance[] {
  if (!trash) return [];
  return trash.instances
    .filter((i) => {
      const elementId = (i.record as { elementId?: unknown }).elementId;
      return typeof elementId === "string" && instanceFingerprint(composer, elementId) === i.fingerprint;
    })
    .map((i) => i.record as unknown as ComponentInstance);
}

/** Re-register a restored master and re-link its unchanged instances. Returns how many re-linked. */
export function restoreTrashedComponent(
  composer: Composer,
  component: ComponentDefinition,
  trash: ComponentTrashInfo | null,
): Promise<number> {
  return composer.components.restoreDeletedComponent({ component, instances: unchangedInstances(composer, trash) });
}
