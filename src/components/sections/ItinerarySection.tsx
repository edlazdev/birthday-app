import React from "react";
import type { InvitationMetadata, InvitationTheme, ItineraryItem, ItineraryConfig } from "@/types/invitation";

export interface ItinerarySectionData {
  title?: string;
  subtitle?: string;
  items?: ItineraryItem[];
  config?: ItineraryConfig;
}

export interface ItinerarySectionProps {
  data: ItinerarySectionData;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  isPreview?: boolean;
}

export default function ItinerarySection({
  data,
  metadata,
  theme,
  isPreview = false,
}: ItinerarySectionProps) {
  const title = data.title || data.config?.title || "Itinerario";
  const subtitle =
    data.subtitle ||
    data.config?.subtitle ||
    "Cronograma de actividades especiales";
  const items = data.items || [];
  const primaryColor = theme.primary || "#a85d72";
  const secondaryColor = theme.secondary || "#c78596";

  if (!items || items.length === 0) return null;

  return (
    <section className="event-itinerary-section py-6 px-3 sm:px-5 text-center select-none bg-white">
      {/* 1. Título Caligráfico */}
      {title && (
        <h3
          className="text-3xl sm:text-4xl font-normal leading-tight drop-shadow-xs"
          style={{
            color: primaryColor,
            fontFamily: "var(--font-title, 'Great Vibes', cursive)",
          }}
        >
          {title}
        </h3>
      )}

      {subtitle && (
        <p className="text-xs sm:text-sm text-stone-500 font-serif tracking-wider uppercase mb-5 mt-1">
          {subtitle}
        </p>
      )}

      {/* 2. Tarjeta en Arco / Contenedor Estilizado */}
      <div
        className="rounded-t-[80px] rounded-b-3xl p-6 sm:p-8 text-white shadow-lg mx-auto max-w-sm"
        style={{
          background: `linear-gradient(180deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
        }}
      >
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-white/30">
          {items.map((item, index) => (
            <div
              key={index}
              className="relative flex items-start text-left gap-3.5 group"
            >
              {/* Icono / Emoji */}
              <div className="w-8 h-8 rounded-full bg-white text-stone-900 flex items-center justify-center text-sm font-bold shadow-md shrink-0 z-10">
                {item.icon || "✨"}
              </div>

              {/* Contenido: Hora, Título y Descripción */}
              <div className="min-w-0 flex-1 pt-0.5">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-amber-200 block">
                  {item.time}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-xs text-white/85 leading-relaxed mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
