/**
 * "Show hidden elements" (2L9 176:19089 / 176:19451) — a personal canvas-view
 * preference, kept in this browser like "Show outlines": on (the default), an
 * element its condition hides on the preview record is drawn as a ghost; off,
 * it is not drawn at all. Selection is untouched either way. The Inspector's
 * Conditions line reads it to say which of the two the canvas is doing.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

const KEY = "bk-canvas-show-hidden";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== "false";
  } catch {
    return true;
  }
}

let current = read();

export function setShowHiddenElements(on: boolean): void {
  current = on;
  try {
    localStorage.setItem(KEY, String(on));
  } catch {
    /* Storage refused (private mode): the preference lasts this session. */
  }
  listeners.forEach((l) => l());
}

export function useShowHiddenElements(): boolean {
  return React.useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}
