/**
 * RecoveryBanner (C6) — surfaces the previously-dead crash sentinel. On reopen
 * after a crash it tells the user their work was recovered (timestamp + scope)
 * and offers Keep / Discard-and-reload. No crash → nothing renders.
 */
import * as React from "react";
import { TooltipProvider } from "@/editor/shared/vibcoder";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecoveryBanner } from "../RecoveryBanner";

const SENTINEL = "buildrick:last-crash";

function seedCrash(atMsAgo = 30_000) {
  sessionStorage.setItem(
    SENTINEL,
    JSON.stringify({ at: Date.now() - atMsAgo, source: "error", reason: "boom" }),
  );
}

function renderBanner(props = {}) {
  return render(
    <TooltipProvider>
      <RecoveryBanner pageCount={3} {...props} />
    </TooltipProvider>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});
afterEach(cleanup);

describe("RecoveryBanner", () => {
  it("renders nothing when there was no crash", () => {
    const { container } = renderBanner();
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a recovery banner after a crash, with scope, and clears the sentinel", () => {
    seedCrash();
    renderBanner();
    expect(screen.getByText(/recovered your work/i)).toBeInTheDocument();
    expect(screen.getByText(/3 pages/i)).toBeInTheDocument();
    // consuming the sentinel means a re-render / reload won't re-show it
    expect(sessionStorage.getItem(SENTINEL)).toBeNull();
  });

  it("Keep changes dismisses the banner", () => {
    seedCrash();
    renderBanner();
    fireEvent.click(screen.getByRole("button", { name: /keep changes/i }));
    expect(screen.queryByText(/recovered your work/i)).not.toBeInTheDocument();
  });

  it("Discard & reload clears the local draft and reloads", () => {
    seedCrash();
    localStorage.setItem("buildrick-project", JSON.stringify({ project: {} }));
    const reload = vi.fn();
    renderBanner({ reloadFn: reload });
    fireEvent.click(screen.getByRole("button", { name: /discard/i }));
    expect(localStorage.getItem("buildrick-project")).toBeNull();
    expect(reload).toHaveBeenCalled();
  });
});
