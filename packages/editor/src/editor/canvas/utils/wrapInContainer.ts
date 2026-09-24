/**
 * The one wrap (G2-052, board 7052:78347 "Wrap in container").
 *
 * There were two: the selection toolbar's "Wrap in Container" called
 * `wrap("container")` — a TAG name, so it produced a `<container>` element —
 * and the context menu's "Wrap in section" wrapped in a `<section>`. Both now
 * wrap in a container (`<div>`), in one undo step, and select the wrapper.
 * A refusal says why instead of doing nothing.
 *
 * @license BSD-3-Clause
 */
import type { Composer, Element } from "@/engine";
import { runTransaction } from "@/shared/utils/helpers";

type Toast = (t: { description: string; tone?: "info" }) => void;

function refusal(element: Element): string | null {
  if (element.isRoot()) return "The page itself can't be wrapped.";
  if (element.isLocked()) return "This element is locked — unlock it to wrap it.";
  if (element.isComponentInstance()) return "Detach this component instance to wrap it.";
  return null;
}

export function wrapInContainer(composer: Composer, element: Element, addToast?: Toast): Element | null {
  const why = refusal(element);
  if (why) {
    addToast?.({ description: why, tone: "info" });
    return null;
  }
  let wrapper: Element | null = null;
  runTransaction(composer, "wrap-container", () => {
    wrapper = element.wrap("div");
    composer.selection.select(wrapper as never);
  });
  return wrapper;
}
