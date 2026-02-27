/**
 * Aquibra Data Manager
 * Manages data sources and resolves data bindings
 *
 * FRESH IMPLEMENTATION - Not copied from back-dist
 * Designed specifically for Aquibra's architecture
 *
 * @module engine/data/DataManager
 * @license BSD-3-Clause
 */

import type {
  DataSource,
  DataBinding,
  DataContext,
  DataResolverResult,
  VariableBinding,
  CollectionBinding,
  ConditionBinding,
  ConditionExpression,
  LogicGroup,
} from "../../shared/types/data";
import type { Composer } from "../Composer";
import type { Element } from "../elements/Element";
import { EventEmitter } from "../EventEmitter";
import { getTransformFunction as getCentralizedTransform } from "../utils/Transforms";

/**
 * Data Manager
 * Central hub for all data-related operations
 */
export class DataManager extends EventEmitter {
  private sources: Map<string, DataSource> = new Map();
  private globalContext: DataContext;

  constructor(_composer: Composer) {
    super();

    // Initialize global context
    this.globalContext = this.createContext();
  }

  /**
   * Register a data source
   */
  registerSource(source: DataSource): void {
    if (this.sources.has(source.id)) {
      throw new Error(`Data source "${source.id}" already exists`);
    }

    this.sources.set(source.id, source);
    this.emit("source:registered", source);
    this.emit("source:updated", { id: source.id, data: source.data });
  }

  /**
   * Unregister a data source
   */
  unregisterSource(id: string): void {
    const source = this.sources.get(id);
    if (!source) return;

    this.sources.delete(id);
    this.emit("source:unregistered", { id });
    this.emit("source:updated", { id, data: undefined });
  }

  /**
   * Get a data source by ID
   */
  getSource(id: string): DataSource | undefined {
    return this.sources.get(id);
  }

  /**
   * Get all data sources
   */
  getAllSources(): DataSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Update data source data
   */
  updateSourceData(id: string, data: unknown): void {
    const source = this.sources.get(id);
    if (!source) {
      throw new Error(`Data source "${id}" not found`);
    }

    source.data = data as DataSource["data"];
    this.emit("source:updated", { id, data });
  }

  /**
   * Resolve a data binding to its actual value
   */
  async resolve(binding: DataBinding, context?: DataContext): Promise<DataResolverResult> {
    try {
      const source = this.sources.get(binding.sourceId);
      if (!source) {
        return {
          success: false,
          value: binding.fallback,
          error: `Data source "${binding.sourceId}" not found`,
        };
      }

      // Get data from source
      let data = source.data;
      if (source.type === "function" && source.getData) {
        data = await source.getData();
      }

      // Resolve path
      const value = this.resolvePath(data, binding.path, context);

      // Apply transform if provided
      const finalValue = binding.transform ? binding.transform(value) : value;

      return {
        success: true,
        value: finalValue ?? binding.fallback,
      };
    } catch (error) {
      return {
        success: false,
        value: binding.fallback,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Resolve a path in data (e.g., "user.profile.name")
   */
  private resolvePath(data: unknown, path: string, context?: DataContext): unknown {
    // Check context variables first
    if (context) {
      const contextValue = context.get(path);
      if (contextValue !== undefined) {
        return contextValue;
      }
    }

    // Split path and traverse
    const parts = path.split(".");
    let current: unknown = data;

    for (const part of parts) {
      if (current == null) return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Evaluate a condition expression
   */
  async evaluateCondition(
    condition: ConditionExpression | LogicGroup,
    context?: DataContext
  ): Promise<boolean> {
    // Logic group (AND/OR)
    if ("operator" in condition && (condition.operator === "AND" || condition.operator === "OR")) {
      const group = condition as LogicGroup;
      const results = await Promise.all(
        group.conditions.map((c) => this.evaluateCondition(c, context))
      );

      return group.operator === "AND" ? results.every((r) => r) : results.some((r) => r);
    }

    // Single expression
    const expr = condition as ConditionExpression;
    const left = await this.resolveExpressionValue(expr.left, context);
    const right =
      expr.right !== undefined ? await this.resolveExpressionValue(expr.right, context) : undefined;

    // Type assertions needed for comparison operators
    const leftNum = left as number;
    const rightNum = right as number;

    switch (expr.operator) {
      case "==":
        return left == right;
      case "!=":
        return left != right;
      case ">":
        return leftNum > rightNum;
      case "<":
        return leftNum < rightNum;
      case ">=":
        return leftNum >= rightNum;
      case "<=":
        return leftNum <= rightNum;
      case "contains":
        return String(left).includes(String(right));
      case "startsWith":
        return String(left).startsWith(String(right));
      case "endsWith":
        return String(left).endsWith(String(right));
      case "exists":
        return left != null;
      case "empty":
        return !left || (Array.isArray(left) && left.length === 0);
      default:
        return false;
    }
  }

  /**
   * Resolve expression value (can be literal or data binding)
   */
  private async resolveExpressionValue(value: unknown, context?: DataContext): Promise<unknown> {
    if (typeof value === "object" && value !== null && "sourceId" in value) {
      // It's a data binding
      const result = await this.resolve(value as DataBinding, context);
      return result.value;
    }
    return value;
  }

  /**
   * Create a new data context
   */
  createContext(parent?: DataContext): DataContext {
    const variables: Record<string, unknown> = {};

    return {
      parent,
      variables,
      get(name: string): unknown {
        if (name in variables) {
          return variables[name];
        }
        return parent?.get(name);
      },
      set(name: string, value: unknown): void {
        variables[name] = value;
      },
    };
  }

  /**
   * Get global context
   */
  getGlobalContext(): DataContext {
    return this.globalContext;
  }

  /**
   * Set global variable
   */
  setGlobalVariable(name: string, value: unknown): void {
    this.globalContext.set(name, value);
    this.emit("global:updated", { name, value });
  }

  /**
   * Get global variable
   */
  getGlobalVariable(name: string): unknown {
    return this.globalContext.get(name);
  }

  /**
   * Import sample data for testing
   */
  importSampleData(json: string): void {
    const data = JSON.parse(json) as Record<string, unknown>;

    // Auto-create data sources from JSON structure
    Object.entries(data).forEach(([key, value]) => {
      const type = Array.isArray(value) ? "array" : "object";

      this.registerSource({
        id: key,
        name: key,
        type,
        data: value as DataSource["data"],
        description: `Auto-imported from sample data`,
      });
    });

    this.emit("sample:imported", data);
  }

  /**
   * Export all data sources as JSON
   */
  exportData(): string {
    const data: Record<string, unknown> = {};

    this.sources.forEach((source, id) => {
      if (source.type === "object" || source.type === "array") {
        data[id] = source.data;
      }
    });

    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear all data sources
   */
  clear(): void {
    this.sources.clear();
    this.globalContext = this.createContext();
    this.emit("data:cleared");
  }

  /**
   * Watch a data path for changes
   */
  watch(
    path: string,
    callback: (value: unknown) => void,
    options?: { immediate?: boolean }
  ): () => void {
    const [sourceId, ...pathParts] = path.split(".");
    const source = this.sources.get(sourceId);

    if (!source) {
      throw new Error(`Data source "${sourceId}" not found`);
    }

    // Get initial value if immediate
    if (options?.immediate) {
      const value = this.resolvePath(source.data, pathParts.join("."));
      callback(value);
    }

    // Watch for source updates
    const handler = ({ id, data }: { id: string; data: unknown }) => {
      if (id === sourceId) {
        const value = this.resolvePath(data, pathParts.join("."));
        callback(value);
      }
    };

    this.on("source:updated", handler);

    // Return unwatch function
    return () => {
      this.off("source:updated", handler);
    };
  }

  /**
   * Bind variable to element
   */
  bindVariable(
    element: Element,
    sourceId: string,
    path: string,
    options?: {
      transform?: string | ((value: unknown) => unknown);
      fallback?: unknown;
    }
  ): void {
    const transformFn = this.getTransformFunction(options?.transform);

    const binding: VariableBinding = {
      type: "variable",
      sourceId,
      path,
      transform: transformFn,
      fallback: options?.fallback as DataBinding["fallback"],
    };

    element.setDataBinding("content", binding);
    void this.updateElementWithBinding(element, binding);
  }

  /**
   * Bind collection to element
   */
  bindCollection(
    element: Element,
    sourceId: string,
    path: string,
    itemVar: string,
    options?: {
      indexVar?: string;
      fallback?: unknown;
    }
  ): void {
    const binding: CollectionBinding = {
      type: "collection",
      sourceId,
      path,
      itemVar,
      indexVar: options?.indexVar || "index",
      fallback: options?.fallback as DataBinding["fallback"],
    };

    element.setDataBinding("collection", binding);
    void this.updateElementWithBinding(element, binding);
  }

  /**
   * Bind condition to element
   */
  bindCondition(
    element: Element,
    condition: ConditionExpression | LogicGroup,
    options?: {
      fallback?: unknown;
    }
  ): void {
    const binding: ConditionBinding = {
      type: "condition",
      sourceId: "", // Will be extracted from condition
      path: "", // Will be extracted from condition
      condition,
      fallback: options?.fallback as DataBinding["fallback"],
    };

    element.setDataBinding("condition", binding);
    void this.updateElementWithBinding(element, binding);
  }

  /**
   * Update element with data binding
   */
  private async updateElementWithBinding(element: Element, binding: DataBinding): Promise<void> {
    if (binding.type === "variable") {
      const result = await this.resolve(binding);
      if (result.success) {
        element.setContent(String(result.value));
      } else {
        element.setContent(String(binding.fallback || ""));
      }
    } else if (binding.type === "collection") {
      const collectionBinding = binding as CollectionBinding;
      const result = await this.resolve(
        {
          ...binding,
          path: collectionBinding.path,
        },
        undefined
      );
      if (result.success && Array.isArray(result.value)) {
        // Clear existing children
        element.getChildren().forEach((child) => {
          element.removeChild(child);
        });

        // Create children for each item
        for (const [index, item] of (result.value as unknown[]).entries()) {
          const child = element.duplicate();
          const context = this.createContext();
          context.set(collectionBinding.itemVar, item);
          context.set(collectionBinding.indexVar || "index", index);

          // Resolve bindings in child with context
          const childBindings = child.getDataBindings();
          for (const b of Object.values(childBindings)) {
            const res = await this.resolve(b, context);
            if (res.success) {
              child.setContent(String(res.value));
            }
          }
        }
      }
    } else if (binding.type === "condition") {
      const conditionBinding = binding as ConditionBinding;
      const result = await this.evaluateCondition(conditionBinding.condition);

      // Show/hide element based on condition
      if (result) {
        element.removeAttribute("data-condition-hidden");
      } else {
        element.setAttribute("data-condition-hidden", "true");
      }
    }
  }

  /**
   * Get transform function by name or use custom function
   * Uses centralized transforms from engine/utils/Transforms
   */
  private getTransformFunction(
    transform?: string | ((value: unknown) => unknown)
  ): ((value: unknown) => unknown) | undefined {
    return getCentralizedTransform(transform);
  }

  /**
   * Destroy data manager
   */
  destroy(): void {
    this.clear();
    this.removeAllListeners();
  }
}
