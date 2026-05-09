/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { SpacingBox } from "../SpacingControls";
import { EVENTS } from "../../../../../shared/constants/events";

const mockEmit = vi.fn();
const fakeComposer = { emit: mockEmit } as unknown as Parameters<typeof SpacingBox>[0]["composer"];

const baseSides = { top: "0px", right: "0px", bottom: "0px", left: "0px" };

beforeEach(() => {
  mockEmit.mockClear();
});

describe("SpacingBox · DSBindingChip integration", () => {
  it("renders a green token chip on the axis bound to a token var", () => {
    render(
      <SpacingBox
        margin={baseSides}
        padding={{ ...baseSides, top: "var(--buildrick-design-spacing-md)" }}
        onMarginChange={() => {}}
        onPaddingChange={() => {}}
        composer={fakeComposer}
      />
    );
    const chip = screen.getByRole("button", { name: /Bound to token spacing-md/i });
    expect(chip).toBeTruthy();
  });

  it("renders no chip when all axes are raw values", () => {
    render(
      <SpacingBox
        margin={baseSides}
        padding={baseSides}
        onMarginChange={() => {}}
        onPaddingChange={() => {}}
        composer={fakeComposer}
      />
    );
    const chips = screen.queryAllByRole("button", { name: /Bound to token/i });
    expect(chips.length).toBe(0);
  });

  it("clicking a token chip emits UI_OPEN_DESIGN_PANEL", () => {
    render(
      <SpacingBox
        margin={{ ...baseSides, left: "var(--buildrick-design-spacing-lg)" }}
        padding={baseSides}
        onMarginChange={() => {}}
        onPaddingChange={() => {}}
        composer={fakeComposer}
      />
    );
    const chip = screen.getByRole("button", { name: /Bound to token spacing-lg/i });
    fireEvent.click(chip);
    expect(mockEmit).toHaveBeenCalledWith(EVENTS.UI_OPEN_DESIGN_PANEL, {});
  });
});
