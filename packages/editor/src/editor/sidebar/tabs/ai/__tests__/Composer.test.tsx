import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Composer } from "../Composer";

describe("Composer", () => {
  it("calls onSubmit with text on Enter (no shift)", () => {
    const onSubmit = vi.fn();
    render(
      <Composer
        onSubmit={onSubmit}
        streaming={false}
      />,
    );
    const ta = screen.getByPlaceholderText(/Ask AI/i);
    fireEvent.change(ta, { target: { value: "Hello" } });
    fireEvent.keyDown(ta, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("Hello");
  });

  it("does not submit on shift+Enter (newline)", () => {
    const onSubmit = vi.fn();
    render(
      <Composer
        onSubmit={onSubmit}
        streaming={false}
      />,
    );
    const ta = screen.getByPlaceholderText(/Ask AI/i);
    fireEvent.change(ta, { target: { value: "Hello" } });
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("Plan changes is disabled when text is empty", () => {
    render(
      <Composer
        onSubmit={vi.fn()}
        streaming={false}
      />,
    );
    const sendBtn = screen.getByRole("button", { name: "Plan changes" }) as HTMLButtonElement;
    expect(sendBtn.disabled).toBe(true);
  });

  it("the primary reads 'Plan changes' (board 4418:104454)", () => {
    render(<Composer onSubmit={vi.fn()} streaming={false} />);
    expect(screen.getByRole("button", { name: "Plan changes" })).toHaveTextContent("Plan changes");
  });

  /* Board 4418:104577: while a run is live the field shows only the prompt;
     Stop is the button under the Thinking band (AgentPlan). */
  it("shows no button in the field while streaming", () => {
    render(<Composer onSubmit={vi.fn()} streaming={true} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  /* Board 4418:106919: "Your prompt is still here". AITab remounts the
     composer after a clean run, which is what empties it. */
  it("keeps the prompt in the textarea after submit", () => {
    render(
      <Composer
        onSubmit={vi.fn()}
        streaming={false}
      />,
    );
    const ta = screen.getByPlaceholderText(/Ask AI/i) as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "Hello" } });
    fireEvent.keyDown(ta, { key: "Enter" });
    expect(ta.value).toBe("Hello");
  });
});
