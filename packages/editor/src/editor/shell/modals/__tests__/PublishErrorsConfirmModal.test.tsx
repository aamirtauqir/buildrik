/**
 * PublishErrorsConfirmModal — board B1-11 `7563:269418` (was 1168:4732),
 * "Publish with N open errors?".
 *
 * These asserts lived in StudioHeader.test.tsx while the dialog was the
 * topbar's private one. It is the `open-errors` publish gate now, mounted once
 * by AquibraStudio and reached from BOTH doors (B4, decision #34), so the
 * asserts moved with it — ported, not deleted (REGRESSION rule).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublishErrorsConfirmModal } from "../PublishErrorsConfirmModal";
import type { Issue } from "../../hooks/useStudioState";

const err = (id: string, message: string): Issue => ({ id, type: "error", message });
const warn = (id: string, message: string): Issue => ({ id, type: "warning", message });

function mount(issues: Issue[], over: Partial<React.ComponentProps<typeof PublishErrorsConfirmModal>> = {}) {
  const props = {
    open: true,
    issues,
    reviewerInRound: null,
    onFixFirst: vi.fn(),
    onPublishAnyway: vi.fn(),
    onClose: vi.fn(),
    ...over,
  };
  render(<PublishErrorsConfirmModal {...props} />);
  return props;
}

afterEach(cleanup);

describe("PublishErrorsConfirmModal", () => {
  it("renders nothing while closed", () => {
    mount([err("1", "x")], { open: false });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("names the count as OPEN errors and lists the message", () => {
    mount([err("1", "Broken link — Home / CTA")]);
    expect(screen.getByRole("dialog")).toBeTruthy();
    // Board 1168:4732 words it "open errors" — the errors were already
    // surfaced on the chip and left; this dialog is not reporting them anew.
    expect(screen.getByText("Publish with 1 open error?")).toBeTruthy();
    expect(screen.getByText("Broken link — Home / CTA")).toBeTruthy();
  });

  it("shows at most three rows, errors first, and +N more is the safe door", () => {
    const { onFixFirst } = mount([
      warn("w1", "warn one"),
      err("e1", "error one"),
      warn("w2", "warn two"),
      warn("w3", "warn three"),
      err("e2", "error two"),
    ]);
    expect(screen.getByText("error one")).toBeTruthy();
    expect(screen.getByText("error two")).toBeTruthy();
    expect(screen.getByText("warn one")).toBeTruthy();
    expect(screen.queryByText("warn three")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "+2 more warnings" }));
    expect(onFixFirst).toHaveBeenCalled();
  });

  it("an open review round adds the D13 note, naming the reviewer", () => {
    mount([err("1", "x")], { reviewerInRound: "Sana" });
    expect(screen.getByText(/A review round is open — Sana will see the published site/)).toBeTruthy();
  });

  it("no review round, no note", () => {
    mount([err("1", "x")]);
    expect(screen.queryByText(/review round is open/)).toBeNull();
  });

  /* Board 1168:4732 names the door by what it does: "Fix issues first". */
  it("'Fix issues first' is the safe door — nothing publishes", () => {
    const { onFixFirst, onPublishAnyway } = mount([err("1", "x")]);
    fireEvent.click(screen.getByRole("button", { name: "Fix issues first" }));
    expect(onFixFirst).toHaveBeenCalled();
    expect(onPublishAnyway).not.toHaveBeenCalled();
  });

  it("'Publish anyway' continues to the next door", () => {
    const { onPublishAnyway } = mount([err("1", "x")]);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Publish anyway" }));
    expect(onPublishAnyway).toHaveBeenCalledTimes(1);
  });
});
