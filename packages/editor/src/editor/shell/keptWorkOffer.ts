/**
 * The kept-work offer (2L9 B7-G07–G10): work from an earlier visit that never
 * reached the server, found by the load path and not applied.
 *
 * The load path (`useComposerInit`) is the one writer — only it can import the
 * kept project into the composer — and `RecoveryBanner` is the one surface
 * that offers it. They used to be two surfaces with two wordings: the banner
 * and a "Some work never reached the server" toast.
 *
 * Same store pattern as `siteLoadStatus.ts`: AquibraStudio mounts the banner
 * and is not edited by the lanes.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { ProjectData } from "@shared/types";

export interface KeptWorkOffer {
  siteId: string;
  /** When the save that failed was attempted (ISO). */
  at: string;
  project: ProjectData;
  /** Put the kept edits back on screen and schedule their save. */
  restore: () => void;
}

let current: KeptWorkOffer | null = null;
const listeners = new Set<() => void>();

export function setKeptWorkOffer(next: KeptWorkOffer | null): void {
  current = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const read = () => current;

export function useKeptWorkOffer(): KeptWorkOffer | null {
  return React.useSyncExternalStore(subscribe, read, read);
}
