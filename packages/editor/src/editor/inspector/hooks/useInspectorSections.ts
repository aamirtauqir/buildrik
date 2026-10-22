/**
 * useInspectorSections — the user's open / closed choice per section, per
 * element type (Inspector v4, DD-11).
 *
 * A section's display mode is decided by `resolveDisplayMode`: the user's
 * choice for `${elementType}:${sectionId}` when there is one, else how the
 * registry says the section arrives (`always` / `open` → open, `closed` →
 * summary, `valued` → open when the element carries a value, else the "+"
 * row). The choice is remembered per element type, so closing Typography on
 * one heading closes it on every heading.
 *
 * Stored under `buildrick-inspector-sections-v3`. The v2 set, the legacy flat
 * key and the Beginner/Pro tier key are deleted on first load — the section
 * ids changed, so there is nothing to migrate.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { SectionOpen } from "../sections/registry";
import type { SectionDisplayMode } from "../shared/controls/Section";

export const SECTION_PREFS_KEY = "buildrick-inspector-sections-v3";
const RETIRED_KEYS = ["buildrick-inspector-sections-v2", "buildrick-inspector-sections", "buildrick-inspector-tier"];

export type SectionChoice = "open" | "closed";

export function resolveDisplayMode(
  open: SectionOpen,
  hasValue: boolean,
  choice: SectionChoice | undefined,
): SectionDisplayMode {
  if (choice === "open") return "open";
  if (choice === "closed") return "summary";
  if (open === "always" || open === "open") return "open";
  if (open === "closed") return "summary";
  return hasValue ? "open" : "empty";
}

function load(): Record<string, SectionChoice> {
  if (typeof window === "undefined") return {};
  try {
    for (const key of RETIRED_KEYS) localStorage.removeItem(key);
    const raw = localStorage.getItem(SECTION_PREFS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, SectionChoice> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v === "open" || v === "closed") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function save(choices: Record<string, SectionChoice>): void {
  try {
    localStorage.setItem(SECTION_PREFS_KEY, JSON.stringify(choices));
  } catch {
    // Storage full or blocked — the choice still holds for this session.
  }
}

export interface UseInspectorSectionsResult {
  /** `${elementType}:${sectionId}` → the user's choice. */
  choices: Readonly<Record<string, SectionChoice>>;
  /** Record one choice for one or several sections (⌥-click, DD-22) of an element type. */
  setChoices: (elementType: string, sectionIds: readonly string[], choice: SectionChoice) => void;
}

/* One store for every caller. ProInspector and PagePanel each held their own
   copy loaded at mount, and each `setChoices` saved its whole copy — so a
   choice made in one panel was silently dropped by the next save from the
   other. */
let store: Record<string, SectionChoice> | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Record<string, SectionChoice> {
  if (store === null) store = load();
  return store;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setChoices(elementType: string, sectionIds: readonly string[], choice: SectionChoice): void {
  const next = { ...getSnapshot() };
  for (const id of sectionIds) next[`${elementType}:${id}`] = choice;
  store = next;
  save(next);
  for (const listener of listeners) listener();
}

/** Tests only: forget the in-memory store so the next read reloads storage. */
export function resetSectionChoicesForTests(): void {
  store = null;
}

export function useInspectorSections(): UseInspectorSectionsResult {
  const choices = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { choices, setChoices };
}
