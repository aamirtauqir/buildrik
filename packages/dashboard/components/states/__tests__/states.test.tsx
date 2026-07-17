/**
 * E0 state primitives. Verifies each renders DESIGN.md-correct structure + a11y
 * roles, and that the interactive bits (Retry, action buttons) wire up.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  StateEmpty,
  LoadingSkeleton,
  ErrorState,
  DeniedState,
} from "../index";

vi.mock("next/link", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("StateEmpty", () => {
  it("renders title, description, and both actions as links", () => {
    render(
      <StateEmpty
        title="No sites yet"
        description="Start one."
        action={{ label: "+ New site", href: "/dashboard/sites/new" }}
        secondary={{ label: "Templates", href: "/t" }}
      />,
    );
    expect(screen.getByText("No sites yet")).toBeTruthy();
    expect(screen.getByText("Start one.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "+ New site" }).getAttribute("href")).toBe(
      "/dashboard/sites/new",
    );
    expect(screen.getByRole("link", { name: "Templates" })).toBeTruthy();
  });
});

describe("LoadingSkeleton", () => {
  it("exposes a status role and renders the requested row count (list)", () => {
    const { container } = render(<LoadingSkeleton rows={4} variant="list" />);
    expect(screen.getByRole("status")).toBeTruthy();
    // 4 rows, 2 bars each = 8 pulse bars
    expect(container.querySelectorAll(".animate-pulse").length).toBe(8);
  });

  it("renders a card grid for the card variant", () => {
    const { container } = render(<LoadingSkeleton rows={3} variant="card" />);
    // 3 cards, 3 bars each
    expect(container.querySelectorAll(".animate-pulse").length).toBe(9);
  });
});

describe("ErrorState", () => {
  it("uses role=alert and fires onRetry when the button is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Boom" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Boom")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("omits the retry button when no onRetry is given", () => {
    render(<ErrorState title="Boom" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("DeniedState", () => {
  it("renders the default boundary copy + actions", () => {
    render(
      <DeniedState
        action={{ label: "Back", href: "/dashboard" }}
        secondary={{ label: "Ask an admin", href: "/dashboard/settings/team" }}
      />,
    );
    expect(screen.getByText(/don't have access/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ask an admin" })).toBeTruthy();
  });
});
