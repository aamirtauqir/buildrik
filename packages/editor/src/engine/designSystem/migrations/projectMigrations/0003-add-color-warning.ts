import type { ProjectMigration, ProjectPayload } from "./types";

/**
 * G4: add the `color-warning` state token to projects that predate it.
 *
 * WHY A MIGRATION AND NOT JUST A DEFAULT
 * `color-warning` was added to the shipped defaults (`editor/design-system/
 * constants.ts`) as the G4 answer, so NEW projects have it. Projects loaded
 * from a saved `designTokens` payload do not, and nothing was adding it.
 *
 * Nothing renders wrong meanwhile — `themes/design-system/design.css` declares
 * `--buildrick-design-color-warning` globally, so the Alert catalog's `warning`
 * variant paints correctly on an old project too. What an old project loses is
 * OWNERSHIP: the Brand panel cannot list or edit a token that is not in its
 * payload, editing tokens does not move the warning variant, and DSLinter's
 * `missing-dark` rule cannot flag a token that is absent. That silent split —
 * correct pixels, absent control — is exactly the shape that is hard to notice.
 *
 * VALUE
 * Flowbite yellow-700 `#8E4B10` carries white text at 7.4:1. The chrome's own
 * `--bk-warning` (#C27803) is 3.65:1 and would fail the 4.5 floor, which is why
 * this is not a straight reuse of the chrome token. Dark seed `#FACA15` follows
 * 0002's "state colors lift" rule.
 *
 * Idempotent: a project that already has `color-warning` — by any route,
 * including a user-created token with that id — is returned untouched. Its
 * value is never overwritten.
 */
const WARNING_TOKEN = {
  id: "color-warning",
  name: "Warning",
  value: "#8E4B10",
  darkValue: "#FACA15",
  category: "colors",
  cssVar: "--buildrick-design-color-warning",
  type: "color",
  group: "state",
  description: "Caution / warning state",
} as const;

export const migration0003: ProjectMigration = {
  fromVersion: 2,
  toVersion: 3,
  description:
    "Add the color-warning state token to projects that predate G4. Skip projects that already have it (value never overwritten).",

  up(project: ProjectPayload): ProjectPayload {
    if (project.tokens.some((t) => t.id === WARNING_TOKEN.id)) return project;
    /* Appended, not inserted next to color-success: token ORDER is the Brand
       panel's render order, and re-ordering an existing project's list would
       move rows the user has learned the position of. New token, new row, end
       of the colour group. */
    return { ...project, tokens: [...project.tokens, { ...WARNING_TOKEN }] };
  },

  validate(project: ProjectPayload): void {
    const t = project.tokens.find((x) => x.id === WARNING_TOKEN.id);
    if (!t) {
      throw new Error(
        `[ds-migration-0003] validate failed: color-warning is absent after the migration ran.`
      );
    }
    if (!t.cssVar) {
      throw new Error(
        `[ds-migration-0003] validate failed: color-warning has no cssVar, so nothing can bind to it.`
      );
    }
  },
};
