/**
 * Element Manager Types
 * Internal types for element manager module
 *
 * @module engine/elements/manager/types
 * @license BSD-3-Clause
 */

import type { ElementData, PageData } from "../../../shared/types";
import type { Composer } from "../../Composer";
import type { Element } from "../Element";

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
  cloneElementData: (data: ElementData) => ElementData;
  getAllDescendants: (element: Element) => Element[];
}
