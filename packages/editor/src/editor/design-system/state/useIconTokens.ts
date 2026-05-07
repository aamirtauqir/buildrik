import type { DesignToken } from "../types";
import { useTokensForKind } from "./useTokensForKind";

export type IconTokensState = ReturnType<typeof useTokensForKind>;

export function useIconTokens(initialTokens: DesignToken[]) {
  return useTokensForKind("icon", initialTokens);
}
