/**
 * Unpublish has a door in the editor. unpublishSite was fully built — Vercel
 * teardown included — and exposed only in the dashboard's site header, so
 * taking a site down meant leaving the editor.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteMenu } from "../SiteMenu";
afterEach(cleanup);
const openMenu = () => fireEvent.click(screen.getByRole("button", { name: "Site menu" }));

describe("SiteMenu — Unpublish site…", () => {
  it("is offered only while a published URL exists, and asks the panel", () => {
    const onUnpublish = vi.fn();
    render(<SiteMenu onOpenPublish={() => {}} onUnpublish={onUnpublish} publishedUrl="https://x.vercel.app" />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Unpublish site…" }));
    expect(onUnpublish).toHaveBeenCalledTimes(1);
  });

  it("is absent on a site that is not live — there is nothing to take down", () => {
    render(<SiteMenu onOpenPublish={() => {}} onUnpublish={vi.fn()} publishedUrl={null} />);
    openMenu();
    expect(screen.queryByRole("menuitem", { name: "Unpublish site…" })).toBeNull();
  });
});
