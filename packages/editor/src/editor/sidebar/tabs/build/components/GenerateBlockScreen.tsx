/**
 * GenerateBlockScreen — Add › "Generate a block" (G2-117).
 *
 * Boards: composer 5946:51667 (target band · describe field · TRY prompts ·
 * note · GENERATE), thinking 6881:82175 ("Generating your block…" · Stop),
 * inserted 6881:78961 (green band "Block inserted after {target}", what
 * changed, Undo · Done).
 *
 * One single-shot AI run (runPromptOnce, page scope) asked for one new
 * section after the target; the edit lands through applyAiEdit, which wraps it
 * in ONE transaction — so Undo is one history step. The daily counter
 * ("7 generations left today") draws only when the ai.quota read answers
 * (useAiQuota, G2-129).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Button, PanelBackRow, Textarea, useToast } from "@/editor/chrome-ui";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { WORKSPACE_LINKS } from "../../settings/constants";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { ELEMENT_TYPE_LABELS } from "@/shared/constants/elementTypeLabels";
import { applyAiEdit } from "../../ai/applySetStyle";
import { runPromptOnce, AiRunError, type AiErrorKind, type ServerEdit } from "../../ai/hooks/runPromptOnce";
import { gatherTokens, gatherMediaAssets } from "../../ai/hooks/aiScopeContext";
import { DEFAULT_MODEL } from "../../ai/types";
import { useAiQuota, quotaLeftLabel } from "../../ai/hooks/useAiQuota";

/** Where the new block goes: after this top-level element of the page. */
export interface GenerateTarget {
  afterId: string | null;
  label: string;
}

/** The selection's top-level ancestor, else the page's last top-level child. */
export function generateTarget(composer: Composer): GenerateTarget {
  const page = composer.elements.getActivePage();
  const root = page?.root?.id ? composer.elements.getElement(page.root.id) : null;
  const pageName = page?.name ?? "Page";
  if (!root) return { afterId: null, label: pageName };
  let el = composer.elements.getElement(composer.selection.getSelectedIds()[0] ?? "") ?? null;
  while (el && el.getParent() && el.getParent()?.getId() !== root.getId()) el = el.getParent();
  const top = el && el.getParent()?.getId() === root.getId() ? el : root.getChildren().at(-1) ?? null;
  if (!top) return { afterId: null, label: pageName };
  const type = top.getType();
  const name = getLayerName(top) ?? ELEMENT_TYPE_LABELS[type] ?? type;
  return { afterId: top.getId(), label: `${pageName} · after ${name}` };
}

export type GenerateFn = (composer: Composer, prompt: string, target: GenerateTarget) => Promise<ServerEdit | null>;

/** The real run: one page-scope prompt, applied as one undo step. */
const generateBlock: GenerateFn = async (composer, prompt, target) => {
  const elements = composer.elements.getAllElements().slice(0, 200).map((el) => ({
    id: el.getId(),
    type: el.getType(),
    text: el.getContent?.() ? String(el.getContent()).slice(0, 200) : undefined,
  }));
  const place = target.afterId ? `after element ${target.afterId}` : "at the end of the page";
  const { edit } = await runPromptOnce({
    prompt: `Add ONE new section ${place} (use add-section): ${prompt}`,
    scope: { kind: "page", elements, tokens: gatherTokens(composer), assets: gatherMediaAssets(composer) },
    model: DEFAULT_MODEL,
    intent: "style-command",
  });
  if (edit && edit.rows.length > 0) await applyAiEdit(composer, { applyOps: edit.applyOps });
  return edit;
};

const EXAMPLES = [
  "A three-column feature grid with icons",
  "A testimonial carousel with photos",
  "An FAQ accordion with common questions",
] as const;

/* The three failure cards (6881:76122 no provider · 6881:75906 out of credit
   · 6881:76336 service error). Each says nothing changed and offers a way on. */
const ERROR_TITLE: Record<AiErrorKind, string> = {
  "not-configured": "AI isn't available on this workspace.",
  quota: "AI is out of credit.",
  other: "The AI service didn't respond.",
};

const errorBody = (kind: AiErrorKind, limit: number | null): string =>
  kind === "not-configured"
    ? "No AI provider is configured for this deployment. Ask your workspace owner to arrange setup with the deployment administrator. Nothing has changed on your site."
    : kind === "quota"
      ? `Nothing was changed. Daily limit reached${limit !== null && limit >= 0 ? ` (${limit})` : ""}. Resets at midnight UTC.`
      : "Nothing changed. Your request timed out. Your prompt is still here; try again when the service is available.";

const LINK = "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-accent)] tw:no-underline tw:hover:underline";
const LINK_BTN =
  "tw:h-auto tw:self-start tw:border-0 tw:bg-transparent tw:p-0 tw:text-[11px] tw:leading-4 tw:font-normal tw:text-[var(--bk-accent)] tw:hover:underline tw:focus:ring-0";

type Phase = { kind: "idle" } | { kind: "thinking" } | { kind: "inserted"; edit: ServerEdit } | { kind: "error"; error: AiErrorKind };

interface Props {
  composer: Composer;
  onBack: () => void;
  /** Injected in tests; defaults to the real run. */
  generate?: GenerateFn;
}

const BAND = "tw:px-4 tw:py-2 tw:text-[12px] tw:leading-[18px]";

export const GenerateBlockScreen: React.FC<Props> = ({ composer, onBack, generate = generateBlock }) => {
  const [text, setText] = React.useState("");
  const [phase, setPhase] = React.useState<Phase>({ kind: "idle" });
  const target = React.useMemo(() => generateTarget(composer), [composer]);
  const runId = React.useRef(0);
  const quota = useAiQuota(phase.kind);
  const quotaLabel = quota && quotaLeftLabel(quota, phase.kind === "idle" ? "generations" : undefined);

  const { addToast } = useToast();
  const rootChildIds = () => {
    const rootId = composer.elements.getActivePage()?.root?.id;
    const root = rootId ? composer.elements.getElement(rootId) : null;
    return root?.getChildren().map((c) => c.getId()) ?? [];
  };

  const run = async () => {
    const id = ++runId.current;
    setPhase({ kind: "thinking" });
    const before = new Set(rootChildIds());
    try {
      const edit = await generate(composer, text.trim(), target);
      if (id !== runId.current) return;
      if (!edit || edit.rows.length === 0) {
        setPhase({ kind: "error", error: "other" });
        return;
      }
      // Board 6881:74045: the new section is what's selected afterwards.
      const added = rootChildIds().find((c) => !before.has(c));
      const addedEl = added ? composer.elements.getElement(added) : null;
      if (addedEl) composer.selection.select(addedEl);
      setPhase({ kind: "inserted", edit });
    } catch (e) {
      if (id !== runId.current) return;
      setPhase({ kind: "error", error: e instanceof AiRunError ? e.kind : "other" });
    }
  };

  // Done (6881:74045): back to Add, and the insert stays one Undo away.
  const done = () => {
    addToast({ description: "Block added", action: { label: "Undo", onClick: () => composer.history.undo() } });
    onBack();
  };

  // Stop: the result of the run in flight is ignored.
  const stop = () => {
    runId.current++;
    setPhase({ kind: "idle" });
  };

  const undo = () => {
    composer.history.undo();
    setPhase({ kind: "idle" });
  };

  const afterName = target.label.includes(" · after ") ? target.label.split(" · after ")[1] : target.label;

  return (
    <div className="tw:flex tw:flex-col tw:h-full tw:min-h-0" data-testid="generate-block">
      <PanelBackRow label="Add" onClick={onBack} data-testid="generate-back" />
      <div className="tw:flex tw:items-center tw:h-11 tw:px-4 tw:shrink-0 tw:text-[14px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">
        Generate a block
      </div>
      <div
        className={`${BAND} tw:bg-[var(--bk-accent-tint)] ${phase.kind === "idle" ? "tw:text-[var(--bk-ink-soft)]" : "tw:text-[var(--bk-accent)]"}`}
        data-testid="generate-target"
      >
        {phase.kind === "idle" ? "Target: " : "Insert into: "}
        {target.label}
      </div>

      <div className="tw:flex-1 tw:min-h-0 tw:overflow-y-auto tw:flex tw:flex-col">
        {!(phase.kind === "error" && phase.error === "not-configured") && (
        <div className="tw:px-4 tw:py-2">
          <Textarea
            aria-label="Describe the block"
            data-testid="generate-input"
            rows={2}
            value={text}
            readOnly={phase.kind !== "idle"}
            placeholder="Describe the block you need…"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim() && phase.kind === "idle") void run();
            }}
            className="tw:resize-none tw:bg-white tw:text-[13px] tw:leading-5"
          />
          {quotaLabel && (
            <div className="tw:-mt-6 tw:mr-3 tw:relative tw:text-right tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="generate-quota">
              {quotaLabel}
            </div>
          )}
        </div>
        )}

        {phase.kind === "idle" && (
          <>
            <div className="tw:px-4 tw:pt-2 tw:pb-1 tw:text-[11px] tw:leading-4 tw:font-medium tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]">TRY</div>
            {EXAMPLES.map((ex) => (
              <Button
                key={ex}
                color="light"
                data-testid="generate-example"
                onClick={() => setText(ex)}
                className="tw:h-auto tw:min-h-[26px] tw:justify-start tw:text-left tw:border-0 tw:bg-transparent tw:px-4 tw:py-1 tw:text-[13px] tw:leading-[18px] tw:font-normal tw:text-[var(--bk-accent)] tw:focus:ring-0"
              >
                {ex}
              </Button>
            ))}
            <p className="tw:m-0 tw:px-4 tw:pt-3 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]">
              You review the draft before it lands on the page. Generated blocks use your Brand colours and fonts, and you
              can undo the insert.
            </p>
            <div className="tw:px-4 tw:pt-16 tw:pb-3 tw:flex tw:flex-col tw:gap-2">
              <div className="tw:text-[11px] tw:leading-4 tw:font-medium tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]">GENERATE</div>
              <Button
                data-testid="generate-run"
                disabled={!text.trim()}
                onClick={() => void run()}
                className="tw:h-10 tw:w-full tw:justify-start tw:px-3 tw:text-[13px] tw:font-medium tw:focus:ring-0 tw:disabled:border tw:disabled:border-[var(--bk-border)] tw:disabled:bg-white tw:disabled:text-[var(--bk-ink-muted)] tw:disabled:opacity-100"
              >
                ✦&nbsp;&nbsp;Generate a block
              </Button>
              {!text.trim() && (
                <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">Describe the block above to enable</p>
              )}
            </div>
          </>
        )}

        {phase.kind === "thinking" && (
          <>
            <div className={`${BAND} tw:py-4 tw:bg-[var(--bk-accent-tint)] tw:text-[var(--bk-accent)]`} role="status" data-testid="generate-thinking">
              Generating your block…
            </div>
            <div className="tw:px-4 tw:py-2">
              <Button color="light" data-testid="generate-stop" onClick={stop} className="tw:h-8 tw:w-[120px] tw:text-[13px] tw:focus:ring-0">
                Stop
              </Button>
            </div>
          </>
        )}

        {phase.kind === "inserted" && (
          <div className="tw:flex tw:flex-col tw:gap-1 tw:bg-[var(--bk-success-tint)] tw:px-4 tw:py-3" role="status" data-testid="generate-inserted">
            <span className="tw:text-[13px] tw:leading-5 tw:text-[var(--bk-success)]">Block inserted after {afterName}</span>
            {phase.edit.rows.slice(0, 4).map((r, i) => (
              <span key={i} className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]">
                {r.field} → {r.to}
              </span>
            ))}
            <div className="tw:flex tw:gap-2 tw:pt-2">
              <Button color="light" data-testid="generate-undo" onClick={undo} className="tw:h-8 tw:flex-1 tw:bg-white tw:text-[13px] tw:focus:ring-0">
                Undo
              </Button>
              <Button data-testid="generate-done" onClick={done} className="tw:h-8 tw:flex-1 tw:text-[13px] tw:focus:ring-0">
                Done
              </Button>
            </div>
          </div>
        )}

        {phase.kind === "error" && (
          <div
            role="alert"
            data-testid="generate-error"
            className={`tw:flex tw:flex-col tw:gap-2 tw:px-4 tw:py-3 ${
              phase.error === "quota"
                ? "tw:bg-[var(--bk-warning-tint)]"
                : phase.error === "other"
                  ? "tw:bg-[var(--bk-error-tint)]"
                  : "tw:bg-[var(--bk-bg-subtle)]"
            }`}
          >
            {phase.error === "not-configured" && (
              <span className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]">Your prompt: {text.trim()}</span>
            )}
            <span
              className={
                phase.error === "not-configured"
                  ? "tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]"
                  : "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error)]"
              }
            >
              {ERROR_TITLE[phase.error]}
            </span>
            <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
              {errorBody(phase.error, quota?.limit ?? null)}
            </span>
            {phase.error === "quota" && (
              <a className={LINK} href={`${DASHBOARD_URL}${WORKSPACE_LINKS.billing}`} target="_blank" rel="noopener noreferrer">
                Workspace billing ↗
              </a>
            )}
            {phase.error === "not-configured" && (
              <a className={LINK} href={`${DASHBOARD_URL}${WORKSPACE_LINKS.members}`} target="_blank" rel="noopener noreferrer">
                View workspace owner ↗
              </a>
            )}
            {phase.error === "other" && (
              <Button color="light" className={LINK_BTN} onClick={() => void run()}>
                Try again
              </Button>
            )}
            <Button color="light" className={LINK_BTN} onClick={onBack}>
              Continue by hand in Add
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
