/**
 * DSLintRunner — the lint runs for the whole editor, not only for the Brand
 * panel.
 *
 * `useDSLint` is the only caller of the linter and the only writer into
 * `lintState`, which the shell bridges into the topbar Issues chip. Every
 * caller of that hook lived inside the Brand panel, so the linter did not run
 * until Brand was opened. Measured live on 2026-08-17: a freshly loaded editor
 * said "No issues"; opening Brand flipped it to "4 issues, 4 warnings" with
 * nothing about the project having changed.
 *
 * That matters because the chip is a pre-publish signal — board 1168:4732's
 * publish-anyway confirm is gated on its error count — so a publish with open
 * errors got no confirm at all until the user visited an unrelated panel.
 *
 * @license BSD-3-Clause
 */

import { render } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "@/engine";
import { LintState } from "@/engine/designSystem/LintState";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { DSLintRunner } from "../DSLintRunner";

const FOUND = [
  { rule: "banned-hue" as const, severity: "error" as const, tokenId: "color-1", message: "violet" },
  { rule: "pure-black" as const, severity: "warning" as const, tokenId: "color-2", message: "#000" },
];

const makeComposer = (lintState: LintState, lint = vi.fn(() => FOUND)) =>
  ({ dsLinter: { lint }, designSystem: { lintState } }) as unknown as Composer;

const mount = (composer: Composer) =>
  render(
    <TokenRegistryProvider composer={undefined}>
      <DSLintRunner composer={composer} />
    </TokenRegistryProvider>,
  );

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("DSLintRunner", () => {
  it("publishes findings into lintState with no Brand panel mounted", () => {
    const lintState = new LintState();
    mount(makeComposer(lintState));

    expect(lintState.getIssues("color-1")).toHaveLength(0);
    vi.advanceTimersByTime(600);

    expect(lintState.getIssues("color-1")).toHaveLength(1);
    expect(lintState.getIssues("color-2")).toHaveLength(1);
  });

  it("keeps the error severity the publish confirm is gated on", () => {
    // The chip counts errors separately from warnings, and only errors open
    // the publish-anyway confirm. A runner that flattened severity would make
    // the chip look right and the gate still never fire.
    const lintState = new LintState();
    mount(makeComposer(lintState));
    vi.advanceTimersByTime(600);

    expect(lintState.getIssues("color-1")[0]).toMatchObject({ severity: "error" });
    expect(lintState.getIssues("color-2")[0]).toMatchObject({ severity: "warning" });
  });

  it("renders nothing — it is a runner, not a surface", () => {
    // The aggregate banner is a Brand-panel surface; this must not put one at
    // shell level.
    const { container } = mount(makeComposer(new LintState()));
    vi.advanceTimersByTime(600);
    expect(container.textContent).toBe("");
  });

  it("does not run the linter without a composer", () => {
    const lint = vi.fn(() => FOUND);
    render(
      <TokenRegistryProvider composer={undefined}>
        <DSLintRunner composer={null} />
      </TokenRegistryProvider>,
    );
    vi.advanceTimersByTime(600);
    expect(lint).not.toHaveBeenCalled();
  });
});
