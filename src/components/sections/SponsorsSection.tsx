import React from "react";
import type { InvitationMetadata, InvitationTheme, SponsorsConfig } from "@/types/invitation";

export interface SponsorsSectionData {
  config?: SponsorsConfig;
  sponsors?: {
    parents?: string[];
    godparents?: string[];
    groom?: string[];
    bride?: string[];
  };
  isWitnesses?: boolean;
  witnesses?: string[];
}

export interface SponsorsSectionProps {
  data: SponsorsSectionData;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  isPreview?: boolean;
}

export default function SponsorsSection({
  data,
  metadata,
  theme,
  isPreview = false,
}: SponsorsSectionProps) {
  const isWitnesses = data.isWitnesses === true;
  const primaryColor = theme.primary || "#a85d72";

  if (isWitnesses) {
    const witnesses = data.witnesses || [];
    if (witnesses.length === 0) return null;

    return (
      <section className="event-sponsors-section py-6 px-4 text-center select-none bg-white space-y-3">
        <h3
          className="text-3xl sm:text-4xl font-normal leading-tight drop-shadow-xs"
          style={{
            color: primaryColor,
            fontFamily: "var(--font-title, 'Great Vibes', cursive)",
          }}
        >
          Testigos de Honor
        </h3>
        <div className="space-y-1.5 max-w-xs mx-auto">
          {witnesses.map((w, idx) => (
            <p key={idx} className="text-xs sm:text-sm font-serif font-bold text-stone-800">
              {w}
            </p>
          ))}
        </div>
      </section>
    );
  }

  const config = data.config;
  const introText =
    config?.introText ||
    "ACOMPÁÑAME EN ESTE DÍA\nTAN ESPECIAL JUNTO A";
  const parentsLabel = config?.parentsLabel || "MIS PADRES:";
  const godparentsLabel = config?.godparentsLabel || "MIS PADRINOS:";

  const sponsorsObj = data.sponsors || {};
  const parents =
    sponsorsObj.parents ||
    sponsorsObj.bride ||
    [];
  const godparents =
    sponsorsObj.godparents ||
    sponsorsObj.groom ||
    [];

  if (parents.length === 0 && godparents.length === 0) return null;

  return (
    <section className="event-sponsors-section py-6 px-4 text-center select-none bg-white space-y-4">
      {/* 1. Texto de Introducción */}
      {introText && (
        <p className="text-[11px] sm:text-xs font-serif tracking-[0.25em] uppercase text-stone-500 max-w-xs mx-auto leading-relaxed whitespace-pre-line">
          {introText}
        </p>
      )}

      <div className="space-y-4 max-w-sm mx-auto">
        {/* Padres */}
        {parents.length > 0 && (
          <div className="space-y-1">
            <span
              className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase block font-serif"
              style={{ color: primaryColor }}
            >
              {parentsLabel}
            </span>
            {parents.map((p, idx) => (
              <p
                key={idx}
                className="text-xs sm:text-sm font-serif font-bold text-stone-800"
              >
                {p}
              </p>
            ))}
          </div>
        )}

        {/* Padrinos */}
        {godparents.length > 0 && (
          <div className="space-y-1 pt-1">
            <span
              className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase block font-serif"
              style={{ color: primaryColor }}
            >
              {godparentsLabel}
            </span>
            {godparents.map((g, idx) => (
              <p
                key={idx}
                className="text-xs sm:text-sm font-serif font-bold text-stone-800"
              >
                {g}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
