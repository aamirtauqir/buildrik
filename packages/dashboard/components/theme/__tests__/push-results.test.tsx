/**
 * Theme push results, built to BRP1-M4 (8222:233199): one plate per site,
 * the site name over its status, the two brand-format statuses in the
 * warning text colour, and the re-capture status explained by a tooltip.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { PushResults } from "../push-results";

const rows = [
  { siteId: "a", name: "Bella Cucina", status: "pushed" as const },
  { siteId: "b", name: "North Studio", status: "skipped-held" as const },
  { siteId: "c", name: "Field Notes", status: "skipped-version" as const, error: "Theme format v5 is older than site v6" },
  { siteId: "d", name: "Locked One", status: "skipped-locked" as const },
  { siteId: "e", name: "Broken", status: "failed" as const, error: "boom" },
];

describe("PushResults (BRP1-M4)", () => {
  it("titles the card and counts the sites", () => {
    render(<PushResults rows={rows} onDismiss={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Push results" })).toBeInTheDocument();
    expect(screen.getByText("Shared theme · 5 sites")).toBeInTheDocument();
  });

  it("draws each site as its name over its status", () => {
    render(<PushResults rows={rows} onDismiss={vi.fn()} />);
    const status = (name: string) => within(screen.getByTestId(`push-result-${name}`)).getByTestId("push-result-status").textContent;
    expect(status("a")).toBe("Updated");
    expect(status("b")).toBe("Brand rolled back — skipped");
    expect(status("c")).toMatch(/^New brand format — re-capture theme/);
    expect(status("d")).toBe("Locked — kept own");
    expect(status("e")).toBe("Failed");
  });

  /* Owner answer 1b OQ-8 (2026-10-08): a push that kept in-use site tokens
     says so in the status row. The service returned `kept` and no UI read it. */
  it("says how many in-use site tokens a push kept", () => {
    const kept = [
      { siteId: "k1", name: "One", status: "pushed" as const, kept: ["color-brand-x"] },
      { siteId: "k3", name: "Three", status: "pushed" as const, kept: ["a", "b", "c"] },
    ];
    render(<PushResults rows={kept} onDismiss={vi.fn()} />);
    const status = (id: string) => within(screen.getByTestId(`push-result-${id}`)).getByTestId("push-result-status").textContent;
    expect(status("k1")).toBe("Updated · kept 1 site token");
    expect(status("k3")).toBe("Updated · kept 3 site tokens");
  });

  it("explains the re-capture status in a tooltip", () => {
    render(<PushResults rows={rows} onDismiss={vi.fn()} />);
    const tip = screen.getByRole("tooltip", { hidden: true });
    expect(tip.textContent).toMatch(/Re-capture required/);
    expect(tip.textContent).toMatch(/newer brand format than the captured theme/);
  });

  it("is dismissible", () => {
    const onDismiss = vi.fn();
    render(<PushResults rows={rows} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss push results" }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
