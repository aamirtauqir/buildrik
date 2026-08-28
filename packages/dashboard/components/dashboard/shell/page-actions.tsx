"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

/** The id the slot renders and the portal targets. One string, two files. */
const SLOT_ID = "page-header-actions";

/** Put this in a layout's `PageHeader actions` prop. It is an empty flex box
 *  until a page below fills it.
 *
 *  Why a portal and not context: the actions are a `ReactNode`, and a node in
 *  context state changes identity on every render of the page that provides it,
 *  so the provider re-renders the whole subtree in a loop. A DOM node is stable
 *  and `createPortal` needs no state of its own beyond "have I mounted". */
export function PageHeaderActionsSlot() {
  // flex-wrap, not just flex: PageHeader's own actions wrapper wraps on narrow
  // screens ("shrink-0 alone would hold it at max-content and push the page
  // sideways"), and this slot is now its sole child — without wrap here the
  // capability is lost one level down.
  return <div id={SLOT_ID} className="flex max-w-full flex-wrap items-center gap-2" />;
}

/** Render a settings sub-page's actions onto the layout's title row.
 *
 *  Before this, Team, Plans and Usage each drew their own right-aligned band
 *  UNDER the layout's header — the layout owns the `PageHeader` (D10.4), so a
 *  page had no way to reach its actions slot. Every other screen in the
 *  dashboard puts its actions on the title row, so those three read as a
 *  different kind of page.
 *
 *  Renders nothing on the server and on the first client pass, which costs
 *  nothing here: all three action rows already wait on a tRPC query (seat
 *  counts, plan, period) and so were client-only anyway. */
export function PageHeaderActions({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  // Keyed on pathname, not []: the node was captured once for the component's
  // life, so if the slot were ever unmounted or replaced while a consumer
  // stayed mounted, the portal would keep writing into a detached node and the
  // actions would vanish with no error. Re-resolving per route makes that
  // self-healing instead of silent.
  useEffect(() => {
    const el = document.getElementById(SLOT_ID);
    // Say something. A page whose layout does not render the slot loses its
    // actions with no error and a green suite — the "built surface with no
    // door" shape. The settings layout only renders the slot when
    // findSettingsSection() matches the path, so a new sub-page that is not in
    // SETTINGS_GROUPS silently drops its primary action.
    if (!el && process.env.NODE_ENV !== "production") {
      console.error(
        `[PageHeaderActions] no #${SLOT_ID} in the document — these actions render nowhere. ` +
          `The layout for this route must render <PageHeaderActionsSlot /> in PageHeader's actions prop.`,
      );
    }
    setSlot(el);
    return () => setSlot(null);
  }, [pathname]);

  return slot ? createPortal(children, slot) : null;
}
