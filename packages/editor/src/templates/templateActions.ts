import type { Composer } from "../engine";
import type { Template } from "./TemplateLibrary";

export function applyTemplate(composer: Composer, template: Template): void {
  composer.beginTransaction("apply-template");
  try {
    composer.elements.importHTMLToActivePage(template.html || "");
  } finally {
    composer.endTransaction();
  }
}
