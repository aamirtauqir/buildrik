/**
 * Inspector localStorage flags, read once at module load. Unset (empty, "0",
 * missing localStorage) → false. (The schema-border flag and the schema
 * pipeline it switched to went with G2-154.)
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

/**
 * Dev-mode inspector: unlocks the "All CSS" section (raw property editor)
 * registered in every element profile. Was `const devMode = false` hardcoded
 * in ProInspector — the section could never render (audit F22, 2026-07-25).
 *   localStorage.setItem("buildrick:dev-mode", "1"); // reload
 */
export const USE_DEV_MODE = read("buildrick:dev-mode");
