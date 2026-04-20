/**
 * Editor-chrome DS primitives — Week 2 (Survivor #5 Token Binding Contract).
 * @license BSD-3-Clause
 */

export { Box } from "./Box";
export type { BoxProps } from "./Box";

export type {
  ChromeBg,
  ChromeText,
  ChromeSpace,
  ChromeRadius,
  ChromeShadow,
  ChromeBorder,
} from "./tokens";

export {
  resolveBg,
  resolveText,
  resolveSpace,
  resolveRadius,
  resolveShadow,
  resolveBorder,
} from "./tokens";
