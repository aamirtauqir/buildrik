/**
 * TemplateEngine tests — data bindings → template syntax (handlebars /
 * mustache / liquid / ejs) for export, and the reverse import parse.
 *
 * The engine only reads `dataBindings`, `toHTML()` and `getChildren?.()`
 * off Element, so duck-typed stubs are sufficient (mirrors the stub
 * pattern in TokenBindingResolver.test.ts).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { TemplateEngine } from "../TemplateEngine";
import type { Element } from "@/engine/elements/Element";
import type {
  DataBinding,
  VariableBinding,
  CollectionBinding,
  ConditionBinding,
  TemplateExportOptions,
} from "@/shared/types/data";

function makeElement(opts: {
  html?: string;
  bindings?: DataBinding[];
  children?: Element[];
  withoutGetChildren?: boolean;
}): Element {
  const stub: Record<string, unknown> = {
    toHTML: () => opts.html ?? "",
    dataBindings: opts.bindings,
  };
  if (!opts.withoutGetChildren) {
    stub.getChildren = () => opts.children ?? [];
  }
  return stub as unknown as Element;
}

function variable(path: string): VariableBinding {
  return { sourceId: "", path, type: "variable" };
}

function collection(path: string, itemVar: string, indexVar?: string): CollectionBinding {
  return { sourceId: "", path, type: "collection", itemVar, indexVar };
}

function condition(cond: ConditionBinding["condition"]): ConditionBinding {
  return { sourceId: "", path: "", type: "condition", condition: cond };
}

function engine(options: Partial<TemplateExportOptions> & { syntax: TemplateExportOptions["syntax"] }) {
  return new TemplateEngine(options);
}

describe("TemplateEngine.export — plain elements", () => {
  it("returns element HTML untouched when there are no bindings", () => {
    const el = makeElement({ html: '<div data-buildrick-id="x1" class="c">Hi</div>' });
    expect(engine({ syntax: "handlebars" }).export(el)).toBe(
      '<div data-buildrick-id="x1" class="c">Hi</div>'
    );
  });

  it("treats an empty bindings array as plain", () => {
    const el = makeElement({ html: "<p>x</p>", bindings: [] });
    expect(engine({ syntax: "handlebars" }).export(el)).toBe("<p>x</p>");
  });

  it("strips data-buildrick-* attributes when skipTags is set", () => {
    const el = makeElement({
      html: '<div data-buildrick-id="x1" data-buildrick-type="container" class="c">Hi</div>',
    });
    expect(engine({ syntax: "handlebars", skipTags: true }).export(el)).toBe(
      '<div class="c">Hi</div>'
    );
  });
});

describe("TemplateEngine.export — variable bindings", () => {
  const el = makeElement({ bindings: [variable("user.name")] });

  it.each([
    ["handlebars", "{{user.name}}"],
    ["mustache", "{{user.name}}"],
    ["liquid", "{{ user.name }}"],
    ["ejs", "<%= user.name %>"],
  ] as const)("emits %s syntax", (syntax, expected) => {
    expect(engine({ syntax }).export(el)).toBe(expected);
  });

  it("applies getCustomPath before emitting", () => {
    const out = engine({
      syntax: "handlebars",
      getCustomPath: (path) => `data.${path}`,
    }).export(el);
    expect(out).toBe("{{data.user.name}}");
  });

  it("applies wrapContent to the emitted syntax", () => {
    const out = engine({
      syntax: "handlebars",
      wrapContent: (content) => `<mj-text>${content}</mj-text>`,
    }).export(el);
    expect(out).toBe("<mj-text>{{user.name}}</mj-text>");
  });

  it("concatenates the output of multiple bindings on one element", () => {
    const multi = makeElement({ bindings: [variable("a.b"), variable("c.d")] });
    expect(engine({ syntax: "handlebars" }).export(multi)).toBe("{{a.b}}{{c.d}}");
  });
});

describe("TemplateEngine.export — collection bindings", () => {
  const child = makeElement({ bindings: [variable("name")] });
  const el = makeElement({
    bindings: [collection("products", "product")],
    children: [child],
  });

  it.each([
    ["handlebars", "{{#each products}}\n{{name}}\n{{/each}}"],
    ["mustache", "{{#products}}\n{{name}}\n{{/products}}"],
    ["liquid", "{% for product in products %}\n{{ name }}\n{% endfor %}"],
    ["ejs", "<% products.forEach((product, index) => { %>\n<%= name %>\n<% }); %>"],
  ] as const)("emits %s loop syntax with exported children", (syntax, expected) => {
    expect(engine({ syntax }).export(el)).toBe(expected);
  });

  it("uses the custom indexVar in ejs", () => {
    const withIndex = makeElement({
      bindings: [collection("products", "product", "i")],
      children: [child],
    });
    expect(engine({ syntax: "ejs" }).export(withIndex)).toBe(
      "<% products.forEach((product, i) => { %>\n<%= name %>\n<% }); %>"
    );
  });

  it("exports plain children through toHTML", () => {
    const plainChild = makeElement({ html: "<li>static</li>" });
    const list = makeElement({
      bindings: [collection("items", "item")],
      children: [plainChild],
    });
    expect(engine({ syntax: "handlebars" }).export(list)).toBe(
      "{{#each items}}\n<li>static</li>\n{{/each}}"
    );
  });

  it("tolerates elements without getChildren", () => {
    const bare = makeElement({
      bindings: [collection("items", "item")],
      withoutGetChildren: true,
    });
    expect(engine({ syntax: "handlebars" }).export(bare)).toBe("{{#each items}}\n\n{{/each}}");
  });

  it("wraps loop delimiters with wrapContent", () => {
    const out = engine({
      syntax: "handlebars",
      wrapContent: (content) => `[${content}]`,
    }).export(el);
    expect(out).toBe("[{{#each products}}]\n[{{name}}]\n[{{/each}}]");
  });

  it("resolves the loop path through getCustomPath", () => {
    const out = engine({
      syntax: "handlebars",
      getCustomPath: (path) => `cms.${path}`,
    }).export(el);
    expect(out).toBe("{{#each cms.products}}\n{{cms.name}}\n{{/each}}");
  });
});

describe("TemplateEngine.export — condition bindings", () => {
  const eqCondition = { operator: "==" as const, left: "user.role", right: "admin" };

  it.each([
    ["handlebars", '{{#if user.role == "admin"}}\n<span>Yes</span>\n{{/if}}'],
    ["liquid", '{% if user.role == "admin" %}\n<span>Yes</span>\n{% endif %}'],
    ["ejs", '<% if (user.role == "admin") { %>\n<span>Yes</span>\n<% } %>'],
  ] as const)("emits %s condition syntax around element HTML", (syntax, expected) => {
    const el = makeElement({ html: "<span>Yes</span>", bindings: [condition(eqCondition)] });
    expect(engine({ syntax }).export(el)).toBe(expected);
  });

  it("emits mustache sections named by the serialized condition", () => {
    const el = makeElement({
      html: "<b>x</b>",
      bindings: [condition({ operator: "exists", left: "user.name" })],
    });
    expect(engine({ syntax: "mustache" }).export(el)).toBe(
      "{{#user.name}}\n<b>x</b>\n{{/user.name}}"
    );
  });

  it("serializes exists as the bare path and empty as its negation", () => {
    const exists = makeElement({
      html: "x",
      bindings: [condition({ operator: "exists", left: "user.name" })],
    });
    expect(engine({ syntax: "handlebars" }).export(exists)).toBe("{{#if user.name}}\nx\n{{/if}}");

    const empty = makeElement({
      html: "x",
      bindings: [condition({ operator: "empty", left: "user.name" })],
    });
    expect(engine({ syntax: "handlebars" }).export(empty)).toBe("{{#if !user.name}}\nx\n{{/if}}");
  });

  it("serializes comparison operators with quoted string literals and raw numbers", () => {
    const el = makeElement({
      html: "x",
      bindings: [condition({ operator: ">=", left: "cart.total", right: 100 })],
    });
    expect(engine({ syntax: "handlebars" }).export(el)).toBe(
      "{{#if cart.total >= 100}}\nx\n{{/if}}"
    );
  });

  it("serializes AND/OR logic groups with parentheses, nested groups included", () => {
    const el = makeElement({
      html: "x",
      bindings: [
        condition({
          operator: "OR",
          conditions: [
            {
              operator: "AND",
              conditions: [
                { operator: "==", left: "a.x", right: 1 },
                { operator: "exists", left: "b.y" },
              ],
            },
            { operator: ">", left: "c.n", right: 5 },
          ],
        }),
      ],
    });
    expect(engine({ syntax: "handlebars" }).export(el)).toBe(
      "{{#if ((a.x == 1 && b.y) || c.n > 5)}}\nx\n{{/if}}"
    );
  });

  it("quotes dot-less left-hand paths as string literals (current behavior)", () => {
    const el = makeElement({
      html: "x",
      bindings: [condition({ operator: "exists", left: "user" })],
    });
    // serializeValue treats any dot-less string as a literal, so a top-level
    // variable name is exported inside quotes.
    expect(engine({ syntax: "handlebars" }).export(el)).toBe('{{#if "user"}}\nx\n{{/if}}');
  });

  it.todo(
    "BUG: serializeValue() decides literal-vs-path by `value.includes('.')` — a condition on a " +
      'top-level variable ({ operator: "exists", left: "user" }) exports as {{#if "user"}}, a ' +
      "constant-true string literal in every target syntax. Left-hand sides are always paths and " +
      "must never be quoted."
  );

  it("wraps condition delimiters with wrapContent", () => {
    const el = makeElement({
      html: "x",
      bindings: [condition({ operator: "exists", left: "user.name" })],
    });
    const out = engine({
      syntax: "handlebars",
      wrapContent: (content) => `[${content}]`,
    }).export(el);
    expect(out).toBe("[{{#if user.name}}]\nx\n[{{/if}}]");
  });
});

describe("TemplateEngine.import — handlebars/mustache", () => {
  it("parses each-loops, if-blocks and variables", () => {
    const bindings = engine({ syntax: "handlebars" }).import(
      "{{#each products}}<li>{{name}}</li>{{/each}}{{#if user}}<b>{{user.email}}</b>{{/if}}"
    );

    const byType = (type: string) => bindings.filter((b) => b.type === type);
    expect(byType("collection")).toEqual([
      { sourceId: "", path: "products", type: "collection", itemVar: "this" },
    ]);
    expect(byType("condition")).toEqual([
      {
        sourceId: "",
        path: "user",
        type: "condition",
        condition: { operator: "exists", left: "user" },
      },
    ]);
    expect(byType("variable").map((b) => b.path)).toEqual(["name", "user.email"]);
  });

  it("skips this, @-helpers, else and closing tags", () => {
    const bindings = engine({ syntax: "mustache" }).import(
      "{{#each items}}{{this}} {{@index}}{{else}}none{{/each}}"
    );
    expect(bindings).toEqual([
      { sourceId: "", path: "items", type: "collection", itemVar: "this" },
    ]);
  });

  it("returns [] for a template with no bindings", () => {
    expect(engine({ syntax: "handlebars" }).import("<div>static</div>")).toEqual([]);
  });
});

describe("TemplateEngine.import — liquid", () => {
  it("parses for-loops with their item variable, plus variables", () => {
    const bindings = engine({ syntax: "liquid" }).import(
      "{% for p in products %}{{ p.name }}{% endfor %}"
    );
    expect(bindings).toEqual([
      { sourceId: "", path: "products", type: "collection", itemVar: "p" },
      { sourceId: "", path: "p.name", type: "variable" },
    ]);
  });

  it("strips filters from variable paths", () => {
    const bindings = engine({ syntax: "liquid" }).import("{{ title | upcase }}");
    expect(bindings).toEqual([{ sourceId: "", path: "title", type: "variable" }]);
  });

  it("parses if-blocks as exists conditions", () => {
    const bindings = engine({ syntax: "liquid" }).import("{% if user %}x{% endif %}");
    expect(bindings).toEqual([
      {
        sourceId: "",
        path: "user",
        type: "condition",
        condition: { operator: "exists", left: "user" },
      },
    ]);
  });
});

describe("TemplateEngine.import — ejs", () => {
  it("parses forEach loops with item and index vars, plus variables", () => {
    const bindings = engine({ syntax: "ejs" }).import(
      "<% items.forEach((item, i) => { %><%= item.name %><% }); %>"
    );
    expect(bindings).toEqual([
      { sourceId: "", path: "items", type: "collection", itemVar: "item", indexVar: "i" },
      { sourceId: "", path: "item.name", type: "variable" },
    ]);
  });

  it("leaves indexVar undefined when forEach only declares the item", () => {
    const bindings = engine({ syntax: "ejs" }).import("<% rows.forEach((row) => { %><% }); %>");
    expect(bindings).toEqual([
      { sourceId: "", path: "rows", type: "collection", itemVar: "row", indexVar: undefined },
    ]);
  });

  it("parses comparison conditions with numeric and quoted-string right sides", () => {
    const gt = engine({ syntax: "ejs" }).import("<% if (count > 3) { %>x<% } %>");
    expect(gt[0]).toMatchObject({
      type: "condition",
      condition: { operator: ">", left: "count", right: 3 },
    });

    const eq = engine({ syntax: "ejs" }).import("<% if (status == 'active') { %>x<% } %>");
    expect(eq[0]).toMatchObject({
      condition: { operator: "==", left: "status", right: "active" },
    });
  });

  it("parses && / || into logic groups and ! into an empty check", () => {
    const and = engine({ syntax: "ejs" }).import("<% if (a && b) { %>x<% } %>");
    expect(and[0]).toMatchObject({
      condition: {
        operator: "AND",
        conditions: [
          { operator: "exists", left: "a" },
          { operator: "exists", left: "b" },
        ],
      },
    });

    const or = engine({ syntax: "ejs" }).import("<% if (a || b) { %>x<% } %>");
    expect(or[0]).toMatchObject({
      condition: { operator: "OR" },
    });

    const not = engine({ syntax: "ejs" }).import("<% if (!flag) { %>x<% } %>");
    expect(not[0]).toMatchObject({
      condition: { operator: "empty", left: "flag" },
    });
  });

  it("documents the CURRENT mangled parse of '!==' (matched as '==')", () => {
    const bindings = engine({ syntax: "ejs" }).import("<% if (a !== b) { %>x<% } %>");
    // "==" is found inside "!==" before "!==" is ever checked, so the split
    // eats the operator and leaves the bang on the left operand.
    expect(bindings[0]).toMatchObject({
      condition: { operator: "==", left: "a !", right: "b" },
    });
  });

  it.todo(
    "BUG: parseSingleCondition checks operators in the order ['===','==','!==','!=',...] — for " +
      "'a !== b' the '==' substring inside '!==' matches first, producing " +
      "{ operator: '==', left: 'a !', right: 'b' }. '!==' must be checked before '=='."
  );

  it("skips complex expressions in <%= %> outputs", () => {
    const bindings = engine({ syntax: "ejs" }).import(
      "<%= fn(x) %><%= a ? b : c %><%= plain %>"
    );
    expect(bindings).toEqual([{ sourceId: "", path: "plain", type: "variable" }]);
  });
});
