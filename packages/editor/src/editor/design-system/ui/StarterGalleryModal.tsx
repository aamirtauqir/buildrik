/**
 * Phase F.1 / Tier-1 wireframe S14: Starter DS gallery first-run modal.
 *
 * On new project create, user picks a starter DS (or skips). The chosen
 * starter's tokens become the project's initial DS — applied via
 * onApply(starterId) which the consumer routes to the token registry's
 * resetFromSaved + persistAll.
 *
 * Wires to:
 *   - STARTER_DS_REGISTRY (D6) — reads compile-time starter list
 *   - vibcoder Modal compound — focus trap, ESC, overlay, ARIA
 *
 * Out-of-scope:
 *   - Apply-on-existing-canvas with element preservation (consumer + future)
 *   - Per-starter component preview (Phase F.2)
 *   - Custom starter import (Phase F.3 — accepts JSON token blob)
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/shared/vibcoder/Button";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalTitle,
} from "@/editor/shared/vibcoder";
import { STARTER_DS_REGISTRY, type StarterDS } from "../starters";

export interface StarterGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (starterId: string) => void;
  onSkip?: () => void;
}

export const StarterGalleryModal: React.FC<StarterGalleryModalProps> = ({
  open,
  onOpenChange,
  onApply,
  onSkip,
}) => {
  const [selectedId, setSelectedId] = React.useState<string>(STARTER_DS_REGISTRY[0]?.id ?? "");
  const selected = React.useMemo(
    () => STARTER_DS_REGISTRY.find((s) => s.id === selectedId),
    [selectedId]
  );

  const handleApply = React.useCallback(() => {
    if (selectedId) onApply(selectedId);
    onOpenChange(false);
  }, [onApply, onOpenChange, selectedId]);

  const handleSkip = React.useCallback(() => {
    onSkip?.();
    onOpenChange(false);
  }, [onSkip, onOpenChange]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="xl" aria-labelledby="starter-gallery-title">
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--bd-border, #e2e8f0)" }}>
          <ModalTitle id="starter-gallery-title" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>
            Pick a starter design system
          </ModalTitle>
          <ModalDescription style={{ fontSize: 13, color: "var(--bd-text-muted, #64748b)", marginTop: 4 }}>
            Each starter ships tokens with light + dark values. You can edit anything later.
          </ModalDescription>
        </div>

        <div
          role="radiogroup"
          aria-label="Starter design systems"
          style={{
            padding: "24px 28px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {STARTER_DS_REGISTRY.map((s) => (
            <StarterCard
              key={s.id}
              starter={s}
              selected={s.id === selectedId}
              onSelect={() => setSelectedId(s.id)}
            />
          ))}
        </div>

        <ModalFooter style={{ padding: "16px 28px", borderTop: "1px solid var(--bd-border, #e2e8f0)" }}>
          <div style={{ fontSize: 11, color: "var(--bd-text-muted, #64748b)", marginRight: "auto" }}>
            Tip: applying a starter restyles tokens but keeps your elements.
          </div>
          <Button variant="ghost" size="sm" type="button" onClick={handleSkip}>
            Skip
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={handleApply}
            disabled={!selected}
          >
            Apply {selected?.name ?? ""}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface StarterCardProps {
  starter: StarterDS;
  selected: boolean;
  onSelect: () => void;
}

function StarterCard({ starter, selected, onSelect }: StarterCardProps) {
  const primary = starter.tokens.find((t) => t.id === "color-primary")?.value ?? "#2D6DFF";
  const background = starter.tokens.find((t) => t.id === "color-background")?.value ?? "#fff";
  const text = starter.tokens.find((t) => t.id === "color-text")?.value ?? "#0f172a";

  return (
    <Button
      type="button"
      variant="ghost"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      style={{
        all: "unset",
        cursor: "pointer",
        borderRadius: 8,
        overflow: "hidden",
        border: selected
          ? "2px solid var(--bd-accent, #2D6DFF)"
          : "1px solid var(--bd-border, #e2e8f0)",
        boxShadow: selected ? "0 0 0 2px rgba(45, 109, 255, 0.16)" : "none",
        display: "flex",
        flexDirection: "column",
        background: "var(--bd-surface, #fff)",
      }}
    >
      <div
        style={{
          height: 80,
          background: `linear-gradient(135deg, ${primary}, ${background})`,
          display: "grid",
          placeItems: "center",
          color: text,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {starter.name}
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--bd-text, #0f172a)" }}>
          {starter.name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--bd-text-muted, #64748b)",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {starter.description}
        </div>
      </div>
    </Button>
  );
}
