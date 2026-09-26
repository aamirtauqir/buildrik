/**
 * The beforeunload guard's bypass, shared by every programmatic navigation
 * the editor itself decides on. It lived as a ref inside StudioHeader, so a
 * navigation started anywhere else — the switch to view mode after a refused
 * save (useSaveCallback, C-9) — could not reach it and put a "Leave site?"
 * prompt over the switch whenever any dirty source (settings, brand, CMS
 * records, a save in flight, queued mirror writes) was still up (L-2).
 *
 * The flag clears on a timer in case the navigation is cancelled; a stuck flag
 * would disarm the guard for good.
 *
 * @license BSD-3-Clause
 */
let bypassed = false;

export function navigateBypassingUnloadGuard(nav: () => void): void {
  bypassed = true;
  try {
    nav();
  } finally {
    window.setTimeout(() => {
      bypassed = false;
    }, 1000);
  }
}

export function isUnloadGuardBypassed(): boolean {
  return bypassed;
}

/** The guard's owner unmounting ends any bypass it could have honoured — a
 *  later editor mount (or the next test) starts armed. */
export function endUnloadGuardBypass(): void {
  bypassed = false;
}
