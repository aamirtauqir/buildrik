// @vitest-environment jsdom
/**
 * TemplatesTab IA tests — prototype-v3 S1 information architecture
 * Verifies top-level pills are All / Site Pages / Sections / My Templates
 * (not the old industry-vertical pills).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Composer } from "@/engine";
import userEvent from "@testing-library/user-event";
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
  it("the catalogue keeps top-level pills: All, Site Pages, Sections, My Templates", () => {
    render(<TemplatesTab composer={null} />);
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Site Pages" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sections" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "My Templates" })).toBeInTheDocument();
  });

  it("clicking 'Site Pages' reveals Page Templates / Section Templates type pills", async () => {
    const user = userEvent.setup();
    render(<TemplatesTab composer={null} />);
    await user.click(screen.getByRole("tab", { name: "Site Pages" }));
    expect(screen.getByRole("tab", { name: /Page Templates/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Section Templates/ })).toBeInTheDocument();
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

/* Decision #24: new-page mode is gone with the drawer — a new page from a
   template is the New-page modal's From template (#19) or the view's own
   Create page. Search stays behind the header toggle. */
describe("TemplatesTab — search", () => {
  const bareComposer = () =>
    ({
      on: () => {},
      off: () => {},
      emit: () => {},
      elements: { getActivePage: () => null },
    }) as unknown as Composer;

  it("keeps search behind its header toggle", () => {
    render(<TemplatesTab composer={bareComposer()} />);
    expect(screen.queryByRole("textbox", { name: "Search templates" })).toBeNull();
  });
});
