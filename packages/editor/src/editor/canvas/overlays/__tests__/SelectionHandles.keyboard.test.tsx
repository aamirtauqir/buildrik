/**
 * BK-02: Enter on a handle started a pointer gesture from a keyboard event
 * with no coordinates — NaN sizes, and a transaction left holding autosave.
 * Arrows resize instead (⇧ = 10 px); Enter and Space start nothing.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SelectionHandles } from "../SelectionHandles";

afterEach(cleanup);

describe("SelectionHandles — keyboard", () => {
  it("arrows resize by 1 px, Shift by 10; Enter / Space start no pointer gesture", () => {
    const onHandleMouseDown = vi.fn();
    const onHandleKeyResize = vi.fn();
    render(
      <SelectionHandles left={0} top={0} width={200} height={100} onHandleMouseDown={onHandleMouseDown} onHandleKeyResize={onHandleKeyResize} />,
    );
    const handles = screen.getAllByRole("button");
    expect(handles.length).toBeGreaterThanOrEqual(8);
    for (const h of handles) {
      fireEvent.keyDown(h, { key: "Enter" });
      fireEvent.keyDown(h, { key: " " });
    }
    expect(onHandleMouseDown).not.toHaveBeenCalled();
    fireEvent.keyDown(handles[0], { key: "ArrowRight" });
    fireEvent.keyDown(handles[0], { key: "ArrowUp", shiftKey: true });
    expect(onHandleKeyResize.mock.calls).toEqual([
      ["right", 1],
      ["up", 10],
    ]);
  });
});
