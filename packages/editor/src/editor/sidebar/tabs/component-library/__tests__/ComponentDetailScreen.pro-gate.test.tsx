/**
 * ComponentDetailScreen Pro-mode gate tests (Spec H)
 *
 * Detach instance button must be hidden in beginner mode and visible in
 * pro mode. Swap stays in both modes (only Detach is Pro-gated per spec).
 *
 * Closes the T13 gating gap flagged by holistic final review: T13
 * shipped DetachConfirmModal but did not gate the trigger button.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { ComponentDetailScreen } from "../ComponentDetailScreen";
import { DSModeProvider, type DSMode } from "../../../../design-system/state/DSModeContext";
import { ToastProvider } from "@/editor/shared/vibcoder";
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
          onSwapComponent={() => {}}
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

  it("keeps Swap visible in beginner mode (only Detach is Pro-gated)", () => {
    const { queryByText } = renderAt("beginner", true);
    expect(queryByText(/Swap component/i)).not.toBeNull();
  });

  it("does not render Instance Actions area when no instance is selected", () => {
    const { queryByText } = renderAt("pro", false);
    expect(queryByText(/Detach instance/i)).toBeNull();
    expect(queryByText(/Swap component/i)).toBeNull();
  });
});
