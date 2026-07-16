/**
 * ReachScopeStrip — same-type peer counting, "All like this" blast-radius
 * confirm + propagate transaction, disabled state with no peers, site hint.
 *
 * DOM note: each reach card Button has visible text ("All like this" +
 * "N instances"), so its ACCESSIBLE NAME is that text — the `title`
 * ("Apply to N…") is only a fallback and does not win. Query by the text.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReachScopeStrip } from "../ReachScopeStrip";
import { makeMockElement, makeMockComposer } from "@/editor/inspector/__tests__/harness";

function setup(opts: { peers?: number } = {}) {
  const src = makeMockElement({ id: "p0", type: "paragraph", styles: { color: "red" } });
  const peers = Array.from({ length: opts.peers ?? 2 }, (_, i) =>
    makeMockElement({ id: `p${i + 1}`, type: "paragraph" })
  );
  const other = makeMockElement({ id: "b1", type: "box" });
  const composer = makeMockComposer({
    element: src,
    elements: [src, ...peers, other],
  });
  const utils = render(
    <ReachScopeStrip
      composer={composer as never}
      selectedElement={{ id: "p0", type: "paragraph" }}
    />
  );
  return { composer, src, peers, ...utils };
}

const allLikeThisBtn = () => screen.getByRole("button", { name: /All like this/i });

describe("ReachScopeStrip — peer counting", () => {
  it("counts same-type peers, excluding the selected element and other types", () => {
    setup({ peers: 2 });
    // 2 paragraph peers → "2 instances"; the box element is excluded.
    expect(screen.getByText("2 instances")).toBeInTheDocument();
  });

  it("disables 'All like this' when there are no peers", () => {
    setup({ peers: 0 });
    expect(allLikeThisBtn()).toBeDisabled();
  });
});

describe("ReachScopeStrip — propagate", () => {
  it("confirm then apply copies the source styles to every peer in one transaction", () => {
    const { composer, peers } = setup({ peers: 2 });
    fireEvent.click(allLikeThisBtn());
    // Blast-radius confirm appears.
    fireEvent.click(screen.getByRole("button", { name: "Apply to 2" }));

    expect(composer.beginTransaction).toHaveBeenCalledWith("reach-all-like-this");
    expect(composer.endTransaction).toHaveBeenCalled();
    for (const peer of peers) {
      expect(peer.setStyle).toHaveBeenCalledWith("color", "red");
    }
  });

  it("cancel dismisses the confirm without writing", () => {
    const { composer, peers } = setup({ peers: 2 });
    fireEvent.click(allLikeThisBtn());
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("button", { name: "Apply to 2" })).not.toBeInTheDocument();
    expect(composer.beginTransaction).not.toHaveBeenCalled();
    expect(peers[0].setStyle).not.toHaveBeenCalled();
  });
});

describe("ReachScopeStrip — site hint", () => {
  it("toggles the Styles-tab hint when 'Whole site' is clicked", () => {
    setup();
    expect(screen.queryByText(/Site-wide colors/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Whole site/i }));
    expect(screen.getByText(/Site-wide colors/i)).toBeInTheDocument();
  });
});
