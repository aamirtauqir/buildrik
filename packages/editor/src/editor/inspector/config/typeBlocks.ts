/**
 * Type blocks — what defines each element type (Inspector v4, DD-3, Q2, Q5).
 * SSOT for the defining settings; replaced the Advanced section's
 * ELEMENT_PROPERTIES. `ELEMENT_CAPABILITIES[type].typeBlock` picks the id,
 * this table picks the body; one body file per family, one lane each.
 *
 * A type block with no body here does not render (embeds and widgets until
 * lane L2-B: their settings need runtimes first).
 *
 * @license BSD-3-Clause
 */

import type * as React from "react";
import type { Composer } from "@/engine";
import type { IconConfig, MediaAsset, MediaAssetType } from "@/shared/types/media";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";
import { EMBED_BODIES } from "../sections/typeBlock/bodies/embedBodies";
import { FORM_BODIES } from "../sections/typeBlock/bodies/formBodies";
import { LAYOUT_BODIES } from "../sections/typeBlock/bodies/layoutBodies";
import { MEDIA_BODIES } from "../sections/typeBlock/bodies/mediaBodies";
import { TEXT_BODIES } from "../sections/typeBlock/bodies/textBodies";
import { WIDGET_BODIES } from "../sections/typeBlock/bodies/widgetBodies";

export interface TypeBlockBodyProps {
  composer: Composer | null | undefined;
  /** The primary element — what the rows read. */
  element: { id: string; type: string; tagName?: string };
  /** Every id a write lands on (the whole selection, DD-12). */
  targetIds: readonly string[];
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange: (changes: Record<string, string>) => void;
  mixedKeys?: ReadonlySet<string>;
  onOpenMediaLibrary?: (allowedTypes: MediaAssetType[], onSelect: (asset: MediaAsset) => void) => void;
  onOpenIconPicker?: (current: IconConfig | undefined, onSelect: (icon: IconConfig) => void) => void;
}

export const TYPE_BLOCKS: Partial<Record<TypeBlockId, React.FC<TypeBlockBodyProps>>> = {
  ...TEXT_BODIES,
  ...FORM_BODIES,
  ...MEDIA_BODIES,
  ...EMBED_BODIES,
  ...WIDGET_BODIES,
  ...LAYOUT_BODIES,
};
