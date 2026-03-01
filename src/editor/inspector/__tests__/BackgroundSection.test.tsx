import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BackgroundSection } from "../sections/BackgroundSection";

vi.mock("../shared/Controls", async () => {
  const actual = await vi.importActual<typeof import("../shared/Controls")>("../shared/Controls");
  return {
    ...actual,
    Section: ({ children, preview }: { children: React.ReactNode; preview?: React.ReactNode }) => (
      <div>
        <div data-testid="section-preview">{preview}</div>
        {children}
      </div>
    ),
  };
});

describe("BackgroundSection — preview", () => {
  it("shows color swatch when backgroundColor is set", () => {
    render(<BackgroundSection styles={{ backgroundColor: "#ff0000" }} onChange={vi.fn()} />);
    const swatch = screen.getByTitle("#ff0000");
    expect(swatch).toBeInTheDocument();
  });

  it("shows no preview when no background color", () => {
    render(<BackgroundSection styles={{}} onChange={vi.fn()} />);
    // preview container should be empty
    expect(screen.getByTestId("section-preview").children).toHaveLength(0);
  });
});
