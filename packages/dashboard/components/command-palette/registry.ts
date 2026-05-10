/**
 * Singleton command registry for Cmd+K palette.
 *
 * Module-level Map: registration is decoupled from React tree lifecycle so
 * dashboard commands registered at app boot persist across route changes.
 *
 * Subscriber pattern lets the palette UI re-render when commands change.
 */

import type {
  Command,
  RegisterCommand,
  Unregister,
} from "@buildrik/shared/command-registry";

const commands = new Map<string, Command>();
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((cb) => cb());
}

export const registerCommand: RegisterCommand = (cmd: Command): Unregister => {
  if (commands.has(cmd.id)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[command-registry] duplicate id "${cmd.id}" — overwriting prior registration`,
      );
    }
  }
  commands.set(cmd.id, cmd);
  notify();
  return () => {
    if (commands.get(cmd.id) === cmd) {
      commands.delete(cmd.id);
      notify();
    }
  };
};

export function getActiveCommands(pathname: string): Command[] {
  const out: Command[] = [];
  for (const cmd of commands.values()) {
    if (!cmd.visibleWhen || cmd.visibleWhen(pathname)) {
      out.push(cmd);
    }
  }
  out.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return out;
}

export function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

/** Test-only escape hatch. */
export function _resetRegistry(): void {
  commands.clear();
  subscribers.clear();
}
