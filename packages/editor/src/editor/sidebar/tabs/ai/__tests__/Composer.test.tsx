import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Composer } from "../Composer";

describe("Composer", () => {
  it("calls onSubmit with text on Enter (no shift)", () => {
    const onSubmit = vi.fn();
    render(
      <Composer
        model="claude-sonnet-4-6"
        onModelChange={vi.fn()}
        onSubmit={onSubmit}
        onStop={vi.fn()}
        streaming={false}
      />,
    );
    const ta = screen.getByPlaceholderText(/Ask Claude/i);
    fireEvent.change(ta, { target: { value: "Hello" } });
    fireEvent.keyDown(ta, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("Hello");
  });

  it("does not submit on shift+Enter (newline)", () => {
    const onSubmit = vi.fn();
    render(
      <Composer
        model="claude-sonnet-4-6"
        onModelChange={vi.fn()}
        onSubmit={onSubmit}
        onStop={vi.fn()}
        streaming={false}
      />,
    );
    const ta = screen.getByPlaceholderText(/Ask Claude/i);
    fireEvent.change(ta, { target: { value: "Hello" } });
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("send button disabled when text is empty", () => {
    render(
      <Composer
        model="claude-sonnet-4-6"
        onModelChange={vi.fn()}
        onSubmit={vi.fn()}
        onStop={vi.fn()}
        streaming={false}
      />,
    );
    const sendBtn = screen.getByLabelText(/send/i) as HTMLButtonElement;
    expect(sendBtn.disabled).toBe(true);
  });

  it("send button flips to stop while streaming and calls onStop", () => {
    const onStop = vi.fn();
    render(
      <Composer
        model="claude-sonnet-4-6"
        onModelChange={vi.fn()}
        onSubmit={vi.fn()}
        onStop={onStop}
        streaming={true}
      />,
    );
    fireEvent.click(screen.getByLabelText(/stop/i));
    expect(onStop).toHaveBeenCalled();
  });

  it("clears textarea after submit", () => {
    render(
      <Composer
        model="claude-sonnet-4-6"
        onModelChange={vi.fn()}
        onSubmit={vi.fn()}
        onStop={vi.fn()}
        streaming={false}
      />,
    );
    const ta = screen.getByPlaceholderText(/Ask Claude/i) as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "Hello" } });
    fireEvent.keyDown(ta, { key: "Enter" });
    expect(ta.value).toBe("");
  });
});
