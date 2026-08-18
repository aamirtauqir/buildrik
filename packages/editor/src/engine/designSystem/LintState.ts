/**
 * LintState
 *
 * Tracks per-token lint issues plus per-token suppression flags. Suppressions
 * persist to localStorage so an "Ignore" decision sticks across reloads.
 *
 * Issues arrive from DSLinter via `useDSLint`, which is the one place the
 * linter runs. This store was passive and empty for the whole of that arc:
 * nothing called `setIssues`, so the Issues panel and the token detail view
 * both showed nothing no matter what the linter had found. Token list rows read via `getVisibleIssues`
 * to render inline row lint state (amber bg + borderLeft + description +
 * [lint] tag). Auto-fix + Ignore actions live in the T8 detail view.
 *
 * @module engine/designSystem/LintState
 * @license BSD-3-Clause
 */

import { EventEmitter } from "../EventEmitter";
import type { LintRuleId, LintSeverity } from "./linter";

/**
 * One finding, in the linter's own vocabulary. This used to be a second,
 * independent shape — `type` was a four-value union ("contrast" |
 * "spacing-collision" | "unused" | "alias-cycle") that shared not one value
 * with the seven rule ids DSLinter actually produces, and `severity` was
 * "warn" against the linter's "warning". Two shapes for one concept, on either
 * side of a hand-off that was never built, so nothing ever failed to compile.
 */
export interface LintIssue {
  type: LintRuleId;
  severity: LintSeverity;
  message: string;
  /** Absent until a rule learns to describe its own fix. */
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

  /**
   * Replace the whole map in one shot and emit once. The per-token setter
   * cannot express "this token no longer has issues" for tokens the caller
   * did not mention, which is most of them after a re-lint.
   */
  setAllIssues(byToken: ReadonlyMap<string, readonly LintIssue[]>): void {
    this.issues.clear();
    for (const [tokenId, issues] of byToken) {
      if (issues.length > 0) this.issues.set(tokenId, [...issues]);
    }
    this.emit("lint:changed");
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

  /**
   * Every unsuppressed issue across every token, flattened and tagged with the
   * token it belongs to. The per-token getters above answer "is THIS swatch
   * bad", which is what the Brand panel asks; the Issues panel asks the
   * opposite question — "what is wrong anywhere" — and cannot iterate tokens
   * it does not know about.
   */
  getAllVisibleIssues(): Array<{ tokenId: string; issue: LintIssue }> {
    const out: Array<{ tokenId: string; issue: LintIssue }> = [];
    for (const [tokenId, issues] of this.issues) {
      if (this.suppressed.has(tokenId)) continue;
      for (const issue of issues) out.push({ tokenId, issue });
    }
    return out;
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

  /**
   * How many tokens are currently hiding their warnings.
   *
   * Board 306:2217 draws a "Warnings suppressed" pill on the Brand root, and
   * nothing could answer it: suppression was reachable (TokenDetailView) and
   * invisible afterwards — the Lint count simply went down. A count that drops
   * for two different reasons, with no way to tell them apart, is worse than
   * either.
   */
  suppressedCount(): number {
    return this.suppressed.size;
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
