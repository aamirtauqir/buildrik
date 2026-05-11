/**
 * Unification spec §550 — UnifiedEditorFlagProvider + useUnifiedEditorFlag.
 * Provider passes boolean through context; hook returns false when no provider.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UnifiedEditorFlagProvider } from "../UnifiedEditorFlagProvider";
import { useUnifiedEditorFlag } from "../unified-flag";

function Probe() {
  return <span data-testid="flag">{String(useUnifiedEditorFlag())}</span>;
}

describe("UnifiedEditorFlagProvider", () => {
  it("propagates value=true through context", () => {
    render(
      <UnifiedEditorFlagProvider value={true}>
        <Probe />
      </UnifiedEditorFlagProvider>,
    );
    expect(screen.getByTestId("flag").textContent).toBe("true");
  });

  it("propagates value=false through context", () => {
    render(
      <UnifiedEditorFlagProvider value={false}>
        <Probe />
      </UnifiedEditorFlagProvider>,
    );
    expect(screen.getByTestId("flag").textContent).toBe("false");
  });

  it("useUnifiedEditorFlag returns false outside any provider (no throw)", () => {
    render(<Probe />);
    expect(screen.getByTestId("flag").textContent).toBe("false");
  });

  it("provider swaps re-render children with new value", () => {
    const { rerender } = render(
      <UnifiedEditorFlagProvider value={false}>
        <Probe />
      </UnifiedEditorFlagProvider>,
    );
    expect(screen.getByTestId("flag").textContent).toBe("false");
    rerender(
      <UnifiedEditorFlagProvider value={true}>
        <Probe />
      </UnifiedEditorFlagProvider>,
    );
    expect(screen.getByTestId("flag").textContent).toBe("true");
  });
});
