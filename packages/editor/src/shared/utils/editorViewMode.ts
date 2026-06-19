/**
 * Editor view mode, derived from the URL (E3 rail + E4 invited-client seed).
 *
 * SSOT for the rail/density flags so the rail, topbar, footer, and inspector all
 * read one place (no drifting URLSearchParams copies).
 *
 *   ?rail=4        → 4-tool rail
 *   ?density=fewer → trimmed inspector
 *   ?view=client   → BOTH (the invited content-editor experience): 4-tool rail +
 *                    "fewer" inspector density. The editor host sets ?view=client
 *                    for an invited client and otherwise threads the persisted
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
    return { fourToolRail: false, density: "full", clientView: false };
  }
  const q = new URLSearchParams(window.location.search);
  const clientView = q.get("view") === "client";
  return {
    clientView,
    fourToolRail: clientView || q.get("rail") === "4",
    density: clientView || q.get("density") === "fewer" ? "fewer" : "full",
  };
}
