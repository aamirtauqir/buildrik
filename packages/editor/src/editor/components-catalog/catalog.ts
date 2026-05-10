/**
 * catalog.ts — Buildrik-shipped component catalog (S6 minimal seed).
 *
 * Five canonical components covering atom (Button, Input), molecule (Card),
 * and organism (Modal, Section) tiers. Every binding tokenId resolves
 * against DEFAULT_TOKENS — locked by an integrity test in __tests__/.
 *
 * Spec §5.7 SSOT: this is the canonical home for the Buildrik catalog.
 * Don't add component types in editor/sidebar/; this file is the only
 * compile-time source.
 *
 * @license BSD-3-Clause
 */

import type { ComponentType } from "./types";

export const CATALOG: ComponentType[] = [
  // ─── Atoms ───────────────────────────────────────────────────────────────
  {
    id: "button",
    category: "atom",
    name: "Button",
    variants: ["primary", "secondary", "ghost"],
    sizes: ["sm", "md", "lg"],
    schema: {
      props: {
        label: { type: "string", default: "Click me" },
        disabled: { type: "boolean", default: false },
      },
      structure: {
        type: "element",
        tag: "button",
        attrs: { type: "button" },
        children: [{ type: "text", source: "props.label" }],
      },
    },
    defaultBindings: {
      primary: {
        "background-color": { tokenId: "color-primary" },
        "color":            { tokenId: "color-background" },
        "border-radius":    { tokenId: "btn-radius" },
        "padding-inline":   { tokenId: "btn-padding-x" },
        "height":           { tokenId: "btn-height-md" },
      },
      secondary: {
        "background-color": { tokenId: "color-secondary" },
        "color":            { tokenId: "color-text" },
        "border-radius":    { tokenId: "btn-radius" },
        "padding-inline":   { tokenId: "btn-padding-x" },
        "height":           { tokenId: "btn-height-md" },
      },
      ghost: {
        "color":          { tokenId: "color-primary" },
        "border-radius":  { tokenId: "btn-radius" },
        "padding-inline": { tokenId: "btn-padding-x" },
        "height":         { tokenId: "btn-height-md" },
      },
    },
  },
  {
    id: "input",
    category: "atom",
    name: "Input",
    variants: ["default"],
    sizes: ["md"],
    schema: {
      props: {
        placeholder: { type: "string", default: "Enter text…" },
        disabled: { type: "boolean", default: false },
      },
      structure: {
        type: "element",
        tag: "input",
        attrs: { type: "text" },
      },
    },
    defaultBindings: {
      default: {
        "border":           { tokenId: "input-border" },
        "border-radius":    { tokenId: "input-radius" },
        "padding-inline":   { tokenId: "input-padding-x" },
        "height":           { tokenId: "input-height" },
        "font-size":        { tokenId: "font-size-base" },
      },
    },
  },

  {
    id: "select",
    category: "atom",
    name: "Select",
    variants: ["default"],
    sizes: ["md"],
    schema: {
      props: {
        placeholder: { type: "string", default: "Select an option…" },
        disabled: { type: "boolean", default: false },
      },
      structure: { type: "element", tag: "select" },
    },
    defaultBindings: {
      default: {
        "border":         { tokenId: "input-border" },
        "border-radius":  { tokenId: "input-radius" },
        "padding-inline": { tokenId: "input-padding-x" },
        "height":         { tokenId: "input-height" },
        "font-size":      { tokenId: "font-size-base" },
        "background-color": { tokenId: "color-background" },
        "color":          { tokenId: "color-text" },
      },
    },
  },
  {
    id: "checkbox",
    category: "atom",
    name: "Checkbox",
    variants: ["default"],
    schema: {
      props: {
        checked: { type: "boolean", default: false },
        disabled: { type: "boolean", default: false },
      },
      structure: {
        type: "element",
        tag: "input",
        attrs: { type: "checkbox" },
      },
    },
    defaultBindings: {
      default: {
        "border":        { tokenId: "input-border" },
        "border-radius": { tokenId: "radius-sm" },
        "color":         { tokenId: "color-primary" },
      },
    },
  },
  {
    id: "radio",
    category: "atom",
    name: "Radio",
    variants: ["default"],
    schema: {
      props: {
        name: { type: "string", default: "group" },
        checked: { type: "boolean", default: false },
        disabled: { type: "boolean", default: false },
      },
      structure: {
        type: "element",
        tag: "input",
        attrs: { type: "radio" },
      },
    },
    defaultBindings: {
      default: {
        "border":        { tokenId: "input-border" },
        "border-radius": { tokenId: "radius-full" },
        "color":         { tokenId: "color-primary" },
      },
    },
  },
  {
    id: "switch",
    category: "atom",
    name: "Switch",
    variants: ["default"],
    schema: {
      props: {
        checked: { type: "boolean", default: false },
        disabled: { type: "boolean", default: false },
      },
      structure: {
        type: "element",
        tag: "button",
        attrs: { type: "button", role: "switch" },
      },
    },
    defaultBindings: {
      default: {
        "background-color":     { tokenId: "color-secondary" },
        "border-radius":        { tokenId: "radius-full" },
        "transition-duration":  { tokenId: "motion-fast" },
        "height":               { tokenId: "btn-height-sm" },
      },
    },
  },
  {
    id: "label",
    category: "atom",
    name: "Label",
    variants: ["default"],
    schema: {
      props: {
        text: { type: "string", default: "Label" },
        for: { type: "string" },
      },
      structure: {
        type: "element",
        tag: "label",
        children: [{ type: "text", source: "props.text" }],
      },
    },
    defaultBindings: {
      default: {
        "font-size":   { tokenId: "label-font-size" },
        "font-weight": { tokenId: "label-weight" },
        "color":       { tokenId: "color-text" },
      },
    },
  },
  {
    id: "spinner",
    category: "atom",
    name: "Spinner",
    variants: ["default"],
    sizes: ["sm", "md", "lg"],
    schema: {
      props: {
        label: { type: "string", default: "Loading" },
      },
      structure: {
        type: "element",
        tag: "div",
        attrs: { role: "status", "aria-live": "polite" },
      },
    },
    defaultBindings: {
      default: {
        "color":               { tokenId: "color-primary" },
        "border":              { tokenId: "border-default" },
        "border-radius":       { tokenId: "radius-full" },
        "transition-duration": { tokenId: "motion-slow" },
      },
    },
  },

  // ─── Molecules ───────────────────────────────────────────────────────────
  {
    id: "card",
    category: "molecule",
    name: "Card",
    variants: ["elevated", "flat"],
    schema: {
      props: {
        title: { type: "string", default: "Card title" },
      },
      structure: {
        type: "element",
        tag: "div",
        children: [
          { type: "element", tag: "h3", children: [{ type: "text", source: "props.title" }] },
          { type: "slot", name: "body" },
        ],
      },
    },
    defaultBindings: {
      elevated: {
        "background-color": { tokenId: "color-background" },
        "border-radius":    { tokenId: "radius-lg" },
        "box-shadow":       { tokenId: "shadow-md" },
      },
      flat: {
        "background-color": { tokenId: "color-background" },
        "border-radius":    { tokenId: "radius-lg" },
        "border":           { tokenId: "border-default" },
      },
    },
  },

  {
    id: "form-field",
    category: "molecule",
    name: "Form field",
    variants: ["default"],
    schema: {
      props: {
        label: { type: "string", default: "Field label" },
        helper: { type: "string", default: "Helper text" },
      },
      structure: {
        type: "element",
        tag: "div",
        children: [
          { type: "element", tag: "label", children: [{ type: "text", source: "props.label" }] },
          { type: "slot", name: "input" },
          { type: "element", tag: "span", children: [{ type: "text", source: "props.helper" }] },
        ],
      },
    },
    defaultBindings: {
      default: {
        "color": { tokenId: "color-text" },
        "font-size": { tokenId: "label-font-size" },
        "gap": { tokenId: "layout-gutter" },
      },
    },
  },
  {
    id: "alert",
    category: "molecule",
    name: "Alert",
    variants: ["info", "success", "warning", "error"],
    schema: {
      props: { message: { type: "string", default: "Alert message" } },
      structure: {
        type: "element",
        tag: "div",
        attrs: { role: "alert" },
        children: [{ type: "text", source: "props.message" }],
      },
    },
    defaultBindings: {
      info:    { "background-color": { tokenId: "color-background" }, "border": { tokenId: "border-default" }, "border-radius": { tokenId: "radius-md" }, "color": { tokenId: "color-text" } },
      success: { "background-color": { tokenId: "color-success" },    "color": { tokenId: "color-background" }, "border-radius": { tokenId: "radius-md" } },
      warning: { "background-color": { tokenId: "color-accent" },     "color": { tokenId: "color-text" },       "border-radius": { tokenId: "radius-md" } },
      error:   { "background-color": { tokenId: "color-error" },      "color": { tokenId: "color-background" }, "border-radius": { tokenId: "radius-md" } },
    },
  },
  {
    id: "avatar",
    category: "molecule",
    name: "Avatar",
    variants: ["default"],
    sizes: ["sm", "md", "lg"],
    schema: {
      props: { src: { type: "string", default: "" }, alt: { type: "string", default: "User" } },
      structure: { type: "element", tag: "img", attrs: { src: "{props.src}", alt: "{props.alt}" } },
    },
    defaultBindings: {
      default: {
        "border-radius": { tokenId: "radius-full" },
        "border":        { tokenId: "border-default" },
        "height":        { tokenId: "btn-height-md" },
        "width":         { tokenId: "btn-height-md" },
      },
    },
  },
  {
    id: "badge",
    category: "molecule",
    name: "Badge",
    variants: ["neutral", "success", "error"],
    schema: {
      props: { label: { type: "string", default: "New" } },
      structure: {
        type: "element",
        tag: "span",
        children: [{ type: "text", source: "props.label" }],
      },
    },
    defaultBindings: {
      neutral: { "background-color": { tokenId: "color-secondary" }, "color": { tokenId: "color-text" },       "border-radius": { tokenId: "radius-full" }, "padding-inline": { tokenId: "btn-padding-x" }, "font-size": { tokenId: "font-size-xs" } },
      success: { "background-color": { tokenId: "color-success" },   "color": { tokenId: "color-background" }, "border-radius": { tokenId: "radius-full" }, "padding-inline": { tokenId: "btn-padding-x" }, "font-size": { tokenId: "font-size-xs" } },
      error:   { "background-color": { tokenId: "color-error" },     "color": { tokenId: "color-background" }, "border-radius": { tokenId: "radius-full" }, "padding-inline": { tokenId: "btn-padding-x" }, "font-size": { tokenId: "font-size-xs" } },
    },
  },
  {
    id: "breadcrumb",
    category: "molecule",
    name: "Breadcrumb",
    variants: ["default"],
    schema: {
      props: {},
      structure: {
        type: "element",
        tag: "nav",
        attrs: { "aria-label": "Breadcrumb" },
        children: [{ type: "slot", name: "items" }],
      },
    },
    defaultBindings: {
      default: {
        "color":     { tokenId: "color-muted" },
        "font-size": { tokenId: "font-size-sm" },
        "gap":       { tokenId: "layout-gutter" },
      },
    },
  },
  {
    id: "tabs",
    category: "molecule",
    name: "Tabs",
    variants: ["default"],
    schema: {
      props: {},
      structure: {
        type: "element",
        tag: "div",
        attrs: { role: "tablist" },
        children: [{ type: "slot", name: "tabs" }],
      },
    },
    defaultBindings: {
      default: {
        "border":           { tokenId: "border-default" },
        "border-radius":    { tokenId: "radius-md" },
        "background-color": { tokenId: "color-background" },
      },
    },
  },
  {
    id: "pagination",
    category: "molecule",
    name: "Pagination",
    variants: ["default"],
    schema: {
      props: {},
      structure: {
        type: "element",
        tag: "nav",
        attrs: { "aria-label": "Pagination" },
        children: [{ type: "slot", name: "pages" }],
      },
    },
    defaultBindings: {
      default: {
        "gap":       { tokenId: "layout-gutter" },
        "font-size": { tokenId: "font-size-sm" },
        "color":     { tokenId: "color-text" },
      },
    },
  },
  {
    id: "search-bar",
    category: "molecule",
    name: "Search bar",
    variants: ["default"],
    schema: {
      props: { placeholder: { type: "string", default: "Search…" } },
      structure: {
        type: "element",
        tag: "form",
        attrs: { role: "search" },
        children: [
          { type: "element", tag: "input", attrs: { type: "search", placeholder: "{props.placeholder}" } },
          { type: "slot", name: "submit" },
        ],
      },
    },
    defaultBindings: {
      default: {
        "border":           { tokenId: "input-border" },
        "border-radius":    { tokenId: "input-radius" },
        "padding-inline":   { tokenId: "input-padding-x" },
        "height":           { tokenId: "input-height" },
        "background-color": { tokenId: "color-background" },
      },
    },
  },
  {
    id: "list-item",
    category: "molecule",
    name: "List item",
    variants: ["default"],
    schema: {
      props: {
        title: { type: "string", default: "Item title" },
        subtitle: { type: "string", default: "Item subtitle" },
      },
      structure: {
        type: "element",
        tag: "li",
        children: [
          { type: "element", tag: "h4", children: [{ type: "text", source: "props.title" }] },
          { type: "element", tag: "p",  children: [{ type: "text", source: "props.subtitle" }] },
        ],
      },
    },
    defaultBindings: {
      default: {
        "padding-block":  { tokenId: "layout-gutter" },
        "padding-inline": { tokenId: "layout-padding-x" },
        "border":         { tokenId: "border-default" },
        "color":          { tokenId: "color-text" },
      },
    },
  },
  {
    id: "tooltip",
    category: "molecule",
    name: "Tooltip",
    variants: ["default"],
    schema: {
      props: { content: { type: "string", default: "Tooltip text" } },
      structure: {
        type: "element",
        tag: "div",
        attrs: { role: "tooltip" },
        children: [{ type: "text", source: "props.content" }],
      },
    },
    defaultBindings: {
      default: {
        "background-color": { tokenId: "color-text" },
        "color":            { tokenId: "color-background" },
        "border-radius":    { tokenId: "radius-sm" },
        "font-size":        { tokenId: "font-size-sm" },
        "padding-inline":   { tokenId: "btn-padding-x" },
        "z-index":          { tokenId: "zindex-dropdown" },
      },
    },
  },

  // ─── Organisms ───────────────────────────────────────────────────────────
  {
    id: "modal",
    category: "organism",
    name: "Modal",
    variants: ["default"],
    schema: {
      props: {
        title: { type: "string", default: "Modal title" },
      },
      structure: {
        type: "element",
        tag: "div",
        attrs: { role: "dialog", "aria-modal": "true" },
        children: [
          { type: "element", tag: "h2", children: [{ type: "text", source: "props.title" }] },
          { type: "slot", name: "body" },
        ],
      },
    },
    defaultBindings: {
      default: {
        "background-color": { tokenId: "color-background" },
        "border-radius":    { tokenId: "radius-lg" },
        "box-shadow":       { tokenId: "shadow-xl" },
        "z-index":          { tokenId: "zindex-modal" },
      },
    },
  },
  {
    id: "section",
    category: "organism",
    name: "Section",
    variants: ["default"],
    schema: {
      props: {},
      structure: {
        type: "element",
        tag: "section",
        children: [{ type: "slot", name: "content" }],
      },
    },
    defaultBindings: {
      default: {
        "padding-block":    { tokenId: "section-padding-y" },
        "padding-inline":   { tokenId: "layout-padding-x" },
        "max-width":        { tokenId: "sizing-container" },
      },
    },
  },
  {
    id: "hero",
    category: "organism",
    name: "Hero",
    variants: ["default"],
    schema: {
      props: {
        heading:  { type: "string", default: "Build something great" },
        subhead:  { type: "string", default: "Lead copy that convinces" },
      },
      structure: {
        type: "element",
        tag: "section",
        children: [
          { type: "element", tag: "h1", children: [{ type: "text", source: "props.heading" }] },
          { type: "element", tag: "p",  children: [{ type: "text", source: "props.subhead" }] },
          { type: "slot", name: "cta" },
        ],
      },
    },
    defaultBindings: {
      default: {
        "background-color": { tokenId: "color-background" },
        "padding-block":    { tokenId: "section-padding-y" },
        "padding-inline":   { tokenId: "layout-padding-x" },
        "max-width":        { tokenId: "sizing-container" },
        "color":            { tokenId: "color-text" },
      },
    },
  },
  {
    id: "footer",
    category: "organism",
    name: "Footer",
    variants: ["default"],
    schema: {
      props: { copyright: { type: "string", default: "© 2026" } },
      structure: {
        type: "element",
        tag: "footer",
        children: [
          { type: "slot", name: "columns" },
          { type: "element", tag: "p", children: [{ type: "text", source: "props.copyright" }] },
        ],
      },
    },
    defaultBindings: {
      default: {
        "background-color": { tokenId: "color-text" },
        "color":            { tokenId: "color-background" },
        "padding-block":    { tokenId: "section-padding-y" },
        "padding-inline":   { tokenId: "layout-padding-x" },
      },
    },
  },
  {
    id: "pricing",
    category: "organism",
    name: "Pricing",
    variants: ["default"],
    schema: {
      props: { heading: { type: "string", default: "Pricing" } },
      structure: {
        type: "element",
        tag: "section",
        children: [
          { type: "element", tag: "h2", children: [{ type: "text", source: "props.heading" }] },
          { type: "slot", name: "tiers" },
        ],
      },
    },
    defaultBindings: {
      default: {
        "padding-block":    { tokenId: "section-padding-y" },
        "padding-inline":   { tokenId: "layout-padding-x" },
        "background-color": { tokenId: "color-background" },
        "max-width":        { tokenId: "sizing-container" },
      },
    },
  },
  {
    id: "cta",
    category: "organism",
    name: "Call to action",
    variants: ["default"],
    schema: {
      props: {
        heading: { type: "string", default: "Ready to start?" },
      },
      structure: {
        type: "element",
        tag: "section",
        children: [
          { type: "element", tag: "h2", children: [{ type: "text", source: "props.heading" }] },
          { type: "slot", name: "actions" },
        ],
      },
    },
    defaultBindings: {
      default: {
        "background-color": { tokenId: "color-primary" },
        "color":            { tokenId: "color-background" },
        "border-radius":    { tokenId: "cta-radius" },
        "padding-block":    { tokenId: "section-padding-y" },
        "padding-inline":   { tokenId: "layout-padding-x" },
      },
    },
  },
  {
    id: "header",
    category: "organism",
    name: "Header",
    variants: ["default"],
    schema: {
      props: {},
      structure: {
        type: "element",
        tag: "header",
        children: [
          { type: "slot", name: "brand" },
          { type: "slot", name: "nav" },
          { type: "slot", name: "actions" },
        ],
      },
    },
    defaultBindings: {
      default: {
        "background-color": { tokenId: "color-background" },
        "border":           { tokenId: "border-default" },
        "height":           { tokenId: "input-height" },
        "padding-inline":   { tokenId: "layout-padding-x" },
      },
    },
  },
  {
    id: "feature-grid",
    category: "organism",
    name: "Feature grid",
    variants: ["default"],
    schema: {
      props: { heading: { type: "string", default: "Features" } },
      structure: {
        type: "element",
        tag: "section",
        children: [
          { type: "element", tag: "h2", children: [{ type: "text", source: "props.heading" }] },
          { type: "slot", name: "features" },
        ],
      },
    },
    defaultBindings: {
      default: {
        "padding-block":    { tokenId: "section-padding-y" },
        "padding-inline":   { tokenId: "layout-padding-x" },
        "max-width":        { tokenId: "sizing-container" },
        "color":            { tokenId: "color-text" },
      },
    },
  },
];
