import type { DesignToken } from "../types";
import { useTokensForKind } from "./useTokensForKind";

export type MotionTokensState = ReturnType<typeof useTokensForKind>;

export function useMotionTokens(initialTokens: DesignToken[]) {
  return useTokensForKind("motion", initialTokens);
}
