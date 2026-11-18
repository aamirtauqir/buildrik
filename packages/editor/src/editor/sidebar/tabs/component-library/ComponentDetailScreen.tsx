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
import { ConfirmDialog, useToast, Button, Menu, MenuItem, Popover, TextInput, type ToastInput } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import type { ComponentDefinition } from "@/shared/types/components";
import { ELEMENT_TYPE_LABELS } from "@/shared/constants/elementTypeLabels";
import { ExportPackageDialog } from "./ExportPackageDialog";
import { INSTANTIATE_TOASTS, instantiateComponentAtSelection } from "./instantiate";
import { beginUpdateFromSelection } from "./sourcePick";
/* Same "switch page, then select + scroll to the element" seam Review's
   Locate row uses (`locateComment`'s own header: "the REGRESSION-guarded
   seam"). Reused rather than re-implemented for the used-on row below —
   the name is Review's, the behaviour (page switch → select → scrollIntoView)
   is exactly what "click a used-on row" needs too. */
import { usedOnPlaces } from "./UsedOnView";
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
  /** §13: opened from an instance's "Edit master ›" — the back row returns
   *  to that instance instead of the list. */
  onBackToInstance?: () => void;
  /** The master is shared from the workspace library (scope chip, 215:47042). */
  linked?: boolean;
  /** "Used in … ›" (215:47046) opens the places view (217:42647). */
  onShowUsedOn?: () => void;
  /** The row menu's Rename (228:46316): put the name in edit once, then
   *  report the request consumed so a later summary does not start in rename. */
  startRenaming?: boolean;
  onRenameConsumed?: () => void;
  /** Callback when component is inserted */
  onInsert?: () => void;
  /** Callback when component is duplicated */
  onDuplicate?: () => void;
  /** Callback when component is deleted */
  onDelete?: () => void;
}

const LIST_ROW = "tw:flex tw:items-center tw:gap-2 tw:h-8 tw:pl-3 tw:pr-1 tw:rounded tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const ROW_META = "tw:ml-auto tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)] tw:whitespace-nowrap";
/* 215:47050 — 32 high, full width, 4px radius, 13/500. */
const BTN_32 = "tw:w-full tw:h-8 tw:rounded tw:text-[13px] tw:font-medium tw:focus:ring-0";
/* 215:47046 — a 13/500 accent link, 12 in, 32 high. */
const LINK = "tw:h-8 tw:w-full tw:justify-start tw:pl-3 tw:text-[13px] tw:font-medium";

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
  onBackToInstance,
  linked = false,
  onShowUsedOn,
  startRenaming = false,
  onRenameConsumed,
  onInsert,
  onDuplicate,
  onDelete,
}) => {
  // DrillInHeader handles focus-on-mount automatically
  const { addToast } = useToast();

  // Delete confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // "Update component" confirmation — the change is destructive to instance
  // overrides, so it is never one click.


  const [exporting, setExporting] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  React.useEffect(() => {
    if (!startRenaming) return;
    setRenaming(true);
    onRenameConsumed?.();
  }, [startRenaming, onRenameConsumed]);
  const [draftName, setDraftName] = React.useState(component.name);
  /* The back row's (and Escape's) one level up. */
  const backOut = onBackToInstance ?? onBack;

  /* Flow-check (2026-09-25): Esc did nothing here — every sibling drill-in
     (Add's Generate/create sub-views) backs out one level on Esc; this screen
     never wired it. Skips while renaming (the field's own Escape already
     handles that, see the rename input below) or while one of this screen's
     own confirms is open — those own Escape through OverlayMount/ConfirmDialog
     and must close themselves first, not the whole panel underneath them. */
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (renaming || showDeleteConfirm) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      backOut();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [backOut, renaming, showDeleteConfirm]);

  // Handle insert action — the shared insert (A-15), same words as Add.
  const handleInsert = async () => {
    if (!composer) return;
    const result = await instantiateComponentAtSelection(composer, component.id);
    addToast({ ...INSTANTIATE_TOASTS[result], duration: 4000 });
    if (result === "ok") onInsert?.();
  };

  // Handle duplicate action
  const handleDuplicate = async () => {
    if (!composer) return;

    /* P-4: it said nothing either way and a throw went unhandled. */
    const duplicate = await composer.components.duplicateComponent(component.id).catch(() => null);
    if (!duplicate) {
      addToast({ description: `Couldn't duplicate "${component.name}".`, tone: "error", duration: 4000 });
      return;
    }
    addToast({ description: `Duplicated "${component.name}".`, duration: 4000 });
    onDuplicate?.();
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

  /* 2L9 217:42647 (B6-K21): the places it is used, from the one walk up to a
     page (usedOnPlaces); "Used in … ›" opens them as their own view. */
  const instances = composer?.components?.getInstancesOfComponent?.(component.id) ?? [];
  const places = usedOnPlaces(composer, component.id);
  const pageCount = new Set(places.map((p) => p.page.id)).size;
  const structure = component.masterTree?.children ?? [];
  const siteName = composer?.getProjectMetadata?.()?.name || "this site";

  /* 2L9 217:41451 (B6-K17): Detach all asks nothing — it reports what it did
     and offers Undo, which relinks every instance with its overrides. */
  const detachAll = async () => {
    if (!composer || instances.length === 0) return;
    const snapshot = composer.components.snapshotComponent(component.id);
    const onPages = pageCount;
    const n = instances.length;
    /* P-4: a failure is said, not left as an unhandled rejection. */
    try {
      await Promise.all(instances.map((inst) => composer.components.detachInstance(inst.elementId)));
    } catch {
      addToast({ description: "Couldn't detach every instance. Try again.", tone: "error", duration: 4000 });
      return;
    }
    addToast({
      description: `Detached ${count(n, "instance", "instances")} on ${count(onPages, "page", "pages")} from ${component.name}`,
      ...(snapshot && { action: { label: "Undo", onClick: () => void composer.components.relinkInstances(snapshot.instances) } }),
    });
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

  /* 215:47046 / 215:47048 — "Used in … ›" and "Structure ›" open their lists. */
  const [open, setOpen] = React.useState<"structure" | null>(null);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const runMore = (fn: () => void) => () => {
    setMoreOpen(false);
    fn();
  };
  const toggle = (which: "structure") => setOpen((v) => (v === which ? null : which));

  return (
    /* 215:47035 — the summary pane: 320 wide, a hairline on its left, 24 in,
       12 between: preview, name, chips, two links, then the actions. */
    <aside
      aria-label={`${component.name} component`}
      className="tw:flex tw:h-full tw:min-h-0 tw:w-80 tw:shrink-0 tw:flex-col tw:gap-3 tw:overflow-y-auto tw:border-l tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:p-6"
      data-testid="component-master"
    >
      {onBackToInstance ? (
        /* §13: opened from an instance's "Edit master ›". */
        <Button variant="link" size="xs" className={LINK} onClick={onBackToInstance} data-testid="component-back-row">
          ‹ Back to instance
        </Button>
      ) : null}

      {/* 215:47036 — 272×152 preview on bg-subtle. */}
      <div className="tw:flex tw:h-[152px] tw:w-full tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded tw:bg-[var(--bk-bg-subtle)]" data-testid="component-preview">
        {component.thumbnail ? (
          <img src={component.thumbnail} alt={component.name} className="tw:max-h-full tw:max-w-full tw:object-contain" />
        ) : (
          <span className="tw:text-[12px] tw:text-[var(--bk-ink-muted)]">No preview yet</span>
        )}
      </div>

      {/* 215:47040 — the name, 16/24/600; it renames inline (G2-124). */}
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
        <h3
          title="Rename"
          tabIndex={0}
          data-testid="component-name"
          className="tw:m-0 tw:cursor-text tw:truncate tw:rounded-sm tw:text-[16px] tw:leading-6 tw:font-semibold tw:text-[var(--bk-ink)] hover:tw:bg-[var(--bk-bg-subtle)]"
          onClick={() => setRenaming(true)}
          onKeyDown={(e) => { if (e.key === "Enter") setRenaming(true); }}
        >
          {component.name}
        </h3>
      )}

      {/* 215:47041 — where the master lives. */}
      <div className="tw:flex tw:gap-1.5">
        <span
          className="tw:inline-flex tw:h-[22px] tw:items-center tw:rounded-full tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:text-[11px] tw:leading-4 tw:font-medium tw:text-[var(--bk-ink-soft)]"
          data-testid="component-scope"
        >
          {linked ? "Component library" : component.pageId ? "This page" : "This site"}
        </span>
      </div>

      <div className="tw:flex tw:flex-col">
        {instanceCount === 0 ? (
          /* 217:41451 — after Detach all: nothing to open. */
          <p className="tw:m-0 tw:flex tw:h-8 tw:items-center tw:pl-3 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink-soft)]" data-testid="component-usedon-toggle">
            Not used on any page
          </p>
        ) : (
          <Button
            variant="link"
            size="xs"
            className={LINK}
            onClick={onShowUsedOn}
            data-testid="component-usedon-toggle"
          >
            {`Used in ${count(instanceCount, "place", "places")} on ${count(pageCount, "page", "pages")} ›`}
          </Button>
        )}
        <Button
          variant="link"
          size="xs"
          className={LINK}
          aria-expanded={open === "structure"}
          onClick={() => toggle("structure")}
          data-testid="component-structure-header"
        >
          Structure · {structure.length} ›
        </Button>
        {open === "structure"
          ? structure.map((child, i) => {
              const layerName = typeof child.data?.layerName === "string" ? child.data.layerName : undefined;
              const bound = child.dataBindings && Object.keys(child.dataBindings).length > 0;
              return (
                <div key={child.id ?? i} className={LIST_ROW} data-testid="component-structure-row">
                  <span className="tw:truncate">{layerName ?? ELEMENT_TYPE_LABELS[child.type] ?? child.type}</span>
                  <span className={ROW_META}>{child.type}{bound ? " · CMS bound" : ""}</span>
                </div>
              );
            })
          : null}
      </div>

      {/* 215:47050 — Insert (primary), Update from selection… (secondary),
          More actions ⋯ (ghost), each 32 high, 8 apart. */}
      <div className="tw:flex tw:flex-col tw:gap-2">
        <Button size="xs" onClick={handleInsert} data-testid="component-insert" className={BTN_32}>
          Insert
        </Button>
        <Button
          color="light"
          size="xs"
          onClick={() => composer && beginUpdateFromSelection(composer, component.id)}
          data-testid="component-update"
          className={`${BTN_32} tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:text-[var(--bk-ink)]`}
        >
          Update from selection…
        </Button>
        <Popover
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          placement="bottom-end"
          label="More actions"
          trigger={
            <Button
              color="light"
              size="xs"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
              data-testid="component-more"
              className={`${BTN_32} tw:border-0 tw:bg-transparent tw:text-[var(--bk-ink)] tw:shadow-none`}
            >
              More actions ⋯
            </Button>
          }
        >
          {/* 215:47055 — Rename · Duplicate · Export · Detach all · Delete. */}
          <Menu label="More actions" className="tw:w-[272px]">
            <MenuItem data-testid="component-rename" onClick={runMore(() => setRenaming(true))}>
              Rename
            </MenuItem>
            <MenuItem data-testid="component-duplicate" onClick={runMore(() => void handleDuplicate())}>
              Duplicate
            </MenuItem>
            {/* 2L9 220:42920 — a .brcomponent of this master and the ones nested in it. */}
            <MenuItem data-testid="component-export" onClick={runMore(() => setExporting(true))}>
              Export package…
            </MenuItem>
            <MenuItem data-testid="component-detach-all" disabled={instanceCount === 0} onClick={runMore(() => void detachAll())}>
              Detach all
            </MenuItem>
            <MenuItem data-testid="component-delete" onClick={runMore(handleDelete)}>
              Delete
            </MenuItem>
          </Menu>
        </Popover>
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
      {exporting ? (
        <ExportPackageDialog component={component} all={composer?.components?.getAllComponents() ?? [component]} onClose={() => setExporting(false)} />
      ) : null}
    </aside>
  );
};

export default ComponentDetailScreen;
