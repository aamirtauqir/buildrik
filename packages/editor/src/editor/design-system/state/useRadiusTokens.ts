import type { DesignToken } from "../types";
import { useTokensForKind } from "./useTokensForKind";

export type RadiusTokensState = ReturnType<typeof useTokensForKind>;

export function useRadiusTokens(initialTokens: DesignToken[]) {
  return useTokensForKind("radius", initialTokens);
}
