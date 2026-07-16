/**
 * ConnectionQualityIndicator is currently an ORPHAN (no consumers import it);
 * these tests pin its quality → bars/label/color mapping anyway so the
 * behavior is locked when it gets wired in.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { ConnectionQualityIndicator } from "../ConnectionQualityIndicator";
import type { ConnectionQualityStats } from "../../../shared/types/collaboration";

function makeStats(overrides: Partial<ConnectionQualityStats> = {}): ConnectionQualityStats {
  return { avgLatency: 50, pendingCount: 0, lastAckTime: 0, quality: "good", ...overrides };
}

/** The 3 signal bars are the only divs with an explicit 3px width. */
function getBars(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll("div")).filter((d) => d.style.width === "3px");
}

function filledBars(container: HTMLElement, colorToken: string): HTMLElement[] {
  return getBars(container).filter((d) => d.style.backgroundColor.includes(colorToken));
}

describe("ConnectionQualityIndicator — quality → bars mapping", () => {
  it("renders 3 ascending bars (6/9/12px)", () => {
    const { container } = render(
      <ConnectionQualityIndicator stats={makeStats()} isConnected={true} />,
    );
    const bars = getBars(container);
    expect(bars).toHaveLength(3);
    expect(bars.map((b) => b.style.height)).toEqual(["6px", "9px", "12px"]);
  });

  it("good: engine 'excellent' + low latency fills all 3 bars with success color", () => {
    const { container } = render(
      <ConnectionQualityIndicator
        stats={makeStats({ quality: "excellent", avgLatency: 50 })}
        isConnected={true}
      />,
    );
    expect(filledBars(container, "--buildrick-success")).toHaveLength(3);
    expect(screen.queryByText("Offline")).not.toBeInTheDocument();
  });

  it("good: latency of exactly 100ms still counts as good (boundary)", () => {
    const { container } = render(
      <ConnectionQualityIndicator
        stats={makeStats({ quality: "good", avgLatency: 100 })}
        isConnected={true}
      />,
    );
    expect(filledBars(container, "--buildrick-success")).toHaveLength(3);
  });

  it("fair: latency 101-300ms fills 2 bars with warning color even when engine says excellent", () => {
    // Pins the latency-override-beats-engine-label rule.
    const { container } = render(
      <ConnectionQualityIndicator
        stats={makeStats({ quality: "excellent", avgLatency: 150 })}
        isConnected={true}
      />,
    );
    expect(filledBars(container, "--buildrick-warning")).toHaveLength(2);
    expect(filledBars(container, "--buildrick-success")).toHaveLength(0);
  });

  it("fair: latency of exactly 300ms is fair, not poor (boundary)", () => {
    const { container } = render(
      <ConnectionQualityIndicator
        stats={makeStats({ quality: "good", avgLatency: 300 })}
        isConnected={true}
      />,
    );
    expect(filledBars(container, "--buildrick-warning")).toHaveLength(2);
  });

  it("poor: latency > 300ms fills 1 bar with error color", () => {
    const { container } = render(
      <ConnectionQualityIndicator
        stats={makeStats({ quality: "excellent", avgLatency: 301 })}
        isConnected={true}
      />,
    );
    expect(filledBars(container, "--buildrick-error")).toHaveLength(1);
  });

  it("poor: engine 'poor' label with low latency fills 1 bar", () => {
    const { container } = render(
      <ConnectionQualityIndicator
        stats={makeStats({ quality: "poor", avgLatency: 20 })}
        isConnected={true}
      />,
    );
    expect(filledBars(container, "--buildrick-error")).toHaveLength(1);
  });

  it("disconnected: isConnected=false fills 0 bars and shows the Offline label", () => {
    const { container } = render(
      <ConnectionQualityIndicator stats={makeStats()} isConnected={false} />,
    );
    expect(filledBars(container, "--buildrick-success")).toHaveLength(0);
    expect(filledBars(container, "--buildrick-warning")).toHaveLength(0);
    expect(filledBars(container, "--buildrick-error")).toHaveLength(0);
    // "Offline" appears twice: pill label + tooltip text.
    expect(screen.getAllByText("Offline")).toHaveLength(2);
  });

  it("disconnected: engine quality 'disconnected' while connected shows 0 bars + Reconnecting tooltip", () => {
    const { container } = render(
      <ConnectionQualityIndicator
        stats={makeStats({ quality: "disconnected" })}
        isConnected={true}
      />,
    );
    expect(filledBars(container, "--buildrick-error")).toHaveLength(0);
    expect(screen.getByText("Reconnecting...")).toBeInTheDocument();
    // Offline pill label still renders for the disconnected display quality.
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });
});

describe("ConnectionQualityIndicator — tooltip copy", () => {
  it("shows latency in the connected tooltip", () => {
    render(
      <ConnectionQualityIndicator
        stats={makeStats({ avgLatency: 42 })}
        isConnected={true}
      />,
    );
    expect(screen.getByText("Connected · 42ms")).toBeInTheDocument();
  });

  it("appends pending count when ops are pending ACK", () => {
    render(
      <ConnectionQualityIndicator
        stats={makeStats({ avgLatency: 42, pendingCount: 3 })}
        isConnected={true}
      />,
    );
    expect(screen.getByText("Connected · 42ms · 3 pending")).toBeInTheDocument();
  });

  it("shows plain Offline tooltip when not connected", () => {
    render(<ConnectionQualityIndicator stats={makeStats()} isConnected={false} />);
    expect(screen.getAllByText("Offline").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Connected ·/)).not.toBeInTheDocument();
  });
});
