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
  ribbonUrl?: string;
  logoUrl?: string;
  showLogoSubtitle?: boolean;
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
  const logoUrl =
    data.logoUrl ||
    metadata.logoUrl ||
    (metadata as any).logo_url ||
    (metadata.features as any)?.logo_url ||
    (metadata.features as any)?.logoUrl ||
    "";
  const showLogoSubtitle =
    data.showLogoSubtitle === true ||
    metadata.showLogoSubtitle === true ||
    (metadata.features as any)?.show_logo_subtitle === true;

  const primaryColor = theme.primary || "#a85d72";
  const rawAspect =
    (data as any).heroAspectRatio ||
    (metadata as any).heroAspectRatio ||
    (metadata.features as any)?.hero_aspect_ratio ||
    "9/16";
  const aspectClass =
    rawAspect === "2/3" || rawAspect === "2:3" || rawAspect === "aspect-[2/3]"
      ? "aspect-[2/3]"
      : rawAspect === "3/4" || rawAspect === "3:4" || rawAspect === "aspect-[3/4]"
      ? "aspect-[3/4]"
      : rawAspect === "3/5" || rawAspect === "3:5" || rawAspect === "aspect-[3/5]"
      ? "aspect-[3/5]"
      : rawAspect === "1/2" || rawAspect === "1:2" || rawAspect === "aspect-[1/2]"
      ? "aspect-[1/2]"
      : "aspect-[9/16]";

  return (
    <section className="relative w-full overflow-hidden text-center select-none bg-stone-900">
      {/* 1. Imagen de Portada / Hero */}
      <div
        className={`relative w-full ${
          coverUrl ? aspectClass : "py-16 sm:py-24"
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

        {/* Textos de Bienvenida o Logo en cabecera */}
        <div className="relative z-10 px-4 pb-6 sm:pb-8 text-center text-white drop-shadow-md">
          {logoUrl ? (
            <div className="flex flex-col items-center justify-center max-w-[85%] sm:max-w-[75%] mx-auto mb-2">
              <img
                src={logoUrl}
                alt={celebrant || beforeCelebrant || "Logo"}
                className="max-h-16 sm:max-h-20 w-auto max-w-full object-contain object-top drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
                loading="eager"
              />
              {showLogoSubtitle && beforeCelebrant && (
                <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase font-semibold text-white/90 drop-shadow mt-1 font-serif">
                  {beforeCelebrant}
                </p>
              )}
            </div>
          ) : (
            <>
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
            </>
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
