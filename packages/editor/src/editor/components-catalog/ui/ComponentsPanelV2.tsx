/**
 * ComponentsPanelV2 (S6 CU4 / Arc D5) — dual-section Components panel shell.
 *
 * Spec §6.3: PanelHeader + DSStatusChip + filter pills (All|DS|Yours) +
 * search bar + CatalogSection + UserSavedSection. Filter pills purely
 * gate which sections render.
 *
 * Arc D5 prototype-s06 parity:
 *   - Header gets a `+ AI` chip-style button. If the composer has an
 *     aiAssistService, the button is enabled and we surface the same
 *     AIPromptModal that DesignSystemTab opens. With no composer (test
 *     contexts) or no service, the button falls back to a no-op + log.
 *   - Footer gets a `+ Save current selection` dashed button. Wires to
 *     composer.components.createComponent(name, selectedId) when a single
 *     element is selected; otherwise toasts + logs a TODO.
 *
 * Existing single-section ComponentsTab stays the source of truth for
 * user-saved CRUD — UserSavedSection wraps it intact (no behavioral
 * change to that surface).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
import { useToast } from "@/editor/shared/vibcoder";
import { PanelHeader } from "@/shared/extensions/PanelHeader";
import type { Composer } from "@/engine";
import { CatalogSection } from "./CatalogSection";
import { UserSavedSection } from "./UserSavedSection";
import { DSStatusChip } from "./DSStatusChip";
import { AIPromptModal } from "@/editor/design-system/ui/AIPromptModal";
import { EVENTS } from "@/shared/constants/events";

type FilterMode = "all" | "ds" | "yours";

interface ComponentsPanelV2Props {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** Caller-routed: clicking DSStatusChip jumps to Design tab. */
  onJumpToDesign?: () => void;
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--bd-bg-canvas)",
};

const subHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 12px 8px",
  borderBottom: "1px solid var(--bd-border)",
  flexWrap: "wrap",
};

const filterRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
  padding: "8px 12px",
  borderBottom: "1px solid var(--bd-border)",
};

const pillStyle = (active: boolean): React.CSSProperties => ({
  padding: "3px 10px",
  background: active ? "var(--bd-accent)" : "transparent",
  color: active ? "#fff" : "var(--bd-fg-secondary)",
  border: "1px solid",
  borderColor: active ? "var(--bd-accent)" : "var(--bd-border)",
  borderRadius: 12,
  fontSize: 11,
  cursor: "pointer",
});

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "5px 10px",
  background: "var(--bd-bg-canvas)",
  color: "var(--bd-fg-primary)",
  border: "1px solid var(--bd-border)",
  borderRadius: 6,
  fontSize: 12,
  margin: "8px 12px",
  boxSizing: "border-box",
  // width: calc(100% - 24px) accounts for the 12px margins above.
  // CSS shorthand below to keep it inline-style-portable:
};

const bodyScrollStyle: React.CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
};

const headerAiButtonStyle: React.CSSProperties = {
  padding: "3px 10px",
  background: "transparent",
  color: "var(--bd-fg-secondary)",
  border: "1px solid var(--bd-border)",
  borderRadius: 12,
  fontSize: 11,
  cursor: "pointer",
  fontFamily: "inherit",
  lineHeight: 1.4,
};

const footerSaveStyle: React.CSSProperties = {
  display: "block",
  width: "calc(100% - 24px)",
  margin: "8px 12px 12px",
  padding: "8px 10px",
  background: "transparent",
  color: "var(--bd-fg-secondary)",
  border: "1px dashed var(--bd-border)",
  borderRadius: 6,
  fontSize: 11,
  cursor: "pointer",
  textAlign: "center",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const FILTERS: Array<{ id: FilterMode; label: string }> = [
  { id: "all",   label: "All" },
  { id: "ds",    label: "DS" },
  { id: "yours", label: "Yours" },
];

export const ComponentsPanelV2: React.FC<ComponentsPanelV2Props> = ({
  composer,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
  onJumpToDesign,
}) => {
  const [filter, setFilter] = React.useState<FilterMode>("all");
  const [search, setSearch] = React.useState("");
  const [aiOpen, setAiOpen] = React.useState(false);
  const { addToast } = useToast();

  const showCatalog   = filter === "all" || filter === "ds";
  const showUserSaved = filter === "all" || filter === "yours";

  const aiService = composer?.aiAssistService ?? null;

  const handleOpenAI = React.useCallback(() => {
    if (!aiService) {
      // No composer / service in this mount (e.g. test contexts).
      // eslint-disable-next-line no-console
      console.log("TODO: AI add component — no aiAssistService available");
      return;
    }
    setAiOpen(true);
  }, [aiService]);

  const handleSaveSelection = React.useCallback(() => {
    if (!composer) return;
    const selectionIds = composer.selection.getSelectedIds();
    if (selectionIds.length !== 1) return;
    const allElements = composer.elements?.getAllElements?.() ?? [];
    const resolver = composer.designSystem?.tokenBindingResolver;
    const extractedBindings = resolver
      ? resolver.resolveForElements(selectionIds, allElements)
      : new Map<string, string>();
    composer.emit(EVENTS.COMPONENT_SAVE_AS_REQUESTED, {
      selectionIds,
      extractedBindings,
    });
  }, [composer]);

  return (
    <div style={containerStyle} data-components-panel-v2>
      <PanelHeader
        title="Components"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />

      {/* AI-entry moved from header to subheader (2026-05-23 walk):
          header had five controls in the narrow panel chrome
          (Title + Pin + Help + Close + AI pill). Pin/Help/Close are
          baseline; AI is an action that lives more naturally next to
          DSStatusChip. Keeps header pattern parity with other panels. */}
      <div style={subHeaderStyle}>
        <DSStatusChip onJumpToDesign={onJumpToDesign} />
        <div style={{ marginLeft: "auto" }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOpenAI}
            data-components-ai-entry
            aria-label="Add component via AI"
            style={headerAiButtonStyle}
          >
            + AI
          </Button>
        </div>
      </div>

      <div style={filterRowStyle} role="radiogroup" aria-label="Filter components">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            type="button"
            variant="ghost"
            size="sm"
            role="radio"
            aria-checked={filter === f.id}
            onClick={() => setFilter(f.id)}
            style={pillStyle(filter === f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div style={{ padding: "0 12px" }}>
        <Input
          type="search"
          placeholder="Search components…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search components"
          style={{ ...searchInputStyle, margin: "8px 0" }}
        />
      </div>

      <div style={bodyScrollStyle}>
        {showCatalog && <CatalogSection searchQuery={search} />}
        {showUserSaved && (
          <UserSavedSection
            composer={composer}
            searchQuery={search}
            isPinned={isPinned}
            onPinToggle={onPinToggle}
            onHelpClick={onHelpClick}
            onClose={onClose}
          />
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={handleSaveSelection}
        data-save-current-selection
        style={footerSaveStyle}
      >
        + Save current selection
      </Button>

      <AIPromptModal
        open={aiOpen}
        onOpenChange={setAiOpen}
        service={aiService}
        onAccept={(schema) => {
          // Gap B (Arc D-final) — schema-storage-only descope. Full canvas
          // insert (schema tree → createElement walk → createComponent)
          // requires composer.components.createComponentFromSchema, which
          // doesn't exist yet. Until that engine API lands, we persist the
          // schema to localStorage so the user's work isn't lost and the
          // AI entry point is honest about its current behavior.
          //
          // Modal-close semantics: AIPromptModal.handleAccept calls
          // onOpenChange(false) AFTER this callback returns. On the happy
          // path we want the modal to close (let the modal's own call do
          // that). On the error path we re-open via a microtask so the
          // user can retry — the microtask runs after the modal's
          // synchronous close-flip lands.
          if (!composer) return;
          try {
            const projectId =
              (composer as unknown as { projectId?: string }).projectId ?? "default";
            const key = `buildrik-ai-pending-schemas-${projectId}`;
            const existing = (() => {
              try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : [];
              } catch {
                return [];
              }
            })();
            const next = Array.isArray(existing) ? [...existing, schema] : [schema];
            localStorage.setItem(key, JSON.stringify(next));
            addToast({
              tone: "success",
              description: "Schema saved · canvas insert ships in a follow-up arc",
            });
            // Modal closes via its own onOpenChange(false) call — no-op here.
          } catch (e) {
            addToast({
              tone: "error",
              description: e instanceof Error ? e.message : "Could not save schema",
            });
            // Re-open after the modal's synchronous onOpenChange(false) fires.
            Promise.resolve().then(() => setAiOpen(true));
          }
        }}
      />
    </div>
  );
};
