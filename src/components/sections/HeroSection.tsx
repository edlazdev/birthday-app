import React from "react";
import type { InvitationMetadata, InvitationTheme } from "@/types/invitation";

export interface HeroSectionData {
  celebrant?: string;
  beforeCelebrant?: string;
  title?: string;
  age?: string;
  afterAge?: string;
  tagline?: string;
  date?: string;
  time?: string;
  avatarUrl?: string;
  coverUrl?: string;
  showAvatar?: boolean;
  ribbonUrl?: string;
}

export interface HeroSectionProps {
  data: HeroSectionData;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  isPreview?: boolean;
}

export default function HeroSection({
  data,
  metadata,
  theme,
  isPreview = false,
}: HeroSectionProps) {
  const celebrant = data.celebrant || metadata.celebrant || "";
  const beforeCelebrant =
    data.beforeCelebrant ?? metadata.beforeCelebrant ?? "MIS XV AÑOS";
  const title = data.title || metadata.title || "Mis Quince Años";
  const coverUrl = data.coverUrl || metadata.coverUrl || "";
  const avatarUrl = data.avatarUrl || metadata.avatarUrl || "";
  const showAvatar = data.showAvatar !== false;
  const ribbonUrl =
    data.ribbonUrl ||
    (metadata as any).ribbonUrl ||
    "https://gztorcrslhjeyobbykzn.supabase.co/storage/v1/object/public/freeloader-media/events/luana/lazo_plateado.png";

  const primaryColor = theme.primary || "#a85d72";

  return (
    <section className="relative w-full overflow-hidden text-center select-none bg-stone-900">
      {/* 1. Imagen de Portada / Hero */}
      <div
        className={`relative w-full ${
          coverUrl ? "aspect-[3/4] sm:aspect-[2/3]" : "py-16 sm:py-24"
        } overflow-hidden flex flex-col justify-end bg-slate-900`}
      >
        {coverUrl && (
          <img
            src={coverUrl}
            alt={celebrant || "Portada"}
            className="absolute inset-0 w-full h-full object-cover object-top"
            loading="eager"
          />
        )}

        {/* Gradiente sutil para legibilidad de textos */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, transparent 50%, rgba(0,0,0,0.5) 85%, rgba(255,255,255,0.95) 100%)",
          }}
        />

        {/* Textos de Bienvenida en cabecera */}
        <div className="relative z-10 px-4 pb-6 sm:pb-8 text-center text-white drop-shadow-md">
          {beforeCelebrant && (
            <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase font-semibold text-white/90 drop-shadow mb-1 font-serif">
              {beforeCelebrant}
            </p>
          )}

          {celebrant && (
            <h1
              className="text-4xl sm:text-5xl md:text-6xl text-white font-normal leading-tight font-invitation-heading drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
              style={{
                fontFamily:
                  "var(--font-heading, var(--font-title, 'Great Vibes', cursive))",
              }}
            >
              {celebrant}
            </h1>
          )}

          {showAvatar && avatarUrl && (
            <div className="mt-4 flex justify-center">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 p-0.5 shadow-xl bg-white/20 backdrop-blur-xs border-invitation-primary"
                style={{ borderColor: "var(--color-primary, var(--primary, #a85d72))" }}
              >
                <img
                  src={avatarUrl}
                  alt={celebrant}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Lazo Divisor Ornamental Superior */}
      {ribbonUrl && (
        <div className="relative w-full flex items-center justify-center -mt-8 sm:-mt-10 mb-0 z-10 pointer-events-none select-none px-2">
          <img
            src={ribbonUrl}
            alt="Lazo plateado"
            className="w-full max-w-[420px] h-auto object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
            loading="eager"
          />
        </div>
      )}
    </section>
  );
}
