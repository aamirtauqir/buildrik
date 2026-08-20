/**
 * `aria-activedescendant` needs an element with that id.
 *
 * The context menu points it at the focused action's id ("edit-group" and
 * friends), and the items rendered without ids — so the reference resolved to
 * nothing and axe called it invalid (critical): the menu told assistive tech a
 * focused item that, as far as the DOM was concerned, did not exist.
 *
 * Found by scanning a STATE (right-click open), which no earlier pass had on
 * screen. Re-scans clean.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MenuItem } from "../MenuItem";

afterEach(cleanup);

const action = { id: "edit-group", label: "Group", icon: null } as never;

describe("MenuItem", () => {
  it("carries its action id, so aria-activedescendant can point at it", () => {
    render(<MenuItem action={action} enabled onClick={vi.fn()} />);
    expect(screen.getByRole("menuitem")).toHaveAttribute("id", "edit-group");
  });

  it("still announces itself as a menuitem", () => {
    render(<MenuItem action={action} enabled onClick={vi.fn()} />);
    expect(screen.getByRole("menuitem")).toBeInTheDocument();
  });
});
