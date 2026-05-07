import type { DesignToken } from "../types";
import { useTokensForKind } from "./useTokensForKind";

export type BreakpointTokensState = ReturnType<typeof useTokensForKind>;

export function useBreakpointTokens(initialTokens: DesignToken[]) {
  return useTokensForKind("breakpoint", initialTokens);
}
