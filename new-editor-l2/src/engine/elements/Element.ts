/**
 * Aquibra Element
 * Represents a single element in the composer.
 * Implementation split across delegate files for the 500-line limit.
 *
 * @module engine/elements/Element
 * @license BSD-3-Clause
 */

import type { ElementData, TraitData, TraitValue } from "../../shared/types";
import type { AnimationConfig } from "../../shared/types/animations";
import type { DataBinding } from "../../shared/types/data";
import type { ElementCategory } from "../../shared/utils/nesting/types";
import type { Composer } from "../Composer";
import { ElementChildren } from "./ElementChildren";
import { ElementOperations } from "./ElementOperations";
import { ElementSerialization } from "./ElementSerialization";
import { ElementStyles } from "./ElementStyles";

/**
 * Element class - represents a visual element in the composer.
 * Delegates style/class/attribute ops to ElementStyles,
 * tree ops to ElementChildren, structural ops to ElementOperations,
 * and serialization to ElementSerialization.
 */
export class Element {
  private data: ElementData;
  private composer: Composer;
  private parent: Element | null = null;
  private children: Element[] = [];

  private _styles!: ElementStyles;
  private _children!: ElementChildren;
  private _ops!: ElementOperations;
  private _serial!: ElementSerialization;

  constructor(data: ElementData, composer: Composer) {
    this.data = data;
    this.composer = composer;

    // _ops and _styles have a mutual dep: ops calls style methods, styles calls ops.
    // Safe because closures only execute after construction completes.
    this._ops = new ElementOperations(
      () => this,
      () => this.composer,
      () => this.data,
      () => this.parent,
      () => this.children,
      (c) => {
        this.children = c;
      },
      (p, v) => this._styles.setStyle(p, v),
      (p) => this._styles.removeStyle(p)
    );

    this._styles = new ElementStyles(
      () => this.data,
      () => this.composer,
      () => this.data.id,
      () => this._ops.getInteractions()
    );

    this._children = new ElementChildren(
      () => this,
      () => this.composer,
      () => this.parent,
      () => this.children,
      (cn) => this._styles.hasClass(cn),
      () => this.data.id,
      (n) => this._styles.getAttribute(n),
      () => this.getTagName()
    );

    this._serial = new ElementSerialization(
      () => this,
      () => this.composer,
      () => this.data,
      () => this.parent,
      () => this.children,
      () => this._styles.getClasses(),
      () => this._styles.getAttributes(),
      () => this._styles.getStyles(),
      () => this.getContent(),
      () => this.getTagName(),
      () => this._ops.getDataBindings(),
      () => this._ops.hasDataBindings()
    );

    this._ops.initBindings(data.dataBindings);
  }

  // ============================================
  // Core identity (stay in Element — direct data access)
  // ============================================

  getId(): string {
    return this.data.id;
  }
  getType(): ElementData["type"] {
    return this.data.type;
  }
  getTagName(): string {
    return this.data.tagName || "div";
  }
  getData(): ElementData {
    return { ...this.data };
  }
  getContent(): string {
    return this.data.content || "";
  }

  getParent(): Element | null {
    return this.parent;
  }
  getChildren(): Element[] {
    return [...this.children];
  }

  /** Required by delegate callbacks — sets backing parent reference. */
  setParent(parent: Element | null): void {
    this.parent = parent;
  }

  setContent(content: string): void {
    this.data.content = content;
    this.composer.emit("element:updated", this);
    this.composer.markDirty();
  }

  setTagName(tagName: string): void {
    this.data.tagName = tagName;
    this.composer.emit("element:updated", this);
    this.composer.markDirty();
  }

  setLocked(locked: boolean): void {
    this.data.locked = locked;
    this.composer.emit("element:updated", this);
    this.composer.markDirty();
  }

  // ============================================
  // Attributes → ElementStyles
  // ============================================

  getAttribute(name: string): string | undefined {
    return this._styles.getAttribute(name);
  }
  setAttribute(name: string, value: string): void {
    this._styles.setAttribute(name, value);
  }
  removeAttribute(name: string): void {
    this._styles.removeAttribute(name);
  }
  getAttributes(): Record<string, string> {
    return this._styles.getAttributes();
  }

  // ============================================
  // Classes → ElementStyles
  // ============================================

  addClass(className: string): void {
    this._styles.addClass(className);
  }
  removeClass(className: string): void {
    this._styles.removeClass(className);
  }
  hasClass(className: string): boolean {
    return this._styles.hasClass(className);
  }
  getClasses(): string[] {
    return this._styles.getClasses();
  }
  setClasses(classes: string[]): void {
    this._styles.setClasses(classes);
  }

  // ============================================
  // Styles → ElementStyles
  // ============================================

  getStyle(property: string): string | undefined {
    return this._styles.getStyle(property);
  }
  setStyle(property: string, value: string): void {
    this._styles.setStyle(property, value);
  }
  removeStyle(property: string): void {
    this._styles.removeStyle(property);
  }
  getStyles(): Record<string, string> {
    return this._styles.getStyles();
  }
  setStyles(styles: Record<string, string>): void {
    this._styles.setStyles(styles);
  }

  // ============================================
  // Traits → ElementStyles
  // ============================================

  getTrait(name: string): TraitData | undefined {
    return this._styles.getTrait(name);
  }
  setTrait(name: string, value: TraitValue): void {
    this._styles.setTrait(name, value);
  }
  getTraits(): TraitData[] {
    return this._styles.getTraits();
  }

  // ============================================
  // Children management (addChild/removeChild stay here; delegates call them)
  // ============================================

  addChild(child: Element, index?: number): void {
    this._children.addChild(child, index);
  }
  removeChild(child: Element): void {
    this._children.removeChild(child);
  }
  getChildIndex(child: Element): number {
    return this._children.getChildIndex(child);
  }
  getChildAt(index: number): Element | undefined {
    return this._children.getChildAt(index);
  }
  getChildCount(): number {
    return this._children.getChildCount();
  }

  // ============================================
  // Tree traversal → ElementChildren
  // ============================================

  getSiblings(): Element[] {
    return this._children.getSiblings();
  }
  getPath(): string[] {
    return this._children.getPath();
  }
  isDescendantOf(ancestor: Element): boolean {
    return this._children.isDescendantOf(ancestor);
  }
  moveTo(parent: Element, index?: number): void {
    this._children.moveTo(parent, index);
  }

  // ============================================
  // Element operations → ElementOperations
  // ============================================

  duplicate(): Element {
    return this._ops.duplicate();
  }
  wrap(tagName: string, attributes?: Record<string, string>): Element {
    return this._ops.wrap(tagName, attributes);
  }
  unwrap(): Element[] {
    return this._ops.unwrap();
  }
  replaceWith(element: Element): void {
    this._ops.replaceWith(element);
  }
  insertBefore(element: Element): void {
    this._ops.insertBefore(element);
  }
  insertAfter(element: Element): void {
    this._ops.insertAfter(element);
  }

  // ============================================
  // Animation → ElementOperations
  // ============================================

  getAnimation(): AnimationConfig | null {
    return this._ops.getAnimation();
  }
  setAnimation(config: AnimationConfig): void {
    this._ops.setAnimation(config);
  }
  clearAnimation(): void {
    this._ops.clearAnimation();
  }

  // ============================================
  // Interactions → ElementOperations
  // ============================================

  getInteractions(): unknown[] {
    return this._ops.getInteractions();
  }
  setInteractions(interactions: unknown[]): void {
    this._ops.setInteractions(interactions);
  }
  hasInteractions(): boolean {
    return this._ops.hasInteractions();
  }
  clearInteractions(): void {
    this._ops.clearInteractions();
  }

  // ============================================
  // Data Bindings → ElementOperations
  // ============================================

  setDataBinding(property: string, binding: DataBinding): void {
    this._ops.setDataBinding(property, binding);
  }
  getDataBinding(property: string): DataBinding | undefined {
    return this._ops.getDataBinding(property);
  }
  getDataBindings(): Record<string, DataBinding> {
    return this._ops.getDataBindings();
  }
  removeDataBinding(property: string): void {
    this._ops.removeDataBinding(property);
  }
  hasDataBindings(): boolean {
    return this._ops.hasDataBindings();
  }

  // ============================================
  // Custom Data (simple — stay in Element)
  // ============================================

  setData(key: string, value: unknown): void {
    if (!this.data.data) {
      this.data.data = {};
    }
    this.data.data[key] = value;
  }

  getCustomData(key: string): unknown {
    return this.data.data?.[key];
  }

  // ============================================
  // Properties (simple data reads — stay in Element)
  // ============================================

  isDraggable(): boolean {
    return this.data.draggable !== false;
  }
  isDroppable(): boolean {
    return this.data.droppable === true;
  }
  isResizable(): boolean {
    return this.data.resizable === true;
  }

  // ============================================
  // Capability queries → ElementSerialization
  // ============================================

  canHaveChildren(): boolean {
    return this._serial.canHaveChildren();
  }
  isContainer(): boolean {
    return this._serial.isContainer();
  }
  isVoid(): boolean {
    return this._serial.isVoid();
  }
  isLeaf(): boolean {
    return this._serial.isLeaf();
  }
  isLocked(): boolean {
    return this._serial.isLocked();
  }
  isComponentInstance(): boolean {
    return this._serial.isComponentInstance();
  }
  isRoot(): boolean {
    return this._serial.isRoot();
  }
  canBeWrapped(): boolean {
    return this._serial.canBeWrapped();
  }
  canBeUnwrapped(): boolean {
    return this._serial.canBeUnwrapped();
  }
  getElementCategory(): ElementCategory[] {
    return this._serial.getElementCategory();
  }

  // ============================================
  // Serialization → ElementSerialization
  // ============================================

  toJSON(): ElementData {
    return this._serial.toJSON();
  }
  toHTML(): string {
    return this._serial.toHTML();
  }

  // ============================================
  // Element Queries → ElementChildren
  // ============================================

  find(selector: string): Element[] {
    return this._children.find(selector);
  }
  findOne(selector: string): Element | null {
    return this._children.findOne(selector);
  }
  query(condition: (el: Element) => boolean): Element[] {
    return this._children.query(condition);
  }
  getDescendants(): Element[] {
    return this._children.getDescendants();
  }
  getAncestors(): Element[] {
    return this._children.getAncestors();
  }
}
