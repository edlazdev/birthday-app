import React from "react";
import type { InvitationMetadata, InvitationTheme } from "@/types/invitation";

export interface LocationSectionData {
  title?: string;
  type?: "ceremony" | "reception" | "party" | "custom";
  icon?: "church" | "reception" | "rings" | "party" | "none";
  date?: string;
  time?: string;
  place?: string;
  address?: string;
  mapUrl?: string;
  showMap?: boolean;
  buttonText?: string;
}

export interface LocationSectionProps {
  data: LocationSectionData;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  isPreview?: boolean;
}

export default function LocationSection({
  data,
  metadata,
  theme,
  isPreview = false,
}: LocationSectionProps) {
  const type = data.type || "ceremony";
  const title =
    data.title ||
    (type === "ceremony"
      ? "Ceremonia Religiosa"
      : type === "reception"
      ? "Recepción & Fiesta"
      : "Ubicación del Evento");

  const date = data.date || metadata.date;
  const time = data.time || metadata.time;
  const place = data.place || "";
  const address = data.address || metadata.address || "";
  const showMap = data.showMap !== false;
  const buttonText = data.buttonText || "VER UBICACIÓN";

  // Enlace a Google Maps si no se especifica uno explícito
  const mapUrl =
    data.mapUrl ||
    (metadata.map
      ? `https://www.google.com/maps/search/?api=1&query=${metadata.map.lat},${metadata.map.lng}`
      : address
      ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
      : "");

  const primaryColor = theme.primary || "#a85d72";
  const icon = data.icon || (type === "reception" ? "reception" : "church");

  return (
    <section className="event-location-card py-6 px-4 text-center select-none bg-white space-y-3">
      {/* 1. Icono Superior */}
      {icon !== "none" && (
        <div
          className="w-12 h-12 mx-auto flex items-center justify-center transition-transform hover:scale-105 drop-shadow-xs"
          style={{ color: primaryColor }}
        >
          {icon === "church" ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-9 h-9"
            >
              <path d="M12 2v4M10 4h4" />
              <path d="m18 10-6-6-6 6" />
              <path d="M4 10v11h16V10" />
              <path d="M10 21v-5a2 2 0 0 1 4 0v5" />
            </svg>
          ) : icon === "reception" ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-9 h-9"
            >
              <path d="M8 22h8M12 11v11" />
              <path d="m19 3-7 8-7-8Z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-9 h-9"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          )}
        </div>
      )}

      {/* 2. Título de Sección */}
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

      {/* 3. Fecha y Hora */}
      {(date || time) && (
        <div className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-stone-700 font-serif">
          {date}
          {time && (
            <span className="block text-[11px] sm:text-xs text-stone-500 font-sans tracking-normal mt-0.5">
              {time}
            </span>
          )}
        </div>
      )}

      {/* 4. Lugar y Dirección */}
      {place && (
        <div className="text-sm sm:text-base font-bold text-stone-900 pt-1">
          {place}
        </div>
      )}

      {address && (
        <p className="text-xs sm:text-sm text-stone-600 max-w-xs mx-auto leading-relaxed whitespace-pre-line">
          {address}
        </p>
      )}

      {/* 5. Botón Ver Ubicación */}
      {showMap && mapUrl && (
        <div className="pt-2">
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (isPreview) {
                e.preventDefault();
                alert(`[Vista Previa] Abriría Google Maps: ${mapUrl}`);
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{buttonText}</span>
          </a>
        </div>
      )}
    </section>
  );
}
