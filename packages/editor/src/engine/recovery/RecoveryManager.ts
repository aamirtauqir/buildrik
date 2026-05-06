/**
 * Recovery Manager
 * Validates and recovers from invalid editor states.
 *
 * Triggers recovery on:
 *   - `visibilitychange` (tab returns to visible after being hidden)
 *   - `error`             (uncaught runtime error on window)
 *   - `unhandledrejection` (uncaught promise rejection on window)
 *
 * On any caught error/rejection, also stamps a crash sentinel in
 * `sessionStorage` so the next bootstrap can offer the user a restore
 * prompt. Use `RecoveryManager.wasLastSessionCrashed()` from bootstrap
 * code to read the sentinel.
 *
 * @module engine/recovery/RecoveryManager
 * @license BSD-3-Clause
 */

import { devLog, devWarn, devError } from "../../shared/utils/devLogger";
import { EVENTS } from "../../shared/constants/events";
import { generateId } from "../../shared/utils/helpers";
import type { Composer } from "../Composer";
import type { ElementManagerContext } from "../elements/manager/types";

/** sessionStorage key holding the last detected crash record. */
const CRASH_SENTINEL_KEY = "buildrick:last-crash";

/** Crash record persisted across reloads to feed a restore prompt. */
export interface CrashRecord {
  at: number;
  source: "error" | "unhandledrejection";
  reason: string;
}

export class RecoveryManager {
  private composer: Composer;

  private onVisibilityChange?: () => void;
  private onWindowError?: (event: ErrorEvent) => void;
  private onUnhandledRejection?: (event: PromiseRejectionEvent) => void;

  constructor(composer: Composer) {
    this.composer = composer;
    this.setupRecoveryListeners();
  }

  /**
   * Set up recovery listeners for browser lifecycle + error events.
   * Listener refs are stashed on `this` so destroy() can remove them
   * cleanly — important for Composer hot-swap and tests.
   */
  private setupRecoveryListeners(): void {
    if (typeof document !== "undefined") {
      this.onVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          this.recoverFromInactivity();
        }
      };
      document.addEventListener("visibilitychange", this.onVisibilityChange);
    }

    if (typeof window !== "undefined") {
      this.onWindowError = (event: ErrorEvent) => {
        const reason = event.error?.message ?? event.message ?? "unknown error";
        this.handleRuntimeFault("error", reason);
      };
      window.addEventListener("error", this.onWindowError);

      this.onUnhandledRejection = (event: PromiseRejectionEvent) => {
        const reason =
          event.reason instanceof Error
            ? event.reason.message
            : String(event.reason ?? "unknown rejection");
        this.handleRuntimeFault("unhandledrejection", reason);
      };
      window.addEventListener("unhandledrejection", this.onUnhandledRejection);
    }
  }

  /**
   * Record a crash to sessionStorage and run recovery checks. Bootstrap code
   * can later call `RecoveryManager.wasLastSessionCrashed()` to drive a
   * restore-from-autosave prompt.
   */
  private handleRuntimeFault(
    source: CrashRecord["source"],
    reason: string,
  ): void {
    devError("Recovery", `Runtime fault (${source}):`, reason);

    try {
      if (typeof sessionStorage !== "undefined") {
        const record: CrashRecord = { at: Date.now(), source, reason };
        sessionStorage.setItem(CRASH_SENTINEL_KEY, JSON.stringify(record));
      }
    } catch {
      // sessionStorage may be unavailable (private mode / quota); swallow.
    }

    this.composer.emit(EVENTS.RUNTIME_FAULT_CAUGHT, { source, reason });
    this.recoverFromInactivity();
  }

  /**
   * Read (and clear) any crash sentinel from a prior session.
   * Returns null if there was no crash. Static so bootstrap code can call
   * it before the Composer (and thus a RecoveryManager instance) exists.
   */
  static consumeLastCrash(): CrashRecord | null {
    if (typeof sessionStorage === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(CRASH_SENTINEL_KEY);
      if (!raw) return null;
      sessionStorage.removeItem(CRASH_SENTINEL_KEY);
      return JSON.parse(raw) as CrashRecord;
    } catch {
      return null;
    }
  }

  /** Pure read — does NOT clear. */
  static wasLastSessionCrashed(): boolean {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(CRASH_SENTINEL_KEY) !== null;
  }

  /**
   * Verify and recover editor state after inactivity or a runtime fault.
   */
  private recoverFromInactivity(): void {
    try {
      devLog("Recovery", "Checking editor state...");

      // Check 1: Verify active page exists
      const activePage = this.composer.elements.getActivePage();
      if (!activePage) {
        devWarn("Recovery", "Active page missing, recovering...");
        const pages = this.composer.elements.getAllPages();
        if (pages.length > 0) {
          this.composer.elements.setActivePage(pages[0].id);
        } else {
          this.composer.elements.createPage("Home");
        }
      }

      // Check 2: Verify page root exists
      if (activePage) {
        this.ensurePageRootExists(activePage.id);
      }

      // Check 3: Verify selection is valid
      const selected = this.composer.selection.getSelected();
      if (selected && !this.composer.elements.getElement(selected.getId())) {
        devWarn("Recovery", "Invalid selection detected, clearing...");
        this.composer.selection.clear();
      }

      // Check 4: Force canvas re-sync
      this.composer.emit(EVENTS.CANVAS_FORCE_SYNC);

      devLog("Recovery", "State recovery complete");
    } catch (error) {
      devError("Recovery", "Recovery failed", error);
    }
  }

  /**
   * Ensure page has a valid root element
   */
  ensurePageRootExists(pageId: string): void {
    const page = this.composer.elements.getPage(pageId);
    if (!page) return;

    const rootElement = this.composer.elements.getElement(page.root.id);

    if (!rootElement) {
      devWarn("Recovery", `Page "${page.name}" root missing, recreating...`);

      const newRootData = {
        id: generateId("root"),
        type: "container" as const,
        tagName: "div" as const,
        classes: ["buildrick-page-root"],
        children: [],
        attributes: {},
        styles: {},
      };

      const context = this.composer.elements as unknown as {
        buildElementTree: ElementManagerContext["buildElementTree"];
      };
      context.buildElementTree(newRootData);

      page.root = newRootData;

      this.composer.emit(EVENTS.PAGE_RECOVERED, { page });
    }
  }

  /**
   * Validate all pages have valid root elements
   */
  validateAllPages(): boolean {
    const pages = this.composer.elements.getAllPages();
    let allValid = true;

    pages.forEach((page) => {
      const rootElement = this.composer.elements.getElement(page.root.id);
      if (!rootElement) {
        devError("Recovery", `Page "${page.name}" has invalid root`);
        allValid = false;
        this.ensurePageRootExists(page.id);
      }
    });

    return allValid;
  }

  /**
   * Validate selection references valid element
   */
  validateSelection(): boolean {
    const selected = this.composer.selection.getSelected();
    if (!selected) return true;

    const element = this.composer.elements.getElement(selected.getId());
    if (!element) {
      devWarn("Recovery", "Selection references invalid element, clearing");
      this.composer.selection.clear();
      return false;
    }

    return true;
  }

  /**
   * Destroy recovery manager — removes all listeners.
   */
  destroy(): void {
    if (typeof document !== "undefined" && this.onVisibilityChange) {
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
    }
    if (typeof window !== "undefined") {
      if (this.onWindowError) {
        window.removeEventListener("error", this.onWindowError);
      }
      if (this.onUnhandledRejection) {
        window.removeEventListener("unhandledrejection", this.onUnhandledRejection);
      }
    }
    this.onVisibilityChange = undefined;
    this.onWindowError = undefined;
    this.onUnhandledRejection = undefined;
  }
}
