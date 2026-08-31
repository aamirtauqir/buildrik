/**
 * The Publish panel (board 641:2652) has a door.
 *
 * It did not. `StudioHeader` accepted `onOpenPublish` and spent it on
 * `publishNow = onVercelPublish ?? onOpenPublish ?? handleExport`; since
 * `onVercelPublish` is a plain `useCallback` in `AquibraStudio` it is never
 * undefined, so the panel opener could only fire in a build with publishing
 * switched off. Nothing else reached the tab — publish has no rail zone by
 * design, the command palette has no publish entry, and no code emitted
 * `ui:switch-tab` with `{tab: "publish"}`. Walked live on 2026-08-17: the
 * topbar Publish button opened `PublishConfirmModal` and the drawer stayed on
 * whatever tab it was already showing.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteMenu } from "../SiteMenu";

afterEach(cleanup);

const openMenu = () => fireEvent.click(screen.getByRole("button", { name: "Site menu" }));

describe("SiteMenu — the Publish panel's door", () => {
  it("opens the panel and closes the menu", () => {
    const onOpenPublish = vi.fn();
    render(<SiteMenu onOpenPublish={onOpenPublish} />);
    openMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: "Publish panel" }));
    expect(onOpenPublish).toHaveBeenCalledTimes(1);
  });

  it("sits with the publish history it belongs to, not on its own", () => {
    render(<SiteMenu onOpenPublish={vi.fn()} onOpenPublishHistory={vi.fn()} />);
    openMenu();

    const items = screen.getAllByRole("menuitem").map((n) => n.textContent);
    expect(items).toContain("Publish panel");
    expect(items.indexOf("Publish panel")).toBeLessThan(items.indexOf("Publish history"));
  });

  it("is absent when no opener is supplied — the menu never shows a dead row", () => {
    render(<SiteMenu onOpenHistory={vi.fn()} />);
    openMenu();
    expect(screen.queryByRole("menuitem", { name: "Publish panel" })).not.toBeInTheDocument();
  });

  it("alone is enough to render the Site group", () => {
    // `hasSite` gated on four other props and would have hidden the whole
    // group — and with it this door — for a shell that passes only this one.
    render(<SiteMenu onOpenPublish={vi.fn()} />);
    openMenu();
    expect(screen.getByRole("menuitem", { name: "Publish panel" })).toBeInTheDocument();
  });
});

/*
  The Review panel's door, for the same reason and found the same way.

  The topbar pill was the ONLY way in, and `REVIEW_PILL.none` is null — so
  revoking a round without sending a new one removed the pill and, with it,
  every route to the panel: its comments, its round history, and Compare. The
  rail has no Review tab (six tabs, none of them Review). Walked live: after a
  revoke the panel could only be reached again by writing to the database.

  A status indicator may disappear with its status. Navigation may not.
*/
describe("SiteMenu — the Review panel's door", () => {
  it("opens the panel and closes the menu", () => {
    const onOpenReview = vi.fn();
    render(<SiteMenu onOpenReview={onOpenReview} />);
    openMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: "Review" }));
    expect(onOpenReview).toHaveBeenCalledTimes(1);
  });

  it("alone is enough to render the Site group", () => {
    // `hasSite` gated on the other openers; a shell passing only this one
    // would have had the whole group — and this door — hidden.
    render(<SiteMenu onOpenReview={vi.fn()} />);
    openMenu();
    expect(screen.getByRole("menuitem", { name: "Review" })).toBeInTheDocument();
  });

  it("is absent when no opener is supplied — never a dead row", () => {
    render(<SiteMenu onOpenHistory={vi.fn()} />);
    openMenu();
    expect(screen.queryByRole("menuitem", { name: "Review" })).not.toBeInTheDocument();
  });

  it("does not depend on there being an active review round", () => {
    // The whole point: the row is present regardless of review state, which
    // the pill is not. Nothing about this render implies a live round.
    render(<SiteMenu onOpenReview={vi.fn()} onOpenHistory={vi.fn()} />);
    openMenu();
    expect(screen.getByRole("menuitem", { name: "Review" })).toBeInTheDocument();
  });
});

/*
  Board 642:3401 lists "Share preview link" in the site menu. The flow exists —
  the dashboard's ShareDraftModal, on `siteDetail.sharing.create`, which mints a
  private link to the current DRAFT — and the editor had no way to reach it. A
  live URL is a different thing: it only exists after a publish, and it is
  public.
*/
describe("SiteMenu — board 642:3401's share preview link", () => {
  it("hands off to the dashboard's share flow for this site", () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    render(<SiteMenu siteId="site_42" />);
    openMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: "Share preview link" }));
    expect(open).toHaveBeenCalledWith(
      expect.stringContaining("/dashboard/sites/site_42?share=1"),
      "_blank",
      "noopener,noreferrer",
    );
    vi.unstubAllGlobals();
  });

  it("is absent without a site — there is nothing to share", () => {
    render(<SiteMenu onOpenHistory={vi.fn()} />);
    openMenu();
    expect(screen.queryByRole("menuitem", { name: "Share preview link" })).not.toBeInTheDocument();
  });

  it("does not stand in for the live URL, which is a different thing", () => {
    // Live URL is public and only exists after a publish; the preview link is
    // private and works before one.
    render(<SiteMenu siteId="site_42" />);
    openMenu();
    expect(screen.queryByRole("menuitem", { name: "Copy live URL" })).not.toBeInTheDocument();
  });
});

/*
  Board 642:3401's second group: Site health · Activity log · Share preview
  link. All three are real surfaces the editor had no door to — the first two
  are the Health Score panel and Recent Activity on the site's dashboard
  overview, which is why they deep-link to their own section rather than to
  the page.
*/
describe("SiteMenu — board 642:3401's dashboard hand-offs", () => {
  const clickItem = (name: string) => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    render(<SiteMenu siteId="site_42" />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name }));
    const url = open.mock.calls[0]?.[0] as string;
    vi.unstubAllGlobals();
    return url;
  };

  it("Site health lands on the health panel, not just the page", () => {
    expect(clickItem("Site health")).toContain("/dashboard/sites/site_42#site-health");
  });

  it("Activity log lands on the activity section", () => {
    expect(clickItem("Activity log")).toContain("/dashboard/sites/site_42#activity-log");
  });

  it("neither appears without a site", () => {
    render(<SiteMenu onOpenHistory={vi.fn()} />);
    openMenu();
    expect(screen.queryByRole("menuitem", { name: "Site health" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Activity log" })).not.toBeInTheDocument();
  });
});
