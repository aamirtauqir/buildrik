/**
 * Clone contracts for "Apply saved version across site" — Figma page
 * "Editor v1 Clone", 3695:45615 (the confirm, 560) and 3720:43313 (the
 * progress frame while the placements are updated, 640 × 108). Phase 6.
 *
 * The count and the pages are the site's own — `getUsages` and the page-name
 * join the delete confirm runs — never the board's "3 uses on Home and Menu".
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ApplyVersionModal } from "../ApplyVersionModal";

function mount(over: Partial<React.ComponentProps<typeof ApplyVersionModal>> = {}) {
  const props = {
    open: true,
    name: "hero-dark.jpg",
    uses: 3,
    pages: ["Home", "Menu"],
    applying: false,
    onClose: vi.fn(),
    onApply: vi.fn(),
    ...over,
  };
  const utils = render(<ApplyVersionModal {...props} />);
  return { ...utils, props };
}

describe("Clone 3695:45615 · Apply saved version across site", () => {
  it("titles itself and says what will change, with the real count and pages", () => {
    mount();
    expect(screen.getByTestId("apply-version-title")).toHaveTextContent("Apply saved version across site");
    expect(screen.getByTestId("apply-version-body")).toHaveTextContent(
      "Update 3 uses on Home and Menu to the latest saved version. The original and prior saved version remain available.",
    );
  });

  it("foots Cancel · Apply to 3 uses (primary); Apply runs the update, Cancel closes", () => {
    const { props } = mount();
    const foot = within(screen.getByTestId("apply-version-foot"));
    expect(foot.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual(["Cancel", "Apply to 3 uses"]);
    fireEvent.click(screen.getByTestId("apply-version-confirm"));
    expect(props.onApply).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("apply-version-cancel"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("one use reads singular, on its one page", () => {
    mount({ uses: 1, pages: ["Home"] });
    expect(screen.getByTestId("apply-version-body")).toHaveTextContent(/^Update 1 use on Home to the latest saved version\./);
    expect(screen.getByTestId("apply-version-confirm")).toHaveTextContent("Apply to 1 use");
  });

  it("three pages read as a list", () => {
    mount({ uses: 4, pages: ["Home", "Menu", "Contact"] });
    expect(screen.getByTestId("apply-version-body")).toHaveTextContent("Update 4 uses on Home, Menu and Contact to");
  });

  it("placements that cannot be traced to a page still count, without naming pages", () => {
    mount({ uses: 2, pages: [] });
    expect(screen.getByTestId("apply-version-body")).toHaveTextContent(/^Update 2 uses to the latest saved version\./);
  });

  it("nothing to apply: the primary is disabled and the body says why", () => {
    mount({ uses: 0, pages: [] });
    const confirm = screen.getByTestId("apply-version-confirm");
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveTextContent("Apply to 0 uses");
    expect(screen.getByTestId("apply-version-body")).toHaveTextContent(
      "Nothing on the site uses hero-dark.jpg yet, so there is nothing to update. The saved version stays in Asset versions.",
    );
  });
});

describe("Clone 3720:43313 · Applying saved version", () => {
  it("while the placements update the card is the progress line alone — no buttons", () => {
    mount({ applying: true });
    expect(screen.queryByTestId("apply-version-modal")).toBeNull();
    const applying = screen.getByTestId("apply-version-applying");
    expect(within(applying).getByTestId("apply-version-applying-title")).toHaveTextContent("Applying saved version");
    expect(within(applying).getByTestId("apply-version-applying-line")).toHaveTextContent(
      "Updating 3 uses across Home and Menu. Please wait.",
    );
    expect(within(applying).queryAllByRole("button")).toHaveLength(0);
  });
});
