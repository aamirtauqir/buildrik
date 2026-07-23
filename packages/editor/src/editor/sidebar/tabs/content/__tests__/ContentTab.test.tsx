/**
 * ContentTab (P4.2) — the data front-door. Verifies it lists the composer's
 * data sources, shows the data-first "New collection" action (which needs no
 * element selection), and degrades to a create-less empty state when the shell
 * doesn't provide the create callback.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/editor/shared/vibcoder";
import { ContentTab } from "../ContentTab";
import type { Composer } from "@/engine";

function composerWithSources(sources: unknown[]) {
  const handlers: Record<string, () => void> = {};
  return {
    data: {
      getAllSources: () => sources,
      on: (evt: string, cb: () => void) => { handlers[evt] = cb; },
      off: () => {},
    },
  } as unknown as Composer;
}

function renderTab(props: Partial<React.ComponentProps<typeof ContentTab>> = {}) {
  return render(
    <TooltipProvider>
      <ContentTab composer={composerWithSources([])} onCreateCollection={vi.fn()} {...props} />
    </TooltipProvider>,
  );
}

afterEach(cleanup);

describe("ContentTab", () => {
  it("lists data sources with their type and record count", () => {
    const composer = composerWithSources([
      { id: "posts", name: "Blog posts", type: "array", data: [{}, {}, {}] },
      { id: "cfg", name: "Site config", type: "object" },
    ]);
    renderTab({ composer });
    expect(screen.getByText("Blog posts")).toBeInTheDocument();
    expect(screen.getByText("3 records")).toBeInTheDocument();
    expect(screen.getByText("Collection")).toBeInTheDocument(); // array → "Collection"
    expect(screen.getByText("Site config")).toBeInTheDocument();
    expect(screen.getByText("Object")).toBeInTheDocument();
  });

  it("offers a data-first New collection action that needs no element", () => {
    const onCreateCollection = vi.fn();
    renderTab({ onCreateCollection });
    // Empty state shows the create CTA.
    fireEvent.click(screen.getAllByRole("button", { name: /new collection/i })[0]);
    expect(onCreateCollection).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state", () => {
    renderTab();
    expect(screen.getByText(/no data yet/i)).toBeInTheDocument();
  });

  it("hides the create action when the shell provides no callback", () => {
    renderTab({ onCreateCollection: undefined });
    expect(screen.queryByRole("button", { name: /new collection/i })).toBeNull();
  });
});
