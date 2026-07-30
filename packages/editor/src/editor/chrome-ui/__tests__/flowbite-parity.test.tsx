/**
 * flowbite-react behavior parity evaluation (spec §4.3, §5 — Task 4).
 *
 * NOT a regression suite. Each block encodes ONE shipped contract from the
 * `editor/ui` primitive it stands in for, then exercises the FLOWBITE
 * component to see whether flowbite's built-in behavior meets it. Every
 * assertion below documents ACTUAL, verified flowbite-react 0.12.17 behavior
 * (confirmed by rendering + inspecting the DOM, and cross-checked against
 * `node_modules/flowbite-react/dist/**` + `@floating-ui/react` source) — the
 * suite stays green because it asserts what flowbite really does, not what
 * we wish it did. Verdicts are recorded in
 * `docs/plans/flowbite-bigbang-inventory.md` under "## Behavior parity
 * verdicts".
 *
 * flowbiteStore is configured globally via src/test-setup.ts (tw: prefix) —
 * no explicit import needed here, matching tw-setup.test.tsx.
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { Modal, Dropdown, DropdownItem, Popover, Tooltip, Toast } from "flowbite-react";
import { getOverlayRoot } from "../OverlayRoot";

describe("flowbite Modal vs modal-owns-keyboard + focus contract (chrome-ui/focus.ts:78, ui/OverlayMount.tsx:39)", () => {
  // Verdict: KEEP. Modal DOES accept `root` (Modal.d.ts: `root?: HTMLElement`)
  // so portal-targeting #bk-overlay-root (spec §4.4) works — that alone would
  // read as SWAP. The decisive gap is aria-modal: @floating-ui/react's
  // useRole never emits it (grepping the entire @floating-ui/react package
  // for "aria-modal" returns zero matches; useRole's floating props are only
  // `{ id, role: 'dialog' }`) and live rendering confirms the attribute is
  // `null` on the dialog element. isModalOpen() (chrome-ui/focus.ts:78) is
  // `document.querySelector('[role="dialog"][aria-modal="true"]')` — the
  // sole enforcement point for the ff230492 fix ("an open modal owns the
  // keyboard — everywhere") depended on by StudioHeader.tsx:248,
  // useEditorShortcuts.ts:75 and canvas/comments/CommentLayer.tsx:213. Our
  // own OverlayMount already stamps both attributes together
  // (ui/OverlayMount.tsx:39) — proof the pairing is load-bearing, not
  // incidental. A caller CAN work around the gap by passing
  // `aria-modal="true"` manually (it lands via the restProps ->
  // getFloatingProps spread onto the dialog div — verified below), but
  // nothing requires it: the prop is optional, TypeScript will not flag its
  // absence, and omitting it silently reproduces the exact production bug
  // ff230492 fixed (global shortcuts fire behind an open modal). Decisive
  // evidence #2: even WITH dismissible + a manually-added aria-modal, Escape
  // still LEAKS to a bubble-phase document keydown listener (verified
  // below) — @floating-ui/react's useDismiss registers its own Escape
  // handler on `document` in the bubble phase and never calls
  // stopPropagation (floating-ui.react.mjs:2772-2773), unlike our
  // useFocusTrap's capture-phase handler (chrome-ui/focus.ts:39,57) which
  // stops the event before any bubble listener sees it. Secondary finding:
  // Escape-to-close is opt-in via `dismissible` (default false) rather than
  // the always-on behavior our useFocusTrap gives every overlay; focus-
  // trap-on-open does work, but only after an async flush, not
  // synchronously on mount.

  it("accepts a root prop that targets the shared overlay root (spec §4.4)", () => {
    render(
      <Modal show onClose={() => {}} root={getOverlayRoot()}>
        <div>hi</div>
      </Modal>,
    );
    expect(getOverlayRoot().textContent).toContain("hi");
  });

  it("never emits aria-modal by default — isModalOpen() cannot see it as open", () => {
    render(
      <Modal show onClose={() => {}} root={getOverlayRoot()} dismissible>
        <button type="button">inside</button>
      </Modal>,
    );
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBeNull();
  });

  it("DOES accept aria-modal as a manual, type-optional, unenforced prop (the only workaround)", () => {
    render(
      <Modal show onClose={() => {}} root={getOverlayRoot()} dismissible aria-modal="true">
        <button type="button">inside</button>
      </Modal>,
    );
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
  });

  it("Escape does NOT call onClose unless dismissible is explicitly passed (opt-in, not default)", () => {
    const onClose = vi.fn();
    render(
      <Modal show onClose={onClose} root={getOverlayRoot()}>
        <button type="button">x</button>
      </Modal>,
    );
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Escape DOES call onClose once dismissible is passed, but the event LEAKS to a bubble-phase document listener (decisive KEEP evidence #2, ff230492)", () => {
    // useFocusTrap (chrome-ui/focus.ts:57) registers its Escape handler in
    // the CAPTURE phase and calls e.stopPropagation() (focus.ts:39) before
    // any bubble-phase listener runs — that is what stops a global keydown
    // handler (like useEditorShortcuts.ts) from double-reacting to the same
    // Escape a modal just consumed. flowbite's dismiss handler
    // (@floating-ui/react useDismiss, floating-ui.react.mjs:2772-2773) is
    // registered on `document` in the BUBBLE phase and never calls
    // stopPropagation, so a bubble-phase document listener registered by
    // application code still sees the same Escape keydown. Verified: it does.
    const leaked = vi.fn();
    document.addEventListener("keydown", leaked);
    const onClose = vi.fn();

    render(
      <Modal show onClose={onClose} root={getOverlayRoot()} dismissible>
        <button type="button">x</button>
      </Modal>,
    );
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
    expect(leaked).toHaveBeenCalled();

    document.removeEventListener("keydown", leaked);
  });

  it("moves focus inside on open, but only after an async flush — not synchronously like useFocusTrap", async () => {
    render(
      <Modal show onClose={() => {}} root={getOverlayRoot()} dismissible>
        <button type="button">inside</button>
      </Modal>,
    );
    // Synchronous read, right after render: FloatingFocusManager has not
    // moved focus yet (contrast with chrome-ui/focus.ts's useFocusTrap,
    // which focuses the first focusable element in the same effect tick).
    expect(document.activeElement).toBe(document.body);
    await waitFor(() => {
      expect(getOverlayRoot().contains(document.activeElement)).toBe(true);
    });
  });
});

describe("flowbite Dropdown vs Menu contract (ui/Popover.tsx:66-165)", () => {
  // Verdict: KEEP. Not because of portalling — Dropdown never portals at all
  // (grepping Dropdown.js for createPortal/FloatingPortal returns zero
  // matches, unlike Modal); it renders inline in the React tree, which
  // already matches our "anchored, not portalled" philosophy
  // (ui/Popover.tsx:4) — spec §4.4's portal-targeting requirement does not
  // even apply here. Roving arrow-key focus and return-focus-to-trigger-on-
  // Escape DO work (@floating-ui/react useListNavigation +
  // FloatingFocusManager, Dropdown.js:100/154) — verified below, though only
  // after an async flush, not synchronously. The decisive gap is API shape:
  // DropdownItemProps (DropdownItem.d.ts) has no checked/selected field and
  // DropdownItem always renders role="menuitem" (DropdownItem.js:41) — never
  // "menuitemcheckbox" — while our Menu's roving-focus selector explicitly
  // includes both roles (ITEM_SELECTOR, ui/Popover.tsx:86) because MenuItem
  // supports a checkable variant (`selected` prop). Any caller using a
  // checkable menu item has no flowbite equivalent to move to without a
  // rewrite.

  it("never portals — content renders inline in the React tree, not via the overlay root", () => {
    render(
      <Dropdown label="menu">
        <DropdownItem>a</DropdownItem>
        <DropdownItem>b</DropdownItem>
      </Dropdown>,
    );
    fireEvent.click(screen.getByRole("button", { name: "menu" }));
    const menu = screen.getByRole("menu");
    expect(getOverlayRoot().contains(menu)).toBe(false);
    expect(document.body.contains(menu)).toBe(true);
  });

  it("ArrowDown moves focus through items; Escape returns focus to trigger — async, not synchronous", async () => {
    render(
      <Dropdown label="menu">
        <DropdownItem>a</DropdownItem>
        <DropdownItem>b</DropdownItem>
      </Dropdown>,
    );
    const trigger = screen.getByRole("button", { name: "menu" });
    fireEvent.click(trigger);
    const menu = screen.getByRole("menu");
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement?.textContent).toBe("a");
    fireEvent.keyDown(document.activeElement ?? menu, { key: "Escape" });
    // Focus return is async (FloatingFocusManager), not synchronous like our
    // Menu's roving-focus keydown handler — waitFor gives it room to land.
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("DropdownItem has no checkable-item role — always menuitem, never menuitemcheckbox", () => {
    render(
      <Dropdown label="menu">
        <DropdownItem>a</DropdownItem>
      </Dropdown>,
    );
    fireEvent.click(screen.getByRole("button", { name: "menu" }));
    expect(screen.getByRole("menuitem", { name: "a" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitemcheckbox")).toBeNull();
  });
});

describe("flowbite Popover vs anchored, non-trapping contract (ui/Popover.tsx:1-13, :18-29)", () => {
  // Verdict: KEEP. Structurally it already matches "anchored, not portalled"
  // (Popover.js has no createPortal/FloatingPortal call — same inline
  // Fragment pattern as Tooltip) so §4.4 portal-targeting doesn't even
  // apply. The decisive gaps are behavioral, not cosmetic:
  // (1) Popover.js always wraps its panel in
  //     `FloatingFocusManager({ context, modal: true })` — an UNCONDITIONAL
  //     focus trap: verified below, opening a Popover renders floating-ui's
  //     focus-guard elements AND marks the trigger `aria-hidden="true"` +
  //     `data-floating-ui-inert=""` (i.e. the rest of the page is made inert
  //     while it's open) — while our Popover intentionally traps nothing; it
  //     only closes on Escape/outside pointer-down (ui/Popover.tsx:1-11) so
  //     e.g. a filter popover next to other toolbar buttons stays reachable.
  // (2) PopoverProps.content is a single fixed ReactNode slot (Popover.d.ts)
  //     while ours takes `trigger` + arbitrary composed `children` as the
  //     panel body (PopoverProps, ui/Popover.tsx:18-29) — real callers that
  //     compose our Menu inside a Popover would need restructuring around
  //     the `content` prop shape independent of the trap-behavior question.

  it("never portals — content renders inline as a Fragment sibling, not via the overlay root", () => {
    render(
      <Popover content={<div>panel</div>} open>
        <button type="button">trigger</button>
      </Popover>,
    );
    const panel = screen.getByText("panel");
    expect(getOverlayRoot().contains(panel)).toBe(false);
    expect(document.body.contains(panel)).toBe(true);
  });

  it("traps focus unconditionally (modal: true) — the trigger itself goes inert while open", () => {
    render(
      <Popover
        content={
          <div>
            <button type="button">inside</button>
          </div>
        }
        open
      >
        <button type="button">trigger</button>
      </Popover>,
    );
    // FloatingFocusManager brackets the trap with guard elements and marks
    // everything outside it inert — evidence of a real, unconditional trap,
    // unlike ui/Popover.tsx which has none.
    expect(document.querySelectorAll("[data-floating-ui-focus-guard]").length).toBeGreaterThan(0);
    expect(screen.getByText("trigger").getAttribute("aria-hidden")).toBe("true");
  });
});

describe("flowbite Tooltip vs anchored show/hide contract (ui/Popover.tsx:1-13)", () => {
  // Verdict: SWAP. Floating.js — the primitive Tooltip is built on — never
  // calls createPortal (grep = zero matches); trigger and floating content
  // render as plain sibling <div>s in React's own tree, which already
  // satisfies "anchored, not portalled" with no root prop needed since there
  // is nothing to aim. TooltipProps.trigger is typed "hover" | "click"
  // (Tooltip.d.ts) with no explicit "focus" option, but that reads narrower
  // than it behaves: flowbite's hooks/use-floating.js:useFloatingInteractions
  // unconditionally includes `useFocus(context)` as an interaction
  // regardless of the `trigger` prop (Floating.js constructs
  // `interactions: [focus]` every render) — verified below, a tooltip shows
  // on keyboard focus even with the default trigger="hover". No behavior gap
  // found against the shipped contract.

  it("renders the trigger and floating content as siblings, not through a portal", () => {
    const { container } = render(<Tooltip content="tip text">hover me</Tooltip>);
    const tip = screen.getByText("tip text");
    expect(container.contains(tip)).toBe(true);
    expect(getOverlayRoot().contains(tip)).toBe(false);
  });

  it("shows the tooltip content on hover trigger (default trigger mode)", () => {
    // getByText("tip text") resolves theme.content (Tooltip/theme.js) — an
    // INNER div flowbite always renders regardless of open state. The real
    // show/hide toggle is theme.hidden ("invisible opacity-0", applied with
    // the tw: prefix as "tw:invisible tw:opacity-0") on the OUTER wrapper,
    // `[data-testid="flowbite-tooltip"]` (Floating.js). Asserting on the
    // inner text node alone is vacuous — it never changes. Assert the
    // wrapper's class toggle instead.
    render(<Tooltip content="tip text">hover me</Tooltip>);
    const wrapper = screen.getByTestId("flowbite-tooltip");
    expect(wrapper.className).toMatch(/tw:invisible/);
    fireEvent.mouseEnter(screen.getByText("hover me"));
    expect(wrapper.className).not.toMatch(/tw:invisible/);
  });

  it("also shows on keyboard focus even though trigger defaults to hover — useFocus is always wired in", () => {
    render(
      <Tooltip content="tip text">
        <button type="button">target</button>
      </Tooltip>,
    );
    const wrapper = screen.getByTestId("flowbite-tooltip");
    expect(wrapper.className).toMatch(/tw:invisible/);
    fireEvent.focus(screen.getByText("target"));
    expect(wrapper.className).not.toMatch(/tw:invisible/);
  });
});

describe("flowbite Toast vs one-action lifecycle contract (ui/Toast.tsx:1-16, ui/Toast.tsx:49-135)", () => {
  // Verdict: KEEP. flowbite-react's Toast (Toast.js) is a single static
  // container: no queue/store, no auto-dismiss timer (its `duration` prop
  // only picks a CSS transition-duration class — the durationClasses map,
  // Toast.js — nothing calls setTimeout), no built-in action-button slot,
  // and no aria-live viewport. Every one of those is load-bearing in ours:
  // the module-level `store` (ui/Toast.tsx:49) feeds `useToast().addToast()`
  // call sites, `ToastItem` self-dismisses via a real timer
  // (ui/Toast.tsx:135), and `ToastViewport` sets aria-live polite/assertive
  // by tone (ui/Toast.tsx:119). flowbite-react gives us a styled shell to
  // build that on top of, not the lifecycle itself.

  it("does not auto-dismiss after its stated duration — no timer is wired to unmount", () => {
    vi.useFakeTimers();
    render(<Toast duration={75}>content</Toast>);
    expect(screen.getByText("content")).toBeInTheDocument();
    vi.advanceTimersByTime(5000);
    // Still present — flowbite's `duration` only selects a CSS class
    // (durationClasses map, Toast.js), it never calls setTimeout.
    expect(screen.getByText("content")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("renders a single role=alert container, with no aria-live viewport wiring beyond it", () => {
    // This only asserts what's directly observable in the DOM: one static
    // role="alert" node, no aria-live attribute anywhere. The broader
    // queue/store fact (no module-level store, no multi-item viewport) is
    // a source-code claim, not something a single render can assert against
    // — it's recorded as a citation in the inventory verdict instead
    // (Toast.js has no store; contrast ui/Toast.tsx:49 store +
    // ui/Toast.tsx:112-128 ToastViewport).
    render(<Toast>content</Toast>);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(document.querySelectorAll("[aria-live]").length).toBe(0);
  });
});
