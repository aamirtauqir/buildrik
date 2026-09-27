/**
 * Type-block bodies — embeds: Video embed, Map embed, Lottie (board 9).
 *
 * EMPTY in W1 on purpose: none of these types had a defining setting before
 * v4, and writing an embed URL attribute that neither the canvas nor the
 * export reads would be a control that does nothing (build plan OQ-2). Lane
 * L2-B adds the bodies together with the engine serializer; until then the
 * type block does not render for these types.
 *
 * @license BSD-3-Clause
 */

import type * as React from "react";
import type { TypeBlockBodyProps } from "../../../config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";

export const EMBED_BODIES: Partial<Record<TypeBlockId, React.FC<TypeBlockBodyProps>>> = {};
