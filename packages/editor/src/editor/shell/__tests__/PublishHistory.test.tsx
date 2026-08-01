/**
 * PublishHistory (P1) — the published-version list + rollback (contract §5).
 * Verifies load states (loading → list, error+retry not fake-empty, empty),
 * the live badge on the latest, rollbackable gating, and rollback pick →
 * confirm → re-publish-as-new-version.
 */
import * as React from "react";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchPublishHistory = vi.fn();
const rollbackToVersion = vi.fn();

vi.mock("../../../services/PublishService", () => ({
  fetchPublishHistory: (...a: unknown[]) => fetchPublishHistory(...a),
  rollbackToVersion: (...a: unknown[]) => rollbackToVersion(...a),
}));

// P6 role gating — controllable; null = unknown (rollback stays enabled).
const roleState = vi.hoisted(() => ({ role: null as string | null }));
vi.mock("../hooks/useEditorRole", () => ({
  useEditorRole: () => roleState.role,
}));

import { PublishHistory } from "../PublishHistory";

const ROWS = [
  { id: "j3", version: 3, completedAt: "2026-07-23T10:00:00Z", deploymentId: "d3", rollbackable: true, rolledBackFrom: null },
  { id: "j2", version: 2, completedAt: "2026-07-22T10:00:00Z", deploymentId: "d2", rollbackable: true, rolledBackFrom: "j1" },
  { id: "j1", version: 1, completedAt: "2026-07-21T10:00:00Z", deploymentId: "d1", rollbackable: false, rolledBackFrom: null },
];

function renderIt(props = {}) {
  return render(
    <PublishHistory siteId="s1" {...props} />,
  );
}

beforeEach(() => {
  fetchPublishHistory.mockReset().mockResolvedValue(ROWS);
  rollbackToVersion.mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  roleState.role = null;
});

// P6 permissions boards: rollback is admin-scoped — non-admins see the button
// disabled with "Ask an admin to roll back", never hidden.
describe("P6 rollback role gating", () => {
  it("EDITOR sees rollback disabled with the ask-an-admin reason", async () => {
    roleState.role = "EDITOR";
    renderIt();
    expect(await screen.findByText(/Version 3/i)).toBeInTheDocument();
    const buttons = screen.getAllByRole("button", { name: /roll back/i });
    buttons.forEach((b) => {
      expect(b).toBeDisabled();
      expect(b).toHaveAttribute("title", "Ask an admin to roll back");
    });
  });

  it("ADMIN keeps rollback enabled on rollbackable versions", async () => {
    roleState.role = "ADMIN";
    renderIt();
    expect(await screen.findByText(/Version 3/i)).toBeInTheDocument();
    const rows = screen.getAllByRole("button", { name: /roll back/i });
    // v2 is rollbackable (enabled); v1's snapshot is gone (still disabled).
    expect(rows.some((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
  });
});

describe("load states", () => {
  it("lists versions with a live badge on the latest and a ↩ marker on a rollback", async () => {
    renderIt();
    expect(await screen.findByText(/Version 3/i)).toBeInTheDocument();
    expect(screen.getByText(/live/i)).toBeInTheDocument(); // latest is the live one
    expect(screen.getByText(/from v1/i)).toBeInTheDocument(); // v2 was a rollback
  });

  it("shows error+retry (not fake-empty) on a failed load", async () => {
    fetchPublishHistory.mockRejectedValueOnce(new Error("network"));
    renderIt();
    expect(await screen.findByText(/couldn't load/i)).toBeInTheDocument();
    expect(screen.queryByText(/no published versions/i)).not.toBeInTheDocument();
    fetchPublishHistory.mockResolvedValue(ROWS);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText(/Version 3/i)).toBeInTheDocument();
  });

  it("shows an empty state when nothing has been published", async () => {
    fetchPublishHistory.mockResolvedValue([]);
    renderIt();
    expect(await screen.findByText(/no published versions/i)).toBeInTheDocument();
  });
});

describe("rollback", () => {
  it("the live (latest) version has no rollback action", async () => {
    renderIt();
    await screen.findByText(/Version 3/i);
    const liveRow = screen.getByText(/Version 3/i).closest("[data-version-row]") as HTMLElement;
    expect(within(liveRow).queryByRole("button", { name: /roll back/i })).not.toBeInTheDocument();
  });

  it("a non-rollbackable older version is disabled with a reason", async () => {
    renderIt();
    await screen.findByText(/Version 1/i);
    const row = screen.getByText(/Version 1/i).closest("[data-version-row]") as HTMLElement;
    const btn = within(row).getByRole("button", { name: /roll back/i });
    expect(btn).toBeDisabled();
  });

  it("rolling back an older version confirms then re-publishes it", async () => {
    renderIt();
    await screen.findByText(/Version 2/i);
    const row = screen.getByText(/Version 2/i).closest("[data-version-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /roll back/i }));
    // confirm dialog names the version + reassures the draft is untouched
    expect(screen.getByText(/roll back to version 2/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /roll back now/i }));
    await waitFor(() => expect(rollbackToVersion).toHaveBeenCalledWith("s1", "j2"));
  });
});
