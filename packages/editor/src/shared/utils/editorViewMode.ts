/**
 * Editor view mode, derived from the URL (E3 rail + E4 invited-client seed).
 *
 * SSOT for the rail/density flags so the rail, topbar, footer, and inspector all
 * read one place (no drifting URLSearchParams copies).
 *
 *   (default)      → 4-tool rail (E3 promoted 2026-06-19 after the full-parity QA
 *                    walk: Insert/Pages/Styles/Site + composite sub-nav + ✨ AI +
 *                    ⌗ structure all verified). Revert-by-commit if needed.
 *   ?rail=legacy   → the old 11-tab rail (escape hatch)
 *   ?density=fewer → trimmed inspector
 *   ?view=client   → the invited content-editor experience: 4-tool rail + "fewer"
 *                    inspector density. The editor host sets ?view=client for an
 *                    invited client and otherwise threads the persisted
 *                    UserPreference.editorDensity in as ?density.
 *
 * @license BSD-3-Clause
 */
export interface EditorViewMode {
  fourToolRail: boolean;
  density: "full" | "fewer";
  clientView: boolean;
}

export function getEditorViewMode(): EditorViewMode {
  if (typeof window === "undefined") {
    return { fourToolRail: true, density: "full", clientView: false };
  }
  const q = new URLSearchParams(window.location.search);
  const clientView = q.get("view") === "client";
  return {
    clientView,
    // 4-tool rail is the default now; ?rail=legacy is the opt-out escape hatch.
    fourToolRail: q.get("rail") !== "legacy",
    density: clientView || q.get("density") === "fewer" ? "fewer" : "full",
  };
}
