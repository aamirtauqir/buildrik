import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { EffectsSection } from "../sections/EffectsSection";

vi.mock("../shared/controls", async () => {
  const actual = await vi.importActual<typeof import("../shared/controls")>("../shared/controls");
  return {
    ...actual,
    Section: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

describe("EffectsSection", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <EffectsSection styles={{}} onChange={vi.fn()} />
    );
    expect(container.firstChild).toBeTruthy();
  });
});
