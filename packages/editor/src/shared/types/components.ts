/**
 * Component Type Definitions
 * Types for reusable components (symbols) and instances
 *
 * @module types/components
 * @license BSD-3-Clause
 */

import type { Patch } from "../../engine/utils/JsonPatch";
import type { ElementData } from "./index";

// ============================================
// Component Definition Types
// ============================================

/**
 * Reusable component definition (master component)
 */
export interface ComponentDefinition {
  /** Unique component ID */
  id: string;
  /** Component name */
  name: string;
  /** Optional description */
  description?: string;
  /** Category for organization */
  category?: string;
  /** Tags for search */
  tags?: string[];
  /** Master element tree (source of truth) */
  masterTree: ElementData;
  /** Thumbnail preview (base64 or URL) */
  thumbnail?: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last modified timestamp */
  updatedAt: number;
  /** Version number for change tracking */
  version: number;
  /** GAP-FIX: Variant properties for this component (e.g., Size, State, Theme) */
  variantProperties?: VariantProperty[];
  /** GAP-FIX: Available variants (combinations of property values) */
  variants?: ComponentVariant[];
  /** GAP-FIX: Default variant ID to use when instantiating */
  defaultVariantId?: string;
}

// ============================================
// Variant Types (GAP-FIX)
// ============================================

/**
 * Defines a single axis of variation (e.g., "Size" with values ["S", "M", "L"])
 */
export interface VariantProperty {
  /** Property name (e.g., "Size", "State", "Theme") */
  name: string;
  /** Available values for this property */
  values: string[];
  /** Default value when creating new instances */
  defaultValue: string;
}

/**
 * A specific variant combination with its style overrides
 * Example: Size="M", State="Hover" with specific style changes
 */
export interface ComponentVariant {
  /** Unique variant ID */
  id: string;
  /** Human-readable name (e.g., "Medium / Hover") */
  name: string;
  /** Property values for this variant (e.g., { Size: "M", State: "Hover" }) */
  propertyValues: Record<string, string>;
  /** Style overrides for this variant (applied on top of master styles) */
  styleOverrides?: ElementStyleOverride[];
  /** Attribute overrides for this variant */
  attributeOverrides?: Record<string, string>;
  /** Thumbnail preview for this variant */
  thumbnail?: string;
}

/**
 * Style override for a variant
 */
export interface ElementStyleOverride {
  /** Element path within component (relative to root, e.g., "children[0]" for first child) */
  elementPath: string;
  /** CSS property name */
  property: string;
  /** CSS value */
  value: string;
}

/**
 * Instance variant selection (stored on ComponentInstance)
 */
export interface InstanceVariantSelection {
  /** Currently selected variant ID */
  variantId: string;
  /** Property value overrides on the instance level */
  propertyOverrides?: Record<string, string>;
}

/**
 * Component instance - a placed instance of a component
 */
export interface ComponentInstance {
  /** Instance element ID (root element of this instance) */
  elementId: string;
  /** Reference to master component ID */
  componentId: string;
  /** Overrides as JSON patches from master state */
  overrides: Patch;
  /** Version of master when this instance was last synced */
  syncedVersion: number;
  /** Is this instance detached (no longer linked to master)? */
  isDetached: boolean;
  /** GAP-FIX: Currently selected variant for this instance */
  variantSelection?: InstanceVariantSelection;
}

// ============================================
// Override Types
// ============================================

/**
 * Types of properties that can be overridden on instances
 */
export type OverrideType =
  | "content" // Text content
  | "style" // Style properties
  | "attribute" // HTML attributes
  | "trait"; // Trait values

/**
 * Override specification for a single property
 */
export interface Override {
  /** Path to the property (JSON pointer format) */
  path: string;
  /** Override type */
  type: OverrideType;
  /** New value */
  value: unknown;
  /** Timestamp when override was created */
  createdAt: number;
}

/**
 * Track which properties are overridden on an instance
 */
export interface OverrideMap {
  /** Instance element ID */
  instanceId: string;
  /** Map of path to override info */
  overrides: Map<string, Override>;
}

// ============================================
// Storage Types
// ============================================

/**
 * IndexedDB stored component entry
 */
export interface StoredComponent {
  /** Component ID (used as key) */
  id: string;
  /** Project ID for indexing */
  projectId: string;
  /** Component data */
  data: ComponentDefinition;
  /** Last updated timestamp */
  updatedAt: number;
}

// ============================================
// Event Payload Types
// ============================================

/**
 * Component created event payload
 */
export interface ComponentCreatedPayload {
  component: ComponentDefinition;
  sourceElementId?: string;
}

/**
 * Component updated event payload
 */
export interface ComponentUpdatedPayload {
  component: ComponentDefinition;
  changedFields: string[];
}

/**
 * Component deleted event payload
 */
export interface ComponentDeletedPayload {
  componentId: string;
  componentName: string;
  instanceCount: number;
}

/**
 * Component instantiated event payload
 */
export interface ComponentInstantiatedPayload {
  instance: ComponentInstance;
  component: ComponentDefinition;
  parentId: string;
}

/**
 * Instance synced event payload
 */
export interface InstanceSyncedPayload {
  instanceId: string;
  componentId: string;
  previousVersion: number;
  newVersion: number;
}

/**
 * Instance detached event payload
 */
export interface InstanceDetachedPayload {
  instanceId: string;
  componentId: string;
  componentName: string;
}

/**
 * Instance override event payload
 */
export interface InstanceOverridePayload {
  instanceId: string;
  path: string;
  type: OverrideType;
  value: unknown;
}

// ============================================
// Configuration Types
// ============================================

/**
 * Component manager configuration
 */
export interface ComponentManagerConfig {
  /** Maximum components per project */
  maxComponents: number;
  /** Whether to auto-sync instances when master changes */
  autoSyncInstances: boolean;
  /** Whether components are enabled */
  enabled: boolean;
}

/**
 * Default component manager configuration
 */
export const DEFAULT_COMPONENT_CONFIG: ComponentManagerConfig = {
  maxComponents: 100,
  autoSyncInstances: true,
  enabled: true,
};

// ============================================
// Utility Types
// ============================================

/**
 * Component with instance count for display
 */
export interface ComponentWithStats extends ComponentDefinition {
  /** Number of instances in the project */
  instanceCount: number;
}

/**
 * Result of instance sync operation
 */
export interface SyncResult {
  success: boolean;
  instanceId: string;
  overridesPreserved: number;
  overridesConflicted: number;
  errors?: string[];
}
