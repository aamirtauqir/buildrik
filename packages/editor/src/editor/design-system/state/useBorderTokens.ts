import type { DesignToken } from "../types";
import { useTokensForKind } from "./useTokensForKind";

export type BorderTokensState = ReturnType<typeof useTokensForKind>;

export function useBorderTokens(initialTokens: DesignToken[]) {
  return useTokensForKind("border", initialTokens);
}
