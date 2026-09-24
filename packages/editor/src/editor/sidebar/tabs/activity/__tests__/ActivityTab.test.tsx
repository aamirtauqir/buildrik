// @vitest-environment jsdom
/**
 * Activity is its own right-column panel (board 4418:140587; owner ruling
 * 2026-09-25), not a History tab. A row opens its subject in the editor with
 * the sub-screen that makes the landing panel draw "‹ Activity".
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as React from "react";
import { EVENTS } from "@/shared/constants/events";

vi.mock("../ActivityLogView", () => ({
  ActivityLogView: ({ siteId, onOpenRow }: { siteId: string | null; onOpenRow?: (k: "edit" | "comment" | "publish") => void }) => (
    <div data-testid="activity-log" data-site={siteId ?? ""}>
      <button onClick={() => onOpenRow?.("comment")}>comment row</button>
      <button onClick={() => onOpenRow?.("publish")}>publish row</button>
      <button onClick={() => onOpenRow?.("edit")}>edit row</button>
    </div>
  ),
}));

import { ActivityTab } from "../ActivityTab";

afterEach(cleanup);

describe("ActivityTab — its own panel", () => {
  it("is titled Activity, closes with ✕, and reads the site it was given", () => {
    const onClose = vi.fn();
    render(<ActivityTab composer={null} projectId="site-1" onClose={onClose} />);
    expect(screen.getByTestId("activity-panel")).toHaveTextContent("Activity");
    expect(screen.getByTestId("activity-log").getAttribute("data-site")).toBe("site-1");
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("rows open Review, History › Published and History › Session, each marked as from Activity", () => {
    const emit = vi.fn();
    render(<ActivityTab composer={{ emit } as never} projectId="site-1" />);
    fireEvent.click(screen.getByText("comment row"));
    fireEvent.click(screen.getByText("publish row"));
    fireEvent.click(screen.getByText("edit row"));
    expect(emit.mock.calls).toEqual([
      [EVENTS.UI_PANEL_OPEN, { panel: "review", screen: "from-activity" }],
      [EVENTS.UI_PANEL_OPEN, { panel: "history", screen: "from-activity:published" }],
      [EVENTS.UI_PANEL_OPEN, { panel: "history", screen: "from-activity:session" }],
    ]);
  });
});
