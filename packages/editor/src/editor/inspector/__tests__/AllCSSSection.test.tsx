import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { AllCSSSection } from "../sections/AllCSSSection";

vi.mock("../shared/controls", async () => {
  const actual = await vi.importActual<typeof import("../shared/controls")>("../shared/controls");
  return {
    ...actual,
    Section: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

describe("AllCSSSection", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <AllCSSSection
        selectedElement={{ id: "el-1", type: "div" }}
        composer={null}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });
});
