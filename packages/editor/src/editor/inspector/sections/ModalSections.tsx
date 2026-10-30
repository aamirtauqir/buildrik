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
 *   On a trigger the same section turns into "Missing dialog" when its saved
 *     dialog is gone (C11 `245:41919`), "Cannot link this dialog" inside a
 *     shared component (C09 `245:40932`, insert a local modal instead) and
 *     "Local modal created" right after that insert (C10 `245:41419`).
 *   DialogContentSection — Content, on the dialog (C08 `245:40398`, C17
 *     `252:46614`): Edit title / body, Close label, Back to {trigger},
 *     Accessibility · Labelled by.
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
import { CommitRow, NoteRow } from "./behaviourRows";
import { justAddedFrom, markJustAdded, useJustAdded } from "./justAddedField";
import { getBlockById, insertBlock } from "@/blocks/blockRegistry";

/** Selects an element and opens the section that edits it (after the selection settles — C05's rule). */
function selectInto(composer: Composer, el: Element, section: string): void {
  composer.selection.select(el);
  setTimeout(() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section }), 0);
}

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

/** A Modal-block trigger: linked, legacy, or pointing at a dialog that is gone. */
export function isModalTrigger(composer: Composer, elementId: string): boolean {
  const el = composer.elements.getElement(elementId);
  if (!el || el.getAttribute("role") === "dialog") return false;
  return !!el.getAttribute("data-modal-target") || !!readModal(composer, elementId)?.triggerIds.includes(elementId);
}

/** The component instance a trigger sits in (itself or an ancestor). */
function instanceOf(el: Element | null | undefined): Element | null {
  for (let up = el ?? null; up; up = up.getParent()) if (up.isComponentInstance?.()) return up;
  return null;
}

/** An instance by its component's name ("Header component"), else its layer name. */
function componentName(composer: Composer, el: Element): string {
  const instance = composer.components?.getInstanceByElementId(el.getId());
  return (instance && composer.components?.getComponent(instance.componentId)?.name) || nameOf(el);
}

/** C09: an instance holding a modal trigger — a shared component cannot store a page dialog's reference. */
export function componentTriggerOf(composer: Composer, elementId: string): Element | null {
  const el = composer.elements.getElement(elementId);
  if (!el) return null;
  if (isModalTrigger(composer, elementId)) return instanceOf(el);
  return el.isComponentInstance?.() && el.getDescendants().some((d) => isModalTrigger(composer, d.getId())) ? el : null;
}

export function ModalRelationshipSection({ composer, elementId, isOpen, onToggle }: { composer: Composer | null | undefined; elementId: string; isOpen?: boolean; onToggle?: () => void }) {
  useModalVersion(composer);
  const { addToast } = useToast();
  const [linking, setLinking] = React.useState(false);
  const [choice, setChoice] = React.useState("");
  const justMade = useJustAdded(composer, elementId, "local-modal");
  if (!composer) return null;
  const state = readModal(composer, elementId);
  const dialog = state ? composer.elements.getElement(state.dialogId) : null;
  const trigger = composer.elements.getElement(elementId);
  const writable = () => canWrite(composer, elementId);
  const pageName = composer.elements.getActivePage?.()?.name ?? "the page";
  const dialogs = pageDialogs(composer);
  const others = dialogs.filter((d) => d.getId() !== state?.dialogId);
  const linkWithReceipt = (dialogId: string) => {
    if (!writable() || !linkModal(composer, elementId, dialogId)) return;
    addToast({ description: `${nameOf(trigger)} linked to ${nameOf(composer.elements.getElement(dialogId))}.`, action: { label: "Undo", onClick: composer.history.captureUndo() } });
  };
  const link = (dialogId: string) => {
    setLinking(false);
    if (writable()) linkModal(composer, elementId, dialogId);
  };

  /* C10 — right after "Insert local modal at page root". */
  if (justMade && dialog) {
    const from = composer.elements.getElement(justAddedFrom(composer, elementId, "local-modal") ?? "");
    const fromName = from ? componentName(composer, from) : "";
    return (
      <Section title="Local modal created" stateTitle="Local modal created" isOpen={isOpen} onToggle={onToggle}>
        <div className="tw:flex tw:flex-col tw:gap-2" data-testid="modal-local-created">
          <NoteRow>
            Trigger and dialog were added at {pageName}’s root.{from ? ` ${fromName} is unchanged.` : ""}
          </NoteRow>
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => selectInto(composer, dialog, "dialog-content")} data-testid="modal-edit-dialog">
            Edit {nameOf(dialog)}
          </Button>
          {from ? (
            <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => composer.selection.select(from)} data-testid="modal-back-to-origin">
              Back to {fromName}
            </Button>
          ) : null}
        </div>
      </Section>
    );
  }

  /* C09 — a trigger in a shared component: the link is refused, a local
     modal (trigger + dialog at the page root) is offered instead. */
  const instance = componentTriggerOf(composer, elementId);
  if (instance) {
    const insertLocal = () => {
      const pageRoot = composer.elements.getActivePage?.()?.root.id;
      const block = getBlockById("modal");
      if (!pageRoot || !block || !canWrite(composer, pageRoot)) return;
      composer.beginTransaction("Insert local modal");
      let made: string | undefined;
      try {
        made = insertBlock(composer, block, pageRoot);
        composer.endTransaction();
      } catch (e) {
        composer.rollbackTransaction();
        throw e;
      }
      const madeEl = made ? composer.elements.getElement(made) : undefined;
      if (!madeEl) return;
      const undo = composer.history.captureUndo();
      markJustAdded(composer, madeEl.getId(), "local-modal", instance.getId());
      composer.selection.select(madeEl);
      addToast({ description: "Local trigger and dialog added.", action: { label: "Undo", onClick: undo } });
    };
    return (
      <Section title="Cannot link this dialog" stateTitle="Cannot link this dialog" isOpen={isOpen} onToggle={onToggle}>
        <div className="tw:flex tw:flex-col tw:gap-2" data-testid="modal-component-refused">
          <NoteRow>This dialog belongs to one page; a shared component cannot store its reference.</NoteRow>
          <Button color="light" size="xs" className={WIDE_BUTTON} disabled data-testid="modal-link-refused">
            Link dialog
          </Button>
          <Button size="xs" className={`${WIDE_BUTTON} tw:text-white!`} onClick={insertLocal} data-testid="modal-insert-local">
            Insert local modal at page root
          </Button>
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={onToggle} data-testid="modal-refused-cancel">
            Cancel
          </Button>
          <NoteRow>Creates a local trigger and dialog outside this component. The shared definition and instance stay unchanged.</NoteRow>
        </div>
      </Section>
    );
  }

  /* C11 — the saved dialog is gone: repaired only by an explicit choice. */
  if (!state && trigger?.getAttribute("data-modal-target")) {
    const chosen = dialogs.find((d) => d.getId() === choice);
    return (
      <Section title="Missing dialog" stateTitle="Missing dialog" isOpen={isOpen} onToggle={onToggle}>
        <div className="tw:flex tw:flex-col tw:gap-2" data-testid="modal-missing">
          <NoteRow>The saved dialog ID no longer exists. Select a valid dialog on {pageName} to repair this trigger.</NoteRow>
          <SelectRow
            label="Dialog"
            value={choice}
            placeholder="Choose existing dialog"
            options={dialogs.map((d) => ({ value: d.getId(), label: nameOf(d) }))}
            onChange={setChoice}
          />
          <Button
            size="xs"
            className={`${WIDE_BUTTON} tw:text-white!`}
            disabled={!chosen}
            onClick={() => chosen && linkWithReceipt(chosen.getId())}
            data-testid="modal-missing-link"
          >
            {chosen ? `Link ${nameOf(chosen)}` : "Link dialog"}
          </Button>
          <NoteRow>No nearest-dialog guess. Cancel preserves the missing reference.</NoteRow>
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => setChoice("")} data-testid="modal-missing-cancel">
            Cancel
          </Button>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Modal relationship" isOpen={isOpen} onToggle={onToggle}>
      <div className="tw:flex tw:flex-col tw:gap-2" data-testid="inspector-modal-relationship">
        <SelectRow
          label="Dialog"
          value={state?.dialogId ?? ""}
          placeholder={state ? null : "None"}
          options={dialogs.map((d) => ({ value: d.getId(), label: nameOf(d) }))}
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
            onClick={() => selectInto(composer, dialog, "dialog-content")}
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

/** The close control inside a dialog (`[data-modal-close]`, legacy `.modal-close`). */
function closeControlOf(dialog: Element): Element | undefined {
  return dialog.getDescendants().find((d) => d.getAttribute("data-modal-close") !== undefined) ??
    dialog.getDescendants().find((d) => (d.getAttribute("class") ?? "").split(/\s+/).includes("modal-close"));
}

const textOf = (el: Element): string => [el, ...el.getDescendants()].map((e) => e.getContent().replace(/<[^>]*>/g, "")).join("").trim();

/**
 * Content › Dialog content on the dialog (2L9 B4-C08 `245:40398`, C17
 * `252:46614`): the dialog's own parts, its accessible name, and the way
 * back to the trigger — which closes the editor reveal (a selected trigger
 * does not reveal its dialog).
 */
export function DialogContentSection({ composer, elementId, isOpen, onToggle }: { composer: Composer | null | undefined; elementId: string; isOpen?: boolean; onToggle?: () => void }) {
  useModalVersion(composer);
  if (!composer) return null;
  const state = readModal(composer, elementId);
  const dialog = state ? composer.elements.getElement(state.dialogId) : null;
  if (!state || !dialog) return null;
  const parts = dialog.getDescendants();
  const title = parts.find((d) => /^h[1-6]$/i.test(d.getTagName()));
  const body = parts.find((d) => (d.getAttribute("class") ?? "").split(/\s+/).includes("modal-body")) ?? parts.find((d) => d.getTagName().toLowerCase() === "p");
  const close = closeControlOf(dialog);
  const trigger = state.triggerIds.map((id) => composer.elements.getElement(id)).find(Boolean);
  const named = dialog.getAttribute("aria-labelledby") || dialog.getAttribute("aria-label");
  const setCloseLabel = (v: string) => {
    if (!close || !canWrite(composer, close.getId())) return;
    composer.beginTransaction("Close label");
    if (v.trim()) close.setAttribute("aria-label", v.trim());
    else close.removeAttribute("aria-label");
    composer.endTransaction();
  };
  return (
    <Section title="Dialog content" isOpen={isOpen} onToggle={onToggle}>
      <div className="tw:flex tw:flex-col tw:gap-2" data-testid="inspector-dialog-content">
        {title ? (
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => composer.selection.select(title)} data-testid="dialog-edit-title">
            Edit title
          </Button>
        ) : null}
        {body ? (
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => composer.selection.select(body)} data-testid="dialog-edit-body">
            Edit body
          </Button>
        ) : null}
        {close ? (
          <CommitRow label="Close label" value={close.getAttribute("aria-label") ?? textOf(close)} onCommit={setCloseLabel} testId="dialog-close-label" />
        ) : null}
        {trigger ? (
          <>
            <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => selectInto(composer, trigger, "modal-relationship")} data-testid="dialog-back-to-trigger">
              Back to {nameOf(trigger)}
            </Button>
            <NoteRow>Back restores closed authoring view and trigger focus.</NoteRow>
          </>
        ) : null}
        <div className={`${GROUP_TITLE} tw:mb-1!`}>Accessibility</div>
        <div className="bdi-row-ctrl">
          <span className="bdi-lb">Labelled by</span>
          <span className="bdi-row-content">
            <span
              className="tw:flex tw:h-7 tw:min-w-0 tw:flex-1 tw:items-center tw:truncate tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:text-[12px] tw:text-[var(--bk-ink-soft)]"
              data-testid="dialog-labelled-by"
            >
              {named ? (dialog.getAttribute("aria-labelledby") ?? "Own label") : title ? nameOf(title) : "Not named — add a heading"}
            </span>
          </span>
        </div>
        <NoteRow>Visitor focus stays inside the open dialog and returns to the opener.</NoteRow>
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
          onClick={() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "dialog-content" })}
          data-testid="dialog-back-to-content"
        >
          Back to dialog content
        </Button>
      </div>
    </Section>
  );
}
