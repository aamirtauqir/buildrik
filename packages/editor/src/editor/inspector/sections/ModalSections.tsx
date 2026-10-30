/**
 * The Modal's two Inspector sections on the Modal model (B-17,
 * docs/design-2l9/engine-modal.md):
 *
 *   ModalRelationshipSection — Content, on a trigger (2L9 B4-C07
 *     `245:39899`): Dialog [{dialog} ▾] (links another dialog), "Dialog is a
 *     direct child of {page}. Trigger is inside {parent}.", primary "Edit
 *     {dialog}" (selects the dialog — which reveals it on the canvas), "Link
 *     existing dialog", Actions · "Duplicate modal" + its note.
 *   DialogBehaviorSection — Behavior, on the dialog (B4-C18 `252:46927`):
 *     Close on Escape, Close on backdrop click, Initial state, the two notes,
 *     "Back to dialog content".
 *
 * Each write is the model's own history step; the lock gate runs first.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer, Element } from "@/engine";
import { Button, Menu, MenuItem, Popover, useToast } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { canWrite } from "@/engine/commands/commandOperations";
import { duplicateModal, linkModal, readModal, setDialogBehavior } from "@/engine/widgets/modalModel";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { Section, SelectRow } from "../shared/controls";
import { CheckRow } from "../shared/controls/CheckRow";
import { GROUP_TITLE, WIDE_BUTTON } from "../shared/controls/controlClasses";
import { NoteRow } from "./behaviourRows";

const nameOf = (el: Element | null | undefined): string => (el ? (getLayerName(el) ?? elementTypeLabel(el.getType())) : "");

function useModalVersion(composer: Composer | null | undefined): void {
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!composer) return;
    composer.on(EVENTS.ELEMENT_UPDATED, bump);
    composer.on(EVENTS.PROJECT_CHANGED, bump);
    return () => {
      composer.off(EVENTS.ELEMENT_UPDATED, bump);
      composer.off(EVENTS.PROJECT_CHANGED, bump);
    };
  }, [composer]);
}

/** Every Modal-block dialog on the active page. */
function pageDialogs(composer: Composer): Element[] {
  const rootId = composer.elements.getActivePage?.()?.root.id;
  const root = rootId ? composer.elements.getElement(rootId) : null;
  return root ? root.getDescendants().filter((e) => e.getAttribute("role") === "dialog") : [];
}

export function ModalRelationshipSection({ composer, elementId, isOpen, onToggle }: { composer: Composer | null | undefined; elementId: string; isOpen?: boolean; onToggle?: () => void }) {
  useModalVersion(composer);
  const { addToast } = useToast();
  const [linking, setLinking] = React.useState(false);
  if (!composer) return null;
  const state = readModal(composer, elementId);
  const dialog = state ? composer.elements.getElement(state.dialogId) : null;
  const trigger = composer.elements.getElement(elementId);
  const writable = () => canWrite(composer, elementId);
  const pageName = composer.elements.getActivePage?.()?.name ?? "the page";
  const others = pageDialogs(composer).filter((d) => d.getId() !== state?.dialogId);
  const link = (dialogId: string) => {
    setLinking(false);
    if (writable()) linkModal(composer, elementId, dialogId);
  };

  return (
    <Section title="Modal relationship" isOpen={isOpen} onToggle={onToggle}>
      <div className="tw:flex tw:flex-col tw:gap-2" data-testid="inspector-modal-relationship">
        <SelectRow
          label="Dialog"
          value={state?.dialogId ?? ""}
          placeholder={state ? null : "None"}
          options={pageDialogs(composer).map((d) => ({ value: d.getId(), label: nameOf(d) }))}
          onChange={(id) => id && link(id)}
        />
        {state && dialog ? (
          <NoteRow testId="modal-placement">
            {state.atPageRoot ? `Dialog is a direct child of ${pageName}.` : `Dialog is inside ${nameOf(dialog.getParent())}.`}{" "}
            Trigger is inside {nameOf(trigger?.getParent()) || pageName}.
          </NoteRow>
        ) : null}
        {dialog ? (
          <Button
            size="xs"
            className={`${WIDE_BUTTON} tw:text-white!`}
            onClick={() => composer.selection.select(dialog)}
            data-testid="modal-edit-dialog"
          >
            Edit {nameOf(dialog)}
          </Button>
        ) : null}
        <Popover
          open={linking}
          onClose={() => setLinking(false)}
          beside=".layout-shell__inspector"
          label="Link existing dialog"
          className="tw:w-[240px] tw:p-2"
          trigger={
            <Button
              color="light"
              size="xs"
              className={WIDE_BUTTON}
              disabled={others.length === 0}
              onClick={() => setLinking((v) => !v)}
              data-testid="modal-link-existing"
            >
              Link existing dialog
            </Button>
          }
        >
          <Menu label="Dialogs on this page" className="tw:min-w-0">
            {others.map((d) => (
              <MenuItem key={d.getId()} onClick={() => link(d.getId())}>
                {nameOf(d)}
              </MenuItem>
            ))}
          </Menu>
        </Popover>
        {state ? (
          <>
            <div className={`${GROUP_TITLE} tw:mb-1!`}>Actions</div>
            <Button
              color="light"
              size="xs"
              className={WIDE_BUTTON}
              onClick={() => {
                if (!writable()) return;
                const copy = duplicateModal(composer, elementId);
                if (copy) addToast({ description: "Modal duplicated", action: { label: "Undo", onClick: composer.history.captureUndo() } });
              }}
              data-testid="modal-duplicate"
            >
              Duplicate modal
            </Button>
            <NoteRow>Duplicate modal creates both roots and remaps their link. Delete trigger keeps its dialog.</NoteRow>
          </>
        ) : null}
      </div>
    </Section>
  );
}

export function DialogBehaviorSection({ composer, elementId, isOpen, onToggle }: { composer: Composer | null | undefined; elementId: string; isOpen?: boolean; onToggle?: () => void }) {
  useModalVersion(composer);
  if (!composer) return null;
  const state = readModal(composer, elementId);
  if (!state) return null;
  const write = (next: Parameters<typeof setDialogBehavior>[2]) => {
    if (canWrite(composer, state.dialogId)) setDialogBehavior(composer, state.dialogId, next);
  };
  return (
    <Section title="Dialog behavior" isOpen={isOpen} onToggle={onToggle}>
      <div className="tw:flex tw:flex-col tw:gap-1" data-testid="inspector-dialog-behavior">
        <CheckRow label="Close on Escape" checked={state.behavior.escape} onChange={(on) => write({ escape: on })} />
        <CheckRow label="Close on backdrop click" checked={state.behavior.backdrop} onChange={(on) => write({ backdrop: on })} />
        <SelectRow
          label="Initial state"
          value={state.behavior.initial}
          placeholder={null}
          options={[
            { value: "closed", label: "Closed" },
            { value: "open", label: "Open" },
          ]}
          onChange={(v) => write({ initial: v as "closed" | "open" })}
        />
        <NoteRow>Editor reveal and visitor open state are temporary.</NoteRow>
        <NoteRow>Backdrop closes only when the backdrop itself is activated. Focus trap and background inertness are required.</NoteRow>
        <Button
          color="light"
          size="xs"
          className={WIDE_BUTTON}
          onClick={() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "semantics" })}
          data-testid="dialog-back-to-content"
        >
          Back to dialog content
        </Button>
      </div>
    </Section>
  );
}
