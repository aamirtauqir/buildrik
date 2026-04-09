/**
 * History Tab Tests — pencil screens 33-36
 * Covers: groupByDate helper, ActivityView error state, date group headers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { groupByDate } from "../helpers";
import { ActivityView } from "../components/ActivityView";

// ── groupByDate helper tests ──────────────────────────────────────────────────

describe("groupByDate", () => {
  const now = Date.now();
  const yesterday = now - 86400000;
  const twoDaysAgo = now - 2 * 86400000;

  it("groups today's items under 'Today'", () => {
    const items = [{ timestamp: now, id: "a" }];
    const groups = groupByDate(items);
    expect(groups[0].label).toBe("Today");
    expect(groups[0].items).toHaveLength(1);
  });

  it("groups yesterday's items under 'Yesterday'", () => {
    const items = [{ timestamp: yesterday, id: "b" }];
    const groups = groupByDate(items);
    expect(groups[0].label).toBe("Yesterday");
  });

  it("groups older items under a locale date label (e.g. 'Apr 7')", () => {
    const items = [{ timestamp: twoDaysAgo, id: "c" }];
    const groups = groupByDate(items);
    // Label should be a short date string, not Today/Yesterday
    expect(groups[0].label).not.toBe("Today");
    expect(groups[0].label).not.toBe("Yesterday");
    // Should be a readable date like "Apr 7"
    expect(groups[0].label).toMatch(/[A-Z][a-z]{2} \d+/);
  });

  it("returns multiple groups when items span different days", () => {
    const items = [
      { timestamp: now, id: "a" },
      { timestamp: yesterday, id: "b" },
    ];
    const groups = groupByDate(items);
    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe("Today");
    expect(groups[1].label).toBe("Yesterday");
  });

  it("groups multiple items under the same day label", () => {
    const items = [
      { timestamp: now, id: "a" },
      { timestamp: now + 1000, id: "b" },
    ];
    const groups = groupByDate(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(groupByDate([])).toHaveLength(0);
  });
});

// ── ActivityView error state ──────────────────────────────────────────────────

describe("ActivityView error state", () => {
  it("shows error message when error prop is set", () => {
    render(
      <ActivityView
        composer={null}
        error="Failed to load activity"
      />
    );
    expect(screen.getByText(/failed to load activity/i)).toBeInTheDocument();
  });

  it("shows retry button when onRetry is provided", () => {
    const handleRetry = vi.fn();
    render(
      <ActivityView
        composer={null}
        error="Network error"
        onRetry={handleRetry}
      />
    );
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("does not show retry button when onRetry is not provided", () => {
    render(
      <ActivityView
        composer={null}
        error="Network error"
      />
    );
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
  });

  it("does not render error state when error is null", () => {
    render(
      <ActivityView
        composer={null}
        error={null}
      />
    );
    expect(screen.queryByText(/failed to load/i)).not.toBeInTheDocument();
  });

  it("applies hist-error class to error container", () => {
    const { container } = render(
      <ActivityView
        composer={null}
        error="Something went wrong"
      />
    );
    expect(container.querySelector(".hist-error")).toBeTruthy();
  });
});
