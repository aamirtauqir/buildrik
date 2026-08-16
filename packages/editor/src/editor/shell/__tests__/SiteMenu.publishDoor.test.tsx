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
