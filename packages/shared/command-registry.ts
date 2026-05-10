/**
 * Cmd+K command registry contract — cherry-pick #4.
 *
 * Type lives in @buildrik/shared so both dashboard and editor can describe
 * commands without importing from each other. Singleton implementation lives
 * in dashboard. Editor receives registerCommand via React context — never
 * imports from packages/dashboard directly. Preserves dependency direction:
 * editor → shared (✓), editor → dashboard (NEVER).
 */

import type { ReactNode } from "react";

/** Router shape (subset of Next AppRouterInstance) commands need to navigate. */
export interface CommandRouter {
  push: (href: string) => void;
  back: () => void;
}

export type CommandGroup =
  | "navigation"
  | "site"
  | "editor"
  | "ai"
  | "settings"
  | "help";

export interface Command {
  id: string;
  label: string;
  group: CommandGroup;
  icon?: ReactNode;
  shortcut?: string;
  /** Imperative action. Receives router. May return a promise for awaiting. */
  action: (router: CommandRouter) => void | Promise<void>;
  /** Predicate over the current pathname. If absent, command is always active. */
  visibleWhen?: (pathname: string) => boolean;
  /** Higher number = earlier in palette. Default 0. */
  priority?: number;
}

/** Returned by registerCommand. Call it to remove the command. */
export type Unregister = () => void;

/** Type of the registry's register function exposed to editor via context. */
export type RegisterCommand = (cmd: Command) => Unregister;
