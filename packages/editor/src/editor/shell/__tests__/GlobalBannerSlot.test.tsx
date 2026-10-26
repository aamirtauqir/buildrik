// @vitest-environment jsdom
/**
 * GlobalBannerSlot — 2L9 B7-G31 `227:14297`: several conditions share ONE
 * banner slot; the most serious is the bar, the rest wait behind "{n} more".
 * Offline (G11), can't reach (G12), reconnecting (G13), other tab (G28),
 * role changed (G18) and session expired (G04) moved here out of toasts.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, act, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GlobalBannerSlot } from "../GlobalBannerSlot";
import {
  BANNER_ID,
  clearGlobalBanner,
  showCantReachBanner,
  showGlobalBanner,
  showOtherTabBanner,
  showReconnectingBanner,
  showRoleChangedBanner,
  showSessionExpiredBanner,
} from "../globalBanners";

const ALL = [...Object.values(BANNER_ID), "new-version"];

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", { configurable: true, get: () => value });
}

afterEach(() => {
  cleanup();
  act(() => ALL.forEach(clearGlobalBanner));
  setOnline(true);
});

describe("GlobalBannerSlot — one bar, the rest behind N more (G31)", () => {
  it("renders nothing with no condition", () => {
    const { container } = render(<GlobalBannerSlot />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the most serious condition; error outranks warning outranks info", () => {
    render(<GlobalBannerSlot />);
    act(() => {
      showGlobalBanner({ id: "new-version", tone: "info", message: "A new version of Buildrick is ready." });
      showOtherTabBanner();
      showSessionExpiredBanner(vi.fn());
    });
    const bar = screen.getByTestId("global-banner");
    expect(bar.getAttribute("data-banner-id")).toBe(BANNER_ID.sessionExpired);
    expect(bar.getAttribute("role")).toBe("alert");
    expect(within(bar).getByText("Session expired — changes aren’t saving. They’re kept in this tab.")).toBeTruthy();
    expect(screen.getByTestId("global-banner-more").textContent).toContain("2 more");
  });

  it("the popover lists the other conditions with their actions, in order", () => {
    const retryNow = vi.fn();
    render(<GlobalBannerSlot />);
    act(() => {
      showSessionExpiredBanner(vi.fn());
      showGlobalBanner({ id: "new-version", tone: "info", message: "A new version of Buildrick is ready." });
      showCantReachBanner(retryNow);
    });
    fireEvent.click(screen.getByTestId("global-banner-more"));
    const list = screen.getByTestId("global-banner-more-list");
    const ids = within(list)
      .getAllByRole("listitem")
      .map((li) => li.getAttribute("data-banner-id"));
    expect(ids).toEqual([BANNER_ID.connection, "new-version"]);
    fireEvent.click(within(list).getByRole("button", { name: "Retry now" }));
    expect(retryNow).toHaveBeenCalledTimes(1);
  });

  it("a condition shown again replaces itself — reconnecting takes can't-reach's place", () => {
    render(<GlobalBannerSlot />);
    act(() => showCantReachBanner(vi.fn()));
    expect(screen.getByText("Can’t reach Buildrick. Your edits are kept and will save when it responds.")).toBeTruthy();
    act(() => showReconnectingBanner(12));
    expect(screen.getByText("Reconnecting… saving 12 changes")).toBeTruthy();
    expect(screen.queryByTestId("global-banner-more")).toBeNull();
  });

  it("the other-tab notice is dismissible until the tab handoff exists", () => {
    render(<GlobalBannerSlot />);
    act(() => showOtherTabBanner());
    expect(screen.getByText("This site is also open in another tab. Edit in one tab at a time.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByTestId("global-banner")).toBeNull();
  });

  it("role changed carries Download them and Ask an admin (G18)", () => {
    const download = vi.fn();
    const askAdmin = vi.fn();
    render(<GlobalBannerSlot />);
    act(() => showRoleChangedBanner({ download, askAdmin }));
    fireEvent.click(screen.getByRole("button", { name: "Download them" }));
    fireEvent.click(screen.getByRole("button", { name: "Ask an admin" }));
    expect(download).toHaveBeenCalledTimes(1);
    expect(askAdmin).toHaveBeenCalledTimes(1);
  });
});

describe("GlobalBannerSlot — offline is the slot's own (G11)", () => {
  it("shows on the offline event and clears on online", () => {
    render(<GlobalBannerSlot />);
    expect(screen.queryByTestId("global-banner")).toBeNull();
    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(
      screen.getByText(
        "You’re offline. Page edits are kept in this browser; other changes need this tab open. Everything saves when you reconnect.",
      ),
    ).toBeTruthy();
    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByTestId("global-banner")).toBeNull();
  });
});

describe("GlobalBannerSlot — a lead bar (the load failure) outranks the store", () => {
  it("renders the lead and puts every stored condition behind N more, without repeating the lead's own", () => {
    render(
      <GlobalBannerSlot
        lead={{ id: BANNER_ID.offline, render: (more) => <div data-testid="lead">lead {more}</div> }}
      />,
    );
    act(() => {
      showGlobalBanner({ id: BANNER_ID.offline, tone: "warning", message: "offline" });
      showOtherTabBanner();
    });
    expect(screen.getByTestId("lead")).toBeTruthy();
    expect(screen.getByTestId("global-banner-more").textContent).toContain("1 more");
  });
});

describe("GlobalBannerSlot — small screens (G32 / G33)", () => {
  const setWidth = (w: number) => Object.defineProperty(window, "innerWidth", { configurable: true, value: w });
  afterEach(() => setWidth(1024));

  it("a window under 1024 px gets the info banner; it clears when wide again", () => {
    setWidth(900);
    render(<GlobalBannerSlot />);
    expect(screen.getByText("Buildrick is built for windows at least 1024 px wide — some panels will overlap.")).toBeTruthy();
    act(() => {
      setWidth(1280);
      window.dispatchEvent(new Event("resize"));
    });
    expect(screen.queryByTestId("global-banner")).toBeNull();
  });

  it("a phone gets the full-screen notice with Open read-only anyway", () => {
    setWidth(390);
    const matchMedia = vi.fn(() => ({ matches: true }));
    Object.defineProperty(window, "matchMedia", { configurable: true, value: matchMedia });
    const assign = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, href: "https://app.test/edit/s1", assign } });
    render(<GlobalBannerSlot />);
    expect(screen.getByText("Buildrick needs a larger screen")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open read-only anyway" }));
    expect(assign).toHaveBeenCalledWith("https://app.test/edit/s1?view=readonly");
  });
});
