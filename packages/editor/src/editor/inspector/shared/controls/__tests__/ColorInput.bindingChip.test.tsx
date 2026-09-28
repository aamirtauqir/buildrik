/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { ColorInput } from "../ColorInput";
import { EVENTS } from "../../../../../shared/constants/events";

vi.mock("../../../../design-system/state/TokenRegistryContext", () => ({
  useColorRegistry: () => ({
    tokens: [
      {
        id: "color-primary",
        name: "Primary",
        value: "#2D6DFF",
        cssVar: "--buildrick-design-color-primary",
      },
    ],
  }),
}));

const mockEmit = vi.fn();
const fakeComposer = { emit: mockEmit } as unknown as Parameters<typeof ColorInput>[0]["composer"];

beforeEach(() => {
  mockEmit.mockClear();
});

describe("ColorInput · DSBindingChip integration", () => {
  it("a bound value shows the token's name inside the field — the one indicator (board 27)", () => {
    render(
      <ColorInput
        label="Color"
        value="var(--buildrick-design-color-primary)"
        onChange={() => {}}
        composer={fakeComposer}
      />
    );
    const chip = screen.getByRole("button", { name: /Jump to token color-primary/i });
    expect(chip).toHaveTextContent("Primary");
    expect(screen.getByTestId("inspector-field-color")).toContainElement(chip);
    expect(screen.queryByRole("textbox", { name: "Color value" })).toBeNull();
  });

  /* REWRITTEN 2026-09-08 with the change it covers. There is no off-DS chip
     any more: it carried a warning mark beside a hex the field already shows,
     and it cost the control a fifth of its width — measured 127 against the
     160 every profile board fixes (807:8366 draws the swatch and the hex
     INSIDE one 160 frame and no chip). Board 32:2 draws a chip in this slot
     only in the BOUND state (32:78, green), which is the state a chip can say
     something the field cannot: the token's name. */
  it("renders NO chip when the value is a raw hex — the field already shows it", () => {
    const { container } = render(
      <ColorInput
        label="Color"
        value="#FFAA22"
        onChange={() => {}}
        composer={fakeComposer}
      />
    );
    expect(
      screen.queryByRole("button", { name: /Off-design-system value/i })
    ).toBeNull();
    expect(container.querySelector('[aria-label^="Off-design-system value"]')).toBeNull();
    // The hex is still on screen, inside the field, which is the whole point.
    expect(screen.getByDisplayValue("FFAA22")).toBeTruthy();
  });

  it("renders no chip when value is empty", () => {
    render(
      <ColorInput label="Color" value="" onChange={() => {}} composer={fakeComposer} />
    );
    const chipButtons = screen.queryAllByRole("button", {
      name: /Jump to token|Off-design-system value/i,
    });
    expect(chipButtons.length).toBe(0);
  });

  it("clicking a token chip opens Brand ON that token (G3-156)", () => {
    render(
      <ColorInput
        label="Color"
        value="var(--buildrick-design-color-primary)"
        onChange={() => {}}
        composer={fakeComposer}
      />
    );
    const chip = screen.getByRole("button", { name: /Jump to token color-primary/i });
    fireEvent.click(chip);
    expect(mockEmit).toHaveBeenCalledWith(EVENTS.UI_OPEN_DESIGN_PANEL, { tokenId: "color-primary" });
  });

  it("renders no chip for a raw hex even without a composer", () => {
    const { container } = render(
      <ColorInput label="Color" value="#FFAA22" onChange={() => {}} />
    );
    expect(
      screen.queryAllByRole("button", { name: /Off-design-system value/i }).length
    ).toBe(0);
    expect(container.querySelector('[aria-label^="Off-design-system value"]')).toBeNull();
  });

  /* The bound chip still degrades to a non-interactive span with no composer —
     the state DSBindingChip was written for, now its only one. */
  it("renders the bound chip without a click target when composer is absent", () => {
    const { container } = render(
      <ColorInput label="Color" value="var(--buildrick-design-color-primary)" onChange={() => {}} />
    );
    expect(screen.queryAllByRole("button", { name: /Jump to token/i }).length).toBe(0);
    expect(container.querySelector('[aria-label="Bound to token color-primary"]')).toHaveTextContent("Primary");
  });
});

describe("ColorInput · Custom colour (owner decision 2026-09-28)", () => {
  it("picking a custom colour on a bound value writes the raw hex once — the token unlinks in one write", () => {
    const onChange = vi.fn();
    render(
      <ColorInput
        label="Color"
        value="var(--buildrick-design-color-primary)"
        onChange={onChange}
        composer={fakeComposer}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Choose Color color" }));
    fireEvent.click(screen.getByRole("button", { name: "Custom colour" }));
    const hex = screen.getByLabelText("Hex color value") as HTMLInputElement;
    expect(hex.value.toUpperCase()).toBe("#2D6DFF");
    fireEvent.change(hex, { target: { value: "#112233" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("#112233");
  });
});
