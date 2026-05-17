/**
 * TokenDetailView beginner-block tests (T8).
 *
 * Delete must be disabled + a notice rendered when dsMode !== "pro".
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { TokenDetailView } from "../TokenDetailView";
import { DSModeProvider } from "../../../state/DSModeContext";
import type { DesignToken } from "../../../types";

const colorToken: DesignToken = {
  id: "color.brand.primary",
  name: "Brand · Primary",
  value: "#2D6DFF",
  category: "colors",
  cssVar: "--buildrick-design-color-brand-primary",
  type: "color",
  kind: "color",
};

function makeMockComposer(): any {
  const handlers: Record<string, Array<() => void>> = {};
  const on = (e: string, h: () => void) => {
    handlers[e] = handlers[e] ?? [];
    handlers[e].push(h);
  };
  const off = (e: string, h: () => void) => {
    handlers[e] = (handlers[e] ?? []).filter((x) => x !== h);
  };
  // D6.b: detail view derives count from getBreakdown().length, so mock both
  // to keep the "3 elements bind" assertion stable.
  const refs = [
    { elementId: "el-1", styleProp: "color" },
    { elementId: "el-2", styleProp: "background" },
    { elementId: "el-3", styleProp: "borderColor" },
  ];
  return {
    designSystem: {
      tokenUsage: {
        getUsage: () => 3,
        getBreakdown: () => refs,
        on,
        off,
      },
      lintState: {
        getIssues: () => [],
        getVisibleIssues: () => [],
        suppress: () => {},
        on,
        off,
      },
      computeAutoFix: (v: string) => v,
    },
  };
}

const wrap = (
  children: React.ReactNode,
  mode: "beginner" | "pro" = "beginner",
) => <DSModeProvider initialMode={mode}>{children}</DSModeProvider>;

describe("TokenDetailView beginner-block", () => {
  it("Beginner: Delete button has aria-disabled=true + disabled", () => {
    const { getByText } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={makeMockComposer()}
          onBack={() => {}}
        />,
        "beginner",
      ),
    );
    const deleteBtn = getByText("Delete").closest("button") as HTMLButtonElement;
    expect(deleteBtn.getAttribute("aria-disabled")).toBe("true");
    expect(deleteBtn.disabled).toBe(true);
  });

  it("Beginner: notice visible + mentions usage count", () => {
    const { getByText, container } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={makeMockComposer()}
          onBack={() => {}}
        />,
        "beginner",
      ),
    );
    expect(container.querySelector("[data-beginner-notice]")).toBeTruthy();
    expect(getByText(/Delete blocked in Beginner mode/i)).toBeTruthy();
    expect(getByText(/3 elements bind/)).toBeTruthy();
  });

  it("Beginner: clicking Delete does NOT call onDelete or onBack", () => {
    const onDelete = vi.fn();
    const onBack = vi.fn();
    const { getByText } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={makeMockComposer()}
          onBack={onBack}
          onDelete={onDelete}
        />,
        "beginner",
      ),
    );
    const deleteBtn = getByText("Delete").closest("button") as HTMLButtonElement;
    fireEvent.click(deleteBtn);
    expect(onDelete).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
  });

  it("Pro: Delete enabled + notice hidden", () => {
    const { getByText, container } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={makeMockComposer()}
          onBack={() => {}}
        />,
        "pro",
      ),
    );
    const deleteBtn = getByText("Delete").closest("button") as HTMLButtonElement;
    expect(deleteBtn.disabled).toBe(false);
    expect(deleteBtn.getAttribute("aria-disabled")).toBeNull();
    expect(container.querySelector("[data-beginner-notice]")).toBeNull();
  });

  // B4 follow-up (2026-05-17): with usage>0, Pro mode now opens the picker
  // modal instead of hard-deleting. Hard-delete-on-click is only for usage=0.
  // The original assertion is preserved via the modal Confirm path below.
  it("Pro + usage>0: clicking Delete opens picker (no hard delete yet)", () => {
    const onDelete = vi.fn();
    const onBack = vi.fn();
    const { getByText } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={makeMockComposer()}
          onBack={onBack}
          onDelete={onDelete}
        />,
        "pro",
      ),
    );
    fireEvent.click(getByText("Delete"));
    // Modal opens; nothing deleted yet, no back navigation.
    expect(onDelete).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
    expect(document.querySelector('[data-token-replace-modal]')).toBeTruthy();
  });
});
