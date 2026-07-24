import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Agency route guard (spec 2026-07-16 §Agency, D7, test #6). The tRPC layer is
 * the security authority; this layout guard is the UX one. It must:
 *   - render a skeleton (never flash the tabs) while features.list is in flight,
 *   - redirect a non-agency workspace to /dashboard,
 *   - render the tabs + children once agency_layer is confirmed on.
 */

// Next's redirect() throws a NEXT_REDIRECT sentinel that halts rendering; the
// mock MUST throw or the component keeps rendering past the guard.
const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
  usePathname: () => "/dashboard/agency",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

let featuresState: {
  isLoading: boolean;
  isError: boolean;
  data?: { agency_layer: boolean };
  refetch: () => void;
} = { isLoading: true, isError: false, refetch: vi.fn() };

vi.mock("@lib/trpc/client", () => ({
  trpc: { features: { list: { useQuery: () => featuresState } } },
}));

import AgencyTabsLayout from "../layout";

const child = <div data-testid="tab-content">Clients</div>;

describe("Agency (tabs) layout guard", () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it("renders a skeleton and no tabs while features load", () => {
    featuresState = { isLoading: true, isError: false, refetch: vi.fn() };
    render(<AgencyTabsLayout>{child}</AgencyTabsLayout>);
    expect(redirectMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Clients")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Agency" })).not.toBeInTheDocument();
  });

  it("redirects a non-agency workspace to /dashboard", () => {
    featuresState = { isLoading: false, isError: false, data: { agency_layer: false }, refetch: vi.fn() };
    expect(() => render(<AgencyTabsLayout>{child}</AgencyTabsLayout>)).toThrow(/NEXT_REDIRECT:\/dashboard$/);
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the Agency header, tabs and children when the flag is on", () => {
    featuresState = { isLoading: false, isError: false, data: { agency_layer: true }, refetch: vi.fn() };
    render(<AgencyTabsLayout>{child}</AgencyTabsLayout>);
    expect(redirectMock).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Agency" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clients" })).toBeInTheDocument();
    expect(screen.getByTestId("tab-content")).toBeInTheDocument();
  });

  it("shows an error state (not a redirect) when the flag lookup fails", () => {
    featuresState = { isLoading: false, isError: true, refetch: vi.fn() };
    render(<AgencyTabsLayout>{child}</AgencyTabsLayout>);
    expect(redirectMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Clients")).not.toBeInTheDocument();
  });
});
