import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";

vi.mock("@/services/ai/subscriptionClient", () => ({
  getAiSubscriptionClient: () => ({
    ai: {
      streamPrompt: { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) },
    },
  }),
}));

import { AITab } from "../AITab";

describe("AITab skeleton", () => {
  it("renders the empty thread message when no messages exist", () => {
    render(<AITab composer={null} isPinned={false} onPinToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/Try a quick action or type a prompt to start/i)).toBeInTheDocument();
  });

  it("renders a composer textarea", () => {
    render(<AITab composer={null} isPinned={false} onPinToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Ask Claude/i)).toBeInTheDocument();
  });
});

describe("AITab — scope + composer wiring", () => {
  it("submitting a prompt locks the scope chip", () => {
    const { rerender, container } = render(
      <AITab composer={null} isPinned={false} onPinToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />,
    );
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "Hello" } });
    fireEvent.keyDown(ta, { key: "Enter" });
    rerender(<AITab composer={null} isPinned={false} onPinToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />);
    expect(container.querySelector(".bd-ai-scope-lock")).toBeInTheDocument();
  });
});
