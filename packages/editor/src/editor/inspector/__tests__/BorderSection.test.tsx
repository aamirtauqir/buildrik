import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { BorderSection } from "../sections/BorderSection";

vi.mock("../shared/controls", async () => {
  const actual = await vi.importActual<typeof import("../shared/controls")>("../shared/controls");
  return {
    ...actual,
    Section: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

describe("BorderSection", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <BorderSection styles={{}} onChange={vi.fn()} onBatchChange={vi.fn()} />
    );
    expect(container.firstChild).toBeTruthy();
  });
});
