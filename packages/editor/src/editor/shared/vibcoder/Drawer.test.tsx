/**
 * Drawer tests — verify Phase 3 contracts on the Drawer overlay organism.
 *
 * Mirrors Modal.test.tsx structure. What we test:
 *   - Sibling export composition: Drawer + Trigger + Content + Title + ...
 *   - Vibcoder CSS classes (bd-drawer, bd-drawer--{left,bottom,sm,md,lg},
 *     bd-drawer__title, bd-drawer__subtitle)
 *   - Side prop emits data-side attribute (right is default)
 *   - asChild boundary (E1) on Trigger + Close
 *   - Always-controlled (B): no defaultOpen on DrawerProps
 *   - Portal discipline (E3): content renders inside #vibcoder-overlay-root
 *
 * What we DON'T test (Radix owns these):
 *   - Focus trap, Esc keypress, click-outside, ARIA correctness.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { forwardRef, type ReactElement } from "react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
  DrawerTitle,
  DrawerDescription,
  type DrawerProps,
} from "./Drawer";
import { OverlayMount } from "./OverlayMount";

// Helper: render with OverlayMount wrapper (E3 portal target)
function renderDrawer(ui: ReactElement) {
  return render(<OverlayMount>{ui}</OverlayMount>);
}

beforeEach(() => {
  cleanup();
  document.getElementById("vibcoder-overlay-root")?.remove();
});

describe("Drawer — sibling export composition", () => {
  it("renders trigger button when closed", () => {
    renderDrawer(
      <Drawer open={false} onOpenChange={() => {}}>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Title</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders all 5 siblings together when open=true", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Pages</DrawerTitle>
          <DrawerDescription>Browse pages</DrawerDescription>
          <DrawerClose>Close</DrawerClose>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Pages")).toBeInTheDocument();
    expect(screen.getByText("Browse pages")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});

describe("Drawer — vibcoder CSS classes (markup contract)", () => {
  it("DrawerContent applies bd-drawer class", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent>
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-drawer");
  });

  it("DrawerContent omits side modifier when side='right' (default)", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent>
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).not.toHaveClass("bd-drawer--right");
    expect(dialog).not.toHaveClass("bd-drawer--left");
    expect(dialog).not.toHaveClass("bd-drawer--bottom");
  });

  it("DrawerContent applies bd-drawer--left when side='left'", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent side="left">
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-drawer--left");
  });

  it("DrawerContent applies bd-drawer--bottom when side='bottom'", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent side="bottom">
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-drawer--bottom");
  });

  it("DrawerContent applies bd-drawer--sm when size='sm'", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent size="sm">
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-drawer--sm");
  });

  it("DrawerContent applies bd-drawer--md when size='md'", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent size="md">
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-drawer--md");
  });

  it("DrawerContent applies bd-drawer--lg when size='lg'", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent size="lg">
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-drawer--lg");
  });

  it("DrawerTitle applies bd-drawer__title class", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent>
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("x")).toHaveClass("bd-drawer__title");
  });

  it("DrawerDescription applies bd-drawer__subtitle class", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent>
          <DrawerTitle>title</DrawerTitle>
          <DrawerDescription>desc</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("desc")).toHaveClass("bd-drawer__subtitle");
  });

  it("DrawerContent merges caller-provided className with bd-drawer", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent className="extra-class">
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("bd-drawer");
    expect(dialog).toHaveClass("extra-class");
  });
});

describe("Drawer — data-side attribute", () => {
  it("emits data-side='right' when side prop omitted (default)", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent>
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "right");
  });

  it("emits data-side='left' when side='left'", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent side="left">
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "left");
  });

  it("emits data-side='right' when side='right'", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent side="right">
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "right");
  });

  it("emits data-side='bottom' when side='bottom'", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent side="bottom">
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "bottom");
  });
});

describe("Drawer — asChild boundary (E1)", () => {
  it("DrawerTrigger asChild forwards onClick to caller's child", async () => {
    const user = userEvent.setup();
    let onChangeCalls = 0;
    renderDrawer(
      <Drawer
        open={false}
        onOpenChange={() => {
          onChangeCalls++;
        }}
      >
        <DrawerTrigger asChild>
          <button data-testid="custom-trigger">Custom</button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByTestId("custom-trigger"));
    expect(onChangeCalls).toBe(1);
  });

  it("DrawerTrigger asChild forwards ref to caller's child", () => {
    let capturedRef: HTMLButtonElement | null = null;
    const RefButton = forwardRef<HTMLButtonElement>((props, ref) => {
      return (
        <button
          ref={(el) => {
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
            capturedRef = el;
          }}
          {...props}
        >
          Custom
        </button>
      );
    });
    RefButton.displayName = "RefButton";
    renderDrawer(
      <Drawer open={false} onOpenChange={() => {}}>
        <DrawerTrigger asChild>
          <RefButton />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(capturedRef).not.toBeNull();
    expect((capturedRef as unknown as HTMLButtonElement).tagName).toBe("BUTTON");
  });

  it("DrawerClose asChild forwards onClick to caller's child", async () => {
    const user = userEvent.setup();
    const openChanges: boolean[] = [];
    renderDrawer(
      <Drawer
        open={true}
        onOpenChange={(next) => {
          openChanges.push(next);
        }}
      >
        <DrawerContent>
          <DrawerTitle>x</DrawerTitle>
          <DrawerClose asChild>
            <button data-testid="custom-close">Done</button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByTestId("custom-close"));
    expect(openChanges).toEqual([false]);
  });
});

describe("Drawer — controlled state (Contract B)", () => {
  it("does not render content when open=false", () => {
    renderDrawer(
      <Drawer open={false} onOpenChange={() => {}}>
        <DrawerContent>
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders content when open=true", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent>
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("DrawerProps does not expose defaultOpen (compile-time check via TS)", () => {
    // @ts-expect-error - defaultOpen is forbidden by Contract B (no uncontrolled mode)
    const _bad: DrawerProps = { open: false, onOpenChange: () => {}, children: null, defaultOpen: true };
    void _bad;
    expect(true).toBe(true);
  });
});

describe("Drawer — portal discipline (E3)", () => {
  it("DrawerContent renders inside #vibcoder-overlay-root, not document.body", () => {
    renderDrawer(
      <Drawer open={true} onOpenChange={() => {}}>
        <DrawerContent>
          <DrawerTitle>x</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    const root = document.getElementById("vibcoder-overlay-root");
    const dialog = screen.getByRole("dialog");
    expect(root).not.toBeNull();
    expect(root?.contains(dialog)).toBe(true);
  });
});

describe("Drawer — engine encapsulation (E2)", () => {
  it("DrawerProps interface accepts only vibcoder-shaped props (smoke check)", () => {
    const props: DrawerProps = {
      open: false,
      onOpenChange: () => {},
      children: null,
    };
    expect(props.open).toBe(false);
    expect(typeof props.onOpenChange).toBe("function");
  });
});
