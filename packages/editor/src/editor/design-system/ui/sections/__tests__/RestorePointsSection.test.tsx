// @vitest-environment jsdom
/** BRP1-M10 — Brand restore points: list, empty, restored. */
import * as React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const api = {
  rows: [] as Array<{ id: string; reason: string; createdAt: Date }>,
  status: "ready" as "loading" | "ready" | "error",
  refresh: vi.fn(),
  restore: vi.fn<(id: string) => Promise<"restored" | "refused" | "failed">>(),
};
vi.mock("@/editor/design-system/state/useBrandRestorePoints", () => ({ useBrandRestorePoints: () => api }));

import { RestorePointsSection, restorePointTime } from "../RestorePointsSection";

const now = new Date();
const at = (daysAgo: number, h: number, m: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, h, m);

beforeEach(() => {
  api.rows = [
    { id: "b", reason: "generator", createdAt: at(0, 14, 32) },
    { id: "a", reason: "dark-auto", createdAt: at(1, 16, 40) },
    { id: "z", reason: "theme-push", createdAt: at(1, 9, 15) },
  ];
  api.status = "ready";
  api.refresh.mockReset();
  api.restore.mockReset();
});

describe("RestorePointsSection (BRP1-M10)", () => {
  it("lists each point newest first with the board's reason and time", () => {
    const u = render(<RestorePointsSection composer={null} />);
    const rows = [...u.container.querySelectorAll("[data-testid^='brand-restore-row-']")];
    expect(rows.map((r) => r.getAttribute("data-testid"))).toEqual(["brand-restore-row-b", "brand-restore-row-a", "brand-restore-row-z"]);
    expect(rows[0].textContent).toContain("Generator");
    expect(rows[0].textContent).toContain("Today, 14:32");
    expect(rows[1].textContent).toContain("Dark mode Auto");
    expect(rows[1].textContent).toContain("Yesterday, 16:40");
    expect(rows[2].textContent).toContain("Theme push");
  });

  it("empty: the board's empty copy", () => {
    api.rows = [];
    const u = render(<RestorePointsSection composer={null} />);
    expect(u.getByTestId("brand-restore-empty").textContent).toBe("No restore points yet");
    expect(u.container.textContent).toContain("A restore point is created before a theme push, generator, dark-mode switch or logo import.");
  });

  it("Restore restores once on a double click, says so, and refreshes the list", async () => {
    let release!: (v: "restored") => void;
    api.restore.mockImplementation(() => new Promise((r) => { release = r; }));
    const onRestored = vi.fn();
    const u = render(<RestorePointsSection composer={null} onRestored={onRestored} />);
    fireEvent.click(u.getByTestId("brand-restore-b"));
    fireEvent.click(u.getByTestId("brand-restore-b"));
    expect(api.restore).toHaveBeenCalledTimes(1);
    expect(api.restore).toHaveBeenCalledWith("b");
    await act(async () => { release("restored"); });
    expect(onRestored).toHaveBeenCalledTimes(1);
    expect(api.refresh).toHaveBeenCalledTimes(1);
  });

  it.each(["refused", "failed"] as const)("%s: reports it, the list is untouched", async (outcome) => {
    api.restore.mockResolvedValue(outcome);
    const onRestored = vi.fn();
    const onFailed = vi.fn();
    const u = render(<RestorePointsSection composer={null} onRestored={onRestored} onFailed={onFailed} />);
    await act(async () => { fireEvent.click(u.getByTestId("brand-restore-a")); });
    expect(onFailed).toHaveBeenCalledTimes(1);
    expect(onRestored).not.toHaveBeenCalled();
    expect(api.refresh).not.toHaveBeenCalled();
    expect(u.container.querySelectorAll("[data-testid^='brand-restore-row-']")).toHaveLength(3);
  });

  it("a list that could not be loaded offers Retry", () => {
    api.status = "error";
    const u = render(<RestorePointsSection composer={null} />);
    expect(u.getByTestId("brand-restore-load-error").textContent).toBe("Restore points couldn't be loaded.");
    fireEvent.click(u.getByText("Retry"));
    expect(api.refresh).toHaveBeenCalledTimes(1);
  });

  it("formats older points by date", () => {
    expect(restorePointTime(new Date(2026, 9, 6, 9, 5), new Date(2026, 9, 9, 12, 0))).toBe("6 Oct, 09:05");
  });
});
