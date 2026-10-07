/**
 * PD-1 / UI-06: rich text was a plain textarea and the server stripped every
 * tag. The field now edits markup cut to the shared allow-list.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RichTextField } from "../RichTextField";

afterEach(() => cleanup());

describe("RichTextField", () => {
  it("shows the stored markup and emits only the allow-listed markup", () => {
    const onChange = vi.fn();
    render(<RichTextField id="rt" labelId="rt-l" value="<p>Hi <strong>there</strong></p>" onChange={onChange} />);
    const box = screen.getByRole("textbox");
    expect(box.innerHTML).toBe("<p>Hi <strong>there</strong></p>");
    box.innerHTML = '<p onclick="x()">Hi <em>you</em><script>alert(1)</script><a href="javascript:alert(1)">bad</a><a href="https://ok.test">ok</a></p>';
    fireEvent.input(box);
    const html = onChange.mock.calls.at(-1)![0] as string;
    expect(html).toContain("<em>you</em>");
    expect(html).toContain("<a href=https://ok.test>ok</a>");
    expect(html).not.toMatch(/onclick|<script|javascript:/i);
  });

  it("an emptied box stores nothing, not <br>", () => {
    const onChange = vi.fn();
    render(<RichTextField id="rt" labelId="rt-l" value="<p>x</p>" onChange={onChange} />);
    const box = screen.getByRole("textbox");
    box.innerHTML = "<br>";
    fireEvent.input(box);
    expect(onChange).toHaveBeenLastCalledWith("");
  });
});
