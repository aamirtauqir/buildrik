/**
 * useApplyStarter — apply a starter's brand to the site: one write, one ⌘Z.
 *
 * Two surfaces apply a starter (the first-run modal and Brand › Starters), so
 * the write lives here once. Each starter token's light and dark values land
 * through `setTokenLiteral` on the project's own set — a semantic keeps its
 * alias and takes a `custom-<id>` primitive, so the two-layer model survives
 * (it used to replace the colour, type and spacing lists wholesale with the
 * starter's nine rows, dropping every primitive). Nothing is staged: the
 * canvas repaints from the write (spec §4).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import { STARTER_DS_REGISTRY } from "../starters";
import type { DesignToken } from "../types";
import { useProjectTokenStore } from "./TokenRegistryContext";

const SEEN_KEY_PREFIX = "buildrik:starter-gallery-seen-";

function starterSeenKey(projectId: string | null | undefined): string {
  return `${SEEN_KEY_PREFIX}${projectId ?? "default"}`;
}

function markStarterSeen(projectId: string | null | undefined): void {
  try {
    localStorage.setItem(starterSeenKey(projectId), "1");
  } catch {
    // private browsing — the flag is a convenience, not a correctness gate
  }
}

/** The site's tokens with the starter's values written over them. */
function withStarter(all: DesignToken[], starter: readonly DesignToken[]): DesignToken[] {
  return starter.reduce((acc, t) => {
    if (!acc.some((x) => x.id === t.id)) return acc;
    const light = resolveTokenLiteral(starter, t.id, "light");
    const dark = t.modes.dark ? resolveTokenLiteral(starter, t.id, "dark") : null;
    const lit = light === null ? acc : setTokenLiteral(acc, t.id, "light", light);
    return dark === null ? lit : setTokenLiteral(lit, t.id, "dark", dark);
  }, all);
}

/** Returns false when the write was refused (read-only tokens) or the starter is unknown. */
export function useApplyStarter(
  projectId: string | null | undefined,
): (starterId: string) => boolean {
  const { all, commit } = useProjectTokenStore();

  return React.useCallback(
    (starterId: string) => {
      const starter = STARTER_DS_REGISTRY.find((s) => s.id === starterId);
      if (!starter) return false;
      const ok = commit(withStarter(all, starter.tokens), "Apply starter");
      if (ok) markStarterSeen(projectId);
      return ok;
    },
    [projectId, all, commit],
  );
}
