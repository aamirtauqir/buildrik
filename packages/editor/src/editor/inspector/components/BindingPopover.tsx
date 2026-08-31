/**
 * BindingPopover — Link element content to a CMS collection field (WS-14b)
 * PRD §12.3 — Chain icon button + popover with collection/field selection
 *
 * Self-contained with local state; mounts inside the inspector header area.
 * Rule: stays in inspector/components/ — not imported from shell.
 *
 * @module editor/inspector/components/BindingPopover
 * @license BSD-3-Clause
 */

import { Link, Link2Off } from "lucide-react";
import * as React from "react";
import type { Composer } from "../../../engine";
import type { CMSCollection, CMSContentItem } from "../../../shared/types/cms";
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  Popover,
} from "@/editor/chrome-ui";
// =============================================================================
// TYPES
// =============================================================================

export interface BindingPopoverProps {
  /** Selected element ID */
  elementId: string | null;
  /** Composer instance for CMS access */
  composer: Composer | null;
  /** Called when user wants to create a new collection (opens CMSCollectionSetupModal) */
  onOpenCreateCollection?: () => void;
}

// =============================================================================
// CLASSES
// =============================================================================

/** Popover body scrolls; the header and the footer link stay put. */
const MENU_CLASS = "tw:max-h-70 tw:overflow-y-auto tw:min-w-0";
const EMPTY_CLASS = "tw:px-3 tw:py-3 tw:text-xs tw:text-[var(--bk-ink-muted)] tw:text-center tw:leading-normal";
const BOUND_CLASS =
  "tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-2 tw:pb-2 tw:mb-1 " +
  "tw:border-b tw:border-[var(--bk-gray-200)] tw:text-[11px] tw:text-[var(--bk-ink-muted)]";
const LINK_BTN_CLASS =
  "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-accent-text)] tw:hover:bg-[var(--bk-accent-subtle)] tw:hover:text-[var(--bk-accent-hover)]";
const UNBIND_BTN_CLASS =
  "tw:border-transparent tw:bg-transparent tw:text-red-700 tw:hover:bg-red-50 tw:hover:text-red-700";

// =============================================================================
// COMPONENT
// =============================================================================

export const BindingPopover: React.FC<BindingPopoverProps> = ({
  elementId,
  composer,
  onOpenCreateCollection,
}) => {
  const [open, setOpen] = React.useState(false);
  const [collections, setCollections] = React.useState<CMSCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = React.useState<CMSCollection | null>(null);
  const [selectedField, setSelectedField] = React.useState<{ slug: string; name: string } | null>(null);
  const [records, setRecords] = React.useState<CMSContentItem[]>([]);
  const [isBound, setIsBound] = React.useState(false);
  const [boundLabel, setBoundLabel] = React.useState<string | null>(null);

  // Load collections when popover opens
  React.useEffect(() => {
    if (!open) return;
    const all = composer?.cms.collections?.getAllCollections?.() ?? [];
    setCollections(all);
  }, [open, composer]);

  // Close on outside click or Escape. Popover owns both listeners; this is the
  // state half of it — and it must clear the WHOLE drill-down, not just the
  // collection. Clearing only `selectedCollection` (what the old
  // useClickOutside handler did) leaves `selectedField` and `records` behind:
  // reopen, pick a different collection, and the field step is skipped because
  // selectedField is still set, so the record list shown belongs to the
  // PREVIOUS collection — and binding one sends that collection's itemId with
  // the new collection's id.
  const handleClose = React.useCallback(() => {
    setOpen(false);
    setSelectedCollection(null);
    setSelectedField(null);
    setRecords([]);
  }, []);

  const handleSelectCollection = React.useCallback(
    (col: CMSCollection) => {
      setSelectedCollection(col);
    },
    []
  );

  // Field then record: a single-element binding needs BOTH a field and a
  // specific record (itemId), otherwise resolveBinding has nothing to read and
  // always returns the fallback (the old flow bound with itemId=undefined).
  const handleSelectField = React.useCallback(
    (fieldSlug: string, fieldName: string) => {
      setSelectedField({ slug: fieldSlug, name: fieldName });
      if (composer && selectedCollection) {
        void composer.cms.collections
          .getContentItems(selectedCollection.id)
          .then((rows) => setRecords(rows))
          .catch(() => setRecords([]));
      }
    },
    [composer, selectedCollection]
  );

  const handleSelectRecord = React.useCallback(
    (itemId: string) => {
      if (!elementId || !selectedCollection || !selectedField) return;
      composer?.cms.bindings?.bindToField?.(
        elementId,
        selectedCollection.id,
        itemId,
        selectedField.slug,
        "content"
      );
      setBoundLabel(`${selectedCollection.name} › ${selectedField.name}`);
      setIsBound(true);
      setOpen(false);
      setSelectedCollection(null);
      setSelectedField(null);
      setRecords([]);
    },
    [elementId, composer, selectedCollection, selectedField]
  );

  const handleUnbind = React.useCallback(() => {
    if (!elementId) return;
    composer?.cms.bindings?.unbindAll?.(elementId);
    setIsBound(false);
    setBoundLabel(null);
  }, [elementId, composer]);

  const isActive = isBound;
  return (
    <Popover
      open={open}
      onClose={handleClose}
      placement="bottom-end"
      label="Bind to collection field"
      className="tw:w-60"
      trigger={
        <IconButton
          size="sm"
          label="Bind to collection field"
          pressed={isActive}
          aria-expanded={open}
          onClick={() => (open ? handleClose() : setOpen(true))}
        >
          <Link size={12} aria-hidden />
        </IconButton>
      }
    >
      {/* Current binding status */}
      {isBound && boundLabel && (
        <div className={BOUND_CLASS}>
          <span className="tw:flex tw:items-center tw:gap-1 tw:min-w-0 tw:truncate">
            <Link size={10} className="tw:text-[var(--bk-accent-text)]" />
            {boundLabel}
          </span>
          <Button
            color="light"
            size="xs"
            type="button"
            className={UNBIND_BTN_CLASS}
            onClick={handleUnbind}
            title="Remove binding"
            aria-label="Remove binding"
          >
            <Link2Off size={10} />
          </Button>
        </div>
      )}

      <Menu label="Bind to collection" className={MENU_CLASS} autoFocus={false}>
        {/* No collections */}
        {collections.length === 0 && (
          <div className={EMPTY_CLASS}>
            No collections yet.
            <br />
            Create one first.
          </div>
        )}

        {/* Collection list (when no collection selected) */}
        {collections.length > 0 && !selectedCollection && (
          <>
            <MenuLabel>Collections</MenuLabel>
            {collections.map((col) => (
              <MenuItem
                key={col.id}
                onClick={() => handleSelectCollection(col)}
                kbd={`${col.fields.length} fields`}
              >
                {col.name}
              </MenuItem>
            ))}
          </>
        )}

        {/* Field list (collection selected, no field yet) */}
        {selectedCollection && !selectedField && (
          <>
            <MenuItem
              className="tw:text-[var(--bk-accent-text)]"
              onClick={() => setSelectedCollection(null)}
            >
              ← {selectedCollection.name}
            </MenuItem>
            <MenuSeparator />
            <MenuLabel>Fields</MenuLabel>
            {selectedCollection.fields.length === 0 && (
              <div className={EMPTY_CLASS}>No fields defined</div>
            )}
            {selectedCollection.fields.map((field) => (
              <MenuItem
                key={field.id}
                onClick={() => handleSelectField(field.slug, field.name)}
                kbd={field.type}
              >
                {field.name}
              </MenuItem>
            ))}
          </>
        )}

        {/* Record list (field selected) — pick which record to bind. */}
        {selectedCollection && selectedField && (
          <>
            <MenuItem
              className="tw:text-[var(--bk-accent-text)]"
              onClick={() => {
                setSelectedField(null);
                setRecords([]);
              }}
            >
              ← {selectedField.name}
            </MenuItem>
            <MenuSeparator />
            <MenuLabel>Record</MenuLabel>
            {records.length === 0 && (
              <div className={EMPTY_CLASS}>
                No records yet. Add records via the command palette → “Manage CMS Records”.
              </div>
            )}
            {records.map((rec) => {
              const key = selectedCollection.displayField || selectedCollection.fields[0]?.slug;
              const label = key && rec.data[key] != null && rec.data[key] !== ""
                ? String(rec.data[key])
                : "(untitled)";
              return (
                <MenuItem key={rec.id} onClick={() => handleSelectRecord(rec.id)} kbd={rec.status}>
                  {label}
                </MenuItem>
              );
            })}
          </>
        )}
      </Menu>

      {/* Create collection link */}
      <Button
        color="light"
        size="xs"
        type="button"
        className={`tw:w-full tw:mt-1 ${LINK_BTN_CLASS}`}
        onClick={() => {
          handleClose();
          onOpenCreateCollection?.();
        }}
      >
        + Create Collection
      </Button>
    </Popover>
  );
};

export default BindingPopover;
