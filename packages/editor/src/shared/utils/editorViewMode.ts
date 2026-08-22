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
 *   ?view=client   → a read-only VIEW, the way Figma's is: no rail, no drawer,
 *                    no inspector, no owner controls, and a Composer that runs
 *                    no mutating command. Founder call, 2026-08-23.
 *
 *                    This block used to read "the invited content-editor
 *                    experience… the editor host sets ?view=client for an
 *                    invited client and otherwise threads the persisted
 *                    UserPreference.editorDensity in as ?density". Both halves
 *                    were fiction and both were cited as evidence during the
 *                    review: NOTHING in the codebase sets ?view=client — the
 *                    only door is the owner's own site menu — and
 *                    UserPreference.editorDensity is a Prisma column with zero
 *                    readers. The Content editor ROLE does exist and is
 *                    invitable; what never existed was a shell wired to it.
 *
 *                    Worth knowing before building on this: an owner opening
 *                    client view is previewing a surface no client is sent to.
 *                    A client receives /review/<token>, which is a different
 *                    page — frozen snapshot, Approve / Request changes.
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
    /* `clientView ||` is unobservable now — the inspector is density's only
       consumer and it does not render in client view. Kept anyway: removing it
       is a behaviour change with three tests to rewrite and nothing to show for
       it, and it stays correct if an inspector ever returns to this mode. */
    density: clientView || q.get("density") === "fewer" ? "fewer" : "full",
    clientView,
  };
}
