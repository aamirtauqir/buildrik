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

export interface LintIssue {
  type: "contrast" | "spacing-collision" | "unused" | "alias-cycle";
  severity: "warn" | "error";
  message: string;
  autoFixHint?: string;
}

const STORAGE_KEY = "buildrik:ds:lintSuppressions";

export class LintState {
  private issues = new Map<string, LintIssue[]>();
  private suppressed = new Set<string>();

  constructor() {
    this.loadSuppressions();
  }

  setIssues(tokenId: string, issues: readonly LintIssue[]): void {
    if (issues.length === 0) this.issues.delete(tokenId);
    else this.issues.set(tokenId, [...issues]);
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
  }

  unsuppress(tokenId: string): void {
    this.suppressed.delete(tokenId);
    this.persist();
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
