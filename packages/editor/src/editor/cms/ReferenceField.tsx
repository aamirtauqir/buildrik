/**
 * ReferenceField — a Reference field's record picker (PD-1 = build; DM-11 /
 * UI-05: it was a raw id text box and nothing resolved it). The record
 * boards draw the reference (Category) as a 32px select showing the chosen
 * record's name (4428:144760), so this is that select over the target
 * collection's records, named by their display field.
 *
 * A stored id the target no longer holds is a "Deleted record" with Clear
 * (§7 "Deleted reference"), not a raw id.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { CMSContentItem, CMSField } from "@/shared/types/cms";
import { Button, Select } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants";
import { recordTitle } from "./RecordsTable";

export interface ReferenceFieldProps {
  id: string;
  composer: Composer | null;
  field: CMSField;
  value: unknown;
  className: string;
  onChange: (recordId: string) => void;
}

export function ReferenceField({ id, composer, field, value, className, onChange }: ReferenceFieldProps) {
  const target = field.referenceCollection ? composer?.cms.collections.getCollection(field.referenceCollection) ?? null : null;
  const [records, setRecords] = React.useState<CMSContentItem[] | null>(null);
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const store = composer?.cms.collections;
    if (!store?.on) return;
    const bump = () => setTick((t) => t + 1);
    store.on(EVENTS.CMS_STORE_REFRESHED, bump);
    return () => {
      store.off?.(EVENTS.CMS_STORE_REFRESHED, bump);
    };
  }, [composer]);
  React.useEffect(() => {
    let live = true;
    if (!target || !composer) {
      setRecords([]);
      return;
    }
    void composer.cms.collections.getContentItems(target.id).then((rows) => live && setRecords(rows));
    return () => {
      live = false;
    };
  }, [composer, target, tick]);

  const chosen = typeof value === "string" ? value : "";
  if (!target) {
    return (
      <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid={`${id}-no-target`}>
        The collection this field points at is gone · choose another in Fields
      </span>
    );
  }
  const deleted = records !== null && chosen !== "" && !records.some((r) => r.id === chosen);
  if (deleted) {
    return (
      <span className="tw:flex tw:h-8 tw:items-center tw:gap-2" data-testid={`${id}-deleted`}>
        <span className="tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]">Deleted record</span>
        <Button size="xs" variant="link" className="tw:h-auto tw:min-h-0 tw:p-0 tw:text-[12px]" onClick={() => onChange("")} data-testid={`${id}-clear`}>
          Clear
        </Button>
      </span>
    );
  }
  return (
    <Select id={id} sizing="sm" className={className} value={chosen} onChange={(e) => onChange(e.target.value)}>
      <option value="">—</option>
      {(records ?? []).map((r) => (
        <option key={r.id} value={r.id}>
          {recordTitle(target, r)}
          {r.status === "published" ? "" : " · Draft"}
        </option>
      ))}
    </Select>
  );
}
