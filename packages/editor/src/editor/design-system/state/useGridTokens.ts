import type { DesignToken } from "../types";
import { useTokensForKind } from "./useTokensForKind";

export type GridTokensState = ReturnType<typeof useTokensForKind>;

export function useGridTokens(initialTokens: DesignToken[]) {
  return useTokensForKind("grid", initialTokens);
}
