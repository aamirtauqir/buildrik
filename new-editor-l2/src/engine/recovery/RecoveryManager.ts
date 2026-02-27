/**
 * Recovery Manager
 * Validates and recovers from invalid editor states
 *
 * @module engine/recovery/RecoveryManager
 * @license BSD-3-Clause
 */

import { devLog, devWarn, devError } from "../../shared/utils/devLogger";
import { generateId } from "../../shared/utils/helpers";
import type { Composer } from "../Composer";
import type { ElementManagerContext } from "../elements/manager/types";

export class RecoveryManager {
  private composer: Composer;

  constructor(composer: Composer) {
    this.composer = composer;
    this.setupRecoveryListeners();
  }

  /**
   * Set up recovery listeners for browser lifecycle events
   */
  private setupRecoveryListeners(): void {
    // Recover when tab becomes visible after being hidden
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.recoverFromInactivity();
        }
      });
    }
  }

  /**
   * Verify and recover editor state after inactivity
   */
  private recoverFromInactivity(): void {
    try {
      devLog("Recovery", "Checking editor state after inactivity...");

      // Check 1: Verify active page exists
      const activePage = this.composer.elements.getActivePage();
      if (!activePage) {
        devWarn("Recovery", "Active page missing, recovering...");
        const pages = this.composer.elements.getAllPages();
        if (pages.length > 0) {
          this.composer.elements.setActivePage(pages[0].id);
        } else {
          // Create a default page if none exist
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
      this.composer.emit("canvas:force-sync");

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

      // Recreate root element
      const newRootData = {
        id: generateId("root"),
        type: "container" as const,
        tagName: "div" as const,
        classes: ["aqb-page-root"],
        children: [],
        attributes: {},
        styles: {},
      };

      // Rebuild element tree - accessing internal context for recovery purposes
      const context = this.composer.elements as unknown as {
        buildElementTree: ElementManagerContext["buildElementTree"];
      };
      context.buildElementTree(newRootData);

      // Update page reference
      page.root = newRootData;

      this.composer.emit("page:recovered", { page });
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
   * Destroy recovery manager
   */
  destroy(): void {
    // Event listeners will be cleaned up by browser
  }
}
