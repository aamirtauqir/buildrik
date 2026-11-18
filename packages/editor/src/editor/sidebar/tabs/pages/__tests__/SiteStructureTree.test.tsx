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

// re-baseline: Structure — board 63:21939 draws the host as the root and every page as a row.
describe("SiteStructureTree", () => {
  it("draws URL structure, the host as the site root, and every page by route; a row selects", () => {
    const onSelectPage = vi.fn();
    render(<SiteStructureTree pages={PAGES} onSelectPage={onSelectPage} host="fieldwork.studio" />);
    expect(screen.getByTestId("pages-structure-head")).toHaveTextContent("URL structure");
    expect(screen.getByTestId("structure-root")).toHaveTextContent("fieldwork.studioSite root");
    expect(screen.getByText("This view follows page URLs. My folders stay in Pages.")).toBeInTheDocument();
    expect(screen.getByTestId("structure-page-home")).toHaveTextContent("Home/");
    expect(screen.getByTestId("structure-page-teams")).toHaveTextContent("Teams/pricing/teams");
    expect(screen.getByTestId("structure-segment-help")).toHaveTextContent("Help/help");
    fireEvent.click(screen.getByTestId("structure-page-teams"));
    expect(onSelectPage).toHaveBeenCalledWith("teams");
  });

  it("the row ⋯ opens the page menu without selecting the page", () => {
    const onSelectPage = vi.fn();
    const onRowMenu = vi.fn();
    render(<SiteStructureTree pages={PAGES} onSelectPage={onSelectPage} onRowMenu={onRowMenu} />);
    fireEvent.click(screen.getByRole("button", { name: "More options for Teams" }));
    expect(onRowMenu).toHaveBeenCalledWith("teams", expect.any(Number), expect.any(Number));
    expect(onSelectPage).not.toHaveBeenCalled();
  });

  it("filters names and URLs with the Pages search", () => {
    render(<SiteStructureTree pages={PAGES} onSelectPage={vi.fn()} search="faq" />);
    expect(screen.getByTestId("structure-page-faq")).toBeInTheDocument();
    expect(screen.queryByTestId("structure-page-pricing")).toBeNull();
  });
});

describe("SiteStructureTree — collection routes", () => {
  it("puts each collection under its URL segment with its page count", () => {
    render(
      <SiteStructureTree
        pages={PAGES}
        onSelectPage={vi.fn()}
        collections={[{ id: "blog", name: "Blog post", pattern: "/blog/{slug}", count: 20, templatePageId: null }]}
      />,
    );
    expect(screen.getByTestId("structure-segment-blog")).toHaveTextContent("Blog/blog");
    expect(screen.getByTestId("structure-collection-blog")).toHaveTextContent("Blog post/blog/{slug}20 pages");
  });
});
