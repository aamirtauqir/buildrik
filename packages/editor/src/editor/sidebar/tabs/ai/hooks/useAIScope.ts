import * as React from "react";
import type { Composer } from "../../../../../engine";
import type { Element } from "../../../../../engine/elements/Element";
import type { AIScope, AIScopeStatus } from "../types";
import { EVENTS } from "../../../../../shared/constants/events";

interface UseAIScopeResult {
  scope: AIScope;
  status: AIScopeStatus;
  lock: () => void;
  unlock: () => void;
}

function deriveLabel(el: Element): string {
  const named = el.getAttribute?.("aria-label");
  return named || el.getType();
}

export function useAIScope(composer: Composer | null): UseAIScopeResult {
  const [scope, setScope] = React.useState<AIScope>({ kind: "page" });
  const [status, setStatus] = React.useState<AIScopeStatus>("idle");
  const statusRef = React.useRef<AIScopeStatus>("idle");
  statusRef.current = status;

  React.useEffect(() => {
    if (!composer) return;

    const onSelected = (el: Element) => {
      if (statusRef.current === "locked") return;
      setScope({ kind: "element", id: el.getId(), label: deriveLabel(el) });
    };
    const onDeselected = () => {
      if (statusRef.current === "locked") return;
      setScope({ kind: "page" });
    };
    const onMulti = (els: Element[]) => {
      if (statusRef.current === "locked") return;
      setScope({ kind: "multi", count: els.length });
    };

    composer.on(EVENTS.ELEMENT_SELECTED, onSelected);
    composer.on(EVENTS.ELEMENT_DESELECTED, onDeselected);
    composer.on(EVENTS.SELECTION_MULTIPLE, onMulti);

    return () => {
      composer.off(EVENTS.ELEMENT_SELECTED, onSelected);
      composer.off(EVENTS.ELEMENT_DESELECTED, onDeselected);
      composer.off(EVENTS.SELECTION_MULTIPLE, onMulti);
    };
  }, [composer]);

  const lock = React.useCallback(() => setStatus("locked"), []);
  const unlock = React.useCallback(() => setStatus("idle"), []);

  return { scope, status, lock, unlock };
}
