/**
 * Aquibra Template Engine
 * Converts data bindings to template syntax (Handlebars, Mustache, etc.)
 *
 * FRESH IMPLEMENTATION - Modern, clean approach
 * Not copied from back-dist
 *
 * @module engine/data/TemplateEngine
 * @license BSD-3-Clause
 */

import type {
  DataBinding,
  VariableBinding,
  CollectionBinding,
  ConditionBinding,
  TemplateExportOptions,
  ConditionExpression,
  LogicGroup,
} from "../../shared/types/data";
import type { Element } from "../elements/Element";

/**
 * Template Engine
 * Exports data-bound elements to template syntax
 */
export class TemplateEngine {
  private options: TemplateExportOptions;

  constructor(options: TemplateExportOptions) {
    this.options = options;
  }

  /**
   * Export element tree to template syntax
   */
  export(element: Element): string {
    // Get data bindings from element (will be implemented in Element class)
    const bindings: DataBinding[] =
      (element as unknown as { dataBindings?: DataBinding[] }).dataBindings || [];

    if (bindings.length === 0) {
      return this.exportPlainElement(element);
    }

    // Handle different binding types
    let output = "";

    for (const binding of bindings) {
      switch (binding.type) {
        case "variable":
          output += this.exportVariable(binding as VariableBinding, element);
          break;
        case "collection":
          output += this.exportCollection(binding as CollectionBinding, element);
          break;
        case "condition":
          output += this.exportCondition(binding as ConditionBinding, element);
          break;
      }
    }

    return output;
  }

  /**
   * Export plain element without bindings
   */
  private exportPlainElement(element: Element): string {
    const html = element.toHTML();

    // Remove data-aqb-* attributes if skipTags is true
    if (this.options.skipTags) {
      return html.replace(/\s*data-aqb-[^=]*="[^"]*"/g, "");
    }

    return html;
  }

  /**
   * Export variable binding
   */
  private exportVariable(binding: VariableBinding, _element: Element): string {
    const path = this.resolvePath(binding.path);
    let syntax = "";

    switch (this.options.syntax) {
      case "handlebars":
      case "mustache":
        syntax = `{{${path}}}`;
        break;
      case "liquid":
        syntax = `{{ ${path} }}`;
        break;
      case "ejs":
        syntax = `<%= ${path} %>`;
        break;
    }

    // Wrap if needed (e.g., for MJML)
    if (this.options.wrapContent) {
      syntax = this.options.wrapContent(syntax);
    }

    return syntax;
  }

  /**
   * Export collection binding (loop)
   */
  private exportCollection(binding: CollectionBinding, element: Element): string {
    const path = this.resolvePath(binding.path);
    const itemVar = binding.itemVar;
    const indexVar = binding.indexVar || "index";

    let startSyntax = "";
    let endSyntax = "";

    switch (this.options.syntax) {
      case "handlebars":
        startSyntax = `{{#each ${path}}}`;
        endSyntax = `{{/each}}`;
        break;
      case "mustache":
        startSyntax = `{{#${path}}}`;
        endSyntax = `{{/${path}}}`;
        break;
      case "liquid":
        startSyntax = `{% for ${itemVar} in ${path} %}`;
        endSyntax = `{% endfor %}`;
        break;
      case "ejs":
        startSyntax = `<% ${path}.forEach((${itemVar}, ${indexVar}) => { %>`;
        endSyntax = `<% }); %>`;
        break;
    }

    // Wrap if needed
    if (this.options.wrapContent) {
      startSyntax = this.options.wrapContent(startSyntax);
      endSyntax = this.options.wrapContent(endSyntax);
    }

    // Get children HTML
    const children = element.getChildren?.() || [];
    const childrenHTML = children.map((child) => this.export(child)).join("");

    return `${startSyntax}\n${childrenHTML}\n${endSyntax}`;
  }

  /**
   * Export condition binding (if/else)
   */
  private exportCondition(binding: ConditionBinding, element: Element): string {
    const conditionStr = this.serializeCondition(binding.condition);

    let startSyntax = "";
    let _elseSyntax = "";
    let endSyntax = "";

    switch (this.options.syntax) {
      case "handlebars":
        startSyntax = `{{#if ${conditionStr}}}`;
        _elseSyntax = `{{else}}`;
        endSyntax = `{{/if}}`;
        break;
      case "mustache":
        startSyntax = `{{#${conditionStr}}}`;
        _elseSyntax = `{{^${conditionStr}}}`;
        endSyntax = `{{/${conditionStr}}}`;
        break;
      case "liquid":
        startSyntax = `{% if ${conditionStr} %}`;
        _elseSyntax = `{% else %}`;
        endSyntax = `{% endif %}`;
        break;
      case "ejs":
        startSyntax = `<% if (${conditionStr}) { %>`;
        _elseSyntax = `<% } else { %>`;
        endSyntax = `<% } %>`;
        break;
    }

    // Wrap if needed
    if (this.options.wrapContent) {
      startSyntax = this.options.wrapContent(startSyntax);
      _elseSyntax = this.options.wrapContent(_elseSyntax);
      endSyntax = this.options.wrapContent(endSyntax);
    }

    // Get true/false content
    const trueContent = element.toHTML(); // Simplified - would need proper true/false branches

    return `${startSyntax}\n${trueContent}\n${endSyntax}`;
  }

  /**
   * Serialize condition to string
   */
  private serializeCondition(condition: ConditionExpression | LogicGroup): string {
    if ("operator" in condition && (condition.operator === "AND" || condition.operator === "OR")) {
      const group = condition as LogicGroup;
      const parts = group.conditions.map((c) => this.serializeCondition(c));
      const op = group.operator === "AND" ? "&&" : "||";
      return `(${parts.join(` ${op} `)})`;
    }

    const expr = condition as ConditionExpression;
    const left = this.serializeValue(expr.left);
    const right = expr.right !== undefined ? this.serializeValue(expr.right) : "";

    switch (expr.operator) {
      case "==":
        return `${left} == ${right}`;
      case "!=":
        return `${left} != ${right}`;
      case ">":
        return `${left} > ${right}`;
      case "<":
        return `${left} < ${right}`;
      case ">=":
        return `${left} >= ${right}`;
      case "<=":
        return `${left} <= ${right}`;
      case "exists":
        return left;
      case "empty":
        return `!${left}`;
      default:
        return left;
    }
  }

  /**
   * Serialize value (literal or path)
   */
  private serializeValue(value: unknown): string {
    if (typeof value === "string") {
      return value.includes(".") ? value : `"${value}"`;
    }
    return String(value);
  }

  /**
   * Resolve path (apply custom resolver if provided)
   */
  private resolvePath(path: string): string {
    if (this.options.getCustomPath) {
      return this.options.getCustomPath(path);
    }
    return path;
  }

  /**
   * Import template syntax to data bindings
   * (Reverse operation - parse template to bindings)
   */
  import(template: string): DataBinding[] {
    const bindings: DataBinding[] = [];

    switch (this.options.syntax) {
      case "handlebars":
      case "mustache":
        this.parseHandlebarsSyntax(template, bindings);
        break;
      case "liquid":
        this.parseLiquidSyntax(template, bindings);
        break;
      case "ejs":
        this.parseEjsSyntax(template, bindings);
        break;
    }

    return bindings;
  }

  /**
   * Parse Handlebars/Mustache syntax
   */
  private parseHandlebarsSyntax(template: string, bindings: DataBinding[]): void {
    // Match {{#each items}} ... {{/each}}
    const eachRegex = /\{\{#each\s+([^\s}]+)\s*\}\}/g;
    let match;
    while ((match = eachRegex.exec(template)) !== null) {
      bindings.push({
        sourceId: "",
        path: match[1],
        type: "collection",
        itemVar: "this",
      } as CollectionBinding);
    }

    // Match {{#if condition}} ... {{/if}}
    const ifRegex = /\{\{#if\s+([^\s}]+)\s*\}\}/g;
    while ((match = ifRegex.exec(template)) !== null) {
      bindings.push({
        sourceId: "",
        path: match[1],
        type: "condition",
        condition: {
          operator: "exists",
          left: match[1],
        },
      } as ConditionBinding);
    }

    // Match simple variables {{variable}} (excluding helpers like #each, #if, /, else)
    const varRegex = /\{\{(?!#|\/|else)([^}]+)\}\}/g;
    while ((match = varRegex.exec(template)) !== null) {
      const path = match[1].trim();
      // Skip if it's just "this" or a helper
      if (path && path !== "this" && !path.startsWith("@")) {
        bindings.push({
          sourceId: "",
          path,
          type: "variable",
        } as VariableBinding);
      }
    }
  }

  /**
   * Parse Liquid syntax
   */
  private parseLiquidSyntax(template: string, bindings: DataBinding[]): void {
    // Match {% for item in items %}
    const forRegex = /\{%\s*for\s+(\w+)\s+in\s+([^\s%]+)\s*%\}/g;
    let match;
    while ((match = forRegex.exec(template)) !== null) {
      bindings.push({
        sourceId: "",
        path: match[2],
        type: "collection",
        itemVar: match[1],
      } as CollectionBinding);
    }

    // Match {% if condition %}
    const ifRegex = /\{%\s*if\s+([^%]+)\s*%\}/g;
    while ((match = ifRegex.exec(template)) !== null) {
      const condition = match[1].trim();
      bindings.push({
        sourceId: "",
        path: condition,
        type: "condition",
        condition: {
          operator: "exists",
          left: condition,
        },
      } as ConditionBinding);
    }

    // Match {{ variable }}
    const varRegex = /\{\{\s*([^}|]+)(?:\|[^}]*)?\s*\}\}/g;
    while ((match = varRegex.exec(template)) !== null) {
      const path = match[1].trim();
      if (path) {
        bindings.push({
          sourceId: "",
          path,
          type: "variable",
        } as VariableBinding);
      }
    }
  }

  /**
   * Parse EJS syntax
   */
  private parseEjsSyntax(template: string, bindings: DataBinding[]): void {
    // Match <% items.forEach((item, index) => { %>
    const forEachRegex = /<%\s*([^.]+)\.forEach\s*\(\s*\((\w+)(?:,\s*(\w+))?\)\s*=>\s*\{\s*%>/g;
    let match;
    while ((match = forEachRegex.exec(template)) !== null) {
      bindings.push({
        sourceId: "",
        path: match[1].trim(),
        type: "collection",
        itemVar: match[2],
        indexVar: match[3],
      } as CollectionBinding);
    }

    // Match <% if (condition) { %>
    const ifRegex = /<%\s*if\s*\(\s*([^)]+)\s*\)\s*\{\s*%>/g;
    while ((match = ifRegex.exec(template)) !== null) {
      const condition = match[1].trim();
      bindings.push({
        sourceId: "",
        path: condition,
        type: "condition",
        condition: this.parseEjsCondition(condition),
      } as ConditionBinding);
    }

    // Match <%= variable %>
    const varRegex = /<%=\s*([^%]+)\s*%>/g;
    while ((match = varRegex.exec(template)) !== null) {
      const path = match[1].trim();
      // Skip complex expressions
      if (path && !path.includes("(") && !path.includes("?")) {
        bindings.push({
          sourceId: "",
          path,
          type: "variable",
        } as VariableBinding);
      }
    }
  }

  /**
   * Parse EJS condition to ConditionExpression
   */
  private parseEjsCondition(conditionStr: string): ConditionExpression | LogicGroup {
    // Handle AND conditions
    if (conditionStr.includes("&&")) {
      const parts = conditionStr.split("&&").map((p) => p.trim());
      return {
        operator: "AND",
        conditions: parts.map((part) => this.parseSingleCondition(part)),
      } as LogicGroup;
    }

    // Handle OR conditions
    if (conditionStr.includes("||")) {
      const parts = conditionStr.split("||").map((p) => p.trim());
      return {
        operator: "OR",
        conditions: parts.map((part) => this.parseSingleCondition(part)),
      } as LogicGroup;
    }

    return this.parseSingleCondition(conditionStr);
  }

  /**
   * Parse a single condition expression
   */
  private parseSingleCondition(conditionStr: string): ConditionExpression {
    // Check for comparison operators
    const operators: Array<{ op: string; type: ConditionExpression["operator"] }> = [
      { op: "===", type: "==" },
      { op: "==", type: "==" },
      { op: "!==", type: "!=" },
      { op: "!=", type: "!=" },
      { op: ">=", type: ">=" },
      { op: "<=", type: "<=" },
      { op: ">", type: ">" },
      { op: "<", type: "<" },
    ];

    for (const { op, type } of operators) {
      if (conditionStr.includes(op)) {
        const [left, right] = conditionStr.split(op).map((s) => s.trim());
        return {
          operator: type,
          left: this.parseConditionValue(left),
          right: this.parseConditionValue(right),
        };
      }
    }

    // Check for negation
    if (conditionStr.startsWith("!")) {
      return {
        operator: "empty",
        left: conditionStr.slice(1).trim(),
      };
    }

    // Default to exists check
    return {
      operator: "exists",
      left: conditionStr,
    };
  }

  /**
   * Parse condition value (string literal, number, or path)
   */
  private parseConditionValue(value: string): string | number {
    // Check for string literal
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1);
    }

    // Check for number
    const num = Number(value);
    if (!isNaN(num)) {
      return num;
    }

    // Return as path
    return value;
  }
}
