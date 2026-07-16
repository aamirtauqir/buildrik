/**
 * KeybindingManager — shortcut normalization, command indexing, and
 * keydown dispatch wiring.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { KeybindingManager } from "../KeybindingManager";
import type { CommandData } from "@/shared/types";

const managers: KeybindingManager[] = [];

function makeManager(): KeybindingManager {
  const m = new KeybindingManager();
  managers.push(m);
  return m;
}

function cmd(id: string, shortcut?: string, shortcuts?: string[]): CommandData {
  return { id, label: id, shortcut, shortcuts, run: vi.fn() };
}

afterEach(() => {
  // Tear down window listeners so tests don't cross-dispatch.
  managers.splice(0).forEach((m) => m.destroy());
});

describe("normalizeShortcut", () => {
  const m = new KeybindingManager();

  it("maps meta/cmd/command/control to ctrl", () => {
    expect(m.normalizeShortcut("Meta+Shift+Z")).toBe("ctrl+shift+z");
    expect(m.normalizeShortcut("cmd+s")).toBe("ctrl+s");
    expect(m.normalizeShortcut("COMMAND+D")).toBe("ctrl+d");
    expect(m.normalizeShortcut("control+p")).toBe("ctrl+p");
  });

  it("maps option to alt", () => {
    expect(m.normalizeShortcut("option+a")).toBe("alt+a");
  });

  it("dedupes equivalent modifiers (ctrl+meta collapses to one ctrl)", () => {
    expect(m.normalizeShortcut("ctrl+meta+k")).toBe("ctrl+k");
  });

  it("preserves modifier encounter order (does NOT canonicalize ordering)", () => {
    // Behavior pin: mods keep the order they appear in the input string.
    expect(m.normalizeShortcut("shift+ctrl+p")).toBe("shift+ctrl+p");
    expect(m.normalizeShortcut("ctrl+shift+p")).toBe("ctrl+shift+p");
  });

  it.todo(
    "AUDIT: normalizeShortcut preserves modifier encounter order instead of canonicalizing to " +
      "ctrl→shift→alt, while getShortcutString always emits that canonical order from real " +
      "keyboard events. A command authored with shortcut 'shift+ctrl+p' indexes under " +
      "'shift+ctrl+p' and can therefore NEVER fire from the keyboard ('ctrl+shift+p' is looked " +
      "up). All current defaultCommands happen to use canonical order, so this is latent.",
  );

  it("trims whitespace around parts", () => {
    expect(m.normalizeShortcut(" ctrl + x ")).toBe("ctrl+x");
  });

  it("passes through a bare key", () => {
    expect(m.normalizeShortcut("Escape")).toBe("escape");
  });
});

describe("indexCommand / findCommandId / removeByCommandId", () => {
  it("indexes the primary shortcut field", () => {
    const m = makeManager();
    m.indexCommand(cmd("undo", "ctrl+z"));
    expect(m.findCommandId("ctrl+z")).toBe("undo");
  });

  it("indexes every alias in the shortcuts array", () => {
    const m = makeManager();
    m.indexCommand(cmd("redo", "ctrl+shift+z", ["ctrl+shift+z", "ctrl+y"]));
    expect(m.findCommandId("ctrl+shift+z")).toBe("redo");
    expect(m.findCommandId("ctrl+y")).toBe("redo");
  });

  it("normalizes shortcuts before indexing (cmd+K resolves via ctrl+k)", () => {
    const m = makeManager();
    m.indexCommand(cmd("palette", "cmd+K"));
    expect(m.findCommandId("ctrl+k")).toBe("palette");
  });

  it("re-indexing a command removes its stale shortcuts first", () => {
    const m = makeManager();
    m.indexCommand(cmd("zoom", "ctrl+1"));
    m.indexCommand(cmd("zoom", "ctrl+2"));
    expect(m.findCommandId("ctrl+1")).toBeUndefined();
    expect(m.findCommandId("ctrl+2")).toBe("zoom");
  });

  it("removeByCommandId removes all entries for that command only", () => {
    const m = makeManager();
    m.indexCommand(cmd("a", "ctrl+a", ["ctrl+a", "ctrl+shift+a"]));
    m.indexCommand(cmd("b", "ctrl+b"));
    m.removeByCommandId("a");
    expect(m.findCommandId("ctrl+a")).toBeUndefined();
    expect(m.findCommandId("ctrl+shift+a")).toBeUndefined();
    expect(m.findCommandId("ctrl+b")).toBe("b");
  });

  it("ignores commands with no shortcut fields (empty string filtered out)", () => {
    const m = makeManager();
    m.indexCommand(cmd("export-html"));
    m.indexCommand(cmd("blank", ""));
    expect(m.findCommandId("")).toBeUndefined();
  });
});

describe("setup — keydown dispatch", () => {
  it("fires onShortcut with the command id and prevents default", () => {
    const m = makeManager();
    const onShortcut = vi.fn();
    m.indexCommand(cmd("undo", "ctrl+z"));
    m.setup(onShortcut, () => true);

    const e = new KeyboardEvent("keydown", { key: "z", ctrlKey: true, cancelable: true });
    window.dispatchEvent(e);

    expect(onShortcut).toHaveBeenCalledWith("undo", e);
    expect(e.defaultPrevented).toBe(true);
  });

  it("resolves metaKey through the same ctrl-normalized index", () => {
    const m = makeManager();
    const onShortcut = vi.fn();
    m.indexCommand(cmd("save", "ctrl+s"));
    m.setup(onShortcut, () => true);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", metaKey: true }));
    expect(onShortcut).toHaveBeenCalledWith("save", expect.any(KeyboardEvent));
  });

  it("does not fire (nor preventDefault) when shouldHandle returns false", () => {
    const m = makeManager();
    const onShortcut = vi.fn();
    m.indexCommand(cmd("delete", "delete"));
    m.setup(onShortcut, () => false);

    const e = new KeyboardEvent("keydown", { key: "Delete", cancelable: true });
    window.dispatchEvent(e);

    expect(onShortcut).not.toHaveBeenCalled();
    expect(e.defaultPrevented).toBe(false);
  });

  it("ignores unregistered shortcuts", () => {
    const m = makeManager();
    const onShortcut = vi.fn();
    m.indexCommand(cmd("undo", "ctrl+z"));
    m.setup(onShortcut, () => true);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "q", ctrlKey: true }));
    expect(onShortcut).not.toHaveBeenCalled();
  });

  it("destroy removes the listener and clears the index", () => {
    const m = makeManager();
    const onShortcut = vi.fn();
    m.indexCommand(cmd("undo", "ctrl+z"));
    m.setup(onShortcut, () => true);

    m.destroy();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true }));
    expect(onShortcut).not.toHaveBeenCalled();
    expect(m.findCommandId("ctrl+z")).toBeUndefined();
  });
});
