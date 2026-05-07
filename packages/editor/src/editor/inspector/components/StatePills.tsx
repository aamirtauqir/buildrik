/**
 * StatePills — D6 Stage 1 extraction (audit-remediation 2026-05-08).
 *
 * Lifted out of ProInspector.tsx (was inline at lines 198-218).
 * Renders the pseudo-state pill row (`Base / :hover / :focus /
 * :active / :disabled`) that sits next to BreakpointPill in the BPR
 * strip. Stateless — every concern is driven by props from the
 * inspector's `useInspectorState` hook.
 *
 * @license BSD-3-Clause
 */

import { Button } from "@/editor/shared/vibcoder/Button";
import * as React from "react";
import type { PseudoStateId } from "../../../shared/types";

const PSEUDO_LABELS: Record<PseudoStateId, string> = {
  normal: "Base",
  hover: ":hover",
  focus: ":focus",
  active: ":active",
  disabled: ":disabled",
};

export interface StatePillsProps {
  current: PseudoStateId;
  onChange: (s: PseudoStateId) => void;
  withOverrides: Set<PseudoStateId>;
  visibleStates: readonly PseudoStateId[];
}

export const StatePills: React.FC<StatePillsProps> = ({
  current,
  onChange,
  withOverrides,
  visibleStates,
}) => (
  <div className="bdi-states" role="group" aria-label="Element state selector">
    {visibleStates.map((s) => (
      <Button
        key={s}
        type="button"
        className={`bdi-state-pill${current === s ? " on" : ""}${withOverrides.has(s) ? " has-override" : ""}`}
        onClick={() => onChange(s)}
        aria-pressed={current === s}
        title={s === "normal" ? "Base styles" : `Styles for :${s}`}
      >
        {PSEUDO_LABELS[s]}
      </Button>
    ))}
  </div>
);
