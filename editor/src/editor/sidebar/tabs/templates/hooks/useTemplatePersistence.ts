/**
 * useTemplatePersistence — manages applied template ID across sessions.
 * Reads from sessionStorage on mount; callers persist via saveAppliedId / clearAppliedId.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { loadAppliedId } from "../templatesStorage";

export interface UseTemplatePersistenceReturn {
  appliedId: string | null;
  setAppliedId: (id: string | null) => void;
}

export function useTemplatePersistence(): UseTemplatePersistenceReturn {
  const [appliedId, setAppliedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const persisted = loadAppliedId();
    if (persisted) setAppliedId(persisted);
  }, []);

  return { appliedId, setAppliedId };
}
