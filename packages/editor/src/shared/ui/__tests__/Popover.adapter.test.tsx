/**
 * Phase 4 contract tests — verify legacy Popover prop surface still works
 * through the hybrid adapter shim → vibcoder Popover surface (bd-popover
 * skin) inside legacy positioning + outside-click + Escape + focus-trap
 * shell.
 *
 * Hybrid testing notes:
 * - The shim portals into document.body (legacy behavior preserved). The
 *   bd-popover element (rendered by vibcoder Popover) appears as a
 *   descendant of the portal wrapper.
 * - userEvent for keyboard/click — matches T5 Modal precedent.
 * - Each test cleans up the body in beforeEach to prevent leaks across the
 *   file.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover } from "../Popover";

beforeEach(() => {
  cleanup();
});

describe("Popover adapter shim — surface render", () => {
  it("renders the bd-popover surface when triggered open", async () => {
    render(
      <Popover
        trigger={<button>open</button>}
        content={<p>Body</p>}
        triggerOn="click"
      />,
    );
    await userEvent.click(screen.getByText("open"));
    expect(document.querySelector(".bd-popover")).toBeTruthy();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("does not render bd-popover content while closed", () => {
    render(
      <Popover
        trigger={<button>open</button>}
        content={<p>Body</p>}
        triggerOn="click"
      />,
    );
    expect(document.querySelector(".bd-popover")).toBeNull();
  });

  it("vibcoder Popover surface uses role=dialog", async () => {
    render(
      <Popover
        trigger={<button>open</button>}
        content={<p>Body</p>}
        triggerOn="click"
      />,
    );
    await userEvent.click(screen.getByText("open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("Popover adapter shim — open/close behavior", () => {
  it("toggles open on trigger click (triggerOn=click default)", async () => {
    render(
      <Popover trigger={<button>open</button>} content={<p>Body</p>} />,
    );
    await userEvent.click(screen.getByText("open"));
    expect(document.querySelector(".bd-popover")).toBeTruthy();
    await userEvent.click(screen.getByText("open"));
    expect(document.querySelector(".bd-popover")).toBeNull();
  });

  it("closes on Escape (default behavior)", async () => {
    render(
      <Popover trigger={<button>open</button>} content={<p>Body</p>} />,
    );
    await userEvent.click(screen.getByText("open"));
    expect(document.querySelector(".bd-popover")).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(document.querySelector(".bd-popover")).toBeNull();
    });
  });

  it("closes on outside click when closeOnClickOutside=true (default)", async () => {
    render(
      <div>
        <span data-testid="outside">outside</span>
        <Popover trigger={<button>open</button>} content={<p>Body</p>} />
      </div>,
    );
    await userEvent.click(screen.getByText("open"));
    expect(document.querySelector(".bd-popover")).toBeTruthy();
    await userEvent.click(screen.getByTestId("outside"));
    await waitFor(() => {
      expect(document.querySelector(".bd-popover")).toBeNull();
    });
  });

  it("does NOT close on outside click when closeOnClickOutside=false", async () => {
    render(
      <div>
        <span data-testid="outside">outside</span>
        <Popover
          trigger={<button>open</button>}
          content={<p>Body</p>}
          closeOnClickOutside={false}
        />
      </div>,
    );
    await userEvent.click(screen.getByText("open"));
    expect(document.querySelector(".bd-popover")).toBeTruthy();
    await userEvent.click(screen.getByTestId("outside"));
    // Surface still mounted.
    expect(document.querySelector(".bd-popover")).toBeTruthy();
  });
});

describe("Popover adapter shim — trigger slot", () => {
  it("renders trigger element", () => {
    render(
      <Popover
        trigger={<button>my-trigger</button>}
        content={<p>Body</p>}
      />,
    );
    expect(screen.getByText("my-trigger")).toBeInTheDocument();
  });

  it("triggerOn='hover' opens on mouse enter", async () => {
    const user = userEvent.setup();
    render(
      <Popover
        trigger={<button>open</button>}
        content={<p>Body</p>}
        triggerOn="hover"
      />,
    );
    await user.hover(screen.getByText("open"));
    expect(document.querySelector(".bd-popover")).toBeTruthy();
  });
});

describe("Popover adapter shim — positioning", () => {
  it("position='bottom' is the default", async () => {
    render(
      <Popover trigger={<button>open</button>} content={<p>Body</p>} />,
    );
    await userEvent.click(screen.getByText("open"));
    // Wrapper holds positioning styles; vibcoder surface holds the bd-popover class.
    const surface = document.querySelector(".bd-popover");
    expect(surface).toBeTruthy();
    const wrapper = surface!.parentElement as HTMLElement;
    expect(wrapper.style.transform).toContain("translateX(-50%)");
  });

  it("position='top' applies translateY(-100%) transform", async () => {
    render(
      <Popover
        trigger={<button>open</button>}
        content={<p>Body</p>}
        position="top"
      />,
    );
    await userEvent.click(screen.getByText("open"));
    const surface = document.querySelector(".bd-popover");
    expect(surface).toBeTruthy();
    const wrapper = surface!.parentElement as HTMLElement;
    expect(wrapper.style.transform).toContain("translateY(-100%)");
  });

  it("position='left' applies translateX(-100%) transform", async () => {
    render(
      <Popover
        trigger={<button>open</button>}
        content={<p>Body</p>}
        position="left"
      />,
    );
    await userEvent.click(screen.getByText("open"));
    const surface = document.querySelector(".bd-popover");
    const wrapper = surface!.parentElement as HTMLElement;
    expect(wrapper.style.transform).toContain("translateX(-100%)");
  });

  it("position='right' applies translateY(-50%) transform", async () => {
    render(
      <Popover
        trigger={<button>open</button>}
        content={<p>Body</p>}
        position="right"
      />,
    );
    await userEvent.click(screen.getByText("open"));
    const surface = document.querySelector(".bd-popover");
    const wrapper = surface!.parentElement as HTMLElement;
    expect(wrapper.style.transform).toBe("translateY(-50%)");
  });
});

describe("Popover adapter shim — focus trap (legacy parity)", () => {
  it("focuses first focusable child when opened", async () => {
    render(
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
    await userEvent.click(screen.getByText("open"));
    const firstInside = document.querySelector(".bd-popover button") as HTMLElement;
    expect(firstInside).toBeTruthy();
    await waitFor(() => {
      expect(document.activeElement).toBe(firstInside);
    });
  });
});

describe("Popover adapter shim — content rendering", () => {
  it("renders content as children of bd-popover surface", async () => {
    render(
      <Popover
        trigger={<button>open</button>}
        content={<p data-testid="child">Body</p>}
      />,
    );
    await userEvent.click(screen.getByText("open"));
    const child = screen.getByTestId("child");
    // child is a descendant of the bd-popover surface
    const surface = child.closest(".bd-popover");
    expect(surface).toBeTruthy();
  });

  it("portal mounts content under document.body (legacy behavior preserved)", async () => {
    render(
      <Popover trigger={<button>open</button>} content={<p>Body</p>} />,
    );
    await userEvent.click(screen.getByText("open"));
    const surface = document.querySelector(".bd-popover");
    expect(surface).toBeTruthy();
    // Walk up to confirm the portal wrapper is a direct child of body.
    let node: HTMLElement | null = surface as HTMLElement;
    while (node && node.parentElement && node.parentElement !== document.body) {
      node = node.parentElement;
    }
    expect(node?.parentElement).toBe(document.body);
  });
});

describe("Popover adapter shim — onOpenChange wiring", () => {
  it("vibcoder onOpenChange(false) closes the surface", async () => {
    // Click outside causes close path which exercises setIsOpen(false).
    // This indirectly covers the internal onOpenChange wiring of the
    // vibcoder primitive — additional explicit test here would require
    // simulating an internal call, which the public API does not expose.
    const onContentClick = vi.fn();
    render(
      <div>
        <span data-testid="outside">outside</span>
        <Popover
          trigger={<button>open</button>}
          content={<p onClick={onContentClick}>Body</p>}
        />
      </div>,
    );
    await userEvent.click(screen.getByText("open"));
    await userEvent.click(screen.getByTestId("outside"));
    await waitFor(() => {
      expect(document.querySelector(".bd-popover")).toBeNull();
    });
    expect(onContentClick).not.toHaveBeenCalled();
  });
});
