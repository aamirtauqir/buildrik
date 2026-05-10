"use client";

import type { ReactNode } from "react";
import { UnifiedEditorFlagContext } from "./unified-flag";

export function UnifiedEditorFlagProvider({
  value,
  children,
}: {
  value: boolean;
  children: ReactNode;
}) {
  return (
    <UnifiedEditorFlagContext.Provider value={value}>
      {children}
    </UnifiedEditorFlagContext.Provider>
  );
}
