import type { DesignToken } from "../types";
import { useTokensForKind } from "./useTokensForKind";

export type ShadowTokensState = ReturnType<typeof useTokensForKind>;

export function useShadowTokens(initialTokens: DesignToken[]) {
  return useTokensForKind("shadow", initialTokens);
}
