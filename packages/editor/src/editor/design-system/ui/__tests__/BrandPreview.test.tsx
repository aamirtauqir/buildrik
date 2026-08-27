/**
 * The Brand panel opened as nine rows of text with counts and showed none of
 * the brand — measured live at 1440x900, zero colour swatches and no type
 * specimen on the design-system surface (ledger R10).
 */
import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { BrandPreview } from "../BrandPreview";
import type { DesignToken } from "@/engine/designSystem/types";

const token = (over: Partial<DesignToken>): DesignToken => ({
  id: "t", name: "brand", value: "#1a56db", category: "colors",
  cssVar: "--x", type: "color", ...over,
});

describe("BrandPreview", () => {
  it("draws a swatch per colour token, each carrying its name and value", () => {
    render(
      <BrandPreview
        colors={[
          token({ id: "a", name: "primary", value: "#1a56db" }),
          token({ id: "b", name: "danger", value: "#ef4444" }),
        ]}
      />,
    );
    const strip = screen.getByTestId("brand-preview-swatches");
    const swatches = within(strip).getAllByTitle(/—/);
    expect(swatches).toHaveLength(2);
    // A swatch nobody can name is decoration.
    expect(swatches[0].getAttribute("title")).toBe("primary — #1a56db");
    expect(swatches[1].getAttribute("title")).toBe("danger — #ef4444");
  });

  it("prefers the friendly name when the token carries one", () => {
    render(<BrandPreview colors={[token({ friendlyName: "Brand blue" })]} />);
    expect(screen.getByTitle("Brand blue — #1a56db")).toBeTruthy();
  });

  it("caps the strip and says how many it did not draw", () => {
    // One row at 320px is the constraint; a silent truncation would read as
    // "that is the whole palette".
    const many = Array.from({ length: 14 }, (_, i) =>
      token({ id: `c${i}`, name: `c${i}`, value: "#000000" }),
    );
    render(<BrandPreview colors={many} />);
    const strip = screen.getByTestId("brand-preview-swatches");
    expect(within(strip).getAllByTitle(/—/)).toHaveLength(10);
    expect(within(strip).getByText("+4")).toBeTruthy();
  });

  it("renders both type slots as specimens, in their own faces", () => {
    render(<BrandPreview colors={[]} />);
    const type = screen.getByTestId("brand-preview-type");
    expect(within(type).getByText("Heading")).toBeTruthy();
    expect(within(type).getByText("Body")).toBeTruthy();
    const [heading] = within(type).getAllByText("Aa");
    expect(heading.getAttribute("style")).toContain("--buildrick-design-font-heading");
  });

  it("with no colour tokens it shows type only, not an empty strip", () => {
    render(<BrandPreview colors={[]} />);
    expect(screen.queryByTestId("brand-preview-swatches")).toBeNull();
    expect(screen.getByTestId("brand-preview-type")).toBeTruthy();
  });
});
