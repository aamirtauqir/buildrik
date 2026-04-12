/**
 * ProInspector Tabs - Barrel Export
 *
 * Phase 6 restructure replaced the three per-tab components
 * (LayoutTab / AppearanceTab / EffectsTab) with a single declarative
 * InspectorTabContent renderer that reads from the section registry and
 * element profile. See sections/registry.tsx and config/elementProfiles.ts.
 *
 * @license BSD-3-Clause
 */

export { InspectorTabContent } from "./InspectorTabContent";
export type { InspectorTabContentProps } from "./InspectorTabContent";
