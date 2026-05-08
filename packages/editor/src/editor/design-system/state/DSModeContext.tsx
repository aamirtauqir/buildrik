/**
 * DSModeContext — beginner | pro display mode for the Design System surface.
 *
 * Per spec §4 row 2: mode is DISPLAY-ONLY. Engine state is identical in
 * either mode. Mode flip is instant, no data loss. Persisted per-user
 * (not per-project) under `buildrik:ds-mode`.
 *
 * Consumers:
 *   - Design tab Tokens section: empty kinds muted in beginner, equal in pro
 *   - Inspector: token IDs / CSS vars hidden in beginner, shown in pro
 *   - Off-DS overrides: warn-then-allow in beginner, silent allow in pro
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

export type DSMode = "beginner" | "pro";

const STORAGE_KEY = "buildrik:ds-mode";
const DEFAULT_MODE: DSMode = "beginner";

interface DSModeContextValue {
  mode: DSMode;
  setMode: (next: DSMode) => void;
  toggle: () => void;
  isBeginner: boolean;
  isPro: boolean;
}

const DSModeContext = React.createContext<DSModeContextValue | null>(null);

function readPersisted(): DSMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "pro" ? "pro" : "beginner";
  } catch {
    return DEFAULT_MODE;
  }
}

function writePersisted(mode: DSMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // private browsing → in-memory only
  }
}

export interface DSModeProviderProps {
  /** Optional override for tests; otherwise reads localStorage. */
  initialMode?: DSMode;
  children: React.ReactNode;
}

export const DSModeProvider: React.FC<DSModeProviderProps> = ({ initialMode, children }) => {
  const [mode, setModeState] = React.useState<DSMode>(() => initialMode ?? readPersisted());

  const setMode = React.useCallback((next: DSMode) => {
    setModeState(next);
    writePersisted(next);
  }, []);

  const toggle = React.useCallback(() => {
    setModeState((prev) => {
      const next: DSMode = prev === "beginner" ? "pro" : "beginner";
      writePersisted(next);
      return next;
    });
  }, []);

  const value = React.useMemo<DSModeContextValue>(
    () => ({
      mode,
      setMode,
      toggle,
      isBeginner: mode === "beginner",
      isPro: mode === "pro",
    }),
    [mode, setMode, toggle]
  );

  return <DSModeContext.Provider value={value}>{children}</DSModeContext.Provider>;
};

export function useDSMode(): DSModeContextValue {
  const ctx = React.useContext(DSModeContext);
  if (!ctx) throw new Error("useDSMode must be used within DSModeProvider");
  return ctx;
}

/** Non-throwing variant for chrome that may render outside the provider. */
export function useDSModeOptional(): DSModeContextValue | null {
  return React.useContext(DSModeContext);
}
