/**
 * History Tab Tests — pencil screens 33-36
 * Covers: ActivityView error state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { ActivityView } from "../components/ActivityView";

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

  it("renders error state inside the activity-view container", () => {
    const { container } = render(
      <ActivityView
        composer={null}
        error="Something went wrong"
      />
    );
    // New layout uses .activity-view → .empty-state for error display
    expect(container.querySelector(".activity-view")).toBeTruthy();
    expect(container.querySelector(".empty-state")).toBeTruthy();
  });
});
