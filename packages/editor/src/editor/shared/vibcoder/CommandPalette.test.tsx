/**
 * CommandPalette tests — verify Phase 3 contracts on cmdk-engine organism.
 *
 * What we test:
 *   - Sibling export composition: Palette + Input + List + Section + Item + Empty
 *   - Vibcoder CSS classes (bd-cmd, bd-cmd__search, bd-cmd__search-input,
 *     bd-cmd__body, bd-cmd__section, bd-cmd__item, bd-cmd__empty)
 *   - Always-controlled (B): no defaultOpen prop
 *   - Portal discipline (E3): content renders inside #vibcoder-overlay-root
 *   - Item onSelect fires on click
 *   - Disabled item does not fire onSelect
 *
 * What we DON'T test (cmdk owns these):
 *   - Filtering algorithm, keyboard nav (arrow keys), virtual focus, ARIA wiring.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CommandPalette,
  CommandPaletteInput,
  CommandPaletteList,
  CommandPaletteItem,
  CommandPaletteSection,
  CommandPaletteEmpty,
  type CommandPaletteProps,
} from "./CommandPalette";
import { OverlayMount } from "./OverlayMount";

beforeEach(() => {
  cleanup();
  document.getElementById("vibcoder-overlay-root")?.remove();
});

function renderPalette(open = true) {
  const onSelect = vi.fn();
  const onSelectDisabled = vi.fn();
  render(
    <OverlayMount>
      <CommandPalette open={open} onOpenChange={() => {}}>
        <CommandPaletteInput placeholder="Search..." />
        <CommandPaletteList>
          <CommandPaletteEmpty>No results</CommandPaletteEmpty>
          <CommandPaletteSection heading="Navigation">
            <CommandPaletteItem value="home" onSelect={onSelect}>
              Go home
            </CommandPaletteItem>
            <CommandPaletteItem
              value="disabled-item"
              onSelect={onSelectDisabled}
              disabled
            >
              Disabled
            </CommandPaletteItem>
          </CommandPaletteSection>
        </CommandPaletteList>
      </CommandPalette>
    </OverlayMount>,
  );
  return { onSelect, onSelectDisabled };
}

describe("CommandPalette — root", () => {
  it("does not render content when open=false", () => {
    renderPalette(false);
    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
  });

  it("renders content when open=true", () => {
    renderPalette(true);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("applies bd-cmd class to dialog content", () => {
    renderPalette(true);
    const root = document.querySelector(".bd-cmd");
    expect(root).not.toBeNull();
  });

  it("uses provided label for accessibility", () => {
    render(
      <OverlayMount>
        <CommandPalette
          open={true}
          onOpenChange={() => {}}
          label="My custom label"
        >
          <CommandPaletteInput />
          <CommandPaletteList>
            <CommandPaletteSection heading="x">
              <CommandPaletteItem>x</CommandPaletteItem>
            </CommandPaletteSection>
          </CommandPaletteList>
        </CommandPalette>
      </OverlayMount>,
    );
    expect(
      screen.getByRole("dialog", { name: "My custom label" }),
    ).toBeInTheDocument();
  });

  it("uses default label 'Command palette' when label prop omitted", () => {
    render(
      <OverlayMount>
        <CommandPalette open={true} onOpenChange={() => {}}>
          <CommandPaletteInput />
          <CommandPaletteList>
            <CommandPaletteSection heading="x">
              <CommandPaletteItem>x</CommandPaletteItem>
            </CommandPaletteSection>
          </CommandPaletteList>
        </CommandPalette>
      </OverlayMount>,
    );
    expect(
      screen.getByRole("dialog", { name: "Command palette" }),
    ).toBeInTheDocument();
  });
});

describe("CommandPalette — vibcoder CSS classes", () => {
  it("CommandPaletteInput wraps input in .bd-cmd__search and applies bd-cmd__search-input on the input", () => {
    renderPalette(true);
    const input = screen.getByPlaceholderText("Search...");
    expect(input).toHaveClass("bd-cmd__search-input");
    expect(input.parentElement).toHaveClass("bd-cmd__search");
  });

  it("CommandPaletteList applies bd-cmd__body class", () => {
    renderPalette(true);
    expect(document.querySelector(".bd-cmd__body")).not.toBeNull();
  });

  it("CommandPaletteSection applies bd-cmd__section class", () => {
    renderPalette(true);
    expect(document.querySelector(".bd-cmd__section")).not.toBeNull();
  });

  it("CommandPaletteItem applies bd-cmd__item class", () => {
    renderPalette(true);
    expect(document.querySelector(".bd-cmd__item")).not.toBeNull();
  });

  it("CommandPaletteEmpty would apply bd-cmd__empty class when no results", async () => {
    const user = userEvent.setup();
    renderPalette(true);
    // Type something that will not match to trigger the Empty branch.
    const input = screen.getByPlaceholderText("Search...");
    await user.type(input, "zzzzzzzzzz-no-match");
    expect(document.querySelector(".bd-cmd__empty")).not.toBeNull();
  });
});

describe("CommandPalette — interaction", () => {
  it("Item onSelect fires when clicked", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPalette(true);
    await user.click(screen.getByText("Go home"));
    expect(onSelect).toHaveBeenCalledWith("home");
  });

  it("disabled item does not fire onSelect when clicked", async () => {
    const user = userEvent.setup();
    const { onSelectDisabled } = renderPalette(true);
    await user.click(screen.getByText("Disabled"));
    expect(onSelectDisabled).not.toHaveBeenCalled();
  });
});

describe("CommandPalette — controlled state (Contract B)", () => {
  it("CommandPaletteProps does not expose defaultOpen (compile-time)", () => {
    // @ts-expect-error - defaultOpen is forbidden by Contract B
    const _bad: CommandPaletteProps = { open: false, onOpenChange: () => {}, children: null, defaultOpen: true };
    void _bad;
    expect(true).toBe(true);
  });
});

describe("CommandPalette — portal discipline (E3)", () => {
  it("CommandDialog renders inside #vibcoder-overlay-root, not document.body", () => {
    renderPalette(true);
    const root = document.getElementById("vibcoder-overlay-root");
    const dialog = screen.getByRole("dialog");
    expect(root).not.toBeNull();
    expect(root?.contains(dialog)).toBe(true);
  });
});

describe("CommandPalette — engine encapsulation (E2/E4)", () => {
  it("CommandPaletteProps interface accepts only vibcoder-shaped props (smoke check)", () => {
    const props: CommandPaletteProps = {
      open: false,
      onOpenChange: () => {},
      children: null,
    };
    expect(props.open).toBe(false);
    expect(typeof props.onOpenChange).toBe("function");
  });
});
