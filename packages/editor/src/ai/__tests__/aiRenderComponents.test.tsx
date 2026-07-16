/**
 * GeneratedResult + LoadingIndicator — presentational contract.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { GeneratedResult } from "../GeneratedResult";
import { LoadingIndicator } from "../LoadingIndicator";

afterEach(cleanup);

describe("LoadingIndicator", () => {
  it("shows the default thinking message", () => {
    render(<LoadingIndicator />);
    expect(screen.getByText("AI is thinking...")).toBeInTheDocument();
  });

  it("shows a custom message", () => {
    render(<LoadingIndicator message="Drafting layout…" />);
    expect(screen.getByText("Drafting layout…")).toBeInTheDocument();
    expect(screen.queryByText("AI is thinking...")).not.toBeInTheDocument();
  });
});

describe("GeneratedResult", () => {
  it("text mode: renders the result as pre-wrapped text with both action buttons wired", () => {
    const onInsert = vi.fn();
    const onRegenerate = vi.fn();
    render(
      <GeneratedResult
        result={"Line one\nLine two"}
        isImage={false}
        onInsert={onInsert}
        onRegenerate={onRegenerate}
      />
    );
    expect(screen.getByText("Generated Result")).toBeInTheDocument();
    expect(screen.getByText(/Line one/)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Insert to Editor" }));
    expect(onInsert).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it("image mode: renders an <img> whose src is the result", () => {
    render(
      <GeneratedResult
        result="https://example.com/generated.png"
        isImage
        onInsert={vi.fn()}
        onRegenerate={vi.fn()}
      />
    );
    const img = screen.getByRole("img", { name: "AI Generated" });
    expect(img).toHaveAttribute("src", "https://example.com/generated.png");
  });
});
