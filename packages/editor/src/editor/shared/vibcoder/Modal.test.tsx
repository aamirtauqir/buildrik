/**
 * Modal tests — verify Phase 3 contracts on the canary organism.
 *
 * What we test (per E2 + Phase 3 design):
 *   - Markup: vibcoder CSS classes applied (bd-modal, bd-modal--lg/xl,
 *     bd-modal__title, bd-modal__subtitle, bd-modal__foot per source CSS)
 *   - Sibling export composition: Modal + Trigger + Content + Title + ... renders
 *   - asChild boundary (E1): caller's child receives ARIA props + ref
 *   - Engine encapsulation (E2): no Radix types leaked (verified by ESLint rule)
 *   - Always-controlled (B): defaultOpen prop is NOT defined on ModalProps
 *   - Portal discipline (E3): content renders inside #vibcoder-overlay-root
 *
 * What we DON'T test (Radix owns these):
 *   - Focus trap behavior, scroll lock, click-outside, Esc keypress, ARIA correctness.
 *   - Re-testing duplicates Radix's own test suite.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { forwardRef, type ReactElement } from "react";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalClose,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  type ModalProps,
} from "./Modal";
import { OverlayMount } from "./OverlayMount";

// Helper: render with OverlayMount wrapper (E3 portal target)
function renderModal(ui: ReactElement) {
  return render(<OverlayMount>{ui}</OverlayMount>);
}

beforeEach(() => {
  cleanup();
  document.getElementById("vibcoder-overlay-root")?.remove();
});

describe("Modal — sibling export composition", () => {
  it("renders trigger button when closed", () => {
    renderModal(
      <Modal open={false} onOpenChange={() => {}}>
        <ModalTrigger>Open</ModalTrigger>
        <ModalContent>
          <ModalTitle>Title</ModalTitle>
        </ModalContent>
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    // Content portals only when open=true
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders all 7 siblings together when open=true", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalTrigger>Open</ModalTrigger>
        <ModalContent>
          <ModalTitle>Confirm</ModalTitle>
          <ModalDescription>Are you sure?</ModalDescription>
          <ModalFooter>
            <ModalClose>Cancel</ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});

describe("Modal — vibcoder CSS classes (markup contract)", () => {
  it("ModalContent applies bd-modal class", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-modal");
  });

  it("ModalContent applies bd-modal--lg modifier when size='lg'", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent size="lg">
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-modal--lg");
  });

  it("ModalContent applies bd-modal--xl modifier when size='xl'", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent size="xl">
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("bd-modal--xl");
  });

  it("ModalContent omits size modifier when size prop unset (default-omit convention)", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).not.toHaveClass("bd-modal--lg");
    expect(dialog).not.toHaveClass("bd-modal--xl");
  });

  it("ModalTitle applies bd-modal__title class", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>,
    );
    expect(screen.getByText("x")).toHaveClass("bd-modal__title");
  });

  it("ModalDescription applies bd-modal__subtitle class (canonical descriptive text)", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent>
          <ModalTitle>title</ModalTitle>
          <ModalDescription>desc</ModalDescription>
        </ModalContent>
      </Modal>,
    );
    expect(screen.getByText("desc")).toHaveClass("bd-modal__subtitle");
  });

  it("ModalFooter applies bd-modal__foot class (canonical footer slot)", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
          <ModalFooter>
            <button>OK</button>
          </ModalFooter>
        </ModalContent>
      </Modal>,
    );
    const footer = screen.getByRole("button", { name: "OK" }).parentElement;
    expect(footer).toHaveClass("bd-modal__foot");
  });

  it("ModalContent overlay applies bd-modal-backdrop class", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>,
    );
    // Backdrop renders as sibling of the dialog inside the portal container
    const backdrop = document.querySelector(".bd-modal-backdrop");
    expect(backdrop).not.toBeNull();
  });

  it("ModalContent merges caller-provided className with bd-modal", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent className="extra-class">
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("bd-modal");
    expect(dialog).toHaveClass("extra-class");
  });
});

describe("Modal — asChild boundary (E1)", () => {
  it("ModalTrigger asChild forwards onClick to caller's child", async () => {
    const user = userEvent.setup();
    let onChangeCalls = 0;
    renderModal(
      <Modal
        open={false}
        onOpenChange={() => {
          onChangeCalls++;
        }}
      >
        <ModalTrigger asChild>
          <button data-testid="custom-trigger">Custom</button>
        </ModalTrigger>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>,
    );
    await user.click(screen.getByTestId("custom-trigger"));
    expect(onChangeCalls).toBe(1);
  });

  it("ModalTrigger asChild forwards aria-haspopup to caller's child", () => {
    renderModal(
      <Modal open={false} onOpenChange={() => {}}>
        <ModalTrigger asChild>
          <button data-testid="custom-trigger">Custom</button>
        </ModalTrigger>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>,
    );
    const trigger = screen.getByTestId("custom-trigger");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("ModalTrigger asChild forwards ref to caller's child", () => {
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
    renderModal(
      <Modal open={false} onOpenChange={() => {}}>
        <ModalTrigger asChild>
          <RefButton />
        </ModalTrigger>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>,
    );
    expect(capturedRef).not.toBeNull();
    expect((capturedRef as unknown as HTMLButtonElement).tagName).toBe("BUTTON");
  });

  it("ModalClose asChild forwards onClick to caller's child", async () => {
    const user = userEvent.setup();
    const openChanges: boolean[] = [];
    renderModal(
      <Modal
        open={true}
        onOpenChange={(next) => {
          openChanges.push(next);
        }}
      >
        <ModalContent>
          <ModalTitle>x</ModalTitle>
          <ModalClose asChild>
            <button data-testid="custom-close">Done</button>
          </ModalClose>
        </ModalContent>
      </Modal>,
    );
    await user.click(screen.getByTestId("custom-close"));
    expect(openChanges).toEqual([false]);
  });
});

describe("Modal — controlled state (Contract B)", () => {
  it("does not render content when open=false", () => {
    renderModal(
      <Modal open={false} onOpenChange={() => {}}>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders content when open=true", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("ModalProps does not expose defaultOpen (compile-time check via TS)", () => {
    // This is a TypeScript compile-time contract check. If `defaultOpen` were
    // accidentally added to ModalProps, the @ts-expect-error directive below
    // would have nothing to suppress — and TS would flag it as unused, failing
    // the build. So adding defaultOpen to ModalProps WILL break this test.
    // @ts-expect-error - defaultOpen is forbidden by Contract B (no uncontrolled mode)
    const _bad: ModalProps = { open: false, onOpenChange: () => {}, children: null, defaultOpen: true };
    void _bad;
    expect(true).toBe(true);
  });
});

describe("Modal — portal discipline (E3)", () => {
  it("ModalContent renders inside #vibcoder-overlay-root, not document.body", () => {
    renderModal(
      <Modal open={true} onOpenChange={() => {}}>
        <ModalContent>
          <ModalTitle>x</ModalTitle>
        </ModalContent>
      </Modal>,
    );
    const root = document.getElementById("vibcoder-overlay-root");
    const dialog = screen.getByRole("dialog");
    expect(root).not.toBeNull();
    expect(root?.contains(dialog)).toBe(true);
  });
});

describe("Modal — engine encapsulation (E2)", () => {
  it("ModalProps interface accepts only vibcoder-shaped props (smoke check)", () => {
    // Compile-time enforcement is done by the no-engine-public-export ESLint rule.
    // This test asserts the runtime shape of vibcoder-named props.
    const props: ModalProps = {
      open: false,
      onOpenChange: () => {},
      children: null,
    };
    expect(props.open).toBe(false);
    expect(typeof props.onOpenChange).toBe("function");
  });
});
