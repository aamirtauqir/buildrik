/**
 * SiteMenu — board 4418:126034 (C5 G1-016/020/025; owner rule: the board
 * wins on anything visual). Three groups, exactly the board's rows; the
 * panel doors, Plugins, Ask AI, Site health, Copy live URL and Getting
 * started are gone from the menu (each panel keeps its own door).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => ({
    siteDetail: { sharing: { list: { query: () => new Promise(() => {}) }, create: { mutate: vi.fn() } } },
  }),
}));

import { ToastProvider } from "@/editor/chrome-ui";
import { SiteMenu } from "../SiteMenu";

afterEach(cleanup);

const openMenu = () => fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
const all = {
  onOpenSiteSettings: vi.fn(),
  onExportCode: vi.fn(),
  onDuplicateSite: vi.fn(),
  onOpenIssues: vi.fn(),
  onOpenActivity: vi.fn(),
  onOpenCommandPalette: vi.fn(),
  onToggleReadOnlyView: vi.fn(),
  onOpenShortcuts: vi.fn(),
  onUnpublish: vi.fn(),
  siteId: "site_42",
  publishedUrl: "https://bella.example",
};

describe("SiteMenu — board 4418:126034", () => {
  it("draws the board's rows, in the board's order, under its three labels", () => {
    render(<ToastProvider><SiteMenu {...all} /></ToastProvider>);
    openMenu();
    const menu = screen.getByTestId("site-menu");
    expect(within(menu).getByText("This site")).toBeTruthy();
    expect(within(menu).getByText("Collaborate")).toBeTruthy();
    expect(within(menu).getByText("Leaves the editor")).toBeTruthy();
    const rows = screen.getAllByRole("menuitem").map((i) => i.textContent?.replace(/(Ctrl|⌃|⌘) ?[,/K]$/, "").trim());
    expect(rows).toEqual([
      "Site settings",
      "Export site…",
      "Duplicate site",
      "Issues",
      "Activity log",
      "Command palette",
      "Enter view mode",
      "Keyboard shortcuts",
      "Share preview link",
      "Start collaborationPlanned",
      "Unpublish site…",
      "View live site ↗",
      "Invite teammates ↗",
      "Account settings ↗",
    ]);
  });

  it("carries none of the rows the board dropped", () => {
    render(<ToastProvider><SiteMenu {...all} /></ToastProvider>);
    openMenu();
    for (const gone of ["Version history", "Review", "Publish panel", "Publish history", "Templates", "Components", "Brand", "Plugins", "Ask AI", "Site health", "Copy live URL", "Getting started"]) {
      expect(screen.queryByRole("menuitem", { name: new RegExp(`^${gone}`) })).toBeNull();
    }
  });

  it("Start collaboration is PLANNED and inert while the flag is off; live when it is on", () => {
    render(<SiteMenu />);
    openMenu();
    const planned = screen.getByTestId("site-menu-collab");
    expect(planned).toHaveTextContent("Planned");
    expect(planned).toHaveAttribute("aria-disabled", "true");
    cleanup();
    const start = vi.fn();
    render(<SiteMenu collabEnabled onStartCollaboration={start} />);
    openMenu();
    fireEvent.click(screen.getByTestId("site-menu-collab"));
    expect(start).toHaveBeenCalled();
  });

  it("rows fire their handler and close the menu", () => {
    const onDuplicateSite = vi.fn();
    render(<SiteMenu onDuplicateSite={onDuplicateSite} />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicate site" }));
    expect(onDuplicateSite).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("view mode keeps only the way back out", () => {
    render(<SiteMenu {...all} readOnlyView />);
    openMenu();
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Exit view mode"]);
  });

  it("Share preview link opens the in-editor share modal, not the dashboard", async () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    render(<ToastProvider><SiteMenu siteId="site_42" /></ToastProvider>);
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Share preview link" }));
    expect(await screen.findByTestId("preview-share-modal")).toHaveTextContent("Share preview");
    expect(open).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
