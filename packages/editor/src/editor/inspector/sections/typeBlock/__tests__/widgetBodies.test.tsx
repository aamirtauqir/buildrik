// @vitest-environment jsdom
/**
 * Widget type blocks — Countdown (board 11), Progress (board 12), Accordion
 * (board 13), on a real Composer.
 * @license BSD-3-Clause
 */
import { fireEvent, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { parseEndsAt } from "../bodies/widgetBodies";
import { renderBlock } from "./bodyHarness";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

const labels = (c: HTMLElement) => Array.from(c.querySelectorAll("label")).map((l) => l.textContent?.trim());
const select = (label: string) => screen.getByLabelText(label) as HTMLSelectElement;

describe("Countdown — board 11", () => {
  it("Ends at, time-zone hint, When done, Message — in board order", () => {
    const { container } = renderBlock({ id: "c", type: "countdown", classes: ["buildrick-countdown"] });
    expect(labels(container)).toEqual(["Ends at", "When done", "Message"]);
    expect(screen.getByTestId("inspector-countdown-zone")).toHaveTextContent("Uses the visitor’s time zone.");
    expect(select("When done").value).toBe("message");
  });

  it("Ends at stores a wall-clock time only once it is one", () => {
    const { el } = renderBlock({ id: "c", type: "countdown" });
    const field = screen.getByPlaceholderText("2026-12-31 23:59");
    fireEvent.change(field, { target: { value: "2026-12-3" } });
    expect(el().getAttribute("data-countdown-end")).toBeUndefined();
    fireEvent.change(field, { target: { value: "2026-12-31 23:59" } });
    expect(el().getAttribute("data-countdown-end")).toBe("2026-12-31T23:59");
    expect(parseEndsAt("2026-02-30 10:00")).toBeNull();
    expect(parseEndsAt("2026-12-31T23:59")).toBe("2026-12-31T23:59");
  });

  it("When done = Hide drops the Message row; Message writes its attribute", () => {
    const { el, container } = renderBlock({ id: "c", type: "countdown" });
    fireEvent.change(screen.getByPlaceholderText("We are open!"), { target: { value: "Doors open" } });
    expect(el().getAttribute("data-countdown-message")).toBe("Doors open");
    fireEvent.change(select("When done"), { target: { value: "hide" } });
    expect(el().getAttribute("data-countdown-done")).toBe("hide");
    expect(labels(container)).toEqual(["Ends at", "When done"]);
  });
});

describe("Progress — board 12", () => {
  const progress = {
    id: "pr",
    type: "progress" as const,
    children: [
      { id: "bar", type: "container" as const, tagName: "progress", attributes: { value: "93", max: "100" }, children: [] },
      { id: "lbl", type: "container" as const, tagName: "div", classes: ["pb-circle"], children: [{ id: "t", type: "text" as const, tagName: "span", content: "93%", children: [] }] },
    ],
  };

  it("Value / Maximum drive the bar and the label; one Undo", () => {
    const { composer, container, undo } = renderBlock(progress);
    expect(labels(container)).toEqual(["Value", "Maximum", "Show label"]);
    expect((screen.getByLabelText("Value") as HTMLInputElement).value).toBe("93");
    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "65" } });
    const bar = composer.elements.getElement("bar")!;
    expect(bar.getAttribute("value")).toBe("65");
    expect(composer.elements.getElement("t")!.getContent()).toBe("65%");
    fireEvent.change(screen.getByLabelText("Maximum"), { target: { value: "130" } });
    expect(bar.getAttribute("max")).toBe("130");
    expect(composer.elements.getElement("t")!.getContent()).toBe("50%");
    undo();
    expect(composer.elements.getElement("bar")!.getAttribute("max")).toBe("100");
  });

  it("Show label hides / shows the label", () => {
    const { composer } = renderBlock(progress);
    const box = screen.getByRole("checkbox", { name: "Show label" });
    expect(box).toBeChecked();
    fireEvent.click(box);
    expect(composer.elements.getElement("lbl")!.getAttribute("hidden")).toBe("");
    expect(screen.getByRole("checkbox", { name: "Show label" })).not.toBeChecked();
  });

  it("a progress saved before the bar existed gets one on first edit", () => {
    const { el } = renderBlock({ id: "old", type: "progress", children: [] });
    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "40" } });
    const bar = el().getChildren()[0];
    expect(bar.getTagName()).toBe("progress");
    expect(bar.getAttribute("value")).toBe("40");
    expect(bar.getAttribute("max")).toBe("100");
  });
});

describe("Accordion — board 13", () => {
  const item = (id: string, title: string, state: string) => ({
    id,
    type: "container" as const,
    attributes: { class: "accordion-item", "data-accordion-state": state },
    children: [
      { id: `${id}-h`, type: "button" as const, tagName: "button", children: [{ id: `${id}-t`, type: "text" as const, tagName: "span", content: title, children: [] }] },
      { id: `${id}-c`, type: "container" as const, children: [] },
    ],
  });
  const accordion = (allow: string) => ({
    id: "acc",
    type: "accordion" as const,
    attributes: { class: "accordion", "data-allow-multiple": allow },
    children: [item("i1", "Reservations", "open"), item("i2", "Dietary needs", "closed"), item("i3", "Parking", "closed")],
  });
  const state = (c: ReturnType<typeof renderBlock>["composer"], id: string) => c.elements.getElement(id)!.getAttribute("data-accordion-state");

  it("one Open / Closed row per item, titled by the item, then Allow several", () => {
    const { container } = renderBlock(accordion("false"));
    expect(labels(container)).toEqual(["1 · Reservations", "2 · Dietary needs", "3 · Parking", "Allow several open at once"]);
    expect(select("1 · Reservations").value).toBe("open");
    expect(select("2 · Dietary needs").value).toBe("closed");
    expect(screen.getByRole("checkbox", { name: "Allow several open at once" })).not.toBeChecked();
  });

  it("one at a time: opening an item closes the others, in one Undo", () => {
    const { composer, undo } = renderBlock(accordion("false"));
    fireEvent.change(select("3 · Parking"), { target: { value: "open" } });
    expect([state(composer, "i1"), state(composer, "i2"), state(composer, "i3")]).toEqual(["closed", "closed", "open"]);
    undo();
    expect([state(composer, "i1"), state(composer, "i3")]).toEqual(["open", "closed"]);
  });

  it("several at once: items open independently; turning it off keeps the first open one", () => {
    const { composer, el } = renderBlock(accordion("true"));
    fireEvent.change(select("2 · Dietary needs"), { target: { value: "open" } });
    expect([state(composer, "i1"), state(composer, "i2")]).toEqual(["open", "open"]);
    fireEvent.click(screen.getByRole("checkbox", { name: "Allow several open at once" }));
    expect(el().getAttribute("data-allow-multiple")).toBe("false");
    expect([state(composer, "i1"), state(composer, "i2"), state(composer, "i3")]).toEqual(["open", "closed", "closed"]);
  });
});
