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

const CATALOG_LAST_UPDATED = "2026-04-12";

export interface ComponentsSectionProps {
  composer: Composer | null;
  /** Opens the AI assist modal — wired by DesignSystemTab. */
  onOpenAIAssist?: () => void;
}

// ─── Layout / style tokens (inline per chrome convention) ────────────────────

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  overflowY: "auto",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 12px 4px",
  gap: 8,
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--bd-fg-primary)",
};

const headerSubtitleStyle: React.CSSProperties = {
  padding: "0 12px 10px",
  fontSize: 11,
  color: "var(--bd-fg-muted)",
};

const openPanelButtonStyle: React.CSSProperties = {
  padding: "4px 10px",
  background: "var(--bd-accent)",
  color: "#fff",
  border: "1px solid var(--bd-accent)",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
};

const cardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
  gap: 8,
  padding: "0 12px",
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: 8,
  border: "1px solid var(--bd-border)",
  borderRadius: 8,
  background: "var(--bd-bg-elevated, var(--bd-bg))",
  minHeight: 116,
};

const previewBoxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: 44,
  marginBottom: 6,
  borderRadius: 4,
  background: "var(--bd-bg-subtle)",
  fontSize: 10,
  color: "var(--bd-fg-muted)",
};

const cardNameStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--bd-fg-primary)",
  marginBottom: 2,
};

const cardMetaStyle: React.CSSProperties = {
  fontSize: 10,
  color: "var(--bd-fg-muted)",
  lineHeight: 1.4,
};

const aiRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 12px 4px",
  gap: 8,
};

const aiCtaTextStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--bd-accent)",
};

const aiDescStyle: React.CSSProperties = {
  padding: "0 12px 12px",
  fontSize: 11,
  color: "var(--bd-fg-muted)",
};

const aiButtonStyle: React.CSSProperties = {
  padding: "4px 10px",
  background: "transparent",
  color: "var(--bd-accent)",
  border: "1px solid var(--bd-accent)",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
};

const savedHeaderStyle: React.CSSProperties = {
  padding: "8px 12px 6px",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--bd-fg-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const emptySavedStyle: React.CSSProperties = {
  margin: "0 12px 16px",
  padding: "12px",
  border: "1px dashed var(--bd-border)",
  borderRadius: 8,
  fontSize: 11,
  color: "var(--bd-fg-muted)",
  textAlign: "center",
};

const footerCalloutStyle: React.CSSProperties = {
  margin: "16px 12px 16px",
  padding: "10px 12px",
  background: "var(--bd-info-bg, rgba(45,109,255,0.06))",
  border: "1px solid var(--bd-info-border, rgba(45,109,255,0.16))",
  borderRadius: 8,
  fontSize: 11,
  color: "var(--bd-fg-secondary)",
  lineHeight: 1.5,
};

// ─── Mini preview swatches per catalog id ────────────────────────────────────

function CatalogPreview({ component }: { component: ComponentType }): React.ReactElement {
  switch (component.id) {
    case "button":
      return (
        <div
          style={{
            padding: "3px 10px",
            background: "var(--bd-accent)",
            color: "#fff",
            borderRadius: 4,
            fontSize: 10,
          }}
        >
          Btn
        </div>
      );
    case "input":
      return (
        <div
          style={{
            width: "70%",
            height: 16,
            background: "var(--bd-bg)",
            border: "1px solid var(--bd-border)",
            borderRadius: 3,
          }}
        />
      );
    case "card":
      return (
        <div
          style={{
            width: "70%",
            height: 28,
            border: "1px solid var(--bd-border)",
            borderRadius: 4,
            background: "var(--bd-bg)",
          }}
        />
      );
    case "modal":
      return (
        <div
          style={{
            width: "70%",
            height: 28,
            background: "var(--bd-bg)",
            border: "1px solid var(--bd-border)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            borderRadius: 4,
          }}
        />
      );
    case "section":
      return (
        <div
          style={{
            width: "80%",
            height: 22,
            background: "var(--bd-bg-subtle)",
            borderRadius: 3,
          }}
        />
      );
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
    <div style={containerStyle} data-components-catalog data-mode="summary">
      <div style={headerRowStyle}>
        <div style={headerTitleStyle}>
          Catalog · {CATALOG.length} polished components shipped
        </div>
        <button
          type="button"
          onClick={() => dispatchOpenComponentsPanel(composer)}
          data-open-components-panel
          style={openPanelButtonStyle}
        >
          Open Components
        </button>
      </div>
      <div style={headerSubtitleStyle}>
        Buildrik catalog v3 · last updated {CATALOG_LAST_UPDATED}
      </div>

      <div style={cardGridStyle} data-catalog-grid>
        {CATALOG.map((component) => {
          const variantCount = component.variants.length;
          const instanceCount = getInstanceCount(composer, component.id);
          return (
            <div key={component.id} data-catalog-card={component.id} style={cardStyle}>
              <div style={previewBoxStyle}>
                <CatalogPreview component={component} />
              </div>
              <div style={cardNameStyle}>{component.name}</div>
              <div style={cardMetaStyle}>
                {variantCount} variant{variantCount === 1 ? "" : "s"} ·{" "}
                {instanceCount} instance{instanceCount === 1 ? "" : "s"}
              </div>
            </div>
          );
        })}
      </div>

      <div style={aiRowStyle}>
        <div style={aiCtaTextStyle} data-ai-assist-cta>
          + Add via AI-assist
        </div>
        <button
          type="button"
          onClick={onOpenAIAssist}
          disabled={!onOpenAIAssist}
          data-open-ai-assist
          style={{
            ...aiButtonStyle,
            opacity: onOpenAIAssist ? 1 : 0.5,
            cursor: onOpenAIAssist ? "pointer" : "not-allowed",
          }}
        >
          Open AI-assist
        </button>
      </div>
      <div style={aiDescStyle}>
        Describe a component — Claude drafts a schema. Preview before adopt.
      </div>

      <div style={savedHeaderStyle} data-saved-header>
        Your saved components · {savedComponents.length}
      </div>

      {savedComponents.length === 0 ? (
        <div style={emptySavedStyle} data-saved-empty>
          No saved components yet — save a selection from the canvas to start.
        </div>
      ) : (
        <div style={{ ...cardGridStyle, paddingBottom: 4 }} data-saved-grid>
          {savedComponents.map((component) => {
            const instanceCount = getInstanceCount(composer, component.id);
            return (
              <div
                key={component.id}
                data-saved-card={component.id}
                style={cardStyle}
              >
                <div style={previewBoxStyle}>
                  <span style={{ fontSize: 10, color: "var(--bd-fg-muted)" }}>
                    {component.name.slice(0, 4)}
                  </span>
                </div>
                <div style={cardNameStyle}>{component.name}</div>
                <div style={cardMetaStyle}>
                  1 master · {instanceCount} instance{instanceCount === 1 ? "" : "s"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={footerCalloutStyle} data-readonly-footer>
        <strong>Read-only by design:</strong> Components live as their own rail
        panel. The Design tab summary lets users see what's installed without
        leaving Design context — but every CTA on this page jumps to the
        Components panel for actual authoring.
      </div>
    </div>
  );
};
