/**
 * Aquibra Social Icons Block
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface SocialIconsProps {
  links: SocialLink[];
  size?: "sm" | "md" | "lg";
  variant?: "filled" | "outline" | "minimal";
  color?: string;
}

const platformIcons: Record<string, string> = {
  facebook: "📘",
  twitter: "🐦",
  instagram: "📷",
  linkedin: "💼",
  youtube: "▶️",
  tiktok: "🎵",
  pinterest: "📌",
  github: "🐙",
  dribbble: "🏀",
  behance: "🅱️",
};

const defaultLinks: SocialLink[] = [
  { platform: "facebook", url: "#" },
  { platform: "twitter", url: "#" },
  { platform: "instagram", url: "#" },
  { platform: "linkedin", url: "#" },
];

export const SocialIcons: React.FC<SocialIconsProps> = ({
  links = defaultLinks,
  size = "md",
  variant = "filled",
  color = "var(--aqb-primary, #00d4aa)",
}) => {
  const sizeMap = { sm: 32, md: 40, lg: 48 };
  const iconSize = sizeMap[size];

  return (
    <div className="aqb-social-icons" style={{ display: "flex", gap: 12 }}>
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={link.platform}
          style={{
            width: iconSize,
            height: iconSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: variant === "filled" ? color : "transparent",
            border: variant === "outline" ? `2px solid ${color}` : "none",
            color: variant === "filled" ? "#fff" : color,
            fontSize: iconSize * 0.5,
            textDecoration: "none",
            transition: "transform 0.2s ease",
          }}
        >
          {link.icon || platformIcons[link.platform.toLowerCase()] || "🔗"}
        </a>
      ))}
    </div>
  );
};

export const socialIconsBlockConfig = {
  id: "social-icons",
  label: "Social Icons",
  category: "Components",
  icon: "🔗",
  elementType: "social" as const,
  content:
    '<div class="aqb-social-icons" data-aqb-type="social-icons" style="display:flex;gap:12px;">' +
    '<a href="#" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--aqb-primary,#00d4aa);color:#fff;text-decoration:none;">📘</a>' +
    '<a href="#" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--aqb-primary,#00d4aa);color:#fff;text-decoration:none;">🐦</a>' +
    '<a href="#" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--aqb-primary,#00d4aa);color:#fff;text-decoration:none;">📷</a>' +
    '<a href="#" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--aqb-primary,#00d4aa);color:#fff;text-decoration:none;">💼</a>' +
    "</div>",
};

export default SocialIcons;
