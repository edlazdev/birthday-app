import React from "react";
import type { InvitationMetadata, InvitationTheme, DressCodeConfig } from "@/types/invitation";

export interface DressCodeSectionProps {
  data: DressCodeConfig;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  isPreview?: boolean;
}

export default function DressCodeSection({
  data,
  metadata,
  theme,
  isPreview = false,
}: DressCodeSectionProps) {
  const title = data.title || "Código de vestimenta";
  const category = data.category || "FORMAL";
  const message = data.message || "";
  const showColors = data.showColors !== false;
  const reservedColors = data.reservedColors || [];
  const primaryColor = theme.primary || "#a85d72";

  return (
    <section className="event-dress-code-section text-center select-none py-6 px-4 bg-white space-y-3">
      {/* 1. Título Cursivo */}
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

      {/* 2. Categoría en mayúsculas espaciadas */}
      {category && (
        <div className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-stone-800 font-serif">
          {category}
        </div>
      )}

      {/* 3. Mensaje */}
      {message && (
        <p className="text-xs sm:text-sm text-stone-600 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
      )}

      {/* 4. Colores Reservados o Sugeridos */}
      {showColors && reservedColors.length > 0 && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {reservedColors.map((col, idx) => (
            <div key={idx} className="flex flex-col items-center group">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-110"
                style={{ backgroundColor: col.hex }}
              />
              <span className="text-[10px] sm:text-xs font-semibold text-stone-600 mt-1">
                {col.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
