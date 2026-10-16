import React, { useState } from "react";
import type { InvitationMetadata, InvitationTheme } from "@/types/invitation";

export interface GallerySectionData {
  title?: string;
  albumUrls?: string[];
  albumCount?: number;
  middlePhotoUrl?: string;
  finalPhotoUrl?: string;
}

export interface GallerySectionProps {
  data: GallerySectionData;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  isPreview?: boolean;
}

export default function GallerySection({
  data,
  metadata,
  theme,
  isPreview = false,
}: GallerySectionProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const title = data.title || "Galería de Fotos";
  const albumUrls =
    data.albumUrls && data.albumUrls.length > 0
      ? data.albumUrls
      : metadata.albumUrls || [];

  const middlePhoto = data.middlePhotoUrl || metadata.middlePhotoUrl;
  const finalPhoto = data.finalPhotoUrl || metadata.finalPhotoUrl;

  const allPhotos = [...albumUrls];
  if (middlePhoto && !allPhotos.includes(middlePhoto)) allPhotos.unshift(middlePhoto);
  if (finalPhoto && !allPhotos.includes(finalPhoto)) allPhotos.push(finalPhoto);

  const primaryColor = theme.primary || "#a85d72";

  if (allPhotos.length === 0) return null;

  return (
    <section className="event-gallery-section py-8 px-4 text-center select-none bg-white">
      {/* 1. Título Cursivo */}
      {title && (
        <h3
          className="text-3xl sm:text-4xl font-normal leading-tight drop-shadow-xs mb-4 font-invitation-heading text-invitation-primary"
          style={{
            color: "var(--color-primary, var(--primary, #a85d72))",
            fontFamily: "var(--font-heading, var(--font-title, 'Great Vibes', cursive))",
          }}
        >
          {title}
        </h3>
      )}

      {/* 2. Cuadrícula de Fotos con Efecto Hover y Modal Lightbox */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-md mx-auto">
        {allPhotos.map((url, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedPhoto(url)}
            className="aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-xs cursor-pointer group relative hover:scale-[1.02] transition-transform duration-200"
          >
            <img
              src={url}
              alt={`Foto ${idx + 1}`}
              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-lg">
              🔍
            </div>
          </div>
        ))}
      </div>

      {/* Modal Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-lg w-full max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto}
              alt="Foto ampliada"
              className="w-full h-auto max-h-[80vh] object-contain mx-auto"
            />
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center text-base font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
