/**
 * The site as a tree of routes — the hierarchy was always in the routes and
 * no view showed it.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { SiteStructureTree, buildRouteTree } from "../components/SiteStructureTree";
import type { PageItem } from "../types";

const page = (over: Partial<PageItem> & { id: string; name: string; slug: string }): PageItem => ({ ...over });

const PAGES: PageItem[] = [
  page({ id: "home", name: "Home", slug: "home", isHome: true }),
  page({ id: "pricing", name: "Pricing", slug: "pricing", route: "/pricing" }),
  page({ id: "teams", name: "Teams", slug: "teams", route: "/pricing/teams" }),
  page({ id: "faq", name: "FAQ", slug: "faq", route: "/help/faq" }),
];

describe("buildRouteTree", () => {
  it("nests routes under their parents and keeps a segment with no page as a visible gap", () => {
    const t = buildRouteTree(PAGES);
    expect(t.page?.id).toBe("home");
    const pricing = t.children.find((c) => c.segment === "pricing")!;
    expect(pricing.page?.id).toBe("pricing");
    expect(pricing.children.map((c) => c.page?.id)).toEqual(["teams"]);
    const help = t.children.find((c) => c.segment === "help")!;
    expect(help.page).toBeNull();
    expect(help.children[0].page?.id).toBe("faq");
  });
});

describe("SiteStructureTree", () => {
  it("renders every page by route and selects on click", () => {
    const onSelectPage = vi.fn();
    render(<SiteStructureTree pages={PAGES} onSelectPage={onSelectPage} onBack={vi.fn()} />);
    expect(screen.getByText("4 pages, by route.")).toBeInTheDocument();
    expect(screen.getByText("/pricing/teams")).toBeInTheDocument();
    expect(screen.getByText(/\(no page\)/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Teams" }));
    expect(onSelectPage).toHaveBeenCalledWith("teams");
  });
});
