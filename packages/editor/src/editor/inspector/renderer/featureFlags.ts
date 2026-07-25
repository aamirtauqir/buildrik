/**
 * Feature flags for the schema-driven inspector rollout.
 *
 * Default path is the existing hand-written section components. Flipping a
 * flag opts that section into the schema pipeline — useful for internal
 * parity testing before the hand-written version is deleted.
 *
 * Flags are read once at module load. Toggle via:
 *   localStorage.setItem("buildrick:schema-border", "1");
 *   // reload
 *
 * Unset (empty, "0", missing localStorage) → false → hand-written path.
 *
 * @license BSD-3-Clause
 */

function read(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage?.getItem(key) === "1";
  } catch {
    // Private-mode or storage-blocked; treat as off.
    return false;
  }
}

export const USE_SCHEMA_BORDER = read("buildrick:schema-border");

/**
 * Dev-mode inspector: unlocks the "All CSS" section (raw property editor)
 * registered in every element profile. Was `const devMode = false` hardcoded
 * in ProInspector — the section could never render (audit F22, 2026-07-25).
 *   localStorage.setItem("buildrick:dev-mode", "1"); // reload
 */
export const USE_DEV_MODE = read("buildrick:dev-mode");
