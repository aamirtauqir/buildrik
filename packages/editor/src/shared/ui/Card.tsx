/**
 * Aquibra Card Component
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined" | "filled";
  padding?: "none" | "sm" | "md" | "lg";
  radius?: "none" | "sm" | "md" | "lg" | "full";
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right" | "between";
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  padding = "md",
  radius = "md",
  hoverable = false,
  clickable = false,
  onClick,
  className,
  style,
}) => {
  const paddingMap = { none: 0, sm: 8, md: 16, lg: 24 };
  const radiusMap = { none: 0, sm: 4, md: 8, lg: 16, full: 9999 };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: "var(--buildrick-bg-panel)",
      border: "1px solid var(--buildrick-border)",
    },
    elevated: {
      background: "var(--buildrick-bg-panel)",
      boxShadow: "var(--buildrick-shadow-lg)",
    },
    outlined: {
      background: "transparent",
      border: "1px solid var(--buildrick-border)",
    },
    filled: {
      background: "var(--buildrick-bg-panel-secondary)",
    },
  };

  return (
    <div
      className={`buildrick-card buildrick-card--${variant} ${className || ""}`}
      onClick={clickable ? onClick : undefined}
      style={{
        ...variantStyles[variant],
        padding: paddingMap[padding],
        borderRadius: radiusMap[radius],
        cursor: clickable ? "pointer" : "default",
        transition: "all 0.2s ease",
        ...(hoverable && {
          ":hover": {
            transform: "translateY(-2px)",
            boxShadow: "var(--buildrick-shadow-xl)",
          },
        }),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, action, className }) => (
  <div
    className={`buildrick-card-header ${className || ""}`}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    }}
  >
    <div style={{ fontWeight: 600, fontSize: 16 }}>{children}</div>
    {action && <div>{action}</div>}
  </div>
);

export const CardBody: React.FC<CardBodyProps> = ({ children, className }) => (
  <div className={`buildrick-card-body ${className || ""}`}>{children}</div>
);

export const CardFooter: React.FC<CardFooterProps> = ({ children, align = "right", className }) => {
  const alignMap = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
    between: "space-between",
  };

  return (
    <div
      className={`buildrick-card-footer ${className || ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: alignMap[align],
        marginTop: 16,
        paddingTop: 12,
        borderTop: "1px solid var(--buildrick-border)",
        gap: 8,
      }}
    >
      {children}
    </div>
  );
};

export default Card;
