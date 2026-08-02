/**
 * ComponentsSection (Arc D2) — read-only summary per prototype s04.
 *
 * Reverts the Arc B2 functional catalog (filter pills + search + live
 * CatalogSection/UserSavedSection) back to the prototype s04 shape: a
 * read-only catalog card grid + "+ Add via AI-assist" CTA + saved
 * components grid + "Read-only by design" footer callout.
 *
 * The rail Components tab remains the canonical interactive catalog;
 * the DS Components sub-tab is a summary that jumps users into it via
 * the "Open Components panel" CTA (dispatched as a
 * `buildrik:openRailTab` window event for AquibraStudio to listen).
 *
 * AI-assist CTA delegates to the parent DesignSystemTab via the
 * `onOpenAIAssist` callback — same modal as the header `[data-ai-entry]`
 * button.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine/Composer";
import { CATALOG } from "../../../components-catalog/catalog";
import type { ComponentType } from "../../../components-catalog/types";
import type { ComponentDefinition } from "../../../../shared/types/components";
import { Button } from "@/editor/chrome-ui";
const CATALOG_LAST_UPDATED = "2026-04-12";

export interface ComponentsSectionProps {
  composer: Composer | null;
  /** Opens the AI assist modal — wired by DesignSystemTab. */
  onOpenAIAssist?: () => void;
}

// ─── Layout / style tokens (inline per chrome convention) ────────────────────

/* Two token fallbacks in here fell back to a hand-mixed copy of the token
   itself — `var(--bk-accent-tint, rgba(45,109,255,0.06))`. If the token ever
   failed to resolve, the fallback would silently ship a different blue; it
   resolves, so the second argument was dead weight carrying a second source of
   truth for the same colour. */
const CONTAINER = "tw:flex tw:flex-col tw:h-full tw:min-h-0 tw:overflow-y-auto";
const HEADER_ROW = "tw:flex tw:items-center tw:justify-between tw:px-3 tw:pt-3 tw:pb-1 tw:gap-2";
const HEADER_TITLE = "tw:text-xs tw:font-semibold tw:text-gray-900";
const HEADER_SUB = "tw:px-3 tw:pb-2.5 tw:text-[11px] tw:text-gray-500";
const CARD_GRID = "tw:grid tw:[grid-template-columns:repeat(auto-fill,minmax(110px,1fr))] tw:gap-2 tw:px-3";
const CARD = "tw:flex tw:flex-col tw:p-2 tw:border tw:border-gray-200 tw:rounded-lg tw:bg-white tw:min-h-29";
const PREVIEW_BOX =
  "tw:flex tw:items-center tw:justify-center tw:h-11 tw:mb-1.5 tw:rounded tw:bg-gray-50 tw:text-[10px] tw:text-gray-500";
const CARD_NAME = "tw:text-[11px] tw:font-semibold tw:text-gray-900 tw:mb-0.5";
const CARD_META = "tw:text-[10px] tw:text-gray-500 tw:leading-[1.4]";
const AI_ROW = "tw:flex tw:items-center tw:justify-between tw:px-3 tw:pt-4 tw:pb-1 tw:gap-2";
const AI_CTA = "tw:text-xs tw:font-medium tw:text-blue-700";
const AI_DESC = "tw:px-3 tw:pb-3 tw:text-[11px] tw:text-gray-500";
const SAVED_HEADER =
  "tw:px-3 tw:pt-2 tw:pb-1.5 tw:text-[11px] tw:font-semibold tw:text-[var(--bk-ink-soft)] tw:uppercase tw:tracking-[0.04em]";
const EMPTY_SAVED =
  "tw:mx-3 tw:mb-4 tw:p-3 tw:border tw:border-dashed tw:border-gray-200 tw:rounded-lg tw:text-[11px] tw:text-gray-500 tw:text-center";
const FOOTER_CALLOUT =
  "tw:m-4 tw:mx-3 tw:px-3 tw:py-2.5 tw:bg-[var(--bk-accent-tint)] tw:border tw:border-[var(--bk-accent-subtle)] " +
  "tw:rounded-lg tw:text-[11px] tw:text-[var(--bk-ink-soft)] tw:leading-normal";
/** The sketch vocabulary — a fake control on a muted plate. */
const SKETCH = "tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-sm";

// ─── Mini preview swatches per catalog id ────────────────────────────────────

function CatalogPreview({ component }: { component: ComponentType }): React.ReactElement {
  switch (component.id) {
    case "button":
      return <div className="tw:px-2.5 tw:py-[3px] tw:bg-blue-700 tw:text-white tw:rounded tw:text-[10px]">Btn</div>;
    case "input":
      return <div className={`${SKETCH} tw:w-[70%] tw:h-4`} />;
    case "card":
      return <div className={`${SKETCH} tw:w-[70%] tw:h-7 tw:rounded`} />;
    case "modal":
      return <div className={`${SKETCH} tw:w-[70%] tw:h-7 tw:rounded tw:[box-shadow:var(--bk-shadow-raised)]`} />;
    case "section":
      return <div className="tw:w-4/5 tw:h-5.5 tw:bg-gray-100 tw:rounded-sm" />;
    default:
      return <span>{component.name.slice(0, 4)}</span>;
  }
}

// ─── Instance counting helpers ───────────────────────────────────────────────

function getSavedComponents(composer: Composer | null): ComponentDefinition[] {
  if (!composer) return [];
  const mgr = composer.components;
  if (!mgr || typeof mgr.getAllComponents !== "function") return [];
  try {
    return mgr.getAllComponents();
  } catch {
    return [];
  }
}

function getInstanceCount(composer: Composer | null, componentId: string): number {
  if (!composer) return 0;
  const mgr = composer.components;
  if (!mgr || typeof mgr.getInstancesOfComponent !== "function") return 0;
  try {
    return mgr.getInstancesOfComponent(componentId).length;
  } catch {
    return 0;
  }
}

// ─── Open-rail-tab event helper ──────────────────────────────────────────────
//
// Uses the existing `ui:switch-tab` composer event that StudioPanels already
// subscribes to (see StudioPanels.tsx ~L246). The original v1 dispatched a
// `buildrik:openRailTab` window CustomEvent — no shell listener existed, so
// the button was a silent no-op in production. Reusing the composer channel
// avoids adding a parallel listener path.

function dispatchOpenComponentsPanel(composer: ComponentsSectionProps["composer"]): void {
  if (!composer || typeof composer.emit !== "function") return;
  composer.emit("ui:switch-tab", { tab: "components" });
}

// ─── Component ───────────────────────────────────────────────────────────────

export const ComponentsSection: React.FC<ComponentsSectionProps> = ({
  composer,
  onOpenAIAssist,
}) => {
  const savedComponents = React.useMemo(() => getSavedComponents(composer), [composer]);

  return (
    <div className={CONTAINER} data-components-catalog data-mode="summary">
      <div className={HEADER_ROW}>
        <div className={HEADER_TITLE}>
          Catalog · {CATALOG.length} polished components shipped
        </div>
        <Button
          type="button"
          size="xs"
          onClick={() => dispatchOpenComponentsPanel(composer)}
          data-open-components-panel
        >
          Open Components
        </Button>
      </div>
      <div className={HEADER_SUB}>
        Buildrick catalog v3 · last updated {CATALOG_LAST_UPDATED}
      </div>

      <div className={CARD_GRID} data-catalog-grid>
        {CATALOG.map((component) => {
          const variantCount = component.variants.length;
          const instanceCount = getInstanceCount(composer, component.id);
          return (
            <div key={component.id} data-catalog-card={component.id} className={CARD}>
              <div className={PREVIEW_BOX}>
                <CatalogPreview component={component} />
              </div>
              <div className={CARD_NAME}>{component.name}</div>
              <div className={CARD_META}>
                {variantCount} variant{variantCount === 1 ? "" : "s"} ·{" "}
                {instanceCount} instance{instanceCount === 1 ? "" : "s"}
              </div>
            </div>
          );
        })}
      </div>

      <div className={AI_ROW}>
        <div className={AI_CTA} data-ai-assist-cta>
          + Add via AI-assist
        </div>
        <Button
          type="button"
          color="light"
          size="xs"
          onClick={onOpenAIAssist}
          disabled={!onOpenAIAssist}
          data-open-ai-assist
          className="tw:border-blue-700 tw:bg-transparent tw:text-blue-700"
        >
          Open AI-assist
        </Button>
      </div>
      <div className={AI_DESC}>
        Describe a component — Claude drafts a schema. Preview before adopt.
      </div>

      <div className={SAVED_HEADER} data-saved-header>
        Your saved components · {savedComponents.length}
      </div>

      {savedComponents.length === 0 ? (
        <div className={EMPTY_SAVED} data-saved-empty>
          No saved components yet — save a selection from the canvas to start.
        </div>
      ) : (
        <div className={`${CARD_GRID} tw:pb-1`} data-saved-grid>
          {savedComponents.map((component) => {
            const instanceCount = getInstanceCount(composer, component.id);
            return (
              <div
                key={component.id}
                data-saved-card={component.id}
                className={CARD}
              >
                <div className={PREVIEW_BOX}>
                  <span className="tw:text-[10px] tw:text-gray-500">
                    {component.name.slice(0, 4)}
                  </span>
                </div>
                <div className={CARD_NAME}>{component.name}</div>
                <div className={CARD_META}>
                  1 master · {instanceCount} instance{instanceCount === 1 ? "" : "s"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={FOOTER_CALLOUT} data-readonly-footer>
        <strong>Read-only by design:</strong> Components live as their own rail
        panel. The Design tab summary lets users see what's installed without
        leaving Design context — but every CTA on this page jumps to the
        Components panel for actual authoring.
      </div>
    </div>
  );
};
