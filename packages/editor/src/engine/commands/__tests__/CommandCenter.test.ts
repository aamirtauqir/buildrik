/**
 * CommandCenter — registration, execution, keybinding dispatch, and the
 * delete-in-input guard. Uses a mock Composer (CommandCenter only needs
 * emit + the manager surfaces the default commands touch).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { CommandCenter } from "../CommandCenter";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "../../Composer";
import type { CommandData } from "@/shared/types";

function makeComposer() {
  return {
    emit: vi.fn(),
    history: { undo: vi.fn(), redo: vi.fn() },
    selection: {
      getSelected: vi.fn(() => null),
      getSelectedIds: vi.fn(() => [] as string[]),
      select: vi.fn(),
      selectMultiple: vi.fn(),
      clear: vi.fn(),
    },
    elements: {
      removeElement: vi.fn(),
      serializeElement: vi.fn(() => "serialized"),
      getActivePage: vi.fn(() => null),
      getElement: vi.fn(() => null),
      pasteElement: vi.fn(),
      duplicateElement: vi.fn(),
      groupElements: vi.fn(),
      ungroupElement: vi.fn(),
    },
    getState: vi.fn(() => ({ zoom: 100, snapToGrid: false, gridSize: 8 })),
    setZoom: vi.fn(),
    setDevice: vi.fn(),
    setSnapToGrid: vi.fn(),
    saveProject: vi.fn(),
    exportHTML: vi.fn(() => ({ html: "", css: "", combined: "" })),
    exportJSON: vi.fn(() => "{}"),
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    clipboard: null as string | null,
  };
}

const centers: CommandCenter[] = [];

function makeCenter(composer = makeComposer()) {
  const center = new CommandCenter(composer as unknown as Composer);
  centers.push(center);
  return { center, composer };
}

afterEach(() => {
  centers.splice(0).forEach((c) => c.destroy());
  document.body.replaceChildren();
});

describe("construction", () => {
  it("registers the full default command set and emits command:registered for each", () => {
    const { center, composer } = makeCenter();

    expect(center.get("undo")).toBeDefined();
    expect(center.get("copy")).toBeDefined();
    expect(center.get("paste")).toBeDefined();
    expect(center.get("zoom-in")).toBeDefined();
    expect(center.get("device-mobile")).toBeDefined();
    expect(center.getAll().length).toBeGreaterThan(30);

    const registeredEvents = composer.emit.mock.calls.filter(
      ([e]) => e === EVENTS.COMMAND_REGISTERED,
    );
    expect(registeredEvents.length).toBe(center.getAll().length);
  });
});

describe("register / unregister", () => {
  it("register adds the command, indexes its shortcut, and emits command:registered", () => {
    const { center, composer } = makeCenter();
    const run = vi.fn();
    const custom: CommandData = { id: "my-cmd", label: "Mine", shortcut: "ctrl+shift+9", run };

    center.register(custom);

    expect(center.get("my-cmd")).toBe(custom);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.COMMAND_REGISTERED, custom);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "9", ctrlKey: true, shiftKey: true }));
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("unregister removes the command + its keybinding and emits command:unregistered", () => {
    const { center, composer } = makeCenter();
    const run = vi.fn();
    center.register({ id: "my-cmd", label: "Mine", shortcut: "ctrl+shift+9", run });

    expect(center.unregister("my-cmd")).toBe(true);
    expect(center.get("my-cmd")).toBeUndefined();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.COMMAND_UNREGISTERED, "my-cmd");

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "9", ctrlKey: true, shiftKey: true }));
    expect(run).not.toHaveBeenCalled();
  });

  it("unregister of an unknown id returns false without emitting", () => {
    const { center, composer } = makeCenter();
    composer.emit.mockClear();
    expect(center.unregister("nope")).toBe(false);
    expect(composer.emit).not.toHaveBeenCalledWith(EVENTS.COMMAND_UNREGISTERED, "nope");
  });
});

describe("run / stop", () => {
  it("run emits command:before + command:run, returns the result, and marks active", () => {
    const { center, composer } = makeCenter();
    const run = vi.fn(() => "result");
    center.register({ id: "my-cmd", label: "Mine", run });
    composer.emit.mockClear();

    const result = center.run("my-cmd", { a: 1 });

    expect(result).toBe("result");
    expect(run).toHaveBeenCalledWith(composer, { a: 1 });
    expect(composer.emit).toHaveBeenNthCalledWith(1, EVENTS.COMMAND_BEFORE, {
      id: "my-cmd",
      options: { a: 1 },
    });
    expect(composer.emit).toHaveBeenNthCalledWith(2, EVENTS.COMMAND_RUN, {
      id: "my-cmd",
      options: { a: 1 },
      result: "result",
    });
    expect(center.isActive("my-cmd")).toBe(true);
  });

  it("run of an unknown id is a silent no-op (no events)", () => {
    const { center, composer } = makeCenter();
    composer.emit.mockClear();
    expect(center.run("ghost")).toBeUndefined();
    expect(composer.emit).not.toHaveBeenCalled();
  });

  it("run rethrows command errors after emitting command:error", () => {
    const { center, composer } = makeCenter();
    const boom = new Error("boom");
    center.register({
      id: "bad",
      label: "Bad",
      run: () => {
        throw boom;
      },
    });
    composer.emit.mockClear();

    expect(() => center.run("bad")).toThrow("boom");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.COMMAND_ERROR, { id: "bad", error: boom });
    expect(center.isActive("bad")).toBe(false);
  });

  it("stop invokes the command's stop handler, clears active, and emits command:stop", () => {
    const { center, composer } = makeCenter();
    const stop = vi.fn();
    center.register({ id: "toggling", label: "T", run: vi.fn(), stop });
    center.run("toggling");
    composer.emit.mockClear();

    center.stop("toggling", { why: "test" });

    expect(stop).toHaveBeenCalledWith(composer, { why: "test" });
    expect(center.isActive("toggling")).toBe(false);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.COMMAND_STOP, {
      id: "toggling",
      options: { why: "test" },
    });
  });

  it("stop on a command without a stop handler emits nothing", () => {
    const { center, composer } = makeCenter();
    center.register({ id: "one-shot", label: "O", run: vi.fn() });
    center.run("one-shot");
    composer.emit.mockClear();

    center.stop("one-shot");

    expect(composer.emit).not.toHaveBeenCalled();
    // Active flag only clears through a stop handler — stays set here.
    expect(center.isActive("one-shot")).toBe(true);
  });
});

describe("delete shortcut guard (shouldHandleShortcut)", () => {
  it("suppresses the delete command when typing in an input", () => {
    const { composer } = makeCenter();
    const input = document.createElement("input");
    document.body.appendChild(input);

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true }));

    expect(composer.selection.getSelected).not.toHaveBeenCalled();
  });

  it("suppresses the delete command inside contenteditable", () => {
    const { composer } = makeCenter();
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    document.body.appendChild(div);

    div.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }));

    expect(composer.selection.getSelected).not.toHaveBeenCalled();
  });

  it("runs the delete command when the target is not editable", () => {
    const { composer } = makeCenter();

    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true }));

    expect(composer.selection.getSelected).toHaveBeenCalled();
  });

  it("does NOT suppress non-delete shortcuts inside inputs (guard is delete-only)", () => {
    const { composer } = makeCenter();
    const input = document.createElement("input");
    document.body.appendChild(input);

    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }),
    );

    expect(composer.history.undo).toHaveBeenCalled();
  });
});

describe("destroy", () => {
  it("clears commands and detaches keybindings", () => {
    const { center, composer } = makeCenter();
    center.destroy();

    expect(center.getAll()).toHaveLength(0);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true }));
    expect(composer.history.undo).not.toHaveBeenCalled();
  });
});

describe("AUDIT — command registry reachability", () => {
  it.todo(
    "AUDIT: registered 'export-html' and 'export-json' commands are unreachable — they have no " +
      "shortcut field (so KeybindingManager never indexes them) and no UI affordance calls " +
      "commands.run('export-html') / commands.run('export-json') anywhere in src/editor. " +
      "Either wire an affordance or delete the registrations.",
  );

  it.todo(
    "AUDIT: CommandPalette (src/editor/shell/modals/CommandPalette.tsx) builds its own hardcoded " +
      "command list (composer.history.undo(), composer.emit(ZOOM_IN), ...) and never reads the " +
      "CommandCenter registry — commands registered via composer.commands.register() never appear " +
      "in the palette, and palette entries bypass command:before/run/error telemetry events.",
  );
});
