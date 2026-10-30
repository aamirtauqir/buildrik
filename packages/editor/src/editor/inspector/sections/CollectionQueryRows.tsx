/**
 * A Collection list's query (C-14, docs/design-2l9/engine-list-query.md;
 * 2L9 B5-D76 `189:22915`, B5-D94 `195:27443`): Filter (None / "{n} rules",
 * a card per rule, Remove filter, + Add filter), Match, Sort + Direction,
 * + Then by (≤3 keys), Show, Skip. Every change is one history step on the
 * list's binding (`setListQuery`); the canvas and the publish render read the
 * same query through RepeaterRenderer.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { CMSCollectionBinding } from "@/engine/cms/CMSBindingManager";
import { CMS_COLLECTION_LIMIT_MAX } from "@buildrik/shared/schemas/sites";
import {
  CMS_CONDITION_MAX_RULES,
  CMS_LIST_SORT_MAX_KEYS,
  opsForFieldType,
  type CmsCondition,
  type CmsConditionRule,
  type CmsListSortKey,
} from "@buildrik/shared/schemas/cmsConditions";
import { Button } from "@/editor/chrome-ui";
import { InputWithUnit, SelectRow } from "../shared/controls";
import { CheckRow } from "../shared/controls/CheckRow";
import { NoteRow } from "./behaviourRows";
import { recordContextOf } from "./binding/useCmsBinding";
import { RuleCard } from "./conditions/ConditionsPanel";

const PLAIN =
  "tw:h-8 tw:w-full tw:justify-center tw:border-0 tw:bg-transparent tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:hover:bg-[var(--bk-gray-100)] tw:focus:ring-0";

const isDateLike = (type: string | undefined) => type === "date" || type === "datetime" || type === undefined;

export function CollectionQueryRows({ composer, elementId, binding }: { composer: Composer; elementId: string; binding: CMSCollectionBinding }) {
  const collection = composer.cms.collections.getCollection?.(binding.collectionId);
  const fields = collection?.fields ?? [];
  /* "This page’s {field}": a field of the same slug on the template page's own collection. */
  const page = recordContextOf(composer, elementId);
  const pageFields = page ? page.fields.filter((f) => fields.some((g) => g.slug === f.slug)) : [];
  const set = (query: Parameters<typeof composer.cms.bindings.setListQuery>[1], label: string) => composer.cms.bindings.setListQuery(elementId, query, label);

  const filter = binding.filter;
  const rules = filter?.rules ?? [];
  const writeFilter = (next: CmsConditionRule[], label: string) =>
    set({ filter: next.length ? ({ match: filter?.match ?? "all", rules: next } as CmsCondition) : undefined }, label);
  const newRule = (): CmsConditionRule => {
    const f = fields[0];
    return { field: f?.slug ?? "", op: opsForFieldType(f?.type)[0] };
  };

  const sort: CmsListSortKey[] = binding.sort?.length ? binding.sort : [];
  const keyOptions = [
    { value: "_updated", label: "Updated" },
    { value: "_created", label: "Created" },
    ...fields.map((f) => ({ value: f.slug, label: f.name })),
  ];
  const typeOf = (key: string) => (key.startsWith("_") ? undefined : fields.find((f) => f.slug === key)?.type);
  const dirOptions = (key: string) =>
    isDateLike(typeOf(key))
      ? [
          { value: "desc", label: "Newest first" },
          { value: "asc", label: "Oldest first" },
        ]
      : [
          { value: "asc", label: "A–Z / low to high" },
          { value: "desc", label: "Z–A / high to low" },
        ];
  /* No sort stored = today's order, newest updated first. */
  const shown: CmsListSortKey[] = sort.length ? sort : [{ field: "_updated", dir: "desc" }];
  const writeSort = (next: CmsListSortKey[]) => set({ sort: next }, "Sort list");

  return (
    <div className="tw:flex tw:flex-col" data-testid="collection-query">
      <SelectRow
        label="Filter"
        value={rules.length ? "rules" : ""}
        placeholder="None"
        options={rules.length ? [{ value: "rules", label: rules.length === 1 ? "1 rule" : `${rules.length} rules` }] : []}
        onChange={(v) => {
          if (!v && rules.length) writeFilter([], "Remove filter");
        }}
      />
      {rules.map((rule, i) => (
        <div key={i} className="tw:py-1">
          <RuleCard
            rule={rule}
            fields={fields}
            pageFields={pageFields}
            removeLabel="Remove filter"
            onChange={(r) => writeFilter(rules.map((x, j) => (j === i ? r : x)), "Filter list")}
            onRemove={() => writeFilter(rules.filter((_, j) => j !== i), "Remove filter")}
          />
        </div>
      ))}
      <Button
        color="light"
        size="xs"
        className={PLAIN}
        disabled={fields.length === 0 || rules.length >= CMS_CONDITION_MAX_RULES}
        onClick={() => writeFilter([...rules, newRule()], "Add filter")}
        data-testid="collection-add-filter"
      >
        + Add filter
      </Button>
      <SelectRow
        label="Match"
        value={filter?.match ?? "all"}
        placeholder={null}
        options={[
          { value: "all", label: "All" },
          { value: "any", label: "Any" },
        ]}
        onChange={(match) => filter && set({ filter: { ...filter, match: match as "all" | "any" } }, "Filter list")}
      />
      {shown.map((key, i) => (
        <React.Fragment key={i}>
          <SelectRow
            label={i === 0 ? "Sort" : "Then by"}
            value={key.field}
            placeholder={null}
            options={keyOptions}
            onChange={(field) => writeSort(shown.map((k, j) => (j === i ? { field, dir: isDateLike(typeOf(field)) ? "desc" : "asc" } : k)))}
          />
          <SelectRow
            label="Direction"
            value={key.dir}
            placeholder={null}
            options={dirOptions(key.field)}
            onChange={(dir) => writeSort(shown.map((k, j) => (j === i ? { ...k, dir: dir as "asc" | "desc" } : k)))}
          />
        </React.Fragment>
      ))}
      {shown.length < CMS_LIST_SORT_MAX_KEYS ? (
        <Button
          color="light"
          size="xs"
          className={PLAIN}
          onClick={() => writeSort([...shown, { field: fields[0]?.slug ?? "_created", dir: "asc" }])}
          data-testid="collection-then-by"
        >
          + Then by
        </Button>
      ) : null}
      <InputWithUnit
        label="Show"
        noUnit
        placeholder="All"
        value={binding.limit ? String(binding.limit) : ""}
        onChange={(v) => {
          const n = Number.parseInt(v, 10);
          set({ limit: n > 0 ? Math.min(n, CMS_COLLECTION_LIMIT_MAX) : undefined }, "Show items");
        }}
      />
      <InputWithUnit
        label="Skip"
        noUnit
        placeholder="0"
        value={binding.skip ? String(binding.skip) : "0"}
        onChange={(v) => {
          const n = Number.parseInt(v, 10);
          set({ skip: n > 0 ? Math.min(n, CMS_COLLECTION_LIMIT_MAX) : undefined }, "Skip items");
        }}
      />
      {/* B-27 (2L9 B5-D94): a related list on its own collection's template page. */}
      {page?.id === binding.collectionId ? (
        <CheckRow
          label="Exclude this page’s record"
          checked={Boolean(binding.excludeCurrent)}
          onChange={(on) => set({ excludeCurrent: on }, "Filter list")}
        />
      ) : null}
      {pageFields.length > 0 ? <NoteRow>Filter values follow the record being previewed.</NoteRow> : null}
    </div>
  );
}
