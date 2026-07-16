/**
 * Editor view mode, derived from the URL (rail + E4 invited-client seed).
 *
 * SSOT for the rail/density flags so the rail, topbar, footer, and inspector all
 * read one place (no drifting URLSearchParams copies).
 *
 *   (default)      → Figma-contract rail (F1 promoted 2026-07 — the 02 · Editor
 *                    design supersedes E3). Five rail tools: Add / Assets /
 *                    Components / Layers / Pages. AI is contextual (canvas + ⌘K),
 *                    everything else lives in the topbar. Revert-by-URL below.
 *   ?rail=e3       → the 4-tool E3 rail (Insert/Pages/Styles/Site + ✨ AI +
 *                    ⌗ structure). Was the default until F1; kept as an escape hatch.
 *   ?rail=legacy   → the old 11-tab zone rail (deepest escape hatch)
 *   ?density=fewer → trimmed inspector
 *   ?view=client   → the invited content-editor experience: Figma rail + "fewer"
 *                    inspector density. The editor host sets ?view=client for an
 *                    invited client and otherwise threads the persisted
 *                    UserPreference.editorDensity in as ?density.
 *
 * `fourToolRail` is retained as a derived flag (true only for the E3 escape
 * hatch) so existing consumers keep compiling; new code should branch on
 * `railMode`.
 *
 * @license BSD-3-Clause
 */
export type RailMode = "figma" | "e3" | "legacy";

export interface EditorViewMode {
  /** Which rail renders. "figma" is the default (F1). */
  railMode: RailMode;
  /** Derived back-compat flag: true ONLY for the E3 escape hatch (?rail=e3). */
  fourToolRail: boolean;
  density: "full" | "fewer";
  clientView: boolean;
}

function resolveRailMode(raw: string | null): RailMode {
  if (raw === "e3") return "e3";
  if (raw === "legacy") return "legacy";
  return "figma";
}

export function getEditorViewMode(): EditorViewMode {
  if (typeof window === "undefined") {
    return { railMode: "figma", fourToolRail: false, density: "full", clientView: false };
  }
  const q = new URLSearchParams(window.location.search);
  const clientView = q.get("view") === "client";
  const railMode = resolveRailMode(q.get("rail"));
  return {
    railMode,
    // E3 is the only mode that puts AI in the topbar (✨) and Layers in the
    // footer (⌗); Figma + legacy both keep them elsewhere, so this stays false.
    fourToolRail: railMode === "e3",
    density: clientView || q.get("density") === "fewer" ? "fewer" : "full",
    clientView,
  };
}
