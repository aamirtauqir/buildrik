/**
 * Classes' "+ Add class" (7316:83357) — adds a name to the canvas selection.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { ClassAddDialog, classNameError } from "../ClassAddDialog";

const el = () => {
  const classes: string[] = [];
  return { classes, getClasses: () => classes, addClass: vi.fn((c: string) => classes.push(c)) };
};
const composerWith = (selected: ReturnType<typeof el>[]) =>
  ({
    selection: { getAllSelected: () => selected },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    history: { beginTransaction: vi.fn(), endTransaction: vi.fn() },
  }) as never;

describe("ClassAddDialog", () => {
  it("adds the class to every selected element", () => {
    const a = el();
    const b = el();
    const onClose = vi.fn();
    render(<ClassAddDialog open composer={composerWith([a, b])} onClose={onClose} />);
    expect(screen.getByTestId("brand-class-add-target").textContent).toMatch(/2 selected elements/);
    fireEvent.change(screen.getByTestId("brand-class-add-input"), { target: { value: ".btn-primary" } });
    fireEvent.click(screen.getByTestId("brand-class-add-confirm"));
    expect(a.classes).toEqual(["btn-primary"]);
    expect(b.classes).toEqual(["btn-primary"]);
    expect(onClose).toHaveBeenCalled();
  });

  it("with nothing selected says so and cannot add", () => {
    render(<ClassAddDialog open composer={composerWith([])} onClose={vi.fn()} />);
    expect(screen.getByTestId("brand-class-add-target").textContent).toMatch(/Select one or more elements/);
    expect((screen.getByTestId("brand-class-add-confirm") as HTMLButtonElement).disabled).toBe(true);
  });

  it("refuses a malformed or reserved name", () => {
    expect(classNameError("2col")).toMatch(/start with a letter/);
    expect(classNameError("buildrick-x")).toMatch(/reserved/);
    expect(classNameError("card")).toBeNull();
  });
});
