/**
 * ComponentDetailScreen — "Manage saved master", board 4418:142876 (G2-122).
 *
 * Back row · panel header · the master scope block (name, linked-instance
 * sentence, Insert / Update from selection… / Detach all / Delete master) ·
 * master preview · STRUCTURE (the master's top-level parts) · USED ON (pages
 * with instances, click to open) · "‹ All saved components".
 * The name renames inline (G2-124 — the old Rename modal had no caller).
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ConfirmDialog, useToast, Button, IconButton, PanelBackRow, TextInput, type ToastInput } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import type { ComponentDefinition } from "../../../../shared/types/components";
import { ELEMENT_TYPE_LABELS } from "../../../../shared/constants/elementTypeLabels";
import { captureComponentThumbnail } from "./captureComponentThumbnail";
// ============================================
// Types
// ============================================

export interface ComponentDetailScreenProps {
  /** The component to display */
  component: ComponentDefinition;
  /** Composer instance */
  composer: Composer | null;
  /** Navigate back to browse view */
  onBack: () => void;
  /** Close the panel */
  onClose?: () => void;
  /** Callback when component is inserted */
  onInsert?: () => void;
  /** Callback when component is duplicated */
  onDuplicate?: () => void;
  /** Callback when component is deleted */
  onDelete?: () => void;
  /** Detach all finished — the list reports the count (board 4418:143126). */
  onDetachedAll?: (count: number) => void;
  /** The element currently selected on canvas — what "Update component" promotes. */
  selectedElementId?: string | null;
}

const SECTION_HEADER =
  "tw:flex tw:items-center tw:gap-2 tw:h-7 tw:px-4 tw:text-[11px] tw:leading-4 tw:font-medium tw:tracking-[0.88px] tw:text-[var(--bk-ink-muted)]";
const LIST_ROW = "tw:flex tw:items-center tw:gap-2 tw:h-8 tw:px-4 tw:rounded tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const ROW_META = "tw:ml-auto tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)] tw:whitespace-nowrap";
const BTN_28 = "tw:w-full tw:h-7 tw:px-3 tw:py-1 tw:rounded-md tw:text-[13px] tw:font-medium tw:focus:ring-0";

// ============================================
// Component
// ============================================

/** Board 4418:142410 — the title names the component; the body says what
 *  happens to its instances, counted on this site. */
export function componentDeleteCopy(name: string, instances: number): { title: string; message: string } {
  const fate =
    instances === 0
      ? "No instances on this site use it."
      : instances === 1
        ? "1 instance on this site will become an independent element and keep its content."
        : `${instances} instances on this site will become independent elements and keep their content.`;
  return {
    title: `Delete “${name}”?`,
    message: `${fate} The saved ${name} component will be permanently deleted.`,
  };
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Delete a master — board 4418:142651: "Menu card deleted · 18 instances
 * detached · Undo". Snapshots first, so Undo can re-register the master and
 * relink the instances it detached. Both delete doors (this screen and the
 * list's row menu) use it. Throws when the engine does.
 */
export async function deleteComponentWithUndo(composer: Composer, id: string): Promise<ToastInput> {
  const snapshot = composer.components.snapshotComponent(id);
  const detached = composer.components.getInstancesOfComponent(id).length;
  await composer.components.deleteComponent(id);
  const name = snapshot?.component.name ?? "Component";
  return {
    description: detached > 0 ? `${name} deleted · ${count(detached, "instance", "instances")} detached` : `${name} deleted`,
    ...(snapshot && { action: { label: "Undo", onClick: () => void composer.components.restoreDeletedComponent(snapshot) } }),
  };
}

export const ComponentDetailScreen: React.FC<ComponentDetailScreenProps> = ({
  component,
  composer,
  onBack,
  onClose,
  onInsert,
  onDuplicate,
  onDelete,
  onDetachedAll,
  selectedElementId = null,
}) => {
  // DrillInHeader handles focus-on-mount automatically
  const { addToast } = useToast();

  // Delete confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // "Update component" confirmation — the change is destructive to instance
  // overrides, so it is never one click.
  const [showUpdateConfirm, setShowUpdateConfirm] = React.useState(false);


  const [showDetachAll, setShowDetachAll] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [draftName, setDraftName] = React.useState(component.name);

  // Handle insert action
  const handleInsert = async () => {
    if (!composer) return;

    // Get parent element - selected element or active page root
    const selectedIds = composer.selection?.getSelectedIds() || [];
    let parentId = selectedIds[0];
    if (!parentId) {
      const activePage = composer.elements.getActivePage();
      if (activePage?.root) parentId = activePage.root.id;
    }
    if (!parentId) {
      /* The row action on the list says this; the detail screen's own Insert
         button returned in silence — same click, same nothing, no message. */
      addToast({
        description: "Open a page first to add this component.",
        tone: "warning",
        duration: 4000,
      });
      return;
    }

    composer.beginTransaction("insert-component");
    try {
      const id = await composer.components.instantiateComponent(component.id, parentId);
      if (!id) {
        addToast({
          description: `Couldn't add "${component.name}" here.`,
          tone: "error",
          duration: 4000,
        });
        return;
      }
      onInsert?.();
    } finally {
      composer.endTransaction();
    }
  };

  // Handle duplicate action
  const handleDuplicate = async () => {
    if (!composer) return;

    const duplicate = await composer.components.duplicateComponent(component.id);
    if (duplicate) {
      onDuplicate?.();
    }
  };

  /**
   * Promote the canvas selection to this component's master.
   *
   * This is the door onto `updateComponentMaster` — the engine half has been
   * built and tested for months with no caller, so "change it once and every
   * instance follows", the reason components exist, could not be reached from
   * the product at all.
   */
  const confirmUpdateAction = async () => {
    setShowUpdateConfirm(false);
    if (!composer || !selectedElementId) return;

    const before = composer.components.snapshotComponent(component.id);
    const { updated, instancesSynced, overridesDropped } =
      await composer.components.updateComponentMaster(component.id, selectedElementId);

    if (!updated) {
      addToast({
        description: `Couldn't update "${component.name}" from that selection.`,
        tone: "error",
        duration: 4000,
      });
      return;
    }

    void captureComponentThumbnail(composer, component.id, selectedElementId);

    // Board 4418:143371: "Menu card updated · 18 linked instances updated · Undo".
    const headline =
      instancesSynced > 0
        ? `${component.name} updated · ${count(instancesSynced, "linked instance", "linked instances")} updated`
        : `${component.name} updated`;
    const action = before && {
      label: "Undo",
      onClick: () => void composer.components.revertComponentMaster(component.id, before.component.masterTree),
    };

    // Overrides whose target the new master no longer has cannot be re-applied.
    // They are gone; the engine used to report that only to devError, which is
    // a no-op in production, so the user watched their edits revert in silence.
    if (overridesDropped > 0) {
      addToast({
        description: `${headline}. ${overridesDropped} override${
          overridesDropped === 1 ? "" : "s"
        } couldn't be re-applied and ${overridesDropped === 1 ? "was" : "were"} lost.`,
        tone: "warning",
        duration: 8000,
        ...(action && { action }),
      });
      return;
    }

    addToast({ description: headline, ...(action && { action }) });
  };

  // Handle delete action — opens ConfirmDialog
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  // Actual delete after confirmation
  const confirmDeleteAction = async () => {
    if (!composer) return;
    setShowDeleteConfirm(false);
    try {
      addToast(await deleteComponentWithUndo(composer, component.id));
    } catch {
      addToast({ description: "Couldn't delete component.", tone: "error" });
      return;
    }
    onDelete?.();
    onBack();
  };

  // Instance count for delete message
  const instanceCount = composer?.components?.getInstancesOfComponent?.(component.id)?.length ?? 0;

  // Instances by page — USED ON (click opens the page).
  const instances = composer?.components?.getInstancesOfComponent?.(component.id) ?? [];
  const pages = composer?.elements.getAllPages?.() ?? [];
  const usedOn = pages
    .map((page) => ({
      page,
      count: instances.filter((inst) => {
        let el = composer?.elements.getElement(inst.elementId) ?? null;
        while (el?.getParent()) el = el.getParent();
        return el?.getId() === page.root?.id;
      }).length,
    }))
    .filter((row) => row.count > 0);
  const structure = component.masterTree?.children ?? [];
  const siteName = composer?.getProjectMetadata?.()?.name || "this site";

  const confirmDetachAll = async () => {
    setShowDetachAll(false);
    if (!composer) return;
    await Promise.all(instances.map((inst) => composer.components.detachInstance(inst.elementId)));
    onDetachedAll?.(instances.length);
    onBack();
  };

  const commitRename = async () => {
    setRenaming(false);
    const name = draftName.trim();
    if (!composer || !name || name === component.name) {
      setDraftName(component.name);
      return;
    }
    const ok = await composer.components.updateComponent(component.id, { name });
    if (!ok) addToast({ description: "Couldn't rename this component.", tone: "error", duration: 4000 });
  };

  return (
    <div className="tw:flex tw:flex-col tw:h-full tw:min-h-0" data-testid="component-master">
      <PanelBackRow label="Saved components" onClick={onBack} data-testid="component-back-row" />
      <div className="tw:flex tw:items-center tw:gap-2 tw:h-11 tw:px-4 tw:shrink-0">
        <span className="tw:flex-1 tw:text-[14px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">Components</span>
        {onClose && (
          <IconButton label="Close" size="sm" onClick={onClose}>
            ✕
          </IconButton>
        )}
      </div>

      <div className="tw:flex-1 tw:min-h-0 tw:overflow-y-auto tw:flex tw:flex-col">
        {/* Master component scope — 4418:142876 */}
        <div className="tw:flex tw:flex-col tw:items-start tw:gap-1.5 tw:px-3 tw:py-2">
          {renaming ? (
            <TextInput
              autoFocus
              sizing="sm"
              aria-label="Component name"
              data-testid="component-rename-input"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={() => void commitRename()}
              onKeyDown={(e) => {
                if (e.key === "Enter") void commitRename();
                if (e.key === "Escape") { setDraftName(component.name); setRenaming(false); }
              }}
              className="tw:w-full"
            />
          ) : (
            <p className="tw:m-0 tw:w-full tw:text-[14px] tw:leading-5 tw:text-[var(--bk-ink)]">
              Master component ·{" "}
              <span
                role="button"
                tabIndex={0}
                title="Rename"
                data-testid="component-name"
                className="tw:cursor-text tw:rounded-sm hover:tw:bg-[var(--bk-bg-subtle)]"
                onClick={() => setRenaming(true)}
                onKeyDown={(e) => { if (e.key === "Enter") setRenaming(true); }}
              >
                {component.name}
              </span>
            </p>
          )}
          <p className="tw:m-0 tw:w-full tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]" data-testid="component-linked">
            {instanceCount} linked instance{instanceCount === 1 ? "" : "s"} on {siteName}. Updating this master affects those instances. Inserting adds one instance.
          </p>
          <Button
            color="light"
            onClick={handleInsert}
            data-testid="component-insert"
            className="tw:h-7 tw:border-0 tw:bg-transparent tw:px-3 tw:text-[13px] tw:font-medium tw:text-[var(--bk-accent)] tw:focus:ring-0"
          >
            Insert from saved components
          </Button>
          <Button
            onClick={() => setShowUpdateConfirm(true)}
            disabled={!selectedElementId}
            title={selectedElementId ? undefined : "Select an element on the canvas to update this master from"}
            data-testid="component-update"
            className={BTN_28}
          >
            Update from selection…
          </Button>
          <Button
            color="light"
            onClick={() => setShowDetachAll(true)}
            disabled={instanceCount === 0}
            data-testid="component-detach-all"
            className={`${BTN_28} tw:bg-white tw:border-[var(--bk-border)] tw:text-[var(--bk-gray-700)]`}
          >
            Detach all
          </Button>
          <Button
            color="light"
            onClick={handleDuplicate}
            data-testid="component-duplicate"
            className={`${BTN_28} tw:bg-white tw:border-[var(--bk-border)] tw:text-[var(--bk-gray-700)]`}
          >
            Duplicate master
          </Button>
          <Button color="red" onClick={handleDelete} data-testid="component-delete" className={BTN_28}>
            Delete {component.name} master
          </Button>
        </div>

        {/* Master preview */}
        <div className="tw:relative tw:h-[140px] tw:shrink-0 tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-subtle)]" data-testid="component-preview">
          <p className="tw:absolute tw:left-[11px] tw:top-[7px] tw:m-0 tw:text-[11px] tw:leading-4 tw:font-medium tw:text-[var(--bk-gray-500)]">
            Master preview · {component.name}
          </p>
          <div className="tw:absolute tw:left-[11px] tw:top-[25px] tw:h-[100px] tw:w-[256px] tw:overflow-hidden tw:rounded-md tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:flex tw:items-center tw:justify-center">
            {component.thumbnail ? (
              <img src={component.thumbnail} alt={component.name} className="tw:max-h-full tw:max-w-full tw:object-contain" />
            ) : (
              <span className="tw:text-[12px] tw:text-[var(--bk-ink-muted)]">No preview yet</span>
            )}
          </div>
        </div>

        <div className={SECTION_HEADER} data-testid="component-structure-header">
          <span className="tw:flex-1">STRUCTURE</span>
          <span className="tw:font-[family-name:var(--bk-font-mono)]">{structure.length}</span>
        </div>
        {structure.map((child, i) => {
          const layerName = typeof child.data?.layerName === "string" ? child.data.layerName : undefined;
          const bound = child.dataBindings && Object.keys(child.dataBindings).length > 0;
          return (
            <div key={child.id ?? i} className={LIST_ROW} data-testid="component-structure-row">
              <span className="tw:truncate">{layerName ?? ELEMENT_TYPE_LABELS[child.type] ?? child.type}</span>
              <span className={ROW_META}>{child.type}{bound ? " · CMS bound" : ""}</span>
            </div>
          );
        })}

        <div className={SECTION_HEADER} data-testid="component-usedon-header">
          <span className="tw:flex-1">USED ON</span>
          <span className="tw:font-[family-name:var(--bk-font-mono)]">{usedOn.length}</span>
        </div>
        {usedOn.map(({ page, count }) => (
          <div
            key={page.id}
            role="button"
            tabIndex={0}
            className={`${LIST_ROW} tw:cursor-pointer hover:tw:bg-[var(--bk-bg-subtle)]`}
            data-testid={`component-usedon-${page.id}`}
            onClick={() => composer?.elements.setActivePage(page.id)}
            onKeyDown={(e) => { if (e.key === "Enter") composer?.elements.setActivePage(page.id); }}
          >
            <span className="tw:truncate">{page.name}</span>
            <span className={ROW_META}>{count} instance{count === 1 ? "" : "s"}</span>
          </div>
        ))}
      </div>

      <div className="tw:flex tw:h-11 tw:shrink-0 tw:items-center tw:border-t tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-4 tw:py-2">
        <Button
          color="light"
          onClick={onBack}
          data-testid="component-all-saved"
          className="tw:h-7 tw:flex-1 tw:rounded-md tw:border-[var(--bk-border)] tw:bg-white tw:text-[13px] tw:font-medium tw:focus:ring-0"
        >
          ‹&nbsp;&nbsp;All saved components
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteAction}
        /* Board 4418:142410: names the component, says what happens to its
           instances (real count). One copy for both delete doors. */
        {...componentDeleteCopy(component.name, instanceCount)}
        confirmLabel="Delete"
        tone="destructive"
      />
      <ConfirmDialog
        open={showUpdateConfirm}
        onClose={() => setShowUpdateConfirm(false)}
        onConfirm={confirmUpdateAction}
        title="Update component"
        message={
          /* ⌘Z alone reverts the pages, not the component definition (measured),
             so the way back is the toast's Undo, which restores the master. */
          (instanceCount > 0
            ? `Replace "${component.name}" with the element selected on the canvas? ${instanceCount} instance(s) will change to match. Any edits made on an instance are kept where they still fit, and lost where the new version no longer has that part. `
            : `Replace "${component.name}" with the element selected on the canvas? `) +
          "To go back, use Undo on the confirmation that follows."
        }
        confirmLabel="Update component"
        tone="destructive"
      />
      <ConfirmDialog
        open={showDetachAll}
        testId="component-detach-all-confirm"
        onClose={() => setShowDetachAll(false)}
        onConfirm={() => void confirmDetachAll()}
        title={`Detach all ${instanceCount} instance${instanceCount === 1 ? "" : "s"} of ${component.name}?`}
        message={`They become independent elements and keep their content and appearance; they will no longer follow updates to the ${component.name} master.`}
        confirmLabel="Detach all"
      />
    </div>
  );
};

export default ComponentDetailScreen;
