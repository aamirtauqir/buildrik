import type { DesignToken } from "../types";
import { useTokensForKind } from "./useTokensForKind";

export type OpacityTokensState = ReturnType<typeof useTokensForKind>;

export function useOpacityTokens(initialTokens: DesignToken[]) {
  return useTokensForKind("opacity", initialTokens);
}
