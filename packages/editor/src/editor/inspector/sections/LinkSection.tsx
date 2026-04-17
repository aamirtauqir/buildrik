/**
 * LinkSection - Page/URL linking for interactive elements
 * Allows linking buttons/links to internal pages or external URLs
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
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
    color: "var(--ls-danger, #DC2626)",
    display: "flex",
    alignItems: "center",
    gap: 4,
  }}>
    <span aria-hidden>⚠</span> {message}
  </div>
);

const LINK_TYPE_OPTIONS = [
  { value: "none", label: "No Link" },
  { value: "page", label: "Page" },
  { value: "url", label: "External URL" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "anchor", label: "Anchor" },
];

const TARGET_OPTIONS = [
  { value: "_self", label: "Same Window" },
  { value: "_blank", label: "New Tab" },
];

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

  // Only show for link/button elements
  const isLinkable = ["link", "button", "a", "cta"].includes(selectedElement.type);

  // Load pages from composer
  React.useEffect(() => {
    if (!composer) return;

    const loadPages = () => {
      const allPages = composer.elements.getAllPages();
      setPages(allPages);
    };

    loadPages();
    composer.on(EVENTS.PROJECT_CHANGED, loadPages);
    return () => {
      composer.off(EVENTS.PROJECT_CHANGED, loadPages);
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

  const updateTarget = React.useCallback(
    (newTarget: string) => {
      if (!composer || !selectedElement?.id) return;

      const el = composer.elements.getElement(selectedElement.id);
      if (!el) return;

      composer.beginTransaction?.("link-target-change");
      try {
        if (newTarget && newTarget !== "_self") {
          el.setAttribute?.("target", newTarget);
          if (newTarget === "_blank") {
            el.setAttribute?.("rel", "noopener noreferrer");
          }
        } else {
          el.removeAttribute?.("target");
          el.removeAttribute?.("rel");
        }
      } finally {
        composer.endTransaction?.();
      }
      setTarget(newTarget);
    },
    [composer, selectedElement?.id]
  );

  const handleLinkTypeChange = (type: string) => {
    setLinkType(type as LinkType);

    // Clear href when switching to 'none'
    if (type === "none") {
      updateHref("");
    }
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
    updateHref(email ? `mailto:${email}` : "");
  };

  const handlePhoneChange = (phone: string) => {
    setPhoneNumber(phone);
    const valid = isPhoneNumber(phone);
    setPhoneError(!valid && phone.length > 0);
    updateHref(phone ? `tel:${phone}` : "");
  };

  const handleAnchorChange = (anchor: string) => {
    setAnchorId(anchor);
    const valid = anchor.length > 0 && !/\s/.test(anchor);
    setAnchorError(!valid && anchor.length > 0);
    updateHref(anchor ? `#${anchor}` : "");
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
    <Section title="Link Settings" icon="Link2" defaultOpen isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-link">
      <SelectRow
        label="Link Type"
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
  color: "#6c7086",
  lineHeight: 1.4,
};

export default LinkSection;
