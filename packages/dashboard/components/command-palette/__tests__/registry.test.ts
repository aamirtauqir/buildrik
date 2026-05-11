/**
 * Unification spec §550 — command-registry (cherry-pick #4).
 * Module-level Map decouples registration from React tree lifecycle.
 * Tests subscribe/unsubscribe, visibleWhen filtering, priority sort, dup warning.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  registerCommand,
  getActiveCommands,
  subscribe,
  _resetRegistry,
} from "../registry";

describe("command-palette registry", () => {
  beforeEach(() => _resetRegistry());

  it("registerCommand returns a working unregister fn", () => {
    const unregister = registerCommand({
      id: "test:hello",
      label: "Hello",
      action: () => {},
    });
    expect(getActiveCommands("/dashboard/sites")).toHaveLength(1);
    unregister();
    expect(getActiveCommands("/dashboard/sites")).toHaveLength(0);
  });

  it("getActiveCommands filters by visibleWhen(pathname)", () => {
    registerCommand({
      id: "dash:only",
      label: "Dashboard only",
      action: () => {},
      visibleWhen: (p) => p.startsWith("/dashboard"),
    });
    registerCommand({
      id: "edit:only",
      label: "Editor only",
      action: () => {},
      visibleWhen: (p) => p.startsWith("/edit"),
    });
    const dash = getActiveCommands("/dashboard/sites").map((c) => c.id);
    expect(dash).toEqual(["dash:only"]);
    const edit = getActiveCommands("/edit/abc").map((c) => c.id);
    expect(edit).toEqual(["edit:only"]);
  });

  it("commands without visibleWhen are always active", () => {
    registerCommand({ id: "global", label: "Global", action: () => {} });
    expect(getActiveCommands("/anything")).toHaveLength(1);
  });

  it("sorts active commands by priority desc (higher first)", () => {
    registerCommand({ id: "low", label: "L", action: () => {}, priority: 1 });
    registerCommand({ id: "high", label: "H", action: () => {}, priority: 100 });
    registerCommand({ id: "mid", label: "M", action: () => {}, priority: 50 });
    const ids = getActiveCommands("/x").map((c) => c.id);
    expect(ids).toEqual(["high", "mid", "low"]);
  });

  it("subscribe fires on register + unregister; unsubscribe stops events", () => {
    const cb = vi.fn();
    const off = subscribe(cb);
    const unreg = registerCommand({ id: "a", label: "A", action: () => {} });
    expect(cb).toHaveBeenCalledTimes(1);
    unreg();
    expect(cb).toHaveBeenCalledTimes(2);
    off();
    registerCommand({ id: "b", label: "B", action: () => {} });
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("warns on duplicate id in non-prod and overwrites", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    registerCommand({ id: "dup", label: "first", action: () => {} });
    registerCommand({ id: "dup", label: "second", action: () => {} });
    expect(warn).toHaveBeenCalled();
    const cmds = getActiveCommands("/x");
    expect(cmds).toHaveLength(1);
    expect(cmds[0].label).toBe("second");
    warn.mockRestore();
  });

  it("unregister is a no-op if a newer registration overwrote the id", () => {
    const undo1 = registerCommand({ id: "x", label: "first", action: () => {} });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    registerCommand({ id: "x", label: "second", action: () => {} });
    undo1();
    const cmds = getActiveCommands("/x");
    expect(cmds).toHaveLength(1);
    expect(cmds[0].label).toBe("second");
  });
});
