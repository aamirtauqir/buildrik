/**
 * Configuration Module Exports
 * Barrel file for the data-driven ProInspector configuration layer.
 *
 * @license BSD-3-Clause
 */

// Section order — one list per tab (Inspector v4); presence is the type's
// capabilities (@/shared/constants/elementCapabilities).
export { SECTION_ORDER } from "./sectionOrder";

// CSS Context
export { deriveCssContext, getPropertyStates } from "./cssContext";
export type { CssContext } from "./cssContext";

// Context Evaluator (dead exports purged in Commit B)
export {
  buildInspectorContext,
} from "./contextEvaluator";
export type { InspectorContext, ContextBuilderInput } from "./contextEvaluator";