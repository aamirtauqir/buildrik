/**
 * Tooltip tests — verify the Radix.Tooltip-backed compound after the
 * Bucket B1 T1 upgrade. The Phase 2 passive-surface tests are gone; we now
 * test the compound shape (Provider/Root/Trigger/Portal/Content), the
 * bd-tooltip CSS skin, the --multiline modifier, asChild trigger anchoring,
 * Esc dismiss (Radix-default), and the unchanged visual-only sibling spans
 * (TooltipTitle / TooltipDesc / TooltipKbd).
 *
 * What we DON'T re-test (Radix owns these): focus management, ARIA
 * correctness, animation states, hover/pointer-enter timing. Re-testing
 * duplicates Radix's own suite.
 *
 * Tests wrap rendered trees in <TooltipProvider delayDuration={0}> so
 * userEvent doesn't have to wait on Radix's hover-intent timer.
 *
 * Note on selectors: Radix.Tooltip mounts a visually-hidden a11y span
 * (role="tooltip") that mirrors the visible content text — so getByText
 * matches twice. We query the visible surface directly via .bd-tooltip
 * to keep tests unambiguous.
 *
 * @license BSD-3-Clause
 */
import { createRef, useState, type ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipTitle,
  TooltipDesc,
  TooltipKbd,
} from "./Tooltip";

beforeEach(() => {
  cleanup();
});

// Helper: returns the visible bd-tooltip surface (skips Radix's a11y mirror).
function getVisibleTooltip(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".bd-tooltip");
}

// Helper: a controlled wrapper that lets userEvent drive open state so
// Radix sees a real transition (mirrors how chrome consumers will hold
// open state in T2+).
function ControlledTooltip({
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
    <TooltipProvider delayDuration={0}>
      <Tooltip
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
      >
        {children}
      </Tooltip>
    </TooltipProvider>
  );
}

describe("Tooltip — compound shape", () => {
  it("renders content with bd-tooltip className when defaultOpen=true", () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger>Open</TooltipTrigger>
          <TooltipPortal>
            <TooltipContent>body</TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>,
    );
    const content = getVisibleTooltip();
    expect(content).toBeTruthy();
    expect(content).toHaveClass("bd-tooltip");
    expect(content!.textContent).toContain("body");
  });

  it("renders the trigger button regardless of open state", () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip open={false} onOpenChange={() => {}}>
          <TooltipTrigger>Open</TooltipTrigger>
          <TooltipPortal>
            <TooltipContent>body</TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
  });
});

describe("Tooltip — bd-tooltip--multiline modifier", () => {
  it("omits --multiline when multiline undefined (default)", () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger>Open</TooltipTrigger>
          <TooltipPortal>
            <TooltipContent>body</TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(getVisibleTooltip()!.className).not.toContain(
      "bd-tooltip--multiline",
    );
  });

  it("adds --multiline when multiline=true", () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger>Open</TooltipTrigger>
          <TooltipPortal>
            <TooltipContent multiline>body</TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(getVisibleTooltip()).toHaveClass("bd-tooltip--multiline");
  });

  it("merges caller className with bd-tooltip", () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger>Open</TooltipTrigger>
          <TooltipPortal>
            <TooltipContent className="extra">body</TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>,
    );
    const content = getVisibleTooltip()!;
    expect(content).toHaveClass("bd-tooltip");
    expect(content).toHaveClass("extra");
  });

  it("forwardRef forwards to the content element", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger>Open</TooltipTrigger>
          <TooltipPortal>
            <TooltipContent ref={ref}>body</TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});

describe("Tooltip — onOpenChange dismiss behavior (Radix-default)", () => {
  it("fires onOpenChange(false) when Esc is pressed", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ControlledTooltip initialOpen={true} onOpenChange={onOpenChange}>
        <TooltipTrigger>Open</TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>body</TooltipContent>
        </TooltipPortal>
      </ControlledTooltip>,
    );
    expect(getVisibleTooltip()).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("Tooltip — TooltipTrigger asChild", () => {
  it("anchors to a custom focusable element via asChild (Radix forwards refs/props)", () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <span tabIndex={0} data-testid="custom-trigger">Custom</span>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent>body</TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>,
    );
    const trigger = screen.getByTestId("custom-trigger");
    // Radix wires aria-describedby onto the asChild target when content is open
    expect(trigger).toHaveAttribute("aria-describedby");
    expect(getVisibleTooltip()).toBeTruthy();
  });
});

describe("Tooltip — sibling exports (TooltipTitle / Desc / Kbd)", () => {
  it("TooltipTitle renders <span> with bd-tooltip__title class", () => {
    const { container } = render(<TooltipTitle>Save</TooltipTitle>);
    const el = container.querySelector("span.bd-tooltip__title");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("Save");
  });

  it("TooltipDesc renders <span> with bd-tooltip__desc class", () => {
    const { container } = render(<TooltipDesc>auto-saves</TooltipDesc>);
    const el = container.querySelector("span.bd-tooltip__desc");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("auto-saves");
  });

  it("TooltipKbd renders <span> with bd-tooltip__kbd class", () => {
    const { container } = render(<TooltipKbd>cmdS</TooltipKbd>);
    const el = container.querySelector("span.bd-tooltip__kbd");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("cmdS");
  });

  it("composes multiline tooltip with title + desc + kbd siblings inside content", () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger>Open</TooltipTrigger>
          <TooltipPortal>
            <TooltipContent multiline>
              <TooltipTitle>Save</TooltipTitle>
              <TooltipDesc>Auto-saves your work locally.</TooltipDesc>
              <TooltipKbd>cmdS</TooltipKbd>
            </TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>,
    );
    const content = getVisibleTooltip()!;
    expect(content.querySelector(".bd-tooltip__title")!.textContent).toBe(
      "Save",
    );
    expect(content.querySelector(".bd-tooltip__desc")!.textContent).toBe(
      "Auto-saves your work locally.",
    );
    expect(content.querySelector(".bd-tooltip__kbd")!.textContent).toBe(
      "cmdS",
    );
  });
});
