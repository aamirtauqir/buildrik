/**
 * SessionView (B8) — composition root for the four Compare baselines.
 *
 * Resolves availability, fetches per-baseline state, hands bodies to
 * ComparePanel. These tests pin the contract that matters: which baseline
 * lands first when the deep link asks, what happens when the requested
 * baseline doesn't exist, and how siteId-less mode degrades.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { CompareBaseline, SessionViewProps } from "../../types";
import { SessionView } from "../SessionView";

/* Mutable test state — reset in beforeEach so mocks don't bleed. */
const reviewState: {
  approved: null | { snapshot: string; pages: { id: string; title: string }[] };
  status: null | { state: string; at: string; reviewerName?: string };
} = {
  approved: null,
  status: null,
};
const publishState: { versions: Array<{ id: string; createdAt: string; version: number }> } = {
  versions: [],
};
const versionState: {
  versions: Array<{ id: string; label: string; createdAt: number }>;
} = { versions: [] };

vi.mock("@/services/ReviewService", () => ({
  fetchApprovedSnapshot: vi.fn(async () => reviewState.approved),
  fetchReviewStatus: vi.fn(async () => reviewState.status),
}));
vi.mock("@/services/PublishService", () => ({
  fetchPublishHistory: vi.fn(async () => publishState.versions),
}));
vi.mock("@/shared/hooks/useVersionHistory", () => ({
  useVersionHistory: vi.fn(() => ({
    versions: versionState.versions,
    compareVersions: vi.fn(() => null),
  })),
}));
/* SessionView reaches these through `@/editor/...` aliases. Mock the alias
   keys (vitest resolves `@/` via tsconfig path mapping to the source paths). */
vi.mock("@/editor/shell/exportPublishPages", () => ({
  exportPublishPages: vi.fn(async () => []),
}));
vi.mock("@/editor/shell/PublishDiffView", () => ({
  PublishDiffView: () => <div data-testid="publish-diff-view" />,
}));
vi.mock("@/editor/panels/version-history/ApprovedCompareView", () => ({
  ApprovedCompareView: () => <div data-testid="approved-compare-view" />,
}));
vi.mock("@/editor/panels/version-history/CompareView", () => ({
  CompareView: () => <div data-testid="compare-view" />,
}));

const composerWith = () =>
  ({
    history: { getHistoryStack: () => [] },
  }) as unknown as SessionViewProps["composer"];

const renderSession = (
  overrides: Partial<SessionViewProps> = {},
  siteId: string | null = "site-1"
) => {
  const props: SessionViewProps = {
    composer: composerWith(),
    siteId,
    initialBaseline: undefined,
    ...overrides,
  };
  render(<SessionView {...props} />);
};

beforeEach(() => {
  reviewState.approved = { snapshot: "v3", pages: [{ id: "p1", title: "Home" }] };
  reviewState.status = { state: "approved", at: "2026-07-18T15:42:00Z", reviewerName: "Alex" };
  publishState.versions = [
    { id: "d1", createdAt: "2026-08-01T10:00:00Z", version: 1 },
    { id: "d0", createdAt: "2026-07-20T10:00:00Z", version: 0 },
  ];
  versionState.versions = [
    { id: "m1", label: "Hero launch", createdAt: Date.now() - 1000 },
  ];
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SessionView — picker lands on initialBaseline", () => {
  it("lands on Approved when initialBaseline='approved' and approved is available", async () => {
    renderSession({ initialBaseline: "approved" });
    await waitFor(() =>
      expect(screen.getByTestId("compare-picker-approved")).toHaveAttribute(
        "aria-pressed",
        "true"
      )
    );
  });

  it("lands on Saved when initialBaseline='saved' and saved is available", async () => {
    renderSession({ initialBaseline: "saved" });
    await waitFor(() =>
      expect(screen.getByTestId("compare-picker-saved")).toHaveAttribute("aria-pressed", "true")
    );
  });

  it("falls back to the first enabled baseline when initialBaseline='approved' but no snapshot exists", async () => {
    reviewState.approved = null;
    reviewState.status = { state: "none", at: "" };
    renderSession({ initialBaseline: "approved" });
    await waitFor(() => {
      const saved = screen.getByTestId("compare-picker-saved");
      expect(saved).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("falls back to Current when every other baseline is unavailable", async () => {
    reviewState.approved = null;
    reviewState.status = { state: "none", at: "" };
    publishState.versions = [];
    versionState.versions = [];
    renderSession({ initialBaseline: "approved" });
    await waitFor(() =>
      expect(screen.getByTestId("compare-picker-current")).toHaveAttribute(
        "aria-pressed",
        "true"
      )
    );
  });
});

describe("SessionView — siteId-less mode", () => {
  it("disables approved and published with reason when siteId is null", async () => {
    renderSession({}, null);
    await waitFor(() => {
      const approved = screen.getByTestId("compare-picker-approved");
      expect(approved).toBeDisabled();
      expect(approved).toHaveAttribute("title");
    });
    const published = screen.getByTestId("compare-picker-published");
    expect(published).toBeDisabled();
    expect(published).toHaveAttribute("title");
  });

  it("still allows Saved when siteId is null because saved is composer-scoped", async () => {
    renderSession({}, null);
    await waitFor(() =>
      expect(screen.getByTestId("compare-picker-saved")).not.toBeDisabled()
    );
  });
});

describe("SessionView — renderers", () => {
  it("renders the picker with all four chips once availability resolves", async () => {
    renderSession();
    await waitFor(() => {
      expect(screen.getByTestId("compare-picker-approved")).toBeInTheDocument();
      expect(screen.getByTestId("compare-picker-published")).toBeInTheDocument();
      expect(screen.getByTestId("compare-picker-saved")).toBeInTheDocument();
      expect(screen.getByTestId("compare-picker-current")).toBeInTheDocument();
    });
  });
});
