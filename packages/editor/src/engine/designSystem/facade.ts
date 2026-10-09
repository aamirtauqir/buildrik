/**
 * DesignSystemFacade — the contract of `composer.designSystem`: token reads,
 * THE token write, auto-fix, preview, dark mode and Connect to tokens. The
 * implementation is built in Composer's constructor; the contract lives here
 * so Composer.ts carries the wiring, not 110 lines of interface (DQ-007).
 *
 * @module engine/designSystem/facade
 * @license BSD-3-Clause
 */

import type { TokenUsageTracker } from "./TokenUsageTracker";
import type { LintState } from "./LintState";
import type { TokenBindingResolver } from "./TokenBindingResolver";
import type { ConnectSuggestion } from "./connectTokens";
import type { BrandPreview, DarkMode, DesignToken } from "./types";

export interface DesignSystemFacade {
  /** True when the site's tokens failed to migrate on load: Brand shows the
   *  old tokens and refuses edits. Set by the load path, announced with
   *  `EVENTS.DESIGN_SYSTEM_READ_ONLY`. */
  readOnly: boolean;
  /** Why `readOnly` is set (null when it is not): selects the Brand notice. */
  readOnlyReason: string | null;
  /** The server's brand-token switch for this site (`brandTokensV2`), set by
   *  the load path. False: a pre-v6 site's tokens are emitted (canvas,
   *  export, publish) as saved, never migrated in memory. True when nothing
   *  loaded from the server (standalone editor). */
  brandTokensV2: boolean;
  readonly tokenUsage: TokenUsageTracker;
  readonly lintState: LintState;
  readonly tokenBindingResolver: TokenBindingResolver;
  /**
   * Resolves a LintIssue `autoFixHint` into a suggested next hex value.
   *
   * Pure compute helper — does NOT mutate the token registry (the
   * registries live React-side in `TokenRegistryContext`, not in the
   * engine). Callers chain this with `onColorChange` / `updateToken` to
   * actually apply the fix, then call `lintState.suppress(id)` to clear
   * the row.
   *
   * Naming intent: `compute*` signals "pure, no side effects". Use
   * `applyAutoFix` below for the history-aware path that mutates
   * projectSettings inside a transaction.
   */
  readonly computeAutoFix: (currentValue: string, hint: string | undefined) => string;
  /**
   * History-aware Auto-fix entry (Arc D6.c, 2026-05-16). Computes the
   * fixed value, then writes it to `projectSettings.designTokens` inside
   * a labeled transaction so HistoryManager captures ONE undoable entry.
   *
   * Returns the fixed value when the token was found and the value
   * actually changed, otherwise `null` (caller may decide whether to
   * still suppress the lint row).
   *
   * React-side registries follow this update via the existing
   * `project:changed` event — TokensSection re-hydrates all 14 kind
   * registries on every emission, so Cmd+Z roundtrips back into the UI.
   */
  readonly applyAutoFix: (tokenId: string, hint: string | undefined) => string | null;
  /**
   * AI token write (W4 set-token). Models on `applyAutoFix`: looks the token up
   * in `projectSettings.designTokens`, validates the value against the token's
   * `type` (the trust boundary — see tokenValueGuard), and writes it inside a
   * labeled transaction so the `project:changed` re-hydration in TokensSection
   * re-applies the live CSS var AND Cmd+Z roundtrips through the same path.
   *
   * Returns the new value on success, or `null` when the id is unknown, the
   * type is not AI-editable, the value fails its format guard, or it is a no-op.
   * The single engine write path means the AI never touches the React hooks.
   */
  readonly setDesignToken: (tokenId: string, value: string) => string | null;
  /**
   * THE token write (spec §4: one undo stack). Validates the whole v6 set
   * and writes `projectSettings.designTokens` + schema version 6 inside one
   * labelled transaction, so a multi-token edit is one ⌘Z step shared with
   * canvas history. Brand, "Update everywhere", import, starters, auto-fix
   * and the AI write all land here. Returns false and writes nothing when
   * the tokens are read-only or the set does not validate. A successful
   * write announces `EVENTS.BRAND_APPLIED` (onboarding's "Set your brand").
   * Also refuses a write that would remove a token the site still uses, or
   * whose usage cannot be counted yet (spec §6) — soft delete via
   * `replacedBy` keeps the token and is never refused for that.
   */
  readonly setTokens: (next: DesignToken[], label: string) => boolean;
  /** The canvas preview, or null. Set only through `setPreview`. */
  preview: BrandPreview | null;
  /** Paint `p` on the canvas instead of the saved tokens (null = back to the
   *  saved ones). Touches neither settings nor history. */
  readonly setPreview: (p: BrandPreview | null) => void;
  /**
   * Writes the site's Dark mode AND its tokens in ONE transaction (one ⌘Z).
   * Tokens are always written — `tokens` when given, else the current merged
   * set — because the save path keeps the stored darkMode when a payload
   * carries no designTokens (sites.service withCheckedTokens). False, and
   * nothing written, when read-only or the token write is refused.
   */
  readonly setDarkMode: (mode: DarkMode, label: string, tokens?: DesignToken[]) => boolean;
  /** Connect to tokens (spec §3): exact-match suggestions over every page,
   *  or one. Skips component instances and masters (owner, OQ-5). */
  readonly connectSuggestions: (pageId?: string) => ConnectSuggestion[];
  /** Binds the picked suggestions (base styles and breakpoint overrides) in
   *  ONE transaction; returns the style writes made — 0 when read-only or
   *  nothing applies. No restore point (owner, OQ-4): ⌘Z covers it. */
  readonly applyConnect: (picks: ReadonlyArray<{ key: string; tokenId: string }>) => number;
}
