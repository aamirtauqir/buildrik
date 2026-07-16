/**
 * HelpTooltip tests — trigger accessibility, focus-opened tooltip content,
 * and the optional docs link. Radix Tooltip requires TooltipProvider.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { TooltipProvider } from "@/editor/shared/vibcoder";
import { HelpTooltip } from "../HelpTooltip";

afterEach(cleanup);

function renderHelp(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe("HelpTooltip", () => {
  it("renders the '?' trigger with an accessible label", () => {
    renderHelp(<HelpTooltip content="Controls layout flow." />);
    expect(screen.getByRole("button", { name: "What's this?" })).toBeInTheDocument();
  });

  it("shows the help content when the trigger receives focus", async () => {
    renderHelp(<HelpTooltip content="Controls how this element flows in the layout." />);

    fireEvent.focus(screen.getByRole("button", { name: "What's this?" }));

    const contents = await screen.findAllByText(
      "Controls how this element flows in the layout."
    );
    expect(contents.length).toBeGreaterThan(0);
  });

  it("renders a docs link inside the tooltip when docsLink is set", async () => {
    renderHelp(
      <HelpTooltip content="Spacing scale." docsLink="https://docs.buildrick.io/spacing" />
    );

    fireEvent.focus(screen.getByRole("button", { name: "What's this?" }));
    await screen.findAllByText("Spacing scale.");

    const links = screen.getAllByText("Learn more →");
    expect(links.length).toBeGreaterThan(0);
    const anchor = links[0].closest("a");
    expect(anchor).toHaveAttribute("href", "https://docs.buildrick.io/spacing");
    expect(anchor).toHaveAttribute("target", "_blank");
    expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("omits the docs link without docsLink", async () => {
    renderHelp(<HelpTooltip content="No docs here." />);
    fireEvent.focus(screen.getByRole("button", { name: "What's this?" }));
    await screen.findAllByText("No docs here.");
    expect(screen.queryByText("Learn more →")).not.toBeInTheDocument();
  });

  it("scales the icon by size", () => {
    const { container } = renderHelp(<HelpTooltip content="c" size="md" />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "16");
  });
});
