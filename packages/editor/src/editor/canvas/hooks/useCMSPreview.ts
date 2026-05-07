/**
 * useCMSPreview Hook
 * Resolves CMS bindings in canvas HTML for preview
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { devError } from "../../../shared/utils/devLogger";

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

  React.useEffect(() => {
    if (!content || !composer?.cms.bindings) {
      setResolvedContent(content);
      return;
    }

    const resolveBindings = async () => {
      setIsResolving(true);

      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");

        // Find all elements with data-buildrick-id
        const elements = doc.querySelectorAll("[data-buildrick-id]");
        const resolvePromises: Promise<void>[] = [];

        elements.forEach((el) => {
          const elementId = el.getAttribute("data-buildrick-id");
          if (!elementId) return;

          // Get bindings for this element
          const bindings = composer.cms.bindings.getBindings(elementId);
          if (bindings.length === 0) return;

          // Resolve each binding
          bindings.forEach((binding) => {
            const promise = composer.cms.bindings.resolveBinding(binding).then((value) => {
              if (!value) return;

              switch (binding.property) {
                case "content":
                  el.textContent = value;
                  break;
                case "src":
                  el.setAttribute("src", value);
                  break;
                case "href":
                  el.setAttribute("href", value);
                  break;
                case "alt":
                  el.setAttribute("alt", value);
                  break;
                case "title":
                  el.setAttribute("title", value);
                  break;
                default:
                  // Try setting as attribute
                  el.setAttribute(binding.property, value);
              }

              // Add visual indicator that this element has CMS binding
              el.setAttribute("data-cms-bound", "true");
            });

            resolvePromises.push(promise);
          });
        });

        await Promise.all(resolvePromises);
        setResolvedContent(doc.body.innerHTML);
      } catch (error) {
        // On error, use original content
        devError("useCMSPreview", "Failed to resolve CMS bindings", error);
        setResolvedContent(content);
      } finally {
        setIsResolving(false);
      }
    };

    resolveBindings();
  }, [content, composer]);

  // Listen for CMS content changes
  React.useEffect(() => {
    if (!composer?.cms.collections) return;

    const handleContentChange = () => {
      // Trigger re-resolution by updating content dependency
      setResolvedContent((prev) => prev); // Force re-run of above effect
    };

    composer.cms.collections.on("content:updated", handleContentChange);
    composer.cms.collections.on("content:created", handleContentChange);

    return () => {
      composer.cms.collections.off("content:updated", handleContentChange);
      composer.cms.collections.off("content:created", handleContentChange);
    };
  }, [composer]);

  return {
    resolvedContent,
    isResolving,
  };
}

export default useCMSPreview;
