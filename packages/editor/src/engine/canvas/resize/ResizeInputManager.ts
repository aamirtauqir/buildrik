/**
 * ResizeInputManager - Handles mouse, touch, and keyboard inputs for resize operations
 * @module engine/canvas/resize/ResizeInputManager
 * @license BSD-3-Clause
 */

import { EventEmitter } from "@/engine/EventEmitter";

export interface InputModifiers {
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
}

export interface InputCallbacks {
  onMove: (clientX: number, clientY: number) => void;
  onEnd: (clientX: number, clientY: number) => void;
  onCancel: () => void;
  onModifierChange: (modifiers: InputModifiers) => void;
}

export class ResizeInputManager extends EventEmitter {
  private callbacks: InputCallbacks;
  private modifiers: InputModifiers = {
    shift: false,
    alt: false,
    ctrl: false,
    meta: false,
  };

  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;
  private boundBlur: () => void;

  constructor(callbacks: InputCallbacks) {
    super();
    this.callbacks = callbacks;

    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
    this.boundBlur = this.handleBlur.bind(this);
  }

  attach(): void {
    document.addEventListener("mousemove", this.boundMouseMove, { passive: true });
    document.addEventListener("mouseup", this.boundMouseUp);
    document.addEventListener("keydown", this.boundKeyDown);
    document.addEventListener("keyup", this.boundKeyUp);
    document.addEventListener("touchmove", this.boundTouchMove, { passive: false });
    document.addEventListener("touchend", this.boundTouchEnd);
    document.addEventListener("touchcancel", this.boundTouchEnd);
    window.addEventListener("blur", this.boundBlur);
  }

  detach(): void {
    document.removeEventListener("mousemove", this.boundMouseMove);
    document.removeEventListener("mouseup", this.boundMouseUp);
    document.removeEventListener("keydown", this.boundKeyDown);
    document.removeEventListener("keyup", this.boundKeyUp);
    document.removeEventListener("touchmove", this.boundTouchMove);
    document.removeEventListener("touchend", this.boundTouchEnd);
    document.removeEventListener("touchcancel", this.boundTouchEnd);
    window.removeEventListener("blur", this.boundBlur);
  }

  getModifiers(): InputModifiers {
    return { ...this.modifiers };
  }

  private handleMouseMove(e: MouseEvent): void {
    /* The button came up where no mouseup reached us (outside the window, an
       iframe, a dialog): the drag is over. Left open, it held its transaction
       — and so autosave — until the next press (E2 / D3). */
    if (e.buttons === 0) {
      this.callbacks.onEnd(e.clientX, e.clientY);
      return;
    }
    this.callbacks.onMove(e.clientX, e.clientY);
  }

  /* Focus left the window mid-gesture (alt-tab, a native dialog): cancel. */
  private handleBlur(): void {
    this.callbacks.onCancel();
  }

  private handleMouseUp(e: MouseEvent): void {
    this.callbacks.onEnd(e.clientX, e.clientY);
  }

  private handleTouchMove(e: TouchEvent): void {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    this.callbacks.onMove(touch.clientX, touch.clientY);
    e.preventDefault();
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      this.callbacks.onEnd(touch.clientX, touch.clientY);
    } else {
      this.callbacks.onCancel();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      this.callbacks.onCancel();
      return;
    }
    this.updateModifiers(e, true);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.updateModifiers(e, false);
  }

  private updateModifiers(e: KeyboardEvent, isDown: boolean): void {
    const prev = { ...this.modifiers };

    if (e.key === "Shift") this.modifiers.shift = isDown;
    else if (e.key === "Alt") this.modifiers.alt = isDown;
    else if (e.key === "Control") this.modifiers.ctrl = isDown;
    else if (e.key === "Meta") this.modifiers.meta = isDown;

    if (
      prev.shift !== this.modifiers.shift ||
      prev.alt !== this.modifiers.alt ||
      prev.ctrl !== this.modifiers.ctrl ||
      prev.meta !== this.modifiers.meta
    ) {
      this.callbacks.onModifierChange(this.getModifiers());
    }
  }
}
