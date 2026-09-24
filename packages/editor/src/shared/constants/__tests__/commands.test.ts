/**
 * constants/commands — isValidCommand.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { COMMANDS, isValidCommand } from "../commands";

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

