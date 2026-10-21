/**
 * Clone contracts for "Restore version across site" — Figma page
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
import { RestoreVersionModal } from "../RestoreVersionModal";

function mount(over: Partial<React.ComponentProps<typeof RestoreVersionModal>> = {}) {
  const props = {
    open: true,
    name: "hero-dark.jpg",
    uses: 3,
    pages: ["Home", "Menu"],
    label: "v1 · Original",
    applying: false,
    onClose: vi.fn(),
    onRestore: vi.fn(),
    ...over,
  };
  const utils = render(<RestoreVersionModal {...props} />);
  return { ...utils, props };
}

describe("Clone 3695:45615 · Restore version across site", () => {
  it("titles itself and says what will change, with the real count and pages", () => {
    mount();
    expect(screen.getByTestId("restore-version-title")).toHaveTextContent("Restore version across site");
    expect(screen.getByTestId("restore-version-body")).toHaveTextContent(
      "Update 3 uses on Home and Menu to v1 · Original. Every other version remains available.",
    );
  });

  it("foots Cancel · Restore on 3 uses (primary); Restore runs the update, Cancel closes", () => {
    const { props } = mount();
    const foot = within(screen.getByTestId("restore-version-foot"));
    expect(foot.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual(["Cancel", "Restore on 3 uses"]);
    fireEvent.click(screen.getByTestId("restore-version-confirm"));
    expect(props.onRestore).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("restore-version-cancel"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("one use reads singular, on its one page", () => {
    mount({ uses: 1, pages: ["Home"] });
    expect(screen.getByTestId("restore-version-body")).toHaveTextContent(/^Update 1 use on Home to v1 · Original\./);
    expect(screen.getByTestId("restore-version-confirm")).toHaveTextContent("Restore on 1 use");
  });

  it("three pages read as a list", () => {
    mount({ uses: 4, pages: ["Home", "Menu", "Contact"] });
    expect(screen.getByTestId("restore-version-body")).toHaveTextContent("Update 4 uses on Home, Menu and Contact to");
  });

  it("placements that cannot be traced to a page still count, without naming pages", () => {
    mount({ uses: 2, pages: [] });
    expect(screen.getByTestId("restore-version-body")).toHaveTextContent(/^Update 2 uses to v1 · Original\./);
  });

  it("nothing to move: the primary is disabled and the body says why", () => {
    mount({ uses: 0, pages: [] });
    const confirm = screen.getByTestId("restore-version-confirm");
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveTextContent("Restore on 0 uses");
    expect(screen.getByTestId("restore-version-body")).toHaveTextContent(
      "Nothing on the site uses hero-dark.jpg yet, so there is nothing to update. Every version stays in Asset versions.",
    );
  });
});

describe("Clone 3720:43313 · Restoring version", () => {
  it("while the placements update the card is the progress line alone — no buttons", () => {
    mount({ applying: true });
    expect(screen.queryByTestId("restore-version-modal")).toBeNull();
    const applying = screen.getByTestId("restore-version-applying");
    expect(within(applying).getByTestId("restore-version-applying-title")).toHaveTextContent("Restoring version");
    expect(within(applying).getByTestId("restore-version-applying-line")).toHaveTextContent(
      "Updating 3 uses across Home and Menu. Please wait.",
    );
    expect(within(applying).queryAllByRole("button")).toHaveLength(0);
  });
});
