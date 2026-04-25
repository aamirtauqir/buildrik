import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModelPicker } from "../ModelPicker";

describe("ModelPicker", () => {
  it("renders the current model label", () => {
    render(<ModelPicker model="claude-sonnet-4-6" onChange={vi.fn()} />);
    expect(screen.getByText(/sonnet-4-6/i)).toBeInTheDocument();
  });

  it("opens menu on click and lists all 4 models", () => {
    render(<ModelPicker model="claude-sonnet-4-6" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /model/i }));
    expect(screen.getByRole("menuitem", { name: /opus-4-7/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /sonnet-4-6/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /haiku-4-5/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /gpt-4o-mini/i })).toBeInTheDocument();
  });

  it("calls onChange with the picked model and closes menu", () => {
    const onChange = vi.fn();
    render(<ModelPicker model="claude-sonnet-4-6" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /model/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /opus-4-7/i }));
    expect(onChange).toHaveBeenCalledWith("claude-opus-4-7");
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
  });
});
