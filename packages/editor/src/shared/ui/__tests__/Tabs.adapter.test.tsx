/**
 * Phase 4 contract tests — verify Tabs adapter shim correctly bridges
 * the legacy data-driven `tabs={[...]}` API onto the vibcoder Tabs/Tab
 * composition.
 *
 * Strategy: bridge.
 *   tabs (Tab[]) → <Tab id={t.id}>{t.label}</Tab> children of vibcoder Tabs.
 *   activeTab → vibcoder value (also synced into internal state).
 *   onChange → vibcoder onValueChange.
 *   variant/size/fullWidth → marker classNames on vibcoder Tabs root.
 *   active tab content → rendered below Tabs in `.bd-tabs__panel`.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs } from "../Tabs";

const ITEMS = [
  { id: "a", label: "Alpha", content: <div data-testid="content-a">A</div> },
  { id: "b", label: "Beta", content: <div data-testid="content-b">B</div> },
  { id: "c", label: "Gamma", disabled: true, content: <div>G</div> },
];

describe("Tabs adapter shim (bridge to vibcoder)", () => {
  it("renders the vibcoder bd-tabs root and trigger row", () => {
    const { container } = render(<Tabs tabs={ITEMS} activeTab="a" />);
    expect(container.querySelector(".bd-tabs")).not.toBeNull();
  });

  it("renders one bd-tabs__tab per item", () => {
    const { container } = render(<Tabs tabs={ITEMS} activeTab="a" />);
    expect(container.querySelectorAll(".bd-tabs__tab").length).toBe(3);
  });

  it("marks the activeTab with aria-selected=true and is-active", () => {
    const { container } = render(<Tabs tabs={ITEMS} activeTab="b" />);
    const tabs = container.querySelectorAll(".bd-tabs__tab");
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].className).toContain("is-active");
    expect(tabs[0].getAttribute("aria-selected")).toBe("false");
  });

  it("renders the active tab's content in bd-tabs__panel", () => {
    render(<Tabs tabs={ITEMS} activeTab="b" />);
    expect(screen.getByTestId("content-b")).not.toBeNull();
    expect(screen.queryByTestId("content-a")).toBeNull();
  });

  it("clicking an inactive tab fires onChange with that id", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Tabs tabs={ITEMS} activeTab="a" onChange={onChange} />,
    );
    const beta = container.querySelectorAll(".bd-tabs__tab")[1] as HTMLElement;
    fireEvent.click(beta);
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("clicking switches active panel content (internal state)", () => {
    const { container } = render(<Tabs tabs={ITEMS} activeTab="a" />);
    expect(screen.getByTestId("content-a")).not.toBeNull();
    const beta = container.querySelectorAll(".bd-tabs__tab")[1] as HTMLElement;
    fireEvent.click(beta);
    expect(screen.getByTestId("content-b")).not.toBeNull();
  });

  it("disabled tab forwards disabled attribute", () => {
    const { container } = render(<Tabs tabs={ITEMS} activeTab="a" />);
    const gamma = container.querySelectorAll(".bd-tabs__tab")[2] as HTMLButtonElement;
    expect(gamma.disabled).toBe(true);
  });

  it("variant 'pills' adds bd-tabs--pills marker class", () => {
    const { container } = render(
      <Tabs tabs={ITEMS} activeTab="a" variant="pills" />,
    );
    expect(container.querySelector(".bd-tabs--pills")).not.toBeNull();
  });

  it("variant 'default' emits no variant marker", () => {
    const { container } = render(<Tabs tabs={ITEMS} activeTab="a" />);
    const root = container.querySelector(".bd-tabs") as HTMLElement;
    expect(root.className).not.toMatch(/bd-tabs--(pills|underline|sm|lg|full)/);
  });

  it("size 'lg' adds bd-tabs--lg marker class", () => {
    const { container } = render(
      <Tabs tabs={ITEMS} activeTab="a" size="lg" />,
    );
    expect(container.querySelector(".bd-tabs--lg")).not.toBeNull();
  });

  it("fullWidth=true adds bd-tabs--full marker class", () => {
    const { container } = render(
      <Tabs tabs={ITEMS} activeTab="a" fullWidth />,
    );
    expect(container.querySelector(".bd-tabs--full")).not.toBeNull();
  });

  it("falls back to first tab id when activeTab is unset", () => {
    const { container } = render(<Tabs tabs={ITEMS} />);
    const tabs = container.querySelectorAll(".bd-tabs__tab");
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
  });

  it("syncs to externally changed activeTab", () => {
    const { rerender, container } = render(
      <Tabs tabs={ITEMS} activeTab="a" />,
    );
    rerender(<Tabs tabs={ITEMS} activeTab="b" />);
    const tabs = container.querySelectorAll(".bd-tabs__tab");
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
  });

  it("does not render bd-tabs__panel when active tab has no content", () => {
    const noContent = [{ id: "x", label: "X" }];
    const { container } = render(<Tabs tabs={noContent} activeTab="x" />);
    expect(container.querySelector(".bd-tabs__panel")).toBeNull();
  });
});
