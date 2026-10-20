/**
 * Design decision 13 (DR-T7): a disabled control says why. Focusable,
 * aria-disabled, ignores activation, reason readable and described-by.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../Button";

afterEach(cleanup);

describe("Button — disabledReason", () => {
  it("stays focusable, ignores activation, and is described by its reason", () => {
    const onClick = vi.fn();
    render(
      <Button disabledReason="Fix 1 blocker to publish" onClick={onClick}>
        Publish
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Publish" });
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveAttribute("aria-disabled", "true");
    btn.focus();
    expect(document.activeElement).toBe(btn);
    fireEvent.click(btn);
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(onClick).not.toHaveBeenCalled();
    const reason = document.getElementById(btn.getAttribute("aria-describedby")!)!;
    expect(reason).toHaveTextContent("Fix 1 blocker to publish");
    expect(reason.className).toContain("--bk-ink-soft");
  });

  it("without a reason it is the plain button", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Save" })).not.toHaveAttribute("aria-disabled");
  });
});
