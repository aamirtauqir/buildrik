/**
 * Editor view mode, derived from the URL (rail + read-only view).
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
 *   ?view=readonly → a read-only VIEW, the way Figma's is: no rail, no drawer,
 *                    no inspector, no owner controls, and a Composer that runs
 *                    no mutating command. Founder call, 2026-08-23.
 *
 * On the naming, because this parameter has now been wrong twice. The block
 * here used to read "the invited content-editor experience… the editor host
 * sets ?view=client for an invited client and otherwise threads the persisted
 * UserPreference.editorDensity in as ?density". Both halves were fiction and
 * both were cited as evidence during review: nothing in the codebase sets this
 * parameter — the only door is the owner's own site menu — and
 * UserPreference.editorDensity is a Prisma column with zero readers.
 *
 * It was then called `client view`, which was a claim about an audience that
 * never receives it. A client is sent /share/<token> (draft link) or
 * /review/<token> (a review round: frozen snapshot, Approve / Request changes)
 * — different pages, neither of them this one. So the value is `readonly` and
 * the symbol names the mechanism: `Composer.readOnly` is the actual gate, and
 * the UI calls the experience "view mode" (founder, 2026-08-23).
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
  readOnlyView: boolean;
}

function resolveRailMode(raw: string | null): RailMode {
  if (raw === "e3") return "e3";
  if (raw === "legacy") return "legacy";
  return "figma";
}

export function getEditorViewMode(): EditorViewMode {
  if (typeof window === "undefined") {
    return { railMode: "figma", fourToolRail: false, density: "full", readOnlyView: false };
  }
  const q = new URLSearchParams(window.location.search);
  const readOnlyView = q.get("view") === "readonly";
  const railMode = resolveRailMode(q.get("rail"));
  return {
    railMode,
    // E3 is the only mode that puts AI in the topbar (✨) and Layers in the
    // footer (⌗); Figma + legacy both keep them elsewhere, so this stays false.
    fourToolRail: railMode === "e3",
    /* `readOnlyView ||` is unobservable now — the inspector is density's only
       consumer and it does not render in view mode. Kept anyway: removing it
       is a behaviour change with three tests to rewrite and nothing to show for
       it, and it stays correct if an inspector ever returns to this mode. */
    density: readOnlyView || q.get("density") === "fewer" ? "fewer" : "full",
    readOnlyView,
  };
}
