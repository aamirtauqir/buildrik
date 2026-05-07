import type { DesignToken } from "../types";
import { useTokensForKind } from "./useTokensForKind";

export type ZindexTokensState = ReturnType<typeof useTokensForKind>;

export function useZindexTokens(initialTokens: DesignToken[]) {
  return useTokensForKind("zindex", initialTokens);
}
