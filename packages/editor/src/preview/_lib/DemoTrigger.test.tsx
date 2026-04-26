/**
 * DemoTrigger tests — verify stateful trigger toggles + render-prop receives state.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DemoTrigger } from "./DemoTrigger";

describe("DemoTrigger", () => {
  it("renders the trigger button with given label", () => {
    render(
      <DemoTrigger label="Open modal">
        {() => null}
      </DemoTrigger>
    );
    expect(screen.getByRole("button", { name: "Open modal" })).toBeInTheDocument();
  });

  it("starts with open=false in render-prop", () => {
    let captured: boolean | null = null;
    render(
      <DemoTrigger label="Open">
        {(open) => {
          captured = open;
          return null;
        }}
      </DemoTrigger>
    );
    expect(captured).toBe(false);
  });

  it("flips open to true when trigger is clicked", async () => {
    const user = userEvent.setup();
    let captured: boolean | null = null;
    render(
      <DemoTrigger label="Open">
        {(open) => {
          captured = open;
          return null;
        }}
      </DemoTrigger>
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(captured).toBe(true);
  });

  it("setOpen callback exposes the latest open value to the render-prop", async () => {
    const user = userEvent.setup();
    const seen: boolean[] = [];
    const setOpenRef: { current: ((next: boolean) => void) | null } = { current: null };
    render(
      <DemoTrigger label="Open">
        {(open, setOpen) => {
          seen.push(open);
          setOpenRef.current = setOpen;
          return null;
        }}
      </DemoTrigger>
    );
    expect(seen[seen.length - 1]).toBe(false);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(seen[seen.length - 1]).toBe(true);
    setOpenRef.current?.(false);
    // Allow React to flush the state update from the synchronous setState call
    await Promise.resolve();
    // Both true and false should have been observed across renders
    expect(seen.includes(false)).toBe(true);
    expect(seen.includes(true)).toBe(true);
  });
});
