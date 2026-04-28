/**
 * Popover tests — verify the Radix.Popover-backed compound after the T7
 * upgrade. The Phase 2 passive-surface tests are gone; we now test the
 * compound shape (Root/Trigger/Portal/Content/Arrow), the bd-popover CSS
 * skin, the --with-arrow modifier, and the standard Radix dismiss
 * behavior the wrapper inherits (Esc + outside click).
 *
 * What we DON'T re-test (Radix owns these): focus management, ARIA
 * correctness, animation states. Re-testing duplicates Radix's own suite.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverArrow,
} from "./Popover";

beforeEach(() => {
  cleanup();
});

// Helper: a controlled wrapper that lets userEvent drive the trigger so
// Radix sees a real open-state transition (mirrors how chrome consumers
// will hold open state in T2+).
function ControlledPopover({
  initialOpen = false,
  onOpenChange,
  children,
}: {
  initialOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        onOpenChange?.(next);
      }}
    >
      {children}
    </Popover>
  );
}

describe("Popover — compound shape", () => {
  it("renders no content when open=false", () => {
    render(
      <Popover open={false} onOpenChange={() => {}}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverPortal>
          <PopoverContent>body</PopoverContent>
        </PopoverPortal>
      </Popover>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("body")).not.toBeInTheDocument();
  });

  it("renders content with bd-popover className when open=true", () => {
    render(
      <Popover open={true} onOpenChange={() => {}}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverPortal>
          <PopoverContent>body</PopoverContent>
        </PopoverPortal>
      </Popover>,
    );
    const content = screen.getByText("body");
    expect(content).toHaveClass("bd-popover");
  });

  it("renders the trigger button regardless of open state", () => {
    render(
      <Popover open={false} onOpenChange={() => {}}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverPortal>
          <PopoverContent>body</PopoverContent>
        </PopoverPortal>
      </Popover>,
    );
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
  });
});

describe("Popover — bd-popover--with-arrow modifier", () => {
  it("omits --with-arrow when withArrow undefined", () => {
    render(
      <Popover open={true} onOpenChange={() => {}}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverPortal>
          <PopoverContent>body</PopoverContent>
        </PopoverPortal>
      </Popover>,
    );
    expect(screen.getByText("body").className).not.toContain(
      "bd-popover--with-arrow",
    );
  });

  it("adds --with-arrow when withArrow=true", () => {
    render(
      <Popover open={true} onOpenChange={() => {}}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverPortal>
          <PopoverContent withArrow>body</PopoverContent>
        </PopoverPortal>
      </Popover>,
    );
    expect(screen.getByText("body")).toHaveClass("bd-popover--with-arrow");
  });

  it("merges caller className with bd-popover", () => {
    render(
      <Popover open={true} onOpenChange={() => {}}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverPortal>
          <PopoverContent className="extra">body</PopoverContent>
        </PopoverPortal>
      </Popover>,
    );
    const content = screen.getByText("body");
    expect(content).toHaveClass("bd-popover");
    expect(content).toHaveClass("extra");
  });
});

describe("Popover — onOpenChange dismiss behavior (Radix-default)", () => {
  it("fires onOpenChange(false) when Esc is pressed", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ControlledPopover initialOpen={true} onOpenChange={onOpenChange}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverPortal>
          <PopoverContent>body</PopoverContent>
        </PopoverPortal>
      </ControlledPopover>,
    );
    expect(screen.getByText("body")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("fires onOpenChange(false) when an outside click happens", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <div>
        <button data-testid="outside">outside</button>
        <ControlledPopover initialOpen={true} onOpenChange={onOpenChange}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverPortal>
            <PopoverContent>body</PopoverContent>
          </PopoverPortal>
        </ControlledPopover>
      </div>,
    );
    expect(screen.getByText("body")).toBeInTheDocument();
    await user.click(screen.getByTestId("outside"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("Popover — PopoverTrigger asChild", () => {
  it("anchors to a custom button element via asChild", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ControlledPopover onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button data-testid="custom-trigger">Custom</button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent>body</PopoverContent>
        </PopoverPortal>
      </ControlledPopover>,
    );
    const trigger = screen.getByTestId("custom-trigger");
    // Radix wires aria-haspopup onto the asChild target
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await user.click(trigger);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByText("body")).toBeInTheDocument();
  });
});

describe("Popover — PopoverArrow export", () => {
  it("renders the Radix arrow inside the content", () => {
    render(
      <Popover open={true} onOpenChange={() => {}}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverPortal>
          <PopoverContent>
            body
            <PopoverArrow data-testid="arrow" />
          </PopoverContent>
        </PopoverPortal>
      </Popover>,
    );
    expect(screen.getByTestId("arrow")).toBeInTheDocument();
  });
});
