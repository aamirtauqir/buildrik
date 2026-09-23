/**
 * The canvas's multi-delete confirm — decision #17: one element deletes at
 * once with Undo; more than one asks first. The `delete` command decides
 * (it emits UI_REQUEST_DELETE_SELECTION instead of deleting when N > 1 and
 * the run is not confirmed); this draws the question and re-runs the command
 * confirmed, so the delete is still the engine's one transaction and
 * useHistoryFeedback's "N elements deleted" + Undo still follows.
 *
 * Same dialog as the inspector's multi-select header (DeleteConfirmModal).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { DeleteConfirmModal } from "@/editor/inspector/components/DeleteConfirmModal";

export function DeleteSelectionConfirm({ composer }: { composer: Composer | null }) {
  const [count, setCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!composer) return;
    const ask = (data: { count: number }) => setCount(data.count);
    composer.on(EVENTS.UI_REQUEST_DELETE_SELECTION, ask);
    return () => {
      composer.off(EVENTS.UI_REQUEST_DELETE_SELECTION, ask);
    };
  }, [composer]);

  return (
    <DeleteConfirmModal
      isOpen={count !== null}
      elementLabel={`${count ?? 0} elements`}
      onClose={() => setCount(null)}
      onConfirm={() => {
        setCount(null);
        composer?.commands.run("delete", { confirmed: true });
      }}
    />
  );
}
