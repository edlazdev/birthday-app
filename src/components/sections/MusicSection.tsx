import React, { useState } from "react";
import type { InvitationMetadata, InvitationTheme, MusicConfig } from "@/types/invitation";

export interface MusicSectionProps {
  data: MusicConfig;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  isPreview?: boolean;
}

export default function MusicSection({
  data,
  metadata,
  theme,
  isPreview = false,
}: MusicSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const songTitle = data.songTitle || "Música del Evento";
  const youtubeUrl = data.youtubeUrl || "";
  const primaryColor = theme.primary || "#a85d72";

  // Extraer ID de YouTube
  let youtubeId = "";
  if (youtubeUrl) {
    const match = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) youtubeId = match[1];
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <section className="event-music-section py-5 px-4 text-center select-none bg-white">
      <div className="music-player-card max-w-xs mx-auto p-4 rounded-3xl bg-stone-50 border border-stone-200/90 shadow-md text-center space-y-3">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-1">
          <span
            className="text-[10px] font-bold tracking-[0.25em] uppercase text-invitation-primary"
            style={{ color: "var(--color-primary, var(--primary, #a85d72))" }}
          >
            🎵 DALE PLAY
          </span>
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPlaying ? "bg-emerald-400" : "bg-stone-300"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isPlaying ? "bg-emerald-500" : "bg-stone-400"
              }`}
            />
          </span>
        </div>

        {/* Título de la Canción */}
        <div className="text-xs sm:text-sm font-bold text-stone-800 truncate px-2 font-body">
          {songTitle}
        </div>

        {/* Controles de Reproducción */}
        <div className="flex items-center justify-center gap-4 text-stone-600 text-lg">
          <button
            type="button"
            className="hover:text-stone-900 transition p-1 cursor-pointer"
            aria-label="Anterior"
          >
            ⏮
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-md font-bold text-base hover:scale-105 active:scale-95 transition cursor-pointer bg-invitation-primary"
            style={{ backgroundColor: "var(--color-primary, var(--primary, #a85d72))" }}
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          <button
            type="button"
            className="hover:text-stone-900 transition p-1 cursor-pointer"
            aria-label="Siguiente"
          >
            ⏭
          </button>
        </div>

        {/* Iframe oculto para reproducir audio de YouTube cuando está activo */}
        {isPlaying && youtubeId && (
          <div className="hidden">
            <iframe
              width="1"
              height="1"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&enablejsapi=1`}
              title="Música de fondo"
              allow="autoplay"
            />
          </div>
        )}
      </div>
    </section>
  );
}
