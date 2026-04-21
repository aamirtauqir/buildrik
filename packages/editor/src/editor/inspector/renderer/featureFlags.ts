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
