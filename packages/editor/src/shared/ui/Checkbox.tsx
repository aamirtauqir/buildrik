// PHASE 5 DELETE — Phase 4 adapter shim. Replaces inline <input type="checkbox"> JSX.
/**
 * Adapter shim — exposes vibcoder Checkbox under the legacy `@/shared/ui`
 * namespace. There was no hand-rolled Checkbox primitive in `shared/ui/`,
 * so this shim is a thin re-export with no prop translation.
 *
 * Prop translations (Phase 4 Q4 mapping):
 *   checked / defaultChecked / onChange / disabled / name / value:
 *     native InputHTMLAttributes pass through (the codemod strips the
 *     `type` attribute since vibcoder Checkbox sets it internally to
 *     "checkbox").
 *   size (sm | md | lg): vibcoder size variants pass through.
 *   error (boolean): bd-checkbox--error class + aria-invalid.
 *   indeterminate (boolean): set imperatively via DOM property by the
 *     vibcoder wrapper (no HTML attribute equivalent).
 *   label (ReactNode): renders as bd-checkbox__label next to the box.
 *
 * Untranslatable: none. This shim has no extra logic. Phase 5 will
 * remove the shim and route imports directly to the vibcoder barrel.
 *
 * @license BSD-3-Clause
 */
export { Checkbox, type CheckboxProps, type CheckboxSize } from "@/editor/shared/vibcoder";
