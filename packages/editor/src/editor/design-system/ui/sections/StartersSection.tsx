/**
 * StartersSection — Brand › Starters, Figma 2L9 B6-B07…B11.
 *
 *   B6-B07  list      "Choose a starting point" · one row per starter, then
 *                     "From logo or URL ›" (behind dsAi, authority code:dsai-flag)
 *   B6-B08  preview   the starter on the canvas through the Brand preview
 *                     layer — "Preview only · Your Brand is unchanged", what
 *                     will change, Cancel · Apply starter. Nothing is written.
 *   B6-B09  preparing Apply first takes a "Before <starter>" restore point
 *   B6-B11  failed    no restore point → nothing applied, Cancel · Retry
 *   B6-B10  applied   one write (one ⌘Z), then the workspace's receipt
 *
 * The write itself is `withStarter` (useApplyStarter): a starter's values over
 * the site's own set, so the two-layer palette survives.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine/Composer";
import { Button } from "@/editor/chrome-ui";
import { STARTER_DS_REGISTRY } from "@/editor/design-system/starters";
import { useApplyStarter, withStarter } from "@/editor/design-system/state/useApplyStarter";
import { useBrandPreview } from "@/editor/design-system/state/useBrandPreview";
import { useGuardedApply } from "@/editor/design-system/state/useGuardedApply";
import { takeRestorePoint } from "@/editor/design-system/state/useBrandRestorePoints";
import { useProjectTokenStore } from "@/editor/design-system/state/TokenRegistryContext";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import type { StarterDS } from "@/editor/design-system/starters/types";
import type { DesignToken } from "@/editor/design-system/types";
import { BrandCard, BrandChevron, BrandRow } from "../BrandCard";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { NOTICE } from "./UsageHighlight";

export interface StartersSectionProps {
  composer?: Composer | null;
  projectId?: string | null;
  /** BRP1-M11's door (behind dsAi): absent → no row. */
  onOpenFromSource?: () => void;
  /** After a starter is applied — the workspace's receipt. */
  onApplied?: (starterName: string) => void;
}

const TITLE = "tw:m-0 tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]";
const NOTE = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";

/** How many of the site's colour tokens the starter would change (B6-B08:
 *  "4 colors will change"). Starters carry colour only. */
export function starterColourChanges(starter: StarterDS, current: readonly DesignToken[]): number {
  const next = withStarter([...current], starter.tokens);
  return current.filter((t) => {
    if (t.kind !== "color" && t.category !== "colors") return false;
    return (["light", "dark"] as const).some(
      (m) => resolveTokenLiteral(current as DesignToken[], t.id, m) !== resolveTokenLiteral(next, t.id, m),
    );
  }).length;
}

type Phase = { kind: "list" } | { kind: "preview"; starter: StarterDS; failed?: boolean } | { kind: "preparing"; starter: StarterDS };

export const StartersSection: React.FC<StartersSectionProps> = ({ composer = null, projectId, onOpenFromSource, onApplied }) => {
  const store = useProjectTokenStore();
  const applyStarter = useApplyStarter(projectId);
  const preview = useBrandPreview(composer);
  const guard = useGuardedApply();
  const [phase, setPhase] = React.useState<Phase>({ kind: "list" });

  const open = (starter: StarterDS) => {
    preview.show((tokens, settings) => ({
      tokens: withStarter(tokens, starter.tokens),
      darkMode: settings.darkMode === "auto" ? "auto" : "off",
    }));
    setPhase({ kind: "preview", starter });
  };
  const cancel = () => {
    preview.clear();
    setPhase({ kind: "list" });
  };
  const apply = (starter: StarterDS) =>
    guard.run(async () => {
      setPhase({ kind: "preparing", starter });
      const siteId = getSiteIdFromUrl();
      if (!composer || !siteId || !(await takeRestorePoint(composer, siteId, "starter"))) {
        setPhase({ kind: "preview", starter, failed: true });
        return false;
      }
      preview.clear();
      if (!applyStarter(starter.id)) {
        setPhase({ kind: "preview", starter, failed: true });
        return false;
      }
      setPhase({ kind: "list" });
      onApplied?.(starter.name);
      return true;
    });

  if (phase.kind !== "list") {
    const { starter } = phase;
    const n = starterColourChanges(starter, store.all);
    return (
      <section aria-label={`${starter.name} preview`} className="tw:flex tw:flex-col tw:gap-3" data-testid="starter-preview">
        <p className={TITLE} data-testid="starter-preview-name">{starter.name}</p>
        <p className={NOTE}>Preview only · Your Brand is unchanged</p>
        <p className={NOTE} data-testid="starter-preview-impact">
          {n === 0 ? "No colors will change." : `${n} color${n === 1 ? "" : "s"} will change.`} Typography and spacing stay as they are.
        </p>
        {phase.kind === "preparing" ? (
          <div className="tw:flex tw:flex-col tw:gap-2" role="status" data-testid="starter-preparing">
            <Button type="button" size="xs" disabled className="tw:self-start">Preparing…</Button>
            <p className={NOTE}>Creating “Before {starter.name}” restore point. No Brand changes applied yet.</p>
          </div>
        ) : (
          <>
            {phase.failed && (
              <p role="alert" className={`${NOTICE} tw:bg-[var(--bk-error-tint)]`} data-testid="starter-failed">
                Couldn’t create a restore point. Nothing was applied. Retry or cancel the preview.
              </p>
            )}
            <div className="tw:flex tw:gap-2">
              <Button type="button" variant="secondary" size="xs" onClick={cancel} data-testid="starter-cancel">
                Cancel
              </Button>
              <Button type="button" size="xs" disabled={guard.busy} onClick={() => void apply(starter)} data-testid="starter-apply">
                {phase.failed ? "Retry" : "Apply starter"}
              </Button>
            </div>
          </>
        )}
      </section>
    );
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      <div className="tw:flex tw:flex-col tw:gap-1">
        <p className={TITLE}>Choose a starting point</p>
        <p className={NOTE}>Preview a palette before applying it to your site.</p>
      </div>
      <BrandCard label="Starters" data-testid="starter-list">
        {STARTER_DS_REGISTRY.map((s) => (
          <BrandRow
            key={s.id}
            data-testid={`starter-row-${s.id}`}
            onSelect={() => open(s)}
            trailing={<BrandChevron />}
            name={<span data-testid={`starter-name-${s.id}`}>{s.name}</span>}
            title={s.description}
          />
        ))}
        {onOpenFromSource && (
          <BrandRow data-testid="starter-row-from-source" onSelect={onOpenFromSource} trailing={<BrandChevron />} name="From logo or URL" />
        )}
      </BrandCard>
    </div>
  );
};

export default StartersSection;
