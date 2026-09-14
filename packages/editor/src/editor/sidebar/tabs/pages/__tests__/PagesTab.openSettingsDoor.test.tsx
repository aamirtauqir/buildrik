// @vitest-environment jsdom
/**
 * PagesTab — the `ui:pages-open-settings` door.
 *
 * Settings › Redirects' saved card (Clone 3519:20096) offers `Back to <Page>
 * SEO`, which asks this panel — through the composer, because page settings
 * is local state here — to open that page's settings drawer on the SEO tab.
 * Two routes in: the `openSettingsRequest` prop, which StudioPanels holds
 * while this lazy panel mounts (the emit fires before it exists — measured:
 * a door emitted in the same gesture as the tab switch is never heard from
 * inside), and the live event for a door fired while the panel is already
 * up. An id the panel does not list opens nothing. The subscription goes
 * with the panel.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { createMockComposer, pg, type MockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import PagesTab from "../PagesTab";
import type { PageSettingsOpenRequest } from "../types";

const DOOR = EVENTS.UI_PAGES_OPEN_SETTINGS;

const pages = () => [pg("p1", "Home", { isHome: true }), pg("p2", "About")];

function mount(request?: PageSettingsOpenRequest | null): MockComposer {
  const composer = createMockComposer({ pages: pages() });
  render(
    <ToastProvider>
      <PagesTab composer={composer} openSettingsRequest={request} />
    </ToastProvider>,
  );
  return composer;
}

const drawer = () => screen.queryByTestId("pg-drawer");
/* The tab id whose button is selected — by testid, since the SEO button's
   text also carries the score chip. */
const selectedTab = () =>
  (["seo", "social", "advanced"] as const).find(
    (id) => screen.getByTestId(`pg-drawer-tabbtn-${id}`).getAttribute("aria-selected") === "true",
  );

describe("PagesTab — ui:pages-open-settings", () => {
  /* The way back as it really arrives: the panel mounts with the request
     already held for it by StudioPanels. */
  it("opens the named page's settings drawer on the SEO tab from the held request", async () => {
    mount({ pageId: "p2", tab: "seo" });

    await waitFor(() => expect(screen.getByTestId("pg-drawer-title")).toHaveTextContent("Page settings — About"));
    await waitFor(() => expect(selectedTab()).toBe("seo"));
    expect(screen.getByRole("tabpanel", { name: "SEO settings" })).toBeInTheDocument();
  });

  it("opens nothing from a held request naming a page this panel does not list", () => {
    mount({ pageId: "p-nope", tab: "seo" });
    expect(drawer()).toBeNull();
  });

  /* A closed drawer stays closed while the request is still held: pages
     re-sync on every page:* change, and a handler rebuilt on each would have
     re-run the request and reopened it. */
  it("does not reopen a drawer the user closed while the request is still held", async () => {
    const composer = mount({ pageId: "p2", tab: "seo" });
    await waitFor(() => expect(drawer()).not.toBeNull());
    fireEvent.click(screen.getByTestId("pg-drawer-close"));
    expect(drawer()).toBeNull();

    act(() => composer.elements.createPage("Contact"));
    await waitFor(() => expect(screen.getByText("Contact")).toBeInTheDocument());
    expect(drawer()).toBeNull();
  });

  it("opens the named page's settings drawer on the SEO tab from the live event", async () => {
    const composer = mount();
    expect(drawer()).toBeNull();

    act(() => composer._emit(DOOR, { pageId: "p2", tab: "seo" }));

    expect(screen.getByTestId("pg-drawer-title")).toHaveTextContent("Page settings — About");
    await waitFor(() => expect(selectedTab()).toBe("seo"));
    expect(screen.getByRole("tabpanel", { name: "SEO settings" })).toBeInTheDocument();
  });

  /* Through the drawer's guarded tab switch, AFTER the form has settled: on
     its first render the drawer reads dirty (empty snapshot), and switching
     then would raise the discard modal over a form nobody has typed in. */
  it("carries the asked tab through — a door naming Advanced lands on Advanced, no discard modal", async () => {
    const composer = mount();
    act(() => composer._emit(DOOR, { pageId: "p2", tab: "advanced" }));
    await waitFor(() => expect(selectedTab()).toBe("advanced"));
    expect(screen.queryByText(/Discard unsaved/)).toBeNull();
  });

  it("opens nothing from a live event naming a page this panel does not list", () => {
    const composer = mount();
    act(() => composer._emit(DOOR, { pageId: "p-nope", tab: "seo" }));
    expect(drawer()).toBeNull();
  });

  it("forgets the door's tab once the drawer closes", async () => {
    const composer = mount();
    act(() => composer._emit(DOOR, { pageId: "p2", tab: "advanced" }));
    await waitFor(() => expect(selectedTab()).toBe("advanced"));
    fireEvent.click(screen.getByTestId("pg-drawer-close"));
    expect(drawer()).toBeNull();

    act(() => composer._emit(DOOR, { pageId: "p2", tab: "seo" }));
    await waitFor(() => expect(selectedTab()).toBe("seo"));
  });

  it("unsubscribes on unmount", () => {
    const composer = createMockComposer({ pages: [pg("p1", "Home", { isHome: true })] });
    const { unmount } = render(
      <ToastProvider>
        <PagesTab composer={composer} />
      </ToastProvider>,
    );
    const on = composer.on as unknown as ReturnType<typeof vi.fn>;
    const off = composer.off as unknown as ReturnType<typeof vi.fn>;
    const subscribed = on.mock.calls.filter(([event]) => event === DOOR).map(([, handler]) => handler);
    expect(subscribed.length).toBeGreaterThan(0);

    unmount();

    const removed = off.mock.calls.filter(([event]) => event === DOOR).map(([, handler]) => handler);
    for (const handler of subscribed) expect(removed).toContain(handler);
  });
});
