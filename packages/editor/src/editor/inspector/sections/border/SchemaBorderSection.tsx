/**
 * SchemaBorderSection — BorderSection replacement powered by borderSchema.
 *
 * Matches the BorderSectionProps shape so a one-line swap in registry.tsx
 * activates it. Advanced-disclosure state is NOT threaded from the context
 * (advancedExpanded / onAdvancedToggle); the schema's `advanced-group` owns
 * its own local disclosure state. A future session can lift that state if
 * the existing advanced-toggle persistence turns out to matter in practice.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { BorderSectionProps } from "../BorderSection";
import { SchemaDrivenSection } from "../../renderer/SchemaDrivenSection";
import { borderSchema } from "../../renderer/schemas/border";

/**
 * Prop shape matches BorderSectionProps exactly so defineSection's generic
 * `P` unifies across both components. advancedExpanded / onAdvancedToggle
 * are accepted (for prop-contract parity) but unused — advanced-group
 * manages its own local disclosure state.
 */
export type SchemaBorderSectionProps = BorderSectionProps;

export const SchemaBorderSection: React.FC<SchemaBorderSectionProps> = ({
  styles,
  onChange,
  onBatchChange,
  isOpen,
  onToggle,
  tier,
}) => (
  <SchemaDrivenSection
    schema={borderSchema}
    styles={styles}
    onChange={onChange}
    onBatchChange={onBatchChange ?? ((_changes) => undefined)}
    isOpen={isOpen}
    onToggle={onToggle}
    tier={tier}
  />
);
