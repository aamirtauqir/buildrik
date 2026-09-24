// @vitest-environment jsdom
/**
 * Re-attach this comment — board 4418:115766.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReattachModal, reattachCandidates, type CandidateNode } from "../ReattachModal";

afterEach(cleanup);

const node = (id: string, type: string, content = "", layerName?: string, children: CandidateNode[] = []): CandidateNode => ({
  getId: () => id,
  getType: () => type,
  getContent: () => content,
  getCustomData: (k: string) => (k === "layerName" ? layerName : undefined),
  getChildren: () => children,
});
const page = node("root", "container", "", undefined, [
  node("s1", "section", "", "Hours", [node("t1", "text", "<b>Opening</b> times")]),
  node("b1", "button", "Reserve a table"),
]);

describe("reattachCandidates", () => {
  it("lists every element but the root as Type · Name (layer name, else text)", () => {
    expect(reattachCandidates(page)).toEqual([
      { id: "s1", label: "Section · Hours" },
      { id: "t1", label: "Text · Opening times" },
      { id: "b1", label: "Button · Reserve a table" },
    ]);
  });
});

describe("ReattachModal", () => {
  it("picks one element and re-attaches to it; Re-attach waits for a pick", async () => {
    const onReattach = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <ReattachModal open body="is the terrace open?" pageName="Home" candidates={reattachCandidates(page)} onClose={onClose} onReattach={onReattach} />,
    );
    expect(screen.getByText("Re-attach this comment")).toBeTruthy();
    expect(screen.getByText("“is the terrace open?”")).toBeTruthy();
    const submit = screen.getByTestId("reattach-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "Button · Reserve a table" }));
    fireEvent.click(submit);
    await waitFor(() => expect(onReattach).toHaveBeenCalledWith("b1"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("keeps the canvas pick as a secondary door", () => {
    const onPick = vi.fn();
    const onClose = vi.fn();
    render(<ReattachModal open body="x" pageName={null} candidates={[]} onClose={onClose} onReattach={vi.fn()} onPickOnCanvas={onPick} />);
    fireEvent.click(screen.getByRole("button", { name: "Pick on canvas" }));
    expect(onClose).toHaveBeenCalled();
    expect(onPick).toHaveBeenCalled();
  });
});
