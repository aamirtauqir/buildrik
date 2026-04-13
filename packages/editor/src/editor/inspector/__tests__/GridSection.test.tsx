import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { GridSection } from "../sections/GridSection";

vi.mock("../shared/controls", async () => {
  const actual = await vi.importActual<typeof import("../shared/controls")>("../shared/controls");
  return {
    ...actual,
    Section: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

describe("GridSection", () => {
  it("renders nothing when not grid container or item", () => {
    const { container } = render(
      <GridSection
        styles={{}}
        onChange={vi.fn()}
        isGridContainer={false}
        isGridItem={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders without crashing as grid container", () => {
    const { container } = render(
      <GridSection
        styles={{ display: "grid" }}
        onChange={vi.fn()}
        isGridContainer={true}
        isGridItem={false}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });
});
