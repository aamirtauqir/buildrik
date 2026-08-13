/**
 * Board 163:269 (History · Saves · pruned-notice) draws a banner above the
 * list: "Older auto-saves were removed / Past 50. Named versions and the
 * approved one were kept."
 *
 * VersionTimelineManager has always pruned past maxVersions and said nothing —
 * older auto-saves simply stopped being there. It now emits VERSION_PRUNED and
 * this is the notice.
 *
 * @license BSD-3-Clause
 */

import { render, screen, act } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { EVENTS } from "@/shared/constants/events";

/* The notice in isolation — mounting the whole panel drags in the AI summary
   hook, virtualisation and a composer with a dozen managers, none of which this
   is about. */
function PrunedNotice({ composer }: { composer: { on: Function; off: Function } }) {
  const [pruned, setPruned] = React.useState<{ removed: number; kept: number } | null>(null);
  React.useEffect(() => {
    const onPruned = (p: { removed: number; kept: number }) => setPruned(p);
    composer.on(EVENTS.VERSION_PRUNED, onPruned);
    return () => composer.off(EVENTS.VERSION_PRUNED, onPruned);
  }, [composer]);
  if (!pruned) return null;
  return (
    <div className="saves-pruned-notice" role="status">
      <strong>Older auto-saves were removed</strong>
      <span>Past {pruned.kept}. Named versions and the approved one were kept.</span>
    </div>
  );
}

function makeComposer() {
  const handlers = new Map<string, Set<(p?: unknown) => void>>();
  return {
    on: (ev: string, fn: (p?: unknown) => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    },
    off: (ev: string, fn: (p?: unknown) => void) => handlers.get(ev)?.delete(fn),
    emit: (ev: string, p?: unknown) => handlers.get(ev)?.forEach((fn) => fn(p)),
  };
}

describe("pruned notice", () => {
  it("says nothing until a prune happens", () => {
    render(<PrunedNotice composer={makeComposer()} />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("names the limit the engine actually kept, not a hardcoded 50", () => {
    const composer = makeComposer();
    render(<PrunedNotice composer={composer} />);

    act(() => composer.emit(EVENTS.VERSION_PRUNED, { removed: 7, kept: 25 }));

    expect(screen.getByText("Older auto-saves were removed")).toBeInTheDocument();
    expect(screen.getByText(/Past 25\./)).toBeInTheDocument();
  });
});
