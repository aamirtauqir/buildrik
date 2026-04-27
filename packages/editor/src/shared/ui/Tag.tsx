// PHASE 5 DELETE — Phase 4 adapter shim. Legacy and vibcoder Tag align 1:1.
/**
 * Adapter shim — exposes vibcoder Tag under the legacy `@/shared/ui`
 * namespace. There was no hand-rolled Tag primitive in `shared/ui/`,
 * so this shim is a thin re-export with no prop translation.
 *
 * Vibcoder Tag prop surface (passthrough):
 *   variant: "neutral" | "accent" | "success" | "warning" | "error" | "ink"
 *   size:    "sm" | "md"
 *   selectable: boolean (toggleable filter chip)
 *
 * Untranslatable: none. Phase 5 will remove the shim and route imports
 * directly to the vibcoder barrel.
 *
 * @license BSD-3-Clause
 */
export { Tag, type TagProps } from "@/editor/shared/vibcoder";
