/**
 * New page — plan capacity (design-2l9 boards 101:29978, 101:38257, 101:38980,
 * 101:39695). The limit is billing.pagesPerSite from settingsOverview, the one
 * the server enforces on save.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EVENTS } from "@/shared/constants/events";

const overview = vi.fn();
vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => ({ siteDetail: { settingsOverview: { query: (...a: unknown[]) => overview(...a) } } }),
}));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "site-1" }));
vi.mock("@/editor/chrome-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/editor/chrome-ui")>()),
  useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
}));

import { NewPageModal } from "../components/NewPageModal";

function mount(pageCount: number) {
  const handlers = new Map<string, Array<(d: unknown) => void>>();
  const pages = Array.from({ length: pageCount }, (_, i) => ({ id: `p${i}`, name: `Page ${i}` }));
  const composer = {
    on: vi.fn((ev: string, fn: (d: unknown) => void) => handlers.set(ev, [...(handlers.get(ev) ?? []), fn])),
    off: vi.fn(),
    emit: vi.fn(),
    elements: { getAllPages: () => pages, createPage: vi.fn(), setActivePage: vi.fn(), addPageToNavigation: vi.fn() },
  };
  render(<NewPageModal composer={composer as never} />);
  act(() => handlers.get(EVENTS.UI_NEW_PAGE_REQUESTED)?.forEach((fn) => fn({})));
  fireEvent.click(screen.getByTestId("new-page-source-blank"));
}

beforeEach(() => overview.mockReset());

describe("NewPageModal — capacity", () => {
  it("names the count, the limit and the plan", async () => {
    overview.mockResolvedValue({ billing: { plan: "FREE", priceMonthly: 0, pagesPerSite: 10 } });
    mount(6);
    await waitFor(() => expect(screen.getByTestId("new-page-capacity")).toHaveTextContent("6 of 10 pages on Free"));
    expect(screen.getByTestId("new-page-create")).toBeEnabled();
  });

  it("at the limit, says what to do and refuses the create", async () => {
    overview.mockResolvedValue({ billing: { plan: "FREE", priceMonthly: 0, pagesPerSite: 10 } });
    mount(10);
    await waitFor(() =>
      expect(screen.getByTestId("new-page-capacity")).toHaveTextContent(
        "10 of 10 pages on FreeAsk the workspace owner to upgrade, or remove an unused page before creating another.",
      ),
    );
    expect(screen.getByTestId("new-page-create")).toBeDisabled();
  });

  it("while checking, waits; when the check fails, keeps the choices and offers Retry check", async () => {
    let fail: (e: Error) => void = () => {};
    overview.mockReturnValueOnce(new Promise((_, reject) => (fail = reject)));
    mount(3);
    expect(screen.getByTestId("new-page-capacity")).toHaveTextContent("Checking page capacity…Wait for the current page limit before creating.");
    expect(screen.getByTestId("new-page-create")).toBeDisabled();
    await act(async () => fail(new Error("offline")));
    expect(screen.getByTestId("new-page-capacity")).toHaveTextContent("Couldn’t check page capacityYour page name and navigation choice are retained.");
    overview.mockResolvedValue({ billing: { plan: "PRO", priceMonthly: 29, pagesPerSite: 30 } });
    fireEvent.click(screen.getByTestId("new-page-capacity-retry"));
    await waitFor(() => expect(screen.getByTestId("new-page-capacity")).toHaveTextContent("3 of 30 pages on Pro"));
  });

  it("an unlimited plan draws no line", async () => {
    overview.mockResolvedValue({ billing: { plan: "AGENCY", priceMonthly: 99, pagesPerSite: -1 } });
    mount(3);
    await waitFor(() => expect(overview).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId("new-page-capacity")).toBeNull());
  });
});
