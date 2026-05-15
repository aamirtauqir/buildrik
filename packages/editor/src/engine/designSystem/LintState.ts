/**
 * LintState
 *
 * Tracks per-token lint issues plus per-token suppression flags. Suppressions
 * persist to localStorage so an "Ignore" decision sticks across reloads.
 *
 * Issues are populated externally (by DSLinter, downstream of this arc). For
 * now this is a passive store. `TokenKindCard` reads via `getVisibleIssues`
 * to render inline `TokenLintRow` with Auto-fix and Ignore buttons.
 *
 * @module engine/designSystem/LintState
 * @license BSD-3-Clause
 */

import { EventEmitter } from "../EventEmitter";

export interface LintIssue {
  type: "contrast" | "spacing-collision" | "unused" | "alias-cycle";
  severity: "warn" | "error";
  message: string;
  autoFixHint?: string;
}

const STORAGE_KEY = "buildrik:ds:lintSuppressions";

/**
 * Emits `"lint:changed"` after every mutation (setIssues / suppress /
 * unsuppress) so the React layer can re-render. Mirrors the T1
 * TokenUsageTracker emit pattern — UI subscribes once at TokensSection,
 * snapshots fresh issue maps in the handler.
 */
export class LintState extends EventEmitter {
  private issues = new Map<string, LintIssue[]>();
  private suppressed = new Set<string>();

  constructor() {
    super();
    this.loadSuppressions();
  }

  setIssues(tokenId: string, issues: readonly LintIssue[]): void {
    if (issues.length === 0) this.issues.delete(tokenId);
    else this.issues.set(tokenId, [...issues]);
    this.emit("lint:changed");
  }

  getIssues(tokenId: string): readonly LintIssue[] {
    return this.issues.get(tokenId) ?? [];
  }

  getVisibleIssues(tokenId: string): readonly LintIssue[] {
    if (this.suppressed.has(tokenId)) return [];
    return this.getIssues(tokenId);
  }

  suppress(tokenId: string): void {
    this.suppressed.add(tokenId);
    this.persist();
    this.emit("lint:changed");
  }

  unsuppress(tokenId: string): void {
    this.suppressed.delete(tokenId);
    this.persist();
    this.emit("lint:changed");
  }

  isSuppressed(tokenId: string): boolean {
    return this.suppressed.has(tokenId);
  }

  private persist(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...this.suppressed]),
      );
    } catch {
      // localStorage write failed; suppression stays in-memory for session
    }
  }

  private loadSuppressions(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const list: unknown = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const id of list) {
          if (typeof id === "string") this.suppressed.add(id);
        }
      }
    } catch {
      // bad JSON or storage unavailable; ignore
    }
  }
}
