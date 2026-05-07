import type { DesignToken } from "../types";
import { useTokensForKind } from "./useTokensForKind";

export type ImageryTokensState = ReturnType<typeof useTokensForKind>;

export function useImageryTokens(initialTokens: DesignToken[]) {
  return useTokensForKind("imagery", initialTokens);
}
