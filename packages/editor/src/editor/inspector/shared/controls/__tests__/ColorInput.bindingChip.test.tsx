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
  it("renders green token chip when value is a token var", () => {
    render(
      <ColorInput
        label="Color"
        value="var(--buildrick-design-color-primary)"
        onChange={() => {}}
        composer={fakeComposer}
      />
    );
    const chip = screen.getByRole("button", { name: /Bound to token color-primary/i });
    expect(chip).toBeTruthy();
  });

  it("renders yellow off-DS chip when value is a raw hex", () => {
    render(
      <ColorInput
        label="Color"
        value="#FFAA22"
        onChange={() => {}}
        composer={fakeComposer}
      />
    );
    const chip = screen.getByRole("button", { name: /Off design system #FFAA22/i });
    expect(chip).toBeTruthy();
  });

  it("renders no chip when value is empty", () => {
    render(
      <ColorInput label="Color" value="" onChange={() => {}} composer={fakeComposer} />
    );
    const chipButtons = screen.queryAllByRole("button", {
      name: /Bound to token|Off design system/i,
    });
    expect(chipButtons.length).toBe(0);
  });

  it("clicking a token chip emits UI_OPEN_DESIGN_PANEL", () => {
    render(
      <ColorInput
        label="Color"
        value="var(--buildrick-design-color-primary)"
        onChange={() => {}}
        composer={fakeComposer}
      />
    );
    const chip = screen.getByRole("button", { name: /Bound to token color-primary/i });
    fireEvent.click(chip);
    expect(mockEmit).toHaveBeenCalledWith(EVENTS.UI_OPEN_DESIGN_PANEL, {});
  });

  it("renders the chip without click when composer prop is absent", () => {
    const { container } = render(
      <ColorInput label="Color" value="#FFAA22" onChange={() => {}} />
    );
    // DSBindingChip degrades to a non-interactive span when onClick is missing.
    // Confirm no button-role chip is rendered for this value.
    const chipButtons = screen.queryAllByRole("button", { name: /Off design system/i });
    expect(chipButtons.length).toBe(0);
    // But the chip should still render as a span with the appropriate aria-label.
    const chipSpan = container.querySelector(
      'span[aria-label="Off design system #FFAA22"]'
    );
    expect(chipSpan).toBeTruthy();
  });
});
