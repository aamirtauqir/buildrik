/**
 * useComponentList — the one place that loads this site's saved components
 * (masters in scope on the active page) and the workspace's shared component
 * library, and subscribes to the events that invalidate them.
 *
 * v3 FC-10: this replaced three separate "load saved components" effects —
 * BuildTab.tsx's own `allMine`/`library` pair, and useComponentsState.ts's
 * `components` load — each independently subscribing to the same
 * `COMPONENT_LIST_UPDATED`/`PAGE_CHANGED` events and re-deriving the same
 * page-scoped, `getAllComponents()`-backed list. ComponentsTab.tsx's own
 * `library` effect folds in too, reading it from useComponentsState instead
 * of fetching it a second time in the same mounted tree.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants";
import { inPageScope } from "@/engine/components/ComponentManager";
import type { ComponentDefinition } from "../../../../shared/types/components";
import { fetchComponentLibrary, type LibraryComponentEntry } from "@/services/componentSync";

export interface UseComponentListResult {
  /** Masters in scope on the active page (site-wide + "This page"), G2-118. */
  components: ComponentDefinition[];
  /** True once the first load has completed (success or error). */
  isLoaded: boolean;
  /** Set if `getAllComponents()` threw; the caller decides how to show it. */
  error: string | null;
  setError: (error: string | null) => void;
  /** The workspace's shared library entries (fetchComponentLibrary). */
  library: LibraryComponentEntry[];
}

export function useComponentList(composer: Composer | null): UseComponentListResult {
  const [components, setComponents] = React.useState<ComponentDefinition[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [library, setLibrary] = React.useState<LibraryComponentEntry[]>([]);

  React.useEffect(() => {
    if (!composer?.components) return;

    const loadComponents = () => {
      try {
        const pageId = composer.elements.getActivePage()?.id;
        setComponents((composer.components?.getAllComponents() ?? []).filter((c) => inPageScope(c, pageId)));
        setIsLoaded(true);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load components");
      }
    };
    const loadLibrary = () => void fetchComponentLibrary().then(setLibrary);

    loadComponents();
    loadLibrary();
    composer.on(EVENTS.COMPONENT_LIST_UPDATED, loadComponents);
    composer.on(EVENTS.COMPONENT_LIST_UPDATED, loadLibrary);
    composer.on(EVENTS.PAGE_CHANGED, loadComponents);
    return () => {
      composer.off(EVENTS.COMPONENT_LIST_UPDATED, loadComponents);
      composer.off(EVENTS.COMPONENT_LIST_UPDATED, loadLibrary);
      composer.off(EVENTS.PAGE_CHANGED, loadComponents);
    };
  }, [composer]);

  return { components, isLoaded, error, setError, library };
}
