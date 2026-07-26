/**
 * ComponentDetailScreen Pro-mode gate tests (Spec H)
 *
 * Detach instance button must be hidden in beginner mode and visible in
 * pro mode. (The "Swap component" action was removed — it had no engine
 * completion path; the Instance Actions area is now Detach-only / Pro-only.)
 *
 * Closes the T13 gating gap flagged by holistic final review: T13
 * shipped DetachConfirmModal but did not gate the trigger button.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/ui";
import { ComponentDetailScreen } from "../ComponentDetailScreen";
import { DSModeProvider, type DSMode } from "../../../../design-system/state/DSModeContext";
import type { ComponentDefinition } from "../../../../../shared/types/components";

function makeComponent(): ComponentDefinition {
  return {
    id: "cmp-1",
    name: "Test Card",
    masterTree: {
      id: "el-master",
      type: "div",
      styles: {},
      children: [],
    } as unknown as ComponentDefinition["masterTree"],
    createdAt: 0,
    updatedAt: 0,
    version: 1,
  };
}

function renderAt(mode: DSMode, isInstanceSelected: boolean) {
  return render(
    <ToastProvider>
      <DSModeProvider initialMode={mode}>
        <ComponentDetailScreen
          component={makeComponent()}
          composer={null}
          onBack={() => {}}
          isInstanceSelected={isInstanceSelected}
          onDetachInstance={() => {}}
        />
      </DSModeProvider>
    </ToastProvider>
  );
}

describe("ComponentDetailScreen — Pro-mode gate for Detach (Spec H)", () => {
  it("hides Detach button in beginner mode even when an instance is selected", () => {
    const { queryByText } = renderAt("beginner", true);
    expect(queryByText(/Detach instance/i)).toBeNull();
  });

  it("renders Detach button in pro mode when an instance is selected", () => {
    const { queryByText } = renderAt("pro", true);
    expect(queryByText(/Detach instance/i)).not.toBeNull();
  });

  it("does not render the removed Swap action in any mode", () => {
    expect(renderAt("beginner", true).queryByText(/Swap component/i)).toBeNull();
    expect(renderAt("pro", true).queryByText(/Swap component/i)).toBeNull();
  });

  it("does not render Instance Actions area when no instance is selected", () => {
    const { queryByText } = renderAt("pro", false);
    expect(queryByText(/Detach instance/i)).toBeNull();
  });
});
