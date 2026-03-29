/**
 * Drag & Drop Zone Management
 * Drop zone registry and validation
 *
 * @module utils/dragDrop/dropZones
 * @license BSD-3-Clause
 */

import type { ElementType, Point } from "../../types";
import { pointInRect, domRectToRect } from "./geometry";
import type { DropZone, DropZoneRegistry, DragData } from "./types";

// =============================================================================
// DROP ZONE REGISTRY
// =============================================================================

/**
 * Create drop zone registry
 */
export function createDropZoneRegistry(): DropZoneRegistry {
  const zones = new Map<string, DropZone>();

  return {
    zones,

    register(zone: DropZone) {
      zones.set(zone.id, zone);
    },

    unregister(id: string) {
      zones.delete(id);
    },

    findZone(point: Point): DropZone | null {
      // Sort by priority (higher first)
      const sorted = Array.from(zones.values())
        .filter((z) => z.active !== false)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

      for (const zone of sorted) {
        const element =
          typeof zone.element === "string" ? document.querySelector(zone.element) : zone.element;

        if (!element) continue;

        const rect = element.getBoundingClientRect();
        if (pointInRect(point, domRectToRect(rect))) {
          return zone;
        }
      }

      return null;
    },

    validateDrop(zone: DropZone, data: DragData): boolean {
      // Custom validation
      if (zone.validate) {
        return zone.validate(data);
      }

      // Type validation
      if (data.type === "element" || data.type === "block") {
        const elementType =
          data.type === "element" ? data.elementType : (data.block.type as ElementType);

        if (zone.accepts && !zone.accepts.includes(elementType)) {
          return false;
        }

        if (zone.rejects && zone.rejects.includes(elementType)) {
          return false;
        }
      }

      return true;
    },
  };
}
