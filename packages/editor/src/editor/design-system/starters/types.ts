import type { DesignToken } from "../types";

export interface StarterDS {
  /** URL-safe id used in localStorage + tRPC. */
  id: string;
  /** User-facing label shown in the gallery. */
  name: string;
  /** One-sentence positioning. */
  description: string;
  /** Full token list — at minimum the 9 default color tokens. */
  tokens: DesignToken[];
}
