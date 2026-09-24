/**
 * TokenDetailView beginner-block tests (T8, rewritten for C1 (ii)).
 *
 * Delete is the card's ⋯ menu item (7315:80955). In Beginner it is disabled
 * and its title says why and how out; the drawer-era notice block under the
 * action row is not on the board.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
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

const renderCard = (mode: "beginner" | "pro", onDelete = vi.fn()) => {
  const utils = render(
    wrap(<TokenDetailView token={colorToken} composer={makeMockComposer()} onDelete={onDelete} />, mode),
  );
  fireEvent.click(utils.getByTestId("brand-token-menu"));
  const deleteBtn = screen.getByTestId("brand-token-action-delete") as HTMLButtonElement;
  return { ...utils, deleteBtn, onDelete };
};

describe("TokenDetailView beginner-block", () => {
  it("Beginner: Delete item has aria-disabled=true + disabled", () => {
    const { deleteBtn } = renderCard("beginner");
    expect(deleteBtn.getAttribute("aria-disabled")).toBe("true");
    expect(deleteBtn.disabled).toBe(true);
  });

  it("Beginner: the item says why it is blocked and how to get out", () => {
    const { deleteBtn } = renderCard("beginner");
    expect(deleteBtn.getAttribute("title")).toMatch(/blocked in Beginner mode/i);
    expect(deleteBtn.getAttribute("title")).toMatch(/Switch to Pro/);
  });

  it("Beginner: clicking Delete does NOT call onDelete", () => {
    const { deleteBtn, onDelete } = renderCard("beginner");
    fireEvent.click(deleteBtn);
    expect(onDelete).not.toHaveBeenCalled();
    expect(document.querySelector("[data-token-replace-modal]")).toBeNull();
  });

  it("Pro: Delete enabled, no blocked title", () => {
    const { deleteBtn } = renderCard("pro");
    expect(deleteBtn.disabled).toBe(false);
    expect(deleteBtn.getAttribute("aria-disabled")).toBeNull();
    expect(deleteBtn.getAttribute("title")).toBeNull();
  });

  // B4 follow-up (2026-05-17): with usage>0, Pro opens the replacement picker
  // instead of hard-deleting. Hard delete on click is only for usage=0.
  it("Pro + usage>0: clicking Delete opens picker (no hard delete yet)", () => {
    const { deleteBtn, onDelete } = renderCard("pro");
    fireEvent.click(deleteBtn);
    expect(onDelete).not.toHaveBeenCalled();
    expect(document.querySelector("[data-token-replace-modal]")).toBeTruthy();
  });
});
