/**
 * getToken — read a Buildrik chrome CSS variable at runtime.
 * @license BSD-3-Clause
 */

import type { TokenName } from "./token-names";
import { IS_DEV_BUILD } from "./runtimeEnv";

export function getToken(name: TokenName): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--buildrick-${name}`)
    .trim();
  if (!value && IS_DEV_BUILD) {
    console.warn(`[tokens] --buildrick-${name} is not defined`);
  }
  return value;
}
