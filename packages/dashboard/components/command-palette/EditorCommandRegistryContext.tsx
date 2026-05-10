"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { RegisterCommand } from "@buildrik/shared/command-registry";
import { registerCommand } from "./registry";

/**
 * Bridge for editor → registry without violating dependency direction.
 * Editor consumes RegisterCommand via context, never imports from
 * packages/dashboard directly.
 *
 * Mounted at app/edit/[siteId]/layout.tsx (Phase 1) so editor commands
 * register only when the editor route is active.
 */

const EditorCommandRegistryContext = createContext<RegisterCommand | null>(null);

export function EditorCommandRegistryProvider({ children }: { children: ReactNode }) {
  return (
    <EditorCommandRegistryContext.Provider value={registerCommand}>
      {children}
    </EditorCommandRegistryContext.Provider>
  );
}

/**
 * Returns the register function. Returns a no-op if outside provider — keeps
 * editor stable when imported from non-Next contexts (Vite dev harness).
 */
export function useRegisterCommand(): RegisterCommand {
  const ctx = useContext(EditorCommandRegistryContext);
  return ctx ?? (() => () => {});
}
