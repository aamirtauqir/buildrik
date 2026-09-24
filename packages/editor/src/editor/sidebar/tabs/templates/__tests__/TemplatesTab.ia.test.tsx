// @vitest-environment jsdom
/**
 * TemplatesTab IA tests — prototype-v3 S1 information architecture
 * Verifies top-level pills are All / Site Pages / Sections / My Templates
 * (not the old industry-vertical pills).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Composer } from "@/engine";
import * as React from "react";

vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { TemplatesTab } from "../TemplatesTab";

describe("TemplatesTab — new-design IA (S1)", () => {
  /* G2-095: board 4418:54134 is one flat list — no category, type or tag
     pills, no pagination; every page template is on the grid. */
  it("the catalogue is one flat grid — no pills, no pagination", () => {
    render(<TemplatesTab composer={null} />);
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(screen.queryByRole("navigation", { name: /pagination/i })).toBeNull();
    expect(screen.getAllByRole("option").length).toBeGreaterThanOrEqual(10);
  });

  it("does NOT show industry-vertical pills (Landing/Portfolio/SaaS/Blog/E-comm) at top level", () => {
    render(<TemplatesTab composer={null} />);
    expect(screen.queryByRole("tab", { name: "Landing" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Portfolio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "SaaS" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Blog" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "E-comm" })).not.toBeInTheDocument();
  });
});

/* Board 4418:54134 draws no search box and no header bar with ✕ — the
   sidebar's ‹ Back to canvas is the one way out. */
describe("TemplatesTab — no search, no header bar", () => {
  const bareComposer = () =>
    ({
      on: () => {},
      off: () => {},
      emit: () => {},
      elements: { getActivePage: () => null },
    }) as unknown as Composer;

  it("offers no search field or search toggle", () => {
    render(<TemplatesTab composer={bareComposer()} />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /search templates/i })).toBeNull();
  });
});
