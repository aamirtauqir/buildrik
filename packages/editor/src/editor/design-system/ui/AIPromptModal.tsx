/**
 * Phase C UI / Tier-2 wireframe S8: AI prompt modal.
 *
 * User describes a component in natural language, the modal calls
 * AIAssistService.generateComponentSchema, then renders the produced
 * schema for confirmation. On confirm, the consumer routes the schema
 * to the catalog (out-of-scope for this phase — `onAccept` callback
 * receives the schema and decides).
 *
 * States:
 *   - "idle"       textarea + Generate button
 *   - "generating" textarea disabled, spinner, Cancel button
 *   - "success"    shows schema preview + Accept / Discard / Retry
 *   - "error"      shows error message + Retry button + textarea editable
 *
 * Wires to:
 *   - composer.aiAssistService (D3) — generate
 *   - composer events ai:generate:started/complete/failed (telemetry only)
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/shared/vibcoder/Button";
import { Textarea } from "@/editor/shared/vibcoder/Textarea";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalTitle,
} from "@/editor/shared/vibcoder";
import type {
  AIAssistService,
  ComponentSchema,
} from "../services/AIAssistService";

type ModalState =
  | { kind: "idle" }
  | { kind: "generating"; abort: AbortController }
  | { kind: "success"; schema: ComponentSchema }
  | { kind: "error"; message: string };

export interface AIPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** AIAssistService from composer.aiAssistService — supplied by mount. */
  service: AIAssistService | null;
  /** Called when the user confirms the generated schema. */
  onAccept: (schema: ComponentSchema) => void;
}

const PLACEHOLDER =
  "e.g. A pricing card with three tiers, one highlighted, each tier has a CTA button bound to color-primary.";

export const AIPromptModal: React.FC<AIPromptModalProps> = ({
  open,
  onOpenChange,
  service,
  onAccept,
}) => {
  const [prompt, setPrompt] = React.useState("");
  const [state, setState] = React.useState<ModalState>({ kind: "idle" });

  // When the modal closes, abort any in-flight request and reset state on
  // next open. Reset on close (not open) so a fresh open shows last result
  // momentarily during the close animation, but a re-open is clean.
  React.useEffect(() => {
    if (!open && state.kind === "generating") {
      state.abort.abort();
    }
    if (!open) {
      // Defer reset by one tick so close animation isn't disturbed.
      const t = setTimeout(() => setState({ kind: "idle" }), 0);
      return () => clearTimeout(t);
    }
  }, [open, state]);

  const handleGenerate = React.useCallback(async () => {
    if (!service) {
      setState({ kind: "error", message: "AI service not configured" });
      return;
    }
    if (prompt.trim().length === 0) {
      setState({ kind: "error", message: "Please describe the component first" });
      return;
    }

    const controller = new AbortController();
    setState({ kind: "generating", abort: controller });

    try {
      const schema = await service.generateComponentSchema(prompt, {
        signal: controller.signal,
      });
      // Guard against late resolution after the user closed/cancelled.
      if (controller.signal.aborted) return;
      setState({ kind: "success", schema });
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : String(err);
      setState({ kind: "error", message });
    }
  }, [prompt, service]);

  const handleCancelGeneration = React.useCallback(() => {
    if (state.kind === "generating") {
      state.abort.abort();
      setState({ kind: "idle" });
    }
  }, [state]);

  const handleAccept = React.useCallback(() => {
    if (state.kind === "success") {
      onAccept(state.schema);
      onOpenChange(false);
    }
  }, [state, onAccept, onOpenChange]);

  const handleDiscard = React.useCallback(() => {
    setState({ kind: "idle" });
  }, []);

  const isGenerating = state.kind === "generating";
  const showSuccess = state.kind === "success";
  const errorMessage = state.kind === "error" ? state.message : null;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" aria-labelledby="ai-prompt-title">
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--bd-border, #e2e8f0)" }}>
          <ModalTitle id="ai-prompt-title" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>
            Generate component with AI
          </ModalTitle>
          <ModalDescription style={{ fontSize: 13, color: "var(--bd-text-muted, #64748b)", marginTop: 4 }}>
            Describe what you want. The AI returns a structured schema bound to your design system.
          </ModalDescription>
        </div>

        <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
          <Textarea
            aria-label="Component description"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            placeholder={PLACEHOLDER}
            rows={4}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 6,
              border: "1px solid var(--bd-border, #e2e8f0)",
              fontFamily: "inherit",
              fontSize: 13,
              resize: "vertical",
              background: isGenerating ? "var(--bd-bg-subtle, #f8fafc)" : "var(--bd-surface, #fff)",
              color: "var(--bd-text, #0f172a)",
            }}
          />

          {isGenerating && (
            <div role="status" aria-live="polite" style={{ fontSize: 12, color: "var(--bd-text-muted, #64748b)" }}>
              Generating schema…
            </div>
          )}

          {errorMessage && (
            <div role="alert" style={{
              fontSize: 12,
              color: "var(--bd-warn-strong, #854d0e)",
              background: "var(--bd-warn-soft, #fef9c3)",
              border: "1px solid var(--bd-warn-border, #fde68a)",
              borderRadius: 6,
              padding: "8px 10px",
            }}>
              {errorMessage}
            </div>
          )}

          {showSuccess && state.kind === "success" && (
            <div data-testid="ai-prompt-schema-preview" style={{
              fontSize: 11,
              fontFamily: "var(--bd-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
              background: "var(--bd-bg-subtle, #f8fafc)",
              border: "1px solid var(--bd-border, #e2e8f0)",
              borderRadius: 6,
              padding: 12,
              maxHeight: 220,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              color: "var(--bd-text, #0f172a)",
            }}>
              {JSON.stringify(state.schema, null, 2)}
            </div>
          )}
        </div>

        <ModalFooter style={{ padding: "16px 28px", borderTop: "1px solid var(--bd-border, #e2e8f0)" }}>
          {state.kind === "idle" && (
            <>
              <Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="button" onClick={handleGenerate}>
                Generate
              </Button>
            </>
          )}

          {isGenerating && (
            <Button variant="ghost" size="sm" type="button" onClick={handleCancelGeneration}>
              Cancel generation
            </Button>
          )}

          {showSuccess && (
            <>
              <Button variant="ghost" size="sm" type="button" onClick={handleDiscard}>
                Discard
              </Button>
              <Button variant="ghost" size="sm" type="button" onClick={handleGenerate}>
                Retry
              </Button>
              <Button variant="primary" size="sm" type="button" onClick={handleAccept}>
                Accept
              </Button>
            </>
          )}

          {state.kind === "error" && (
            <>
              <Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="button" onClick={handleGenerate}>
                Retry
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
