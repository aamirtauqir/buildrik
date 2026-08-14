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
  it("no comparison ran (newest version) — says there is nothing later", () => {
    renderView(null);
    expect(
      screen.getByText(/newest version — there is nothing later to compare it against/i),
    ).toBeInTheDocument();
  });

  it("comparison ran and found nothing — names the version it matched", () => {
    renderView({ summary: null, changes: [] } as never);
    expect(screen.getByText(/Nothing changed since “Homepage redesign”/)).toBeInTheDocument();
  });

  it("a real diff renders the changes, not the empty line", () => {
    renderView({
      summary: null,
      changes: [{ property: "element", before: "x", after: "" }],
    } as never);
    expect(screen.queryByText(/Nothing changed since/)).not.toBeInTheDocument();
    expect(screen.getByText("element")).toBeInTheDocument();
  });
});
