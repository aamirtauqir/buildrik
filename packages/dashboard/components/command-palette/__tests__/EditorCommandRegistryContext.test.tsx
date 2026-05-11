/**
 * Unification spec §550 — EditorCommandRegistryContext (cherry-pick #4).
 * Editor consumes register fn via context; outside provider, useRegisterCommand
 * returns a no-op (keeps editor stable in Vite dev harness).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import {
  EditorCommandRegistryProvider,
  useRegisterCommand,
} from "../EditorCommandRegistryContext";
import { getActiveCommands, _resetRegistry } from "../registry";

function Mount({ onRegister }: { onRegister: (reg: ReturnType<typeof useRegisterCommand>) => void }) {
  const register = useRegisterCommand();
  onRegister(register);
  return null;
}

describe("EditorCommandRegistryContext", () => {
  beforeEach(() => _resetRegistry());

  it("inside provider: register actually adds to module registry", () => {
    let register!: ReturnType<typeof useRegisterCommand>;
    render(
      <EditorCommandRegistryProvider>
        <Mount onRegister={(r) => (register = r)} />
      </EditorCommandRegistryProvider>,
    );
    expect(getActiveCommands("/edit/abc")).toHaveLength(0);
    act(() => {
      register({ id: "editor:save", label: "Save", action: () => {} });
    });
    const cmds = getActiveCommands("/edit/abc");
    expect(cmds).toHaveLength(1);
    expect(cmds[0].id).toBe("editor:save");
  });

  it("outside provider: useRegisterCommand returns a no-op", () => {
    let register!: ReturnType<typeof useRegisterCommand>;
    render(<Mount onRegister={(r) => (register = r)} />);
    const undo = register({ id: "ignored", label: "X", action: () => {} });
    expect(getActiveCommands("/x")).toHaveLength(0);
    // unregister also a no-op — shouldn't throw
    expect(() => undo()).not.toThrow();
  });

  it("register returns a working unregister fn inside provider", () => {
    let register!: ReturnType<typeof useRegisterCommand>;
    render(
      <EditorCommandRegistryProvider>
        <Mount onRegister={(r) => (register = r)} />
      </EditorCommandRegistryProvider>,
    );
    let undo: (() => void) | undefined;
    act(() => {
      undo = register({ id: "editor:undo", label: "Undo", action: () => {} });
    });
    expect(getActiveCommands("/edit/x")).toHaveLength(1);
    act(() => undo?.());
    expect(getActiveCommands("/edit/x")).toHaveLength(0);
  });
});
