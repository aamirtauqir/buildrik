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
];
