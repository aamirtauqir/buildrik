/**
 * Unification spec §550 — EditorLayout wraps children in
 * EditorCommandRegistryProvider so editor descendants can register Cmd+K
 * commands without importing dashboard directly (cherry-pick #4).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import EditorLayout from "../layout";
import { useRegisterCommand } from "@/components/command-palette/EditorCommandRegistryContext";
import { getActiveCommands, _resetRegistry } from "@/components/command-palette/registry";

function Descendant() {
  const register = useRegisterCommand();
  register({ id: "edit:test", label: "Test", action: () => {} });
  return null;
}

describe("EditorLayout", () => {
  beforeEach(() => _resetRegistry());

  it("provides a working command registry to descendants", () => {
    render(
      <EditorLayout>
        <Descendant />
      </EditorLayout>,
    );
    const cmds = getActiveCommands("/edit/abc");
    expect(cmds.find((c) => c.id === "edit:test")).toBeTruthy();
  });

  it("renders children passthrough", () => {
    const { getByText } = render(
      <EditorLayout>
        <span>child node</span>
      </EditorLayout>,
    );
    expect(getByText("child node")).toBeInTheDocument();
  });
});
