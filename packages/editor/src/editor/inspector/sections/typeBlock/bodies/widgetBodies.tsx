/**
 * Type-block bodies — widgets: Countdown, Progress, Accordion (boards 11,
 * 12, 13).
 *
 * EMPTY in W1 on purpose: their markup is static today (build plan F-10), so
 * an "Ends at" or "Value" row would write attributes nothing reads. Lane
 * L2-B adds the bodies with the countdown / accordion runtimes; until then
 * the type block does not render for these types.
 *
 * @license BSD-3-Clause
 */

import type * as React from "react";
import type { TypeBlockBodyProps } from "../../../config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";

export const WIDGET_BODIES: Partial<Record<TypeBlockId, React.FC<TypeBlockBodyProps>>> = {};
