/**
 * InspectorRenderer — turns a SectionSchema into React.
 *
 * Week 5-6 foundation (editor-chrome DS rollout, Survivor #4).
 *
 * The renderer is deliberately thin:
 *   1. Iterate schema.fields.
 *   2. Evaluate each field's `conditional` (if any) against styles.
 *   3. Resolve the control from the registry by field.type.
 *   4. Build ControlProps (value, onChange, onBatchChange, styles).
 *   5. Render.
 *
 * The renderer does NOT know about:
 *   - Section collapse state (caller wraps with <Section> when needed)
 *   - Advanced-disclosure groupings
 *   - Multi-select mixed-value indicators (future session)
 *
 * Those concerns live in the caller / registry wrapper so the renderer
 * stays a pure schema-to-JSX function.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { defaultControlRegistry } from "./controlRegistry";
import type {
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

function isCompound(field: Field): boolean {
  return field.type === "spacing4";
}

function getValue(
  field: Field,
  styles: Readonly<Record<string, string>>,
): string {
  if (isCompound(field)) return "";
  return styles[(field as { prop: string }).prop] ?? "";
}

function keyFor(field: Field, index: number): string {
  if (isCompound(field)) {
    return `${field.type}-${(field as { group: string }).group}-${index}`;
  }
  return `${field.type}-${(field as { prop: string }).prop}-${index}`;
}

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
      {schema.fields.map((field, index) => {
        if (field.conditional && !field.conditional(styles)) return null;

        const Control = resolved[field.type] as React.FC<
          ControlProps<typeof field>
        >;
        if (!Control) {
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.warn(
              `InspectorRenderer: no control registered for field.type="${field.type}" in section "${schema.id}".`,
            );
          }
          return null;
        }

        const value = getValue(field, styles);
        const handleChange = (next: string) => {
          if (isCompound(field)) return;
          onChange((field as { prop: string }).prop, next);
        };

        return (
          <Control
            key={keyFor(field, index)}
            field={field}
            value={value}
            onChange={handleChange}
            onBatchChange={onBatchChange}
            styles={styles}
          />
        );
      })}
    </div>
  );
};
