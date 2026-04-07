import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AISuggestions } from "../AISuggestions";

describe("AISuggestions", () => {
  it("renders when enabled (default)", () => {
    render(<AISuggestions />);
    expect(screen.getByText("AI can help")).toBeTruthy();
  });

  it("renders nothing when enabled=false", () => {
    const { container } = render(<AISuggestions enabled={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing after dismiss", () => {
    render(<AISuggestions />);
    fireEvent.click(screen.getByLabelText("Dismiss AI suggestions"));
    expect(screen.queryByText("AI can help")).toBeNull();
  });

  it("fires onSuggestionClick with 'generate-section'", () => {
    const onClick = vi.fn();
    render(<AISuggestions onSuggestionClick={onClick} />);
    fireEvent.click(screen.getByText("Generate a section"));
    expect(onClick).toHaveBeenCalledWith("generate-section");
  });

  it("fires onSuggestionClick with 'improve-layout'", () => {
    const onClick = vi.fn();
    render(<AISuggestions onSuggestionClick={onClick} />);
    fireEvent.click(screen.getByText("Improve layout"));
    expect(onClick).toHaveBeenCalledWith("improve-layout");
  });

  it("shows two suggestion cards", () => {
    render(<AISuggestions />);
    expect(screen.getByText("Generate a section")).toBeTruthy();
    expect(screen.getByText("Improve layout")).toBeTruthy();
  });
});
