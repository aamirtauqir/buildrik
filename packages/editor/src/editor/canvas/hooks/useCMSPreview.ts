/**
 * useCMSPreview Hook
 * Resolves CMS bindings in canvas HTML for preview
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { devError } from "../../../shared/utils/devLogger";
import { EVENTS } from "@/shared/constants/events";
import { CURRENT_ITEM_ATTR, followsContextRecord, RepeaterRenderer, richtextKeys, writeBoundValue } from "@/engine/cms/RepeaterRenderer";
import { isSafeCmsBoundValue } from "@buildrik/shared/schemas/sites";

interface UseCMSPreviewOptions {
  composer: Composer | null;
  content: string;
}

interface UseCMSPreviewResult {
  resolvedContent: string;
  isResolving: boolean;
}

/**
 * Hook to resolve CMS bindings in canvas HTML
 */
export function useCMSPreview({ composer, content }: UseCMSPreviewOptions): UseCMSPreviewResult {
  const [resolvedContent, setResolvedContent] = React.useState(content);
  const [isResolving, setIsResolving] = React.useState(false);
  // Bumped on CMS content:updated/created so the resolve effect actually
  // re-runs (an identity setState bailed out and bindings went stale).
  const [revision, setRevision] = React.useState(0);

  React.useEffect(() => {
    const hasElementBindings = composer?.cms.bindings?.hasAny() ?? false;
    const hasCollectionBindings =
      (composer?.cms.bindings?.getAllCollectionBindings().length ?? 0) > 0;

    if (!content || !composer?.cms.bindings || (!hasElementBindings && !hasCollectionBindings)) {
      // D-7: no bindings and no collection-list repeaters — nothing to
      // resolve, so skip the DOMParser pass entirely instead of parsing and
      // re-serializing content that will come out byte-identical.
      setResolvedContent(content);
      setIsResolving(false);
      return;
    }

    // Guard against out-of-order async resolution: a stale run must not
    // overwrite a newer one's result.
    let cancelled = false;

    const resolveBindings = async () => {
      setIsResolving(true);

      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");

        /* Collection lists (G3-079) repeat their children per record before
           field bindings resolve over the copies. */
        await new RepeaterRenderer(composer).expandCollectionLists(doc, { canvas: true });

        // Find all elements with data-buildrick-id
        const elements = doc.querySelectorAll("[data-buildrick-id]");
        const resolvePromises: Promise<void>[] = [];

        elements.forEach((el) => {
          const elementId = el.getAttribute("data-buildrick-id");
          if (!elementId) return;

          // Get bindings for this element
          const bindings = composer.cms.bindings.getBindings(elementId);
          if (bindings.length === 0) return;

          // Resolve each binding — except those a Collection list copy
          // already filled from its own record (C0.8).
          const currentItemOf = el.getAttribute(CURRENT_ITEM_ATTR);
          // Bound is bound, resolved or not — the marker used to vanish on a
          // reload once the record stopped resolving (L3-016).
          el.setAttribute("data-cms-bound", "true");
          bindings.forEach((binding) => {
            if (followsContextRecord(binding) && currentItemOf === binding.collectionId) return;
            const promise = composer.cms.bindings.resolveBinding(binding).then((value) => {
              /* Rendered into the app origin (Canvas innerHTML): stored
                 property names and CMS entry values are data — only the
                 shared allowlist, and never a dangerous src/href URL. */
              if (value && !isSafeCmsBoundValue(binding.property, value)) return;
              /* Nothing resolved (record unpublished or deleted, empty field,
                 no fallback) is written as nothing, as the export does
                 (CMSExportResolver, BD-03). Keeping the stored text showed the
                 old record's copy on a canvas whose live site is empty (L3-016). */
              const rich = richtextKeys(composer.cms.collections?.getCollection?.(binding.collectionId)?.fields);
              writeBoundValue(el, binding.property, value, rich.has(binding.fieldSlug));
            });

            resolvePromises.push(promise);
          });
        });

        await Promise.all(resolvePromises);
        if (cancelled) return;
        setResolvedContent(doc.body.innerHTML);
      } catch (error) {
        // On error, use original content
        if (cancelled) return;
        devError("useCMSPreview", "Failed to resolve CMS bindings", error);
        setResolvedContent(content);
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    };

    resolveBindings();
    return () => {
      cancelled = true;
    };
  }, [content, composer, revision]);

  // Listen for CMS content changes
  React.useEffect(() => {
    if (!composer?.cms.collections) return;

    const handleContentChange = () => {
      // Bump revision → resolve effect re-runs and re-resolves bindings.
      setRevision((r) => r + 1);
    };

    composer.cms.collections.on("content:updated", handleContentChange);
    composer.cms.collections.on("content:created", handleContentChange);
    composer.cms.collections.on("content:deleted", handleContentChange);
    /* Publishing or unpublishing a record changes what resolves (only
       published records do) but emits neither updated nor deleted. */
    composer.cms.collections.on(EVENTS.CMS_CONTENT_PUBLISHED, handleContentChange);
    composer.cms.collections.on(EVENTS.CMS_CONTENT_UNPUBLISHED, handleContentChange);
    composer.cms.collections.on(EVENTS.CMS_STORE_REFRESHED, handleContentChange);
    /* Binding a Collection list changes what renders without changing the
       element HTML this hook is keyed on. */
    composer.on(EVENTS.CMS_COLLECTION_BOUND, handleContentChange);
    composer.on(EVENTS.CMS_COLLECTION_UNBOUND, handleContentChange);

    return () => {
      composer.cms.collections.off("content:updated", handleContentChange);
      composer.cms.collections.off("content:created", handleContentChange);
      composer.cms.collections.off("content:deleted", handleContentChange);
      composer.cms.collections.off(EVENTS.CMS_CONTENT_PUBLISHED, handleContentChange);
      composer.cms.collections.off(EVENTS.CMS_CONTENT_UNPUBLISHED, handleContentChange);
      composer.cms.collections.off(EVENTS.CMS_STORE_REFRESHED, handleContentChange);
      composer.off(EVENTS.CMS_COLLECTION_BOUND, handleContentChange);
      composer.off(EVENTS.CMS_COLLECTION_UNBOUND, handleContentChange);
    };
  }, [composer]);

  return {
    resolvedContent,
    isResolving,
  };
}

export default useCMSPreview;
