/**
 * constants/commands — isValidCommand + getShortcut.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { COMMANDS, isValidCommand, getShortcut } from "../commands";

describe("isValidCommand", () => {
  it("accepts known command ids", () => {
    expect(isValidCommand(COMMANDS.UNDO)).toBe(true);
    expect(isValidCommand("undo")).toBe(true);
  });
  it("rejects unknown ids", () => {
    expect(isValidCommand("not-a-command")).toBe(false);
    expect(isValidCommand("")).toBe(false);
  });
});

describe("getShortcut", () => {
  it("returns the mapped shortcut string", () => {
    expect(getShortcut(COMMANDS.TOGGLE_DEBUG)).toBe("Mod+Shift+D");
  });
  it("returns null for commands with a null shortcut", () => {
    expect(getShortcut(COMMANDS.CLEAR_CONSOLE)).toBeNull();
    expect(getShortcut(COMMANDS.INSPECT_ELEMENT)).toBeNull();
  });
});
