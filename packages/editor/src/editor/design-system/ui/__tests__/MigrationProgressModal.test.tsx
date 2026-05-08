import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { MigrationProgressModal, type MigrationStep } from "../MigrationProgressModal";

const RUNNING_STEPS: MigrationStep[] = [
  { version: 1, label: "Token kinds", status: "done" },
  { version: 2, label: "Dark color seed", status: "running" },
  { version: 3, label: "Catalog rewrite", status: "queued" },
];

describe("MigrationProgressModal · running", () => {
  it("renders title 'Updating your project' + range label", () => {
    const { getByText, getByRole } = render(
      <MigrationProgressModal
        open
        onOpenChange={vi.fn()}
        state="running"
        steps={RUNNING_STEPS}
        rangeLabel="v0 → v3 · 3 migrations"
      />
    );
    expect(getByText("Updating your project")).toBeTruthy();
    expect(getByText("v0 → v3 · 3 migrations")).toBeTruthy();
    // Progressbar role for assistive tech.
    expect(getByRole("progressbar")).toBeTruthy();
  });

  it("renders one row per step with version + label", () => {
    const { getByText } = render(
      <MigrationProgressModal
        open
        onOpenChange={vi.fn()}
        state="running"
        steps={RUNNING_STEPS}
      />
    );
    expect(getByText(/v1 · Token kinds/)).toBeTruthy();
    expect(getByText(/v2 · Dark color seed/)).toBeTruthy();
    expect(getByText(/v3 · Catalog rewrite/)).toBeTruthy();
  });

  it("progress bar reflects completed/total ratio", () => {
    const { getByRole } = render(
      <MigrationProgressModal
        open
        onOpenChange={vi.fn()}
        state="running"
        steps={RUNNING_STEPS}
      />
    );
    const bar = getByRole("progressbar");
    // 1 of 3 done = 33%
    expect(bar.getAttribute("aria-valuenow")).toBe("33");
  });
});

describe("MigrationProgressModal · failed", () => {
  const FAILED_STEPS: MigrationStep[] = [
    { version: 1, label: "Token kinds", status: "done" },
    { version: 2, label: "Dark color seed", status: "failed" },
  ];

  it("renders 'Migration failed' title + red error banner", () => {
    const { getByText, getByRole } = render(
      <MigrationProgressModal
        open
        onOpenChange={vi.fn()}
        state="failed"
        steps={FAILED_STEPS}
        failureMessage="DarkSeedError: invalid mapping"
        stuckAt={2}
      />
    );
    expect(getByText("Migration failed")).toBeTruthy();
    expect(getByText("Migration v2 failed")).toBeTruthy();
    expect(getByText("DarkSeedError: invalid mapping")).toBeTruthy();
    expect(getByRole("alert")).toBeTruthy();
  });

  it("Restore snapshot button calls onRestoreSnapshot", () => {
    const onRestoreSnapshot = vi.fn();
    const { getByText } = render(
      <MigrationProgressModal
        open
        onOpenChange={vi.fn()}
        state="failed"
        steps={FAILED_STEPS}
        failureMessage="boom"
        snapshotLabel="project-v0 · 14:32"
        stuckAt={2}
        onRestoreSnapshot={onRestoreSnapshot}
      />
    );
    fireEvent.click(getByText("Restore snapshot"));
    expect(onRestoreSnapshot).toHaveBeenCalled();
  });

  it("Retry button calls onRetry with stuck version label", () => {
    const onRetry = vi.fn();
    const { getByText } = render(
      <MigrationProgressModal
        open
        onOpenChange={vi.fn()}
        state="failed"
        steps={FAILED_STEPS}
        failureMessage="boom"
        stuckAt={2}
        onRetry={onRetry}
      />
    );
    fireEvent.click(getByText("Retry v2"));
    expect(onRetry).toHaveBeenCalled();
  });

  it("hides progressbar in failed state", () => {
    const { queryByRole } = render(
      <MigrationProgressModal
        open
        onOpenChange={vi.fn()}
        state="failed"
        steps={FAILED_STEPS}
        failureMessage="boom"
        stuckAt={2}
      />
    );
    expect(queryByRole("progressbar")).toBeNull();
  });
});

describe("MigrationProgressModal · open=false", () => {
  it("does not render content", () => {
    const { container } = render(
      <MigrationProgressModal
        open={false}
        onOpenChange={vi.fn()}
        state="running"
        steps={RUNNING_STEPS}
      />
    );
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
  });
});
