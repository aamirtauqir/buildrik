/**
 * LinkSection — Behaviour › Link (boards 6, 7, 18): Link to None / Page / URL /
 * Email / Phone / Anchor, the destination, "Open in new tab", Rel, and the
 * hint "Changing Link to clears the old destination".
 *
 * Rel lives here and nowhere else (R-DD-9 took it out of Advanced). A type
 * change replaces the destination in one step (P-11a); New tab adds and takes
 * back only its own rel tokens, so an author's rel survives. Every write goes
 * through the lock gate (P-1).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { LINKABLE_TYPES } from "@/shared/constants/elementCapabilities";
import type { Composer, Element } from "@/engine";
import { EVENTS } from "@/shared/constants";
import type { PageData } from "@/shared/types";
import { Section, SelectRow, InputRow, type SectionTier } from "../shared/controls";
import { CommitRow, NoteRow } from "./behaviourRows";
import { CheckRow } from "../shared/controls/CheckRow";
import { isEmail, isPhoneNumber } from "@/shared/utils/helpers/validation";
import { writeElement } from "@/engine/commands/commandOperations";

export interface LinkSectionProps {
  selectedElement: {
    id: string;
    type: string;
  };
  composer?: Composer | null;
  /** Controlled open state for the section wrapper. */
  isOpen?: boolean;
  /** Called when the section header is toggled. */
  onToggle?: (open: boolean) => void;
  /** Visual weight tier — threaded from the registry-driven renderer. */
  tier?: SectionTier;
}

/** "example.com", "www.example.co.uk/menu" — a host with a TLD, no scheme. */
const BARE_DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(:\d+)?([/?#]\S*)?$/i;

type LinkType = "none" | "page" | "url" | "email" | "phone" | "anchor";

const ErrorText: React.FC<{ message: string }> = ({ message }) => (
  <p role="alert" className="tw:m-0 tw:pb-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-error-text)]">
    {message}
  </p>
);

/* Board 6's "Link to" list. "None" is the select's empty choice. */
const LINK_TYPE_OPTIONS = [
  { value: "page", label: "Page" },
  { value: "url", label: "URL" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "anchor", label: "Anchor" },
];

/** The rel tokens New Tab adds. Same Window takes back only these, so an
 *  author's own rel (nofollow, sponsored, …) survives the round trip. */
const TAB_REL = ["noopener", "noreferrer"];

export const LinkSection: React.FC<LinkSectionProps> = ({
  selectedElement,
  composer,
  isOpen,
  onToggle,
  tier = "secondary",
}) => {
  const [linkType, setLinkType] = React.useState<LinkType>("none");
  const [pages, setPages] = React.useState<PageData[]>([]);
  const [selectedPageId, setSelectedPageId] = React.useState("");
  const [externalUrl, setExternalUrl] = React.useState("");
  const [emailAddress, setEmailAddress] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [anchorId, setAnchorId] = React.useState("");
  const [target, setTarget] = React.useState("_self");
  const [urlError, setUrlError] = React.useState(false);
  const [emailError, setEmailError] = React.useState(false);
  const [phoneError, setPhoneError] = React.useState(false);
  const [anchorError, setAnchorError] = React.useState(false);

  const isLinkable = LINKABLE_TYPES.has(selectedElement.type);
  /* Rel is read off the element on render; an undo / redo re-renders it. */
  const [, refresh] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!composer) return;
    const onUpdate = (payload: unknown) => {
      const id = (payload as { getId?: () => string } | undefined)?.getId?.();
      if (!id || id === selectedElement.id) refresh();
    };
    composer.on(EVENTS.ELEMENT_UPDATED, onUpdate);
    return () => {
      composer.off(EVENTS.ELEMENT_UPDATED, onUpdate);
    };
  }, [composer, selectedElement.id]);

  // Load pages from composer
  React.useEffect(() => {
    if (!composer) return;

    const loadPages = () => {
      const allPages = composer.elements.getAllPages();
      setPages(allPages);
    };

    loadPages();
    composer.on(EVENTS.PROJECT_CHANGED, loadPages);
    // A project load replaces every page; PROJECT_LOADED is the only event it
    // emits, so the link dropdown kept offering the previous project's pages.
    composer.on(EVENTS.PROJECT_LOADED, loadPages);
    return () => {
      composer.off(EVENTS.PROJECT_CHANGED, loadPages);
      composer.off(EVENTS.PROJECT_LOADED, loadPages);
    };
  }, [composer]);

  // Load current href value
  React.useEffect(() => {
    if (!composer || !selectedElement?.id) return;

    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    const href = el.getAttribute?.("href") || "";
    const currentTarget = el.getAttribute?.("target") || "_self";
    setTarget(currentTarget);

    // Determine link type from href
    if (!href) {
      setLinkType("none");
    } else if (href.startsWith("#page:")) {
      setLinkType("page");
      setSelectedPageId(href.replace("#page:", ""));
    } else if (href.startsWith("mailto:")) {
      setLinkType("email");
      setEmailAddress(href.replace("mailto:", ""));
    } else if (href.startsWith("tel:")) {
      setLinkType("phone");
      setPhoneNumber(href.replace("tel:", ""));
    } else if (href.startsWith("#")) {
      setLinkType("anchor");
      setAnchorId(href.replace("#", ""));
    } else {
      setLinkType("url");
      setExternalUrl(href);
    }
  }, [composer, selectedElement?.id]);

  const updateHref = React.useCallback(
    (href: string) => {
      if (!composer || !selectedElement?.id) return;

      /* P-1: the lock gate — refused (and said) when the element is locked. */
      writeElement(composer, composer.elements.getElement(selectedElement.id), "link-change", (el) => {
        if (href) {
          el.setAttribute?.("href", href);
        } else {
          el.removeAttribute?.("href");
        }
      });
    },
    [composer, selectedElement?.id]
  );

  const writeTarget = (el: Element, newTarget: string) => {
    const own = (el.getAttribute?.("rel") || "").split(/\s+/).filter((t) => t && !TAB_REL.includes(t));
    const rel = newTarget === "_blank" ? [...own, ...TAB_REL] : own;
    if (newTarget === "_blank") el.setAttribute?.("target", newTarget);
    else el.removeAttribute?.("target");
    if (rel.length) el.setAttribute?.("rel", rel.join(" "));
    else el.removeAttribute?.("rel");
  };

  const updateTarget = (newTarget: string) => {
    if (!composer || !selectedElement?.id) return;
    /* P-1: the lock gate — refused (and said) when the element is locked. */
    const ran = writeElement(composer, composer.elements.getElement(selectedElement.id), "link-target-change", (el) =>
      writeTarget(el, newTarget)
    );
    if (ran) setTarget(newTarget);
  };

  /* A type change replaces the destination (P-11a): the old href goes unless
     the new type already holds a valid value here, and target/rel go when the
     new type cannot open in a tab (none, email, phone). One transaction. */
  const handleLinkTypeChange = (type: string) => {
    const el = selectedElement?.id ? composer?.elements.getElement(selectedElement.id) : null;
    if (!composer || !el) return;
    const href =
      type === "page" && selectedPageId ? `#page:${selectedPageId}`
      : type === "url" && /^https?:\/\//.test(externalUrl) ? externalUrl
      : type === "email" && isEmail(emailAddress) ? `mailto:${emailAddress}`
      : type === "phone" && isPhoneNumber(phoneNumber) ? `tel:${phoneNumber}`
      : type === "anchor" && anchorId && !/\s/.test(anchorId) ? `#${anchorId}`
      : "";
    const noTab = type === "none" || type === "email" || type === "phone";
    /* P-1: the lock gate — refused (and said) when the element is locked. */
    const ran = writeElement(composer, el, "link-change", (target) => {
      if (href) target.setAttribute?.("href", href);
      else target.removeAttribute?.("href");
      if (noTab) writeTarget(target, "_self");
    });
    /* The UI follows the write: a locked element keeps its displayed type. */
    if (!ran) return;
    setLinkType(type as LinkType);
    if (noTab) setTarget("_self");
  };

  const handlePageSelect = (pageId: string) => {
    setSelectedPageId(pageId);
    if (pageId) {
      updateHref(`#page:${pageId}`);
    } else {
      updateHref("");
    }
  };

  const handleUrlChange = (url: string) => {
    setExternalUrl(url);
    /* A bare domain ("example.com/menu") gets https:// rather than an error
       (L2-030) — the field keeps what was typed, the href is the full URL. */
    const href = BARE_DOMAIN.test(url) ? `https://${url}` : url;
    const valid = /^https?:\/\//.test(href);
    setUrlError(!valid && url.length > 0);
    if (valid || url.length === 0) {
      updateHref(href);
    }
  };

  const handleEmailChange = (email: string) => {
    setEmailAddress(email);
    const valid = isEmail(email);
    setEmailError(!valid && email.length > 0);
    if (valid || email.length === 0) {
      updateHref(email ? `mailto:${email}` : "");
    }
  };

  const handlePhoneChange = (phone: string) => {
    setPhoneNumber(phone);
    const valid = isPhoneNumber(phone);
    setPhoneError(!valid && phone.length > 0);
    if (valid || phone.length === 0) {
      updateHref(phone ? `tel:${phone}` : "");
    }
  };

  const handleAnchorChange = (anchor: string) => {
    setAnchorId(anchor);
    const valid = anchor.length > 0 && !/\s/.test(anchor);
    setAnchorError(!valid && anchor.length > 0);
    if (valid || anchor.length === 0) {
      updateHref(anchor ? `#${anchor}` : "");
    }
  };

  const updateRel = (rel: string) => {
    if (!composer || !selectedElement?.id) return;
    const next = rel.trim().split(/\s+/).filter(Boolean).join(" ");
    /* P-1: the lock gate. The Rel field is the one place rel is written by
       hand (R-DD-9 moved it here from Advanced). */
    writeElement(composer, composer.elements.getElement(selectedElement.id), "link-rel-change", (el) => {
      if (next) el.setAttribute?.("rel", next);
      else el.removeAttribute?.("rel");
    });
  };

  if (!isLinkable) return null;

  const rel = composer?.elements.getElement(selectedElement.id)?.getAttribute?.("rel") || "";
  const opensInTab = linkType === "page" || linkType === "url" || linkType === "anchor";
  const pageOptions = pages.map((page) => ({ value: page.id, label: page.name }));

  return (
    <Section title="Link" icon="Link2" defaultOpen isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-link">
      {/* Boards 6, 7: Link to · Page / URL · Open in new tab · Rel · hint.
          The select's empty choice IS "None". */}
      <SelectRow
        label="Link to"
        value={linkType === "none" ? "" : linkType}
        onChange={(v) => handleLinkTypeChange(v || "none")}
        options={LINK_TYPE_OPTIONS}
        placeholder="None"
      />

      {linkType === "page" && (
        <SelectRow label="Page" value={selectedPageId} onChange={handlePageSelect} options={pageOptions} placeholder="Choose a page…" />
      )}

      {linkType === "url" && (
        <>
          <InputRow label="URL" value={externalUrl} onChange={handleUrlChange} placeholder="https://example.com" />
          {urlError && <ErrorText message="URL must start with http:// or https://" />}
        </>
      )}

      {linkType === "email" && (
        <>
          <InputRow label="Email" value={emailAddress} onChange={handleEmailChange} placeholder="hello@example.com" />
          {emailError && <ErrorText message="Enter a valid email address" />}
        </>
      )}

      {linkType === "phone" && (
        <>
          <InputRow label="Phone" value={phoneNumber} onChange={handlePhoneChange} placeholder="+1234567890" />
          {phoneError && <ErrorText message="Enter a valid phone number" />}
        </>
      )}

      {linkType === "anchor" && (
        <>
          <InputRow label="Anchor ID" value={anchorId} onChange={handleAnchorChange} placeholder="section-id" />
          {anchorError && <ErrorText message="Anchor ID cannot contain spaces" />}
        </>
      )}

      {opensInTab && (
        <>
          <CheckRow
            label="Open in new tab"
            checked={target === "_blank"}
            onChange={(on) => updateTarget(on ? "_blank" : "_self")}
            testId="link-new-tab"
          />
          <CommitRow label="Rel" value={rel} onCommit={updateRel} placeholder="nofollow" testId="link-rel" />
        </>
      )}

      <NoteRow testId="link-hint">Changing Link to clears the old destination</NoteRow>
    </Section>
  );
};

export default LinkSection;
