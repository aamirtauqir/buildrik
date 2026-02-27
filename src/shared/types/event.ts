/**
 * Event Types
 * Types for the composer event system
 *
 * @module types/event
 * @license BSD-3-Clause
 */

import type { Composer } from "../../engine/Composer";
import type { ElementData } from "./element";
import type { ProjectData } from "./project";
import type { DeviceType } from "./state";
import type { StyleData } from "./style";

// ============================================
// Event Types
// ============================================

export type ComposerEventMap = {
  "composer:ready": Composer;
  "composer:destroyed": void;
  "project:loaded": ProjectData;
  "project:saved": ProjectData;
  "project:changed": void;
  "element:created": ElementData;
  "element:deleted": ElementData;
  "element:updated": ElementData;
  "element:selected": ElementData | null;
  "style:changed": StyleData;
  "device:changed": DeviceType;
  "zoom:changed": number;
  undo: void;
  redo: void;
};
