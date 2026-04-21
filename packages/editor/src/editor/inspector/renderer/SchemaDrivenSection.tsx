/**
 * SchemaDrivenSection — composes the existing <Section> header with the
 * schema-driven <InspectorRenderer>. This is the bridge a caller drops into
 * the existing SECTION_REGISTRY (one adapter, all 17 sections) to swap a
 * hand-written section for its schema counterpart.
 *
 * Why this component exists:
 *   - InspectorRenderer is intentionally unaware of collapse state, tier,
 *     icons, and section-header chrome.
 *   - The Section adapter pattern used throughout the existing inspector
 *     expects a component that takes styles + onChange + isOpen + tier.
 *   - This wrapper satisfies that contract while delegating all field
 *     rendering to the schema pipeline.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Section,
  type SectionTier,
} from "../shared/controls/Section";
import { InspectorRenderer } from "./InspectorRenderer";
import type { ControlRegistry, SectionSchema } from "./schema";

export interface SchemaDrivenSectionProps {
  schema: SectionSchema;
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange: (changes: Record<string, string>) => void;
  /** Controlled open state — passed through to <Section>. */
  isOpen?: boolean;
  /** Header toggle callback — passed through to <Section>. */
  onToggle?: (open: boolean) => void;
  /** Visual weight tier. Defaults to "secondary" — same default as
   *  hand-written section components. */
  tier?: SectionTier;
  /** DOM id for sub-nav scroll anchors. Matches existing convention. */
  id?: string;
  /** Optional registry overrides threaded into InspectorRenderer. */
  registry?: Partial<ControlRegistry>;
}

export const SchemaDrivenSection: React.FC<SchemaDrivenSectionProps> = ({
  schema,
  styles,
  onChange,
  onBatchChange,
  isOpen,
  onToggle,
  tier = "secondary",
  id,
  registry,
}) => (
  <Section
    title={schema.label}
    icon={schema.icon}
    isOpen={isOpen}
    onToggle={onToggle}
    tier={tier}
    id={id ?? `inspector-section-${schema.id}`}
  >
    <InspectorRenderer
      schema={schema}
      styles={styles}
      onChange={onChange}
      onBatchChange={onBatchChange}
      registry={registry}
    />
  </Section>
);
