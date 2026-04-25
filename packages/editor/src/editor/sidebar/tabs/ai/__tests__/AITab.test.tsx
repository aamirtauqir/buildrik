import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
