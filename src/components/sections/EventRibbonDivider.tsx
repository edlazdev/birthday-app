import React from "react";

export interface EventRibbonDividerProps {
  color?: string;
  lineColor?: string;
  bgColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Lazo divisor ornamental de gala con línea en degradado metálico plateado.
 * Idéntico al diseño de EventRibbonDivider.astro del commit 31371b6.
 */
export default function EventRibbonDivider({
  color = "#9fa6b0",
  lineColor = "#9fa6b0",
  bgColor = "#ffffff",
  size = "md",
  className = "",
}: EventRibbonDividerProps) {
  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  };

  const iconClass = iconSizes[size] || iconSizes.md;

  return (
    <div
      className={`event-ribbon-divider quince-ribbon-divider relative py-2 flex items-center justify-center my-1 select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Línea horizontal con degradado metálico */}
      <div
        className="h-[1.5px] w-full absolute top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, #c5cad1, ${lineColor}, #c5cad1, transparent)`,
        }}
      />

      {/* Moño / Lazo central ornamental */}
      <div
        className="relative z-10 px-3 flex items-center justify-center"
        style={{ backgroundColor: bgColor, color: color }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${iconClass} drop-shadow-xs`}
        >
          {/* Bucles superiores del lazo */}
          <path d="M12 12c-3-3-6-5-8-2s-1 6 2 6c3 0 5-2 6-4z" />
          <path d="M12 12c3-3 6-5 8-2s1 6-2 6c-3 0-5-2-6-4z" />
          {/* Cintas colgantes del lazo */}
          <path d="M11 14.5c-1 3-3 6-5 7 1-2 4-4 5-7z" />
          <path d="M13 14.5c1 3 3 6 5 7-1-2-4-4-5-7z" />
          {/* Nudo central */}
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </div>
    </div>
  );
}
