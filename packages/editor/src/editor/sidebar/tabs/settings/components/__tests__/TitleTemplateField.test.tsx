/**
 * L3-036: the optional site title template, with a live preview through the
 * one resolver's `applyTitleTemplate`. Empty means "no template".
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { TitleTemplateField } from "../TitleTemplateField";

function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = React.useState(initial);
  return <TitleTemplateField value={value} onChange={setValue} siteName="Acme" samplePageTitle="About" />;
}

const input = () => screen.getByLabelText(/^Title template/) as HTMLInputElement;
const preview = () => screen.getByTestId("set-seo-title-template-preview");

describe("TitleTemplateField", () => {
  it("previews the template applied to a sample page title", () => {
    render(<Harness />);
    fireEvent.change(input(), { target: { value: "{page_title} | {site_name}" } });
    expect(preview()).toHaveTextContent("About | Acme");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("asks for {page_title} when the template has none, and previews the bare page title", () => {
    render(<Harness />);
    fireEvent.change(input(), { target: { value: "Acme" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Include {page_title} so each page keeps its own title.");
    expect(preview()).toHaveTextContent("About");
    expect(preview()).not.toHaveTextContent("Acme");
  });

  it("empty means no template — no error, preview is the page title", () => {
    render(<Harness />);
    expect(input().value).toBe("");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(preview()).toHaveTextContent("About");
  });

  it("the Insert chips put the token at the caret", () => {
    render(<Harness initial="Acme" />);
    input().setSelectionRange(0, 0);
    fireEvent.click(screen.getByRole("button", { name: "Insert {page_title}" }));
    expect(input().value).toBe("{page_title}Acme");
    input().setSelectionRange(input().value.length, input().value.length);
    fireEvent.click(screen.getByRole("button", { name: "Insert {site_name}" }));
    expect(input().value).toBe("{page_title}Acme{site_name}");
  });
});
