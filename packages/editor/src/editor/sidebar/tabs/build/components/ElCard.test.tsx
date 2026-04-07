import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ElCard } from "./ElCard";
import type { FlatElEntry } from "../catalog/types";

const baseEl: FlatElEntry = {
  name: "Button",
  blockId: "button",
  description: "Clickable action button",
  tags: [],
  iconHtml: "",
  catId: "basic",
  catName: "Text & Buttons",
};

const disabledEl: FlatElEntry = {
  ...baseEl,
  name: "Custom Code",
  blockId: "text",
  disabled: true,
  description: "Raw HTML/CSS/JS code block",
};

describe("ElCard — disabled state", () => {
  it("disabled card does not call onClick when clicked", async () => {
    const onClick = vi.fn();
    const onDragStart = vi.fn();
    const onToggleFav = vi.fn();

    render(
      <ElCard
        el={disabledEl}
        isFav={false}
        onDragStart={onDragStart}
        onClick={onClick}
        onToggleFav={onToggleFav}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /Custom Code/i }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("disabled card shows Coming Soon in title", () => {
    render(
      <ElCard
        el={disabledEl}
        isFav={false}
        onDragStart={vi.fn()}
        onClick={vi.fn()}
        onToggleFav={vi.fn()}
      />
    );

    const card = screen.getByRole("button", { name: /Custom Code/i });
    expect(card.title).toContain("Coming Soon");
  });

  it("enabled card calls onClick when clicked", async () => {
    const onClick = vi.fn();

    render(
      <ElCard
        el={baseEl}
        isFav={false}
        onDragStart={vi.fn()}
        onClick={onClick}
        onToggleFav={vi.fn()}
      />
    );

    // Use description text to distinguish card from the fav star button
    await userEvent.click(screen.getByRole("button", { name: /Clickable action button/i }));
    expect(onClick).toHaveBeenCalledWith(baseEl);
  });
});
