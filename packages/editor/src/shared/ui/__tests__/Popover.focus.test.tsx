import { describe, it, expect } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import React from "react";
import { Popover } from "../Popover";

describe("Popover — focus trap integration", () => {
  it("renders and mounts the focus trap when open", async () => {
    const { container, getByText } = render(
      <Popover
        trigger={<button>open</button>}
        content={
          <div>
            <button>inside-btn</button>
          </div>
        }
        triggerOn="click"
      />,
    );

    // Click trigger to open
    await act(async () => {
      fireEvent.click(getByText("open"));
    });

    expect(document.querySelector(".aqb-popover")).toBeTruthy();
    expect(container).toBeTruthy();
  });

  it("closes on Escape key when open", async () => {
    render(
      <Popover
        trigger={<button>open</button>}
        content={<button>inside</button>}
        triggerOn="click"
      />,
    );

    // Open
    await act(async () => {
      fireEvent.click(document.querySelector("button")!);
    });
    expect(document.querySelector(".aqb-popover")).toBeTruthy();

    // Press Escape
    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(document.querySelector(".aqb-popover")).toBeNull();
  });

  it("traps focus inside popover content when open", async () => {
    const { getByText } = render(
      <Popover
        trigger={<button>open</button>}
        content={
          <>
            <button>first-inside</button>
            <button>second-inside</button>
          </>
        }
        triggerOn="click"
      />,
    );

    await act(async () => {
      fireEvent.click(getByText("open"));
    });

    // After opening, focus should move to first focusable inside popover
    const firstInside = document.querySelector(".aqb-popover button") as HTMLElement;
    expect(firstInside).toBeTruthy();
    expect(document.activeElement).toBe(firstInside);
  });
});
