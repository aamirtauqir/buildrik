import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * InspectorRenderer — turns a SectionSchema into React.
 *
 * Week 5-6 foundation (editor-chrome DS rollout, Survivor #4).
 *
 * The renderer is deliberately thin:
 *   1. Iterate schema.fields.
 *   2. Evaluate each field's `conditional` (if any) against styles.
 *   3. For atomic fields: resolve the control from the registry by
 *      field.type and render it.
 *   4. For `advanced-group`: render a disclosure toggle that, when open,
 *      recursively renders the nested atomic fields via the same pipeline.
 *
 * Known non-goals (future sessions):
 *   - Section collapse state (caller wraps with <Section> when needed)
 *   - Multi-select mixed-value indicators
 *   - Nested advanced-groups (one level only, by design)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { defaultControlRegistry } from "./controlRegistry";
import type {
  AtomicField,
  ControlProps,
  ControlRegistry,
  Field,
  SectionSchema,
} from "./schema";

export interface InspectorRendererProps {
  schema: SectionSchema;
  styles: Readonly<Record<string, string>>;
  onChange: (prop: string, value: string) => void;
  onBatchChange: (changes: Record<string, string>) => void;
  /**
   * Optional per-caller registry overrides. Merged over defaultControlRegistry
   * so callers can swap one control without reimplementing the rest.
   */
  registry?: Partial<ControlRegistry>;
}

/** Fields that read/write via the `prop` axis. */
function hasProp(
  field: AtomicField,
): field is Exclude<
  AtomicField,
  { type: "spacing4" | "corners4" | "group-heading" }
> {
  return (
    field.type !== "spacing4" &&
    field.type !== "corners4" &&
    field.type !== "group-heading"
  );
}

/** Structural fields that render without input semantics. */
function isDisplayOnly(field: AtomicField): boolean {
  return field.type === "group-heading";
}

function getValue(
  field: AtomicField,
  styles: Readonly<Record<string, string>>,
): string {
  if (!hasProp(field)) return "";
  return styles[field.prop] ?? "";
}

function atomicKey(field: AtomicField, index: number): string {
  if (field.type === "spacing4") return `spacing4-${field.group}-${index}`;
  if (field.type === "corners4") return `corners4-${index}`;
  if (field.type === "group-heading") return `heading-${index}-${field.label}`;
  return `${field.type}-${field.prop}-${index}`;
}

// ============================================================================
// ATOMIC FIELD → control lookup and render
// ============================================================================

function renderAtomic(
  field: AtomicField,
  index: number,
  resolved: ControlRegistry,
  styles: Readonly<Record<string, string>>,
  onChange: (prop: string, value: string) => void,
  onBatchChange: (changes: Record<string, string>) => void,
  sectionId: string,
): React.ReactNode {
  if (
    !isDisplayOnly(field) &&
    "conditional" in field &&
    field.conditional &&
    !field.conditional(styles)
  ) {
    return null;
  }

  const Control = resolved[field.type] as React.FC<ControlProps<typeof field>>;
  if (!Control) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        `InspectorRenderer: no control registered for field.type="${field.type}" in section "${sectionId}".`,
      );
    }
    return null;
  }

  const value = getValue(field, styles);
  const handleChange = (next: string) => {
    if (!hasProp(field)) return;
    onChange(field.prop, next);
  };

  return (
    <Control
      key={atomicKey(field, index)}
      field={field}
      value={value}
      onChange={handleChange}
      onBatchChange={onBatchChange}
      styles={styles}
    />
  );
}

// ============================================================================
// ADVANCED GROUP — disclosure wrapping nested atomic fields
// ============================================================================

const discloseButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 8px",
  fontSize: 12,
  color: "var(--buildrick-text-secondary)",
  background: "transparent",
  border: "1px solid var(--buildrick-border)",
  borderRadius: 4,
  cursor: "pointer",
};

interface AdvancedGroupShellProps {
  label: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

const AdvancedGroupShell: React.FC<AdvancedGroupShellProps> = ({
  label,
  defaultExpanded,
  children,
}) => {
  const [expanded, setExpanded] = React.useState(Boolean(defaultExpanded));
  return (
    <div>
      <Button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        style={discloseButtonStyle}
      >
        {expanded ? "▾" : "▸"} {label}
      </Button>
      {expanded && (
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>{children}</div>
      )}
    </div>
  );
};

// ============================================================================
// ROOT
// ============================================================================

export const InspectorRenderer: React.FC<InspectorRendererProps> = ({
  schema,
  styles,
  onChange,
  onBatchChange,
  registry,
}) => {
  const resolved = React.useMemo<ControlRegistry>(
    () => ({ ...defaultControlRegistry, ...registry }),
    [registry],
  );

  return (
    <div
      data-inspector-renderer={schema.id}
      style={{
        display: "grid",
        gridTemplateColumns:
          schema.columns === 2 ? "repeat(2, minmax(0, 1fr))" : "1fr",
        gap: 8,
      }}
    >
      {schema.fields.map((field: Field, index) => {
        if (field.type === "advanced-group") {
          return (
            <AdvancedGroupShell
              key={`advanced-${index}-${field.label}`}
              label={field.label}
              defaultExpanded={field.defaultExpanded}
            >
              {field.fields.map((child, childIdx) =>
                renderAtomic(
                  child,
                  childIdx,
                  resolved,
                  styles,
                  onChange,
                  onBatchChange,
                  schema.id,
                ),
              )}
            </AdvancedGroupShell>
          );
        }
        return renderAtomic(
          field,
          index,
          resolved,
          styles,
          onChange,
          onBatchChange,
          schema.id,
        );
      })}
    </div>
  );
};
