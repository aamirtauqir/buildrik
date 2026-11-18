/**
 * Element Manager Types
 * Internal types for element manager module
 *
 * @module engine/elements/manager/types
 * @license BSD-3-Clause
 */

import type { ElementData, PageData } from "@/shared/types";
import type { Composer } from "@/engine/Composer";
import type { Element } from "../Element";
import type { IdRename } from "@buildrik/shared/content/elementIds";

/**
 * Context passed to sub-managers for accessing shared resources
 */
export interface ElementManagerContext {
  composer: Composer;
  elements: Map<string, Element>;
  pages: Map<string, PageData>;
  getActivePageId: () => string | null;
  setActivePageId: (id: string | null) => void;
  buildElementTree: (data: ElementData, parent?: Element) => Element;
  /** Deep clone with fresh ids; each old → new id is pushed onto `renames`. */
  cloneElementData: (data: ElementData, renames?: IdRename[]) => ElementData;
  /** Copy the StyleEngine rules keyed to each `from` id onto its `to` id. */
  copyStyleRules: (renames: IdRename[]) => void;
  getAllDescendants: (element: Element) => Element[];
}
