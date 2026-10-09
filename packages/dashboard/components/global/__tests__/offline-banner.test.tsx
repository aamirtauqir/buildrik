// @vitest-environment jsdom
/**
 * L5-071: inside the editor the dashboard's offline banner promised
 * "Auto-retrying in 7s… Retry Now" — it only re-reads navigator.onLine and
 * retries no save — beside the editor's own offline chip. The editor route
 * owns its offline surface; the banner stays out of it.
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

let pathname = "/dashboard";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { OfflineBanner } from "../offline-banner";

const setOnline = (v: boolean) => Object.defineProperty(window.navigator, "onLine", { value: v, configurable: true });

beforeEach(() => setOnline(false));
afterEach(() => setOnline(true));

describe("OfflineBanner", () => {
  it("shows on dashboard routes when offline", () => {
    pathname = "/dashboard/sites";
    render(<OfflineBanner />);
    expect(screen.getByRole("alert").textContent).toContain("You're offline");
  });

  it("stays out of the editor route, which has its own offline state", () => {
    pathname = "/edit/site-1";
    render(<OfflineBanner />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
