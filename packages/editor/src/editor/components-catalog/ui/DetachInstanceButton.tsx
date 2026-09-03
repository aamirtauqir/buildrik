/**
 * DetachInstanceButton (S6 follow-up) — Inspector pro-mode action.
 *
 * Per spec §6.3: when an element is selected and that element is a component
 * instance, surface a Detach button so users can break the instance link
 * and edit the underlying element directly.
 *
 * Engine-side `composer.components.isInstance(id)` + `detachInstance(id)`
 * already exist (engine/components/ComponentManager.ts) — this is just the
 * UI surface that wires them together. Self-contained; caller mounts inside
 * ProInspector or any pro-mode action strip.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { useDSModeOptional } from "@/editor/design-system/state/DSModeContext";
import { Button, ConfirmDialog, useToast } from "@/editor/chrome-ui";

interface DetachInstanceButtonProps {
  composer: Composer | null;
  selectedElementId: string | null | undefined;
  /** Optional callback after detach succeeds (e.g., refresh inspector state). */
  onDetached?: (elementId: string) => void;
}

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  background: "transparent",
  color: "var(--bk-warning)",
  border: "1px solid rgba(245,158,11,0.3)",
  borderRadius: 4,
  fontSize: 11,
  cursor: "pointer",
};

const dotStyle: React.CSSProperties = {
  width: 5,
  height: 5,
  borderRadius: "var(--bk-radius-full)",
  background: "currentColor",
  flexShrink: 0,
};

export const DetachInstanceButton: React.FC<DetachInstanceButtonProps> = ({
  composer,
  selectedElementId,
  onDetached,
}) => {
  const [confirming, setConfirming] = React.useState(false);
  const { addToast } = useToast();
  const mode = useDSModeOptional()?.mode ?? "beginner";
  const isPro = mode === "pro";

  // Read isInstance synchronously — managers don't emit events for instance
  // membership changes, so React state isn't needed; render decides per call.
  const isInstance = React.useMemo(() => {
    if (!composer?.components || !selectedElementId) return false;
    try {
      return composer.components.isInstance(selectedElementId);
    } catch {
      return false;
    }
  }, [composer, selectedElementId]);

  /* Named, not generic: the sibling door names the component and a detach that
     says "its component" leaves the user checking which one they just cut. */
  const componentName = React.useMemo(() => {
    if (!composer?.components || !selectedElementId) return null;
    try {
      const inst = composer.components.getInstanceByElementId?.(selectedElementId);
      const id = (inst as { componentId?: string } | undefined)?.componentId;
      if (!id) return null;
      return composer.components.getComponent?.(id)?.name ?? null;
    } catch {
      return null;
    }
  }, [composer, selectedElementId]);

  if (!isPro || !isInstance || !selectedElementId || !composer?.components) {
    return null;
  }

  const handleDetach = async () => {
    setConfirming(false);
    try {
      const ok = await composer.components.detachInstance(selectedElementId);
      if (ok) {
        onDetached?.(selectedElementId);
        return;
      }
      /* A refusal used to be indistinguishable from a success: `if (ok)` with
         nothing on the else, beside a catch that swallowed. The button was
         pressed, the link stayed, and nothing on screen said so. */
      addToast({ description: "Couldn't detach this instance. It may already be detached.", tone: "error" });
    } catch {
      addToast({ description: "Couldn't detach this instance. Try again.", tone: "error" });
    }
  };

  return (
    <>
      <Button
        type="button"
        color="light"
        size="xs"
        onClick={() => setConfirming(true)}
        style={buttonStyle}
        data-detach-instance-button
        aria-label={`Detach instance ${selectedElementId}`}
      >
        <span style={dotStyle} aria-hidden />
        Detach instance
      </Button>
      {/* The component-library door has confirmed this since it shipped; this
          one detached on a single click. Same action, same consequence, two
          answers depending on which door you came through — so it uses that
          door's dialog and its wording rather than a second mechanism. */}
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void handleDetach()}
        title="Detach from component?"
        message={
          componentName
            ? `This copy stops receiving updates from "${componentName}". The component itself is untouched.`
            : "This copy stops receiving updates from its component. The component itself is untouched."
        }
        confirmLabel="Detach"
      />
    </>
  );
};
