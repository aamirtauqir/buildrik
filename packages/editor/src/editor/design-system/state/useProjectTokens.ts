/**
 * useProjectTokens — the site's tokens, read from and written to the project.
 *
 * There is no React-side copy and no staging (spec §4, Brand Part 1a Task 10):
 * `all` is `projectSettings.designTokens` merged over the seed, re-read on
 * every settings change (an edit, ⌘Z, "Update everywhere", the AI write), and
 * `commit` is `composer.designSystem.setTokens` — one transaction, one undo
 * step, refused while the tokens are read-only. The canvas repaints from that
 * same write (ProjectTokensApplier's <style>).
 *
 * A read-only site (its tokens failed to migrate) shows what the canvas shows:
 * its old tokens (`tokensForEmit`), never the seed the strict merge falls
 * back to. Nothing is written back from that list — `commit` refuses.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { DesignToken } from "../types";
import { EVENTS } from "@/shared/constants/events";
import { mergeProjectTokens, tokensForEmit } from "@/engine/designSystem/projectTokens";

export interface ProjectTokens {
  /** Every token the site has, all kinds. */
  all: DesignToken[];
  readOnly: boolean;
  /** Why it is read-only; null when it is not. */
  readOnlyReason: string | null;
  /** One labelled write of the whole set. False when refused (read-only,
   *  invalid, no composer) — nothing was written. */
  commit: (next: DesignToken[], label: string) => boolean;
}

/* Fourteen kind registries read the same settings object on every change; the
   merge (migrate + validate) runs once per saved list, not once per reader. */
const NO_SAVED_TOKENS: readonly unknown[] = [];
const mergedCache = new WeakMap<readonly unknown[], DesignToken[]>();
const emitCache = new WeakMap<readonly unknown[], DesignToken[]>();

export function readTokens(composer: Composer | null): DesignToken[] {
  const settings = composer?.getProjectSettings();
  const saved: readonly unknown[] = settings?.designTokens ?? NO_SAVED_TOKENS;
  const readOnly = composer?.designSystem.readOnly ?? false;
  const cache = readOnly ? emitCache : mergedCache;
  let tokens = cache.get(saved);
  if (!tokens) {
    tokens = readOnly
      ? tokensForEmit(settings, { migrate: composer?.designSystem.brandTokensV2 !== false })
      : mergeProjectTokens(saved, settings?.designTokensSchemaVersion);
    cache.set(saved, tokens);
  }
  return tokens;
}

export function useProjectTokens(composer: Composer | null): ProjectTokens {
  const [all, setAll] = React.useState<DesignToken[]>(() => readTokens(composer));
  const [readOnly, setReadOnly] = React.useState(() => composer?.designSystem.readOnly ?? false);
  const [readOnlyReason, setReadOnlyReason] = React.useState(() => composer?.designSystem.readOnlyReason ?? null);

  React.useEffect(() => {
    const sync = () => {
      setAll(readTokens(composer));
      setReadOnly(composer?.designSystem.readOnly ?? false);
      setReadOnlyReason(composer?.designSystem.readOnlyReason ?? null);
    };
    sync();
    if (!composer) return;
    composer.on(EVENTS.SETTINGS_CHANGE, sync);
    composer.on(EVENTS.PROJECT_LOADED, sync);
    composer.on(EVENTS.DESIGN_SYSTEM_READ_ONLY, sync);
    return () => {
      composer.off(EVENTS.SETTINGS_CHANGE, sync);
      composer.off(EVENTS.PROJECT_LOADED, sync);
      composer.off(EVENTS.DESIGN_SYSTEM_READ_ONLY, sync);
    };
  }, [composer]);

  const commit = React.useCallback(
    (next: DesignToken[], label: string) => composer?.designSystem.setTokens(next, label) ?? false,
    [composer],
  );

  return React.useMemo(() => ({ all, readOnly, readOnlyReason, commit }), [all, readOnly, readOnlyReason, commit]);
}
