// @vitest-environment jsdom
/**
 * TemplatesTab layout tests — prototype-v3 §2 inline detail panel.
 * Verifies grid stays visible beside detail (no display:none regression),
 * detail-layout wrapper carries --split modifier when detail open,
 * and header swaps "Templates" title for breadcrumb path in detail mode.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";

vi.mock("@/editor/shared/vibcoder", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/shared/vibcoder");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { TemplatesTab } from "../TemplatesTab";

describe("TemplatesTab — inline detail layout (prototype-v3 §2)", () => {
  it("applies tpl-detail-layout--split when a template card is selected", async () => {
    const user = userEvent.setup();
    const { container } = render(<TemplatesTab composer={null} />);

    const cards = container.querySelectorAll(".tpl-card");
    expect(cards.length).toBeGreaterThan(0);

    await user.click(cards[0]);

    const wrapper = container.querySelector(".tpl-detail-layout");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.classList.contains("tpl-detail-layout--split")).toBe(true);
  });

  it("keeps the grid visible (not display:none) when detail is open", async () => {
    const user = userEvent.setup();
    const { container } = render(<TemplatesTab composer={null} />);

    const cards = container.querySelectorAll(".tpl-card");
    await user.click(cards[0]);

    const gridArea = container.querySelector(".tpl-grid-area");
    expect(gridArea).not.toBeNull();
    const grid = container.querySelector(".tpl-grid");
    expect(grid).not.toBeNull();
    expect(grid?.children.length).toBeGreaterThan(0);
  });

  it("swaps the 'Templates' title for a breadcrumb path when detail is open", async () => {
    const user = userEvent.setup();
    const { container } = render(<TemplatesTab composer={null} />);

    const cards = container.querySelectorAll(".tpl-card");
    await user.click(cards[0]);

    // Title is replaced by breadcrumb
    expect(screen.queryByRole("heading", { name: "Templates" })).toBeNull();
    const headerBreadcrumb = container.querySelector(".tpl-header .tpl-header-breadcrumb");
    expect(headerBreadcrumb).not.toBeNull();
    expect(container.querySelector(".tpl-header-back")).not.toBeNull();
    expect(container.querySelector(".tpl-header-path-current")).not.toBeNull();
  });
});
