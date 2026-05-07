import type { DesignToken } from "../types";
import { useTokensForKind } from "./useTokensForKind";

export type SizingTokensState = ReturnType<typeof useTokensForKind>;

export function useSizingTokens(initialTokens: DesignToken[]) {
  return useTokensForKind("sizing", initialTokens);
}
