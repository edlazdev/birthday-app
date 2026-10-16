import React from "react";
import type { InvitationMetadata, InvitationTheme } from "@/types/invitation";

export interface CrestSectionData {
  tagline?: string;
  monogramText?: string;
  badgeText?: string;
  crestFrameUrl?: string;
}

export interface CrestSectionProps {
  data: CrestSectionData;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  isPreview?: boolean;
}

export default function CrestSection({
  data,
  metadata,
  theme,
  isPreview = false,
}: CrestSectionProps) {
  const celebrant = metadata.celebrant || "";
  const tagline = data.tagline ?? metadata.tagline;
  const age = metadata.age?.trim() || "";
  const monogramText =
    data.monogramText ||
    (age === "15" ? "XV" : age || "XV");
  const badgeText = data.badgeText || metadata.title || "QUINCEAÑERA";
  const crestFrameUrl =
    data.crestFrameUrl ||
    (metadata as any).crestUrl ||
    "https://gztorcrslhjeyobbykzn.supabase.co/storage/v1/object/public/freeloader-media/events/luana/marco_flores.jpg";

  const primaryColor = theme.primary || "#a85d72";

  return (
    <section className="event-crest-section px-4 sm:px-6 py-6 text-center select-none space-y-4 bg-white">
      {/* 1. Pensamiento / Dedicatoria Emotiva */}
      {tagline && (
        <p
          className="text-xs sm:text-sm italic max-w-xs sm:max-w-sm mx-auto leading-relaxed text-stone-700 px-2"
          style={{
            fontFamily: "var(--font-quote, 'Cormorant Garamond', 'Cinzel', serif)",
          }}
        >
          &ldquo;{tagline}&rdquo;
        </p>
      )}

      {/* 2. Nombre Caligráfico / Título Central */}
      {celebrant && (
        <h2
          className="text-4xl sm:text-5xl font-normal leading-tight drop-shadow-xs"
          style={{
            color: primaryColor,
            fontFamily: "var(--font-title, 'Great Vibes', cursive)",
          }}
        >
          {celebrant}
        </h2>
      )}

      {/* 3. Escudo Ornamental con Tiara y Marco Floral */}
      <div className="relative w-44 h-44 sm:w-48 sm:h-48 mx-auto flex items-center justify-center my-2">
        {/* Marco Floral de Fondo */}
        {crestFrameUrl && (
          <img
            src={crestFrameUrl}
            alt="Marco floral"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-xs"
            loading="lazy"
          />
        )}

        {/* Monograma Central con Corona */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center -mt-1">
          <span className="text-2xl sm:text-3xl block leading-none mb-1">
            👑
          </span>
          <span
            className="text-3xl sm:text-4xl font-extrabold tracking-wider leading-none font-serif drop-shadow-xs"
            style={{ color: primaryColor }}
          >
            {monogramText}
          </span>
        </div>
      </div>

      {/* 4. Badge / Letras Romanas Mayúsculas */}
      {badgeText && (
        <div
          className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase select-none font-serif"
          style={{ color: "#374151" }}
        >
          {badgeText}
        </div>
      )}
    </section>
  );
}
