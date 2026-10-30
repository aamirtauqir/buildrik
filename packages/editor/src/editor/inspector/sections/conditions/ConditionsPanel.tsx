/**
 * Content › Conditions (B-11; 2L9 B4-D04…D10 `255:94411`…`258:35104`,
 * B5-D54 `182:18493`). Two pieces:
 *
 *   ConditionsSection — the tab's row "Conditions · {n} · Hidden | Shown |
 *     Inactive"; it opens the subview.
 *   ConditionsPanel — the subview "‹ Back to Content · Conditions":
 *     Match All / Any, a card per rule (field · operator · value · Remove
 *     rule), what the preview record makes of it ("Sunday is empty. This
 *     condition is false." / "Hidden on this record — showing as ghost."),
 *     + Add rule, the privacy note, Open source ›. Empty: "Show this element
 *     on every record." The pre-CMS "old Conditions" binding shows as "Not
 *     active — from old Conditions" with Activate condition / Keep inactive.
 *
 * Every write is one history step with its receipt and an Undo bound to it.
 * Offered only where the element has a record to read (a Collection list, a
 * template page) or already carries a condition.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { useShowHiddenElements } from "@/editor/canvas/hiddenElementsPref";
import type { Composer } from "@/engine";
import { BK_SELECT_BARE_VALUE_THEME, Button, Select, useToast } from "@/editor/chrome-ui";
import { ChevronDown } from "lucide-react";
import { EVENTS } from "@/shared/constants/events";
import {
  CMS_CONDITION_MAX_RULES,
  CMS_CONDITION_OP_LABEL,
  OPS_WITH_VALUE,
  opsForFieldType,
  type CmsCondition,
  type CmsConditionOp,
  type CmsConditionRule,
} from "@buildrik/shared/schemas/cmsConditions";
import { SelectRow, Section } from "@/editor/inspector/shared/controls";
import { WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";
import { closeSubview, openSubview } from "@/editor/inspector/tabs/subviewStore";
import { CommitRow, NoteRow } from "../behaviourRows";
import type { CMSFieldType } from "@/shared/types/cms";
import { ruleLabel, useConditions, type ConditionsState } from "./useConditions";

const LINK = "tw:h-8 tw:self-center tw:text-[13px] tw:font-normal";
/* 2L9 D08: the card's plain centred actions ("Remove rule", "+ Add rule"). */
const PLAIN =
  "tw:h-8 tw:w-full tw:justify-center tw:border-0 tw:bg-transparent tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:hover:bg-[var(--bk-gray-100)] tw:focus:ring-0";
const NOTE = "tw:m-0 tw:py-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const CARD = "tw:flex tw:flex-col tw:gap-1 tw:rounded-[6px] tw:bg-[var(--bk-bg-subtle)] tw:p-2";

/** Rules whose field the collection no longer has (2L9 B5-D35 / D45 / D58);
 *  a dotted path names its field by the first segment. */
function missingRules(state: Pick<ConditionsState, "condition" | "collection">): Array<{ rule: CmsConditionRule; i: number }> {
  if (!state.condition || !state.collection) return [];
  const slugs = new Set(state.collection.fields.map((f) => f.slug));
  return state.condition.rules.map((rule, i) => ({ rule, i })).filter(({ rule }) => !slugs.has(rule.field.split(".")[0]));
}

/** "1 · Hidden" — what the closed row says. */
export function conditionsSummary(state: Pick<ConditionsState, "condition" | "passes" | "legacy" | "collection">): string | null {
  if (state.condition) {
    const n = state.condition.rules.length;
    if (missingRules(state).length > 0) return `${n} · Needs repair`;
    return state.passes === null ? `${n}` : `${n} · ${state.passes ? "Shown" : "Hidden"}`;
  }
  if (state.legacy) return "1 · Inactive";
  return "None";
}

export interface ConditionsSectionProps {
  composer: Composer | null | undefined;
  elementId: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

/** The tab's row: opening it opens the subview, and the row stays shut. */
export function ConditionsSection({ composer, elementId, isOpen, onToggle }: ConditionsSectionProps) {
  const state = useConditions(composer, elementId);
  React.useEffect(() => {
    if (!isOpen) return;
    openSubview({ kind: "conditions", elementId });
    onToggle?.();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Section title="Conditions" isOpen={false} preview={conditionsSummary(state)} onToggle={() => openSubview({ kind: "conditions", elementId })}>
      {null}
    </Section>
  );
}

/** A full-width select drawn like the column's (the card has no labels, D08). */
function CardSelect({ label, value, disabled, onChange, children }: { label: string; value: string; disabled?: boolean; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="bdi-ddn tw:w-full">
      <Select aria-label={label} className="bdi-v" theme={BK_SELECT_BARE_VALUE_THEME} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        {children}
      </Select>
      <ChevronDown size={12} aria-hidden="true" className="bdi-c" />
    </div>
  );
}

/** One rule: field · operator · value · its remove action. Shared by
 *  Conditions and a Collection list's Filter (C-14). `pageFields` offers
 *  "This page’s {field}" (`@page.<slug>`) on a template page. */
export function RuleCard({
  rule,
  fields,
  onChange,
  onRemove,
  removeLabel = "Remove rule",
  pageFields = [],
}: {
  rule: CmsConditionRule;
  fields: ReadonlyArray<{ slug: string; name: string; type: CMSFieldType }>;
  onChange: (next: CmsConditionRule) => void;
  onRemove: () => void;
  removeLabel?: string;
  pageFields?: ReadonlyArray<{ slug: string; name: string }>;
}) {
  const field = fields.find((f) => f.slug === rule.field);
  const ops = opsForFieldType(field?.type);
  const fieldOptions = [
    ...(field ? [] : [{ value: rule.field, label: rule.field }]),
    ...fields.map((f) => ({ value: f.slug, label: f.name })),
  ];
  return (
    <div className={CARD} data-testid="condition-rule">
      {/* 2L9 D08: two full-width selects, field then rule. */}
      <CardSelect
        label="Field"
        value={rule.field}
        onChange={(slug) => {
          const next = fields.find((f) => f.slug === slug);
          const nextOps = opsForFieldType(next?.type);
          onChange({ field: slug, op: nextOps.includes(rule.op) ? rule.op : nextOps[0] });
        }}
      >
        {fieldOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </CardSelect>
      <CardSelect
        label="Rule"
        value={rule.op}
        onChange={(v) => {
          const op = v as CmsConditionOp;
          onChange({ field: rule.field, op, ...(OPS_WITH_VALUE.has(op) ? { value: rule.value ?? "" } : {}) });
        }}
      >
        {(ops.includes(rule.op) ? ops : [rule.op, ...ops]).map((op) => (
          <option key={op} value={op}>
            {CMS_CONDITION_OP_LABEL[op]}
          </option>
        ))}
      </CardSelect>
      {OPS_WITH_VALUE.has(rule.op) && pageFields.length > 0 ? (
        <CardSelect label="Value from" value={rule.value?.startsWith("@page.") ? rule.value : ""} onChange={(v) => onChange({ ...rule, value: v })}>
          <option value="">Custom value</option>
          {pageFields.map((f) => (
            <option key={f.slug} value={`@page.${f.slug}`}>
              This page’s {f.name.toLowerCase()}
            </option>
          ))}
        </CardSelect>
      ) : null}
      {OPS_WITH_VALUE.has(rule.op) && !rule.value?.startsWith("@page.") ? (
        <CommitRow
          label="Value"
          value={rule.value ?? ""}
          placeholder={field?.type === "date" || field?.type === "datetime" ? "2026-01-31" : "Value"}
          onCommit={(value) => onChange({ ...rule, value })}
        />
      ) : null}
      <Button color="light" size="xs" className={PLAIN} onClick={onRemove} data-testid="condition-remove-rule">
        {removeLabel}
      </Button>
    </div>
  );
}

export function ConditionsPanel({ composer, elementId }: { composer: Composer | null | undefined; elementId: string }) {
  const state = useConditions(composer, elementId);
  const { addToast } = useToast();
  const [reviewLegacy, setReviewLegacy] = React.useState(true);
  const rulesRef = React.useRef<HTMLDivElement>(null);
  const showHidden = useShowHiddenElements();
  const back = () => closeSubview("conditions");

  const write = (next: CmsCondition | null, label: string, receipt: string) => {
    if (!composer || !state.set(next, label)) return;
    addToast({ description: receipt, action: { label: "Undo", onClick: composer.history.captureUndo() } });
  };
  const firstField = state.collection?.fields[0];
  const newRule = (): CmsConditionRule => ({ field: firstField?.slug ?? "", op: opsForFieldType(firstField?.type)[0] });
  const addRule = () => {
    if (!firstField) return;
    if (!state.condition) write({ match: "all", rules: [newRule()] }, "Add visibility condition", "Visibility condition added");
    else if (state.condition.rules.length < CMS_CONDITION_MAX_RULES)
      write({ ...state.condition, rules: [...state.condition.rules, newRule()] }, "Edit visibility condition", "Visibility condition changed");
  };
  const editRule = (i: number, rule: CmsConditionRule) => {
    if (!state.condition) return;
    const rules = state.condition.rules.map((r, j) => (j === i ? rule : r));
    state.set({ ...state.condition, rules }, "Edit visibility condition");
  };
  const removeRule = (i: number) => {
    if (!state.condition) return;
    const rules = state.condition.rules.filter((_, j) => j !== i);
    if (rules.length === 0) write(null, "Remove visibility condition", "Visibility condition removed");
    else write({ ...state.condition, rules }, "Edit visibility condition", "Visibility condition changed");
  };
  const openSource = () => {
    if (!composer || !state.collection) return;
    composer.emit(EVENTS.UI_CMS_OPEN, { collectionId: state.collection.id, ...(state.record ? { recordId: state.record.id } : {}) });
  };

  const header = (
    <>
      <Button type="button" variant="link" size="xs" className={LINK} onClick={back} data-testid="conditions-back">
        ‹ Back to Content
      </Button>
      <div className="tw:mt-2 tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink)]">Conditions</div>
    </>
  );

  /* 2L9 D07: an old condition, preserved and inactive, reviewed first. */
  if (!state.condition && state.legacy && reviewLegacy) {
    const preview = state.legacy.converted?.rules[0];
    return (
      <div className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:py-2" data-testid="conditions-legacy">
        {header}
        <p className="tw:m-0 tw:py-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-warning-text)]">Not active — from old Conditions</p>
        {preview ? (
          <div className={CARD}>
            {/* Shown as the rule it becomes, shut until activated. */}
            <CardSelect label="Field" value={preview.field} disabled onChange={() => undefined}>
              <option value={preview.field}>{preview.field}</option>
            </CardSelect>
            <CardSelect label="Rule" value={preview.op} disabled onChange={() => undefined}>
              <option value={preview.op}>
                {CMS_CONDITION_OP_LABEL[preview.op]}
                {preview.value ? ` ${preview.value}` : ""}
              </option>
            </CardSelect>
            <Button color="light" size="xs" className={PLAIN} onClick={state.removeLegacy} data-testid="conditions-legacy-remove">
              Remove rule
            </Button>
          </div>
        ) : (
          <p className={NOTE}>This old condition cannot be converted; it stays inactive.</p>
        )}
        <p className={NOTE}>The existing condition is preserved. The element currently shows on the live site.</p>
        {state.legacy.converted ? (
          <Button
            size="xs"
            className={`${WIDE_BUTTON} tw:text-white!`}
            data-testid="conditions-legacy-activate"
            onClick={() => {
              if (composer && state.activateLegacy())
                addToast({ description: "Legacy condition activated", action: { label: "Undo", onClick: composer.history.captureUndo() } });
            }}
          >
            Activate condition
          </Button>
        ) : null}
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => setReviewLegacy(false)} data-testid="conditions-legacy-keep">
          Keep inactive
        </Button>
        <p className={NOTE}>Activation replaces the legacy rule in one Undo step.</p>
      </div>
    );
  }

  if (!state.condition) {
    return (
      <div className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:py-2" data-testid="conditions-empty">
        {header}
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">Show this element on every record.</p>
        <Button color="light" size="xs" className={WIDE_BUTTON} disabled={!firstField} onClick={addRule} data-testid="conditions-add-rule">
          + Add rule
        </Button>
        <p className={NOTE}>Conditions control visibility. Device visibility stays in Behavior.</p>
      </div>
    );
  }

  const failing = state.failing;
  /* 2L9 B5-D35 / D45: a rule whose field the collection no longer has. The
     shared evaluator reads it as empty, so the live result is the same as
     the canvas's — the line says which, not the board's "will show". */
  const missing = missingRules(state);
  const focusField = (i: number) => rulesRef.current?.querySelector<HTMLSelectElement>(`[data-rule-index="${i}"] select`)?.focus();
  return (
    <div className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:py-2" data-testid="conditions-panel">
      {header}
      <SelectRow
        label="Match"
        value={state.condition.match}
        placeholder={null}
        options={[
          { value: "all", label: "All" },
          { value: "any", label: "Any" },
        ]}
        onChange={(match) => state.set({ ...state.condition!, match: match as "all" | "any" }, "Edit visibility condition")}
      />
      <div ref={rulesRef} className="tw:flex tw:flex-col tw:gap-2">
        {state.condition.rules.map((rule, i) => (
          <div key={i} data-rule-index={i}>
            <RuleCard rule={rule} fields={state.collection?.fields ?? []} onChange={(r) => editRule(i, r)} onRemove={() => removeRule(i)} />
          </div>
        ))}
      </div>
      {missing.length > 0 ? (
        <div data-testid="conditions-missing">
          {missing.map(({ rule, i }) => (
            <p key={i} className={NOTE}>
              {rule.field.split(".").pop()} no longer exists —{" "}
              <Button type="button" variant="link" size="xs" className="tw:inline tw:h-auto tw:p-0 tw:text-[12px] tw:font-normal" onClick={() => focusField(i)}>
                Choose field
              </Button>
            </p>
          ))}
          {state.passes !== null ? (
            <p className={NOTE}>Read as empty on the live site — this element will {state.passes ? "show" : "hide"}.</p>
          ) : null}
        </div>
      ) : state.passes === false ? (
        <div data-testid="conditions-result">
          {failing ? (
            <p className={NOTE}>
              {failing.op === "set"
                ? `${ruleLabel(failing, state.collection)} is empty. This condition is false.`
                : `${ruleLabel(failing, state.collection)} ${CMS_CONDITION_OP_LABEL[failing.op]}${failing.value ? ` ${failing.value}` : ""} is false on this record.`}
            </p>
          ) : null}
          {/* B5-D34: the ghost only exists while Show hidden elements is on. */}
          <p className={NOTE}>{showHidden ? "Hidden on this record — showing as ghost." : "Hidden on this record. Enable Show hidden elements to see it on canvas."}</p>
        </div>
      ) : state.passes === true ? (
        <div data-testid="conditions-result">
          {/* 2L9 B5-D46: one "is set" rule names what made it true. */}
          {state.condition.rules.length === 1 && state.condition.rules[0].op === "set" ? (
            <p className={NOTE}>{ruleLabel(state.condition.rules[0], state.collection)} is set. This condition is true.</p>
          ) : null}
          <p className={NOTE}>Shown on this record and in published output.</p>
        </div>
      ) : null}
      <Button color="light" size="xs" className={PLAIN} onClick={addRule} data-testid="conditions-add-rule">
        + Add rule
      </Button>
      <NoteRow>Hidden content stays in the page source. Do not use conditions to protect private information.</NoteRow>
      {state.collection ? (
        <Button type="button" variant="link" size="xs" className={LINK} onClick={openSource} data-testid="conditions-open-source">
          Open source ›
        </Button>
      ) : null}
    </div>
  );
}
