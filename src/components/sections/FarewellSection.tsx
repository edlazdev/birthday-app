import React from "react";
import type { InvitationMetadata, InvitationTheme, FarewellConfig } from "@/types/invitation";

export interface FarewellSectionProps {
  data: FarewellConfig;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  isPreview?: boolean;
}

export default function FarewellSection({
  data,
  metadata,
  theme,
  isPreview = false,
}: FarewellSectionProps) {
  const message =
    data.message ||
    "TU PRESENCIA HARÁ DE ESTE DÍA ALGO ESPECIAL, ÚNICO E INOLVIDABLE";
  const signature = data.signature || "¡Te esperamos!";
  const primaryColor = theme.primary || "#a85d72";

  return (
    <footer className="event-farewell-section py-8 px-4 text-center select-none bg-white space-y-4 border-t border-stone-100">
      {/* 1. Mensaje de Despedida */}
      {message && (
        <p className="text-[11px] sm:text-xs font-serif tracking-[0.25em] uppercase text-stone-600 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
      )}

      {/* 2. Firma en Cursiva Caligráfica */}
      {signature && (
        <div
          className="text-4xl sm:text-5xl font-normal leading-tight drop-shadow-xs font-invitation-heading text-invitation-primary"
          style={{
            color: "var(--color-primary, var(--primary, #a85d72))",
            fontFamily: "var(--font-heading, var(--font-title, 'Great Vibes', cursive))",
          }}
        >
          {signature}
        </div>
      )}

      {/* 3. Pequeño detalle de cierre */}
      <div className="pt-2 text-[10px] text-stone-400 tracking-widest uppercase font-serif">
        ✨ {metadata.celebrant || "Celebración Especial"} ✨
      </div>
    </footer>
  );
}
