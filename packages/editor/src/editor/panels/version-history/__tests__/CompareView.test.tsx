/**
 * CompareView — board 168:82 states the rule in its own annotation:
 * "No panes render — an empty diff view reads as broken."
 *
 * Two ways to land on an empty diff, and they are different facts. The panel
 * skips the comparison entirely when the clicked version IS the newest
 * (handleCompare: `if (latest.id !== versionId)`), so compareResult stays
 * null; and a computed diff can legitimately come back with no changes. Both
 * used to render a Visual/Semantic toggle over blank space.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CompareView } from "../CompareView";
import type { NamedVersion } from "@/shared/types/versions";

const version = {
  id: "v1",
  name: "Homepage redesign",
  snapshot: { pages: [] },
  createdAt: Date.now(),
  isAutoCheckpoint: false,
  projectId: "p1",
  visualSnapshot: null,
  userId: null,
} as unknown as NamedVersion;

function renderView(compareResult: React.ComponentProps<typeof CompareView>["compareResult"]) {
  return render(
    <CompareView
      version={version}
      compareResult={compareResult}
      currentVisualSnapshot={null}
      aiSummaryState={{ loading: false, result: null, error: null }}
      onGetAiSummary={vi.fn()}
      aiCooldownSeconds={0}
    />,
  );
}

describe("CompareView — the empty diff says which empty it is", () => {
  /* L5-040: every compare is against the live draft, so there is no
     "newest version, nothing later" case any more — null is the compare in
     flight. */
  it("no result yet — says it is comparing with the current draft", () => {
    renderView(null);
    expect(screen.getByText(/Comparing with the current draft/)).toBeInTheDocument();
    expect(screen.queryByText(/nothing later to compare/)).not.toBeInTheDocument();
  });

  it("comparison ran and found nothing — the draft matches the version", () => {
    renderView({ summary: null, changes: [] } as never);
    expect(screen.getByText(/The current draft matches “Homepage redesign”/)).toBeInTheDocument();
  });

  it("a real diff renders the changes, not the empty line", () => {
    renderView({
      summary: null,
      changes: [{ property: "element", before: "x", after: "" }],
    } as never);
    expect(screen.queryByText(/The current draft matches/)).not.toBeInTheDocument();
    expect(screen.getByText("element")).toBeInTheDocument();
  });
});
