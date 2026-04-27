// PHASE 5 DELETE — Phase 4 adapter shim. Replaces inline <Switch> JSX.
/**
 * Adapter shim — exposes vibcoder Switch under the legacy `@/shared/ui`
 * namespace. There was no hand-rolled Switch primitive in `shared/ui/`,
 * so this shim is a thin re-export with no prop translation.
 *
 * Prop translations (Phase 4 Q4 mapping):
 *   checked: passthrough (required boolean)
 *   onCheckedChange: passthrough (vibcoder fires (next: boolean))
 *   disabled: passthrough → aria-disabled + native disabled attr
 *   className / id / aria-label / etc.: native button attrs pass through
 *
 * Untranslatable: none. This shim has no extra logic. Phase 5 will
 * remove the shim and route imports directly to the vibcoder barrel.
 *
 * @license BSD-3-Clause
 */
export { Switch, type SwitchProps } from "@/editor/shared/vibcoder";
