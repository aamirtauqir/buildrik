/**
 * Aquibra Data Sources Types
 * Type definitions for data binding and dynamic content
 *
 * @module types/data
 * @license BSD-3-Clause
 */

/**
 * JSON-compatible value types for data sources
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Data source types
 */
export type DataSourceType = "object" | "array" | "function" | "api";

/**
 * Data source definition
 */
export interface DataSource {
  /** Unique identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Data source type */
  type: DataSourceType;

  /** Static data (for object/array types) */
  data?: JsonValue | Record<string, unknown>;

  /** Function that returns data (for function type) */
  getData?: () => JsonValue | Promise<JsonValue>;

  /** API endpoint (for api type) */
  endpoint?: string;

  /** Schema/structure of the data */
  schema?: DataSchema;

  /** Description */
  description?: string;
}

/**
 * Data schema - describes structure of data
 */
export interface DataSchema {
  /** Schema type */
  type: "object" | "array" | "string" | "number" | "boolean";

  /** Properties (for object type) */
  properties?: Record<string, DataSchema>;

  /** Items schema (for array type) */
  items?: DataSchema;

  /** Is this field required? */
  required?: boolean;

  /** Default value */
  default?: JsonValue;
}

/** Transform function type for data bindings */
export type DataTransformFn = (value: unknown) => unknown;

/**
 * Data binding - connects element property to data source
 */
export interface DataBinding {
  /** Data source ID */
  sourceId: string;

  /** Path to data (e.g., "user.profile.name") */
  path: string;

  /** Transform function */
  transform?: DataTransformFn;

  /** Fallback value if data is undefined */
  fallback?: JsonValue;

  /** Binding type */
  type: DataBindingType;
}

/**
 * Data binding types
 */
export type DataBindingType =
  | "variable" // Simple variable replacement
  | "collection" // Loop through array
  | "condition"; // Conditional rendering

/**
 * Variable binding - replaces content with data value
 */
export interface VariableBinding extends DataBinding {
  type: "variable";
}

/**
 * Collection binding - loops through array
 */
export interface CollectionBinding extends DataBinding {
  type: "collection";

  /** Variable name for each item (e.g., "product") */
  itemVar: string;

  /** Variable name for index (e.g., "index") */
  indexVar?: string;
}

/**
 * Condition binding - shows/hides based on condition
 */
export interface ConditionBinding extends DataBinding {
  type: "condition";

  /** Condition expression */
  condition: ConditionExpression | LogicGroup;
}

/**
 * Condition expression
 */
export interface ConditionExpression {
  /** Operator */
  operator: ConditionOperator;

  /** Left side of expression */
  left: string | number | DataBinding;

  /** Right side of expression */
  right?: string | number | DataBinding;
}

/**
 * Condition operators
 */
export type ConditionOperator =
  | "==" // Equal
  | "!=" // Not equal
  | ">" // Greater than
  | "<" // Less than
  | ">=" // Greater than or equal
  | "<=" // Less than or equal
  | "contains" // String contains
  | "startsWith" // String starts with
  | "endsWith" // String ends with
  | "exists" // Value exists (not null/undefined)
  | "empty"; // Value is empty (null/undefined/empty string/empty array)

/**
 * Logic group - combine multiple conditions
 */
export interface LogicGroup {
  /** Logic operator */
  operator: "AND" | "OR";

  /** Conditions in this group */
  conditions: (ConditionExpression | LogicGroup)[];
}

/**
 * Data context - scoped data for nested elements
 */
export interface DataContext {
  /** Parent context */
  parent?: DataContext;

  /** Variables in this context */
  variables: Record<string, unknown>;

  /** Get variable value (checks parent contexts) */
  get(name: string): unknown;

  /** Set variable value */
  set(name: string, value: unknown): void;
}

/**
 * Template engine export options
 */
export interface TemplateExportOptions {
  /** Template syntax (handlebars, mustache, etc.) */
  syntax: "handlebars" | "mustache" | "liquid" | "ejs";

  /** Skip data binding tags in output */
  skipTags?: boolean;

  /** Wrap template syntax in custom markup */
  wrapContent?: (content: string) => string;

  /** Custom path resolver */
  getCustomPath?: (path: string) => string;
}

/**
 * Data resolver result
 */
export interface DataResolverResult {
  /** Resolved value */
  value: unknown;

  /** Was resolution successful? */
  success: boolean;

  /** Error message if failed */
  error?: string;
}
