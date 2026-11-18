/**
 * SaveStatus — contract tests against the Figma component (697:461).
 *
 * Moved from `editor/ui/__tests__/topbar.test.tsx` (Task 6, flowbite
 * big-bang) when SaveStatus ported to chrome-ui. `.bk-save`/`.bk-save__ago`
 * class-selector queries rewritten to structural DOM queries — the
 * component's own root/stamp shape (single root element, stamp as its last
 * child when present) is the stable contract now that the classnames
 * carrying it are gone (Task 6 "assert the applied utility, not a deleted
 * implementation class" rule).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SaveStatus } from "../SaveStatus";

describe("SaveStatus", () => {
  it.each([
    ["saving", "Saving…"],
    ["unsaved", "Unsaved changes"],
    ["conflict", "Conflict — reload"],
    /* Not "saved locally" — for a dashboard-backed site nothing is written to
       the device and nothing replays on reconnect. Read live while offline,
       this pill promised a local copy while the announcement beside it said
       "changes not saved". */
    ["offline", "Offline — not saved"],
    /* Task 1.6, board B7-G02: the site never loaded — about this session,
       not the stored site. Never "Saved". */
    ["not-loaded", "Not loaded · nothing saved yet"],
  ] as const)("renders the %s truth", (state, copy) => {
    render(<SaveStatus state={state} />);
    expect(screen.getByText(copy)).toBeTruthy();
  });

  // eng D5 (regression): SaveStatus is presentation-only — the topbar's single
  // announcement region speaks; a second live region here double-announces.
  it("carries NO live semantics of its own", () => {
    const { container, rerender } = render(<SaveStatus state="saved" savedAt={Date.now()} />);
    rerender(<SaveStatus state="conflict" />);
    expect(container.querySelector("[aria-live]")).toBeNull();
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(screen.getByText("Conflict — reload")).toBeTruthy();
  });

  it("formats the saved timestamp", () => {
    const { container } = render(<SaveStatus state="saved" savedAt={Date.now() - 120_000} />);
    expect(container.textContent).toBe("Saved 2m ago");
  });

  it("no timestamp yet → 'Saved' alone", () => {
    const { container } = render(<SaveStatus state="saved" />);
    expect(container.textContent).toBe("Saved");
  });

  /* 2L9 497:99485 / C05 10:2199: the board's saved and failed states. */
  it("saved is muted text after a check — no dot, no door", () => {
    render(<SaveStatus state="saved" savedAt={Date.now()} />);
    const status = screen.getByTestId("save-status-saved");
    expect(status.tagName).toBe("SPAN");
    expect(status.textContent).toBe("Saved just now");
    expect(status.className).toContain("tw:text-[var(--bk-ink-muted)]");
    expect(status.querySelector("svg")).not.toBeNull();
  });

  it("a failed save reads \"Couldn’t save — Retry\" in the error tone, and is the retry", () => {
    let clicked = 0;
    render(<SaveStatus state="error" onClick={() => (clicked += 1)} />);
    const btn = screen.getByRole("button", { name: "Couldn’t save — Retry" });
    expect(btn.className).toContain("--bk-error-text");
    btn.click();
    expect(clicked).toBe(1);
  });
});

/* Design decision 4 / DR-T3: "Not saving · unsaved for 45 s", and the pill
   opens the stuck-save panel. */
describe("SaveStatus — stalled", () => {
  it("says how long the oldest change has waited", () => {
    const { rerender } = render(<SaveStatus state="stalled" stalledFor={45_000} />);
    expect(screen.getByTestId("save-status-stalled")).toHaveTextContent("Not saving · unsaved for 45 s");
    rerender(<SaveStatus state="stalled" stalledFor={190_000} />);
    expect(screen.getByTestId("save-status-stalled")).toHaveTextContent("Not saving · unsaved for 3 min");
  });

  it("the pill is the trigger of its panel", () => {
    render(
      <SaveStatus
        state="stalled"
        stalledFor={31_000}
        onClick={() => {}}
        panel={{ open: true, onClose: () => {}, label: "Autosave is stuck", content: <p>Your changes are only in this tab.</p> }}
      />,
    );
    expect(screen.getByRole("button", { name: /Not saving/ })).toBeTruthy();
    expect(screen.getByText("Your changes are only in this tab.")).toBeTruthy();
  });
});
