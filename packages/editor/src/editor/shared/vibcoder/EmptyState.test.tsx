/**
 * EmptyState tests — verify markup contracts.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  EmptyState,
  EmptyStateArt,
  EmptyStateSpot,
  EmptyStateTitle,
  EmptyStateDesc,
  EmptyStateActions,
  EmptyStateCode,
} from "./EmptyState";

describe("EmptyState — root + size variants", () => {
  it("applies bd-empty class", () => {
    render(<EmptyState data-testid="es">x</EmptyState>);
    expect(screen.getByTestId("es")).toHaveClass("bd-empty");
  });

  it("merges caller className", () => {
    render(<EmptyState data-testid="es" className="extra">x</EmptyState>);
    expect(screen.getByTestId("es")).toHaveClass("bd-empty");
    expect(screen.getByTestId("es")).toHaveClass("extra");
  });

  it("applies bd-empty--compact when size='compact'", () => {
    render(<EmptyState size="compact" data-testid="es">x</EmptyState>);
    expect(screen.getByTestId("es")).toHaveClass("bd-empty--compact");
  });

  it("applies bd-empty--tall when size='tall'", () => {
    render(<EmptyState size="tall" data-testid="es">x</EmptyState>);
    expect(screen.getByTestId("es")).toHaveClass("bd-empty--tall");
  });

  it("omits size modifier when size unset", () => {
    render(<EmptyState data-testid="es">x</EmptyState>);
    const es = screen.getByTestId("es");
    expect(es).not.toHaveClass("bd-empty--compact");
    expect(es).not.toHaveClass("bd-empty--tall");
  });
});

describe("EmptyStateSpot — tone variants", () => {
  it("applies bd-empty__spot class", () => {
    render(<EmptyStateSpot data-testid="s">x</EmptyStateSpot>);
    expect(screen.getByTestId("s")).toHaveClass("bd-empty__spot");
  });

  it("applies tone modifier classes", () => {
    const tones = ["accent", "success", "warning", "error"] as const;
    for (const tone of tones) {
      const { unmount } = render(
        <EmptyStateSpot tone={tone} data-testid={`spot-${tone}`}>
          x
        </EmptyStateSpot>,
      );
      expect(screen.getByTestId(`spot-${tone}`)).toHaveClass(
        `bd-empty__spot--${tone}`,
      );
      unmount();
    }
  });

  it("omits tone modifier when tone unset", () => {
    render(<EmptyStateSpot data-testid="s">x</EmptyStateSpot>);
    const s = screen.getByTestId("s");
    expect(s).not.toHaveClass("bd-empty__spot--accent");
    expect(s).not.toHaveClass("bd-empty__spot--success");
    expect(s).not.toHaveClass("bd-empty__spot--warning");
    expect(s).not.toHaveClass("bd-empty__spot--error");
  });
});

describe("EmptyState — other siblings", () => {
  it("EmptyStateArt applies bd-empty__art", () => {
    render(<EmptyStateArt data-testid="a">x</EmptyStateArt>);
    expect(screen.getByTestId("a")).toHaveClass("bd-empty__art");
  });

  it("EmptyStateTitle renders <h3> with bd-empty__title", () => {
    render(<EmptyStateTitle data-testid="t">No items</EmptyStateTitle>);
    const t = screen.getByTestId("t");
    expect(t.tagName).toBe("H3");
    expect(t).toHaveClass("bd-empty__title");
  });

  it("EmptyStateDesc renders <p> with bd-empty__desc", () => {
    render(<EmptyStateDesc data-testid="d">x</EmptyStateDesc>);
    const d = screen.getByTestId("d");
    expect(d.tagName).toBe("P");
    expect(d).toHaveClass("bd-empty__desc");
  });

  it("EmptyStateActions applies bd-empty__actions", () => {
    render(<EmptyStateActions data-testid="ac">x</EmptyStateActions>);
    expect(screen.getByTestId("ac")).toHaveClass("bd-empty__actions");
  });

  it("EmptyStateCode applies bd-empty__code on a span", () => {
    render(<EmptyStateCode data-testid="c">404</EmptyStateCode>);
    const c = screen.getByTestId("c");
    expect(c.tagName).toBe("SPAN");
    expect(c).toHaveClass("bd-empty__code");
  });
});

describe("EmptyState — composition smoke", () => {
  it("composes all 7 siblings together", () => {
    render(
      <EmptyState size="tall" data-testid="es">
        <EmptyStateArt data-testid="art">
          <EmptyStateSpot tone="accent" data-testid="spot">
            X
          </EmptyStateSpot>
        </EmptyStateArt>
        <EmptyStateTitle data-testid="title">No pages yet</EmptyStateTitle>
        <EmptyStateDesc data-testid="desc">Create one.</EmptyStateDesc>
        <EmptyStateActions data-testid="actions">
          <button>+ New page</button>
        </EmptyStateActions>
        <EmptyStateCode data-testid="code">E-101</EmptyStateCode>
      </EmptyState>,
    );
    expect(screen.getByTestId("es")).toHaveClass("bd-empty--tall");
    expect(screen.getByTestId("art")).toHaveClass("bd-empty__art");
    expect(screen.getByTestId("spot")).toHaveClass("bd-empty__spot--accent");
    expect(screen.getByTestId("title")).toHaveClass("bd-empty__title");
    expect(screen.getByTestId("desc")).toHaveClass("bd-empty__desc");
    expect(screen.getByTestId("actions")).toHaveClass("bd-empty__actions");
    expect(screen.getByTestId("code")).toHaveClass("bd-empty__code");
  });
});
