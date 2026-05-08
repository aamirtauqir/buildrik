import { render, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { StarterGalleryModal } from "../StarterGalleryModal";
import { STARTER_DS_REGISTRY } from "../../starters";

function renderModal(props?: Partial<React.ComponentProps<typeof StarterGalleryModal>>) {
  const onOpenChange = vi.fn();
  const onApply = vi.fn();
  const onSkip = vi.fn();
  const result = render(
    <StarterGalleryModal
      open
      onOpenChange={onOpenChange}
      onApply={onApply}
      onSkip={onSkip}
      {...props}
    />
  );
  return { ...result, onOpenChange, onApply, onSkip };
}

describe("StarterGalleryModal", () => {
  it("renders all 6 starter cards from STARTER_DS_REGISTRY", () => {
    const { getAllByRole } = renderModal();
    const cards = getAllByRole("radio");
    expect(cards).toHaveLength(STARTER_DS_REGISTRY.length);
  });

  it("first starter is selected by default (aria-checked=true)", () => {
    const { getAllByRole } = renderModal();
    const cards = getAllByRole("radio");
    expect(cards[0].getAttribute("aria-checked")).toBe("true");
    expect(cards[1].getAttribute("aria-checked")).toBe("false");
  });

  it("clicking a card selects it; aria-checked flips on the new card", () => {
    const { getAllByRole } = renderModal();
    const cards = getAllByRole("radio");
    act(() => {
      fireEvent.click(cards[2]);
    });
    expect(cards[2].getAttribute("aria-checked")).toBe("true");
    expect(cards[0].getAttribute("aria-checked")).toBe("false");
  });

  it("Apply button calls onApply with selected starter id + closes modal", () => {
    const { getByText, onApply, onOpenChange, getAllByRole } = renderModal();
    const cards = getAllByRole("radio");
    act(() => {
      fireEvent.click(cards[1]); // pick second starter
    });

    const applyBtn = getByText(new RegExp(`Apply ${STARTER_DS_REGISTRY[1].name}`));
    act(() => {
      fireEvent.click(applyBtn);
    });

    expect(onApply).toHaveBeenCalledWith(STARTER_DS_REGISTRY[1].id);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Skip button calls onSkip + closes modal", () => {
    const { getByText, onSkip, onOpenChange, onApply } = renderModal();
    act(() => {
      fireEvent.click(getByText("Skip"));
    });
    expect(onSkip).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onApply).not.toHaveBeenCalled();
  });

  it("renders nothing when open=false", () => {
    const { container } = render(
      <StarterGalleryModal
        open={false}
        onOpenChange={vi.fn()}
        onApply={vi.fn()}
      />
    );
    expect(container.querySelector('[role="radio"]')).toBeNull();
  });
});
