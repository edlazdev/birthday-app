import React from "react";
import type { InvitationMetadata, InvitationTheme } from "@/types/invitation";

export interface PhotoImageSectionData {
  src?: string;
  alt?: string;
  caption?: string;
  aspectRatio?: "square" | "portrait" | "wide" | "auto";
  border?: boolean;
}

export interface PhotoImageSectionProps {
  data: PhotoImageSectionData;
  metadata: InvitationMetadata;
  theme: InvitationTheme;
  isPreview?: boolean;
}

export default function PhotoImageSection({
  data,
  metadata,
  theme,
  isPreview = false,
}: PhotoImageSectionProps) {
  const src = data.src;
  if (!src) return null;

  const alt = data.alt || metadata.celebrant || "Fotografía";
  const aspectRatio = data.aspectRatio || "portrait";
  const caption = data.caption;
  const border = data.border !== false;

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "wide"
      ? "aspect-[16/9]"
      : aspectRatio === "auto"
      ? ""
      : "aspect-[3/4]";

  return (
    <div className="quince-section-image-wrapper my-6 px-4 w-full flex flex-col items-center justify-center select-none">
      <div
        className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-lg bg-stone-100 ${aspectClass} ${
          border ? "border border-amber-900/10 dark:border-stone-700" : ""
        }`}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover select-none"
          loading="lazy"
        />
      </div>
      {caption && (
        <p className="text-xs text-stone-500 font-serif italic mt-2 text-center max-w-xs">
          {caption}
        </p>
      )}
    </div>
  );
}
