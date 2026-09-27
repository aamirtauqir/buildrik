/**
 * LinkSection - Page/URL linking for interactive elements
 * Allows linking buttons/links to internal pages or external URLs
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer, Element } from "../../../engine";
import { EVENTS } from "../../../shared/constants";
import type { PageData } from "../../../shared/types";
import { Section, SelectRow, InputRow, type SectionTier } from "../shared/controls";
import { isUrl, isEmail, isPhoneNumber } from "../../../shared/utils/helpers/validation";

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

type LinkType = "none" | "page" | "url" | "email" | "phone" | "anchor";

const ErrorText: React.FC<{ message: string }> = ({ message }) => (
  <div style={{
    marginTop: 4,
    fontSize: 11,
    color: "var(--bk-error, var(--bk-error))",
    display: "flex",
    alignItems: "center",
    gap: 4,
  }}>
    <span aria-hidden>⚠</span> {message}
  </div>
);

const LINK_TYPE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "page", label: "Page" },
  { value: "url", label: "External URL" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "anchor", label: "Anchor" },
];

/** The rel tokens New Tab adds. Same Window takes back only these, so an
 *  author's own rel (nofollow, sponsored, …) survives the round trip. */
const TAB_REL = ["noopener", "noreferrer"];

const TARGET_OPTIONS = [
  { value: "_self", label: "Same Window" },
  { value: "_blank", label: "New Tab" },
];

/**
 * Element types the Link section edits. Containers joined 2026-09-24 (board
 * 4428:141642 draws LINK on a Section): export wraps a linked container in a
 * box-less <a> and drops the link when the container holds its own
 * interactive content (ExportHelpers.blockLinkPlan).
 */
export const LINKABLE_TYPES: ReadonlySet<string> = new Set([
  "link", "button", "a", "cta",
  "container", "section", "card",
]);

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

      const el = composer.elements.getElement(selectedElement.id);
      if (!el) return;

      composer.beginTransaction?.("link-change");
      try {
        if (href) {
          el.setAttribute?.("href", href);
        } else {
          el.removeAttribute?.("href");
        }
      } finally {
        composer.endTransaction?.();
      }
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
    const el = selectedElement?.id ? composer?.elements.getElement(selectedElement.id) : null;
    if (!composer || !el) return;
    composer.beginTransaction?.("link-target-change");
    try {
      writeTarget(el, newTarget);
    } finally {
      composer.endTransaction?.();
    }
    setTarget(newTarget);
  };

  /* A type change replaces the destination (P-11a): the old href goes unless
     the new type already holds a valid value here, and target/rel go when the
     new type cannot open in a tab (none, email, phone). One transaction. */
  const handleLinkTypeChange = (type: string) => {
    setLinkType(type as LinkType);
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
    composer.beginTransaction?.("link-change");
    try {
      if (href) el.setAttribute?.("href", href);
      else el.removeAttribute?.("href");
      if (noTab) writeTarget(el, "_self");
    } finally {
      composer.endTransaction?.();
    }
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
    const valid = new RegExp("^https?://").test(url);
    setUrlError(!valid && url.length > 0);
    if (valid || url.length === 0) {
      updateHref(url);
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

  if (!isLinkable) return null;

  const pageOptions = [
    { value: "", label: "Select a page..." },
    ...pages.map((page) => ({
      value: page.id,
      label: `${page.isHome ? "🏠 " : ""}${page.name}`,
    })),
  ];

  return (
    <Section title="Link" icon="Link2" defaultOpen isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-link">
      {/* Board 4428:141642: "Link  [None ▾]". */}
      <SelectRow
        label="Link"
        value={linkType}
        onChange={handleLinkTypeChange}
        options={LINK_TYPE_OPTIONS}
      />

      {linkType === "page" && (
        <SelectRow
          label="Target Page"
          value={selectedPageId}
          onChange={handlePageSelect}
          options={pageOptions}
        />
      )}

      {linkType === "url" && (
        <div>
          <InputRow
            label="URL"
            value={externalUrl}
            onChange={handleUrlChange}
            placeholder="https://example.com"
          />
          {urlError && <ErrorText message="URL must start with http:// or https://" />}
        </div>
      )}

      {linkType === "email" && (
        <div>
          <InputRow
            label="Email"
            value={emailAddress}
            onChange={handleEmailChange}
            placeholder="hello@example.com"
          />
          {emailError && <ErrorText message="Enter a valid email address" />}
        </div>
      )}

      {linkType === "phone" && (
        <div>
          <InputRow
            label="Phone"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="+1234567890"
          />
          {phoneError && <ErrorText message="Enter a valid phone number" />}
        </div>
      )}

      {linkType === "anchor" && (
        <div>
          <InputRow
            label="Anchor ID"
            value={anchorId}
            onChange={handleAnchorChange}
            placeholder="section-id"
          />
          {anchorError && <ErrorText message="Anchor ID cannot contain spaces" />}
        </div>
      )}

      {linkType !== "none" && linkType !== "email" && linkType !== "phone" && (
        <SelectRow
          label="Open In"
          value={target}
          onChange={updateTarget}
          options={TARGET_OPTIONS}
        />
      )}

      {linkType === "page" && selectedPageId && (
        <div style={hintStyles}>
          Links to internal page. Will navigate when clicked in preview mode.
        </div>
      )}
    </Section>
  );
};

const hintStyles: React.CSSProperties = {
  marginTop: 8,
  padding: "8px 12px",
  background: "rgba(0, 115, 230, 0.1)",
  borderRadius: 6,
  fontSize: 12,
  color: "var(--bk-ink-muted)",
  lineHeight: 1.4,
};

export default LinkSection;
